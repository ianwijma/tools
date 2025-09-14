'use client';

import {
  Archive as ArchiveIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
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
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import JSZip from 'jszip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageConverter } from '@/lib/image-converter';
import type {
  ConversionProgress,
  ImageConverterInput,
  ImageConverterOptions,
  ImageConverterOutput,
  ImageConverterPreset,
  ImageFile,
  ImageFormat,
} from '@/types/image-converter';

export function ImageConverterTool(): JSX.Element {
  // State management
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<ImageConverterPreset>('web-optimized');
  const [options, setOptions] = useState<ImageConverterOptions>(
    ImageConverter.getPreset('web-optimized'),
  );
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [results, setResults] = useState<ImageConverterOutput | null>(null);
  const [convertedFiles, setConvertedFiles] = useState<Map<string, Blob>>(
    new Map(),
  );
  const [advancedExpanded, setAdvancedExpanded] = useState<boolean>(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // Get all available presets
  const presets = useMemo(() => ImageConverter.getAllPresets(), []);

  // Show all available output formats in dropdown (let browser handle fallbacks)
  const [supportedFormats] = useState<ImageFormat[]>([
    'jpeg',
    'png',
    'webp',
    'avif',
    'bmp',
    'ico',
  ]);

  // Update options when preset changes
  useEffect(() => {
    if (selectedPreset !== 'custom') {
      setOptions(ImageConverter.getPreset(selectedPreset));
    }
  }, [selectedPreset]);

  // Computed file lists
  const pendingFiles = useMemo(
    () =>
      files.filter((f) => f.status === 'pending' || f.status === 'converting'),
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
  const unsupportedFiles = useMemo(
    () => files.filter((f) => f.status === 'unsupported'),
    [files],
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFiles = Array.from(event.target.files ?? []);
      const newFiles: ImageFile[] = selectedFiles.map((file) => {
        // Check format support
        const isFormatSupported =
          ImageConverter.CONSTRAINTS.allowedInputFormats.includes(file.type);

        // Check file size
        const isSizeValid = file.size <= ImageConverter.CONSTRAINTS.maxFileSize;

        // Determine overall support and error message
        const isSupported = isFormatSupported && isSizeValid;
        let errorMessage = '';

        if (!isFormatSupported) {
          errorMessage = `Unsupported format: ${file.type}`;
        } else if (!isSizeValid) {
          errorMessage = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${ImageConverter.CONSTRAINTS.maxFileSize / 1024 / 1024}MB`;
        }

        return {
          file,
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          originalFormat: file.type.split('/')[1] ?? 'unknown',
          originalSize: file.size,
          status: isSupported ? 'pending' : 'unsupported',
          isSupported,
          ...(isSupported ? {} : { error: errorMessage }),
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);
      setError('');
      setWarnings([]);
    },
    [],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      const droppedFiles = Array.from(event.dataTransfer.files);
      const newFiles: ImageFile[] = droppedFiles
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => {
          // Check format support
          const isFormatSupported =
            ImageConverter.CONSTRAINTS.allowedInputFormats.includes(file.type);

          // Check file size
          const isSizeValid =
            file.size <= ImageConverter.CONSTRAINTS.maxFileSize;

          // Determine overall support and error message
          const isSupported = isFormatSupported && isSizeValid;
          let errorMessage = '';

          if (!isFormatSupported) {
            errorMessage = `Unsupported format: ${file.type}`;
          } else if (!isSizeValid) {
            errorMessage = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${ImageConverter.CONSTRAINTS.maxFileSize / 1024 / 1024}MB`;
          }

          return {
            file,
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            originalFormat: file.type.split('/')[1] ?? 'unknown',
            originalSize: file.size,
            status: isSupported ? 'pending' : 'unsupported',
            isSupported,
            ...(isSupported ? {} : { error: errorMessage }),
          };
        });

      setFiles((prev) => [...prev, ...newFiles]);
      setError('');
      setWarnings([]);
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
    },
    [],
  );

  // Remove file from list
  const removeFile = useCallback((fileId: string): void => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setConvertedFiles((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);

  // Clear all files
  const clearAllFiles = useCallback((): void => {
    setFiles([]);
    setConvertedFiles(new Map());
    setResults(null);
    setProgress(null);
    setError('');
    setWarnings([]);
  }, []);

  // Clear completed files only
  const clearCompletedFiles = useCallback((): void => {
    setFiles((prev) =>
      prev.filter(
        (file) =>
          file.status === 'pending' ||
          file.status === 'converting' ||
          file.status === 'unsupported',
      ),
    );

    // Clear converted blobs for completed files
    setConvertedFiles((prev) => {
      const newMap = new Map(prev);
      completedFiles.forEach((file) => {
        newMap.delete(file.id);
      });
      return newMap;
    });

    // Reset conversion states only when clearing completed items
    setError('');
    setWarnings([]);
    setResults(null);
    setProgress(null);
  }, [completedFiles]);

  // Move a single completed file back to pending for re-conversion
  const moveBackToPending = useCallback((fileId: string): void => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          return {
            ...file,
            status: 'pending' as const,
            outputBlob: undefined,
            outputSize: undefined,
            error: undefined,
          };
        }
        return file;
      }),
    );

    // Remove from converted files map
    setConvertedFiles((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);

  // Move all completed files back to pending for re-conversion
  const moveAllBackToPending = useCallback((): void => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.status === 'success' || file.status === 'error') {
          return {
            ...file,
            status: 'pending' as const,
            outputBlob: undefined,
            outputSize: undefined,
            error: undefined,
          };
        }
        return file;
      }),
    );

    // Clear all converted files
    setConvertedFiles((prev) => {
      const newMap = new Map();
      // Keep only files that are still converting (shouldn't happen, but safe)
      prev.forEach((blob, fileId) => {
        const file = files.find((f) => f.id === fileId);
        if (file && file.status === 'converting') {
          newMap.set(fileId, blob);
        }
      });
      return newMap;
    });

    // Reset conversion states
    setError('');
    setWarnings([]);
    setResults(null);
    setProgress(null);
  }, [files]);

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

  // Handle preset change
  const handlePresetChange = useCallback(
    (event: SelectChangeEvent<ImageConverterPreset>): void => {
      const preset = event.target.value as ImageConverterPreset;
      setSelectedPreset(preset);

      // Automatically expand advanced settings when custom preset is selected
      if (preset === 'custom') {
        setAdvancedExpanded(true);
      }
    },
    [],
  );

  // Handle individual option changes
  const handleOptionChange = useCallback(
    <T extends keyof ImageConverterOptions>(
      key: T,
      value: ImageConverterOptions[T],
    ): void => {
      setOptions((prev) => ({ ...prev, [key]: value }));
      setSelectedPreset('custom');
      // Also expand advanced settings when switching to custom
      setAdvancedExpanded(true);
    },
    [],
  );

  // Start conversion process
  const handleConvert = useCallback(async (): Promise<void> => {
    if (pendingFiles.length === 0) {
      setError('Please select images to convert');
      return;
    }

    setIsConverting(true);
    // Don't reset error/warnings/results here - only reset when clearing completed items

    // Reset file statuses
    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: ['pending', 'converting'].includes(file.status)
          ? ('pending' as const)
          : file.status,
        error: undefined,
      })),
    );

    try {
      // Include all files (both supported and unsupported) for validation
      const allFiles = [...pendingFiles, ...unsupportedFiles].map(
        (f) => f.file,
      );

      const input: ImageConverterInput = {
        files: allFiles,
        targetFormat: options.targetFormat,
        quality: options.quality,
        ...(options.width !== undefined && { width: options.width }),
        ...(options.height !== undefined && { height: options.height }),
        maintainAspectRatio: options.maintainAspectRatio,
      };

      // Get validation warnings for display
      const validation = ImageConverter.validate(input);
      if (validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      }

      const result = await ImageConverter.convertFiles(
        input,
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        (conversionResult) => {
          // Update individual file status
          setFiles((prev) =>
            prev.map((file) => {
              if (file.id === conversionResult.fileId) {
                return {
                  ...file,
                  status: conversionResult.success
                    ? ('success' as const)
                    : ('error' as const),
                  ...(conversionResult.outputBlob && {
                    outputBlob: conversionResult.outputBlob,
                  }),
                  ...(conversionResult.outputSize && {
                    outputSize: conversionResult.outputSize,
                  }),
                  ...(conversionResult.error && {
                    error: conversionResult.error,
                  }),
                };
              }
              return file;
            }),
          );

          // Store converted blob for download
          if (conversionResult.success && conversionResult.outputBlob) {
            setConvertedFiles((prev) => {
              const updated = new Map(prev);
              if (conversionResult.outputBlob) {
                updated.set(
                  conversionResult.fileId,
                  conversionResult.outputBlob,
                );
              }
              return updated;
            });
          }
        },
      );

      if ('message' in result) {
        setError(result.message);
      } else {
        setResults(result);
      }
    } catch (conversionError) {
      setError(
        `Conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`,
      );
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  }, [pendingFiles, unsupportedFiles, options]);

  // Download single converted file
  const downloadFile = useCallback(
    (fileId: string, originalName: string): void => {
      const blob = convertedFiles.get(fileId);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = ImageConverter.getFileExtension(options.targetFormat);
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      a.download = `${nameWithoutExt}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [convertedFiles, options.targetFormat],
  );

  // Download all as ZIP
  const downloadAllAsZip = useCallback(async (): Promise<void> => {
    if (successfulFiles.length === 0) return;

    try {
      const zip = new JSZip();
      const extension = ImageConverter.getFileExtension(options.targetFormat);

      // Add each converted file to the ZIP
      successfulFiles.forEach((file) => {
        const blob = convertedFiles.get(file.id);
        if (blob) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const fileName = `${nameWithoutExt}.${extension}`;
          zip.file(fileName, blob);
        }
      });

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-images-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (zipError) {
      setError(
        `Failed to create ZIP file: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`,
      );
    }
  }, [successfulFiles, convertedFiles, options.targetFormat]);

  // Get status color for file
  const getStatusColor = (
    status: ImageFile['status'],
  ): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'converting':
        return 'primary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'unsupported':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ImageFile['status']): React.ReactNode => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'converting':
        return <RefreshIcon color="primary" />;
      case 'unsupported':
        return <WarningIcon color="warning" />;
      default:
        return <ImageIcon />;
    }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Tool Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Image Converter
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Convert images between formats with bulk processing support. Supports
          JPEG, PNG, WebP, and more with customizable quality and size settings.
          All processing happens in your browser for privacy and speed.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Settings
              </Typography>

              <Grid container spacing={2}>
                {/* Basic Settings - Always visible */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Preset</InputLabel>
                    <Select
                      value={selectedPreset}
                      onChange={handlePresetChange}
                      label="Preset"
                    >
                      {Object.entries(presets).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {presets[selectedPreset].description}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Output Format</InputLabel>
                    <Select
                      value={options.targetFormat}
                      onChange={(e) =>
                        handleOptionChange(
                          'targetFormat',
                          e.target.value as ImageFormat,
                        )
                      }
                      label="Output Format"
                    >
                      {supportedFormats.map((format) => {
                        const formatLabels: Record<ImageFormat, string> = {
                          jpeg: 'JPEG (.jpg)',
                          png: 'PNG (.png)',
                          webp: 'WebP (.webp)',
                          avif: 'AVIF (.avif)',
                          bmp: 'BMP (.bmp)',
                          ico: 'ICO (.ico)',
                        };
                        return (
                          <MenuItem key={format} value={format}>
                            {formatLabels[format]}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>
                      Quality: {Math.round(options.quality * 100)}%
                    </Typography>
                    <Slider
                      value={options.quality * 100}
                      onChange={(_, value) =>
                        handleOptionChange('quality', (value as number) / 100)
                      }
                      min={10}
                      max={100}
                      step={5}
                      disabled={options.targetFormat === 'png'}
                      marks
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>

                {/* Advanced Settings - Collapsible */}
                <Grid item xs={12}>
                  <Accordion
                    expanded={advancedExpanded}
                    onChange={(_, isExpanded) =>
                      setAdvancedExpanded(isExpanded)
                    }
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Advanced Settings
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {/* Resize Options */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Resize Options
                          </Typography>
                          <Stack spacing={2}>
                            <TextField
                              label="Max Width (px)"
                              type="number"
                              value={options.width ?? ''}
                              onChange={(e) =>
                                handleOptionChange(
                                  'width',
                                  e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Max Height (px)"
                              type="number"
                              value={options.height ?? ''}
                              onChange={(e) =>
                                handleOptionChange(
                                  'height',
                                  e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                              size="small"
                              fullWidth
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Other Options
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.maintainAspectRatio}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'maintainAspectRatio',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Maintain Aspect Ratio"
                            />
                          </FormGroup>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Background Color
                          </Typography>
                          <TextField
                            label="Background Color (Non-transparent formats)"
                            value={options.backgroundColor}
                            onChange={(e) =>
                              handleOptionChange(
                                'backgroundColor',
                                e.target.value,
                              )
                            }
                            size="small"
                            fullWidth
                            placeholder="#ffffff"
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
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
                  Supports JPEG, PNG, WebP, BMP, GIF, TIFF, and ICO files
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Max 50MB per file, up to 100 files
                </Typography>
              </Paper>

              {/* Files List */}
              <Box sx={{ flexGrow: 1 }}>
                {/* Supported Files */}
                <Typography variant="subtitle1" gutterBottom>
                  Images to Convert ({pendingFiles.length})
                </Typography>

                {pendingFiles.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No supported images selected
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                              >
                                {file.originalFormat.toUpperCase()} •{' '}
                                {ImageConverter.formatFileSize(
                                  file.originalSize,
                                )}
                              </Typography>
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

                {/* Unsupported Files - Collapsible */}
                {unsupportedFiles.length > 0 && (
                  <Accordion sx={{ mt: 1, mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <WarningIcon color="warning" fontSize="small" />
                        <Typography variant="subtitle2" color="warning.main">
                          Unsupported Files ({unsupportedFiles.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <List dense sx={{ maxHeight: 120, overflow: 'auto' }}>
                        {unsupportedFiles.map((file, index) => (
                          <Box key={file.id}>
                            <ListItem sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                sx={{ mr: 8 }}
                                primary={
                                  <Typography variant="body2" noWrap>
                                    {file.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    variant="caption"
                                    color="warning.main"
                                    noWrap
                                  >
                                    {file.error}
                                  </Typography>
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={() => removeFile(file.id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                            {index < unsupportedFiles.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {(pendingFiles.length > 0 || unsupportedFiles.length > 0) && (
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

            {/* Convert Button - Centered between panels */}
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
                  Converted Images ({completedFiles.length})
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
                  <Typography variant="body2" gutterBottom>
                    Converting Images...
                  </Typography>
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
                      Converted images will appear here after processing
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {completedFiles.map((file, index) => (
                      <Box key={file.id}>
                        <ListItem>
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
                                  {ImageConverter.formatFileSize(
                                    file.originalSize,
                                  )}
                                  {file.outputSize && (
                                    <>
                                      {' '}
                                      →{' '}
                                      {ImageConverter.formatFileSize(
                                        file.outputSize,
                                      )}
                                    </>
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
                                title="Move back to pending for re-conversion"
                              >
                                <RefreshIcon />
                              </IconButton>
                              {file.status === 'success' && (
                                <IconButton
                                  edge="end"
                                  onClick={() =>
                                    downloadFile(file.id, file.name)
                                  }
                                  size="small"
                                  title="Download converted file"
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

        {/* Warnings Display */}
        {warnings.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                {warnings.length === 1 ? 'Warning:' : 'Warnings:'}
              </Typography>
              {warnings.map((warning) => (
                <Typography
                  key={warning}
                  variant="body2"
                  sx={{ fontFamily: 'monospace' }}
                >
                  • {warning}
                </Typography>
              ))}
            </Alert>
          </Grid>
        )}

        {/* Conversion Summary - Bottom like JSON tools */}
        {results && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversion Results
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
                      {ImageConverter.formatFileSize(
                        results.metadata.totalOriginalSize,
                      )}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Output Size
                    </Typography>
                    <Typography variant="h6">
                      {ImageConverter.formatFileSize(
                        results.metadata.totalOutputSize,
                      )}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Size Change
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(
                        (1 - results.metadata.compressionRatio) * 100,
                      )}
                      %
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
