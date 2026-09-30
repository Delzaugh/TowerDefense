const fs=require('fs');
const f='assets/runtime/environment/campus_utility_decor_v01.glb',b=fs.readFileSync(f),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len)),bin=28+len;
const p=g.meshes[0].primitives[0],a=g.accessors[p.attributes.POSITION],v=g.bufferViews[a.bufferView],start=bin+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||12;
let edge=Infinity,route=Infinity,count=0;
for(let i=0;i<a.count;i++){
 const x=b.readFloatLE(start+i*stride),z=b.readFloatLE(start+i*stride+8);
 const c=Math.min(...Array.from({length:6},(_,k)=>18*Math.sqrt(3)/2-x*Math.cos(Math.PI/6+k*Math.PI/3)-z*Math.sin(Math.PI/6+k*Math.PI/3)));edge=Math.min(edge,c);
 route=Math.min(route,x< -1?-1-x:x>3?x-3:0);
 if(x>=-1&&x<=3)count++;
}
const result={asset:'campus_utility_decor',minimumHexEdgeClearance:edge,requiredQuietBand:1.4,minimumRouteShoulderClearance:route,verticesInsideCentralRouteShoulders:count,passed:edge>=1.4&&count===0};
fs.writeFileSync('blender/environment/campus_utility_decor/v01/validation/placement.json',JSON.stringify(result,null,2)+'\n');console.log(result);if(!result.passed)process.exitCode=1;
