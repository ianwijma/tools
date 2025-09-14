'use client';

import { Download as DownloadIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import type { GifCreatorOutput } from '@/types/gif-creator';

interface GifCreatorSuccessProps {
  result: GifCreatorOutput | null;
  onDownload: () => void;
  onClose: () => void;
}

export function GifCreatorSuccess({
  result,
  onDownload,
  onClose,
}: GifCreatorSuccessProps): JSX.Element | null {
  if (!result) {
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
      <Card sx={{ minWidth: 500, p: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="success.main">
            🎉 GIF Created Successfully!
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Frames
              </Typography>
              <Typography variant="h6">{result.metadata.frames}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Size
              </Typography>
              <Typography variant="h6">
                {(result.metadata.size / 1024).toFixed(1)}KB
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="h6">
                {(result.metadata.duration / 1000).toFixed(1)}s
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={onDownload}
              fullWidth
            >
              Download GIF
            </Button>
            <Button variant="outlined" onClick={onClose} fullWidth>
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
