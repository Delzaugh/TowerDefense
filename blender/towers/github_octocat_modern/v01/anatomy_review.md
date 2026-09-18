# Octocat anatomy and visual review

Reviewed 2026-09-18. This supersedes the rejected revision-4 review.
The supplied images define the visual target; they are not additional instructions.

## Reference interpretation

[GitHub's own sculpting account](https://github.blog/news-insights/company-news/from-sticker-to-sculpture-the-making-of-the-octocat-figurine/)
explicitly settles on five tentacles for its classic 3D figurine. The four new
user images clarify the skull depth, rounded leg transitions, curling tips and
sucker undersides; views can hide a leg behind another, so visible silhouettes
in one projection cannot be used as the total count.

| Anatomy | Classic | Modern |
| --- | --- | --- |
| Supporting legs | 4, arranged as a front and rear pair | 2, forward-facing |
| Arm-like tentacles | 0 | 2, one raised and one curled |
| Tail-like tentacle | 1, raised from the rear toward the left | 1, attached at the rear and curled to the side |
| Total appendages | **5** | **5** |
| Ears / eyes / whiskers | 2 / 2 / 4 | 2 / 2 / 4 |

Modern's two-arm, two-leg, rear-tail arrangement is an interpretation of the
user's modern illustration, not a claim that the classic figurine article
defines every modern pose. There is no extra tail beyond these five parts.

## Part-by-part findings and changes

| Part | Defect in the first delivery | Rebuilt construction and review |
| --- | --- | --- |
| Skull | Shallow extruded silhouette and coarse facets | Rounded volume with substantial rear depth; checked from both profiles and rear. |
| Ears | Block-like outline, later overly conical | Two tapered, thin cat-ear wedges blended into the skull. |
| Face | Layered mask intersected the shell | Face color is on the continuous skull surface, using a packed 1024 px map. Classic retains its broad face; Modern has a shaped forehead and cheek volume. |
| Eyes | Separate protruding spherical buttons | Shallow domes conform to the face, with brown iris surfaces; Modern has small highlights. Checked close and in profile. |
| Nose and smile | Crude surface placement | Small projecting nose and tapered curved mouth, seated on the face. |
| Whiskers | Missing on Classic; later crossed raised appendages | Two tapered curved whiskers per side on both; checked clearance from the tail/raised hand. |
| Torso and roots | Exposed caps and disjoint-looking limb joins | Volume-unioned surfaces with smooth transitions. Modern's low torso nub was removed so it does not imply a third leg. |
| Legs | Angular segmented feet; Modern used three feet | Flowing tapered curves with explicit front/rear identity on Classic and exactly two legs on Modern. |
| Tail | Treated as an interchangeable limb | A named rear-rooted tail in each source; followed from its root to its tip in rear and underside views. |
| Suckers | Sparse flat dots, then crowding and orientation flips | Concave cup rows use arc-distance spacing, transported orientation and actual body-surface seats. Rear Classic rows start below the joined roots. |
| Contact | Some rear feet sat slightly above the floor | Small contact patches bring all supporting legs to z=0 in Blender / y=0 in GLB. |

## Evidence and checks

Both assets have `renders/face_close.png`, `tentacles_close.png`, fixed front,
side, rear and underside captures, phone-width and small-scale renders.
The shared comparison is `renders/octocat_comparison_front.png` beside this file.
These are images of the actual registered GLBs in the shared Asset Inspector.

`validation/source_audit.json` independently checks each authoritative Blender
source: the head and body are each one connected closed shell with no
non-manifold edges; five named construction paths match the five appendages;
all support contacts are on the floor; both textures are packed. Intentional
surface details such as eye patches and seated cups are separate meshes.

`validation/report.json` contains guarded runtime validation, and
`validation/visual_review.json` binds this review to exact source/runtime hashes.
The first high-detail candidate exceeded the initial 75,000-triangle envelope
and was rejected; surface simplification brought the revised model under that
envelope. A rear sucker-seat construction failure was also fixed before delivery.

These are static character sculpts. Rigging, animated deformation, wardrobe meshes
and garment fitting have not been produced or validated. The user requested
quality over the earlier mobile prototype budget; these revisions have not been
profiled in a crowded gameplay scene. Visual acceptance remains the user's choice.
