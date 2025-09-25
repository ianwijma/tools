'use client';

import {
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
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
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import JSZip from 'jszip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageMetadataRemover } from '@/lib/image-metadata-remover';
import type {
  MetadataImageFile,
  MetadataRemoverInput,
  MetadataRemoverOptions,
  MetadataRemoverOutput,
  MetadataRemoverPresetKey,
  OutputFormat,
  ProcessingProgress,
} from '@/types/image-metadata-remover';

export function ImageMetadataRemoverTool(): JSX.Element {
  // State management
  const [files, setFiles] = useState<MetadataImageFile[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<MetadataRemoverPresetKey>('complete-removal');
  const [options, setOptions] = useState<MetadataRemoverOptions>(
    ImageMetadataRemover.getPreset('complete-removal'),
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [results, setResults] = useState<MetadataRemoverOutput | null>(null);
  const [processedBlobs, setProcessedBlobs] = useState<Map<string, Blob>>(
    new Map(),
  );
  const [advancedExpanded, setAdvancedExpanded] = useState<boolean>(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // Get all available presets
  const presets = useMemo(() => ImageMetadataRemover.getAllPresets(), []);

  // Show all available output formats
  const [supportedFormats] = useState<OutputFormat[]>([
    'same',
    'jpeg',
    'png',
    'webp',
  ]);

  // Update options when preset changes
  useEffect(() => {
    if (selectedPreset !== 'complete-removal') {
      setOptions(ImageMetadataRemover.getPreset(selectedPreset));
    }
  }, [selectedPreset]);

  // File upload handling
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = Array.from(event.target.files ?? []);
      if (uploadedFiles.length === 0) return;

      const newFiles: MetadataImageFile[] = uploadedFiles.map(
        (file, index) => ({
          file,
          id: `${file.name}_${file.size}_${Date.now()}_${index}`,
          name: file.name,
          originalSize: file.size,
          originalFormat: file.type,
          status: 'pending',
          isSupported: ImageMetadataRemover.isFormatSupported(file.name),
        }),
      );

      setFiles((prev) => [...prev, ...newFiles]);
      setError('');
      setWarnings([]);
      setResults(null);

      // Check for unsupported files and show warnings
      const unsupportedFiles = newFiles.filter((f) => !f.isSupported);
      if (unsupportedFiles.length > 0) {
        setWarnings([
          `${unsupportedFiles.length} file(s) have unsupported formats and will be skipped: ${unsupportedFiles.map((f) => f.name).join(', ')}`,
        ]);
      }

      // Reset the input
      event.target.value = '';
    },
    [],
  );

  // Remove file from list
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setProcessedBlobs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  // Clear all files
  const handleClearAll = useCallback(() => {
    setFiles([]);
    setProcessedBlobs(new Map());
    setError('');
    setWarnings([]);
    setResults(null);
    setProgress(null);
  }, []);

  // Process files
  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one image file');
      return;
    }

    setIsProcessing(true);
    setError('');
    setWarnings([]);
    setProgress(null);

    try {
      const input: MetadataRemoverInput = {
        files: files.map((f) => f.file),
        preserveColorProfile: options.preserveColorProfile,
        preserveOrientation: options.preserveOrientation,
        outputFormat: options.outputFormat,
        jpegQuality: options.jpegQuality,
      };

      // Create a temporary mapping to track processed files
      const tempProcessedBlobs = new Map<string, Blob>();

      const result = await ImageMetadataRemover.processFiles(
        input,
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
      );

      if ('message' in result) {
        setError(result.message);
        setResults(null);
      } else {
        setResults(result);
        setError('');

        // Process files individually to get the blobs
        const supportedFiles = files.filter((f) => f.isSupported);

        for (const file of supportedFiles) {
          try {
            const singleResult =
              // eslint-disable-next-line no-await-in-loop
              await ImageMetadataRemover.processSingleFileWithBlob(
                file.file,
                options,
              );
            if ('blob' in singleResult) {
              tempProcessedBlobs.set(file.id, singleResult.blob);
            }
          } catch {
            // Processing failed for this file, continue with others
          }
        }

        // Update file statuses with real processing results
        const updatedFiles = files.map((file) => {
          if (!file.isSupported) {
            return { ...file, status: 'unsupported' as const };
          }

          const hasBlob = tempProcessedBlobs.has(file.id);
          const blob = tempProcessedBlobs.get(file.id);

          return {
            ...file,
            status: hasBlob ? ('success' as const) : ('error' as const),
            outputSize: hasBlob ? blob?.size : undefined,
            metadataRemoved: hasBlob
              ? Math.max(0, file.originalSize - (blob?.size ?? 0))
              : 0,
            error: hasBlob ? undefined : 'Processing failed',
          };
        });

        setFiles(updatedFiles);
        setProcessedBlobs(tempProcessedBlobs);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
      setResults(null);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [files, options]);

  // Download single file
  const handleDownloadFile = useCallback(
    (fileId: string) => {
      const blob = processedBlobs.get(fileId);
      const file = files.find((f) => f.id === fileId);

      if (!blob || !file) return;

      const outputFilename = ImageMetadataRemover.createOutputFilename(
        file.file,
        options,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFilename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [processedBlobs, files, options],
  );

  // Download all files as ZIP
  const handleDownloadAll = useCallback(async () => {
    if (processedBlobs.size === 0) return;

    try {
      const zip = new JSZip();

      // Add each processed file to the ZIP
      for (const [fileId, blob] of processedBlobs.entries()) {
        const file = files.find((f) => f.id === fileId);
        if (file) {
          const outputFilename = ImageMetadataRemover.createOutputFilename(
            file.file,
            options,
          );
          zip.file(outputFilename, blob);
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metadata_removed_images_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to create ZIP file');
    }
  }, [processedBlobs, files, options]);

  // Menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  // Preset change handler
  const handlePresetChange = useCallback((event: SelectChangeEvent) => {
    const preset = event.target.value as MetadataRemoverPresetKey;
    setSelectedPreset(preset);
    setOptions(ImageMetadataRemover.getPreset(preset));
  }, []);

  // Format label helper
  const getFormatLabel = (format: OutputFormat): string => {
    const labels: Record<OutputFormat, string> = {
      same: 'Keep Original Format',
      jpeg: 'JPEG',
      png: 'PNG',
      webp: 'WebP',
    };
    return labels[format];
  };

  // Statistics
  const stats = useMemo(() => {
    const supportedFiles = files.filter((f) => f.isSupported);
    const processedFiles = files.filter((f) => f.status === 'success');
    const totalSize = files.reduce((sum, f) => sum + f.originalSize, 0);

    return {
      totalFiles: files.length,
      supportedFiles: supportedFiles.length,
      processedFiles: processedFiles.length,
      totalSize,
      hasFiles: files.length > 0,
      canProcess: supportedFiles.length > 0 && !isProcessing,
      canDownload: processedFiles.length > 0,
    };
  }, [files, isProcessing]);

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Tool Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Image Metadata Remover
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Remove EXIF data, geolocation, camera information, and other metadata
          from your images to protect your privacy. Supports bulk processing and
          multiple output formats. All processing happens in your browser for
          privacy and speed.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacy Settings
              </Typography>

              <Grid container spacing={2}>
                {/* Preset Selection */}
                <Grid item xs={12} sm={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Preset</InputLabel>
                    <Select
                      value={selectedPreset}
                      label="Preset"
                      onChange={handlePresetChange}
                      disabled={isProcessing}
                    >
                      {presets.map(({ key, preset }) => (
                        <MenuItem key={key} value={key}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {preset.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {preset.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {ImageMetadataRemover.PRESETS[selectedPreset].description}
                  </Typography>
                </Grid>

                {/* Output Format */}
                <Grid item xs={12} sm={6} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel>Output Format</InputLabel>
                    <Select
                      value={options.outputFormat}
                      label="Output Format"
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as OutputFormat,
                        }))
                      }
                      disabled={isProcessing}
                    >
                      {supportedFormats.map((format) => (
                        <MenuItem key={format} value={format}>
                          {getFormatLabel(format)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Advanced Options */}
                <Grid item xs={12}>
                  <Accordion
                    expanded={advancedExpanded}
                    onChange={(_, expanded) => setAdvancedExpanded(expanded)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">
                        Advanced Options
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Preservation Options
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.preserveColorProfile}
                                  onChange={(e) =>
                                    setOptions((prev) => ({
                                      ...prev,
                                      preserveColorProfile: e.target.checked,
                                    }))
                                  }
                                  disabled={isProcessing}
                                />
                              }
                              label="Preserve Color Profile"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.preserveOrientation}
                                  onChange={(e) =>
                                    setOptions((prev) => ({
                                      ...prev,
                                      preserveOrientation: e.target.checked,
                                    }))
                                  }
                                  disabled={isProcessing}
                                />
                              }
                              label="Preserve Image Orientation"
                            />
                          </FormGroup>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Input and Output Section with Process Button */}
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
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  data-testid="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isProcessing}
                />
                <UploadIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Drop images here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports JPEG, PNG, WebP, BMP, GIF, TIFF, AVIF and ICO files
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
                <Typography variant="subtitle1" gutterBottom>
                  Images to Process ({stats.supportedFiles})
                </Typography>

                {stats.supportedFiles === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No supported images selected
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 250, overflow: 'auto', mb: 1 }}>
                    {files
                      .filter((f) => f.isSupported)
                      .map((file) => (
                        <ListItem key={file.id} sx={{ py: 1 }}>
                          <ListItemIcon>
                            {file.status === 'success' && (
                              <CheckCircleIcon color="success" />
                            )}
                            {file.status === 'error' && (
                              <ErrorIcon color="error" />
                            )}
                            {file.status === 'processing' && (
                              <RefreshIcon color="primary" />
                            )}
                            {file.status === 'pending' && (
                              <ImageIcon color="action" />
                            )}
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
                                {ImageMetadataRemover.formatFileSize(
                                  file.originalSize,
                                )}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(file.id)}
                              size="small"
                              disabled={isProcessing}
                              aria-label={`Remove ${file.file.name}`}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                )}

                {/* Unsupported Files */}
                {stats.totalFiles - stats.supportedFiles > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <WarningIcon color="warning" fontSize="small" />
                        <Typography variant="subtitle2" color="warning.main">
                          Unsupported Files (
                          {stats.totalFiles - stats.supportedFiles})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <List dense sx={{ maxHeight: 120, overflow: 'auto' }}>
                        {files
                          .filter((f) => !f.isSupported)
                          .map((file) => (
                            <ListItem key={file.id} sx={{ py: 0.5, px: 0 }}>
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
                                    Unsupported format
                                  </Typography>
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleRemoveFile(file.id)}
                                  size="small"
                                  aria-label={`Remove ${file.file.name}`}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {stats.hasFiles && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleClearAll}
                      startIcon={<DeleteIcon />}
                      size="small"
                      color="error"
                      disabled={isProcessing}
                    >
                      Clear All Files
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Process Button - Centered between panels */}
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
                onClick={handleProcess}
                disabled={isProcessing || stats.supportedFiles === 0}
                aria-label="Remove metadata from images"
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
                <SecurityIcon sx={{ fontSize: 24 }} />
              </Button>
            </Box>

            {/* Output Section - Processed Files */}
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
                  Processed Images ({stats.processedFiles})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {stats.processedFiles > 0 && (
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
                            handleDownloadAll();
                            handleMenuClose();
                          }}
                        >
                          <ArchiveIcon sx={{ mr: 1, fontSize: 18 }} />
                          Download ZIP
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Box>
              </Box>

              {/* Progress Display */}
              {progress && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Processing Images...
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
                    {progress.current} of {progress.total} files processed (
                    {Math.round(progress.percentage)}%)
                  </Typography>
                  {progress.currentFileName && (
                    <Typography variant="caption" color="text.secondary">
                      Currently processing: {progress.currentFileName}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Processed Files List */}
              <Box sx={{ flexGrow: 1 }}>
                {stats.processedFiles === 0 ? (
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
                      Processed images will appear here after metadata removal
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {files
                      .filter((f) => f.status === 'success')
                      .map((file) => (
                        <ListItem key={file.id}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
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
                                  {ImageMetadataRemover.formatFileSize(
                                    file.originalSize,
                                  )}
                                  {file.outputSize && (
                                    <>
                                      {' '}
                                      →{' '}
                                      {ImageMetadataRemover.formatFileSize(
                                        file.outputSize,
                                      )}
                                    </>
                                  )}
                                </Typography>
                                {file.metadataRemoved !== undefined &&
                                  file.metadataRemoved > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="success.main"
                                      sx={{ display: 'block' }}
                                      noWrap
                                    >
                                      {ImageMetadataRemover.formatFileSize(
                                        file.metadataRemoved,
                                      )}{' '}
                                      metadata removed
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
                                label="Clean"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                              <IconButton
                                edge="end"
                                onClick={() => handleDownloadFile(file.id)}
                                size="small"
                                title="Download processed file"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Progress Indicator */}
        {(isProcessing || progress) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Files...
                </Typography>
                {progress && (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {progress.currentFileName} ({progress.current} of{' '}
                      {progress.total})
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress.percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {progress.percentage}% complete
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Results and Download */}
        {results && !isProcessing && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Processing Complete</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {results.result}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4" color="primary.main">
                      {results.metadata.successCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Processed
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4" color="error.main">
                      {results.metadata.errorCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Errors
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4">
                      {ImageMetadataRemover.formatFileSize(
                        results.metadata.totalMetadataRemoved,
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Metadata Removed
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4">
                      {ImageMetadataRemover.formatFileSize(
                        results.metadata.totalOriginalSize,
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Original Size
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4">
                      {ImageMetadataRemover.formatFileSize(
                        results.metadata.totalOutputSize,
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Final Size
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="h4">
                      {(results.metadata.processingTime / 1000).toFixed(1)}s
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Processing Time
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Error Messages */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Warning Messages */}
        {warnings.length > 0 && (
          <Grid item xs={12}>
            <Stack spacing={1}>
              {warnings.map((warning) => (
                <Alert
                  key={`warning-${warning.slice(0, 50)}`}
                  severity="warning"
                  onClose={() =>
                    setWarnings((prev) => prev.filter((w) => w !== warning))
                  }
                >
                  {warning}
                </Alert>
              ))}
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
