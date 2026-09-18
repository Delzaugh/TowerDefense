# Circuit Garden refinement review

## Pass 1 — world and main-menu hierarchy

The original scene was evenly lit, its markers were small, and the sample run competed with the background. Refined the scene with beveled geometry, graded material faces, directional shadows, faceted trees, a dimensional water feature, and a redesigned floating Product core. Added restrained scene animation and rebuilt the game identity, building pins, Continue panel, and Analyst milestone. Reviewed desktop, laptop, and phone captures.

## Pass 2 — destination screens

The original overlays still looked generic beside the refined world. Added slate game frames with a garden accent, destination-specific headings, dimensional primary actions, and consistent materials. Deployment became a connected progression route with the Analyst milestone; Copilot Lab gained display plinths, numbered slots, and explicit available/locked indicators. Reviewed the resulting desktop and phone screens for Lab, Deployment, and Operations, plus tablet and landscape home layouts.

## Pass 3 — legibility and interaction

Small phone labels retained too much tiny secondary text. Removed that microcopy on narrow screens, enlarged destination names and hit areas, and increased the size of the wave state, New run action, Persona availability labels, and level metadata. Verified final desktop, phone, small-phone, and landscape compositions after those changes.

Browser verification completed using headless Microsoft Edge:

- All four HTML markers and all four SVG building hit regions open their correct destinations.
- Left/right and Enter navigation works; Escape restores focus to the opener.
- Analyst milestone opens the correct unlock details.
- Continue leads to round 4; New run leads to round 1 in the sample planning UI.
- Build, Defend, and Auto update their descriptions and pressed state.
- Future-level preview and Product growth controls work.
- Sound, reduced motion, and higher contrast persist under isolated prototype preferences.
- At 1440×900, 1280×720, 1920×1080, 768×1024, 390×844, 360×640, and 844×390, home controls are unobstructed and the document has no horizontal or vertical overflow.
- No JavaScript page errors during the checked flows.
- Standalone `file://` launch and Continue menu work without the server.

## Follow-up — simplify and maximize the campus

Applied all four browser comments: removed the mock profile, the Headquarters / Circuit Garden information block, and the standalone Analyst milestone tile. Replaced the fixed scene-size cap with viewport-based fitting. At the user's 2193×1272 viewport, the scene is approximately 57% larger. Reviewed captures at that size, desktop, phone, small phone, and landscape; main control centers remain unobstructed. Confirmed the removed elements are absent and all four destination menus still open without JavaScript errors.

## Follow-up — game menu presentation

Reworked all destination overlays after feedback that the rounded pop-ups looked like a web application. Menus now occupy the screen over the actual dimmed campus, with large headings, minimal framing, translucent selections, and clear return navigation. Operations uses numbered ON/OFF rows instead of form toggles; Copilot Lab, Deployment, briefing, Product, and planning share the same treatment. The interface-sound preference is also available in Operations.

Reviewed settings at 2495×1272, 1440×900, and 390×844, plus Lab, Deployment, briefing, and Product captures. Added a 44px touch return button. Verified six viewport sizes including 360×640 and short landscape for horizontal overflow, accessible return controls, pointer toggles, growth controls, and planning. Verified up/down navigation, left/right checkbox adjustment, Enter/Space, focus restoration, synchronized sound state, and persistence. No JavaScript errors in these flows.

These checks cover the UI prototype, not gameplay, real saves, or production game-asset delivery.
