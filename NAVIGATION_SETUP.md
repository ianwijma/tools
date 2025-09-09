# Navigation Setup

This document describes the Atlassian Design System navigation implementation for the Online Tools Collection.

## Overview

The application now uses Atlassian's Navigation System with:
- **Top Navigation**: Contains the logo, app title, theme toggle, and user avatar
- **Side Navigation**: Lists all available tools with descriptions
- **Content Area**: Displays the main content for each tool

## Components

### ThemeProvider (`src/components/ThemeProvider.tsx`)
- Manages light/dark/auto theme switching
- Uses Atlaskit's `setGlobalTheme` API
- Persists theme preference in localStorage
- Provides theme context to all components

### NavigationLayout (`src/components/NavigationLayout.tsx`)
- Main navigation wrapper using Atlaskit's Navigation System
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
- **Accessibility**: Built-in ARIA support from Atlaskit

### Tool Integration
- Each tool page automatically inherits the navigation layout
- Consistent styling using Atlassian design tokens
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

The application will be available at `http://localhost:3000` with the full Atlassian navigation system.

## Dependencies

Key Atlaskit packages used:
- `@atlaskit/navigation-system` - Main navigation components
- `@atlaskit/tokens` - Theme and design tokens
- `@atlaskit/button` - Button components
- `@atlaskit/logo` - Atlassian logo
- `@atlaskit/avatar` - User avatar
- `@atlaskit/flag` - Notifications and alerts
