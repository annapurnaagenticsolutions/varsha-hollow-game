# Varsha Hollow: The Slime Shepherd

A mobile-first, choice-driven narrative game based on the original Varsha Hollow story.

## Current playable release — Version 1.2

- Arc One: **The Dry Shrine** and Arc Two: **Forty Roofs Before the Rain**
- 10 chapters, 30 scenes, and 90 authored choice outcomes
- Empathy, Wisdom, Practicality, Slime Trust, Meera bond, and village-state tracking
- Boond the Dew Slime and Mitti the Clay Slime unlocks
- Forty-roof inspection ledger, scarce building resources, and visible Recovery progression
- Meera's tactile marker mini-interaction
- Delayed Arc One consequences that change Arc Two scenes and resources
- Dev introduction and relationship tracking
- Five anime/fantasy Arc Two chapter illustrations optimized for mobile/offline play
- Automatic browser save and resume
- Automatic migration of Version 1.1 saves into Arc Two
- Separate Arc One and Arc Two evaluations
- Responsive layout and reduced-motion support
- No network or account required during play

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local address shown in the terminal.

## Verify

```bash
pnpm check
pnpm test
pnpm build
```

The production client is written to `dist/public`. It is a static build suitable for GitHub Pages, a PWA wrapper, or an Android WebView/Capacitor shell.

## Content architecture

Arc One scenes live in `client/src/game/chapters.ts`; Arc Two scenes live in `client/src/game/arcTwo.ts`. The choice engine and versioned save model live in `client/src/game/engine.ts`. New arcs can be added as scene records without rewriting the interface.

The canonical 25-chapter season outline and story bible are included in the companion story package.
