import type { EncounterContent } from '../../content/schemas/encounter';
import type { Tower } from './state';
import { resolveTowerStats } from './stats';
import type { StatSource } from './stats';

export function coverageProfiles(definition: EncounterContent['towerDefinitions'][number]) {
  return [definition.coverage, ...(definition.coverageAlternatives ?? [])];
}
export function resolveCoverage(content: EncounterContent, tower: { definitionId: string; coverageKind?: Tower['coverageKind'] } & StatSource) {
  const definition = content.towerDefinitions.find(item => item.id === tower.definitionId);
  if (!definition) return undefined;
  const shape = coverageProfiles(definition).find(profile => profile.kind === (tower.coverageKind ?? definition.coverage.kind));
  return shape ? { ...shape, radius: resolveTowerStats(definition, tower).range } : undefined;
}
