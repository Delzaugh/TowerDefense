# Move animation — revision 20

Runtime SHA-256: `df1eae04f70ea8c107bc88bc22a86fea7c7c6b2040c12bb6909d19614514fe75`

Source SHA-256: `b9a8fef377be9d9c7abea859006dce1580d8eb6f85515945fa6544f49fcacff4`

3977 / 4000 triangles; 4 meshes/materials; 0 textures; 22 bones.

Added move, a 1.333-second looping walk, with articulated hips/knees/ankles and reweighted trousers and shoes. Alternating feet have flat support and toe lift on swing. Relaxed opposing arms, mild pelvis rise/fall and torso rotation give the pack restrained secondary movement. Root/base stay stationary. The source is saved in rest pose with inactive actions and muted NLA tracks; existing idle, work and celebrate_team retain their prior rest endpoints.

Personally reviewed actual runtime move screenshots from side, front, rear and isometric views, including support, swing and cycle boundary; final r20 isometric 0.333 s and side 1.0 s confirm the combined torso sway and foot lift. Additional fixed views and sampled times are in extra-review/, with state bound to this GLB hash. Existing Inspector was refreshed and verified playing move in loop mode, 1.33 s duration, on revision 20.

report.json passes without errors or warnings. clip-audit.json passes all four clips, with matching loop endpoints and zero root/base motion; move deliberately starts in gait pose rather than idle rest. walk-contact.json evaluates all 33 source samples: support-plane error 1.37e-7 m, stance-path error 1.41e-7 m, minimum sole height -1.14e-7 m (floating-point noise), peak sole clearance 0.08968 m. pack-clearance.json finds zero head/hair intersections across all four clips, including 33 move frames.

Limitations: this is in-place visual locomotion; runtime owns translation and should crossfade from/to idle. At 1x, approximately 0.425 m/s matches the authored planted-foot speed. Other travel speeds require presentation playback adjustment. Facial expression stays static and the finger rig remains grouped. Technical and personal review are complete; user artistic acceptance is separate.
