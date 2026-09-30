import { createEncounter } from '../../../game/src/simulation/encounter';
import type { Encounter, EncounterCommand, EncounterEvent, EncounterSnapshot } from '../../../game/src/simulation/encounter';
import { createFixedStepClock } from '../../../game/src/session/fixedStepClock';
import { compileRoute } from '../../../game/src/simulation/geometry';
import { resolveTowerStats } from '../../../game/src/simulation/encounter/stats';
import { FOOTPRINT, MAP, RANGE, ROUTE } from './map';
import type { DraftController, DraftEvent, DraftState, Mode, Persona, Point, Result } from './types';

// These are small map playtests, not the introduction campaign's final pacing.
// All costs, outcomes, targeting, modes, upgrades and movement run in the game kernel.
const TOWER_ID = 'courtyard_copilot';
const MAX_HEALTH = 100;
const ROUTE_GEOMETRY = compileRoute(ROUTE);
const ROUNDS = [
  {
    name: 'Hello, World!',
    hint: 'Place your first Copilots. Work arrives first, then two well-spaced Bugs.',
    work: 35, bug: 20,
    traffic: [{ kind: 'work', seconds: 0 }, { kind: 'work', seconds: 7 }, { kind: 'problem', seconds: 16 }, { kind: 'problem', seconds: 22 }],
  },
  {
    name: 'A little multitasking',
    hint: 'Work and Bugs now overlap. Try Auto, Build and Defend, or specialize a Copilot.',
    work: 40, bug: 25,
    traffic: [{ kind: 'work', seconds: 0 }, { kind: 'problem', seconds: 4 }, { kind: 'work', seconds: 6 }, { kind: 'problem', seconds: 9 }, { kind: 'work', seconds: 13 }],
  },
  {
    name: 'Around the Server',
    hint: 'The Server blocks sight. Check coverage on both sides and keep a final recovery position.',
    work: 45, bug: 30,
    traffic: [{ kind: 'work', seconds: 0 }, { kind: 'problem', seconds: 3 }, { kind: 'work', seconds: 6 }, { kind: 'problem', seconds: 9 }, { kind: 'work', seconds: 12 }, { kind: 'problem', seconds: 15 }],
  },
] as const;

const TOWER_DEFINITION = {
  id: TOWER_ID, label: 'Base Copilot', family: 'copilot', kind: 'targeted',
  coverage: { kind: 'area' }, canRotate: false,
  baseStats: { cost: 30, footprintRadius: FOOTPRINT, range: RANGE, cooldownTicks: 30, damagePerAction: 5, workPerAction: 5, commitmentTicks: 30 },
  capabilities: { work: true, problem: true },
  controls: { modes: ['auto', 'build', 'defend'], priorities: ['closest_to_product'] },
  abilities: [], externalEffects: [],
  upgrades: [
    { id: 'developer', label: 'Developer', cost: 20, operations: [{ kind: 'modify', modifiers: [
      { stat: 'cooldownTicks', operation: 'add', value: -6 },
      { stat: 'damagePerAction', operation: 'add', value: 2 },
    ] }] },
    { id: 'tester', label: 'Tester', cost: 20, operations: [{ kind: 'add_ability', ability: {
      kind: 'qa_aura', slowPercent: 10, computeBonus: 1,
      combination: { slow: 'strongest', compute: 'strongest' },
    } }] },
  ],
};

function contentFor(roundIndex: number, compute: number, health: number) {
  const round = ROUNDS[roundIndex]!;
  return {
    schemaVersion: 6, id: 'hello_world_courtyard_playtest', version: 'v01', map: MAP,
    product: { maximumHealth: MAX_HEALTH, initialHealth: health }, initialCompute: compute, towerLimit: 12,
    definitions: [
      { id: 'work', kind: 'work', speed: 1.6, requiredWork: round.work, computeReward: 12, healing: 4 },
      { id: 'problem', kind: 'problem', speed: 1.6, durability: round.bug, computeReward: 8, severityDamage: 16 },
    ],
    towerDefinitions: [TOWER_DEFINITION],
    wave: { id: `courtyard_round_${roundIndex + 1}`, spawns: round.traffic.map(item => ({
      offsetTicks: item.seconds * 60, definitionId: item.kind, routeId: 'main',
    })) },
  };
}

function personaOf(tower: EncounterSnapshot['towers'][number]): Persona {
  return tower.upgrades.includes('developer') ? 'developer' : tower.upgrades.includes('tester') ? 'tester' : 'base';
}

export function createDraftController(): DraftController {
  const clock = createFixedStepClock();
  let roundIndex = 0;
  let encounter: Encounter = createEncounter(contentFor(0, 100, MAX_HEALTH), 'courtyard_round_1');
  let snapshot = encounter.capture();
  let previous = { completed: 0, resolved: 0, missed: 0, debt: 0, ticks: 0 };
  let pending: DraftEvent[] = [];
  let cached: DraftState;

  const entityId = (id: number) => roundIndex * 1000 + id;
  function collect(events: readonly EncounterEvent[]) {
    for (const event of events) {
      const translated: DraftEvent = { type: event.type };
      if ('towerId' in event) translated.towerId = event.towerId;
      if ('entityId' in event) translated.entityId = entityId(event.entityId);
      if ('amount' in event) translated.amount = event.amount;
      if ('damage' in event) translated.amount = event.damage;
      if ('compute' in event) translated.compute = event.compute;
      pending.push(translated);
    }
  }

  // Capture once per changed frame/command, never for every renderer state() call.
  function refresh() {
    snapshot = encounter.capture();
    const round = ROUNDS[roundIndex]!;
    cached = {
      phase: snapshot.paused ? 'paused' : snapshot.phase === 'drained' ? (roundIndex === ROUNDS.length - 1 ? 'complete' : 'cleared') : snapshot.phase,
      round: roundIndex + 1, roundCount: ROUNDS.length, roundName: round.name, roundHint: round.hint,
      workCount: round.traffic.filter(item => item.kind === 'work').length,
      bugCount: round.traffic.filter(item => item.kind === 'problem').length,
      compute: snapshot.compute, health: snapshot.productHealth, maxHealth: MAX_HEALTH,
      completed: previous.completed + snapshot.totals.completedWork,
      resolved: previous.resolved + snapshot.totals.resolvedProblems,
      missed: previous.missed + snapshot.totals.missedWork,
      debt: previous.debt + snapshot.debt,
      time: (previous.ticks + snapshot.tick) / 60, speed: snapshot.speed,
      towers: snapshot.towers.map(tower => ({
        id: tower.id, ...tower.position, persona: personaOf(tower), mode: tower.action?.mode ?? 'auto',
        range: resolveTowerStats(encounter.content.towerDefinitions[0]!, tower).range,
        targetId: tower.action?.targetId == null ? null : entityId(tower.action.targetId),
      })),
      entities: encounter.positions().map(entity => {
        const routeProgress = entity.distance / ROUTE_GEOMETRY.totalLength;
        const maximum = entity.kind === 'work' ? round.work : round.bug;
        const ahead = ROUTE_GEOMETRY.pointAt(Math.min(1, routeProgress + .0001));
        const behind = ROUTE_GEOMETRY.pointAt(Math.max(0, routeProgress - .0001));
        return {
          id: entityId(entity.id), kind: entity.kind, ...entity.position,
          facing: Math.atan2(ahead.z - behind.z, ahead.x - behind.x),
          remaining: entity.remaining, maximum,
          progress: 1 - entity.remaining / maximum, slowed: entity.slowPercent > 0,
        };
      }),
    };
  }

  function dispatch(command: EncounterCommand, resetClock = false): Result {
    const result = encounter.dispatch(command);
    if (!result.accepted) return { accepted: false, reason: result.reason };
    collect(result.events);
    if (resetClock) clock.reset();
    refresh();
    return { accepted: true };
  }

  function tacticalRejection(): Result | null {
    if (snapshot.paused) return { accepted: false, reason: 'paused' };
    if (snapshot.phase !== 'preparation' && snapshot.phase !== 'active') return { accepted: false, reason: 'wrong_phase' };
    return null;
  }

  refresh();
  return {
    state: () => cached,
    update(timestamp) {
      if (snapshot.phase !== 'active' || snapshot.paused) return;
      const result = clock.advance(timestamp, snapshot.speed, () => {
        const step = encounter.advanceOneTick();
        collect(step.events);
        return step.advanced;
      });
      if (result.steps > 0) refresh();
      // A suspended tab must not silently skip simulation or accept tactical edits.
      if (result.overloaded && snapshot.phase === 'active' && !snapshot.paused) dispatch({ type: 'pause' }, true);
      if (snapshot.phase !== 'active') clock.reset();
    },
    place(point) {
      return dispatch({ type: 'place_tower', definitionId: TOWER_ID, position: { ...point }, facing: 0 });
    },
    preview(point) {
      const reason = encounter.previewPlacement(TOWER_ID, point);
      return reason ? { accepted: false, reason } : { accepted: true };
    },
    specialize(id, persona) {
      const rejection = tacticalRejection();
      if (rejection) return rejection;
      const tower = snapshot.towers.find(item => item.id === id);
      if (!tower) return { accepted: false, reason: 'unknown_tower' };
      // Persona branches are intentionally exclusive in this small map draft.
      if (personaOf(tower) !== 'base') return { accepted: false, reason: 'persona_already_chosen' };
      return dispatch({ type: 'buy_upgrade', towerId: id, upgradeId: persona });
    },
    setMode(id: number, mode: Mode) {
      return dispatch({ type: 'set_mode', towerId: id, mode });
    },
    start: () => dispatch({ type: 'start' }, true),
    pause: () => dispatch({ type: snapshot.paused ? 'resume' : 'pause' }, true),
    next() {
      if (snapshot.phase !== 'drained' || roundIndex === ROUNDS.length - 1) return { accepted: false, reason: 'wrong_phase' };
      const carried = snapshot;
      const purchased = carried.towers.reduce((total, tower) => {
        const definition = encounter.content.towerDefinitions.find(item => item.id === tower.definitionId)!;
        return total + definition.baseStats.cost + tower.upgrades.reduce((cost, id) => cost + definition.upgrades.find(item => item.id === id)!.cost, 0);
      }, 0);
      previous = {
        completed: previous.completed + carried.totals.completedWork,
        resolved: previous.resolved + carried.totals.resolvedProblems,
        missed: previous.missed + carried.totals.missedWork,
        debt: previous.debt + carried.debt, ticks: previous.ticks + carried.tick,
      };
      roundIndex++;
      // Replay existing purchases using exactly their original cost. Giving that
      // same amount back in the new initial budget keeps carryover net-neutral.
      encounter = createEncounter(contentFor(roundIndex, carried.compute + purchased, carried.productHealth), `courtyard_round_${roundIndex + 1}`);
      for (const tower of carried.towers) {
        const commands: EncounterCommand[] = [
          { type: 'place_tower', definitionId: tower.definitionId, position: tower.position, facing: tower.facing },
          ...tower.upgrades.map(upgradeId => ({ type: 'buy_upgrade' as const, towerId: tower.id, upgradeId })),
          { type: 'set_mode', towerId: tower.id, mode: tower.action!.mode },
        ];
        for (const command of commands) {
          const result = encounter.dispatch(command);
          if (!result.accepted) throw new Error(`Cannot carry Courtyard team into next round: ${result.reason}.`);
        }
      }
      if (carried.speed !== 1) encounter.dispatch({ type: 'set_speed', speed: carried.speed });
      pending.push({ type: 'round_prepared' });
      clock.reset();
      refresh();
      return { accepted: true };
    },
    reset() {
      roundIndex = 0;
      previous = { completed: 0, resolved: 0, missed: 0, debt: 0, ticks: 0 };
      encounter = createEncounter(contentFor(0, 100, MAX_HEALTH), 'courtyard_round_1');
      pending = [{ type: 'reset' }];
      clock.reset();
      refresh();
    },
    setSpeed: speed => dispatch({ type: 'set_speed', speed }, true),
    coverage(point, target) {
      const tower = snapshot.towers.find(item => Math.hypot(item.position.x - point.x, item.position.z - point.z) < 1e-7);
      return encounter.inspectCoverage(tower ?? { definitionId: TOWER_ID, position: point, facing: 0, coverageKind: 'area' }, target) === 'visible';
    },
    events() {
      const events = pending;
      pending = [];
      return events;
    },
  };
}
