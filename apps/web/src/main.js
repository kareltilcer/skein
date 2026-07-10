import { jsx as _jsx } from "react/jsx-runtime";
import './storage/localStorageAdapter';
import './i18n';
import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import App from './App';
import { detectSystemLanguage } from './i18n';
import { useSettingsStore } from '@skein/shared';
// First-launch language pick — same shape as mobile's _layout.tsx effect, but
// settings hydrate synchronously from localStorage so we can read once.
const state = useSettingsStore.getState();
if (!state.languageInitialized) {
    state.setLanguage(detectSystemLanguage());
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(ThemeProvider, { children: _jsx(App, {}) }) }) }));
