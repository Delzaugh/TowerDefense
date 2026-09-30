# Campus planting and ambient life

## Production home — 2026-09-24

The nine-tile production home contains thirteen characters: the original base Copilot plus three Developer Copilots, three Classic Low-Poly Octocats, three additional base Copilots and three rubber ducks. Canonical models retain their authored scale, materials and animation data; the three ambient duck instances use a 0.5 presentation scale. Each animated clone has its own skeleton and mixer while sharing geometry and textures.

Residents use short, separate strolls through the hill, grove, canyon bridge, plaza, utility yard, park and construction site. Developers use their authored hover/move and work clips; Octocats walk and wave at stops. Base Copilots retain their idle hover during travel. One duck drifts gently on the pond; the other two remain stationary by the garden developer and plaza. No new rig clips were authored.

The plaza Copilot and Octocat now follow a coordinated three-minute routine: coffee, noticeboard visits, a shared conversation, café and sculpture stops, and return. They arrive together, face one another, greet using the existing wave clip, and alternate small cream speech cues. Octocat gait playback follows travel speed. Routes ease into stops and turn at corners; no drinking or talking rig animation is implied by the situation.

Production now plays the existing Blender-authored flower-bed, bush and hedge breeze clips with varied phases. Presentation adds 24 soft coffee-steam wisps, three expanding pond ripples and a fixed pool of 32 leaves near the forest and autumn trees. Leaf gusts have quiet intervals. These effects share textures/geometry where appropriate; no new assets or character clips are authored in this integration.

Quiet digital currents travel along the background grid, with short mint trails and brief glows at intersections. Six routes alternate with no more than two visible currents at once. A single screen-space shader draws the grid and currents behind the campus. The connected campus floats as one group with a slow vertical drift and barely perceptible tilt; terrain joins, props, residents and their effects stay aligned. This presentation transform leaves asset sources and local route coordinates unchanged. Currents and floating share the scene clock and stop with Pause, reduced motion and hidden-page suspension; reduced motion also hides the currents. Integration tests cover connected edges, attached residents, motion bounds, quiet intervals and disposal.

Pause, reduced motion and hidden-page suspension stop all updates through the same 30 FPS scene loop. Reduced motion hides steam, leaves, water and speech effects; it does not override the user's saved ambience preference. Scene disposal releases mixers and deduplicated geometry, materials, textures and instance buffers. The actual-GLB route audit runs a full 180-second cycle in half-second samples and compares paused/resumed canvas images, allowing two colour levels of GPU quantization. See output/campus-life/placement-audit.json. Unit tests cover route continuity, social timing, independent skeletons, effect suspension and disposal. Desktop/touch home checks cover controls, settings and recovery.

## Earlier prototype implementation

Six original low-poly models deliver the five requested asset groups, with separate round-bush and hedge variants. All have editable Blender sources, packed palettes and guarded registered GLB exports. Thirty-two new placements bring the campus to 52 decorative props and 132 static placements.

| Asset | Triangles | Source | Runtime | Inspector |
|---|---:|---|---|---|
| Flowering garden bed | 1,324 | [Blender](../../blender/environment/campus_flower_bed/v01/campus_flower_bed_v01.blend) | [GLB](../../assets/runtime/environment/campus_flower_bed_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_flower_bed&version=v01) |
| Round bush | 108 | [Blender](../../blender/environment/campus_bush_round/v01/campus_bush_round_v01.blend) | [GLB](../../assets/runtime/environment/campus_bush_round_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_bush_round&version=v01) |
| Hedge segment | 268 | [Blender](../../blender/environment/campus_hedge/v01/campus_hedge_v01.blend) | [GLB](../../assets/runtime/environment/campus_hedge_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_hedge&version=v01) |
| Warm path bollard | 156 | [Blender](../../blender/environment/campus_path_bollard/v01/campus_path_bollard_v01.blend) | [GLB](../../assets/runtime/environment/campus_path_bollard_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_path_bollard&version=v01) |
| Café table and stools | 1,088 | [Blender](../../blender/environment/campus_cafe_table/v01/campus_cafe_table_v01.blend) | [GLB](../../assets/runtime/environment/campus_cafe_table_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_cafe_table&version=v01) |
| Community noticeboard | 760 | [Blender](../../blender/environment/campus_noticeboard/v01/campus_noticeboard_v01.blend) | [GLB](../../assets/runtime/environment/campus_noticeboard_v01.glb) | [Preview](http://127.0.0.1:4174/?asset=campus_noticeboard&version=v01) |

Planting frames coffee areas and walking destinations while keeping travel clear. Ten amber fixtures mark gathering places and path approaches; two tables with stools and mugs support the kiosks. Two noticeboards offer recognizable destinations. The central pond remains removed; the park pond remains in place.

Blender owns the four-second in-place plant breeze clips; lower geometry and foundations stay fixed. The application chooses their phase and playback. Warm bollard emission is authored in the source; faint floor light pools and 24 soft steam wisps across café tables and kiosk serving cups are presentation effects.

Two additional canonical Copilots follow a 120-second plaza routine: coffee, noticeboard visits, a shared conversation, a café-table break, a sculpture visit, then a return. Larger cream speech cues alternate between speakers. Steam drifts forward past kiosk awnings and rises 1.9–2.8 metres; its width has a capped overview readability adjustment. The original front-of-lab Copilot stroll is preserved. Pause freezes the entire ambient scene. Reduced motion starts paused with foliage at rest and steam/conversation cues hidden; explicit Resume is a user override. Hidden pages stop requesting animation frames.

## Additional characters and zoom

The existing [Classic Low-Poly Octocat](http://127.0.0.1:4174/?asset=copilot_octocat_classic_lowpoly&version=v01) (revision 7) and [Lag Spike](http://127.0.0.1:4174/?asset=problem_lag_spike&version=v01) (revision 9) bring the visible character count to five. Their registered sources, materials, rigs, authored scale and clips are unchanged. Octocat follows a 96-second coffee/garden routine, using its source-authored walk clip with distance-based playback, a garden pause, and a greeting at the coffee stop. Lag Spike travels along the park promenade, using its authored stutter-step clip, stopping and turning at either end. These are presentation routines, not combat or gameplay simulation.

- Octocat: [source](../../blender/towers/copilot_octocat_classic_lowpoly/v01/copilot_octocat_classic_lowpoly_v01.blend), [runtime](../../assets/runtime/towers/copilot_octocat_classic_lowpoly_v01.glb).
- Lag Spike: [source](../../blender/enemies/problem_lag_spike/v01/problem_lag_spike_v01.blend), [runtime](../../assets/runtime/enemies/problem_lag_spike_v01.glb).

Wheel zoom follows the pointer and is bounded to 70–500%; plus/minus buttons support keyboard and touch. Dragging pans on the campus plane without rotation. The percentage button resets both pan and zoom. Camera angles remain fixed. Ctrl/Cmd-wheel retains browser zoom behavior. Selecting an angle preserves the chosen campus zoom.

## Verification and limits

Guarded asset validation passed; actual GLB Inspector oblique/rear views and plant breeze extrema were visually inspected. Seven trees were relocated to clear paths, and one park statue was moved to the central courtyard in front of the solar panels. Runtime audits now check all 24 trees against walkway bounds and ground support, 52 prop placements, 2,304 walkway terrain samples, 481 plaza-routine poses and 385 guest poses against actual animated mesh bounds and terrain. The guest and plaza routes occupy separate park/plaza zones. Pause, reduced motion, pointer-anchored zoom, drag pan, 500% limit/reset, four camera angles, building hover, desktop, phone viewport and touch controls passed automated checks with no browser warnings/errors.

Plants are intentionally faceted and restrained. Fine flowers, cups and notices become secondary accents in the wide overview; zoom reveals them. The noticeboard is decorative, without an events panel. Conversation and coffee routines communicate intent through placement and existing clips, not new drinking/talking character animation. Phone screenshots use emulation. See [performance measurements and device-test plan](Campus_Performance.md) for measured cost and remaining physical-device validation.


