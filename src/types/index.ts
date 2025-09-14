// Core project types

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Tool-related types
export interface Tool {
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
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
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
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
export type ChangeEventHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type ClickEventHandler<T = HTMLButtonElement> = (event: React.MouseEvent<T>) => void;
export type SubmitEventHandler<T = HTMLFormElement> = (event: React.FormEvent<T>) => void;

// Common utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Size = 'small' | 'medium' | 'large';
export type Variant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type Direction = 'up' | 'down' | 'left' | 'right';

// Window object extensions
declare global {
  interface Window {
    __INITIAL_THEME__?: string;
  }
}
