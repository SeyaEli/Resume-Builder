import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createAiHandler } from './server/groq'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: 'private-groq-api',
    configureServer(server) {
      const handler = createAiHandler({ env: { ...process.env, ...loadEnv(mode, process.cwd(), '') } });
      server.middlewares.use('/api/ai', handler);
    },
  }],
  base: './',
}))
