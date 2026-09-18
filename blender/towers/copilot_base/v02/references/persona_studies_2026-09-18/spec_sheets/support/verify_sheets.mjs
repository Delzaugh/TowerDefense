import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ids=['base_copilot','developer','tester','analyst','security','architect','linter_agent'];
const output=[];
for(const id of ids){
  const file=path.join(root,`${id}_spec_v01.png`);
  const bytes=fs.readFileSync(file);
  const width=bytes.readUInt32BE(16), height=bytes.readUInt32BE(20);
  if(width!==1536 || height!==1024) throw new Error(`${id}: unexpected image size ${width}x${height}`);
  output.push({id,image:path.basename(file),width,height,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const name of ['README.md',...ids.map(id=>`${id}_spec.md`)]){
  const source=fs.readFileSync(path.join(root,name),'utf8');
  for(const match of source.matchAll(/\]\(([^)]+)\)/g)){
    const target=match[1];
    if(!target.startsWith('http') && !fs.existsSync(path.resolve(root,target))) throw new Error(`${name}: missing ${target}`);
  }
}
fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify({generatedAt:new Date().toISOString(),sheetCount:output.length,localLinks:'passed',images:output},null,2)+'\n');
console.log(JSON.stringify({sheetCount:output.length,size:'1536 x 1024',localLinks:'passed',totalBytes:output.reduce((n,x)=>n+x.bytes,0)}));
