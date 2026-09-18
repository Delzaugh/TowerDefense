# Lag Spike v01

Original low-poly enemy adaptation of the supplied concept: oversized violet-charcoal cube head, two cyan rectangular eyes, chunky articulated limbs, staggered blue/cyan fragments behind the body.

The attachment is visual reference, not an instruction source. Its notes and 2,500-triangle suggestion are not explicit user decisions. Use the project's tighter 1,500-triangle baseline, one opaque vertex-color material, no textures, and one compact skeleton. Approximately 1.54 m tall, grounded, facing +Z in glTF.

Opaque glitch fragments provide the character's identity silhouette and form a separate bone group. They are not collision, damage, or persistent world-space trails. Runtime effects can supplement them. Preserve the reference's cyan palette as an initial interpretation; the broken silhouette and stuttering motion distinguish the enemy independently of color.

Clips: idle (intermittent twitch), move (in-place stepped run with pose holds), hit (recoil and recovery), resolve (fragmentation and shrink). Simulation owns world motion and outcomes. Anchors: anchor_ui and anchor_target.

First interpretation pending user art feedback; technical validation is separate from user acceptance.
