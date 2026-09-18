# Foundation implementation

The original foundation is described below. [Encounter batch 01](Encounter_Batch_01.md) adds traffic/consequences; [batch 02](Encounter_Batch_02.md) adds towers, targeting and actions. Their formerly separate screens now share the [unified test map](Unified_Test_Map.md), which records the current controls, persistence and test coverage.

The first executable foundation implements the core contracts and deterministic execution proposed in [First Code Research](First_Code_Research.md), plus a small browser session and local persistence adapter to exercise them. It uses provisional route data and a diagnostic SVG map. It is not a playable level or the final Three.js renderer.

## Working components

| Component | Implementation |
| --- | --- |
| Reproducible application | One npm package and lockfile; Vite, React, TypeScript; local-only dev/preview servers. |
| Type boundaries | Strict compiler options; core check without DOM or Node ambient declarations; separate app/tool checks. |
| Dependency enforcement | Resolved graph check forbids browser/adapter imports from pure modules, cycles, and production-to-test imports. A deliberate simulation-to-browser import was confirmed to fail the gate. |
| Content validation | Zod strict objects, bounded finite coordinates, IDs/versions, positive rectangles, nonzero route segments, duplicate IDs, and valid route references. |
| Simulation | Explicit synchronous commands, deterministic 60 Hz advancement, preparation/running/complete phases, hard pause, 1x/2x speed intent, and fixture marker placement. |
| Logical geometry | Distance-based polyline sampling, inclusive rectangle containment, circular marker/footprint overlap, and segment/rectangle sight tests. |
| State boundary | Detached deeply frozen snapshots; stable accepted-command/event sequences; explicit current rules/content compatibility; validated restore. |
| Timing/session | Injectable frame host, bounded accumulator, one frame loop, cached React snapshots, visibility pause, idempotent disposal, and late-I/O guards. |
| Local saves | Versioned save envelope; preparation/completion only; real IndexedDB and in-memory repositories; detached data, transaction completion, optimistic revision checks, and failure feedback. |
| Console | Responsive development screen; SVG route/marker/blocker inspection; click, tap and button placement; accessible controls and status feedback. |

## Deliberate engineering policies

- The probe runs for 600 ticks at 60 Hz. These are fixture values, not Level 1 pacing. The core receives fixed ticks; speed changes the scheduler's tick count rather than step size.
- Control commands execute immediately at explicit boundaries even when time is stopped. Rejected commands change no state, consume no sequence ID, emit no accepted event, and are never queued for resume.
- `complete` means the route probe reached its destination. It does not mean the Product survived, the level was won, or a reward was committed.
- A hidden active tab pauses and requires explicit resume. Foreground gaps above 250 ms also pause; up to 30 fixed steps are processed per frame. Unsupported browser timing is surfaced rather than converted into a large variable step.
- The marker is a circular logical placement probe with radius 0.4. Touching a prohibited footprint rejects placement. Sight uses inclusive segment/rectangle intersections, with a documented small numerical tolerance. Marker visibility has no combat range or aura semantics.
- Snapshot compatibility compares scenario ID/version, rules version, tick rate, and an exact canonical JSON signature of validated logical content. This signature is an equality token, not a cryptographic checksum. Visual assets are not part of this fixture, and future art-only changes must not invalidate logical saves.
- Internal snapshots can capture active/paused simulation for deterministic tests. Player-facing save envelopes reject those phases. Loading never replays old events or grants outcomes.
- The IndexedDB database and save format are explicitly foundation-specific. The adapter prevents silent stale writes with revision comparison in the same transaction as the update. It does not implement campaign growth or successful-run deduplication yet.
- Browser rendering currently publishes the small diagnostic view at simulation updates. Future Three.js rendering must use its own frame-oriented presentation adapter and avoid routing entity transforms through React.

## Validation

The automated checks cover 51 content/simulation/integration cases and 8 browser cases across desktop Edge and a touch-emulated phone viewport. Browser cases use the actual production build, not Vite development middleware. Check the latest command output when modifying the foundation; these counts describe the initial implementation.

The browser checks cover real storage transactions, reload restoration, stale writes between tabs, start/pause/resume, blocked placement and layout width. Unit/integration tests additionally cover deterministic restoration, malformed data, geometry edge cases, hidden-tab freeze, bounded clock behavior, single-loop ownership, cleanup, and late asynchronous reads. No physical mobile performance, cross-engine determinism, or runtime GLB/animation integration claim is made.

## Next implementation boundary

The current priority is the [pure TypeScript gameplay plan](TypeScript_Gameplay_Implementation_Plan.md). [Batch 02](Encounter_Batch_02.md) completes basic placement, targeting and tower actions; multi-wave lifecycle, between-wave checkpoints and replay are next. Three.js/catalog delivery remains a separate later integration with independent animated instances and explicit resource ownership.

Combat, target commitment, Area/Cone coverage, Developer/Tester behaviors, aura occlusion policy, debt cleanup, boss schedules, campaign commits, retry rules, and full Level 1 content remain to be implemented. The current save schema is a versioned foundation format; extending it requires explicit compatibility and migration decisions rather than silently accepting new state fields.
