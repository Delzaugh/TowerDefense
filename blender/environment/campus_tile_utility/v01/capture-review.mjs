import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.resolve('game/node_modules/playwright'));
const id=process.argv[2],folder=`blender/environment/${id}/v01`,m=JSON.parse(await fs.readFile(folder+'/asset.json'));
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost').pathname;
 if(u==='/'){res.setHeader('Content-Type','text/html');res.end('<style>body{margin:0}</style><script type="importmap">{"imports":{"three":"/vendor/three.module.js","../utils/BufferGeometryUtils.js":"/vendor/BufferGeometryUtils.js"}}</script>');return;}
 if(u==='/candidate.glb'){res.end(await fs.readFile(m.runtime));return;}
 const f=u.startsWith('/vendor/')?'tools/asset-inspector'+u:u.startsWith('/presentation/')?'tools/asset-presentation/'+path.basename(u):u==='/review.js'?'tools/asset-inspector/review.js':'tools/asset-pipeline/browser-check.js';
 let data=await fs.readFile(f,'utf8');if(u==='/check.js')data=data.replace('window.renderEvidence =','window.utilityScene={camera,renderer,scene,center,root}; window.renderEvidence =');
 res.setHeader('Content-Type','text/javascript');res.end(data);
 }catch(e){res.writeHead(404);res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:900,height:800}});
try{
 await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(async m=>(await import('/check.js')).inspect('/candidate.glb',m),m);
 const captures=id==='campus_utility_decor'?[{name:'close-joins',target:[7.5,1.6,-3.7],direction:[4,3,-5],extent:5.0},{name:'close-building',target:[-4.7,2.2,-.5],direction:[5,2,4],extent:4.2},{name:'reverse-oblique',target:[0,2,0],direction:[-4,3,-5],extent:14}]:[{name:'close-paving-edge',target:[6,1.2,8],direction:[3,4,5],extent:8},{name:'reverse-oblique',target:[0,.6,0],direction:[-3,3,-4],extent:25}];
 const evidence=[];
 for(const c of captures){await page.evaluate(c=>{const{camera,renderer,scene}=window.utilityScene;camera.left=-c.extent*1.125;camera.right=c.extent*1.125;camera.top=c.extent;camera.bottom=-c.extent;camera.position.set(...c.target.map((v,i)=>v+c.direction[i]*10));camera.lookAt(...c.target);camera.updateProjectionMatrix();renderer.render(scene,camera);},c);const p=folder+'/validation/'+c.name+'.png';const b=await page.screenshot({path:p});evidence.push({path:p,sha256:crypto.createHash('sha256').update(b).digest('hex'),view:c.name});}
 await page.setViewportSize({width:390,height:340});await page.evaluate(()=>{const{camera,renderer}=window.utilityScene;renderer.setSize(390,340);const dims=window.utilityScene.root;});await page.evaluate(()=>window.renderEvidence('iso'));
 // Restore the full-object frustum after detail captures.
 const dims=JSON.parse(await fs.readFile(folder+'/validation/report.json')).dimensions;await page.evaluate(dims=>{const {camera,renderer,scene}=window.utilityScene;const s=Math.max(...dims)*.85;camera.left=-s*390/340;camera.right=s*390/340;camera.top=s;camera.bottom=-s;camera.updateProjectionMatrix();renderer.render(scene,camera);},dims);
 const p=folder+'/validation/phone.png',b=await page.screenshot({path:p});evidence.push({path:p,sha256:crypto.createHash('sha256').update(b).digest('hex'),view:'phone-scale'});
 await fs.writeFile(folder+'/validation/detail_evidence.json',JSON.stringify(evidence,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
