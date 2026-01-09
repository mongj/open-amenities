# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16.1.1 application built with React 19.2.3 and TypeScript 5, using the App Router architecture and Tailwind CSS v4 for styling.

## Common Development Commands

```bash
# Install dependencies
yarn install

# Start development server (runs on http://localhost:3000)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linter
yarn lint
```

## Project Structure

The application uses Next.js App Router with the following structure:
- `app/` - Contains the main application code using App Router conventions
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Homepage component
  - `globals.css` - Global styles with Tailwind directives
- `public/` - Static assets served directly

## Key Technical Details

### TypeScript Configuration
- Strict mode enabled
- Path alias configured: `@/*` maps to root directory
- Target: ES2017 with modern DOM libraries
- Module resolution: bundler mode for Next.js optimization

### Styling
- Tailwind CSS v4 with PostCSS configuration
- Geist and Geist Mono fonts loaded via next/font
- Antialiased text rendering applied globally

### Build System
- Next.js configuration in `next.config.ts` (currently minimal)
- ESLint configured with Next.js Core Web Vitals and TypeScript rules
- Standard Next.js build outputs to `.next/` directory

## Development Notes

When modifying pages or components:
- Components in `app/` automatically support React Server Components
- The page auto-updates on save due to Next.js Fast Refresh
- Follow the existing pattern of using TypeScript with strict typing