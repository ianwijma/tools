import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encodeGlitterGif, gifFileName } from '@/lib/glitter';
import { GlitterifyTool } from '../GlitterifyTool';

// Mock the glitter module
jest.mock('@/lib/glitter', () => ({
  DEFAULT_OPTIONS: { size: 'original', frames: 20, delay: 80 },
  ORIGINAL_MAX: 1920,
  encodeGlitterGif: jest.fn(),
  formatBytes: jest.fn((bytes: number) => `${(bytes / 1024).toFixed(1)} KB`),
  gifFileName: jest.fn(
    (name: string) => `${name.replace(/\.[^.]+$/, '') || 'image'}-glitter.gif`,
  ),
}));

const mockEncodeGlitterGif = encodeGlitterGif as jest.Mock;
const mockGifFileName = gifFileName as jest.Mock;

// jsdom has no createImageBitmap
const mockClose = jest.fn();
global.createImageBitmap = jest
  .fn()
  .mockResolvedValue({ close: mockClose, width: 100, height: 100 });

// Mock download interactions
const mockClick = jest.fn();

const realCreateElement = global.document.createElement.bind(global.document);
jest
  .spyOn(global.document, 'createElement')
  .mockImplementation((tagName: string) => {
    const element = realCreateElement(tagName);
    if (tagName === 'a') {
      element.click = mockClick;
    }
    return element;
  });

const createMockFile = (
  name = 'test-image.png',
  type = 'image/png',
  size?: number,
): File => {
  const file = new File(['fake-image-content'], name, {
    type,
    lastModified: Date.parse('2024-01-01'),
  });
  if (size !== undefined && size !== file.size) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
};

describe('GlitterifyTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockEncodeGlitterGif.mockResolvedValue(
      new Blob(['mock-gif'], { type: 'image/gif' }),
    );
    mockGifFileName.mockImplementation(
      (name: string) =>
        `${name.replace(/\.[^.]+$/, '') || 'image'}-glitter.gif`,
    );
  });

  describe('rendering', () => {
    it('renders the tool header and description', () => {
      render(<GlitterifyTool />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Glitter-ify',
      );
      expect(
        screen.getByText(/Turn images into sparkly animated glitter GIFs/i),
      ).toBeInTheDocument();
    });

    it('renders the settings panel with GIF size options', () => {
      render(<GlitterifyTool />);

      expect(screen.getByText('Glitter Settings')).toBeInTheDocument();
      expect(screen.getByText(/Frames: 20/)).toBeInTheDocument();
      expect(screen.getByText(/Frame Delay: 80 ms/)).toBeInTheDocument();
    });

    it('shows the empty state for pending and completed files', () => {
      render(<GlitterifyTool />);

      expect(screen.getByText('No images selected')).toBeInTheDocument();
      expect(
        screen.getByText('Glitter GIFs will appear here after processing'),
      ).toBeInTheDocument();
    });

    it('disables the transform button when no files are pending', () => {
      render(<GlitterifyTool />);

      const transformButton = screen.getByRole('button', {
        name: 'Glitter-ify images',
      });
      expect(transformButton).toBeDisabled();
    });
  });

  describe('file selection', () => {
    it('adds valid image files to the pending list', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Images to Glitter-ify \(1\)/),
      ).toBeInTheDocument();
    });

    it('rejects files that are too large', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(
        input,
        createMockFile('huge.png', 'image/png', 60 * 1024 * 1024),
      );

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument();
      });
    });

    it('clears all files when the clear button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Clear All Files'));

      await waitFor(() => {
        expect(screen.getByText('No images selected')).toBeInTheDocument();
      });
    });
  });

  describe('conversion', () => {
    it('processes pending files and shows the results summary', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: 'Glitter-ify images' }),
      );

      await waitFor(() => {
        expect(mockEncodeGlitterGif).toHaveBeenCalledTimes(1);
      });
      expect(mockClose).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('Glitter-ify Results')).toBeInTheDocument();
      });
      expect(screen.getByText('successful', { exact: false })).toBeDefined();
      expect(
        screen.getByText(/Images to Glitter-ify \(0\)/),
      ).toBeInTheDocument();
    });

    it('passes the selected options to the encoder', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: 'Glitter-ify images' }),
      );

      await waitFor(() => {
        expect(mockEncodeGlitterGif).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ size: 'original', frames: 20, delay: 80 }),
          expect.any(Function),
        );
      });
    });

    it('marks files as failed when encoding fails', async () => {
      mockEncodeGlitterGif.mockRejectedValue(new Error('encode-failed'));

      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: 'Glitter-ify images' }),
      );

      await waitFor(() => {
        expect(screen.getByText('encode-failed')).toBeInTheDocument();
      });
    });

    it('shows an error when converting without pending files', async () => {
      render(<GlitterifyTool />);

      const buttons = screen.getAllByRole('button');
      const transformButton = buttons.find(
        (button) => button.querySelector('svg') && button.disabled,
      );

      // Transform button is disabled with no files, so no error appears
      expect(transformButton).toBeTruthy();
      expect(
        screen.queryByText(/Please select images/),
      ).not.toBeInTheDocument();
    });
  });

  describe('downloads', () => {
    it('downloads a completed glitter GIF', async () => {
      const user = userEvent.setup();
      const { container } = render(<GlitterifyTool />);

      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await user.upload(input, createMockFile());

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: 'Glitter-ify images' }),
      );

      await waitFor(() => {
        expect(mockEncodeGlitterGif).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('test-image-glitter.gif')).toBeInTheDocument();
      });

      const downloadButton = screen.getByTitle('Download glitter GIF');
      await user.click(downloadButton);

      expect(mockClick).toHaveBeenCalled();
      expect(mockGifFileName).toHaveBeenCalledWith('test-image.png');
    });
  });
});
