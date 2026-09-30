const fs=require('node:fs/promises');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1400,height:1000}});
const folder=path.join(__dirname,'validation/contour-evaluation-r45');
await page.setContent('<style>body{margin:0}</style>'+await fs.readFile(path.join(folder,'vertical-contours.svg'),'utf8'));
await page.screenshot({path:path.join(folder,'vertical-contours.png')});
}finally{await browser.close();}})();
