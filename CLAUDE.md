# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint (Next.js + TypeScript configs)
```

## Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-v1-...    # Required: OpenRouter API key
AI_MODEL_ID=openai/gpt-4           # Optional: defaults to anthropic/claude-3.5-sonnet
MAX_FILE_SIZE_MB=100               # Optional: defaults to 50MB
```

## Architecture

**PDF Translator** is a Next.js 16 App Router application that translates PDFs (Arabic, Turkish, or German → English) using AI via OpenRouter, with real-time streaming and layout preservation.

### Data Flow

```
Upload PDF → /api/upload (validate + store)
           → /api/parse (extract text via pdfjs-dist, chunk with token awareness)
           → /api/translate (stream translation via SSE, chunk by chunk)
           → /api/export/{pdf|docx} (reconstruct with layout preservation)
```

### Key Architectural Decisions

- **In-memory job store** (`src/lib/storage/job-store.ts`): Jobs and files stored in `Map` objects. Not persistent across restarts — production would need Redis/database.
- **SSE streaming**: `/api/translate` streams translation tokens in real-time. Events: `chunk_start`, `token`, `chunk_complete`, `error`, `retry`, `complete`. Client parses via `useTranslation` hook.
- **Context-aware chunking** (`src/lib/chunking/`): Documents split into ~3000-token chunks with 100-token overlap. Each chunk includes previous/next context for translation coherence.
- **Zustand for client state** (`src/store/translation-store.ts`): Manages translation progress, streaming text, and UI state.
- **Layout analysis** (`src/lib/pdf/layout-analyzer.ts`): Classifies text blocks (header, paragraph, list-item, footer) with bounding box positions for reconstruction.
- **RTL support** (`src/lib/utils/rtl-handler.ts`): Detects Arabic/Hebrew character ranges, preserves text direction in blocks.

### Source Structure

- `src/app/` — Pages (upload home, `/translate/[jobId]`) and API routes
- `src/components/` — Client components: `upload/`, `translation/`, `export/`
- `src/hooks/` — `useUpload` (upload+parse orchestration), `useTranslation` (SSE streaming+cancellation)
- `src/lib/` — Core logic: `ai/` (OpenRouter client), `pdf/` (parsing+layout), `chunking/` (splitting+context), `translation/` (AI calls+retries), `export/` (PDF/DOCX generation), `storage/` (job store), `utils/` (language detection, RTL, tokens)
- `src/types/` — TypeScript interfaces for jobs, chunks, PDF structures, exports
- `src/store/` — Zustand store

### Translation Pipeline Details

- OpenRouter API accessed via OpenAI-compatible SDK (`src/lib/ai/openrouter.ts`)
- Translation retries up to 3 times with exponential backoff, yielding retry events
- Token counting uses `gpt-tokenizer` for accurate chunk sizing
- Context builder generates system+user prompts with previous/next chunk context and first/last markers

### Path Alias

`@/*` maps to `./src/*`

### Config Notes

- `pdfjs-dist` listed in `serverExternalPackages` in next.config.ts (Node.js only)
- Turbopack enabled for dev
- TypeScript strict mode
- All page components are client-side (`'use client'`) except layouts
