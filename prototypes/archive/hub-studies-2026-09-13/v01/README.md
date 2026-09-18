# Hub layout studies — v01

Open `index.html` to compare the three concepts, or open any prototype directly. Each HTML file includes its own CSS, JavaScript, icons, and original SVG illustrations. There are no network dependencies or build requirements for viewing.

| Prototype | Layout idea | Primary iteration question |
| --- | --- | --- |
| `01-campus.html` | Bright spatial campus, clickable buildings, persistent continue-run card | Does the hub feel like a place worth returning to? |
| `02-mission-control.html` | Deep teal navigation rail, selectable level cards, large mission preview | Is the next action clear and easy to reach? |
| `03-release-desk.html` | Warm three-column desk, active work ticket, Persona cards, Product photograph | Does the software-team metaphor feel playful and readable? |

## Interactions

- Continue a sample saved run → briefing → planning preview → return to hub.
- Browse levels; Level 01 is available, Scope Creep and Release Friday are clearly labeled future theme concepts.
- Open Developer, Tester, Analyst, and Security details. Analyst unlocks after Level 01; Security remains a future milestone.
- Inspect three illustrative Product growth stages. Growth is visual and grants no combat bonus.
- Change reduced-motion and higher-contrast preferences, saved under a different localStorage key for each prototype.
- Use Escape, the close button, or the backdrop to close dialogs. Focus returns to the opening control. Native dialogs constrain keyboard focus.

The pages use the same sample progress (before round 4 of approximately 8), so layout comparisons are consistent. They do not read or write game saves, run a simulation, or add gameplay systems. The artwork is a UI illustration, not an export or revision of a registered game model. Additional growth-stage visuals and future-level placement are explorations, not new game-design commitments.

## Preview server (optional)

From the repository root:

```powershell
node prototypes/hub/serve.mjs
```

Open [the comparison page](http://127.0.0.1:5186). Set `HUB_PROTOTYPE_PORT` to use a different port.

## Iteration

The authoring source is `build.mjs`. Each layout has separate markup and CSS (`campusPage` / `campusCSS`, `commandPage` / `commandCSS`, `deskPage` / `deskCSS`). Shared dialog interactions, icons, and illustration helpers are copied inline into each delivered HTML file when rebuilt:

```powershell
node prototypes/hub/build.mjs
```

Edit the builder for durable changes; rebuilding overwrites the four generated HTML files. The finished pages can be copied and opened independently. Only the optional “Compare layouts” link expects sibling files.

Design references: `docs/design/00_Master_GDD.md`, `docs/design/Copilot_Agent_Design.md`, `docs/design/levels/Level_01_Just_One_Small_Feature.md`, and `docs/design/Visual_Asset_Guide.md`.
