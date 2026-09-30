import fs from 'node:fs/promises';
const d='blender/towers/copilot_security/v01',file=d+'/asset.json';
const m=JSON.parse(await fs.readFile(file));
if(m.revision!==15||m.clips.length)throw Error('Expected approved, unanimated revision 15');
const review=JSON.parse(await fs.readFile(d+'/validation/visual_review.json'));
review.userAcceptance={status:'accepted',note:'User: "looks good, make the animations", after selecting 12% shorter jaw. Model approval and animation authorization recorded 2026-09-24.'};
await fs.writeFile(d+'/validation/visual_review.json',JSON.stringify(review,null,2)+'\n');
const base=d+'/revisions/r15_approved_model_before_animation';
for(const name of ['build.py','decisions.md'])await fs.copyFile(d+'/'+name,base+'/'+name);
await fs.copyFile(d+'/validation/visual_review.json',base+'/visual_review.json');
await fs.copyFile(d+'/validation/inspector_right.png',base+'/approved-side.png');
m.source.recipe=d+'/animate.py';
m.budgets.bones=4;
m.clips=[
 ['idle','loop',2.5,'Quiet ready hover and a brief paired display blink.'],
 ['work','loop',2,'Measured security scan: rigid temple scanner sweeps while the body makes a restrained tracking turn.'],
 ['move','loop',2,'In-place hovering glide with forward lean and small bank; simulation owns travel.'],
 ['place','once',1.25,'Digital cube assembly at full size, reverse of Resolve, ending at the ready hover.'],
 ['hit','once',14/24,'Quick backward recoil with display flinch, recovering to ready.'],
 ['resolve','once',1.25,'Display powers down at full size while the shared digital grid and cubes disintegrate the tower.']
].map(([name,playback,duration,meaning])=>({name,playback,duration,meaning,fps:24}));
m.presentation={resolve:{type:'digital_blocks',version:1,clip:'resolve',assembleClip:'place',cellSize:.22,maxFragments:12,edgeColor:'#00E8ED'},motion:{readyHoverMetres:.16,minimumHoverMetres:.06,locomotion:'in-place hover glide',rootMotion:false},budget:{modelTriangles:2854,maxEffectTriangles:144,maxCombinedTriangles:2998}};
m.animationHandoff={modelRevision:15,sourceHash:m.delivery.sourceHash,sha256:m.delivery.sha256,modelAcceptance:'accepted',authorization:'User: looks good, make the animations',authorizedAt:'2026-09-24',sourceSnapshot:base+'/copilot_security_v01.blend'};
await fs.writeFile(file,JSON.stringify(m,null,2)+'\n');
let decisions=await fs.readFile(d+'/decisions.md','utf8');
decisions=decisions.replace(/## Animation[\s\S]*$/,`## Animation authorization and plan

2026-09-24: user said "looks good, make the animations" after selecting the jaw
at 88% of its original projection. Model revision 15 is approved. Its source,
export, recipe, decisions, review and side view are preserved under
revisions/r15_approved_model_before_animation. The manifest records both hashes.

The animation recipe loads that immutable accepted Blender model. No rest art,
palette, normals or anchor positions may change. Rig: rigid body, two independent
display eyes and one rigid scanner. Head-only anatomy supports an in-place hover
glide; ready clearance is .16 m, with all world travel owned by simulation.

Plan: idle 2.5 s, work/security sweep 2 s, move/hover 2 s, place 1.25 s,
hit 14/24 s, resolve 1.25 s. Place/Resolve use the established shared digital
cube effect in reverse directions. The body remains full-size. The 2854-triangle
model leaves room for 12 cubes (144 triangles), combined ceiling 2998.
Animation review and user acceptance of the new animation revision are pending.
`);
await fs.writeFile(d+'/decisions.md',decisions);
console.log('Approved model milestone recorded; six-clip animation contract prepared.');
