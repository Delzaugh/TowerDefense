# Mona / Octocat animation research and proposed Tower direction

Research date: 2026-09-30. Requested by the user to ground our animations in
Mona's movement, attributes and mindset. Applies to `copilot_octocat_2_0/v01`
and `copilot_octocat_2_0_lowpoly/v01`.

**Direction:** a curious, capable inventor with a mischievous streak; soft,
grounded tentacle movement; expressive, purposeful acting; optimism after small
setbacks. Each action should reveal what she notices, tries or learns.

Implementation was subsequently authorized by the user: “apply these to both
2.0 octocats” (2026-09-30). Both versions now have the six baseline clips,
a shared 29-bone five-tentacle rig, independent facial targets, and Tower's
digital assembly/disintegration presentation. The implementation and current
hash-bound review are recorded beside each Blender source. The corrected model
and the new animations still await the user's visual acceptance.

The research below distinguishes published character direction from our Tower
timing and rig choices; the latter are not official GitHub specifications.

## Evidence and confidence

Use current GitHub guidance for present brand context, the animation creators'
published studies for Octocat 2.0 motion, and their first-person accounts for
character intent. A portfolio test demonstrates a possible treatment; it does
not establish a universal gait or timing rule.

| Source | What it establishes | Confidence and scope |
| --- | --- | --- |
| [Tony Jaramillo: Mona](https://www.tonytimetables.com/mona/) | Creator/jester personality; adaptable inventor; construction references | Direct account from the animator and character lead; historical direction |
| [Tony: Hubot 2.0](https://www.tonytimetables.com/hubot-20) | Five-legged locomotion, weight/strength intent, expression and walk studies | Direct production account and public motion studies |
| [GitHub: making the figurine](https://github.blog/news-insights/company-news/from-sticker-to-sculpture-the-making-of-the-octocat-figurine/) | Five tentacles, elastic support, 3D anatomy | Official 2014 production explanation, updated 2021 |
| [Cameron McEfee: The Octocat](https://cameronmcefee.com/work/the-octocat/) | Optimism, fallibility, nonverbal acting, inclusive movement | Former creative director's retrospective; historical rules |
| [GitHub: how we illustrate](https://github.blog/engineering/how-we-illustrate-at-github/) | Developer representation, tenacity, exploration and collaboration | Official 2021 narrative direction |
| [Cameron Foxly: walk cycle](https://dribbble.com/shots/6364613-Octocat-walk-cycle) | Another authored walk treatment; rough/cleanup cadence | Animator's own production note; outline style is a different treatment |
| [Foxly: World-Building](https://dribbble.com/shots/16080750-World-Building-Octocat-Animation) | Later acting/tool-use composition for signup | First-person production note and browser observation |
| [Foxly: Octocat with a Commit](https://dribbble.com/shots/7075035-Octocat-with-a-Commit) | Cat-like play as an occasional accent | Animator explicitly describes it as an unusual emphasis |
| [GitHub mascot guidance](https://brand.github.com/graphic-elements/mascots) | Mona/Copilot distinction; Octocat 2.0 and other eras | Current public brand guidance checked on research date |
| [GitHub motion principles](https://brand.github.com/motion/principles) | Legibility, purpose, rhythm and restraint | Current broad motion identity, not a character rig specification |
| [Foxly interview, Open Source Ready](https://www.heavybit.com/library/podcasts/open-source-ready/ep-29-building-ascii-motion-with-cameron-foxly) | Continuing character stewardship, playful retrofuturist context | First-person interview; taste/context rather than binding character law |

## Character: what motivates the movement

Jaramillo describes Mona through two complementary impulses: an imaginative,
nonconforming inventor and a quick, mischievous jester. Curiosity can help her
or get her into trouble. Her adaptable, organic design makes unfamiliar
technology feel approachable. [Creator's character account](https://www.tonytimetables.com/mona/)

McEfee describes an excited, fallible, optimistic maker who tries to improve
her surroundings despite comic failures. He records a rule against speaking:
context, action and expression carry the emotion. He also encouraged avoiding
stereotypically male or female shapes and movement. The fifth tentacle could
serve as a comic extra hand. Treat these as strong historical direction for
our 2.0 adaptation, rather than claiming a newly issued 2026 rule.
[Creative director's retrospective](https://cameronmcefee.com/work/the-octocat/)

GitHub's illustration story connects Octocats to developers: persistent,
curious explorers who build together. Mona journeys into the unknown with
tools and support. [Official narrative explanation](https://github.blog/engineering/how-we-illustrate-at-github/)

**Our acting translation:** show attention before action, a clear intention
during action, and an intelligible response afterward. A failed attempt can
produce a brief disappointed look, then a renewed attempt. Competence and
humour should coexist. Don't make her perpetually confused, helpless, smug,
angry or mechanically cheerful. These are proposed acting choices, not a
verbatim official list of prohibited emotions.

Foxly's commit-icon example intentionally explores the feline side, which he
says they don't emphasize often. His later interview discusses playful
retrofuturism and small details that resonate with the developer community.
Use an occasional investigative paw-like tap or playful curl when motivated;
constant domestic-cat stalking, grooming or pouncing would narrow the character.
[Commit example](https://dribbble.com/shots/7075035-Octocat-with-a-Commit),
[interview](https://www.heavybit.com/library/podcasts/open-source-ready/ep-29-building-ascii-motion-with-cameron-foxly)

## Anatomy and movement mechanics

GitHub's figurine account settles on five tentacles in a pentagon arrangement.
Their elasticity supports the large head. It acknowledges historical biped,
quadruped and pentaped representations, so an upright pose is compatible with
the character; it does not turn two tentacles into permanently exclusive arms.
Smooth cephalopod skin extends through the head, while ears, whiskers and
prominent eyes preserve identity. [Official 3D anatomy account](https://github.blog/news-insights/company-news/from-sticker-to-sculpture-the-making-of-the-octocat-figurine/)

The [2016 tentacle construction sheet](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/d4eb3f97-d18e-4ed8-bab2-e7b376075b24/11_MONA_tentacle_construction_01.png)
shows a flatter cup-bearing side, five cups per tentacle, fuller distal tips,
and tapering toward the head. Tips can suggest hands or feet. Limbs compress,
curl and squish; extreme bends can fold. This is stylized anatomy, not a
biomechanical model of a real octopus. The sheet is already preserved in our
high-resolution asset's `references/` folder.

The [2016 head construction sheet](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/1553034165786-6QYQBDE5PBPC0KPSQ9Z6/MONA_head_construction_01.png)
builds the head as a softly inflated, flexible rounded block. Its upper and
lower curves differ, and it specifically warns against excessive sideways
skull compression. Head acting can deform subtly without sacrificing its
recognizable volume. Our implementation should preserve the accepted rest
shape rather than remodel it to match every drawing cheat.

**Proposed mechanics:** curl through recovery, extend toward contact, flatten
the supporting underside, then let the support take the head's weight. Lead
deliberate reaches from the base and follow through toward the tip. Keep
continuous curves instead of a visible human elbow/knee. Let the large head
settle after a weight shift; reserve strong squash for an exceptional beat.
Whiskers and ears provide restrained secondary accents.

Don't invent an extra cat tail, humanoid torso or three hidden tentacles. Our
upright rest with two raised tentacles and three supports is a pose choice.
Five-limb grounded locomotion is the recommended starting point for `move`.

## Walk studies: inspected evidence

Jaramillo explicitly calls Mona a pentaped and says his neutral walk was
designed to express weight and strength. In the Hubot story, she is a tinkerer
building a useful robot in her laboratory. These facts connect gait to
capability, and work animation to invention. [Hubot production account](https://www.tonytimetables.com/hubot-20)

The public GIFs were captured from the rendered creator page for frame
analysis. Measurements describe the downloaded GIF containers, not original
production timelines. GIF timing is quantized; it should not be mistaken for
an exact source-frame rate.

| Study | Measured file | Observed motion |
| --- | --- | --- |
| `Octopus_Walk_01.gif` | 960×540; 24 encoded frames; 8 distinct composited images; 960 ms total | At 0–0.08 s limbs gather/curl; 0.16–0.40 s the silhouette opens into extended and supporting arcs; 0.52–0.68 s support shifts beneath the head; 0.76–0.92 s limbs gather again. Head tilt/height responds to the changing base. |
| `SH_08_Rough.gif` | 960×600; 24 encoded frames; 23 distinct composited images; 960 ms total | Side-facing character; a forward tentacle reaches low at 0 s, the base compresses around 0.24–0.32 s, and limbs roll through differing support/recovery shapes around 0.52–0.76 s. Head motion is smaller than the tentacle motion. |

These are visual observations of the sampled studies. Overlapping limbs in a
2D view prevent confidently assigning each contact to a stable named tentacle.
We should block the 3D contact sequence with five limb IDs and verify balance,
rather than pretend this research recovered an exact universal footfall order.

[Pentaped GIF](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/9a8784b2-60ec-4fec-83c8-e374083dc13c/Octopus_Walk_01.gif),
[side rough GIF](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/1a7b1bb3-81ec-474b-ac57-2d796904c307/SH_08_Rough.gif),
[profile pose sheet](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/45415994-d0e7-47a3-84db-a9a15186453d/pentaped_walk_profile_v1-sm.jpg)

Local evidence: [walk frames](../research/mona-octocat-animation-2026-09-30/creator_pentaped_walk_frames.jpg),
[side-study frames](../research/mona-octocat-animation-2026-09-30/creator_locomotion_rough_frames.jpg),
[timing data](../research/mona-octocat-animation-2026-09-30/frame_analysis.json).
Run `analyze_reference_frames.py` with Pillow to reproduce the samples from the
preserved GIFs. Frame numbers are zero-based.

Foxly's separate walk test used 12 fps rough animation and 24 fps cleanup for
web delivery. This reinforces that pose rhythm and final sampling rate are
separate choices. We can author at Tower's 24/30 fps while keeping deliberate
holds and clear accents; uniform interpolation is not automatically faithful.
[Animator's process note](https://dribbble.com/shots/6364613-Octocat-walk-cycle)

## Expression and interaction

The [2014 expression sheet](https://images.squarespace-cdn.com/content/v1/5c87335493a6325711667e99/0cbc0304-994c-474e-a56a-cc1fac399b9f/Colorexpression1-sm.jpg)
contains smiling and laughing faces, wide-eyed/open-mouth surprise, narrowed
eyes, downward glances, and concentrated or displeased poses. Eyes, lids,
mouth, head tilt and ears act together. This is broader than a fixed friendly
smile. The emotional labels here are our reading of the drawing, not labels
printed on the sheet.

The later World-Building example is credited to Foxly for GitHub's signup flow.
Its visible composition places Mona using a handheld tool, holding a separate
display, and looking toward a bright butterfly. The observed browser video
reports 6.666667 seconds duration; sampled playback positions were approximately
2.84 and 5.60 seconds. This is a useful multi-tasking/attention reference, not
evidence for a specific walking gait. We did not reconstruct all action beats
or claim precise frame-by-frame acting measurements for this video.
[Creator's example](https://dribbble.com/shots/16080750-World-Building-Octocat-Animation)

**Proposed expression set:** attentive neutral, interest, focused effort,
surprise, brief concern, amused satisfaction and delight. Define eye direction
and mouth/lid states independently from body clips. Avoid compulsory blinks
on every short loop: repetition becomes conspicuous. If the present face is
an atlas illustration, rigging the head alone will not create these expressions;
expression controls need a deliberate Blender/material design and runtime
compatibility review. Do not promise expressions before that exists.

**Proposed interaction grammar:** notice → inspect → attempt → read result →
adjust or appreciate. Hubot/other tools should complement her agency. A tool
is something she chooses and operates, not something that drags her around.
Use silhouette and eyeline to show what she attends to; tiny technical details
will not communicate the story at game scale.

## Current brand context and limits

Mona and Copilot are separate characters. Our asset IDs retain `copilot_` for
project taxonomy, but this model represents Mona/Octocat 2.0. The current
toolkit groups 2.0 among alternate historical styles while also describing it
as the current internally used Octocat model for illustrations, animation and
stickers. Preserve the selected black/peach 2.0 identity; a newer rendering
style is not authorization to recolour or redesign it. Monamoji are community
reactions, so they are expression references rather than gait specifications.
[Current mascot guidance](https://brand.github.com/graphic-elements/mascots)

GitHub's broad motion guidance balances precision and expression, asks motion
to communicate, and prioritizes legibility and deliberate rhythm. It permits
bounce when motivated by character movement; its warning about generic text
animation should not be misread as a ban on organic character compression.
[Current motion principles](https://brand.github.com/motion/principles)

**Tower translation:** keep routine motion quiet enough for play. Make the
character's intention readable in a short glance. Save bigger accents for
meaningful events. Lifecycle cubes belong to Tower's presentation policy;
the research does not establish cube assembly as Mona's biological movement.

## Proposed six-clip direction

These timings are starting targets for our game, not published GitHub values.
Exact durations and contacts belong in the asset manifest after authoring.
Rest Pose remains an unanimated reset state.

| Clip | Proposed duration | Acting and physical beats | End/contact requirement |
| --- | --- | --- | --- |
| `idle` | 2.0–2.4 s loop | Quiet ready stance, small weight redistribution, restrained investigative head inclination; one subtle tip curl | Stable support; continuous loop; optional gaze/blink separate |
| `work` | 1.4–2.0 s loop | Notice target, brace, precise tentacle operation, inspect result, recover; use two raised limbs for the primary gesture initially | Supports carry weight; purposeful silhouette distinct from idle; action anchor follows the relevant limb |
| `move` | 1.0–1.3 s loop | Five-limb contact sequence, recovery curls and low reaches, small responsive head settle | In-place root; calibrated virtual travel speed; no slipping when simulation translates the character |
| `place` | 0.9–1.2 s one-shot | A compact orienting/readying gesture as Tower's cube assembly reveals the full-size pose | End exactly at ready; no bodily grow-from-zero substitute for presentation coverage |
| `hit` | 0.3–0.5 s one-shot | Brief startled compression/recoil, support catches weight, determined recovery | Return to ready; avoid prolonged distress or ragdoll collapse |
| `resolve` | 0.9–1.2 s one-shot | Calm acknowledgment and compact finishing gesture during reverse cube disintegration | Full-size authored pose; presentation ends invisible; replay resets correctly |

For `work`, the exact tool/action remains dependent on the gameplay role. The
proposed gesture is a maker's focused operation, not a new weapon, prop or
damage mechanic. A fifth-limb comic assist is an optional occasional flourish,
not something to force into every loop.

## Rig and deformation implications

Use the same acting and contact plan for high and low versions. Proposed
starting layout: five chains of about four deform bones each, plus compact
head/base and optional ear controls, within the guide's target of 32 deform
bones. This is a budget estimate; confirm actual topology and deformation
before selecting the final rig. Tool controls can be non-deforming author
controls rather than extra runtime bones.

Cup attachments must follow the tentacle surface without separating at curls.
Low-poly topology may need careful weighting or local corrective deformation;
the 3,961-triangle model must retain its approximate 4,000-triangle budget.
Avoid spending the budget on invisible joints at the expense of the silhouette.
Any necessary rest-topology change reopens model review.

Preserve the repaired face UV boundary during head/base compression and
oblique poses. A shaded sliver appearing under deformation must be diagnosed
as UV/material mapping versus actual geometry intersection; don't assume the
previous atlas correction proves every animated pose is safe.

Blender owns editable rig/actions. Keep the runtime root stationary; simulation
owns movement, facing, timing and outcomes. Preserve independent expressions
and anchors. Use exact shared clip names and Tower's established presentation
effects. No gameplay events should be encoded in these clips.

## Review criteria for the eventual animation pass

1. Review the blocked five-limb walk first, in side, front, rear and overhead
   views. Label limbs; verify contacts and the support beneath the head.
2. Test maximum curls and intermediate bends before polishing. Inspect cup
   attachment, self-intersection, volume loss and the repaired face boundary.
3. Compare both exports at phone/game scale. Head/ear/whisker identity and
   action silhouettes should remain clear without an enlarged viewer.
4. Review several loop cycles and seams at normal speed and frame-stepped.
   Check in-place displacement against intended travel speed and inspect
   idle/work/move/hit transitions.
5. Evaluate acting: can a viewer tell what she notices and attempts? Does a
   setback lead to recovery? Is humour motivated rather than continual noise?
6. Review actual Inspector lifecycle coverage, shadows, replay and Rest Pose
   reset. Bind results to the final source/export hashes and renderer revision.

## Access limitations and unresolved points

- The embedded Hubot Vimeo film displayed unavailable. Its public text,
  expression sheet, profile poses and two locomotion GIFs were inspected;
  this report does not invent film timestamps or claim the full film was watched.
- Automatic approval review denied access to the Google Drive character brief
  because it might be private and access to that specific source was not
  authorized. It was left unopened. Public evidence supports this brief.
- No public source reviewed supplies our exact 3D limb naming/contact order,
  rig weights, game-speed mapping or six Tower clip timings. Those remain
  implementation choices to validate.
- General search also surfaced unrelated Octocat films and unofficial AI
  animation prototypes. They were excluded from character evidence.

The report intentionally separates historical character intent, current brand
context, observed motion, and our proposed adaptation. It should be consulted
before authoring; it is not a certificate of animation fidelity.
