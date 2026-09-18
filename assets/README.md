# Asset storage

The authoritative location of every asset is its entry in [asset_catalog.json](asset_catalog.json) and the source.path / runtime fields in its versioned manifest. All production assets are registered; file discovery is not an asset registry.

| Location | Purpose |
| --- | --- |
| asset_catalog.json | Versioned IDs and their manifests. |
| runtime/ | Canonical, self-contained GLBs. The game and Asset Inspector load only registered files from this tree. |
| third_party/<publisher>/<package>/<upstream-release>/ | Unmodified imported packages, licenses and provenance. Never ship directly from here. |
| ../blender/<category>/<asset_id>/<version>/ | Editable source, manifest, recipe, references, evidence, renders and retained snapshots. |
| validation_catalog.json | Latest aggregate validation results with source/export hashes. |
| migration_report.json | Completed structure migration audit and preservation checks. |
| palette_conversion_report.json | Per-version texture disposition, migration hashes, size changes and visual evidence. |

## Categories

| Category | Contains |
| --- | --- |
| towers | Player-placed units and structures. Copilots and their Persona variants are one Tower family; other registered Towers are not implicitly Copilots or Personas. |
| work | Beneficial moving work and recovery/cleanup items. |
| enemies | Problems, hostile units and bosses. |
| product | Protected objective and deliberate growth-state models. |
| environment | Terrain, routes, buildings, infrastructure and map props, including brand signage. |

Do not introduce catch-all categories. Add a category here first if the taxonomy needs to expand.

## Required layout

```text
assets/
  asset_catalog.json
  runtime/<category>/<asset_id>_<version>.glb
  third_party/<publisher>/<package>/<upstream-release>/

blender/<category>/<asset_id>/<version>/
  <asset_id>_<version>.blend
  asset.json
  decisions.md
  build.py                 # only for a procedural recipe
  references/
  validation/
  renders/
  revisions/
  .staging/
```

IDs use lowercase snake_case and versions use vNN. Source folder, Blender filename, runtime filename, catalog and manifest must agree. The shared pipeline enforces these identities; the catalog remains authoritative even when the layout is predictable.

One runtime GLB represents one registered asset/version. References, source exports, failed candidates and milestone copies remain outside runtime and cannot be served by the Asset Inspector. Live comparison uses registered runtime assets/versions; archival snapshots are inspected offline. Dedicated pipeline validation may inspect staged candidates before promotion.

The inspector exposes catalog entries only. A stray GLB is neither discoverable nor loadable. There are no alternative source-file routes or compatibility aliases. Update the manifest, consumers and validation record together when a location or identity changes.

Scaffolding reserves a catalog identity before authoring. Such a draft appears in the inspector once its first runtime export exists; missing files from a previously delivered asset are errors.

All existing production models have been migrated. The original mixed draft collection is preserved as reference art beside copilot_base; other derived assets link to that shared reference. KayKit inputs retain their upstream filenames and contents under the provider/package/release tree. Imported modular origins and the retained 1024 px shared atlas are recorded explicitly in each relevant manifest.

Effects, selection/range shapes, collision helpers, UI and gameplay data are runtime/code concerns rather than GLB categories.

## Colour storage

Prefer small palette textures under the shared [visual guide](../docs/design/Visual_Asset_Guide.md). Keep vertex colours when they better serve the asset and record the reason beside its source. Declare solid texture roles in `texturePalettes`; `palette.storage: "texture"` distinguishes them from vertex palettes. Images must be packed in Blender and embedded in the GLB. The guarded `export <id> --palette` migration preserves the current source, original runtime appearance and interfaces; see the [pipeline commands](../tools/asset-pipeline/README.md).
