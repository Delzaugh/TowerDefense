# Developer asset: review of the work and workflow improvement plan

2026-09-24. Scope: this task's reference intake, modeling, corrections, exports,
visual reviews, user feedback, and final reconstruction. The completed turn
history and recorded commands were reviewed alongside the recipes, milestones,
decision record, validation reports, and reference images. The audit and original
priorities below are retained. See the implementation update at the end for the
shared changes made after the user accepted the rebuilt asset.

## Finding

The main failure was reconstructing the wrong primary volume and then polishing
it. Neither the guide nor the triangle budget required a flat front. The guide
already calls for strong silhouettes, clean construction, and inspection of the
exported model. I did not turn those requirements into sufficiently specific
comparisons before developing and delivering the model.

The user supplied enough information to get much closer. Small inconsistencies
between the illustrated views required judgment, but they do not explain the
generic body, misplaced chin, and poorly integrated fins in the rejected model.
Raising the budget could support better geometry; it could not select the right
shape. The final reconstruction uses fewer triangles than rejected revision 4.

## What happened

| Stage | Action and evidence | Assessment |
| --- | --- | --- |
| Initial request | Read the workflow and guide; registered the asset, retained five reference sheets, wrote a procedural source, and exported an approximately 2,182-triangle model. | Storage and provenance were sound. The recipe approximated the head with convenient generic geometry instead of measured reference profiles. |
| User rejected quality | Raised this asset's limit to 5,000 as requested; developed bevels, optics, temple details, and swept fins. | The recognizable parts improved while the incorrect primary body remained. More detail made the mismatch more expensive to change. |
| User questioned the flat front | Applied a common mathematical front deformation across the assembly, including accessories. | Addressed the word “flat,” but missed the actual brow–face–chin relationship. It pulled the chin back and distorted parts that should remain rigid. |
| Revision 4 handoff | Exported 4,456 triangles, inspected multiple runtime views, and reported improvement. | Those checks established loadability and some construction/readability properties. They did not establish reference fidelity. The positive review overstated the result. |
| User rejected the general shape | Compared references, renders, source construction, and component triangle allocation; recorded `shape_audit.md`. | Correctly identified the body, fin roots, jaw, attachment placement, and projecting rear panel as structural problems. This evaluation should have happened before detailed modeling. |
| Current reconstruction | Replaced the core recipe with horizontal body sections and a crown profile traced from contour landmarks. Kept goggles and temple housings rigid; fitted them afterward. Compared aligned front/side masks before final details. | A more suitable construction method. The evidence now measures the requested shape rather than only the presence of familiar features. |
| Second review and correction | Close/reverse views exposed cheek seating and casing protrusions. Fixed them, re-exported, and checked the replacements. Source inspection then found degenerate triangles in thin beveled vent backings; removed that unnecessary bevel and reviewed the final export. | The second pass produced actual corrections. A review is useful when it can reject its own candidate. |

Additional execution issues mattered, but were secondary to the art failure:

- Early export attempts lacked the Playwright dependency path and then exposed
  palette/sampler contract mismatches. These were corrected; dependency and
  contract preflight would have avoided the detour.
- A rebuild experiment hit a Blender tessellation API difference. Dependent shell
  steps could continue after failure; later commands explicitly stop on a
  nonzero exit code.
- The open Inspector was stale during earlier work. Refreshing it corrected that.
  A saved GLB, a headless review, and a user's open tab can show different revisions.
- The first diagnostic mask threshold dropped pale surface pixels. It was
  corrected and the overlays inspected. An image-analysis number is only useful
  after checking what the mask actually contains.
- Numerical delivery and a favorable written visual note coexisted with a user
  rejection. The rejection must supersede the earlier visual conclusion without
  erasing its history.

## Why the repeated attempts missed

**The representation came before the reference analysis.** A generic section loft
made certain edits easy and others awkward. Subsequent work inherited its shape.
The right response to a wrong primary form was to replace the relevant geometry,
not keep compensating with local offsets and an assembly-wide deformation.

**Review asked the wrong questions.** “Are the three fins, goggles, braces and
eyes present?” is weaker than “Where do the fin roots begin, how much negative
space separates them, how far does the jaw project, and where is the temple
relative to the eye line?” Recognizability is necessary, but insufficient.

**Detail and technical success biased the judgment.** Smooth optics, tidy bevels,
a clean browser console, and a budget pass are easy to observe. They distracted
from proportion errors. Revision 4 spent 1,000 triangles on goggles, 976 on temples
and symbols, and 580 on its rear panel, while the core/display had 350. That is
evidence of work order, not a universal rule about how to allocate triangles.

**The evidence did not constrain the conclusion enough.** Multiple screenshots
were inspected, but the reference and model were not aligned early enough. The
review needed explicit failures, corrected views, and a revision identity—not
just a list of views that had been opened.

## Proposed production sequence

These are agent self-checks within authorized work, not additional user approval
gates. Keep one Blender scene owner. An independent reviewer remains optional
and read-only when requested.

| Step | Work and required evidence | Reason to return to the preceding step |
| --- | --- | --- |
| 1. Resolve the brief | Record explicit user decisions, latest feedback, reference roles, budget, scale, anchors and motion scope. Identify which sheets govern outline, volume, materials and accessories. | Conflicting decisions or missing information that materially changes the result. |
| 2. Establish landmarks | Mark front and side extrema, widest sections, major bends, attachment centers, and feature roots/tips. Record shared scale and camera assumptions. | Incompatible views need a documented reconciliation; do not silently stretch one view. |
| 3. Resolve primary form | Model body and silhouette features. Use simple accessory volumes where they affect the outline. Save plain shaded and aligned silhouette comparisons. | Wrong mass, jaw/brow relationship, fin sweep, width, or negative spaces. Replace the relevant form before detailing. |
| 4. Fit secondary parts | Preserve manufactured shapes in local coordinates. Define seats, thickness, clearances, and continuous versus separate boundaries. | Floating, piercing, inconsistent joins, or accessory placements that hide a body error. |
| 5. Add detail and finish | Add bevels, symbols, recesses, materials and requested motion within the asset's budget. Inspect shading after triangulation. | Detail changes the accepted primary shape or spends budget without visible benefit. |
| 6. Validate the candidate | Export through the guarded pipeline; inspect the actual GLB in fixed, close oblique, reverse/underside and game-scale views. Check relevant motion states when authored. | Any technical failure or visible defect in scope. Source correction, new export, and affected-view recheck are required. |
| 7. Review again and hand off | Reopen the finished export with the references visible. Look specifically for proportion, attachment and shading defects. Record findings against source/export hashes and link the actual asset. | Evidence belongs to an older revision or the conclusion relies only on counts/screenshots being generated. |

## Prioritized changes to the shared workflow

### P0 — make reference fidelity an explicit prerequisite

Proposed edits to `.agents/skills/game-asset-workflow/references/shape-details.md`:

> For a new asset or a primary-form correction, identify the reference's major
> landmarks and negative spaces before selecting a construction method. Compare
> front, side, and game-view primary forms before developing small details. If
> the body or silhouette is wrong, replace that form instead of compensating with
> accessory changes or global deformation. Fit rigid accessories after the body.

Add a compact reference/landmark section to the initial production brief. The
shared visual guide should explain the principle once; per-asset measurements,
priorities and exceptions belong beside each source. Do not copy Developer's
dimensions, triangle limit, or landmarks into universal guidance.

Evidence of success: a future source has an early primary-form comparison and
explicit resolution of the largest shape differences before detailed accessories.

### P0 — separate review states and bind them to the files

Extend the delivery evidence format with distinct fields for technical validation,
reference fidelity, construction, game-scale readability, and user acceptance.
Each author review records the asset/version, export hash, source hash, inspected
views, defects found, repairs, and remaining artistic judgment. New geometry
invalidates the previous author review; explicit user rejection marks the relevant
design assessment failed. “Screenshots captured” is not a passed review.

Proposed ownership: `tools/asset-pipeline/` owns evidence/hash validation; the
delivery skill describes the required author judgment; the Inspector displays
the status. Keep technical promotion available for iterative review, but label it
as unreviewed until the corresponding author review is complete. No user approval
requirement is added.

Evidence of success: opening a new export cannot display an old visual pass, and
a failed design assessment cannot be mistaken for an accepted asset.

### P1 — make comparisons reproducible

Add a small comparison helper to `tools/asset-pipeline/` and optional reference
overlay support to the existing Inspector. Record projection, view direction,
uniform scale, center/ground alignment, reference crop, and rendered mask. Render
true flat masks rather than inferring silhouettes from material colors. Preserve
aspect ratio and expose internal landmark comparisons alongside the outer mask.

Use overlap and landmark errors to find discrepancies, not as an automatic
universal quality score. Illustrative references are not always orthographic;
set any tolerances per asset and explain perspective compromises. A high outline
overlap can coexist with wrong internal proportions or bad construction.

Evidence of success: comparisons can be rerun on a changed GLB, and the saved
overlay visibly represents the same alignment used by its measurements.

### P1 — strengthen technical preflight and geometry checks

Resolve Blender and browser-test dependencies once, validate the palette contract,
and stop dependent commands immediately on failure. Add focused checks for
degenerate triangles and loose geometry. Report open boundaries per intended
component; do not reject legitimate open effects or require unrelated parts to
be welded. Retain visual checks for intersections and shading because topology
counts cannot prove their absence.

Verify the Inspector's loaded export hash at handoff. Refresh the existing asset
view when it is still the task's view; preserve its camera. If the user has moved
to another asset, provide the direct link rather than claiming their tab was
refreshed or changing their current inspection without need.

### P2 — evaluate whether the changes work

Pilot the updated sequence on the next three comparable assets. Record whether
major proportion defects were found before detailing, which defects the second
review caught, and whether the user had to repeat the same correction. Track
time spent rebuilding primary forms after detail work. Use the results to refine
the guidance; do not equate a higher triangle count, more screenshots, or more
mandatory reviewers with higher quality.

## Implemented in this asset

The current source uses traced crown landmarks, explicitly shaped body sections,
an authored projecting chin, rigid fitted goggles/temples, and vents cut into the
casing. Diagnostic comparisons preserve reference aspect ratios; revision 4's
baseline is retained separately. Close and reverse review defects were corrected.
Source topology and runtime evidence are saved beside the source and identify
the final files.

Final revision 8: **4,228 / 5,000 triangles**, two materials, static model. The
source check reports no boundary edges, non-manifold edges, loose vertices or
zero-area triangles. Runtime validation passes. Front silhouette overlap improved
from about 86% to 91%; side from about 78% to 93%, under the documented diagnostic
alignment. These percentages are not artistic acceptance scores. The remaining
judgment is whether the interpretation of the illustrated views satisfies the
user; no workflow can guarantee that judgment automatically. The user subsequently
accepted revision 8 with “Much better! Great work” and requested the shared
workflow improvements; that feedback is now recorded against its file identities.

Evidence: [asset source folder](../../blender/towers/copilot_developer/v01/),
[original failure audit](../../blender/towers/copilot_developer/v01/validation/shape_audit.md),
[final visual review](../../blender/towers/copilot_developer/v01/validation/visual_review.json),
[aligned comparisons](../../blender/towers/copilot_developer/v01/validation/landmark_comparison/silhouette_comparison.png),
[geometry review](../../blender/towers/copilot_developer/v01/validation/geometry_review.json).

## Implementation update — 2026-09-24

Applied after explicit user direction to improve the shared workflow:

- The visual guide and game-asset skill now require primary-form comparisons for
  new models and substantial shape corrections before detailing. Local edits keep
  their scope. Landmarks, negative spaces, view reconciliation and rigid fitting
  are explicit; Developer's dimensions and budget remain asset-specific.
- The delivery instructions require a second author review and keep technical,
  visual and user judgments distinct, without introducing a user approval gate.
- New asset briefs are scaffolded from a reusable template covering reference
  priorities, primary-form evidence, construction decisions and feedback.
- `asset.mjs review` initializes a pending structured record and checks source,
  export, revision and evidence identities. It rejects incomplete/stale records
  and recorded user rejection. Old records are archived when initializing a new
  one. It checks evidence bookkeeping, not the truth of artistic judgments.
- Runtime validation now captures true flat silhouettes alongside shaded views,
  with matching cameras, image hashes and export identity in render_evidence.json.
  This removes the need to infer silhouettes from the asset's material colors.
- Export resolves the browser-test dependency before running Blender.

The shared delivery smoke test and isolated review-record tests cover the changed
behavior. Developer revision 8 was revalidated without changing its model files
and its accepted review migrated to the structured format.

The bundled skill validator could not run in this runtime because PyYAML was
absent. The unchanged discovery metadata, absence of unfinished placeholders and
all routed reference links were checked directly; the instruction changes were
reviewed for scope and verified after copying into the protected skill folder.

Optional Inspector overlay/status UI and a general source-topology audit command
remain potential tooling follow-ups. The workflow already requires the applicable
comparisons and geometry checks; those UI/tool additions are not prerequisites
for using it. The next three comparable assets provide the planned opportunity
to assess whether proportion errors are caught earlier and repeated corrections
decrease. No recurring task or automatic monitoring was created.
