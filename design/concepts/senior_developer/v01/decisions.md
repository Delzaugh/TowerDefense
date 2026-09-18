# Senior Developer concept decisions

## Gameplay classification — 2026-09-17

Explicit user decision: Senior Developer is a future Human Tower concept, separate from the AI-agent Copilot family and its Developer Persona. It is intended to be powerful, very expensive, and limited to one placed on the map at a time. More Human Towers will have their own concepts, roles, and elements; detailed Human / Special Tower mechanics remain deferred. Canonical gameplay classification: `docs/design/Content_Design.md`, “Human Towers and supporting characters”.

## Visual decisions

- Category: Tower.
- The subject must read as a human character, not a robot, monolith, or architecture-only tower.
- The character should feel like a senior technical mentor: mature, capable, friendly, and confident.
- The requested high-energy transformation feeling is expressed through an original golden runtime aura; no recognizable character or franchise-specific design is copied.
- The base model must be designed for a maximum 2,500-triangle budget.
- Aura, sparks, and similar power-up visuals remain runtime effects rather than dense modeled geometry.
- Prefer primitive body masses, one-piece garments, one dominant software metaphor, few materials, and minimal surface detail.
- Options 01 (Golden Compiler) and 03 (Commit Halo) were selected for model-spec-sheet development.
- The model sheets keep unverified technical fields as `-`; `< 2500 tris` is a target ceiling, not a measured count.
