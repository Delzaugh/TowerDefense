# Animation workflow review — 2026-09-24

The Developer was delivered and accepted as a model without animations. The old
animation guidance selected clips only when needed and did not require a tower/
enemy baseline or a model-to-animation question. A valid empty clip contract and
a successful geometry review therefore left this omission invisible.

## Implemented changes

- The visual guide now requires Rest Pose plus Idle, Work, Walk/locomotion, Place,
  Hit and Resolve for completed tower/enemy animation passes. Rest Pose remains
  the unanimated model state; Walk/locomotion retains the existing `move` name.
- The model workflow and new `game-asset-animation` project skill now expose the
  completed model preview first and ask whether to continue with animations.
  Existing explicit authorization is retained; deferral leaves a valid model
  milestone and an explicit pending animation pass.
- The animation skill separates model acceptance from animation acceptance,
  preserves approved rest art, and reviews contact, transitions, loop speed,
  exact one-shot endpoints, active channels, anchors and small-scale readability.
- The model-stage review template now calls absent tower/enemy clips pending
  animation instead of declaring the asset static. The scaffold brief records
  the user's handoff decision and locomotion style.
- `node tools/asset-pipeline/animation-coverage.mjs` audits both manifests and GLBs.
  Coverage means names exist; exported motion and visual appeal still need review.

## Developer delivery

The user explicitly authorized animations after accepting revision 8 and chose
Gentle hover/glide. Revision 10 retains the accepted rest mesh, topology, palette,
material settings and anchor coordinates; normal differences are limited to
floating-point export precision (maximum 1.2e-7). It adds three bones and all six
clips, still at 4,228 / 5,000 triangles. The grounded rest remains available;
playback hovers above ground. Action and target anchors follow the body, while
the UI anchor stays stable. Animation review is separate from the user's previous
model acceptance.

The actual GLB was sampled at 96 Hz for clearance, stationary root, moving
channels and anchor coherence; loop endpoints and boundary speed were checked.
Contact sheets and Inspector playback include blink, action extremes, terminal
resolve and Rest Pose reset. The animation recipe remains part of the guarded
procedural build. Gameplay state-to-clip mapping is still presentation-owned.
The second pass corrected Resolve's initially low shrinking center so the compact
exit now drifts upward near the original face height. All six clips were replayed
in the shared Inspector, including loop repetition, one-shot holds and reset.

## Existing asset backlog

Snapshot from `assets/animation_coverage.json`. These are registered asset
**versions**, including the retained base version and palette test entry.
The Developer is complete; 19 other versions lack some baseline names. This
inventory does not authorize animating all of them in the current task.

| Asset | Version | Missing baseline clips |
| --- | --- | --- |
| copilot_base | v01 | idle, work, move, place, hit, resolve |
| copilot_base | v02 | move, resolve |
| github_mona_head | v01 | idle, work, move, place, hit, resolve |
| copilot_rubber_duck | v01 | idle, work, move, place, hit, resolve |
| copilot_shield | v01 | idle, work, move, place, hit, resolve |
| problem_bug | v01 | idle, work, place |
| problem_lag_spike | v01 | work, place |
| problem_vague_spec | v01 | work, place |
| problem_missing_details | v01 | work, place |
| golden_compiler | v01 | move, place, hit, resolve |
| copilot_commit_halo | v01 | move, place, hit, resolve |
| problem_dead_code | v01 | work, place |
| problem_spaghetti_code | v01 | work, place |
| bert_breugelmans | v01 | place, hit, resolve |
| problem_bug_palette_test | v01 | idle, work, place |
| github_octocat_classic | v01 | idle, work, move, place, hit, resolve |
| github_octocat_modern | v01 | idle, work, move, place, hit, resolve |
| github_octocat_classic_lowpoly | v01 | work, place, hit, resolve |
| linter_agent | v01 | idle, work, move, place, hit, resolve |
| copilot_developer | v01 | None |

Fill this backlog in approved asset passes: review the existing model first,
record the user's animation choice, preserve working interfaces and author only
missing or deficient motion. Keep existing useful non-baseline clips. Do not
rename `spawn`, `active` or `defeat` into baseline names without evaluating their
meaning and consumers. Re-run the inventory after each delivery.

## Guidance validation

The skill routes, frontmatter fields and model-only / authorized-animation /
deferred-animation cases were reviewed for consistency with the user's request.
The bundled Python skill validator could not run because its runtime lacks
PyYAML; no dependency or global configuration was changed. The pipeline review
regression suite and catalog contracts passed. The Developer's actual export and
animation tests provide the production validation for this pass.
