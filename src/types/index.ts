// Core project types
import type React from 'react';

// Tool-related types
export interface Tool {
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export interface ToolCategory {
  name: string;
  tools: Tool[];
}

export interface ToolError {
  message: string;
  code: string;
  details?: unknown;
}

export interface ToolInput {
  data: string;
  options?: Record<string, unknown>;
}

export interface ToolOutput {
  result: string;
  metadata?: Record<string, unknown>;
}

// Component prop types
export interface NavigationLayoutProps {
  children: React.ReactNode;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormData {
  [key: string]: string | number | boolean | string[];
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeEventHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>,
) => void;
export type ClickEventHandler<T = HTMLButtonElement> = (
  event: React.MouseEvent<T>,
) => void;
export type SubmitEventHandler<T = HTMLFormElement> = (
  event: React.FormEvent<T>,
) => void;

// Common utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Size = 'small' | 'medium' | 'large';
export type Variant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';
export type Direction = 'up' | 'down' | 'left' | 'right';

// Export GIF creator types selectively to avoid conflicts
export type {
  DragDropResult,
  FrameEditAction,
  FrameValidationResult,
  GifCreatorError,
  GifCreatorInput,
  GifCreatorOptions,
  GifCreatorOutput,
  GifCreatorPreset,
  GifCreatorPresetConfig,
  GifFrame,
  GifGenerationProgress,
  GifValidationResult,
  TimelinePosition,
} from './gif-creator';
// Re-export tool-specific types
export * from './image-converter';
export * from './image-metadata-remover';
export * from './json-formatter';
