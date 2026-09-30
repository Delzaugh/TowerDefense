import copilot from 'tower-asset:copilot_base@v02';
import developer from 'tower-asset:copilot_developer@v01';
import lagSpike from 'tower-asset:problem_lag_spike@v01';
import vagueSpec from 'tower-asset:problem_vague_spec@v01';
import deadCode from 'tower-asset:problem_dead_code@v01';
import codingTask from 'tower-asset:work_coding_task@v01';

/** The whole fixture import graph can be removed at build time. */
export const STRESS_ASSETS = [copilot, developer, lagSpike, vagueSpec, deadCode, codingTask] as const;
export const TOWER_ASSETS = [copilot, developer] as const;
export const MOVER_ASSETS = [lagSpike, vagueSpec, deadCode, codingTask] as const;
