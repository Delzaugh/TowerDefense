const fs=require('node:fs/promises');const path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{const out=path.join(__dirname,'validation','nose-pack');await fs.mkdir(out,{recursive:true});const b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({viewport:{width:1300,height:1050}});await p.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');await p.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const canvas=p.locator('#viewport');
 for(const [view,pan,zoom,label] of [['front',160,5,'nose_front'],['right',160,5,'nose_profile'],['left',160,5,'hair_left'],['iso',140,4,'nose_oblique'],['rear',160,5,'hair_rear'],['top',0,1,'hair_top'],['right',60,3,'pack_side'],['rear',60,3,'pack_rear'],['front',-180,4,'shoes_front'],['iso',-160,4,'shoes_oblique'],['right',-180,4,'shoes_profile']]){
  await p.locator('[data-view="'+view+'"]').click();await p.locator('#frame-button').click();const box=await canvas.boundingBox();
  await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down({button:'right'});await p.mouse.move(box.x+box.width/2,box.y+box.height/2+pan,{steps:8});await p.mouse.up({button:'right'});
  for(let i=0;i<zoom;i++)await p.locator('#zoom-in-button').click();
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await canvas.screenshot({path:path.join(out,label+'.png')});
 }
 const state=await p.evaluate(()=>window.inspectorState());if(state.entries[0].clips.some(c=>c.name==='listen'))throw Error('Retired listen clip still present');await fs.writeFile(path.join(out,'state.json'),JSON.stringify(state,null,2));console.log(out);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

