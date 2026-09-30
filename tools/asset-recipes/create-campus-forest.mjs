import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const entries=JSON.parse(await readFile('tools/asset-recipes/campus-forest-entries.json','utf8'));
const colors={trunk:'#65918F',bark:'#826F5D',leaf:'#70B5B4',leaf_light:'#86C2BD',leaf_dark:'#609D9E',sage:'#91AC78',moss:'#637F60',pine:'#527F86',pine_light:'#719A91',gold:'#CCB768',amber:'#C59A60',copper:'#AC7957'};
for(const e of entries){
 const init=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','init',e.id,'environment'],{stdio:'inherit',windowsHide:true});if(init.status!==0)throw Error('Scaffold failed: '+e.id);
 const folder=`blender/environment/${e.id}/v01`,file=folder+'/asset.json';
 const m=JSON.parse(await readFile(file,'utf8'));
 m.displayName=e.name;m.source.mode='procedural';m.source.recipe=folder+'/build.py';
 m.budgets={triangles:e.kind==='tile'?4500:['mixed','dense','edge'].includes(e.kind)?1500:800,materials:e.kind==='tile'?2:1,textures:e.kind==='tile'?2:1,textureSize:e.kind==='tile'?512:64,bones:0,meshes:e.kind==='tile'?2:1};
 m.contract.anchors=['anchor_ui'];
 if(['mixed','dense','edge'].includes(e.kind))m.contract.anchors.push('anchor_n','anchor_e','anchor_s','anchor_w');
 m.texturePalettes=[{material:'campus_forest_palette',size:[64,4],roles:Object.fromEntries(Object.entries(colors).map(([role,color],i)=>[role,{color,rect:[i*4,0,4,4]}]))}];
 m.palette={storage:'texture',colors};m.exportSettings={paletteSampler:'linear',paletteTextureWorkflow:false};
 m.references=[{path:'tools/asset-recipes/campus-forest.py',provenance:'Original shared forest authoring recipe; preserved existing tree forms are extracted from authoritative Blender snapshots.'},{path:'docs/design/Campus_Forest_Kit.md',provenance:'Forest family concept, placement interfaces and variant inventory.'}];
 if(['round','tall','cluster'].includes(e.kind)){
   const original=`blender/environment/campus_tree_${e.kind}/v01/campus_tree_${e.kind}_v01.blend`,snapshot=folder+'/references/planter_source.blend';
   await copyFile(original,snapshot);const sha256=createHash('sha256').update(await readFile(snapshot)).digest('hex');
   m.references.push({path:snapshot,provenance:`Snapshot of ${original}; SHA256 ${sha256}. Preserve leaf/trunk geometry, remove only planter roles and translate down 0.28 m.`});
 }
 if(e.kind==='tile'){
   const base=JSON.parse(await readFile('blender/environment/campus_tile_park/v01/asset.json','utf8'));
   const snapshot=folder+'/references/park_source.blend';await copyFile(base.source.path,snapshot);
   m.references.push({path:snapshot,provenance:`Authoritative park source snapshot; SHA256 ${createHash('sha256').update(await readFile(snapshot)).digest('hex')}. Existing frame, packed surface and edge anchors retained.`});
   m.contract.anchors.push(...base.contract.anchors);m.texturePalettes.push(...base.texturePalettes);
   m.contract.dimensions={min:[35.99,4.0,31.17],max:[36.01,7.0,31.18]};
   m.overrides=['4500 triangles and two materials/textures for one assembled terrain-plus-woodland module; individual foliage remains under the repeated-prop budget.'];
 }
 await writeFile(file,JSON.stringify(m,null,2)+'\n');
 await writeFile(folder+'/build.py',`import runpy\nfrom pathlib import Path\nfolder=Path(__file__).resolve().parent\nrunpy.run_path(str(folder.parents[3]/'tools/asset-recipes/campus-forest.py'))['build']('${e.id}',folder)\n`);
 await writeFile(folder+'/decisions.md',`# ${e.name}\n\nUser request, 2026-09-24: trees should also be available without the base; develop a forest concept, bulk forest assets, and color/shape variants. The attached Inspector library screenshot identifies the existing round, tall and paired trees; it provides no additional instructions.\n\n## Brief\n\n${e.brief}\n\nPreserve the Glacier campus's chunky flat-shaded style. Primary landmarks: visible grounded trunks, broad triangular crown planes, distinct tall/round/spreading/tiered outlines, and readable negative space under the crowns. Baseless means no planter, hidden disk or baked ground plane. Palette variants use packed editable texture swatches, not Inspector tint. Muted amber is seasonal scenery, without emissive warning accents.\n\nMetres, identity root, +Y runtime up, +Z forward; static environmental art. ${e.kind==='tile'?'Retain the park tile frame, surface and six edge anchors at y=1.20; all tree contacts sit on that surface. The central clearing and north–south passage are visual composition only.':'Ground contact is y=0; place the root at the target terrain surface height.'} Existing planted trees stay available. No gameplay rules or animations are introduced.\n\n## Construction and review plan\n\nCompare front, side, reverse and isometric views; inspect trunk/crown seating and bottom contacts, then small/phone readability. For groups, inspect the top view for repeated spacing and canopy clearance; rotate reusable groups by 90 or 180 degrees to vary compositions. Capture source/export hash-bound review after technical export. Artistic acceptance remains pending user review.\n`);
}
console.log('Registered '+entries.length+' forest assets.');
