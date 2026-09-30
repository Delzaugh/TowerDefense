import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {checkContainer} from '../../../../../tools/asset-pipeline/validate.mjs';
import {projectRoot} from '../../../../../tools/asset-pipeline/contracts.mjs';

const folder=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(folder,'asset.json'),'utf8'));
const before=await readFile(path.join(folder,'revisions/r3_before_r4/copilot_base_v02.glb'));
const after=await readFile(path.join(projectRoot,manifest.runtime));
const old=checkContainer(before),current=checkContainer(after);
function accessorData(bytes,g,index){
  const a=g.accessors[index],view=g.bufferViews[a.bufferView];
  const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
  const size={5121:1,5123:2,5125:4,5126:4}[a.componentType]*components;
  const start=28+bytes.readUInt32LE(12)+(view.byteOffset||0)+(a.byteOffset||0);
  const result=Buffer.alloc(size*a.count);
  for(let i=0;i<a.count;i++)bytes.copy(result,i*size,start+i*(view.byteStride||size),start+i*(view.byteStride||size)+size);
  return result;
}
assert.deepEqual(old.materials,current.materials,'Materials changed');
assert.deepEqual(old.samplers,current.samplers,'Sampler configuration changed');
assert.equal(old.meshes.length,current.meshes.length,'Mesh count changed');
let geometryAccessors=0;
for(let i=0;i<old.meshes.length;i++){
  assert.equal(old.meshes[i].primitives.length,current.meshes[i].primitives.length);
  for(let j=0;j<old.meshes[i].primitives.length;j++){
    const a=old.meshes[i].primitives[j],b=current.meshes[i].primitives[j];
    assert.equal(a.material,b.material);
    for(const key of ['indices',...Object.keys(a.attributes)]){
      const x=key==='indices'?a.indices:a.attributes[key],y=key==='indices'?b.indices:b.attributes[key];
      assert.notEqual(y,undefined,`Missing ${key}`);
      assert.deepEqual(accessorData(before,old,x),accessorData(after,current,y),`Rest ${key} changed on mesh ${i}`);
      geometryAccessors++;
    }
  }
}
assert.equal(old.images.length,current.images.length,'Image count changed');
for(let i=0;i<old.images.length;i++){
  const imageBytes=(bytes,g,img)=>{const v=g.bufferViews[img.bufferView],start=28+bytes.readUInt32LE(12)+(v.byteOffset||0);return bytes.subarray(start,start+v.byteLength);};
  assert.deepEqual(imageBytes(before,old,old.images[i]),imageBytes(after,current,current.images[i]),'Packed image changed');
}
for(const name of ['idle','work','hit']){
  const a=old.animations.find(c=>c.name===name),b=current.animations.find(c=>c.name===name);
  assert(a&&b,`Missing preserved ${name}`);
  assert.equal(a.channels.length,b.channels.length,`${name} channel count changed`);
  for(const channel of a.channels){
    const target=old.nodes[channel.target.node].name;
    const next=b.channels.find(c=>c.target.path===channel.target.path&&current.nodes[c.target.node].name===target);
    assert(next,`${name}: missing ${target}/${channel.target.path}`);
    const left=a.samplers[channel.sampler],right=b.samplers[next.sampler];
    assert.equal(left.interpolation,right.interpolation);
    for(const key of ['input','output'])assert.deepEqual(accessorData(before,old,left[key]),accessorData(after,current,right[key]),`${name}: ${target}/${channel.target.path}/${key} changed`);
  }
}
assert.deepEqual(current.nodes.find(n=>n.name==='root').extras.resolve_effect,manifest.presentation.resolve);
const result={passed:true,revision:manifest.revision,sourceHash:manifest.delivery.sourceHash,sha256:manifest.delivery.sha256,
  geometryAccessors,packedImages:old.images.length,preservedClips:['idle','work','hit'],newClips:['move','place','resolve'],effect:manifest.presentation.resolve};
await writeFile(path.join(folder,'validation/preservation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
