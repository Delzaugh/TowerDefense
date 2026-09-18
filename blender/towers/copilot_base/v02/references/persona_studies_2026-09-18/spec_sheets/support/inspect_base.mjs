import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const runtime = path.resolve('assets/runtime/towers/copilot_base_v02.glb');
const data = fs.readFileSync(runtime);
let json, bin;
for (let offset = 12; offset < data.length;) {
  const length = data.readUInt32LE(offset);
  const type = data.readUInt32LE(offset + 4);
  const chunk = data.subarray(offset + 8, offset + 8 + length);
  if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').trim());
  if (type === 0x004e4942) bin = chunk;
  offset += 8 + length;
}
const positionAccessors = new Set();
let triangles = 0;
for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
  positionAccessors.add(primitive.attributes.POSITION);
  if ((primitive.mode ?? 4) !== 4) throw new Error('Non-triangle primitive');
  triangles += json.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
}
const images = json.images.map((entry, index) => {
  const bv = json.bufferViews[entry.bufferView];
  const bytes = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
  if (entry.mimeType !== 'image/png') throw new Error('Expected PNG');
  const filename = `base_texture_${index}.png`;
  fs.writeFileSync(path.join(out, filename), bytes);
  return {filename, name:entry.name, width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20), mimeType:entry.mimeType};
});
const stats = {
  runtime, sha256:crypto.createHash('sha256').update(data).digest('hex'), triangles,
  vertices:[...positionAccessors].reduce((total,index)=>total+json.accessors[index].count,0),
  vertexDefinition:'Unique POSITION accessor vertex records in the exported GLB; includes split render vertices, not welded authoring vertices.',
  meshes:json.meshes.length, materials:json.materials.length, textures:json.textures.length,
  images, hasUVs:json.meshes.every(m=>m.primitives.every(p=>p.attributes.TEXCOORD_0 !== undefined)),
  animations:json.animations.map(a=>a.name), materialsData:json.materials
};
fs.writeFileSync(path.join(out,'base_verified_stats.json'),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats,null,2));
