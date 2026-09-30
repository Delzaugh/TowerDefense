import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {findAsset,existingPath} from '../../tools/asset-pipeline/contracts.mjs';
import {KIT_IDS} from './campus-layout.js';
import {stressRevision,saveStressReport} from './stress-storage.mjs';
import {STRESS_ASSETS} from './stress-config.js';
import {MODELS,DECOR_IDS as SIM_DECOR,STRUCTURE_IDS} from './simulation/config.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const vendor=path.resolve(here,'../../tools/asset-inspector/vendor');
export const pages=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/presentation.js','presentation.js'],['/companion.js','companion.js'],['/ambient.js','ambient.js'],['/light-lines.js','light-lines.js'],['/campus-layout.js','campus-layout.js'],['/style.css','style.css']]);
export const assets=new Map([['/runtime/campus_home_study.glb',['campus_home_study','v01']],['/runtime/copilot_base_v02.glb',['copilot_base','v02']]]);
for(const name of ['guests','performance','stress-load','stress-test','stress-config'])pages.set('/'+name+'.js',name+'.js');
for(const spec of STRESS_ASSETS)assets.set(spec.url,[spec.id,spec.version]);
for(const id of ['copilot_octocat_classic_lowpoly','problem_lag_spike'])assets.set(`/runtime/${id}.glb`,[id,'v01']);
for(const id of KIT_IDS)assets.set(`/runtime/${id}.glb`,[id,'v01']);
for(const name of ['app','actors','map','config','schedule','capture','placement'])pages.set(`/simulation/${name}.js`,`simulation/${name}.js`);
pages.set('/simulation/','simulation/index.html');pages.set('/simulation/style.css','simulation/style.css');
for(const spec of MODELS)assets.set(spec.url,[spec.id,spec.version]);
for(const id of [...SIM_DECOR,...STRUCTURE_IDS])assets.set(`/runtime/${id}.glb`,[id,'v01']);
export const vendors=new Set(['three.module.js','three.core.js','GLTFLoader.js','BufferGeometryUtils.js']);
export const sharedFiles=new Map([['/presentation/digital-resolve.js','tools/asset-presentation/digital-resolve.js']]);
export function createStudyServer(){return createServer(async(req,res)=>{
  try{
    if(req.method==='POST'&&new URL(req.url,'http://localhost').pathname==='/stress-report'){await saveStressReport(req,res,here);return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
    const pathname=new URL(req.url,'http://localhost').pathname;let file;
    if(pathname==='/stress-revision'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(await stressRevision(here,assets)));return;}
    if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
    if(pages.has(pathname))file=path.join(here,pages.get(pathname));
    else if(sharedFiles.has(pathname))file=path.resolve(here,'../..',sharedFiles.get(pathname));
    else if(pathname.startsWith('/vendor/')&&vendors.has(pathname.slice(8)))file=path.join(vendor,pathname.slice(8));
    else if(assets.has(pathname)){const item=await findAsset(...assets.get(pathname));file=await existingPath(item.data.runtime);}
    else{res.writeHead(404).end('Not found');return;}
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.glb':'model/gltf-binary'}[path.extname(file)],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){console.error(error.message);res.writeHead(500).end('Unable to load campus study');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.CAMPUS_STUDY_PORT||5187);createStudyServer().listen(port,'127.0.0.1',()=>console.log(`Campus study: http://127.0.0.1:${port}/`));}




