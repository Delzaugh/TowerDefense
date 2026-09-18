import { parseEncounter } from '../schemas/encounter';

// Engineering values only, not approved Level 1 balance.
export const headlessSlice = parseEncounter({
  schemaVersion: 6, id: 'headless_slice', version: 'v06',
  product: { maximumHealth: 100, initialHealth: 100 }, initialCompute: 100,
  map: { id: 'headless_map', version: 'v02', buildable: { min: { x: -10, z: -6 }, max: { x: 10, z: 6 } },
    routes: [{ id: 'main_route', width: 0.8, points: [{ x: -8, z: 2 }, { x: 0, z: 2 }, { x: 0, z: -2 }, { x: 8, z: -2 }] }], obstacles: [] },
  definitions: [
    { id: 'coding_task', kind: 'work', speed: 4, requiredWork: 10, computeReward: 12, healing: 5 },
    { id: 'bug', kind: 'problem', speed: 4, durability: 10, severityDamage: 15, computeReward: 5 },
  ],
  towerDefinitions: [
    { id: 'base_copilot', kind: 'targeted', family: 'copilot', label: 'Base Copilot', canRotate: true, capabilities: { work: true, problem: true }, controls: { modes: ['auto', 'build', 'defend'], priorities: ['closest_to_product', 'first_spawned'] }, abilities: [], upgrades: [], externalEffects: [], coverage: { kind: 'area' }, baseStats: { cost: 30, footprintRadius: 0.4, range: 5, workPerAction: 5, damagePerAction: 5, cooldownTicks: 30, commitmentTicks: 30 } },
    { id: 'cone_probe', kind: 'targeted', family: 'copilot', label: 'Base Copilot', canRotate: true, capabilities: { work: true, problem: true }, controls: { modes: ['auto', 'build', 'defend'], priorities: ['closest_to_product', 'first_spawned'] }, abilities: [], upgrades: [], externalEffects: [], coverage: { kind: 'cone', angleDegrees: 90 }, baseStats: { cost: 30, footprintRadius: 0.4, range: 5, workPerAction: 5, damagePerAction: 5, cooldownTicks: 30, commitmentTicks: 30 } },
  ],
  wave: { id: 'mixed_traffic', spawns: [
    { offsetTicks: 0, definitionId: 'coding_task', routeId: 'main_route' },
    { offsetTicks: 60, definitionId: 'bug', routeId: 'main_route' },
    { offsetTicks: 120, definitionId: 'coding_task', routeId: 'main_route' },
    { offsetTicks: 180, definitionId: 'bug', routeId: 'main_route' },
  ] },
});
export const fragileSlice = parseEncounter({ ...headlessSlice, id: 'fragile_slice', product: { maximumHealth: 20, initialHealth: 20 } });
export const blockerSlice = parseEncounter({ ...headlessSlice, id: 'blocker_slice', map: { ...headlessSlice.map, obstacles: [
  { id: 'server', footprint: { min: { x: -2, z: -1 }, max: { x: -1, z: 1 } }, blocksSight: true },
] } });

