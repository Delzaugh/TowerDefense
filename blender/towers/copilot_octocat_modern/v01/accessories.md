# Octocat accessory fit plan

Both static bases provide the same named slots. These names describe a purpose;
the positions and fit are specific to each model. The original reference images
remain the source for character identity. Clothing below is a proposed extension.

| Slot | Suitable items | Fitting rule |
| --- | --- | --- |
| `anchor_hat` | Small cap, beanie, hard hat, wizard hat | Seat between ears. Use ear openings for a full-width crown. Do not scale one hat uniformly across both heads. |
| `anchor_face` | Glasses, goggles | Fit frame width to the two eyes and keep the pupils and smile visible. |
| `anchor_chest` | Shirt, vest, hoodie body | Open bottom, wide neck, side openings around arm/tentacle roots. Maintain a small positive clearance from the torso. |
| `anchor_back` | Backpack, cape fastening | Mount on upper back; clear the head and lower tentacles. |
| `anchor_hand_left`, `anchor_hand_right` | Mug, laptop, tool | Use a fitted grip transform. Classic has one raised tentacle; its right slot is a future pose/rig provision. |

## First wardrobe proposal

Start with a teal short-sleeve shirt and a small brimmed cap. Use an open-sided
vest shape for Classic's short torso; use a longer tapered shirt for Modern.
The Modern sleeves should follow the existing raised-arm pose. The cap should
have a narrow center crown so both ears remain recognizable from above.
Colors can share the body palette convention, with an accessory atlas for
additional garment roles.

## Assembly and future animation

Keep each garment in its own named Blender collection, with fit transforms
recorded for each style. During authoring, attach rigid accessories to their slot.
When rigging is added, parent hat/glasses slots to the head bone, hand slots to
the appropriate tentacle bone, and skin shirts with the torso and shoulder
weights. An empty alone cannot make a shirt deform correctly.

The revised exports contain 13 meshes for Classic and 17 for Modern, with nine
attachment/gameplay empty nodes each, no accessory meshes, skeleton, or garment
selection UI. Named body vertex groups and five source construction paths preserve
the appendage identities for the next rigging pass. Future wardrobe
deliveries must retain the canonical catalog layout and guarded export flow;
unregistered loose GLBs cannot be loaded by the Inspector.

The quality rebuild changed both head volumes and slot positions. Read the
current `anchor_hat` transform from the source; the older cap-fit numbers are
obsolete. Model heights are now about 3.073 m (Classic) and 3.458 m (Modern). Hat
clearance must be tested from front, top and rear, followed by relevant motion
extremes once clips exist. Shirt fit must be checked from behind and under arms.

Choose garment density to match the smooth revised bodies. The user explicitly
prioritized quality over the original low-poly limits; prior 150–400-triangle
wardrobe suggestions are not constraints. Keep the bare model usable by itself.
