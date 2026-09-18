import { freezeData, parseData, canonicalJson } from '../../content/schemas/data';
import { parseEncounter } from '../../content/schemas/encounter';
import type { EncounterContent } from '../../content/schemas/encounter';
import type { Point } from '../../content/schemas/scenario';
import { encounterCommandSchema } from './commands';
import type { EncounterCommandResult, Rejection } from './commands';
import { encounterSnapshotSchema } from './state';
import type { EncounterEvent, EncounterSnapshot, MutableSnapshot, Emit } from './state';
import { compileEncounter, makeEntity, entityPosition } from './content';
import type { Compiled } from './content';
import { initialState, validateSnapshot } from './snapshot';
import { placementRejection } from './towers';
import { visibility } from './targeting';
import type { CoverageTower } from './targeting';
import { act, clearInvalidTargets, setTarget } from './actions';
import { settle } from './outcomes';
import { resolveCoverage } from './coverage';
import { resolveTowerStats, resolveQaAura } from './stats';
import { qaEffectsAt } from './effects';

function construct(content: EncounterContent, state: MutableSnapshot, compiled: Compiled) {
  const emit: Emit = payload => freezeData({ ...payload, tick: state.tick, sequence: ++state.eventSequence });
  return {
    content,
    capture(): EncounterSnapshot { return freezeData(parseData(encounterSnapshotSchema, state)); },
    positions() { return freezeData(state.entities.map(entity => ({ ...entity, position: entityPosition(compiled, entity), ...qaEffectsAt(content, compiled, state, entity) }))); },
    previewPlacement(definitionId: string, point: Point) { return placementRejection(content, state, definitionId, point); },
    inspectCoverage(tower: CoverageTower, point: Point) { return visibility(content, tower, point); },
    dispatch(input: unknown): EncounterCommandResult {
      const parsed = encounterCommandSchema.safeParse(input);
      const reject = (reason: Rejection): EncounterCommandResult => ({ accepted: false, reason, events: [] });
      if (!parsed.success) return reject('invalid_command');
      const command = parsed.data;
      if (state.paused && command.type !== 'resume') return reject('paused');
      if (state.commandLog.length >= 10_000 || state.commandSequence >= Number.MAX_SAFE_INTEGER - 100_000_000 || state.eventSequence >= Number.MAX_SAFE_INTEGER - 100_000_000) return reject('sequence_limit');
      const events: EncounterEvent[] = [];
      switch (command.type) {
        case 'start':
          if (state.phase !== 'preparation') return reject('wrong_phase'); state.phase = 'active'; events.push(emit({ type: 'started' })); break;
        case 'pause':
          if (state.phase !== 'active') return reject('wrong_phase'); state.paused = true; events.push(emit({ type: 'paused' })); break;
        case 'resume':
          if (!state.paused) return reject('wrong_phase'); state.paused = false; events.push(emit({ type: 'resumed' })); break;
        case 'set_speed':
          if (state.phase !== 'preparation' && state.phase !== 'active') return reject('wrong_phase'); state.speed = command.speed; events.push(emit({ type: 'speed_changed' })); break;
        case 'place_tower': {
          const reason = placementRejection(content, state, command.definitionId, command.position);
          if (reason) return reject(reason);
          const definition = compiled.towers.get(command.definitionId)!;
          const id = state.nextTowerId++;
          state.towers.push({ id, definitionId: definition.id, position: { ...command.position }, facing: command.facing, coverageKind: definition.coverage.kind,
            statOverrides: {}, upgrades: [], activeEffects: [], placedTick: state.tick,
            action: definition.kind === 'targeted' ? { mode: definition.controls.modes[0]!, priority: definition.controls.priorities[0]!, readyTick: state.tick, targetId: null, commitmentUntil: 0 } : null });
          const { cost } = resolveTowerStats(definition);
          state.compute -= cost; state.totals.computeSpent += cost;
          events.push(emit({ type: 'tower_placed', towerId: id })); break;
        }
        case 'set_mode': case 'set_priority': case 'set_facing': case 'set_coverage': case 'set_stats': {
          if (state.phase !== 'active' && state.phase !== 'preparation') return reject('wrong_phase');
          if ((command.type === 'set_facing' || command.type === 'set_coverage' || command.type === 'set_stats') && state.phase !== 'preparation') return reject('wrong_phase');
          const tower = state.towers.find(item => item.id === command.towerId);
          if (!tower) return reject('unknown_tower');
          const definition = compiled.towers.get(tower.definitionId)!;
          if (command.type === 'set_mode' && (definition.kind !== 'targeted' || !definition.controls.modes.includes(command.mode))) return reject('unsupported_control');
          if (command.type === 'set_priority' && (definition.kind !== 'targeted' || !definition.controls.priorities.includes(command.priority))) return reject('unsupported_control');
          if (command.type === 'set_facing' && !definition.canRotate) return reject('unsupported_control');
          if (command.type === 'set_stats' && definition.kind === 'passive' && Object.keys(command.overrides).some(key => key !== 'range')) return reject('unsupported_control');
          if (command.type === 'set_stats' && !compiled.towers.get(tower.definitionId)!.allowStatTuning) return reject('stat_tuning_disabled');
          if (command.type === 'set_coverage' && !resolveCoverage(content, { ...tower, coverageKind: command.coverageKind })) return reject('unsupported_coverage');
          if (command.type === 'set_mode') tower.action!.mode = command.mode;
          else if (command.type === 'set_priority') tower.action!.priority = command.priority;
          else if (command.type === 'set_facing') tower.facing = command.facing;
          else if (command.type === 'set_coverage') tower.coverageKind = command.coverageKind;
          else tower.statOverrides = { ...command.overrides };
          events.push(emit({ type: 'tower_configured', towerId: tower.id }));
          setTarget(tower, null, state, compiled, emit, events); break;
        }
        case 'buy_upgrade': case 'apply_effect': case 'remove_effect': {
          if (state.phase !== 'active' && state.phase !== 'preparation') return reject('wrong_phase');
          const tower = state.towers.find(item => item.id === command.towerId);
          if (!tower) return reject('unknown_tower');
          const definition = compiled.towers.get(tower.definitionId)!;
          if (command.type === 'buy_upgrade') {
            const upgrade = definition.upgrades.find(item => item.id === command.upgradeId);
            if (!upgrade) return reject('unknown_upgrade');
            if (tower.upgrades.includes(upgrade.id)) return reject('already_owned');
            const added = upgrade.operations.filter(op => op.kind === 'add_ability').length;
            if (added > 1 || added && resolveQaAura(definition, tower)) return reject('ability_conflict');
            const candidate = { ...tower, upgrades: [...tower.upgrades, upgrade.id] };
            if (!resolveQaAura(definition, candidate) && upgrade.operations.some(op => op.kind === 'modify' && op.modifiers.some(modifier => modifier.stat.startsWith('qa')))) return reject('unsupported_effect');
            if (state.compute < upgrade.cost) return reject('insufficient_compute');
            tower.upgrades.push(upgrade.id); state.compute -= upgrade.cost; state.totals.computeSpent += upgrade.cost;
            events.push(emit({ type: 'tower_upgraded', towerId: tower.id }));
          } else {
            const effect = definition.externalEffects.find(item => item.id === command.effectId);
            if (!effect || effect.modifiers.some(modifier => modifier.stat.startsWith('qa')) && !resolveQaAura(definition, tower)) return reject('unsupported_effect');
            const index = tower.activeEffects.findIndex(item => item.effectId === effect.id && item.sourceId === command.sourceId);
            if (command.type === 'remove_effect') {
              if (index < 0) return reject('unsupported_effect');
              tower.activeEffects.splice(index, 1); events.push(emit({ type: 'effect_removed', towerId: tower.id }));
            } else {
              if (index < 0 && tower.activeEffects.length >= 32) return reject('effect_limit');
              const active = { effectId: effect.id, sourceId: command.sourceId, appliedTick: state.tick, expiresTick: state.tick + effect.durationTicks };
              if (index < 0) tower.activeEffects.push(active); else tower.activeEffects[index] = active;
              events.push(emit({ type: 'effect_applied', towerId: tower.id }));
            }
          }
          // Existing cooldown/commitment deadlines remain; new actions use new stats.
          clearInvalidTargets(content, compiled, state, emit, events); break;
        }
      }
      state.commandLog.push({ tick: state.tick, command });
      state.commandSequence++;
      return { accepted: true, events: Object.freeze(events) };
    },
    advanceOneTick(): { advanced: boolean; events: readonly EncounterEvent[] } {
      if (state.phase !== 'active' || state.paused) return { advanced: false, events: [] };
      const events: EncounterEvent[] = [];
      state.tick++;
      for (const tower of state.towers) tower.activeEffects = tower.activeEffects.filter(effect => state.tick <= effect.expiresTick);
      while (state.spawnCursor < compiled.schedule.length && compiled.schedule[state.spawnCursor]!.offsetTicks < state.tick) {
        const item = compiled.schedule[state.spawnCursor++]!;
        state.entities.push(makeEntity(item)); state.nextEntityId++;
        events.push(emit({ type: 'spawned', entityId: item.id, kind: item.definition.kind }));
      }
      act(content, compiled, state, emit, events);
      for (const entity of state.entities) {
        const item = compiled.schedule[entity.id - 1]!;
        const slow = qaEffectsAt(content, compiled, state, entity).slowPercent;
        entity.travelUnits += 10_000 - Math.round(slow * 100);
        entity.distance = Math.min(item.route.totalLength, (entity.travelUnits / 10_000) * item.definition.speed / 60);
      }
      const removed = new Set<number>();
      for (const entity of state.entities) {
        if (entity.distance < compiled.schedule[entity.id - 1]!.route.totalLength) continue;
        removed.add(entity.id); events.push(settle(content, compiled, state, entity, false, emit));
        if (state.productHealth === 0) { state.phase = 'failed'; events.push(emit({ type: 'product_destroyed' })); break; }
      }
      state.entities = state.entities.filter(entity => !removed.has(entity.id));
      // A duration of N applies to exactly the next N simulation steps.
      for (const tower of state.towers) tower.activeEffects = tower.activeEffects.filter(effect => state.tick < effect.expiresTick);
      clearInvalidTargets(content, compiled, state, emit, events);
      if (state.phase === 'active' && state.spawnCursor === compiled.schedule.length && state.entities.length === 0) {
        state.phase = 'drained'; events.push(emit({ type: 'wave_drained' }));
      }
      return { advanced: true, events: Object.freeze(events) };
    },
  };
}
export function createEncounter(input: unknown, runId: string) {
  const content = parseEncounter(input);
  return construct(content, initialState(content, runId), compileEncounter(content));
}
export function restoreEncounter(input: unknown, snapshot: unknown) {
  const content = parseEncounter(input), compiled = compileEncounter(content);
  const saved = validateSnapshot(content, snapshot);
  const replayState = initialState(content, saved.runId), replay = construct(content, replayState, compiled);
  const advanceTo = (tick: number) => {
    if (tick < replayState.tick || tick > saved.tick) throw new Error('Invalid command chronology.');
    while (replayState.tick < tick) if (!replay.advanceOneTick().advanced) throw new Error('Snapshot cannot advance to its recorded tick.');
  };
  for (const entry of saved.commandLog) {
    advanceTo(entry.tick);
    const result = replay.dispatch(entry.command);
    if (!result.accepted) throw new Error(`Invalid saved command: ${result.reason}.`);
  }
  advanceTo(saved.tick);
  if (canonicalJson(replayState) !== canonicalJson(saved)) throw new Error('Snapshot disagrees with authoritative command replay.');
  return replay;
}
export type Encounter = ReturnType<typeof createEncounter>;
