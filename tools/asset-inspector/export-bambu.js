import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const encoder = new TextEncoder();
const align4 = n => Math.ceil(n / 4) * 4;
const srgbByte = value => Math.round(255 * Math.min(1, Math.max(0, value <= .0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - .055)));
const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;

function canvasImage(texture) {
  const source = texture.image;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  if (!canvas.width || !canvas.height) throw new Error('A texture image is unavailable.');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (source.data) {
    if (!(source.data instanceof Uint8Array) || source.data.length !== source.width * source.height * 4) throw new Error('Unsupported texture pixels.');
    context.putImageData(new ImageData(new Uint8ClampedArray(source.data), source.width, source.height), 0, 0);
  } else context.drawImage(source, 0, 0);
  return canvas;
}

async function png(canvas) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the colour texture.');
  return new Uint8Array(await blob.arrayBuffer());
}

function textureUV(mesh, texture, index) {
  const attribute = mesh.geometry.getAttribute(texture.channel ? 'uv' + texture.channel : 'uv');
  if (!attribute) throw new Error(`Missing texture coordinates on ${mesh.name || 'mesh'}.`);
  if (texture.matrixAutoUpdate) texture.updateMatrix();
  const uv = new THREE.Vector2().fromBufferAttribute(attribute, index).applyMatrix3(texture.matrix);
  if (texture.flipY) uv.y = 1 - uv.y;
  return uv;
}

// Static GLB output deliberately contains only triangles and base-colour textures.
// It is a print download, never a replacement for a registered runtime asset.
export async function buildBambuGlb(root, { heightMm = 100, metadata = {} } = {}) {
  if (!Number.isFinite(heightMm) || heightMm < 1 || heightMm > 2000) throw new Error('Choose a height between 1 and 2000 mm.');
  root.updateMatrixWorld(true);
  const batches = [], bounds = new THREE.Box3(), point = new THREE.Vector3();
  root.traverseVisible(mesh => {
    if (!mesh.isMesh) return;
    if (mesh.isInstancedMesh) throw new Error('Instanced meshes are not supported by this export yet.');
    const geometry = mesh.geometry, position = geometry.getAttribute('position');
    if (!position) return;
    const count = geometry.index?.count ?? position.count;
    const groups = Array.isArray(mesh.material) ? geometry.groups : [{ start: 0, count, materialIndex: 0 }];
    for (const group of groups) {
      const material = Array.isArray(mesh.material) ? mesh.material[group.materialIndex] : mesh.material;
      if (!material || !material.visible) continue;
      if (material.transparent || material.alphaTest > 0) throw new Error('Transparent or cutout surfaces need print preparation before export.');
      const batch = { mesh, material, faces: [], vertexColors: material.vertexColors && !!geometry.getAttribute('color') };
      const end = Math.min(count, group.start + group.count, geometry.drawRange.start + geometry.drawRange.count);
      for (let i = Math.max(group.start, geometry.drawRange.start); i + 2 < end; i += 3) {
        const indices = [0, 1, 2].map(j => geometry.index ? geometry.index.getX(i + j) : i + j);
        if (mesh.matrixWorld.determinant() < 0) [indices[1], indices[2]] = [indices[2], indices[1]];
        const points = indices.map(index => mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
        if (!points.every(p => p.toArray().every(Number.isFinite))) throw new Error('The selected pose contains invalid geometry.');
        const area = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).lengthSq();
        // Some visual-state clips hide a part by collapsing its geometry.
        if (area === 0) continue;
        points.forEach(p => bounds.expandByPoint(p));
        batch.faces.push({ indices, points });
      }
      if (batch.faces.length) batches.push(batch);
    }
  });
  const height = bounds.max.y - bounds.min.y;
  if (bounds.isEmpty() || height <= 0) throw new Error('The selected pose has no exportable height.');
  const center = bounds.getCenter(new THREE.Vector3()), scale = heightMm / 1000 / height;
  const outputBounds = new THREE.Box3();
  const document = { asset: { version: '2.0', generator: 'Tower Asset Inspector · Bambu export', extras: metadata }, scene: 0,
    scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: [], textures: [], images: [], samplers: [], accessors: [], bufferViews: [], buffers: [] };
  const chunks = []; let byteLength = 0, triangleCount = 0;
  function bufferView(bytes, target) {
    const view = { buffer: 0, byteOffset: byteLength, byteLength: bytes.byteLength };
    if (target) view.target = target;
    document.bufferViews.push(view); chunks.push({ offset: byteLength, bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) });
    byteLength += align4(bytes.byteLength); return document.bufferViews.length - 1;
  }
  function accessor(values, size, type, withBounds = false) {
    const array = new Float32Array(values), result = { bufferView: bufferView(array, 34962), componentType: 5126, count: array.length / size, type };
    if (withBounds) {
      result.min = Array(size).fill(Infinity); result.max = Array(size).fill(-Infinity);
      for (let i = 0; i < array.length; i++) { const j = i % size; result.min[j] = Math.min(result.min[j], array[i]); result.max[j] = Math.max(result.max[j], array[i]); }
    }
    document.accessors.push(result); return document.accessors.length - 1;
  }
  for (const batch of batches) {
    const { mesh, material, faces, vertexColors } = batch;
    const positions = [], normals = [], uvs = [];
    let textureCanvas, sampler = { magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 };
    let atlas, pixels, columns, tile = 32, gutter = 2;
    const tint = material.color || new THREE.Color(1, 1, 1);
    if (vertexColors) {
      columns = Math.ceil(Math.sqrt(faces.length));
      const rows = Math.ceil(faces.length / columns);
      if (columns * tile > 4096 || rows * tile > 4096) throw new Error('This model is too large for the colour atlas.');
      atlas = window.document.createElement('canvas'); atlas.width = columns * tile; atlas.height = rows * tile;
      pixels = atlas.getContext('2d').createImageData(atlas.width, atlas.height);
      // Combining existing image detail with vertex gradients requires a separate bake.
      if (material.map) throw new Error('Combined vertex colours and base-colour textures are not supported yet.');
      textureCanvas = atlas;
    } else if (material.map) {
      textureCanvas = canvasImage(material.map);
      const context = textureCanvas.getContext('2d'), data = context.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
      if (tint.r !== 1 || tint.g !== 1 || tint.b !== 1 || material.map.colorSpace !== THREE.SRGBColorSpace) {
        for (let i = 0; i < data.data.length; i += 4) for (let c = 0; c < 3; c++) {
          const v = data.data[i + c] / 255;
          data.data[i + c] = srgbByte((material.map.colorSpace === THREE.SRGBColorSpace ? linear(v) : v) * tint.toArray()[c]);
        }
        context.putImageData(data, 0, 0);
      }
      const wrap = value => value === THREE.RepeatWrapping ? 10497 : value === THREE.MirroredRepeatWrapping ? 33648 : 33071;
      sampler = { magFilter: material.map.magFilter === THREE.NearestFilter ? 9728 : 9729, minFilter: 9729, wrapS: wrap(material.map.wrapS), wrapT: wrap(material.map.wrapT) };
    } else {
      textureCanvas = window.document.createElement('canvas'); textureCanvas.width = textureCanvas.height = 2;
      const context = textureCanvas.getContext('2d'); context.fillStyle = '#' + tint.getHexString(); context.fillRect(0, 0, 2, 2);
    }
    for (let f = 0; f < faces.length; f++) {
      const { indices, points } = faces[f];
      const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
      for (const p of points) {
        point.set(p.x - center.x, p.y - bounds.min.y, p.z - center.z).multiplyScalar(scale);
        outputBounds.expandByPoint(point); positions.push(...point.toArray()); normals.push(...normal.toArray());
      }
      if (vertexColors) {
        const colors = indices.map(index => new THREE.Color().fromBufferAttribute(mesh.geometry.getAttribute('color'), index).multiply(tint));
        const ox = f % columns * tile, oy = Math.floor(f / columns) * tile, span = tile - 2 * gutter - 1;
        for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) {
          let b = Math.max(0, (x - gutter) / span), c = Math.max(0, (y - gutter) / span), a = Math.max(0, 1 - b - c);
          const sum = a + b + c; a /= sum; b /= sum; c /= sum;
          const offset = ((oy + y) * atlas.width + ox + x) * 4;
          for (let channel = 0; channel < 3; channel++) {
            const key = ['r', 'g', 'b'][channel]; pixels.data[offset + channel] = srgbByte(colors[0][key] * a + colors[1][key] * b + colors[2][key] * c);
          }
          pixels.data[offset + 3] = 255;
        }
        for (const [x, y] of [[gutter, gutter], [gutter + span, gutter], [gutter, gutter + span]]) uvs.push((ox + x + .5) / atlas.width, (oy + y + .5) / atlas.height);
      } else for (const index of indices) uvs.push(...(material.map ? textureUV(mesh, material.map, index).toArray() : [.5, .5]));
      // Keep the inspector responsive while baking larger vertex-colour atlases.
      if (f % 256 === 255) await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (atlas) atlas.getContext('2d').putImageData(pixels, 0, 0);
    const imageIndex = document.images.length;
    document.images.push({ bufferView: bufferView(await png(textureCanvas)), mimeType: 'image/png' });
    document.samplers.push(sampler); document.textures.push({ source: imageIndex, sampler: imageIndex });
    const materialIndex = document.materials.length;
    document.materials.push({ name: material.name || 'Print colours', pbrMetallicRoughness: { baseColorTexture: { index: imageIndex }, metallicFactor: 0, roughnessFactor: 1 }, doubleSided: true });
    const meshIndex = document.meshes.length;
    document.meshes.push({ name: mesh.name, primitives: [{ attributes: { POSITION: accessor(positions, 3, 'VEC3', true), NORMAL: accessor(normals, 3, 'VEC3'), TEXCOORD_0: accessor(uvs, 2, 'VEC2') }, material: materialIndex, mode: 4 }] });
    document.scenes[0].nodes.push(document.nodes.length); document.nodes.push({ name: mesh.name, mesh: meshIndex });
    triangleCount += faces.length;
  }
  document.buffers.push({ byteLength });
  const json = encoder.encode(JSON.stringify(document)), jsonLength = align4(json.length);
  const buffer = new ArrayBuffer(12 + 8 + jsonLength + 8 + byteLength), view = new DataView(buffer), bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, jsonLength, true); view.setUint32(16, 0x4e4f534a, true); bytes.fill(32, 20, 20 + jsonLength); bytes.set(json, 20);
  const binaryStart = 20 + jsonLength; view.setUint32(binaryStart, byteLength, true); view.setUint32(binaryStart + 4, 0x004e4942, true);
  for (const chunk of chunks) bytes.set(chunk.bytes, binaryStart + 8 + chunk.offset);
  return { buffer, triangles: triangleCount, dimensionsMm: outputBounds.getSize(new THREE.Vector3()).multiplyScalar(1000).toArray() };
}

function dispose(root) {
  const images = new Set();
  root?.traverse(o => {
    o.geometry?.dispose(); o.skeleton?.dispose();
    for (const material of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
      for (const value of Object.values(material)) if (value?.isTexture) { images.add(value.image); value.dispose(); }
      material.dispose();
    }
  });
  images.forEach(image => image?.close?.());
}

export function installBambuExport(api) {
  const $ = id => window.document.getElementById(id), dialog = $('bambu-dialog');
  let busy = false;
  function sync() { $('bambu-open').disabled = !api.active() || api.loading() || busy; }
  $('bambu-open').onclick = () => {
    const entry = api.active(); if (!entry) return;
    $('bambu-model').textContent = entry.model.contract.displayName + ' · ' + entry.model.contract.version;
    $('bambu-status').textContent = ''; dialog.showModal();
  };
  $('bambu-close').onclick = () => dialog.close();
  $('bambu-form').onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    const entry = api.active(); if (!entry || api.loading()) return;
    const heightMm = Number($('bambu-height').value), rest = $('bambu-pose').value === 'rest';
    const clip = rest ? null : entry.clips[entry.state.clipIndex]?.name, time = rest ? 0 : entry.action?.time || 0;
    const model = entry.model, contract = model.contract;
    busy = true; sync(); $('bambu-download').disabled = true; $('bambu-status').textContent = 'Preparing colours and pose…';
    let root;
    try {
      const response = await fetch('./runtime/' + model.path.split('/').map(encodeURIComponent).join('/') + '?v=' + model.sha256);
      if (!response.ok) throw new Error('Could not load the saved model.');
      const bytes = await response.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
      if (digest !== model.sha256) throw new Error('This asset changed on disk. Refresh the inspector and try again.');
      const gltf = await new GLTFLoader().parseAsync(bytes, ''); root = gltf.scene;
      if (clip) {
        const animation = gltf.animations.find(c => c.name === clip);
        if (!animation) throw new Error('The selected clip is unavailable.');
        const mixer = new THREE.AnimationMixer(root), action = mixer.clipAction(animation);
        action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play(); action.time = time; mixer.update(0);
      }
      const result = await buildBambuGlb(root, { heightMm, metadata: { asset: contract.id, version: contract.version, revision: contract.revision, sourceSha256: model.sha256, clip, time, heightMm } });
      const filename = `${contract.id}_${contract.version}_bambu_${heightMm}mm_${clip ? clip + '_' + time.toFixed(3) + 's' : 'rest'}.glb`;
      const url = URL.createObjectURL(new Blob([result.buffer], { type: 'model/gltf-binary' })), link = window.document.createElement('a');
      link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      $('bambu-status').textContent = `Downloaded ${filename}. Size: ${result.dimensionsMm.map(n => n.toFixed(1)).join(' × ')} mm (W × H × D). Open in Bambu Studio and use its colour import.`;
    } catch (error) { $('bambu-status').textContent = 'Export failed: ' + error.message; }
    finally { dispose(root); busy = false; $('bambu-download').disabled = false; sync(); }
  };
  return { sync };
}
