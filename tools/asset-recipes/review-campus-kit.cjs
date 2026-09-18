const {chromium}=require('../../game/node_modules/playwright');
const {readFile,mkdir,writeFile}=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const ids=process.argv.length>2?process.argv.slice(2):JSON.parse(await readFile('tools/asset-recipes/campus-kit-entries.json','utf8'));
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1400,height:980}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const id of ids){
   await p.goto('http://127.0.0.1:4174/?asset='+id+'&version=v01');
   await p.waitForFunction(id=>window.inspectorState&&!window.inspectorState().loading&&window.inspectorState().entries[0]?.path==='environment/'+id+'_v01.glb',id);
   const folder='blender/environment/'+id+'/v01/renders';await mkdir(folder,{recursive:true});
   for(const view of ['iso','rear']){await p.locator('[data-view='+view+']').click();await p.locator('#viewport').screenshot({path:folder+'/inspector-'+view+'.png'});}
   if(id==='campus_lab'||id==='campus_solar'){await p.locator('[data-view=right]').click();await p.locator('#viewport').screenshot({path:folder+'/inspector-side.png'});}
   if(id.startsWith('campus_walk_')||id.startsWith('campus_tile_')||id==='campus_base_hex'){await p.locator('[data-view=top]').click();await p.locator('#viewport').screenshot({path:folder+'/inspector-top.png'});}
  }
  await writeFile('prototypes/campus-3d/previews/inspector-review-log.json',JSON.stringify({ids,errors,capturedAt:new Date().toISOString()},null,2));
  if(errors.length)throw Error(errors.join('; '));
  console.log('Captured shared Inspector views for '+ids.length+' assets.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


