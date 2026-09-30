const fs=require('fs'),path=require('path');
const {chromium}=require(process.cwd()+'/game/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1400,height:1000}});
for(const id of ['campus_construction_decor','campus_tile_construction']){
 const dir=path.resolve('blender/environment/'+id+'/v01/validation');
 await page.goto('http://127.0.0.1:4175/?asset='+id+'&version=v01');
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('[data-view="iso"]').click();
 await page.locator('#viewport').screenshot({path:dir+'/inspector-iso.png'});
 const canvas=page.locator('#viewport'),b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+450,b.y+b.height*.5-50,{steps:30});await page.mouse.up();
 await page.locator('#viewport').screenshot({path:dir+'/inspector-reverse.png'});
 await page.locator('[data-view="iso"]').click();await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();
 await page.locator('#viewport').screenshot({path:dir+'/inspector-close.png'});
 await page.locator('[data-view="iso"]').click();
 await page.setViewportSize({width:390,height:844});
 await page.locator('#viewport').screenshot({path:dir+'/inspector-phone.png'});
 fs.writeFileSync(dir+'/inspector-state.json',JSON.stringify(await page.evaluate(()=>window.inspectorState()),null,2));
 await page.setViewportSize({width:1400,height:1000});
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

