import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(root, '../..');
const parse = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const save = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
const evidence = await parse(path.join(root, 'evidence.json'));
const summaryFile = path.join(root, 'final/pixel-summary.json');
const summary = await parse(summaryFile);
for (const report of summary.reports) {
  const base = `canvas-${report.mode}-${report.state}`;
  report.screenshotPath = path.join(root, 'final', base + '.png');
  await fs.stat(report.screenshotPath);
  await save(path.join(root, 'final', base + '.json'), report);
}
await save(summaryFile, summary);
const inventory = async directory => {
  const names = (await fs.readdir(directory, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/')).sort();
  return Promise.all(names.map(async name => {
    const bytes = await fs.readFile(path.join(directory, name));
    return { name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  }));
};
const build = await inventory(path.join(root, 'build'));
for (const pinned of [...evidence.buildFiles, ...evidence.runtimeFiles]) {
  const actual = build.find(file => path.basename(file.name) === pinned.name);
  if (!actual || actual.sha256.toUpperCase() !== pinned.sha256.toUpperCase()) throw new Error(`Pinned build mismatch: ${pinned.name}`);
}
const final = await inventory(path.join(root, 'final'));
const clean = await inventory(path.join(root, 'final-clean'));
const motion = await parse(path.join(root, 'final/story-motion-metrics.json'));
const sources = await Promise.all(['game/tests/e2e/story.spec.ts', 'game/tests/content/storyTimeline.test.ts',
  'game/src/content/story/octocatAbduction.ts', 'game/src/rendering/story/createStoryScene.ts',
  'game/src/rendering/story/effects.ts'].map(async name => {
  const bytes = await fs.readFile(path.join(workspace, name));
  return { name, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}));
const allNames = (await fs.readdir(root, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile());
const metadata = {
  version: 1, runId: evidence.runId, createdAt: new Date().toISOString(),
  immutableBuild: { directory: path.join(root, 'build'), pinnedHashesMatch: true, files: build },
  finalArtifacts: { directory: path.join(root, 'final'), fileCount: final.length, files: final },
  cleanRunnerArtifacts: { directory: path.join(root, 'final-clean'), fileCount: clean.length, files: clean },
  archive: { directory: root, fileCountIncludingThisMetadata: allNames.length + (allNames.some(entry => entry.name === 'current-run.json') ? 0 : 1), initial: 'initial', repairs: 'repairs', inputRun: 'pre-bands' },
  checkedSources: sources,
  verification: {
    evidenceChecker: { command: 'check_evidence.py game --manifest ../artifacts/story-polish-20260930/evidence.json', exitCode: 0, confirmedArtifacts: 11 },
    focusedUnit: { passed: 5, failed: 0, command: 'npm exec vitest run -- tests/content/storyTimeline.test.ts', exitCode: 0 },
    focusedEslint: { command: 'npm exec eslint -- tests/content/storyTimeline.test.ts tests/e2e/story.spec.ts', exitCode: 0 },
    inputRun: { folder: 'pre-bands', inputCasesPassed: 8, audienceCasesPassed: 2, desktopMotionCasesPassed: 1, touchMotionSkipped: 1,
      note: 'This run used final authored motion and heading but preceded two restraint-band effects. Final-band scene close and cleanup were checked again during final motion.' },
    finalBandRun: { folder: 'final', audienceCasesPassed: 2, desktopMotionCasesPassed: 1, touchMotionSkipped: 1,
      command: "npm exec playwright test -- --config=../artifacts/story-polish-20260930/story.playwright.config.ts tests/e2e/story.spec.ts --grep 'captures reaction|full cinematic' --workers=1" },
    browserRunner: { assertionResults: 'All completed cases printed passed; no assertion failures', wrapperExitCode: 0,
      cleanRerun: { directory: 'final-clean', passed: 3, skipped: 1, durationSeconds: 59.1,
        command: "npm exec playwright test -- --config=../artifacts/story-polish-20260930/story.clean.playwright.config.ts tests/e2e/story.spec.ts --grep 'captures reaction|full cinematic' --workers=1",
        method: 'Same immutable build; own preview launched outside Playwright and stopped separately. No Playwright-owned webServer teardown.', exitCode: 0 },
      priorRun: { exitCode: 1, note: 'Original final artifact run completed all assertions and media but hung on server teardown. Wrapper was interrupted. Clean same-build rerun resolved infrastructure issue; reviewed final captures remain preserved.' },
      serverPort: 5187, serverListeningAfterCleanup: false },
    declaredPixels: { capturesPassed: 6, renderBudgetsPassed: 6, adaptation: 'Explicit story-canvas CSS-scale screenshots; same existing inspector computePixelMetrics function. First document canvas is campus, so inspector default selection would be wrong.',
      reports: summary.reports.map(report => ({ mode: report.mode, state: report.state, screenshotPath: report.screenshotPath, result: report.result })) },
    liveMotion: { sceneDurationSeconds: 42, observedRemainingWallSeconds: motion.wallSeconds, cadence: motion.frameIntervals,
      captureMethod: 'Uninterrupted real player playback, sound enabled, no seeks or forced poses. Requested and actual before/after screenshot timestamps preserved.',
      gpu: motion.gpu, environment: motion.environment,
      note: 'Desktop host GPU and phone viewport emulation; no physical-phone or GPU-frame-time claim.' },
    visualReview: 'Amber restraint bands remain below the face on desktop and phone; creep, lift, haul contact sheets independently reviewed without blocking contact or framing defects.'
  }
};
await save(path.join(root, 'current-run.json'), metadata);
console.log(JSON.stringify({ finalFileCount: final.length, buildFileCount: build.length, archiveFileCount: metadata.archive.fileCountIncludingThisMetadata, pinnedHashesMatch: true }));
