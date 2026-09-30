# Light default and Tester inspection release

Baseline: `706589032a9d53f65e88991a465be243c2ebf661`.

Light is the default for new visits, invalid preferences and unavailable browser storage. Saved Dark/System preferences remain supported. Initial HTML applies the preference before module download; the native browser theme colour follows later appearance changes.

Tester uses the delivered `copilot_tester@v01` revision 9 model, six clips and an authored 192px portrait. Its qualitative stats, QA Aura description and authored scale are unchanged. The source, recipes, references, milestones and validation evidence are included with the runtime asset. Other asset registrations and validation results are preserved.

Octicons now provide missing-model placeholders, coverage symbols, encounter playback/reset actions and navigation. Character portraits and actual game-map geometry retain their own visuals.

## Verification

- Lint, architecture boundaries, TypeScript and production build passed.
- Unit tests: 331 passed.
- Browser tests: 98 passed; 8 intentional platform skips. Tester Place/Idle and repeated close/reopen cycles are covered.
- Deployment tests: 5 passed, including Light startup on a dark OS, saved Dark startup before app download, route navigation and model loading.
- Responsive production review: Hub, Tester inspection and active encounter in both themes at 1280×800, 390×844, 844×390 and 320×568. Sixteen inspection/encounter records reported no runtime errors, failed requests or layout failures. Captures were visually reviewed.
- Motion review: 15 unpaused frames covered Tester Place, a full Idle cycle and Resolve. Assembly/recall, hover, eye motion, model attachment and recovery looked coherent. No camera refitting or model resizing was introduced.
- Tester source hash: `557452cc10faac74859db7b27ca9a3194d4058acb4ba9452e59e1e85befc30fe`.
- Tester GLB hash: `d0d0a68c4ee364a6c6855622e1536bd98fde9da04a432c3ba95b5462ab1fde65`.
- The existing guarded review passed for the canonical asset and the copied release payload. Scoped review used the current pipeline's `reviewAsset` function because the remote baseline's full catalog contains unrelated absent draft manifests. Source/export, evidence and presentation hashes all match. Line endings of the reviewed effect modules are preserved; their executable code is unchanged.

Existing Vite large-resource-chunk warning remains. Physical-device performance was not measured. Timed frames were used for motion evidence because this host lacks Playwright's optional video encoder.

The final Pages snapshot is packaged with its source revision and verified after GitHub deployment against public metadata, file hashes and the live default appearance/Tester controls.
