const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {PNG}=require(require.resolve('pngjs',{paths:[path.dirname(process.env.PLAYWRIGHT_MODULE_PATH||process.execPath)]}));
(async()=>{
 const project=path.resolve(__dirname,'../..'),{findAsset}=await import(pathToFileURL(path.join(__dirname,'contracts.mjs')));
 const item=await findAsset(process.argv[2]),m=item.data,folder=path.join(project,path.dirname(item.manifest),'validation');
 const {createInspectorServer}=await import(pathToFileURL(path.join(project,'tools/asset-inspector/server.mjs')));
 const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?asset='+m.id+'&version='+m.version);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#grid-button').click();await page.locator('#review-open').click();
  const expected=m.texturePalettes.reduce((n,p)=>n+Object.keys(p.roles).length,0);
  assert.equal(await page.locator('#palette-select option').count(),expected);
  await page.locator('#phone-toggle').check();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('#viewport').screenshot({path:path.join(folder,'palette_phone.png')});
  assert.deepEqual(errors,[]);
  const diff=[];
  for(const view of ['iso','front','rear','side','top',...m.clips.map(c=>c.name)]){
   const a=PNG.sync.read(await fs.readFile(path.join(folder,'palette_before_'+view+'.png'))),b=PNG.sync.read(await fs.readFile(path.join(folder,view+'.png')));
   assert.equal(a.data.length,b.data.length);let max=0,sum=0;
   for(let i=0;i<a.data.length;i++)if(i%4!==3){const d=Math.abs(a.data[i]-b.data[i]);max=Math.max(max,d);sum+=d;}
   diff.push({view,maxChannelDifference:max,meanChannelDifference:sum/(a.width*a.height*3)});
  }
  const data=async name=>'data:image/png;base64,'+(await fs.readFile(path.join(folder,name+'.png'))).toString('base64');
  const tiles=[['Before: vertex colours','palette_before_iso'],['After: palette texture','iso'],['Front','front'],['Rear','rear'],...m.clips.map(c=>[c.name,c.name]),['Phone: small silhouette','palette_phone']];
  const html='<!doctype html><style>body{margin:0;padding:24px;background:#172631;color:#e8f3fa;font:18px system-ui}h1{font-size:25px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}img{display:block;width:100%;height:300px;object-fit:contain;background:#dce5ed}h2{font-size:16px}p{color:#b8cdd7}</style><h1>'+m.displayName+' · texture conversion · revision '+m.revision+'</h1><p>Current source preserved in milestone · exact geometry, rig and animation parity · original colours</p><div class="grid">'+(await Promise.all(tiles.map(async([label,name])=>'<section><h2>'+label+'</h2><img src="'+await data(name)+'"></section>'))).join('')+'</div>';
  const board=await browser.newPage({viewport:{width:1440,height:1100}});await board.setContent(html);await board.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await board.screenshot({path:path.join(folder,'palette_review.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  const report={asset:m.id,revision:m.revision,sha256:m.delivery.sha256,paletteControls:expected,errors,diff,visualReview:'pending agent inspection of palette_review.png'};
  await fs.writeFile(path.join(folder,'palette_visual_report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
