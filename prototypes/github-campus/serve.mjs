import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {findAsset,existingPath} from '../../tools/asset-pipeline/contracts.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const plan=JSON.parse(await readFile(path.resolve(here,'../../tools/github-campus-kit/plan.json'),'utf8'));
const pages=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/layout.js','layout.js'],['/style.css','style.css']]);
const vendors=new Set(['three.module.js','three.core.js','GLTFLoader.js','BufferGeometryUtils.js']);
const assets=new Map(plan.assets.map(a=>[`/runtime/${a.id}.glb`,[a.id,plan.version]]));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.glb':'model/gltf-binary'};
export function createCampusServer(){return createServer(async(req,res)=>{try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}const url=new URL(req.url,'http://localhost');let file;
if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
if(url.pathname==='/kit.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(plan));return;}
if(pages.has(url.pathname))file=path.join(here,pages.get(url.pathname));
else if(url.pathname.startsWith('/vendor/')&&vendors.has(url.pathname.slice(8)))file=path.resolve(here,'../../tools/asset-inspector/vendor',url.pathname.slice(8));
else if(assets.has(url.pathname)){const item=await findAsset(...assets.get(url.pathname));file=await existingPath(item.data.runtime);}
else {res.writeHead(404).end('Not found');return;}const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(req.method==='HEAD'?undefined:bytes);
}catch(error){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8'}).end('The registered campus model is not yet available.');}});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.GITHUB_CAMPUS_PORT||5199);createCampusServer().listen(port,'127.0.0.1',()=>console.log(`GitHub campus: http://127.0.0.1:${port}/`));}
