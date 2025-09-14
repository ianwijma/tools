/* eslint-disable no-unused-vars */
// Tests for ImageConverter functionality

import type {
  ImageConverterInput,
  ImageConverterOptions,
  ImageFormat,
} from '@/types/image-converter';
import { ImageConverter } from '../image-converter';

// Mock DOM APIs for testing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(),
  toDataURL: jest.fn(),
  toBlob: jest.fn(),
};

const mockContext = {
  fillStyle: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
};

const mockURL = {
  createObjectURL: jest.fn(),
  revokeObjectURL: jest.fn(),
};

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  width: 1920,
  height: 1080,
};

// Mock the entire HTMLCanvasElement prototype
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockReturnValue(mockContext),
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: jest.fn().mockImplementation((format: string) => {
    switch (format) {
      case 'image/webp':
        return 'data:image/webp;base64,test';
      case 'image/avif':
        return 'data:image/avif;base64,test';
      case 'image/bmp':
        return 'data:image/bmp;base64,test';
      default:
        return 'data:image/png;base64,test';
    }
  }),
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: jest
    .fn()
    .mockImplementation(
      (
        callback: (_blob: Blob | null) => void,
        _type: string = 'image/png',
        quality?: number,
      ) => {
        // Create a proper mock blob with size property
        const mockBlob = {
          size: quality ? Math.floor(1024 * quality) : 1024, // Use quality parameter
          type: _type,
          slice: jest.fn(),
          stream: jest.fn(),
          text: jest.fn(),
          arrayBuffer: jest.fn(),
        } as unknown as Blob;
        callback(mockBlob);
      },
    ),
  writable: true,
});

// Setup DOM mocks
beforeAll(() => {
  global.document = {
    createElement: jest.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
        };
      }
      return {};
    }),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
  } as unknown as Document;

  global.URL = mockURL as unknown as typeof URL;
  global.Image = jest.fn(() => mockImage) as unknown as typeof Image;

  mockCanvas.getContext.mockReturnValue(mockContext);
  // Mock toDataURL to return appropriate format based on input
  mockCanvas.toDataURL.mockImplementation((format: string) => {
    switch (format) {
      case 'image/webp':
        return 'data:image/webp;base64,test';
      case 'image/avif':
        return 'data:image/avif;base64,test';
      case 'image/bmp':
        return 'data:image/bmp;base64,test';
      default:
        return 'data:image/png;base64,test';
    }
  });
  mockURL.createObjectURL.mockReturnValue('blob:test-url');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockImage.width = 1920;
  mockImage.height = 1080;
});

describe('ImageConverter', () => {
  describe('PRESETS', () => {
    it('should have all required presets', () => {
      const presets = ImageConverter.getAllPresets();

      expect(presets).toHaveProperty('web-optimized');
      expect(presets).toHaveProperty('high-quality');
      expect(presets).toHaveProperty('small-size');
      expect(presets).toHaveProperty('thumbnail');
      expect(presets).toHaveProperty('favicon');
      expect(presets).toHaveProperty('modern-efficient');
      expect(presets).toHaveProperty('retina-display');
      expect(presets).toHaveProperty('social-media');
      expect(presets).toHaveProperty('email-attachment');
      expect(presets).toHaveProperty('print-quality');
      expect(presets).toHaveProperty('logo-transparent');
      expect(presets).toHaveProperty('app-icon');
      expect(presets).toHaveProperty('ultra-compressed');
      expect(presets).toHaveProperty('custom');
    });

    it('should return valid preset configurations', () => {
      const webOptimized = ImageConverter.getPreset('web-optimized');
      expect(webOptimized).toHaveProperty('targetFormat', 'jpeg');
      expect(webOptimized).toHaveProperty('quality', 0.85);
      expect(webOptimized).toHaveProperty('width', 1920);
      expect(webOptimized).toHaveProperty('maintainAspectRatio', true);

      const modernEfficient = ImageConverter.getPreset('modern-efficient');
      expect(modernEfficient).toHaveProperty('targetFormat', 'avif');
      expect(modernEfficient).toHaveProperty('quality', 0.8);

      const socialMedia = ImageConverter.getPreset('social-media');
      expect(socialMedia).toHaveProperty('targetFormat', 'jpeg');
      expect(socialMedia).toHaveProperty('quality', 0.9);
      expect(socialMedia).toHaveProperty('width', 1200);

      const appIcon = ImageConverter.getPreset('app-icon');
      expect(appIcon).toHaveProperty('targetFormat', 'png');
      expect(appIcon).toHaveProperty('width', 512);
      expect(appIcon).toHaveProperty('height', 512);
      expect(appIcon).toHaveProperty('maintainAspectRatio', false);

      const ultraCompressed = ImageConverter.getPreset('ultra-compressed');
      expect(ultraCompressed).toHaveProperty('targetFormat', 'avif');
      expect(ultraCompressed).toHaveProperty('quality', 0.6);
      expect(ultraCompressed).toHaveProperty('width', 720);
    });
  });

  describe('FORMAT_SUPPORT', () => {
    it('should define support for all image formats', () => {
      const formats: ImageFormat[] = [
        'jpeg',
        'png',
        'webp',
        'avif',
        'bmp',
        'ico',
      ];

      formats.forEach((format) => {
        expect(ImageConverter.FORMAT_SUPPORT).toHaveProperty(format);
        expect(ImageConverter.FORMAT_SUPPORT[format]).toHaveProperty('read');
        expect(ImageConverter.FORMAT_SUPPORT[format]).toHaveProperty('write');
        expect(ImageConverter.FORMAT_SUPPORT[format]).toHaveProperty(
          'transparency',
        );
        expect(ImageConverter.FORMAT_SUPPORT[format]).toHaveProperty(
          'compression',
        );
        expect(ImageConverter.FORMAT_SUPPORT[format]).toHaveProperty('quality');
      });
    });
  });

  describe('checkBrowserSupport', () => {
    it('should check browser canvas support', () => {
      const support = ImageConverter.checkBrowserSupport();

      expect(support).toHaveProperty('canvas');
      expect(support).toHaveProperty('formats');
      expect(support.formats).toHaveProperty('jpeg');
      expect(support.formats).toHaveProperty('png');
      expect(support.formats).toHaveProperty('webp');
      expect(support.formats).toHaveProperty('avif');
    });

    it('should return false for canvas when context is not available', () => {
      // Override the prototype mock temporarily
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);

      const support = ImageConverter.checkBrowserSupport();

      expect(support.canvas).toBe(false);

      // Restore the mock
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
  });

  describe('validate', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File(['test'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    it('should return error for empty files array', () => {
      const input: ImageConverterInput = {
        files: [],
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(validation.errors).toContain('No files provided for conversion');
    });

    it('should return error for too many files', () => {
      const files = Array.from({ length: 101 }, (_, i) =>
        createMockFile(`test${i}.jpg`, 'image/jpeg', 1024),
      );

      const input: ImageConverterInput = {
        files,
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(
        validation.errors.some((error) => error.includes('Too many')),
      ).toBe(true);
    });

    it('should return error for files that are too large', () => {
      const largeFile = createMockFile(
        'large.jpg',
        'image/jpeg',
        100 * 1024 * 1024,
      ); // 100MB

      const input: ImageConverterInput = {
        files: [largeFile],
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(
        validation.errors.some((error) => error.includes('too large')),
      ).toBe(true);
    });

    it('should return warning for unsupported file types', () => {
      const unsupportedFile = createMockFile('test.txt', 'text/plain', 1024);

      const input: ImageConverterInput = {
        files: [unsupportedFile],
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(
        validation.errors.some((error) =>
          error.includes('No supported image files found'),
        ),
      ).toBe(true);
    });

    it('should return warnings for unsupported files when there are also supported files', () => {
      const supportedFile = createMockFile('test.jpg', 'image/jpeg', 1024);
      const unsupportedFile = createMockFile('test.txt', 'text/plain', 1024);

      const input: ImageConverterInput = {
        files: [supportedFile, unsupportedFile],
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(validation.errors).toHaveLength(0);
      expect(
        validation.warnings.some((warning) => warning.includes('test.txt')),
      ).toBe(true);
      expect(
        validation.warnings.some((warning) =>
          warning.includes('will be skipped'),
        ),
      ).toBe(true);
    });

    it('should return error for invalid quality range', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const input: ImageConverterInput = {
        files: [file],
        targetFormat: 'jpeg',
        quality: 1.5, // Invalid quality > 1.0
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(
        validation.errors.some((error) =>
          error.includes('Quality must be between'),
        ),
      ).toBe(true);
    });

    it('should return error for dimensions that are too large', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const input: ImageConverterInput = {
        files: [file],
        targetFormat: 'jpeg',
        width: 40000, // Exceeds new max width of 32768
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(
        validation.errors.some((error) => error.includes('Width too large')),
      ).toBe(true);
    });

    it('should return no errors for valid input', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);

      const input: ImageConverterInput = {
        files: [file],
        targetFormat: 'jpeg',
        quality: 0.85,
        width: 1920,
        maintainAspectRatio: true,
      };

      const validation = ImageConverter.validate(input);

      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('convertSingleFile', () => {
    const createMockFile = (name: string, type: string): File => {
      return new File(['test'], name, { type });
    };

    const mockOptions: ImageConverterOptions = {
      targetFormat: 'jpeg',
      quality: 0.85,
      maintainAspectRatio: true,
      backgroundColor: '#ffffff',
    };

    it('should successfully convert a file', async () => {
      const file = createMockFile('test.png', 'image/png');

      // Use the default mock implementation (which returns a mocked blob)
      // No need to override it

      // Simulate successful image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await ImageConverter.convertSingleFile(file, mockOptions);

      expect(result.success).toBe(true);
      expect(result.outputBlob).toBeDefined();
      expect(result.outputSize).toBe(870); // Size from our mock (1024 * 0.85 quality)
    });

    it('should handle image load errors', async () => {
      const file = createMockFile('test.png', 'image/png');

      // Simulate image load error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror(new Event('error'));
        }
      }, 0);

      const result = await ImageConverter.convertSingleFile(file, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load image');
    });

    it('should handle canvas conversion errors', async () => {
      const file = createMockFile('test.png', 'image/png');

      // Override the toBlob mock to simulate failure
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = jest
        .fn()
        .mockImplementation((callback: (_blob: Blob | null) => void) => {
          callback(null); // Simulate failure
        });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await ImageConverter.convertSingleFile(file, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to convert canvas to blob');

      // Restore the mock
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    });

    it('should call progress callback with correct values', async () => {
      const file = createMockFile('test.png', 'image/png');
      const mockBlob = new Blob(['converted'], { type: 'image/jpeg' });
      const progressCallback = jest.fn();

      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      }, 0);

      await ImageConverter.convertSingleFile(
        file,
        mockOptions,
        progressCallback,
      );

      expect(progressCallback).toHaveBeenCalledWith(0);
      expect(progressCallback).toHaveBeenCalledWith(25);
      expect(progressCallback).toHaveBeenCalledWith(50);
      expect(progressCallback).toHaveBeenCalledWith(75);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });
  });

  describe('calculateOutputDimensions', () => {
    const options: ImageConverterOptions = {
      targetFormat: 'jpeg',
      quality: 0.85,
      maintainAspectRatio: true,
      backgroundColor: '#ffffff',
    };

    it('should return original dimensions when no constraints', () => {
      const result = (
        ImageConverter as typeof ImageConverter & {
          calculateOutputDimensions: (
            width: number,
            height: number,
            options: ImageConverterOptions,
          ) => { width: number; height: number };
        }
      ).calculateOutputDimensions(1920, 1080, {
        ...options,
        width: undefined,
        height: undefined,
      });

      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('should maintain aspect ratio when only width specified', () => {
      const result = (
        ImageConverter as typeof ImageConverter & {
          calculateOutputDimensions: (
            width: number,
            height: number,
            options: ImageConverterOptions,
          ) => { width: number; height: number };
        }
      ).calculateOutputDimensions(1920, 1080, {
        ...options,
        width: 960,
        height: undefined,
      });

      expect(result).toEqual({ width: 960, height: 540 });
    });

    it('should maintain aspect ratio when only height specified', () => {
      const result = (
        ImageConverter as typeof ImageConverter & {
          calculateOutputDimensions: (
            width: number,
            height: number,
            options: ImageConverterOptions,
          ) => { width: number; height: number };
        }
      ).calculateOutputDimensions(1920, 1080, {
        ...options,
        width: undefined,
        height: 540,
      });

      expect(result).toEqual({ width: 960, height: 540 });
    });

    it('should fit within constraints when both dimensions specified', () => {
      const result = (
        ImageConverter as typeof ImageConverter & {
          calculateOutputDimensions: (
            width: number,
            height: number,
            options: ImageConverterOptions,
          ) => { width: number; height: number };
        }
      ).calculateOutputDimensions(1920, 1080, {
        ...options,
        width: 800,
        height: 800,
      });

      // Should limit by width since original is wider
      expect(result.width).toBe(800);
      expect(result.height).toBe(450); // 800 * (1080/1920)
    });

    it('should not maintain aspect ratio when disabled', () => {
      const result = (
        ImageConverter as typeof ImageConverter & {
          calculateOutputDimensions: (
            width: number,
            height: number,
            options: ImageConverterOptions,
          ) => { width: number; height: number };
        }
      ).calculateOutputDimensions(1920, 1080, {
        ...options,
        width: 800,
        height: 800,
        maintainAspectRatio: false,
      });

      expect(result).toEqual({ width: 800, height: 800 });
    });
  });
  /* eslint-enable no-unused-vars */

  describe('utility functions', () => {
    it('should get correct file extension for format', () => {
      expect(ImageConverter.getFileExtension('jpeg')).toBe('jpg');
      expect(ImageConverter.getFileExtension('png')).toBe('png');
      expect(ImageConverter.getFileExtension('webp')).toBe('webp');
      expect(ImageConverter.getFileExtension('bmp')).toBe('bmp');
      expect(ImageConverter.getFileExtension('ico')).toBe('ico');
    });

    it('should format file sizes correctly', () => {
      expect(ImageConverter.formatFileSize(0)).toBe('0 Bytes');
      expect(ImageConverter.formatFileSize(1024)).toBe('1.0 KB');
      expect(ImageConverter.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(ImageConverter.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(ImageConverter.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should return supported formats based on browser capabilities', () => {
      // Mock browser support
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,test'); // WebP supported

      const supportedFormats = ImageConverter.getSupportedFormats();

      expect(supportedFormats).toContain('jpeg');
      expect(supportedFormats).toContain('png');
      expect(Array.isArray(supportedFormats)).toBe(true);
    });
  });

  describe('convertFiles (batch processing)', () => {
    const createMockFile = (name: string, type: string): File => {
      return new File(['test'], name, { type });
    };

    it('should return validation error for invalid input', async () => {
      const input: ImageConverterInput = {
        files: [], // Empty files array
        targetFormat: 'jpeg',
        maintainAspectRatio: true,
      };

      const result = await ImageConverter.convertFiles(input);

      expect('message' in result).toBe(true);
      if ('message' in result) {
        expect(result.message).toContain('No files provided');
        expect(result.code).toBe('INVALID_FILE');
      }
    });

    it('should process multiple files successfully', async () => {
      const files = [
        createMockFile('test1.png', 'image/png'),
        createMockFile('test2.jpg', 'image/jpeg'),
      ];

      const input: ImageConverterInput = {
        files,
        targetFormat: 'jpeg',
        quality: 0.85,
        maintainAspectRatio: true,
      };

      const mockBlob = new Blob(['converted'], { type: 'image/jpeg' });

      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      // Mock successful image loads for all files
      let loadCallCount = 0;
      const originalImage = global.Image;
      global.Image = jest.fn(() => {
        const img = { ...mockImage };
        setTimeout(() => {
          if (img.onload) {
            img.onload(new Event('load'));
          }
          loadCallCount++;
        }, loadCallCount * 10); // Stagger the loads
        return img;
      }) as unknown as typeof Image;

      const progressCallback = jest.fn();
      const fileCompleteCallback = jest.fn();

      const result = await ImageConverter.convertFiles(
        input,
        progressCallback,
        fileCompleteCallback,
      );

      // Restore original Image constructor
      global.Image = originalImage;

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.metadata.totalFiles).toBe(2);
        expect(result.metadata.successCount).toBe(2);
        expect(result.metadata.errorCount).toBe(0);
        expect(result.metadata.processingTime).toBeGreaterThan(0);
      }

      expect(progressCallback).toHaveBeenCalled();
      expect(fileCompleteCallback).toHaveBeenCalledTimes(2);
    });
  });
});
