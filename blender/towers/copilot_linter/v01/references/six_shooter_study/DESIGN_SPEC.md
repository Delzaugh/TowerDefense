# Linter Agent — six-shooter concept specification

This pack refines the user-supplied Linter Agent concept into a six-shooter visual study. The attached image supplies appearance; its embedded eight-emitter text is superseded by the user's explicit six-shooter, 60° request. The current registered runtime model remains the earlier eight-socket revision. This study is a separate Blender source and has not been exported into the game.

## Horizontal coverage contract

**Front = the visor direction, 0°.** Azimuth increases clockwise when viewed from above. Shooter centerlines are at 30°, 90°, 150°, 210°, 270°, and 330°. Each shooter owns a **60° horizontal sector**, from 30° left of its centerline to 30° right. Adjacent sectors share a boundary, so the six sectors tile the full 360° around the tower.

| Shooter | Centerline | Horizontal sector |
| --- | ---: | ---: |
| S1 | 30° | 0°–60° |
| S2 | 90° | 60°–120° |
| S3 | 150° | 120°–180° |
| S4 | 210° | 180°–240° |
| S5 | 270° | 240°–300° |
| S6 | 330° | 300°–360° |

The two forward-quarter pods flank the face. One pod faces each true side, and two sit behind the tower. All six housings have the same lime frame, dark inset, and radial outward orientation. Mount their radial axes independently of the octagonal shell facets so the 60° pitch remains exact. The forward pair sits slightly lower to keep both cyan eye inlays and face indicators visible. The sector diagram specifies the planned horizontal coverage; gameplay range, obstruction, timing, and outcomes belong to the simulation.

## Visual and construction brief

- Low, broad octagonal lime-yellow shell over a dark charcoal stepped lower chassis.
- Dark inset top crown with restrained engraved channels.
- One seated dark front visor with two tapered cyan eye inlays and two small cyan status marks below.
- Six boxy shooter pods around one horizontal ring, with simple dark recessed ports. No limbs or extra emitters.
- Rear construction and concealed attachments are conceptual; no unseen fasteners or internal firing mechanism are specified.
- Preserve the clean low-poly, bright campus palette and readability from a fixed isometric camera at phone scale.

## Measured study mesh

The isolated [Blender concept source](linter_six_shooter_concept.blend) was audited in [concept-audit.json](concept-audit.json): 6 shooter housings, adjacent port centerline pitches within 0.000004° of 60°, 2,364 mesh triangles, 1,252 mesh vertices, 2 material slots, one packed 32 × 4 palette image, and one `PaletteUV` layer. These numbers describe the **concept study**, not the registered runtime GLB. The versioned tower manifest sets a 4,000-triangle ceiling for a later production revision. No final production topology, exported vertex count, or runtime UV has been approved here.

## Sheet set

1. [Specification sheet](linter-spec-sheet.png) — 1536 × 1024 template layout; asterisked statistics are concept-mesh measurements.
2. [Six-angle sheet](linter-six-angle-sheet.png) — consistent renders from the same Blender scene.
3. [Anatomy sheet](linter-anatomy-sheet.png) — external construction and close views.
4. [Shape study](linter-shape-study.png) — six matched silhouettes and contours.
5. [Shooter detail](linter-accessory-shooter.png) — isolated housing and exact coverage plan.
6. [Visor detail](linter-accessory-visor.png) — isolated brow and fitted context.
7. [Coverage plan](linter-coverage-plan.png) — full-size overhead sector diagram.

The in-game panel is an illustrative scale context inherited from the supplied concept image. It is not a runtime capture of the six-shooter study.
