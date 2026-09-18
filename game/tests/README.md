# Application verification

Current suite: 244 unit/integration tests and 40 desktop/touch browser cases. The [mechanics guide](../../docs/Test_Map_Mechanics.md) records coverage configuration, authored path clearance, drag aiming, wave recipes, repeatable attempts and custom saves. [Tower and Copilot core properties and stats](../../docs/Tower_Base_Stats.md) describes authored cost/footprint, performance overrides, Copilot extension boundaries and validation. Former foundation browser tests exercise the single UI; old pure probe tests remain regression fixtures. Preset isolation, stale tabs, legacy preservation, map clicks, inspection, gesture cancellation and pause locks are covered. Four browser workers avoid excessive contention with the strict frame-gap pause policy.

Run `npm test` for core/content/integration checks and `npm run build` followed by `npm run test:e2e` for browser checks. `npm run verify` runs the complete sequence including lint and import boundaries. Vitest uses its own configuration, without application build plugins.

Current coverage: malformed content, duplicate/dangling references, logical geometry boundaries, command rejection, fixed timing, complete-once events, detached snapshots, restore continuation, save eligibility, stale repository revisions, cached UI snapshots, session disposal, hidden-tab freeze, and late async results. Browser tests exercise start/pause/resume, real IndexedDB across reloads and tabs, pointer/touch placement, and narrow layouts. Evidence screenshots are generated beneath ignored `test-results/`.

`fixtures/helpers.ts` supplies deterministic scenarios and a controllable frame host. The [wider verification plan](../../docs/Codebase_Structure.md#verification-plan) covers later gameplay and performance work; those cases are not implemented yet. Existing asset-tool verification stays under its respective tool.

