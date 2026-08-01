# YarnLog — Play Store listing assets

Everything the Google Play Console asks for at submission, prepared and ready to upload.
This resolves the **"Play Console listing prerequisites"** section of
[`../before-publish.md`](../before-publish.md).

Languages covered: **English (en-US)**, **Čeština (cs-CZ)**, **Deutsch (de-DE)** — the three the app ships.
Form factor: **phone only** (matches `app.json`, which declares no Android tablet support).

## What's here

| Play Console field | File(s) |
|---|---|
| App title, short & full description (per language) | `descriptions/en.md`, `descriptions/cs.md`, `descriptions/de.md` |
| Feature graphic (1024×500) | `feature-graphic/feature-graphic-{en,cs,de}.png` |
| Phone screenshots (1080×1920, 6 each) | `screenshots/{en,cs,de}/0N-*.png` |
| Data safety form | `play-console-answers/data-safety.md` |
| Content rating (IARC) questionnaire | `play-console-answers/content-rating-iarc.md` |
| Target audience & content | `play-console-answers/target-audience.md` |
| Ads declaration | `play-console-answers/ads-declaration.md` |
| App icon (512×512 store icon) | derived from `../assets/icon.png` — see note below |

## Screenshots — what they are

The six screenshots per language are **designed marketing mockups**: each is a pixel-exact
recreation of a real YarnLog screen inside a phone frame, with a caption headline. They use the
app's **actual palette** (`packages/shared/src/tokens/colors.ts`), **actual fonts** (Caprasimo /
Noto Serif Display / DM Sans / DM Mono, embedded from the app's own font packages) and **actual
in-app copy** pulled from `src/i18n/locales/*.json`. Non-English headings use Noto Serif Display,
exactly as the app does (Caprasimo has no Czech/German diacritics).

They were rendered this way because this environment can't produce genuine device captures
(no JDK / Android build toolchain). If you later want literal screen captures from the Pixel
emulator, they can slot into the same folders — the caption/order below is a good shot list.

The six shots (order = listing order):

1. **Welcome** — hero: logo, greeting, "stitch happens.", no-account promise
2. **Row counter** — the core loop: hold-to-advance, repeat badge, stitch chart
3. **Cast-on wizard** — project setup (name, craft, yarn, needle)
4. **Library** — reusable patterns / sequences / rows
5. **Stitch picker** — 30 built-in stitches + "define your own"
6. **Settings** — shown in **dark mode** to showcase the theme; language + offline/no-account

## Regenerating the images

All images are generated from committed source (`build/`) — reproducible and offline
(fonts are embedded as data URIs from `node_modules/@expo-google-fonts`; rendering uses the
system Google Chrome via `chrome-launcher`).

```bash
cd apps/mobile/store-listing/build
node build.mjs                 # regenerate all 21 images
node build.mjs en counter      # preview one screen → build/_preview.png
node build.mjs de feature       # preview one feature graphic
```

Edit copy/captions in `build/build.mjs` (the `CONTENT` object), layouts in `build/screens.mjs`,
palette/fonts/glyphs in `build/theme.mjs`.

## Upload order in the Play Console

1. **Store listing** (Main store listing, and one per extra language):
   - Paste title / short / full description from `descriptions/<lang>.md`.
   - Upload the matching feature graphic and the 6 screenshots for that language.
   - App icon: Play wants a **512×512** 32-bit PNG. Export it from `../assets/icon.png`
     (1024×1024, opaque) — e.g. `sips -z 512 512 ../assets/icon.png --out /tmp/icon-512.png`.
2. **App content** (left nav):
   - Privacy policy URL: `https://yarnlog.tilcer.cz/privacy-policy`
   - Data safety → follow `play-console-answers/data-safety.md`
   - Content ratings → follow `play-console-answers/content-rating-iarc.md`
   - Target audience → follow `play-console-answers/target-audience.md`
   - Ads → follow `play-console-answers/ads-declaration.md`
3. Upload the AAB (see `../before-publish.md` §4 for the EAS build/submit steps).

## Play asset spec cross-check

- Screenshots: 1080×1920 PNG (2–8 per language; we provide 6). ✅
- Feature graphic: 1024×500 PNG. ✅
- Title ≤ 30 chars · short ≤ 80 · full ≤ 4000 — all verified within limits. ✅
