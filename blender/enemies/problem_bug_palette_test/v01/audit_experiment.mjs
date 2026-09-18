import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {PNG}=require(require.resolve('pngjs',{paths:[process.env.PLAYWRIGHT_MODULE_PATH ? path.dirname(process.env.PLAYWRIGHT_MODULE_PATH) : process.cwd()]}));
const folder=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(folder,'../../../..');
const config=JSON.parse(fs.readFileSync(path.join(folder,'experiment.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function read(id){const bytes=fs.readFileSync(path.join(project,'assets/runtime/enemies/'+id+'_v01.glb')),len=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+len)),bin=bytes.subarray(28+len);return {bytes,g,bin};}
const a=read('problem_bug'),b=read('problem_bug_palette_test');
assert.equal(sha(a.bytes),config.baseline.runtimeHash);
const baselineManifest=JSON.parse(fs.readFileSync(path.join(project,config.baseline.manifest)));
assert.equal(sha(fs.readFileSync(path.join(project,baselineManifest.source.path))),config.baseline.sourceHash);
function accessor(asset,index){
  const a=asset.g.accessors[index],v=asset.g.bufferViews[a.bufferView],sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},bytes={5121:1,5123:2,5125:4,5126:4};
  const width=sizes[a.type]*bytes[a.componentType],out=Buffer.alloc(width*a.count),start=(v.byteOffset||0)+(a.byteOffset||0);
  for(let i=0;i<a.count;i++)asset.bin.copy(out,i*width,start+i*(v.byteStride||width),start+i*(v.byteStride||width)+width);
  return out;
}
const pa=a.g.meshes[0].primitives[0],pb=b.g.meshes[0].primitives[0];
const invariantAttributes=['POSITION','NORMAL','JOINTS_0','WEIGHTS_0','_PALETTE_ROLE'];
for(const n of invariantAttributes)assert.deepEqual(accessor(a,pa.attributes[n]),accessor(b,pb.attributes[n]),n+' changed');
assert.deepEqual(accessor(a,pa.indices),accessor(b,pb.indices),'Triangle indices changed');
assert.deepEqual(a.g.skins.map(s=>({...s,inverseBindMatrices:undefined})),b.g.skins.map(s=>({...s,inverseBindMatrices:undefined})));
a.g.skins.forEach((s,i)=>assert.deepEqual(accessor(a,s.inverseBindMatrices),accessor(b,b.g.skins[i].inverseBindMatrices)));
const withoutIdentity=nodes=>nodes.map(n=>{const copy=structuredClone(n);if(copy.name==='root')delete copy.extras;return copy;});
assert.deepEqual(withoutIdentity(a.g.nodes),withoutIdentity(b.g.nodes),'Nodes/anchors/rest transforms changed');
assert.equal(a.g.animations.length,b.g.animations.length);
for(const aa of a.g.animations){
  const bb=b.g.animations.find(x=>x.name===aa.name);assert(bb);assert.deepEqual(aa.channels,bb.channels);
  assert.equal(aa.samplers.length,bb.samplers.length);
  aa.samplers.forEach((s,i)=>{assert.equal(s.interpolation,bb.samplers[i].interpolation);for(const key of ['input','output'])assert.deepEqual(accessor(a,s[key]),accessor(b,bb.samplers[i][key]),aa.name+'/'+key);});
}
const bm=structuredClone(b.g.materials);delete bm[0].pbrMetallicRoughness.baseColorTexture;
assert.deepEqual(a.g.materials,bm,'Surface settings changed');
assert(pa.attributes.COLOR_0!==undefined && pa.attributes.TEXCOORD_0===undefined);
assert(pb.attributes.COLOR_0===undefined && pb.attributes.TEXCOORD_0!==undefined);
assert.equal(b.g.images.length,1);assert.equal(b.g.textures.length,1);
assert(b.g.samplers.every(s=>s.minFilter===9729&&s.magFilter===9729));
const iv=b.g.bufferViews[b.g.images[0].bufferView],pngBytes=b.bin.subarray(iv.byteOffset||0,(iv.byteOffset||0)+iv.byteLength),png=PNG.sync.read(pngBytes);
assert.deepEqual([png.width,png.height],config.size);
const uv=accessor(b,pb.attributes.TEXCOORD_0),roles=accessor(b,pb.attributes._PALETTE_ROLE),colors=accessor(a,pa.attributes.COLOR_0),mapping=b.g.nodes.find(n=>n.mesh!==undefined).extras.palette_roles.roles;
const byId=Object.fromEntries(Object.entries(mapping).map(([name,id])=>[id,name]));
const linear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
let maxColorError=0;
for(let i=0;i<roles.length/4;i++){
  const role=byId[roles.readFloatLE(i*4)],u=uv.readFloatLE(i*8),v=uv.readFloatLE(i*8+4);
  assert.deepEqual([u,v],config.uvCenters[role]);
  const offset=(Math.floor((1-v)*png.height)*png.width+Math.floor(u*png.width))*4;
  const expected=Buffer.from(config.palette[role].slice(1),'hex');
  for(let c=0;c<3;c++){assert.equal(png.data[offset+c],expected[c]);maxColorError=Math.max(maxColorError,Math.abs(linear(png.data[offset+c]/255)-colors.readFloatLE(i*12+c*4)));}
}
assert(maxColorError<1e-6);
const pairs=[];
for(const name of ['iso','front','side','rear','top','move','hit','resolve']){
  const oldPath=path.join(project,'blender/enemies/problem_bug/v01/validation',name+'.png'),newPath=path.join(folder,'validation',name+'.png');
  const aa=PNG.sync.read(fs.readFileSync(oldPath)),bb=PNG.sync.read(fs.readFileSync(newPath));assert.equal(aa.width,bb.width);assert.equal(aa.height,bb.height);
  let max=0,total=0,changed=0;
  for(let i=0;i<aa.data.length;i+=4){let different=false;for(let c=0;c<3;c++){const delta=Math.abs(aa.data[i+c]-bb.data[i+c]);max=Math.max(max,delta);total+=delta;different ||= delta!==0;}changed+=different?1:0;}
  pairs.push({view:name,maxChannelDifference:max,meanChannelDifference:total/(aa.width*aa.height*3),changedPixelPercent:100*changed/(aa.width*aa.height)});
}
function buffers(asset){const p=asset.g.meshes[0].primitives[0];return Object.fromEntries(Object.entries(p.attributes).map(([n,i])=>[n,accessor(asset,i).length]));}
const report={passed:true,baselineHash:sha(a.bytes),candidateHash:sha(b.bytes),
  invariants:'Identical triangle indices, positions, normals, skin weights/indices, bone binds, anchors/transforms and all animation channel/time/value bytes.',
  maxLinearColorError:maxColorError,paletteImage:{width:png.width,height:png.height,encodedBytes:pngBytes.length,rgba8BaseLevelBytes:png.width*png.height*4},
  baseline:{glbBytes:a.bytes.length,attributeBytes:buffers(a)},candidate:{glbBytes:b.bytes.length,attributeBytes:buffers(b)},
  savedBytes:a.bytes.length-b.bytes.length,savedPercent:100*(a.bytes.length-b.bytes.length)/a.bytes.length,
  matchedPipelineViews:pairs};
fs.writeFileSync(path.join(folder,'validation/experiment_audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
