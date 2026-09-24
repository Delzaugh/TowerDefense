import * as THREE from 'three';

export const GUEST_IDS=['github_octocat_classic_lowpoly','problem_lag_spike'];
export function createCampusGuests(scene,models){
 const people=models.map((gltf,i)=>{
  const actor=new THREE.Group();actor.name=GUEST_IDS[i];actor.add(gltf.scene);scene.add(actor);
  actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const actions=new Map(gltf.animations.map(clip=>{const action=mixer.clipAction(clip);action.play();action.setEffectiveWeight(0);return [clip.name,action];}));
  return {actor,model:gltf.scene,mixer,actions,activity:''};
 });
 let time=0,reduced=false;
 const smooth=t=>t*t*(3-2*t);
 const route=[[3,22],[4,21.5],[4,17]],lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1])),routeLength=lengths.reduce((a,b)=>a+b,0);
 const angle=(a,b,u)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*u;
 function octocatWalk(progress,returning){
  const points=returning?[...route].reverse():route,spans=returning?[...lengths].reverse():lengths;
  let distance=smooth(progress)*routeLength,index=0;
  while(index<spans.length-1&&distance>spans[index])distance-=spans[index++];
  const a=points[index],b=points[index+1],u=distance/spans[index];
  let heading=Math.atan2(b[0]-a[0],b[1]-a[1]);
  if(index>0&&distance<.5){const prev=points[index-1];heading=angle(Math.atan2(a[0]-prev[0],a[1]-prev[1]),heading,.5+.5*smooth(distance/.5));}
  if(index<spans.length-1&&spans[index]-distance<.5){const next=points[index+2];heading=angle(heading,Math.atan2(next[0]-b[0],next[1]-b[1]),.5*smooth(1-(spans[index]-distance)/.5));}
  heading=angle(returning?0:-Math.PI/2,heading,smooth(Math.min(1,progress*28)));
  if(returning)heading=angle(heading,-Math.PI/2,smooth(Math.max(0,1-(1-progress)*28)));
  return {x:THREE.MathUtils.lerp(a[0],b[0],u),z:THREE.MathUtils.lerp(a[1],b[1],u),heading,distance:smooth(progress)*routeLength};
 }
 function setTime(t,reduce=false){
  time=t;reduced=reduce;
  people.forEach((p,i)=>{
   p.actions.forEach(a=>a.setEffectiveWeight(0));
   let clip='idle',clipTime=reduce?0:t,walkWeight=1;
   if(i===0){
    p.actor.position.set(3,1.28,22);p.actor.rotation.y=-Math.PI/2;
    const phase=t%96;
    if(!reduce&&phase>=15&&phase<17.5){clip='wave';clipTime=phase-15;}
    p.activity=clip==='wave'?'greeting at the coffee stand':'waiting for coffee';
    const returning=phase>=58&&phase<86,moving=phase>=18&&phase<46||returning;
    if(moving){
     const progress=(phase-(returning?58:18))/28,pose=octocatWalk(progress,returning);
     p.actor.position.set(pose.x,1.28,pose.z);p.actor.rotation.y=pose.heading;
     p.activity=returning?'walking back for coffee':'walking through the garden';
     if(!reduce){
      clip='move';
      // The source stance travels 0.24 source units per half-cycle, scaled by 0.58517.
      // Integrate clip phase from distance, so gait slows together with route motion.
      clipTime=(pose.distance+(returning?routeLength:0))/(.48*.5851744927)*p.actions.get('move').getClip().duration;
      walkWeight=smooth(Math.min(1,progress*28,(1-progress)*28));
     }
    }else if(phase>=46&&phase<58){p.actor.position.set(4,1.28,17);p.actor.rotation.y=Math.PI+Math.PI*smooth((phase-46)/12);p.activity='enjoying the garden';}
   }else{
    const phase=t%32;
    const moving=phase<10||(phase>=16&&phase<26);
    const u=phase<10?smooth(phase/10):phase<16?1:phase<26?1-smooth((phase-16)/10):0;
    p.actor.position.set(4,1.28,24+7*u);
    p.actor.rotation.y=phase<10?0:phase<16?Math.PI*smooth((phase-10)/6):phase<26?Math.PI:Math.PI+Math.PI*smooth((phase-26)/6);
    if(moving&&!reduce){clip='move';clipTime=t*.65;}
    p.activity=moving?'strolling through the park':'taking in the garden';
   }
   p.actions.get(clip).setEffectiveWeight(walkWeight);if(clip==='move'&&walkWeight<1)p.actions.get('idle').setEffectiveWeight(1-walkWeight);
   p.mixer.setTime(clipTime);p.actor.updateMatrixWorld(true);
  });
 }
 function audit(campus){
  const saved=time,reduce=reduced,problems=[];
  const obstacles=campus.children.filter(o=>!o.userData.campusTile&&!o.name.startsWith('campus_walk_')).map(o=>({name:o.name,box:new THREE.Box3().setFromObject(o)}));
  const ray=new THREE.Raycaster(),terrain=campus.children.filter(o=>o.userData.campusTile);
  for(let step=0;step<=384;step++){
   setTime(step/4);
   const boxes=people.map(p=>new THREE.Box3().setFromObject(p.model,true));
   if(boxes[0].intersectsBox(boxes[1]))problems.push({time:step/4,type:'guest overlap'});
   people.forEach((p,i)=>{
    for(const obstacle of obstacles)if(boxes[i].intersectsBox(obstacle.box))problems.push({time:step/4,guest:p.actor.name,obstacle:obstacle.name});
    ray.set(new THREE.Vector3(p.actor.position.x,30,p.actor.position.z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(terrain,true)[0];if(!hit||Math.abs(hit.point.y-1.2)>.025)problems.push({time:step/4,guest:i,type:'terrain'});
   });
  }
  setTime(saved,reduce);return {passed:!problems.length,samples:385,problems};
 }
 setTime(0);
 return {setTime,audit,state:()=>({time,reducedMotion:reduced,characters:people.map(p=>({id:p.actor.name,position:p.actor.position.toArray(),scale:p.actor.scale.toArray(),activity:p.activity}))})};
}

