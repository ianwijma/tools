'use client';

import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from '@mui/material';
import type { GifGenerationProgress } from '@/types/gif-creator';

interface GifCreatorProgressProps {
  isCreating: boolean;
  progress: GifGenerationProgress | null;
}

export function GifCreatorProgress({
  isCreating,
  progress,
}: GifCreatorProgressProps): JSX.Element | null {
  if (!isCreating && !progress) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Card sx={{ minWidth: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {progress?.stage === 'preparing' && 'Preparing...'}
            {progress?.stage === 'processing' && 'Processing Frames...'}
            {progress?.stage === 'encoding' && 'Encoding GIF...'}
            {progress?.stage === 'finalizing' && 'Finalizing...'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress?.progress ?? 0}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {progress?.message ?? 'Starting...'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
