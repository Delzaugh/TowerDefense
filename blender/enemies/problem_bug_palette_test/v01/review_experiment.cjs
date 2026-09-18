const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const folder=__dirname,project=path.resolve(folder,'../../../..');
const output=path.join(folder,'validation/inspector');
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const {createInspectorServer}=await import(pathToFileURL(path.join(project,'tools/asset-inspector/server.mjs')));
  const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1}),errors=[],records=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
    async function shot(label){await settle();const state=await page.evaluate(()=>window.inspectorState());await page.locator('#viewport').screenshot({path:path.join(output,label+'.png')});records.push({label,state});}
    for(const [id,label] of [['problem_bug','vertex'],['problem_bug_palette_test','texture']]){
      await page.goto(url+'/?asset='+id+'&version=v01');
      await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
      await page.locator('#rest-button').click();
      await page.locator('#grid-button').click();
      for(const view of ['iso','front','rear']){await page.locator('[data-view='+view+']').click();await shot(label+'_'+view);}
      await page.locator('[data-view=iso]').click();await page.locator('#zoom-in-button').click();await shot(label+'_close');
      await page.locator('#frame-button').click();
      for(const [clip,progress] of [['move',.25],['move',.75],['hit',.5],['resolve',.5]]){
        await page.locator('#clip-select').selectOption({label:clip});
        const duration=Number(await page.locator('#timeline').getAttribute('max'));
        await page.locator('#timeline').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},(duration*progress).toFixed(3));
        await shot(label+'_'+clip+'_'+progress);
      }
      await page.locator('#rest-button').click();await page.locator('#review-open').click();
      const opts=await page.locator('#palette-select option').allTextContents();
      assert.equal(opts.length,7);
      records.push({label:label+'_editing',paletteOptions:opts,status:await page.locator('#palette-status').innerText()});
      await page.locator('#phone-toggle').check();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
      await shot(label+'_phone_small');
      assert((await page.locator('#viewport').boundingBox()).width<=391);
    }
    assert.deepEqual(errors,[]);
    for(const suffix of ['iso','front','rear','close','move_0.25','move_0.75','hit_0.5','resolve_0.5','phone_small']){
      const a=records.find(x=>x.label==='vertex_'+suffix).state,b=records.find(x=>x.label==='texture_'+suffix).state;
      for(const key of ['camera','target','distance'])assert.deepEqual(a[key],b[key],suffix+'/'+key);
      assert.deepEqual(a.entries[0].pose,b.entries[0].pose,suffix+'/pose');
    }
    // Read-only rendering probe in the shared Three.js runtime. No game code or
    // Inspector APIs are changed. This measures resources/draw calls, not FPS.
    const resources=await page.evaluate(async()=>{
      const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
      function clone(source){
        const result=source.clone(true),mapping=new Map();
        function pair(a,b){mapping.set(a,b);a.children.forEach((c,i)=>pair(c,b.children[i]));}pair(source,result);
        source.traverse(o=>{if(!o.isSkinnedMesh)return;const c=mapping.get(o);c.skeleton=o.skeleton.clone();c.skeleton.bones=o.skeleton.bones.map(b=>mapping.get(b));c.bind(c.skeleton,o.bindMatrix);});
        result.updateMatrixWorld(true);return result;
      }
      const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(800,600);renderer.setPixelRatio(1);
      const camera=new THREE.OrthographicCamera(-18,18,14,-14,.1,100);camera.position.set(20,30,25);camera.lookAt(0,0,0);
      const results=[];
      for(const id of ['problem_bug','problem_bug_palette_test']){
        const gltf=await new GLTFLoader().loadAsync('/runtime/enemies/'+id+'_v01.glb');
        const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
        const materials=new Set(),textures=new Set();let vertexBytes=0,indexBytes=0;
        gltf.scene.traverse(o=>{if(!o.isMesh)return;vertexBytes+=Object.values(o.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0);indexBytes+=o.geometry.index.array.byteLength;materials.add(o.material);Object.values(o.material).filter(v=>v?.isTexture).forEach(t=>textures.add(t));});
        const single=clone(gltf.scene);single.traverse(o=>{o.frustumCulled=false;});scene.add(single);renderer.render(scene,camera);
        const one={...renderer.info.render};scene.remove(single);
        const clones=[];
        for(let i=0;i<100;i++){const c=clone(gltf.scene);c.position.set((i%10-4.5)*2.6,0,(Math.floor(i/10)-4.5)*2.4);c.traverse(o=>{o.frustumCulled=false;});scene.add(c);clones.push(c);}
        renderer.render(scene,camera);const hundred={...renderer.info.render};
        results.push({id,one,hundred,materials:materials.size,baseTextureCount:textures.size,vertexBytes,indexBytes,
          textures:[...textures].map(t=>({width:t.image.width,height:t.image.height,minFilter:t.minFilter,magFilter:t.magFilter,colorSpace:t.colorSpace}))});
        gltf.scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
        for(const c of [single,...clones])c.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});
      }
      renderer.dispose();return results;
    });
    for(const r of resources){assert.equal(r.one.calls,1);assert.equal(r.hundred.calls,100);assert.equal(r.one.triangles,2334);assert.equal(r.hundred.triangles,233400);}
    assert.deepEqual(errors,[]);
    // Static review board uses actual Inspector screenshots, not a new viewer.
    const data=async name=>'data:image/png;base64,'+(await fs.readFile(path.join(output,name+'.png'))).toString('base64');
    const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#172631;color:#edf5fb;font:20px system-ui;padding:24px}h1{font-size:28px;margin:0 0 8px}p{color:#b9cbd6;margin:0 0 22px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}h2{font-size:19px;margin:0 0 8px}img{width:100%;display:block;background:#172631;border:1px solid #405866;border-radius:8px}footer{font-size:16px;color:#b9cbd6;margin-top:18px}</style><h1>Bug: vertex colours vs palette texture</h1><p>Same geometry, pose, lighting and camera · actual Asset Inspector renders</p><div class="pair"><section><h2>Original · vertex colours</h2><img src="${await data('vertex_iso')}"></section><section><h2>Experiment · 32 × 4 palette texture</h2><img src="${await data('texture_iso')}"></section></div><footer>2,334 triangles · 1 material each · Textured GLB is 5.3% smaller · Original preserved</footer>`;
    await fs.writeFile(path.join(output,'comparison.html'),html);
    await page.setViewportSize({width:1440,height:850});await page.setContent(html);await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    await page.screenshot({path:path.join(output,'comparison.png'),fullPage:true});
    const report={passed:true,errors,resources,records};await fs.writeFile(path.join(output,'review.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:true,resources,screenshots:output},null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
