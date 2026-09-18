import { z } from 'zod';
import { freezeData, parseData, ValidationError } from '../content/schemas/data';
import type { ReadonlyData } from '../content/schemas/data';
import type { Scenario } from '../content/schemas/scenario';
import { validateSnapshot } from '../simulation/createSimulation';
import { snapshotSchema } from '../simulation/state';
import type { SimulationSnapshot } from '../simulation/state';

export const saveSchema = z.strictObject({ format: z.literal('tower.foundation.save'), version: z.literal(1), snapshot: snapshotSchema });
export type SaveEnvelope = ReadonlyData<z.infer<typeof saveSchema>>;
export function canSave(snapshot: SimulationSnapshot): boolean { return snapshot.phase !== 'running'; }

export function createSave(scenario: Scenario, snapshot: unknown): SaveEnvelope {
  const valid = validateSnapshot(scenario, snapshot);
  if (!canSave(valid)) throw new ValidationError([{ code: 'save_not_allowed', path: 'snapshot.phase', message: 'Save only in preparation or after the route completes. Pausing is not a save boundary.' }]);
  return freezeData({ format: 'tower.foundation.save', version: 1, snapshot: valid });
}

export function parseSave(scenario: Scenario, input: unknown): SaveEnvelope {
  const envelope = parseData(saveSchema, input);
  return createSave(scenario, envelope.snapshot);
}
