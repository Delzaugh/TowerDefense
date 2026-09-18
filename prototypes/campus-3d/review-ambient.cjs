const {chromium}=require('../../game/node_modules/playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const {createStudyServer}=await import(pathToFileURL(path.join(__dirname,'serve.mjs')));
 const server=createStudyServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?review=1');await page.waitForFunction(()=>window.campusStudyState?.().loaded);
  await page.evaluate(()=>window.campusStudyReview.seek(70));
  const state=await page.evaluate(()=>window.campusStudyState());
  if(state.ambient.visitors[0].activity!=='café table break'||state.ambient.visitors[1].activity!=='admiring the sculpture')throw Error('Missing expanded routines');
  if(state.ambient.steam.length!==24||!state.ambient.steam.every(s=>s.width>=.3))throw Error('Missing readable steam');
  await page.screenshot({path:path.join(__dirname,'previews/ambient-terrace.png')});
  const point=await page.evaluate(async()=>{
   const THREE=await import('three'),s=window.campusStudyState(),r=document.querySelector('canvas').getBoundingClientRect(),span=s.frustumHeight,aspect=r.width/r.height;
   const c=new THREE.OrthographicCamera(-span*aspect/2,span*aspect/2,span/2,-span/2,.1,160);c.position.fromArray(s.camera);c.lookAt(new THREE.Vector3(...s.target));c.updateMatrixWorld();
   const p=new THREE.Vector3(1,1.2,22).project(c);return {from:[r.x+(p.x*.5+.5)*r.width,r.y+(-p.y*.5+.5)*r.height],to:[r.x+r.width/2,r.y+r.height/2]};
  });
  await page.mouse.move(...point.from);await page.mouse.down();await page.mouse.move(...point.to,{steps:12});await page.mouse.up();
  for(let i=0;i<12;i++)await page.locator('#zoom-in').click();
  for(const time of [28,29,70]){await page.evaluate(t=>window.campusStudyReview.seek(t),time);await page.screenshot({path:path.join(__dirname,'previews/ambient-close-'+time+'.png')});}
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.campusStudyState().ambient.reducedMotion);
  if((await page.evaluate(()=>window.campusStudyState())).ambient.steam.some(s=>s.visible))throw Error('Reduced-motion steam remains visible');
  console.log('Terrace/sculpture routines, larger steam, close walking evidence and reduced motion verified.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
