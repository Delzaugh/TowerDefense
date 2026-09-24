import * as THREE from 'three';
import {GLTFLoader} from '/vendor/GLTFLoader.js';
import {createCompanion} from './companion.js';
import {createAmbientCampus} from './ambient.js';
import {createCampusGuests,GUEST_IDS} from './guests.js';
import {createCampusPerformance} from './performance.js';
import {createBuildingFeedback,createCompanionBeacon} from './presentation.js';
import {createCampusLightLines} from './light-lines.js';
import {layout,STROLL_ROUTE,auditWalkwayConnections,auditBaseTiles} from './campus-layout.js';

const stage=document.querySelector('#stage'),canvas=document.querySelector('#campus');
const loading=document.querySelector('#loading'),label=document.querySelector('#lab-label');
const description=document.querySelector('#view-description'),motionButton=document.querySelector('#motion-toggle');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,asset,companion,ambient,guests,metrics,audit,lightLines,feedback,beacon,frame=0,lastFrame=0,simulationFrame=0;
let paused=reducedMotion.matches;
const target=new THREE.Vector3(0,1.6,0);
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-15,15,11,-11,.1,160);
// Authored angles stay fixed. Bounded zoom brings campus details within reach.
const cameraViews={
 home:{label:'Home',azimuth:.78,elevation:.64,span:87},
 top:{label:'Top down',top:true,span:108},
 front:{label:'Front',azimuth:0,elevation:.58,span:87},
 left:{label:'Left',azimuth:-.85,elevation:.68,span:87}
};
let currentView='home';
function selectView(name){
 const view=cameraViews[name];if(!view)return;currentView=name;
 camera.up.set(0,view.top?0:1,view.top?-1:0);
 if(view.top)camera.position.set(target.x,target.y+80,target.z);
 else camera.position.set(target.x+80*Math.cos(view.elevation)*Math.sin(view.azimuth),target.y+80*Math.sin(view.elevation),target.z+80*Math.cos(view.elevation)*Math.cos(view.azimuth));
 camera.lookAt(target);camera.updateMatrixWorld();
 document.querySelectorAll('[data-camera]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.camera===name)));
 canvas.setAttribute('aria-label',view.label+' view of the campus. Buildings highlight on hover.');
 feedback?.clearHover();resize();
}
document.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>selectView(button.dataset.camera)));
selectView('home');


function draw(){
  if(!renderer)return;
  const started=metrics?.begin();
  renderer.info.reset();
  if(lightLines&&companion)lightLines.setTime(companion.state().time);
  if(ambient&&companion){ambient.setTime(companion.state().time,reducedMotion.matches&&paused);if(!paused){const status=ambient.state().status;if(description.textContent!==status)description.textContent=status;}}
  if(guests&&companion)guests.setTime(companion.state().time,reducedMotion.matches&&paused);
  feedback?.update();beacon?.update(camera);
  renderer.render(scene,camera);
  if(started!==undefined)metrics.end(started);
}
function resize(){
  if(!renderer)return;
  const width=stage.clientWidth,height=stage.clientHeight,aspect=width/height,span=Math.max(cameraViews[currentView].span,129/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);draw();
}
function animate(timestamp){
  frame=0;
  if(paused||document.hidden||!companion){lastFrame=0;return;}
  if(!lastFrame){lastFrame=timestamp;simulationFrame=timestamp;}
  const elapsed=timestamp-lastFrame;
  if(elapsed>=1000/30-.2){companion.update(Math.min((timestamp-simulationFrame)/1000,.1));simulationFrame=timestamp;lastFrame+=(1000/30)*Math.max(1,Math.floor((elapsed+.2)/(1000/30)));draw();}
  frame=requestAnimationFrame(animate);
}
function refreshMotion(){
  cancelAnimationFrame(frame);frame=0;lastFrame=0;
  metrics?.breakCadence();
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.setAttribute('aria-label',paused?'Resume campus ambience':'Pause campus ambience');
  motionButton.querySelector('strong').textContent=paused?'RESUME CAMPUS':'PAUSE CAMPUS';
  motionButton.querySelector('.button-arrow').textContent=paused?'▷':'Ⅱ';
  description.textContent=paused?'Taking a little breather.':'Your Copilot is out for a stroll.';
  if(companion&&!paused&&!document.hidden)frame=requestAnimationFrame(animate);
  draw();
}
motionButton.addEventListener('click',()=>{paused=!paused;refreshMotion();});
reducedMotion.addEventListener('change',e=>{if(e.matches)paused=true;refreshMotion();});
document.addEventListener('visibilitychange',refreshMotion);
const navigationRay=new THREE.Raycaster(),navigationPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.2);
function groundAt(x,y){
 const rect=canvas.getBoundingClientRect();navigationRay.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
 return navigationRay.ray.intersectPlane(navigationPlane,new THREE.Vector3());
}
function panBy(delta){
 const next=target.clone().add(delta);next.x=THREE.MathUtils.clamp(next.x,-55,55);next.z=THREE.MathUtils.clamp(next.z,-55,55);next.y=1.6;
 camera.position.add(next.clone().sub(target));target.copy(next);camera.updateMatrixWorld();
}
function setZoom(value,pointer){
 const before=pointer?groundAt(pointer.x,pointer.y):null;
 camera.zoom=THREE.MathUtils.clamp(value,.7,10);camera.updateProjectionMatrix();
 if(before){const after=groundAt(pointer.x,pointer.y);if(after)panBy(before.sub(after));}
 document.body.dataset.close=String(camera.zoom>1.4);document.querySelector('#zoom-reset').textContent=Math.round(camera.zoom*100)+'%';feedback?.clearHover();draw();
}
canvas.addEventListener('wheel',event=>{
 // Leave browser accessibility zoom (Ctrl/Cmd + wheel) to the browser.
 if(event.ctrlKey||event.metaKey)return;
 event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);
 setZoom(camera.zoom*Math.exp(-THREE.MathUtils.clamp(delta,-200,200)*.0018),{x:event.clientX,y:event.clientY});
},{passive:false});
let drag=null;
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||!e.isPrimary)return;const point=groundAt(e.clientX,e.clientY);if(!point)return;
 drag={id:e.pointerId,point,x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)return;
 drag.moved=true;canvas.dataset.dragging='true';const point=groundAt(e.clientX,e.clientY);
 if(point)panBy(drag.point.clone().sub(point));feedback?.clearHover();draw();e.stopImmediatePropagation();
},{capture:true});
function endDrag(e){
 if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;delete canvas.dataset.dragging;
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 canvas.style.cursor='grab';
 if(moved){e.preventDefault();e.stopImmediatePropagation();}
}
canvas.addEventListener('pointerup',endDrag,{capture:true});canvas.addEventListener('pointercancel',endDrag,{capture:true});
canvas.addEventListener('lostpointercapture',()=>{drag=null;delete canvas.dataset.dragging;});
document.querySelector('#zoom-in').addEventListener('click',()=>setZoom(camera.zoom*1.2));
document.querySelector('#zoom-out').addEventListener('click',()=>setZoom(camera.zoom/1.2));
document.querySelector('#zoom-reset').addEventListener('click',()=>{target.set(0,1.6,0);selectView(currentView);setZoom(1);});

try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);
  metrics=createCampusPerformance(renderer,scene);
  renderer.info.autoReset=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight(0xfff3df,0x263248,1.65));
  const sun=new THREE.DirectionalLight(0xfff4e6,2.1);sun.position.set(-10,23,14);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:120});sun.shadow.normalBias=.08;sun.shadow.bias=-.0006;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd3deee,.55);fill.position.set(10,8,-15);scene.add(fill);
  const accent=new THREE.DirectionalLight(0xb99beb,.22);accent.position.set(-20,9,-20);scene.add(accent);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x496579,opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=-.65;ground.receiveShadow=true;scene.add(ground);
  const loader=new GLTFLoader();
  const placements=layout(),ids=[...new Set(placements.map(p=>p.id))];
  const [models,copilotGLTF,visitors,guestModels]=await Promise.all([
    Promise.all(ids.map(async id=>[id,await loader.loadAsync(`/runtime/${id}.glb`)])),
    loader.loadAsync('/runtime/copilot_base_v02.glb'),
    Promise.all([0,1].map(()=>loader.loadAsync('/runtime/copilot_base_v02.glb'))),
    Promise.all(GUEST_IDS.map(id=>loader.loadAsync(`/runtime/${id}.glb`)))
  ]);
  const modelsById=new Map(models);asset=new THREE.Group();asset.name='Glacier campus';
  for(const p of placements){const instance=modelsById.get(p.id).scene.clone(true);instance.name=p.id;if(p.tile)instance.userData.campusTile={...p.tile};if(p.decor)instance.userData.campusDecor=true;if(p.building)instance.userData.building={...p.building};instance.position.fromArray(p.position);instance.rotation.y=p.rotation||0;asset.add(instance);}
  scene.add(asset);asset.updateMatrixWorld(true);
  const baseAudit=auditBaseTiles(asset);if(!baseAudit.passed)throw new Error('Hex tile connections failed alignment audit');
  const assemblyAudit=auditWalkwayConnections(asset);if(!assemblyAudit.passed)throw new Error('Walkway connections failed alignment audit');
  companion=createCompanion(copilotGLTF,asset,STROLL_ROUTE);scene.add(companion.actor);audit=companion.sampleAudit();
  if(!audit.door.fits||!audit.path.fits)throw new Error('Copilot scale or route failed the campus clearance audit');
  scene.traverse(o=>{if(o.isMesh&&o!==ground){o.castShadow=true;o.receiveShadow=true;}});
  lightLines=createCampusLightLines(scene);
  ambient=createAmbientCampus({scene,campus:asset,models:modelsById,visitors,camera,canvas});
  guests=createCampusGuests(scene,guestModels);
  feedback=createBuildingFeedback({scene,campus:asset,canvas,camera,stage,draw});
  beacon=createCompanionBeacon(scene,stage,companion.actor);
  loading.hidden=true;motionButton.disabled=false;
  resize();new ResizeObserver(resize).observe(stage);refreshMotion();
  window.campusStudyState=()=>({loaded:true,theme:'twilight',lightLines:{traces:lightLines.traceCount,gridTiles:lightLines.gridTiles,...lightLines.state()},cameraLocked:false,cameraRotationLocked:true,cameraMode:'presets-pan-zoom',currentView,cameraViews:Object.keys(cameraViews),hover:feedback.state(),companionBeacon:beacon.state(),camera:camera.position.toArray(),target:target.toArray(),zoom:camera.zoom,zoomLimits:[.7,10],paused,guests:guests.state(),ambient:ambient.state(),companion:companion.state(),scaleAudit:audit,assemblyAudit,baseAudit,frustumHeight:camera.top-camera.bottom,assets:[...ids,...GUEST_IDS],instances:placements.length,asset:'campus_base_hex',version:'v01'});
  window.campusPerformance={snapshot:metrics.snapshot,reset:metrics.reset};metrics.ready();
  // Deterministic evidence poses exist only in explicit local review sessions.
  // They run only in explicit review sessions.
  if(new URLSearchParams(location.search).get('review')==='1')window.campusStudyReview={
    auditAmbient:()=>ambient.audit(),
    auditGuests:()=>guests.audit(asset),
    groundPoint:(x,y)=>groundAt(x,y)?.toArray(),
    seek(time){paused=true;refreshMotion();companion.setTime(time);draw();},
    doorway(time=0){paused=true;refreshMotion();companion.poseAtDoor(time);draw();}
  };
}catch(error){console.error(error);loading.textContent='The campus could not load. Reload this page to try again.';label.hidden=true;motionButton.disabled=true;}

















