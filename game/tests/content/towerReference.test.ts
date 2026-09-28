import { describe, expect, it } from 'vitest';
import { getVisualStats } from '../../src/app/showcase/visualStats';
import { getTower, TOWERS } from '../../src/content/towers/catalog';

describe('Tower reference content', () => {
  it('records the accepted initial roster baselines and canonical models', () => {
    expect(TOWERS.filter(tower => tower.collection === 'core').map(tower => tower.id)).toEqual([
      'base', 'developer', 'tester', 'analyst', 'security', 'architect', 'linter',
    ]);
    expect(Object.fromEntries(TOWERS.filter(tower => tower.collection === 'core').map(tower => [tower.id, tower.stats]))).toEqual({
      base: { range: 5, investment: 30, damagePerHit: 5, workPerAction: 5, cooldownTicks: 30, damageKind: 'single' },
      developer: { range: 5, investment: 50, damagePerHit: 7, workPerAction: 5, cooldownTicks: 24, damageKind: 'single' },
      tester: { range: 5, investment: 50, damagePerHit: 5, workPerAction: 5, cooldownTicks: 30, damageKind: 'single' },
      analyst: { range: 8, investment: 60 },
      security: { range: 6, investment: 50, damagePerHit: 5, workPerAction: 3, cooldownTicks: 30, damageKind: 'single' },
      architect: { range: 8, investment: 60, damagePerHit: 16, cooldownTicks: 72, damageKind: 'area' },
      linter: { range: 3, investment: 50, damagePerHit: 2, cooldownTicks: 30, damageKind: 'projectile' },
    });
    expect(TOWERS.filter(tower => tower.modelId).map(tower => [tower.id, tower.modelId])).toEqual([
      ['base', 'copilot_base@v02'], ['developer', 'copilot_developer@v01'],
      ['security', 'copilot_security@v01'], ['linter', 'copilot_linter@v01'],
      ['senior-developer', 'copilot_golden_compiler@v01'],
      ['commit-halo', 'copilot_commit_halo@v01'],
    ]);
    expect(getTower('tester').stats?.damagePerHit).not.toBe(3);
    expect(getTower('base').availability).toBe('Available from the first mission');
    expect(getTower('analyst').availability).toBe('Available after the first mission');
    expect(getTower('security').availability).toBe('Available later in the campaign');
    expect(getTower('architect').availability).toBeUndefined();
    expect(getTower('linter').availability).toBeUndefined();
    expect(TOWERS.flatMap(tower => [tower.availability ?? '', ...tower.abilities]).join(' ')).not.toMatch(/Level 1|milestone undefined|\d/);
  });

  it('keeps unsupported stats unavailable and excludes character and art variants', () => {
    expect(getVisualStats(getTower('senior-developer'))).toEqual([]);
    expect(getVisualStats(getTower('commit-halo'))).toEqual([]);
    expect(getTower('analyst').stats).not.toHaveProperty('damagePerHit');
    expect(getTower('analyst').stats).not.toHaveProperty('workPerAction');
    expect(TOWERS.map(tower => tower.id)).not.toContain('bert');
    expect(TOWERS.map(tower => tower.id)).not.toContain('golden-compiler');
    expect(TOWERS.map(tower => tower.id)).not.toContain('octocat-classic');
    expect(() => getTower('missing')).toThrow('Unknown Tower reference');
  });
});

describe('Tower visual stats', () => {
  it('uses fixed eight-segment scales and omits unavailable metrics', () => {
    const base = getVisualStats(getTower('base'));
    expect(base).toEqual([
      expect.objectContaining({ id: 'damage', segments: 3 }),
      expect.objectContaining({ id: 'work-throughput', segments: 6 }),
      expect.objectContaining({ id: 'action-cadence', segments: 6 }),
      expect.objectContaining({ id: 'range', segments: 5 }),
      expect.objectContaining({ id: 'investment', segments: 4 }),
    ]);
    expect(getVisualStats(getTower('analyst')).map(stat => stat.id)).toEqual(['range', 'investment']);
    expect(getVisualStats(getTower('developer')).find(stat => stat.id === 'damage')?.segments).toBe(4);
    expect(getVisualStats(getTower('architect')).find(stat => stat.id === 'damage')).toMatchObject({
      label: 'Damage', segments: 8,
    });
    expect(getVisualStats(getTower('linter')).find(stat => stat.id === 'damage')).toMatchObject({
      label: 'Damage', segments: 1,
    });
    expect(getVisualStats(getTower('architect')).find(stat => stat.id === 'damage')?.description).toContain('each enemy');
    expect(getVisualStats(getTower('linter')).find(stat => stat.id === 'damage')?.description).toContain('each connecting projectile');
    expect(getVisualStats(getTower('base')).map(stat => [stat.label, stat.tone])).toEqual([
      ['Damage', 'indigo'], ['Work', 'indigo'], ['Action speed', 'indigo'], ['Range', 'indigo'], ['Compute', 'teal'],
    ]);
    for (const stat of TOWERS.flatMap(tower => getVisualStats(tower))) {
      expect(stat.segments).toBeGreaterThanOrEqual(0);
      expect(stat.segments).toBeLessThanOrEqual(8);
      expect(stat.description).not.toMatch(/\d/);
      expect(stat.description).toBeTruthy();
    }
  });
});
