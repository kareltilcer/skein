# Play Store Publishing Audit — Skein Mobile

Audit of `apps/mobile/` against Google Play Store submission requirements. Reviewed: `app.json`, `package.json`, `metro.config.js`, `babel.config.js`, routing under `app/`, i18n setup, store/screens layout.

## Blockers (won't build, won't submit, or won't pass review)

### 1. `app.json` is minimal — missing nearly every Play Store field

Current state: name, slug, version, scheme, bundleId, package, two plugins. That's it. You need at least:

- `icon` — path to a 1024×1024 PNG (no transparency, no rounded corners)
- `android.adaptiveIcon` — `foregroundImage` + `backgroundColor` (or background image)
- `android.versionCode` — integer, must increment on every Play upload. **Set this now**; auto-bump is opt-in via EAS.
- `splash` (or `expo-splash-screen` plugin config) — `_layout.tsx:21` calls `SplashScreen.preventAutoHideAsync()` but no splash is configured, so users see a white flash.
- `userInterfaceStyle: "automatic"` — dark/light/auto is supported in code but never declared; Android will lock to light without this.
- `description` — needed by the manifest and the store listing.
- `android.permissions` — explicitly set to `[]` if none are needed; otherwise Expo inherits a default set you didn't pick.
- `android.edgeToEdgeEnabled: true` (Android 15 / SDK 35 default behavior). Confirm screens handle insets — `SafeAreaProvider` is wired, so likely fine, but worth a pass.

### 2. No app icon / splash / adaptive icon assets exist

There is no `assets/` directory in `apps/mobile/`. The `design/` folder only contains handoff ZIPs. Actual PNGs need to be checked in (typically `apps/mobile/assets/icon.png`, `adaptive-icon.png`, `splash.png`, plus a 1024×500 feature graphic for the store listing — that one lives outside the repo).

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

### 5. No privacy policy URL

Play Console requires one in the Data Safety form, even though this app appears to be fully local (`AsyncStorage` only — no backend, no analytics). Host a simple page; submission is blocked without it.

## Things to verify before the production build

### 6. The Metro/Babel "Expo Go" hacks (`metro.config.js:11-31`, `babel.config.js:7-21`)

Both files exist to force React 19.1.0 and `react-native-worklets` 0.5.1 to match what Expo Go ships. In a **standalone production build** there is no Expo Go binary — the build uses whatever `apps/mobile/node_modules` resolves. The redirects should still work (they point at the same project node_modules) but:

- Verify `npx expo run:android --variant release` succeeds end-to-end at least once before EAS.
- The worklets-plugin version pin is the riskiest piece — confirm reanimated animations actually run in a release build (the Expo Go pinning isn't relevant once shipping a standalone binary, but the version still needs to match between runtime and the babel plugin).

### 7. Run `npm run typecheck` cleanly

`npx tsc --noEmit` didn't produce readable output in audit context — run it manually and resolve any errors before publishing.

### 8. Strip dev-only code

`grep` for `console.*` returned nothing (good). Still worth a manual sweep for `__DEV__`-only branches and any test/seed buttons in the Settings screen — `resetSkeinData` is imported in `SettingsScreen.tsx` and that's a destructive action that should probably be gated or removed for a 1.0 release.

## Play Console listing prerequisites (outside the repo, but blocking submission)

- **Screenshots**: minimum 2 phone screenshots (1080×1920 or similar). `ios.supportsTablet: true` is set but no Android tablet support is declared, so the listing will be phone-only — confirm that's intended.
- **Feature graphic**: 1024×500 PNG/JPG.
- **Short description** (80 chars) and **full description** (4000 chars) — in en/cs/de since all three are supported.
- **Content rating questionnaire** (IARC) — quick form, but mandatory.
- **Target audience & content** — declare adult vs. mixed-age audience.
- **Data safety form** — declare that user data stays on device. AsyncStorage counts as "data collected" in Google's definition only if it leaves the device; since it doesn't, declare "no data collected/shared" but still fill the form.
- **Ads declaration** — "Contains ads?" → No.

## Nice-to-haves before 1.0

- **Crash reporting** (Sentry/Bugsnag). Zero observability if a release crashes for a user.
- **In-app version display** in Settings — helps users report bugs against a known build.
- **A real about/legal screen** linking to the privacy policy from inside the app — Play reviewers sometimes check.

## Suggested next step

The fastest path to "ready to upload":

1. Decide the public name + final package id.
2. Add icon/adaptive-icon/splash PNGs under `apps/mobile/assets/` and wire them in `app.json` along with `versionCode`, `description`, `userInterfaceStyle`, and `android.permissions: []`.
3. `npx eas-cli init` + a minimal `eas.json` with a `production` profile producing an AAB.
4. Run one `eas build -p android --profile production`, install the resulting AAB on a device via `bundletool`, and smoke-test.
5. Host a privacy policy, prep listing copy + screenshots, fill the Console forms.
