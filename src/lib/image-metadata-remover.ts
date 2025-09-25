// Image Metadata Remover tool implementation - Frontend-only bulk metadata removal
import type {
  MetadataImageFile,
  MetadataRemoverError,
  MetadataRemoverInput,
  MetadataRemoverOptions,
  MetadataRemoverOutput,
  MetadataRemoverPreset,
  MetadataRemoverPresetConfig,
  MetadataRemoverPresetKey,
  MetadataRemoverValidationConstraints,
  ProcessingProgress,
  SupportedImageFormat,
} from '@/types/image-metadata-remover';

// biome-ignore lint/complexity/noStaticOnlyClass: ImageMetadataRemover follows a utility class pattern
export class ImageMetadataRemover {
  // Validation constraints (matching image converter)
  static readonly CONSTRAINTS: MetadataRemoverValidationConstraints = {
    maxFileSize: 50 * 1024 * 1024, // 50MB per file (matching image converter)
    maxTotalFiles: 100, // Maximum 100 files at once
    supportedFormats: [
      'jpeg',
      'jpg',
      'png',
      'webp',
      'bmp',
      'gif',
      'tiff',
      'tif',
      'avif',
      'ico',
    ],
  };

  // Preset configurations for common metadata removal scenarios
  static readonly PRESETS: MetadataRemoverPresetConfig = {
    'complete-removal': {
      name: 'Complete Removal',
      description:
        'Remove all metadata including color profiles and orientation data. Use with JPEG output for maximum privacy.',
      options: {
        preserveColorProfile: false,
        preserveOrientation: false,
        outputFormat: 'same',
        jpegQuality: 0.95,
      },
    },
    'preserve-essential': {
      name: 'Preserve Essential',
      description:
        'Remove personal data but keep color profiles and orientation',
      options: {
        preserveColorProfile: true,
        preserveOrientation: true,
        outputFormat: 'same',
        jpegQuality: 0.95,
      },
    },
    'web-optimized': {
      name: 'Web Optimized',
      description:
        'Remove metadata and convert to WebP for optimal web performance',
      options: {
        preserveColorProfile: false,
        preserveOrientation: true,
        outputFormat: 'webp',
        jpegQuality: 0.95,
      },
    },
  };

  /**
   * Get preset configuration by key
   */
  static getPreset(preset: MetadataRemoverPresetKey): MetadataRemoverOptions {
    return { ...ImageMetadataRemover.PRESETS[preset].options };
  }

  /**
   * Get all available presets
   */
  static getAllPresets(): Array<{
    key: MetadataRemoverPresetKey;
    preset: MetadataRemoverPreset;
  }> {
    return Object.entries(ImageMetadataRemover.PRESETS).map(
      ([key, preset]) => ({
        key: key as MetadataRemoverPresetKey,
        preset,
      }),
    );
  }

  /**
   * Validate input files and options
   */
  static validate(input: MetadataRemoverInput): string[] {
    const errors: string[] = [];

    // Check if files are provided
    if (input.files.length === 0) {
      errors.push('No files provided');
      return errors;
    }

    // Check total number of files
    if (input.files.length > ImageMetadataRemover.CONSTRAINTS.maxTotalFiles) {
      errors.push(
        `Too many files. Maximum ${ImageMetadataRemover.CONSTRAINTS.maxTotalFiles} files allowed`,
      );
    }

    // Validate each file
    for (const file of input.files) {
      // Check file size
      if (file.size > ImageMetadataRemover.CONSTRAINTS.maxFileSize) {
        errors.push(
          `File "${file.name}" is too large. Maximum size is ${ImageMetadataRemover.CONSTRAINTS.maxFileSize / (1024 * 1024)}MB`,
        );
      }

      // Check file type
      const extension = ImageMetadataRemover.getFileExtension(
        file.name,
      ).toLowerCase() as SupportedImageFormat;
      if (
        !ImageMetadataRemover.CONSTRAINTS.supportedFormats.includes(extension)
      ) {
        errors.push(
          `File "${file.name}" has unsupported format. Supported formats: ${ImageMetadataRemover.CONSTRAINTS.supportedFormats.join(', ')}`,
        );
      }

      // Check if it's actually an image
      if (!file.type.startsWith('image/')) {
        errors.push(`File "${file.name}" is not an image file`);
      }
    }

    // Validate JPEG quality
    if (input.jpegQuality < 0.1 || input.jpegQuality > 1.0) {
      errors.push('JPEG quality must be between 0.1 and 1.0');
    }

    return errors;
  }

  /**
   * Check if a file format is supported
   */
  static isFormatSupported(filename: string): boolean {
    const extension = ImageMetadataRemover.getFileExtension(
      filename,
    ).toLowerCase() as SupportedImageFormat;
    return ImageMetadataRemover.CONSTRAINTS.supportedFormats.includes(
      extension,
    );
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop() ?? '';
  }

  /**
   * Determine output format for a file
   */
  private static getOutputFormat(
    file: File,
    options: MetadataRemoverOptions,
  ): string {
    if (options.outputFormat === 'same') {
      // Keep original format, but convert JPEG variants to standard JPEG MIME type
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        return 'image/jpeg';
      }
      return file.type;
    }

    // Convert to specified format
    const formatMap: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return formatMap[options.outputFormat] ?? file.type;
  }

  /**
   * Get output file extension
   */
  private static getOutputExtension(outputFormat: string): string {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/gif': 'gif',
    };

    return extensionMap[outputFormat] ?? 'jpg';
  }

  /**
   * Create canvas from image file
   */
  private static async loadImageToCanvas(
    file: File,
  ): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = (): void => {
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Clear canvas with white background (removes transparency metadata)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image onto canvas (this strips all metadata)
        ctx.drawImage(img, 0, 0);

        resolve({ canvas, ctx });
      };

      img.onerror = (): void => {
        reject(new Error('Failed to load image'));
      };

      // Create object URL for the file
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Clean up object URL when done
      img.onload = (): void => {
        URL.revokeObjectURL(objectUrl);
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Clear canvas with white background (removes transparency metadata)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image onto canvas (this strips all metadata)
        ctx.drawImage(img, 0, 0);

        resolve({ canvas, ctx });
      };
    });
  }

  /**
   * Process a single image file to remove metadata
   */
  private static async processSingleFile(
    file: File,
    options: MetadataRemoverOptions,
  ): Promise<{ blob: Blob; metadataRemoved: number }> {
    try {
      // Load image to canvas (this automatically strips EXIF and other metadata)
      const { canvas } = await ImageMetadataRemover.loadImageToCanvas(file);

      // Determine output format
      const outputFormat = ImageMetadataRemover.getOutputFormat(file, options);

      // Convert canvas to blob (maintain original quality for equal quality output)
      const blob = await new Promise<Blob>((resolve, reject) => {
        // For metadata removal, we maintain maximum quality to preserve image fidelity
        // The quality parameter is only used for format conversion scenarios
        if (outputFormat === 'image/jpeg') {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            outputFormat,
            0.95, // High quality to maintain original image quality
          );
        } else {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, outputFormat);
        }
      });

      // Calculate approximate metadata removed (difference in file size)
      // Note: This is approximate since canvas rendering may also affect image compression
      const metadataRemoved = Math.max(0, file.size - blob.size);

      return { blob, metadataRemoved };
    } catch (error) {
      throw new Error(
        `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate output filename with proper extension
   */
  private static generateOutputFilename(
    originalFile: File,
    options: MetadataRemoverOptions,
  ): string {
    const baseName = originalFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const outputFormat = ImageMetadataRemover.getOutputFormat(
      originalFile,
      options,
    );
    const extension = ImageMetadataRemover.getOutputExtension(outputFormat);

    return `${baseName}_no_metadata.${extension}`;
  }

  /**
   * Process a single file and return the result with blob
   */
  static async processSingleFileWithBlob(
    file: File,
    options: MetadataRemoverOptions,
  ): Promise<
    | { blob: Blob; metadataRemoved: number; outputSize: number }
    | MetadataRemoverError
  > {
    try {
      const result = await ImageMetadataRemover.processSingleFile(
        file,
        options,
      );
      return {
        blob: result.blob,
        metadataRemoved: result.metadataRemoved,
        outputSize: result.blob.size,
      };
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Processing failed',
        code: 'PROCESSING_ERROR',
        details: error,
      };
    }
  }

  /**
   * Process multiple files with progress callback
   */
  static async processFiles(
    input: MetadataRemoverInput,
    onProgress?: (progress: ProcessingProgress) => void,
  ): Promise<MetadataRemoverOutput | MetadataRemoverError> {
    const startTime = Date.now();

    try {
      // Validate input
      const validationErrors = ImageMetadataRemover.validate(input);
      if (validationErrors.length > 0) {
        return {
          message: validationErrors.join('; '),
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        };
      }

      const results: MetadataImageFile[] = [];
      const processedBlobs = new Map<string, Blob>();
      let successCount = 0;
      let errorCount = 0;
      let totalOriginalSize = 0;
      let totalOutputSize = 0;
      let totalMetadataRemoved = 0;
      const formatBreakdown: Record<string, number> = {};

      // Process each file
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if (!file) continue; // Skip if file is undefined
        const fileId = `${file.name}_${file.size}_${i}`;

        // Update progress
        onProgress?.({
          current: i + 1,
          total: input.files.length,
          currentFileName: file.name,
          percentage: Math.round((i / input.files.length) * 100),
          stage: 'processing',
        });

        const imageFile: MetadataImageFile = {
          file,
          id: fileId,
          name: file.name,
          originalSize: file.size,
          originalFormat: file.type,
          status: 'processing',
          isSupported: ImageMetadataRemover.isFormatSupported(file.name),
        };

        try {
          if (!imageFile.isSupported) {
            imageFile.status = 'unsupported';
            imageFile.error = 'Unsupported file format';
            errorCount++;
          } else {
            // Process the file
            const { blob, metadataRemoved } =
              // eslint-disable-next-line no-await-in-loop
              await ImageMetadataRemover.processSingleFile(file, {
                preserveColorProfile: input.preserveColorProfile,
                preserveOrientation: input.preserveOrientation,
                outputFormat: input.outputFormat ?? 'same',
                jpegQuality: input.jpegQuality,
              });

            imageFile.outputBlob = blob;
            imageFile.outputSize = blob.size;
            imageFile.metadataRemoved = metadataRemoved;
            imageFile.status = 'success';
            imageFile.hasMetadata = metadataRemoved > 0;

            // Store processed blob
            processedBlobs.set(fileId, blob);

            // Update counters
            successCount++;
            totalOutputSize += blob.size;
            totalMetadataRemoved += metadataRemoved;

            // Update format breakdown
            const outputFormat = ImageMetadataRemover.getOutputFormat(file, {
              preserveColorProfile: input.preserveColorProfile,
              preserveOrientation: input.preserveOrientation,
              outputFormat: input.outputFormat ?? 'same',
              jpegQuality: input.jpegQuality,
            });
            formatBreakdown[outputFormat] =
              (formatBreakdown[outputFormat] ?? 0) + 1;
          }
        } catch (error) {
          imageFile.status = 'error';
          imageFile.error =
            error instanceof Error ? error.message : 'Processing failed';
          errorCount++;
        }

        totalOriginalSize += file.size;
        results.push(imageFile);
      }

      // Final progress update
      onProgress?.({
        current: input.files.length,
        total: input.files.length,
        currentFileName: '',
        percentage: 100,
        stage: 'complete',
      });

      const processingTime = Date.now() - startTime;
      const compressionRatio =
        totalOriginalSize > 0 ? totalOutputSize / totalOriginalSize : 1;

      return {
        result: `Successfully processed ${successCount} out of ${input.files.length} images. ${totalMetadataRemoved > 0 ? `Removed ${(totalMetadataRemoved / 1024).toFixed(1)}KB of metadata.` : 'No metadata found to remove.'}`,
        metadata: {
          totalFiles: input.files.length,
          successCount,
          errorCount,
          totalOriginalSize,
          totalOutputSize,
          totalMetadataRemoved,
          compressionRatio,
          processingTime,
          formatBreakdown,
        },
      };
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Processing failed',
        code: 'PROCESSING_ERROR',
        details: error,
      };
    }
  }

  /**
   * Create a filename for the output file
   */
  static createOutputFilename(
    originalFile: File,
    options: MetadataRemoverOptions,
  ): string {
    return ImageMetadataRemover.generateOutputFilename(originalFile, options);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const decimals = 2;

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / k ** i;

    return `${size.toFixed(decimals)} ${units[i]}`;
  }

  /**
   * Get format support information
   */
  static getFormatSupport(): Record<SupportedImageFormat, boolean> {
    // For metadata removal, we can handle most common formats via canvas
    return {
      jpeg: true,
      jpg: true,
      png: true,
      webp: true,
      bmp: true,
      gif: true, // Note: GIF animation will be lost
      tiff: true,
      tif: true,
      avif: true,
      ico: true,
    };
  }
}
