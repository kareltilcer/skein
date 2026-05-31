---
name: i18n-audit
description: Audit Skein's localization coverage. Use whenever a new language is added, a new screen ships, or you suspect untranslated strings or key drift. Triggers — user says "audit translations", "check i18n", "verify localization", "any missing translations", "I added language X — verify", or after edits to apps/mobile/src/i18n/** or any screen/component file with user-facing strings.
---

# i18n-audit

Audits the Skein mobile app's i18n state. Two passes:

1. **Key parity** — every locale file shares the same key set as English (the canonical reference). Reports missing keys, extra keys, and missing locale files for languages registered in `SUPPORTED_LANGUAGES`.
2. **Hardcoded-string scan** — heuristic grep for likely user-facing string literals in TSX that aren't going through `t(...)`. False positives are possible; use judgment.

## Layout you can assume

- Locale registry: `apps/mobile/src/i18n/languages.ts` exports `SUPPORTED_LANGUAGES` (array of `{ code, native, english }`).
- Locale resources: `apps/mobile/src/i18n/locales/<code>.json` — one file per code in the registry.
- Translation calls in components: `useTranslation()` returning `t`, used as `t('namespace.key')` or `t('key', { interpolation })`.
- The canonical English file is `apps/mobile/src/i18n/locales/en.json`.

## How to run the audit

Work through these steps in order. Report findings as a punch list (file:line where applicable). Keep the final summary under ~30 lines unless there's a lot to report.

### Pass 1 — Key parity

1. Read `apps/mobile/src/i18n/languages.ts`. Extract every `code` in `SUPPORTED_LANGUAGES`.
2. For each code, check `apps/mobile/src/i18n/locales/<code>.json` exists. If a file is missing, that's a P0 — flag it and skip key comparison for that code.
3. Read `en.json` and flatten its keys to dot-paths (e.g. `settings.title`, `wizard.nameStateOk`). This is the canonical key set.
4. For each non-English locale: flatten its keys, then:
   - Report keys present in `en.json` but missing in this locale → **must add**. Group by top-level namespace.
   - Report keys present in this locale but not in `en.json` → **likely dead**. Ask the user before removing; could be a typo or a key that was removed from en.

**Plural variants caveat**: i18next plural keys (`key_one`, `key_few`, `key_many`, `key_other`) may legitimately differ across locales — English uses `_one` / `_other`; Czech uses `_one` / `_few` / `_many` / `_other`; German uses `_one` / `_other`. Treat the *base* key (everything before the last `_one|_few|_many|_other` suffix) as the unit of comparison. A locale is OK if it has at least the variants its language needs (use Unicode CLDR plural rules: en→one/other, de→one/other, cs→one/few/many/other). If unsure, flag it as a warning rather than an error.

### Pass 2 — Hardcoded-string scan

Scan these directories with Grep:
- `apps/mobile/src/screens/**/*.tsx`
- `apps/mobile/src/components/**/*.tsx`
- `apps/mobile/app/**/*.tsx`

Patterns that suggest an untranslated user-facing string:

- **JSX text nodes**: a bare string literal between `>` and `<` in JSX, that's not `{t(...)}`. Example pattern: `>([A-Z][^<>{}]{2,})<`. Watch out for false positives like icon glyphs (`✱`, `·`, `→`), single punctuation chars, and `>{number}<`.
- **Title-like props with string literals**:
  - `title="..."`, `sub="..."`, `subtitle="..."`, `label="..."`, `placeholder="..."`, `header="..."`, `message="..."`
- **Native dialog arguments**:
  - `Alert.alert("...", "...")`
  - `Share.share({ title: "...", message: "..." })`
- **Direct setter calls with English text**: `setSomeLabel('Click here')`-style — rare but worth noting.

**Exclude these false positives**:

- `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `testID`, `nativeID`, `accessible`
- `name=` when the value is an icon name (lowercased single word like `"plus"`, `"chevR"`, `"needle"`)
- `fontFamily=`, color values (`'#FBF6EC'`), CSS-like literals
- Style enum strings: `'absolute'`, `'center'`, `'flex-start'`, `'transparent'`, `'dashed'`, `'uppercase'`, `'lowercase'`, `'700'`, `'600'`, etc.
- Symbol identifiers like `'vline'`, `'cableL'`, etc. inside arrays
- Brand strings the user has explicitly chosen not to translate (e.g., `'Skein'`, `'made with yarn & code'` — check the en.json `settings.footer` for current intent)
- `console.*`, `throw new Error(...)`, `Error(...)` — developer-facing
- `dangerouslySetInnerHTML`, `URLSearchParams`, URL fragments, regex literals
- `keyExtractor` return values, `accessibilityValue`

When in doubt, report it as a *suspected* finding rather than a definite one.

### Report format

Use this structure:

```
i18n audit — apps/mobile
========================

Pass 1: Key parity
  ✓ Supported languages: en, cs, de
  ✓ All locale files present
  ⚠ cs.json missing 2 keys:
    - wizard.foo (added 2026-05-30 in en.json)
    - knitting.bar
  ✓ de.json: in sync with en.json (147 keys)

Pass 2: Hardcoded strings
  ⚠ Suspected untranslated strings:
    apps/mobile/src/screens/Foo.tsx:42  title="Hello"
    apps/mobile/src/components/Bar.tsx:88  >Click me<
  ✓ No issues in 23 scanned files

Summary: 2 missing translations, 2 suspected hardcoded strings
Next: add missing keys to cs.json, review hardcoded strings (may be false positives)
```

If everything is clean, say so in one line and stop.

## When to fix vs. report

- **Always fix**: missing English keys (they should always be present — that's the canonical set).
- **Ask the user before fixing**: missing keys in non-English locales (the user may want to translate them themselves rather than have you guess), extra/dead keys, and any hardcoded-string findings (false positive rate is non-zero).
- **Never auto-translate**: only the user (or an actual translator) should write the target-language strings.
