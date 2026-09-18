import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { projectRoot, hash } from './contracts.mjs';

export function checkContainer(bytes) {
  if(bytes.length<20 || bytes.readUInt32LE(0)!==0x46546c67 || bytes.readUInt32LE(4)!==2 || bytes.readUInt32LE(8)!==bytes.length || bytes.readUInt32LE(16)!==0x4e4f534a) throw Error('Invalid GLB 2 container');
  const length=bytes.readUInt32LE(12), g=JSON.parse(bytes.subarray(20,20+length).toString());
  if(g.asset?.version!=='2.0') throw Error('Expected glTF 2.0');
  if((g.buffers||[]).some(b=>b.uri) || (g.images||[]).some(i=>i.uri || i.bufferView===undefined)) throw Error('GLB must embed all buffers and images');
  if(g.cameras?.length || g.extensions?.KHR_lights_punctual) throw Error('Studio camera/light exported');
  const reachable=new Set();function visit(i){if(reachable.has(i))return;reachable.add(i);for(const c of g.nodes[i].children||[])visit(c);}
  for(const i of g.scenes?.[g.scene||0]?.nodes || [])visit(i);
  if(reachable.size!==(g.nodes||[]).length) throw Error('Unused nodes in GLB');
  const meshes=new Set([...reachable].map(i=>g.nodes[i].mesh).filter(i=>i!==undefined));
  if(meshes.size!==(g.meshes||[]).length) throw Error('Unused meshes in GLB');
  const materials=new Set();for(const mesh of g.meshes||[])for(const p of mesh.primitives){if((p.mode??4)!==4)throw Error('Expected triangle primitives');if(p.material!==undefined)materials.add(p.material);}
  if(materials.size!==(g.materials||[]).length)throw Error('Unused materials in GLB');
  return g;
}
export async function validateExport(file, manifest, output) {
  await mkdir(output,{recursive:true});
  const bytes=await readFile(file), report={asset:manifest.id,version:manifest.version,revision:manifest.revision,sha256:hash(bytes),checkedAt:new Date().toISOString(),errors:[],warnings:[]};
  let server,browser;
  try {
    checkContainer(bytes);
    server=http.createServer(async(req,res)=>{
      try {
        const pathname=new URL(req.url,'http://localhost').pathname;
        if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0}</style><link rel="icon" href="data:,"><script type="importmap">{"imports":{"three":"/vendor/three.module.js","../utils/BufferGeometryUtils.js":"/vendor/BufferGeometryUtils.js"}}</script>');return;}
        if(pathname==='/candidate.glb'){res.end(bytes);return;}
        const vendor=/^\/vendor\/([a-zA-Z0-9_.]+\.js)$/.exec(pathname);
        const source=vendor ? path.join(projectRoot,'tools/asset-inspector/vendor',vendor[1]) : pathname==='/check.js' ? path.join(projectRoot,'tools/asset-pipeline/browser-check.js') : pathname==='/review.js' ? path.join(projectRoot,'tools/asset-inspector/review.js') : null;
        if(!source){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/javascript');res.end(await readFile(source));
      }catch{res.writeHead(404);res.end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const require=createRequire(import.meta.url), modulePath=process.env.PLAYWRIGHT_MODULE_PATH || require.resolve('playwright',{paths:[projectRoot,path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]});
    const {chromium}=require(modulePath);browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:900,height:800}}), consoleErrors=[], consoleWarnings=[];
    page.on('pageerror',e=>consoleErrors.push(e.message));page.on('console',m=>{if(m.type()==='warning')consoleWarnings.push(m.text());if(m.type()==='error')consoleErrors.push(m.text());});
    await page.goto('http://127.0.0.1:'+server.address().port);
    const measured=await page.evaluate(async m=>(await import('/check.js')).inspect('/candidate.glb',m),manifest);Object.assign(report,measured);
    for(const view of ['iso','front','side','rear','top']){await page.evaluate(v=>window.renderEvidence(v),view);await page.screenshot({path:path.join(output,view+'.png')});}
    for(const clip of manifest.clips){await page.evaluate(n=>window.renderEvidence('iso',n,.5),clip.name);await page.screenshot({path:path.join(output,clip.name+'.png')});}
    report.errors.push(...consoleErrors);report.warnings.push(...consoleWarnings);
    if(consoleWarnings.length)report.errors.push('Three.js emitted warnings; review before promotion');
  }catch(e){report.errors.push(e.message);}
  finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));}
  report.passed=report.errors.length===0;
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
