# Story preview evidence — 30 September 2026

Nine desktop/touch checks passed; one redundant touch full-length recording was skipped. Four content timeline tests also passed.

The 48-second story completed naturally in about 48 seconds. The browser observer saw 1427 presentation updates: mean 33.61ms, p95 33.60ms, maximum 41.70ms. These are distinct story-time changes observed via browser requestAnimationFrame, not GPU timings or a physical-phone benchmark.

The scene remains isolated from campaign/save state. Checks cover enemy lazy download, failed GLB retry, capture and terminal actors, pause/scrub/replay, optional sound toggle, Skip/Escape focus restoration, campus pause/resume, diagnostic cleanup, visibility pause and static reduced-motion controls. Phone screenshots cover 390x844 portrait and 844x390 landscape.

video.webm records uninterrupted desktop playback. story-motion-8s/20s/31s/37s/43s.png are screenshots taken during that playback, without seeking or forcing poses. current-run.json records the tested build hashes and artifact inventory.
