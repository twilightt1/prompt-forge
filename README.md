# PromptForge — Enhanced Prompt Studio

PromptForge is a premium local-first Next.js workspace for turning rough ideas into production-grade AI prompts.
It uses an OpenAI-compatible AI API as a prompt optimization workflow: analyze intent, collect missing context, rewrite, evaluate, test behavior, generate variants, explain changes, create checklist, and export results.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## LLM Configuration

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Notes:

- `OPENAI_API_KEY` is required for AI prompt rewriting/enhancement.
- `OPENAI_MODEL` defaults to `gpt-4o-mini`.
- `OPENAI_BASE_URL` defaults to `https://api.openai.com/v1`.
- Change `OPENAI_BASE_URL` for OpenAI-compatible providers.
- If no valid API key is configured, enhancement will show an error instead of generating a local fallback prompt.

## Product Features

- Six prompt modes: General, Coding, Marketing, Image, Research, Agentic.
- Advanced controls:
  - Output language: Auto, English, Vietnamese, Bilingual.
  - Enhancement strength: Light, Balanced, Deep.
  - Style: Professional, Creative, Technical, Concise.
- AI workflow:
  - Analyze prompt intent before enhancement
  - Recommend mode and strategy
  - Collect clarifying answers
  - Rewrite/enhance prompt
  - Evaluate quality score and criteria
  - Identify issues and suggestions
  - Generate Concise / Structured / Expert variants
  - Explain important changes
  - Create quality checklist
  - Test enhanced prompt behavior
  - Generate metadata tags
- Prompt library:
  - Search history
  - Favorite prompts
  - Restore previous prompts
  - Clear local history
- Export full consultant result as Markdown.

## Available Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Project Structure

```text
src/app/api/analyze/route.ts      AI prompt intent and missing-context analysis endpoint
src/app/api/enhance/route.ts      Server-side OpenAI-compatible AI consultant endpoint
src/app/api/test-prompt/route.ts  AI prompt behavior test endpoint
src/components/prompt-studio.tsx  Interactive PromptForge workspace
src/lib/ai-result.ts              Shared AI workflow result types
src/lib/enhance-options.ts        Shared enhancement option types
src/lib/prompt-engine.ts          Local scoring diagnostics
src/lib/templates.ts              Prompt template gallery
src/app/globals.css               Professional UX design system
```