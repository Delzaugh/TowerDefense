import * as THREE from 'three';
import {STRESS_ASSETS} from './stress-config.js';

// Clone rigs independently while sharing immutable geometry, materials and clips.
export function cloneActor(source){
 const root=source.clone(true),copies=new Map();
 function pair(a,b){copies.set(a,b);a.children.forEach((child,i)=>pair(child,b.children[i]));}
 pair(source,root);
 source.traverse(original=>{
  if(!original.isSkinnedMesh)return;
  const mesh=copies.get(original);mesh.skeleton=original.skeleton.clone();
  mesh.skeleton.bones=original.skeleton.bones.map(bone=>{
   const copy=copies.get(bone);if(!copy)throw new Error('Stress model has a bone outside its root');return copy;
  });
  mesh.bind(mesh.skeleton,original.bindMatrix);
 });
 return root;
}
function describe(gltf,spec){
 let triangles=0,meshes=0,skinnedMeshes=0;const materials=new Set();
 gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes++;if(o.isSkinnedMesh)skinnedMeshes++;
  triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
  for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
 });
 return {...spec,triangles,meshes,skinnedMeshes,materials:materials.size,scale:1};
}
export function createStressLoad(scene,loader,models){
 const group=new THREE.Group();group.name='temporary_stress_load';scene.add(group);
 const actors=[];let towers=0,movers=0,heavyTowers=0,time=0,assets=[];
 async function prepare(signal){
  await Promise.all(STRESS_ASSETS.map(async spec=>{
   if(!models.has(spec.id))models.set(spec.id,await loader.loadAsync(spec.url));
  }));
  signal.throwIfAborted();
  assets=STRESS_ASSETS.map(spec=>{
   const gltf=models.get(spec.id);
   if(!THREE.AnimationClip.findByName(gltf.animations,spec.clip))throw new Error(`${spec.id} requires clip ${spec.clip}`);
   return describe(gltf,spec);
  });
 }
 function clear(){
  for(const a of actors){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);
   const skeletons=new Set();a.model.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});
   skeletons.forEach(s=>s.dispose());
  }
  actors.length=0;group.clear();towers=0;movers=0;heavyTowers=0;time=0;
 }
 function add(spec,index,moving){
  const gltf=models.get(spec.id),clipName=spec.clip;
  const model=cloneActor(gltf.scene),actor=new THREE.Group();actor.add(model);group.add(actor);
  actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const clip=THREE.AnimationClip.findByName(gltf.animations,clipName);
  if(!clip)throw new Error(`Stress fixture requires ${clipName}`);
  const mixer=new THREE.AnimationMixer(model),action=mixer.clipAction(clip);action.setLoop(THREE.LoopRepeat,Infinity).play();
  actor.name=`stress_${spec.id}_${index}`;
  actors.push({actor,model,mixer,action,spec,index,moving,offset:index*.137});
 }
 function setLoad(spec){
  clear();towers=spec.towers;movers=spec.movers;heavyTowers=spec.heavyTowers??0;
  const tower=STRESS_ASSETS.find(a=>a.role==='tower'),heavy=STRESS_ASSETS.find(a=>a.role==='heavyTower');
  const movingModels=STRESS_ASSETS.filter(a=>a.role==='mover');
  for(let i=0;i<towers;i++)add(heavyTowers===2&&(i===0||i===Math.floor(towers/2))?heavy:tower,i,false);
  for(let i=0;i<movers;i++)add(movingModels[i%movingModels.length],i,true);
  update(0);
 }
 function update(delta){
  time+=delta;
  for(const a of actors){
   a.mixer.setTime(time+a.offset);
   if(a.moving){
    const angle=2*Math.PI*a.index/Math.max(movers,1)+time*.12,radius=19+(a.index%5)*2.2;
    a.actor.position.set(Math.sin(angle)*radius,1.28,Math.cos(angle)*radius);
    a.actor.rotation.y=angle+Math.PI/2;
   }else{
    // Two stationary rings face the moving lanes. Keep the two heavier towers apart.
    const angle=2*Math.PI*a.index/towers,radius=a.index%2?34:13;
    a.actor.position.set(Math.sin(angle)*radius,1.28,Math.cos(angle)*radius);
    a.actor.rotation.y=angle+(radius>28?Math.PI:0);
   }
  }
 }
 function state(){
  const composition=assets.map(asset=>({...asset,count:actors.filter(a=>a.spec.id===asset.id).length}));
  const animationSamples=composition.filter(a=>a.count).map(asset=>{
   const a=actors.find(a=>a.spec.id===asset.id);
   return {id:asset.id,clip:a.action.getClip().name,clipTime:a.action.time,clipDuration:a.action.getClip().duration,
    playing:a.action.isRunning(),loop:'repeat',position:a.actor.position.toArray()};
  });
  return {towers,movers,heavyTowers,time,actors:actors.length,assets:composition,animationSamples,
   attackingTowers:actors.filter(a=>!a.moving&&a.action.isRunning()).length,
   addedModelTriangles:composition.reduce((sum,a)=>sum+a.count*a.triangles,0),
   towerBudgetReferenceTriangles:towers*3000,instanced:false,independentAnimationMixers:actors.length};
 }
 return {prepare,setLoad,update,clear,state};
}
