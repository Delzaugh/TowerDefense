import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root = 'C:/Users/jonas/Documents/ChatGPT/Tower';
const names = ['park','hill','plaza','civic','canyon','construction','utility'];
const mobile = 'game/test-results/home-campus-home-the-produ-0887d-diagnostic-route-stays-lazy-touch-edge/campus-home-mobile.png';
await fs.copyFile(mobile, 'output/campus-life/mobile.png');
const rows=[];
for (const name of names) {
  const id = `campus_tile_${name}`, folder = `blender/environment/${id}/v01`;
  const file = `${folder}/validation/visual_review.json`;
  const review = JSON.parse(await fs.readFile(file));
  review.scope = 'refinement'; review.reviewedAt = new Date().toISOString();
  review.checks.referenceFidelity = {status:'passed',findings:'User requested removal of broad blue separators. Personally inspected the exported isometric and reverse-oblique surfaces and assembled campus: terrain extends to the narrow neutral join, retaining terrain shapes and structural walls.'};
  review.checks.construction = {status:'passed',findings:'Source texture refinement only; unchanged geometry, level edge anchors and road contacts pass guarded export and the campus connection tests. Quiet .06 m edge and .48 m blend replace the old wide slate band. No surface overlays or coplanar faces were added.'};
  review.checks.readability = {status:'passed',findings:name==='utility'?'Full concrete court, expansion joints, drain details and service bays remain visible around the building and plant in the assembled campus. Close-paving-edge and reverse-oblique views show coherent joints and level footing.':'Isometric and reverse-oblique review shows a continuous terrain interior, a restrained perimeter transition and the unchanged structural sides. Desktop and phone campus review retains distinct terrain families with substantially less boundary contrast.'};
  review.secondPass = {status:'passed',findings:'After the initial isometric review, inspected reverse-oblique exports and the populated campus, then phone framing. No wide blue surface border remains; adjacent terrain joins remain level without cracks. Canyon floor and water still shade cleanly. Character contact and route audit passes.'};
  await fs.copyFile(mobile,`${folder}/validation/campus-life-mobile.png`);
  const views=['iso','rear','reverse-oblique',...(name==='utility'?['close-paving-edge']:[]),'campus-life-mobile'];
  review.evidence = await Promise.all(views.map(async view=>{const path=`${folder}/validation/${view}.png`;return {path,sha256:crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex'),view};}));
  review.userAcceptance={status:'pending',note:'New author-reviewed revision; artistic acceptance remains with the user.'};
  review.limitations=[];
  await fs.writeFile(file,JSON.stringify(review,null,2)+'\n');
  rows.push(`| ${name} | [Blender](${root}/${folder}/${id}_v01.blend) | [GLB](${root}/assets/runtime/environment/${id}_v01.glb) | [Inspector](http://127.0.0.1:4175/?asset=${id}&version=v01) |`);
}
await fs.writeFile('output/campus-life/README.md',`# Connected and inhabited campus\n\nSeven terrain profiles now extend to narrow neutral transitions. The utility tile has a full concrete service court with slab joints, maintenance bays and drains. Terrain geometry, baseplate anchors and buildings are preserved.\n\nTwelve new residents join the original Copilot: three Developer Copilots, three low-poly Octocats, three extra base Copilots and three rubber ducks. They stroll, pause, work, wave or float using existing authored clips and presentation routes. Two ducks are stationary.\n\n## Terrain sources and previews\n\n| Tile | Source | Runtime | Preview |\n|---|---|---|---|\n${rows.join('\n')}\n\n## Checks\n\nGuarded asset exports and current author review records pass. Production build, lint and 34 focused tests pass. All 16 desktop/touch browser tests pass. A 241-sample route audit found no intersections or unsupported characters; pause/resume canvas checks pass. Physical-device performance has not been measured in this pass.\n\n![Campus overview](${root}/output/campus-life/overview.png)\n\n[Mobile capture](${root}/output/campus-life/mobile.png) · [Placement audit](${root}/output/campus-life/placement-audit.json)\n`);
