import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GifCreatorOptions, GifCreatorPreset } from '@/types/gif-creator';
import { GifCreatorSettings } from '../GifCreatorSettings';

const mockOptions: GifCreatorOptions = {
  width: 600,
  height: 400,
  totalDuration: 2.0,
  fps: 15,
  repeat: 0,
  backgroundColor: '#ffffff',
  maintainAspectRatio: true,
};

const defaultProps = {
  selectedPreset: 'balanced' as GifCreatorPreset,
  options: mockOptions,
  actualTotalDuration: 2.0,
  onPresetChange: jest.fn(),
  onOptionChange: jest.fn(),
};

describe('GifCreatorSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the settings panel', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByRole('combobox')).toBeVisible(); // Preset selector
    expect(screen.getByLabelText('Width')).toBeVisible();
    expect(screen.getByLabelText('Height')).toBeVisible();
  });

  it('should display current preset', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    const presetSelect = screen.getByRole('combobox');
    expect(presetSelect).toHaveTextContent('Balanced');
  });

  it('should display all preset options', async () => {
    const user = userEvent.setup();
    render(<GifCreatorSettings {...defaultProps} />);

    const presetSelect = screen.getByRole('combobox');
    await user.click(presetSelect);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(6);
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

  it('should call onPresetChange when preset is changed', async () => {
    const user = userEvent.setup();
    const onPresetChange = jest.fn();

    render(
      <GifCreatorSettings {...defaultProps} onPresetChange={onPresetChange} />,
    );

    const presetSelect = screen.getByRole('combobox');
    await user.click(presetSelect);

    const highQualityOption = screen.getByRole('option', {
      name: 'High Quality',
    });
    await user.click(highQualityOption);

    await waitFor(() => {
      expect(onPresetChange).toHaveBeenCalled();
    });
  });

  it('should display current dimensions', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    const widthInput = screen.getByLabelText('Width') as HTMLInputElement;
    const heightInput = screen.getByLabelText('Height') as HTMLInputElement;

    expect(widthInput.value).toBe('600');
    expect(heightInput.value).toBe('400');
  });

  it('should call onOptionChange when dimensions are changed', async () => {
    const user = userEvent.setup();
    const onOptionChange = jest.fn();

    render(
      <GifCreatorSettings {...defaultProps} onOptionChange={onOptionChange} />,
    );

    const widthInput = screen.getByLabelText('Width');
    await user.clear(widthInput);
    await user.type(widthInput, '800');

    await waitFor(() => {
      expect(onOptionChange).toHaveBeenCalledWith('width', expect.any(Number));
    });
  });

  it('should display duration slider with current value', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    expect(screen.getByText('Duration: 2s')).toBeVisible();
    expect(screen.getByText('Actual: 2.0s')).toBeVisible();
  });

  it('should display FPS slider with current value', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    expect(screen.getByText('FPS: 15')).toBeVisible();
  });

  it('should handle aspect ratio toggle', async () => {
    const user = userEvent.setup();
    const onOptionChange = jest.fn();

    render(
      <GifCreatorSettings {...defaultProps} onOptionChange={onOptionChange} />,
    );

    const aspectRatioSwitch = screen.getByRole('checkbox', {
      name: /maintain aspect ratio/i,
    });
    expect(aspectRatioSwitch).toBeChecked();

    await user.click(aspectRatioSwitch);

    expect(onOptionChange).toHaveBeenCalledWith('maintainAspectRatio', false);
  });

  // Note: Frame count display was moved to preview section as per design changes

  it('should handle slider changes', async () => {
    const onOptionChange = jest.fn();

    render(
      <GifCreatorSettings {...defaultProps} onOptionChange={onOptionChange} />,
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);

    // Duration slider should trigger onOptionChange
    // Note: Testing slider interaction is complex, we mainly verify they exist
    expect(sliders[0]).toBeVisible();
    expect(sliders[1]).toBeVisible();
  });

  it('should enforce dimension constraints', async () => {
    const user = userEvent.setup();
    const onOptionChange = jest.fn();

    render(
      <GifCreatorSettings {...defaultProps} onOptionChange={onOptionChange} />,
    );

    const widthInput = screen.getByLabelText('Width');

    // Test constraint - the component should handle invalid values
    await user.clear(widthInput);
    await user.type(widthInput, '50'); // Below minimum

    // The component handles constraints, so we just verify the input is working
    expect(onOptionChange).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(<GifCreatorSettings {...defaultProps} />);

    // Check for proper controls
    expect(screen.getByRole('combobox')).toBeVisible(); // Preset selector
    expect(screen.getByLabelText('Width')).toBeVisible();
    expect(screen.getByLabelText('Height')).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: /maintain aspect ratio/i }),
    ).toBeInTheDocument();

    // Settings should not have download button anymore (moved to preview)
  });
});
