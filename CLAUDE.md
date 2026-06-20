# Claude Code Context

## Project

Titrra (titrra.com) — the focused GLP-1 / weight-loss-shot tracker. Log doses,
rotate injection sites, follow your titration ladder, track side effects +
weight. The "clean twin" of MeAgain: a focused GLP-1 routine tracker with
honest single-tier pricing and a calmer, more premium UX. Pure CRUD logging
companion — NOT medical advice, NOT a calorie app. Product spec + competitor
teardown: `docs/GLP1-RESEARCH-AND-SPEC.md`.

## Structure

- Turborepo + pnpm workspaces, patterned after `~/Development/Personal/go-unbeaten`.
- `apps/web` — Next.js 16 App Router, React 19, Tailwind v4 (CSS-first, NO
  tailwind.config — theme lives in `app/globals.css` `@theme` block),
  `@base-ui/react`. Stripe for web Pro unlock.
- `apps/mobile` — Expo 56 (Expo Router), NativeWind 5. RevenueCat
  (`react-native-purchases`) for App Store / Play IAP. Entitlement
  `titrra_pro`, offering `default`. The root `.npmrc` hoisting config exists
  for it; don't remove.
- `packages/db` — Prisma 7 + Neon serverless adapter. The data model lives in
  `prisma/schema.prisma`.
- `packages/types` — shared TS types, consumed as source by web + mobile.

## Database — migration rules (NON-NEGOTIABLE)

- **Neon** (Chewy Bytes org). Project id: **`delicate-bread-39347063`**.
  Branch-based dev/prod.
- **NEVER run `prisma db push`.** The `db:push` script intentionally does not
  exist (or is commented NEVER USE). It silently drifts the DB from the
  migration history.
- **NEVER hand-write migration SQL.** Editing a `migration.sql` by hand, or
  authoring one from scratch, will drift `schema.prisma` from
  `migrations/` and fail the `check-drift` CI job.
- **ALWAYS** change the schema by editing `prisma/schema.prisma`, then running
  `pnpm --filter @titrra/db db:migrate --name <descriptive_name>` (which is
  `prisma migrate dev`). Prisma generates the correct migration.
- For CI / production, migrations are applied with `prisma migrate deploy`
  (`db:deploy`) — never `dev`.

## Next 16 specifics

- Middleware is `proxy.ts` (not `middleware.ts`). PostHog is reverse-proxied
  through `/ingest` there; Sentry tunnels via `/monitoring`.
- PostHog: EU cloud, init in `instrumentation-client.ts`, automatic pageviews
  via `defaults: '2025-05-24'` — never capture `$pageview` manually.

## Compliance guardrails (App Store Health & Fitness)

- Every screen touching dose / pharmacokinetics shows: "For tracking and
  education only. Not medical advice. Talk to your healthcare provider."
- Never recommend a dose change. Never diagnose. The titration ladder shows the
  user's OWN plan, with provider-consult prompts.

## Commands

- `pnpm dev:web` — Next.js dev server. `pnpm dev:mobile` — Expo.
- `pnpm build` / `pnpm check-types` — via turbo. `pnpm lint` is root Biome (one
  repo-wide pass — never per-app, no ESLint/Prettier).
- `pnpm test` — turbo test. The turbo `build` task depends on `test`, so a
  failing test fails the build and blocks the Vercel deploy.
- Vercel: link inside `apps/web` only, NEVER at repo root. Root Directory =
  `apps/web`.

## Commits

Semantic commit style (`type(scope): message`), one-liners. No Claude
attribution / Co-Authored-By lines.
