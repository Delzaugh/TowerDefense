import { expect, it } from 'vitest';
import { millisecondsToTicks, ticksToMilliseconds } from '../../src/content/waveRecipe';

it.each([[0, 0], [1, 0], [8, 0], [9, 1], [16.667, 1], [100, 6], [125, 8], [250, 15], [1000, 60], [600000, 36000]])('converts %s milliseconds to %s ticks', (milliseconds, ticks) => {
  expect(millisecondsToTicks(String(milliseconds))).toBe(ticks);
});
it.each(['', ' ', '-1', '600001', 'Infinity', 'NaN', 'abc'])('rejects invalid millisecond interval %j', input => {
  expect(() => millisecondsToTicks(input)).toThrow('Interval must be');
});
it('round-trips every supported tick interval through readable milliseconds without drift', () => {
  for (let ticks = 0; ticks <= 36000; ticks++) expect(millisecondsToTicks(String(ticksToMilliseconds(ticks)))).toBe(ticks);
});
