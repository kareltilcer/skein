import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'
import { readFileSync } from 'node:fs'

// Read package.json to inject version as VITE_APP_VERSION
// Uses try-catch for robust error handling in case package.json is missing or invalid
// Validates that version matches semantic versioning format (x.y.z[-prerelease])
let appVersion = 'unknown'
try {
  const pkgPath = path.resolve(__dirname, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const rawVersion = pkg.version && typeof pkg.version === 'string' ? pkg.version.trim() : null
  // Validate semantic version format (e.g., 1.0.0, 0.0.1, 1.0.0-alpha, 1.0.0-beta.1)
  appVersion = rawVersion && /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?$/.test(rawVersion) ? rawVersion : 'unknown'
} catch (error) {
  console.warn('Could not read package.json for version injection at ' + path.resolve(__dirname, 'package.json') + ':', error)
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@skein/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
