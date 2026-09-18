import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog, hash, existingPath, projectRoot } from '../asset-pipeline/contracts.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const runtimeRoot=path.join(projectRoot,'assets/runtime');
const types={'.glb':'model/gltf-binary','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
async function sendFile(response,root,relative){
  const allowed=await realpath(root),file=await realpath(path.resolve(root,relative));
  if(!file.startsWith(allowed+path.sep)){response.writeHead(403);response.end('Forbidden');return;}
  response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  response.end(await readFile(file));
}
export function createInspectorServer(){
  return http.createServer(async(request,response)=>{
    try{
      if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
      const url=new URL(request.url,'http://localhost'),relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if(relative.split('/').includes('..') || relative.includes('\\')){response.writeHead(403);response.end('Forbidden');return;}
      if(relative==='api/health'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({service:'tower-asset-inspector',protocol:4,workspace:hash(Buffer.from(projectRoot))}));return;}
      if(relative==='api/models'){
        const files=await Promise.all((await catalog()).map(async({data:m})=>{
          let bytes;
          try{bytes=await readFile(await existingPath(m.runtime));}
          catch(error){if(error.code==='ENOENT'&&!m.delivery)return null;throw error;}
          const sha256=hash(bytes);
          return {path:m.runtime.slice('assets/runtime/'.length),bytes:bytes.length,revision:sha256,sha256,contract:m};
        }));
        response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(files.filter(Boolean)));return;
      }
      if(relative.startsWith('runtime/') && relative.endsWith('.glb')){
        const item=(await catalog()).find(a=>a.data.runtime==='assets/'+relative);
        if(!item){response.writeHead(404);response.end('Unregistered runtime asset');return;}
        await existingPath(item.data.runtime);await sendFile(response,runtimeRoot,relative.slice(8));return;
      }
      if(/^vendor\/[a-zA-Z0-9_.]+\.js$/.test(relative)){await sendFile(response,path.join(here,'vendor'),relative.slice(7));return;}
      if(['','index.html','viewer.js','review.js','export-bambu.js','style.css'].includes(relative)){await sendFile(response,here,relative||'index.html');return;}
      response.writeHead(404);response.end('Not found');
    }catch(error){
      const status=error instanceof URIError?400:['ENOENT','ENOTDIR','EISDIR'].includes(error.code)?404:500;
      response.writeHead(status);response.end(status===404?'Not found':'Unable to serve request');
    }
  });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const explicitPort=process.env.PORT!==undefined;let port=Number(process.env.PORT??4174);const server=createInspectorServer();
  server.on('error',error=>{if(error.code==='EADDRINUSE'&&!explicitPort&&port<4184){server.listen(++port,'127.0.0.1');return;}console.error('Could not start Asset Inspector: '+error.message);process.exitCode=1;});
  server.on('listening',()=>console.log('Asset Inspector: http://127.0.0.1:'+server.address().port));server.listen(port,'127.0.0.1');
}
