# Classic Octocat Low Poly

## User decisions
The user approved the Classic leg joins, requested a low-poly version capped at 3500 triangles, and explicitly required keeping the high-resolution original. The user then requested animations, Copilot-matched size, and a move animation. This remains the separate github_octocat_classic_lowpoly v01 asset. High-resolution Classic revision 9 source, runtime, manifest and recipes are byte-for-byte preserved; see validation/high_resolution_preserved.json. Modern is outside this work.

## Current revision 7
3490 triangles, 13 meshes, 2 materials, 2 embedded textures, 11 deform bones. Rest dimensions are 1.836 x 1.800 x 0.883 metres. Uniform scale is 0.5851744927 of the approved sculpture, matching Copilot v01 height 1.800289989 metres. Scale is baked into meshes, construction paths, rig, translation keys and accessory anchors; the placement root remains identity.

Keep continuous smooth leg joins, four legs, one raised tail, two eyes, two ears, four whiskers and all 45 six-sided shallow cups. Head is 1000 triangles; body 1200. Textures are a 512 square face map and 32 x 4 palette, packed in Blender and embedded in GLB. The recipe uses the frozen approved high-resolution source in references/approved_classic_r9.blend with an input hash check. Prior low-poly revisions are retained by pipeline milestones.

## Rig and clips
The rig has a motion bone, torso and head controls, two tail controls, four foot controls and two blink controls. Torso influence fades toward each grounded foot; cup weights interpolate the supporting body triangle so the details follow the skin. Nine fitting anchors remain; head, chest and tail anchors follow their relevant bones, while the UI anchor stays stable above the placement root.

- idle: 2.5-second loop with breathing, head and tail sway, and a blink. Feet stay planted.
- move: 1.333-second in-place loop using alternating diagonal pairs. Recovery lifts each pair while the opposite pair travels backward at ground height. Slight body bob and head/tail sway. Root stays stationary; simulation owns world translation and the presentation layer must match playback to travel speed.
- wave: 2.5-second one-shot raised-tail wave, head tilt and blink. Feet stay planted; returns to rest.
- celebrate: 2-second one-shot anticipation, approximately 0.129-metre hop, landing compression and return to rest.

Clips are authored at 24 fps in named muted NLA tracks; source is saved with active action cleared and bones in rest pose. This export contains no gameplay code or automatic state selection.

## Review and limits
Guarded runtime validation passed with no errors or warnings. Personally inspected exported clip poses, blink, opposite wave bends, diagonal step phases, side views exposing joins, airborne and landing poses, and phone-scale views. Compared the resized Octocat beside Copilot in the shared Inspector and left the move clip playing in the dedicated preview.

Every authored frame was checked for grounded contact, foot control agreement, stationary root and matching start/end body poses. Idle and wave feet stay at zero height; move keeps a supporting pair at ground level; celebration lands without penetration. Loop track boundaries differ by less than 1e-16. Source audit and hash-bound visual review are in validation/. High-resolution preservation was rechecked.

Low-poly contours and shallow cups remain visible close up. Eleven bones add skinning cost; draw-call count is unchanged and device performance is not profiled. Locomotion is an in-place art clip; world-speed matching and state transitions are future presentation integration. Technical review is separate from user artistic acceptance.
