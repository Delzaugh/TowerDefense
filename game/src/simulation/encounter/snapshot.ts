import { canonicalJson, parseData, identifierSchema, ValidationError } from '../../content/schemas/data';
import type { EncounterContent } from '../../content/schemas/encounter';
import { encounterSnapshotSchema } from './state';
import type { MutableSnapshot } from './state';

export function initialState(content: EncounterContent, runId: string): MutableSnapshot {
  return { format: 'tower.encounter.snapshot', schemaVersion: 6, rulesVersion: 6, ticksPerSecond: 60,
    contentSignature: canonicalJson(content), runId: parseData(identifierSchema, runId), phase: 'preparation', paused: false, speed: 1,
    tick: 0, commandSequence: 0, eventSequence: 0, commandLog: [], spawnCursor: 0, nextEntityId: 1, entities: [],
    productHealth: content.product.initialHealth, compute: content.initialCompute, debt: 0, productProgress: 0,
    nextTowerId: 1, towers: [], outcomes: [],
    totals: { missedWork: 0, leakedProblems: 0, completedWork: 0, resolvedProblems: 0,
      computeEarned: 0, computeSpent: 0, healingReceived: 0, damageTaken: 0 } };
}
/** Structural checks precede authoritative replay in restoreEncounter. */
export function validateSnapshot(content: EncounterContent, input: unknown): MutableSnapshot {
  const state = parseData(encounterSnapshotSchema, input);
  if (state.contentSignature !== canonicalJson(content)) throw new ValidationError([{ code: 'invalid_snapshot', path: 'snapshot', message: 'Logical content is incompatible.' }]);
  for (const tower of state.towers) {
    const definition = content.towerDefinitions.find(item => item.id === tower.definitionId);
    if (definition && Object.keys(tower.statOverrides).length && !definition.allowStatTuning) throw new Error('Stat tuning is disabled for this definition.');
  }
  return state;
}
