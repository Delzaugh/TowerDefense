import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assets=JSON.parse(await fs.readFile('tools/github-campus-kit/plan.json','utf8')).assets.filter(a=>a.owner==='props'&&(!process.argv[2]||process.argv.slice(2).includes(a.id)));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const a of assets){
 const folder=`blender/environment/${a.id}/v01`,manifest=JSON.parse(await fs.readFile(folder+'/asset.json','utf8'));
 if(!manifest.delivery)throw Error('Undelivered '+a.id);
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:4174/?asset=${a.id}&version=v01`);await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const evidence=[];if(await page.locator('#grid-button').count())await page.locator('#grid-button').click();
 for(const view of ['front','iso','rear']){await page.locator(`[data-view="${view}"]`).click();await page.locator('#viewport').screenshot({path:folder+`/validation/inspector-${view}.png`});evidence.push({view,state:await page.evaluate(()=>window.inspectorState())});}
 await page.locator('[data-view="iso"]').click();await page.locator('#zoom-in-button').click();await page.locator('#viewport').screenshot({path:folder+'/validation/inspector-close.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();await page.locator('#viewport').screenshot({path:folder+'/validation/inspector-phone.png'});evidence.push({view:'phone',state:await page.evaluate(()=>window.inspectorState())});
 await fs.writeFile(folder+'/validation/inspector-evidence.json',JSON.stringify({asset:a.id,revision:manifest.revision,sourceHash:manifest.delivery.sourceHash,sha256:manifest.delivery.sha256,origin:'http://127.0.0.1:4174',evidence,errors},null,2));
 console.log(a.id+': captured actual Inspector front, oblique, reverse, close and 390px views; errors '+errors.length);if(errors.length)throw Error(errors.join('\n'));await page.close();
}}finally{await browser.close();}
