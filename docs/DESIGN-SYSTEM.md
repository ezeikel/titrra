# Titrra — Visual Design System (v2, premium-health)

_Direction set 2026-06-22. Full visual freedom (fonts, color, everything) +
modern native/glass tab bar. Grounded in Mobbin research of premium health/
medical apps. This is the brief for the design-implementation pass._

---

## 0. The problem we're fixing

The current app reads "AI-made": one flat teal-on-cream card style, uniform
tight spacing, chevrons standing in for icons, no depth/elevation, one type
weight doing everything, no signature moments. The web landing page is more
polished than the app — that gap is the tell. Fix = a real design system applied
to the shared primitives, plus making the **two signature features** (injection-
site map, titration ladder) genuinely beautiful.

## 1. Reference anchors (Mobbin)

**Tonal twin (GLP-1 / telehealth):**
- Hers — vertical treatment timeline, teal accent, calm-clinical-but-warm. The
  closest category + tone match. https://mobbin.com/screens/f2441dba-a083-45a2-897a-1dd84d0b8fb4

**Calm health dashboards (cards, depth, whitespace):**
- Bevel — metric pills in a grid with status badges (Normal/Lower) + mini gauges. https://mobbin.com/screens/906eb1e4-0f37-43c7-85f1-91dda02b376d
- Gentler Streak — soft cards, "No Data" empty states done gracefully. https://mobbin.com/screens/f1eb0470-11a0-499c-a78c-f8ba02c3d79b
- Withings Health Mate — sparkline trends inside cards, "Stable Weight" labels. https://mobbin.com/screens/2256510e-ece8-463f-8b68-ae01e69791a8

**Translucent / floating glass tab bars:**
- TIDE — floating frosted pill tab bar over imagery (the look we want). https://mobbin.com/screens/dbbd72b3-8c1a-425c-8f7e-c18465a33a0f
- Apple News — frosted pill bar with search FAB. https://mobbin.com/screens/05ea00bb-b182-40aa-aef8-4438c2bf773d
- (Our own CC mobile uses BlurView + centered FAB — proven in-house pattern.)

**Injection-site body map (the marquee feature):**
- pliability — anatomical body w/ circular score badges per region (dark, premium). https://mobbin.com/screens/7fcf70e5-690c-4979-8c97-d0e69aa569d8
- Alan — clean outlined body, tappable highlighted regions (light). https://mobbin.com/screens/28579194-a284-411b-ae06-079a5aae598f
- Peloton — front/back body, heat-mapped regions + usage % list. https://mobbin.com/screens/79309232-868d-45ef-b810-e1b684f722aa

**Titration ladder (the namesake):**
- Noom — winding path with numbered milestone nodes (weight-loss, on-brand). https://mobbin.com/screens/1cecf010-0ca2-4ee9-8b92-80d7ee7e8c51
- Hers — vertical timeline, completed/current/upcoming states, teal. https://mobbin.com/screens/f2441dba-a083-45a2-897a-1dd84d0b8fb4

**Premium metric entry (weight/dose "aha"):**
- Me+ — big numeral + horizontal ruler slider + Lbs/Kg toggle. https://mobbin.com/screens/186618f9-d714-42b0-baf1-01cfcfd932a7

## 2. Proposed visual language

> Decisive defaults below — meant to be implemented, not debated. Adjust during
> the pass if something doesn't sit right on device.

### Typography
- **Display / headings:** a warm geometric-humanist sans with character —
  **Bricolage Grotesque** or **Hanken Grotesk** (both free, variable). Bricolage
  for the slightly editorial, premium-health feel (Hers/Bevel territory); use
  the heavier weights big and confident.
- **Body / UI:** keep **Inter** (already in the app) for legibility at small
  sizes — pairs cleanly under Bricolage.
- **Numerals (the data):** tabular figures, large. The dose mg / weight / day
  counts should feel like the hero (Bevel/WHOOP do this). Consider a mono or
  the display face's tabular set for big stats.
- **Type ramp (not one-size):** Display 32–40 / Title 22–24 / Heading 17 /
  Body 15 / Caption 13 / Micro 11. Generous line-height on body (1.4+).

### Color (moving OFF the flat teal/sand)
- Keep **teal** as the brand anchor but make it richer + give it depth:
  - Primary: a deeper, slightly desaturated teal (`#0E7C7B`-ish) for actions.
  - Surface: warm off-white / very light sand for the app bg, but introduce a
    **second neutral** (cool grey-blue) for cards so they separate from bg.
- Add a small **semantic palette** for health states (used on side-effect
  severity, weight trend, overuse warnings): green=good/stable, amber=caution,
  soft red=alert — muted, not loud (Bevel's "Normal/Lower" chips).
- **Depth:** real (soft) shadows + a subtle card border, not just flat fills.
  Elevation is the single biggest "premium" lever the current app is missing.
- Consider an optional **dark mode** later (WHOOP/pliability show how good the
  body-map + charts look on black) — not v2 scope, but design tokens should not
  hard-code hex so it's possible.

### Spacing & depth
- Adopt a clear spacing scale (4/8/12/16/24/32/48) and use the BIG end of it —
  premium apps breathe. Vary it (don't 8-everything).
- Cards: larger radius (16–20), soft shadow, subtle border, more internal pad.
- One **signature gradient/texture** moment is allowed (hero, reveal) — used
  sparingly.

### Iconography
- Replace chevron-as-icon with a real **duotone icon set** (we already use
  Font Awesome Pro — CC uses Duotone Regular). Active tab = brand teal duotone,
  inactive = muted two-tone. This alone kills a lot of the "AI" feel.

## 3. The modern tab bar (explicit ask)

Move off the default labeled bottom tabs to a **floating, translucent (glass)
tab bar** — matching how CC does it (`expo-blur` `BlurView` custom `tabBar`):
- Floating pill that sits ABOVE content with a blur/translucent background
  (content subtly visible behind it) — TIDE / Apple News look.
- Duotone icons; active state in brand teal. Labels optional (icon-only with
  a11y labels, like CC) OR small labels — decide on device.
- Consider a **centered primary-action** treatment for "Log dose" (Titrra's
  #1 action) — either a raised center FAB (CC pattern) or a prominent Today
  CTA. Logging the shot is the core loop; it deserves the prime slot.
- Implementation: custom `tabBar` prop on expo-router `<Tabs>`, `BlurView`
  (intensity ~tuned), safe-area aware, haptic on tab change. Copy CC's
  `app/(tabs)/_layout.tsx` structure as the starting point.

## 4. Signature moments to design properly

1. **Injection-site rotation map** — upgrade from text chips to a real **body
   diagram** (front/back) with tappable regions, the suggested site glowing, and
   recently-used sites shaded by recency (pliability's badge idea → "rested
   longest" highlight). This is THE feature; make it the hero of Today.
2. **Titration ladder** — make it a proper vertical journey (Hers/Noom): node
   per rung, connecting rail, completed/current/upcoming states with real
   visual distinction, the current rung celebrated. Worth a subtle animation
   when you advance a rung.
3. **Weight entry** — Me+-style big numeral + ruler slider + unit toggle instead
   of a plain text field. Makes a mundane log feel considered.
4. **Empty states** — already added (EmptyState component); restyle to match
   (Gentler Streak's are a good calm reference).

## 4b. 3D / advanced rendering — decision (2026-06-22)

Question raised: should we add 3D (a Three.js-equivalent on RN/Expo) for a more
premium feel? Decision: **yes, but scoped to ONE hero moment, and deferred.**

- 3D earns its place in exactly one place: the **injection-site rotation map**
  (a rotatable 3D body where you tap the real spot — communicates front/back/
  sides spatially in a way a flat diagram can't; a genuine screenshot-seller).
  Everywhere else 3D would read gimmicky and fight the calm/clinical/trust tone.
- Cost is real: bundle/binary size, cold-start + memory (daily 10-sec users),
  EAS-build fragility (native GL deps), upgrade-break risk. Only worth it scoped
  + lazy-loaded + with a flat fallback.

**Tooling (Three.js equivalents on RN/Expo):**
- **React Three Fiber + expo-gl/expo-three** — the literal Three.js port; use
  for a true manipulable 3D body model. Heaviest / most build risk.
- **React Native Skia** — 2D GPU canvas (shaders, gradients, perspective, soft
  shadows, "fake 3D"). The sweet spot for ~80% of the premium feel at ~5% of the
  cost. Likely already a dep via NativeWind/Reanimated stack.
- **Rive** — designer-made interactive vector animation; great for an
  illustrated mascot / state-driven micro-interactions, not a real 3D body.

**Plan:**
1. v2 re-skin (now): achieve premium with **Skia** — glossy depth, the body map
   as a beautiful shaded 2D illustration, a satisfying ladder-advance animation.
   No cold-start hit, no GL build risk, reversible.
2. ~~Later~~ **DONE (2026-06-22): real 3D rotatable body shipped** via React
   Three Fiber on JUST the injection-site screen. The 2D Skia map landed first
   (`components/BodyMap.tsx`), then the 3D version was built as a drop-in.
   - **Stack:** `@react-three/fiber@9.6.1` (the React-19 line; peer `react >=19
     <19.3`, so 19.2.3 fits) + `three@0.184.0` + Expo-pinned `expo-gl`
     (~56.0.5) / `expo-asset` / `expo-file-system`. Imports from
     `@react-three/fiber/native`. NO drei, NO expo-three (the /native Canvas
     wires three's renderer onto expo-gl directly). R3F v9 ships no
     `react-reconciler` dep (uses its-fine + scheduler + zustand), so the
     pinned `react 19.2.3` override is safe — verified `pnpm why react` (one
     19.2.3) + `react-reconciler` (single 0.31.0 from Skia).
   - **Mesh: procedural three.js primitives, NOT a .glb.** A friendly low-poly
     mannequin (capsule torso/limbs + sphere head). Rationale: the GLB load
     path on RN/Expo has documented `file://`-URI + texture-blob loader bugs
     unvalidated on RN 0.85 / new-arch / Expo 56, and buys nothing (same native
     deps either way). Procedural = zero asset/license/loader risk, zero bundle
     bytes, exact author-chosen anchor offsets, and reads warmer/less clinical.
     Quaternius CC0 base mesh is the documented v2 upgrade once proven.
   - **Interaction:** drag-to-orbit via gesture-handler `Gesture.Pan().runOnJS
     (true)` → ref → `useFrame` damped follow (NOT drei OrbitControls — DOM-only
     on /native); tap-to-select via R3F's built-in raycaster (`mesh onClick` +
     `stopPropagation`); `frameloop="demand"` + `invalidate()` so a static body
     idles the GPU. Suggested site pulses teal glow; selected fills teal;
     recently-used carry the graded warm tint (same `recencyMap` as 2D).
   - **Safety:** behind `USE_3D_BODY_MAP` flag in `components/BodyMapSwitch.tsx`,
     wrapped in an error boundary that renders the 2D `BodyMap` if the flag is
     off or GL throws. Zero-regression fallback = flip the flag.
   - **Verified on the iOS simulator** (Android emulator `/data` can't fit the
     Skia+three APK — see SHIP-CHECKLIST build gotchas).

## 4c. Input patterns — decided + built (2026-06-22)

Friction audit + Mobbin confirmed: lead with PREDICT, not ASK. Patterns chosen:
- **Dose → +/- STEPPER** (`components/Stepper.tsx`). The mental model is "step up
  a rung", and dose is a small discrete ladder (5–6 rungs/drug). A ruler is a
  cramped track for so few values; chips force scanning. Stepper = two big
  targets, big springy numeral hero (Alma / How We Feel refs), haptics, snaps to
  the drug's real rungs, ends disable at bounds. NOT a literal "liquid" fill
  (Bevel) — doesn't fit injections; the springy numeral gives the fluid feel.
- **Weight → RULER** (`components/Ruler.tsx`, ScrollView snap, no gesture-handler
  dep). Continuous large range (40–200kg @ 0.5) where sliding genuinely wins;
  defaults to last weigh-in. Me+/Noom ref.
- **Severity 1–5 → segmented control** (5 equal cells, selected = teal fill).
- **Site → predicted + confirm**: the one-tap hero uses the rotation-suggested
  site; chips live in the "Adjust" disclosure (later: body map).
- **Today core loop → ONE-TAP HERO**: "Log this week's shot · {dose} · {site}"
  logs the predicted dose+site in one tap (dose smart-defaults to current
  titration rung, filtered to the drug). "Adjust dose or site" reveals the
  stepper+site picker for the rare override. ~3 decisions → 1 tap.
- Refs: Alma https://mobbin.com/screens/a0d33d78-4482-49d2-9bc2-d433916bfbbf ·
  How We Feel https://mobbin.com/screens/318b5119-7b88-4546-82df-f35ef7acf57e ·
  Me+ https://mobbin.com/screens/186618f9-d714-42b0-baf1-01cfcfd932a7

## 4d. Onboarding carousel + paged quiz + CC-grade paywall (2026-06-22)

Built per the repo-grounded research spec (CC OnboardingCarousel + SubscriptionPaywallModal patterns, Alma paywall structure). Key decision: do NOT rewrite the working quiz into a hand-rolled pager — keep the 7 router screens (validation/keyboard/back-stack intact) and add the carousel as the new front + animated dots + paged transitions.

- **`lib/motion.ts`** — single source of truth for springs/timings (SPRING_BOUNCE/SETTLE/ENTRY, TIMING_DOT/FADE/RISE). Stepper refactored to import these.
- **`components/onboarding/ProgressDots.tsx`** — animated dots (active stretches to a pill, width 6→22 / opacity .35→1). Dual mode: index-driven (quiz) + offsetX-SharedValue-driven (carousel, animates live during swipe).
- **Quiz (#59):** `OnboardingStep` progress bar → `ProgressDots`; `(onboarding)/_layout.tsx` keeps `slide_from_right` + `gestureEnabled` (paged feel). Forward = the validated Continue button (a swipe can NEVER skip a required step); back = native gesture to revise. Title → Bricolage, bg → sand.
- **Intro carousel (#58):** `IntroCarousel` (Animated.ScrollView pagingEnabled + useAnimatedScrollHandler → offsetX → dots; onMomentumScrollEnd → index; width-only resnap on rotation), `IntroSlide` (FadeIn on first-active, product-anchored hero visuals built from the design system — dose card / rotation chips / ladder / pricing), `lib/onboarding-intro.ts` (4 slides). `(onboarding)/index.tsx` now hosts it; terminal → push `/name`. Skip → straight to quiz.
- **CC-grade paywall (#60):** refactored `app/paywall.tsx` IN PLACE — every handler (buy/onRestore/dismiss/finish/pkgFor/ctaLabel, error/!ready states, RC PurchaseResult, markOnboarded handoff) preserved verbatim. New: `PaywallHero` (3 fanned titration-ladder rung cards, centre=current dose teal-filled, wings spring in staggered 120ms — personalized from onboarding currentDose/goalDose), `TrustStrip` (overlapping initials + ★4.9 + 320+ reviews — rating/count only, no testimonials), `PlanRow` (left radio + selected accent/elevation + Best-value badge), body fade+rise after hero, perks with check icons, auto-renew compliance line ("Cancel anytime in Settings. For tracking and education only — not medical advice."), top-right × close. Pricing unchanged ($7.99/mo · $39.99/yr 3-day trial · $59.99 lifetime).

## 5. Implementation order (when we do the pass)

1. Tokens first: type scale, color palette (semantic + neutrals + elevation),
   spacing scale, radii, shadows — in NativeWind theme (and mirror to web later).
   Wire fonts (add Bricolage/Hanken via expo-font).
2. Re-skin the shared primitives: ScreenScaffold, cards, ChoiceCard,
   OnboardingStep, EmptyState, ErrorRetry, ProBadge, the pickers/buttons.
3. The glass tab bar (custom tabBar + BlurView, CC pattern).
4. The three signature moments (body map, ladder, weight ruler).
5. Sweep each screen for rhythm + the new tokens.
6. Mirror the token changes to the web app for brand consistency.

_Keep the compliance disclaimers + all the bones/state work intact — this is a
re-skin over locked structure, not a rewrite._
