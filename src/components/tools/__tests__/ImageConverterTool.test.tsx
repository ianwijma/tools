// Tests for ImageConverterTool React component
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImageConverter } from '@/lib/image-converter';
import { ImageConverterTool } from '../ImageConverterTool';

// Mock the ImageConverter module
jest.mock('@/lib/image-converter', () => ({
  ImageConverter: {
    getAllPresets: jest.fn(),
    getPreset: jest.fn(),
    getSupportedFormats: jest.fn(),
    validate: jest.fn(),
    convertFiles: jest.fn(),
    getFileExtension: jest.fn(),
    formatFileSize: jest.fn(),
    convertSingleFile: jest.fn(),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement for download functionality
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

global.document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
    };
  }
  return {};
}) as jest.MockedFunction<typeof document.createElement>;

global.document.body.appendChild = mockAppendChild;
global.document.body.removeChild = mockRemoveChild;

const mockImageConverter = ImageConverter as jest.Mocked<typeof ImageConverter>;

describe.skip('ImageConverterTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up DOM between tests
    document.body.innerHTML = '';

    // Setup default mock implementations
    mockImageConverter.getAllPresets.mockReturnValue({
      'web-optimized': {
        name: 'Web Optimized',
        description: 'JPEG 85% quality, max 1920px width',
        options: {
          targetFormat: 'jpeg',
          quality: 0.85,
          width: 1920,
          maintainAspectRatio: true,
          backgroundColor: '#ffffff',
        },
      },
      'high-quality': {
        name: 'High Quality',
        description: 'WebP 90% quality',
        options: {
          targetFormat: 'webp',
          quality: 0.9,
          maintainAspectRatio: true,
          backgroundColor: '#ffffff',
        },
      },
      custom: {
        name: 'Custom',
        description: 'Custom settings',
        options: {
          targetFormat: 'jpeg',
          quality: 0.85,
          maintainAspectRatio: true,
          backgroundColor: '#ffffff',
        },
      },
    });

    mockImageConverter.getPreset.mockReturnValue({
      targetFormat: 'jpeg',
      quality: 0.85,
      width: 1920,
      maintainAspectRatio: true,
      backgroundColor: '#ffffff',
    });

    mockImageConverter.getSupportedFormats.mockReturnValue([
      'jpeg',
      'png',
      'webp',
    ]);
    mockImageConverter.validate.mockReturnValue([]);
    mockImageConverter.getFileExtension.mockReturnValue('jpg');
    mockImageConverter.formatFileSize.mockReturnValue('1.0 KB');

    mockCreateObjectURL.mockReturnValue('blob:test-url');
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // Helper function to render component with proper container
  const renderComponent = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return render(<ImageConverterTool />, { container });
  };

  describe('Component Rendering', () => {
    it('should render the image converter tool', () => {
      renderComponent();

      expect(screen.getByText('Image Converter')).toBeVisible();
      expect(screen.getByText(/Convert images between formats/)).toBeVisible();
    });

    it('should render all main sections', () => {
      renderComponent();

      expect(screen.getByText('Conversion Settings')).toBeVisible();
      expect(
        screen.getByText('Drop images here or click to browse'),
      ).toBeVisible();
      expect(screen.getByText('Selected Images (0)')).toBeVisible();
    });

    it('should render preset selector with options', () => {
      renderComponent();

      const presetSelect = screen.getByLabelText('Preset');
      expect(presetSelect).toBeVisible();

      // Check if presets are loaded
      expect(mockImageConverter.getAllPresets).toHaveBeenCalled();
    });

    it('should render format selector with supported formats', () => {
      renderComponent();

      const formatSelect = screen.getByLabelText('Output Format');
      expect(formatSelect).toBeVisible();

      expect(mockImageConverter.getSupportedFormats).toHaveBeenCalled();
    });

    it('should render quality slider', () => {
      renderComponent();

      expect(screen.getByText(/Quality:/)).toBeVisible();
    });

    it('should render convert button initially disabled', () => {
      renderComponent();

      const convertButton = screen.getByText('Convert Images');
      expect(convertButton).toBeVisible();
      expect(convertButton).toHaveAttribute('disabled');
    });
  });

  describe('File Upload', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup();
      renderComponent();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      expect(fileInput).toBeTruthy();

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText('Selected Images (1)')).toBeVisible();
          expect(screen.getByText('test.jpg')).toBeVisible();
        });
      }
    });

    it('should handle drag and drop', async () => {
      renderComponent();

      const dropZone = screen
        .getByText('Drop images here or click to browse')
        .closest('div');
      expect(dropZone).toBeTruthy();

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      if (dropZone) {
        const dataTransfer = {
          files: [file],
        };

        fireEvent.drop(dropZone, { dataTransfer });

        await waitFor(() => {
          expect(screen.getByText('Selected Images (1)')).toBeVisible();
          expect(screen.getByText('test.png')).toBeVisible();
        });
      }
    });

    it('should filter non-image files from drag and drop', async () => {
      renderComponent();

      const dropZone = screen
        .getByText('Drop images here or click to browse')
        .closest('div');
      expect(dropZone).toBeTruthy();

      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      if (dropZone) {
        const dataTransfer = {
          files: [imageFile, textFile],
        };

        fireEvent.drop(dropZone, { dataTransfer });

        await waitFor(() => {
          expect(screen.getByText('Selected Images (1)')).toBeVisible();
          expect(screen.getByText('test.jpg')).toBeVisible();
          expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
        });
      }
    });

    it('should allow removing individual files', async () => {
      const user = userEvent.setup();
      renderComponent();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeVisible();
        });

        const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
        expect(deleteButton).toBeTruthy();

        if (deleteButton) {
          await user.click(deleteButton);

          await waitFor(() => {
            expect(screen.getByText('Selected Images (0)')).toBeVisible();
            expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
          });
        }
      }
    });

    it('should allow clearing all files', async () => {
      const user = userEvent.setup();
      renderComponent();

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];

      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, files);

        await waitFor(() => {
          expect(screen.getByText('Selected Images (2)')).toBeVisible();
        });

        const clearAllButton = screen.getByText('Clear All');
        await user.click(clearAllButton);

        await waitFor(() => {
          expect(screen.getByText('Selected Images (0)')).toBeVisible();
          expect(screen.queryByText('test1.jpg')).not.toBeInTheDocument();
          expect(screen.queryByText('test2.png')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Settings Management', () => {
    it('should update options when preset changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const presetSelect = screen.getByLabelText('Preset');

      await user.click(presetSelect);
      const highQualityOption = screen.getByText('High Quality');
      await user.click(highQualityOption);

      expect(mockImageConverter.getPreset).toHaveBeenCalledWith('high-quality');
    });

    it('should switch to custom preset when options are manually changed', async () => {
      const user = userEvent.setup();
      renderComponent();

      const formatSelect = screen.getByLabelText('Output Format');

      await user.click(formatSelect);
      const pngOption = screen.getByText('PNG');
      await user.click(pngOption);

      // Should automatically switch to custom preset
      await waitFor(() => {
        expect(screen.getByDisplayValue('Custom')).toBeInTheDocument();
      });
    });

    it('should update quality via slider', async () => {
      renderComponent();

      const qualitySlider = screen.getByRole('slider');

      fireEvent.change(qualitySlider, { target: { value: '75' } });

      await waitFor(() => {
        expect(screen.getByText('Quality: 75%')).toBeVisible();
      });
    });

    it('should handle width and height input changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const widthInput = screen.getByLabelText('Max Width (px)');
      const heightInput = screen.getByLabelText('Max Height (px)');

      await user.clear(widthInput);
      await user.type(widthInput, '800');

      await user.clear(heightInput);
      await user.type(heightInput, '600');

      expect(widthInput).toHaveValue(800);
      expect(heightInput).toHaveValue(600);
    });

    it('should toggle aspect ratio maintenance', async () => {
      const user = userEvent.setup();
      renderComponent();

      const aspectRatioSwitch = screen.getByLabelText('Maintain Aspect Ratio');

      expect(aspectRatioSwitch).toBeChecked();

      await user.click(aspectRatioSwitch);

      expect(aspectRatioSwitch).not.toBeChecked();
    });
  });

  describe('Conversion Process', () => {
    it('should start conversion when convert button is clicked', async () => {
      const user = userEvent.setup();

      mockImageConverter.convertFiles.mockResolvedValueOnce({
        result: 'Successfully converted 1 of 1 images',
        metadata: {
          totalFiles: 1,
          successCount: 1,
          errorCount: 0,
          totalOriginalSize: 1024,
          totalOutputSize: 512,
          compressionRatio: 0.5,
          processingTime: 100,
        },
      });

      renderComponent();

      // Add a file first
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeVisible();
        });

        const convertButton = screen.getByText('Convert Images');
        expect(convertButton).not.toHaveAttribute('disabled');

        await user.click(convertButton);

        expect(mockImageConverter.convertFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            files: expect.arrayContaining([file]),
            targetFormat: 'jpeg',
            maintainAspectRatio: true,
          }),
          expect.any(Function),
          expect.any(Function),
        );
      }
    });

    it('should show error when no files are selected for conversion', async () => {
      renderComponent();

      // Try to convert without files
      const convertButton = screen.getByText('Convert Images');

      // Button should be disabled when no files
      expect(convertButton).toHaveAttribute('disabled');
    });

    it('should display conversion results', async () => {
      const user = userEvent.setup();

      mockImageConverter.convertFiles.mockResolvedValueOnce({
        result: 'Successfully converted 2 of 2 images',
        metadata: {
          totalFiles: 2,
          successCount: 2,
          errorCount: 0,
          totalOriginalSize: 2048,
          totalOutputSize: 1024,
          compressionRatio: 0.5,
          processingTime: 200,
        },
      });

      renderComponent();

      // Add files
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];

      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, files);

        await waitFor(() => {
          expect(screen.getByText('Selected Images (2)')).toBeVisible();
        });

        const convertButton = screen.getByText('Convert Images');
        await user.click(convertButton);

        await waitFor(() => {
          expect(screen.getByText('Conversion Results')).toBeVisible();
          expect(screen.getByText('2')).toBeVisible(); // Total files
          expect(screen.getByText('50%')).toBeVisible(); // Compression ratio
        });
      }
    });

    it('should display validation errors', async () => {
      const user = userEvent.setup();

      mockImageConverter.convertFiles.mockResolvedValueOnce({
        message: 'File too large',
        code: 'INVALID_FILE',
      });

      renderComponent();

      // Add a file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, file);

        const convertButton = screen.getByText('Convert Images');
        await user.click(convertButton);

        await waitFor(() => {
          expect(screen.getByText('File too large')).toBeVisible();
        });
      }
    });
  });

  describe('Download Functionality', () => {
    it('should show download buttons for successful conversions', async () => {
      const user = userEvent.setup();

      // Mock successful conversion with file progress callback
      mockImageConverter.convertFiles.mockImplementation(
        async (_input, _progressCallback, fileCallback) => {
          // Simulate file completion
          if (fileCallback) {
            fileCallback({
              fileId: 'test.jpg-1024-1234567890',
              success: true,
              outputBlob: new Blob(['converted'], { type: 'image/jpeg' }),
              outputSize: 512,
            });
          }

          return {
            result: 'Successfully converted 1 of 1 images',
            metadata: {
              totalFiles: 1,
              successCount: 1,
              errorCount: 0,
              totalOriginalSize: 1024,
              totalOutputSize: 512,
              compressionRatio: 0.5,
              processingTime: 100,
            },
          };
        },
      );

      renderComponent();

      // Add a file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      Object.defineProperty(file, 'lastModified', { value: 1234567890 });

      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, file);

        const convertButton = screen.getByText('Convert Images');
        await user.click(convertButton);

        await waitFor(() => {
          const downloadButton = screen
            .getByTestId('DownloadIcon')
            .closest('button');
          expect(downloadButton).toBeVisible();
          expect(downloadButton).not.toHaveAttribute('disabled');
        });
      }
    });

    it('should trigger file download when download button is clicked', async () => {
      const user = userEvent.setup();

      // Mock successful conversion
      mockImageConverter.convertFiles.mockImplementation(
        async (_input, _progressCallback, fileCallback) => {
          if (fileCallback) {
            fileCallback({
              fileId: 'test.jpg-1024-1234567890',
              success: true,
              outputBlob: new Blob(['converted'], { type: 'image/jpeg' }),
              outputSize: 512,
            });
          }

          return {
            result: 'Successfully converted 1 of 1 images',
            metadata: {
              totalFiles: 1,
              successCount: 1,
              errorCount: 0,
              totalOriginalSize: 1024,
              totalOutputSize: 512,
              compressionRatio: 0.5,
              processingTime: 100,
            },
          };
        },
      );

      renderComponent();

      // Add and convert a file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      Object.defineProperty(file, 'lastModified', { value: 1234567890 });

      const fileInput = screen
        .getByLabelText(/Drop images here/i)
        .querySelector('input[type="file"]');

      if (fileInput) {
        await user.upload(fileInput, file);

        const convertButton = screen.getByText('Convert Images');
        await user.click(convertButton);

        await waitFor(() => {
          const downloadButton = screen
            .getByTestId('DownloadIcon')
            .closest('button');
          expect(downloadButton).toBeVisible();
        });

        const downloadButton = screen
          .getByTestId('DownloadIcon')
          .closest('button');
        if (downloadButton) {
          await user.click(downloadButton);

          expect(mockCreateObjectURL).toHaveBeenCalled();
          expect(mockClick).toHaveBeenCalled();
          expect(mockRevokeObjectURL).toHaveBeenCalled();
        }
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      renderComponent();

      expect(screen.getByLabelText('Preset')).toBeVisible();
      expect(screen.getByLabelText('Output Format')).toBeVisible();
      expect(screen.getByLabelText('Max Width (px)')).toBeVisible();
      expect(screen.getByLabelText('Max Height (px)')).toBeVisible();
      expect(screen.getByLabelText('Maintain Aspect Ratio')).toBeVisible();
      expect(screen.getByLabelText('Background Color')).toBeVisible();
    });

    it('should have proper heading structure', () => {
      renderComponent();

      expect(
        screen.getByRole('heading', { level: 1, name: 'Image Converter' }),
      ).toBeVisible();
      expect(screen.getByText('Conversion Settings')).toBeVisible();
    });

    it('should have accessible buttons', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Convert Images' }),
      ).toBeVisible();
    });
  });

  describe('Responsive Design', () => {
    it('should work on different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      renderComponent();

      expect(screen.getByText('Image Converter')).toBeVisible();
      expect(screen.getByText('Conversion Settings')).toBeVisible();
    });
  });
});
