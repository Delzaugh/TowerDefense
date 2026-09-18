# First Code Research and Implementation Plan

## Recommendation

The first application code should establish a deterministic, serializable simulation boundary and prove that browser presentation, content loading, and persistence can use it correctly. Begin with a reproducible TypeScript package and a small set of validated data contracts, then implement state transitions and fixed-step execution without React, Three.js, or IndexedDB dependencies. Bring that core into a minimal browser laboratory before adding tower combat or authored Level 1 waves.

This order prioritizes a strong technical foundation while keeping it verifiable. The foundation milestone should load a registered model, display a deterministic route probe, accept valid commands, freeze correctly, save and restore an eligible fixture, and survive disposal and recreation. Each visible element exists to exercise a production boundary. A finished map, balanced combat, campaign screens, and the full enemy roster are later milestones.

The recommendation is specific to Tower. Its distinguishing requirements are productive Work and harmful Problems sharing a route; local, blocker-aware targeting; strict pause behavior; between-wave full-state saves; and permanent progression committed only on success. These requirements make state ownership, command validation, logical geometry, and persistence semantics more consequential starting points than additional UI or art tooling.[^1][^2]

## Existing foundation and remaining gaps

The repository inspection found an application folder scaffold containing responsibility notes, with no application package, runtime entry, implemented simulation, or application tests. The existing asset tools are substantially further along: `contracts.mjs` validates identities and manifests, `server.mjs` restricts model loading to catalog entries, and `viewer.js` already handles Three.js loading, mixers, and resource cleanup.[^3][^4]

| Observed condition | Consequence for the first code |
| --- | --- |
| React, TypeScript, Three.js, Vite, and IndexedDB are locked technology choices. | Work within those choices; package selection fills implementation gaps. |
| The asset catalog contained 74 identity/version entries: 59 environment, 8 towers, 6 enemies, and 1 work entry. | Use an explicit small asset selection for foundation checks. Asset availability does not define the playable roster. |
| `copilot_base@v02`, `problem_bug@v01`, and `work_coding_task@v01` had runtime files and delivery metadata. | They are candidate integration fixtures; actual application-loader validation is still required. |
| `copilot_base@v01` is static; `v02` declares clips. | Pin a version intentionally instead of assuming all variants expose the same animation interface. |
| No Product-category entry appeared in the inspected catalog. | A logical destination marker is sufficient for foundation probes; final Product art is a separate dependency. |
| The inspector vendors Three.js revision 180. | Record this as the existing validation baseline and test any game-library version against selected exports. |
| Local commands reported Node 24.21.0 and npm 11.19.0. | A Node runtime already exists; verify dependency engines when resolving and locking the application package. |
| Level 1 still has open wave composition, geometry, and tuning. | Use explicitly provisional test fixtures instead of treating unfinished design values as production content. |

The asset counts and runtime-file checks are a repository snapshot, not an artistic acceptance or performance audit. No models were changed or re-exported for this research.[^3][^4]

The folder structure is suitable. It needs a build-only home such as `game/build/` for the Vite asset adapter, and `game/tests/fixtures/` for deterministic scenarios. Those are concrete implementation additions, not reasons to reorganize the existing source, asset, and design trees. There is no evidence that a monorepo, backend, general entity-component framework, physics engine, or dependency-injection container is necessary for the first milestone.

## Technical choices

These are recommendations to adopt during implementation, not claims that dependencies have already been installed or jointly tested.

| Concern | Recommended starting choice | Reason and alternative |
| --- | --- | --- |
| Application package | One `game/package.json`, npm lockfile, recorded Node version | Fits the current structure and available runtime. Separate packages become useful when there is an actual second consumer. |
| Build | Vite with React/TypeScript integration | Already selected. Keep type checking as an explicit command. |
| Pure rules | Plain TypeScript data and functions with module-owned public APIs | Makes transitions and saved state inspectable; add data-oriented optimizations only after profiling. |
| Data validation | Zod for new content and save schemas | Runtime validation and inferred types suit the TypeScript authoring workflow. Ajv is a valid alternative if JSON Schema becomes the primary authoring contract. |
| Rendering | Direct Three.js behind a renderer adapter | Fits existing tooling and makes lifecycle ownership explicit. React Three Fiber is viable but not required for this foundation. |
| React integration | A small external session store with `useSyncExternalStore` | Gives React a supported subscription boundary without sending every entity transform through component state. |
| Rules and adapter tests | Vitest | Shares the Vite ecosystem; use Node execution for pure code. |
| Browser tests | Playwright | Exercises actual DOM, storage, input, and loader integration across browser projects. |
| Import boundaries | Dependency-cruiser plus targeted lint rules | Makes allowed dependencies executable rather than merely documented. |
| IndexedDB wrapper | `idb` behind a narrow repository interface | Keeps transactions explicit. Dexie becomes attractive if richer indexed queries or reactive collections become real requirements. |
| Generative tests | Add fast-check when command/state transitions exist | Useful for operation sequences and invariants, not as a substitute for explicit acceptance cases. |

Zod documents runtime schemas and static type inference. Ajv supports compiled validators and TypeScript narrowing, with documented limitations around some union typing. The reason to prefer Zod here is authoring fit, not a benchmark claim. Preserve the existing asset manifest validator and its JSON schema; choosing a validator for new game data does not justify rewriting the asset pipeline.[^5][^6]

React Three Fiber's own guidance supports imperative frame updates and warns against routing fast updates through React state. It is therefore compatible with a separated simulation. Direct Three.js is recommended because Tower already has that implementation experience and a small, explicit scene boundary; no evidence gathered here establishes that either approach is universally faster.[^7]

Use stable releases that satisfy one another's peer and engine requirements, then record exact resolved versions in the lockfile. The current Vite and Vitest guides specify runtime requirements, and the observed Node version exceeds their documented minimums. That is an environment check, not proof that an uninstalled dependency set passes a build. Recheck the selected versions at bootstrap, especially because the inspector's vendored renderer may differ from the game dependency.[^8][^9]

## First implementation sequence

The recommended sequence has seven work packages. Each should end in a passing, reviewable result. These are development packages, not seven independent architectural subsystems to implement in full.

| Order | Deliverable | Exit condition |
| --- | --- | --- |
| 1 | Reproducible package and enforced module boundaries | A fresh install can type-check, run a meaningful pure test, and build a minimal application. |
| 2 | Content, command, state, and save-envelope contracts | Valid fixtures parse; invalid references, values, and versions fail with useful errors. |
| 3 | Deterministic simulation kernel and logical geometry | Repeated commands/ticks give matching states; freeze and snapshot continuation tests pass. |
| 4 | Catalog-aware build and isolated rendering adapter | Selected registered models load in development and static build; instances and disposal behave correctly. |
| 5 | Browser session, React subscription, and input bridge | One loop owns time; remounts and hidden tabs do not cause duplicate or surprise advancement. |
| 6 | IndexedDB persistence and atomic progression commit | Save/restore works in real browsers; repeated or aborted completion commits preserve consistency. |
| 7 | Integrated foundation laboratory | Boundary, browser, and representative load checks pass before combat expansion. |

The save format begins in package 2 and is proven in memory in package 3; the browser transaction adapter arrives in package 6. This avoids designing serialization after the state model has already accumulated browser or renderer objects.

### 1. Reproducible package and architectural checks

Start with `package.json`, its lockfile, `index.html`, a minimal React entry, Vite configuration, a dedicated Vitest configuration, TypeScript configurations, and a small dependency-rule configuration. Separate browser, build-tool, and pure-core type environments. Browser code needs DOM definitions, build tooling needs Node definitions, and the simulation should have neither ambient environment by default.

Vite transpiles TypeScript but does not perform type checking. A successful Vite build therefore cannot substitute for a separate TypeScript check. TypeScript's `lib` setting controls available standard-library declarations; excluding DOM declarations from the pure-core check helps expose accidental browser coupling.[^10][^11]

Enable `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` for the new application. They are particularly useful for entity lookup, missing content references, and distinguishing an absent optional property from an explicitly undefined value. Treat validation errors as data with a code and location, not merely a console string.[^12]

Add dependency rules that disallow simulation imports from session, presentation, UI, persistence, Node APIs, or Three.js. Prevent production modules from importing tests and fixtures. Check the resolved import graph, including aliases and re-exports; a filename convention alone does not enforce this. Dependency-cruiser supports custom dependency rules and build-readable violations.[^13]

Use a separate Vitest configuration so a pure test need not start the catalog delivery plugin or depend on all artwork being present. Introduce commands with clear responsibilities: `typecheck`, `lint`, `check:boundaries`, `test`, `build`, and later `test:e2e`. A local verification command should execute the relevant checks in a documented order. CI should run those same commands when repository hosting is configured; no hosting setup is needed to begin.

The first meaningful test can validate a minimal coordinate or identity schema. It should reject an invalid value that would otherwise reach runtime. Avoid adding passing placeholder tests just to make a command appear complete.

### 2. Contracts before systems

The first production TypeScript files should be small domain contracts: identities, logical coordinates, content references, state, commands, events, and the versioned save envelope. Keep logical positions as plain numeric data. Adopt the project's existing convention of metres, Y-up, and positive-Z forward; for a flat route, model logical ground-plane coordinates as X/Z with height explicit when required.[^1]

Distinguish at least these concepts in the schema vocabulary:

- A content definition ID, a runtime entity ID, and an asset ID/version reference serve different purposes.
- A level phase, a freeze/pause condition, and a presentation screen are different state dimensions.
- Productive Work, cleanup Work, and Problems require distinct outcome semantics even if some progress arithmetic is shared.
- A command requests an action; an event describes a fact already accepted by the simulation.
- A durable simulation snapshot contains enough information to continue; a UI snapshot is a smaller read-only projection.

Do not create all future fields or empty implementations. Add only what the first fixture needs, while reserving version discriminators and stable identities at the boundaries. A content schema can know that a reference is an asset identity without importing the Node catalog resolver or a Three.js class.

Use runtime validation at ingress: authored data, saved data, and external input. TypeScript declarations alone are not input validation. Perform a separate semantic validation pass for dangling IDs, duplicate entities, zero-length route segments, non-finite coordinates, invalid schedule ordering, negative costs, and impossible restored-state combinations. Parse and normalize once at session creation rather than validating the entire world every simulation tick.

Separate four version concerns: storage-envelope version, simulation/rules compatibility version, gameplay-content identity/version or fingerprint, and visual asset identity/version/revision hash. A palette refinement should not automatically invalidate a gameplay save. A changed route or rule may require rejecting or migrating it. Define compatibility explicitly rather than comparing one oversized project hash.

### 3. Deterministic kernel and geometry

Implement a simulation API with operations corresponding to creation, command application, fixed advancement, snapshot capture, and validated restore. Keep it synchronous. The session owns wall-clock measurement; the kernel receives explicit commands and steps. The kernel may mutate privately owned state internally, but its public snapshots must not expose mutable backing objects.

An illustrative interface is:

```ts
// Design sketch: referenced domain types are defined separately.
interface Simulation {
  dispatch(command: Command): CommandResult;
  advanceOneTick(): TickResult;
  capture(): SimulationSnapshot;
}

interface CommandResult {
  accepted: boolean;
  reason?: CommandRejection;
  events: readonly SimulationEvent[];
}
```

Command processing must remain available when simulation time is stopped. Otherwise an implementation that drains commands only inside advancing ticks cannot resume from pause or start an untimed planning phase. Apply control commands at explicit deterministic boundaries, assign sequence numbers, and define how a pause interleaved with tactical requests affects later requests. Rejected tactical commands must not linger and execute after resume.

A fixed-step accumulator with presentation interpolation is a well-established way to decouple simulation from display timing. Fiedler also describes the runaway catch-up problem and the need for headroom or a bounded number of steps. Those principles support the architecture, but they do not prescribe Tower's tick rate or overload behavior.[^14]

Start by evaluating 60 simulation ticks per second as a provisional engineering default. Express deadlines and commitment durations in ticks after explicit conversion from authored units. At 2x, perform twice as many unchanged simulation steps per unit of wall time, rather than doubling the step size. Record the chosen tick rate as part of the simulation compatibility contract and profile before treating it as final.

Repeatability also requires stable entity ordering, stable target tie-breaking, ordered commands, and controlled numeric operations. Use integer counters for IDs and whole-value resources; define rounding for fractional rates. Begin with authored deterministic schedules. If randomness is later introduced, pass in a seeded generator and capture its state. Do not promise cross-browser bit-for-bit equivalence without comparing the supported engines; passing same-process tests is narrower evidence.

The first kernel fixture can move a probe along a short polyline, accept start/pause/resume controls, reject a deliberately invalid command, and round-trip a snapshot. It does not need enemy AI. Route interpolation, point-in-area checks, and segment/blocker intersection tests should operate on plain geometry so the future renderer and targeting system can agree.

Test corner cases such as a target exactly on a boundary, a zero-length segment, a sight ray tangent to a blocker, and a placed object overlapping prohibited space. Define inclusive/exclusive boundaries and an epsilon policy once. For the first flat map, simple logical shapes are sufficient; general rigid-body physics is not justified by the current design.

Keep tick-order decisions that affect game outcomes visible. Whether completion beats a leak on the same tick, when a newly spawned entity becomes targetable, and when aura membership is sampled are behavior choices, not accidental consequences of array traversal. Record and test those choices before adding the relevant combat rule.

### 4. Catalog delivery and renderer integration

Implement the catalog adapter as Node-side code under `game/build/`, with the browser consuming only a generated runtime index. The existing `contracts.mjs` exports catalog lookup, manifest validation, hash calculation, and path resolution. It uses Node filesystem and crypto APIs, so it belongs in build tooling and must not be imported into browser or simulation modules.[^4]

Resolve a declared set of required asset ID/version pairs, validate their manifests, check actual runtime files, and include their delivered interface metadata. The existing `catalog()` checks all catalog manifests; if this causes unrelated schema problems to block a build, document that existing behavior instead of silently weakening validation. Unused, valid draft entries without exports are different from referenced missing assets.

For development, expose allowlisted model routes through Vite middleware. For production, emit selected GLBs and a compact index into build output. Vite's `configureServer` hook is development-specific, so a working dev route alone does not prove that a static deployment will work. Its public directory is copied as-is; pointing it at the entire repository or asset-source tree would violate Tower's delivery policy.[^15][^16]

The index should contain identity, version, actual export hash, runtime URL, and the clip/anchor data required by presentation. Source paths, Blender recipes, decision notes, and review reports stay out. Resolve links against the deployment base and test a non-root base such as `/tower/`.

Within one asset version, refinements can replace the exported bytes. Cache parsed assets by identity, version, and export hash. Prefer a hash-bearing generated output path while retaining the canonical authored filename as metadata, or a verified hash-qualified URL with an appropriate cache policy. Hash-bearing build output does not relocate or rename the canonical GLB in `assets/runtime/`. Recompute hashes during the build rather than trusting stale delivery metadata.[^3][^4]

Load and parse each selected GLB once per cache key, then create visual instances. For skinned assets, Three.js's `SkeletonUtils.clone` reconnects cloned meshes to cloned bones while reusing geometry and materials. Independent animation state therefore needs explicit instance ownership; sharing geometry does not mean sharing a skeleton's pose.[^17]

Give each independently animated instance its own mixer/action state. Share immutable resources, and clone materials only when per-instance appearance requires it. Test two instances playing different clips or times, then remove one and confirm the other remains intact. Ordinary instancing is a useful later option for repeated static props, but the foundation should not assume it automatically batches independently animated skeletons.

Define resource ownership before adopting the inspector's cleanup pattern. The inspector disposes resources associated with entries; a game cache may share those same resources across many instances. Three.js requires explicit disposal of geometries, materials, and textures, and disposing a material does not dispose its textures. Release instance state separately from cache-owned GPU resources.[^18]

Async loads must also respect disposal. Tag a loading request with its session generation; if it resolves after that session has ended, do not attach the result to a dead scene. Release it through the owning cache or discard the unshared resources safely. Renderer failure and context loss must leave the authoritative simulation recoverable or frozen rather than continuing invisibly.

### 5. Browser session and React lifecycle

Create a single session owner for the frame loop, simulation, renderer adapter, input subscriptions, and UI projection. Expose explicit `start`, `stop`, and idempotent `dispose` behavior. A second `start` must not create a second loop. Disposal cancels scheduled frames, removes listeners, invalidates outstanding async work, and releases owned presentation resources.

React's Strict Mode intentionally performs an additional Effect setup/cleanup cycle in development. Keep it enabled and use it as a lifecycle check. A scene that renders correctly once but leaks after remount has not passed foundation acceptance.[^19]

Use `useSyncExternalStore` to subscribe the React HUD to a cached immutable projection. React requires a stable snapshot value when the underlying data has not changed. Publish HUD changes at meaningful state changes or a measured cadence; the renderer reads its own frame-oriented snapshot rather than asking React to re-render every moving entity.[^20]

Use the animation-frame timestamp to measure elapsed time and inject a fake clock in scheduler tests. Browsers typically stop animation-frame callbacks for hidden tabs, so elapsed time can jump on return. Visibility must be an explicit session policy rather than an accidental catch-up burst.[^21][^22]

Recommended provisional behavior is to freeze on hide, reset the wall-time baseline, and show a resume control when the page returns. Reject tactical changes while frozen, preserving the current hard-pause rule. Treat this as a product behavior to record before implementation; it is not already specified by the design's basic pause rule. Do not treat backgrounding as permission for mid-wave saving or offline progression.

Bound work per frame. If the application cannot keep up, freeze with a recoverable performance status or deliberately fall behind wall time; never silently increase the simulation timestep. Define what happens to remaining accumulator time and synchronize visual animation with that policy. Compare simulations by tick and command sequence, not merely by seconds elapsed on a stalled computer.

Input should translate pointer gestures into intent and commands. Pointer Events provide one event model for mouse, pen, and touch, with pointer capture and cancellation semantics. Specify `touch-action` deliberately for the canvas, handle cancelled gestures, and ensure a HUD click cannot also place a tower beneath it.[^23]

### 6. Save persistence and campaign transactions

Implement a narrow save repository with explicit results for success, unavailable storage, incompatible data, and transaction failure. Store a validated snapshot captured at a permitted between-wave boundary. Loading should validate a candidate fully before replacing the active session; a bad save must not destroy the current valid state or be silently treated as a new game.[^2]

For the first persistence proof, use an in-memory repository and a real IndexedDB adapter against the same behavioral contract. A fake adapter supports fast failure tests; browser tests verify the real transactional behavior. Save envelopes contain version information, content references, the simulation snapshot, and necessary run identity. Wall-clock creation timestamps are metadata, never simulation clocks.

Use `idb` to simplify promises while retaining explicit object stores and transactions. Its documentation warns that unrelated asynchronous work inside a transaction can allow it to close before later writes. Resolve asset data and perform expensive validation before opening the write transaction; await its completion before displaying a saved status.[^24]

For success commits, write campaign changes and a processed-run record in the same read/write transaction. The transaction checks whether that run was already processed, applies growth/unlocks only if needed, and records the result together. Use a run identity supplied at creation and preserved by restore; do not manufacture a new identity each time a save is loaded. Inject a fixed identity in deterministic tests.

Use a revision or compare-and-swap check for save-slot writes so a stale second tab cannot overwrite a newer run silently. Test two concurrent completion requests and a stale save revision. Transactions serialize conflicting writes, but the application still has to define its conflict and duplicate-result policy.[^25]

Database-schema version and save-payload version are separate. Implement the current format and an explicit unknown-version rejection path first. Add a real migration only when a second schema exists; do not build speculative chains of empty migrations. Handle a blocked database upgrade by explaining that another game tab must release its connection.

IndexedDB supports local saves, but browser storage is best-effort by default and may be evicted or cleared. Handle quota/open/write failures honestly. Persistent-storage requests and export backups can improve resilience later; neither is a cloud backup or a reason to expand Alpha scope now. Local saving also does not by itself provide offline loading of the entire application.[^26]

### 7. Integrated foundation laboratory

The foundation laboratory should run through the actual game build and its asset adapter. It is a small diagnostic screen with a route probe, logical blocker overlay, one or two registered animated instances, minimal start/pause/resume controls, and eligible fixture save/restore. It should not acquire asset editing, comparison, or palette tools already owned by the Asset Inspector.

Use a clearly named fixture such as `foundation_probe`, excluded from the eventual player level list. Provisional speeds, route points, and counters are engineering data, not approved Level 1 tuning. Test-only commands must never become unrestricted production gameplay commands.

Run its pure cases through Vitest and its browser cases through Playwright. Device emulation covers viewport and touch-related browser settings; it does not reproduce a phone's GPU, thermal throttling, or memory constraints. Real-device checks remain necessary before claiming the 100-visible-entity performance target.[^9][^27]

Configure browser tests to own a dedicated game server and origin, with isolated database names or contexts. Avoid silently reusing the existing inspector server on ports 4174–4184. Playwright can manage the test server; production-build checks should serve emitted files independently so dev middleware cannot hide missing deployment assets.[^28]

Use explicit checks rather than a green screenshot alone: one active loop, no uncaught exceptions, stable subscriptions, correct command rejection, independent animation instances, correct base-path asset URLs, and preserved state after restore. When transitions exist, fast-check can generate command sequences against a small reference model to expose ordering failures that isolated cases miss.[^29]

For the load probe, render 100 representative moving Work/Problem instances and record simulation-step time separately from total frame time, draw calls, load size, and resource counts. Choose a documented mixture, camera, render resolution, and clip state. Do not infer performance from a scene with 100 invisible or static placeholders. Budget values and target devices remain provisional until measured.

Three.js's current WebGL renderer requires WebGL 2. Establish an explicit capability failure path early. Also cap or scale drawing-buffer resolution deliberately: high device pixel ratios increase rendering work. The existing r180 responsive-rendering guidance supports treating canvas CSS size and drawing-buffer size as separate concerns.[^30][^31]

## File-level starting plan

These are proposed files to create during implementation. They do not currently exist merely because they appear here.

| Package | Initial files or groups | First behavior to prove |
| --- | --- | --- |
| Toolchain | `game/package.json`, lockfile, `vite.config.ts`, `vitest.config.ts`, TypeScript configs, dependency rules | Clean install, isolated core check, meaningful test, static build. |
| Content | `src/content/schemas/identity.ts`, `geometry.ts`, `map.ts`, `validate.ts` | Structured errors and semantic reference checks. |
| State boundary | `src/simulation/state.ts`, `commands.ts`, `events.ts`, `createSimulation.ts` | State is plain data; valid/invalid commands behave consistently. |
| Time and geometry | `src/simulation/step.ts`, `geometry.ts`; `src/session/fixedStepClock.ts` | Tick-based probe movement, stable boundaries, bounded scheduling. |
| Serialization | `src/simulation/snapshot.ts`; `src/persistence/saveSchema.ts` | Capture, validate, restore, and continue without drift. |
| Build assets | `game/build/assetCatalogPlugin.ts`, `runtimeAssetIndex.ts` | Build-time catalog projection, hash-based cache identity, base-path output. |
| Rendering | `src/rendering/createRenderer.ts`, `assetCache.ts`, `modelInstance.ts` | Correct model instances and separate resource ownership. |
| Browser session | `src/session/createSession.ts`, `sessionStore.ts`; `src/app/App.tsx`, `GameCanvas.tsx` | One loop and complete teardown under remount and async loads. |
| Input | `src/input/pointerInput.ts` | Gesture cancellation, capture, and command routing. |
| Storage | `src/persistence/saveRepository.ts`, `indexedDbRepository.ts` | Real transaction completion, failure behavior, and revision conflicts. |
| Progression | `src/progression/applyRunResult.ts`, relevant state schema | Duplicate fixture result has no duplicate permanent effect. |
| Verification | `game/tests/fixtures/`, focused tests in existing test folders, `playwright.config.ts` | Each foundation acceptance condition has executable evidence. |

Keep file count proportional to real behavior. Several small contracts may initially share a file. These names express ownership, not a requirement to generate every listed file before the first test runs.

The very first implementation task should cover packages 1–3 as a coherent deliverable: a verified package, validated minimal map/state contracts, a pure probe simulation, deterministic control behavior, and snapshot continuation tests. A minimal React shell may be present, but it should not delay proving the pure core. Packages 4–7 then establish the foundation's integration gate before gameplay expands.

## Acceptance criteria and evidence limits

| Risk | Required evidence before foundation completion |
| --- | --- |
| Hidden browser coupling | Core checks without DOM/Node globals; forbidden dependency checks reject a deliberate violation. |
| Frame-rate-dependent state | Different frame partitions producing the same applied ticks/commands yield equal authoritative snapshots. |
| Pause/resume deadlock | Resume and planning start process while time is stopped; tactical commands are rejected and not deferred. |
| Snapshot drift | Capture at tick N, restore, apply the same subsequent commands/ticks, and match uninterrupted state. |
| Implicit outcome ordering | Boundary conventions and transition ordering have named, focused tests. |
| Missing or changing assets | Unknown selection and referenced missing export fail; a changed export hash changes cache identity. |
| Development-only delivery | The emitted application loads models under a non-root base from a plain static server. |
| Shared animation corruption | Two animated instances differ independently; disposing one preserves the other. |
| Lifecycle leaks | Repeated mount/dispose and late loader completion leave no extra loops/listeners or unbounded resource growth. |
| Invalid or incompatible saves | Clear error; active valid state and stored prior data remain intact. |
| Duplicate campaign rewards | Retrying the same result and concurrent requests commit once; an abort does not leave a partial commit. |
| Stale multi-tab writes | Conflicting revisions produce a deliberate conflict outcome instead of silent overwrite. |
| Mobile interaction mismatch | Pointer/touch cancellation, resizing, HUD isolation, and paused controls work in browser tests. |
| Unsupported performance assumptions | Reproducible 100-instance measurements with device/browser/render settings recorded. |

The correct performance conclusion is bounded: this fixture met these measurements on these devices with this build. A phone-emulated desktop browser is not evidence of real phone frame rate. Resource counts need a stable baseline rather than an expectation that all Three.js internal caches return to zero.

## Decisions still requiring design or measurement

Research can narrow the implementation choices, but it cannot establish game balance or settle every interaction. Record the following before implementing the dependent gameplay system:

1. **Hidden-tab behavior and overload handling.** The proposed freeze-and-explicit-resume policy is an implementation recommendation, not an existing locked rule.
2. **Same-tick outcomes.** Choose completion versus leak ordering, spawn eligibility timing, simultaneous damage/healing behavior, and failure precedence.
3. **Aura visibility semantics.** Core says a tower must see a target to affect it; Persona design describes aura effects by coverage. Clarify how blockers and sight shape apply to aura effects before implementing them, using both owning documents.
4. **Ambiguity removal.** Specify whether increased required work falls back when the source disappears, how multiple sources combine, and how existing progress is preserved.
5. **Logical blocker shape and precision.** Begin with a documented simple shape set, but validate it against the authored map and preview requirements.
6. **Save compatibility policy.** Decide which changes require migration, whether old content remains available, and how art-only refinements are distinguished from gameplay changes.
7. **Target hardware and rendering budgets.** Select actual desktop, tablet, and phone test devices; then validate tick rate, drawing resolution, memory, and frame-time targets.

These are bounded questions to resolve when their implementation begins. They do not block the package, contracts, deterministic kernel, catalog adapter, or fixture persistence work. Avoid silently turning unspecified mechanics into permanent rules through a test fixture.[^1][^2]

## Work after the foundation

Once the integration gate passes, build the smallest complete dual-flow encounter: one readable route, a logical Product destination, one Base Copilot, one productive Work definition, one Problem definition, and the correct completion/leak consequences. Add local targeting and blocker-aware placement using the geometry already tested. Follow with Developer/Tester identity and aura behavior, then debt cleanup, finite boss consequences, successful progression, and authored Level 1 pacing.

The full game should continue to grow through tested rules and content, with visible integration at each step. A strong foundation is complete when its boundaries have been exercised and measured; filling every planned folder or designing future AI systems is not an acceptance condition.

## Evidence and source notes

Repository observations and live documentation were checked on 12 September 2026. The technical recommendation prioritizes foundation quality ahead of gameplay delivery. No application dependencies were installed, runtime code implemented, GLBs loaded in a new game build, or performance benchmarks executed for this report. Package compatibility, runtime rendering, and device performance remain implementation verification work.

Live documentation may move beyond the versions eventually installed. Three.js source references pinned to r180 were used for details relevant to the existing inspector baseline. Fiedler's 2004 article supplies enduring scheduling principles, not current browser-support evidence. Recommendations about tick rate, file names, transaction policy, and milestone order are engineering judgments derived from Tower's requirements; they are not measurements or mandatory prescriptions from library authors.

## Sources

[^1]: Tower design set. [Technical Architecture](design/Technical_Architecture.md), [Core Gameplay Systems](design/Core_Gameplay_Systems.md), [Copilot / Agent Design](design/Copilot_Agent_Design.md), and [Visual Asset Guide](design/Visual_Asset_Guide.md). Local project documents, inspected 12 September 2026. Used for technology choices, simulation ownership, geometry, pause, targeting, and animation boundaries.

[^2]: Tower. [Level 01 — Just One Small Feature](design/levels/Level_01_Just_One_Small_Feature.md) and [Content Design](design/Content_Design.md). Local project documents, inspected 12 September 2026. Used for Alpha scope, unfinished tuning, debt/boss consequences, and save/progression requirements.

[^3]: Tower. [Codebase Structure](Codebase_Structure.md), [Game scaffold](../game/README.md), [Asset storage](../assets/README.md), and [Asset catalog](../assets/asset_catalog.json). Local repository snapshot, 12 September 2026. Catalog manifests were inspected for identities, declared clips, delivery metadata, and runtime-file existence; counts describe entries, not unique gameplay roles.

[^4]: Tower. [Asset contracts](../tools/asset-pipeline/contracts.mjs), [Inspector server](../tools/asset-inspector/server.mjs), [Inspector viewer](../tools/asset-inspector/viewer.js), [vendored Three.js core](../tools/asset-inspector/vendor/three.core.js), and [pipeline README](../tools/asset-pipeline/README.md). Local source inspection, 12 September 2026. Node/npm versions were read from local command output; no installation or compatibility test was performed.

[^5]: Colin McDonnell and Zod contributors. [Zod introduction](https://zod.dev/). Live documentation, accessed 12 September 2026. Runtime schemas, inferred TypeScript types, and supported execution environments.

[^6]: Ajv contributors. [Using with TypeScript](https://ajv.js.org/guide/typescript.html). Live documentation, accessed 12 September 2026. Validator type narrowing and union-type limitations.

[^7]: Poimandres / React Three Fiber contributors. [Performance pitfalls](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx). Maintained source documentation, accessed 12 September 2026. Imperative frame updates and avoiding fast React state updates.

[^8]: Vite contributors. [Getting Started](https://vite.dev/guide/). Live documentation, accessed 12 September 2026. Project bootstrap, package/runtime prerequisites, and build entry.

[^9]: Vitest contributors. [Getting Started](https://vitest.dev/guide/). Live documentation, accessed 12 September 2026. Vite/Node requirements, dedicated configuration, and test execution.

[^10]: Vite contributors. [Features — TypeScript](https://vite.dev/guide/features#typescript). Live documentation, accessed 12 September 2026. Transpilation versus explicit type checking.

[^11]: Microsoft / TypeScript contributors. [TSConfig: lib](https://www.typescriptlang.org/tsconfig/lib.html) and [TSConfig: types](https://www.typescriptlang.org/tsconfig/types). Live documentation, accessed 12 September 2026. Environment-specific ambient declarations.

[^12]: Microsoft / TypeScript contributors. [strict](https://www.typescriptlang.org/tsconfig/strict.html), [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html), and [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html). Live configuration references, accessed 12 September 2026.

[^13]: Sander Verweij and dependency-cruiser contributors. [Dependency-cruiser README](https://github.com/sverweij/dependency-cruiser). Maintained project documentation, accessed 12 September 2026. Custom dependency rules and violation reporting.

[^14]: Glenn Fiedler. [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/). Published 10 June 2004; accessed 12 September 2026. Fixed-step accumulation, interpolation, and catch-up limits. Used for principles, not a Tower-specific tick rate or performance claim.

[^15]: Vite contributors. [Plugin API](https://vite.dev/guide/api-plugin). Live documentation, accessed 12 September 2026. Development middleware, build separation, and local plugin placement.

[^16]: Vite contributors. [Shared Options — publicDir](https://vite.dev/config/shared-options#publicdir). Live documentation, accessed 12 September 2026. Untransformed static copying behavior.

[^17]: Three.js contributors. [SkeletonUtils.js, r180](https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/jsm/utils/SkeletonUtils.js). Version-pinned official source, accessed 12 September 2026. Clone behavior and shared geometry/material references.

[^18]: Three.js contributors. [How to dispose of Objects, r180](https://raw.githubusercontent.com/mrdoob/three.js/r180/manual/en/how-to-dispose-of-objects.html). Version-pinned official manual, accessed 12 September 2026. Explicit resource disposal and ownership implications.

[^19]: React contributors. [StrictMode](https://react.dev/reference/react/StrictMode). Live documentation, accessed 12 September 2026. Development Effect setup/cleanup verification.

[^20]: React contributors. [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore). Live documentation, accessed 12 September 2026. External subscriptions and cached immutable snapshots.

[^21]: MDN contributors. [Window: requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). Live browser API reference, accessed 12 September 2026. Timestamp use and background callback behavior.

[^22]: MDN contributors. [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). Live browser API reference, accessed 12 September 2026. Visibility events and background execution constraints.

[^23]: MDN contributors. [Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events). Live browser API reference, accessed 12 September 2026. Unified input, capture, cancellation, and touch behavior.

[^24]: Jake Archibald and idb contributors. [idb README](https://github.com/jakearchibald/idb), especially [transaction lifetime in the maintained source](https://raw.githubusercontent.com/jakearchibald/idb/main/README.md). Accessed 12 September 2026. Promise wrapper and transaction-lifetime constraints.

[^25]: MDN contributors. [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB). Live browser API guide, accessed 12 September 2026. Object stores, transaction completion, and upgrades. Alternative wrapper evaluated: Dexie contributors, [Design](https://dexie.org/docs/Tutorial/Design), accessed the same date; versioned schemas and transaction API.

[^26]: MDN contributors. [Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). Live browser API guide, accessed 12 September 2026. Best-effort storage, persistent-storage requests, and eviction constraints.

[^27]: Microsoft / Playwright contributors. [Emulation](https://playwright.dev/docs/emulation). Live documentation, accessed 12 September 2026. Device-related viewport, user-agent, and touch configuration; hardware-performance limitations are the report's inference from the scope of emulation.

[^28]: Microsoft / Playwright contributors. [Web server](https://playwright.dev/docs/test-webserver). Live documentation, accessed 12 September 2026. Test-owned server configuration and reuse policy.

[^29]: fast-check contributors. [Model based testing](https://fast-check.dev/docs/advanced/model-based-testing/). Live documentation, accessed 12 September 2026. Generated command sequences and reference-model checks.

[^30]: Three.js contributors. [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html). Live API documentation, accessed 12 September 2026. WebGL 2 requirement and removal of WebGL 1 support since r163.

[^31]: Three.js contributors. [Responsive Design, r180](https://raw.githubusercontent.com/mrdoob/three.js/r180/manual/en/responsive.html). Version-pinned official manual, accessed 12 September 2026. Canvas sizing and drawing-buffer resolution.
