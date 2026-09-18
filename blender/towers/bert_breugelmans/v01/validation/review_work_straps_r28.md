# Bert Work and strap review — v01 revision 28

Source SHA-256: `6f62b0a1e8e1992a5a140f0333a1be4c16c0ac1c03f6af76d04bb0925513b339`

Runtime SHA-256: `4cf7919d416f48da30399b1960292ea17c0a4a91bae15c2c500693b51b8141b7`

Preview: http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01

## Result and visual review

Work uses a 0–120-frame / five-second loop: a leading-hand explanation, a second inclusive open-hand gesture, gentle acknowledgment through the head and torso, and a soft settle. It avoids the previous simultaneous mirrored raise. Fingers stay softly open and elbows low. Facial expression remains the existing static smile, without lip sync.

The revised straps use two closed 16-section ribbons with small edge bevels. They seat along the chest and shoulders and wrap around the lower torso, keeping the original direct green-tier anchors. Total: 4361 triangles, within the user's new 4500 maximum. Source edits preserve the rest of the backpack and character. Celebrate keeps its contact times and palm orientations, with a small forward reach and adjusted elbow plane for clearance.

Personally inspected the actual registered runtime screenshots:

- Work front and isometric sequence at frames 0, 12, 24, 38, 52, 64, 76, 92, 108 and 120.
- Work right, left and rear at frames 24, 38, 76 and 108.
- Close Work front, isometric, both profiles and rear at frames 0, 38 and 76.
- Close Celebrate in the same views at frames 22, 28 and 54.
- Unobstructed phone-width Work pose and small silhouette test.

The Work gesture reads as a relaxed explanation, the cuffs remain seated, and the strap route is continuous. Chest/shoulder seating was corrected after an intermediate export showed the straps touching the collar/shirt and sitting too high over the shoulder. The known Celebrate overlap is less conspicuous but remains at tight bends. Full elimination would require further arm or strap deformation changes; the user explicitly allowed this limitation.

Evidence: `work_straps_r28/work_sequence.jpg`, `work_close.jpg`, `strap_clearance.jpg`, `rear_phone.jpg`, individual PNGs and `state.json`. Artistic appeal remains open to user feedback.

## Checks and limitation

Guarded export passes with no loader errors/warnings: 4361 triangles, four meshes/materials, one packed 32×16 palette and 22 bones. `clip-audit.json` passes all four clips, including matching Work endpoints and zero root/base motion.

`straps-work-audit.json` reports zero sleeve/strap intersections in idle (121 samples), move (65), and Work (241). Work has zero measured sole drift, elbows at least 0.3037 m below shoulders, and a largest half-frame local bone change of 2.95 degrees.

**Known non-passing check:** Celebrate retains sleeve/strap intersections in 76 of 193 half-frame samples, up to 56 face-pair intersections. The dedicated strict no-overlap audit remains `passed: false`; it has not been suppressed or relabeled. The user's stated tolerance permits delivery with this disclosed residual clipping. Standard export passing does not imply a collision-free Celebrate clip.

The separate hand-contact audit passes: no hand intersections, approximately 1.2 mm sampled contact clearance at all three claps, and under 0.006 mm sole drift. Head/pack intersection checks pass across every clip. `strap-topology.json` confirms two closed strap components, no nonmanifold edges or zero-area faces, and unchanged non-strap backpack faces/colors.

Character geometry, UVs, weights, packed images and idle/move curves match the retained r26 source. Rig and clip names remain unchanged. Source is saved with actions cleared, NLA muted and rest pose restored. Shared recipe modules preserve these edits for future guarded builds; this delivery used ordinary source export.
