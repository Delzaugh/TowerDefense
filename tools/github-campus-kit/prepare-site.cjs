const fs=require('node:fs');
const {assets}=JSON.parse(fs.readFileSync('tools/github-campus-kit/plan.json'));
const palette={wood:'#A77B55',oak:'#D8B990',grain:'#8F6749',dark:'#232925',steel:'#48647D',concrete:'#B6BFB8',chalk:'#E2EDF0',paving:'#D9DED8',green:'#0FBF3E',leaf:'#70B5B4',forest:'#4D855B',orange:'#E97538',soil:'#4C443C',gold:'#E8B75C',wine:'#803647',white:'#F2F5F3'};
for(const asset of assets.filter(a=>a.owner==='site')){
 const folder=`blender/environment/${asset.id}/v01`;
 if(fs.existsSync(`${folder}/build.py`))continue;
 fs.writeFileSync(`${folder}/build.py`,`from pathlib import Path\nimport sys\nsys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools'/'github-campus-kit'))\nfrom site_build import build\nbuild(Path(__file__).resolve().parent,'${asset.id}')\n`);
 const data=JSON.parse(fs.readFileSync(`${folder}/asset.json`));
 data.palette={storage:'texture',colors:palette};data.texturePalettes=[{material:'github_site_palette',size:[64,4],roles:Object.fromEntries(Object.entries(palette).map(([role,color],i)=>[role,{color,rect:[i*4,0,4,4]}]))}];
 data.exportSettings={paletteSampler:'linear'};
 data.contract.anchors={gh_floor_wood:['anchor_floor'],gh_floor_paving:['anchor_floor'],gh_floor_hex:['anchor_floor'],gh_timber_frame:['anchor_next_bay'],gh_stairs:['anchor_bottom','anchor_top']}[asset.id]||[];
 fs.writeFileSync(`${folder}/asset.json`,JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync(`${folder}/decisions.md`,`# ${asset.name}\n\n## Brief and user decisions\nThe user requested a complete reusable GitHub office/campus kit plus a disposable assembled campus prototype. This static environment asset has no animation requirement.\n\n## Reference priorities and primary form\nPublic research pack: docs/research/github-offices-2026-09-30/report.html and sources.json. Original geometry, with warehouse timber/floors, cafe hex paving and Concreteworks roof/planter vocabulary. Nominal module ${asset.size.join(' x ')} metres (X/Y/Z). Tree and courtyard landscape are authored campus additions rather than documented GitHub site features. Stairs rise 5m; guards extend above that rise.\n\n## Construction and interfaces\nGround origin Y=0, front +Z, metre scale. Individual planks, tile seams, beam joints and fitted concrete/wood furniture are modeled, not photo textures. Tiny 64x4 packed palette; atlas includes current official GitHub green alongside Tower family neutrals and warm wood. ${asset.id==='gh_timber_frame'?'Repeat bay at 6m centres; use selectively to keep adjacent posts from duplicating.':''}\n\n## Fidelity limits\nInterpreted game kit, not an as-built survey. Dimensions not measured from photographs. Source photographs remain reference material and are not runtime textures. User artistic acceptance remains pending.\n`);
}
