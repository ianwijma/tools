'use client';

import {
  ArrowForward as ArrowForwardIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { JsonFormatter } from '@/lib/json-formatter';
import type {
  JsonFormatterInput,
  JsonFormatterOutput,
} from '@/types/json-formatter';

export function JsonUglifierTool(): JSX.Element {
  // State management
  const [inputJson, setInputJson] = useState<string>('');
  const [outputJson, setOutputJson] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<
    JsonFormatterOutput['metadata'] | null
  >(null);

  // Handle JSON uglification
  const handleUglify = useCallback((): void => {
    if (!inputJson.trim()) {
      setError('Please enter some JSON to uglify');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const input: JsonFormatterInput = {
        jsonString: inputJson,
        mode: 'uglify',
      };

      const result = JsonFormatter.process(input);

      if ('message' in result) {
        setError(result.message);
        setOutputJson('');
        setMetadata(null);
      } else {
        setOutputJson(result.result);
        setMetadata(result.metadata);
        setError('');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
      setOutputJson('');
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [inputJson]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (): Promise<void> => {
    if (!outputJson) return;

    try {
      await navigator.clipboard.writeText(outputJson);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Failed to copy: ${err.message}`
          : 'Failed to copy to clipboard',
      );
    }
  }, [outputJson]);

  // Handle download
  const handleDownload = useCallback((): void => {
    if (!outputJson) return;

    try {
      const blob = new Blob([outputJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uglified.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Failed to download: ${err.message}`
          : 'Failed to download file',
      );
    }
  }, [outputJson]);

  // Sample JSON for demonstration
  const handleLoadSample = useCallback((): void => {
    const sampleJson = {
      name: 'JSON Uglifier Tool',
      version: '1.0.0',
      features: ['uglify', 'minify', 'compression'],
      settings: {
        removeWhitespace: true,
        compactOutput: true,
        preserveStructure: true,
      },
      metadata: {
        created: '2024-01-01',
        purpose: 'demonstration',
        tags: ['development', 'tools', 'json'],
      },
    };
    setInputJson(JSON.stringify(sampleJson, null, 2));
  }, []);

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Tool Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          JSON Uglifier
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Minimize JSON by removing all unnecessary whitespace and formatting.
          Perfect for reducing file sizes and optimizing data transfer.
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Input/Uglify/Output Section */}
      <Grid container spacing={3}>
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
                  mb: 1,
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
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder="Paste your formatted JSON here..."
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

            {/* Uglify Button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleUglify}
                disabled={!inputJson.trim() || isLoading}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  minWidth: 'unset',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                  transition: 'transform 0.2s ease-in-out',
                }}
                aria-label="Uglify JSON"
              >
                <ArrowForwardIcon />
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
                  mb: 1,
                }}
              >
                <Typography variant="h6">Uglified JSON</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopy}
                    disabled={!outputJson}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={!outputJson}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
              <TextField
                multiline
                fullWidth
                value={outputJson}
                placeholder="Uglified JSON will appear here..."
                InputProps={{ readOnly: true }}
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

        {/* Results/Metadata */}
        {metadata && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uglification Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Original Size
                    </Typography>
                    <Typography variant="h6">
                      {metadata.originalSize.toLocaleString()} bytes
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Uglified Size
                    </Typography>
                    <Typography variant="h6">
                      {metadata.formattedSize.toLocaleString()} bytes
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Compression
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {metadata.compressionRatio}%
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
                    <Typography variant="h6">{metadata.depth}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} lg={2}>
                    <Typography variant="body2" color="text.secondary">
                      Objects/Arrays
                    </Typography>
                    <Typography variant="h6">
                      {metadata.objectCount}/{metadata.arrayCount}
                    </Typography>
                  </Grid>
                </Grid>

                {metadata.validationWarnings &&
                  metadata.validationWarnings.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="warning.main"
                        gutterBottom
                      >
                        Warnings:
                      </Typography>
                      {metadata.validationWarnings.map((warning) => (
                        <Typography
                          key={warning}
                          variant="body2"
                          color="text.secondary"
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
