# Ears and smaller shoes — revision 23

Runtime SHA-256: `922439b6cfc563de609e85da066826e448fbdb69487527600a5215ab12375266`

Source SHA-256: `0a608a8a0d5f3c607d3ede694631bc510a0d3c919f36079f61fcdb15f330be52`

3993 / 4000 triangles; 4 meshes/materials; 0 textures; 22 bones.

Both ears are now continuous closed surfaces with a rolled rim and recessed inner bowl, replacing overlapping ellipsoids. Profile review caught the hair crossing the first candidate's concha; final seating moves the bowl clear while keeping the rear embedded in the head. The smaller shoe footprint is 80% of previous length and 88% of previous width. Soles are thinner. The ankle opening was rebuilt to match the trouser cuff, with its upper ring following the shin and lower shoe following the foot.

Personally inspected both close ear profiles, the front face, elevated oblique, close front/side/oblique shoes, move isometric at 0.333 s and rear at 1.0 s, plus phone-scale rest. Current detail captures are in nose-pack/ and whole-model/clip evidence in extra-review/; their state records identify the current runtime. Both interiors are clear of the hair, and the shoes retain cuff coverage through the viewed gait poses.

report.json passes with no errors or warnings. clip-audit.json passes all four clips. walk-contact.json checks 33 source samples: support-plane error below 1.4e-7 m, no meaningful sole penetration, peak swing clearance 0.09289 m. pack-clearance.json reports zero pyramid/head-hair intersections in all four clips. The existing Inspector visibly confirmed revision 23 and move playback.

Technical and personal review complete; artistic acceptance remains separate. Ear folds remain simplified at this game scale; existing static face, grouped finger rig and in-place locomotion limitations remain.
