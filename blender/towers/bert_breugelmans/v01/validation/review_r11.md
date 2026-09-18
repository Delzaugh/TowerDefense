# Pyramid, neutral wrists and listening — revision 11

Runtime SHA-256: `b62787063e30350bd59af14590357f2d13a59fd186ecdf67e9c2d4ee11d3e2be`

Source SHA-256: `85a1ebebe1f98d547a8070cf561655b25ac4147e1d7539ea75e444a89e47d1ee`

3529 / 4000 triangles; 4 meshes/materials; 0 textures; 15 bones.

Applied explicit user reference colors in separate pack palette roles: trust #659F38, conflict #508FCC, commitment #FFB900, accountability #999999, results #F17125. Added only requested TRUST label on the outward/rear base face. Planar opaque cut glyphs follow the sloped surface with 0.0015 m clearance; no transparent layers, textures, or extra material.

Neutral hand orientation now aligns the fingers down/forward along each forearm and the palms inward. Both mirrored instances and animation returns use this authored rest. Listen lowers its hand target, loosens the finger curl and guides the elbow forward/below the shoulder. Shoulder-root weights blend into the torso to preserve pack-strap seating when the arm bends. Existing clip names/playback remain intact.

Personally reviewed final Three.js exports: close front/isometric resting hands; close rear TRUST lettering; work at 1.5 s; clap contact at 1.26 s; listen at 1.75 s from front/isometric/right; listen entry, return and endpoint at 0.875, 2.625 and 3.5 s; full model and phone silhouette. Evidence is in `hands/` and `extra-review/`, whose state files identify the loaded hash. Glyphs are clear and seated; resting wrists are neutral; the raised-fist/wing-like elbow pose is removed. Small finger detail and text naturally lose readability at distant game scale.

`report.json` has no errors or warnings. `clip-audit.json` passes all four clips: rest endpoints match within floating-point tolerance and base/root motion remains zero. `listen-motion.json` audits every source frame: elbow remains below the shoulder (minimum separation 0.08977 m); maximum adjacent-frame arm/wrist rotation is 0.20912 radians, without a flip. This numeric audit supplements the viewed poses. Existing user Inspector confirmed revision 11 and listen paused at 1.71 s.

Technical and personal visual review complete; user artistic acceptance is separate. Grouped finger rig and static face remain the existing material limitations.
