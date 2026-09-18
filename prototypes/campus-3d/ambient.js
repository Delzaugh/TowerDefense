import * as THREE from 'three';

export const AMBIENT_CYCLE=120;
const ease=t=>t*t*(3-2*t);
const segmentsA=[
 [0,10,'heading for coffee',[[28,5],[28,9],[26.1,9]],-Math.PI/2],
 [10,18,'coffee stop',[[26.1,9]],-Math.PI/2],
 [18,30,'walking to the plaza',[[26.1,9],[28,9],[28,17.6]],0],
 [30,44,'conversation',[[28,17.6]],0],
 [44,50,'finishing the conversation',[[28,17.6]],0],
 [50,66,'walking to the café table',[[28,17.6],[28,27.6],[25.5,27.6]],-2.17],
 [66,82,'café table break',[[25.5,27.6]],-2.17],
 [82,106,'heading back',[[25.5,27.6],[28,27.6],[28,5]],Math.PI],
 [106,120,'watching the campus',[[28,5]],Math.PI]
];
const segmentsB=[
 [0,12,'visiting the noticeboard',[[28,20.2],[30.5,20.2],[30.5,12]],Math.PI/2],
 [12,22,'reading notices',[[30.5,12]],Math.PI/2],
 [22,30,'joining a friend',[[30.5,12],[30.5,20.2],[28,20.2]],Math.PI],
 [30,44,'conversation',[[28,20.2]],Math.PI],
 [44,58,'visiting the sculpture',[[28,20.2],[30.5,20.2],[30.5,17]],Math.PI/2],
 [58,78,'admiring the sculpture',[[30.5,17]],Math.PI/2],
 [78,92,'visiting the noticeboard',[[30.5,17],[30.5,12]],Math.PI/2],
 [92,106,'reading notices',[[30.5,12]],Math.PI/2],
 [106,120,'returning to the plaza',[[30.5,12],[30.5,20.2],[28,20.2]],Math.PI]
];
export function routinePose(time,index){
 const t=((time%AMBIENT_CYCLE)+AMBIENT_CYCLE)%AMBIENT_CYCLE,segments=index?segmentsB:segmentsA;
 const segmentIndex=segments.findIndex(s=>t>=s[0]&&t<s[1]);
 const [start,end,activity,points,restHeading]=segments[segmentIndex];
 if(points.length===1)return {position:[points[0][0],1.28,points[0][1]],heading:restHeading,activity};
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let distance=ease((t-start)/(end-start))*lengths.reduce((a,b)=>a+b,0),indexInPath=0;
 while(indexInPath<lengths.length-1&&distance>lengths[indexInPath])distance-=lengths[indexInPath++];
 const a=points[indexInPath],b=points[indexInPath+1],u=distance/lengths[indexInPath];
 let heading=Math.atan2(b[0]-a[0],b[1]-a[1]);
 const angle=(a,b,u)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*u;
 if(indexInPath>0&&distance<.6){const prev=points[indexInPath-1];heading=angle(Math.atan2(a[0]-prev[0],a[1]-prev[1]),heading,.5+.5*ease(distance/.6));}
 else if(indexInPath<lengths.length-1&&lengths[indexInPath]-distance<.6){const next=points[indexInPath+2];heading=angle(heading,Math.atan2(next[0]-b[0],next[1]-b[1]),.5*ease(1-(lengths[indexInPath]-distance)/.6));}
 const priorHeading=segments[(segmentIndex+segments.length-1)%segments.length][4];
 heading=angle(priorHeading,heading,ease(Math.min(1,(t-start)/.8)));
 // Ease into the stationary interaction's facing at the end of each walk.
 const turn=ease(THREE.MathUtils.clamp((t-(end-.8))/.8,0,1));
 heading+=Math.atan2(Math.sin(restHeading-heading),Math.cos(restHeading-heading))*turn;
 return {position:[THREE.MathUtils.lerp(a[0],b[0],u),1.28,THREE.MathUtils.lerp(a[1],b[1],u)],heading,activity};
}

export function createAmbientCampus({scene,campus,models,visitors,camera,canvas}){
 const group=new THREE.Group();group.name='campus_ambient';scene.add(group);
 const plants=[];
 campus.children.forEach((instance,index)=>{
  const clips=models.get(instance.name)?.animations||[],clip=THREE.AnimationClip.findByName(clips,'idle');
  if(!clip)return;
  let animatedMesh;instance.traverse(o=>{if(o.isMesh&&o.morphTargetInfluences)animatedMesh=o;});
  // Placement groups share the asset ID; bind the clip to the actual morph mesh.
  const mixer=new THREE.AnimationMixer(animatedMesh||instance);mixer.clipAction(clip).play();plants.push({instance,mixer,phase:index*.47});
 });
 const speechCanvas=document.createElement('canvas');speechCanvas.width=192;speechCanvas.height=112;
 const speech=speechCanvas.getContext('2d');speech.fillStyle='#f3e8d3';speech.beginPath();speech.roundRect(6,6,180,82,28);speech.fill();speech.beginPath();speech.moveTo(62,80);speech.lineTo(72,107);speech.lineTo(102,80);speech.fill();speech.fillStyle='#405669';for(const x of [56,96,136]){speech.beginPath();speech.arc(x,46,9,0,Math.PI*2);speech.fill();}
 const speechTexture=new THREE.CanvasTexture(speechCanvas);speechTexture.colorSpace=THREE.SRGBColorSpace;
 const people=visitors.map((gltf,index)=>{
  const actor=new THREE.Group();actor.name='campus_visitor_'+index;actor.add(gltf.scene);group.add(actor);
  actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const mixer=new THREE.AnimationMixer(gltf.scene),clip=THREE.AnimationClip.findByName(gltf.animations,'idle');mixer.clipAction(clip).play();
  const dots=new THREE.Sprite(new THREE.SpriteMaterial({map:speechTexture,transparent:true,opacity:.9,depthWrite:false,toneMapped:false}));dots.name='conversation_cue';actor.add(dots);dots.position.y=3.05;dots.scale.set(1.7,1,1);
  return {actor,model:gltf.scene,mixer,dots,pose:null};
 });
 // Soft billboard wisps stay readable in an overview and avoid faceted smoke balls.
 const steam=[];
 const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=64;const ctx=steamCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,255,0.85)');gradient.addColorStop(.4,'rgba(255,255,255,0.5)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const steamTexture=new THREE.CanvasTexture(steamCanvas);steamTexture.colorSpace=THREE.SRGBColorSpace;
 for(const instance of campus.children.filter(o=>['campus_cafe_table','campus_coffee_kiosk'].includes(o.name))){
  const kiosk=instance.name==='campus_coffee_kiosk';
  // Kiosk serving-cup coordinates come from its authoritative recipe. Forward drift
  // carries the steam out past the awning before it rises above roof height.
  const origin=kiosk?instance.localToWorld(new THREE.Vector3(.8,1.73,.81)):instance.getObjectByName('anchor_steam').getWorldPosition(new THREE.Vector3());
  const drift=new THREE.Vector3(0,0,kiosk?1.8:.2).applyQuaternion(instance.quaternion);
  for(let i=0;i<6;i++){
   const material=new THREE.SpriteMaterial({map:steamTexture,color:0xfff1df,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
   const puff=new THREE.Sprite(material);group.add(puff);steam.push({puff,origin,drift,kiosk,phase:i/6});
  }
 }
 for(const fixture of campus.children.filter(o=>o.name==='campus_path_bollard')){
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 p;void main(){p=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;void main(){float a=exp(-dot(p,p)*23.)*.09;gl_FragColor=vec4(1.,.63,.25,a);}'}));
  glow.rotation.x=-Math.PI/2;glow.position.copy(fixture.position);glow.position.y+=.01;group.add(glow);
 }
 let time=0,reduced=false;
 function setTime(value,reduce=false){
  time=value;reduced=reduce;
  plants.forEach(p=>p.mixer.setTime(reduce?0:value*.75+p.phase));
  people.forEach((p,index)=>{const pose=routinePose(value,index);p.pose=pose;p.actor.position.fromArray(pose.position);p.actor.rotation.y=pose.heading;p.mixer.setTime(reduce?0:value*.75+index*.6);p.dots.visible=!reduce&&pose.activity==='conversation'&&((value-30)%6<3?index===0:index===1);p.actor.updateMatrixWorld(true);});
  const worldPerPixel=(camera.top-camera.bottom)/(camera.zoom*Math.max(1,canvas.clientHeight));
  steam.forEach(({puff,origin,drift,kiosk,phase})=>{const t=(value*.16+phase)%1;puff.visible=!reduce;puff.position.copy(origin).addScaledVector(drift,t).add(new THREE.Vector3(Math.sin(t*5+phase)*.15,t*(kiosk?2.8:1.9),Math.cos(t*4+phase)*.08));const width=Math.max(kiosk ? .45+t*1.45 : .3+t*.95,Math.min(1.5,worldPerPixel*5));puff.scale.set(width,width*1.35,1);puff.material.opacity=Math.sin(t*Math.PI)*(kiosk ? .62 : .46);});
 }
 function state(){return {time,reducedMotion:reduced,cycle:AMBIENT_CYCLE,plantInstances:plants.length,foliage:plants.map(p=>{const values=[];p.instance.traverse(o=>{if(o.morphTargetInfluences)values.push(...o.morphTargetInfluences);});return values;}),steam:steam.map(s=>({position:s.puff.position.toArray(),opacity:s.puff.material.opacity,width:s.puff.scale.x,source:s.kiosk?'kiosk':'table',visible:s.puff.visible})),visitors:people.map(p=>({...p.pose,conversationVisible:p.dots.visible})),status:people[0]?.pose?.activity==='coffee stop'?'A coffee break before the next idea.':people[0]?.pose?.activity==='conversation'?'Copilots are catching up in the plaza.':people[0]?.pose?.activity==='café table break'?'A quiet coffee on the terrace.':people[1]?.pose?.activity==='admiring the sculpture'?'A moment to enjoy the campus art.':'A little life around the campus.'};}
 function audit(){
  const saved=time,savedReduce=reduced,problems=[];
  const obstacles=campus.children.filter(o=>!o.userData.campusTile&&!o.name.startsWith('campus_walk_')).map(o=>({name:o.name,position:o.position.toArray(),box:new THREE.Box3().setFromObject(o)}));
  const terrain=campus.children.filter(o=>o.userData.campusTile),ray=new THREE.Raycaster();
  let minimumSeparation=Infinity;
  for(let i=0;i<=AMBIENT_CYCLE*4;i++){
   const t=i/4;setTime(t);
   const bounds=people.map(p=>new THREE.Box3().setFromObject(p.model,true));
   if(bounds[0].intersectsBox(bounds[1]))problems.push({time:t,type:'visitor overlap'});
   minimumSeparation=Math.min(minimumSeparation,people[0].actor.position.distanceTo(people[1].actor.position));
   people.forEach((p,j)=>{
    for(const o of obstacles)if(bounds[j].intersectsBox(o.box))problems.push({time:t,visitor:j,type:'obstacle',asset:o.name,position:o.position});
    ray.set(new THREE.Vector3(p.actor.position.x,30,p.actor.position.z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(terrain,true)[0];if(!hit||Math.abs(hit.point.y-1.2)>.025)problems.push({time:t,visitor:j,type:'terrain'});
   });
  }
  setTime(saved,savedReduce);
  return {passed:!problems.length,samples:AMBIENT_CYCLE*4+1,minimumSeparation,problems};
 }
 setTime(0);
 return {setTime,state,audit};
}



