# PromptForge — Enhanced Prompt Studio

PromptForge is a premium local-first Next.js workspace for turning rough ideas into production-grade AI prompts.
It uses an OpenAI-compatible AI API as a simple guided workflow: paste a rough prompt, choose what you want, improve it, review why it is better, test safety, and export the final result.

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

- Beginner-friendly workflow:
  - Choose what you want in plain language
  - Switch the app UI between English and Vietnamese
  - Persist UI language with a typed i18n helper layer
  - Translate the main workspace, advanced settings, result panels, export labels, and empty states
  - Select prompt output language separately from UI language
  - Select tone and language
  - Hide technical controls behind Advanced settings
- Advanced controls remain available:
  - Mode, strength, framework, rewrite level, target model, output goal
- AI workflow:
  - Analyze prompt intent before enhancement
  - Recommend mode and strategy
  - Collect clarifying answers
  - Rewrite/enhance prompt
  - Rewrite Engine v2 controls: output goal, framework, rewrite level, target model
  - Generate quality contract: must improve, must preserve, must avoid
  - Generate semantic diff with category, impact, before/after, and rationale
  - Evaluate score, grade, issues, suggestions, and criteria
  - Identify issues and suggestions
  - Generate Concise / Structured / Expert variants
  - Explain important changes
  - Create quality checklist
  - Test enhanced prompt behavior
  - Auto Optimize Loop with iterative prompt versions
  - Benchmark original vs enhanced prompt
  - Generate production guardrails and prompt addendum
  - Generate metadata tags
- Simplified result panel:
  - Improved Prompt
  - Why Better
  - Alternatives
  - Safety & Test
  - Export
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

## Deploy to Vercel

See [DEPLOYMENT.md](file:///d:/Coding/Vibe%20Coding/enhanced-prompt/DEPLOYMENT.md) for the production checklist.

Required Vercel environment variables:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

For OpenRouter, use:

```text
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

## Project Structure

```text
src/app/api/analyze/route.ts      AI prompt intent and missing-context analysis endpoint
src/app/api/benchmark/route.ts    AI original-vs-enhanced benchmark endpoint
src/app/api/enhance/route.ts      Server-side OpenAI-compatible AI consultant endpoint
src/app/api/guardrails/route.ts   AI production guardrails generator endpoint
src/app/api/optimize/route.ts     AI iterative prompt optimization endpoint
src/app/api/test-prompt/route.ts  AI prompt behavior test endpoint
src/components/prompt-studio.tsx  Interactive PromptForge workspace
src/lib/ai-result.ts              Shared AI workflow and Rewrite Engine v2 result types
src/lib/enhance-options.ts        Rewrite profile and enhance control options
src/lib/prompt-engine.ts          Local scoring diagnostics
src/lib/templates.ts              Prompt template gallery
src/app/globals.css               Professional UX design system
```