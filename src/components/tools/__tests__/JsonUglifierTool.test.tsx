import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonUglifierTool } from '../JsonUglifierTool';

// Mock the clipboard API
const writeTextMock = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: writeTextMock,
  },
});

// Mock URL.createObjectURL and related APIs for download functionality
Object.assign(URL, {
  createObjectURL: jest.fn(() => 'mocked-url'),
  revokeObjectURL: jest.fn(),
});

describe('JsonUglifierTool', () => {
  const sampleFormattedJson = `{
  "name": "test",
  "values": [1, 2, 3],
  "nested": {
    "key": "value"
  }
}`;

  const expectedUglifiedJson =
    '{"name":"test","values":[1,2,3],"nested":{"key":"value"}}';

  beforeEach(() => {
    jest.clearAllMocks();
    writeTextMock.mockResolvedValue(undefined);

    // Clean up DOM before each test
    document.body.innerHTML = '';
  });

  it('should render the component', () => {
    render(<JsonUglifierTool />);

    expect(screen.getByText('JSON Uglifier')).toBeVisible();
    expect(
      screen.getByText(/Minimize JSON by removing all unnecessary whitespace/),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText('Paste your formatted JSON here...'),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText('Uglified JSON will appear here...'),
    ).toBeVisible();
  });

  it('should have uglify button initially disabled', () => {
    render(<JsonUglifierTool />);

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();
    expect(uglifyButton).toHaveAttribute('disabled');
  });

  it('should enable uglify button when input is provided', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );
    await user.clear(inputTextArea);
    await user.paste('{"test": "value"}');

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();
    expect(uglifyButton).not.toHaveAttribute('disabled');
  });

  it('should uglify JSON correctly', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );
    const outputTextArea = screen.getByPlaceholderText(
      'Uglified JSON will appear here...',
    );

    await user.clear(inputTextArea);
    await user.paste(sampleFormattedJson);

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();

    if (uglifyButton) {
      await user.click(uglifyButton);
    }

    await waitFor(() => {
      expect((outputTextArea as HTMLTextAreaElement).value).toBe(
        expectedUglifiedJson,
      );
    });
  });

  it('should show error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );

    await user.clear(inputTextArea);
    await user.paste('{"invalid": }');

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();

    if (uglifyButton) {
      await user.click(uglifyButton);
    }

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeVisible();
      expect(screen.getByRole('alert')).toHaveTextContent(/JSON/);
    });
  });

  it('should disable uglify button when input is empty', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );

    await user.clear(inputTextArea);
    await user.type(inputTextArea, 'test'); // First add some text to enable button

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();
    expect(uglifyButton).not.toHaveAttribute('disabled');

    // Now clear the input to make it effectively empty
    await user.clear(inputTextArea);

    // Button should become disabled when input is empty
    expect(uglifyButton).toHaveAttribute('disabled');
  });

  it('should display metadata after successful uglification', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );

    await user.clear(inputTextArea);
    await user.paste(sampleFormattedJson);

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();

    if (uglifyButton) {
      await user.click(uglifyButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Uglification Results')).toBeVisible();
      expect(screen.getByText('Original Size')).toBeVisible();
      expect(screen.getByText('Uglified Size')).toBeVisible();
      expect(screen.getByText('Compression')).toBeVisible();
    });
  });

  it('should enable copy button after successful uglification', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );

    // Initially copy button should be disabled
    const copyButtonInitial = screen.getByRole('button', { name: /copy/i });
    expect(copyButtonInitial).toHaveAttribute('disabled');

    await user.clear(inputTextArea);
    await user.paste(sampleFormattedJson);

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();

    if (uglifyButton) {
      await user.click(uglifyButton);
    }

    // After uglification, copy button should be enabled
    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).not.toHaveAttribute('disabled');
    });
  });

  it('should enable download button after successful uglification', async () => {
    const user = userEvent.setup();
    render(<JsonUglifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      'Paste your formatted JSON here...',
    );

    // Initially download button should be disabled
    const downloadButtonInitial = screen.getByRole('button', {
      name: /download/i,
    });
    expect(downloadButtonInitial).toHaveAttribute('disabled');

    await user.clear(inputTextArea);
    await user.paste(sampleFormattedJson);

    const uglifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(uglifyButton).toBeTruthy();

    if (uglifyButton) {
      await user.click(uglifyButton);
    }

    // After uglification, download button should be enabled
    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).not.toHaveAttribute('disabled');
    });
  });

  it('should have copy and download buttons disabled initially', () => {
    render(<JsonUglifierTool />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    const downloadButton = screen.getByRole('button', { name: /download/i });

    expect(copyButton).toHaveAttribute('disabled');
    expect(downloadButton).toHaveAttribute('disabled');
  });
});
