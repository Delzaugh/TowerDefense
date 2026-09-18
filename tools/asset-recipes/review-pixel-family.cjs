// Capture registered runtime assets in the shared Inspector; no asset mutation.
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const deps = process.env.PLAYWRIGHT_MODULE_PATH;
const {chromium} = require(deps);
const sharp = require(path.join(path.dirname(deps), 'sharp'));
const ids = ['campus_pixel_copilot','campus_pixel_rubber_duck','campus_pixel_mona'];
(async()=>{
  const project=path.resolve(__dirname,'../..');
  const {createInspectorServer}=await import(pathToFileURL(path.join(project,'tools/asset-inspector/server.mjs')));
  const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1300,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const board=[], overview=[];
  try {
    for(const [i,id] of ids.entries()){
      const dir=path.join(project,'blender/environment',id,'v01'),renders=path.join(dir,'renders');
      await fs.mkdir(renders,{recursive:true});await page.setViewportSize({width:1300,height:1000});
      await page.goto('http://127.0.0.1:'+server.address().port+'/?asset='+id+'&version=v01');
      await page.waitForFunction(id=>window.inspectorState?.().entries[0]?.path==='environment/'+id+'_v01.glb'&&!window.inspectorState().loading,id);
      await page.locator('#frame-button').click();
      await page.locator('#viewport').screenshot({path:path.join(renders,'inspector-iso.png')});
      await page.locator('[data-view="rear"]').click();
      await page.locator('#viewport').screenshot({path:path.join(renders,'inspector-rear.png')});
      await page.locator('[data-view="front"]').click();await page.locator('#zoom-in-button').click();
      await page.locator('#viewport').screenshot({path:path.join(renders,'inspector-detail.png')});
      await page.setViewportSize({width:390,height:844});await page.locator('[data-view="iso"]').click();
      await page.locator('#frame-button').click();
      for(let n=0;n<2;n++)await page.locator('#zoom-out-button').click();
      await page.locator('#viewport').screenshot({path:path.join(renders,'inspector-phone.png')});
      for(const [j,file] of ['validation/front.png','validation/side.png','renders/inspector-rear.png','renders/inspector-phone.png'].entries()){
        board.push({input:await sharp(path.join(dir,file)).resize(340,300,{fit:'contain',background:'#dce5ed'}).png().toBuffer(),left:j*340,top:i*300});
      }
      const label=Buffer.from('<svg width="450" height="38"><rect width="450" height="38" fill="#172531"/><text x="18" y="25" fill="#e2edf0" font-family="sans-serif" font-size="17">'+id.replace('campus_','').replaceAll('_',' ')+'</text></svg>');
      overview.push({input:await sharp(path.join(dir,'validation/iso.png')).resize(450,400).png().toBuffer(),left:(i%3)*450,top:Math.floor(i/3)*438});
      overview.push({input:label,left:(i%3)*450,top:Math.floor(i/3)*438+400});
    }
    if(errors.length)throw Error(errors.join('\n'));
    const output=path.join(project,'artifacts/campus-pixel-family');await fs.mkdir(output,{recursive:true});
    await sharp({create:{width:1360,height:ids.length*300,channels:4,background:'#dce5ed'}}).composite(board).png().toFile(path.join(output,'review-board.png'));
    await sharp({create:{width:1350,height:438,channels:4,background:'#172531'}}).composite(overview).png().toFile(path.join(output,'overview.png'));
    console.log(JSON.stringify({passed:true,assets:ids,errors,output}));
  } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
