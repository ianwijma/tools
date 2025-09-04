# Contributing to Online Tools Collection

Thank you for your interest in contributing to this project! This document provides guidelines for both human developers and AI agents working on this codebase.

## Project Mission

This repository creates online tools that prioritize frontend execution for performance and privacy, using server-side processing only when necessary.

## 🚨 CRITICAL: NO SERVER DATA STORAGE POLICY

**THIS IS NEVER AND WILL NEVER BE ALLOWED**

### What This Means
- **NO** database connections
- **NO** persistent file storage on server
- **NO** user data persistence on server
- **NO** session storage on server
- **NO** caching on server
- **NO** any form of persistent data storage on the server
- **ALLOWED**: Temporary files during request processing (must be cleaned up immediately)

### What IS Allowed
- **ONLY** frontend data storage:
  - `localStorage` for persistent data
  - `sessionStorage` for session data
  - `IndexedDB` for complex data
  - Browser memory for temporary data
  - File downloads to user's device

### Server Processing Rules
When server processing is needed (rare cases):
- **Input data** comes from frontend request
- **Processing** happens on server
- **Output data** is returned to frontend immediately
- **NO data is stored** on server between requests
- **NO data is persisted** on server
- **NO user data** remains on server after response
- **ALLOWED**: Temporary files during processing (e.g., for CLI tools, image processing)
- **REQUIRED**: Clean up all temporary files immediately after response

## Development Guidelines

### For AI Agents

When working on this project as an AI agent, please:

1. **Prioritize Frontend Solutions**: Always implement tools to run in the browser first
2. **Follow Single Responsibility**: Each tool should have ONE clear, focused purpose
3. **🚨 NEVER Store Data on Server**: Use frontend storage only - no server data storage ever
4. **Consider Privacy**: Minimize data transmission to servers
5. **Follow the Architecture**: Use the established patterns in `src/lib/` for tool logic
6. **Create Accessible UIs**: Ensure tools work for all users
7. **Document Decisions**: Explain why server-side processing is needed if required

### For Human Developers

#### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Make your changes following the project structure
4. Test your changes locally
5. Submit a pull request

#### Code Standards

- Use TypeScript for all new code
- Follow the existing project structure
- Write clear, self-documenting code
- Add appropriate error handling
- Include loading states for better UX
- **Use Atlaskit** as the primary UI component library from [Atlassian](https://atlaskit.atlassian.com/)
- **Create reusable components** with uniform design scheme using Atlaskit
- **Support light & dark mode** for all components using Atlaskit's theme system
- Use Tailwind CSS for custom styling alongside Atlaskit

#### Tool Development Process

1. **Define Single Purpose**: Clearly define what the tool does (and what it doesn't do)
2. **Plan the Tool**: Determine if it can run entirely in the frontend
3. **Create the Logic**: Implement in `src/lib/[tool-name].ts` with focused functionality
4. **Build the UI**: Create components in `src/components/` with clear, single-purpose interface
5. **Add the Page**: Create `src/app/[tool-name]/page.tsx` with focused description
6. **Add API Route (if needed)**: Create `src/app/api/[tool-name]/route.ts` only when server processing is required
7. **Test Thoroughly**: Ensure it works across different browsers
8. **Document Usage**: Add clear instructions and examples for the single purpose

#### Single Responsibility Guidelines

**Good Examples:**
- `ImageResizer` - Only resizes images to specific dimensions
- `TextFormatter` - Only formats text (indentation, case, etc.)
- `JsonValidator` - Only validates JSON syntax
- `ColorConverter` - Only converts between color formats (HEX, RGB, HSL)

**Avoid These:**
- `ImageTool` - Too generic, could do anything with images
- `TextProcessor` - Too broad, could format, translate, analyze, etc.
- `UtilityTool` - Extremely generic, no clear purpose

**Tool Naming Rules:**
- Use specific action verbs: `Resize`, `Format`, `Validate`, `Convert`, `Generate`
- Include the data type: `Image`, `Text`, `Json`, `Color`
- Be descriptive: `ImageResizer` not `ImageTool`
- Avoid generic terms: `Processor`, `Manager`, `Handler`

#### API Route Guidelines

**When to Create API Routes:**
- Large file processing (>100MB)
- External API integrations
- Heavy computations that would freeze the browser
- Server-only library dependencies

**🚨 NEVER Use API Routes For:**
- Database operations (NO DATABASES ALLOWED)
- Data storage (NO STORAGE ON SERVER)
- User data persistence (USE FRONTEND STORAGE ONLY)

**API Route Structure:**
```
src/app/api/[tool-name]/route.ts
```

**Example API Route (Stateless Only):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let tempFile: string | null = null;
  
  try {
    const body = await request.json();
    
    // If processing requires temporary files (e.g., CLI tools)
    if (body.requiresTempFile) {
      tempFile = path.join(os.tmpdir(), `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      await fs.writeFile(tempFile, body.data);
    }
    
    // Process with server-side logic (STATELESS - NO PERSISTENT STORAGE)
    const result = tempFile 
      ? await processWithTempFile(tempFile, body.options)
      : await processServerSide(body);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Processing failed' },
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

### Architecture Decisions

#### When to Use Frontend-Only Processing

- Text manipulation and formatting
- Basic calculations and conversions
- Image processing with Canvas API
- Data validation and parsing
- Simple cryptographic operations (hashing, encoding)

#### When Server-Side Processing May Be Needed

- Complex file processing that exceeds browser memory limits
- Operations requiring external APIs
- Heavy computational tasks that would freeze the browser
- Operations requiring server-only libraries

**🚨 NEVER Use Server Processing For:**
- Database operations (NO DATABASES ALLOWED)
- Data storage (NO STORAGE ON SERVER)
- User data persistence (USE FRONTEND STORAGE ONLY)

### File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with Atlaskit theme
│   ├── layout.tsx         # Root layout with Atlaskit ThemeProvider
│   ├── api/               # API routes (only when server processing needed)
│   │   └── [tool-name]/   # Tool-specific API endpoints
│   │       └── route.ts   # API route handler
│   ├── [tool-name]/       # Individual tool pages
│   │   └── page.tsx       # Tool page component
│   └── page.tsx           # Main landing page
├── components/            # Reusable UI components
│   ├── ui/               # Atlaskit component wrappers
│   ├── tools/            # Tool-specific components
│   │   └── [ToolName]Tool.tsx  # Individual tool components
│   └── ThemeProvider.tsx # Atlaskit theme context provider
├── lib/                  # Tool logic and utilities
│   ├── [tool-name].ts    # Individual tool implementations
│   └── utils.ts          # Shared utilities
└── types/                # TypeScript type definitions
```

### Testing

- Test tools in multiple browsers
- Verify accessibility with screen readers
- Test with various input sizes and types
- Ensure mobile responsiveness

### Pull Request Process

1. Ensure your code follows the project standards
2. Test your changes thoroughly
3. Update documentation if needed
4. Provide a clear description of your changes
5. Reference any related issues

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.
