import fs from 'node:fs/promises';
const d='blender/towers/copilot_analyst/v01';
const m=JSON.parse(await fs.readFile(d+'/asset.json','utf8'));
m.displayName='Analyst — Session Cap';
m.source.recipe=d+'/build.py';
for(const p of m.texturePalettes){
 if(p.roles.lens){p.roles.wood={...p.roles.lens,color:'#DDB78B'};delete p.roles.lens;}
 p.roles=Object.fromEntries(Object.entries(p.roles).sort((a,b)=>a[1].rect[0]-b[1].rect[0]));
}
m.references=[{path:'docs/design/concepts/analyst_hats_2026-09-30/session_cap_specs_v01/analyst-session-cap-accessory-spec.png',provenance:'User selected concept06 cap and little pencil, accepted spec pages and requested implementation.'},{path:'docs/design/concepts/analyst_hats_2026-09-30/session_cap_specs_v01/analyst-session-cap-model-changes-spec.png',provenance:'User approved plan: remove owl optics/data motifs, retain rounded source volume/ear housings, extend open face.'}];
await fs.writeFile(d+'/asset.json',JSON.stringify(m,null,2)+'\n');
await fs.appendFile(d+'/decisions.md','\n## Session Cap implementation authorized\n\nUser said “looks good, implement” after the two pages. Preserve broad head and ear housings, fit cap/pencil on wearer-left, remove owl optics/statistical marks, open face upward and recenter eyes. No mouth added. Small wood swatch replaces unused lens role. Existing root/scale/anchors retained; baseline animation not authorized. Cap recipe reuses only the resolved body section of the retained r7 recipe.\n');
