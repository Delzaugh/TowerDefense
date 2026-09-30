const fs=require('node:fs');const path=require('node:path');
const base=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(base,'asset.json'),'utf8'));
const bytes=fs.readFileSync(path.resolve(base,'../../../..',manifest.runtime));
const jsonLength=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jsonLength).toString()),binaryStart=28+jsonLength;
function values(index){const a=g.accessors[index],v=g.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type];if(a.componentType!==5126)throw Error('Expected FLOAT animation data');const out=[];for(let i=0;i<a.count;i++)for(let j=0;j<n;j++)out.push(bytes.readFloatLE(binaryStart+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||n*4)+j*4));return {out,n};}
const clips=[];let passed=true;
for(const clip of g.animations){let maxEndpointDelta=0,maxRestDelta=0,maxMotion=0,baseMotion=0;const changing=[];
 for(const channel of clip.channels){const node=g.nodes[channel.target.node],property=channel.target.path,{out,n}=values(clip.samplers[channel.sampler].output),first=out.slice(0,n),last=out.slice(-n),rest=node[property]||({translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]}[property]);
  const diff=(a,b)=>{const sign=property==='rotation'&&a.reduce((s,x,i)=>s+x*b[i],0)<0?-1:1;return Math.max(...a.map((x,i)=>Math.abs(x-sign*b[i])));};
  maxEndpointDelta=Math.max(maxEndpointDelta,diff(first,last));maxRestDelta=Math.max(maxRestDelta,diff(first,rest));let range=0;for(let k=0;k<out.length;k+=n)range=Math.max(range,diff(first,out.slice(k,k+n)));maxMotion=Math.max(maxMotion,range);if(range>.001)changing.push(node.name+'/'+property);if(node.name==='base'||node.name==='root')baseMotion=Math.max(baseMotion,range);
 }
 const requiresRestStart=clip.name!=='move';
 const ok=maxEndpointDelta<.002&&(!requiresRestStart||maxRestDelta<.002)&&maxMotion>.005&&baseMotion<.00001;passed&&=ok;clips.push({name:clip.name,passed:ok,requiresRestStart,maxEndpointDelta,maxRestDelta,maxMotion,baseMotion,changing});
}
const result={sha256:manifest.delivery.sha256,revision:manifest.revision,passed,clips};fs.writeFileSync(path.join(base,'validation','clip-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!passed)process.exitCode=1;
