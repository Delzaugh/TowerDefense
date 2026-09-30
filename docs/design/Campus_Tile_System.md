# Campus tile surfaces

The campus is a family of terrain tiles sharing one structural frame and connection interface. The foundation establishes the floating campus identity; the interior establishes each district's character.

## Delivered surface: mineral composite

campus_base_hex v01 uses a matte, blue-slate composite with fine grain, restrained mineral variation and sparse aggregate flecks. It retains the approved mean ground color (#354B64). Texture contrast fades toward a 1.4 m boundary band so neighboring tiles have quiet, consistent edges. There is no surface grid or painted road network.

The source has one packed 512 × 512 atlas: a spatial surface region plus four solid palette swatches for the frame and flat side faces. UVs use the same physical scale over a 36 m tile span. The GLB remains 108 triangles, one mesh, one material and one embedded image. Roughness is 0.92. Six legal 60° instance orientations soften repeated texture patterns without altering the hex footprint.

The Blender image and surface.py are editable sources. Solid frame swatches remain exposed in the Inspector. The textured top is edited in the packed image or recipe; changing the Inspector's flat ground swatch does not recolor the spatial surface region. Automatic solid-palette repacking is disabled for this asset because its recipe now owns the full atlas. Guarded rebuild/source-hash checks remain active.

## Shared frame and joining rules

- Hex circumradius: 18 m. Foundation thickness and edge surface: 1.20 m.
- Six existing edge-midpoint anchors and anchor_surface retain their exact interface.
- Keep the outer 1.4 m band level at y=1.20 m. Interior terrain must return to that band without cliffs or overlapping faces.
- Terrain textures reach a narrow muted neutral edge (#8C9084): 0.06 m quiet margin and 0.48 m blend into each terrain. This supersedes the broad slate surface border. The level structural boundary and void grid remain unchanged.
- Do not scale buildings, walkways or the Copilot to fit a terrain variant.
- A terrain variant is its own registered Blender/GLB asset with the same root, frame dimensions and joining anchors.
- Raised surfaces own actual geometry and surface heights. Do not fake a hill with only a painted image or place props using the flat tile height.
- A road crosses tile boundaries at a planned port at y=1.20 m. Use authored ramps inside a hill tile where its paths climb.
- The grid belongs to the surrounding void, not any tile surface.

## Surface families

| Family | Interior direction | Connection and placement rule | Status |
| --- | --- | --- | --- |
| Campus / utility | Matte slate mineral composite; subdued fine aggregate | Entire top level; free building placement at the existing surface | Implemented |
| Park | Muted sage grass, gentle variation and a gravel collar | Level interior; independently placed furniture, planting and paths | Implemented: campus_tile_park |
| Plaza | Warm matte stone inside the common slate frame | Level interior for coffee stands and social gathering areas | Implemented: campus_tile_plaza |
| Hill | Two asymmetric faceted mounds with grass and restrained stone tones | Up to 3.78 m delivered rise; flat central north/south corridor and level boundary | Implemented: campus_tile_hill |

A park gets its identity from grass, planting and paths; a hill gets its identity from silhouette and elevation. Both should use quieter texture than buildings and moving characters. Avoid high-frequency noise, a different scale of grain on every tile, or a mandatory path printed into the shared base.

## Production home expansion — 2026-09-24

The latest production composition is v03: nine tiles. `campus_tile_forest` occupies axial (0,-2) at ground-root y=0, extending the hill's north/south route to the woodland clearing at z=-63. It uses the delivered 42-tree forest assembly without stacking another terrain underneath. Seven grounded pine, spreading and autumn trees sit at y=1.20 in the park, grove and plaza. The original planted trees remain in place. Fourteen occupied-neighbor joins are checked against exported anchors, and every route port connects except the intentional lab doorway end. Home and Top include the northern extension; Reset centres the full campus at z=0.

### Earlier v02 expansion

The previous production composition v02 introduced eight tiles and 159 static placements. The earlier prototype described below remains a separate composition.

| Section | Axial tile | Buildings and décor | Route |
| --- | --- | --- | --- |
| Civic Plaza | (0,0) | Existing core lab and solar panels; new portal monument, paired benches and planters on broad stone paving | Existing lab loop preserved |
| Canyon | (-1,1) | Layered cut basin, shallow riverbed, bridge, survey shelter and sparse planting | Grove road continues over bridge at world x=-28, z9..21 |
| Construction Site | (0,2) | Unfinished structural frame, crane, site office, material stacks and barriers | South park promenade extends at world x=4 to landing z65 |
| Utility Yard | (1,-1) | Service building, power and cooling equipment, maintenance details | East promenade branches north at world x=28 |

The four new tile IDs are campus_tile_civic, campus_tile_canyon, campus_tile_construction and campus_tile_utility. Their separate campus_*_decor assemblies share tile-centred origins and sit at world y1.2. All are registered environment assets with editable Blender sources, packed texture images and guarded GLB exports. No buildings or walkways are scaled to fit. The two former placeholder trees were removed from the canyon and utility footprints.

Every boundary retains the 18 m hex radius and six level edge anchors at y1.2. The seven terrain profiles now share a narrow neutral surface transition and roughness0.92, with the original slate restricted to the structural sides. Utility has full concrete paving, broad expansion joints, painted service bays and flush drainage details. The test in game/tests/integration/campusConnections.test.ts verifies all 13 occupied-neighbor joins from actual exported anchors and the complete route endpoint network, including both canyon bridge ends. The one intentionally open route end enters the lab doorway.

Home and Top framing cover the extended campus; Reset recentres at z=15.588457. Lighting keeps its established direction with a wider shadow volume. New art reviews remain separate from user artistic acceptance.

## Earlier prototype assembly

Each placement carries tile metadata (q, r, profile) independently of its asset ID. Neighbor positions use x=27q and z=18sqrt(3)(r+q/2). The connection audit computes expected edge pairs from occupied axial neighbors rather than assuming a seven-tile map or a particular model name.

The seven-tile layout now uses three mineral-composite foundations, two park tiles, one plaza and one hill. Four promenades extend the lab loop: south to the park commons, east to the coffee plaza, west to the collaboration grove, and north through the hill corridor. The two spare slate tiles retain space for future buildings.

Twenty existing decorative assets are placed at their authored scale: two coffee kiosks, seven planter benches, two code sculptures, four meeting nooks and five wayfinding signs. Trees, one park pond and the original solar panels support the composition. The original layout had 100 static instances plus the canonical animated Copilot; the current ambient-life pass has 132 static instances and five characters (see Campus_Ambient_Life.md). The layout has 45 exact walkway connections and 12 joined tile edges.

The hill interior is real geometry, with a flat route through its center (local |x| <= 3.5 m). All current furniture sits on checked level ground. A raycast audit verifies actual exported terrain under furniture footprints and 2,304 walkway contact vertices; furniture footprints do not overlap the other placed objects or paths. General terrain placement, hill climbing and unlock progression remain outside this prototype.

Each new tile is 920 triangles, one mesh, one material and one packed 512 × 512 atlas. The shared recipe is tools/asset-recipes/campus-terrain.py. Source images are packed and runtime images embedded. Structural swatches are independently editable; the spatial terrain colors are edited through the packed image or recipe.

Validation: prototypes/campus-3d/verify.cjs covers the mixed tile joins, an eight-tile growth fixture, placements, paths, preserved character scale, camera controls, hover, reduced motion and desktop/phone/touch layouts. Placement evidence is previews/placement-audit.json. These checks and the Inspector visual review do not imply user artistic approval or physical-device performance profiling.

## Source and review

| Tile | Editable source | Runtime | Shared preview |
| --- | --- | --- | --- |
| Park | [Blender](../../blender/environment/campus_tile_park/v01/campus_tile_park_v01.blend) | [GLB](../../assets/runtime/environment/campus_tile_park_v01.glb) | [Inspector](http://127.0.0.1:4174/?asset=campus_tile_park&version=v01) |
| Plaza | [Blender](../../blender/environment/campus_tile_plaza/v01/campus_tile_plaza_v01.blend) | [GLB](../../assets/runtime/environment/campus_tile_plaza_v01.glb) | [Inspector](http://127.0.0.1:4174/?asset=campus_tile_plaza&version=v01) |
| Hill | [Blender](../../blender/environment/campus_tile_hill/v01/campus_tile_hill_v01.blend) | [GLB](../../assets/runtime/environment/campus_tile_hill_v01.glb) | [Inspector](http://127.0.0.1:4174/?asset=campus_tile_hill&version=v01) |

- [Blender source](../../blender/environment/campus_base_hex/v01/campus_base_hex_v01.blend)
- [Runtime GLB](../../assets/runtime/environment/campus_base_hex_v01.glb)
- [Surface recipe](../../blender/environment/campus_base_hex/v01/surface.py)
- [Asset Inspector](http://127.0.0.1:4174/?asset=campus_base_hex&version=v01)
- [Source review record](../../blender/environment/campus_base_hex/v01/validation/visual-review.json)



Latest placement review: isolated bench relocated to the park pond; park meeting nook grouped with its coffee kiosk; central pond removed. Four registered campus_walk_landing models finish the outer routes. Join checks now include opposing directions and whole-network connectivity. See [Campus layout review]( Campus_Layout_Review.md ) for five proposed models and three home-screen improvements.
