import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { STORY_BUG_APPROACH, STORY_DURATION, storyPose } from '../../src/content/story/octocatAbduction';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const audit = JSON.parse(readFileSync(`${root}artifacts/story-caption-blocking-20260930/path-review/final-clearance.json`, 'utf8')) as {
  frames: number;
  sha256: Record<string, string>;
  collisions: unknown[];
  captiveContacts: unknown[];
  minimumObstacleGaps: Record<string, { gap: number; time: number }>;
  minimumPairGaps: Record<string, { gap: number; time: number }>;
};

describe('Octocat courtyard blocking', () => {
  it('binds the continuous animated geometry audit to current staging and delivered meshes', () => {
    // This evidence checks deformed feet, shell, head and orientation turns,
    // rather than accepting a small centre-point collision radius.
    for (const [file, expected] of Object.entries(audit.sha256)) {
      const bytes = readFileSync(`${root}${file}`);
      const content = file.endsWith('.ts') ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes;
      expect(createHash('sha256').update(content).digest('hex'), file).toBe(expected);
    }
    expect(Object.keys(audit.sha256)).toHaveLength(6);
    expect(audit.frames).toBe(STORY_DURATION * 60 + 1);
    expect(audit.collisions).toEqual([]);
    expect(audit.captiveContacts).toEqual([]);
    for (const [pair, sample] of Object.entries(audit.minimumObstacleGaps)) expect(sample.gap, pair).toBeGreaterThan(.3);
    for (const [pair, sample] of Object.entries(audit.minimumPairGaps)) {
      expect(sample.gap, pair).toBeGreaterThan(pair === 'octocat / carrier' ? .015 : .18);
    }
  });

  it('keeps planted stride phase coupled to actual travel through eased approaches and tow', () => {
    for (const role of ['bug-left', 'bug-right'] as const) {
      const route = STORY_BUG_APPROACH[role];
      const direction = [route.end[0] - route.start[0], route.end[2] - route.start[2]];
      const heading = Math.atan2(direction[0]!, direction[1]!);
      for (let time = route.startTime + .3; time < route.endTime - .1; time += .1) {
        const a = storyPose(role, time), b = storyPose(role, time + .05);
        const travel = Math.hypot(b.position[0] - a.position[0], b.position[2] - a.position[2]);
        expect(a.heading).toBeCloseTo(heading, 10);
        expect((b.clipTime - a.clipTime) / (11 / 6) * .65).toBeCloseTo(travel, 10);
      }
      for (let time = 30.3; time < 34.9; time += .1) {
        const a = storyPose(role, time), b = storyPose(role, time + .05);
        expect((b.clipTime - a.clipTime) / (4 / 3) * .7).toBeCloseTo(b.position[0] - a.position[0], 10);
        expect(b.position[2]).toBe(a.position[2]);
        expect(a.heading).toBeCloseTo(Math.PI / 2, 10);
      }
    }
  });
});
