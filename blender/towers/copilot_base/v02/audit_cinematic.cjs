const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const project=path.resolve(__dirname,'../../../..');
const cast=[['copilot_base','v02','towers'],['copilot_octocat_classic_lowpoly','v01','towers'],['problem_bug','v01','enemies']];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function load(file){const raw=fs.readFileSync(file),len=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+len)),bin=raw.subarray(28+len);return {json,bin};}
function acc(g,i){const a=g.json.accessors[i],v=g.json.bufferViews[a.bufferView];return {type:a.type,count:a.count,componentType:a.componentType,normalized:a.normalized||false,bytes:hash(g.bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength))};}
function varies(g,i){const a=g.json.accessors[i],v=g.json.bufferViews[a.bufferView],sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},n=sizes[a.type],start=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||n*4;if(a.componentType!==5126)return false;for(let j=1;j<a.count;j++)for(let k=0;k<n;k++)if(Math.abs(g.bin.readFloatLE(start+j*stride+k*4)-g.bin.readFloatLE(start+k*4))>1e-5)return true;return false;}
function geometry(g){return g.json.meshes.map(m=>m.primitives.map(p=>({mode:p.mode||4,attributes:Object.fromEntries(Object.entries(p.attributes).map(([n,i])=>[n,acc(g,i)])),indices:acc(g,p.indices)})));}
function animation(g,a){return a.channels.map(c=>({node:g.json.nodes[c.target.node].name,path:c.target.path,interpolation:a.samplers[c.sampler].interpolation,input:acc(g,a.samplers[c.sampler].input),output:acc(g,a.samplers[c.sampler].output)}));}
for(const [id,version,category] of cast){
 const folder=path.join(project,'blender',category,id,version),m=JSON.parse(fs.readFileSync(path.join(folder,'asset.json'))),base=m.milestones.find(x=>x.label==='cinematic_model_baseline');
 const before=load(path.join(project,base.export)),after=load(path.join(project,m.runtime));
 const result={sourceHash:m.delivery.sourceHash,exportHash:m.delivery.sha256,baselineExportHash:base.sha256,geometryByteIdentical:JSON.stringify(geometry(before))===JSON.stringify(geometry(after)),materialsByteIdentical:JSON.stringify(before.json.materials)===JSON.stringify(after.json.materials),preservedClips:{},newClips:[]};
 for(const a of before.json.animations||[]){const b=after.json.animations.find(x=>x.name===a.name);result.preservedClips[a.name]=JSON.stringify(animation(before,a))===JSON.stringify(animation(after,b));}
 for(const a of after.json.animations.filter(x=>x.name.startsWith('story_'))){let varying=0;for(const s of a.samplers)if(varies(after,s.output))varying++;result.newClips.push({name:a.name,channels:a.channels.length,varyingChannels:varying});}
 result.passed=result.geometryByteIdentical&&result.materialsByteIdentical&&Object.values(result.preservedClips).every(Boolean);
 fs.writeFileSync(path.join(folder,'validation/cinematic_preservation.json'),JSON.stringify(result,null,2));console.log(id,JSON.stringify(result));
}
