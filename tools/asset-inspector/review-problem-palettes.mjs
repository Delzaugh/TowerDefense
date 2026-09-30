// Read-only matched views: registered GLBs, shared texture preview controls.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createInspectorServer} from './server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(path.resolve('game/node_modules/playwright'));
const policy=JSON.parse(await fs.readFile('docs/design/Problems_Palette.json'));
const out='docs/design/reviews/problems-palette-2026-09-27';await fs.mkdir(out,{recursive:true});
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?asset=problem_bug&version=v01`);
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const models=(await page.evaluate(async()=>await(await fetch('/api/models')).json())).filter(m=>policy.bindings[m.contract.id]);
 const baselineFile=out+'/baseline.json';
 let baseline;try{baseline=JSON.parse(await fs.readFile(baselineFile));}catch(e){if(e.code!=='ENOENT')throw e;baseline=models;await fs.writeFile(baselineFile,JSON.stringify(models,null,2));}
 const records=[];
 for(const [id,bindings] of Object.entries(policy.bindings)){
  const model=models.find(m=>m.contract.id===id),old=baseline.find(m=>m.contract.id===id);
  const before=Object.fromEntries(Object.entries(old.contract.texturePalettes[0].roles).map(([r,s])=>[r,s.color]));
  const after=Object.fromEntries(Object.entries(bindings).map(([r,t])=>[r,policy.tokens[t]]));
  if(new Set(Object.values(after)).size>(policy.maxUniqueBaseColorsByAsset?.[id]??Infinity))throw Error(id+' exceeds its explicitly agreed colour count');
  if(process.argv.includes('--delivered'))for(const [role,color] of Object.entries(after))if(model.contract.texturePalettes[0].roles[role].color!==color)throw Error(id+' undelivered role '+role);
  records.push({id,name:model.contract.displayName,revision:model.contract.revision,sha256:model.sha256,before,after,changes:Object.keys(after).filter(r=>after[r]!==before[r])});
  for(const mode of ['before','after']){
   const data=await page.evaluate(async({model,colors})=>{
    const T=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
    const {inspectTexturePalettes,setTexturePaletteColor,resetTexturePalette}=await import('/review.js');
    const scene=new T.Scene();scene.background=new T.Color('#354B64');scene.add(new T.HemisphereLight(0xd5edff,0x23323c,2.5));
    const key=new T.DirectionalLight(0xffffff,3.5);key.position.set(5,8,4);scene.add(key);const fill=new T.DirectionalLight(0xffffff,1.25);fill.position.set(-5,3,-4);scene.add(fill);
    const gltf=await new GLTFLoader().loadAsync('/runtime/'+model.path),root=gltf.scene;scene.add(root);
    const palettes=inspectTexturePalettes(T,root,model.contract.texturePalettes);
    for(const p of palettes)for(const [r,c]of Object.entries(colors))setTexturePaletteColor(T,p,r,c);
    const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(420,300);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
    const span=3.7,aspect=420/300,camera=new T.OrthographicCamera(-span*aspect/2,span*aspect/2,span/2,-span/2,.01,100);
    const aim=new T.Vector3(0,.78,0);camera.position.copy(aim).add(new T.Vector3(6,5,9));camera.lookAt(aim);renderer.render(scene,camera);
    const data=renderer.domElement.toDataURL();for(const p of palettes)resetTexturePalette(p);scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.emissiveMap?.dispose();m.dispose();}});renderer.dispose();renderer.forceContextLoss();return data;
   },{model,colors:mode==='before'?before:after});
   records.at(-1)[mode+'Image']=data;
  }
 }
 const oldColors=new Set(records.flatMap(r=>Object.values(r.before))),newColors=new Set(records.flatMap(r=>Object.values(r.after)));
 const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Problems · Palette iteration</title><style>*{box-sizing:border-box}body{margin:0;background:#101d29;color:#e2edf0;font:16px/1.5 system-ui}main{max-width:1380px;margin:auto;padding:28px}h1{font-size:36px;margin:0}p{max-width:1000px;color:#adc5d2}nav{position:sticky;top:0;background:#101d29f0;padding:12px 0;z-index:2}button{font:inherit;padding:10px 18px;background:#25384f;color:white;border:1px solid #65859d;border-radius:8px;cursor:pointer}button[aria-pressed=true]{background:#82dadd;color:#101d29}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card{background:#1b2c3c;border:1px solid #354b64;border-radius:12px;overflow:hidden}.card img{width:100%;display:block}.card h2,.card p,.swatches{margin:12px 16px}.card h2{font-size:21px}.card p{font-size:13px}.swatches{display:flex;gap:4px;flex-wrap:wrap}.swatches i{width:20px;height:20px;border-radius:4px;border:1px solid #ffffff44}.tokens{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.token{padding:8px;background:#1b2c3c;font-size:12px;min-width:140px}.token i{display:block;height:28px;border-radius:4px}.gray img{filter:grayscale(1)}@media(max-width:700px){main{padding:16px}.cards{grid-template-columns:1fr 1fr;gap:8px}.card h2{font-size:16px}}</style><main><h1>Problems, one supporting palette</h1><p>${oldColors.size} separate colour values → ${newColors.size} shared values across six enemies. Keep cobalt Bug, cyan Lag trails, pale/yellow notes and lime/teal Spaghetti. Merge equivalent inks, joints, paper tones and red warning details. Every current Problem uses five to seven distinct base colours. Vague Spec and Missing Details were reduced from eight to seven.</p><nav><button id="before" aria-pressed="true">Before iteration</button> <button id="after" aria-pressed="false">Aligned palette</button> <button id="gray" aria-pressed="false">Grayscale</button></nav><p id="status">Before iteration. Original swatches restored on unchanged current geometry.</p><section class="cards">${records.map(r=>`<article class="card"><img data-id="${r.id}" src="${r.beforeImage}" alt="${r.name}"><h2>${r.name}</h2><p>${new Set(Object.values(r.before)).size} → ${new Set(Object.values(r.after)).size} colours · ${r.changes.length?r.changes.length+' roles aligned': 'reference unchanged'}</p><div class="swatches" data-id="${r.id}"></div></article>`).join('')}</section><h2>Shared colour definitions</h2><div class="tokens">${Object.entries(policy.tokens).map(([n,c])=>`<div class="token"><i style="background:${c}"></i>${n.replaceAll('_',' ')}<br>${c}</div>`).join('')}</div><p>Same 3.7 m vertical frame, authored metre scale, neutral Inspector lighting. Each model keeps its tiny embedded atlas and semantic role names. Missing Details keeps its separate luminous-eye map; eye/core share the same base red and retain separate emission. Colour definitions merge; GPU materials and draw calls do not.</p><p>${process.argv.includes('--delivered')?'Aligned shows delivered Blender/GLB colours, verified against the shared definitions. Before restores retained original colours on identical geometry.':'Read-only candidate; source/runtime delivery is pending.'}</p></main><script>const records=${JSON.stringify(records)};let mode='after';function show(){for(const r of records){document.querySelector('img[data-id='+r.id+']').src=r[mode+'Image'];document.querySelector('.swatches[data-id='+r.id+']').innerHTML=[...new Set(Object.values(r[mode]))].map(c=>[Object.keys(r[mode]).filter(k=>r[mode][k]===c).join(', '),c]).map(([role,c])=>'<i title="'+role+' '+c+'" style="background:'+c+'"></i>').join('')}for(const m of ['before','after'])document.getElementById(m).setAttribute('aria-pressed',String(mode===m));document.getElementById('status').textContent=mode==='before'?'Before iteration. Original swatches restored on unchanged current geometry.':'Aligned palette. Shared supporting colours; individual character accents retained.'}for(const m of ['before','after'])document.getElementById(m).onclick=()=>{mode=m;show()};document.getElementById('gray').onclick=e=>{document.body.classList.toggle('gray');e.target.setAttribute('aria-pressed',String(document.body.classList.contains('gray')))};show();</script>`;
 await fs.writeFile(out+'/index.html',html);await page.goto('about:blank');await page.setContent(html);await page.locator('#after').click();await page.screenshot({path:out+'/after-board.png',fullPage:true});
 await fs.writeFile(out+'/audit.json',JSON.stringify({at:new Date().toISOString(),oldUnique:oldColors.size,newUnique:newColors.size,roleCount:records.reduce((n,r)=>n+Object.keys(r.after).length,0),changedRoles:records.reduce((n,r)=>n+r.changes.length,0),errors,assets:records.map(({beforeImage,afterImage,...r})=>({...r,beforeUnique:new Set(Object.values(r.before)).size,afterUnique:new Set(Object.values(r.after)).size}))},null,2));
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({oldUnique:oldColors.size,newUnique:newColors.size,changedRoles:records.reduce((n,r)=>n+r.changes.length,0)}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
