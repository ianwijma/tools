// Image Converter tool implementation - Frontend-only bulk image conversion
import type {
  ConversionProgress,
  FormatSupport,
  ImageConversionResult,
  ImageConverterError,
  ImageConverterInput,
  ImageConverterOptions,
  ImageConverterOutput,
  ImageConverterPreset,
  ImageConverterPresetConfig,
  ImageFormat,
  ValidationConstraints,
} from '@/types/image-converter';

// biome-ignore lint/complexity/noStaticOnlyClass: ImageConverter follows a utility class pattern
export class ImageConverter {
  // Preset configurations for common conversion scenarios
  static readonly PRESETS: Record<
    ImageConverterPreset,
    ImageConverterPresetConfig
  > = {
    'web-optimized': {
      name: 'Web Optimized',
      description: 'JPEG 85% quality, max 1920px width - perfect for web use',
      options: {
        targetFormat: 'jpeg',
        quality: 0.85,
        width: 1920,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'high-quality': {
      name: 'High Quality',
      description: 'WebP 90% quality - best quality with modern compression',
      options: {
        targetFormat: 'webp',
        quality: 0.9,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'small-size': {
      name: 'Small Size',
      description: 'WebP 75% quality, max 1280px - balanced size and quality',
      options: {
        targetFormat: 'webp',
        quality: 0.75,
        width: 1280,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    thumbnail: {
      name: 'Thumbnail',
      description: 'JPEG 80% quality, max 512px - perfect for thumbnails',
      options: {
        targetFormat: 'jpeg',
        quality: 0.8,
        width: 512,
        height: 512,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    favicon: {
      name: 'Favicon',
      description: 'ICO format, 32x32 - for website favicons',
      options: {
        targetFormat: 'ico',
        quality: 1.0,
        width: 32,
        height: 32,
        maintainAspectRatio: false,
        backgroundColor: '#ffffff',
      },
    },
    'modern-efficient': {
      name: 'Modern Efficient',
      description: 'AVIF format - best compression, modern browsers only',
      options: {
        targetFormat: 'avif',
        quality: 0.8,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'retina-display': {
      name: 'Retina Display',
      description:
        'WebP 95% quality, 2x resolution - perfect for high-DPI displays',
      options: {
        targetFormat: 'webp',
        quality: 0.95,
        width: 3840, // 2x 1920
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'social-media': {
      name: 'Social Media',
      description: 'JPEG 90% quality, 1200px - optimized for social platforms',
      options: {
        targetFormat: 'jpeg',
        quality: 0.9,
        width: 1200,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'email-attachment': {
      name: 'Email Attachment',
      description: 'JPEG 75% quality, 800px - small file size for email',
      options: {
        targetFormat: 'jpeg',
        quality: 0.75,
        width: 800,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    'print-quality': {
      name: 'Print Quality',
      description: 'PNG lossless, full resolution - best for printing',
      options: {
        targetFormat: 'png',
        quality: 1.0,
        maintainAspectRatio: true,
        backgroundColor: 'transparent',
      },
    },
    'logo-transparent': {
      name: 'Logo Transparent',
      description: 'PNG with transparency, 1024px - perfect for logos',
      options: {
        targetFormat: 'png',
        quality: 1.0,
        width: 1024,
        maintainAspectRatio: true,
        backgroundColor: 'transparent',
      },
    },
    'app-icon': {
      name: 'App Icon',
      description: 'PNG 512x512 - standard app icon size',
      options: {
        targetFormat: 'png',
        quality: 1.0,
        width: 512,
        height: 512,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
      },
    },
    'ultra-compressed': {
      name: 'Ultra Compressed',
      description: 'AVIF 60% quality, 720px - smallest possible file size',
      options: {
        targetFormat: 'avif',
        quality: 0.6,
        width: 720,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
    custom: {
      name: 'Custom',
      description: 'Custom settings - configure all options manually',
      options: {
        targetFormat: 'jpeg',
        quality: 0.85,
        maintainAspectRatio: true,
        backgroundColor: '#ffffff',
      },
    },
  };

  // Format support matrix
  static readonly FORMAT_SUPPORT: Record<ImageFormat, FormatSupport> = {
    jpeg: {
      read: true,
      write: true,
      transparency: false,
      compression: true,
      quality: true,
    },
    png: {
      read: true,
      write: true,
      transparency: true,
      compression: false,
      quality: false,
    },
    webp: {
      read: true,
      write: true,
      transparency: true,
      compression: true,
      quality: true,
    },
    avif: {
      read: true,
      write: true,
      transparency: true,
      compression: true,
      quality: true,
    },
    bmp: {
      read: true,
      write: true,
      transparency: false,
      compression: false,
      quality: false,
    },
    ico: {
      read: true,
      write: true,
      transparency: true,
      compression: false,
      quality: false,
    },
  };

  // Validation constraints
  static readonly CONSTRAINTS: ValidationConstraints = {
    maxFileSize: 50 * 1024 * 1024, // 50MB per file
    maxTotalFiles: 100,
    allowedInputFormats: [
      // Standard formats - universally supported
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',

      // Modern formats - good browser support
      'image/webp',
      'image/avif', // Chrome 85+, Firefox 93+, Safari 14+

      // Vector formats
      'image/svg+xml',
      'image/svg',

      // Icon formats
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/ico',

      // Professional formats - limited browser support but worth trying
      'image/tiff',
      'image/tif',

      // Additional JPEG variants
      'image/pjpeg', // Progressive JPEG

      // Additional PNG variants
      'image/x-png',

      // Additional BMP variants
      'image/x-bmp',
      'image/x-bitmap',
      'image/x-ms-bmp',
    ],
    maxDimensions: {
      width: 32768, // 32K width - supports ultra-high resolution displays and professional photography
      height: 32768, // 32K height - modern browsers can handle large canvases efficiently
    },
  };

  /**
   * Get all available presets
   */
  static getAllPresets(): Record<
    ImageConverterPreset,
    ImageConverterPresetConfig
  > {
    return ImageConverter.PRESETS;
  }

  /**
   * Get preset configuration by name
   */
  static getPreset(preset: ImageConverterPreset): ImageConverterOptions {
    return ImageConverter.PRESETS[preset].options;
  }

  /**
   * Check if browser supports canvas and required image formats
   */
  static checkBrowserSupport(): {
    canvas: boolean;
    formats: Record<ImageFormat, boolean>;
  } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const formatSupport: Record<ImageFormat, boolean> = {
      jpeg: true, // Always supported
      png: true, // Always supported
      webp: false,
      avif: false,
      bmp: false,
      ico: false, // Generally requires special handling
    };

    if (ctx) {
      // Test modern format support
      canvas.width = 1;
      canvas.height = 1;

      try {
        formatSupport.webp =
          canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch {
        formatSupport.webp = false;
      }

      try {
        formatSupport.avif =
          canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      } catch {
        formatSupport.avif = false;
      }

      try {
        formatSupport.bmp =
          canvas.toDataURL('image/bmp').indexOf('data:image/bmp') === 0;
      } catch {
        formatSupport.bmp = false;
      }

      // ICO generally requires special handling and isn't supported by toDataURL
      formatSupport.ico = false;
    }

    return {
      canvas: !!ctx,
      formats: formatSupport,
    };
  }

  /**
   * Validate input files and options
   */
  static validate(input: ImageConverterInput): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if files are provided
    if (input.files.length === 0) {
      errors.push('No files provided for conversion');
      return { errors, warnings };
    }

    // Count supported vs unsupported files
    const supportedFiles = input.files.filter((file) =>
      ImageConverter.CONSTRAINTS.allowedInputFormats.includes(file.type),
    );
    const unsupportedFiles = input.files.filter(
      (file) =>
        !ImageConverter.CONSTRAINTS.allowedInputFormats.includes(file.type),
    );

    // If no supported files, that's an error
    if (supportedFiles.length === 0) {
      errors.push(
        'No supported image files found. Please select JPEG, PNG, WebP, AVIF, BMP, GIF, TIFF, ICO, or SVG files.',
      );
      return { errors, warnings };
    }

    // Check file count limit (only for supported files)
    if (supportedFiles.length > ImageConverter.CONSTRAINTS.maxTotalFiles) {
      errors.push(
        `Too many supported files: ${supportedFiles.length}. Maximum allowed: ${ImageConverter.CONSTRAINTS.maxTotalFiles}`,
      );
    }

    // Add warnings for unsupported files
    for (const file of unsupportedFiles) {
      warnings.push(
        `File "${file.name}" has unsupported format (${file.type}) and will be skipped`,
      );
    }

    // Validate each supported file
    const processableFiles = [];
    for (const file of supportedFiles) {
      // Check file size - move large files to warnings instead of blocking
      if (file.size > ImageConverter.CONSTRAINTS.maxFileSize) {
        warnings.push(
          `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max: ${ImageConverter.CONSTRAINTS.maxFileSize / 1024 / 1024}MB) and will be skipped`,
        );
      } else {
        processableFiles.push(file);
      }
    }

    // If no processable files remain, that's an error
    if (processableFiles.length === 0) {
      errors.push(
        'No processable files found. All files are either unsupported or too large.',
      );
    }

    // Check quality range
    if (
      input.quality !== undefined &&
      (input.quality < 0.1 || input.quality > 1.0)
    ) {
      errors.push('Quality must be between 0.1 and 1.0');
    }

    // Check dimensions
    if (
      input.width !== undefined &&
      input.width > ImageConverter.CONSTRAINTS.maxDimensions.width
    ) {
      errors.push(
        `Width too large: ${input.width}px. Maximum: ${ImageConverter.CONSTRAINTS.maxDimensions.width}px`,
      );
    }

    if (
      input.height !== undefined &&
      input.height > ImageConverter.CONSTRAINTS.maxDimensions.height
    ) {
      errors.push(
        `Height too large: ${input.height}px. Maximum: ${ImageConverter.CONSTRAINTS.maxDimensions.height}px`,
      );
    }

    return { errors, warnings };
  }

  /**
   * Check if a file is an SVG
   */
  static isSVG(file: File): boolean {
    return file.type === 'image/svg+xml' || file.type === 'image/svg';
  }

  /**
   * Convert SVG to other formats by rendering it first
   */
  static async convertSVGFile(
    file: File,
    options: ImageConverterOptions,
  ): Promise<ImageConversionResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (): void => {
        const svgString = reader.result as string;
        const img = new Image();

        img.onload = (): void => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve({
                fileId: ImageConverter.generateFileId(file),
                success: false,
                error: 'Canvas context not available',
                outputSize: 0,
              });
              return;
            }

            // Calculate dimensions
            const { width, height } = ImageConverter.calculateOutputDimensions(
              img.width || 512,
              img.height || 512,
              options,
            );

            canvas.width = width;
            canvas.height = height;

            // Fill background if needed
            if (
              options.backgroundColor &&
              options.backgroundColor !== 'transparent'
            ) {
              ctx.fillStyle = options.backgroundColor;
              ctx.fillRect(0, 0, width, height);
            }

            // Draw the SVG
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to target format
            ImageConverter.canvasToBlob(canvas, options)
              .then((blob) => {
                resolve({
                  fileId: ImageConverter.generateFileId(file),
                  success: true,
                  outputBlob: blob,
                  outputSize: blob.size,
                });
              })
              .catch((error) => {
                resolve({
                  fileId: ImageConverter.generateFileId(file),
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Conversion failed',
                  outputSize: 0,
                });
              });
          } catch (error) {
            resolve({
              fileId: ImageConverter.generateFileId(file),
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Canvas processing failed',
              outputSize: 0,
            });
          }
        };

        img.onerror = (): void => {
          resolve({
            fileId: ImageConverter.generateFileId(file),
            success: false,
            error: 'Failed to load SVG image',
            outputSize: 0,
          });
        };

        // Create SVG data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        img.src = URL.createObjectURL(svgBlob);
      };

      reader.onerror = (): void => {
        resolve({
          fileId: ImageConverter.generateFileId(file),
          success: false,
          error: 'Failed to read SVG file',
          outputSize: 0,
        });
      };

      reader.readAsText(file);
    });
  }

  /**
   * Convert a single image file
   */
  static async convertSingleFile(
    file: File,
    options: ImageConverterOptions,
    onProgress?: (progress: number) => void,
  ): Promise<ImageConversionResult> {
    try {
      // Handle SVG files specially
      if (ImageConverter.isSVG(file)) {
        return ImageConverter.convertSVGFile(file, options);
      }
      onProgress?.(0);

      // Create image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      const loadPromise = new Promise<HTMLImageElement>(
        (resolve, reject): void => {
          img.onload = (): void => resolve(img);
          img.onerror = (): void => reject(new Error('Failed to load image'));
          img.src = imageUrl;
        },
      );

      const loadedImg = await loadPromise;
      onProgress?.(25);

      // Calculate output dimensions
      const { width: outputWidth, height: outputHeight } =
        ImageConverter.calculateOutputDimensions(
          loadedImg.width,
          loadedImg.height,
          options,
        );

      // Create canvas for conversion
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Fill background for formats that don't support transparency
      if (!ImageConverter.FORMAT_SUPPORT[options.targetFormat].transparency) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      }

      onProgress?.(50);

      // Draw image to canvas
      ctx.drawImage(loadedImg, 0, 0, outputWidth, outputHeight);
      onProgress?.(75);

      // Convert to target format
      const outputBlob = await ImageConverter.canvasToBlob(canvas, options);
      onProgress?.(100);

      // Clean up
      URL.revokeObjectURL(imageUrl);

      return {
        fileId: ImageConverter.generateFileId(file),
        success: true,
        outputBlob,
        outputSize: outputBlob.size,
      };
    } catch (error) {
      return {
        fileId: ImageConverter.generateFileId(file),
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown conversion error',
      };
    }
  }

  /**
   * Convert multiple image files in batch
   */
  static async convertFiles(
    input: ImageConverterInput,
    onProgress?: (progress: ConversionProgress) => void,
    onFileComplete?: (result: ImageConversionResult) => void,
  ): Promise<ImageConverterOutput | ImageConverterError> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = ImageConverter.validate(input);
      if (validation.errors.length > 0) {
        return {
          message: validation.errors.join('. '),
          code: 'INVALID_FILE',
        };
      }

      // Prepare options
      const options: ImageConverterOptions = {
        targetFormat: input.targetFormat,
        quality: input.quality ?? 0.85,
        ...(input.width !== undefined && { width: input.width }),
        ...(input.height !== undefined && { height: input.height }),
        maintainAspectRatio: input.maintainAspectRatio,
        backgroundColor: '#ffffff',
      };

      const results: ImageConversionResult[] = [];
      let totalOriginalSize = 0;
      let totalOutputSize = 0;
      let successCount = 0;
      let errorCount = 0;

      // Filter out unsupported files and files that are too large - only process valid ones
      const supportedFiles = input.files.filter(
        (file) =>
          ImageConverter.CONSTRAINTS.allowedInputFormats.includes(file.type) &&
          file.size <= ImageConverter.CONSTRAINTS.maxFileSize,
      );

      // Calculate total original size (only supported files)
      totalOriginalSize = supportedFiles.reduce(
        (total, file) => total + file.size,
        0,
      );

      // Process each supported file sequentially to manage memory and provide progress updates
      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        if (!file) continue;

        // Update progress
        onProgress?.({
          totalFiles: supportedFiles.length,
          processedFiles: i,
          currentFile: file.name,
          percentage: (i / supportedFiles.length) * 100,
          isComplete: false,
        });

        // Convert file
        // eslint-disable-next-line no-await-in-loop
        const result = await ImageConverter.convertSingleFile(file, options);
        results.push(result);
        onFileComplete?.(result);

        if (result.success && result.outputSize) {
          successCount++;
          totalOutputSize += result.outputSize;
        } else {
          errorCount++;
        }
      }

      // Final progress update
      onProgress?.({
        totalFiles: supportedFiles.length,
        processedFiles: supportedFiles.length,
        percentage: 100,
        isComplete: true,
      });

      const processingTime = Date.now() - startTime;
      const compressionRatio =
        totalOriginalSize > 0 ? totalOutputSize / totalOriginalSize : 0;

      return {
        result: `Successfully converted ${successCount} of ${supportedFiles.length} supported images`,
        metadata: {
          totalFiles: supportedFiles.length,
          successCount,
          errorCount,
          totalOriginalSize,
          totalOutputSize,
          compressionRatio,
          processingTime,
        },
      };
    } catch (error) {
      return {
        message: 'Batch conversion failed',
        code: 'PROCESSING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate output dimensions based on constraints and aspect ratio
   */
  private static calculateOutputDimensions(
    originalWidth: number,
    originalHeight: number,
    options: ImageConverterOptions,
  ): { width: number; height: number } {
    let { width, height } = options;

    // If no dimensions specified, use original
    if (!width && !height) {
      return { width: originalWidth, height: originalHeight };
    }

    // If only width specified
    if (width && !height) {
      if (options.maintainAspectRatio) {
        height = Math.round((originalHeight * width) / originalWidth);
      } else {
        height = originalHeight;
      }
    }

    // If only height specified
    if (height && !width) {
      if (options.maintainAspectRatio) {
        width = Math.round((originalWidth * height) / originalHeight);
      } else {
        width = originalWidth;
      }
    }

    // If both specified and maintaining aspect ratio
    if (width && height && options.maintainAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      const targetAspectRatio = width / height;

      if (aspectRatio > targetAspectRatio) {
        // Original is wider, limit by width
        height = Math.round(width / aspectRatio);
      } else {
        // Original is taller, limit by height
        width = Math.round(height * aspectRatio);
      }
    }

    return { width: width ?? 0, height: height ?? 0 };
  }

  /**
   * Convert canvas to blob with specified format and quality
   */
  private static async canvasToBlob(
    canvas: HTMLCanvasElement,
    options: ImageConverterOptions,
  ): Promise<Blob> {
    return new Promise<Blob>((resolve, reject): void => {
      let mimeType: string;
      let quality: number | undefined;

      switch (options.targetFormat) {
        case 'jpeg':
          mimeType = 'image/jpeg';
          quality = options.quality;
          break;
        case 'png':
          mimeType = 'image/png';
          quality = undefined; // PNG doesn't use quality
          break;
        case 'webp':
          mimeType = 'image/webp';
          quality = options.quality;
          break;
        case 'bmp':
          // BMP not supported by canvas, fallback to PNG
          mimeType = 'image/png';
          quality = undefined;
          break;
        case 'ico':
          // ICO not supported by canvas, fallback to PNG
          mimeType = 'image/png';
          quality = undefined;
          break;
        default:
          mimeType = 'image/jpeg';
          quality = options.quality;
      }

      canvas.toBlob(
        (blob): void => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        quality,
      );
    });
  }

  /**
   * Generate unique file ID for tracking
   */
  private static generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  /**
   * Get file extension for target format
   */
  static getFileExtension(format: ImageFormat): string {
    switch (format) {
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'bmp':
        return 'bmp';
      case 'ico':
        return 'ico';
      default:
        return 'jpg';
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Get supported output formats for browser
   */
  static getSupportedFormats(): ImageFormat[] {
    const support = ImageConverter.checkBrowserSupport();
    return Object.entries(support.formats)
      .filter(([, supported]) => supported)
      .map(([format]) => format as ImageFormat);
  }
}
