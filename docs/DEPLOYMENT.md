# Deploy PromptForge to Vercel

## 1. Pre-deploy checklist

- Do not commit `.env.local`.
- Keep `.env.example` as documentation only.
- Confirm the project builds locally:

```powershell
npm run lint
npm run build
```

## 2. Required Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

### OpenAI

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### OpenRouter

```text
OPENAI_API_KEY=sk-or-...
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENAI_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

> Use a chat/instruct model. Safety/classifier models often do not return the JSON required by the app.

## 3. Vercel project settings

Recommended defaults:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
Node.js Version: 20.x or latest LTS
```

## 4. Production hardening included

This project includes:

- `vercel.json` security headers
- API function `maxDuration` for AI routes
- API runtime pinned to `nodejs`
- Production SEO metadata
- `poweredByHeader: false`
- Safe client rendering for partial AI JSON arrays

## 5. Common troubleshooting

### AI model did not return JSON

Use a stronger chat/instruct model and avoid classifier/safety models.

### API timeout

Use a faster model, reduce input length, or use Vercel Pro if your provider latency is high.

### Missing API key

Confirm `OPENAI_API_KEY` is configured for the correct Vercel environment: Production, Preview, or Development.

### OpenRouter free model errors

Some free endpoints reject JSON mode or return inconsistent structures. PromptForge includes defensive JSON extraction and UI guards, but production quality is better with a reliable instruct model.
