import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const folder=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(folder,'asset.json');
const m=JSON.parse(await readFile(file,'utf8'));
m.budgets.bones=9;
m.contract.anchors=[...new Set([...m.contract.anchors,...'abcdef'.split('').map(s=>'anchor_shooter_'+s)])];
m.clips=[
  ['idle','loop','Quiet ready hover with a brief paired indicator blink.'],
  ['work','loop','Six radial shooters recoil inward in sequence with a restrained reaction and indicator pulse; visual operation only.'],
  ['move','loop','In-place hover glide with a gentle forward bank; simulation supplies all travel.'],
  ['place','once','Digital-cube assembly at full body size, reverse of Resolve, opening into the ready hover.'],
  ['hit','once','Quick backward tilt and indicator flinch with a controlled return to the ready pose.'],
  ['resolve','once','Indicator power-down at full body size with shared digital-cube disintegration.']
].map(([name,playback,meaning])=>({name,playback,meaning,fps:24}));
m.presentation={resolve:{type:'digital_blocks',version:1,clip:'resolve',assembleClip:'place',
  cellSize:.18,maxFragments:64,edgeColor:'#36DCFF'},
  shooters:'abcdef'.split('').map((s,i)=>({anchor:'anchor_shooter_'+s,azimuthDegrees:30+60*i,sectorDegrees:60})),
  motion:{readyHoverMetres:.15,locomotion:'in-place hover glide',rootMotion:false},
  budget:{modelTriangles:2432,maxEffectTriangles:768,maxCombinedTriangles:3200}};
await writeFile(file,JSON.stringify(m,null,2)+'\n');
await copyFile(path.join(folder,'validation/visual_review.json'),path.join(folder,'revisions/r12_model_approved_before_animation/visual_review.json'));
