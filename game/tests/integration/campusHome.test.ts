import { describe, expect, it } from 'vitest';
import { CAMPUS_HOME_PLACEMENTS, CAMPUS_HOME_VERSION, CAMPUS_SURFACE_Y } from '../../src/content/maps/campusHome';

describe('campus home composition', () => {
  const tiles = CAMPUS_HOME_PLACEMENTS.filter(placement => placement.tile);

  it('places the forest and four developed districts in a connected nine-tile campus', () => {
    expect(CAMPUS_HOME_VERSION).toBe('v03');
    expect(tiles).toHaveLength(9);
    expect(new Set(tiles.map(item => `${item.tile!.q},${item.tile!.r}`)).size).toBe(9);
    expect(tiles.find(item => item.tile!.profile === 'forest')?.tile).toEqual({ q: 0, r: -2, profile: 'forest' });
    for (const profile of ['civic', 'canyon', 'construction', 'utility']) {
      expect(tiles.filter(item => item.tile!.profile === profile)).toHaveLength(1);
      const tile = tiles.find(item => item.tile!.profile === profile)!;
      const decor = CAMPUS_HOME_PLACEMENTS.find(item => item.id === `campus_${profile}_decor`)!;
      expect(decor.position).toEqual([tile.position[0], CAMPUS_SURFACE_Y, tile.position[2]]);
    }
    const occupied = new Set(tiles.map(item => `${item.tile!.q},${item.tile!.r}`));
    const visited = new Set<string>();
    const pending: Array<[number, number]> = [[0, 0]];
    const directions: Array<[number, number]> = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
    while (pending.length) {
      const [q, r] = pending.pop()!;
      const key = `${q},${r}`;
      if (visited.has(key) || !occupied.has(key)) continue;
      visited.add(key);
      for (const [dq, dr] of directions) pending.push([q + dq, r + dr]);
    }
    expect(visited.size).toBe(tiles.length);
  });

  it('preserves exact 18m hex joins and keeps the core lab on the civic tile', () => {
    for (const item of tiles) {
      const { q, r } = item.tile!;
      expect(item.position[0]).toBeCloseTo(27 * q, 8);
      expect(item.position[1]).toBe(0);
      expect(item.position[2]).toBeCloseTo(Math.sqrt(3) * 18 * (r + q / 2), 8);
      expect(item.rotation).toBe(0);
    }
    expect(tiles.find(item => item.id === 'campus_tile_civic')!.position).toEqual([0, 0, 0]);
    expect(CAMPUS_HOME_PLACEMENTS.find(item => item.building?.id === 'copilot-lab')!.position).toEqual([-2, CAMPUS_SURFACE_Y, -1.925]);
    // Remove the placeholders that would intersect the new district geometry.
    expect(CAMPUS_HOME_PLACEMENTS.some(item => item.id === 'campus_tree_tall' && item.position[0] === -31.5)).toBe(false);
    expect(CAMPUS_HOME_PLACEMENTS.some(item => item.id === 'campus_tree_tall' && item.position[0] === 28.5)).toBe(false);
  });
});
