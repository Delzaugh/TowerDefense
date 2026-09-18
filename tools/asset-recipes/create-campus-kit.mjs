import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const entries=[
 ['campus_platform','Glacier floating campus',3000,['anchor_surface'],'30 × 26 m clipped-corner floating foundation. Primary surface at y=1.20 m; low perimeter rim at 1.225 m. Root grounded at y=0.'],
 ['campus_lab','Glacier Copilot Lab',4000,['anchor_ui','anchor_door_min','anchor_door_max'],'Standalone lab extracted from campus_home_study revision 5, rebased by 0.65 m. Preserve enlarged 2.80 × 2.48 m clear double-door aperture.'],
 ['campus_walk_straight','Campus walkway · straight 4 m',800,['anchor_start','anchor_end'],'3.20 m wide; 4 m long, centered, along Z. Walking surface y=.08 m. Ports at z=−2 and +2.'],
 ['campus_walk_short','Campus walkway · straight 2 m',800,['anchor_start','anchor_end'],'3.20 m wide; 2 m long, centered, along Z. Surface y=.08 m. Ports z=−1 and +1.'],
 ['campus_walk_corner','Campus walkway · square corner',1200,['anchor_start','anchor_end'],'3.20 m wide mitered right-angle turn. Start (0,0) heading +Z; end (4,4) heading +X. Surface y=.08 m.'],
 ['campus_walk_bend','Campus walkway · rounded bend',1600,['anchor_start','anchor_end'],'3.20 m wide 90-degree bend, centerline radius 4 m. Start (0,0) heading +Z; end (4,4) heading +X. Surface y=.08 m.'],
 ['campus_walk_bend_45','Campus walkway · gentle bend',1200,['anchor_start','anchor_end'],'3.20 m wide 45-degree bend, centerline radius 4 m. Start (0,0) heading +Z; end (1.171573,2.828427) heading diagonally +X,+Z. Surface y=.08 m.'],
 ['campus_walk_junction','Campus walkway · T junction',1000,['anchor_start','anchor_end','anchor_branch'],'3.20 m wide T junction. Left/right ports (−2,0),(2,0); branch (0,−2). Surface y=.08 m.'],
 ['campus_tree_round','Campus tree · round crown',800,['anchor_ui'],'Broad faceted teal canopy, 2 × 2 m planter. Grounded static prop.'],
 ['campus_tree_tall','Campus tree · tall crown',800,['anchor_ui'],'Slender light-teal crown, 1.8 × 1.8 m planter. Grounded static prop.'],
 ['campus_tree_cluster','Campus tree · paired crowns',1000,['anchor_ui'],'Two distinct crowns in a 3.1 × 1.85 m planter. Shared teal palette. Grounded static prop.'],
 ['campus_pond','Campus garden pond',1500,['anchor_ui'],'6 × 3.7 m faceted oval pool, continuous raised rim, opaque inset water and seated rocks. No reflective or transparent runtime effect required.'],
 ['campus_solar','Campus solar array',1800,['anchor_ui'],'3.65 × 2.8 m footing with one tilted eight-cell panel, supported by four posts. Static, matte navy and chalk treatment.']
];
for(const [id,name,triangles,anchors,brief] of entries){
 const result=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','init',id,'environment'],{stdio:'pipe'});if(result.status!==0)throw Error(result.stderr.toString());
 const folder=`blender/environment/${id}/v01`,file=folder+'/asset.json',m=JSON.parse(await readFile(file,'utf8'));
 m.displayName=name;m.source.mode='procedural';m.source.recipe=folder+'/build.py';Object.assign(m.budgets,{triangles,materials:1,textures:0,bones:0,meshes:1});m.contract.anchors=anchors;
 m.references=[{path:'prototypes/hub/previews/before-3d-study.png',provenance:'Project-owned Glacier SVG campus, including floating panel, inset paths and faceted landscaping.'},{path:'tools/asset-recipes/campus-kit.py',provenance:'Shared geometry helper used by the local versioned recipe.'}];
 if(id==='campus_lab')m.references.push({path:'blender/environment/campus_home_study/v01/campus_home_study_v01.blend',provenance:'Source-faithful extraction of the scale-corrected lab from revision 5.'});
 await writeFile(file,JSON.stringify(m,null,2)+'\n');
 await writeFile(folder+'/build.py',`import runpy\nfrom pathlib import Path\nfolder=Path(__file__).resolve().parent\nproject=folder.parents[3]\nhelpers=runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))\nhelpers['build']('${id}',folder)\n`);
 await writeFile(folder+'/decisions.md',`# ${name}\n\nUser request, 2026-09-17: make the main floating campus panel the primary surface, provide reusable straight/corner/bend walkways, several tree variants, a pond and solar panels.\n\n${brief}\n\nGlacier palette and chunky low-poly construction. Metres; +Z forward; root at ground contact; opaque shared vertex-color material. No clips or gameplay rules. Each model is an independently registered reusable asset. Geometry is authored in Blender through the local build.py and shared helper. Ordinary export preserves manual source edits; procedural rebuilds must pass the source-hash guard.\n\nThe walkway widths are chosen for the canonical 2.27 m wide Copilot with turning clearance. Named port anchors define exact assembly points; assemble at 1:1 scale and align the 0.08 m top elevation. Do not resize the Copilot to conceal architectural scale errors.\n`);
}
await writeFile('tools/asset-recipes/campus-kit-entries.json',JSON.stringify(entries.map(e=>e[0]),null,2)+'\n');
console.log('Registered '+entries.length+' campus kit assets.');
