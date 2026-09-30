/** Editable staging for a standalone short; this is not campaign canon. */
export const STORY_DURATION = 42;
export const STORY_SHOT_TIMES = [0, 6, 10, 14, 18, 21, 26, 30, 35, 39] as const;
export const STORY_BEATS = { notice: 14, turn: 18, grab: 21, lock: 23, lift: 24, rescue: 24.5, tow: 30, exit: 35, resolve: 35, title: 39 } as const;
export const STORY_TOW_DISTANCE = 4;
export type StoryRole = 'copilot' | 'octocat' | 'bug-left' | 'bug-right';
export type StoryPoint = readonly [number, number, number];
export type StoryClip = 'idle' | 'move' | 'hit' | 'rest' | 'story_talk' | 'story_listen' | 'story_alarm' | 'story_determined' | 'story_startle' | 'story_struggle' | 'story_reach' | 'story_lurk' | 'story_grab' | 'story_haul' | 'story_creep';
export interface StoryPose {
  readonly position: StoryPoint;
  readonly heading: number;
  readonly clip: StoryClip;
  readonly clipTime: number;
  readonly visible: boolean;
  /** Absolute-time blend, so scrubbing backwards gives exactly the same pose. */
  readonly blend?: { readonly clip: StoryClip; readonly clipTime: number; readonly weight: number } | undefined;
}
export interface StoryShot {
  readonly start: number; readonly end: number; readonly name: string;
  readonly camera: StoryPoint; readonly cameraEnd: StoryPoint;
  readonly target: StoryPoint; readonly targetEnd: StoryPoint; readonly fov: number;
}
export const STORY_SHOTS: readonly StoryShot[] = [
  { start: 0, end: 6, name: 'Coffee before code', camera: [4.5, 2.55, 8.8], cameraEnd: [3.9, 2.4, 8.1], target: [0, 1.15, 0], targetEnd: [0, 1.15, 0], fov: 33 },
  { start: 6, end: 10, name: 'One tiny feature', camera: [-.8, 1.95, 5.4], cameraEnd: [-.6, 1.9, 5], target: [1.4, 1.15, 0], targetEnd: [1.4, 1.15, 0], fov: 30 },
  { start: 10, end: 14, name: 'Uninvited guests', camera: [-.25, 1.5, -1.3], cameraEnd: [-.55, 1.45, -1.8], target: [-2.2, .72, -4.7], targetEnd: [-2.2, .72, -4.2], fov: 36 },
  { start: 14, end: 18, name: 'Something is wrong', camera: [1.7, 2.05, 5], cameraEnd: [1.2, 1.95, 4.5], target: [-1.5, 1.3, 0], targetEnd: [-1.5, 1.3, 0], fov: 32 },
  { start: 18, end: 21, name: 'Not the coffee people', camera: [4.9, 2.05, 5.3], cameraEnd: [4.5, 1.95, 4.9], target: [1.5, 1.1, -.2], targetEnd: [1.7, 1.1, -.3], fov: 34 },
  { start: 21, end: 26, name: 'The trap closes', camera: [.8, 2.65, 8.7], cameraEnd: [.6, 2.35, 8.1], target: [1.4, 1.15, 0], targetEnd: [1.4, 1.4, 0], fov: 37 },
  { start: 26, end: 30, name: 'Just out of reach', camera: [-.3, 2.5, 9], cameraEnd: [-.1, 2.35, 8.7], target: [.6, 1.25, .3], targetEnd: [.65, 1.3, .3], fov: 37 },
  { start: 30, end: 35, name: 'Carried away', camera: [.5, 2.8, 9.4], cameraEnd: [4.3, 2.8, 8.2], target: [2.4, 1.3, 0], targetEnd: [5.3, 1.3, 0], fov: 39 },
  { start: 35, end: 39, name: 'A promise is a promise', camera: [1.4, 2, 6.6], cameraEnd: [1, 1.9, 6.1], target: [-1.7, 1.15, 1.3], targetEnd: [-1.7, 1.2, 1.3], fov: 31 },
  { start: 39, end: 42, name: 'To be continued', camera: [1, 1.9, 6.1], cameraEnd: [.85, 1.88, 5.85], target: [-1.7, 1.2, 1.3], targetEnd: [-1.7, 1.2, 1.3], fov: 31 },
];
const LINES = [
  { start: .8, end: 5.5, speaker: 'Base Copilot', text: 'All checks green. Coffee?' },
  { start: 6.3, end: 9.6, speaker: 'Octocat', text: 'After one tiny feature. Promise?' },
  { start: 10.1, end: 13.6, speaker: 'Base Copilot', text: 'Promise. What could possibly go wrong?' },
  { start: 14.8, end: 17.7, speaker: 'Base Copilot', text: 'Octocat… behind you!' },
  { start: 18.5, end: 20.8, speaker: 'Octocat', text: "Those aren't the coffee people." },
  { start: 23.2, end: 25.8, speaker: 'Octocat', text: 'This was definitely not in the brief!' },
  { start: 26.5, end: 29.4, speaker: 'Base Copilot', text: 'Hey! That is my teammate!' },
  { start: 30.7, end: 33.4, speaker: 'Octocat', text: 'You still owe me that coffee!' },
  { start: 35.8, end: 38.7, speaker: 'Base Copilot', text: 'A promise is a promise. I’m coming.' },
  { start: 39, end: 42.01, speaker: null, text: 'TO BE CONTINUED' },
] as const;
export const clampStoryTime = (time: number) => Math.max(0, Math.min(STORY_DURATION, Number.isFinite(time) ? time : 0));
const smooth = (t: number) => t * t * (3 - 2 * t);
export const storyProgress = (time: number, start: number, end: number) => smooth(Math.max(0, Math.min(1, (time - start) / (end - start))));
export const storyLerp = (a: number, b: number, p: number) => a + (b - a) * p;
export function storyPointLerp(a: StoryPoint, b: StoryPoint, p: number): StoryPoint {
  return [storyLerp(a[0], b[0], p), storyLerp(a[1], b[1], p), storyLerp(a[2], b[2], p)];
}
export function storyFrame(time: number) {
  const t = clampStoryTime(time);
  const shot = STORY_SHOTS.find(s => t >= s.start && t < s.end) ?? STORY_SHOTS[STORY_SHOTS.length - 1]!;
  const line = LINES.find(l => t >= l.start && t < l.end);
  return { time: t, duration: STORY_DURATION, shot: shot.name, speaker: line?.speaker ?? null, caption: line?.text ?? '', finished: t >= STORY_DURATION };
}
export function storyCamera(time: number) {
  const t = clampStoryTime(time);
  const shot = STORY_SHOTS.find(s => t >= s.start && t < s.end) ?? STORY_SHOTS[STORY_SHOTS.length - 1]!;
  const p = storyProgress(t, shot.start, shot.end);
  return { position: storyPointLerp(shot.camera, shot.cameraEnd, p), target: storyPointLerp(shot.target, shot.targetEnd, p), fov: shot.fov };
}
type Performance = readonly [start: number, clip: StoryClip, offset?: number];
function performanceAt(t: number, beats: readonly Performance[]) {
  let index = beats.length - 1;
  while (index > 0 && t < beats[index]![0]) index--;
  const current = beats[index]!;
  const p = storyProgress(t, current[0], current[0] + .22);
  const previous = beats[index - 1];
  return { clip: current[1], clipTime: t - current[0] + (current[2] ?? 0),
    blend: previous && p < 1 ? { clip: previous[1], clipTime: t - previous[0] + (previous[2] ?? 0), weight: 1 - p } : undefined };
}
const COPILOT: readonly Performance[] = [[0, 'story_talk'], [6, 'story_listen'], [10, 'story_talk'], [14, 'story_alarm'], [15.5, 'story_listen'], [24.5, 'move'], [26, 'hit'], [26.75, 'story_listen'], [35, 'story_determined']];
const CAT: readonly Performance[] = [[0, 'idle'], [6, 'story_talk'], [10, 'idle'], [18, 'story_startle'], [19.5, 'story_talk'], [21.6, 'story_startle'], [24, 'story_struggle'], [30, 'story_reach'], [32, 'story_struggle']];
/** The rear-left aisle and front-right flank avoid the authored planter/furniture
 * envelopes. Keep each approach straight so travel distance and planted stride
 * phase remain exact; facing follows that segment until the arrival turn. */
export const STORY_BUG_APPROACH = {
  'bug-left': { start: [-2.2, 0, -5.05], end: [-2.2, 0, -3.4], startTime: 10, endTime: 18 },
  'bug-right': { start: [8.2, 0, 2.9], end: [4.7, 0, 1.3], startTime: 14, endTime: 21 },
} as const;
/** World blocking is independent of the authoritative Blender rig. */
export function storyPose(role: StoryRole, time: number): StoryPose {
  const t = clampStoryTime(time);
  const escape = storyProgress(t, STORY_BEATS.tow, STORY_BEATS.exit);
  if (role === 'copilot') {
    const rescue = storyProgress(t, 24.5, 26);
    return { position: [storyLerp(-1.5, -1.7, rescue), 0, storyLerp(0, 1.3, rescue)],
      heading: t < 14 ? .55 : t < 35 ? storyLerp(.55, 1.2, storyProgress(t, 14, 15)) : storyLerp(1.2, .45, storyProgress(t, 35, 35.5)),
      ...performanceAt(t, COPILOT), visible: true };
  }
  if (role === 'octocat') {
    return { position: [1.4 + STORY_TOW_DISTANCE * escape, .58 * storyProgress(t, 24, 25.2), 0],
      heading: t < 29.6 ? storyLerp(-.55, .85, storyProgress(t, 18, 19))
        : storyLerp(.85, -.8, storyProgress(t, 29.6, 30.3)), ...performanceAt(t, CAT), visible: t < STORY_BEATS.exit };
  }
  const right = role === 'bug-right';
  const route = STORY_BUG_APPROACH[role];
  const start = route.startTime;
  const arrival = route.endTime;
  const approach = storyProgress(t, start, arrival);
  const point = storyPointLerp(route.start, route.end, approach);
  const travelHeading = Math.atan2(route.end[0] - route.start[0], route.end[2] - route.start[2]);
  const facingCat = Math.atan2(1.4 - route.end[0], -route.end[2]);
  // Same travel as the captive keeps the tow connection taut throughout escape.
  const acting = performanceAt(t, [[0, 'story_lurk'], [start, 'story_creep'], ...(arrival < 21 ? [[arrival, 'story_lurk']] as readonly Performance[] : []), [21, 'story_grab'], [22.5, 'story_lurk'], [30, 'story_haul']]);
  const approachDistance = Math.hypot(route.end[0] - route.start[0], route.end[2] - route.start[2]) * approach;
  const creepTime = approachDistance / .65 * (11 / 6);
  const haulTime = STORY_TOW_DISTANCE * escape / .7 * (4 / 3);
  return { position: [point[0] + STORY_TOW_DISTANCE * escape, 0, point[2]],
    heading: t < arrival ? travelHeading
      : t < 29 ? storyLerp(travelHeading, facingCat, storyProgress(t, arrival, arrival + (right ? .4 : .8)))
      : storyLerp(facingCat, Math.PI / 2, storyProgress(t, 29, 30)),
    ...acting,
    clipTime: acting.clip === 'story_creep' ? creepTime : acting.clip === 'story_haul' ? haulTime : acting.clipTime,
    blend: acting.blend?.clip === 'story_creep' ? { ...acting.blend, clipTime: creepTime } : acting.blend,
    visible: t >= start && t < STORY_BEATS.exit };
}
export function captureProgress(time: number): number {
  const t = clampStoryTime(time);
  return t >= 21.6 && t < STORY_BEATS.exit ? storyProgress(t, 21.6, STORY_BEATS.lock) : 0;
}
