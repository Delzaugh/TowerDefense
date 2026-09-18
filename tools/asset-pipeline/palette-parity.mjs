import assert from 'node:assert/strict';
export function glbDocument(bytes){const length=bytes.readUInt32LE(12);return {g:JSON.parse(bytes.subarray(20,20+length)),bin:bytes.subarray(28+length)};}
function accessor(a,index){
  const s=a.g.accessors[index];assert(s,'Missing accessor');
  const width=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[s.type])*({5121:1,5123:2,5125:4,5126:4}[s.componentType]);
  const out=Buffer.alloc(width*s.count),v=a.g.bufferViews[s.bufferView];
  if(v){const start=(v.byteOffset||0)+(s.byteOffset||0);for(let i=0;i<s.count;i++)a.bin.copy(out,i*width,start+i*(v.byteStride||width),start+i*(v.byteStride||width)+width);}
  if(s.sparse){
    const {count,indices,values}=s.sparse,iv=a.g.bufferViews[indices.bufferView],vv=a.g.bufferViews[values.bufferView];
    const step=({5121:1,5123:2,5125:4}[indices.componentType]),read=({1:'readUInt8',2:'readUInt16LE',4:'readUInt32LE'}[step]);
    for(let i=0;i<count;i++){const target=a.bin[read]((iv.byteOffset||0)+(indices.byteOffset||0)+i*step),start=(vv.byteOffset||0)+(values.byteOffset||0)+i*width;a.bin.copy(out,target*width,start,start+width);}
  }
  return out;
}
export function verifyPaletteParity(oldBytes,newBytes){
  const a=glbDocument(oldBytes),b=glbDocument(newBytes);
  assert.equal(a.g.meshes.length,b.g.meshes.length,'Mesh count changed');
  let vertices=0;
  a.g.meshes.forEach((mesh,mi)=>{
    const other=b.g.meshes[mi];assert.equal(mesh.name,other.name);assert.equal(mesh.primitives.length,other.primitives.length);
    assert.deepEqual(mesh.extras,other.extras,'Mesh extras/morph names changed');assert.deepEqual(mesh.weights,other.weights);
    mesh.primitives.forEach((p,pi)=>{const q=other.primitives[pi];assert.equal(p.material,q.material);assert.deepEqual(accessor(a,p.indices),accessor(b,q.indices),'Indices changed');
      for(const [key,idx] of Object.entries(p.attributes))if(key!=='COLOR_0')assert.deepEqual(accessor(a,idx),accessor(b,q.attributes[key]),'Attribute changed: '+key);
      assert.equal(q.attributes.COLOR_0,undefined,'Redundant vertex colours remain');vertices+=a.g.accessors[p.attributes.POSITION].count;
      assert.equal(p.targets?.length,q.targets?.length,'Morph target count changed');
      p.targets?.forEach((target,ti)=>{for(const [key,idx] of Object.entries(target))assert.deepEqual(accessor(a,idx),accessor(b,q.targets[ti][key]),'Morph target changed');});
    });
  });
  assert.deepEqual(a.g.nodes,b.g.nodes,'Rig, anchors, transforms or extras changed');
  assert.deepEqual(a.g.scenes,b.g.scenes);
  assert.equal(a.g.skins?.length,b.g.skins?.length);
  a.g.skins?.forEach((s,i)=>{const t=b.g.skins[i];assert.deepEqual({...s,inverseBindMatrices:0},{...t,inverseBindMatrices:0});assert.deepEqual(accessor(a,s.inverseBindMatrices),accessor(b,t.inverseBindMatrices));});
  assert.equal(a.g.animations?.length,b.g.animations?.length);
  a.g.animations?.forEach((s,i)=>{const t=b.g.animations[i];assert.equal(s.name,t.name);assert.deepEqual(s.channels,t.channels);assert.equal(s.samplers.length,t.samplers.length);s.samplers.forEach((x,j)=>{const y=t.samplers[j];assert.equal(x.interpolation,y.interpolation);for(const key of ['input','output'])assert.deepEqual(accessor(a,x[key]),accessor(b,y[key]),'Animation changed: '+s.name);});});
  // Compare additional texture contents/UV channels, even if image indices shift.
  function normalizedMaterials(asset){return asset.g.materials.map(material=>{const m=structuredClone(material);delete m.pbrMetallicRoughness.baseColorTexture;
    for(const [key,value] of Object.entries(m))if(key.endsWith('Texture')&&value){const tex=asset.g.textures[value.index],img=asset.g.images[tex.source],view=asset.g.bufferViews[img.bufferView];value.index=0;value.sampler=asset.g.samplers?.[tex.sampler];value.image=asset.bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength).toString('base64');}
    return m;});}
  assert.deepEqual(normalizedMaterials(a),normalizedMaterials(b),'Material response or auxiliary texture changed');
  return {passed:true,vertices,meshes:a.g.meshes.length,materials:a.g.materials.length,oldBytes:oldBytes.length,newBytes:newBytes.length,
    checks:'Exact exported topology, positions, normals, skinning, old UV channels, morph targets, rig, anchors, clips, and material/emission parity; base-colour storage only.'};
}
