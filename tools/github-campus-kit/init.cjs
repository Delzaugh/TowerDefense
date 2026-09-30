const fs=require('node:fs');const {spawnSync}=require('node:child_process');
const plan=JSON.parse(fs.readFileSync('tools/github-campus-kit/plan.json','utf8'));
for(const asset of plan.assets){
 const folder=`blender/environment/${asset.id}/v01`;
 if(fs.existsSync(`${folder}/asset.json`)){console.log(`${asset.id}: existing contract preserved`);continue;}
 if(!fs.existsSync(`${folder}/asset.json`)){
  const result=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','init',asset.id,'environment'],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||result.stdout);
 }
 const manifest=JSON.parse(fs.readFileSync(`${folder}/asset.json`,'utf8'));
 manifest.displayName=asset.name;manifest.source.mode='procedural';manifest.source.recipe=`${folder}/build.py`;
 manifest.budgets={triangles:50000,meshes:40,materials:4,textures:4,textureSize:256,bones:0};
 manifest.contract.grounded=false;manifest.contract.groundY=0;manifest.contract.anchors=[];
 manifest.references=[{path:'docs/research/github-offices-2026-09-30/report.html',provenance:'Public architect, contractor, artist and official brand references catalogued in adjacent sources.json. Original interpreted geometry; photographs are references, not runtime textures.'}];
 fs.writeFileSync(`${folder}/asset.json`,JSON.stringify(manifest,null,2)+'\n');
 console.log(`${asset.id}: initialized`);
}
