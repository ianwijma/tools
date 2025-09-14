# Architecture Guide

This document outlines the architectural decisions and patterns used in the Online Tools Collection project.

## Core Principles

### 1. Frontend-First Architecture

The primary goal is to run tools entirely in the browser when possible. This approach provides:

- **Better Performance**: No network latency for processing
- **Enhanced Privacy**: Data never leaves the user's device
- **Offline Capability**: Tools work without internet connection
- **Reduced Server Costs**: Minimal backend infrastructure needed
- **🚨 CRITICAL: NO DATA STORAGE ON SERVER - EVER**

### 2. Single Responsibility Principle

Each tool should have **one clear, focused purpose**. Here are some examples:

- **Image Resizer**: Only resizes images, does not convert formats
- **Text Formatter**: Only formats text, does not translate or analyze
- **JSON Validator**: Only validates JSON, does not transform or beautify
- **Color Converter**: Only converts between color formats, does not generate palettes

**Benefits of Single Responsibility:**
- **Easier to Understand**: Users know exactly what each tool does
- **Simpler Maintenance**: Fewer edge cases and dependencies
- **Better Testing**: Focused test cases for specific functionality
- **Modular Design**: Tools can be combined or used independently
- **Clearer Documentation**: Simple, focused usage instructions

### 3. Progressive Enhancement

Tools are designed with a progressive enhancement approach:

1. **Base Functionality**: Core features work in any modern browser
2. **Enhanced Features**: Advanced capabilities for supported browsers
3. **Graceful Degradation**: Fallbacks for unsupported features

## Technical Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React 19**: Latest React features

### Development Tools
- **Biome**: Fast linting and formatting
- **Turbopack**: Fast development builds

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page with tool index
│   ├── api/                     # API routes
│   │   └── [tool-name]/        # Tool-specific API endpoints
│   │       └── route.ts        # API route handler
│   └── [tool-name]/            # Dynamic routes for tools
│       └── page.tsx            # Individual tool pages
├── components/                   # Reusable components
│   ├── ui/                     # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── tools/                  # Tool-specific components
│       └── [ToolName]Tool.tsx
├── lib/                        # Business logic
│   ├── [tool-name].ts          # Individual tool implementations
│   ├── utils.ts                # Shared utilities
│   └── constants.ts            # Application constants
└── types/                      # TypeScript definitions
    ├── common.ts               # Shared types
    └── [tool-name].ts          # Tool-specific types
```

## Tool Development Pattern

### 1. Tool Logic (`src/lib/[tool-name].ts`)

Each tool follows a consistent pattern and maintains **single responsibility**:

```typescript
export interface ToolInput {
  // Define input parameters for ONE specific task
}

export interface ToolOutput {
  // Define output structure for ONE specific result
}

export interface ToolError {
  message: string;
  code?: string;
}

export class ImageResizer {
  // This tool ONLY resizes images - no format conversion, no filters
  static process(input: ImageResizerInput): ImageResizerOutput | ToolError {
    try {
      // ONLY resize logic here
      return result;
    } catch (error) {
      return { message: 'Resizing failed', code: 'RESIZE_ERROR' };
    }
  }
  
  static validate(input: ImageResizerInput): string[] {
    // ONLY validation for resize parameters
    return errors;
  }
}
```

**Tool Naming Convention:**
- Use descriptive, specific names: `ImageResizer`, `TextFormatter`, `JsonValidator`
- Avoid generic names: `ImageTool`, `TextTool`, `UtilityTool`
- Include the specific action: `Resize`, `Format`, `Validate`, `Convert`

### 2. Tool Component (`src/components/tools/[ToolName]Tool.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { ImageResizer } from '@/lib/image-resizer';

export function ImageResizerTool() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState('');

  const handleResize = () => {
    if (!imageFile) {
      setError('Please select an image file');
      return;
    }

    const result = ImageResizer.process({ 
      imageFile, 
      width, 
      height 
    });
    
    if ('message' in result) {
      setError(result.message);
    } else {
      setOutput(result.resizedImageUrl);
      setError('');
    }
  };

  return (
    <div className="tool-container">
      <h2>Example Tool</h2>
      <p>This tool has one clear purpose. It does one thing well.</p>
      {/* Tool UI focused on single responsibility */}
    </div>
  );
}
```

### 3. Tool Page (`src/app/[tool-name]/page.tsx`)

```typescript
import { ExampleTool } from '@/components/tools/ExampleTool';

export default function ExampleToolPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Example Tool</h1>
      <p className="text-gray-600 mb-6">
        This tool has one clear purpose. It focuses solely on its specific function - 
        for other functions, use other specialized tools.
      </p>
      <ExampleTool />
    </div>
  );
}
```

### 4. API Route (Optional - `src/app/api/[tool-name]/route.ts`)

Only create API routes when server-side processing is necessary (STATELESS ONLY):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ToolName } from '@/lib/tool-name';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let tempFile: string | null = null;
  
  try {
    const body = await request.json();
    
    // Validate input
    const errors = ToolName.validate(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid input', details: errors },
        { status: 400 }
      );
    }
    
    // If processing requires temporary files (e.g., CLI tools, image processing)
    if (body.requiresTempFile) {
      tempFile = path.join(os.tmpdir(), `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      await fs.writeFile(tempFile, body.data);
    }
    
    // Process with server-side logic (STATELESS - NO PERSISTENT STORAGE)
    const result = tempFile 
      ? await ToolName.processWithTempFile(tempFile, body.options)
      : ToolName.processServerSide(body);
    
    // 🚨 CRITICAL: Return immediately - NO PERSISTENT DATA STORAGE
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // 🚨 CRITICAL: Always clean up temporary files
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError);
      }
    }
  }
}
```

## Decision Framework: Frontend vs Server

### Use Frontend Processing When:

- **Text Operations**: String manipulation, formatting, parsing
- **Mathematical Calculations**: Basic to moderate complexity
- **Data Transformations**: JSON manipulation, CSV processing
- **Image Processing**: Canvas API operations, basic filters
- **Cryptographic Operations**: Hashing, encoding, basic encryption
- **Validation**: Input validation, format checking
- **File Processing**: Small to medium files (< 100MB)

### Consider Server Processing When:

- **Large File Processing**: Files > 100MB or complex operations
- **External API Integration**: Third-party services required
- **Heavy Computation**: Operations that would freeze the browser
- **Server-Only Libraries**: Dependencies not available in browsers
- **Rate Limiting**: Operations requiring server-side throttling

**🚨 NEVER Use Server Processing For:**
- **Database Operations**: NO DATABASES ALLOWED
- **Data Storage**: NO STORAGE ON SERVER
- **User Data Persistence**: USE FRONTEND STORAGE ONLY

### API Route Structure

When server-side processing is needed, create API routes following this pattern:

```
src/app/api/
├── [tool-name]/
│   ├── route.ts              # Main API endpoint
│   └── [sub-endpoint]/       # Optional sub-endpoints
│       └── route.ts
└── shared/                   # Shared API utilities
    └── route.ts
```

**API Route Naming Convention:**
- Use kebab-case for tool names: `/api/text-formatter/`
- Use descriptive sub-endpoints: `/api/image-processor/resize/`
- Keep routes RESTful when possible: `GET`, `POST`, `PUT`, `DELETE`

## Performance Considerations

### Frontend Optimization

1. **Lazy Loading**: Load tool components only when needed
2. **Web Workers**: Use for CPU-intensive operations
3. **Streaming**: Process large datasets in chunks
4. **Memory Management**: Clean up resources after processing
5. **Caching**: Store results in localStorage when appropriate

### Bundle Optimization

1. **Code Splitting**: Separate tool logic into chunks
2. **Tree Shaking**: Remove unused code
3. **Dynamic Imports**: Load tools on demand
4. **Asset Optimization**: Compress images and assets

## Security Considerations

### Frontend Security

1. **Input Sanitization**: Validate and sanitize all user inputs
2. **XSS Prevention**: Use React's built-in protections
3. **Content Security Policy**: Implement strict CSP headers
4. **Secure Defaults**: Use secure coding practices

### Data Privacy

1. **Local Processing**: Keep sensitive data in the browser
2. **No Logging**: Don't log user data unnecessarily
3. **Transparent Processing**: Clearly indicate when data leaves the browser
4. **User Control**: Give users control over their data
5. **🚨 NO SERVER STORAGE**: Never store user data on server - use frontend storage only

## Error Handling

### Frontend Error Handling

```typescript
export class ToolError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export function handleToolError(error: unknown): ToolError {
  if (error instanceof ToolError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ToolError(error.message, 'UNKNOWN_ERROR');
  }
  
  return new ToolError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
```

## Testing Strategy

### Unit Testing
- Test tool logic in isolation
- Mock browser APIs when necessary
- Test error conditions and edge cases

### Integration Testing
- Test complete tool workflows
- Verify UI interactions
- Test with various input types

### Browser Testing
- Test across different browsers
- Verify mobile responsiveness
- Test accessibility features

## Deployment Architecture

### Static Generation
- Pre-generate tool pages where possible
- Use Next.js static export for simple deployments
- Implement ISR for dynamic content

### CDN Strategy
- Serve static assets from CDN
- Implement proper caching headers
- Use edge computing for simple operations

## Monitoring and Analytics

### Performance Monitoring
- Track tool usage and performance
- Monitor bundle sizes and load times
- Measure Core Web Vitals

### Error Tracking
- Log and track frontend errors
- Monitor tool-specific failures
- Implement user feedback mechanisms

## Future Considerations

### Progressive Web App
- Add service worker for offline functionality
- Implement app-like experience
- Enable push notifications for updates

### WebAssembly Integration
- Use WASM for performance-critical operations
- Maintain JavaScript fallbacks
- Consider WASM for complex algorithms

### Edge Computing
- Deploy simple tools to edge locations
- Reduce latency for global users
- Implement edge-side processing for complex operations
