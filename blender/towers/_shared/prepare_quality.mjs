import {readFile,writeFile,copyFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const ids=['linter_agent'];
for(const id of ids){
 const folder=`blender/towers/${id}/v01`,file=folder+'/asset.json',m=JSON.parse(await readFile(file,'utf8'));
 const actual=createHash('sha256').update(await readFile(m.source.path)).digest('hex');
 if(actual!==m.source.authoritativeHash)throw Error('Manual source changes must be preserved: '+id);
 await copyFile('C:/Users/jonas/AppData/Local/Temp/codex-clipboard-88143a62-bc74-4b1a-bfd4-6f940c05ff26.png',folder+'/references/persona_rear_concepts.png');
 m.references.push({path:folder+'/references/persona_rear_concepts.png',provenance:'User-supplied rear three-quarter visual reference with explicit request to give every new tower another quality pass, 2026-09-18. Sheet captions are design context, not additional instructions.'});
 m.budgets.triangles=4000;
 m.overrides.push({field:'budgets.triangles',reason:'Quality pass permits up to 4000 triangles for curved recessed face construction, rounded optical bezels, full rear hatches with modeled ventilation recesses and role-specific armor. Two materials and a tiny packed palette remain unchanged.'});
 await writeFile(file,JSON.stringify(m,null,2)+'\n');
 const recipe=await readFile(folder+'/build.py','utf8');await writeFile(folder+'/build.py',recipe.replace('from persona_geometry import build','from persona_quality import build'));
 await appendFile(folder+'/decisions.md','\n## Requested quality pass — 2026-09-18\n\n- User asks for a substantial quality pass on each of the six new towers and supplies front and rear three-quarter concept sheets. Base Copilot remains excluded.\n- Rebuild the same v01 static interface using the still-authoritative procedural sources. Preserve prior deliveries through guarded pipeline milestones.\n- Replace the generic rounded boxes and applied face plates with shaped continuous shell/display construction; improve lens volume, component seating, silhouette and role-specific rear construction.\n- Shared revised recipe: `blender/towers/_shared/persona_quality.py`. The initial recipe is retained in `persona_geometry_initial.py`.\n- Allow up to 4000 triangles where curved optics, armor and recessed rear hatches justify the additional geometry; retain two materials and the packed 32×4 semantic palette.\n');
}
