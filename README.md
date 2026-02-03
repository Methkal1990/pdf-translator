# PDF Translator

AI-powered PDF translation that preserves document layout and formatting. Translates Arabic, Turkish, and German documents to English with real-time streaming output.

## Features

- **Real-time streaming** — Watch translations appear token by token as they're generated
- **Layout preservation** — Maintains document structure, headings, and formatting
- **RTL support** — Handles right-to-left Arabic text with correct directionality
- **Context-aware chunking** — Splits documents intelligently at sentence boundaries with overlap, so translations stay coherent across chunks
- **Multiple export formats** — Download results as PDF or Word (DOCX)
- **Language detection** — Auto-detects source language from document content
- **Cancellation** — Stop an in-progress translation at any time

## How It Works

1. **Upload** a PDF document and select the source language (Arabic, Turkish, or German)
2. The document is **parsed** — text is extracted with positional data, blocks are classified (headings, paragraphs, lists), and the content is split into token-aware chunks
3. Each chunk is **translated** via AI, streamed back in real time with previous/next chunk context for coherence
4. **Export** the translated document as PDF (with reconstructed layout) or Word

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/) API key

### Setup

```bash
git clone <repo-url>
cd pdf-translator
npm install
```

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Optional environment variables:

| Variable | Default | Description |
|---|---|---|
| `AI_MODEL_ID` | `anthropic/claude-3.5-sonnet` | OpenRouter model to use for translation |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size in MB |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| AI | OpenRouter API via Vercel AI SDK |
| PDF parsing | pdfjs-dist |
| PDF generation | pdf-lib |
| Word export | docx |
| State management | Zustand |
| Styling | Tailwind CSS 4 |
| Token counting | gpt-tokenizer |

## Project Structure

```
src/
├── app/                    Next.js pages and API routes
│   ├── page.tsx            Upload page
│   ├── translate/[jobId]/  Translation progress page
│   └── api/                Upload, parse, translate, status, export endpoints
├── components/             React components (upload, translation, export)
├── hooks/                  useUpload, useTranslation
├── lib/
│   ├── ai/                 OpenRouter client configuration
│   ├── pdf/                Text extraction and layout analysis
│   ├── chunking/           Document splitting and context building
│   ├── translation/        AI translation with retry logic
│   ├── export/             PDF and DOCX generation
│   ├── storage/            In-memory job store
│   └── utils/              Language detection, RTL handling, token counting
├── store/                  Zustand store
└── types/                  TypeScript interfaces
```

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload a PDF, returns a job ID |
| POST | `/api/parse` | Parse and chunk a document |
| POST | `/api/translate` | Stream translation via SSE |
| GET | `/api/status` | Poll job progress |
| POST | `/api/export/pdf` | Export translated PDF |
| POST | `/api/export/docx` | Export translated Word document |

## Limitations

- **In-memory storage** — Jobs and files are stored in memory and do not persist across server restarts. A production deployment would need a database or Redis.
- **Target language** — Currently only translates to English.
- **Layout fidelity** — Complex layouts (multi-column, tables, embedded images) may not reconstruct perfectly.

## Scripts

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

## License

Private
