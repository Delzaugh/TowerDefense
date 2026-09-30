const fs=require('node:fs/promises');const path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{const out=path.join(__dirname,'validation','hands');await fs.mkdir(out,{recursive:true});const b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({viewport:{width:1300,height:1050}});await p.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');await p.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const shot=async name=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
 const pose=async(name,t)=>{if(!name)return p.locator('#rest-button').click();await p.locator('#clip-select').selectOption({label:name});await p.locator('#timeline').fill(String(t));await p.locator('#timeline').dispatchEvent('input');};
 for(const v of ['front','iso','right','rear']){await p.locator('[data-view="'+v+'"]').click();await p.locator('#frame-button').click();for(let i=0;i<5;i++)await p.locator('#zoom-in-button').click();
  for(const [n,t] of [[null,0],['work',.75],['work',1.5],['celebrate_team',1.26],['celebrate_team',1.6]]){await pose(n,t);await shot(v+'_'+(n||'rest')+'_'+t);}
 }
 await fs.writeFile(path.join(out,'state.json'),JSON.stringify(await p.evaluate(()=>window.inspectorState()),null,2));console.log(out);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
