import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {findAsset,existingPath} from '../../tools/asset-pipeline/contracts.mjs';

export async function stressRevision(here,assets){
 const files=['app.js','performance.js','stress-config.js','stress-load.js','stress-test.js','stress-storage.mjs','serve.mjs','campus-layout.js','ambient.js','guests.js','companion.js','presentation.js','light-lines.js','index.html','style.css'];
 files.push(...['index.html','style.css','app.js','actors.js','map.js','config.js','schedule.js','capture.js','placement.js'].map(f=>'simulation/'+f));
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 const sourceHashes=Object.fromEntries(await Promise.all(files.map(async f=>[f,hash(await readFile(path.join(here,f)))])));
 sourceHashes['/presentation/digital-resolve.js']=hash(await readFile(path.resolve(here,'../../tools/asset-presentation/digital-resolve.js')));
 const runtimeAssets=await Promise.all([...assets].map(async([url,[id,version]])=>{
  const item=await findAsset(id,version),bytes=await readFile(await existingPath(item.data.runtime));
  return {url,id,version,path:item.data.runtime,bytes:bytes.length,sha256:hash(bytes)};
 }));
 return {capturedAt:new Date().toISOString(),sourceHashes,runtimeAssets};
}
export async function saveStressReport(req,res,here){
 // Only same-origin JSON from this local application; never accept a caller-supplied path.
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){res.writeHead(403).end();return;}
 if(!req.headers['content-type']?.startsWith('application/json')){res.writeHead(415).end();return;}
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>32*1024*1024){res.writeHead(413).end();return;}chunks.push(chunk);}
 let report;
 try{report=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{res.writeHead(400).end('Invalid JSON');return;}
 if(report?.schemaVersion!==1||!['completed','cancelled','failed'].includes(report.status)||!Array.isArray(report.cases)||report.cases.length>12){res.writeHead(400).end('Invalid report');return;}
 // Decode and validate every capture before making a report directory.
 const images=[];
 for(const [i,sample] of report.cases.entries()){
  if(typeof sample.screenshot!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(sample.screenshot)){res.writeHead(400).end('Invalid screenshot');return;}
  const bytes=Buffer.from(sample.screenshot.split(',')[1],'base64');
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'){res.writeHead(400).end('Invalid PNG');return;}
  const name=`sample-${String(i+1).padStart(2,'0')}.png`;images.push({name,bytes});sample.screenshot=name;
 }
 const folder=`${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`;
 const directory=path.join(here,'previews','stress',folder);await mkdir(directory,{recursive:true});
 await Promise.all(images.map(({name,bytes})=>writeFile(path.join(directory,name),bytes)));
 await writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2));
 res.writeHead(201,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({path:`prototypes/campus-3d/previews/stress/${folder}/report.json`,screenshots:images.length}));
}
