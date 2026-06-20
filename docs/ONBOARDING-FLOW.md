# Titrra Onboarding — High-Converting Flow Spec

_2026-06-20. Pattern distilled from best-in-class health onboarding (Centr 27-screen, Peloton Strength+ 20-screen, Tonal, pliability) via Mobbin, adapted to GLP-1. Goal: best-in-class + high-converting, AND it configures the real Medication + TitrationStep so the value reveal is genuine, not theater._

## Conversion principles (from the references)
1. **Benefit promise, not features** — lead with the outcome ("Stay on track, lose more"), never a feature list.
2. **Visible progress** — "Step X of N" + a progress bar on every quiz screen = commitment momentum.
3. **One question per screen, big tappable cards** — low friction, fast taps, sunk-cost build.
4. **Personalize and reflect it back** — use the name; echo answers ("Based on your Mounjaro plan…").
5. **Investment before ask** — by the time we ask anything heavy, they've answered 8 questions and are bought in.
6. **Earned value reveal** — a recap/plan card that pays off the effort ("Your Titrra plan is ready").
7. **Paywall at peak motivation** — right after the reveal, with a trial timeline (Today → reminder → starts) and annual-default framing.
8. **Honest, not dark-pattern** — per Titrra's wedge: ONE clean tier on the paywall, real "skip"/"maybe later", no fake countdowns. Honesty is the brand.

## The flow (≈12 steps)

| # | Screen | Purpose | Captured |
|---|--------|---------|----------|
| 0 | **Welcome** | Benefit promise + "Get started" / "I already have an account". Droplet logo, the tagline. | — |
| 1 | **Name** | "First, what should we call you?" — enables personalization downstream. | `name` (local) |
| 2 | **Which medication?** | Big cards: Ozempic, Wegovy, Mounjaro, Zepbound, Rybelsus, Compounded, Other. THE key config Q. | `Medication.drug` |
| 3 | **Injection or pill?** | Auto-skips if the drug implies it (Rybelsus=oral); else inject/pill. | `Medication.form` |
| 4 | **How often?** | Weekly / Daily — pre-selected from drug. | `Medication.scheduleType` |
| 5 | **Current dose** | "What dose are you on now, {name}?" — picker of standard rungs for that drug. | seeds current `TitrationStep` |
| 6 | **Your plan / goal dose** | "Where are you headed?" pick the target dose → we render the LADDER preview (their own titration steps). The "aha". | seeds full `TitrationStep` ladder |
| 7 | **Goal weight (optional)** | "What's your goal?" current + goal weight, or skip. Drives the progress framing. | `WeightLog` seed (optional) |
| 8 | **Side-effects so far** | "Dealing with any of these?" multi-select chips (nausea, fatigue…) — empathy + seeds the side-effects habit. | optional seed |
| 9 | **Reminders** | "Want a nudge on shot day?" → triggers expo-notifications permission in context (not cold). | reminder intent |
| 10 | **Building your plan…** | 1.5s branded loader ("Mapping your titration ladder…") — manufactures anticipation (every ref app does this). | — |
| 11 | **Value reveal** | "{name}, your Titrra plan is ready." Recap card: their drug, their ladder (2.5→5→7.5→10), next shot day, goal. Earned payoff. | — |
| 12 | **Paywall** | At peak motivation. ONE clean annual-default ($39.99/yr) + monthly ($7.99) + lifetime ($59.99). Trial timeline (Today unlock → Day 2 reminder → Day 3 starts). Honest "Maybe later" that still enters the app. | RevenueCat (stubbed) |

## What persists (via the existing web API → @titrra/db)
- The auto-created default Medication (currently `OTHER/INJECTION/WEEKLY`) gets **updated** with the real drug/form/schedule → needs a small **PATCH /api/medication** route (new).
- The current + goal doses seed **TitrationStep** rows via the existing **POST /api/titration** (mark current as started).
- Optional starting weight → **POST /api/weight**. Optional current side-effects → **POST /api/side-effects**.
- `name` + "onboarded" flag stored locally (AsyncStorage) for v1; gate the app so onboarding shows once.

## Architecture
- New stack group `app/(onboarding)/` with its own slim layout (no tab bar, a progress header, swipe-back). Registered in root `_layout.tsx`.
- A lightweight **onboarding store** (local state via a context or a small zustand-free reducer) accumulates answers across screens; we commit to the API at the value-reveal step (one batch, so a mid-quiz drop-off writes nothing).
- **Entry gate**: root layout checks an AsyncStorage `onboarded` flag → routes to `(onboarding)` or `(tabs)`. Settings gets a "redo setup" later.
- New API: **PATCH /api/medication** (update the active medication's drug/form/schedule). Reuses the shared `device-user` helper.
- Analytics: `onboarding_started`, per-step events, `onboarding_completed`, then `paywall_viewed` (events already exist in the union).
- Compliance: medication/dose screens carry the "not medical advice" line; the ladder reveal reminds "your plan, set with your provider".

## Build order
1. PATCH /api/medication route + mobile `updateMedication` api call.
2. Onboarding store + `(onboarding)` layout + entry gate in root layout.
3. The 13 screens (reusing the teal/sand design system + existing pickers).
4. Commit-on-reveal (batch the API writes) + the value-reveal recap.
5. Paywall polish (trial timeline) — extend the existing `paywall.tsx`.
6. Type-check + e2e test the new medication PATCH + the full seed path against Neon dev, commit.

## Honest scope notes
- RevenueCat purchase stays **stubbed** (not configured yet) — the paywall renders + the "start trial" button calls the existing stub.
- "Estimated medication levels" PK curve is NOT in onboarding (it's a Pro feature for later).
- Name/onboarded flag is local-only for v1 (no server User profile fields beyond email) — fine for anonymous-first.
