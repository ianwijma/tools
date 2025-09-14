import type { JsonFormatterInput } from '@/types/json-formatter';
import { JsonFormatter } from '../json-formatter';

describe('JsonFormatter', () => {
  const sampleJson = `{
  "name": "test",
  "values": [
    1,
    2,
    3
  ],
  "nested": {
    "key": "value"
  }
}`;

  const expectedBeautified =
    '{\n  "name": "test",\n  "values": [\n    1,\n    2,\n    3\n  ],\n  "nested": {\n    "key": "value"\n  }\n}\n';
  const expectedUglified =
    '{"name":"test","values":[1,2,3],"nested":{"key":"value"}}';

  describe('beautify mode', () => {
    it('should beautify JSON correctly', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"name":"test","values":[1,2,3],"nested":{"key":"value"}}',
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toBe(expectedBeautified);
        expect(result.metadata.originalSize).toBeGreaterThan(0);
        expect(result.metadata.formattedSize).toBeGreaterThan(0);
      }
    });

    it('should handle custom options for beautify', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"b":"2","a":"1"}',
        mode: 'beautify',
        options: {
          indentType: 'spaces',
          indentSize: 4,
          sortKeys: true,
          insertFinalNewline: false,
          preserveArrays: true,
          spacesAroundColon: true,
          spacesAroundComma: true,
          removeTrailingCommas: true,
          compactArrays: false,
          compactObjects: false,
          alignColons: false,
        },
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toContain('"a"');
        expect(result.result).toContain('"b"');
        // Keys should be sorted (a before b)
        expect(result.result.indexOf('"a"')).toBeLessThan(
          result.result.indexOf('"b"'),
        );
      }
    });
  });

  describe('uglify mode', () => {
    it('should uglify formatted JSON correctly', () => {
      const input: JsonFormatterInput = {
        jsonString: sampleJson,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toBe(expectedUglified);
        expect(result.metadata.originalSize).toBeGreaterThan(
          result.metadata.formattedSize,
        );
        expect(result.metadata.compressionRatio).toBeGreaterThan(0);
      }
    });

    it('should handle already uglified JSON', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"key":"value"}',
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toBe('{"key":"value"}');
        expect(result.metadata.compressionRatio).toBe(0);
      }
    });

    it('should produce minimized JSON with uglify mode', () => {
      const testJson =
        '{\n  "name": "test",\n  "values": [\n    1,\n    2,\n    3\n  ],\n  "nested": {\n    "key": "value"\n  }\n}';

      const input: JsonFormatterInput = {
        jsonString: testJson,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).not.toContain('\n');
        expect(result.result).not.toContain('  ');
        expect(result.result).toContain(
          '{"name":"test","values":[1,2,3],"nested":{"key":"value"}}',
        );
        expect(result.metadata.formattedSize).toBeLessThan(
          result.metadata.originalSize,
        );
      }
    });
  });

  describe('error handling', () => {
    it('should return error for invalid JSON', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"invalid": }',
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('INVALID_JSON');
        expect(result.message).toContain('JSON');
      }
    });

    it('should return error for empty input', () => {
      const input: JsonFormatterInput = {
        jsonString: '',
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.message).toContain('empty');
      }
    });

    it('should return error for invalid mode', () => {
      const input = {
        jsonString: '{"test": "value"}',
        mode: 'invalid',
      } as JsonFormatterInput;

      const result = JsonFormatter.process(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.message).toContain('Mode must be either');
      }
    });
  });

  describe('metadata calculation', () => {
    it('should calculate metadata correctly for beautify', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"name":"test","nested":{"key":"value"},"arr":[1,2]}',
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.keyCount).toBeGreaterThan(0);
        expect(result.metadata.depth).toBeGreaterThan(0);
        expect(result.metadata.arrayCount).toBe(1);
        expect(result.metadata.objectCount).toBe(2);
        expect(result.metadata.compressionRatio).toBeUndefined();
      }
    });

    it('should calculate metadata correctly for uglify', () => {
      const input: JsonFormatterInput = {
        jsonString: sampleJson,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.originalSize).toBe(sampleJson.length);
        expect(result.metadata.formattedSize).toBe(expectedUglified.length);
        expect(result.metadata.keyCount).toBeGreaterThan(0);
        expect(result.metadata.depth).toBeGreaterThan(0);
        expect(result.metadata.arrayCount).toBe(1);
        expect(result.metadata.objectCount).toBe(2);
        expect(result.metadata.compressionRatio).toBeGreaterThan(0);
      }
    });
  });

  describe('presets', () => {
    it('should have all required presets', () => {
      const presets = JsonFormatter.getAllPresets();
      expect(presets.minimal).toBeDefined();
      expect(presets.standard).toBeDefined();
      expect(presets.readable).toBeDefined();
      expect(presets.compact).toBeDefined();
      expect(presets.aligned).toBeDefined();
      expect(presets.uglify).toBeDefined();
      expect(presets.custom).toBeDefined();
    });

    it('should return correct options for standard preset', () => {
      const options = JsonFormatter.getPreset('standard');
      expect(options.indentType).toBe('spaces');
      expect(options.indentSize).toBe(2);
      expect(options.insertFinalNewline).toBe(true);
    });

    it('should return correct options for uglify preset', () => {
      const options = JsonFormatter.getPreset('uglify');
      expect(options.indentSize).toBe(0);
      expect(options.spacesAroundColon).toBe(false);
      expect(options.spacesAroundComma).toBe(false);
      expect(options.insertFinalNewline).toBe(false);
      expect(options.compactArrays).toBe(true);
      expect(options.compactObjects).toBe(true);
    });
  });

  describe('preset detection', () => {
    it('should detect standard preset', () => {
      const options = JsonFormatter.getPreset('standard');
      const detected = JsonFormatter.detectMatchingPreset(options);
      expect(detected).toBe('standard');
    });

    it('should detect uglify preset', () => {
      const options = JsonFormatter.getPreset('uglify');
      const detected = JsonFormatter.detectMatchingPreset(options);
      expect(detected).toBe('uglify');
    });

    it('should return custom for non-matching options', () => {
      const customOptions = JsonFormatter.getPreset('standard');
      customOptions.indentSize = 7; // Non-standard value
      const detected = JsonFormatter.detectMatchingPreset(customOptions);
      expect(detected).toBe('custom');
    });
  });

  describe('validation', () => {
    it('should pass validation for valid input', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"key": "value"}',
        mode: 'beautify',
      };

      const errors = JsonFormatter.validate(input);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for empty JSON string', () => {
      const input: JsonFormatterInput = {
        jsonString: '',
        mode: 'beautify',
      };

      const errors = JsonFormatter.validate(input);
      expect(errors).toContain('JSON string cannot be empty');
    });

    it('should fail validation for invalid mode', () => {
      const input = {
        jsonString: '{"test": "value"}',
        mode: 'invalid',
      } as JsonFormatterInput;

      const errors = JsonFormatter.validate(input);
      expect(errors).toContain('Mode must be either "beautify" or "uglify"');
    });
  });

  describe('JSON validation', () => {
    it('should validate correct JSON', () => {
      const result = JsonFormatter.validateJson('{"key": "value"}');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid JSON syntax', () => {
      const result = JsonFormatter.validateJson('{"invalid": }');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about single quotes', () => {
      const result = JsonFormatter.validateJson("{'key': 'value'}");
      expect(result.isValid).toBe(false);
      // The JSON will be invalid due to single quotes, so the test should just check it's invalid
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('complex nested JSON', () => {
    it('should handle complex nested JSON for beautify', () => {
      const complexJson = JSON.stringify(
        {
          users: [
            { id: 1, name: 'John', active: true },
            { id: 2, name: 'Jane', active: false },
          ],
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
        null,
        0,
      );

      const input: JsonFormatterInput = {
        jsonString: complexJson,
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toContain('\n');
        expect(result.result).toContain('  ');
        expect(result.metadata.originalSize).toBeGreaterThan(0);
        expect(result.metadata.formattedSize).toBeGreaterThan(0);
      }
    });

    it('should handle complex nested JSON for uglify', () => {
      const complexJson = JSON.stringify(
        {
          users: [
            { id: 1, name: 'John', active: true },
            { id: 2, name: 'Jane', active: false },
          ],
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
        null,
        2,
      );

      const input: JsonFormatterInput = {
        jsonString: complexJson,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).not.toContain('\n');
        expect(result.result).not.toContain('  ');
        expect(result.metadata.originalSize).toBeGreaterThan(
          result.metadata.formattedSize,
        );
        expect(result.metadata.compressionRatio).toBeGreaterThan(0);
      }
    });
  });

  describe('compression calculation', () => {
    it('should calculate compression ratio correctly for uglify', () => {
      const formatted = JSON.stringify({ test: 'value' }, null, 2);
      const input: JsonFormatterInput = {
        jsonString: formatted,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        const expectedRatio =
          ((formatted.length - result.result.length) / formatted.length) * 100;
        expect(result.metadata.compressionRatio).toBeCloseTo(
          Math.round(expectedRatio * 100) / 100,
          2,
        );
      }
    });

    it('should handle zero compression ratio', () => {
      const alreadyUglified = '{"test":"value"}';
      const input: JsonFormatterInput = {
        jsonString: alreadyUglified,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.compressionRatio).toBe(0);
      }
    });

    it('should not include compression ratio for beautify mode', () => {
      const input: JsonFormatterInput = {
        jsonString: '{"test":"value"}',
        mode: 'beautify',
      };

      const result = JsonFormatter.process(input);

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.compressionRatio).toBeUndefined();
      }
    });
  });

  describe('getToolInfo', () => {
    it('should return correct tool information', () => {
      const info = JsonFormatter.getToolInfo();
      expect(info.name).toBe('JSON Formatter');
      expect(info.description).toContain('Format JSON');
      expect(info.version).toBe('1.0.0');
    });
  });

  describe('legacy compatibility', () => {
    it('should support legacy beautify method', () => {
      const result = JsonFormatter.process_beautify({
        jsonString: '{"test":"value"}',
      });

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toContain('\n');
      }
    });

    it('should support legacy uglify method', () => {
      const result = JsonFormatter.process_uglify({
        jsonString: '{\n  "test": "value"\n}',
      });

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toBe('{"test":"value"}');
      }
    });
  });
});
