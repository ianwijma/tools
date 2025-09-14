# Online Tools Collection

A collection of useful online tools that prioritize frontend execution for performance and privacy, with server-side processing only when necessary for more complex operations.

## Project Mission

This repository aims to create a comprehensive set of online tools that:
- **Run primarily in the frontend** for fast, responsive user experiences
- **Maintain user privacy** by processing data locally when possible
- **Leverage server capabilities** only when frontend processing is insufficient
- **Provide modern, accessible interfaces** for common utility tasks

## Philosophy

- **Frontend-First**: Tools should work entirely in the browser when feasible
- **Single Responsibility**: Each tool has one clear, focused purpose
- **Privacy-Conscious**: Minimize data transmission to servers
- **Performance-Oriented**: Fast loading and responsive interactions
- **Accessible**: Clean, intuitive interfaces that work for everyone

## Getting Started

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The development server is configured to always run on port 3000.

### Project Structure

- `src/app/` - Next.js App Router pages and components
  - `src/app/[tool-name]/` - Individual tool pages
  - `src/app/api/[tool-name]/` - API routes (only when server processing needed)
- `src/components/` - Reusable UI components for tools
- `src/lib/` - Utility functions and tool implementations
- `src/types/` - TypeScript type definitions

### Adding New Tools

1. **Define the tool's single purpose** - what it does and what it doesn't do
2. Create a new page in `src/app/[tool-name]/page.tsx`
3. Implement the tool logic in `src/lib/[tool-name].ts`
4. Add any necessary types in `src/types/`
5. Create API route in `src/app/api/[tool-name]/route.ts` (only if server processing is needed)
6. Update the main page to include the new tool

**Examples of Single-Purpose Tools:**
- `ImageResizer` - Only resizes images (not format conversion)
- `TextFormatter` - Only formats text (not translation or analysis)
- `JsonValidator` - Only validates JSON (not transformation or beautification)
- `ColorConverter` - Only converts color formats (not palette generation)

**Note:** API routes should only be created when frontend processing is insufficient. Most tools should run entirely in the browser.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📚 Documentation

For detailed documentation, see the [`docs/`](./docs/) directory:

- **[Architecture & Setup](./docs/README.md#-architecture--setup)** - Project architecture and setup guides
- **[Code Style & Quality](./docs/README.md#-code-style--quality)** - ESLint rules, formatting, and code standards
- **[Deployment & Infrastructure](./docs/README.md#-deployment--infrastructure)** - Docker and deployment guides
- **[Contributing Guidelines](./docs/CONTRIBUTING.md)** - How to contribute to the project

### Quick Links
- [Contributing Guide](./docs/CONTRIBUTING.md) - Start here for new contributors
- [Architecture Overview](./docs/ARCHITECTURE.md) - Project design and patterns
- [ESLint Rules](./docs/ESLINT_RULES.md) - Code style enforcement
- [Docker Deployment](./docs/DOCKER_DEPLOYMENT.md) - Deployment with Docker

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
