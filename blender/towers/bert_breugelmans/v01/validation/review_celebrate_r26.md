# Celebrate refinement review — Bert Breugelmans v01 r26

- Source SHA-256: `f80dab13afef7e3fc96f5088a44989dffa3b3d2eea99b1b299e5459098d5fc0b`
- Runtime SHA-256: `3fa28fc2aec91667c9a09615b82064510b3682bbfb2a6fe8ef9c5daff523a59f`
- Preview: http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01
- Coherent baseline: `../revisions/r24_before_natural_celebrate/`

The performance retains three appreciative claps and uses a four-second one-shot, authored at 24 fps. Contacts are 1.167, 1.667 and 2.250 seconds. The first hand starts and settles slightly ahead of the other. The chest leads the gesture, the head follows, and the hands release on separate timing. Low elbow paths and shorter chest-level reaches replace the raised-elbow mechanical motion. The pelvis shifts 2 cm while baked leg compensation holds the feet in place.

## Visual inspection

Reviewed the actual registered GLB in the shared Inspector and inspected the saved runtime screenshots myself:

- Front sequence: frames 0, 8, 14, 20, 24, 28, 35, 40, 48, 54, 66, 80, 88, 96.
- Close front, isometric and right profile: frames 20, 28, 54, 80, emphasizing palm tilt, wrist rotation, elbow attachment and settling.
- Additional oblique/profile samples: frames 14, 22, 28, 35, 54, 80.
- Reverse: frames 22, 54, 80 for pack and shoulder attachments.
- Unobstructed phone-width contact and the Inspector's small silhouette view.

The low elbows read as relaxed applause, the wrists remain seated in the cuffs, the palms no longer intersect at impact, and the pose transitions return to the existing relaxed stance. The head and pack retain visible clearance. The existing angular low-poly shoulders and static facial smile are preserved, not redesigned. Artistic appeal remains open to user feedback.

## Validation

Shared guarded export passed with no errors or warnings: 3993 / 4000 triangles, four meshes/materials, one 32×16 embedded palette, and 22 bones. Exact clip names and anchors remain intact. `clip-audit.json` confirms animated channels, matching endpoints and no root/base motion.

`celebrate-audit.json` evaluates 193 samples at half-frame increments: no hand-triangle intersections; about 0.00121 m contact clearance measured from vertices to the opposite surface; maximum sole drift 0.00000577 m; elbows at least 0.2505 m below shoulders; largest half-frame local bone rotation about 6.33°. These are sampled checks, not a claim of continuous collision proof. Endpoint matrix error is below 0.000003.

Geometry, UVs, skin weights, packed image bytes and non-Celebrate animation keyframes/handles are exactly unchanged against the retained baseline. `pack-clearance.json` reports zero sampled head/pack triangle intersections across all four clips. Source saved with actions cleared, NLA tracks muted and rest pose restored. No gameplay code changed.

The first export attempt failed on unresolved Playwright; it did not promote. Revision 25 passed the standard pipeline but failed the dedicated hand-contact audit. Its finding is retained in `celebrate_r25/contact-audit-failed.json`. The final r26 fixes that defect and passes the contact audit. Runtime screenshot evidence is in `celebrate_r26/`; user-facing Inspector confirmed r26 and Celebrate playback at 1×.
