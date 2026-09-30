# Game command bar and menu

The shared command bar gives the Hub and Tower inspection one stable composition: leading Copilot identity or Back to Hub, centered location and activity, and compact trailing ambience/settings controls. Production uses the native `GameTopBar` toolkit component and Octicons. The existing Hub camera, ambience, native settings dialog, building approach and inspection return behavior remain wired to their real callbacks.

The interactive concept explores the same structure across Hub, Tower inspection and a future mission. Its game menu offers one contextual return/resume action, appearance, campus ambience, reduced motion and Return to Hub where relevant. It contains no website navigation. System, Light and Dark change the interface palette; the campus capture retains its authored lighting.

The menu overlay, audio button and future mission context are a prototype. Mission name, wave and resource counters are illustrative; they do not claim a playable campaign or supported mission flow. The production Hub and inspection currently retain their existing real controls and settings behavior. Future gameplay pause/audio/menu wiring remains separate implementation work.

The concept uses a capture of the current campus and the existing Developer portrait. Its local controls select the inspection view, return to Hub, open/close the menu, change appearance, ambience and motion, and toggle illustrative audio. Host Tweak controls select the game context and appearance. These interactions do not change gameplay or persistence outside the concept.

Interactive source: [Command bar concept](concepts/ui-primer-2026-09-30/tower-command-bar.html). It defaults to Light and offers Dark and System through the menu and design controls.

Checked in the bundled standalone renderer with Edge at 1,024, 736, 390 and 320 px across all three contexts. The 12 layout checks found no horizontal clipping or JavaScript errors. Menu, appearance, reduced motion, inspection/back and audio interactions passed. Screenshots and `command-bar-review.json` are beside the source. The inline host supplies Lucide icons; the standalone renderer leaves the icon slots empty. Production uses Octicons.
