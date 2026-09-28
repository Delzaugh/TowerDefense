/** Decorative schedules, independent of encounter state and outcomes. */
export const CAMPUS_ROUTINE_CYCLE = 180;
export const CAMPUS_ROUTINE_OFFSET = 52;
export type CampusRoutine = 'coffee' | 'notices';
export interface CampusRoutineStep {
  readonly start: number;
  readonly end: number;
  readonly activity: string;
  readonly points: readonly (readonly [number, number])[];
  readonly facing: number;
}

export const CAMPUS_ROUTINES: Readonly<Record<CampusRoutine, readonly CampusRoutineStep[]>> = {
  coffee: [
    { start: 0, end: 18, activity: 'heading for coffee', points: [[28, 5], [28, 9], [26.1, 9]], facing: -Math.PI / 2 },
    { start: 18, end: 30, activity: 'coffee stop', points: [[26.1, 9]], facing: -Math.PI / 2 },
    { start: 30, end: 60, activity: 'joining a friend', points: [[26.1, 9], [28, 9], [28, 17.6]], facing: 0 },
    { start: 60, end: 78, activity: 'conversation', points: [[28, 17.6]], facing: 0 },
    { start: 78, end: 84, activity: 'watching the plaza', points: [[28, 17.6]], facing: 0 },
    { start: 84, end: 112, activity: 'walking to the café', points: [[28, 17.6], [28, 27.6], [25.5, 27.6]], facing: -2.17 },
    { start: 112, end: 132, activity: 'café break', points: [[25.5, 27.6]], facing: -2.17 },
    { start: 132, end: 174, activity: 'heading back', points: [[25.5, 27.6], [28, 27.6], [28, 5]], facing: Math.PI },
    { start: 174, end: 180, activity: 'watching the campus', points: [[28, 5]], facing: Math.PI },
  ],
  notices: [
    { start: 0, end: 30, activity: 'visiting the noticeboard', points: [[28, 20.2], [30.5, 20.2], [30.5, 12]], facing: Math.PI / 2 },
    { start: 30, end: 36, activity: 'reading notices', points: [[30.5, 12]], facing: Math.PI / 2 },
    { start: 36, end: 60, activity: 'joining a friend', points: [[30.5, 12], [30.5, 20.2], [28, 20.2]], facing: Math.PI },
    { start: 60, end: 78, activity: 'conversation', points: [[28, 20.2]], facing: Math.PI },
    { start: 78, end: 96, activity: 'visiting the sculpture', points: [[28, 20.2], [30.5, 20.2], [30.5, 17]], facing: Math.PI / 2 },
    { start: 96, end: 116, activity: 'admiring the sculpture', points: [[30.5, 17]], facing: Math.PI / 2 },
    { start: 116, end: 132, activity: 'visiting the noticeboard', points: [[30.5, 17], [30.5, 12]], facing: Math.PI / 2 },
    { start: 132, end: 150, activity: 'reading notices', points: [[30.5, 12]], facing: Math.PI / 2 },
    { start: 150, end: 180, activity: 'returning to the plaza', points: [[30.5, 12], [30.5, 20.2], [28, 20.2]], facing: Math.PI },
  ],
};
