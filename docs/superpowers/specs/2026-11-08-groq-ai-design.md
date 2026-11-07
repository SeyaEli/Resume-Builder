# Groq AI integration — proposed design

Status: approved by the user and implemented on 2026-11-08.

## Intent

Improve the existing resume assistance with the user's Groq account. Keep the current React/TypeScript app and its offline engine, with grounded writing that uses actual resume facts.

## Current behavior

- `aiService.ts` supports local rules and browser-direct OpenAI-compatible requests; connection details, including the key, persist in local storage.
- Summary, LinkedIn About, job-targeted suggestions, and coaching use that service.
- The main optimizer and cover letter generator bypass the connected service.
- Coaching sends only the current question and a turn counter, rather than conversation history.
- Some offline suggestions contain invented metrics or experience claims; these need correction alongside the Groq prompts.
- The app uses Vite, has a Vercel-hosted test target, and includes an Android wrapper. There is no existing application backend.

## Approaches

1. Add a browser-direct Groq preset. Least work, but retains browser-stored secrets and leaves several features disconnected.
2. Add a small server-side Groq endpoint and connect the existing features through it. Recommended: protects the key and gives all writing tools the same behavior.
3. Replace the application backend or add a separate AI platform. More infrastructure than these existing features need.

## Proposed scope

- Introduce a server-side endpoint compatible with Vercel and local development. Read `GROQ_API_KEY` from private server environment settings, never a `VITE_` variable. Include an ignored local configuration file and a safe example without credentials.
- Add Groq in Settings with model selection and a connection check. Default to `openai/gpt-oss-20b`, configurable by the server; confirm model availability through Groq rather than relying on old Llama defaults.
- Connect summary generation, existing bullet and skill suggestions, cover letters, LinkedIn About, and career coaching to Groq. Send recent conversation history for coaching.
- Upgrade the main optimizer to request validated summary and bullet rewrites, preserving resume structure, identities, dates, employers, and the existing before/after display.
- Keep existing offline operation with a visible explanation when Groq is unavailable. Remove unsupported claims and invented statistics from affected offline writing paths; use clearly marked placeholders where appropriate.
- Ask the model to distinguish actual resume facts from suggestions. Treat job descriptions and resume text as source material rather than instructions. Do not automatically add suggested skills as established experience.
- Update privacy text to explain when resume text goes to Groq. Keep API keys and resume contents out of server logs and returned errors.

## Boundaries and implementation calls

Keep the current interface and ATS scoring rules. Do not promise an ATS pass or hiring outcomes. No deployment, paid services, account changes, web browsing by the model, or broad redesign is included. The Android wrapper will need a configured hosted endpoint to use server AI; offline writing remains available.

The endpoint will restrict accepted tasks, sizes, output shape, request duration, and origin. Public deployment also needs abuse controls appropriate to its hosting; a frontend origin check alone is not authentication. Avoid exposing an unrestricted paid inference proxy.

## Verification

Check successful generation, missing credentials, invalid model/key, rate limits, timeout, malformed model output, offline fallback, preserved resume fields, coaching context, and absence of credentials from browser storage and built assets. Run the TypeScript production build and relevant local tests. A real Groq connection test requires the user's key to be configured privately.

## References

- https://console.groq.com/docs/quickstart
- https://console.groq.com/docs/models
