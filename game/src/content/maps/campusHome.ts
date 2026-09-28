/** Authored campus home composition, in metres. Reusable models retain 1:1 scale. */
export const CAMPUS_HOME_VERSION = 'v03';
export const CAMPUS_SURFACE_Y = 1.2;
const HEX_RADIUS = 18;

export type CampusAssetId =
  | 'campus_base_hex' | 'campus_tile_park' | 'campus_tile_plaza' | 'campus_tile_hill'
  | 'campus_tile_civic' | 'campus_tile_canyon' | 'campus_tile_construction' | 'campus_tile_utility'
  | 'campus_tile_forest' | 'campus_cave' | 'campus_tree_pine_bare' | 'campus_tree_spreading_bare' | 'campus_tree_autumn_bare'
  | 'campus_civic_decor' | 'campus_canyon_decor' | 'campus_construction_decor' | 'campus_utility_decor'
  | 'campus_lab' | 'campus_walk_straight' | 'campus_walk_short' | 'campus_walk_junction'
  | 'campus_walk_bend' | 'campus_walk_landing' | 'campus_tree_round'
  | 'campus_tree_tall' | 'campus_tree_cluster' | 'campus_pond' | 'campus_solar'
  | 'campus_coffee_kiosk' | 'campus_planter_bench' | 'campus_code_sculpture'
  | 'campus_meeting_nook' | 'campus_wayfinding_sign' | 'campus_flower_bed'
  | 'campus_bush_round' | 'campus_hedge' | 'campus_path_bollard'
  | 'campus_cafe_table' | 'campus_noticeboard';

export type CampusTileProfile = 'park' | 'plaza' | 'hill' | 'mineral_composite' | 'civic' | 'canyon' | 'construction' | 'utility' | 'forest';

export interface CampusPlacement {
  readonly id: CampusAssetId;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
  readonly tile?: { readonly q: number; readonly r: number; readonly profile: CampusTileProfile };
  readonly building?: { readonly id: 'copilot-lab'; readonly label: 'Copilot Lab'; readonly description: string };
}

export const CAMPUS_STROLL_ROUTE = {
  left: [-5.5, 1.28, 7] as const,
  right: [2.5, 1.28, 7] as const,
};

const baseTiles: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1], [0, 2], [0, -2]];
const tileProfiles: Readonly<Record<string, CampusTileProfile>> = {
  '0,1': 'park', '-1,0': 'park', '1,0': 'plaza', '0,-1': 'hill',
  '0,0': 'civic', '-1,1': 'canyon', '1,-1': 'utility', '0,2': 'construction',
  '0,-2': 'forest',
};

export const CAMPUS_HOME_FOCUS = [0, 1.6, 0] as const;

function makeLayout(): readonly CampusPlacement[] {
  const items: CampusPlacement[] = baseTiles.map(([q, r]) => {
    const profile = tileProfiles[`${q},${r}`] ?? 'mineral_composite';
    const id: CampusAssetId = profile === 'mineral_composite' ? 'campus_base_hex' : `campus_tile_${profile}`;
    return {
      id, position: [1.5 * HEX_RADIUS * q, 0, Math.sqrt(3) * HEX_RADIUS * (r + q / 2)],
      rotation: profile === 'mineral_composite' ? ((q * 2 + r * 3 + 12) % 6) * Math.PI / 3 : 0,
      tile: { q, r, profile },
    };
  });
  items.push({ id: 'campus_lab', position: [-2, CAMPUS_SURFACE_Y, -1.925], rotation: 0,
    building: { id: 'copilot-lab', label: 'Copilot Lab', description: 'A place to build together' } });
  const add = (id: CampusAssetId, x: number, z: number, rotation = 0) => {
    items.push({ id, position: [x, CAMPUS_SURFACE_Y, z], rotation });
  };

  // The lab loop and four connected promenades.
  for (const x of [-4, 0, 4]) {
    add(x === 0 ? 'campus_walk_straight' : 'campus_walk_junction', x, 7, x === -4 ? 0 : x === 4 ? Math.PI : Math.PI / 2);
    add(x === 0 ? 'campus_walk_junction' : 'campus_walk_straight', x, -9, x === 0 ? 0 : Math.PI / 2);
  }
  for (const x of [-10, 10]) for (const z of [-3, 1]) {
    const branch = (x === -10 && z === -3) || (x === 10 && z === 1);
    add(branch ? 'campus_walk_junction' : 'campus_walk_straight', x, z, branch ? (x < 0 ? Math.PI / 2 : -Math.PI / 2) : 0);
  }
  for (const [x, z, angle] of [[-10, 3, 0], [6, 7, Math.PI / 2], [10, -5, Math.PI], [-6, -9, -Math.PI / 2]] as const) add('campus_walk_bend', x, z, angle);
  add('campus_walk_straight', -4, 3);
  for (let z = 11; z <= 31; z += 4) add('campus_walk_straight', 4, z);
  // The hill's level corridor continues into the forest's central clearing.
  for (let z = -13; z >= -61; z -= 4) add('campus_walk_straight', 0, z);
  for (const x of [14, 18, 22]) add('campus_walk_straight', x, 1, Math.PI / 2);
  // Branch the former plaza elbow north into the utility district.
  add('campus_walk_junction', 28, 1, Math.PI / 2);
  add('campus_walk_short', 25, 1, Math.PI / 2);
  add('campus_walk_short', 28, 4);
  for (const z of [7, 11, 15]) add('campus_walk_straight', 28, z);
  for (let z = -3; z >= -23; z -= 4) add('campus_walk_straight', 28, z);
  add('campus_walk_landing', 28, -25, Math.PI);
  for (const x of [-14, -18, -22]) add('campus_walk_straight', x, -3, Math.PI / 2);
  // Extend the grove road over the canyon bridge; short pieces close the T ports.
  add('campus_walk_junction', -28, -3, -Math.PI / 2);
  add('campus_walk_short', -25, -3, Math.PI / 2);
  add('campus_walk_short', -28, -6);
  for (const z of [-9, -13, -17]) add('campus_walk_straight', -28, z);
  for (const z of [1, 5, 23]) add('campus_walk_straight', -28, z);
  add('campus_walk_short', -28, 8);
  add('campus_walk_landing', -28, 25);
  // Continue the park promenade into the new southern construction tile.
  for (let z = 35; z <= 63; z += 4) add('campus_walk_straight', 4, z);
  for (const [x, z, angle] of [[4, 65, 0], [0, -63, Math.PI], [28, 17, 0], [-28, -19, Math.PI]] as const) add('campus_walk_landing', x, z, angle);

  add('campus_civic_decor', 0, 0);
  add('campus_canyon_decor', -27, Math.sqrt(3) * HEX_RADIUS / 2);
  add('campus_utility_decor', 27, -Math.sqrt(3) * HEX_RADIUS / 2);
  add('campus_construction_decor', 0, Math.sqrt(3) * HEX_RADIUS * 2);
  // The north promenade ends at the recessed cave mouth in the forest.
  add('campus_cave', 0, -Math.sqrt(3) * HEX_RADIUS * 2 - 4.65);

  for (const [id, x, z, angle] of [
    ['campus_tree_round', -13.6, -6.8, 0], ['campus_tree_round', -14, .5, 0], ['campus_tree_round', -7.5, 12.3, 0],
    ['campus_tree_tall', -4, -11.9, 0], ['campus_tree_tall', 4, -11.9, 0], ['campus_tree_tall', 12.5, 6.5, 0],
    ['campus_tree_cluster', -.1, 12, 0], ['campus_tree_cluster', 13.1, -3.8, Math.PI / 2],
    ['campus_tree_round', -10, 29, 0], ['campus_tree_round', -7, 37, 0], ['campus_tree_tall', 10, 29, 0], ['campus_tree_cluster', 8, 39, 0],
    ['campus_tree_cluster', -35, -20, 0], ['campus_tree_tall', -21, -23, 0], ['campus_tree_round', -37, -8, 0], ['campus_tree_round', -18, -12, 0],
    ['campus_tree_tall', 20, 21, 0], ['campus_tree_cluster', 36, 9, 0], ['campus_tree_round', 32, 28, 0],
    ['campus_tree_tall', -11, -22, 0], ['campus_tree_round', 11, -22, 0], ['campus_tree_cluster', -4, -41, 0],
    ['campus_solar', 2.4, -5.3, 0], ['campus_solar', 6.3, -5.3, 0],
  ] as const) add(id, x, z, angle);

  // Grounded trees soften the park and grove edges at their authored scale.
  for (const [id, x, z, angle] of [
    ['campus_tree_spreading_bare', -11, 34, .4],
    ['campus_tree_autumn_bare', -8, 18, -.5],
    ['campus_tree_pine_bare', 11, 37, .3],
    ['campus_tree_pine_bare', -33, -23, -.3],
    ['campus_tree_spreading_bare', -39, -17, .8],
    ['campus_tree_autumn_bare', -21, -7, 1.2],
    ['campus_tree_autumn_bare', 37, 20, -.7],
  ] as const) add(id, x, z, angle);

  // Park commons, plaza, collaboration grove and hill furnishings.
  for (const [id, x, z, angle] of [
    ['campus_coffee_kiosk', -1, 23, Math.PI / 2], ['campus_planter_bench', 0, 29, Math.PI / 2],
    ['campus_planter_bench', 8, 34, -Math.PI / 2], ['campus_code_sculpture', 4.4, 1, 0],
    ['campus_pond', -5, 29, 0], ['campus_meeting_nook', -6, 22, 0], ['campus_wayfinding_sign', 7, 20, 0],
    ['campus_coffee_kiosk', 23, 9, Math.PI / 2], ['campus_meeting_nook', 22, 16, 0],
    ['campus_code_sculpture', 34, 16, 0], ['campus_planter_bench', 25, 23, 0],
    ['campus_planter_bench', 34, 22, 0], ['campus_wayfinding_sign', 31, 7, 0],
    ['campus_meeting_nook', -22, -17, 0], ['campus_meeting_nook', -34, -12, Math.PI / 2],
    ['campus_planter_bench', -24, -9, Math.PI / 2], ['campus_wayfinding_sign', -24, -21, 0],
    ['campus_planter_bench', 4, -40, 0], ['campus_wayfinding_sign', 3, -23, 0],
    ['campus_wayfinding_sign', 13, 4, 0], ['campus_planter_bench', -4, 26, 0],
  ] as const) add(id, x, z, angle);

  // Planting and fixtures outside travel corridors.
  for (const [id, x, z, angle] of [
    ['campus_cafe_table', -.5, 18.5, 0], ['campus_cafe_table', 22, 25.2, 0],
    ['campus_noticeboard', -1, 38, 0], ['campus_noticeboard', 33, 11, -Math.PI / 2],
    ['campus_flower_bed', -10, 21, Math.PI / 2], ['campus_flower_bed', -9, 34, 0],
    ['campus_flower_bed', 8, 24, Math.PI / 2], ['campus_flower_bed', 35, 26, 0],
    ['campus_flower_bed', -20, -12, Math.PI / 2], ['campus_flower_bed', -34, -17, 0],
    ['campus_bush_round', -11, 25, 0], ['campus_bush_round', -10, 38, 0], ['campus_bush_round', 11, 34, 0],
    ['campus_bush_round', 38, 15, 0], ['campus_bush_round', 18.5, 25.5, 0], ['campus_bush_round', -18, -19.5, 0],
    ['campus_bush_round', -35, -6, 0], ['campus_bush_round', 8, -42, 0],
    ['campus_hedge', -5, 42, 0], ['campus_hedge', 34, 5, 0], ['campus_hedge', -30, -25, 0],
    ['campus_hedge', -38, -14, Math.PI / 2],
    ['campus_path_bollard', 1.6, 15, 0], ['campus_path_bollard', 6.4, 27, 0],
    ['campus_path_bollard', 1, 35, 0], ['campus_path_bollard', -2.4, -17, 0],
    ['campus_path_bollard', 2.8, -37, 0], ['campus_path_bollard', 25.6, 7, 0],
    ['campus_path_bollard', 32.1, 20, 0], ['campus_path_bollard', -25.6, -13, 0],
    ['campus_path_bollard', -31, -21, 0], ['campus_path_bollard', -16, -.6, 0],
  ] as const) add(id, x, z, angle);
  return items;
}

export const CAMPUS_HOME_PLACEMENTS = makeLayout();
