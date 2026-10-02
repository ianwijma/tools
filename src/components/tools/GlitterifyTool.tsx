'use client';

import {
  Archive as ArchiveIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as GlitterIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import JSZip from 'jszip';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_OPTIONS,
  encodeGlitterGif,
  formatBytes,
  type GlitterOptions,
  gifFileName,
  ORIGINAL_MAX,
} from '@/lib/glitter';
import type {
  GlitterifyFile,
  GlitterifyOutput,
  GlitterifyProgress,
} from '@/types/glitter-ify';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 100;

type SizeOption = number | 'original';

const SIZE_OPTIONS: Array<{
  value: SizeOption;
  label: string;
  hint: string;
}> = [
  { value: 'original', label: 'Original', hint: `max ${ORIGINAL_MAX} px` },
  { value: 320, label: 'Small', hint: '320 px · smallest file' },
  { value: 480, label: 'Medium', hint: '480 px · recommended' },
  { value: 640, label: 'Large', hint: '640 px · biggest file' },
];

// Reset a completed file back to its pending state
const toPendingFile = (file: GlitterifyFile): GlitterifyFile => ({
  file: file.file,
  id: file.id,
  name: file.name,
  originalFormat: file.originalFormat,
  originalSize: file.originalSize,
  status: 'pending',
});

export function GlitterifyTool(): JSX.Element {
  // State management
  const [files, setFiles] = useState<GlitterifyFile[]>([]);
  const [options, setOptions] = useState<GlitterOptions>(DEFAULT_OPTIONS);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<GlitterifyProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<GlitterifyOutput | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // Object URL bookkeeping so previews can be revoked deterministically
  const urlCache = useRef<Set<string>>(new Set());

  // Computed file lists
  const pendingFiles = useMemo(
    () =>
      files.filter((f) => f.status === 'pending' || f.status === 'processing'),
    [files],
  );
  const completedFiles = useMemo(
    () => files.filter((f) => f.status === 'success' || f.status === 'error'),
    [files],
  );
  const successfulFiles = useMemo(
    () => files.filter((f) => f.status === 'success'),
    [files],
  );

  const createObjectUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urlCache.current.add(url);
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url?: string): void => {
    if (!url) return;
    URL.revokeObjectURL(url);
    urlCache.current.delete(url);
  }, []);

  // Build a file entry and flag it when it cannot be processed
  const buildFileEntry = useCallback((file: File): GlitterifyFile => {
    const isImage = file.type.startsWith('image/');
    const isSizeValid = file.size <= MAX_FILE_SIZE;
    const isSupported = isImage && isSizeValid;
    let errorMessage = '';

    if (!isImage) {
      errorMessage = `Unsupported format: ${file.type || 'unknown'}`;
    } else if (!isSizeValid) {
      errorMessage = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    return {
      file,
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      originalFormat: file.type.split('/')[1] ?? 'unknown',
      originalSize: file.size,
      status: isSupported ? 'pending' : 'error',
      ...(isSupported ? {} : { error: errorMessage }),
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFiles = Array.from(event.target.files ?? []);
      setFiles((prev) => {
        const merged = [...prev];
        for (const entry of selectedFiles.map(buildFileEntry)) {
          const existing = merged.findIndex((f) => f.id === entry.id);
          if (existing === -1 && merged.length < MAX_FILES) {
            merged.push(entry);
          }
        }
        return merged.slice(0, MAX_FILES);
      });
      event.target.value = '';
      setError('');
    },
    [buildFileEntry],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      const droppedFiles = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      );
      setFiles((prev) => {
        const merged = [...prev];
        for (const entry of droppedFiles.map(buildFileEntry)) {
          const existing = merged.findIndex((f) => f.id === entry.id);
          if (existing === -1 && merged.length < MAX_FILES) {
            merged.push(entry);
          }
        }
        return merged.slice(0, MAX_FILES);
      });
      setError('');
    },
    [buildFileEntry],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
    },
    [],
  );

  // Remove file from list
  const removeFile = useCallback(
    (fileId: string): void => {
      setFiles((prev) => {
        const target = prev.find((f) => f.id === fileId);
        if (target) revokeObjectUrl(target.previewUrl);
        return prev.filter((f) => f.id !== fileId);
      });
    },
    [revokeObjectUrl],
  );

  // Clear all files
  const clearAllFiles = useCallback((): void => {
    setFiles((prev) => {
      prev.forEach((file) => {
        revokeObjectUrl(file.previewUrl);
      });
      return [];
    });
    setResults(null);
    setProgress(null);
    setError('');
  }, [revokeObjectUrl]);

  // Clear completed files only
  const clearCompletedFiles = useCallback((): void => {
    setFiles((prev) => {
      prev.forEach((file) => {
        if (file.status === 'success' || file.status === 'error') {
          revokeObjectUrl(file.previewUrl);
        }
      });
      return prev.filter(
        (file) => file.status === 'pending' || file.status === 'processing',
      );
    });
    setResults(null);
    setProgress(null);
    setError('');
  }, [revokeObjectUrl]);

  // Move a single completed file back to pending for re-processing
  const moveBackToPending = useCallback(
    (fileId: string): void => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id !== fileId) return file;
          revokeObjectUrl(file.previewUrl);
          return toPendingFile(file);
        }),
      );
    },
    [revokeObjectUrl],
  );

  // Move all completed files back to pending for re-processing
  const moveAllBackToPending = useCallback((): void => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.status !== 'success' && file.status !== 'error') {
          return file;
        }
        revokeObjectUrl(file.previewUrl);
        return toPendingFile(file);
      }),
    );
    setResults(null);
    setProgress(null);
    setError('');
  }, [revokeObjectUrl]);

  // Handle menu open/close
  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>): void => {
      setMenuAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleMenuClose = useCallback((): void => {
    setMenuAnchorEl(null);
  }, []);

  // Handle option changes
  const handleSizeChange = useCallback(
    (event: SelectChangeEvent<string>): void => {
      const value = event.target.value;
      setOptions((prev) => ({
        ...prev,
        size: value === 'original' ? 'original' : Number(value),
      }));
    },
    [],
  );

  // Start the glitter-ify process
  const handleConvert = useCallback(async (): Promise<void> => {
    const queue = files.filter((f) => f.status === 'pending');
    if (queue.length === 0) {
      setError('Please select images to glitter-ify');
      return;
    }

    setIsConverting(true);
    setError('');

    const totalFiles = queue.length;
    let processedFiles = 0;
    const totals = {
      totalFiles,
      successCount: 0,
      errorCount: 0,
      totalOriginalSize: 0,
      totalOutputSize: 0,
    };

    try {
      for (const item of queue) {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === item.id
              ? { ...file, status: 'processing' as const }
              : file,
          ),
        );
        setProgress({
          totalFiles,
          processedFiles,
          percentage: (processedFiles / totalFiles) * 100,
          currentFile: item.name,
        });

        try {
          // Files are processed sequentially so per-file progress can be shown
          // eslint-disable-next-line no-await-in-loop
          const bitmap = await createImageBitmap(item.file);
          // eslint-disable-next-line no-await-in-loop
          const blob = await encodeGlitterGif(
            bitmap,
            options,
            (fileProgress) => {
              setProgress({
                totalFiles,
                processedFiles,
                percentage:
                  ((processedFiles + fileProgress) / totalFiles) * 100,
                currentFile: item.name,
              });
            },
          );
          bitmap.close();

          const previewUrl = createObjectUrl(blob);
          setFiles((prev) =>
            prev.map((file) =>
              file.id === item.id
                ? {
                    ...file,
                    status: 'success' as const,
                    outputSize: blob.size,
                    previewUrl,
                  }
                : file,
            ),
          );
          totals.successCount += 1;
          totals.totalOriginalSize += item.file.size;
          totals.totalOutputSize += blob.size;
        } catch (conversionError) {
          setFiles((prev) =>
            prev.map((file) =>
              file.id === item.id
                ? {
                    ...file,
                    status: 'error' as const,
                    error:
                      conversionError instanceof Error
                        ? conversionError.message
                        : 'Could not convert this image',
                  }
                : file,
            ),
          );
          totals.errorCount += 1;
          totals.totalOriginalSize += item.file.size;
        }

        processedFiles += 1;
      }

      setResults({ metadata: totals });
    } catch (unexpectedError) {
      setError(
        `Glitter-ify failed: ${unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error'}`,
      );
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  }, [files, options, createObjectUrl]);

  // Download single converted file
  const downloadFile = useCallback(
    (fileId: string): void => {
      const target = files.find((f) => f.id === fileId);
      if (!target?.previewUrl) return;

      const a = document.createElement('a');
      a.href = target.previewUrl;
      a.download = gifFileName(target.name);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [files],
  );

  // Download all as ZIP
  const downloadAllAsZip = useCallback(async (): Promise<void> => {
    if (successfulFiles.length === 0) return;

    try {
      const zip = new JSZip();
      const used = new Map<string, number>();

      // Add each generated GIF to the ZIP, de-duplicating file names
      for (const file of successfulFiles) {
        if (!file.previewUrl) continue;
        // eslint-disable-next-line no-await-in-loop
        const blob = await (await fetch(file.previewUrl)).blob();
        let fileName = gifFileName(file.name);
        const seen = used.get(fileName) ?? 0;
        used.set(fileName, seen + 1);
        if (seen > 0) {
          const base = fileName.replace(/\.gif$/, '');
          fileName = `${base}-${seen + 1}.gif`;
        }
        zip.file(fileName, blob);
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glitter-gifs-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (zipError) {
      setError(
        `Failed to create ZIP file: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`,
      );
    }
  }, [successfulFiles]);

  // Get status color for file
  const getStatusColor = (
    status: GlitterifyFile['status'],
  ): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'processing':
        return 'primary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: GlitterifyFile['status']): React.ReactNode => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <RefreshIcon color="primary" />;
      default:
        return <ImageIcon />;
    }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Tool Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Glitter-ify
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Turn images into sparkly animated glitter GIFs with sequin frames and
          twinkling sparkles. Add one or more images and process them from left
          to right. All processing happens in your browser for privacy and
          speed.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Glitter Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>GIF Size</InputLabel>
                    <Select
                      value={String(options.size)}
                      onChange={handleSizeChange}
                      label="GIF Size"
                    >
                      {SIZE_OPTIONS.map((option) => (
                        <MenuItem
                          key={String(option.value)}
                          value={String(option.value)}
                        >
                          {option.label} ({option.hint})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Larger sizes look sharper but produce bigger files. Images
                    are never upscaled.
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>
                      Frames: {options.frames}
                    </Typography>
                    <Slider
                      value={options.frames}
                      onChange={(_, value) =>
                        setOptions((prev) => ({
                          ...prev,
                          frames: value as number,
                        }))
                      }
                      min={4}
                      max={40}
                      step={2}
                      marks
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>
                      Frame Delay: {options.delay} ms
                    </Typography>
                    <Slider
                      value={options.delay}
                      onChange={(_, value) =>
                        setOptions((prev) => ({
                          ...prev,
                          delay: value as number,
                        }))
                      }
                      min={20}
                      max={200}
                      step={10}
                      marks
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Input and Output Section with Transform Button */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'stretch',
              minHeight: '600px',
            }}
          >
            {/* Input Section */}
            <Paper
              sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Upload Images</Typography>
              </Box>

              {/* File Upload Area */}
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  backgroundColor: 'background.default',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  mb: 2,
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <UploadIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Drop images here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports JPEG, PNG, WebP, BMP, GIF, and more
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Max 50MB per file, up to {MAX_FILES} files
                </Typography>
              </Paper>

              {/* Files List */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Images to Glitter-ify ({pendingFiles.length})
                </Typography>

                {pendingFiles.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No images selected
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 250, overflow: 'auto', mb: 1 }}>
                    {pendingFiles.map((file, index) => (
                      <Box key={file.id}>
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon>
                            {getStatusIcon(file.status)}
                          </ListItemIcon>
                          <ListItemText
                            sx={{ mr: 20 }}
                            primary={
                              <Typography variant="body2" noWrap>
                                {file.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {file.originalFormat.toUpperCase()} •{' '}
                                  {formatBytes(file.originalSize)}
                                </Typography>
                                {file.error && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ display: 'block' }}
                                    noWrap
                                  >
                                    {file.error}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                              }}
                            >
                              <Chip
                                label={file.status}
                                color={getStatusColor(file.status)}
                                size="small"
                                variant="outlined"
                              />
                              <IconButton
                                edge="end"
                                onClick={() => removeFile(file.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < pendingFiles.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}

                {files.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={clearAllFiles}
                      startIcon={<DeleteIcon />}
                      size="small"
                      color="error"
                    >
                      Clear All Files
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Transform Button - Centered between panels */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <Button
                variant="contained"
                onClick={handleConvert}
                disabled={isConverting || pendingFiles.length === 0}
                aria-label="Glitter-ify images"
                sx={{
                  minWidth: 56,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  p: 0,
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    transform: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ArrowForwardIcon sx={{ fontSize: 24 }} />
              </Button>
            </Box>

            {/* Output Section - Completed Files */}
            <Paper
              sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Glitter GIFs ({completedFiles.length})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {completedFiles.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<ExpandMoreIcon />}
                        onClick={handleMenuOpen}
                        sx={{ minWidth: 'auto' }}
                      >
                        Actions
                      </Button>
                      <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{
                          horizontal: 'right',
                          vertical: 'top',
                        }}
                        anchorOrigin={{
                          horizontal: 'right',
                          vertical: 'bottom',
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            moveAllBackToPending();
                            handleMenuClose();
                          }}
                        >
                          <RefreshIcon sx={{ mr: 1, fontSize: 18 }} />
                          Move All Back
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            clearCompletedFiles();
                            handleMenuClose();
                          }}
                        >
                          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
                          Clear Completed
                        </MenuItem>
                        {successfulFiles.length > 0 && (
                          <MenuItem
                            onClick={() => {
                              downloadAllAsZip();
                              handleMenuClose();
                            }}
                          >
                            <ArchiveIcon sx={{ mr: 1, fontSize: 18 }} />
                            Download ZIP
                          </MenuItem>
                        )}
                      </Menu>
                    </>
                  )}
                </Box>
              </Box>

              {/* Progress Display */}
              {progress && (
                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <GlitterIcon color="primary" fontSize="small" />
                    <Typography variant="body2">Adding glitter...</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {progress.processedFiles} of {progress.totalFiles} files
                    processed ({Math.round(progress.percentage)}%)
                  </Typography>
                  {progress.currentFile && (
                    <Typography variant="caption" color="text.secondary">
                      Currently processing: {progress.currentFile}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Completed Files List */}
              <Box sx={{ flexGrow: 1 }}>
                {completedFiles.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      Glitter GIFs will appear here after processing
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {completedFiles.map((file, index) => (
                      <Box key={file.id}>
                        <ListItem>
                          {file.previewUrl ? (
                            <Box
                              component="img"
                              src={file.previewUrl}
                              alt={`Animated glitter version of ${file.name}`}
                              sx={{
                                width: 56,
                                height: 56,
                                mr: 2,
                                borderRadius: 1,
                                objectFit: 'cover',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                          ) : (
                            <ListItemIcon>
                              {getStatusIcon(file.status)}
                            </ListItemIcon>
                          )}
                          <ListItemText
                            sx={{ mr: 2 }}
                            primary={
                              <Typography variant="body2" noWrap>
                                {file.status === 'success'
                                  ? gifFileName(file.name)
                                  : file.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {file.originalFormat.toUpperCase()} •{' '}
                                  {formatBytes(file.originalSize)}
                                  {file.outputSize !== undefined && (
                                    <> → GIF • {formatBytes(file.outputSize)}</>
                                  )}
                                </Typography>
                                {file.error && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ display: 'block' }}
                                    noWrap
                                  >
                                    {file.error}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                              }}
                            >
                              <Chip
                                label={file.status}
                                color={getStatusColor(file.status)}
                                size="small"
                                variant="outlined"
                              />
                              <IconButton
                                edge="end"
                                onClick={() => moveBackToPending(file.id)}
                                size="small"
                                title="Move back to pending for re-processing"
                              >
                                <RefreshIcon />
                              </IconButton>
                              {file.status === 'success' && (
                                <IconButton
                                  edge="end"
                                  onClick={() => downloadFile(file.id)}
                                  size="small"
                                  title="Download glitter GIF"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              )}
                              <IconButton
                                edge="end"
                                onClick={() => removeFile(file.id)}
                                size="small"
                                title="Remove file"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < completedFiles.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ fontFamily: 'monospace' }}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Conversion Summary - Bottom like other tools */}
        {results && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Glitter-ify Results
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Total Files
                    </Typography>
                    <Typography variant="h6">
                      {results.metadata.totalFiles}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Successful
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {results.metadata.successCount}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Failed
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        results.metadata.errorCount > 0
                          ? 'error.main'
                          : 'text.primary'
                      }
                    >
                      {results.metadata.errorCount}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Original Size
                    </Typography>
                    <Typography variant="h6">
                      {formatBytes(results.metadata.totalOriginalSize)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Output Size
                    </Typography>
                    <Typography variant="h6">
                      {formatBytes(results.metadata.totalOutputSize)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
