# Claude Code Context

## Project

Titrra (titrra.com) — the focused GLP-1 / weight-loss-shot tracker. Log doses,
rotate injection sites, follow your titration ladder, track side effects +
weight. The "clean twin" of MeAgain: a focused GLP-1 routine tracker with
honest single-tier pricing and a calmer, more premium UX. Pure CRUD logging
companion — NOT medical advice, NOT a calorie app. Product spec + competitor
teardown: `docs/GLP1-RESEARCH-AND-SPEC.md`.

## Current AI models
Use the latest model ids from `~/Development/Personal/scripts/model-registry/LATEST-MODELS.md`
(live provider snapshot — supersedes training data). Fleet defaults: text = claude-sonnet-5,
vision judge = claude-opus-4-8, image gen = gpt-image-2 (gpt-image-1.5 where speed matters),
search = sonar. Regenerate: `tsx ~/Development/Personal/scripts/model-registry/fetch-models.ts`.

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

## Content pipeline (AI blog + social auto-post) — `apps/worker`

Both content systems run on the shared Hetzner worker (`@titrra/worker`, port
3070, Bun on box / tsx locally). Vercel cron → thin Next route (`CRON_SECRET`
bearer) → `postToWorker()` (`WORKER_SECRET` bearer) → worker endpoint. The web
app has NO AI SDK; all generation is worker-side. Env for the trigger lives on
Vercel (`WORKER_URL`, `WORKER_SECRET`, `CRON_SECRET`) — if the blog/social "isn't
firing," check those three exist on Vercel first (a missing `WORKER_URL` makes
the cron route 502 before it ever reaches the box).

- **Blog** (`src/blog/*`): `POST /generate/blog`. Claude (`claude-sonnet-5`)
  drafts one GLP-1 post → Sanity as **status:'draft'** (health content is NEVER
  auto-published; a human reviews + publishes in `/studio`). Idempotency key =
  top-level `sourceTopic`; topic set in `src/blog/topics.ts` (never rename an
  existing topic string — a rename un-covers it → duplicate). Cron: Mon 06:00 UTC.
- **Social** (`src/social/*`): `POST /generate/social`. Claude caption +
  `gpt-image-2` image → uploaded to R2 (`@titrra/storage`, prod bucket serves via
  `assets.titrra.com`) → published to the Facebook Page via Graph `v22.0
  /{PAGE_ID}/photos` (FB fetches the hosted image URL). Publishes **live** (no
  draft gate — that's the point of an auto-poster). Cron: Tue/Thu/Sat 17:00 UTC.
  - **Compliance is enforced in the prompts + theme copy** (`src/social/topics.ts`,
    `CAPTION_SYSTEM` in `pipeline.ts`): utility-first only — NEVER weight/outcome/
    efficacy/before-after claims, no dose advice, no fabricated stats/ratings, no
    em dashes. Sell the ROUTINE, never the outcome. Images show no people, bodies,
    needles, pills, or scales.
  - Dry-run a caption without image/FB: `pnpm --filter @titrra/worker social:run
    --dry-run` (needs only `ANTHROPIC_API_KEY`). Blog equivalent: `blog:run
    --dry-run`.
- **Worker social env** (box + `.env.example`): `OPENAI_API_KEY`, `R2_ENDPOINT`/
  `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET`/`R2_PUBLIC_URL`,
  `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` (long-lived Page token, NOT a
  user token). See `apps/worker/deploy/README.md`.

## Commands

- `pnpm dev:web` — Next.js dev server. `pnpm dev:mobile` — Expo.
- `pnpm build` / `pnpm check-types` — via turbo. `pnpm lint` is root Biome (one
  repo-wide pass — never per-app, no ESLint/Prettier).
- `pnpm test` — turbo test. The turbo `build` task depends on `test`, so a
  failing test fails the build and blocks the Vercel deploy.
- Vercel: link inside `apps/web` only, NEVER at repo root. Root Directory =
  `apps/web`.

## Store pricing (web ↔ Apple ↔ Google, aligned)

All three platforms are aligned to the **App Store tiers** for the $7.99/$39.99/
$59.99 USD base: **GBP £7.99/£39.99/£59.99, EUR €8.99/€44.99/€64.99, USD
unchanged**. Web display lives in `apps/web/constants.ts` `PRICE_AMOUNTS`;
Stripe multi-currency Prices (native `currency_options`, one Price id per plan)
carry the same amounts; checkout sets the currency from the Vercel geo header
(`x-vercel-ip-country` → `apps/web/lib/currency.ts`).

**Reading/writing Google Play prices — `google-play-cli` CANNOT do it.** The CLI
(brew `googleplaycli` 0.5.0, `Vacxe/google-play-cli-kt`, latest) only implements
the retired `inappproducts` endpoint (`GET /androidpublisher/v3/.../inappproducts`
→ 403 "Please migrate to the new publishing API") and has **no** Monetization API
commands (no `subscriptions`/`monetization`/`prices`). Publishing commands
(edit/tracks/listings/bundles) work fine — it's only pricing that's a feature gap.
To read/write **subscription** prices, hit the **Monetization API directly** with
the org Play service account (see workspace `~/Development/CLAUDE.md` for the
generic recipe). Titrra ids: package `com.chewybytes.titrra.app`, subs
`titrra_pro_monthly_v1:monthly-base`, `titrra_pro_yearly_v2:yearly-base-2` (the
`-2` is active; `yearly-base` is INACTIVE — don't patch inactive base plans).
**One-time products** (`titrra_pro_lifetime_v1`, non-consumable) have NO working
v3 API endpoint (`onetimeproducts` 404s) — edit their per-region price in the
**Play Console UI** (Monetise → One-time products → the product → purchase option
→ search region → pencil → Save, then the page-level Save). Use regions version
**`2025/03`** (not `2022/02`) in patch calls, else eurozone late-joiners like BG
error ("Expected BGN but got EUR").

## Auth (NextAuth v5 + mobile device-JWT bridge)

Titrra is anonymous-first with **optional** account linking (copied from
chunky-crayon / PTP). Web = NextAuth v5 database sessions; mobile = a signed
device-JWT (`jose` HS256) that `proxy.ts` verifies and turns into `x-user-id`.
Sign-in merges the anonymous device-user into the real account
(`lib/mobile-auth.ts` `mergeAnonymousUserIntoTarget` — account wins on
`IntakeLog @@unique([userId,date])` collisions).

- Providers: Google, Apple, Facebook, Resend magic-link — each loaded in
  `auth.ts` **only when its env is present** (so the build/dev server starts
  before every provider is provisioned).
- Titrra OAuth apps (project `titrra`, chewybytes org): Google web client
  (`380927007840-dorh…`, redirects `www.titrra.com` + `localhost:3000`), iOS
  clients per variant (prod/dev/internal, bundle-id matched), Android client
  (SHA-1 = Play App-signing cert `E9:95:EA:…:9A:C3`). Apple Services ID
  `com.chewybytes.titrra.signin` (App ID `com.chewybytes.titrra.app` has Sign In
  with Apple enabled; return URL `https://www.titrra.com/api/auth/callback/apple`).
- **Callbacks always use `www.`** — the apex 308-redirects to www for all
  chewybytes domains, so every OAuth redirect/return URL is `www.titrra.com/...`.

## Shared cross-app credentials (reuse, never regenerate)

Some keys are **account/team-wide** and are shared across every Chewy Bytes app
— reuse the existing file in iCloud, do NOT create a per-app one. Location:
`~/Library/Mobile Documents/com~apple~CloudDocs/Tech/App Development/`.

| Key | File | Used for | Titrra reuses |
|---|---|---|---|
| **Sign in with Apple** (`APPLE_KEY_ID=ZU2248TY29`, team `HGX827L49J`) | `Apple/SignInWithApple-ZU2248TY29-ChewyBytes-HGX827L49J.p8` | Apple OAuth (web NextAuth). Team-wide — one key for all apps. | ✅ (per-app part is only the Services ID `com.chewybytes.titrra.signin`) |
| **ASC In-App-Purchase key** (`PBXJDFJ6WT`) | `Apple/AppStoreConnect-SubscriptionKey-PBXJDFJ6WT.p8` | RevenueCat ↔ App Store (all apps) | ✅ |
| **ASC API key** (`G96SP9M8C2`) | `Apple/AuthKey_G96SP9M8C2 asc CLI.p8` | `asc` CLI auth | ✅ |
| **Google Play publishing SA** | `Google/chewy-bytes-play-publishing.json` | `eas submit` + Play API (account-level) | ✅ |

Per-app (create fresh): the OAuth **client IDs** (Google web/iOS/Android, Apple
Services ID), the RevenueCat per-app SA, `NEXT_AUTH_SECRET`/`MOBILE_AUTH_SECRET`.
`.p8` files are gitignored in-repo (`*.p8` in `.gitignore`, same as CC/PTP) —
the canonical copy lives in iCloud, never committed.

## R2 storage (hosted images for AI blog + social auto-post)

Cloudflare R2, same shared CF account as every Chewy Bytes app (endpoint host
`3b270a88f8cd0aaf0e9f28f6683a7a85`, account-level access keys reused). Two
buckets, same `<app>-dev`/`<app>-prod` convention as CC/PTP:

| Bucket | `R2_PUBLIC_URL` | Notes |
|---|---|---|
| `titrra-dev` | `https://pub-e757775855054965887b92247ebe9dad.r2.dev` | dev serves via the managed public dev URL |
| `titrra-prod` | `https://assets.titrra.com` | **custom domain only** — the raw `pub-*.r2.dev` dev URL is DISABLED (matches CC/PTP prod: prod never serves via `pub-*.r2.dev`) |

- Storage client will be a shared package `@titrra/storage` (copy CC's
  `packages/storage/src/r2.ts` — `@aws-sdk/client-s3`, `put(pathname, body,
  {access, contentType})` → `{url: ${R2_PUBLIC_URL}/${pathname}, pathname}`).
- Env: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_PUBLIC_URL` (per-environment). Used by the **worker** (image-gen upload)
  and any web read path.
- FB `/photos` publish fetches the image from a **publicly hosted** URL, so
  generated images must land in R2 first (prod → `assets.titrra.com`).

## Commits

Semantic commit style (`type(scope): message`), one-liners. No Claude
attribution / Co-Authored-By lines.
