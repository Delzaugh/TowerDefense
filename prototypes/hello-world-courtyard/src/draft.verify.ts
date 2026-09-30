import assert from 'node:assert/strict';
import { createDraftController } from './draft';
import type { DraftController } from './types';

/** Focused checks for the native-kernel adapter. Load with Vite's ssrLoadModule. */
export function verifyDraftController() {
  const runRound = (draft: DraftController) => {
    assert.equal(draft.start().accepted, true);
    draft.update(0);
    for (let timestamp = 100; timestamp <= 120_000 && draft.state().phase === 'active'; timestamp += 100) {
      draft.update(timestamp);
      const state = draft.state(), offset = (state.round - 1) * 1000;
      assert.ok(state.entities.every(entity => entity.id > offset && entity.id < offset + 1000 && Number.isFinite(entity.facing) && entity.progress >= 0 && entity.progress <= 1));
      assert.ok(state.towers.every(tower => tower.targetId === null || tower.targetId > offset && tower.targetId < offset + 1000));
    }
    assert.notEqual(draft.state().phase, 'active', 'Round must finish within the bounded playtest window.');
  };

  const untouched = createDraftController();
  assert.equal(untouched.start().accepted, true);
  untouched.update(0);
  for (let timestamp = 100; timestamp <= 1000; timestamp += 100) untouched.update(timestamp);
  const movingWork = untouched.state().entities.find(entity => entity.kind === 'work')!;
  assert.ok(movingWork.x > -15, 'Untouched Work has moved along the route.');
  assert.equal(movingWork.remaining, movingWork.maximum);
  assert.equal(movingWork.progress, 0, 'Travel alone does not fill the Work completion bar.');

  const processing = createDraftController();
  assert.equal(processing.place({ x: -11, z: -4 }).accepted, true);
  assert.equal(processing.start().accepted, true);
  processing.update(0);
  for (let timestamp = 100; timestamp <= 1000; timestamp += 100) processing.update(timestamp);
  const partialWork = processing.state().entities.find(entity => entity.kind === 'work')!;
  assert.ok(partialWork.remaining > 0 && partialWork.remaining < partialWork.maximum);
  assert.equal(partialWork.progress, 1 - partialWork.remaining / partialWork.maximum, 'Partial Work reports the processed fraction of its required work.');

  const draft = createDraftController();
  assert.equal(draft.state().compute, 100);
  assert.equal(draft.state().round, 1);
  assert.equal(draft.state(), draft.state(), 'Idle state() returns its cached view.');
  assert.equal(draft.preview({ x: -11, z: -8 }).reason, 'path_blocked');
  assert.equal(draft.preview({ x: 17, z: -10 }).reason, 'outside_buildable');
  assert.equal(draft.preview({ x: 4, z: 0 }).reason, 'blocked');
  assert.equal(draft.preview({ x: -12, z: 7 }).reason, 'blocked');
  assert.equal(draft.coverage({ x: 4.6, z: -2.6 }, { x: .3, z: -.5 }), false, 'Server blocks in-range coverage.');
  assert.equal(draft.coverage({ x: 4.6, z: -2.6 }, { x: 0, z: -4 }), true, 'Sight beside the Server remains clear.');
  assert.equal(draft.coverage({ x: -3.5, z: 0 }, { x: 2, z: 0 }), false, 'Coverage obeys the native radius.');

  assert.equal(draft.place({ x: -11, z: -4 }).accepted, true);
  assert.equal(draft.place({ x: -3.5, z: 0 }).accepted, true);
  assert.equal(draft.state().compute, 40);
  assert.equal(draft.specialize(1, 'developer').accepted, true);
  assert.equal(draft.specialize(1, 'tester').reason, 'persona_already_chosen');
  assert.equal(draft.state().compute, 20, 'Rejected branch switch has no cost.');
  assert.equal(draft.specialize(2, 'tester').accepted, true);
  assert.equal(draft.state().compute, 0);
  assert.equal(draft.preview({ x: 8.5, z: 4.5 }).reason, 'insufficient_compute');
  assert.equal(draft.place({ x: 8.5, z: 4.5 }).reason, 'insufficient_compute');
  assert.deepEqual(draft.state().towers.map(tower => tower.persona), ['developer', 'tester']);
  assert.equal(draft.setMode(1, 'build').accepted, true);
  assert.equal(draft.setSpeed(2).accepted, true);
  assert.equal(draft.start().accepted, true);
  draft.update(0);
  draft.update(100);
  assert.equal(draft.state().time, .2, '2x speed advances twelve native ticks per 100 ms.');
  assert.equal(draft.pause().accepted, true);
  const paused = draft.state();
  draft.update(5000);
  assert.equal(draft.state(), paused, 'Pause freezes simulation and the cached state.');
  assert.equal(draft.setMode(1, 'defend').reason, 'paused');
  assert.equal(draft.specialize(1, 'tester').reason, 'paused');
  assert.equal(draft.setSpeed(1).reason, 'paused');
  assert.equal(draft.preview({ x: 8.5, z: 4.5 }).reason, 'paused');
  assert.equal(draft.place({ x: 8.5, z: 4.5 }).reason, 'paused');
  assert.equal(draft.pause().accepted, true);
  draft.update(0);
  for (let timestamp = 100; timestamp <= 120_000 && draft.state().phase === 'active'; timestamp += 100) draft.update(timestamp);
  assert.equal(draft.state().phase, 'cleared');
  assert.equal(draft.state().completed, 2);
  assert.equal(draft.state().resolved, 2);
  const roundOne = draft.state();
  const firstEvents = draft.events();
  assert.equal(firstEvents.filter(event => event.type === 'work_completed').length, 2);
  assert.equal(firstEvents.filter(event => event.type === 'problem_resolved').length, 2);
  assert.equal(draft.events().length, 0, 'Events drain exactly once.');
  assert.equal(draft.next().accepted, true);
  assert.equal(draft.state().round, 2);
  assert.equal(draft.state().phase, 'preparation');
  assert.equal(draft.state().compute, roundOne.compute, 'Team replay neither charges nor rewards twice.');
  assert.equal(draft.state().health, roundOne.health);
  assert.equal(draft.state().completed, roundOne.completed);
  assert.equal(draft.state().resolved, roundOne.resolved);
  assert.equal(draft.state().speed, 2);
  assert.deepEqual(draft.state().towers.map(tower => [tower.id, tower.persona, tower.mode]), [[1, 'developer', 'build'], [2, 'tester', 'auto']]);
  assert.equal(draft.specialize(2, 'developer').reason, 'persona_already_chosen');
  draft.setMode(1, 'auto');
  runRound(draft);
  const secondEvents = draft.events();
  assert.ok(secondEvents.filter(event => event.entityId !== undefined).every(event => event.entityId! > 1000 && event.entityId! < 2000));
  assert.ok(secondEvents.some(event => event.type === 'tower_action' && event.towerId === 1 && event.amount === 7), 'Developer uses the native upgraded damage.');
  assert.equal(draft.next().accepted, true);
  assert.equal(draft.state().round, 3);
  runRound(draft);
  assert.equal(draft.state().phase, 'complete');
  assert.equal(draft.next().accepted, false);
  assert.equal(draft.preview({ x: 9.5, z: 11.3 }).reason, 'wrong_phase');

  const buildOnly = createDraftController();
  for (const point of [{ x: -11, z: -4 }, { x: -3.5, z: 0 }, { x: 8.5, z: 4.5 }]) assert.equal(buildOnly.place(point).accepted, true);
  for (const tower of buildOnly.state().towers) assert.equal(buildOnly.setMode(tower.id, 'build').accepted, true);
  runRound(buildOnly);
  assert.equal(buildOnly.state().completed, 2, 'Build mode completes Work.');
  assert.equal(buildOnly.state().resolved, 0, 'Build mode cannot attack Bugs.');
  assert.equal(buildOnly.state().health, 68, 'Two leaked Bugs use native damage outcomes.');

  const defendOnly = createDraftController();
  for (const point of [{ x: -11, z: -4 }, { x: -3.5, z: 0 }, { x: 8.5, z: 4.5 }]) assert.equal(defendOnly.place(point).accepted, true);
  for (const tower of defendOnly.state().towers) assert.equal(defendOnly.setMode(tower.id, 'defend').accepted, true);
  runRound(defendOnly);
  assert.equal(defendOnly.state().completed, 0, 'Defend mode cannot process Work.');
  assert.equal(defendOnly.state().missed, 2);
  assert.equal(defendOnly.state().resolved, 2, 'Defend mode resolves Bugs.');

  const overlappingTesters = createDraftController();
  assert.equal(overlappingTesters.place({ x: -11, z: -4 }).accepted, true);
  assert.equal(overlappingTesters.place({ x: -7, z: -4 }).accepted, true);
  assert.equal(overlappingTesters.specialize(1, 'tester').accepted, true);
  assert.equal(overlappingTesters.specialize(2, 'tester').accepted, true);
  runRound(overlappingTesters);
  const qaRewards = overlappingTesters.events().filter(event => event.type === 'work_completed');
  assert.equal(qaRewards.length, 2);
  assert.ok(qaRewards.every(event => event.compute === 13), 'Overlapping Tester bonuses use strongest-only, yielding +1 rather than +2.');

  const empty = createDraftController();
  runRound(empty);
  assert.equal(empty.state().debt, 2);
  assert.equal(empty.state().missed, 2);
  assert.equal(empty.next().accepted, true);
  assert.equal(empty.state().debt, 2, 'Debt carries across rounds without another miss reward.');
  runRound(empty);
  empty.next();
  runRound(empty);
  assert.equal(empty.state().phase, 'failed', 'No-build play exposes a real fail/retry path.');
  empty.reset();
  assert.equal(empty.state().compute, 100);
  assert.equal(empty.state().health, 100);
  assert.equal(empty.state().round, 1);
  assert.equal(empty.state().towers.length, 0);
  assert.equal(empty.state().debt, 0);
  assert.equal(empty.state().time, 0);
  assert.equal(empty.state().speed, 1);
  assert.equal(empty.state().phase, 'preparation');

  return {
    status: 'passed',
    checks: ['Work completion progress independent of travel', 'native placement and Server coverage', 'budget and exclusive Personas', 'pause and 2x fixed-step speed', 'round carryover and entity/target/event IDs', 'Developer damage and strongest-only Tester rewards', 'Auto/Build/Defend modes', 'three-round complete', 'no-build failure and reset'],
    specializedOpening: { completed: draft.state().completed, resolved: draft.state().resolved, missed: draft.state().missed, health: draft.state().health, compute: draft.state().compute },
  };
}
