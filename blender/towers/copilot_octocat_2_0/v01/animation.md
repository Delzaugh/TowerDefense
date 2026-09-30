# Mona / Octocat 2.0 animation

Both `copilot_octocat_2_0/v01` and `copilot_octocat_2_0_lowpoly/v01` use
`animate.py` and the same 29-bone rig, five tentacle chains and expression names.
The user authorized this pass on 2026-09-30: “apply these to both 2.0 octocats”.

| Clip | Seconds at 24 fps | Acting |
| --- | ---: | --- |
| idle | 2.25 | Attentive weight shift and curious head turn |
| work | 1.75 | Brace, inspect, reach/tap, then pleased recovery |
| move | 1.166667 | Five phased tentacles support a low, elastic walking pose |
| place | 1.083333 | Cube assembly into the ready pose |
| hit | 0.416667 | Brief surprise, compression and optimistic recovery |
| resolve | 1.083333 | Reverse assembly and soft acknowledgment |

`idle`, `work` and `move` loop; the others are one-shots. Root remains stationary.
The unanimated Rest Pose retains the two raised and three supporting tentacles.
That pose does not assign permanent arm/leg anatomy. Move uses all five limbs.
Its authored stance travels backward relative to an actor moving forward at
0.28 m/s, with 78% stance and phase offsets 0, .2, .4, .6, .8. Retiming or changing
world speed requires a corresponding locomotion adjustment to avoid sliding.
Blend idle/move over approximately 0.18–0.22 s to lower/raise the body smoothly;
the Inspector's direct selection intentionally exposes the separate poses.

Facial controls: `blink_left`, `blink_right`, `focus`, `surprise`, `concern`,
`delight`, `gaze_left`, `gaze_right`. The manifest and root extras contain
attentive, interest, focused, surprised, concerned, amused and delighted presets.
The Blender rig's `expression_*` properties drive the editable shape keys.
Clips bake their facial acting into GLB weight channels. A runtime expression
override should apply after mixer evaluation and reset the eight facial targets
to zero before selecting its preset. Preserve the separate `cup_*` morph values:
these are rig correctives, not expressions. A return to unanimated Rest resets
all bone transforms and all morph influences, including cup correctives.

Cup weights interpolate from the exact underlying skin triangles. Pose-space
correctives retain their shallow skin attachment through the work reach,
reaction and walk unrolling. Shape keys are initialized from Basis explicitly,
so expressions and correctives never inherit another active key's deformation.
Rest geometry, polygon topology, UVs, material slots and smoothing flags retain
their exact source hashes. Runtime positions/UVs and embedded textures/materials
also match the pre-animation exports; normal differences are below 0.0001.

Tower's shared `createLifecycleEffect` renderer supplies the digital coverage
and temporary cubes. A standalone GLB player displays only the authored pose.
High: 68,180 mesh triangles + up to 32 cubes = 68,564. Low: 3,961 mesh triangles
+ up to three cubes = 3,997. The low version consequently has sparse flying
fragments; both retain the full cell reveal/cut shader. Arrival starts invisible,
completion ends invisible, and disabling effects restores the full-size art.

`validation/review_animation.mjs` uses the actual Inspector for phase captures,
normal playback, loop joins, transitions, replay, seeking, endpoint invisibility,
phone/ground/shadow views, effects disabled, reload and exhausted-budget fallback.
`validation/review_animation_states.mjs` checks independently variable expressions
and 240 runtime walk samples. The measured maximum stance gap is 2.73 mm and
maximum floor penetration is below 0.006 mm. Runtime/source parity is checked by
`validation/audit_runtime_rest.mjs`. These are author checks; user acceptance is
recorded separately in each asset's `validation/visual_review.json`.

The original static milestones remain in each asset's
`revisions/r8_before_mona_animation/` (high) or `r5_before_mona_animation/` (low).
Re-authoring from those static inputs is deliberate; do not run `animate.py` on
an already rigged scene. Subsequent manual source edits use ordinary guarded
export. The static build recipes invoke the animation recipe only when their
supplied manifest declares clips.
