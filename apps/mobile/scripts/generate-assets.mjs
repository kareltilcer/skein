// Renders the in-app SkeinLogo (src/screens/EmptyScreen.tsx) to the three
// PNGs the Expo build pipeline expects: launcher icon, Android adaptive-icon
// foreground, and splash image. Regenerate with `npm run generate-assets`.

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../assets')

const FG = '#9C3D2E'      // colors.brick (tokens/colors.ts)
const ACCENT = '#D4923B'  // colors.mustard
const BG = '#F2EBDD'      // colors.bg (light theme)

const CANVAS = 1024
const LOGO_VIEWBOX = 56

// Mirrors the <Svg viewBox="0 0 56 56"> body in EmptyScreen.tsx:18-26.
function logoPaths(fg, accent) {
  return `
    <circle cx="28" cy="30" r="18" fill="${fg}"/>
    <path d="M14 24 Q 28 18 42 24" stroke="${accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M12 32 Q 28 26 44 32" stroke="${accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M14 40 Q 28 34 42 40" stroke="${accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M20 16 Q 28 22 36 16" stroke="${accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M44 24 Q 52 18 50 10" stroke="${fg}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="9" r="2" fill="${fg}"/>
  `
}

function composedSvg({ logoFraction, backgroundFill }) {
  const logoPx = CANVAS * logoFraction
  const scale = logoPx / LOGO_VIEWBOX
  const offset = (CANVAS - logoPx) / 2
  const bgRect = backgroundFill
    ? `<rect width="${CANVAS}" height="${CANVAS}" fill="${backgroundFill}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    ${bgRect}
    <g transform="translate(${offset} ${offset}) scale(${scale})">
      ${logoPaths(FG, ACCENT)}
    </g>
  </svg>`
}

async function renderTo(file, svg, { flatten = false } = {}) {
  let pipeline = sharp(Buffer.from(svg))
  if (flatten) pipeline = pipeline.flatten({ background: BG })
  await pipeline.png().toFile(path.join(OUT_DIR, file))
  console.log('wrote', file)
}

await fs.mkdir(OUT_DIR, { recursive: true })

// Launcher icon: opaque cream bg, logo at ~57% of canvas. Play Store rule:
// no transparency, no rounded corners — Play applies the mask itself.
await renderTo(
  'icon.png',
  composedSvg({ logoFraction: 0.57, backgroundFill: BG }),
  { flatten: true },
)

// Android adaptive-icon foreground: transparent bg, logo within the ~66%
// safe zone so the system mask won't crop it. backgroundColor is supplied
// in app.json (android.adaptiveIcon.backgroundColor).
await renderTo(
  'adaptive-icon.png',
  composedSvg({ logoFraction: 0.50, backgroundFill: null }),
)

// Splash: transparent bg (expo-splash-screen fills with backgroundColor at
// runtime). Logo large on canvas so the plugin's imageWidth: 200 downsamples
// cleanly.
await renderTo(
  'splash.png',
  composedSvg({ logoFraction: 0.62, backgroundFill: null }),
)

console.log('Done →', OUT_DIR)
