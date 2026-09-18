import { canonicalJson, freezeData, identifierSchema, parseData, ValidationError } from '../content/schemas/data';
import { parseScenario } from '../content/schemas/scenario';
import type { Point, Scenario } from '../content/schemas/scenario';
import { commandSchema } from './commands';
import type { CommandResult, Rejection } from './commands';
import { circleIntersectsRectangle, compileRoute, containsPoint, MARKER_RADIUS, segmentIntersectsRectangle } from './geometry';
import { snapshotSchema, TICKS_PER_SECOND } from './state';
import type { SimulationEvent, SimulationSnapshot } from './state';

export function placementRejection(scenario: Scenario, point: Point): Rejection | null {
  if (!containsPoint(scenario.map.buildable, point, MARKER_RADIUS)) return 'outside_buildable';
  if (scenario.map.obstacles.some(obstacle => circleIntersectsRectangle(point, MARKER_RADIUS, obstacle.footprint))) return 'blocked';
  return null;
}

function invalidSnapshot(message: string, path: string): never {
  throw new ValidationError([{ code: 'invalid_snapshot', path, message }]);
}

export function validateSnapshot(scenario: Scenario, input: unknown): SimulationSnapshot {
  const state = parseData(snapshotSchema, input);
  if (state.scenarioId !== scenario.id || state.scenarioVersion !== scenario.version || state.contentSignature !== canonicalJson(scenario)) {
    invalidSnapshot('Snapshot content does not match the supplied scenario.', 'contentSignature');
  }
  if (state.tick > scenario.durationTicks) invalidSnapshot('Tick exceeds the route duration.', 'tick');
  if (state.phase === 'preparation' && state.tick !== 0) invalidSnapshot('Preparation must be at tick zero.', 'phase');
  if (state.phase === 'running' && (state.tick >= scenario.durationTicks || state.commandSequence === 0)) invalidSnapshot('Running state is inconsistent.', 'phase');
  if (state.phase === 'complete' && (state.tick !== scenario.durationTicks || state.commandSequence === 0)) invalidSnapshot('Complete state is inconsistent.', 'phase');
  if (state.paused && state.phase !== 'running') invalidSnapshot('Only an active route can be paused.', 'paused');
  if (state.eventSequence !== state.commandSequence + (state.phase === 'complete' ? 1 : 0)) invalidSnapshot('Event sequence is inconsistent.', 'eventSequence');
  if (state.marker && placementRejection(scenario, state.marker)) invalidSnapshot('Marker placement is invalid.', 'marker');
  return freezeData(state);
}

export interface Simulation {
  readonly scenario: Scenario;
  dispatch(input: unknown): CommandResult;
  advanceOneTick(): { readonly advanced: boolean; readonly events: readonly SimulationEvent[] };
  capture(): SimulationSnapshot;
  probePosition(): Point;
  markerHasSight(): boolean | null;
}

function construct(scenario: Scenario, initial: SimulationSnapshot): Simulation {
  // Private mutable state; every outward snapshot is detached and deeply frozen.
  const state = { ...initial, marker: initial.marker ? { ...initial.marker } : null };
  const route = compileRoute(scenario.map.routes.find(item => item.id === scenario.routeId)!.points);
  const position = () => route.pointAt(state.tick / scenario.durationTicks);
  const event = (type: SimulationEvent['type']): SimulationEvent => Object.freeze({ sequence: ++state.eventSequence, tick: state.tick, type });
  const reject = (reason: Rejection): CommandResult => ({ accepted: false, reason, events: [] });
  return {
    scenario,
    dispatch(input) {
      let command;
      try { command = parseData(commandSchema, input); }
      catch (error) {
        if (error instanceof ValidationError) return { accepted: false, reason: 'invalid_command', issues: error.issues, events: [] };
        throw error;
      }
      // Rejections are immediate and have no side effects; there is no deferred queue.
      if (state.paused && command.type !== 'resume') return reject('paused');
      if (state.eventSequence >= Number.MAX_SAFE_INTEGER - 3) return reject('sequence_limit');
      let eventType: SimulationEvent['type'];
      switch (command.type) {
        case 'start':
          if (state.phase !== 'preparation') return reject('wrong_phase');
          state.phase = 'running'; eventType = 'started'; break;
        case 'pause':
          if (state.phase !== 'running') return reject('wrong_phase');
          state.paused = true; eventType = 'paused'; break;
        case 'resume':
          if (!state.paused) return reject('not_paused');
          state.paused = false; eventType = 'resumed'; break;
        case 'set_speed':
          if (state.phase === 'complete') return reject('wrong_phase');
          state.speed = command.speed; eventType = 'speed_changed'; break;
        case 'place_marker': {
          if (state.phase === 'complete') return reject('wrong_phase');
          const rejection = placementRejection(scenario, command.position);
          if (rejection) return reject(rejection);
          state.marker = { ...command.position }; eventType = 'marker_placed'; break;
        }
      }
      state.commandSequence++;
      return { accepted: true, events: Object.freeze([event(eventType)]) };
    },
    advanceOneTick() {
      if (state.phase !== 'running' || state.paused) return { advanced: false, events: [] };
      state.tick++;
      if (state.tick === scenario.durationTicks) {
        state.phase = 'complete';
        return { advanced: true, events: Object.freeze([event('route_completed')]) };
      }
      return { advanced: true, events: [] };
    },
    capture() { return freezeData({ ...state, marker: state.marker ? { ...state.marker } : null }); },
    probePosition: position,
    markerHasSight() {
      if (!state.marker) return null;
      const point = position();
      return !scenario.map.obstacles.some(obstacle => obstacle.blocksSight && segmentIntersectsRectangle(state.marker!, point, obstacle.footprint));
    },
  };
}

export function createSimulation(input: unknown, runId: string): Simulation {
  const scenario = parseScenario(input);
  parseData(identifierSchema, runId);
  return construct(scenario, freezeData({
    schemaVersion: 1, rulesVersion: 1, ticksPerSecond: TICKS_PER_SECOND,
    scenarioId: scenario.id, scenarioVersion: scenario.version, contentSignature: canonicalJson(scenario),
    runId, phase: 'preparation', paused: false, speed: 1, tick: 0,
    commandSequence: 0, eventSequence: 0, marker: null,
  }));
}

export function restoreSimulation(input: unknown, snapshot: unknown): Simulation {
  const scenario = parseScenario(input);
  return construct(scenario, validateSnapshot(scenario, snapshot));
}
