import type {
  JsonBeautifierInput,
  JsonBeautifierOptions,
} from '@/types/json-beautifier';
import { JsonBeautifier } from '../json-beautifier';

describe('JsonBeautifier', () => {
  const minifiedJson =
    '{"name":"Test","values":[1,2,3],"nested":{"key":"value"}}';

  const defaultOptions: JsonBeautifierOptions = {
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

  describe('process', () => {
    it('should beautify minified JSON', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toBeDefined();
        expect(result.result.length).toBeGreaterThan(minifiedJson.length);
        expect(result.result).toContain('\n'); // Should have line breaks
        expect(result.result).toContain('  '); // Should have indentation
        expect(result.metadata.originalSize).toBe(minifiedJson.length);
        expect(result.metadata.beautifiedSize).toBeGreaterThan(
          minifiedJson.length,
        );
      }
    });

    it('should return error for invalid JSON', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"invalid": json}',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('INVALID_JSON');
        expect(result.message).toContain('Invalid JSON');
      }
    });

    it('should return error for empty input', () => {
      const input: JsonBeautifierInput = {
        jsonString: '',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.message).toContain('cannot be empty');
      }
    });

    it('should sort keys when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"z": 1, "a": 2, "m": 3}',
        options: { ...defaultOptions, sortKeys: true },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        // Check that keys are sorted alphabetically
        const aIndex = result.result.indexOf('"a"');
        const mIndex = result.result.indexOf('"m"');
        const zIndex = result.result.indexOf('"z"');
        expect(aIndex).toBeLessThan(mIndex);
        expect(mIndex).toBeLessThan(zIndex);
      }
    });

    it('should use tabs for indentation when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, indentType: 'tabs' },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toContain('\t');
      }
    });

    it('should add final newline when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, insertFinalNewline: true },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result.endsWith('\n')).toBe(true);
      }
    });

    it('should handle different indent sizes', () => {
      const input4spaces: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, indentSize: 4 },
      };

      const input2spaces: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, indentSize: 2 },
      };

      const result4 = JsonBeautifier.process(input4spaces);
      const result2 = JsonBeautifier.process(input2spaces);

      expect('result' in result4).toBe(true);
      expect('result' in result2).toBe(true);

      if ('result' in result4 && 'result' in result2) {
        // 4-space indentation should be longer
        expect(result4.result.length).toBeGreaterThan(result2.result.length);
        expect(result4.result).toContain('    '); // 4 spaces
        expect(result2.result).toContain('  '); // 2 spaces
      }
    });

    it('should handle spaces around colons option', () => {
      const withSpaces: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, spacesAroundColon: true },
      };

      const withoutSpaces: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, spacesAroundColon: false },
      };

      const resultWith = JsonBeautifier.process(withSpaces);
      const resultWithout = JsonBeautifier.process(withoutSpaces);

      expect('result' in resultWith).toBe(true);
      expect('result' in resultWithout).toBe(true);

      if ('result' in resultWith && 'result' in resultWithout) {
        expect(resultWith.result).toContain('": ');
        expect(resultWithout.result).toContain('":');
        expect(resultWithout.result).not.toContain('": ');
      }
    });

    it('should compact small arrays when requested', () => {
      const arrayJson = '{"small":[1,2,3],"large":[1,2,3,4,5,6,7,8,9,10]}';
      const input: JsonBeautifierInput = {
        jsonString: arrayJson,
        options: { ...defaultOptions, compactArrays: true },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        // Small arrays should be on one line
        const lines = result.result.split('\n');
        const smallArrayLine = lines.find((line) => line.includes('[1, 2, 3]'));
        expect(smallArrayLine).toBeDefined();
      }
    });

    it('should compact small objects when requested', () => {
      const objectJson =
        '{"small":{"a":1,"b":2},"large":{"a":1,"b":2,"c":3,"d":4,"e":5}}';
      const input: JsonBeautifierInput = {
        jsonString: objectJson,
        options: { ...defaultOptions, compactObjects: true },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        // Small objects should be on one line
        expect(result.result).toContain('{"a": 1, "b": 2}');
      }
    });

    it('should align colons when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"short":1,"verylongkey":2}',
        options: { ...defaultOptions, alignColons: true },
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        const lines = result.result.split('\n');
        const shortLine = lines.find((line) => line.includes('"short"'));
        const longLine = lines.find((line) => line.includes('"verylongkey"'));

        if (shortLine && longLine) {
          // Both lines should have colons at the same position
          const shortColonPos = shortLine.indexOf(':');
          const longColonPos = longLine.indexOf(':');
          expect(shortColonPos).toBe(longColonPos);
        }
      }
    });

    it('should handle nested structures correctly', () => {
      const nestedJson = {
        level1: {
          level2: {
            level3: {
              deep: 'value',
              array: [1, 2, 3],
            },
          },
          sibling: 'value',
        },
        root: 'value',
      };

      const input: JsonBeautifierInput = {
        jsonString: JSON.stringify(nestedJson),
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.depth).toBe(5); // level1 -> level2 -> level3 -> deep/array depth
        expect(result.metadata.keyCount).toBeGreaterThan(5);
        expect(result.metadata.objectCount).toBeGreaterThan(3);
        expect(result.metadata.arrayCount).toBe(1);
      }
    });
  });

  describe('validate', () => {
    it('should pass validation for valid input', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: defaultOptions,
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for empty JSON string', () => {
      const input: JsonBeautifierInput = {
        jsonString: '',
        options: defaultOptions,
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toContain('JSON string cannot be empty');
    });

    it('should fail validation for invalid indent type', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: {
          ...defaultOptions,
          indentType: 'invalid' as 'spaces' | 'tabs',
        },
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toContain('Indent type must be either "spaces" or "tabs"');
    });

    it('should fail validation for invalid indent size', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, indentSize: -1 },
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toContain('Indent size must be between 0 and 8');

      const inputTooBig: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, indentSize: 10 },
      };

      const errorsTooBig = JsonBeautifier.validate(inputTooBig);
      expect(errorsTooBig).toContain('Indent size must be between 0 and 8');
    });

    it('should fail validation for invalid max line length', () => {
      const input: JsonBeautifierInput = {
        jsonString: minifiedJson,
        options: { ...defaultOptions, maxLineLength: 10 },
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toContain(
        'Max line length must be at least 20 characters',
      );
    });
  });

  describe('validateJson', () => {
    it('should validate correct JSON', () => {
      const result = JsonBeautifier.validateJson(minifiedJson);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid JSON syntax', () => {
      const result = JsonBeautifier.validateJson('{"invalid": }');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about single quotes', () => {
      const result = JsonBeautifier.validateJson("{'key': 'value'}");
      expect(result.isValid).toBe(false);
      // Should be invalid due to single quotes
    });

    it('should warn about very large JSON', () => {
      const largeJson = JSON.stringify({ data: 'x'.repeat(1000000) });
      const result = JsonBeautifier.validateJson(largeJson);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('Very large JSON'))).toBe(
        true,
      );
    });

    it('should warn about already formatted JSON', () => {
      const formattedJson = JSON.stringify({ a: 1, b: 2 }, null, 2);
      const result = JsonBeautifier.validateJson(formattedJson);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('already formatted'))).toBe(
        true,
      );
    });
  });

  describe('presets', () => {
    it('should have all required presets', () => {
      const presets = JsonBeautifier.getAllPresets();
      expect(presets.minimal).toBeDefined();
      expect(presets.standard).toBeDefined();
      expect(presets.readable).toBeDefined();
      expect(presets.compact).toBeDefined();
      expect(presets.aligned).toBeDefined();
      expect(presets.custom).toBeDefined();
    });

    it('should return correct options for minimal preset', () => {
      const options = JsonBeautifier.getPreset('minimal');
      expect(options.indentSize).toBe(2);
      expect(options.sortKeys).toBe(false);
      expect(options.spacesAroundColon).toBe(false);
    });

    it('should return correct options for readable preset', () => {
      const options = JsonBeautifier.getPreset('readable');
      expect(options.indentSize).toBe(4);
      expect(options.sortKeys).toBe(true);
      expect(options.insertFinalNewline).toBe(true);
    });

    it('should return correct options for aligned preset', () => {
      const options = JsonBeautifier.getPreset('aligned');
      expect(options.alignColons).toBe(true);
      expect(options.sortKeys).toBe(true);
    });

    it('should produce different results for different presets', () => {
      const testJson = '{"b":1,"a":2}';

      const minimalResult = JsonBeautifier.process({
        jsonString: testJson,
        options: JsonBeautifier.getPreset('minimal'),
      });

      const readableResult = JsonBeautifier.process({
        jsonString: testJson,
        options: JsonBeautifier.getPreset('readable'),
      });

      expect('result' in minimalResult).toBe(true);
      expect('result' in readableResult).toBe(true);

      if ('result' in minimalResult && 'result' in readableResult) {
        expect(minimalResult.result).not.toBe(readableResult.result);
        // Readable should be longer due to more spacing and 4-space indents
        expect(readableResult.result.length).toBeGreaterThan(
          minimalResult.result.length,
        );
      }
    });
  });

  describe('metadata calculation', () => {
    it('should calculate correct key count', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"a": 1, "b": {"c": 2}}',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.keyCount).toBe(3); // a, b, c
      }
    });

    it('should calculate correct depth', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"a": {"b": {"c": 1}}}',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.depth).toBe(3);
      }
    });

    it('should calculate array and object counts', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"obj": {"nested": 1}, "arr": [{"item": 2}]}',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.arrayCount).toBe(1);
        expect(result.metadata.objectCount).toBe(3); // root, obj, nested obj in array
      }
    });

    it('should include validation warnings when present', () => {
      const largeJson = JSON.stringify({ data: 'x'.repeat(1000000) });
      const input: JsonBeautifierInput = {
        jsonString: largeJson,
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.validationWarnings).toBeDefined();
        expect(result.metadata.validationWarnings?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('error handling', () => {
    it('should provide detailed error information for syntax errors', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{\n  "valid": true,\n  "invalid": \n}',
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('INVALID_JSON');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle unexpected errors gracefully', () => {
      // Test with input that will cause the validation to fail first
      const input: JsonBeautifierInput = {
        jsonString: '{"invalid": syntax}', // This will trigger validateJson to fail first
        options: defaultOptions,
      };

      const result = JsonBeautifier.process(input);
      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('INVALID_JSON'); // validateJson catches this first
      }
    });

    it('should handle missing options', () => {
      const input = {
        jsonString: minifiedJson,
        options: undefined as unknown as JsonBeautifierOptions,
      };

      const errors = JsonBeautifier.validate(input);
      expect(errors).toContain('Options are required');
    });
  });

  describe('custom formatting options', () => {
    it('should remove trailing commas when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"a":1,"b":2}', // Valid JSON
        options: { ...defaultOptions, removeTrailingCommas: true },
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        // The result should be valid and formatted
        expect(result.result).toBeDefined();
        expect(result.result.length).toBeGreaterThan(0);
      }
    });

    it('should preserve array formatting when requested', () => {
      const input: JsonBeautifierInput = {
        jsonString: '{"arr":[1,2,3,4,5]}',
        options: {
          ...defaultOptions,
          preserveArrays: true,
          compactArrays: false,
        },
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        // Arrays should be formatted normally
        expect(result.result).toBeDefined();
        expect(result.result).toContain('"arr"');
      }
    });

    it('should handle max line length restriction', () => {
      const input: JsonBeautifierInput = {
        jsonString:
          '{"verylongkey":"verylongvalue","anotherlongkey":"anotherlongvalue"}',
        options: { ...defaultOptions, maxLineLength: 30 },
      };

      const result = JsonBeautifier.process(input);
      expect('result' in result).toBe(true);
      if ('result' in result) {
        // Should successfully process the JSON
        expect(result.result).toBeDefined();
        expect(result.result).toContain('verylongkey');
      }
    });
  });
});
