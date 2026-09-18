# Animation refinement

Read the guide's animation ownership, clip vocabulary and rigging sections, plus this asset's manifest. Static assets need no invented clips. Select only the shared meanings the asset needs; define an asset-specific motion in its manifest if no shared meaning fits. A new shared meaning needs a guide update before export.

Blender is authoritative for the rig, keyframes, timing, names and loop boundaries. Keep clip names exact, lowercase snake_case. Maintain in-place motion with a stationary `root`. Preserve UI/action/target anchors as non-rendering descendants of the root or relevant bone. Keep the rig compact, skin weights valid and mesh transforms applied.

Author named NLA tracks, each containing the corresponding action, for the shared exporter. Save the source with active actions cleared, NLA tracks muted and bones in rest pose. The export runs in isolation and may evaluate the last clip; do not save that evaluated state over the source.

The GLB supplies pose data only. Simulation owns entity position, facing, timing and outcomes. Three.js presentation selects clips, blends and rates in response to simulation; animation completion must never advance gameplay. The manifest records loop/one-shot clip contracts, not state-to-clip gameplay mappings.

Review loop boundaries and several poses across each clip, including contacts and transitions. Numerical validation samples bounds and tests root motion and loop endpoints; it cannot certify visually continuous shoulder attachments or appealing motion. Use the inspector's frame stepping, scrubbing and screenshots for that review.

Choose locomotion from the asset's anatomy and recorded design. Walking, rolling, gliding and hovering have different contact requirements; do not invent steps for a limb-free asset or assume every limb-free asset must hover. For a specified hover, check sustained ground clearance throughout the loop and compatible idle/exit heights. Keep any distinction between grounded authoring rest and hovering playback explicit in the asset record.

At an articulated joint, review rest, maximum bend/twist and the transition between them from an angle that exposes the attachment. Check the actual pivot and parent/weight assignments: the connected surface should not separate, double-transform or expose an unintended socket gap. Preserve deliberate mechanical clearance; do not rigidly weld parts that must move independently. For planted contacts, check sliding and penetration; for hovering parts, check the whole cycle's minimum clearance.

For assets with independent visual-state controls, verify that body clips preserve those states and that reset restores the declared default. Inspect exact one-shot endpoints as well as midpoints. Confirm the exported channels actually animate the intended properties: an existing clip name or passing bounds check can still hide a constant track. Keep discrete state switches and smooth body motion independently interpolated when both are present.
