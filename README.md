# Titrra

The focused GLP-1 tracker. Log every dose, rotate injection sites, follow your
titration ladder, and track side effects + weight — without the calorie-app
noise or the 10-SKU pricing maze.

**Stay on track with every dose.** — [titrra.com](https://titrra.com)

## Apps

| App           | Stack                                       | Status      |
| ------------- | ------------------------------------------- | ----------- |
| `apps/web`    | Next.js 16, React 19, Tailwind v4           | In progress |
| `apps/mobile` | Expo 56, Expo Router, NativeWind 5          | In progress |

## Packages

| Package          | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `packages/db`    | Prisma 7 schema + Neon serverless adapter client |
| `packages/types` | Shared TypeScript types (web + mobile)           |

## Development

```bash
pnpm install
pnpm dev:web     # Next.js dev server on :3000
pnpm dev:mobile  # Expo dev server
```

`pnpm build` / `pnpm lint` / `pnpm check-types` run through Turborepo.

## Database

Neon (Chewy Bytes org). Prisma migrations are the only way the schema changes:

```bash
pnpm --filter @titrra/db db:migrate   # prisma migrate dev (authoring)
pnpm --filter @titrra/db db:deploy    # prisma migrate deploy (CI/prod)
pnpm --filter @titrra/db db:studio
```

NEVER `prisma db push` and NEVER hand-write migration SQL. See `CLAUDE.md`.

## Integrations

- **PostHog** (EU) — client init in `apps/web/instrumentation-client.ts`,
  reverse-proxied through `/ingest` (see `apps/web/proxy.ts`).
- **Sentry** — `withSentryConfig` in `next.config.ts`, tunnel at `/monitoring`.
- **Stripe** (web Pro) — `apps/web/lib/stripe.ts`.
- **RevenueCat** (mobile Pro) — `apps/mobile/lib/purchases.ts`, entitlement
  `titrra_pro`, offering `default`.

Copy each app's `.env.example` to `.env.local` and fill in keys.

> **Not medical advice.** Titrra is a tracking and education tool only. It never
> recommends a dose change. Talk to your healthcare provider.
