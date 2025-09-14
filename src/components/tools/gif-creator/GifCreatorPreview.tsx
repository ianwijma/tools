'use client';

import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import type { GifFrame } from '@/types/gif-creator';

interface GifCreatorPreviewProps {
  frames: GifFrame[];
  isPreviewPlaying: boolean;
  isPreviewUpdating: boolean;
  isCreating: boolean;
  previewImageRef: React.RefObject<HTMLImageElement>;
  onCreateGif: () => void;
}

export function GifCreatorPreview({
  frames,
  isPreviewUpdating,
  isCreating,
  previewImageRef,
  onCreateGif,
}: GifCreatorPreviewProps): JSX.Element {
  return (
    <Box
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
    >
      <Card sx={{ flex: 1, m: 2, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Preview</Typography>
            {frames.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  onClick={onCreateGif}
                  disabled={frames.length === 0 || isCreating}
                  color="primary"
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '2px dashed #ccc',
              borderRadius: 1,
              position: 'relative',
              minHeight: 200,
            }}
          >
            {frames.length === 0 ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <PreviewIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">Add images to see preview</Typography>
                <Typography variant="body2">
                  Drop images or click &quot;Add Images&quot; to get started
                </Typography>
              </Box>
            ) : (
              <>
                <img
                  ref={previewImageRef}
                  alt="GIF Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    opacity: isPreviewUpdating ? 0.5 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                />
                {isPreviewUpdating && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                    <Typography variant="caption">
                      Updating preview...
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
