import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(path.resolve('game/node_modules/playwright'));
const out='blender/enemies/problem_bug/v01/validation/material';
await fs.mkdir(out,{recursive:true});
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1080,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?asset=problem_bug&version=v01`);
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const images=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const result={};
  for(const row of ['studio','gameplay','small-slate','small-light'])for(const e of [.08,.02,0]){
   const scene=new T.Scene();scene.background=new T.Color(row==='small-light'?'#D2E1E5':'#354B64');
   scene.add(new T.HemisphereLight(0xd5edff,0x23323c,2.5));
   const gameplay=row==='gameplay';
   const key=new T.DirectionalLight(gameplay?0xfff1dd:0xffffff,gameplay?2.8:3.5);key.position.set(5,8,4);scene.add(key);
   const fill=new T.DirectionalLight(gameplay?0x75c7ff:0xffffff,gameplay?1.5:1.25);fill.position.set(-5,3,-4);scene.add(fill);
   const gltf=await new GLTFLoader().loadAsync('/runtime/enemies/problem_bug_v01.glb');
   gltf.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.emissive.setRGB(e,e,e);m.emissiveIntensity=1;}});scene.add(gltf.scene);
   const span=row.startsWith('small')?7:3.1, width=340,height=row.startsWith('small')?170:270;
   const camera=new T.OrthographicCamera(-span*width/height/2,span*width/height/2,span/2,-span/2,.01,100);
   const aim=new T.Vector3(0,.75,0);camera.position.copy(aim).add(new T.Vector3(6,5,9));camera.lookAt(aim);
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
   renderer.render(scene,camera);result[`${row}-${e}`]=renderer.domElement.toDataURL();
   scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}});renderer.dispose();renderer.forceContextLoss();
  }return result;
 });
 for(const [name,data] of Object.entries(images))await fs.writeFile(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
 const html=`<!doctype html><meta charset="utf-8"><title>Bug material comparison</title><style>body{background:#101d29;color:#e2edf0;font:16px system-ui;margin:20px}h1{font-size:26px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%;display:block}h2{font-size:17px}small{color:#adc5d2}</style><h1>Bug — retain cobalt/red, compare white self-emission</h1><p>Same palette, geometry, roughness, scale and lights. Columns: original 0.08 · reduced 0.02 · matte 0.00.</p>${['studio','gameplay','small-slate','small-light'].map(row=>`<h2>${row}</h2><div class="row">${[.08,.02,0].map(e=>`<div><img src="${images[row+'-'+e]}"><small>White emission ${e}</small></div>`).join('')}</div>`).join('')}`;
 await fs.writeFile(`${out}/comparison.html`,html);
 await page.goto('about:blank');await page.setContent(html);await page.screenshot({path:`${out}/comparison.png`,fullPage:true});
 await fs.writeFile(`${out}/comparison-report.json`,JSON.stringify({errors,parameters:[.08,.02,0],palettes:'unchanged',kind:'Temporary material previews of registered Bug; not independent asset exports'},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Material comparison rendered.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
