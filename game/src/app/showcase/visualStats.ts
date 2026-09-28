import type { TowerReference } from '../../content/towers/catalog';

export type VisualStat = {
  id: string;
  label: string;
  segments: number;
  description: string;
  tone: 'indigo' | 'teal';
};

const SEGMENTS = 8;
const SCALE = {
  damagePerHit: 16,
  workThroughput: 12.5,
  actionCadence: 2.5,
  range: 8,
  investment: 60,
} as const;

function segments(value: number, maximum: number): number {
  return Math.max(0, Math.min(SEGMENTS, Math.round(value / maximum * SEGMENTS)));
}

function quality(value: number, maximum: number, low: string, middle: string, high: string): string {
  const ratio = value / maximum;
  return ratio < 1 / 3 ? low : ratio < 2 / 3 ? middle : high;
}

/** Converts approved reference stats to fixed-scale, qualitative display data. */
export function getVisualStats(tower: TowerReference): readonly VisualStat[] {
  const stats = tower.stats;
  if (!stats) return [];

  const result: VisualStat[] = [];
  if (stats.damagePerHit !== undefined) {
    let low = 'A light impact on each hit.';
    let middle = 'A solid impact on each hit.';
    let high = 'A powerful impact on each hit.';
    if (stats.damageKind === 'area') {
      low = 'A light impact on each enemy caught in the blast.';
      middle = 'A solid impact on each enemy caught in the blast.';
      high = 'A powerful impact on each enemy caught in the blast.';
    } else if (stats.damageKind === 'projectile') {
      low = 'A light impact from each connecting projectile.';
      middle = 'A solid impact from each connecting projectile.';
      high = 'A strong impact from each connecting projectile.';
    }
    result.push({
      id: 'damage', label: 'Damage', segments: segments(stats.damagePerHit, SCALE.damagePerHit),
      description: quality(stats.damagePerHit, SCALE.damagePerHit, low, middle, high), tone: 'indigo',
    });
  }

  if (stats.workPerAction !== undefined && stats.cooldownTicks !== undefined) {
    const workPerSecond = stats.workPerAction * 60 / stats.cooldownTicks;
    result.push({
      id: 'work-throughput', label: 'Work',
      segments: segments(workPerSecond, SCALE.workThroughput),
      description: quality(workPerSecond, SCALE.workThroughput,
        'Productive Work advances at a measured pace.', 'Productive Work advances at a steady pace.', 'Productive Work advances at a brisk pace.'),
      tone: 'indigo',
    });
  }

  if (stats.cooldownTicks !== undefined) {
    const actionsPerSecond = 60 / stats.cooldownTicks;
    result.push({
      id: 'action-cadence', label: 'Action speed',
      segments: segments(actionsPerSecond, SCALE.actionCadence),
      description: quality(actionsPerSecond, SCALE.actionCadence,
        'Actions arrive at a measured pace.', 'Actions arrive at a steady pace.', 'Actions arrive at a quick pace.'),
      tone: 'indigo',
    });
  }

  result.push({
    id: 'range', label: 'Range', segments: segments(stats.range, SCALE.range),
    description: quality(stats.range, SCALE.range,
      'A close area of influence.', 'A balanced area of influence.', 'A broad area of influence.'),
    tone: 'indigo',
  });
  result.push({
    id: 'investment', label: 'Compute',
    segments: segments(stats.investment, SCALE.investment),
    description: quality(stats.investment, SCALE.investment,
      'A modest total initial investment.', 'A considered total initial investment.', 'A substantial total initial investment.'),
    tone: 'teal',
  });
  return result;
}
