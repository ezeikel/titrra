# Titrra — Brand Assets

> Fleet convention: `~/Development/docs/BRAND-STORE-ASSETS.md`.

## Figma — **one file only**

**[Titrra — Brand](https://www.figma.com/design/8F2KXoJOsDa3Rs7Oq7rsdc)**

| Page | Contents |
|---|---|
| **Logo Lockups** | App icon + on-dark / white / mono marks; horizontal, stacked, wordmark |
| **App Icons** | Production / Internal (purple+grid) / Dev (teal+code) 1024² |
| **Store Screenshots** | (fill as needed) |
| **Social** | (fill as needed) |

Legacy FB Cover: https://www.figma.com/design/1briKCk2wrcS68rvqTmia5 — fold then delete.

## App icon variants (Expo)

| File | Env | BG |
|---|---|---|
| `icon.png` | production | Brand store art |
| `icon-preview.png` | preview → Internal | Purple `#5B2C6F` + light grid |
| `icon-dev.png` | development → Dev | Teal `#0E6655` + large code |

Wired via `pickIcon` in mobile `app.config.ts`. Regenerator:
`~/Development/Personal/scripts/generate-app-icon-variants.sh`

## Repo exports

`branding/lockups/` — mark tiles exported for Figma.
