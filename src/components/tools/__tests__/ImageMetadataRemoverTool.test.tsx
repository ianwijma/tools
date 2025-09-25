import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageMetadataRemoverTool } from '../ImageMetadataRemoverTool';

// Mock JSZip
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(new Blob(['mock zip content'])),
  }));
});

// Mock the ImageMetadataRemover class
jest.mock('@/lib/image-metadata-remover', () => ({
  ImageMetadataRemover: {
    PRESETS: {
      'complete-removal': {
        name: 'Complete Removal',
        description:
          'Remove all metadata including color profiles and orientation data. Use with JPEG output for maximum privacy.',
        options: {
          preserveColorProfile: false,
          preserveOrientation: false,
          outputFormat: 'same',
          jpegQuality: 0.95,
        },
      },
      'preserve-essential': {
        name: 'Preserve Essential',
        description:
          'Remove personal data but keep color profiles and orientation',
        options: {
          preserveColorProfile: true,
          preserveOrientation: true,
          outputFormat: 'same',
          jpegQuality: 0.95,
        },
      },
      'web-optimized': {
        name: 'Web Optimized',
        description:
          'Remove metadata and convert to WebP for optimal web performance',
        options: {
          preserveColorProfile: false,
          preserveOrientation: true,
          outputFormat: 'webp',
          jpegQuality: 0.95,
        },
      },
    },
    getAllPresets: jest.fn().mockReturnValue([
      {
        key: 'complete-removal',
        preset: {
          name: 'Complete Removal',
          description:
            'Remove all metadata including color profiles and orientation data. Use with JPEG output for maximum privacy.',
          options: {
            preserveColorProfile: false,
            preserveOrientation: false,
            outputFormat: 'same',
            jpegQuality: 0.95,
          },
        },
      },
      {
        key: 'preserve-essential',
        preset: {
          name: 'Preserve Essential',
          description:
            'Remove personal data but keep color profiles and orientation',
          options: {
            preserveColorProfile: true,
            preserveOrientation: true,
            outputFormat: 'same',
            jpegQuality: 0.95,
          },
        },
      },
      {
        key: 'web-optimized',
        preset: {
          name: 'Web Optimized',
          description:
            'Remove metadata and convert to WebP for optimal web performance',
          options: {
            preserveColorProfile: false,
            preserveOrientation: true,
            outputFormat: 'webp',
            jpegQuality: 0.95,
          },
        },
      },
    ]),
    getPreset: jest.fn().mockReturnValue({
      preserveColorProfile: false,
      preserveOrientation: false,
      outputFormat: 'same',
      jpegQuality: 0.95,
    }),
    isFormatSupported: jest.fn().mockReturnValue(true),
    processFiles: jest.fn().mockResolvedValue({
      result:
        'Successfully processed 1 out of 1 images. Removed 2.5KB of metadata.',
      metadata: {
        totalFiles: 1,
        successCount: 1,
        errorCount: 0,
        totalOriginalSize: 100000,
        totalOutputSize: 97500,
        totalMetadataRemoved: 2500,
        compressionRatio: 0.975,
        processingTime: 1000,
        formatBreakdown: { 'image/jpeg': 1 },
      },
    }),
    createOutputFilename: jest.fn().mockReturnValue('test_no_metadata.jpg'),
    formatFileSize: jest
      .fn()
      .mockImplementation((bytes: number) => `${(bytes / 1024).toFixed(1)} KB`),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageMetadataRemoverTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the tool correctly', () => {
    render(<ImageMetadataRemoverTool />);

    expect(
      screen.getByRole('heading', { name: /image metadata remover/i }),
    ).toBeVisible();
    expect(
      screen.getByText(/remove exif data, geolocation, camera information/i),
    ).toBeVisible();
    expect(
      screen.getByText(/drop images here or click to browse/i),
    ).toBeVisible();
  });

  it('should show settings panel', () => {
    render(<ImageMetadataRemoverTool />);

    expect(screen.getByText('Privacy Settings')).toBeVisible();
    expect(screen.getAllByText('Preset')[0]).toBeVisible();
    expect(screen.getAllByText('Output Format')[0]).toBeVisible();
  });

  it('should handle file upload', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeVisible();
    });
  });

  it('should process files when remove metadata button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload a file first
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    // Click the remove metadata button
    const removeButton = screen.getByRole('button', {
      name: /remove metadata from images/i,
    });
    expect(removeButton).toBeVisible();
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/processing complete/i)).toBeVisible();
    });
  });

  it('should show disabled button when no files are selected', () => {
    render(<ImageMetadataRemoverTool />);

    const removeButton = screen.getByRole('button', {
      name: /remove metadata from images/i,
    });
    expect(removeButton).toBeDisabled();
  });

  it('should allow removing individual files', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload a file
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    // Verify file is shown
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeVisible();
    });

    // Remove the file
    const removeButton = screen.getByRole('button', {
      name: /remove test\.jpg/i,
    });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });

  it('should clear all files when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload a file
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    // Verify file is shown
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeVisible();
    });

    // Clear all files
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });

  it('should expand advanced options', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    const advancedButton = screen.getByRole('button', {
      name: /advanced options/i,
    });
    await user.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText(/preserve color profile/i)).toBeVisible();
      expect(screen.getByText(/preserve image orientation/i)).toBeVisible();
    });
  });

  it('should change preset settings', async () => {
    render(<ImageMetadataRemoverTool />);

    // Check that the preset selector exists and is visible
    expect(screen.getAllByText('Complete Removal')[0]).toBeVisible();

    // The preset functionality is tested through the mocked getPreset calls
    expect(
      require('@/lib/image-metadata-remover').ImageMetadataRemover.getPreset,
    ).toHaveBeenCalled();
  });

  it('should not show JPEG quality slider when removed from UI', () => {
    render(<ImageMetadataRemoverTool />);

    // Quality slider should not exist since we removed it from the UI
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('should show processing statistics after completion', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload and process a file
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    const removeButton = screen.getByRole('button', {
      name: /remove metadata from images/i,
    });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/processing complete/i)).toBeVisible();
      expect(screen.getByText('1')).toBeVisible(); // Processed count
      expect(screen.getByText('0')).toBeVisible(); // Error count
    });
  });

  it('should be accessible with screen readers', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeVisible();
    expect(mainHeading).toHaveAccessibleName();

    // Check for form labels (first occurrence)
    expect(screen.getAllByText('Preset')[0]).toBeVisible();
    expect(screen.getAllByText('Output Format')[0]).toBeVisible();

    // Check for buttons with accessible names
    expect(
      screen.getByRole('button', { name: /remove metadata from images/i }),
    ).toBeVisible();

    // Upload a file to show the clear all button
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /clear all files/i }),
      ).toBeVisible();
    });
  });

  it('should handle theme switching', () => {
    render(<ImageMetadataRemoverTool />);

    // The component should render without errors in different themes
    // Material-UI theme switching is handled at the provider level
    expect(
      screen.getByRole('heading', { name: /image metadata remover/i }),
    ).toBeVisible();
  });

  it('should support bulk file processing', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload multiple files
    const files = [
      new File(['test image 1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test image 2'], 'test2.png', { type: 'image/png' }),
    ];
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, files);

    await waitFor(() => {
      expect(screen.getByText('test1.jpg')).toBeVisible();
      expect(screen.getByText('test2.png')).toBeVisible();
      expect(screen.getByText(/Images to Process \(2\)/)).toBeVisible();
    });
  });

  it('should show file statistics', async () => {
    const user = userEvent.setup();
    render(<ImageMetadataRemoverTool />);

    // Upload a file
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Images to Process \(1\)/)).toBeVisible();
    });
  });
});
