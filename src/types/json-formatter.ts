// JSON Formatter tool types - Unified library for beautifying and uglifying JSON
import type { ToolError, ToolOutput } from './index';

export interface JsonFormatterInput {
  jsonString: string;
  mode: 'beautify' | 'uglify';
  options?: JsonFormatterOptions;
}

export interface JsonFormatterOptions {
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

export interface JsonFormatterOutput extends ToolOutput {
  result: string;
  metadata: {
    originalSize: number;
    formattedSize: number;
    compressionRatio?: number; // Only for uglify mode
    keyCount: number;
    depth: number;
    arrayCount: number;
    objectCount: number;
    validationWarnings?: string[];
  };
}

export interface JsonFormatterError extends ToolError {
  code:
    | 'INVALID_JSON'
    | 'EMPTY_INPUT'
    | 'PARSING_ERROR'
    | 'FORMATTING_ERROR'
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

// Configuration presets for common formatting scenarios
export type JsonFormatterPreset =
  | 'minimal' // Minimal beautification
  | 'standard' // Standard 2-space indentation
  | 'readable' // Extra readable with generous spacing
  | 'compact' // Compact but still readable
  | 'aligned' // Aligned colons for better readability
  | 'uglify' // Minimize JSON by removing all unnecessary whitespace
  | 'custom'; // User-defined settings

export interface JsonFormatterPresetConfig {
  name: string;
  description: string;
  options: JsonFormatterOptions;
}
