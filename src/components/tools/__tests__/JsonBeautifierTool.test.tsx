import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { JsonBeautifierTool } from '../JsonBeautifierTool';

// Mock clipboard API
const writeTextMock = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: writeTextMock,
  },
});

// Mock URL.createObjectURL and related APIs
Object.assign(URL, {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
});

describe('JsonBeautifierTool', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up DOM between tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up any leftover DOM elements
    document.body.innerHTML = '';
  });

  it('should render the tool with basic elements', () => {
    render(<JsonBeautifierTool />);

    expect(
      screen.getByRole('heading', { name: /json beautifier/i }),
    ).toBeVisible();
    expect(
      screen.getByText(/transform minified or poorly formatted json/i),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText(/paste your minified or unformatted json/i),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText(/beautified json will appear here/i),
    ).toBeVisible();
  });

  it('should load sample JSON when button is clicked', async () => {
    render(<JsonBeautifierTool />);

    const loadSampleButton = screen.getByRole('button', {
      name: /load sample/i,
    });
    expect(loadSampleButton).toBeVisible();

    await user.click(loadSampleButton);

    const inputTextArea = screen.getByPlaceholderText(
      /paste your minified or unformatted json/i,
    );
    expect((inputTextArea as HTMLTextAreaElement).value).toContain(
      'JSON Beautifier Tool',
    );
  });

  it('should beautify JSON when beautify button is clicked', async () => {
    render(<JsonBeautifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      /paste your minified or unformatted json/i,
    );
    // Find the arrow button by its icon
    const beautifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(beautifyButton).toBeTruthy();

    // Enter minified JSON
    const minifiedJson = '{"name":"test","value":123}';
    await user.clear(inputTextArea);
    await user.paste(minifiedJson);

    // Click beautify
    if (beautifyButton) {
      await user.click(beautifyButton);
    }

    // Wait for processing
    await waitFor(() => {
      const outputTextArea = screen.getByPlaceholderText(
        /beautified json will appear here/i,
      );
      expect((outputTextArea as HTMLTextAreaElement).value).toBeTruthy();
      expect((outputTextArea as HTMLTextAreaElement).value).not.toBe(
        minifiedJson,
      ); // Should be different from input
    });
  });

  it('should show error for invalid JSON', async () => {
    render(<JsonBeautifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      /paste your minified or unformatted json/i,
    );
    // Find the arrow button by its icon
    const beautifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(beautifyButton).toBeTruthy();

    // Enter invalid JSON
    await user.clear(inputTextArea);
    await user.paste('{"invalid": json}');

    // Click beautify
    if (beautifyButton) {
      await user.click(beautifyButton);
    }

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeVisible();
      expect(screen.getByText(/invalid json/i)).toBeVisible();
    });
  });

  it('should show error for empty input', () => {
    render(<JsonBeautifierTool />);

    // Find the arrow button by its icon
    const beautifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(beautifyButton).toBeTruthy();

    // Button should be disabled initially because input is empty
    expect(beautifyButton).toBeDisabled();
  });

  it('should expand advanced settings when clicked', async () => {
    render(<JsonBeautifierTool />);

    // Find and click the advanced settings button
    const advancedToggle = screen.getByRole('button', {
      name: /advanced settings/i,
    });
    expect(advancedToggle).toBeVisible();

    await user.click(advancedToggle);

    // Advanced options should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/sort keys/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/remove trailing commas/i),
      ).toBeInTheDocument();
    });
  });

  it('should show metadata after successful beautification', async () => {
    render(<JsonBeautifierTool />);

    const inputTextArea = screen.getByPlaceholderText(
      /paste your minified or unformatted json/i,
    );
    // Find the arrow button by its icon
    const beautifyButton = screen
      .getAllByRole('button')
      .find((button) =>
        button.querySelector('svg[data-testid="ArrowForwardIcon"]'),
      );
    expect(beautifyButton).toBeTruthy();

    // Enter complex JSON
    const complexJson =
      '{"name":"test","nested":{"key":"value"},"array":[1,2,3]}';
    await user.clear(inputTextArea);
    await user.paste(complexJson);

    // Beautify
    if (beautifyButton) {
      await user.click(beautifyButton);
    }

    // Wait for metadata to appear
    await waitFor(() => {
      expect(screen.getByText('Beautification Results')).toBeVisible();
      expect(screen.getByText('Original Size')).toBeVisible();
      expect(screen.getByText('Beautified Size')).toBeVisible();
    });
  });

  it('should expand advanced settings when custom preset is selected', async () => {
    render(<JsonBeautifierTool />);

    // Find preset dropdown
    const presetSelect = screen.getAllByRole('combobox')[0];
    expect(presetSelect).toBeVisible();

    // Ensure we start with standard preset by checking if accordion is collapsed
    const advancedToggle = screen.getByRole('button', {
      name: /advanced settings/i,
    });
    expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');

    // Change to custom preset
    if (presetSelect) {
      await user.click(presetSelect);
    }
    const customOption = screen.getByRole('option', { name: /custom/i });
    await user.click(customOption);

    // Advanced settings should now be expanded automatically
    await waitFor(() => {
      expect(advancedToggle).toHaveAttribute('aria-expanded', 'true');
    });

    // Verify the preset changed to custom
    expect(presetSelect).toHaveTextContent('Custom');
  });
});
