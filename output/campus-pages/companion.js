import * as THREE from 'three';

// Decorative home-screen motion only. No gameplay state or save data is involved.
// Blender supplies the original hover pose; this presentation owns the stroll path.
export const STROLL={travel:7,pause:.5,turn:1.5,leg:9.5,cycle:19};
const smooth=t=>t*t*(3-2*t);
export function strollPose(time,left,right){
  const t=((time%STROLL.cycle)+STROLL.cycle)%STROLL.cycle;
  const returning=t>=STROLL.leg,phase=t%STROLL.leg;
  const start=returning?right:left,end=returning?left:right;
  const progress=smooth(Math.min(phase/STROLL.travel,1));
  const turn=smooth(THREE.MathUtils.clamp((phase-STROLL.travel-STROLL.pause)/STROLL.turn,0,1));
  const heading=returning?-Math.PI/2+Math.PI*turn:Math.PI/2-Math.PI*turn;
  return {position:new THREE.Vector3().lerpVectors(start,end,progress),heading,phase:phase<STROLL.travel?'travelling':phase<STROLL.travel+STROLL.pause?'resting':phase<STROLL.travel+STROLL.pause+STROLL.turn?'turning':'resting'};
}
export function createCompanion(gltf,campus,route){
  const actor=new THREE.Group();actor.name='campus_companion';actor.add(gltf.scene);
  // Preserve the canonical model at 1:1 metre scale, including its authored hover lift.
  const left=new THREE.Vector3().fromArray(route.left);
  const right=new THREE.Vector3().fromArray(route.right);
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const clip=THREE.AnimationClip.findByName(gltf.animations,'idle');
  if(!clip)throw new Error('Copilot v02 requires its authored idle hover clip');
  const action=mixer.clipAction(clip);action.play();
  let time=3.5,pose;
  function setTime(value){time=value;pose=strollPose(time,left,right);actor.position.copy(pose.position);actor.rotation.y=pose.heading;mixer.setTime(time);actor.updateMatrixWorld(true);}
  function sampleAudit(){
    const saved=time;actor.position.set(0,0,0);actor.rotation.y=0;action.stop();actor.updateMatrixWorld(true);
    const rest=new THREE.Box3().setFromObject(actor,true);const restDimensions=rest.getSize(new THREE.Vector3()).toArray();action.play();
    const envelope=new THREE.Box3();
    // Sample the entire authored loop at 48 Hz, including both loop endpoints.
    for(let i=0;i<=120;i++){mixer.setTime(clip.duration*i/120);actor.updateMatrixWorld(true);envelope.union(new THREE.Box3().setFromObject(actor,true));}
    const min=campus.getObjectByName('anchor_door_min').getWorldPosition(new THREE.Vector3());
    const max=campus.getObjectByName('anchor_door_max').getWorldPosition(new THREE.Vector3());
    const width=max.x-min.x,height=max.y-min.y;
    const hoverSize=envelope.getSize(new THREE.Vector3());
    const marginLeft=width/2+envelope.min.x,marginRight=width/2-envelope.max.x;
    const headroom=height-envelope.max.y;
    const pathEnvelope=new THREE.Box3();
    for(let i=0;i<=190;i++){setTime(STROLL.cycle*i/190);pathEnvelope.union(new THREE.Box3().setFromObject(actor,true));}
    const audit={asset:'copilot_base',version:'v02',scale:actor.scale.toArray(),restDimensions,hoverEnvelope:{min:envelope.min.toArray(),max:envelope.max.toArray(),dimensions:hoverSize.toArray()},door:{width,height,threshold:min.y,marginLeft,marginRight,headroom,fits:marginLeft>=.2&&marginRight>=.2&&headroom>=.25},path:{...route,envelope:{min:pathEnvelope.min.toArray(),max:pathEnvelope.max.toArray()},fits:pathEnvelope.min.z>=route.minZ&&pathEnvelope.max.z<=route.maxZ},samples:{hover:121,stroll:191}};
    setTime(saved);return audit;
  }
  function poseAtDoor(value=0){mixer.setTime(value);const min=campus.getObjectByName('anchor_door_min').getWorldPosition(new THREE.Vector3());const max=campus.getObjectByName('anchor_door_max').getWorldPosition(new THREE.Vector3());actor.position.set((min.x+max.x)/2,min.y,min.z+1.15);actor.rotation.y=0;actor.updateMatrixWorld(true);}
  setTime(time);
  return {actor,mixer,clip,setTime,poseAtDoor,sampleAudit,update:delta=>setTime(time+delta),state:()=>({time,position:actor.position.toArray(),heading:actor.rotation.y,phase:pose.phase,clip:clip.name,clipTime:action.time,scale:actor.scale.toArray()})};
}

