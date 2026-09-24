import * as THREE from 'three';
import {cloneActor} from '/TowerDefense/stress-load.js';
import {MODELS,TOWER_TYPES,DEFAULT_SETTINGS,enemyCap} from './config.js';
import {createWaveSchedule} from './schedule.js';

export function createActors(scene,map,models,initialSettings=DEFAULT_SETTINGS){
 const root=new THREE.Group();scene.add(root);
 let settings={...DEFAULT_SETTINGS,...initialSettings,maxEnemies:enemyCap(initialSettings.maxEnemies)};
 const towers=[],manual=[],specials=[],pool=[],assigned=new Map();let schedule=createWaveSchedule(map.route.length,settings.maxEnemies),running=false,time=0;
 const specFor=id=>MODELS.find(m=>m.id===id);
 const enemySpecs=MODELS.filter(m=>m.enemy);
 const metadata=MODELS.map(spec=>{
  let triangles=0,meshes=0;models.get(spec.id).scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  return {...spec,triangles,meshes};
 });
 function make(spec){
  const gltf=models.get(spec.id),model=cloneActor(gltf.scene),actor=new THREE.Group();actor.add(model);root.add(actor);
  actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const clip=spec.clip?THREE.AnimationClip.findByName(gltf.animations,spec.clip):null;if(spec.clip&&!clip)throw new Error(`${spec.id}: missing ${spec.clip}`);
  const mixer=new THREE.AnimationMixer(model),action=clip?mixer.clipAction(clip):null;action?.play();
  return {spec,model,actor,mixer,action};
 }
 function dispose(a){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);const skeletons=new Set();a.model.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());root.remove(a.actor);}
 function setSpecials(){
  specials.forEach(dispose);specials.length=0;
  const destination=map.route.at(map.route.length).point;
  if(settings.octocat)for(let i=0;i<2;i++){const a=make(specFor('github_octocat_classic_lowpoly')),x=destination.x-3+i*4,z=destination.z+5;a.actor.position.set(x,map.heightAt(x,z)+.2,z);a.actor.rotation.y=Math.PI;specials.push(a);}
 }
 function setTowers(count){
  if(![20,35,50].includes(count))throw new Error('Choose 20, 35 or 50 towers');
  towers.forEach(dispose);towers.length=0;
  let regular=0;
  map.towerSlots(count).forEach((slot,i)=>{
   const isBert=settings.bert&&(i===0||i===Math.floor(count/2));
   const id=isBert?'bert_breugelmans':regular++%2?'copilot_base':'copilot_developer';
   const a=make(specFor(id));a.actor.position.copy(slot.point);a.actor.position.y+=.18;a.actor.rotation.y=slot.heading;
   a.homeHeading=slot.heading;towers.push(a);
  });
  ensureBeamCapacity();
 }
 function setSettings(next){if(running)throw new Error('Settings are locked during a recording');settings={bert:!!next.bert,octocat:!!next.octocat,maxEnemies:enemyCap(next.maxEnemies)};setTowers(towers.length||35);setSpecials();schedule=createWaveSchedule(map.route.length,settings.maxEnemies);}
 let positions=new Float32Array(50*6);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setDrawRange(0,0);
 const beams=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xd7fff5,transparent:true,opacity:.65}));beams.frustumCulled=false;scene.add(beams);
 function ensureBeamCapacity(){if(positions.length>=(towers.length+manual.length)*6)return;positions=new Float32Array(Math.max(positions.length*2,(towers.length+manual.length)*6));geometry.dispose();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));}
 function occupied(x,z){return [...towers,...manual,...specials].some(a=>Math.hypot(a.actor.position.x-x,a.actor.position.z-z)<2.8);}
 function addTower(id,x,z){if(running)throw new Error('Finish recording before placing towers');const spec=TOWER_TYPES.find(t=>t.id===id);if(!spec||![x,z].every(Number.isFinite))return null;
  if(!map.placementAt(x,z).valid||occupied(x,z))return null;const a=make(spec);a.actor.position.set(x,map.heightAt(x,z)+.18,z);a.actor.rotation.y=Math.PI/4;a.homeHeading=Math.PI/4;manual.push(a);ensureBeamCapacity();return a.actor;
 }
 function undoTower(){if(running||!manual.length)return false;dispose(manual.pop());return true;}
 function clearTowers(){if(running)return;manual.forEach(dispose);manual.length=0;}
 function clearEnemies(){pool.forEach(dispose);pool.length=0;assigned.clear();geometry.setDrawRange(0,0);running=false;schedule=createWaveSchedule(map.route.length,settings.maxEnemies);}
 function warm(){enemySpecs.forEach((spec,i)=>{const a=make(spec);a.actor.position.copy(map.route.at(12+i*3).point);a.actor.position.y+=.22;pool.push(a);});}
 function start(){clearEnemies();time=0;running=true;}
 function update(dt){
  if(!running)return;time+=dt;schedule.update(dt);
  const live=new Set(schedule.active.map(e=>e.id));
  for(const [id,a] of assigned)if(!live.has(id)){a.actor.visible=false;a.busy=false;assigned.delete(id);}
  for(const e of schedule.active){
   let a=assigned.get(e.id);if(!a){a=pool.find(a=>!a.busy&&a.spec.id===enemySpecs[e.kind].id);if(!a){a=make(enemySpecs[e.kind]);pool.push(a);}a.busy=true;a.actor.visible=true;assigned.set(e.id,a);}
   const pose=map.route.at(e.distance,e.lane);a.actor.position.copy(pose.point);a.actor.position.y+=.22;a.actor.rotation.y=pose.heading;a.mixer.setTime(time*e.speedFactor+e.id*.137);
  }
  let vertices=0;
  [...towers,...manual].forEach((a,i)=>{
   a.mixer.setTime(time+i*.137);let closest=null,best=16*16;
   for(const enemy of assigned.values()){const d=a.actor.position.distanceToSquared(enemy.actor.position);if(d<best){best=d;closest=enemy;}}
   if(closest){const d=closest.actor.position.clone().sub(a.actor.position);a.actor.rotation.y=Math.atan2(d.x,d.z);
    if((time+i*.11)%1.1<.13){positions.set([a.actor.position.x,a.actor.position.y+1.5,a.actor.position.z,closest.actor.position.x,closest.actor.position.y+.8,closest.actor.position.z],vertices*3);vertices+=2;}
   }
  });
  specials.forEach((a,i)=>a.mixer.setTime(time+i*.5));geometry.setDrawRange(0,vertices);geometry.attributes.position.needsUpdate=true;
 }
 function state(){
  const composition=metadata.map(m=>({...m,count:m.enemy?[...assigned.values()].filter(a=>a.spec.id===m.id).length:m.id==='github_octocat_classic_lowpoly'?specials.length:[...towers,...manual].filter(a=>a.spec.id===m.id).length}));
  return {...schedule.state(),running,settings:{...settings},towers:towers.length,manualTowers:manual.length,totalTowers:towers.length+manual.length,beamCapacity:positions.length/6,placedTowers:manual.map(a=>({id:a.spec.id,position:a.actor.position.toArray()})),heavyTowers:towers.filter(a=>a.spec.id==='bert_breugelmans').length,octocats:specials.length,composition,
   allocatedEnemies:pool.length,attackClip:'work',developerAnimation:'static export; runtime aiming and attack lines',attackAnimationSamples:towers.filter(a=>a.action).slice(0,2).map(a=>({id:a.spec.id,time:a.action.time,playing:a.action.isRunning()})),manualAnimationSamples:manual.filter(a=>a.action).slice(0,4).map(a=>({id:a.spec.id,time:a.action.time,playing:a.action.isRunning()})),beamVertices:geometry.drawRange.count,
   enemyPositions:schedule.active.map(e=>({id:e.id,kind:enemySpecs[e.kind].id,distance:e.distance,speedFactor:e.speedFactor,speed:e.speed,position:assigned.get(e.id)?.actor.position.toArray()})),
   towerPositions:towers.map(a=>({id:a.spec.id,position:a.actor.position.toArray()}))};
 }
 setTowers(35);
 setSpecials();
 return {setSettings,setTowers,addTower,undoTower,clearTowers,occupied,start,update,clearEnemies,warm,state,telemetry:()=>({enemyCount:schedule.state().active,wave:schedule.state().wave,queued:schedule.state().queued,manualTowers:manual.length,totalTowers:towers.length+manual.length})};
}
