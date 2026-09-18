# Campus planting and ambient life

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

The existing [Classic Low-Poly Octocat](http://127.0.0.1:4174/?asset=github_octocat_classic_lowpoly&version=v01) (revision 7) and [Lag Spike](http://127.0.0.1:4174/?asset=problem_lag_spike&version=v01) (revision 9) bring the visible character count to five. Their registered sources, materials, rigs, authored scale and clips are unchanged. Octocat follows a 96-second coffee/garden routine, using its source-authored walk clip with distance-based playback, a garden pause, and a greeting at the coffee stop. Lag Spike travels along the park promenade, using its authored stutter-step clip, stopping and turning at either end. These are presentation routines, not combat or gameplay simulation.

- Octocat: [source](../../blender/towers/github_octocat_classic_lowpoly/v01/github_octocat_classic_lowpoly_v01.blend), [runtime](../../assets/runtime/towers/github_octocat_classic_lowpoly_v01.glb).
- Lag Spike: [source](../../blender/enemies/problem_lag_spike/v01/problem_lag_spike_v01.blend), [runtime](../../assets/runtime/enemies/problem_lag_spike_v01.glb).

Wheel zoom follows the pointer and is bounded to 70–500%; plus/minus buttons support keyboard and touch. Dragging pans on the campus plane without rotation. The percentage button resets both pan and zoom. Camera angles remain fixed. Ctrl/Cmd-wheel retains browser zoom behavior. Selecting an angle preserves the chosen campus zoom.

## Verification and limits

Guarded asset validation passed; actual GLB Inspector oblique/rear views and plant breeze extrema were visually inspected. Seven trees were relocated to clear paths, and one park statue was moved to the central courtyard in front of the solar panels. Runtime audits now check all 24 trees against walkway bounds and ground support, 52 prop placements, 2,304 walkway terrain samples, 481 plaza-routine poses and 385 guest poses against actual animated mesh bounds and terrain. The guest and plaza routes occupy separate park/plaza zones. Pause, reduced motion, pointer-anchored zoom, drag pan, 500% limit/reset, four camera angles, building hover, desktop, phone viewport and touch controls passed automated checks with no browser warnings/errors.

Plants are intentionally faceted and restrained. Fine flowers, cups and notices become secondary accents in the wide overview; zoom reveals them. The noticeboard is decorative, without an events panel. Conversation and coffee routines communicate intent through placement and existing clips, not new drinking/talking character animation. Phone screenshots use emulation. See [performance measurements and device-test plan](Campus_Performance.md) for measured cost and remaining physical-device validation.


