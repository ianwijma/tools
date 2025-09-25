// Image Metadata Remover tool types - Frontend-only bulk metadata removal
import type { ToolError, ToolOutput } from './index';

export interface MetadataImageFile {
  file: File;
  id: string;
  name: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'success' | 'error' | 'unsupported';
  outputBlob?: Blob | undefined;
  outputSize?: number | undefined;
  error?: string | undefined;
  isSupported?: boolean | undefined;
  originalFormat: string;
  hasMetadata?: boolean | undefined;
  metadataRemoved?: number | undefined; // bytes of metadata removed
}

export interface MetadataRemoverInput {
  files: File[];
  preserveColorProfile: boolean;
  preserveOrientation: boolean;
  outputFormat?: 'same' | 'jpeg' | 'png' | 'webp';
  jpegQuality: number; // 0.1 to 1.0 for JPEG output
}

export interface MetadataRemoverOptions {
  preserveColorProfile: boolean;
  preserveOrientation: boolean;
  outputFormat: 'same' | 'jpeg' | 'png' | 'webp';
  jpegQuality: number;
}

export interface MetadataRemoverOutput extends ToolOutput {
  result: string;
  metadata: {
    totalFiles: number;
    successCount: number;
    errorCount: number;
    totalOriginalSize: number;
    totalOutputSize: number;
    totalMetadataRemoved: number;
    compressionRatio: number;
    processingTime: number;
    formatBreakdown: Record<string, number>;
  };
}

export interface MetadataRemoverError extends ToolError {
  code:
    | 'INVALID_FILE'
    | 'UNSUPPORTED_FORMAT'
    | 'FILE_TOO_LARGE'
    | 'PROCESSING_ERROR'
    | 'CANVAS_ERROR'
    | 'BLOB_CREATION_ERROR'
    | 'VALIDATION_ERROR';
}

export interface ProcessingProgress {
  current: number;
  total: number;
  currentFileName: string;
  percentage: number;
  stage: 'loading' | 'processing' | 'generating' | 'complete';
}

// Supported image formats for metadata removal (matching image converter)
export type SupportedImageFormat =
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'webp'
  | 'bmp'
  | 'gif'
  | 'tiff'
  | 'tif'
  | 'avif'
  | 'ico';

// Output format options
export type OutputFormat = 'same' | 'jpeg' | 'png' | 'webp';

// Metadata removal preset configurations
export interface MetadataRemoverPreset {
  name: string;
  description: string;
  options: MetadataRemoverOptions;
}

export type MetadataRemoverPresetKey =
  | 'complete-removal'
  | 'preserve-essential'
  | 'web-optimized';

export type MetadataRemoverPresetConfig = Record<
  MetadataRemoverPresetKey,
  MetadataRemoverPreset
>;

// File validation constraints (matching image converter)
export interface MetadataRemoverValidationConstraints {
  maxFileSize: number; // in bytes (50MB like image converter)
  maxTotalFiles: number; // 100 files like image converter
  supportedFormats: SupportedImageFormat[];
}
