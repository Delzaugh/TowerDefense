# Architect side-part and detail review

The reference's part hierarchy has not been carried through faithfully. Both sides of the model have the same simplifications. This is mainly a form, seating and visibility problem; adding small decorative marks would not resolve it.

## Comparison

| Part | Reference | Current model | Priority |
|---|---|---|---|
| Indigo crown | Distinct raised arched keystone/ridge with a readable edge around the dome | A broad uninterrupted blue shell; no separate crown edge or arched ridge | High |
| Chalk shoulder | Compact curved armour, defined top/front bevel planes and a shaped descending root | Long extruded slab with a broad nearly flat top and thin pointed front tail | High |
| Upper-to-lower cheek | Shoulder meets a substantial separate lower cheek at a deliberate seam | Upper tail sits beside a thin continuous front border; the lower cheek mass is absent | High |
| Jaw/chin | Thick curved lower cheek sweeps forward and rolls under; substantial central chin | Thin white front band and a small applied indigo chin plate | High; combine with vertical contour correction |
| Cartridge casing | Rounded wraparound/C-shaped casing, controlled cutback around the sensor and dark connecting seat | Rectangular backing block plus successive slate/indigo plates; weak casing cutback and wrap | High |
| Amber sensor | Proud/near-flush capsule within a clearly framed socket; remains visible in the reference oblique angle | Narrow capsule behind a projecting socket lip; it disappears behind that lip in both captured oblique views | High |
| Bridge | Thick bowed part, shaped shoulder junctions, controlled recess mouths | Bridge and recesses exist, but its ends read as an applied bar and junctions are visually abrupt | Medium |
| Rear-shell boundary | Clear curved shell/band transition visible around the accessory and crown | Broad relatively plain rear shell, few distinct transitions | Medium; keep the small approved rear panel |
| Eye seating | Eyes read as fitted luminous elements of the curved display | Capsules project visibly from the shallow face in profile | Medium; refit after face reshaping |

## Camera fairness

The supplied model screenshot is an exact profile. The reference labelled Right is a front-side oblique illustration. Missing amber in an exact profile alone is not evidence of a missing part. Matched opposite-side captures and two symmetric front-side oblique rotations show that the amber exists but becomes hidden too early by its socket. The reference remains illustrative; no exact hidden dimensions or construction mechanisms are inferred.

## Left/right consistency

Matched fixed left/right captures show the same crown, shoulder, casing, frame and chin treatment. Exported vertex positions are nearly mirrored: 8 of 2,207 unique positions lack a mirror at 0.01 mm rounded precision; worst nearest reflected-position difference is 4.64 mm. This is a position-only check, not a proof of identical topology or shading. There is no major one-sided loss of parts.

## Triangle use and correction order

Current delivery is 4,374 / 4,500 triangles, leaving 126. The six small amber markers alone use 552 triangles (12.6% of the model), while important large forms remain simplified. Palette-role counts are not part counts; dark wells, collars and body regions also consume substantial geometry. Reallocate triangles from small capsule support loops and hidden backing surfaces toward visible crown, cheek/jaw and casing contours.

Recommended order:

1. Resolve the stronger vertical crown/display/jaw contour already identified.
2. Restore the distinct crown ridge, compact shoulder and substantial lower cheek/jaw masses.
3. Shape the cartridges as fitted wraparound casings, then seat amber nearer the socket mouth and check its side-angle visibility.
4. Refit bridge ends and eyes to the corrected face. Harmonize bevel width and intentional seams across both sides.
5. Recheck exact profiles, oblique views, rear and phone scale before adding decorative detail.

No production geometry, colours, gameplay or animations changed in this review. Revision 45 hash: af00b5f37467f8ed654607f80c74402534cdf6a77b8ee95aa5313dc90d690b01.

[Supplied model profile](supplied-model.png) · [Supplied reference](supplied-reference.png) · [Left](left.png) · [Right](right.png) · [Oblique A](oblique-a.png) · [Oblique B](oblique-b.png) · [Symmetry measurements](symmetry.json)
