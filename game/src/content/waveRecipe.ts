import { z } from 'zod';
import { canonicalJson, freezeData, identifierSchema, parseData } from './schemas/data';
import { parseEncounter } from './schemas/encounter';
import type { EncounterContent } from './schemas/encounter';

const tick = z.number().int().min(0).max(36_000);
export const waveRecipeSchema = z.strictObject({
  format: z.literal('tower.wave.recipe'), version: z.literal(1),
  rows: z.array(z.strictObject({ definitionId: identifierSchema, routeId: identifierSchema,
    startTick: tick, count: z.number().int().min(1).max(1000), intervalTicks: tick,
  })).min(1).max(1000),
}).superRefine((recipe, ctx) => {
  if (recipe.rows.reduce((sum, row) => sum + row.count, 0) > 1000) ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Maximum 1000 expanded spawns.' });
  recipe.rows.forEach((row, i) => {
    if (row.startTick + (row.count - 1) * row.intervalTicks > 36_000) ctx.addIssue({ code: 'custom', path: ['rows', i], message: 'Last spawn offset exceeds 36000 ticks (600 seconds).' });
  });
});
export type WaveRecipe = ReturnType<typeof parseWaveRecipe>;
export function parseWaveRecipe(input: unknown) { return freezeData(parseData(waveRecipeSchema, input)); }
export function recipeFromContent(content: EncounterContent): WaveRecipe {
  return parseWaveRecipe({ format: 'tower.wave.recipe', version: 1, rows: content.wave.spawns.map(spawn => ({
    definitionId: spawn.definitionId, routeId: spawn.routeId, startTick: spawn.offsetTicks, count: 1, intervalTicks: 0,
  })) });
}
export function compileWaveRecipe(base: EncounterContent, input: unknown) {
  const recipe = parseWaveRecipe(input);
  const spawns = recipe.rows.flatMap(row => Array.from({ length: row.count }, (_, index) => ({
    definitionId: row.definitionId, routeId: row.routeId, offsetTicks: row.startTick + index * row.intervalTicks,
  })));
  const content = parseEncounter({ ...base, wave: { ...base.wave, spawns } });
  const schedule = content.wave.spawns.map((spawn, order) => ({ ...spawn, order }))
    .sort((a, b) => a.offsetTicks - b.offsetTicks || a.order - b.order)
    .map((spawn, index) => ({ ...spawn, id: index + 1, spawnTick: spawn.offsetTicks + 1 }));
  return freezeData({ recipe, content, schedule });
}
export function sameWave(a: EncounterContent, b: EncounterContent) { return canonicalJson(a.wave) === canonicalJson(b.wave); }
export function secondsToTicks(input: string): number {
  if (!input.trim() || !Number.isFinite(Number(input)) || Number(input) < 0 || Number(input) > 600) throw new Error('Time must be between 0 and 600 seconds.');
  return Math.round(Number(input) * 60);
}
export function millisecondsToTicks(input: string): number {
  if (!input.trim() || !Number.isFinite(Number(input)) || Number(input) < 0 || Number(input) > 600_000) throw new Error('Interval must be between 0 and 600000 milliseconds.');
  return Math.round(Number(input) * 60 / 1000);
}
/** Readable millisecond display that round-trips to the same integer tick. */
export function ticksToMilliseconds(ticks: number): number {
  return Math.round(ticks * 1_000_000 / 60) / 1000;
}
export function importWaveRecipe(json: string) {
  if (json.length > 250_000) throw new Error('Recipe JSON exceeds 250000 characters.');
  return parseWaveRecipe(JSON.parse(json));
}
