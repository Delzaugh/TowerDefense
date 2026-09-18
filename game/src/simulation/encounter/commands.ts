import type { EncounterEvent } from './state';
export { encounterCommandSchema } from './commandSchema';
export type { EncounterCommand } from './commandSchema';
export type Rejection = 'invalid_command' | 'paused' | 'wrong_phase' | 'sequence_limit' | 'unknown_definition' | 'outside_buildable' | 'path_blocked' | 'blocked' | 'overlap' | 'insufficient_compute' | 'tower_limit' | 'type_limit' | 'unknown_tower' | 'unsupported_coverage' | 'stat_tuning_disabled' | 'unsupported_control' | 'unknown_upgrade' | 'already_owned' | 'unsupported_effect' | 'ability_conflict' | 'effect_limit';
export type EncounterCommandResult =
  | { readonly accepted: true; readonly events: readonly EncounterEvent[] }
  | { readonly accepted: false; readonly reason: Rejection; readonly events: readonly [] };

