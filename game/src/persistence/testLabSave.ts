import { z } from 'zod';
import { canonicalJson, freezeData, parseData, ValidationError } from '../content/schemas/data';
import { encounterSchema } from '../content/schemas/encounter';
import type { EncounterContent } from '../content/schemas/encounter';
import { pointSchema } from '../content/schemas/scenario';
import { restoreEncounter } from '../simulation/encounter';
import type { EncounterSnapshot } from '../simulation/encounter';
import { encounterSnapshotSchema } from '../simulation/encounter/state';
import { markerRejection } from '../simulation/encounter/diagnostics';
import { blueprintSchema, captureBlueprint, prepareBlueprint } from '../simulation/encounter/blueprint';
import { compileWaveRecipe, recipeFromContent, waveRecipeSchema } from '../content/waveRecipe';

const schema = z.strictObject({ format: z.literal('tower.test-lab.save'), version: z.literal(5),
  content: encounterSchema, recipe: waveRecipeSchema, blueprint: blueprintSchema,
  snapshot: encounterSnapshotSchema, marker: pointSchema.nullable(),
});
export const canSaveLab = (snapshot: EncounterSnapshot) => snapshot.phase !== 'active';
export function parseLabSave(base: EncounterContent, input: unknown) {
  const envelope = parseData(schema, input);
  // Queue may differ, but a save cannot silently replace this map, preset, or tower rules.
  if (canonicalJson({ ...envelope.content, wave: base.wave }) !== canonicalJson(base)) throw new Error('Save belongs to incompatible map/preset content.');
  const compiled = compileWaveRecipe(base, envelope.recipe);
  if (canonicalJson(compiled.content) !== canonicalJson(envelope.content)) throw new Error('Saved recipe and resolved content disagree.');
  restoreEncounter(envelope.content, envelope.snapshot);
  prepareBlueprint(envelope.content, envelope.blueprint, 'validate_blueprint');
  if (!canSaveLab(envelope.snapshot)) throw new ValidationError([{ code: 'save_not_allowed', path: 'snapshot.phase', message: 'Local saves require preparation or a finished run; pause does not enable saving.' }]);
  if (envelope.marker && markerRejection(envelope.content, envelope.marker)) throw new ValidationError([{ code: 'invalid_marker', path: 'marker', message: 'Saved marker geometry is invalid.' }]);
  return freezeData(envelope);
}
export function createLabSave(content: EncounterContent, snapshot: EncounterSnapshot, marker: unknown,
  recipe: unknown = recipeFromContent(content), blueprint: unknown = captureBlueprint(snapshot, marker)) {
  return parseLabSave(content, { format: 'tower.test-lab.save', version: 5, content, recipe, blueprint, snapshot, marker });
}

