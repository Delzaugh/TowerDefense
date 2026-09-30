import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
function readGlb(b){const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),bin=28+b.readUInt32LE(12);return {g,b,bin};}
function accessor(glb,index){const {g,b,bin}=glb,a=g.accessors[index],v=g.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],read={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType],offset=bin+(v.byteOffset||0)+(a.byteOffset||0);return Array.from({length:a.count},(_,i)=>Array.from({length:n},(_,j)=>b[read](offset+i*(v.byteStride||n*size)+j*size)));}
function restGeometry(glb){const result={};for(const node of glb.g.nodes){if(node.mesh===undefined)continue;const mesh=glb.g.meshes[node.mesh];result[node.name]=mesh.primitives.map(p=>{const attrs=['POSITION','NORMAL','TEXCOORD_0'].map(n=>accessor(glb,p.attributes[n]));return attrs[0].map((_,i)=>attrs.flatMap(a=>a[i]));});}return result;}
const records=[];
for(const [id,rev] of [['copilot_octocat_2_0',8],['copilot_octocat_2_0_lowpoly',5]]){
 const folder='blender/towers/'+id+'/v01',m=JSON.parse(await fs.readFile(folder+'/asset.json'));
 const before=readGlb(await fs.readFile(folder+'/revisions/r'+rev+'_before_mona_animation/'+id+'_v01.glb')),after=readGlb(await fs.readFile(m.runtime));
 const a=restGeometry(before),b=restGeometry(after),differences={};assert.deepEqual(Object.keys(b).sort(),Object.keys(a).sort());
 for(const name of Object.keys(a)){
  assert.equal(a[name].length,b[name].length);let maxima=Array(8).fill(0);
  for(let i=0;i<a[name].length;i++){
   const bins=new Map();for(const row of a[name][i]){const key=row.map(x=>Math.round(x*1e3)).join(',');if(!bins.has(key))bins.set(key,[]);bins.get(key).push(row);}
   assert.equal(a[name][i].length,b[name][i].length,name+' vertex count');
   for(const row of b[name][i]){
    const key=row.map(x=>Math.round(x*1e3)).join(','),candidates=bins.get(key);assert(candidates?.length,name+' changed vertex');
    let best=0,score=Infinity;for(let k=0;k<candidates.length;k++){const d=Math.max(...row.map((x,j)=>Math.abs(x-candidates[k][j])));if(d<score){score=d;best=k;}}
    const [original]=candidates.splice(best,1);for(let j=0;j<8;j++)maxima[j]=Math.max(maxima[j],Math.abs(row[j]-original[j]));
   }
  }
  differences[name]={position:Math.max(...maxima.slice(0,3)),normal:Math.max(...maxima.slice(3,6)),uv:Math.max(...maxima.slice(6))};
  assert(maxima.slice(0,3).every(x=>x<1e-6)&&maxima.slice(3,6).every(x=>x<1e-4)&&maxima.slice(6).every(x=>x<1e-6),name+' changed rest attributes: '+JSON.stringify(differences[name]));
 }
 const images=g=>g.g.images.map(i=>{const v=g.g.bufferViews[i.bufferView];return crypto.createHash('sha256').update(g.b.subarray(g.bin+(v.byteOffset||0),g.bin+(v.byteOffset||0)+v.byteLength)).digest('hex');});
 assert.deepEqual(images(after),images(before));assert.deepEqual(after.g.materials,before.g.materials);
 const audit=JSON.parse(await fs.readFile(folder+'/animation_authoring_audit.json'));
 let contactDeviation=0;for(const s of audit.contactSamples)for(const [n,z] of Object.entries(s.floor))contactDeviation=Math.max(contactDeviation,Math.abs(z-s.expectedLift[n]));assert(contactDeviation<.001);
 const record={passed:true,asset:id,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,baselineRevision:rev,restAttributeMaximumDifferences:differences,embeddedImageHashes:images(after),materialsEqual:true,maxContactDeviationMetres:contactDeviation};records.push(record);
 await fs.writeFile(folder+'/validation/animation_rest_audit.json',JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify(records.map(({asset,revision,maxContactDeviationMetres})=>({asset,revision,maxContactDeviationMetres,passed:true}))));
