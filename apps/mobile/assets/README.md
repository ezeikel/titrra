# Mobile assets — drop-ins required before first build

These binary assets are referenced by `app.config.ts` and `global.css` but are
NOT committed (the scaffold ships code only). Add them before `expo prebuild` /
EAS build:

## `fonts/` (registered via the expo-font config plugin)

- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`
- `GeistMono-Regular.ttf`

The PostScript names (`Inter-Regular`, etc.) are what `global.css` `--font-*`
tokens reference — keep the file/PostScript names in sync.

## `images/`

- `icon.png` (1024×1024) — also `icon-preview.png` / `icon-dev.png` for the
  per-variant icons (optional; falls back to `icon.png`).
- `adaptive-icon.png` — Android adaptive foreground (+ `-preview` / `-dev`).
- `splash-icon.png` — splash screen mark.

Until these exist, `expo start` for the dev client will warn/fail on the
missing font + image references.
