// GIF Creator tool types - Frontend-only GIF creation from images
export interface GifFrame {
  id: string;
  file: File;
  url: string; // Object URL for preview
  duration: number; // milliseconds
  name: string;
  size: number; // file size in bytes
}

export interface GifCreatorOptions {
  width: number;
  height: number;
  totalDuration: number; // Total GIF duration in seconds
  fps: number; // Frames per second (affects smoothness)
  repeat: number; // 0 = infinite loop, -1 = no loop, n = loop n times
  backgroundColor: string;
  maintainAspectRatio: boolean;
}

export interface GifCreatorInput {
  frames: GifFrame[];
  options: GifCreatorOptions;
}

export interface GifCreatorOutput {
  result: Blob;
  metadata: {
    frames: number;
    duration: number; // total duration in milliseconds
    size: number; // output file size in bytes
    dimensions: {
      width: number;
      height: number;
    };
    totalDuration: number;
    compressionRatio: number; // original total size / output size
  };
}

export interface GifCreatorError {
  message: string;
  code: string;
  details?: unknown;
}

export interface GifGenerationProgress {
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing';
  progress: number; // 0-100
  message: string;
  currentFrame?: number;
  totalFrames?: number;
}

export type GifCreatorPreset =
  | 'high-quality' // Best quality, slower generation
  | 'balanced' // Good balance of quality and speed
  | 'fast' // Faster generation, lower quality
  | 'tiny' // Smallest file size
  | 'smooth' // Smooth transitions and consistent timing
  | 'custom'; // User-defined settings

export interface GifCreatorPresetConfig {
  name: string;
  description: string;
  options: GifCreatorOptions;
}

export interface ValidationConstraints {
  maxFrames: number;
  maxFileSize: number; // per frame
  maxTotalSize: number; // total input size
  minDimensions: {
    width: number;
    height: number;
  };
  maxDimensions: {
    width: number;
    height: number;
  };
  supportedFormats: string[]; // MIME types
}

export interface FrameValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GifValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  frameResults: Map<string, FrameValidationResult>;
}

// Timeline editor specific types
export interface TimelinePosition {
  frameId: string;
  position: number; // 0-based index
}

export interface DragDropResult {
  draggedFrameId: string;
  targetPosition: number;
  success: boolean;
}

export interface FrameEditAction {
  type: 'duration' | 'remove' | 'duplicate' | 'move';
  frameId: string;
  value?: number | string;
  targetPosition?: number;
}
