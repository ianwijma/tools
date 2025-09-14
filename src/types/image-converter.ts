// Image Converter tool types - Frontend-only bulk image conversion
import type { ToolError, ToolOutput } from './index';

export interface ImageFile {
  file: File;
  id: string;
  name: string;
  originalFormat: string;
  originalSize: number;
  status: 'pending' | 'converting' | 'success' | 'error' | 'unsupported';
  outputBlob?: Blob | undefined;
  outputSize?: number | undefined;
  error?: string | undefined;
  isSupported?: boolean | undefined;
}

export interface ImageConverterInput {
  files: File[];
  targetFormat: ImageFormat;
  quality?: number; // 0.1 to 1.0 for JPEG/WebP
  width?: number; // Max width for resizing
  height?: number; // Max height for resizing
  maintainAspectRatio: boolean;
}

export interface ImageConverterOptions {
  targetFormat: ImageFormat;
  quality: number;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor: string; // For formats that don't support transparency
}

export interface ImageConverterOutput extends ToolOutput {
  result: string;
  metadata: {
    totalFiles: number;
    successCount: number;
    errorCount: number;
    totalOriginalSize: number;
    totalOutputSize: number;
    compressionRatio: number;
    processingTime: number;
  };
}

export interface ImageConverterError extends ToolError {
  code:
    | 'INVALID_FILE'
    | 'UNSUPPORTED_FORMAT'
    | 'CONVERSION_FAILED'
    | 'FILE_TOO_LARGE'
    | 'CANVAS_ERROR'
    | 'PROCESSING_ERROR';
  fileId?: string;
  fileName?: string;
}

export interface ImageConversionResult {
  fileId: string;
  success: boolean;
  outputBlob?: Blob;
  outputSize?: number;
  error?: string;
}

// Supported image formats for conversion
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'bmp' | 'ico';

// Format support matrix
export interface FormatSupport {
  read: boolean;
  write: boolean;
  transparency: boolean;
  compression: boolean;
  quality: boolean;
}

// Preset configurations for common conversion scenarios
export type ImageConverterPreset =
  | 'web-optimized' // JPEG 85% quality, max 1920px
  | 'high-quality' // PNG or WebP 90% quality
  | 'small-size' // WebP 75% quality, max 1280px
  | 'thumbnail' // JPEG 80% quality, max 512px
  | 'favicon' // ICO or PNG, 32x32, 64x64, 128x128
  | 'modern-efficient' // AVIF 80% quality - best compression
  | 'retina-display' // WebP 95% quality, 2x resolution
  | 'social-media' // JPEG 90% quality, 1200px
  | 'email-attachment' // JPEG 75% quality, 800px
  | 'print-quality' // PNG lossless, full resolution
  | 'logo-transparent' // PNG with transparency, 1024px
  | 'app-icon' // PNG 512x512
  | 'ultra-compressed' // AVIF 60% quality, 720px
  | 'custom'; // User-defined settings

export interface ImageConverterPresetConfig {
  name: string;
  description: string;
  options: ImageConverterOptions;
}

// File validation constraints
export interface ValidationConstraints {
  maxFileSize: number; // in bytes
  maxTotalFiles: number;
  allowedInputFormats: string[];
  maxDimensions: {
    width: number;
    height: number;
  };
}

// Progress tracking for bulk operations
export interface ConversionProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  percentage: number;
  isComplete: boolean;
}
