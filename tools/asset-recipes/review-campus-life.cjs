const {chromium}=require('../../game/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1400,height:980}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const id of ['campus_flower_bed','campus_bush_round','campus_hedge','campus_path_bollard','campus_cafe_table','campus_noticeboard']){
   await p.goto('http://127.0.0.1:4174/?asset='+id+'&version=v01');
   await p.waitForFunction(id=>window.inspectorState&&!window.inspectorState().loading&&window.inspectorState().entries[0]?.path==='environment/'+id+'_v01.glb',id);
   const folder='blender/environment/'+id+'/v01/renders';
   for(const view of ['iso','front','rear']){await p.locator('[data-view='+view+']').click();await p.locator('#viewport').screenshot({path:folder+'/inspector-'+view+'.png'});}
   if(['campus_flower_bed','campus_bush_round','campus_hedge'].includes(id)){
    await p.locator('[data-view=iso]').click();await p.locator('#clip-select').selectOption('0');
    for(const t of [0,1,3,4]){
     await p.locator('#timeline').evaluate((el,time)=>{el.value=String(time);el.dispatchEvent(new Event('input',{bubbles:true}));},t);
     await p.locator('#viewport').screenshot({path:folder+'/breeze-'+t+'.png'});
    }
   }
  }
  if(errors.length)throw Error(errors.join('; '));
  fs.writeFileSync('prototypes/campus-3d/previews/life-inspector-review.json',JSON.stringify({capturedAt:new Date().toISOString(),errors},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
