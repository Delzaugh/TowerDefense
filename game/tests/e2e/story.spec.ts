import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { STORY_BEATS, STORY_DURATION, STORY_SHOT_TIMES, storyFrame } from '../../src/content/story/octocatAbduction';

test.use({ video: 'on' });

type RenderSample = {
  calls: number;
  triangles: number;
  geometries: number; textures: number; pixelRatio: number;
  state: {
    time?: number; paused: boolean; reducedMotion: boolean; finished?: boolean; capture?: boolean; expression?: string | null; trapPhase?: string;
    actors?: { role: string; visible: boolean; position: number[] }[];
  };
};
const sample = (page: Page, name: 'campus' | 'story') => page.evaluate(name => {
  const registry = (window as unknown as { __TOWER_DIAGNOSTICS__?: Record<string, { sample(): RenderSample }> }).__TOWER_DIAGNOSTICS__;
  return registry?.[name]?.sample();
}, name);
const soundStates = (page: Page) => page.evaluate(() =>
  (window as unknown as { __STORY_AUDIO_REVIEW__: { states(): string[] } }).__STORY_AUDIO_REVIEW__.states());
const gpuInfo = (page: Page) => page.getByTestId('story-canvas').evaluate(element => {
  const gl = (element as HTMLCanvasElement).getContext('webgl2');
  if (!gl) return { renderer: null, vendor: null, softwareRendered: null };
  const extension = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  return { renderer, vendor: String(gl.getParameter(extension ? extension.UNMASKED_VENDOR_WEBGL : gl.VENDOR)),
    softwareRendered: /swiftshader|llvmpipe|software|basic render/i.test(renderer) };
});

async function home(page: Page) {
  await page.goto('/?diagnostics');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
}
async function openStory(page: Page) {
  await page.getByRole('button', { name: /^Play story scene/ }).click();
  await expect(page.getByTestId('story-player')).toHaveAttribute('data-state', 'ready', { timeout: 40_000 });
}
async function seek(page: Page, seconds: number) {
  const timeline = page.getByRole('slider', { name: 'Scene timeline' });
  await timeline.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, seconds);
  await expect(timeline).toHaveValue(String(seconds));
}

test.describe('standalone story preview', () => {
  test.setTimeout(120_000);

  test('loads enemies on demand, plays capture, replays and restores home on skip and Escape', async ({ page }, info) => {
    const errors: string[] = [];
    const enemies: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/problem_bug.*\.glb/.test(request.url())) enemies.push(request.url()); });
    await page.addInitScript(() => {
      const Original = window.AudioContext;
      const contexts: AudioContext[] = [];
      window.AudioContext = class extends Original {
        constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
      };
      (window as unknown as { __STORY_AUDIO_REVIEW__: { states(): string[] } }).__STORY_AUDIO_REVIEW__ = {
        states: () => contexts.map(context => context.state),
      };
    });
    await home(page);
    expect(enemies).toEqual([]);
    await openStory(page);
    expect(enemies.length).toBeGreaterThan(0);
    await expect.poll(async () => (await sample(page, 'campus'))?.state.paused).toBe(true);
    const sound = page.getByRole('button', { name: 'Enable story sound' });
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
    expect(await soundStates(page)).toEqual([]);
    await sound.click();
    await expect(page.getByRole('button', { name: 'Disable story sound' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => soundStates(page)).toEqual(['running']);
    await expect.poll(async () => (await sample(page, 'story'))?.state.time ?? 0).toBeGreaterThan(.2);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect.poll(async () => (await sample(page, 'story'))?.state.paused).toBe(true);
    await expect.poll(() => soundStates(page)).toEqual(['suspended']);
    const pausedTime = (await sample(page, 'story'))!.state.time;
    await page.waitForTimeout(350);
    expect((await sample(page, 'story'))!.state.time).toBe(pausedTime);
    await seek(page, STORY_BEATS.notice + .7);
    expect((await sample(page, 'story'))!.state.expression).toBe('alarm');
    for (const [second, phase] of [
      [STORY_BEATS.grab + .3, 'deploy'], [STORY_BEATS.lock + .3, 'lock'],
      [STORY_BEATS.lift + .5, 'resist'], [STORY_BEATS.tow + 2, 'tow'], [STORY_BEATS.exit + .1, 'gone'],
    ] as const) {
      await seek(page, second);
      expect((await sample(page, 'story'))!.state.trapPhase).toBe(phase);
    }
    await seek(page, STORY_BEATS.lock + .3);
    await expect(page.getByText(storyFrame(STORY_BEATS.lock + .3).caption, { exact: true })).toBeVisible();
    const rendered = (await sample(page, 'story'))!;
    expect(rendered.calls).toBeGreaterThan(0);
    expect(rendered.triangles).toBeGreaterThan(0);
    expect(rendered.state.capture).toBe(true);
    expect(rendered.state.actors?.filter(actor => actor.visible).map(actor => actor.role)).toEqual(['copilot', 'octocat', 'bug-left', 'bug-right']);
    await page.screenshot({ path: info.outputPath('story-capture.png') });
    await page.getByRole('slider', { name: 'Scene timeline' }).press('End');
    await expect(page.getByRole('slider', { name: 'Scene timeline' })).toHaveValue(String(STORY_DURATION));
    await expect(page.getByText('TO BE CONTINUED', { exact: true })).toBeVisible();
    await expect.poll(async () => (await sample(page, 'story'))?.state.time).toBe(STORY_DURATION);
    expect((await sample(page, 'story'))!.state.actors?.filter(actor => actor.visible).map(actor => actor.role)).toEqual(['copilot']);
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await expect.poll(async () => (await sample(page, 'story'))?.state.time ?? STORY_DURATION).toBeLessThan(2);
    expect((await sample(page, 'story'))!.state.trapPhase).toBe('hidden');
    expect((await sample(page, 'story'))!.state.capture).toBe(false);
    expect((await sample(page, 'story'))!.state.expression).toBeNull();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await expect.poll(() => soundStates(page)).toEqual(['running']);
    await page.getByRole('button', { name: 'Disable story sound' }).click();
    await expect(page.getByRole('button', { name: 'Enable story sound' })).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => soundStates(page)).toEqual(['closed']);
    await page.getByRole('button', { name: 'Enable story sound' }).click();
    await expect.poll(() => soundStates(page)).toEqual(['closed', 'running']);
    await page.getByRole('button', { name: 'Skip scene' }).click();
    await expect(page.getByRole('dialog', { name: 'One small feature' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Play story scene/ })).toBeFocused();
    await expect.poll(async () => (await sample(page, 'campus'))?.state.paused).toBe(false);
    expect(await sample(page, 'story')).toBeUndefined();
    await expect.poll(() => soundStates(page)).toEqual(['closed', 'closed']);
    await openStory(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /^Play story scene/ })).toBeFocused();
    await expect(page.getByTestId('story-player')).toHaveCount(0);
    expect(await sample(page, 'story')).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test('a failed enemy download can be retried without reloading the app', async ({ page }) => {
    let fail = true;
    await page.route('**/problem_bug*.glb', route => fail
      ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporary enemy download failure' })
      : route.continue());
    await home(page);
    await page.getByRole('button', { name: /^Play story scene/ }).click();
    await expect(page.getByTestId('story-player')).toHaveAttribute('data-state', 'error', { timeout: 40_000 });
    await expect(page.getByRole('heading', { name: 'The story couldn’t open' })).toBeVisible();
    fail = false;
    await page.getByRole('button', { name: 'Retry scene' }).click();
    await expect(page.getByTestId('story-player')).toHaveAttribute('data-state', 'ready', { timeout: 40_000 });
    await page.getByRole('button', { name: 'Close story scene' }).click();
    await expect(page.getByRole('button', { name: /^Play story scene/ })).toBeFocused();
    expect(await sample(page, 'story')).toBeUndefined();
  });

  test('visibility changes freeze the timeline and preserve an explicit user pause', async ({ page }) => {
    await home(page);
    await openStory(page);
    await expect.poll(async () => (await sample(page, 'story'))?.state.time ?? 0).toBeGreaterThan(.2);
    const visibility = async (hidden: boolean) => page.evaluate(hidden => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    await visibility(true);
    await expect.poll(async () => (await sample(page, 'story'))?.state.paused).toBe(true);
    const hiddenTime = (await sample(page, 'story'))!.state.time;
    await page.waitForTimeout(350);
    expect((await sample(page, 'story'))!.state.time).toBe(hiddenTime);
    await visibility(false);
    await expect.poll(async () => (await sample(page, 'story'))?.state.time ?? 0).toBeGreaterThan(hiddenTime!);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await visibility(true);
    await visibility(false);
    await expect.poll(async () => (await sample(page, 'story'))?.state.paused).toBe(true);
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  });

  test('reduced motion offers static shots with usable phone controls and subtitles', async ({ page, isMobile }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await home(page);
    await openStory(page);
    await expect(page.getByText('Storyboard · reduced motion', { exact: true })).toBeVisible();
    expect((await sample(page, 'story'))!.state.time).toBe(0);
    await page.getByRole('button', { name: 'Next shot' }).click();
    await expect(page.getByRole('slider', { name: 'Scene timeline' })).toHaveValue(String(STORY_SHOT_TIMES[1]));
    await page.waitForTimeout(350);
    expect((await sample(page, 'story'))!.state.time).toBe(STORY_SHOT_TIMES[1]);
    await page.getByRole('button', { name: 'Previous shot' }).click();
    await expect(page.getByRole('slider', { name: 'Scene timeline' })).toHaveValue('0');
    await seek(page, STORY_BEATS.lock + .3);
    await expect(page.getByText('This was definitely not in the brief!', { exact: true })).toBeVisible();
    for (const viewport of isMobile ? [{ width: 390, height: 844 }, { width: 844, height: 390 }] : [{ width: 1280, height: 720 }]) {
      await page.setViewportSize(viewport);
      await expect(page.getByRole('button', { name: 'Next shot' })).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Skip scene' })).toBeInViewport();
      await expect(page.getByText('This was definitely not in the brief!', { exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const controls = await page.getByTestId('story-player').getByRole('button').evaluateAll(buttons => buttons.map(button => {
        const rect = button.getBoundingClientRect(); return { width: rect.width, height: rect.height };
      }));
      expect(controls.every(rect => rect.width >= 44 && rect.height >= 44)).toBe(true);
      await page.screenshot({ path: info.outputPath(`story-${viewport.width}.png`) });
    }
    await page.getByRole('slider', { name: 'Scene timeline' }).press('End');
    await expect(page.getByRole('button', { name: 'Next shot' })).toBeDisabled();
    await page.getByRole('button', { name: 'Back to Hub' }).click();
    await expect(page.getByRole('button', { name: /^Play story scene/ })).toBeFocused();
  });
});

test.describe('story audience framing evidence', () => {
  test.setTimeout(120_000);
  test('captures reaction, contact and towing from the real player controls', async ({ page, isMobile }, info) => {
    await home(page);
    await openStory(page);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const seconds = isMobile ? [STORY_BEATS.notice + .7, STORY_BEATS.lock + .3, STORY_BEATS.tow + 2]
      : [3, 7, 12, STORY_BEATS.notice + .7, 19, STORY_BEATS.grab + 1, STORY_BEATS.lock + .3, 27, STORY_BEATS.tow + 2, 37];
    const gpu = await gpuInfo(page);
    const captures = [];
    for (const second of seconds) {
      await seek(page, second);
      const diagnostics = await sample(page, 'story');
      expect(diagnostics?.state.time).toBe(second);
      const file = `story-audience-${String(second).replace('.', '_')}s.png`;
      const canvasFile = `story-canvas-${String(second).replace('.', '_')}s.png`;
      await page.screenshot({ path: info.outputPath(file), scale: 'css' });
      const canvasBounds = await page.getByTestId('story-canvas').boundingBox();
      await page.getByTestId('story-canvas').screenshot({ path: info.outputPath(canvasFile), scale: 'css' });
      captures.push({ seconds: second, file, canvasFile, canvasBounds, viewport: page.viewportSize(), diagnostics });
    }
    const path = info.outputPath('story-audience-captures.json');
    await writeFile(path, JSON.stringify({ mode: isMobile ? 'mobile' : 'desktop', gpu, method: 'Paused seeks through the production Scene timeline control; CSS-scale story-canvas captures, not motion evidence', captures }, null, 2));
    await info.attach('story-audience-captures', { path, contentType: 'application/json' });
  });
});

test.describe('live story motion evidence', () => {
  test.setTimeout(150_000);

  test('the full cinematic completes naturally and records its directed shots', async ({ page, isMobile }, info) => {
    test.skip(isMobile, 'Full-length motion evidence runs once on desktop.');
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await home(page);
    await openStory(page);
    await page.getByRole('button', { name: 'Enable story sound' }).click();
    const gpu = await gpuInfo(page);
    await page.evaluate(() => {
      type Review = { intervalsMs: number[]; samples: unknown[]; startedAt: number; endedAt?: number };
      const host = window as unknown as {
        __TOWER_DIAGNOSTICS__: Record<string, { sample(): RenderSample }>;
        __STORY_REVIEW__?: Review;
      };
      const review: Review = { intervalsMs: [], samples: [], startedAt: performance.now() };
      host.__STORY_REVIEW__ = review;
      let priorTime = -1, priorFrame = 0, priorSecond = -1;
      const observe = (timestamp: number) => {
        const current = host.__TOWER_DIAGNOSTICS__.story?.sample();
        if (!current) return;
        const time = current.state.time ?? 0;
        if (time !== priorTime) {
          if (priorFrame) review.intervalsMs.push(timestamp - priorFrame);
          priorFrame = timestamp; priorTime = time;
        }
        if (Math.floor(time) !== priorSecond) {
          priorSecond = Math.floor(time); review.samples.push({ timestamp, ...current });
        }
        if (current.state.finished) review.endedAt = timestamp;
        else requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    });
    const requestedTimes = [...new Set([
      7, STORY_BEATS.notice + .7, 19, STORY_BEATS.lock + .3, 27, STORY_BEATS.tow + 2, 37,
      ...Array.from({ length: 7 }, (_, index) => Number((11 + index / 3).toFixed(2))),
      ...Array.from({ length: 9 }, (_, index) => 23 + index / 4),
      ...Array.from({ length: 9 }, (_, index) => 31 + index / 4),
    ])].sort((a, b) => a - b);
    const motionFrames = [];
    for (const second of requestedTimes) {
      await expect.poll(async () => (await sample(page, 'story'))?.state.time ?? 0, { timeout: 90_000, intervals: [20, 33, 50] }).toBeGreaterThanOrEqual(second);
      const before = await sample(page, 'story');
      const file = `story-motion-${String(second).replace('.', '_')}s.png`;
      const canvasFile = `story-motion-canvas-${String(second).replace('.', '_')}s.png`;
      await page.screenshot({ path: info.outputPath(file), scale: 'css' });
      await page.getByTestId('story-canvas').screenshot({ path: info.outputPath(canvasFile), scale: 'css' });
      motionFrames.push({ requestedSeconds: second, beforeCapture: before, afterCapture: await sample(page, 'story'), file, canvasFile });
    }
    await expect(page.getByText('Scene complete', { exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('slider', { name: 'Scene timeline' })).toHaveValue(String(STORY_DURATION));
    const observation = await page.evaluate(() => (window as unknown as {
      __STORY_REVIEW__: { intervalsMs: number[]; samples: unknown[]; startedAt: number; endedAt: number };
    }).__STORY_REVIEW__);
    const sorted = [...observation.intervalsMs].sort((a, b) => a - b);
    const metrics = {
      ...observation,
      gpu,
      motionFrames,
      wallSeconds: (observation.endedAt - observation.startedAt) / 1000,
      frameIntervals: {
        method: 'Distinct story-time updates observed from browser requestAnimationFrame; not GPU frame timing',
        count: sorted.length,
        meanMs: sorted.reduce((sum, time) => sum + time, 0) / sorted.length,
        p95Ms: sorted[Math.floor(sorted.length * .95)],
        maximumMs: sorted.at(-1),
      },
      environment: 'Desktop Edge browser on this host; not a physical phone benchmark',
    };
    expect(metrics.wallSeconds).toBeLessThan(90);
    expect(metrics.frameIntervals.count).toBeGreaterThan(100);
    const path = info.outputPath('story-motion-metrics.json');
    await writeFile(path, JSON.stringify(metrics, null, 2));
    await info.attach('story-motion-metrics', { path, contentType: 'application/json' });
    await page.getByRole('button', { name: 'Back to Hub' }).click();
    expect(await sample(page, 'story')).toBeUndefined();
    await expect.poll(async () => (await sample(page, 'campus'))?.state.paused).toBe(false);
    expect(errors).toEqual([]);
  });
});
