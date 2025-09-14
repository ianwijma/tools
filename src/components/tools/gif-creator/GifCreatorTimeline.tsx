'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Add as AddIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import type { GifCreatorOptions, GifFrame } from '@/types/gif-creator';
import { TimelineFrame } from './TimelineFrame';

interface GifCreatorTimelineProps {
  frames: GifFrame[];
  options: GifCreatorOptions;
  actualTotalDuration: number;
  onDragEnd: (event: DragEndEvent) => void;
  onFrameDurationChange: (frameId: string, duration: number) => void;
  onRemoveFrame: (frameId: string) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GifCreatorTimeline({
  frames,
  options,
  actualTotalDuration,
  onDragEnd,
  onFrameDurationChange,
  onRemoveFrame,
  onFileSelect,
}: GifCreatorTimelineProps): JSX.Element {
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Timeline calculations for proportional display
  const timelineWidth = 1200; // Fixed timeline width in pixels represents total duration
  const targetTotalDurationMs = options.totalDuration * 1000; // Target duration in ms
  const actualTotalDurationMs = frames.reduce(
    (sum, frame) => sum + frame.duration,
    0,
  );
  const pixelsPerMs =
    targetTotalDurationMs > 0 ? timelineWidth / targetTotalDurationMs : 1;

  return (
    <Box
      sx={{
        height: '420px',
        p: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Timeline</Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
            >
              Add Images
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={onFileSelect}
              />
            </Button>
          </Box>

          <Box
            sx={{
              flex: 1,
              border: '2px dashed #ccc',
              borderRadius: 1,
              backgroundColor: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Timeline Ruler */}
            {frames.length > 0 && (
              <Box
                sx={{
                  height: 24,
                  position: 'relative',
                  backgroundColor: 'grey.100',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {/* Target duration indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${timelineWidth}px`,
                    height: '100%',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    borderRight: '2px solid #1976d2',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: 2,
                      fontSize: 10,
                      color: 'primary.main',
                      fontWeight: 'bold',
                    }}
                  >
                    Target: {options.totalDuration}s
                  </Typography>
                </Box>

                {/* Actual duration indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 12,
                    width: `${(actualTotalDurationMs / targetTotalDurationMs) * timelineWidth}px`,
                    height: 12,
                    backgroundColor:
                      actualTotalDuration > options.totalDuration
                        ? 'rgba(255, 152, 0, 0.3)'
                        : 'rgba(76, 175, 80, 0.3)',
                    borderRight: `2px solid ${actualTotalDuration > options.totalDuration ? '#ff9800' : '#4caf50'}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: -2,
                      fontSize: 10,
                      color:
                        actualTotalDuration > options.totalDuration
                          ? 'warning.main'
                          : 'success.main',
                      fontWeight: 'bold',
                    }}
                  >
                    Actual: {actualTotalDuration.toFixed(1)}s
                  </Typography>
                </Box>
              </Box>
            )}

            {frames.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <UploadIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2">
                    Timeline will appear here once you add images
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  p: 1,
                }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={frames.map((f) => f.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        height: '100%',
                        minWidth: 'max-content',
                        alignItems: 'flex-start',
                        pb: 1, // Padding for scrollbar
                      }}
                    >
                      {frames.map((frame, index) => (
                        <TimelineFrame
                          key={frame.id}
                          frame={frame}
                          index={index}
                          pixelsPerMs={pixelsPerMs}
                          fps={options.fps}
                          onDurationChange={onFrameDurationChange}
                          onRemove={onRemoveFrame}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
