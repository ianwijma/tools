'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Gif as GifIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import { Alert, Box, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GifCreator } from '@/lib/gif-creator';
import type {
  GifCreatorInput,
  GifCreatorOptions,
  GifCreatorOutput,
  GifCreatorPreset,
  GifFrame,
  GifGenerationProgress,
} from '@/types/gif-creator';
import { GifCreatorPreview } from './gif-creator/GifCreatorPreview';
import { GifCreatorProgress } from './gif-creator/GifCreatorProgress';
import { GifCreatorSettings } from './gif-creator/GifCreatorSettings';
import { GifCreatorSuccess } from './gif-creator/GifCreatorSuccess';
import { GifCreatorTimeline } from './gif-creator/GifCreatorTimeline';

// Default options for different presets
const presetOptions: Record<GifCreatorPreset, GifCreatorOptions> = {
  'high-quality': {
    width: 800,
    height: 600,
    totalDuration: 3.0,
    fps: 24,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
  balanced: {
    width: 600,
    height: 400,
    totalDuration: 2.0,
    fps: 15,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
  fast: {
    width: 400,
    height: 300,
    totalDuration: 1.5,
    fps: 12,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
  tiny: {
    width: 200,
    height: 150,
    totalDuration: 1.0,
    fps: 8,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
  smooth: {
    width: 600,
    height: 400,
    totalDuration: 3.0,
    fps: 30,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
  custom: {
    width: 600,
    height: 400,
    totalDuration: 2.0,
    fps: 15,
    repeat: 0,
    backgroundColor: '#ffffff',
    maintainAspectRatio: true,
  },
};

export function GifCreatorTool(): JSX.Element {
  // State management
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<GifCreatorPreset>('balanced');
  const [options, setOptions] = useState<GifCreatorOptions>(
    presetOptions.balanced,
  );
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GifGenerationProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<GifCreatorOutput | null>(null);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [isPreviewPlaying] = useState<boolean>(true);
  const [isPreviewUpdating, setIsPreviewUpdating] = useState<boolean>(false);

  // Canvas ref for preview
  const previewImageRef = useRef<HTMLImageElement>(null);

  // Create unique ID for frames
  const createFrameId = useCallback(
    (): string =>
      `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  // Update options when preset changes
  useEffect(() => {
    if (selectedPreset !== 'custom') {
      const newOptions = presetOptions[selectedPreset];
      setOptions(newOptions);

      // Don't reset frame durations when changing presets - preserve user's timeline adjustments
      // Users can manually adjust durations if they want them to match the preset's total duration
    }
  }, [selectedPreset]);

  // Debounced preview update to reduce lag during timeline interactions
  useEffect(() => {
    // Set updating state immediately when changes occur
    setIsPreviewUpdating(true);

    // Clear any existing timeout
    const timeoutId = setTimeout(async () => {
      if (frames.length > 0 && previewImageRef.current && isPreviewPlaying) {
        console.log('Starting debounced preview with', frames.length, 'frames');
        try {
          await GifCreator.startPreview(previewImageRef.current, frames, {
            width: options.width,
            height: options.height,
            fps: options.fps,
            maintainAspectRatio: options.maintainAspectRatio,
          });
        } catch (error) {
          console.error('Preview generation failed:', error);
        } finally {
          setIsPreviewUpdating(false);
        }
      } else {
        GifCreator.stopPreview();
        setIsPreviewUpdating(false);
      }
    }, 500); // 500ms delay after last change

    // Cleanup timeout on new changes or unmount
    return (): void => {
      clearTimeout(timeoutId);
      // Don't stop preview immediately, let the new one replace it
    };
  }, [frames, options, isPreviewPlaying]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return (): void => {
      frames.forEach((frame) => {
        if (frame.url) {
          URL.revokeObjectURL(frame.url);
        }
      });
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [frames, resultUrl]);

  // Prevent page reload when images are added
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (frames.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [frames.length]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      console.log('File input changed!');
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) {
        console.log('No files selected');
        return;
      }

      console.log(`Selected ${fileList.length} files`);
      const newFrames: GifFrame[] = [];
      // Use FPS-based duration: exactly 1000/fps ms per frame, default to 4 frames worth
      const defaultDuration = (1000 / options.fps) * 4;

      Array.from(fileList).forEach((file) => {
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        // Basic validation
        if (!file.type.startsWith('image/')) {
          console.log(`File ${file.name} is not an image`);
          setWarnings((prev) => [
            ...prev,
            `File "${file.name}" is not an image`,
          ]);
          return;
        }

        const frame: GifFrame = {
          id: createFrameId(),
          file,
          url: URL.createObjectURL(file),
          duration: defaultDuration,
          name: file.name,
          size: file.size,
        };
        console.log('Created frame:', frame);
        newFrames.push(frame);
      });

      console.log(`Adding ${newFrames.length} new frames`);
      setFrames((prev) => {
        const updated = [...prev, ...newFrames];
        console.log('Total frames after update:', updated.length);
        return updated;
      });
      setError('');
      setWarnings([]);

      // Reset file input
      event.target.value = '';
    },
    [options.fps, createFrameId],
  );

  // Handle preset change
  const handlePresetChange = useCallback(
    (event: SelectChangeEvent<GifCreatorPreset>): void => {
      const preset = event.target.value as GifCreatorPreset;
      setSelectedPreset(preset);
    },
    [],
  );

  // Handle option changes
  const handleOptionChange = useCallback(
    <T extends keyof GifCreatorOptions>(
      key: T,
      value: GifCreatorOptions[T],
    ): void => {
      setOptions((prev) => ({ ...prev, [key]: value }));
      setSelectedPreset('custom'); // Mark as custom when manually changed

      // Update frame durations proportionally if total duration changed
      if (key === 'totalDuration' && frames.length > 0) {
        const oldTotalDuration = options.totalDuration;
        const newTotalDuration = value as number;
        const scaleFactor = newTotalDuration / oldTotalDuration;

        setFrames((prev) =>
          prev.map((frame) => ({
            ...frame,
            duration: Math.round(frame.duration * scaleFactor),
          })),
        );
      }
    },
    [frames.length, options.totalDuration],
  );

  // Handle frame reordering via drag and drop
  const handleDragEnd = useCallback((event: DragEndEvent): void => {
    const { active, over } = event;

    // Handle reordering within timeline
    if (over && active.id !== over.id) {
      setFrames((frames) => {
        const oldIndex = frames.findIndex((frame) => frame.id === active.id);
        const newIndex = frames.findIndex((frame) => frame.id === over.id);
        return arrayMove(frames, oldIndex, newIndex);
      });
    }
  }, []);

  // Handle frame duration change
  const handleFrameDurationChange = useCallback(
    (frameId: string, duration: number): void => {
      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === frameId ? { ...frame, duration } : frame,
        ),
      );
    },
    [],
  );

  // Handle frame removal
  const handleRemoveFrame = useCallback((frameId: string): void => {
    setFrames((prev) => {
      const frame = prev.find((f) => f.id === frameId);
      if (frame?.url) {
        URL.revokeObjectURL(frame.url);
      }
      return prev.filter((f) => f.id !== frameId);
    });
  }, []);

  // Handle GIF creation
  const handleCreateGif = useCallback(async (): Promise<void> => {
    if (frames.length === 0) {
      setError('Please add at least one image');
      return;
    }

    console.log('Create GIF button clicked! Frames:', frames.length);
    setIsCreating(true);
    setError('');
    setWarnings([]);
    setResult(null);
    setProgress(null);

    console.log('Starting GIF creation...');

    try {
      const input: GifCreatorInput = {
        frames,
        options,
      };

      const result = await GifCreator.createGif(input, (progress) => {
        console.log('GIF creation progress:', progress);
        setProgress(progress);
      });

      if ('message' in result) {
        // Error occurred
        console.error('GIF creation failed:', result);
        setError(result.message);
      } else {
        // Success
        console.log('GIF creation successful:', result);
        setResult(result);

        // Create download URL
        const url = URL.createObjectURL(result.result);
        setResultUrl(url);
      }
    } catch (error) {
      console.error('Unexpected error during GIF creation:', error);
      setError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    } finally {
      setIsCreating(false);
      setProgress(null);
    }
  }, [frames, options]);

  // Handle download
  const handleDownload = useCallback((): void => {
    if (!result || !resultUrl) return;

    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `animated-gif-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result, resultUrl]);

  // Calculate actual total duration from frame durations
  const actualTotalDuration =
    frames.reduce((sum, frame) => sum + frame.duration, 0) / 1000;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <GifIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          GIF Editor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create animated GIFs from images with timeline control and custom
          settings
        </Typography>
      </Box>

      {/* Main Content Area - Fixed height for top section */}
      <Box sx={{ height: '400px', display: 'flex' }}>
        {/* Left Panel - Settings */}
        <GifCreatorSettings
          selectedPreset={selectedPreset}
          options={options}
          actualTotalDuration={actualTotalDuration}
          onPresetChange={handlePresetChange}
          onOptionChange={handleOptionChange}
        />

        {/* Right Panel - Preview */}
        <GifCreatorPreview
          frames={frames}
          isPreviewPlaying={isPreviewPlaying}
          isPreviewUpdating={isPreviewUpdating}
          isCreating={isCreating}
          previewImageRef={previewImageRef}
          onCreateGif={handleCreateGif}
        />
      </Box>

      {/* Bottom Panel - Timeline */}
      <GifCreatorTimeline
        frames={frames}
        options={options}
        actualTotalDuration={actualTotalDuration}
        onDragEnd={handleDragEnd}
        onFrameDurationChange={handleFrameDurationChange}
        onRemoveFrame={handleRemoveFrame}
        onFileSelect={handleFileSelect}
      />

      {/* Progress Overlay */}
      <GifCreatorProgress isCreating={isCreating} progress={progress} />

      {/* Error/Warning Snackbars */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError('')}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          {error}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          {warnings.map((warning) => (
            <Alert key={warning} severity="warning" sx={{ mb: 1 }}>
              {warning}
            </Alert>
          ))}
        </Box>
      )}

      {/* Success Dialog */}
      <GifCreatorSuccess
        result={result}
        onDownload={handleDownload}
        onClose={() => setResult(null)}
      />
    </Box>
  );
}

export default GifCreatorTool;
