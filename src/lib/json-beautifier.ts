// JSON Beautifier tool implementation
import type {
  JsonBeautifierError,
  JsonBeautifierInput,
  JsonBeautifierOptions,
  JsonBeautifierOutput,
  JsonBeautifierPreset,
  JsonBeautifierPresetConfig,
  JsonValidationResult,
} from '@/types/json-beautifier';

export class JsonBeautifier {
  // Preset configurations for common beautification scenarios
  static readonly PRESETS: Record<
    JsonBeautifierPreset,
    JsonBeautifierPresetConfig
  > = {
    minimal: {
      name: 'Minimal',
      description: 'Clean formatting with minimal spacing',
      options: {
        indentType: 'spaces',
        indentSize: 2,
        sortKeys: false,
        insertFinalNewline: false,
        preserveArrays: true,
        spacesAroundColon: false,
        spacesAroundComma: false,
        removeTrailingCommas: true,
        compactArrays: true,
        compactObjects: false,
        alignColons: false,
      },
    },
    standard: {
      name: 'Standard',
      description: 'Standard 2-space indentation with clean formatting',
      options: {
        indentType: 'spaces',
        indentSize: 2,
        sortKeys: false,
        insertFinalNewline: true,
        preserveArrays: true,
        spacesAroundColon: true,
        spacesAroundComma: true,
        removeTrailingCommas: true,
        compactArrays: false,
        compactObjects: false,
        alignColons: false,
      },
    },
    readable: {
      name: 'Readable',
      description: 'Extra readable with generous spacing and sorted keys',
      options: {
        indentType: 'spaces',
        indentSize: 4,
        sortKeys: true,
        insertFinalNewline: true,
        preserveArrays: false,
        spacesAroundColon: true,
        spacesAroundComma: true,
        removeTrailingCommas: true,
        compactArrays: false,
        compactObjects: false,
        alignColons: false,
      },
    },
    compact: {
      name: 'Compact',
      description: 'Compact but still readable formatting',
      options: {
        indentType: 'spaces',
        indentSize: 2,
        sortKeys: false,
        insertFinalNewline: false,
        preserveArrays: true,
        spacesAroundColon: false,
        spacesAroundComma: false,
        removeTrailingCommas: true,
        compactArrays: true,
        compactObjects: true,
        alignColons: false,
      },
    },
    aligned: {
      name: 'Aligned',
      description: 'Aligned colons for enhanced readability',
      options: {
        indentType: 'spaces',
        indentSize: 2,
        sortKeys: true,
        insertFinalNewline: true,
        preserveArrays: false,
        spacesAroundColon: true,
        spacesAroundComma: true,
        removeTrailingCommas: true,
        compactArrays: false,
        compactObjects: false,
        alignColons: true,
      },
    },
    custom: {
      name: 'Custom',
      description: 'User-defined beautification settings',
      options: {
        indentType: 'spaces',
        indentSize: 2,
        sortKeys: false,
        insertFinalNewline: false,
        preserveArrays: true,
        spacesAroundColon: true,
        spacesAroundComma: true,
        removeTrailingCommas: true,
        compactArrays: false,
        compactObjects: false,
        alignColons: false,
      },
    },
  };

  static readonly DEFAULT_OPTIONS: JsonBeautifierOptions = {
    indentType: 'spaces',
    indentSize: 2,
    sortKeys: false,
    insertFinalNewline: false,
    preserveArrays: true,
    spacesAroundColon: true,
    spacesAroundComma: true,
    removeTrailingCommas: true,
    compactArrays: false,
    compactObjects: false,
    alignColons: false,
  };

  /**
   * Main processing method for JSON beautification
   */
  static process(
    input: JsonBeautifierInput,
  ): JsonBeautifierOutput | JsonBeautifierError {
    try {
      // Validate input
      const validationErrors = JsonBeautifier.validate(input);
      if (validationErrors.length > 0) {
        return {
          message: validationErrors.join(', '),
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        };
      }

      // Parse and validate JSON
      const validationResult = JsonBeautifier.validateJson(input.jsonString);
      if (!validationResult.isValid) {
        return {
          message: `Invalid JSON: ${validationResult.errors.join(', ')}`,
          code: 'INVALID_JSON',
          details: validationResult.errors,
        };
      }

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(input.jsonString);
      } catch (error) {
        const syntaxError = error as SyntaxError;
        const position = JsonBeautifier.extractErrorPosition(
          syntaxError.message,
        );
        return {
          message: `JSON parsing failed: ${syntaxError.message}`,
          code: 'PARSING_ERROR',
          details: syntaxError.message,
          ...position,
        };
      }

      // Process and beautify the JSON (options are guaranteed to exist due to validation)
      const { options } = input;
      if (!options) {
        return {
          message: 'Options are required',
          code: 'VALIDATION_ERROR',
          details: 'Options validation failed',
        };
      }

      const processedJson = JsonBeautifier.processJsonObject(
        parsedJson,
        options,
      );
      const beautifiedResult = JsonBeautifier.beautifyJson(
        processedJson,
        options,
      );

      // Calculate metadata
      const metadata = JsonBeautifier.calculateMetadata(
        input.jsonString,
        beautifiedResult,
        parsedJson,
        validationResult,
      );

      return {
        result: beautifiedResult,
        metadata,
      };
    } catch (error) {
      return {
        message: 'Unexpected beautification error occurred',
        code: 'BEAUTIFYING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate input parameters
   */
  static validate(input: JsonBeautifierInput): string[] {
    const errors: string[] = [];

    if (!input.jsonString && input.jsonString !== '') {
      errors.push('JSON string is required');
    }

    if (input.jsonString.trim() === '') {
      errors.push('JSON string cannot be empty');
    }

    if (!input.options) {
      errors.push('Options are required');
      return errors;
    }

    const { options } = input;

    if (!['spaces', 'tabs'].includes(options.indentType)) {
      errors.push('Indent type must be either "spaces" or "tabs"');
    }

    if (options.indentSize < 0 || options.indentSize > 8) {
      errors.push('Indent size must be between 0 and 8');
    }

    if (options.maxLineLength !== undefined && options.maxLineLength < 20) {
      errors.push('Max line length must be at least 20 characters');
    }

    return errors;
  }

  /**
   * Validate JSON syntax and structure
   */
  static validateJson(jsonString: string): JsonValidationResult {
    const result: JsonValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Basic JSON parsing validation
      JSON.parse(jsonString);

      // Additional validation checks
      const trimmed = jsonString.trim();

      // Check for common issues
      if (trimmed.includes('\n') && trimmed.includes(',\n}')) {
        result.warnings.push(
          'Contains trailing commas that may cause issues in strict JSON parsers',
        );
      }

      if (trimmed.includes("'")) {
        result.warnings.push(
          'Contains single quotes - JSON requires double quotes for strings',
        );
      }

      // Check for potential formatting issues
      if (trimmed.length > 1000000) {
        result.warnings.push(
          'Very large JSON file - beautification may take time',
        );
      }

      // Check for already formatted JSON
      if (trimmed.includes('\n') && trimmed.includes('  ')) {
        result.warnings.push('JSON appears to be already formatted');
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        error instanceof Error ? error.message : 'Invalid JSON syntax',
      );
    }

    return result;
  }

  /**
   * Process JSON object according to options
   */
  private static processJsonObject(
    obj: unknown,
    options: JsonBeautifierOptions,
  ): unknown {
    if (
      options.sortKeys &&
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj)
    ) {
      return JsonBeautifier.sortObjectKeys(
        obj as Record<string, unknown>,
        options,
      );
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => JsonBeautifier.processJsonObject(item, options));
    }

    if (obj !== null && typeof obj === 'object') {
      const processed: Record<string, unknown> = {};
      const originalObj = obj as Record<string, unknown>;

      for (const [key, value] of Object.entries(originalObj)) {
        processed[key] = JsonBeautifier.processJsonObject(value, options);
      }

      return processed;
    }

    return obj;
  }

  /**
   * Sort object keys recursively
   */
  private static sortObjectKeys(
    obj: Record<string, unknown>,
    options: JsonBeautifierOptions,
  ): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      const value = obj[key];
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        sorted[key] = JsonBeautifier.sortObjectKeys(
          value as Record<string, unknown>,
          options,
        );
      } else if (Array.isArray(value)) {
        sorted[key] = value.map((item) =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
            ? JsonBeautifier.sortObjectKeys(
                item as Record<string, unknown>,
                options,
              )
            : item,
        );
      } else {
        sorted[key] = value;
      }
    }

    return sorted;
  }

  /**
   * Beautify JSON according to options
   */
  private static beautifyJson(
    obj: unknown,
    options: JsonBeautifierOptions,
  ): string {
    const { indentType, indentSize, insertFinalNewline } = options;

    // We'll apply custom formatting after JSON.stringify

    // Base indentation
    const baseIndent = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);

    // Use JSON.stringify with custom spacing
    let beautified = JSON.stringify(obj, null, baseIndent);

    // Apply custom formatting options
    beautified = JsonBeautifier.applyCustomFormatting(beautified, options);

    // Remove trailing commas if requested
    if (options.removeTrailingCommas) {
      beautified = JsonBeautifier.removeTrailingCommas(beautified);
    }

    // Add final newline if requested
    if (insertFinalNewline && !beautified.endsWith('\n')) {
      beautified += '\n';
    }

    // Handle max line length if specified
    if (options.maxLineLength) {
      beautified = JsonBeautifier.enforceMaxLineLength(
        beautified,
        options.maxLineLength,
      );
    }

    return beautified;
  }

  /**
   * Apply custom formatting options
   */
  private static applyCustomFormatting(
    json: string,
    options: JsonBeautifierOptions,
  ): string {
    let formatted = json;

    // Handle spaces around colons
    if (options.spacesAroundColon) {
      formatted = formatted.replace(/"/g, (match, offset, string) => {
        // Check if this quote is followed by a colon (it's a key)
        const afterQuote = string.slice(offset + 1);
        if (afterQuote.match(/^\s*:/)) {
          return match; // Keep the quote as is, we'll handle colon spacing separately
        }
        return match;
      });
      formatted = formatted.replace(/"\s*:\s*/g, '": ');
    } else {
      formatted = formatted.replace(/"\s*:\s*/g, '":');
    }

    // Handle spaces around commas
    if (options.spacesAroundComma) {
      formatted = formatted.replace(/,(?!\s*[\n\r])/g, ', ');
    } else {
      formatted = formatted.replace(/,\s+(?!\n)/g, ',');
    }

    // Handle compact arrays
    if (options.compactArrays) {
      formatted = JsonBeautifier.compactArrays(formatted);
    }

    // Handle compact objects
    if (options.compactObjects) {
      formatted = JsonBeautifier.compactObjects(formatted);
    }

    // Handle aligned colons
    if (options.alignColons) {
      formatted = JsonBeautifier.alignColons(formatted);
    }

    return formatted;
  }

  /**
   * Compact arrays to single lines when appropriate
   */
  private static compactArrays(json: string): string {
    const lines = json.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this line starts an array
      if (line?.trim().endsWith('[')) {
        const arrayStart = i;
        let arrayEnd = -1;
        let depth = 0;

        // Find the end of the array
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine?.includes('[')) depth++;
          if (currentLine?.includes(']')) {
            depth--;
            if (depth === 0) {
              arrayEnd = j;
              break;
            }
          }
        }

        // Check if array is simple (only primitives)
        if (arrayEnd !== -1) {
          const arrayContent = lines.slice(arrayStart + 1, arrayEnd);
          const isSimple = arrayContent.every(
            (line) =>
              !line.includes('{') &&
              !line.includes('[') &&
              !line.includes('}') &&
              !line.includes(']'),
          );

          if (isSimple && arrayContent.length <= 5) {
            // Compact the array
            const indent = line.match(/^\s*/)?.[0] ?? '';
            const values = arrayContent
              .map((l) => l.trim().replace(/,$/, ''))
              .filter((l) => l);

            result.push(
              `${indent}[${values.join(', ')}]${line.includes(',') ? ',' : ''}`,
            );
            i = arrayEnd + 1;
            continue;
          }
        }
      }

      if (line !== undefined) {
        result.push(line);
      }
      i++;
    }

    return result.join('\n');
  }

  /**
   * Compact objects to single lines when appropriate
   */
  private static compactObjects(json: string): string {
    const lines = json.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this line starts an object
      if (line?.trim().endsWith('{')) {
        const objectStart = i;
        let objectEnd = -1;
        let depth = 0;

        // Find the end of the object
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine?.includes('{')) depth++;
          if (currentLine?.includes('}')) {
            depth--;
            if (depth === 0) {
              objectEnd = j;
              break;
            }
          }
        }

        // Check if object is simple (only primitive values)
        if (objectEnd !== -1) {
          const objectContent = lines.slice(objectStart + 1, objectEnd);
          const isSimple = objectContent.every(
            (line) =>
              !line.includes('{') &&
              !line.includes('[') &&
              !line.includes('}') &&
              !line.includes(']'),
          );

          if (isSimple && objectContent.length <= 3) {
            // Compact the object
            const indent = line.match(/^\s*/)?.[0] ?? '';
            const pairs = objectContent
              .map((l) => l.trim().replace(/,$/, ''))
              .filter((l) => l);

            result.push(
              `${indent}{${pairs.join(', ')}}${line.includes(',') ? ',' : ''}`,
            );
            i = objectEnd + 1;
            continue;
          }
        }
      }

      if (line !== undefined) {
        result.push(line);
      }
      i++;
    }

    return result.join('\n');
  }

  /**
   * Align colons for better readability
   */
  private static alignColons(json: string): string {
    const lines = json.split('\n');
    const result: string[] = [];

    // Process lines in groups by indentation level
    let currentGroup: string[] = [];
    let currentIndent = '';

    for (const line of lines) {
      const lineIndent = line.match(/^\s*/)?.[0] ?? '';

      if (lineIndent === currentIndent && line.includes(':')) {
        currentGroup.push(line);
      } else {
        // Process the current group
        if (currentGroup.length > 1) {
          result.push(...JsonBeautifier.alignGroupColons(currentGroup));
        } else {
          result.push(...currentGroup);
        }

        // Start new group
        currentGroup = line.includes(':') ? [line] : [];
        currentIndent = lineIndent;

        if (!line.includes(':')) {
          result.push(line);
        }
      }
    }

    // Process the last group
    if (currentGroup.length > 1) {
      result.push(...JsonBeautifier.alignGroupColons(currentGroup));
    } else {
      result.push(...currentGroup);
    }

    return result.join('\n');
  }

  /**
   * Align colons within a group of lines
   */
  private static alignGroupColons(lines: string[]): string[] {
    // Find the longest key
    let maxKeyLength = 0;
    const parsedLines = lines.map((line) => {
      if (!line) return { original: line };
      const match = line.match(/^(\s*)"([^"]+)"\s*:\s*(.+)$/);
      if (match?.[2]) {
        maxKeyLength = Math.max(maxKeyLength, match[2].length);
        return {
          indent: match[1],
          key: match[2],
          value: match[3],
          original: line,
        };
      }
      return { original: line };
    });

    // Reconstruct lines with aligned colons
    return parsedLines.map((parsed) => {
      if (
        'key' in parsed &&
        parsed.key &&
        parsed.indent !== undefined &&
        parsed.value !== undefined
      ) {
        const paddedKey = parsed.key.padEnd(maxKeyLength);
        return `${parsed.indent}"${paddedKey}": ${parsed.value}`;
      }
      return parsed.original;
    });
  }

  /**
   * Remove trailing commas from formatted JSON
   */
  private static removeTrailingCommas(json: string): string {
    // Remove trailing commas before closing braces and brackets
    return json
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/,(\s*\n\s*[}\]])/g, '$1');
  }

  /**
   * Enforce maximum line length
   */
  private static enforceMaxLineLength(json: string, maxLength: number): string {
    const lines = json.split('\n');
    return lines
      .map((line) => {
        if (line.length <= maxLength) {
          return line;
        }
        // For very long lines, this is a simplified approach
        // In production, this would need more sophisticated logic
        return `${line.substring(0, maxLength - 3)}...`;
      })
      .join('\n');
  }

  /**
   * Extract line and column information from JSON parse error
   */
  private static extractErrorPosition(errorMessage: string): {
    line?: number;
    column?: number;
    position?: number;
  } {
    const positionMatch = errorMessage.match(/position (\d+)/i);
    const lineMatch = errorMessage.match(/line (\d+)/i);
    const columnMatch = errorMessage.match(/column (\d+)/i);

    const result: { line?: number; column?: number; position?: number } = {};

    if (positionMatch?.[1]) {
      result.position = parseInt(positionMatch[1], 10);
    }

    if (lineMatch?.[1]) {
      result.line = parseInt(lineMatch[1], 10);
    }

    if (columnMatch?.[1]) {
      result.column = parseInt(columnMatch[1], 10);
    }

    return result;
  }

  /**
   * Calculate beautification metadata
   */
  private static calculateMetadata(
    original: string,
    beautified: string,
    parsedJson: unknown,
    validationResult: JsonValidationResult,
  ): JsonBeautifierOutput['metadata'] {
    const metadata: JsonBeautifierOutput['metadata'] = {
      originalSize: original.length,
      beautifiedSize: beautified.length,
      keyCount: JsonBeautifier.countKeys(parsedJson),
      depth: JsonBeautifier.calculateDepth(parsedJson),
      arrayCount: JsonBeautifier.countArrays(parsedJson),
      objectCount: JsonBeautifier.countObjects(parsedJson),
    };

    if (validationResult.warnings.length > 0) {
      metadata.validationWarnings = validationResult.warnings;
    }

    return metadata;
  }

  /**
   * Count total number of keys in JSON object
   */
  private static countKeys(obj: unknown): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    if (Array.isArray(obj)) {
      return obj.reduce(
        (count, item) => count + JsonBeautifier.countKeys(item),
        0,
      );
    }

    const objectKeys = Object.keys(obj as Record<string, unknown>);
    let count = objectKeys.length;

    for (const key of objectKeys) {
      count += JsonBeautifier.countKeys((obj as Record<string, unknown>)[key]);
    }

    return count;
  }

  /**
   * Count total number of arrays in JSON structure
   */
  private static countArrays(obj: unknown): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    if (Array.isArray(obj)) {
      return (
        1 +
        obj.reduce((count, item) => count + JsonBeautifier.countArrays(item), 0)
      );
    }

    const values = Object.values(obj as Record<string, unknown>);
    return values.reduce(
      (count: number, value) => count + JsonBeautifier.countArrays(value),
      0,
    );
  }

  /**
   * Count total number of objects in JSON structure
   */
  private static countObjects(obj: unknown): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    if (Array.isArray(obj)) {
      return obj.reduce(
        (count: number, item) => count + JsonBeautifier.countObjects(item),
        0,
      );
    }

    // Count this object plus nested objects
    const values = Object.values(obj as Record<string, unknown>);
    return (
      1 +
      values.reduce(
        (count: number, value) => count + JsonBeautifier.countObjects(value),
        0,
      )
    );
  }

  /**
   * Calculate maximum depth of JSON structure
   */
  private static calculateDepth(obj: unknown): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 1;
      return (
        1 + Math.max(...obj.map((item) => JsonBeautifier.calculateDepth(item)))
      );
    }

    const values = Object.values(obj as Record<string, unknown>);
    if (values.length === 0) return 1;

    return (
      1 +
      Math.max(...values.map((value) => JsonBeautifier.calculateDepth(value)))
    );
  }

  /**
   * Get preset configuration by name
   */
  static getPreset(preset: JsonBeautifierPreset): JsonBeautifierOptions {
    return { ...JsonBeautifier.PRESETS[preset].options };
  }

  /**
   * Get all available presets
   */
  static getAllPresets(): Record<
    JsonBeautifierPreset,
    JsonBeautifierPresetConfig
  > {
    return { ...JsonBeautifier.PRESETS };
  }
}
