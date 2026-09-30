const {chromium}=require('C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(path.join(root,'report.html')).href);await page.locator('header').screenshot({path:path.join(root,'work','report-overview.png')});
 const initial=await page.locator('.photo').count();await page.locator('#search').fill('container');const containerCount=await page.locator('.photo').count();if(containerCount<2)throw Error('container filter failed');
 await page.locator('.photo').first().click();if(!await page.locator('dialog').isVisible())throw Error('dialog failed');const modalSrc=await page.locator('dialog img').getAttribute('src');await page.locator('.close').click();
 await page.locator('#search').fill('');await page.locator('#group').selectOption('atrium');const atriumCount=await page.locator('.photo').count();if(atriumCount!==9)throw Error('atrium filter failed');await page.locator('#gallery').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'work','report-gallery.png')});
 await page.setViewportSize({width:390,height:844});await page.goto(pathToFileURL(path.join(root,'report.html')).href);await page.screenshot({path:path.join(root,'work','report-mobile.png')});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('mobile horizontal overflow');
 const rows=JSON.parse(fs.readFileSync(path.join(root,'image-index.json')));const missing=rows.filter(r=>!fs.existsSync(path.join(root,r.file)));if(missing.length)throw Error('missing images');
 const anchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)));if(anchors.length)throw Error('missing anchors');
 const result={passed:errors.length===0,initialGalleryCount:initial,totalImageFiles:rows.length,containerCount,atriumCount,modalSrc,mobileOverflow:overflow,missingLocalImages:missing.length,missingAnchors:anchors,errors};fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
