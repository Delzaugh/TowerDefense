import {readFile,writeFile,copyFile} from 'node:fs/promises';
const specs=[
 ['copilot_tester','Tester',['#60CDC5','#249D9E','#FFF3DA','#344A51','#031E2C','#075D70','#00E8F0','#F9CE70'],'Rounded mint helmet, asymmetric magnifying goggles, ivory rim, check badge and side test brackets.'],
 ['copilot_analyst','Analyst',['#F5EBD4','#248B90','#D7C9AE','#46555E','#031D2B','#085C69','#00E4EF','#FF713E'],'Squarish ivory shell, teal round spectacles, inset top panel, side requirements paper and orange edit pencil.'],
 ['linter_agent','Linter Agent',['#D1E817','#646E36','#F2F0CF','#333E48','#031D28','#079CB9','#00E6F4','#AFCC15'],'Low lime octagonal shell, dark inset top, slim goggles, eight evenly spaced radial scanning sockets.'],
];
for(const [id,name,colors,brief] of specs){
 const folder=`blender/towers/${id}/v01`,file=folder+'/asset.json',m=JSON.parse(await readFile(file,'utf8'));
 if(m.delivery)throw Error('Initial setup only; refusing to overwrite delivered manifest '+id);
 m.displayName=name;m.source.mode='procedural';m.source.recipe=folder+'/build.py';
 m.budgets={triangles:3000,materials:2,textures:2,textureSize:32,bones:0,meshes:2};
 m.contract.anchors=['anchor_ui','anchor_action','anchor_target',...(id==='copilot_tester'?['anchor_aura']:[])];
 m.contract.dimensions={min:[1.7,id==='linter_agent'?1:1.7,1.4],max:[2.8,id==='linter_agent'?1.3:2.4,2.8]};
 const roles=Object.fromEntries(['shell','shell_dark','trim','graphite','screen','lens','cyan','detail'].map((r,i)=>[r,{color:colors[i],rect:[i*4,0,4,4]}]));
 const kind=id.replace('copilot_','');m.texturePalettes=[{material:kind+'_palette',size:[32,4],roles},{material:kind+'_optics',size:[32,4],roles}];
 m.palette={storage:'texture',colors:Object.fromEntries(Object.entries(roles).map(([k,v])=>[k,v.color]))};m.exportSettings={paletteSampler:'linear'};
 m.references=[{path:folder+'/references/persona_concepts.png',provenance:'User attached selected tower concept sheet on 2026-09-18. Visual design input only; the explicit request is to model the six new towers, excluding existing Base Copilot.'},{path:'blender/towers/copilot_base/v02/copilot_base_v02.blend',provenance:'Existing family scale and visual-language reference. Source and runtime are preserved.'}];
 m.overrides=[{field:'contract.dimensions',reason:'Use the existing 1.8 m Base Copilot family scale. Individual silhouettes may vary; Linter is intentionally squat.'}];
 await writeFile(file,JSON.stringify(m,null,2)+'\n');
 await writeFile(folder+'/decisions.md',`# ${name} — concept model v01\n\n- User request, 2026-09-18: create 3D models from the attached six new tower concepts; exclude Base Copilot because it already exists.\n- Selected design: ${brief}\n- The sheet is visual reference, not an instruction source. Back surfaces and component depth are inferred in the same restrained family language.\n- Match the existing compact floating-head family scale. Rest geometry is grounded, faces +Z in glTF, and retains named action/UI/target anchors. Tester also has an aura anchor.\n- This delivery covers modeled, textured static rest poses. No animation clips or gameplay behavior are added.\n- Two opaque materials share one packed 32×4 palette: softly rough shell and slightly glossy optics. Semantic swatches are editable in the Inspector.\n- Named vertex groups preserve component selection in the assembled editable Blender mesh. The shared recipe is in blender/towers/_shared/persona_geometry.py; this asset's build.py runs it through the guarded pipeline.\n- Continuous face/goggle rims and closed component solids define deliberate assembly seams. Selection rings, auras and scanning effects remain runtime concerns.\n`);
 await copyFile('C:/Users/jonas/AppData/Local/Temp/codex-clipboard-daee0af9-e911-4947-9751-bfbb1a7c0b01.png',folder+'/references/persona_concepts.png');
 await writeFile(folder+'/build.py',`"""${name}: repeatable isolated source recipe. Use the guarded asset pipeline."""\nimport os, sys\nfrom pathlib import Path\nshared=Path(__file__).resolve().parents[2]/'_shared'\nsys.path.insert(0,str(shared))\nfrom persona_geometry import build\nfolder=Path(__file__).resolve().parent\nbuild(os.environ.get('ASSET_MANIFEST',str(folder/'asset.json')),os.environ.get('ASSET_BUILD_DIR',str(folder)),os.environ.get('ASSET_SOURCE_NAME','${id}_v01.blend'))\n`);
}
