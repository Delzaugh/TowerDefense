# Runtime asset imports

The Vite adapter consumes the authoritative `assets/asset_catalog.json`. Rendering bindings select explicit identities/versions:

```ts
import copilot from 'tower-asset:copilot_base@v02';

// In a future Three.js presenter:
const model = await loader.loadAsync(copilot.url);
// copilot.contract.anchors and copilot.clips describe its runtime interface.
```

`src/rendering/assetModules.d.ts` types each import as `RuntimeAsset`. Keep imports in presentation bindings, outside simulation/content. A map's pure data may name an identity/version; its presenter must provide an explicit binding for each model. A lazy scene module can own its bindings. Dynamic arbitrary catalog lookup and implicit `latest` are unsupported.

The adapter checks the selected entry, manifest identity/layout, canonical runtime location, repository containment, delivered SHA-256 and GLB header. Full mesh/clip/art validation remains the guarded asset pipeline's responsibility. Unused drafts may remain undelivered. Changed exports must be delivered properly rather than bypassing the hash check.

Production emits selected assets as `assets/runtime/<category>/<id>_<version>.<hash>.glb`. Each import generates browser metadata with URL, identity, revision, size/hash, root/axes/units, anchors and clip name/playback/FPS. Authoring fields, the catalog and source folders are not copied. Runtime effect configuration remains in the GLB. A build without model imports emits no GLBs.

Development serves imported bytes from `/@tower-assets/` beneath the Vite base; unimported paths return 404. Changes to a selected manifest, export or catalog invalidate imports and reload the app. This route is an asset allowlist, not a replacement for Vite's general filesystem security.

Use `npm run build -- --base=/TowerDefense/` for repository hosting; the default `./` also works. Vite 8's Rolldown file-URL integration keeps hashed URLs aligned with the app base. Retain the real-build tests on Vite upgrades. Prototype Pages scripts and inspector vendors are not production dependencies.

Run `npx vitest run tests/build/runtimeAssets.test.ts` for delivery checks or `npm run verify` for the whole app. Tests use temporary repositories and real Vite builds/dev servers; one read-only case resolves the actual `copilot_base@v02` export. Include third-party notices in release packaging as those assets/dependencies are selected; this adapter is not a license inventory or renderer.
