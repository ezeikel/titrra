# Titrra — GLP-1 Tracker: Research, Teardown & v1 Spec

_Generated 2026-06-19 from live AppKittie App Store data + competitor teardowns._
**Name:** Titrra (from "titration") · **Domain:** titrra.com · **Bundle:** com.chewybytes.titrra.app · **Tagline:** "Stay on track with every dose."

> ⚠️ **Data caveat:** AppKittie's `get_app_reviews` endpoint was down across all sessions (server-side `appId Required` bug), so the "wedge" / complaint analysis is inferred from competitor pricing, store descriptions, and positioning — NOT verified review text. Revenue, downloads, IAP structure, and growth numbers ARE live and real. Re-mine reviews before finalizing the paywall copy and feature priorities.

---

## 1. WHY THIS APP (the MRR case)

GLP-1 (Ozempic/Wegovy/Mounjaro/Zepbound) companion trackers are the single best solo-dev opportunity surfaced in the June 2026 research: **proven six-figure MRR, multiple recent winners, no single lockout, pure CRUD (no AI inference cost, no licensing, no regulation** — it's a logging companion, not medical advice), riding a structural wave (millions starting GLP-1 drugs, growing weekly).

### Live proof (US App Store, June 2026)
| App | Revenue/mo | Downloads/mo | Reviews | Score | Released | Momentum |
|---|---|---|---|---|---|---|
| **Shotsy** | $306,482 | 40,858 | 25,232 | 4.84 | May 2024 | +27% rev/90d |
| **Glowise** | $116,927 | 46,391 | 1,860 | 4.81 | Nov 2024 | **+975% rev/30d, +4,127%/90d** 🚀 |
| **MeAgain** | $106,388 | 21,254 | 19,570 | 4.80 | Apr 2025 | +29% rev/90d |
| **Pep AI** | $31,659 | 21,079 | 1,527 | 4.72 | Feb 2026 | **+2,113% rev/90d** 🚀 |
| **OzemPro (Mounjaro Tracker)** | $30,000 | 8,000 | 2,361 | 4.81 | Oct 2025 | new |
| **GLP-1 Tracker: Pep (Shred)** | $10,051 | 1,575 | 784 | 4.70 | Sep 2024 | steady |

**Read:** A fragmented field of recent six-figure earners, with brand-new entrants (Pep AI, Feb 2026) exploding +2,113% in 90 days. This is "catchable" in the truest sense — but **filling fast** (the head term "glp-1 tracker" has 40+ clones piling in). **Speed matters: build now.**

---

## 2. COMPETITOR TEARDOWN

### Shotsy — $306k/mo (the leader)
- The category king. 25k reviews, 4.84★, multilingual (17 languages). Clean, focused GLP-1 tracker.
- Beatable because: it's the generic default; a sharper, more opinionated UX + better onboarding + cleaner pricing can peel users.

### MeAgain — $106k/mo (the BEST positioning model to copy)
- **Positions explicitly AGAINST calorie apps:** _"Generic food apps focus on calories. Medication reminder apps focus on alarms. MeAgain is built for the GLP-1 routine itself."_ This is the wedge.
- Feature set (the canonical GLP-1 routine): log shots + oral pills, **dose timing + injection sites + shot days**, shot/pill reminders, **medication-level context between doses** (pharmacokinetic curve), food log (photo/barcode/search) with **protein/fiber/water** focus (because appetite is low on GLP-1), **side-effect tracker** (nausea, constipation, reflux, fatigue, custom) with timing/severity, **weight + progress photos + "Journey Cards"**, Apple Health sync, widgets.
- **Pricing = the weakness to exploit:** 10 different IAPs, monthly $14.99–$24.99, annual $39.99–$119.99, weekly $14.99. This is aggressive A/B price-testing → confusing, feels predatory. **A clean single honest tier is instant differentiation.**

### Glowise — $117k/mo (+975%/30d — the rocket, but a DIFFERENT game)
- **It's actually an AI calorie tracker with GLP-1 bolted on** (VoiceLog, photo/barcode scan, macros, BMI). The explosive growth rides BOTH the calorie-tracking AND GLP-1 waves.
- Pricing: $6.99/wk, $19.99/mo, $59.99–69.99/yr, $49.99 lifetime.
- **Why we DON'T copy it:** adding AI calorie tracking means competing in the brutally saturated Cal-AI/MyFitnessPal knife-fight AND paying per-scan AI inference (kills the zero-COGS advantage). Glowise's growth is impressive but it's a heavier, riskier, more expensive product. **Titrra stays a pure GLP-1 routine tracker.**

### Strategic conclusion
**Be MeAgain's clean twin:** the focused GLP-1 routine tracker (dose/site/titration/side-effects/weight), but with **honest single-tier pricing** and a calmer, more premium UX. Don't chase Glowise into calorie-AI. The wedge is _focus + fair pricing + polish_, not more features.

---

## 3. v1 FEATURE SPEC (ship in ~1 week)

### Core (free tier — the hook)
1. **Medication setup** — pick drug (Ozempic, Wegovy, Mounjaro, Zepbound, Rybelsus, compounded semaglutide/tirzepatide, "other"), starting dose, schedule (weekly injection / daily pill).
2. **Dose logging** — one-tap "logged today's shot." Date, dose (mg), injection site.
3. **Injection-site rotation map** — body diagram; suggests next site to avoid overuse (a genuine medical best-practice incumbents under-serve). This is a signature feature.
4. **Dose reminders** — local notifications (expo-notifications) for shot day / pill time.
5. **Weight log** — quick entry + trend line.
6. **Basic side-effect log** — nausea/constipation/fatigue/reflux + severity.

### Pro (paywall — the recurring value)
7. **Titration schedule + ladder** — the namesake feature. Visualize the dose-escalation plan (e.g. 2.5 → 5 → 7.5 → 10mg), reminders when it's time to step up, "talk to your provider" prompts. Incumbents treat dose as a flat number; Titrra owns the *ladder*.
8. **Medication-level curve** — estimated drug level between doses from published pharmacokinetic half-lives (semaglutide ~7d, tirzepatide ~5d). Read-only education, clearly "estimate, not medical advice."
9. **Full history + trends** — weight × dose × side-effects on one timeline; "non-scale victories"; progress photos.
10. **Export for provider** — PDF/CSV summary to bring to a doctor's appointment (high perceived value, cheap to build).
11. **Protein/water goals** — the "eat enough protein, drink enough water while appetite is low" nudges (GLP-1-specific, not generic calorie counting).
12. **Apple Health / Health Connect sync** — weight + activity.

### Explicitly OUT of v1 (avoid scope creep + the calorie knife-fight)
- ❌ AI photo calorie scanning (saturated, expensive, off-thesis)
- ❌ Full food database / macro tracking (that's Glowise's heavy game)
- ❌ Community/social
- ❌ AI chatbot

### Compliance guardrails (non-negotiable)
- Every screen that touches dose/PK: **"For tracking and education only. Not medical advice. Talk to your healthcare provider."** (MeAgain & Glowise both do this — it's table stakes for App Store Health & Fitness review.)
- Never recommend a dose change. Never diagnose. The titration ladder shows the *user's own plan*, with provider-consult prompts.
- Content rating 12+, primary genre Health & Fitness.

---

## 4. MONETIZATION

**Model:** Freemium, hard-ish paywall after onboarding wow. Free = log a dose + weight + basic side-effects. Pro = titration ladder, med-level curve, full history/trends, export, protein/water, Health sync.

**Paywall moment:** onboarding → set up your med + titration plan → "here's your personalized dose schedule + projected journey" reveal → paywall the trends/curve/export.

**Pricing (the differentiator — ONE clean honest tier):**
- **$7.99/mo** or **$39.99/yr** (the annual is the hero, ~58% saving framed).
- Optional **$59.99 lifetime** (captures the one-time-payment finance-niche buyers; Glowise proves lifetime sells here).
- 3-day free trial on annual.
- **NO** weekly trap, **NO** 10-SKU A/B maze. The clean pricing IS positioning against MeAgain's predatory ladder.

RevenueCat entitlement: `titrra_pro`. Offering: `default` with `$rc_monthly`, `$rc_annual`, `$rc_lifetime` packages.

---

## 5. ASO / KEYWORDS

**Lead term:** "glp-1 tracker" (popularity 87 / traffic 73 / difficulty 33 — high-intent, beatable but crowding fast).

**Win the branded long-tails** (high intent, less contested) — work into title/subtitle/keyword field:
- "mounjaro tracker", "zepbound tracker", "wegovy tracker", "ozempic tracker"
- "semaglutide tracker", "tirzepatide tracker"
- "weight loss injection", "glp-1", "dose tracker", "injection tracker"
- "shot reminder", "titration"

**Title direction:** `Titrra: GLP-1 & Shot Tracker` · **Subtitle:** `Dose, side effects & weight` (pack drug-name keywords into the 100-char keyword field, not the title).

**Don't fight:** generic "calorie counter" / "weight loss" head terms (MyFitnessPal/Noom/WW territory, $1M/mo incumbents). Stay in the GLP-1 lane.

---

## 6. DATA MODEL (drives the Prisma schema)

```
User
  id, email (nullable — anonymous-first), createdAt, healthSyncEnabled, units (metric/imperial)

Medication
  id, userId, drug (enum: OZEMPIC, WEGOVY, MOUNJARO, ZEPBOUND, RYBELSUS, COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE, OTHER)
  form (INJECTION | ORAL), scheduleType (WEEKLY | DAILY), startedAt, active

TitrationStep            // the namesake feature
  id, medicationId, doseMg, order, plannedStartDate, actualStartDate, notes

DoseLog
  id, medicationId, takenAt, doseMg, injectionSite (enum: ABDOMEN_L/R, THIGH_L/R, ARM_L/R), skipped, notes

InjectionSite (rotation state derived from DoseLog history)

WeightLog
  id, userId, recordedAt, weight, unit, photoUrl (nullable, progress photo)

SideEffectLog
  id, userId, occurredAt, type (enum: NAUSEA, CONSTIPATION, DIARRHEA, FATIGUE, REFLUX, HEADACHE, INJECTION_SITE_REACTION, OTHER), severity (1-5), notes

IntakeLog               // protein/water nudges
  id, userId, date, proteinG, waterMl

Reminder
  id, userId, medicationId (nullable), type (DOSE | PILL | WEIGH_IN | PROTEIN | WATER), cron/schedule, enabled
```

Subscription state lives in RevenueCat (entitlement `titrra_pro`); the app reads it via `react-native-purchases`. Web reads Stripe subscription status. A `Subscription` mirror table is optional (only if web+mobile need a unified server-side view — defer unless needed).

---

## 7. ARCHITECTURE (follows the Chewy Bytes canonical pattern)

- **Monorepo:** Turborepo + pnpm. `apps/web` (Next 16, App Router), `apps/mobile` (Expo 56, Expo Router), `packages/db` (Prisma 7 + Neon serverless adapter), `packages/types`.
- **Web monetization:** Stripe (unlock Pro on the web app).
- **Mobile monetization:** RevenueCat (`react-native-purchases`) → App Store / Play IAP.
- **DB:** Neon (Chewy Bytes org), branch-based dev/prod, `prisma migrate dev` only (never db push, never hand-written SQL).
- **Analytics/obs:** PostHog (EU) + Sentry + Vercel Analytics.
- **Deploy:** web → Vercel (Root Directory `apps/web`); mobile → EAS build + EAS submit; store admin → `asc` / `google-play-cli` / `store` wrapper.
- **Bundle id:** `com.chewybytes.titrra.app` (+ `.app.internal` preview, `.app.dev` dev). Scheme `titrra://`. Apple Team `HGX827L49J`.

---

## 8. HONEST RISK READ
- **Crowding:** "glp-1 tracker" head term is filling fast → win on drug-name long-tails + the titration/injection-site signature features + clean pricing, not the head term.
- **Medical scrutiny:** stay strictly a tracker; disclaimers everywhere; never advise dosing.
- **Retention:** weekly-injection cadence means low daily engagement → lean on the weigh-in habit, side-effect logging, and reminders to create touchpoints. Progress photos + "journey" framing drive the emotional retention.
- **Realistic target:** $2–10k/mo within a few months if ASO + onboarding land; genuine upside given the wave and the proof apps at $100–306k/mo.
