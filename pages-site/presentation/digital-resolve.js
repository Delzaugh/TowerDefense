// Renderer-only effect. Call after evaluating the GLB's animation mixer.
// No wall clock, random state, simulation events, or edits to source geometry.
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp(x); return x*x*(3-2*x); };
const cellHash = ([x,y,z]) => ((x*17+y*59+z*101)%127+127)%127/127;
export const DIGITAL_RESOLVE_VERSION = 1;

export function createResolveBudget(maxFragments = 256) {
  if (!Number.isInteger(maxFragments) || maxFragments < 0) throw Error('Invalid resolve fragment budget');
  const leases = new Map();
  return {
    acquire(owner, requested) {
      if (leases.has(owner)) return leases.get(owner);
      const used = [...leases.values()].reduce((a,b)=>a+b,0);
      const count = Math.max(0, Math.min(requested, maxFragments-used));
      if(count) leases.set(owner,count);
      return count;
    },
    release(owner) { leases.delete(owner); },
    get used() { return [...leases.values()].reduce((a,b)=>a+b,0); },
    maxFragments
  };
}

export function createDigitalResolve(THREE, root, {budget = createResolveBudget()} = {}) {
  const assetRoot = root.getObjectByName('root');
  const spec = assetRoot?.userData.resolve_effect;
  if (!spec) return null;
  if (spec.type !== 'digital_blocks' || spec.version !== DIGITAL_RESOLVE_VERSION || spec.clip !== 'resolve' ||
      (spec.assembleClip !== undefined && spec.assembleClip !== 'place') ||
      !Number.isFinite(spec.cellSize) || spec.cellSize < .05 || spec.cellSize > 2 ||
      !Number.isInteger(spec.maxFragments) || spec.maxFragments < 0 || spec.maxFragments > 64 ||
      !/^#[a-f0-9]{6}$/i.test(spec.edgeColor || '')) throw Error('Invalid digital resolve specification');

  root.updateMatrixWorld(true);
  const size = spec.cellSize, meshes = [], originals = [], patched = [];
  const restInverse = assetRoot.matrixWorld.clone().invert();
  const restBounds = new THREE.Box3().setFromObject(root,true).applyMatrix4(restInverse);
  const height = restBounds.max.y-restBounds.min.y;
  const minCellY = Math.floor(restBounds.min.y/size), maxCellY = Math.floor(restBounds.max.y/size);
  const span = Math.max(1,maxCellY-minCellY);
  const meshSpace = new Map();
  root.traverse(o=>{if(o.isMesh){meshes.push(o);meshSpace.set(o,new THREE.Matrix4().multiplyMatrices(restInverse,o.matrixWorld));}});
  const progress = {value:-1}, edge = {value:new THREE.Color(spec.edgeColor)};
  const header = `
    uniform float resolveProgress;
    uniform float resolveCellSize;
    uniform vec2 resolveYRange;
    uniform vec3 resolveEdge;
    varying vec3 vResolvePosition;
    float resolveBirth(vec3 cell) {
      float seed = mod(dot(cell,vec3(17.,59.,101.)),127.)/127.;
      float h = clamp((cell.y-resolveYRange.x)/resolveYRange.y,0.,1.);
      return .16 + .51*(.84*h + .16*seed);
    }
  `;
  const removal = `
    if (resolveProgress >= 0.) {
      float born = resolveBirth(floor(vResolvePosition/resolveCellSize));
      if (resolveProgress >= born) discard;
    }
  `;
  function patch(material, transform, color = false) {
    const previous = material.onBeforeCompile;
    material.onBeforeCompile = (shader,renderer) => {
      previous.call(material,shader,renderer);
      Object.assign(shader.uniforms,{resolveProgress:progress,resolveCellSize:{value:size},resolveYRange:{value:new THREE.Vector2(minCellY,span)},resolveEdge:edge,resolveFromMesh:{value:transform}});
      shader.vertexShader = 'uniform mat4 resolveFromMesh; varying vec3 vResolvePosition;\n'+shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvResolvePosition=(resolveFromMesh*vec4(position,1.)).xyz;');
      shader.fragmentShader = header+shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+removal);
      if(color) shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        if(resolveProgress>=0.) {
          float birth=resolveBirth(floor(vResolvePosition/resolveCellSize));
          float band=1.-smoothstep(0.,.06,birth-resolveProgress);
          vec3 grid=fract(vResolvePosition/resolveCellSize);
          vec3 boundary=min(grid,1.-grid);
          float line=1.-smoothstep(.035,.10,min(boundary.x,min(boundary.y,boundary.z)));
          float pulse=sin(clamp(resolveProgress/.16,0.,1.)*3.14159265);
          totalEmissiveRadiance+=resolveEdge*(band*(.12+.58*line)+.07*pulse);
        }
      `);
    };
    const key=material.customProgramCacheKey.bind(material);
    material.customProgramCacheKey=()=>key()+'|digital-resolve-v1-'+color;
    material.needsUpdate=true;
    patched.push(material);
    return material;
  }
  for(const mesh of meshes){
    const source=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(source.some(m=>!m.isMeshStandardMaterial))throw Error('Digital resolve requires standard/physical surface materials');
    originals.push({mesh,material:mesh.material,depth:mesh.customDepthMaterial,distance:mesh.customDistanceMaterial});
    const colors=source.map(m=>patch(m.clone(),meshSpace.get(mesh),true));
    mesh.material=Array.isArray(mesh.material)?colors:colors[0];
    mesh.customDepthMaterial=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),meshSpace.get(mesh));
    mesh.customDistanceMaterial=patch(new THREE.MeshDistanceMaterial(),meshSpace.get(mesh));
  }

  // Scan the actual surface into the same grid used by the dissolve shader.
  // Each candidate retains a triangle sample, so its colour and release point
  // come from the model rather than a surrounding bounding-box particle cloud.
  let candidates = null, fragments = null, cubeGeometry = null, cubeMaterial = null;
  let enabled = true, disposed = false, live = 0, leased = 0, lastTime = -1, timeline = -1, currentClip = null;
  const container = new THREE.Group();container.name='presentation_digital_resolve';container.visible=false;
  const dummy=new THREE.Object3D(), inv=new THREE.Matrix4(), point=new THREE.Vector3(), local=new THREE.Vector3();
  const bornAt = cell => .16+.51*(.84*clamp((cell[1]-minCellY)/span)+.16*cellHash(cell));

  function surfaceCandidates(){
    const cells=new Map(),colors=new Map();
    function texturePixels(texture){
      if(!texture) return null;
      if(colors.has(texture))return colors.get(texture);
      const img=texture.image;
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(img.data)ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data),img.width,img.height),0,0);else ctx.drawImage(img,0,0);
      const pixels=ctx.getImageData(0,0,img.width,img.height);colors.set(texture,pixels);return pixels;
    }
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),sample=new THREE.Vector3();
    for(const mesh of meshes){
      const geo=mesh.geometry,attr=geo.attributes.position,idx=geo.index,mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
      const tex=texturePixels(mat.map),uv=geo.attributes.uv,color=geo.attributes.color;
      const count=idx?idx.count:attr.count;
      for(let i=0;i<count;i+=3){
        const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);
        a.fromBufferAttribute(attr,ids[0]).applyMatrix4(meshSpace.get(mesh));b.fromBufferAttribute(attr,ids[1]).applyMatrix4(meshSpace.get(mesh));c.fromBufferAttribute(attr,ids[2]).applyMatrix4(meshSpace.get(mesh));
        const divisions=Math.min(14,Math.max(1,Math.ceil(Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))/(size*.45))));
        const area=ab.subVectors(b,a).cross(ac.subVectors(c,a)).length()*.5;
        for(let u=0;u<=divisions;u++)for(let v=0;v<=divisions-u;v++){
          const weights=[1-(u+v)/divisions,u/divisions,v/divisions];
          sample.set(0,0,0).addScaledVector(a,weights[0]).addScaledVector(b,weights[1]).addScaledVector(c,weights[2]);
          const cell=sample.toArray().map(x=>Math.floor(x/size)),key=cell.join(','),importance=area/((divisions+1)*(divisions+2)/2);
          const current=cells.get(key);if(current){current.area+=importance;continue;}
          const tint=mat.color.clone();
          if(tex&&uv){
            let ux=0,uy=0;ids.forEach((id,k)=>{ux+=uv.getX(id)*weights[k];uy+=uv.getY(id)*weights[k];});
            const uvPoint=new THREE.Vector2(ux,uy);mat.map.transformUv(uvPoint);
            const x=Math.min(tex.width-1,Math.max(0,Math.floor(uvPoint.x*tex.width))),y=Math.min(tex.height-1,Math.max(0,Math.floor(uvPoint.y*tex.height))),offset=(y*tex.width+x)*4;
            tint.multiply(new THREE.Color().setRGB(tex.data[offset]/255,tex.data[offset+1]/255,tex.data[offset+2]/255,THREE.SRGBColorSpace));
          }
          if(color){const col=new THREE.Color(0,0,0);ids.forEach((id,k)=>{col.r+=color.getX(id)*weights[k];col.g+=color.getY(id)*weights[k];col.b+=color.getZ(id)*weights[k];});tint.multiply(col);}
          cells.set(key,{cell,mesh,ids,weights,tint,birth:bornAt(cell),seed:cellHash(cell),area:importance,position:sample.clone()});
        }
      }
    }
    // Spatial coverage by farthest-point selection, seeded at the front face.
    // The deterministic order also makes smaller fragment budgets look balanced.
    const remaining=[...cells.values()],chosen=[];
    if(remaining.length){remaining.sort((a,b)=>b.position.z-a.position.z||b.area-a.area);chosen.push(remaining.shift());}
    while(chosen.length<spec.maxFragments&&remaining.length){
      let best=0,score=-1;
      for(let i=0;i<remaining.length;i++){
        const entry=remaining[i];const distance=Math.min(...chosen.map(c=>c.position.distanceToSquared(entry.position)));
        const value=distance*(.7+.3*Math.min(1,entry.area/(size*size)));
        if(value>score){score=value;best=i;}
      }
      chosen.push(remaining.splice(best,1)[0]);
    }
    return chosen;
  }
  function initialize(){
    if(candidates)return;
    candidates=surfaceCandidates();
    cubeGeometry=new THREE.BoxGeometry(1,1,1);
    cubeMaterial=new THREE.MeshStandardMaterial({roughness:.68,metalness:0});
    fragments=new THREE.InstancedMesh(cubeGeometry,cubeMaterial,Math.max(1,candidates.length));
    fragments.name='resolve_cube_fragments';fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    fragments.frustumCulled=false;fragments.castShadow=false;fragments.receiveShadow=false;fragments.count=0;
    container.add(fragments);
  }
  function clear(){
    progress.value=-1;container.visible=false;live=0;leased=0;lastTime=-1;timeline=-1;currentClip=null;budget.release(container);
    if(fragments)fragments.count=0;
  }
  function setState(clipName,time=0,duration=1){
    if(disposed)return;
    const assemble=!!spec.assembleClip&&clipName===spec.assembleClip;
    if(!enabled||(clipName!==spec.clip&&!assemble)||!Number.isFinite(time)||!Number.isFinite(duration)||duration<=0){clear();return;}
    timeline=clamp(time/duration);currentClip=clipName;
    // Canonicalize the timeline so forward/reverse subtraction selects the same
    // grid cells at exact release boundaries, including during timeline scrubs.
    const p=Math.round((assemble?1-timeline:timeline)*1e9)/1e9;progress.value=p;lastTime=p;
    if(p<.16||p>=1){budget.release(container);leased=0;live=0;container.visible=false;if(fragments)fragments.count=0;return;}
    leased=budget.acquire(container,spec.maxFragments);
    if(!leased){live=0;container.visible=false;if(fragments)fragments.count=0;return;}
    initialize();leased=Math.min(leased,candidates.length);
    root.updateMatrixWorld(true);container.updateWorldMatrix(true,false);inv.copy(container.matrixWorld).invert();
    live=0;
    for(let i=0;i<leased;i++){
      const f=candidates[i],age=(p-f.birth)/.30;
      if(age<0||age>=1)continue;
      point.set(0,0,0);
      f.ids.forEach((id,k)=>point.addScaledVector(f.mesh.getVertexPosition(id,local),f.weights[k]));
      point.applyMatrix4(f.mesh.matrixWorld).applyMatrix4(inv);
      // Travel is in asset-local axes, then transformed into the effect parent.
      const travel=new THREE.Vector3((f.position.x-restBounds.getCenter(local).x)*(.25+.16*f.seed),height*(.30+.16*f.seed),(f.position.z-restBounds.getCenter(local).z)*(.25+.16*(1-f.seed))).multiplyScalar(age);
      const basis=new THREE.Matrix4().multiplyMatrices(inv,assetRoot.matrixWorld);
      travel.applyMatrix4(basis).sub(new THREE.Vector3().setFromMatrixPosition(basis));
      dummy.position.copy(point).add(travel);
      dummy.rotation.set(age*(1.2+f.seed),age*(f.seed-.5)*2,age*(.6-f.seed)*2);
      const extent=size*(.66+.18*f.seed)*(1-smooth((age-.50)/.50));
      dummy.scale.setScalar(Math.max(.0001,extent));dummy.updateMatrix();
      // Include actor scale and orientation in each cube without double motion.
      const rotationScale=basis.clone().setPosition(0,0,0);
      const localMatrix=dummy.matrix.clone();localMatrix.setPosition(0,0,0);
      localMatrix.premultiply(rotationScale).setPosition(dummy.position);
      fragments.setMatrixAt(live,localMatrix);fragments.setColorAt(live,f.tint);live++;
    }
    fragments.count=live;fragments.instanceMatrix.needsUpdate=true;if(fragments.instanceColor)fragments.instanceColor.needsUpdate=true;
    container.visible=live>0;
  }
  return {
    object:container, maxTriangles:spec.maxFragments*12,
    prepare(){if(!disposed)initialize();},
    setState,
    setEnabled(value){enabled=!!value;if(!enabled)clear();},
    diagnostics(){return {type:spec.type,enabled,clip:currentClip,timelineProgress:timeline,progress:lastTime,fragments:live,leased,maxFragments:spec.maxFragments,triangles:live*12,complete:timeline>=1,version:DIGITAL_RESOLVE_VERSION};},
    dispose(){if(disposed)return;clear();disposed=true;container.removeFromParent();fragments?.dispose();cubeGeometry?.dispose();cubeMaterial?.dispose();for(const o of originals){o.mesh.material=o.material;o.mesh.customDepthMaterial=o.depth;o.mesh.customDistanceMaterial=o.distance;}patched.forEach(m=>m.dispose());}
  };
}

