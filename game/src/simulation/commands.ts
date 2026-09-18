import { z } from 'zod';
import { pointSchema } from '../content/schemas/scenario';
import type { SimulationEvent } from './state';
import type { ValidationIssue } from '../content/schemas/data';

export const commandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('start') }),
  z.strictObject({ type: z.literal('pause') }),
  z.strictObject({ type: z.literal('resume') }),
  z.strictObject({ type: z.literal('set_speed'), speed: z.union([z.literal(1), z.literal(2)]) }),
  z.strictObject({ type: z.literal('place_marker'), position: pointSchema }),
]);
export type Command = z.infer<typeof commandSchema>;
export type Rejection = 'invalid_command' | 'paused' | 'wrong_phase' | 'not_paused' | 'outside_buildable' | 'blocked' | 'sequence_limit';
export type CommandResult =
  | { readonly accepted: true; readonly events: readonly SimulationEvent[] }
  | { readonly accepted: false; readonly reason: Rejection; readonly issues?: readonly ValidationIssue[]; readonly events: readonly [] };
