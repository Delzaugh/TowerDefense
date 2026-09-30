import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const rules={
 'original-architect':u=>/\/2014\/07\/.*(?:github|gh-hq)/i.test(u),
 'rapt-expansion':u=>/\/2018\/03\//.test(u)&&!/-\d+x\d+\./.test(u),
 'expansion-contractor':u=>/\/github_.*\.jpg$/i.test(u)&&!/-\d+x\d+\./.test(u),
 'furniture':u=>/\/1997\/09\//.test(u),
 'roof-furniture':u=>/Github_/i.test(u),
 'atrium':u=>u.startsWith('https://interiorarchitects.com/')&&/GitHub-San-Francisco-Atrium/i.test(u),
 'boulder':u=>u.includes('4097ce38')&&!u.includes('?')
};
let rows=[];
for(const[id,rule]of Object.entries(rules)){
 const data=JSON.parse(await fs.readFile(path.join(root,'work',id+'-images.json'),'utf8'));
 const urls=[...new Set(data.images.filter(rule).map(u=>{const p=new URL(u);return id==='roof-furniture'?'https://concreteworks.com'+p.pathname:p.origin+p.pathname;}))];
 for(const[urlIndex,url]of urls.entries())rows.push({id:`${id}-${String(urlIndex+1).padStart(2,'0')}`,group:id,page:data.url,url,credit:id==='original-architect'?'Eva Kolenko / FENNIE+MEHL':id==='rapt-expansion'||id==='expansion-contractor'?'Jasper Sanidad / Rapt Studio / SC Builders':id==='furniture'?'Eva Kolenko and Terrance Williams / MASHstudios':id==='boulder'?'GitHub':id==='atrium'?'IA Interior Architects; photographer not stated': 'Concreteworks; photographer not stated'});
}
rows.push({id:'amsterdam-mural-01',group:'amsterdam-mural',page:'https://sasj.nl/portfolio/tesselatedplots/',url:'https://sasj.nl/images/mural/TesselatedPlots_01.png',credit:'Sasj, artist portfolio'});
rows.push({id:'amsterdam-mural-02',group:'amsterdam-mural',page:'https://sasj.nl/portfolio/tesselatedplots/',url:'https://sasj.nl/images/mural/TesselatedPlots_03.png',credit:'Sasj, artist portfolio'});
rows.push({id:'exterior-01',group:'exterior',page:'https://json-schema.org/blog/posts/github-case-study',url:'https://json-schema.org/img/posts/2023/github-case-study/building.webp',credit:'JSON Schema case study; photographer not stated'});
const results=[];
for(let i=0;i<rows.length;i+=5){await Promise.allSettled(rows.slice(i,i+5).map(async row=>{
 try{const r=await fetch(row.url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());const ext=path.extname(new URL(row.url).pathname);row.file='images/'+row.id+ext;await fs.writeFile(path.join(root,row.file),b);row.bytes=b.length;row.sha256=crypto.createHash('sha256').update(b).digest('hex');row.status='downloaded';}catch(e){row.status='failed';row.error=String(e);}results.push(row);console.log(row.id+' '+row.status);
}));}
await fs.writeFile(path.join(root,'image-index.json'),JSON.stringify(results.sort((a,b)=>a.id.localeCompare(b.id)),null,2));
for(const[name,url]of [['south-end-historic-2008.pdf','https://sfplanninggis.org/docs/NatRegDistricts/2008-06-26_Final-NR-SouthEndHistDist.pdf']]){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(r.status);await fs.writeFile(path.join(root,'documents',name),Buffer.from(await r.arrayBuffer()));console.log(name+' saved');}
