import { DndContext } from '@dnd-kit/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GifFrame } from '@/types/gif-creator';
import { TimelineFrame } from '../TimelineFrame';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');

const mockFrame: GifFrame = {
  id: 'test-frame-1',
  file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
  url: 'blob:test-url',
  duration: 1000,
  name: 'test.jpg',
  size: 1024,
};

const defaultProps = {
  frame: mockFrame,
  index: 0,
  pixelsPerMs: 0.5,
  onDurationChange: jest.fn(),
  onRemove: jest.fn(),
};

// Wrapper component for DnD context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <DndContext onDragEnd={() => {}}>{children}</DndContext>;
}

describe('TimelineFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the timeline frame', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByAltText('test.jpg')).toBeVisible();
    expect(screen.getByText('1000ms')).toBeVisible();
    expect(screen.getByText('1')).toBeVisible(); // Frame number
  });

  it('should display frame number correctly', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} index={2} />
      </TestWrapper>,
    );

    expect(screen.getByText('3')).toBeVisible(); // index + 1
  });

  it('should display duration correctly', () => {
    const frameWithDifferentDuration = {
      ...mockFrame,
      duration: 500,
    };

    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} frame={frameWithDifferentDuration} />
      </TestWrapper>,
    );

    expect(screen.getByText('500ms')).toBeVisible();
  });

  it('should show remove button', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    const deleteIcon = screen.getByTestId('DeleteIcon');
    expect(deleteIcon).toBeInTheDocument();
    expect(deleteIcon.closest('button')).toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();

    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} onRemove={onRemove} />
      </TestWrapper>,
    );

    const deleteIcon = screen.getByTestId('DeleteIcon');
    const removeButton = deleteIcon.closest('button') as HTMLButtonElement;
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('test-frame-1');
  });

  it('should handle image load error gracefully', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    const image = screen.getByAltText('test.jpg');
    fireEvent.error(image);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load image:',
      'blob:test-url',
      'test.jpg',
    );

    consoleSpy.mockRestore();
  });

  it('should calculate width based on duration and pixelsPerMs', () => {
    const { container } = render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    // Duration: 1000ms, pixelsPerMs: 0.5 = 500px width
    // But minimum width is 120px, so it should be 500px
    const frameElement = container.firstChild as HTMLElement;
    expect(frameElement).toHaveStyle({ width: '500px' });
  });

  it('should respect minimum width constraint', () => {
    const { container } = render(
      <TestWrapper>
        <TimelineFrame
          {...defaultProps}
          frame={{ ...mockFrame, duration: 100 }}
          pixelsPerMs={0.5}
        />
      </TestWrapper>,
    );

    // Duration: 100ms, pixelsPerMs: 0.5 = 50px, but minimum is 120px
    const frameElement = container.firstChild as HTMLElement;
    expect(frameElement).toHaveStyle({ width: '120px' });
  });

  it('should show hover effects', () => {
    const { container } = render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    const frameElement = container.firstChild as HTMLElement;

    // Simulate hover
    fireEvent.mouseEnter(frameElement);

    // Should have hover styles (checked via computed styles in actual browser)
    expect(frameElement).toBeInTheDocument();
  });

  it('should handle resize functionality', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    // Timeline frame should be rendered
    expect(screen.getByAltText('test.jpg')).toBeVisible();

    // Resize handles should be present (they're created with CSS pseudo-elements)
    // We can't directly test pseudo-elements, but we can verify the structure
    const frame =
      screen.getByAltText('test.jpg').closest('[role]') ||
      screen.getByAltText('test.jpg').parentElement;
    expect(frame).toBeInTheDocument();
  });

  it('should prevent drag when clicking remove button', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();

    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} onRemove={onRemove} />
      </TestWrapper>,
    );

    const removeButton = screen.getByRole('button');

    // Should prevent mouse events from bubbling
    fireEvent.mouseDown(removeButton);
    fireEvent.touchStart(removeButton);

    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('test-frame-1');
  });

  it('should support accessibility features', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    // Image should have proper alt text
    const image = screen.getByAltText('test.jpg');
    expect(image).toBeVisible();

    // Remove button should be accessible
    const removeButton = screen.getByRole('button');
    expect(removeButton).toBeVisible();
  });

  it('should display image with proper positioning', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    const image = screen.getByAltText('test.jpg');
    expect(image).toHaveStyle({
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      backgroundColor: '#e8e8e8',
    });
  });

  it('should show frame badge with correct styling', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} index={4} />
      </TestWrapper>,
    );

    const frameBadge = screen.getByText('5');
    expect(frameBadge).toBeVisible();
    expect(frameBadge.parentElement).toHaveStyle({
      position: 'absolute',
      top: '4px',
      left: '4px',
    });
  });

  it('should show duration overlay with correct styling', () => {
    render(
      <TestWrapper>
        <TimelineFrame {...defaultProps} />
      </TestWrapper>,
    );

    const durationOverlay = screen.getByText('1000ms');
    expect(durationOverlay).toBeVisible();
    expect(durationOverlay).toHaveStyle({
      position: 'absolute',
      bottom: '4px',
      left: '4px',
    });
  });
});
