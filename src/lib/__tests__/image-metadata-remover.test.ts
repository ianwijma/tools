import type { MetadataRemoverInput } from '@/types/image-metadata-remover';
import { ImageMetadataRemover } from '../image-metadata-remover';

// Mock canvas and related APIs
const mockCanvas = {
  width: 100,
  height: 100,
  getContext: jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
  }),
  toBlob: jest.fn((callback, type) => {
    const blob = new Blob(['mock image data'], { type: type || 'image/jpeg' });
    callback(blob);
  }),
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
});

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  naturalWidth: 100,
  naturalHeight: 100,
};

global.Image = jest.fn().mockImplementation(() => mockImage);

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageMetadataRemover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return error when no files provided', () => {
      const input: MetadataRemoverInput = {
        files: [],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      const errors = ImageMetadataRemover.validate(input);
      expect(errors).toContain('No files provided');
    });

    it('should return error for files that are too large', () => {
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const input: MetadataRemoverInput = {
        files: [largeFile],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      const errors = ImageMetadataRemover.validate(input);
      expect(errors).toEqual(
        expect.arrayContaining([expect.stringContaining('too large')]),
      );
    });

    it('should return error for unsupported file formats', () => {
      const unsupportedFile = new File(['data'], 'test.txt', {
        type: 'text/plain',
      });
      const input: MetadataRemoverInput = {
        files: [unsupportedFile],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      const errors = ImageMetadataRemover.validate(input);
      expect(errors).toEqual(
        expect.arrayContaining([expect.stringContaining('not an image file')]),
      );
    });

    it('should return error for invalid JPEG quality', () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const input: MetadataRemoverInput = {
        files: [file],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 2.0, // Invalid quality
      };

      const errors = ImageMetadataRemover.validate(input);
      expect(errors).toContain('JPEG quality must be between 0.1 and 1.0');
    });

    it('should return no errors for valid input', () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const input: MetadataRemoverInput = {
        files: [file],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      const errors = ImageMetadataRemover.validate(input);
      expect(errors).toHaveLength(0);
    });
  });

  describe('isFormatSupported', () => {
    it('should return true for supported formats', () => {
      expect(ImageMetadataRemover.isFormatSupported('test.jpg')).toBe(true);
      expect(ImageMetadataRemover.isFormatSupported('test.jpeg')).toBe(true);
      expect(ImageMetadataRemover.isFormatSupported('test.png')).toBe(true);
      expect(ImageMetadataRemover.isFormatSupported('test.webp')).toBe(true);
      expect(ImageMetadataRemover.isFormatSupported('test.bmp')).toBe(true);
      expect(ImageMetadataRemover.isFormatSupported('test.gif')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(ImageMetadataRemover.isFormatSupported('test.txt')).toBe(false);
      expect(ImageMetadataRemover.isFormatSupported('test.pdf')).toBe(false);
      expect(ImageMetadataRemover.isFormatSupported('test.doc')).toBe(false);
    });
  });

  describe('getPreset', () => {
    it('should return preset configuration', () => {
      const preset = ImageMetadataRemover.getPreset('complete-removal');
      expect(preset).toEqual({
        preserveColorProfile: false,
        preserveOrientation: false,
        outputFormat: 'same',
        jpegQuality: 0.95,
      });
    });

    it('should return different presets', () => {
      const webOptimized = ImageMetadataRemover.getPreset('web-optimized');
      expect(webOptimized.outputFormat).toBe('webp');

      const preserveEssential =
        ImageMetadataRemover.getPreset('preserve-essential');
      expect(preserveEssential.preserveColorProfile).toBe(true);
      expect(preserveEssential.preserveOrientation).toBe(true);
    });
  });

  describe('getAllPresets', () => {
    it('should return all available presets', () => {
      const presets = ImageMetadataRemover.getAllPresets();
      expect(presets).toHaveLength(3);
      expect(presets.map((p) => p.key)).toContain('complete-removal');
      expect(presets.map((p) => p.key)).toContain('preserve-essential');
      expect(presets.map((p) => p.key)).toContain('web-optimized');
    });
  });

  describe('processFiles', () => {
    it('should process a single image file', async () => {
      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const input: MetadataRemoverInput = {
        files: [file],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      // Simulate image loading
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await ImageMetadataRemover.processFiles(input);

      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('metadata');
      if ('metadata' in result) {
        expect(result.metadata.totalFiles).toBe(1);
        expect(result.metadata.successCount).toBe(1);
        expect(result.metadata.errorCount).toBe(0);
      }
    });

    it('should handle processing errors', async () => {
      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const input: MetadataRemoverInput = {
        files: [file],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      // Simulate image loading error
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      const result = await ImageMetadataRemover.processFiles(input);

      if ('metadata' in result) {
        expect(result.metadata.errorCount).toBeGreaterThan(0);
      }
    });

    it('should call progress callback', async () => {
      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const input: MetadataRemoverInput = {
        files: [file],
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      const progressCallback = jest.fn();

      // Simulate image loading
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await ImageMetadataRemover.processFiles(input, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
          stage: expect.any(String),
        }),
      );
    });

    it('should handle multiple files', async () => {
      const files = [
        new File(['image data 1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['image data 2'], 'test2.png', { type: 'image/png' }),
      ];
      const input: MetadataRemoverInput = {
        files,
        preserveColorProfile: false,
        preserveOrientation: false,
        jpegQuality: 0.9,
      };

      // Simulate image loading for both files
      let loadCallCount = 0;
      const originalOnloadSetter = Object.getOwnPropertyDescriptor(
        mockImage,
        'onload',
      )?.set;
      Object.defineProperty(mockImage, 'onload', {
        set: (handler) => {
          setTimeout(() => {
            if (handler) {
              loadCallCount++;
              handler();
              if (loadCallCount < 2) {
                // Trigger handler again for second file
                setTimeout(() => handler(), 10);
              }
            }
          }, 0);
        },
        configurable: true,
      });

      const result = await ImageMetadataRemover.processFiles(input);

      if ('metadata' in result) {
        expect(result.metadata.totalFiles).toBe(2);
      }

      // Restore original setter
      if (originalOnloadSetter) {
        Object.defineProperty(mockImage, 'onload', {
          set: originalOnloadSetter,
          configurable: true,
        });
      }
    }, 10000);
  });

  describe('createOutputFilename', () => {
    it('should create output filename with metadata suffix', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const options = {
        preserveColorProfile: false,
        preserveOrientation: false,
        outputFormat: 'same' as const,
        jpegQuality: 0.9,
      };

      const filename = ImageMetadataRemover.createOutputFilename(file, options);
      expect(filename).toBe('photo_no_metadata.jpg');
    });

    it('should change extension when format changes', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const options = {
        preserveColorProfile: false,
        preserveOrientation: false,
        outputFormat: 'webp' as const,
        jpegQuality: 0.9,
      };

      const filename = ImageMetadataRemover.createOutputFilename(file, options);
      expect(filename).toBe('photo_no_metadata.webp');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(ImageMetadataRemover.formatFileSize(0)).toBe('0 B');
      expect(ImageMetadataRemover.formatFileSize(1024)).toBe('1.00 KB');
      expect(ImageMetadataRemover.formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(ImageMetadataRemover.formatFileSize(1024 * 1024 * 1024)).toBe(
        '1.00 GB',
      );
    });

    it('should handle non-round numbers', () => {
      expect(ImageMetadataRemover.formatFileSize(1536)).toBe('1.50 KB'); // 1.5 KB
      expect(ImageMetadataRemover.formatFileSize(2.5 * 1024 * 1024)).toBe(
        '2.50 MB',
      ); // 2.5 MB
    });
  });

  describe('getFormatSupport', () => {
    it('should return format support information', () => {
      const support = ImageMetadataRemover.getFormatSupport();
      expect(support.jpeg).toBe(true);
      expect(support.jpg).toBe(true);
      expect(support.png).toBe(true);
      expect(support.webp).toBe(true);
      expect(support.bmp).toBe(true);
      expect(support.gif).toBe(true);
    });
  });
});
