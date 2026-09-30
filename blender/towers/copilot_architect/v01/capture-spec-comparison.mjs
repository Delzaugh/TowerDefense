import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const here=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(here,'validation','spec-comparison');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}});
 await page.goto('http://127.0.0.1:4174/?asset=copilot_architect&version=v01');
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const result=await page.evaluate(async()=>{
  const T=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const models=await(await fetch('/api/models')).json();const model=models.find(m=>m.contract.id==='copilot_architect'&&m.contract.version==='v01');
  const root=(await new GLTFLoader().loadAsync('/runtime/'+model.path+'?review='+model.sha256)).scene;
  const scene=new T.Scene();scene.background=new T.Color('#142b43');scene.add(root);
  scene.add(new T.HemisphereLight(0xffffff,0x566679,2.0));
  const key=new T.DirectionalLight(0xfff4e3,3.0);key.position.set(-4,7,7);scene.add(key);
  const fill=new T.DirectionalLight(0xc3eaff,1);fill.position.set(5,3,-4);scene.add(fill);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3());
  const dirs=[
   ['front',0,18],['front-left',35,18],['left',90,12],
   ['back',180,18],['back-right',225,18],['right',270,12],
   ['hero',28,24],['underside',215,-25],['top',0,89],
   ['stylus-close',70,10,[1.25,1.28,-.10],2.0],
   ['blueprint-close',320,20,[-1.40,1.39,.24],2.45],
   ['diagram-close',5,35,[0,2.07,.25],1.85],
   ['small',35,28,null,4.3,128]
  ];
  const records=[];const black=new T.MeshBasicMaterial({color:0x000000,toneMapped:false,side:T.DoubleSide});
  for(const [name,az,el,aim,span=4.0,size=800] of dirs){
   renderer.setSize(size,size);
   const target=aim?new T.Vector3(...aim):center.clone();
   const camera=new T.OrthographicCamera(-span/2,span/2,span/2,-span/2,.01,100);
   const a=az*Math.PI/180,e=el*Math.PI/180;
   camera.position.copy(target).add(new T.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)).multiplyScalar(12));
   camera.lookAt(target);camera.updateMatrixWorld();root.updateMatrixWorld(true);
   renderer.render(scene,camera);const shaded=renderer.domElement.toDataURL();
   const bg=scene.background;scene.background=new T.Color('white');scene.overrideMaterial=black;renderer.render(scene,camera);
   const mask=renderer.domElement.toDataURL();scene.background=bg;scene.overrideMaterial=null;
   records.push({name,shaded,mask,camera:{projection:'orthographic',azimuth:az,elevation:el,position:camera.position.toArray(),target:target.toArray(),verticalSpan:span,viewport:[size,size]}});
  }
  renderer.dispose();
  return {model:{id:model.contract.id,revision:model.contract.revision,sha256:model.sha256,sourceHash:model.contract.delivery?.sourceHash},records};
 });
 for(const r of result.records){
  for(const key of ['shaded','mask'])await fs.writeFile(path.join(out,r.name+(key==='mask'?'-mask':'')+'.png'),Buffer.from(r[key].split(',')[1],'base64'));
  delete r.shaded;delete r.mask;
 }
 await fs.writeFile(path.join(out,'cameras.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({model:result.model,views:result.records.length,out}));
}finally{await browser.close();}

