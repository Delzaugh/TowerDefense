# Hello World Courtyard — interactive draft

An isolated, playable refinement of the selected intro-map concept for **Just One Small Feature**. This draft tests the route, placement space, sight and opening decisions using the game's actual encounter simulation.

## Run

Uses the dependencies already installed in `game/node_modules`; no additional packages are required.

From this directory:

```powershell
npm run dev
```

Open http://127.0.0.1:5189/. For a production preview, run `npm run build` and then `npm run preview`. The build uses relative asset URLs and contains no development inspection hook. Stop the dev server before using the default preview port.

## Try it

1. Use **Try suggested team** for three Bases, or **Place Base** and click a lawn. The six numbered regions are suggestions; valid placement is free.
2. Click a Copilot to see its usable coverage, choose Auto/Build/Defend, or buy one permanent Developer/Tester Persona.
3. Start a round. Work pays Compute and can heal the Product; missed Work adds debt. Bugs pay when fixed and damage the Product when they leak.
4. Continue through three short rounds, then reset and compare another opening.

Isometric and top views, wheel/button zoom, Fit map, coverage toggle, pause and 1×/2× speed are available. On phones, hide controls to expand the map. Keyboard: Space starts/pauses, Escape cancels placement, T changes view, R resets. Leaving the window pauses play.

## Scope

The S route is 40.66 units long, about 25.4 seconds of unobstructed travel. One Server blocks sight beside the middle bend. Copilots use a draft 1.45-unit logical footprint so the full-size models have room; range is 5. Starting budget is 100 Compute, Base cost 30, Persona cost 20, and Product health 100.

Costs, task difficulty, damage and spawn timing are hypotheses for this geometry test. The three rounds do not replace the full Level 1 brief: Ambiguous Requirement, Debt Sprint, Production Incident and campaign unlocks are deferred. Repeated auras use the native strongest-only rule.

Registered GLBs retain their delivered materials and scale. The Campus Lab stands in for the Product, and the Server and welcome gate are temporary scene geometry. This app does not register a campaign map or alter the production encounter, asset manifests or Blender sources.

See [refined design notes](../../docs/design/levels/map_concepts_2026-09-30/Hello_World_Courtyard_Interactive_Draft.md) and [verification evidence](artifacts/final-evidence.md).

## Checks

`npm run build` runs TypeScript and the production build. `src/draft.verify.ts` exports the focused native simulation checks. Browser checks in `artifacts/browser-qa.mjs` and `artifacts/production-qa.mjs` use installed Edge and the two local servers (5189 development, 5190 production). Run `artifacts/canvas-qa.mjs` from the `game` directory so the shared inspector resolves its dependencies.
