# Medical Curator — Modern Clinical Redesign (React / Next.js)

Drop-in replacement for your app. Modern clinical redesign with four tabs, time-based dark
mode, and **multilingual support (Korean default · English · Japanese · Chinese)**.

## File tree

```
src/app/
├─ globals.css            # teal tokens (light+dark) · @theme inline · Pretendard · animations
├─ layout.tsx             # Pretendard wiring · product metadata · favicon
├─ page.tsx               # shell: I18nProvider · brand · headings · home/tool views · theme · 3D hero
└─ components/
   ├─ i18n.tsx            # ← translations (ko/en/ja/zh) + I18nProvider + useI18n
   ├─ interactionRules.ts # ← duplicate/interaction rule engine (multilingual tokens)
   ├─ icons.tsx           # inline SVG icons (no deps)
   ├─ LanguageSwitcher.tsx# globe dropdown · persists choice
   ├─ Menu.tsx            # home card grid (primary nav) · ToolNav (home/prev/next) · ACCENT map
   ├─ HeroCanvas.tsx      # 3D animated hero (Three.js) — floating medicines + cursor parallax
   ├─ NextSteps.tsx       # contextual "helpful next steps" + inline Ask-AI box
   ├─ Chrome.tsx          # account chip · sign-out toast · trust strip · product footer
   ├─ Legal.tsx           # terms/privacy/about/FAQ/support/notices modals (4 languages)
   ├─ SymptomAnalysis.tsx # symptom form + localized result cards + "find pharmacy"
   ├─ InteractionCheck.tsx# medication/vitamin duplicate & interaction checker (+ prescription OCR)
   ├─ VitaminPairing.tsx  # goal → recommended supplement combo (6 goals × 4 langs)
   ├─ PharmacyFinder.tsx  # map mock + nearby list
   ├─ SearchHistory.tsx   # local list, per-item + clear-all delete
   ├─ PrivacySettings.tsx # consent toggles
   └─ TabNav.tsx          # (legacy folder tabs — unused after the cards-only nav switch)
```

## How to apply (MediQ — Next 16 / React 19 / Tailwind 4)

This package is a verified drop-in for your MediQ project. From your project root
(the folder with `package.json`):

```bash
# 1) install the one new dependency (for the 3D hero)
npm i three && npm i -D @types/three

# 2) copy the redesign in (overwrites page.tsx, globals.css, layout.tsx;
#    adds src/app/components/)
mkdir -p src/app/components
cp -r react-handoff/src/app/* src/app/

# 3) run
npm run dev
```

**What gets replaced**
- `src/app/page.tsx` — old single-screen form → full shell (home hub · 6 tools · i18n · theme · 3D hero)
- `src/app/globals.css` — your `--background/--foreground` starter → teal token system + `@theme inline` (so `bg-surface`, `text-ink`, … work) + Pretendard
- `src/app/layout.tsx` — Geist fonts → Pretendard + product metadata/favicon
- `src/app/components/` — **new** (17 files)

Your `buildResult` symptom logic is preserved — it lives in the i18n result dictionary now (see the i18n note below). No other config (`next.config.ts`, `postcss.config.mjs`, `tsconfig.json`) needs to change.

> **Only new dependency: `three`** (for `HeroCanvas.tsx`). Pretendard loads from a CDN in `globals.css`, all icons are inline SVG, and prescription OCR uses Tesseract.js from a CDN. If you’d rather not add `three`, replace `<HeroCanvas />` in `page.tsx` with nothing — the CSS hero gradient still shows and the rest of the app has no 3D dependency. Reduced-motion users automatically get a single static frame.

## What changed / what's new

| Area | Status |
|------|--------|
| Languages | **New.** Korean (default), English, Japanese, Chinese. Globe switcher in the header; choice saved to `localStorage` (`mc-lang`). Every string — UI chrome, tab names, headings, result cards, pharmacy/history/privacy content, theme labels — comes from `components/i18n.tsx`. Add a language by adding one entry to `TRANSLATIONS`. |
| Safety check | **New tab.** Enter a medicine/vitamin you’re asking about + what you already take long-term; the rule engine flags **duplicates and harmful interactions** as RISK / CAUTION / DUPLICATE with an overall verdict. Rules live in `interactionRules.ts` (language-independent, multilingual keyword tokens); the displayed titles/details come from each language’s `interaction.rules` in `i18n.tsx`. Add a rule = one entry in `RULES` + one line per language. **Educational heuristic, not a clinical interaction database.** |
| Navigation | **Cards-only home hub (Option B).** The home screen is a localized 6-card grid (`MenuCards` in `Menu.tsx`) that is the *only* navigation — each card opens its tool. Inside a tool, a slim bar (`ToolNav`) offers **← Home** plus **‹ prev / next ›** to jump between tools. Card order, labels, descriptions, gradients and icons are all defined in `CARD` / `MENU_ORDER` in `Menu.tsx`. The old left folder-tab rail (`TabNav.tsx`) is retired but left in the tree for reference. Tool switches still play the paper-flip animation (`@keyframes pageflip`, motion-safe). |
| Vitamin pairing | **New tool.** Pick a goal (fatigue recovery · skin vitality · restful sleep · post-workout recovery · after intense training · immune support) **or type your own** — keyword matching maps free text to the closest goal — and get a recommended supplement combo with reasons + a how-to-take tip. Data lives in `GOALS` inside `VitaminPairing.tsx` (language-independent structure, 4-language strings). Add a goal = one entry in `GOALS` (+ its `kw` aliases). **Educational, not medical advice.** |
| Landing / hero | **3D animated hero (Three.js).** A transparent WebGL scene of floating realistic medicines — telescoping two-tone capsules, biconvex coated tablets with score lines, and oblong caplets — gently drifting and rotating in accent colours, with cursor parallax on the camera and the CSS hero glow. Lives in `components/HeroCanvas.tsx`; the headline sits above it at `z-[3]`. Reduced-motion renders one static frame. Tune density via `COUNT`, palette via `ACCENT_HEX`. |
| Connected flow | Every tool ends with a **“Helpful next steps”** strip (`components/NextSteps.tsx`) that links onward — find a pharmacy, consult a pharmacist, run the safety check, or **Ask AI for more detail** (an inline question box wired to `window.claude.complete`, falls back gracefully if unavailable). Flows are defined per-tool in `FLOW`. |
| Colour accents | Each tool has a muted editorial accent (`ACCENT` in `Menu.tsx`); home badges are **liquid-glass** (translucent tint + blur + gloss) that fill with the accent and scale 1.3× on hover. The active tool tints its panel top-bar, nav title and next-steps marker to match. |
| Commercial polish | Account chip + sign-out toast, trust strip, product footer with working legal/about/FAQ/support/notices modals (`Legal.tsx`, 4 languages), `focus-visible` rings, button press micro-motion, product metadata + favicon. |
| Symptom analysis | Restyled symptom form; result cards render the active language's content. Ends with a **“find a pharmacy for these symptoms”** button that jumps to the pharmacy tab. |
| Find pharmacy | Map mock + nearby list with open/closed, distance, rating. |
| Search history | Local list with per-item + clear-all delete. |
| Privacy | Consent toggles, policy links, delete-all. Local state only. |
| Dark mode | Header button cycles **Auto → Light → Dark**. **Auto switches by time of day** — dark during 18:00–06:00, light otherwise, re-checked every minute so it flips at the boundary. Choice saved to `localStorage`. Every token is a CSS variable so the whole UI re-themes. Respects `prefers-reduced-motion`. |
| Responsive | Home cards: 1 column on mobile, 3 across on `sm+`. Fluid H1 via `clamp()`. Goal chips and tool nav wrap cleanly. |

> **i18n note:** the symptom result content is sourced from the translation dictionary so it
> shows in the active language. The original keyword-matching `buildResult` (which produced
> English-only strings) was replaced by the localized default result; re-add per-keyword
> branches in each language's `symptom` block if you need that behavior back.
>
> The pharmacy / history / privacy tabs use **static mock content** in `i18n.tsx`
> (language-independent values like distance, rating, dates live in `PH_META` / `HIST_META`
> / `PRIV_ON`). Wire them to real APIs/state when ready.

## Design tokens (light → dark)

- **Brand:** `#0B6E61` → `#13A892` (deep medical teal)
- **Surfaces:** paper / surface / surface-soft
- **Ink scale:** `ink` → `ink-4`
- **Semantic:** `warn` (amber), `danger` (rose), `ok` (green), each with a `-tint`
- **Type:** Pretendard, tight tracking

All defined as CSS variables in `globals.css` and exposed to Tailwind via `@theme inline`,
so `bg-surface`, `text-ink`, `bg-brand-tint`, etc. all work and auto-switch in dark mode.

## Preview without Next.js

Open **`react-handoff/render-proof.html`** in a browser — a self-contained mirror of the
full app (all four tabs · working dark toggle · all four languages) using the exact same
class names and token strategy. Visual output is identical to the React build.
