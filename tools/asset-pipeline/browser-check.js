import * as THREE from '/vendor/three.module.js';
import { GLTFLoader } from '/vendor/GLTFLoader.js';
import { inspectTexturePalettes } from '/review.js';

export async function inspect(url, manifest) {
  const gltf = await new GLTFLoader().loadAsync(url), root = gltf.scene;
  const errors = [], warnings = [], check = (ok, message) => { if (!ok) errors.push(message); };
  try{inspectTexturePalettes(THREE,root,manifest.texturePalettes);}catch(error){errors.push(error.message);}
  root.updateMatrixWorld(true);
  const meshes = [], materials = new Set(), textures = new Set(), bones = new Set();
  root.traverse(o => {
    if (!o.isMesh) return;
    meshes.push(o); o.skeleton?.bones.forEach(b => bones.add(b));
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      materials.add(m); Object.values(m).filter(v => v?.isTexture).forEach(t => textures.add(t));
      check(!m.transparent, 'Transparent material: ' + m.name);
      for(const texture of Object.values(m).filter(v=>v?.isTexture))check(!!o.geometry.attributes[texture.channel?'uv'+texture.channel:'uv'], 'Missing texture UV channel: ' + o.name);
      check(!m.normalMap || !!o.geometry.attributes.tangent, 'Missing normal-map tangents: ' + o.name);
    });
    check(o.position.length() < 1e-5 && o.quaternion.angleTo(new THREE.Quaternion()) < 1e-5 && o.scale.distanceTo(new THREE.Vector3(1,1,1)) < 1e-5, 'Unapplied mesh transform: ' + o.name);
    const a = o.geometry.attributes;
    if(manifest.palette&&manifest.palette.storage!=='texture'){
      const mapping=o.userData.palette_roles, ids=a[mapping?.attribute], colors=a.color;
      check(!!ids && !!colors, 'Missing explicit palette-role or base-color attribute: '+o.name);
      if(ids && colors){
        const byId=new Map(Object.entries(mapping.roles).map(([name,id])=>[id,manifest.palette.colors[name] ? new THREE.Color(manifest.palette.colors[name]) : null]));
        for(let i=0;i<ids.count;i++){
          const expected=byId.get(Math.round(ids.getX(i)*(mapping.scale||1)));
          if(!expected || Math.max(Math.abs(colors.getX(i)-expected.r),Math.abs(colors.getY(i)-expected.g),Math.abs(colors.getZ(i)-expected.b))>.002){errors.push('Exported palette does not match source contract: '+o.name);break;}
        }
      }
    }
    for(const [name,attribute] of Object.entries(a)) check(Array.from(attribute.array || attribute.data?.array || []).every(Number.isFinite), 'Non-finite attribute: '+o.name+'/'+name);
    check(!!a.normal, 'Missing normals: ' + o.name);
    if (o.isSkinnedMesh) {
      check(!!a.skinWeight && !!a.skinIndex, 'Missing skin attributes: ' + o.name);
      for (let i=0; i<a.skinWeight.count; i++) {
        const weights = [a.skinWeight.getX(i),a.skinWeight.getY(i),a.skinWeight.getZ(i),a.skinWeight.getW(i)];
        if (weights.some(w => w < 0) || Math.abs(weights.reduce((a,b)=>a+b,0)-1) > .002) { errors.push('Invalid skin weights: ' + o.name); break; }
        if ([a.skinIndex.getX(i),a.skinIndex.getY(i),a.skinIndex.getZ(i),a.skinIndex.getW(i)].some(v => !Number.isInteger(v) || v<0 || v>=o.skeleton.bones.length)) { errors.push('Invalid skin index: ' + o.name); break; }
      }
    }
  });
  const bounds = new THREE.Box3().setFromObject(root,true), dimensions = bounds.getSize(new THREE.Vector3()).toArray();
  const counts = {triangles: meshes.reduce((n,o)=>n+(o.geometry.index?.count ?? o.geometry.attributes.position.count)/3,0), meshes:meshes.length, materials:materials.size, textures:textures.size, bones:bones.size};
  for (const [key,value] of Object.entries(counts)) check(value <= manifest.budgets[key], key + ' exceeds budget: ' + value + ' / ' + manifest.budgets[key]);
  textures.forEach(t => check(Math.max(t.image?.width || 0,t.image?.height || 0) <= manifest.budgets.textureSize, 'Texture exceeds size budget'));
  const assetRoot = root.getObjectByName(manifest.contract.root);
  check(!!assetRoot, 'Missing root');
  if (assetRoot) check(assetRoot.position.length()<1e-5 && assetRoot.quaternion.angleTo(new THREE.Quaternion())<1e-5 && assetRoot.scale.distanceTo(new THREE.Vector3(1,1,1))<1e-5, 'Root transform must be identity');
  for (const name of manifest.contract.anchors) {
    const a = root.getObjectByName(name); let parent = a?.parent;
    while(parent && parent !== assetRoot) parent=parent.parent;
    check(!!a && !a.isMesh && parent === assetRoot, 'Missing or invalid anchor: ' + name);
  }
  if (manifest.contract.grounded) check(Math.abs(bounds.min.y)<=manifest.contract.groundTolerance, 'Rest ground contact is ' + bounds.min.y);
  else if(Number.isFinite(manifest.contract.groundY))check(Math.abs(bounds.min.y-manifest.contract.groundY)<=manifest.contract.groundTolerance,'Assembly contact level changed: '+bounds.min.y);
  if (manifest.contract.dimensions) dimensions.forEach((v,i) => check(v>=manifest.contract.dimensions.min[i] && v<=manifest.contract.dimensions.max[i], 'Dimension outside contract on axis ' + i + ': ' + v));
  const expected = manifest.clips.map(c=>c.name), actual = gltf.animations.map(c=>c.name);
  check(expected.length===actual.length && expected.every(n=>actual.includes(n)), 'Clip contract mismatch: ' + actual.join(', '));
  const mixer = new THREE.AnimationMixer(root), clips=[];
  for (const clip of gltf.animations) {
    const spec = manifest.clips.find(c=>c.name===clip.name), action = mixer.clipAction(clip);
    check(Number.isFinite(clip.duration) && clip.duration>0, 'Invalid duration: ' + clip.name);
    const poseBounds=[];
    action.setLoop(THREE.LoopOnce,1); action.clampWhenFinished=true; action.play();
    const rootMatrix = assetRoot?.matrixWorld.clone();
    for (let i=0; i<=12; i++) {
      action.paused=false; action.time=clip.duration*i/12; mixer.update(0); root.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(root,true);
      check([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite), 'Non-finite sampled geometry: ' + clip.name);
      if (assetRoot && rootMatrix) check(assetRoot.matrixWorld.elements.every((v,j)=>Math.abs(v-rootMatrix.elements[j])<1e-5), 'Root motion in ' + clip.name);
      poseBounds.push([b.min.toArray(),b.max.toArray()]);
    }
    let loopDelta = 0;
    for (const track of clip.tracks) {
      check([...track.times,...track.values].every(Number.isFinite), 'Non-finite animation: ' + track.name);
      if (spec?.playback==='loop') {
        const n=track.getValueSize(), a=Array.from(track.createInterpolant().evaluate(0)), b=Array.from(track.createInterpolant().evaluate(clip.duration));
        const sign = track.ValueTypeName==='quaternion' && a.reduce((s,v,i)=>s+v*b[i],0)<0 ? -1 : 1;
        for(let j=0;j<n;j++) loopDelta=Math.max(loopDelta,Math.abs(a[j]-sign*b[j]));
      }
    }
    check(loopDelta<.002, 'Loop boundary discontinuity: ' + clip.name + ' ('+loopDelta+')');
    clips.push({name:clip.name,duration:clip.duration,playback:spec?.playback,loopDelta,samples:poseBounds});
    mixer.stopAllAction();
  }
  root.updateMatrixWorld(true);
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#dce5ed'); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2.5)); const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,6,5);scene.add(light);
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,800);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.append(renderer.domElement);
  const center=bounds.getCenter(new THREE.Vector3()), size=Math.max(...dimensions)*.85;
  const camera=new THREE.OrthographicCamera(-size*1.125,size*1.125,size,-size,.01,1000);
  window.renderEvidence = (view='iso',clipName=null,progress=0) => {
    mixer.stopAllAction();
    if(clipName){const c=gltf.animations.find(c=>c.name===clipName);const a=mixer.clipAction(c);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();a.time=c.duration*progress;mixer.update(0);}
    const directions={iso:[3,2,4],front:[0,0,5],side:[5,0,0],rear:[0,0,-5],top:[0,5,.0001]};camera.position.copy(center).add(new THREE.Vector3(...directions[view]).multiplyScalar(Math.max(...dimensions)));camera.lookAt(center);root.updateMatrixWorld(true);renderer.render(scene,camera);
  };
  window.renderEvidence();
  return {...counts,dimensions,bounds:[bounds.min.toArray(),bounds.max.toArray()],clips,errors:[...new Set(errors)],warnings,visualReview:'pending — inspect silhouettes, joints, foot contact and sampled motion; numerical checks are not artistic approval'};
}
