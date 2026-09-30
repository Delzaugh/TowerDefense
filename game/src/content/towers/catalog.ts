/**
 * Read-only Tower reference content. The accepted initial-playtest values are
 * authored once here from docs/Tower_Base_Stats.md; gameplay definitions can
 * consume this source as their schema supports each behavior. Visual gauges
 * are presentation only and must not become a second balance table.
 */
export interface TowerReference {
  readonly id: string;
  readonly title: string;
  readonly role: string;
  readonly description: string;
  readonly family: 'copilot' | 'human' | 'other';
  readonly collection: 'core' | 'development';
  readonly accent: string;
  readonly modelId?: string;
  readonly stats?: {
    readonly range: number;
    readonly investment: number;
    readonly damagePerHit?: number;
    readonly workPerAction?: number;
    readonly cooldownTicks?: number;
    readonly damageKind?: 'single' | 'area' | 'projectile';
  };
  readonly abilities: readonly string[];
  readonly availability?: string;
}

const core = 'core' as const;
const development = 'development' as const;

export const TOWERS: readonly TowerReference[] = Object.freeze([
  {
    id: 'base', title: 'Base Copilot', role: 'Generalist',
    description: 'An affordable starting Tower that can specialize into a Persona.',
    family: 'copilot', collection: core, accent: '#9B8AFB', modelId: 'copilot_base@v02',
    stats: { range: 5, investment: 30, damagePerHit: 5, workPerAction: 5, cooldownTicks: 30, damageKind: 'single' },
    abilities: [], availability: 'Available from the first mission',
  },
  {
    id: 'developer', title: 'Developer', role: 'Direct-output specialist',
    description: 'Completes Work faster and attacks faster with higher damage per action.',
    family: 'copilot', collection: core, accent: '#5E7BFA', modelId: 'copilot_developer@v01',
    stats: { range: 5, investment: 50, damagePerHit: 7, workPerAction: 5, cooldownTicks: 24, damageKind: 'single' },
    abilities: [], availability: 'Available from the first mission',
  },
  {
    id: 'tester', title: 'Tester', role: 'Quality support',
    description: 'Keeps Base direct output while supporting allies within its coverage.',
    family: 'copilot', collection: core, accent: '#67D990', modelId: 'copilot_tester@v01',
    stats: { range: 5, investment: 50, damagePerHit: 5, workPerAction: 5, cooldownTicks: 30, damageKind: 'single' },
    abilities: ['QA Aura slows nearby Enemies and awards bonus Compute when nearby Work completes.'],
    availability: 'Available from the first mission',
  },
  {
    id: 'analyst', title: 'Analyst', role: 'Passive support',
    description: 'Creates Work opportunities and supports Developer action speed in a broad area.',
    family: 'copilot', collection: core, accent: '#91D9D2', modelId: 'copilot_analyst@v01',
    stats: { range: 8, investment: 60 },
    abilities: [
      'Opportunity Discovery creates productive Work after Unclear Requirements are defeated in its coverage.',
      'Clear Briefing speeds Developer actions for both damage and Work.',
    ], availability: 'Available after the first mission',
  },
  {
    id: 'security', title: 'Security', role: 'Threat detection and response',
    description: 'Reveals hidden threats and specializes in responding to designated security threats.',
    family: 'copilot', collection: core, accent: '#49A9D8', modelId: 'copilot_security@v01',
    stats: { range: 6, investment: 50, damagePerHit: 5, workPerAction: 3, cooldownTicks: 30, damageKind: 'single' },
    abilities: [
      'Threat Scan reveals hidden Enemies while they remain within its coverage.',
      'Threat Response deals extra damage to designated security Enemies.',
    ], availability: 'Available later in the campaign',
  },
  {
    id: 'architect', title: 'Architect', role: 'Long-range area specialist',
    description: 'Strikes a selected Enemy and damages each eligible Enemy near the impact.',
    family: 'copilot', collection: core, accent: '#D98655',
    stats: { range: 8, investment: 60, damagePerHit: 16, cooldownTicks: 72, damageKind: 'area' },
    abilities: ['Structural Impact damages each eligible Enemy caught near the impact point.'],
  },
  {
    id: 'linter', title: 'Linter Agent', role: 'Radial projectile defense',
    description: 'Fires a radial volley of projectiles without selecting an individual target.',
    family: 'copilot', collection: core, accent: '#71B976', modelId: 'copilot_linter@v01',
    stats: { range: 3, investment: 50, damagePerHit: 2, cooldownTicks: 30, damageKind: 'projectile' },
    abilities: ['Rule Burst sends radial projectiles that stop at an Enemy, an obstacle, or their range limit.'],
  },
  {
    id: 'senior-developer', title: 'Senior Developer', role: 'Future Human Tower concept',
    description: 'A powerful, very expensive special Tower concept; its behavior and stats are undefined.',
    family: 'human', collection: development, accent: '#D6AE68',
    modelId: 'copilot_golden_compiler@v01', abilities: [],
  },
  {
    id: 'commit-halo', title: 'Commit Halo', role: 'Tower concept',
    description: 'A bespectacled character accompanied by three orbiting code symbols.',
    family: 'other', collection: development, accent: '#D2A84D',
    modelId: 'copilot_commit_halo@v01', abilities: [],
  },
]);

export function getTower(id: string): TowerReference {
  const tower = TOWERS.find(candidate => candidate.id === id);
  if (!tower) throw new Error(`Unknown Tower reference: ${id}`);
  return tower;
}
