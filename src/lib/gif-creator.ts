/**
 * Modern GIF Creator with Canvas-based Preview
 * Provides instant animated preview and efficient GIF generation
 */

import type {
  GifCreatorError,
  GifCreatorInput,
  GifCreatorOutput,
  GifFrame,
  GifGenerationProgress,
  GifValidationResult,
} from '@/types/gif-creator';

export class GifCreator {
  private static currentPreviewUrl: string | null = null;

  /**
   * Validate input frames and options
   */
  static validate(input: GifCreatorInput): GifValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate frames
    if (input.frames.length === 0) {
      errors.push('At least one frame is required');
    } else {
      if (input.frames.length > 100) {
        warnings.push(
          'More than 100 frames may result in very large GIF files',
        );
      }

      // Validate each frame
      input.frames.forEach((frame, index) => {
        // Note: frame.file is always present in our implementation

        if (frame.duration < 10) {
          warnings.push(
            `Frame ${index + 1} has very short duration (${frame.duration}ms)`,
          );
        }

        if (frame.duration > 5000) {
          warnings.push(
            `Frame ${index + 1} has very long duration (${frame.duration}ms)`,
          );
        }
      });
    }

    // Validate options
    if (input.options.width < 1 || input.options.width > 2000) {
      errors.push('Width must be between 1 and 2000 pixels');
    }

    if (input.options.height < 1 || input.options.height > 2000) {
      errors.push('Height must be between 1 and 2000 pixels');
    }

    if (input.options.totalDuration < 0.1 || input.options.totalDuration > 60) {
      errors.push('Total duration must be between 0.1 and 60 seconds');
    }

    if (input.options.fps < 1 || input.options.fps > 60) {
      warnings.push(
        'FPS should be between 1 and 60 for optimal frame density reference',
      );
    }

    // Calculate GIF complexity warning
    const totalFrames = input.frames.length;
    const totalPixels =
      input.options.width * input.options.height * totalFrames;

    if (totalPixels > 50_000_000) {
      warnings.push('Large GIF size may cause performance issues');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      frameResults: new Map(), // Simple validation for now
    };
  }

  /**
   * Start instant preview by generating actual GIF and displaying it
   */
  static async startPreview(
    imgElement: HTMLImageElement,
    frames: GifFrame[],
    options: {
      width: number;
      height: number;
      fps: number;
      maintainAspectRatio: boolean;
    },
  ): Promise<void> {
    GifCreator.stopPreview();

    try {
      // Generate actual GIF using same method as download
      const gifResult = await GifCreator.createGif({
        frames,
        options: {
          ...options,
          totalDuration:
            frames.reduce((sum, frame) => sum + frame.duration, 0) / 1000,
          maintainAspectRatio: options.maintainAspectRatio,
          repeat: 0, // Infinite loop for preview
          backgroundColor: '#ffffff',
        },
      });

      if ('error' in gifResult) {
        console.error('Preview GIF generation failed:', gifResult.error);
        return;
      }

      // Convert GIF result to blob and create object URL
      const gifBlob = (gifResult as GifCreatorOutput).result;
      const gifUrl = URL.createObjectURL(gifBlob);

      // Store URL for cleanup
      GifCreator.currentPreviewUrl = gifUrl;

      // Display animated GIF directly in img element
      imgElement.src = gifUrl;
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  }

  /**
   * Stop preview (cleanup any resources)
   */
  static stopPreview(): void {
    // Clean up any preview URL
    if (GifCreator.currentPreviewUrl) {
      URL.revokeObjectURL(GifCreator.currentPreviewUrl);
      GifCreator.currentPreviewUrl = null;
    }
  }

  /**
   * Create GIF from frames using gif-encoder-2
   */
  static async createGif(
    input: GifCreatorInput,
    onProgress?: (progress: GifGenerationProgress) => void,
  ): Promise<GifCreatorOutput | GifCreatorError> {
    try {
      // Validate input
      const validation = GifCreator.validate(input);
      if (!validation.valid) {
        return {
          message: validation.errors.join('; '),
          code: 'VALIDATION_ERROR',
          details: validation,
        };
      }

      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing GIF creation...',
        totalFrames: input.frames.length,
      });

      // Dynamically import gif-encoder-2 for client-side usage
      console.log('Importing gif-encoder-2...');
      const { default: GIFEncoder } = await import('gif-encoder-2');
      console.log('gif-encoder-2 imported successfully');

      // Create encoder
      const encoder = new GIFEncoder(input.options.width, input.options.height);

      // Calculate frame delay from total duration
      const totalFrames = input.frames.length;
      const averageFrameDelay = Math.round(
        (input.options.totalDuration * 1000) / totalFrames,
      );

      // Configure encoder
      encoder.setRepeat(input.options.repeat);
      encoder.setDelay(averageFrameDelay); // Average delay between frames
      encoder.setQuality(10); // Fixed good quality
      encoder.start();

      console.log('GIF encoder started with settings:', {
        size: `${input.options.width}x${input.options.height}`,
        totalDuration: input.options.totalDuration,
        frameDelay: averageFrameDelay,
        frames: totalFrames,
        repeat: input.options.repeat,
      });

      // Track total original size for compression ratio
      const totalOriginalSize = input.frames.reduce(
        (sum, frame) => sum + frame.size,
        0,
      );

      // Process frames
      for (let i = 0; i < totalFrames; i++) {
        const frame = input.frames[i];
        if (!frame) {
          throw new Error(`Frame ${i + 1} is undefined`);
        }

        onProgress?.({
          stage: 'processing',
          progress: Math.round((i / totalFrames) * 80), // 80% for processing
          message: `Processing frame ${i + 1} of ${totalFrames}...`,
          totalFrames,
        });

        // Load image
        console.log(`Loading frame ${i + 1}/${totalFrames}: ${frame.name}`);
        // eslint-disable-next-line no-await-in-loop
        const image = await GifCreator.loadImage(frame.file);

        // Create canvas for this frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas dimensions
        canvas.width = input.options.width;
        canvas.height = input.options.height;

        // Fill background
        ctx.fillStyle = input.options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling and positioning
        const { sx, sy, sw, sh, dx, dy, dw, dh } =
          GifCreator.calculateImagePlacement(
            image,
            canvas.width,
            canvas.height,
            input.options.maintainAspectRatio,
          );

        // Draw image on canvas
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

        // Set frame-specific delay
        encoder.setDelay(frame.duration);

        // Add frame to encoder
        console.log(
          `Adding frame ${i + 1} to encoder with ${frame.duration}ms delay`,
        );
        encoder.addFrame(ctx);
      }

      onProgress?.({
        stage: 'encoding',
        progress: 90,
        message: 'Finalizing GIF...',
        totalFrames,
      });

      // Finish encoding
      console.log('Finishing GIF encoding...');
      encoder.finish();

      // Get the result as buffer
      const buffer = encoder.out.getData();
      console.log(`GIF encoding complete. Size: ${buffer.length} bytes`);

      // Convert to blob
      const gifBlob = new Blob([buffer], { type: 'image/gif' });

      onProgress?.({
        stage: 'finalizing',
        progress: 100,
        message: 'GIF creation complete!',
        totalFrames,
      });

      // Calculate total duration
      const totalDuration = input.frames.reduce(
        (sum, frame) => sum + frame.duration,
        0,
      );

      return {
        result: gifBlob,
        metadata: {
          frames: input.frames.length,
          duration: totalDuration,
          size: gifBlob.size,
          dimensions: {
            width: input.options.width,
            height: input.options.height,
          },
          totalDuration: input.options.totalDuration,
          compressionRatio: totalOriginalSize / gifBlob.size,
        },
      };
    } catch (error: unknown) {
      console.error('GIF creation error:', error);
      return {
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'CREATION_ERROR',
        details: error,
      };
    }
  }

  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = (): void => resolve(img);
      img.onerror = (): void =>
        reject(new Error(`Failed to load image: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate image placement within canvas bounds
   */
  private static calculateImagePlacement(
    image: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    maintainAspectRatio: boolean,
  ): {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
  } {
    if (!maintainAspectRatio) {
      // Stretch to fill canvas
      return {
        sx: 0,
        sy: 0,
        sw: image.width,
        sh: image.height,
        dx: 0,
        dy: 0,
        dw: canvasWidth,
        dh: canvasHeight,
      };
    }

    // Maintain aspect ratio - fit image within canvas bounds
    const imageAspectRatio = image.width / image.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let dw: number;
    let dh: number;

    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider - fit by width
      dw = canvasWidth;
      dh = canvasWidth / imageAspectRatio;
    } else {
      // Image is taller - fit by height
      dw = canvasHeight * imageAspectRatio;
      dh = canvasHeight;
    }

    // Center the image
    const dx = (canvasWidth - dw) / 2;
    const dy = (canvasHeight - dh) / 2;

    return {
      sx: 0,
      sy: 0,
      sw: image.width,
      sh: image.height,
      dx,
      dy,
      dw,
      dh,
    };
  }
}

export default GifCreator;
