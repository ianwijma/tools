// Glitter-ify tool types

export type GlitterifyStatus = 'pending' | 'processing' | 'success' | 'error';

export interface GlitterifyFile {
  file: File;
  id: string;
  name: string;
  originalFormat: string;
  originalSize: number;
  status: GlitterifyStatus;
  outputSize?: number;
  previewUrl?: string;
  error?: string;
}

export interface GlitterifyProgress {
  totalFiles: number;
  processedFiles: number;
  percentage: number;
  currentFile?: string;
}

export interface GlitterifyOutput {
  metadata: {
    totalFiles: number;
    successCount: number;
    errorCount: number;
    totalOriginalSize: number;
    totalOutputSize: number;
  };
}
