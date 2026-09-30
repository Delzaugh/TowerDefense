# Performance tracking and stress map

Current request: implement optional persistent performance tracking and a small removable stress-test map in the actual game.

Decisions: tracking defaults off; a separate setting persists independently of existing campus settings. A shared collector measures renderers and the actual encounter session. A synthetic 3D stress map uses delivered assets, fixed loads and automatic benchmark phases. A compile-time flag excludes its screen and asset imports in release builds. No asset authoring or gameplay rule changes.

Ownership: lead owns diagnostics service, renderer/session instrumentation and consolidated verification. Stress-map worker owns dev/stress, build gating and route integration. Panel worker owns performance UI and the home settings option.

Completed: persistent setting, compact performance panel, bounded collector and JSON export, campus/showcase/encounter instrumentation, model/build identity, seeded stress map and benchmark, release exclusion and usage documentation. Captures preserve phase/final state and partial reports across interruptions. Tracking off removes observers and sampling.

Verification complete: lint, all TypeScript projects, dependency boundaries, 352 unit/build tests, production build, desktop/touch functional and real-source capture checks, both serial stress benchmarks, excluded-build browser proof, six deployment-subdirectory checks and visual/motion review. Details and saved reports: `artifacts/performance-tracking/verification.md`. No remaining implementation work for this request. Physical-device performance and GPU timing remain outside the initial recorder's evidence.
