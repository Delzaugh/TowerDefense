import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.env.HUB_PROTOTYPE_PORT||5186);
createServer(async(request,response)=>{
 try{
  const path=new URL(request.url,'http://localhost').pathname;
  if(path==='/favicon.ico'){response.writeHead(204).end();return}
  if(path==='/v05/02-glacier.html'||path==='/glacier.html'){response.writeHead(302,{Location:'/', 'Cache-Control':'no-store'}).end();return}
  if(path!=='/'&&path!=='/index.html'){response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return}
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  response.end(await readFile(new URL('./index.html',import.meta.url)));
 }catch{response.writeHead(500).end('Unable to load Glacier')}
}).listen(port,'127.0.0.1',()=>console.log(`Glacier: http://127.0.0.1:${port}`));
