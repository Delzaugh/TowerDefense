import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { stressMapEnabled } from '../../vite.config';

const gameRoot = fileURLToPath(new URL('../..', import.meta.url));

describe('stress map build exclusion', () => {
  it('defaults release off and honors the explicit override in every mode', () => {
    expect(stressMapEnabled('development', {})).toBe(true);
    expect(stressMapEnabled('production', {})).toBe(true);
    expect(stressMapEnabled('release', {})).toBe(false);
    expect(stressMapEnabled('production', { VITE_ENABLE_STRESS_MAP: 'false' })).toBe(false);
    expect(stressMapEnabled('release', { VITE_ENABLE_STRESS_MAP: 'true' })).toBe(true);
  });

  it.each([true, false])('really %s includes the dynamic fixture and its exclusive GLBs', async enabled => {
    const result = await build({ root: gameRoot, mode: 'production', logLevel: 'silent',
      define: { __STRESS_MAP_ENABLED__: JSON.stringify(enabled) }, build: { write: false } });
    if (Array.isArray(result) || !('output' in result)) throw new Error('Expected one application build.');
    const files = result.output.map(item => item.fileName);
    expect(files.some(file => file.endsWith('.tsx'))).toBe(false);
    expect(files.some(file => /StressScreen.*\.js$/.test(file))).toBe(enabled);
    expect(files.some(file => /StressScreen.*\.css$/.test(file))).toBe(enabled);
    for (const id of ['problem_lag_spike', 'problem_vague_spec', 'problem_dead_code', 'work_coding_task']) {
      expect(files.some(file => file.includes(`${id}_v01`) && file.endsWith('.glb'))).toBe(enabled);
    }
    const entry = result.output.find(item => item.type === 'chunk' && item.isEntry);
    expect(entry?.type === 'chunk' && entry.code.includes('StressScreen')).toBe(enabled);
  }, 60000);
});
