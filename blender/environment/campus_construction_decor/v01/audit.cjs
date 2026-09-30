const fs=require('fs'),crypto=require('crypto');
const base='blender/environment/campus_construction_decor/v01/';
const bytes=fs.readFileSync('assets/runtime/environment/campus_construction_decor_v01.glb');
const length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length)),bin=20+length+8;
function values(i){const a=g.accessors[i],v=g.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5126:4,5125:4,5123:2}[a.componentType],stride=v.byteStride||n*size;return Array.from({length:a.count},(_,j)=>Array.from({length:n},(_,k)=>{const o=bin+(v.byteOffset||0)+(a.byteOffset||0)+j*stride+k*size;return a.componentType===5126?bytes.readFloatLE(o):a.componentType===5125?bytes.readUInt32LE(o):bytes.readUInt16LE(o)}));}
const prim=g.meshes[0].primitives[0],positions=values(prim.attributes.POSITION),indices=values(prim.indices).flat();
const clearance=Math.min(...positions.map(([x,y,z])=>Math.min(...Array.from({length:6},(_,i)=>18*Math.sqrt(3)/2-x*Math.cos(Math.PI/6+i*Math.PI/3)-z*Math.sin(Math.PI/6+i*Math.PI/3)))));
const zones=[{name:'promenade',x:[2.2,5.8],z:[-15.588457268,6.3]},{name:'landing',x:[1.6,6.4],z:[2.6,6.3]}];
const collisions=[];
for(let i=0;i<indices.length;i+=3){const v=indices.slice(i,i+3).map(i=>positions[i]),xs=v.map(v=>v[0]),zs=v.map(v=>v[2]);for(const zone of zones){if(Math.max(...xs)>zone.x[0]&&Math.min(...xs)<zone.x[1]&&Math.max(...zs)>zone.z[0]&&Math.min(...zs)<zone.z[1])collisions.push({triangle:i/3,zone:zone.name});}}
const report={asset:'campus_construction_decor',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),minimumPerimeterClearance:clearance,requiredPerimeterClearance:1.4,clearanceZones:zones,collisions,placement:{tile:[0,0,62.353829072],decor:[0,1.2,62.353829072],rotation:0},surfaceHeights:{terrain:1.2,mainFoundationLocalTop:.18,officeFoundationLocalTop:.24,craneFoundationLocalTop:.46},passed:clearance>=1.4&&!collisions.length};
fs.writeFileSync(base+'validation/placement-contract.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
