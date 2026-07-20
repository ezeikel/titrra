# Titrra — Brand Assets

> Fleet convention: `~/Development/docs/BRAND-STORE-ASSETS.md`.

## Figma (canonical — one file)

**[Titrra — Brand](https://www.figma.com/design/8F2KXoJOsDa3Rs7Oq7rsdc)**

Pages: Logo Lockups · App Icons · Store Screenshots · Social.

Legacy (fold into Social, then archive):
- [Facebook Cover](https://www.figma.com/design/1briKCk2wrcS68rvqTmia5)

## App icon variants (Expo)

| File | Env |
|---|---|
| `apps/mobile/assets/images/icon.png` | production |
| `apps/mobile/assets/images/icon-preview.png` | preview → Internal (grid) |
| `apps/mobile/assets/images/icon-dev.png` | development → Dev (code) |

Also `adaptive-icon{,-preview,-dev}.png`. Regenerator:
`~/Development/Personal/scripts/generate-app-icon-variants.sh`

## Canonical assets

Expo icons live in `apps/mobile/assets/images/`. Export lockups from Figma into this folder as the logo system is built out.
