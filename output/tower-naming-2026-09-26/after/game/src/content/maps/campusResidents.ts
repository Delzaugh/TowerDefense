/** Ambient presentation routes and instance transforms; canonical character assets are unchanged. */
import type { CampusRoutine } from './campusRoutines';
export type CampusResidentAsset = 'copilot_base' | 'copilot_developer' | 'copilot_octocat_classic_lowpoly' | 'copilot_rubber_duck';
type Point = readonly [number, number, number];
export interface CampusResident {
  readonly name: string;
  readonly asset: CampusResidentAsset;
  readonly start: Point;
  readonly end?: Point;
  readonly facing: number;
  readonly travel?: number;
  readonly pause?: number;
  readonly phase: number;
  readonly activity?: 'idle' | 'work' | 'wave';
  readonly float?: boolean;
  readonly presentationScale?: number;
  readonly routine?: CampusRoutine;
}

export const CAMPUS_RESIDENTS: readonly CampusResident[] = [
  { name: 'developer-utility', asset: 'copilot_developer', start: [28,1.28,-19], end: [28,1.28,-7], facing: 0, travel: 22, pause: 7, phase: 8, activity: 'work' },
  { name: 'developer-site', asset: 'copilot_developer', start: [4,1.28,52], end: [4,1.28,62], facing: 0, travel: 20, pause: 9, phase: 17, activity: 'work' },
  { name: 'developer-garden', asset: 'copilot_developer', start: [-1,1.2,32.8], facing: -Math.PI/2, phase: 2, activity: 'work' },
  { name: 'octocat-bridge', asset: 'copilot_octocat_classic_lowpoly', start: [-28,1.28,8], end: [-28,1.28,24], facing: 0, travel: 45, pause: 8, phase: 11, activity: 'wave' },
  { name: 'octocat-plaza', asset: 'copilot_octocat_classic_lowpoly', start: [28,1.28,20.2], facing: Math.PI, phase: 0, activity: 'wave', routine: 'notices' },
  { name: 'octocat-grove', asset: 'copilot_octocat_classic_lowpoly', start: [-28,1.28,-16], end: [-28,1.28,-7], facing: 0, travel: 27, pause: 6, phase: 19, activity: 'wave' },
  { name: 'copilot-hill', asset: 'copilot_base', start: [0,1.28,-31], end: [0,1.28,-19], facing: 0, travel: 24, pause: 7, phase: 5 },
  { name: 'copilot-commons', asset: 'copilot_base', start: [4,1.28,21], end: [4,1.28,36], facing: 0, travel: 29, pause: 8, phase: 12 },
  { name: 'copilot-civic', asset: 'copilot_base', start: [28,1.28,5], facing: Math.PI, phase: 0, routine: 'coffee' },
  { name: 'duck-pond', asset: 'copilot_rubber_duck', start: [-5,1.48,29], facing: Math.PI/2, phase: 0, float: true, presentationScale: .5 },
  { name: 'duck-debugging', asset: 'copilot_rubber_duck', start: [-4.3,1.2,32.8], facing: Math.PI/2, phase: 1, presentationScale: .5 },
  { name: 'duck-plaza', asset: 'copilot_rubber_duck', start: [30.6,1.2,24], facing: -.7, phase: 2, presentationScale: .5 },
];
