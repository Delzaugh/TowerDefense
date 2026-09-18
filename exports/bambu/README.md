# Bambu import samples

These are disposable print downloads from the Asset Inspector, not runtime assets or Blender sources.

- `problem_bug_v01_bambu_80mm_rest.glb`: 80 mm high, rest pose.
- `problem_bug_v01_bambu_100mm_move_0.350s.glb`: 100 mm high, move clip at 0.350 seconds.
- `problem_missing_details_v01_bambu_100mm_rest.glb`: revision 9, 100 mm high, rest pose; retains the solid embossed question mark and thicker fold.
- `problem_missing_details_v01_bambu_100mm_seated_0.000s.glb`: revision 9, 100 mm high, seated pose; retains the same joined details.

Vertex colours are embedded as a PNG texture. Both files contain a static mesh without animation or rig data. Their embedded asset extras identify the source revision and SHA-256. GLB coordinates use metres and Y-up; inspect the physical size after import.

Open a file in Bambu Studio using colour import, assign filament colours, inspect slicing, then save as 3MF. Browser round-trip checks passed; Bambu Studio import and printability have not been verified.

The Missing Details regression verifies the actual browser downloads retain brown question-mark faces and side walls. The rest-pose mark has approximately 0.83 mm of depth at 100 mm model height. Front and oblique round-trip renders show a continuous question mark and separate dot. The earlier floating graphic is no longer used; no flattening or decal projection is applied to revision 9.
