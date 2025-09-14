'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { GifFrame } from '@/types/gif-creator';

interface TimelineFrameProps {
  frame: GifFrame;
  index: number;
  pixelsPerMs: number; // Scaling factor
  fps: number; // Used to calculate minimum frame duration
  onDurationChange: (frameId: string, duration: number) => void;
  onRemove: (frameId: string) => void;
}

export function TimelineFrame({
  frame,
  index,
  pixelsPerMs,
  fps,
  onDurationChange,
  onRemove,
}: TimelineFrameProps): JSX.Element {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate minimum duration based on FPS: exactly 1000/fps ms
  const minDurationMs = 1000 / fps;
  const minWidthPx = minDurationMs * pixelsPerMs;

  // Calculate actual pixel width based on frame duration
  const frameWidthPx = Math.max(frame.duration * pixelsPerMs, minWidthPx);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStartX(e.clientX);
      setResizeStartWidth(frameWidthPx);
    },
    [frameWidthPx],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent): void => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(minWidthPx, resizeStartWidth + deltaX);

      // Calculate minimum duration based on FPS: exactly 1000/fps ms
      const minDurationMs = 1000 / fps;
      const newDuration = Math.max(minDurationMs, newWidth / pixelsPerMs);

      // Update duration in real-time
      onDurationChange(frame.id, newDuration);
    },
    [
      isResizing,
      resizeStartX,
      resizeStartWidth,
      pixelsPerMs,
      fps,
      minWidthPx,
      frame.id,
      onDurationChange,
    ],
  );

  const handleResizeEnd = useCallback((): void => {
    setIsResizing(false);
  }, []);

  // Add/remove global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return (): void => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        width: `${frameWidthPx}px`,
        height: '100%',
        maxHeight: 250,
        minWidth: 80,
        backgroundColor: 'white',
        border: isResizing ? '2px solid #1976d2' : '1px solid #ddd',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      }}
      {...attributes}
    >
      {/* Full Background Image with Drag Area */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Draggable Area (excludes corners with controls) */}
        <Box
          {...listeners}
          sx={{
            position: 'absolute',
            top: 32, // Below frame number and trash icon
            left: 0,
            right: 0,
            bottom: 32, // Above duration overlay
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 1,
          }}
        />

        <Box
          component="img"
          src={frame.url}
          alt={frame.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Center image and show full image
            backgroundColor: '#e8e8e8', // Soft gray background
            display: 'block',
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', frame.name);
          }}
          onError={(e) => {
            console.error('Failed to load image:', frame.url, frame.name);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';

            // Show filename as fallback
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.textContent = frame.name;
              fallback.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background: #f0f0f0;
                font-size: 10px;
                text-align: center;
                word-break: break-all;
              `;
              parent.appendChild(fallback);
            }
          }}
        />

        {/* Duration Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            right: 12, // Leave space for resize handle
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'center',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none', // Don't interfere with dragging
          }}
        >
          {frame.duration}ms
        </Box>

        {/* Frame Number Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            backgroundColor: 'rgba(25, 118, 210, 0.9)',
            color: 'white',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: 10,
            fontWeight: 'bold',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none', // Don't interfere with dragging
          }}
        >
          {index + 1}
        </Box>

        {/* Remove Button */}
        <IconButton
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent drag sensor from activating
          }}
          onTouchStart={(e) => {
            e.stopPropagation(); // Prevent touch drag from starting
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            e.preventDefault(); // Prevent default behavior
            onRemove(frame.id);
          }}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'white',
            backgroundColor: 'rgba(244, 67, 54, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 1)',
            },
            width: 24,
            height: 24,
            backdropFilter: 'blur(4px)',
            zIndex: 100, // Ensure it's above the drag area
          }}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Left Resize Handle */}
      <Box
        onMouseDown={(e) => {
          e.stopPropagation();
          handleResizeStart(e);
        }}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 8,
          height: '100%',
          backgroundColor: isResizing
            ? 'rgba(25, 118, 210, 0.3)'
            : 'transparent',
          cursor: 'ew-resize',
          zIndex: 3,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.3)',
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            left: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 20,
            backgroundColor: isResizing
              ? '#1976d2'
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
            transition: 'background-color 0.2s ease',
          },
        }}
      />

      {/* Right Resize Handle */}
      <Box
        onMouseDown={(e) => {
          e.stopPropagation();
          handleResizeStart(e);
        }}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 8,
          height: '100%',
          backgroundColor: isResizing
            ? 'rgba(25, 118, 210, 0.3)'
            : 'transparent',
          cursor: 'ew-resize',
          zIndex: 3,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.3)',
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            right: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 20,
            backgroundColor: isResizing
              ? '#1976d2'
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
            transition: 'background-color 0.2s ease',
          },
        }}
      />
    </Box>
  );
}
