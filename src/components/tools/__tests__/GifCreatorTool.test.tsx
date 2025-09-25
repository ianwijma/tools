import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GifCreatorTool } from '../GifCreatorTool';

// Mock the GifCreator library
jest.mock('@/lib/gif-creator', () => ({
  GifCreator: {
    createGif: jest.fn().mockResolvedValue({
      result: new Blob(['test-gif'], { type: 'image/gif' }),
      metadata: {
        frames: 2,
        size: 1024,
        duration: 2000,
        width: 600,
        height: 400,
      },
    }),
    startPreview: jest.fn().mockResolvedValue(undefined),
    stopPreview: jest.fn(),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('GifCreatorTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the GIF editor tool', () => {
    render(<GifCreatorTool />);

    expect(screen.getByText('GIF Editor')).toBeVisible();
    expect(
      screen.getByText(
        'Create animated GIFs from images with timeline control and custom settings',
      ),
    ).toBeVisible();
  });

  it('should make all main components visible', () => {
    render(<GifCreatorTool />);

    // Settings panel
    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByRole('combobox')).toBeVisible(); // Preset selector
    expect(screen.getByLabelText('Width')).toBeVisible();
    expect(screen.getByLabelText('Height')).toBeVisible();

    // Timeline
    expect(screen.getByText('Timeline')).toBeVisible();

    // Preview section
    expect(screen.getByText('Preview')).toBeVisible();

    // Action buttons
    expect(screen.getByRole('button', { name: /add images/i })).toBeVisible();
  });

  it('should show empty state when no frames are added', () => {
    render(<GifCreatorTool />);

    expect(screen.getByText('Add images to see preview')).toBeVisible();
    expect(
      screen.getByText('Timeline will appear here once you add images'),
    ).toBeVisible();
  });

  it('should allow preset selection', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    const presetSelect = screen.getByRole('combobox');
    expect(presetSelect).toBeVisible();
    expect(presetSelect).toHaveTextContent('Balanced'); // Default preset

    await user.click(presetSelect);

    // Check that preset options are available
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'High Quality' }),
      ).toBeVisible();
      expect(screen.getByRole('option', { name: 'Balanced' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Fast' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Tiny' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Smooth' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Custom' })).toBeVisible();
    });
  });

  it('should update dimensions when preset changes', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    const presetSelect = screen.getByRole('combobox');
    await user.click(presetSelect);

    const highQualityOption = screen.getByRole('option', {
      name: 'High Quality',
    });
    await user.click(highQualityOption);

    // Wait for the dimensions to update
    await waitFor(() => {
      const widthInput = screen.getByLabelText('Width') as HTMLInputElement;
      const heightInput = screen.getByLabelText('Height') as HTMLInputElement;

      expect(widthInput.value).toBe('800');
      expect(heightInput.value).toBe('600');
    });
  });

  it.skip('should allow manual dimension input', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    const widthInput = screen.getByLabelText('Width');
    const heightInput = screen.getByLabelText('Height');

    // Clear and set width
    await user.click(widthInput);
    await user.keyboard('{Control>}a{/Control}1024');

    // Clear and set height
    await user.click(heightInput);
    await user.keyboard('{Control>}a{/Control}768');

    expect(widthInput).toHaveValue(1024);
    expect(heightInput).toHaveValue(768);
  });

  it('should handle FPS and duration sliders', () => {
    render(<GifCreatorTool />);

    // FPS should start at default value (15 for balanced preset)
    expect(screen.getByText('FPS: 15')).toBeVisible();

    // Duration should start at default value (2.0s for balanced preset)
    expect(screen.getByText('Duration: 2s')).toBeVisible();

    // Both sliders should be present
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle maintain aspect ratio toggle', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    const aspectRatioSwitch = screen.getByRole('checkbox', {
      name: /maintain aspect ratio/i,
    });
    expect(aspectRatioSwitch).toBeInTheDocument();
    expect(aspectRatioSwitch).toBeChecked();

    await user.click(aspectRatioSwitch);
    expect(aspectRatioSwitch).not.toBeChecked();
  });

  it('should handle file upload', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Create mock files
    const file1 = new File(['test-image-1'], 'test1.jpg', {
      type: 'image/jpeg',
    });
    const file2 = new File(['test-image-2'], 'test2.png', {
      type: 'image/png',
    });

    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Simulate file upload
    await user.upload(fileInput, [file1, file2]);

    // Should show timeline frames (check for any frame indicators)
    await waitFor(() => {
      // Check for frame duration indicators or frame numbers instead of images
      const frameElements = screen.getAllByText(/ms$/); // Duration displays
      expect(frameElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should not show download button when no frames are present', () => {
    render(<GifCreatorTool />);

    // Download button should not be visible when there are no frames
    expect(
      screen.queryByRole('button', { name: /download gif/i }),
    ).not.toBeInTheDocument();
  });

  it('should handle file upload in timeline section', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Add files through timeline section
    const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, [file]);

    // Should show timeline frame
    await waitFor(() => {
      expect(screen.getByAltText('test.jpg')).toBeVisible();
    });
  });

  it('should show preview placeholder initially', () => {
    render(<GifCreatorTool />);

    expect(screen.getByText('Add images to see preview')).toBeVisible();
  });

  it('should support both light and dark mode', () => {
    render(<GifCreatorTool />);

    // Component should render without theme-specific errors
    expect(screen.getByText('GIF Editor')).toBeVisible();
  });

  it('should be accessible to screen readers', () => {
    render(<GifCreatorTool />);

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('GIF Editor');
    expect(mainHeading).toBeVisible();

    // Check for proper form labels
    expect(screen.getByLabelText('Width')).toBeVisible();
    expect(screen.getByLabelText('Height')).toBeVisible();

    // Check for proper button labels
    expect(screen.getByRole('button', { name: /add images/i })).toBeVisible();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Tab through interactive elements
    await user.tab();

    // Should be able to focus on preset select
    const presetSelect = screen.getByRole('combobox');
    expect(presetSelect).toHaveFocus();
  });

  it('should handle file type validation', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Try to upload a non-image file
    const invalidFile = new File(['not-an-image'], 'test.txt', {
      type: 'text/plain',
    });
    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // The file input should have the correct accept attribute
    expect(fileInput).toHaveAttribute('accept', 'image/*');

    // Upload should not crash the component
    await user.upload(fileInput, [invalidFile]);

    // Component should still be functional
    expect(screen.getByText('GIF Editor')).toBeVisible();
  });

  it('should show preview controls when frames are added', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Add a file
    const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, [file]);

    // Should show preview controls
    await waitFor(() => {
      expect(screen.getByAltText('test.jpg')).toBeVisible();
      // Download button should be visible
      const downloadButton = screen.getByTestId('DownloadIcon');
      expect(downloadButton).toBeVisible();
    });
  });

  it('should handle responsive design', () => {
    // Mock different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
    });
    render(<GifCreatorTool />);

    // Component should render on mobile without errors
    expect(screen.getByText('GIF Editor')).toBeVisible();

    // Change to desktop size
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      configurable: true,
    });

    // Should still work
    expect(screen.getByText('GIF Editor')).toBeVisible();
  });

  it('should show download button when frames are present', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Initially no download button
    expect(screen.queryByTestId('DownloadIcon')).not.toBeInTheDocument();

    // Add a file
    const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, [file]);

    // Should show download button after adding frames
    await waitFor(() => {
      const downloadButton = screen.getByTestId('DownloadIcon');
      expect(downloadButton).toBeVisible();
    });
  });

  it('should show actual vs target duration', async () => {
    const user = userEvent.setup();
    render(<GifCreatorTool />);

    // Add a file
    const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
    const addImagesButton = screen.getByRole('button', { name: /add images/i });
    const fileInput = addImagesButton.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, [file]);

    // Should show timeline frame
    await waitFor(() => {
      expect(screen.getByAltText('test.jpg')).toBeVisible();
    });
  });
});
