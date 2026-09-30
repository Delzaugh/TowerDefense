# Hand quality and relaxed pose — v01 revision 8

Runtime SHA-256: `49e3833038de3df82d8467a8c5fd70dd8a0bafda2d335e1bb95cab89d190cb6c`

Source SHA-256: `97d769752983c17733f75cb4caf62b1c856cc3cecdfae3f7b3f65376d79c73a1`

3482 / 3500 triangles; four opaque meshes/materials; zero textures; 15 bones.

User scope: hand-specific quality improvement, then a relaxed open resting arm pose. The initial grip is superseded by this later explicit request.

Replaced the spherical palms and intersecting digit pieces with continuous hand surfaces. Shared wrist, palm, finger roots/webbing and thumb boundaries stay connected as the two finger stages and thumb articulate. Rounded fingertip bevels, staggered finger lengths, tapered palms and consistent skin color remove the separate-piece appearance. Sleeve ends/cuffs were narrowed and wrist angles adjusted. Relaxed arms now sit lower and slightly outward, palms gently open. Work turns the palms upward; listen curls one hand near the chin; applause uses revised contact spacing.

Personally inspected final exported GLB screenshots in `hands/`: rest front/isometric; work midpoint front/isometric; clap contact at 1.26 s front/isometric; listening right at 1.75 s; intermediate work and open clap positions. These resolve the initial prototype's finger striping/twists and cuff intrusion. Viewed full-model isometric, reverse, listening side and phone silhouette in `extra-review/`. Hands remain readable and attached; the slimmer wrists fit the cuffs. The existing user Inspector tab displayed revision 8, hash 49e3833038de, 3482 triangles.

`hand-topology.json`: both canonical source hands are single connected closed components, 132 vertices and 127 polygon faces each, no nonmanifold edges or zero-area faces. `clip-audit.json`: all four clips have matching endpoints and match the new source rest within floating-point tolerance; root/base motion is zero and intended hand/finger/thumb channels are nonconstant. `report.json`: guarded export passed without errors or warnings.

Limit: finger articulation is grouped at two joints per hand, not independently controlled per finger. Static facial expression remains. Technical and personal visual review are complete; user artistic acceptance is separate.
