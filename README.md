# YourVoice

AI-driven video localization workspace built with Next.js, React, TypeScript, FFmpeg.wasm, and OpenAI Whisper.

## Product Story

Video creators often lose time on three repetitive jobs: subtitle drafting, audio/video packaging, and polishing content into something publishable. Traditional editors are powerful, but they are also heavy, easy to overuse for small tasks, and not ideal when privacy matters.

YourVoice turns those workflows into a lightweight browser-first experience:

- Generate AI subtitles from uploaded video audio
- Merge dubbing tracks and subtitle files into finished MP4 output
- Mix vlog background music while preserving the original atmosphere
- Surface local analytics so iteration is guided by data, not guesswork
- Suggest tags, titles, and BGM direction from video naming cues

## Core Features

### 1. AI Subtitle Generation

- Extracts audio from uploaded video with FFmpeg.wasm
- Calls OpenAI Whisper for subtitle transcription
- Supports subtitle review and editing in-page
- Converts subtitle segments into both SRT and VTT formats
- Applies generated subtitles back into the existing synthesis workflow

### 2. Dual Video Processing Modes

**Dubbing mode**

- Video + voice track + subtitles -> packaged MP4
- Subtitle encapsulation for playback and preview
- Maintains the current local-first processing flow

**Vlog mode**

- Video + BGM -> mixed output video
- Adjustable BGM volume
- Keeps the original voice/environment audio in the mix

### 3. Local Analytics Dashboard

- Tracks total processing count, success rate, and average processing time
- Captures recent failures for quick debugging
- Compares dubbing vs vlog usage distribution
- Records AI subtitle adoption to support product iteration

### 4. AI Content Insight

- Generates topic tags from video file names
- Suggests publishable video titles
- Recommends BGM style direction
- Summarizes likely content positioning for creators

## Tech Highlights

- **Next.js 16 + React 19** for the App Router UI architecture
- **TypeScript** for strict typing across processing and AI flows
- **FFmpeg.wasm** for local media extraction, muxing, and subtitle handling
- **OpenAI Whisper API** for AI subtitle generation
- **Tailwind CSS 4** for rapid UI composition
- **localStorage analytics** for lightweight product instrumentation without backend overhead

## Why This Project Stands Out

- Combines browser-side media processing with AI capabilities in one product flow
- Demonstrates practical multimodal product thinking instead of isolated feature demos
- Balances privacy-first local processing with selective cloud AI inference
- Shows measurable product mindset through analytics and performance instrumentation

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

Note:
- `NEXT_PUBLIC_OPENAI_API_KEY` is used in the browser for demo purposes.
- For production, move Whisper calls behind a server-side API route.

### 3. Start development

```bash
pnpm dev
```

### 4. Validate production build

```bash
pnpm lint
pnpm exec next build --webpack
```

`next build` with Turbopack may fail in restricted sandbox environments because of process/port limitations, so `--webpack` is the stable verification command for this workspace.

## Project Structure

```text
src/app/
  components/
    AnalyticsDashboard.tsx
    SubtitleEditor.tsx
  services/
    analyticsService.ts
    subtitleService.ts
    videoAnalysisService.ts
  page.tsx
```

## Resume Value

This project now reads as a productized AI media tool rather than a simple FFmpeg demo:

- Built an AI-assisted video localization platform with subtitle generation, editing, and packaging
- Integrated OpenAI Whisper into a browser-based Next.js media workflow
- Designed local analytics instrumentation to track processing success, latency, and feature usage
- Added lightweight AI content analysis to improve creator publishing efficiency

## Roadmap

- Batch processing for multiple videos
- Server-side secured AI proxy for production deployments
- More advanced video analysis based on keyframes or thumbnails
- Shareable project presets for localization workflows
