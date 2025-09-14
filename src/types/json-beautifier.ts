// JSON Beautifier tool types
import type { ToolError, ToolOutput } from './index';

export interface JsonBeautifierInput {
  jsonString: string;
  options?: JsonBeautifierOptions;
}

export interface JsonBeautifierOptions {
  indentType: 'spaces' | 'tabs';
  indentSize: number;
  sortKeys: boolean;
  insertFinalNewline: boolean;
  maxLineLength?: number;
  preserveArrays: boolean;
  spacesAroundColon: boolean;
  spacesAroundComma: boolean;
  removeTrailingCommas: boolean;
  compactArrays: boolean;
  compactObjects: boolean;
  alignColons: boolean;
}

export interface JsonBeautifierOutput extends ToolOutput {
  result: string;
  metadata: {
    originalSize: number;
    beautifiedSize: number;
    keyCount: number;
    depth: number;
    arrayCount: number;
    objectCount: number;
    validationWarnings?: string[];
  };
}

export interface JsonBeautifierError extends ToolError {
  code:
    | 'INVALID_JSON'
    | 'EMPTY_INPUT'
    | 'PARSING_ERROR'
    | 'BEAUTIFYING_ERROR'
    | 'VALIDATION_ERROR';
  line?: number;
  column?: number;
  position?: number;
}

export interface JsonValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Configuration presets for common beautification scenarios
export type JsonBeautifierPreset =
  | 'minimal' // Minimal beautification
  | 'standard' // Standard 2-space indentation
  | 'readable' // Extra readable with generous spacing
  | 'compact' // Compact but still readable
  | 'aligned' // Aligned colons for better readability
  | 'custom'; // User-defined settings

export interface JsonBeautifierPresetConfig {
  name: string;
  description: string;
  options: JsonBeautifierOptions;
}
