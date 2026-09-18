// Real Inspector integration plus adversarial atlas/contract checks. Never
// saves preview colors to the Blender source, PNG or runtime GLB.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const project=path.resolve(__dirname,'../..'),folder=path.join(project,'blender/enemies/problem_bug_palette_test/v01');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const {validateManifest}=await import(pathToFileURL(path.join(project,'tools/asset-pipeline/contracts.mjs')));
  const manifest=JSON.parse(await fs.readFile(path.join(folder,'asset.json')));
  const files=[manifest.source.path,manifest.runtime,'blender/enemies/problem_bug_palette_test/v01/bug_palette.png'];
  const before=await Promise.all(files.map(async p=>hash(await fs.readFile(path.join(project,p)))));
  validateManifest(manifest);
  for(const mutate of [m=>m.texturePalettes[0].roles.shell.rect=[31,0,4,4],m=>m.texturePalettes[0].roles.red.rect=[0,0,4,4],m=>m.texturePalettes[0].roles.red.color='red',m=>m.texturePalettes[0].size=[2048,2048],m=>m.texturePalettes.push(m.texturePalettes[0])]){
    const invalid=structuredClone(manifest);mutate(invalid);assert.throws(()=>validateManifest(invalid));
  }
  const {createInspectorServer}=await import(pathToFileURL(path.join(__dirname,'server.mjs'))),server=createInspectorServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'tower-texture-palette-'));
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
    await page.goto(url+'/?asset=problem_bug_palette_test&version=v01');await ready();
    await page.locator('#review-open').click();await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
    assert.equal(await page.locator('#palette-select option').count(),7);
    assert.match(await page.locator('#palette-status').innerText(),/Named texture swatches/);
    const choose=async role=>page.locator('#palette-select').selectOption('texture:bug_palette:'+role);
    const paint=async hex=>{await page.locator('#palette-color').fill(hex);await page.locator('#palette-color').dispatchEvent('input');};
    await choose('shell');assert.equal(await page.locator('#palette-color').inputValue(),'#3267af');
    await page.screenshot({path:path.join(output,'before.png')});await paint('#33bb66');
    await choose('red');assert.equal(await page.locator('#palette-color').inputValue(),'#e51c30');await paint('#ff9900');
    await choose('shell');assert.equal(await page.locator('#palette-color').inputValue(),'#33bb66');
    await page.locator('#copy-changes').click();const note=JSON.parse(await page.locator('#feedback-copy').inputValue());
    assert.equal(note.sha256,manifest.delivery.sha256);assert.equal(note.previewOnlyChanges.texturePalettes.bug_palette.shell,'#33bb66');
    assert.deepEqual(note.texturePaletteEdits.map(e=>({role:e.role,rect:e.rect,from:e.from,to:e.to,origin:e.origin})),[
      {role:'shell',rect:[0,0,4,4],from:'#3267AF',to:'#33bb66',origin:'top-left'},
      {role:'red',rect:[24,0,4,4],from:'#E51C30',to:'#ff9900',origin:'top-left'}]);
    await page.screenshot({path:path.join(output,'edited.png')});
    await page.locator('#palette-reset').click();assert.equal(await page.locator('#palette-color').inputValue(),'#3267af');
    await page.locator('#copy-changes').click();const resetNote=JSON.parse(await page.locator('#feedback-copy').inputValue());
    assert.deepEqual(resetNote.previewOnlyChanges,{});assert.equal(resetNote.texturePaletteEdits,undefined);
    await paint('#33bb66');await page.locator('#refresh-models').click();await page.waitForFunction(()=>document.getElementById('palette-color').value==='#3267af'&&!window.inspectorState().loading);
    assert.equal(await page.locator('#palette-color').inputValue(),'#3267af');
    // Compare against the migrated production Bug and exercise its texture controls.
    await page.locator('#comparison-select').selectOption('enemies/problem_bug_v01.glb');await page.locator('#compare-asset').click();
    await page.waitForFunction(()=>window.inspectorState().entries.length===2&&!window.inspectorState().loading);
    await page.locator('#palette-select').selectOption('texture:bug_palette:shell');assert.equal(await page.locator('#palette-color').inputValue(),'#3267af');
    await paint('#ff00ff');await page.locator('#palette-reset').click();assert.equal(await page.locator('#palette-color').inputValue(),'#3267af');
    // Explicitly unmapped atlases retain whole-material fallback.
    await page.goto(url+'/?asset=kaykit_basemodule_a&version=v01');await ready();
    assert.equal(await page.locator('#palette-select option').count(),1);
    assert.match(await page.locator('#palette-select option').textContent(),/tint/);
    const checks=await page.evaluate(async declarations=>{
      const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
      const {inspectTexturePalettes,setTexturePaletteColor,resetTexturePalette}=await import('/review.js');
      const check=(ok,message)=>{if(!ok)throw Error(message);};
      const gltf=await new GLTFLoader().loadAsync('/runtime/enemies/problem_bug_palette_test_v01.glb');
      const [p]=inspectTexturePalettes(THREE,gltf.scene,declarations),original=p.originalTexture,oldSource=original.source;
      // Another material and the emission slot share the original texture;
      // editing base colour must not alter either consumer or its Source.
      const other=new THREE.MeshStandardMaterial({map:original});p.material.emissiveMap=original;
      let disposed=0;
      setTexturePaletteColor(THREE,p,'shell','#33bb66');p.previewTexture.addEventListener('dispose',()=>disposed++);
      check(p.previewTexture!==original&&p.previewTexture.source!==oldSource,'Preview shared the original Source');
      check(other.map===original&&p.material.emissiveMap===original&&original.source===oldSource,'Shared consumer changed');
      for(const key of ['flipY','colorSpace','minFilter','magFilter','wrapS','wrapT','channel'])check(p.previewTexture[key]===original[key],'Sampling setting changed: '+key);
      const bytes=p.context.getImageData(0,0,32,4).data;
      for(let y=0;y<4;y++)for(let x=0;x<32;x++)for(let c=0;c<4;c++){
        const i=(y*32+x)*4+c,expected=x<4&&c<3?[51,187,102][c]:p.original.data[i];check(bytes[i]===expected,'Unselected pixel or alpha changed');
      }
      resetTexturePalette(p);check(disposed===1&&p.material.map===original,'Preview not disposed or restored');
      check(p.context.getImageData(0,0,32,4).data.every((v,i)=>v===p.original.data[i]),'Reset pixels differ');
      let rejected=0;
      for(const change of [d=>d[0].material='missing',d=>d[0].size=[64,4],d=>d[0].roles.shell.color='#ff0000']){const d=structuredClone(declarations);change(d);try{inspectTexturePalettes(THREE,gltf.scene,d);}catch{rejected++;}}
      check(rejected===3,'Bad exported palette was accepted');
      // Vertical orientation check with an asymmetric two-row palette.
      const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;const ctx=canvas.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(0,0,2,1);ctx.fillStyle='#0000ff';ctx.fillRect(0,1,2,1);
      const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.flipY=false;
      const mat=new THREE.MeshStandardMaterial({map:tex});mat.name='two_rows';const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.PlaneGeometry(),mat));
      const [rows]=inspectTexturePalettes(THREE,root,[{material:'two_rows',size:[2,2],roles:{top:{rect:[0,0,2,1],color:'#ff0000'},bottom:{rect:[0,1,2,1],color:'#0000ff'}}}]);
      setTexturePaletteColor(THREE,rows,'top','#00ff00');const pixels=rows.context.getImageData(0,0,2,2).data;
      check(pixels[1]===255&&pixels[10]===255&&pixels[8]===0,'Top-left rectangle flipped');resetTexturePalette(rows);
      return {pixelIsolation:true,sharedSourceIsolation:true,emissionIsolation:true,samplingPreserved:true,resetDisposal:true,invalidExportRejection:true,topLeftOrientation:true};
    },manifest.texturePalettes);
    // A synthetic vertex-colour exception exercises the same real UI without
    // retaining a vertex-colour production asset or serving source snapshots.
    await page.evaluate(async()=>{
      const THREE=await import('/vendor/three.module.js'),{installReview}=await import('/review.js');
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
      geo.setAttribute('color',new THREE.Float32BufferAttribute([1,0,0,1,0,0,0,0,1],3));geo.setAttribute('_palette_role',new THREE.Float32BufferAttribute([1,1,2],1));
      const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true}));mesh.userData.palette_roles={attribute:'_palette_role',roles:{warm:1,cool:2}};
      const root=new THREE.Group();root.add(mesh);const scene=new THREE.Scene();scene.background=new THREE.Color();
      const model={sha256:'fixture',contract:{id:'vertex_fixture',displayName:'Vertex exception',version:'v01',revision:1,budgets:{triangles:1}}};
      const entry={root,model,stats:{triangles:1}};
      const review=installReview({THREE,scene,renderer:{shadowMap:{}},key:new THREE.DirectionalLight(),fill:new THREE.DirectionalLight(),active:()=>entry,entries:()=>[entry],models:()=>[],context:()=>({})});
      review.sync();window.vertexFixture=mesh;
    });
    await page.locator('#review-open').click();await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
    assert.match(await page.locator('#palette-status').innerText(),/Explicit palette/);
    await page.locator('#palette-select').selectOption('warm');await paint('#00ff00');
    assert.deepEqual(await page.evaluate(()=>Array.from(window.vertexFixture.geometry.attributes.color.array)),[0,1,0,0,1,0,0,0,1]);
    await page.locator('#palette-reset').click();assert.deepEqual(await page.evaluate(()=>Array.from(window.vertexFixture.geometry.attributes.color.array)),[1,0,0,1,0,0,0,0,1]);
    assert.deepEqual(errors,[]);
    assert.deepEqual(await Promise.all(files.map(async p=>hash(await fs.readFile(path.join(project,p))))),before);
    const result={passed:true,checks,output,note};await fs.writeFile(path.join(output,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
