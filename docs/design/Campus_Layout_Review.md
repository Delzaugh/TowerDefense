# Campus layout review — 2026-09-18

## Changes implemented

- Moved the isolated bench beside the remaining park pond, facing the water.
- Moved the park meeting nook alongside its coffee kiosk.
- Removed the pond from the central lab tile.
- Added four reusable arrival pads where the outer paths previously stopped abruptly in grass or paving. Each has a 3.2 m throat, wider clipped court and continuous side/back inlay.
- Strengthened path inspection: exact shared anchors, opposing travel directions and one connected network. The only open port is the lab entrance.
- Kept the existing authored scale, four fixed camera views, companion motion and disabled edge streaks.

Validation passes: 45 exact walkway connections, 12 tile joins, 20 decorative objects without overlapping footprints, 2,304 path contact samples supported by the actual terrain, all camera/hover/motion and phone/touch checks. The scene has 100 static instances. Actual exported arrival-pad iso/top/rear views and desktop/phone compositions were visually inspected.

## Critical assessment

The district colors and connected routes now make the campus easier to understand. The coffee/nook grouping and waterside seating give the moved objects a reason to be there. Arrival pads give the paths a finished shape.

The remaining weakness is everyday activity. Most destinations are stationary individual objects on broad empty surfaces, and repeated planter pedestals make the landscape feel like a display. The two spare tiles are useful future capacity, but currently look inactive. Small props lose their detail at the requested overview scale; adding intricate models alone will not solve that.

On the 390 px phone view, the permanent lab label hides a substantial portion of the campus, while the large pause-stroll card dominates the lower half. The primary home-screen interaction is decorative motion control, rather than returning to the game.

## Five model proposals — not yet created

1. **Campus resident bot.** A small, friendly civilian robot with a warm accent and distinct silhouette from the purple playable Copilot. One reusable model with idle, stroll, wave and seated poses can populate coffee, meeting and lookout spots. Runtime controls routes and pauses; Blender owns poses/clips.
2. **Low flowering garden bed.** A softly clipped, ground-level bed of grasses and coral/yellow flowers. Repeat in restrained clusters at path shoulders and empty lawn corners to soften the hard tile boundaries and reduce reliance on raised tree pedestals.
3. **Warm path bollard.** A short matte fixture with a sheltered amber light and restrained cyan status strip. Place pairs at arrivals and junctions; warmth gives destinations a welcoming cue without bringing back animated perimeter streaks.
4. **Coffee terrace table.** A compact round table with two stools and one oversized mug/laptop detail. Place beside each kiosk and the neighboring nook, giving visitors somewhere to gather and a clearer distinction between coffee and meeting areas.
5. **Community noticeboard.** A sheltered physical board with an inset tech display and a couple of large readable cards. Put it at the park arrival to suggest meetups or campus news. It should read as a gathering destination, distinct from the existing directional signs.

Suggested order: resident bot and garden bed first, followed by lights, cafe furniture and noticeboard. Review each at the current camera scale before adding small details.

## Three home-screen improvements — proposals only

1. **Make returning to the game the primary action.** The large right-hand card should show Continue run, the next objective and relevant progress; move Pause ambience to a small secondary control. Destination highlights should lead to a useful panel or action.
2. **Improve portrait framing and label hierarchy.** Use a compact lab marker until hover/focus/tap, reserve an unobstructed campus region, and test a closer authored portrait composition. Preserve fixed-camera behavior and the comparison presets.
3. **Add purposeful ambient routines.** Residents stroll between destinations, pause for coffee, sit or briefly greet one another; add restrained steam and foliage movement. Keep motion slow, staggered and subordinate to navigation, sharing pause/reduced-motion behavior.

## Arrival-pad delivery

[Inspector](http://127.0.0.1:4174/?asset=campus_walk_landing&version=v01) · [Blender source](../../blender/environment/campus_walk_landing/v01/campus_walk_landing_v01.blend) · [Runtime GLB](../../assets/runtime/environment/campus_walk_landing_v01.glb).

224 triangles, one mesh/material, one embedded 32 × 4 palette texture. Authored source images are packed. Artistic acceptance remains with the user. Phone checks use browser emulation, not physical-device performance profiling.

