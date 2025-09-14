// JSON Formatter tool implementation - Unified library for beautifying and uglifying JSON
import type {
  JsonFormatterError,
  JsonFormatterInput,
  JsonFormatterOptions,
  JsonFormatterOutput,
  JsonFormatterPreset,
  JsonFormatterPresetConfig,
  JsonValidationResult,
} from '@/types/json-formatter';

// biome-ignore lint/complexity/noStaticOnlyClass: JsonFormatter follows a utility class pattern
export class JsonFormatter {
  // Preset configurations for common formatting scenarios
  static readonly PRESETS: Record<
    JsonFormatterPreset,
    JsonFormatterPresetConfig
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
    uglify: {
      name: 'Uglify',
      description: 'Minimize JSON by removing all unnecessary whitespace',
      options: {
        indentType: 'spaces',
        indentSize: 0,
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
    custom: {
      name: 'Custom',
      description: 'User-defined formatting settings',
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

  static readonly DEFAULT_OPTIONS: JsonFormatterOptions = {
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
   * Process and format JSON string
   */
  static process(
    input: JsonFormatterInput,
  ): JsonFormatterOutput | JsonFormatterError {
    try {
      // Validate input
      const validationErrors = JsonFormatter.validate(input);
      if (validationErrors.length > 0) {
        return {
          message: validationErrors.join('; '),
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        };
      }

      // Use provided options or default based on mode
      let options: JsonFormatterOptions;
      if (input.options) {
        options = input.options;
      } else {
        // Use appropriate default preset based on mode
        options = JsonFormatter.getPreset(
          input.mode === 'uglify' ? 'uglify' : 'standard',
        );
      }

      // Validate JSON syntax
      const validationResult = JsonFormatter.validateJson(input.jsonString);
      if (!validationResult.isValid) {
        return {
          message: `Invalid JSON: ${validationResult.errors.join(', ')}`,
          code: 'INVALID_JSON',
          details: validationResult.errors,
        };
      }

      // Parse JSON
      const parsedJson = JSON.parse(input.jsonString);

      // Process JSON object with provided options
      const processedJson = JsonFormatter.processJsonObject(
        parsedJson,
        options,
      );

      // Format the JSON
      const formattedResult = JsonFormatter.formatJson(processedJson, options);

      // Calculate metadata
      const metadata = JsonFormatter.calculateMetadata(
        input.jsonString,
        formattedResult,
        parsedJson,
        validationResult,
        input.mode,
      );

      return { result: formattedResult, metadata };
    } catch (error: unknown) {
      return {
        message: 'Unexpected error during JSON formatting',
        code: 'FORMATTING_ERROR',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process JSON object with provided options
   */
  private static processJsonObject(
    obj: unknown,
    options: JsonFormatterOptions,
  ): unknown {
    if (
      options.sortKeys &&
      typeof obj === 'object' &&
      obj !== null &&
      !Array.isArray(obj)
    ) {
      const sortedObj: Record<string, unknown> = {};
      const keys = Object.keys(obj as Record<string, unknown>).sort();
      for (const key of keys) {
        sortedObj[key] = JsonFormatter.processJsonObject(
          (obj as Record<string, unknown>)[key],
          options,
        );
      }
      return sortedObj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => JsonFormatter.processJsonObject(item, options));
    }

    if (typeof obj === 'object' && obj !== null) {
      const processedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        processedObj[key] = JsonFormatter.processJsonObject(value, options);
      }
      return processedObj;
    }

    return obj;
  }

  /**
   * Format JSON with the provided options
   */
  private static formatJson(
    obj: unknown,
    options: JsonFormatterOptions,
  ): string {
    const { indentType, indentSize, insertFinalNewline } = options;

    // Base indentation
    const baseIndent = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);

    // Use JSON.stringify with custom spacing
    let formatted = JSON.stringify(obj, null, baseIndent);

    // Apply custom formatting options
    formatted = JsonFormatter.applyCustomFormatting(formatted, options);

    // Remove trailing commas if requested
    if (options.removeTrailingCommas) {
      formatted = JsonFormatter.removeTrailingCommas(formatted);
    }

    // Add final newline if requested
    if (insertFinalNewline && !formatted.endsWith('\n')) {
      formatted += '\n';
    }

    // Handle max line length if specified
    if (options.maxLineLength) {
      formatted = JsonFormatter.enforceMaxLineLength(
        formatted,
        options.maxLineLength,
      );
    }

    return formatted;
  }

  /**
   * Apply custom formatting options
   */
  private static applyCustomFormatting(
    json: string,
    options: JsonFormatterOptions,
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
      formatted = JsonFormatter.compactArrays(formatted);
    }

    // Handle compact objects
    if (options.compactObjects) {
      formatted = JsonFormatter.compactObjects(formatted);
    }

    // Handle aligned colons
    if (options.alignColons) {
      formatted = JsonFormatter.alignColons(formatted);
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
            (arrayLine) =>
              arrayLine &&
              !arrayLine.includes('{') &&
              !arrayLine.includes('[') &&
              arrayLine.trim() !== '',
          );

          if (isSimple && arrayContent.length <= 5) {
            // Compact the array to a single line
            const indent = line ? (line.match(/^(\s*)/)?.[1] ?? '') : '';
            const values = arrayContent
              .map((arrayLine) =>
                arrayLine ? arrayLine.trim().replace(/,$/, '') : '',
              )
              .filter(Boolean)
              .join(', ');
            result.push(`${indent}[${values}]${line.includes(',') ? ',' : ''}`);
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

        // Check if object is simple (only primitive values, no nested objects/arrays)
        if (objectEnd !== -1) {
          const objectContent = lines.slice(objectStart + 1, objectEnd);
          const isSimple = objectContent.every(
            (objectLine) =>
              objectLine &&
              !objectLine.includes('{') &&
              !objectLine.includes('[') &&
              objectLine.trim() !== '',
          );

          if (isSimple && objectContent.length <= 3) {
            // Compact the object to a single line
            const indent = line ? (line.match(/^(\s*)/)?.[1] ?? '') : '';
            const properties = objectContent
              .map((objectLine) =>
                objectLine ? objectLine.trim().replace(/,$/, '') : '',
              )
              .filter(Boolean)
              .join(', ');
            result.push(
              `${indent}{${properties}}${line.includes(',') ? ',' : ''}`,
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
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    // Group lines into blocks (separated by empty lines or structural elements)
    for (const line of lines) {
      if (
        !line ||
        line.trim() === '' ||
        line.trim() === '{' ||
        line.trim() === '}' ||
        line.trim() === '[' ||
        line.trim() === ']' ||
        line.includes('[') ||
        line.includes(']') ||
        line.includes('{') ||
        line.includes('}')
      ) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
        if (line) {
          blocks.push([line]);
        }
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    // Align colons within each block
    const alignedBlocks = blocks.map((block) => {
      if (block.length <= 1) return block;

      // Find the maximum position of colons in this block
      let maxColonPos = 0;
      const colonPositions: number[] = [];

      for (const blockLine of block) {
        const colonMatch = blockLine.match(/^(\s*"[^"]*")\s*:/);
        if (colonMatch) {
          const colonPos = colonMatch[1]?.length ?? 0;
          maxColonPos = Math.max(maxColonPos, colonPos);
          colonPositions.push(colonPos);
        } else {
          colonPositions.push(-1);
        }
      }

      // Align all lines in this block
      return block.map((blockLine, blockIndex) => {
        const colonPos = colonPositions[blockIndex];
        if (colonPos === undefined || colonPos === -1) return blockLine;

        const colonMatch = blockLine.match(/^(\s*"[^"]*")(\s*)(:.*)$/);
        if (colonMatch) {
          const beforeColon = colonMatch[1];
          const afterColon = colonMatch[3];
          const spacesToAdd = maxColonPos - (beforeColon?.length ?? 0);
          return beforeColon + ' '.repeat(spacesToAdd) + afterColon;
        }
        return blockLine;
      });
    });

    return alignedBlocks.flat().join('\n');
  }

  /**
   * Remove trailing commas from JSON
   */
  private static removeTrailingCommas(json: string): string {
    // Remove trailing commas before closing brackets and braces
    return json.replace(/,(\s*[}\]])/g, '$1');
  }

  /**
   * Enforce maximum line length
   */
  private static enforceMaxLineLength(json: string, maxLength: number): string {
    const lines = json.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      if (line && line.length > maxLength) {
        // Try to break long lines at commas or other natural break points
        const indent = line.match(/^(\s*)/)?.[1] ?? '';
        const content = line.slice(indent.length);

        if (content.includes(',')) {
          // Break at commas
          const parts = content.split(',');
          let currentLine = indent;

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const addition = i === 0 ? part : `,${part}`;

            if (
              addition &&
              currentLine.length + addition.length > maxLength &&
              currentLine !== indent
            ) {
              result.push(currentLine);
              currentLine = indent + addition.slice(1); // Remove leading comma
            } else {
              currentLine += addition;
            }
          }

          if (currentLine !== indent) {
            result.push(currentLine);
          }
        } else {
          // If we can't break it nicely, just keep the long line
          result.push(line);
        }
      } else if (line) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Calculate metadata about the JSON formatting
   */
  private static calculateMetadata(
    originalJson: string,
    formattedJson: string,
    parsedJson: unknown,
    validationResult: JsonValidationResult,
    mode: 'beautify' | 'uglify',
  ): JsonFormatterOutput['metadata'] {
    const originalSize = originalJson.length;
    const formattedSize = formattedJson.length;

    const metadata: JsonFormatterOutput['metadata'] = {
      originalSize,
      formattedSize,
      keyCount: JsonFormatter.countKeys(parsedJson),
      depth: JsonFormatter.calculateDepth(parsedJson),
      arrayCount: JsonFormatter.countArrays(parsedJson),
      objectCount: JsonFormatter.countObjects(parsedJson),
    };

    // Add compression ratio for uglify mode
    if (mode === 'uglify' && originalSize > 0) {
      metadata.compressionRatio =
        Math.round(
          ((originalSize - formattedSize) / originalSize) * 100 * 100,
        ) / 100;
    }

    // Add validation warnings if present
    if (validationResult.warnings.length > 0) {
      metadata.validationWarnings = validationResult.warnings;
    }

    return metadata;
  }

  /**
   * Count the number of keys in the JSON object
   */
  private static countKeys(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    if (Array.isArray(obj)) {
      return obj.reduce(
        (count, item) => count + JsonFormatter.countKeys(item),
        0,
      );
    }

    let count = Object.keys(obj as Record<string, unknown>).length;
    for (const value of Object.values(obj as Record<string, unknown>)) {
      count += JsonFormatter.countKeys(value);
    }

    return count;
  }

  /**
   * Calculate the maximum depth of the JSON structure
   */
  private static calculateDepth(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    if (Array.isArray(obj)) {
      return 1 + Math.max(0, ...obj.map(JsonFormatter.calculateDepth));
    }

    const depths = Object.values(obj as Record<string, unknown>).map(
      JsonFormatter.calculateDepth,
    );
    return 1 + Math.max(0, ...depths);
  }

  /**
   * Count arrays in the JSON structure
   */
  private static countArrays(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    if (Array.isArray(obj)) {
      return (
        1 +
        obj.reduce((count, item) => count + JsonFormatter.countArrays(item), 0)
      );
    }

    return Object.values(obj as Record<string, unknown>).reduce(
      (count: number, value) => count + JsonFormatter.countArrays(value),
      0,
    );
  }

  /**
   * Count objects in the JSON structure
   */
  private static countObjects(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    if (Array.isArray(obj)) {
      return obj.reduce(
        (count, item) => count + JsonFormatter.countObjects(item),
        0,
      );
    }

    return (
      1 +
      Object.values(obj as Record<string, unknown>).reduce(
        (count: number, value) => count + JsonFormatter.countObjects(value),
        0,
      )
    );
  }

  /**
   * Validate JsonFormatter input
   */
  static validate(input: JsonFormatterInput): string[] {
    const errors: string[] = [];

    if (!input.jsonString || input.jsonString.trim() === '') {
      errors.push('JSON string cannot be empty');
    }

    if (!['beautify', 'uglify'].includes(input.mode)) {
      errors.push('Mode must be either "beautify" or "uglify"');
    }

    if (input.options && typeof input.options === 'object') {
      const { options } = input;

      if (!['spaces', 'tabs'].includes(options.indentType)) {
        errors.push('Indent type must be either "spaces" or "tabs"');
      }

      if (options.indentSize < 0 || options.indentSize > 8) {
        errors.push('Indent size must be between 0 and 8');
      }

      if (options.maxLineLength && options.maxLineLength < 20) {
        errors.push('Max line length must be at least 20 characters');
      }
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
      JSON.parse(jsonString);
    } catch (error: unknown) {
      result.isValid = false;
      if (error instanceof SyntaxError) {
        result.errors.push(`Syntax error: ${error.message}`);
      } else {
        result.errors.push('Invalid JSON format');
      }
      return result;
    }

    // Additional validation warnings
    if (jsonString.length > 1000000) {
      result.warnings.push('Large JSON file (>1MB) may impact performance');
    }

    if (jsonString.includes("'")) {
      result.warnings.push('JSON should use double quotes, not single quotes');
    }

    if (jsonString.includes('\t')) {
      result.warnings.push('JSON contains tab characters');
    }

    return result;
  }

  /**
   * Get options for a specific preset
   */
  static getPreset(preset: JsonFormatterPreset): JsonFormatterOptions {
    return { ...JsonFormatter.PRESETS[preset].options };
  }

  /**
   * Get all available presets
   */
  static getAllPresets(): Record<
    JsonFormatterPreset,
    JsonFormatterPresetConfig
  > {
    return { ...JsonFormatter.PRESETS };
  }

  /**
   * Detect which preset matches the given options
   */
  static detectMatchingPreset(
    options: JsonFormatterOptions,
  ): JsonFormatterPreset {
    for (const [presetName, presetConfig] of Object.entries(
      JsonFormatter.PRESETS,
    ) as Array<[JsonFormatterPreset, JsonFormatterPresetConfig]>) {
      const presetOptions = presetConfig.options;
      const isMatch = Object.keys(presetOptions).every((key) => {
        const optionKey = key as keyof JsonFormatterOptions;
        return presetOptions[optionKey] === options[optionKey];
      });

      if (isMatch) {
        return presetName;
      }
    }
    return 'custom';
  }

  /**
   * Get tool metadata
   */
  static getToolInfo(): {
    name: string;
    description: string;
    version: string;
  } {
    return {
      name: 'JSON Formatter',
      description:
        'Format JSON for beautification or minification with customizable options',
      version: '1.0.0',
    };
  }

  // Legacy compatibility methods for JsonBeautifier
  static process_beautify(input: {
    jsonString: string;
    options?: JsonFormatterOptions;
  }): JsonFormatterOutput | JsonFormatterError {
    const formatterInput: JsonFormatterInput = {
      jsonString: input.jsonString,
      mode: 'beautify',
    };
    if (input.options) {
      formatterInput.options = input.options;
    }
    return JsonFormatter.process(formatterInput);
  }

  // Legacy compatibility methods for JsonUglifier
  static process_uglify(input: {
    jsonString: string;
  }): JsonFormatterOutput | JsonFormatterError {
    return JsonFormatter.process({
      jsonString: input.jsonString,
      mode: 'uglify',
      options: JsonFormatter.getPreset('uglify'),
    });
  }
}
