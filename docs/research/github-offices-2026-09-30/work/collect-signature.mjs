import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
for(const[id,url]of [['thinktocat','https://www.tonytimetables.com/thinktocat'],['wired-tour','https://www.wired.com/2013/09/github-office/']]){
 const r=await fetch(url,{signal:AbortSignal.timeout(45000)});const t=await r.text();await fs.writeFile(path.join(root,'work',id+'.html'),t);
 const urls=[...new Set([...t.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi)].map(m=>m[0].replace(/&amp;/g,'&')))];
 console.log(JSON.stringify({id,status:r.status,images:urls.slice(0,35)}));
 await fs.writeFile(path.join(root,'work',id+'-images.json'),JSON.stringify({id,url,images:urls},null,2));
}
const data=JSON.parse(await fs.readFile(path.join(root,'work','original-gallery-images.json'),'utf8'));
const urls=data.images.filter(u=>/^https:\/\/officesnapshots.com\/wp-content\/uploads\/2015\/04\/github-office-design-\d+\.jpg$/.test(u));
const rows=JSON.parse(await fs.readFile(path.join(root,'image-index.json'),'utf8'));
for(let i=0;i<urls.length;i++){
 const url=urls[i],id='original-gallery-'+url.match(/design-(\d+)\./)[1].padStart(2,'0');
 try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status);const b=Buffer.from(await r.arrayBuffer());const row={id,group:'original-gallery',page:data.url,url,credit:'Eva Kolenko / FENNIE+MEHL and Studio Hatch / Office Snapshots',status:'downloaded',file:'images/'+id+'.jpg',bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};await fs.writeFile(path.join(root,row.file),b);rows.push(row);console.log(id+' saved');}catch(e){console.log(id+' '+String(e));}
}
await fs.writeFile(path.join(root,'image-index.json'),JSON.stringify(rows.sort((a,b)=>a.id.localeCompare(b.id)),null,2));
