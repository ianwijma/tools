'use client';

import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { GifCreatorOptions, GifCreatorPreset } from '@/types/gif-creator';

interface GifCreatorSettingsProps {
  selectedPreset: GifCreatorPreset;
  options: GifCreatorOptions;
  actualTotalDuration: number;
  onPresetChange: (event: SelectChangeEvent<GifCreatorPreset>) => void;
  onOptionChange: <T extends keyof GifCreatorOptions>(
    key: T,
    value: GifCreatorOptions[T],
  ) => void;
}

export function GifCreatorSettings({
  selectedPreset,
  options,
  actualTotalDuration,
  onPresetChange,
  onOptionChange,
}: GifCreatorSettingsProps): JSX.Element {
  return (
    <Box sx={{ flex: 3, p: 2, overflow: 'hidden' }}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>

          {/* Preset Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Preset</InputLabel>
            <Select
              value={selectedPreset}
              label="Preset"
              onChange={onPresetChange}
            >
              <MenuItem value="high-quality">High Quality</MenuItem>
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="fast">Fast</MenuItem>
              <MenuItem value="tiny">Tiny</MenuItem>
              <MenuItem value="smooth">Smooth</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>

          {/* Sliders side-by-side */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" gutterBottom>
                Duration: {options.totalDuration}s
              </Typography>
              <Slider
                size="small"
                value={options.totalDuration}
                onChange={(_, value) =>
                  onOptionChange('totalDuration', value as number)
                }
                min={0.5}
                max={60}
                step={0.1}
              />
              <Typography variant="caption" color="text.secondary">
                Actual: {actualTotalDuration.toFixed(1)}s
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" gutterBottom>
                FPS: {options.fps}
              </Typography>
              <Slider
                size="small"
                value={options.fps}
                onChange={(_, value) => onOptionChange('fps', value as number)}
                min={1}
                max={30}
              />
              <Typography variant="caption" color="text.secondary">
                Frame density
              </Typography>
            </Grid>
          </Grid>

          {/* Dimensions and aspect ratio side-by-side */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <TextField
                label="Width"
                type="number"
                size="small"
                fullWidth
                value={options.width}
                onChange={(e) =>
                  onOptionChange('width', parseInt(e.target.value, 10) || 600)
                }
                inputProps={{ min: 100, max: 2000 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Height"
                type="number"
                size="small"
                fullWidth
                value={options.height}
                onChange={(e) =>
                  onOptionChange('height', parseInt(e.target.value, 10) || 400)
                }
                inputProps={{ min: 100, max: 2000 }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={options.maintainAspectRatio}
                    onChange={(e) =>
                      onOptionChange('maintainAspectRatio', e.target.checked)
                    }
                  />
                }
                label="Maintain Aspect Ratio"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
