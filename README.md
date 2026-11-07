# ResumeAI Pro — ATS Resume Platform

## Groq AI setup

Requires Node.js 24+ for the local server tests. Run `npm install`, copy `.env.example` to `.env.local`, and fill in these **server-only** settings:

- `GROQ_API_KEY`: your private Groq key.
- `AI_ACCESS_PASSWORD`: a different, strong password used to unlock this app's AI features. Never reuse your Groq key.
- `AI_ALLOWED_ORIGINS`: comma-separated exact app origins, such as `http://localhost:5173`. For hosting, set your real HTTPS domain here.
- `GROQ_MODEL`: defaults to `openai/gpt-oss-20b`. Settings also offers `openai/gpt-oss-120b`; Test connection checks account availability.

Start `npm run dev`, open **Settings → Groq AI**, enter the **app access password**, then click **Test connection**. The password stays in memory until reload. Never paste the Groq key into the app or chat. Legacy API keys saved by the old connection screen are removed from browser storage on startup; revoke any key previously used in that screen if it may have been exposed.

On Vercel, configure the same private variables under the project's environment settings and deploy normally. `api/ai.ts` provides the server endpoint; Vite provides it during development. A static `dist` upload to XAMPP, `vite preview`, and the packaged Android app alone do not run the endpoint. Serve the web app and endpoint together on Vercel or a Node host. The Android wrapper needs an HTTPS-hosted app/backend configuration before online AI can be used; the existing local writing tools remain available.

The Groq key is never included in frontend preferences, requests, backups or assets. Only the server talks to Groq. Relevant resume text and recent coaching messages are sent to Groq when selected; the app does not log those contents. The endpoint requires the separate password, an allowed origin, bounded inputs, and has a per-instance limit of 20 requests/minute. For public multi-user use, add individual authentication, shared rate limits and hosting spend controls; the shared password is intended for a private installation. Origin checks are not authentication.

Summaries, cover letters, LinkedIn About, coaching and job suggestions use the selected provider. The optimizer validates IDs, bullet counts and numeric changes before applying a rewrite; review its before/after text for factual accuracy. Missing metrics use placeholders. Groq failures display an explanation and use the offline engine. The ATS score remains the app's local heuristic, not a guarantee of hiring outcomes.

### AI verification

```bash
npm test
npm run build
npm run test:secrets
```

Install the Chromium browser with `npx playwright install chromium` if needed. The AI tests run against a local server with simulated Groq replies; they do not spend API credits or require a real key. The build security check uses fake server-secret sentinels and scans all generated browser files. Real Groq connectivity must be checked using Settings after private server configuration.

## Playwright E2E Tests

### Install Playwright (first time)
```bash
npx playwright install
```

### Run all tests (headless)
```bash
npx playwright test
```

### Run tests in headed mode
```bash
npx playwright test --headed
```

### Run tests in interactive UI mode
```bash
npx playwright test --ui
```

### Open HTML report after a run
```bash
npx playwright show-report
```

### Run a single test file
```bash
npx playwright test tests/example.spec.ts
```

### Run tests matching a title
```bash
npx playwright test -g "Resume Builder"
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
