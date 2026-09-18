# Copilot Tower specification sheets

Seven visual sheets and companion production briefs, created 2026-09-18 from the latest Persona concepts.

Each PNG uses the shared 1536 x 1024 model-spec template: six views, illustrative gameplay-scale view, illustrative wireframe, texture/UV status, model information, palette and notes. Companion briefs cover accepted gameplay, assembly, materials, animation, technical targets and review criteria.

| Tower | Visual sheet | Detailed specification |
| --- | --- | --- |
| Base Copilot | [PNG](base_copilot_spec_v01.png) | [Brief](base_copilot_spec.md) |
| Developer | [PNG](developer_spec_v01.png) | [Brief](developer_spec.md) |
| Tester | [PNG](tester_spec_v01.png) | [Brief](tester_spec.md) |
| Analyst | [PNG](analyst_spec_v01.png) | [Brief](analyst_spec.md) |
| Security | [PNG](security_spec_v01.png) | [Brief](security_spec.md) |
| Architect | [PNG](architect_spec_v01.png) | [Brief](architect_spec.md) |
| Linter Agent | [PNG](linter_agent_spec_v01.png) | [Brief](linter_agent_spec.md) |

## Evidence and scope

- Base Copilot data is verified against the existing v02 revision 3 GLB: 2,489 triangles, 1,902 exported vertex records, 2 meshes, 1 material and one 256 x 8 embedded image. Two texture bindings share that image. See [measured data](support/base_verified_stats.json) and [actual texture image](support/base_texture_0.png).
- The six Personas have no production meshes from this task. Their triangle, vertex, material and texture measurements remain `-`, and their UV grids are empty.
- All sheet artwork, wireframes and campus scale scenes were made with the built-in image generation tool. Wireframes are illustrative, not actual topology. Persona back surfaces are proposed construction, and the turnarounds do not constitute exact orthographic CAD evidence.
- The 3,000-triangle ceiling is the authoring target selected from the project's Copilot budget envelope; Persona manifests must confirm it when production starts.
- User constraints retained: varied colors, goggles and bulk; Analyst uses a squat ivory shell with requirements-card/pencil symbolism, not a banana silhouette or graph.
- No Blender sources, runtime assets, gameplay definitions or catalog registrations were changed.

## Source references

- [Latest front roster](../copilot_persona_concepts_v04.png)
- [Rear perspective roster](../copilot_persona_rear_three_quarter_v01.png)
- [Tower gameplay baseline](../../../../../../../docs/Tower_Base_Stats.md)
- [Visual asset guide](../../../../../../../docs/design/Visual_Asset_Guide.md)
- [Existing Base manifest](../../../asset.json)

Generation prompts are retained in `prompts/`; each source prompt records the requested rendering and invariants. Individual images remain proposals for review.
