# Coffee promise — cinematic polish review

The Home story player now presents a complete 42-second realtime short with ten shots. Copilot and Octocat make a coffee promise; the audience spots approaching Bugs before the characters do; the carrier deploys and restrains Octocat; Copilot attempts a rescue; Octocat looks back during the escape; Copilot holds a determined expression and promises to follow. Home → **Play story scene · 42 sec** opens it. Sound is optional and starts from the sound button.

The scene remains a presentation experiment with no simulation, campaign, progression or save-state dependency. Characters use their existing authoritative models and rigs, with additional acting clips. A future appearance assembler can supply the customised role instance at `createActor`; there is no existing customisation system to bind today.

**What changed**

| Surface | Delivered change |
| --- | --- |
| Copilot | Authored talk, listen, alarm and determination; anchored brief exclamation; failed rescue/recoil; terminal determined pose held through the ending. |
| Octocat | Authored planted talk/startle, airborne struggle and farewell reach; turn toward danger, then back toward Copilot during escape. |
| Bugs | Lurk and grab acting; new baked two-link tripod creep and haul. Clip phase follows accumulated travel. Nominal cycles are .65m / 44 frames and .70m / 32 frames at 24fps. |
| Setting | New authored cafe courtyard, adjoining facades, awning, window trim, paving, planters, foliage, tables and two-coffee callback prop. |
| Capture | New physical carrier; grounded slide-in, separate contact and lift beats, amber restraint bands, lock sparks and anchor-based tow connections. |
| Direction | Tighter ten-shot edit, purposeful close-ups, audience-first threat reveal, anticipation before contact, readable resistance and coffee callback. |
| Presentation | Deterministic 220ms clip blends; optional melodic/tension synthesis and filtered-noise mechanical cues; ending title. |

Twelve cinematic clips were added. Preservation reports beside all three character sources confirm unchanged geometry, materials and original gameplay clip channels. Guarded export, runtime validation and hash-bound author reviews pass for Copilot v02 revision 5, Octocat v01 revision 8, Bug v01 revision 15, courtyard v01 revision 3 and carrier v01 revision 3. Artistic acceptance is pending; these are author checks, not a claim of user approval.

The courtyard has 7,224 triangles / six meshes and the carrier 1,344 triangles / one mesh. Each has one material and a packed 64×4 palette. Editable sources and decisions live under `blender/environment/story_courtyard/v01/` and `blender/environment/story_capture_carrier/v01/`. Cast sources remain in their existing versioned folders. The character animation worker ran on GPT-6.1 Sol / Medium; the two reused scenery/QA workers retained their inherited settings because their active model cannot be changed through the agent tool.

**Audience findings and repairs**

Initial review found a clipped exclamation, a foreground Bug dominating the capture, a carrier floor passing through Octocat during overhead arrival, Copilot intersecting the tray, incorrect approach/farewell facing, a neutral closing expression, and insufficient foot stride for the world travel. Repairs lowered the badge, reframed the action, changed carrier arrival to a ground slide, separated Copilot from the carrier, corrected eyelines, held the final expression, shortened tow travel and authored fuller cinematic gaits.

Root and independent animation/audience review inspected the final desktop/phone lock and tow images and uninterrupted creep, lift and haul sequences. No blocking body/tray collision, knee crossing, distal jerk, gross skating or face obstruction was identified. Rigid foot-edge pivots and restrained facial range remain characteristics of the compact rigs. The thin amber bands remain below Octocat's face.

**Evidence and verification**

- [Final recording](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/final/story-video.webm) covers uninterrupted playback. The browser recorder captures video; enable sound in the app to hear the score and effects.
- [Declared capture manifest](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/evidence.json) covers desktop and emulated-phone alarm, lock and tow states.
- [Pixel and renderer reports](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/final/pixel-summary.json) target the story canvas explicitly. The standard inspector's first-canvas assumption would target the paused campus beneath the dialog, so the existing real-control harness uses the same pixel metrics on CSS-scale story-canvas screenshots. States are reached through the production timeline control and checked against read-only diagnostics; no mutable production hooks were added.
- [Creep](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/final/contact-creep.png), [lift](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/final/contact-lift.png) and [haul](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/final/contact-haul.png) sheets show frames from uninterrupted playback. Labels include actual before/after observation times; screenshot overhead means requested timestamps are not exact frozen samples.
- Five timeline/real-GLB contract tests passed. Eleven desktop/touch browser cases passed before the final restraint mesh addition, including playback, phase timing, replay, loading retry, pause/visibility, focus, cleanup, responsive reduced motion and actual AudioContext lifecycle. The final immutable build reran the three affected audience/motion cases with CLI exit 0; one full-length touch recording is intentionally skipped. The prior runner passed its assertions but hung during Windows web-server teardown; an externally managed preview resolved that teardown. Its port 5187 is now closed. Input/lifecycle evidence remains under `pre-bands/`; reviewed final rendering evidence is under `final/`, with clean-run proof under `final-clean/`. [Current-run metadata](C:/Users/jonas/Documents/ChatGPT/Tower/artifacts/story-polish-20260930/current-run.json) records the matching build/runtime hashes and both runner outcomes. The evidence checker exits 0 and confirms all eleven declared artifacts.
- Typecheck, full lint and dependency boundaries passed. The production build is isolated under this artifact folder to avoid other concurrent tasks' build/output directories. The development app on port 5176 returned HTTP 200 at handoff.

**Measured costs**

The earlier 48-second technical demo sampled 11–43 draw calls and 8,979–19,069 triangles, with browser-observed mean updates of 33.61ms. Final uninterrupted samples report 8–31 calls, 9,713–20,707 triangles, 21–29 geometries and 20–25 textures. The renderer still targets 30fps, caps DPR at 1.5 for narrow views / 2 otherwise, and uses one 1024-pixel shadow light with zero post passes. These measured views stay within the skill's starting desktop and mobile budgets.

Final playback completed in 41.849 seconds after observation began, with 1,235 distinct story-time updates: mean 33.886ms, p95 33.5ms, maximum 91.7ms. This measures browser-observed cadence, not GPU time. GPU was hardware ANGLE/D3D11 on an RTX 3090; phone views were emulated on the same GPU. Physical-phone frame rate, GPU timings and texture-memory bytes are unmeasured.

| Final declared view | Calls | Triangles | Entropy | Edge density | Luminance contrast |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop alarm | 24 | 16,869 | 7.04 | .307 | 199.0 |
| Desktop lock | 31 | 20,707 | 6.91 | .369 | 180.9 |
| Desktop tow | 29 | 20,515 | 6.87 | .326 | 186.3 |
| Phone alarm | 14 | 14,093 | 6.55 | .276 | 183.4 |
| Phone lock | 31 | 20,707 | 6.71 | .310 | 189.4 |
| Phone tow | 28 | 20,371 | 6.43 | .285 | 177.2 |

**Visual scorecard**

Subjective author assessment against the skill's viewed calibration images. Genre equivalents: hero = speaking cast, obstacles = abductors, interactables = capture mechanism. Before uses retained original scene screenshots/motion evidence; after uses the complete declared desktop/phone set and uninterrupted contact review. Pixel metrics support coverage and clarity, not artistic scoring by themselves.

| Category | Before | After | Evidence |
| --- | ---: | ---: | --- |
| Art direction | 2.0 | 2.5 | Warm coffee courtyard, playful dialogue and restrained enemy/force accents form a coherent short. |
| Hero/cast | 2.0 | 2.5 | Recognisable approved models now have authored acting and reaction states; existing facial range remains compact. |
| Enemies | 1.5 | 2.5 | Audience reveal, lurk/grab and measured tripod creep/haul distinguish the threat. |
| Capture interaction | 1.0 | 2.5 | Authored carrier and separate deployment/contact/restraint/lift/tow beats communicate cause and consequence. |
| World | 1.5 | 2.5 | Facades, awning, foreground/midground props and paving replace the sparse floating-stage impression. |
| Materials | 2.0 | 2.0 | Approved character palettes preserved; compact scenery atlases and trim roles remain coherent without rich surface textures. |
| Lighting/render | 1.5 | 2.0 | Warm key, cool fill/rim, contact shadows and disciplined exposure support readable faces; no expensive post chain. |
| VFX/motion | 1.0 | 2.5 | Exclamation, contact pulse/sparks, visible restraint, deterministic blends and distance-linked gait clarify story beats. |
| Player/UI | 2.0 | 2.0 | Existing cinematic transport, subtitles, retry, focus and phone/reduced-motion access retained; ending title added. |
| Performance evidence | 2.0 | 2.5 | Hardware renderer counts, immutable build/capture hashes, exact UI-seek states and full motion observations. |

After average: 2.35 / 3. No automatic visual failure remains in the reviewed capture set. This assesses this isolated stylized short, not the whole game's visual quality.

Dialogue remains subtitled with optional synthesized sound; there is no recorded voice performance or lip-sync rig. Source art and story direction remain editable. Remove the experiment through the Home wiring and story directories described in the rendering README; no save migration is required. Final Blender thumbnail-cache cleanup was checked after production.
