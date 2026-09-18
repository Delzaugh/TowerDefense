const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {mkdtemp,readFile}=require('node:fs/promises');
const os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||require.resolve('playwright',{paths:[process.cwd(),path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async()=>{
  const {createInspectorServer}=await import(pathToFileURL(path.join(__dirname,'server.mjs'))),server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),output=await mkdtemp(path.join(os.tmpdir(),'tower-review-'));
  try{
    const page=await browser.newPage({viewport:{width:1400,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const url='http://127.0.0.1:'+server.address().port;
    await page.goto(url+'/?asset=problem_bug&version=v01');await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
    assert((await page.locator('#revision-status').innerText()).includes('2500 triangles'));
    await page.locator('#clip-select').selectOption({label:'hit'});assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].loop,false);
    await page.locator('#clip-select').selectOption({label:'move'});assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].loop,true);await page.locator('#rest-button').click();
    await page.locator('#review-open').click();await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
    assert.equal(await page.locator('#palette-select option').count(),7);assert((await page.locator('#palette-status').innerText()).includes('Named texture swatches'));
    await page.locator('#palette-select').selectOption('texture:bug_palette:red');const original=await page.locator('#palette-color').inputValue();assert.equal(original.toLowerCase(),'#e51c30');
    await page.locator('#palette-color').fill('#ff9900');await page.locator('#palette-color').dispatchEvent('input');
    await page.locator('#copy-changes').click();let note=JSON.parse(await page.locator('#feedback-copy').inputValue());assert.equal(note.previewOnlyChanges.texturePalettes.bug_palette.red,'#ff9900');assert.equal(note.asset,'problem_bug');assert.equal(note.sha256.length,64);
    await page.locator('#palette-reset').click();assert.equal(await page.locator('#palette-color').inputValue(),original);
    await page.locator('summary').filter({hasText:'Inspect structure'}).click();await page.locator('#anchors-toggle').check();await page.locator('#skeleton-toggle').check();
    await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#phone-toggle').check();
    const canvas=await page.locator('#viewport').boundingBox();assert(canvas.width<=391);
    await page.locator('#feedback-note').fill('Check the front shoulder attachment at this view.');
    const download=page.waitForEvent('download');await page.locator('#capture-feedback').click();const shot=await download;assert(shot.suggestedFilename().endsWith('.png'));await shot.saveAs(path.join(output,shot.suggestedFilename()));
    await page.locator('#phone-toggle').uncheck();await page.locator('#anchors-toggle').uncheck();await page.locator('#skeleton-toggle').uncheck();
    await page.locator('#comparison-select').selectOption('towers/copilot_base_v01.glb');await page.locator('#compare-asset').click();await page.waitForFunction(()=>window.inspectorState().entries.length===2&&!window.inspectorState().loading);
    const state=await page.evaluate(()=>window.inspectorState());assert.equal(state.entries[1].path,'towers/copilot_base_v01.glb');
    await page.locator('#review-close').click();await page.screenshot({path:path.join(output,'registered-comparison.png')});
    await page.goto(url+'/?asset=copilot_base&version=v01');await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
    await page.locator('#review-open').click();await page.locator('summary').filter({hasText:'Palette · preview only'}).click();assert((await page.locator('#palette-status').innerText()).includes('No semantic role'));
    await page.locator('summary').filter({hasText:'Inspect structure'}).click();assert.equal(await page.locator('#part-select option').count(),3);await page.locator('#part-select').selectOption('0');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:'Catalog identities, hashes/budgets, semantic color IDs/reset/notes, loop contracts, structure overlays, phone width, screenshots, registered runtime comparison, static material fallback and mesh isolation',screenshots:output},null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
