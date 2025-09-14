# Navigation Setup

This document describes the Material Design navigation implementation for the Online Tools Collection.

## Overview

The application now uses Material Design navigation with:
- **Top Navigation**: Contains the logo, app title, theme toggle, and user avatar
- **Side Navigation**: Lists all available tools with descriptions
- **Content Area**: Displays the main content for each tool

## Components

### ThemeProvider (`src/components/ThemeProvider.tsx`)
- Manages light/dark/auto theme switching
- Uses Material UI's theme system
- Persists theme preference in localStorage
- Provides theme context to all components

### NavigationLayout (`src/components/NavigationLayout.tsx`)
- Main navigation wrapper using Material UI components
- Implements top navigation with logo and theme toggle
- Side navigation with tool listings
- Responsive design that works on all screen sizes

## Features

### Theme Support
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for low-light usage
- **Auto Mode**: Follows system preference
- **Smooth Transitions**: Between theme changes

### Navigation Features
- **Tool Discovery**: Side navigation shows all available tools
- **Quick Access**: Direct links to each tool
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: Built-in ARIA support from Material UI

### Tool Integration
- Each tool page automatically inherits the navigation layout
- Consistent styling using Material Design tokens
- Proper content area with appropriate spacing

## Available Tools

The side navigation currently includes:
1. **Text Formatter** - Format and transform text
2. **JSON Validator** - Validate and format JSON
3. **Image Resizer** - Resize and optimize images
4. **Color Converter** - Convert between color formats
5. **Base64 Encoder** - Encode and decode Base64
6. **URL Shortener** - Shorten long URLs

## Adding New Tools

To add a new tool to the navigation:

1. **Create the tool page** in `src/app/[tool-name]/page.tsx`
2. **Update the tools array** in `NavigationLayout.tsx`:
   ```typescript
   const tools = [
     // ... existing tools
     { id: 'new-tool', name: 'New Tool', description: 'Tool description' },
   ];
   ```

## Styling

The navigation uses Atlassian design tokens for consistent styling:
- `var(--ds-text)` - Primary text color
- `var(--ds-text-subtle)` - Secondary text color
- `var(--ds-surface)` - Background colors
- `var(--ds-border)` - Border colors

## Development

To run the application with the new navigation:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` with the full Material Design navigation system.

## Dependencies

Key Material UI packages used:
- `@mui/material` - Main Material UI components
- `@mui/icons-material` - Material Design icons
- `@emotion/react` - CSS-in-JS styling
- `@emotion/styled` - Styled components
