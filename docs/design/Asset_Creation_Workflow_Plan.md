# Reusable asset workflow — implementation record

Implemented, with the storage-policy migration completed on 2026-09-12. [Asset storage](../../assets/README.md) owns location and grouping rules. [Visual Asset Guide](Visual_Asset_Guide.md) owns shared art direction, visual interfaces and animation ownership.

## Structure

| Component | Responsibility |
| --- | --- |
| .agents/skills/game-asset-workflow/ | Modeling/refinement skill with conditional animation and delivery guidance. |
| AGENTS.md | Project routing, user-decision preservation and source protection. |
| assets/asset_catalog.json | All registered asset IDs, versions and manifest locations. |
| Per-asset asset.json | Source/runtime paths, budget, dimensions, anchors, clips, provenance, palette and delivery hashes. |
| tools/asset-inspector/ | Catalog-only runtime review. |
| tools/asset-pipeline/ | Scaffolding, contract checks, isolated export, staged validation/promotion, evidence, snapshots and preview launch. |
| .codex/agents/asset-reviewer.toml | Optional read-only reviewer inheriting model choice; no mandatory delegation. |

## Creation and refinement

Read the policy, guide, manifest, source and decisions. Establish a new model's brief before authoring. Refine silhouette, palette, attachments and motion in focused passes, preserving the user's earlier choices. References are design inputs, not new user instructions.

The editable Blender source owns geometry, materials, rigging, keyframes, clip timing and names. Simulation owns gameplay position, facing, timing and outcomes. Presentation chooses clips and playback; animation completion never advances gameplay.

Export into staging, validate the actual GLB and preserve the last valid source/runtime if checks fail. Procedural rebuilds require the recorded authoritative source hash; manually edited Blender files use ordinary export. Successful delivery increments the revision and records matching source/export hashes.

Refresh the same inspector, review fixed angles, paused poses, authored scale and phone readability. Copy refinement notes with exact camera, clip/time, selected part and temporary color choices. Apply accepted color edits to Blender and export again. Technical checks do not substitute for artistic acceptance.

## Storage and review boundaries

Every production asset follows blender/<category>/<id>/<version>/<id>_<version>.blend and assets/runtime/<category>/<id>_<version>.glb, with asset.json beside the source. The catalog and manifest are authoritative, and tools reject identity/path mismatches.

All existing runtime models are registered and migrated. Copilot, GitHub Mona Head, Rubber Duck and user-confirmed Shield are towers; Bug is an enemy; Cegeka signage and KayKit props are environment assets. Original reference art and third-party provenance are retained separately.

The inspector serves only registered GLBs from runtime. Comparisons use registered assets/versions. Source snapshots, staging files and third-party package inputs are not browser-loadable through the inspector. No compatibility viewers or alternative source routes are maintained.

The shared inspector supports camera/touch controls, dynamic animation playback, stable reload, lighting/backgrounds, ground/shadows, overlays, mesh isolation, phone/silhouette tests, semantic palette previews and screenshot/feedback capture. Limits and revision hashes remain visible.

## Verification

See the maintained command reference in tools/asset-pipeline/README.md. Per-asset reports identify exact source/export hashes; assets/validation_catalog.json collects results. Tests exercise a new-model create/refine/export cycle, failed-candidate preservation, stale-source refusal, all-model browser loading, catalog-only serving and removal of superseded paths.

Geometry/material payloads and authored assembly origins are preserved during migration. Per-asset contracts record imported offsets and retained texture dimensions. Numerical checks cover budgets, resources, transforms, anchors, skinning, sampled poses, stationary root, loop endpoints and explicit palettes. Attachment quality, foot sliding, style and animation appeal remain visual review tasks.
