import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  captureProgress, clampStoryTime, STORY_BEATS, STORY_DURATION, STORY_SHOTS, STORY_SHOT_TIMES,
  storyCamera, storyFrame, storyPose, type StoryRole,
} from '../../src/content/story/octocatAbduction';

const roles: readonly StoryRole[] = ['copilot', 'octocat', 'bug-left', 'bug-right'];

describe('Octocat abduction story timeline', () => {
  it('has contiguous, ordered shots and ends within one minute', () => {
    expect(STORY_DURATION).toBeGreaterThan(0);
    expect(STORY_DURATION).toBeLessThanOrEqual(60);
    expect(STORY_SHOTS.map(shot => shot.start)).toEqual(STORY_SHOT_TIMES);
    STORY_SHOTS.forEach((shot, index) => {
      expect(shot.end).toBeGreaterThan(shot.start);
      expect(shot.end).toBe(STORY_SHOTS[index + 1]?.start ?? STORY_DURATION);
      expect(storyFrame(shot.start).shot).toBe(shot.name);
      expect(storyFrame(shot.end - .001).shot).toBe(shot.name);
      expect(storyCamera(shot.start).position).toEqual(shot.camera);
    });
    expect(storyFrame(STORY_DURATION)).toMatchObject({ finished: true, caption: 'TO BE CONTINUED' });
    expect(storyCamera(STORY_DURATION).position).toEqual(STORY_SHOTS.at(-1)!.cameraEnd);
  });

  it('clamps invalid seeks, reaches the exact terminal frame and replays deterministically', () => {
    for (const time of [NaN, Infinity, -Infinity, -1]) {
      expect(clampStoryTime(time)).toBe(0);
      expect(storyFrame(time)).toEqual(storyFrame(0));
      expect(storyCamera(time)).toEqual(storyCamera(0));
    }
    expect(storyFrame(STORY_DURATION - .001).finished).toBe(false);
    expect(storyFrame(STORY_DURATION)).toEqual(storyFrame(STORY_DURATION + 100));
    const opening = roles.map(role => storyPose(role, 0));
    for (const time of [STORY_BEATS.tow + 2, STORY_DURATION, 12, STORY_BEATS.lock, 0]) roles.forEach(role => storyPose(role, time));
    expect(roles.map(role => storyPose(role, 0))).toEqual(opening);
    expect(storyFrame(0).finished).toBe(false);
  });

  it('lets both characters talk before enemies arrive, then carries Octocat away', () => {
    expect(storyFrame(2)).toMatchObject({ speaker: 'Base Copilot', caption: expect.any(String) });
    expect(storyFrame(7)).toMatchObject({ speaker: 'Octocat', caption: expect.any(String) });
    expect(storyPose('bug-left', STORY_SHOT_TIMES[2] - .001).visible).toBe(false);
    expect(storyPose('bug-left', STORY_SHOT_TIMES[2]).visible).toBe(true);
    expect(storyPose('bug-right', STORY_BEATS.notice - .001).visible).toBe(false);
    expect(storyPose('bug-right', STORY_BEATS.notice).visible).toBe(true);
    const ordered = [STORY_BEATS.notice, STORY_BEATS.turn, STORY_BEATS.grab, STORY_BEATS.lock, STORY_BEATS.lift, STORY_BEATS.tow, STORY_BEATS.exit, STORY_BEATS.title];
    expect(ordered.every((time, index) => index === 0 || time > ordered[index - 1]!)).toBe(true);
    expect(captureProgress(STORY_BEATS.grab - .001)).toBe(0);
    expect(captureProgress(STORY_BEATS.lock)).toBe(1);
    expect(storyPose('octocat', STORY_BEATS.lift).position[1]).toBe(0);
    expect(storyPose('octocat', STORY_BEATS.lift + 1).position[1]).toBeGreaterThan(0);
    expect(storyPose('copilot', STORY_BEATS.notice + .1).clip).toBe('story_alarm');
    expect(storyPose('octocat', STORY_BEATS.turn + .1).clip).toBe('story_startle');
    expect(storyPose('octocat', STORY_BEATS.lift + .5).clip).toBe('story_struggle');
    for (const enemy of ['bug-left', 'bug-right'] as const) {
      const start = storyPose(enemy, STORY_BEATS.tow).position;
      const carried = storyPose(enemy, STORY_BEATS.tow + 2).position;
      const catStart = storyPose('octocat', STORY_BEATS.tow).position;
      const catCarried = storyPose('octocat', STORY_BEATS.tow + 2).position;
      expect(carried[0] - start[0]).toBeGreaterThan(0);
      expect(carried[0] - start[0]).toBeCloseTo(catCarried[0] - catStart[0]);
      expect(storyPose(enemy, STORY_BEATS.exit - .001).visible).toBe(true);
      expect(storyPose(enemy, STORY_BEATS.exit).visible).toBe(false);
    }
    expect(storyPose('octocat', STORY_BEATS.exit - .001).visible).toBe(true);
    expect(storyPose('octocat', STORY_BEATS.exit).visible).toBe(false);
    expect(storyPose('copilot', STORY_DURATION).visible).toBe(true);
    expect(captureProgress(STORY_BEATS.exit)).toBe(0);
  });

  it('keeps every camera and actor sample finite, including arbitrary backwards seeks', () => {
    const times = [NaN, -Infinity, Infinity, -100, 100, ...Array.from({ length: STORY_DURATION * 4 + 1 }, (_, i) => i / 4).reverse()];
    for (const time of times) {
      const camera = storyCamera(time);
      expect([...camera.position, ...camera.target, camera.fov].every(Number.isFinite)).toBe(true);
      expect(camera.fov).toBeGreaterThan(0);
      for (const role of roles) {
        const pose = storyPose(role, time);
        expect([...pose.position, pose.heading, pose.clipTime].every(Number.isFinite)).toBe(true);
        if (pose.blend) {
          expect(Number.isFinite(pose.blend.clipTime)).toBe(true);
          expect(pose.blend.weight).toBeGreaterThanOrEqual(0);
          expect(pose.blend.weight).toBeLessThanOrEqual(1);
        }
      }
      expect(captureProgress(time)).toBeGreaterThanOrEqual(0);
      expect(captureProgress(time)).toBeLessThanOrEqual(1);
    }
  });

  it('delivered character models contain every authored action used in the cinematic', () => {
    const assets = [
      { roles: ['copilot'] as const, file: '../assets/runtime/towers/copilot_base_v02.glb' },
      { roles: ['octocat'] as const, file: '../assets/runtime/towers/copilot_octocat_classic_lowpoly_v01.glb' },
      { roles: ['bug-left', 'bug-right'] as const, file: '../assets/runtime/enemies/problem_bug_v01.glb' },
    ];
    for (const asset of assets) {
      const bytes = readFileSync(asset.file);
      const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) as {
        animations: { name: string; channels: unknown[] }[];
      };
      const required = new Set<string>();
      for (let time = 0; time <= STORY_DURATION; time += .05) {
        for (const role of asset.roles) {
          const pose = storyPose(role, time);
          required.add(pose.clip);
          if (pose.blend) required.add(pose.blend.clip);
        }
      }
      for (const clip of required) {
        const animation = gltf.animations.find(animation => animation.name === clip);
        expect(animation, `${asset.file} must deliver ${clip}`).toBeDefined();
        expect(animation!.channels.length).toBeGreaterThan(0);
      }
    }
  });
});
