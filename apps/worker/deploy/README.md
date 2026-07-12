# Titrra Worker — Hetzner deploy

This worker runs as a systemd service (`titrra-worker.service`) on the shared
Hetzner box at `157.90.168.197`, alongside the PTP, Chunky Crayon, Auntie
Marlene's, Ezeikel, Go Unbeaten and Outside-IR35 workers. See the repo-root
[`HETZNER_BOX.md`](../../../HETZNER_BOX.md) for the full runbook.

## This worker

|                   |                                                        |
| ----------------- | ------------------------------------------------------ |
| **Port**          | 3070                                                   |
| **Box dir**       | `/opt/titrra/` (full monorepo clone)                   |
| **Worker subdir** | `apps/worker/`                                         |
| **Systemd unit**  | `titrra-worker.service`                                |
| **Runtime**       | Bun (no `xvfb-run` — no Playwright)                    |
| **Role**          | AI blog generation (Sanity drafts) + social auto-post  |

## Endpoints

- `GET  /health` — unauthenticated liveness.
- `POST /generate/blog` — draft one GLP-1 blog post into Sanity (human reviews).
- `POST /generate/social` — generate a compliant caption + gpt-image-2 image
  (hosted on R2 → `assets.titrra.com`) and publish it to the Titrra Facebook
  Page. Publishes live (no draft gate). All privileged routes require
  `Authorization: Bearer <WORKER_SECRET>`.

## First-time setup on the box

1. `cd /opt && git clone git@github.com:ezeikel/titrra.git titrra`
2. `cd /opt/titrra && /root/.local/share/pnpm/pnpm install --filter "@titrra/worker..."`
3. `pnpm --filter @titrra/db db:generate` (Prisma client the worker imports)
4. `vim apps/worker/.env` (copy from local; see env keys below) — `chmod 600 .env`
5. `cp apps/worker/deploy/titrra-worker.service /etc/systemd/system/`
6. `systemctl daemon-reload && systemctl enable --now titrra-worker`
7. `curl http://localhost:3070/health` — expect `{"status":"ok","service":"titrra-worker"}`

## Required env keys

- `PORT=3070`
- `WORKER_SECRET` — bearer token for `/generate/*` + `/publish/*`; MUST match
  the value set on the web app (Vercel + `apps/web/.env.local`).
- `DATABASE_URL` — Neon **prod** URL (shared Prisma client `@titrra/db`).
- `ANTHROPIC_API_KEY` — Claude, for blog generation + social captions.
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`,
  `SANITY_WRITE_TOKEN` — the blog CMS write path.
- **Social auto-post** (`/generate/social` only):
  - `OPENAI_API_KEY` — gpt-image-2 image generation.
  - `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
    (=`titrra-prod`), `R2_PUBLIC_URL` (=`https://assets.titrra.com`) — hosts the
    generated image so Facebook can fetch it.
  - `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` — long-lived Page token.
- `SENTRY_DSN` — `titrra-worker` Sentry project DSN (omit to disable reporting).

## Deploying changes

Push to `main` (touching `apps/worker/**`, `packages/db/**`, or
`packages/types/**`) and the workflow at
`.github/workflows/deploy-titrra-worker.yml` SSHes in and runs
`git pull && pnpm install --filter "@titrra/worker..." && pnpm --filter @titrra/db db:generate && systemctl restart titrra-worker`.
