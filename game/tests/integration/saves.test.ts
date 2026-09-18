import { describe, expect, it } from 'vitest';
import { createSave, parseSave } from '../../src/persistence/saveSchema';
import { createMemoryRepository, SaveConflictError } from '../../src/persistence/saveRepository';
import { createSimulation } from '../../src/simulation/createSimulation';
import { scenario } from '../fixtures/helpers';

describe('versioned saves', () => {
  it('accepts preparation and completion, but never active or paused-active saves', () => {
    const config = scenario(1); const sim = createSimulation(config, 'run_test');
    expect(parseSave(config, createSave(config, sim.capture())).snapshot.phase).toBe('preparation');
    sim.dispatch({ type: 'start' });
    expect(() => createSave(config, sim.capture())).toThrow('Save only');
    sim.dispatch({ type: 'pause' });
    expect(() => createSave(config, sim.capture())).toThrow('Save only');
    sim.dispatch({ type: 'resume' }); sim.advanceOneTick();
    expect(createSave(config, sim.capture()).snapshot.phase).toBe('complete');
  });
  it('rejects incompatible envelopes and extra fields', () => {
    const config = scenario(); const envelope = createSave(config, createSimulation(config, 'run_test').capture());
    for (const change of [{ version: 2 }, { format: 'other' }, { extra: true }, { snapshot: null }]) {
      expect(() => parseSave(config, { ...envelope, ...change })).toThrow();
    }
  });
  it('uses detached records and optimistic revisions', async () => {
    const repository = createMemoryRepository();
    expect(await repository.read()).toBeNull();
    const data = { value: 1 };
    expect(await repository.write(data, null)).toBe(1);
    data.value = 2;
    expect((await repository.read())?.envelope).toEqual({ value: 1 });
    await expect(repository.write({ value: 3 }, null)).rejects.toBeInstanceOf(SaveConflictError);
    expect(await repository.write({ value: 4 }, 1)).toBe(2);
    repository.close();
    await expect(repository.read()).rejects.toThrow('closed');
  });
});
