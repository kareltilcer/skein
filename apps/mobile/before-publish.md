# Play Store Publishing Audit — Skein Mobile

Audit of `apps/mobile/` against Google Play Store submission requirements. Reviewed: `app.json`, `package.json`, `metro.config.js`, `babel.config.js`, routing under `app/`, i18n setup, store/screens layout.

## Blockers (won't build, won't submit, or won't pass review)

### 1. `app.json` Play Store fields — RESOLVED

`app.json` now declares every required field. Verified against the current file:

| Field | Value | Status |
|---|---|---|
| `icon` | `./assets/icon.png` — **1024×1024, no alpha, RGB** (opaque, no rounded corners) | ✓ |
| `android.adaptiveIcon` | `foregroundImage: ./assets/adaptive-icon.png` (1024×1024) + `backgroundColor: #F2EBDD` | ✓ |
| `android.versionCode` | `1` — bump manually on every Play upload (`eas.json` uses `autoIncrement: false`) | ✓ |
| splash | `expo-splash-screen` plugin: `image: ./assets/splash.png` (1024×1024), `backgroundColor: #F2EBDD`, `imageWidth: 200` — resolves the white-flash concern at `_layout.tsx:22` | ✓ |
| `userInterfaceStyle` | `"automatic"` — matches the dark/light/auto logic in `_layout.tsx:27` | ✓ |
| `description` | "Plan projects, log rows, and keep your yarn library — quietly, offline, and yours." | ✓ |
| `android.permissions` | `[]` — no inherited defaults | ✓ |
| `android.edgeToEdgeEnabled` | `true` — insets handled via `SafeAreaProvider` (`_layout.tsx:83`) | ✓ |
| `orientation` | `"portrait"` | ✓ |
| `newArchEnabled` | `true` | ✓ |

Asset dimensions/alpha confirmed with `sips`: `icon.png` is opaque (Play rejects transparent launcher icons); `adaptive-icon.png` and `splash.png` carry alpha as expected. All three referenced files exist under `apps/mobile/assets/` (this also clears blocker #2 below).

### 2. App icon / splash / adaptive icon assets — RESOLVED

`apps/mobile/assets/` exists and is checked in with all three PNGs, each verified 1024×1024 via `sips`:

- `icon.png` — 1024×1024, **no alpha**, RGB (Play-compliant opaque launcher icon).
- `adaptive-icon.png` — 1024×1024 with alpha (adaptive foreground; paired with `backgroundColor: #F2EBDD`).
- `splash.png` — 1024×1024 with alpha (wired via the `expo-splash-screen` plugin).

All three are referenced correctly from `app.json` (see blocker #1). The one remaining image — the **1024×500 feature graphic** — is a store-listing asset that lives outside the repo and is tracked under "Play Console listing prerequisites" below.

### 3. Display name vs brand — RESOLVED

Public brand is **YarnLog**. `app.json` `name` already set; the three remaining user-visible "Skein" strings (`settings.resetData` in en/de/cs) have been changed to "YarnLog". Internal identifiers kept as-is: `slug: "skein"`, `scheme: "skein"`, `com.skein.app` bundle id (permanent on Play), `@skein/mobile` package name, `skein-*` AsyncStorage keys, `SkeinLogo`/`resetSkeinData` symbol names. None of those are surfaced to users.

### 4. EAS build configuration — RESOLVED (in repo)

`apps/mobile/eas.json` is now committed with three profiles:

- `development` — `developmentClient: true`, internal distribution, APK (for dev-client installs on a device).
- `preview` — internal distribution APK (for sharing test builds without dev-client).
- `production` — `buildType: "app-bundle"` (AAB for Play Store), `autoIncrement: false` (versionCode is bumped manually in `app.json` to keep it under source control).
- `appVersionSource: "local"` — Expo reads the version/versionCode from `app.json` rather than its own remote store.

A `submit.production` block is also configured to push to the Play Console **internal** track as a **draft** by default — safe initial setting; flip to `production`/`completed` once the listing is ready.

Manual steps still required (cannot be automated from the repo — needs the user's Expo + Play accounts):

1. `npx eas-cli login` then `npx eas-cli init` inside `apps/mobile/` to create/link an EAS project (writes `extra.eas.projectId` into `app.json`).
2. First `eas build -p android --profile production` run: choose **"Let EAS manage credentials"** when prompted (recommended — EAS generates and stores the upload keystore).
3. For `eas submit -p android` to work, create a Google Play service-account JSON (Play Console → Setup → API access) and either point `submit.production.android.serviceAccountKeyPath` at it or upload it once via `eas credentials`.

### 5. Privacy policy URL — RESOLVED

Play Console requires one in the Data Safety form, even though this app appears to be fully local (`AsyncStorage` only — no backend, no analytics). Hosted at **https://yarnlog.tilcer.cz/privacy-policy** — use this URL in the Data Safety form and the store listing.

## Things to verify before the production build

### 6. The Metro/Babel "Expo Go" hacks (`metro.config.js:11-31`, `babel.config.js:7-21`) — RESOLVED

Reframing: these aren't really "Expo Go" hacks. Expo SDK 54's *canonical* versions (per `expo/bundledNativeModules.json`) are **react 19.1.0** and **react-native-worklets 0.5.1** — exactly what the mobile workspace pins. The monorepo hoists newer versions to the repo root (react **19.2.7**, pulled by `apps/web`'s `react ^19.1.0`; worklets **0.8.3**, pulled by reanimated's `0.5 - 0.8` range). The Metro `resolveRequest` redirects + the manual Babel plugin pin realign everything back to the SDK-correct versions. This alignment is required for **both** Expo Go and standalone production builds — removing it would break the release build, not just dev.

Verified statically (authoritative) — worklets is aligned at **0.5.1** across all three layers that must agree:

| Layer | worklets | react |
|---|---|---|
| Native (RN autolinking → `apps/mobile/node_modules`) | **0.5.1** | n/a (RN 0.81.5 renderer pairs with 19.1.0) |
| JS bundle (Metro `resolveRequest`) | **0.5.1** | **19.1.0** (forced) |
| Babel worklets plugin | **0.5.1** | — |
| Expo SDK 54 canonical | 0.5.1 | 19.1.0 |

The riskiest case the audit worried about — native compiled at 0.8.3 while JS runs 0.5.1 — **does not happen**. `expo-modules-autolinking react-native-config` resolves the native worklets module to `apps/mobile/node_modules/react-native-worklets@0.5.1` (node resolution starts in the workspace, where the exact `0.5.1` pin keeps a nested copy), matching the JS bundle and Babel plugin. `reanimated` resolves to root `4.1.7` (satisfies Expo's `~4.1.1` and its own `0.5 - 0.8` worklets range); single copy, no skew.

Verified by running the production JS pipeline: `NODE_ENV=production expo export --platform android` — Metro in production mode with the `resolveRequest` redirects and the 0.5.1 Babel worklets plugin — compiled the whole app (reanimated worklets included) to a valid **5.01 MB Hermes bytecode bundle** with no errors. That's the JS half of a release build; a worklets-plugin/runtime version mismatch would have thrown during transform.

Remaining manual step (couldn't run here — no JDK in this env, and it requires `expo prebuild`/Gradle): install the resulting AAB/APK on a device and tap through once to *visually* confirm reanimated animations play. The substantive risk behind that step (version mismatch) is already ruled out above.

### 7. Run `npm run typecheck` cleanly — RESOLVED

`npm run typecheck` (`tsc --noEmit`) **passes with exit 0**, no errors, under `strict: true` (tsconfig extends `expo/tsconfig.base`).

Confirmed the check is meaningful, not vacuous: `tsc --listFilesOnly` shows it covers all **69** mobile `.ts`/`.tsx` files plus the shared `packages/shared` sources. `skipLibCheck` only skips `node_modules` `.d.ts` files (standard). The `.expo/types/**/*.d.ts` entry in `include` currently matches nothing, but that's harmless — typed routes aren't enabled (the `expo-router` plugin has no options and there's no `experiments.typedRoutes`), so no generated route types are required for full coverage.

### 8. Strip dev-only code — RESOLVED

Full sweep of `src/` and `app/` is clean: **no** `console.*`, `__DEV__` branches, `TODO`/`FIXME`/`HACK`, `debugger`, `alert(`, or any `seed`/`mock`/`dummy`/`fixture`/`testData` identifiers. No dev-only code to strip.

The one flagged item — `resetSkeinData` in `SettingsScreen.tsx` — turned out **not** to be dev/debug code. It's a complete, polished **user feature** ("reset all data / start fresh"): confirmation-gated behind a modal (brick-red destructive styling, "no undo" warning, `resetting` busy state, "Keep it" cancel), fully translated in en/de/cs, and it wipes only user data (projects, custom library, custom stitches) while restoring library seeds and **preserving** theme/language/preferences (`packages/shared/src/stores/resetStores.ts`).

Its entry-point button (the `MiniRow` in the Settings "More" group) is **intentionally commented out** (`SettingsScreen.tsx:387-393`), so the whole flow — modal, `executeReset`, `resetConfirmOpen`/`resetting` state, the `resetStores` import, and the `resetData*` i18n keys — is currently unreachable dead code but does no harm (typechecks, doesn't ship a live destructive button).

**Decision (1.0): leave as-is** — button stays commented out, revisit post-1.0. Nothing to remove or gate for release; the destructive action is not reachable by users.

## Play Console listing prerequisites — RESOLVED (assets prepared in repo)

All listing assets and pre-filled form answers now live under
[`store-listing/`](./store-listing/) (see its `README.md` for the field-by-field upload guide).
Images are generated from committed, reproducible source in `store-listing/build/` (headless
Chrome + the app's own embedded fonts); rerun with `node build.mjs`.

- **Screenshots** — ✓ 6 phone screenshots at 1080×1920, per language (`store-listing/screenshots/{en,cs,de}/`). These are designed marketing mockups (pixel-exact recreations of real screens using the app's real palette, fonts, and in-app copy) because this environment has no Android build toolchain for genuine captures. **Phone-only confirmed** (matches `app.json` — no Android tablet support declared; `ios.supportsTablet` doesn't affect the Play listing).
- **Feature graphic** — ✓ 1024×500 PNG per language (`store-listing/feature-graphic/`).
- **Short description** (≤80) and **full description** (≤4000) — ✓ in en/cs/de, all verified within limits (`store-listing/descriptions/`). Also includes a ≤30-char app title per language.
- **Content rating questionnaire** (IARC) — ✓ recommended answers (all "No" → lowest ratings) in `store-listing/play-console-answers/content-rating-iarc.md`.
- **Target audience & content** — ✓ recommendation (adult audience, no under-13 group → avoids Families policy) in `target-audience.md`.
- **Data safety form** — ✓ "no data collected or shared" (app is fully on-device; no backend/analytics/SDKs) with per-toggle guidance in `data-safety.md`.
- **Ads declaration** — ✓ "Contains ads?" → **No** (`ads-declaration.md`).
- **Store app icon (512×512)** — export from `assets/icon.png`: `sips -z 512 512 assets/icon.png --out icon-512.png`.

## Nice-to-haves before 1.0

- **Crash reporting** (Sentry/Bugsnag). Zero observability if a release crashes for a user.
- **In-app version display** in Settings — helps users report bugs against a known build.
- **A real about/legal screen** linking to the privacy policy from inside the app — Play reviewers sometimes check.

## Suggested next step

The fastest path to "ready to upload":

1. ✓ Public name (YarnLog) + package id (`com.yarnlog.app`) decided.
2. ✓ Icon/adaptive-icon/splash wired in `app.json` (blockers #1–2).
3. `npx eas-cli init` + the committed `eas.json` `production` profile producing an AAB (blocker #4 — manual EAS/Play account steps remain).
4. Run one `eas build -p android --profile production`, install the resulting AAB on a device via `bundletool`, and smoke-test.
5. ✓ Privacy policy hosted (#5); ✓ listing copy, screenshots, feature graphic and Console form answers prepared in [`store-listing/`](./store-listing/) — transcribe them into the Console per its `README.md`.
