# FELT — Poker Trainer

A mobile-first, offline-capable preflop + heads-up drill. Single session, no login,
no persistence — reload and you start fresh, by design.

Three modes:

- **Steal seat** — open/fold from the Button or Small Blind (a wide ~top-45% range).
- **Middle seat** — open/fold from middle position (a tight ~top-20% range).
- **Heads-up** — curated turn/river showdown spots graded on pot odds.

## How the math works

**Preflop strength** is real, not hand-tuned. [`scripts/computeRanking.mjs`](scripts/computeRanking.mjs)
Monte-Carlo simulates the all-in equity of all 169 starting hands versus a random
hand (120,000 runouts each, fixed seed = reproducible) and ranks them. The output,
[`src/data/handRanking.json`](src/data/handRanking.json), tags each hand with its
combo-weighted percentile. "Open the top 45%" means open every hand whose percentile
is stronger than 45%. The generated equities match published tables (AA 85.2%,
AKs 67.0%, 32o 32.1%).

Regenerate any time:

```sh
npm run ranking
```

> Note: ranking by equity-vs-random is an *approximation* of true opening ranges —
> it ignores postflop playability (which nudges suited connectors up slightly). Good
> enough for a beginner/intermediate open-or-fold drill; it is not a live solver.

**Heads-up spots** ([`src/data/showdowns.json`](src/data/showdowns.json)) use exact
pot-odds arithmetic — `equity needed = call / (call + pot + bet)` — compared against
your hand's equity, estimated either from a stated villain range (bluffs ÷ total) or,
for draws, the "rule of 2" (outs × 2). The villain range is a labeled *read*, not
solver output; the arithmetic on top of it is exact.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run ranking    # regenerate the hand strength table
```

## Layout

```
scripts/computeRanking.mjs   equity simulation -> hand ranking (build-time)
src/engine/hands.ts          pure helpers over the ranking table
src/engine/preflop.ts        lanes, spot generation, grading (pure)
src/data/handRanking.json    generated strength table
src/data/showdowns.json      authored heads-up puzzles
src/components/               PlayingCard, RangeBar
src/App.vue                   mode switch + session state + views
```

## Deploy

Pushing to `main` builds and publishes `dist/` to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The base path in
[`vite.config.ts`](vite.config.ts) is set to `/card-trainer/` to match the repo.

Live (after first deploy): **https://bstuddard.github.io/card-trainer/**

> One-time setup on GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions.**
