import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyStoredThemeEarly } from './services/themeService.ts'

// Paint the saved mode and palette before the first render, so dark-mode
// users never see a white flash while the app starts up.
applyStoredThemeEarly()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
