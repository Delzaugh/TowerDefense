import {createDigitalResolve, createResolveBudget} from './digital-resolve.js';

const clamp = t => Math.max(0,Math.min(1,t));
const ease = t => {t=clamp(t);return t*t*(3-2*t);};
const phase = (p,a,b) => ease((p-a)/(b-a));

// A timeline-driven presentation layer. Never writes simulation or morph state.
export function createLifecycleEffect(THREE,root,{budget=createResolveBudget()}={}) {
  const assetRoot=root.getObjectByName('root'), spec=assetRoot?.userData.lifecycle_effect;
  if(!spec)return createDigitalResolve(THREE,root,{budget});
  const glitch=spec.type==='glitch_breach', blueprint=spec.type==='blueprint';
  const spawnPortal=glitch&&spec.spawnPortal===true;
  if((!glitch&&!blueprint)||spec.version!==1||!['spawn','place'].includes(spec.entryClip)||spec.exitClip!=='resolve'||
      !/^#[\da-f]{6}$/i.test(spec.color||'')||!Number.isInteger(spec.maxFragments)||spec.maxFragments<0||spec.maxFragments>12||
      (spec.spawnPortal!==undefined&&typeof spec.spawnPortal!=='boolean'))
    throw Error('Invalid lifecycle presentation specification');
  const anchor=root.getObjectByName(spec.anchor);
  if(!anchor)throw Error('Missing lifecycle anchor: '+spec.anchor);
  root.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(anchor.matrixWorld).invert(), meshes=[];
  root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  // Fail before changing any material when an unsupported model is supplied.
  if(meshes.some(o=>(Array.isArray(o.material)?o.material:[o.material]).some(m=>!m.isMeshStandardMaterial)))
    throw Error('Lifecycle effects require standard/physical materials');
  if(spec.stateMorphs!==undefined&&(!Array.isArray(spec.stateMorphs)||spec.stateMorphs.length>8||
      spec.stateMorphs.some(name=>typeof name!=='string'||!meshes.some(m=>m.morphTargetDictionary?.[name]!==undefined))))
    throw Error('Invalid lifecycle state morphs');
  const bounds=new THREE.Box3(), sample=new THREE.Vector3(), projected=[];
  for(const mesh of meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){
    mesh.getVertexPosition(i,sample).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
    bounds.expandByPoint(sample);if(blueprint)projected.push([sample.x,sample.y]);
  }
  const size=bounds.getSize(new THREE.Vector3()), center=bounds.getCenter(new THREE.Vector3());
  if(Math.min(size.x,size.y)<=0)throw Error('Lifecycle effect needs nonzero width and height');
  const uniforms={fxProgress:{value:-1},fxEntry:{value:1},fxColor:{value:new THREE.Color(spec.color)},
    fxMin:{value:bounds.min},fxSize:{value:size}};
  const originals=[], materials=[], geometries=[], transforms=[], morphMasks=[];
  const container=new THREE.Group();container.name='presentation_'+spec.type;container.matrixAutoUpdate=false;container.visible=false;
  let enabled=true,disposed=false,progress=-1,entry=true,clip=null,leased=0,live=0;

  const header=`
    uniform float fxProgress; uniform float fxEntry; uniform vec3 fxColor;
    uniform vec3 fxMin; uniform vec3 fxSize; varying vec3 vLifecycle; varying float vFxVisible;
    float fxEase(float t){t=clamp(t,0.,1.);return t*t*(3.-2.*t);}
    float fxPhase(float a,float b){return fxEase((fxProgress-a)/(b-a));}
    float fxNoise(float n){return fract(sin(n*17.31+4.13)*173.71);}
  `;
  const surface=glitch?`
    vec3 q=(vLifecycle-fxMin)/fxSize;
    float row=floor(q.y*18.);
    float jitter=(fxNoise(row)-.5)*.075;
    float frontier=fxEntry>.5?fxPhase(.10,.75):1.-fxPhase(.18,.78);
    float distanceToEdge=fxEntry>.5 ? abs(q.x-.5+jitter)*2.-frontier*1.16 : q.y+jitter-frontier*1.12;
    if(fxProgress>=0.) {
      if((fxEntry>.5&&fxProgress<=0.)||(fxEntry<.5&&fxProgress>=.82)||distanceToEdge>0.)discard;
    }
  `:`
    vec3 q=(vLifecycle-fxMin)/fxSize;
    float frontier=fxEntry>.5?fxPhase(.20,.86):fxPhase(.22,.80);
    float distanceToEdge=fxEntry>.5?q.y-frontier*1.06:frontier*1.06-q.y;
    if(fxProgress>=0.) {
      if((fxEntry>.5&&fxProgress<=.20)||(fxEntry<.5&&fxProgress>=.84)||distanceToEdge>0.)discard;
    }
  `;
  function patch(material,fromMesh,colored,morphWeights){
    const previous=material.onBeforeCompile;
    material.onBeforeCompile=(shader,renderer)=>{
      previous.call(material,shader,renderer);
      Object.assign(shader.uniforms,uniforms,{fxFromMesh:{value:fromMesh},fxMorphWeights:{value:morphWeights||new Float32Array(8)}});
      shader.vertexShader=`uniform mat4 fxFromMesh; varying vec3 vLifecycle; varying float vFxVisible;
        ${morphWeights?'attribute float fxStateSlot; uniform float fxMorphWeights[8];':''}\n`+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
        `vLifecycle=(fxFromMesh*vec4(transformed,1.)).xyz; vFxVisible=1.;
        ${morphWeights?'if(abs(fxStateSlot)>.5){int slot=int(abs(fxStateSlot)) - 1; float achieved=step(.5,fxMorphWeights[slot]);vFxVisible=fxStateSlot>0.?achieved:1.-achieved;}':''}
        #include <project_vertex>`);
      shader.fragmentShader=header+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif(fxProgress>=0. && vFxVisible<.5)discard;\nif(fxProgress>0. && ((fxEntry>.5 && fxProgress<.94)||(fxEntry<.5 && fxProgress>.15)) && !gl_FrontFacing)discard;\n'+surface);
      if(colored)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        if(fxProgress>=0. && !(fxEntry>.5 && fxProgress>=.94)) {
          float band=1.-smoothstep(0.,.065,abs(distanceToEdge));
          totalEmissiveRadiance+=fxColor*band*.85;
        }
      `);
    };
    material.customProgramCacheKey=()=>spec.type+'-v1-'+colored+'-'+!!morphWeights;
    materials.push(material);return material;
  }
  for(const mesh of meshes){
    const fromMesh=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
    transforms.push({mesh,fromMesh});originals.push({mesh,geometry:mesh.geometry,material:mesh.material,depth:mesh.customDepthMaterial,distance:mesh.customDistanceMaterial});
    let morphWeights=null;
    // Optional authored deployment morphs hide their alternate geometry inside
    // an opaque shell. A cut must not expose unchecked green ticks or retracted
    // empty frames. Read their current state; never change the actual weights.
    const stateNames=spec.stateMorphs?.filter(name=>mesh.morphTargetDictionary?.[name]!==undefined);
    if(stateNames?.length){
      const names=stateNames,slots=new Float32Array(mesh.geometry.attributes.position.count);
      if(names.length>8)throw Error('At most eight lifecycle state morphs');
      const indices=names.map(name=>mesh.morphTargetDictionary[name]);
      indices.forEach((index,slot)=>{
        if(index===undefined)throw Error('Missing lifecycle state morph: '+names[slot]);
        const delta=mesh.geometry.morphAttributes.position[index];
        for(let i=0;i<slots.length;i++)if(Math.abs(delta.getZ(i))>.025)slots[i]=Math.sign(delta.getZ(i))*(slot+1);
      });
      mesh.geometry=mesh.geometry.clone();geometries.push(mesh.geometry);mesh.geometry.setAttribute('fxStateSlot',new THREE.BufferAttribute(slots,1));
      morphWeights=new Float32Array(8);morphMasks.push({mesh,indices,weights:morphWeights});
    }
    const source=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const clones=source.map(m=>patch(m.clone(),fromMesh,true,morphWeights));mesh.material=Array.isArray(mesh.material)?clones:clones[0];
    mesh.customDepthMaterial=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide}),fromMesh,false,morphWeights);
    mesh.customDistanceMaterial=patch(new THREE.MeshDistanceMaterial({side:THREE.DoubleSide}),fromMesh,false,morphWeights);
  }
  const accent=new THREE.MeshBasicMaterial({color:spec.color,side:THREE.DoubleSide,toneMapped:false});materials.push(accent);
  const dark=new THREE.MeshBasicMaterial({color:'#291E36',side:THREE.DoubleSide});materials.push(dark);
  function mesh(geometry,material=accent){geometries.push(geometry);const o=new THREE.Mesh(geometry,material);o.frustumCulled=false;container.add(o);return o;}
  // Solid strips keep outlines and symbols readable from oblique views.
  function strip(points,width,material=accent){
    const vertices=[],uvs=[],indices=[];let length=0;const lengths=[0];
    for(let i=1;i<points.length;i++){length+=new THREE.Vector3(...points[i]).distanceTo(new THREE.Vector3(...points[i-1]));lengths.push(length);}
    for(let i=0;i<points.length;i++){
      const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
      const dx=after[0]-before[0],dy=after[1]-before[1],d=Math.hypot(dx,dy)||1;
      for(const sign of [-1,1]){vertices.push(points[i][0]-sign*dy/d*width/2,points[i][1]+sign*dx/d*width/2,points[i][2]);uvs.push(lengths[i]/length,(sign+1)/2);}
      if(i<points.length-1){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    return mesh(geometry,material);
  }
  const boxGeometry=new THREE.BoxGeometry(1,1,1);geometries.push(boxGeometry);
  function box(){const o=new THREE.Mesh(boxGeometry,accent);container.add(o);return o;}
  const scan=box();scan.name='lifecycle_scan';
  let rift,riftEdges=[],streaks,outline,tick;
  const dummy=new THREE.Object3D();
  if(glitch){
    if(spawnPortal){
    // A serrated vertical tear behind the body; its two rails peel apart.
    const z=bounds.min.z-size.z*.12,railPoints=[];
    for(const sign of [-1,1]){
      const points=Array.from({length:9},(_,i)=>[sign*size.x*(.13+((i*7)%5)*.014)*Math.sin(Math.PI*i/8),size.y*(-.57+i*.143),0]);
      railPoints.push(points);const rail=strip(points,size.x*.012);rail.position.set(center.x,center.y,z);riftEdges.push(rail);
    }
    const vertices=[],indices=[];
    for(let i=0;i<9;i++){vertices.push(...railPoints[0][i],...railPoints[1][i]);if(i<8){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const membrane=new THREE.BufferGeometry();membrane.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));membrane.setIndex(indices);membrane.computeVertexNormals();
    rift=mesh(membrane,dark);rift.position.set(center.x,center.y,z-.003);
    }
    streaks=new THREE.InstancedMesh(boxGeometry,accent,Math.max(1,spec.maxFragments));
    streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);streaks.frustumCulled=false;streaks.name='glitch_streaks';streaks.count=0;container.add(streaks);
  }else{
    // The convex silhouette comes from the actual mesh, including its cut corner.
    const sorted=projected.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
    const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const half=points=>{const h=[];for(const p of points){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=1e-7)h.pop();h.push(p);}return h;};
    const hull=half(sorted).slice(0,-1).concat(half(sorted.slice().reverse()).slice(0,-1));hull.push(hull[0]);
    const outlineMaterial=accent.clone();materials.push(outlineMaterial);
    outlineMaterial.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms);
      shader.vertexShader='varying vec2 vBlueprintUV; varying float vBlueprintY;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBlueprintUV=uv;vBlueprintY=position.y;');
      shader.fragmentShader=header+'varying vec2 vBlueprintUV; varying float vBlueprintY;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
        if(fxProgress<=0. || vBlueprintUV.x>fxPhase(0.,.25))discard;
        if(fxProgress>.20 && (vBlueprintY-fxMin.y)/fxSize.y<fxPhase(.20,.86)*1.06)discard;
      `);
    };
    outlineMaterial.customProgramCacheKey=()=> 'blueprint-outline-v1';
    outline=strip(hull.map(([x,y])=>[x,y,bounds.max.z+.012]),size.x*.015,outlineMaterial);outline.name='blueprint_outline';
    tick=strip([[-.19*size.x,0,0],[-.055*size.x,-.12*size.x,0],[.23*size.x,.20*size.x,0]],size.x*.064);
    tick.position.set(center.x,bounds.max.y+size.y*.13,bounds.max.z+.025);tick.name='completion_check';
  }
  function reset(){
    progress=-1;clip=null;live=leased=0;uniforms.fxProgress.value=-1;container.visible=false;budget.release(container);if(streaks)streaks.count=0;
  }
  function setState(name,time=0,duration=1){
    if(disposed)return;
    if(!enabled||![spec.entryClip,spec.exitClip].includes(name)||!Number.isFinite(time)||!Number.isFinite(duration)||duration<=0){reset();return;}
    clip=name;entry=name===spec.entryClip;progress=clamp(time/duration);
    uniforms.fxProgress.value=progress;uniforms.fxEntry.value=entry?1:0;
    root.updateMatrixWorld(true);inverse.copy(anchor.matrixWorld).invert();
    for(const item of transforms)item.fromMesh.multiplyMatrices(inverse,item.mesh.matrixWorld);
    for(const state of morphMasks)state.indices.forEach((index,i)=>state.weights[i]=state.mesh.morphTargetInfluences[index]);
    container.parent?.updateWorldMatrix(true,false);
    container.matrix.copy(container.parent?.matrixWorld||new THREE.Matrix4()).invert().multiply(anchor.matrixWorld);container.matrixWorldNeedsUpdate=true;
    const p=progress, active=p>0&&p<1;container.visible=active;live=0;
    if(glitch){
      const opening=phase(p,.025,.45)*(1-phase(p,.62,.91));
      if(rift){rift.visible=entry&&active;rift.scale.set(opening,phase(p,0,.11),1);}
      riftEdges.forEach(rail=>{rail.visible=entry&&active;rail.scale.set(opening,phase(p,0,.11),1);});
      scan.visible=!entry&&p>.18&&p<.8;
      scan.position.set(center.x,bounds.min.y+size.y*1.12*(1-phase(p,.18,.78)),bounds.max.z+.012);
      scan.scale.set(size.x*1.04,size.y*.012,Math.max(.012,size.z*.015));
      if(!entry&&p>.18&&p<.98){leased=budget.acquire(container,spec.maxFragments);}else{budget.release(container);leased=0;}
      for(let i=0;i<leased;i++){
        const y=(i+.5)/Math.max(1,leased),born=.18+.60*(1-y),age=(p-born)/.19;
        if(age<0||age>=1)continue;
        const sign=i%2?1:-1,envelope=Math.sin(Math.PI*age);
        dummy.position.set(center.x+sign*size.x*(.08+age*.65),bounds.min.y+y*size.y+size.y*.035*age,bounds.max.z+size.z*.02);
        dummy.rotation.set(0,sign*.12,0);dummy.scale.set(size.x*(.16+(i%3)*.055)*envelope,size.y*.012*(1-age),Math.max(.009,size.z*.012));dummy.updateMatrix();streaks.setMatrixAt(live++,dummy.matrix);
      }
      streaks.count=live;streaks.instanceMatrix.needsUpdate=true;
    }else{
      outline.visible=entry&&p<.86;tick.visible=!entry&&p>.04&&p<.94;
      const checkScale=phase(p,.04,.20)*(1-phase(p,.76,.94));tick.scale.setScalar(checkScale);
      const frontier=entry?phase(p,.20,.86):phase(p,.22,.80);
      scan.visible=entry?p>.20&&p<.86:p>.22&&p<.80;
      scan.position.set(center.x,bounds.min.y+size.y*frontier*1.06,bounds.max.z+.020);
      scan.scale.set(size.x*1.04,size.y*.010,Math.max(.010,size.z*.06));
    }
  }
  const maxTriangles=glitch?Math.max(spawnPortal?48:0,12*spec.maxFragments+12):Math.max(outline.geometry.index.count/3+12,4+12);
  return {
    object:container,maxTriangles,label:glitch?'Glitch breach':'Blueprint',prepare(){},setState,
    setEnabled(value){enabled=!!value;if(!enabled)reset();},
    diagnostics(){return {type:spec.type,version:1,enabled,clip,progress,timelineProgress:progress,complete:progress>=1,fragments:live,leased,maxFragments:spec.maxFragments,triangles:container.visible?container.children.filter(o=>o.visible).reduce((n,o)=>n+(o.isInstancedMesh?o.count:1)*(o.geometry.index?.count||o.geometry.attributes.position.count)/3,0):0};},
    dispose(){if(disposed)return;reset();disposed=true;container.removeFromParent();streaks?.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());for(const o of originals){o.mesh.geometry=o.geometry;o.mesh.material=o.material;o.mesh.customDepthMaterial=o.depth;o.mesh.customDistanceMaterial=o.distance;}}
  };
}
