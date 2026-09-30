import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');const rows=JSON.parse(await fs.readFile(path.join(root,'image-index.json'),'utf8'));
let targets=[];
const artist=JSON.parse(await fs.readFile(path.join(root,'work','thinktocat-images.json'),'utf8'));
for(const u of artist.images.filter(u=>u.startsWith('https://images.squarespace-cdn.com/')&&!u.includes('?')&&!u.includes('06_news')))targets.push({url:u,group:'thinktocat',page:artist.url,credit:'Tony Jaramillo; artist portfolio'});
const raw=await fs.readFile(path.join(root,'work','wired-tour.html'),'utf8');const t=raw.replace(/&quot;/g,'"').replace(/&amp;/g,'&');
const wired=[...new Set([...t.matchAll(/https:\/\/media\.wired\.com\/photos\/[a-z0-9]+\/(?:master|3:2)\/[^\s"'<>]+\/20130925-GITHUB-NEW-OFFICE-[\w]+\.jpg/gi)].map(m=>m[0]))];
const keys=new Map();for(const u of wired){const m=u.match(/photos\/([^/]+)\//);if(!keys.has(m[1]))keys.set(m[1],u);}
for(const u of keys.values())targets.push({url:u,group:'wired-tour',page:'https://www.wired.com/2013/09/github-office/',credit:'Ariel Zambelich / WIRED'});
for(const[group]of [['thinktocat'],['wired-tour']]){let i=0;for(const row of targets.filter(r=>r.group===group)){
 row.id=group+'-'+String(++i).padStart(2,'0');try{const r=await fetch(row.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status);const b=Buffer.from(await r.arrayBuffer());row.file='images/'+row.id+path.extname(new URL(row.url).pathname);row.status='downloaded';row.bytes=b.length;row.sha256=crypto.createHash('sha256').update(b).digest('hex');await fs.writeFile(path.join(root,row.file),b);rows.push(row);console.log(row.id+' saved');}catch(e){console.log(row.id+' '+String(e));}
}}
await fs.writeFile(path.join(root,'image-index.json'),JSON.stringify(rows.sort((a,b)=>a.id.localeCompare(b.id)),null,2));
