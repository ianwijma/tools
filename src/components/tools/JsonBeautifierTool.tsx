'use client';

import {
  ArrowForward as ArrowForwardIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
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
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { JsonBeautifier } from '@/lib/json-beautifier';
import type {
  JsonBeautifierInput,
  JsonBeautifierOptions,
  JsonBeautifierOutput,
  JsonBeautifierPreset,
} from '@/types/json-beautifier';

export function JsonBeautifierTool(): JSX.Element {
  // State management
  const [inputJson, setInputJson] = useState<string>('');
  const [outputJson, setOutputJson] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] =
    useState<JsonBeautifierPreset>('standard');
  const [options, setOptions] = useState<JsonBeautifierOptions>(
    JsonBeautifier.getPreset('standard'),
  );
  const [metadata, setMetadata] = useState<
    JsonBeautifierOutput['metadata'] | null
  >(null);
  const [advancedExpanded, setAdvancedExpanded] = useState<boolean>(false);

  // Get all available presets
  const presets = useMemo(() => JsonBeautifier.getAllPresets(), []);

  // Update options when preset changes
  useEffect(() => {
    if (selectedPreset !== 'custom') {
      setOptions(JsonBeautifier.getPreset(selectedPreset));
    }
  }, [selectedPreset]);

  // Beautify JSON with current settings
  const handleBeautify = useCallback(async (): Promise<void> => {
    if (!inputJson.trim()) {
      setError('Please enter JSON to beautify');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutputJson('');
    setMetadata(null);

    try {
      const input: JsonBeautifierInput = {
        jsonString: inputJson,
        options,
      };

      const result = JsonBeautifier.process(input);

      if ('message' in result) {
        const errorResult = result;
        let errorMessage = errorResult.message;

        if (errorResult.line && errorResult.column) {
          errorMessage += ` (Line ${errorResult.line}, Column ${errorResult.column})`;
        } else if (errorResult.position) {
          errorMessage += ` (Position ${errorResult.position})`;
        }

        setError(errorMessage);
        setOutputJson('');
        setMetadata(null);
      } else {
        const successResult = result;
        setOutputJson(successResult.result);
        setMetadata(successResult.metadata);
        setError('');
      }
    } catch {
      setError('An unexpected error occurred while beautifying JSON');
      setOutputJson('');
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [inputJson, options]);

  // Copy result to clipboard
  const handleCopy = useCallback(async (): Promise<void> => {
    if (!outputJson) return;

    try {
      await navigator.clipboard.writeText(outputJson);
      // You could add a toast notification here
    } catch {
      // Failed to copy to clipboard
    }
  }, [outputJson]);

  // Download result as file
  const handleDownload = useCallback((): void => {
    if (!outputJson) return;

    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beautified-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [outputJson]);

  // Handle preset change
  const handlePresetChange = useCallback(
    (event: SelectChangeEvent<JsonBeautifierPreset>): void => {
      const preset = event.target.value as JsonBeautifierPreset;
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
    <T extends keyof JsonBeautifierOptions>(
      key: T,
      value: JsonBeautifierOptions[T],
    ): void => {
      setOptions((prev) => ({ ...prev, [key]: value }));
      setSelectedPreset('custom');
      // Also expand advanced settings when switching to custom
      setAdvancedExpanded(true);
    },
    [],
  );

  // Sample JSON for demonstration
  const handleLoadSample = useCallback((): void => {
    const sampleJson = {
      name: 'JSON Beautifier Tool',
      version: '1.0.0',
      features: ['beautify', 'validation', 'customization'],
      config: {
        indentSize: 2,
        sortKeys: true,
        removeTrailingCommas: true,
        alignColons: false,
      },
      users: [
        {
          id: 1,
          name: 'Alice',
          preferences: { theme: 'dark', notifications: true },
        },
        {
          id: 2,
          name: 'Bob',
          preferences: { theme: 'light', notifications: false },
        },
      ],
      metadata: {
        created: '2025-01-01',
        lastModified: '2025-01-15',
        tags: ['development', 'tools', 'json'],
      },
    };
    setInputJson(JSON.stringify(sampleJson));
  }, []);

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Tool Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          JSON Beautifier
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Transform minified or poorly formatted JSON into clean, readable
          format with extensive customization options. Perfect for debugging,
          documentation, and code review.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Beautification Settings
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
                    <InputLabel>Indent Type</InputLabel>
                    <Select
                      value={options.indentType}
                      onChange={(e) =>
                        handleOptionChange(
                          'indentType',
                          e.target.value as 'spaces' | 'tabs',
                        )
                      }
                      label="Indent Type"
                    >
                      <MenuItem value="spaces">Spaces</MenuItem>
                      <MenuItem value="tabs">Tabs</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>
                      Indent Size: {options.indentSize}
                    </Typography>
                    <Slider
                      value={options.indentSize}
                      onChange={(_, value) =>
                        handleOptionChange('indentSize', value as number)
                      }
                      min={0}
                      max={8}
                      step={1}
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
                        {/* Formatting Options */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Formatting Options
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.sortKeys}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'sortKeys',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Sort Keys"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.removeTrailingCommas}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'removeTrailingCommas',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Remove Trailing Commas"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.insertFinalNewline}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'insertFinalNewline',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Final Newline"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.preserveArrays}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'preserveArrays',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Preserve Arrays"
                            />
                          </FormGroup>
                        </Grid>

                        {/* Spacing Options */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Spacing Options
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.spacesAroundColon}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'spacesAroundColon',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Spaces Around Colons"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.spacesAroundComma}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'spacesAroundComma',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Spaces Around Commas"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.compactArrays}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'compactArrays',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Compact Small Arrays"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.compactObjects}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'compactObjects',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Compact Small Objects"
                            />
                          </FormGroup>
                        </Grid>

                        {/* Other Advanced Options */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="subtitle2" gutterBottom>
                            Other Options
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={options.alignColons}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      'alignColons',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Align Colons"
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Input JSON</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLoadSample}
                  sx={{ minWidth: 'auto' }}
                >
                  Load Sample
                </Button>
              </Box>

              <TextField
                multiline
                fullWidth
                variant="outlined"
                placeholder="Paste your minified or unformatted JSON here..."
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                sx={{
                  flexGrow: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'stretch',
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflow: 'auto !important',
                    resize: 'none',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& textarea': {
                      overflow: 'auto !important',
                    },
                  },
                }}
              />
            </Paper>

            {/* Beautify Button - Centered between panels */}
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
                onClick={handleBeautify}
                disabled={isLoading || !inputJson.trim()}
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

            {/* Output Section */}
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
                <Typography variant="h6">Beautified JSON</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopy}
                    disabled={!outputJson}
                    sx={{ minWidth: 'auto' }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={!outputJson}
                    sx={{ minWidth: 'auto' }}
                  >
                    Download
                  </Button>
                </Box>
              </Box>

              <TextField
                multiline
                fullWidth
                variant="outlined"
                placeholder="Beautified JSON will appear here..."
                value={outputJson}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  flexGrow: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'stretch',
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflow: 'auto !important',
                    resize: 'none',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& textarea': {
                      overflow: 'auto !important',
                    },
                  },
                }}
              />
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

        {/* Metadata Display */}
        {metadata && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Beautification Results
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Original Size
                    </Typography>
                    <Typography variant="h6">
                      {metadata.originalSize.toLocaleString()} chars
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Beautified Size
                    </Typography>
                    <Typography variant="h6">
                      {metadata.beautifiedSize.toLocaleString()} chars
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Keys
                    </Typography>
                    <Typography variant="h6">{metadata.keyCount}</Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Depth
                    </Typography>
                    <Typography variant="h6">
                      {metadata.depth} levels
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Arrays
                    </Typography>
                    <Typography variant="h6">{metadata.arrayCount}</Typography>
                  </Grid>

                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Objects
                    </Typography>
                    <Typography variant="h6">{metadata.objectCount}</Typography>
                  </Grid>
                </Grid>

                {metadata.validationWarnings &&
                  metadata.validationWarnings.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        color="warning.main"
                        gutterBottom
                      >
                        Warnings:
                      </Typography>
                      {metadata.validationWarnings.map((warning) => (
                        <Typography
                          key={warning}
                          variant="body2"
                          color="warning.main"
                        >
                          • {warning}
                        </Typography>
                      ))}
                    </Box>
                  )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
