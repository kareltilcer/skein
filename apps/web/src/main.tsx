import './storage/localStorageAdapter'
import './i18n'
import './styles/global.css'
import './lib/statusReportInit' // Initialize status reporting as early as possible

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import App from './App'
import { detectSystemLanguage } from './i18n'
import { useSettingsStore } from '@skein/shared'

// First-launch language pick — same shape as mobile's _layout.tsx effect, but
// settings hydrate synchronously from localStorage so we can read once.
const state = useSettingsStore.getState()
if (!state.languageInitialized) {
  state.setLanguage(detectSystemLanguage())
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
