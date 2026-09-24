import * as THREE from 'three';
import {GLTFLoader} from '/TowerDefense/vendor/GLTFLoader.js';
import {createCampusPerformance} from '/TowerDefense/performance.js';
import {MODELS,DECOR_IDS,STRUCTURE_IDS,MAP_SCALE,DEFAULT_SETTINGS,enemyCap} from './config.js';
import {createMap} from './map.js';
import {createActors} from './actors.js';
import {createCapture} from './capture.js';
import {createPlacement} from './placement.js';

const stage=document.querySelector('#stage'),canvas=document.querySelector('#map');
let renderer,map,actors,metrics,capture,placement,animating=false,last=0,lastStep=0,frame=0,view='home',zoom=1;
let settings={...DEFAULT_SETTINGS};try{const saved=JSON.parse(localStorage.getItem('garden-simulation-settings')||'null');if(saved&&typeof saved.bert==='boolean'&&typeof saved.octocat==='boolean')settings={bert:saved.bert,octocat:saved.octocat,maxEnemies:enemyCap(saved.maxEnemies)};}catch{}
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-60,60,45,-45,.1,700),target=new THREE.Vector3();
scene.background=new THREE.Color(0x799b9e);scene.fog=new THREE.Fog(0x799b9e,260,510);
function state(){return {scene:'garden-switchback-v3',view,zoom,pan:target.toArray(),animating,map:map?.state(),actors:actors?.state(),placement:placement?.state()};}
function draw(started=metrics?.begin()){
 if(!renderer)return;renderer.info.reset();renderer.render(scene,camera);if(started!==undefined)metrics.end(started);
 const s=(!animating&&capture?.state().report?.waveResult)||actors?.state();if(s){document.querySelector('#wave').textContent=`${s.wave||'—'} / 3`;document.querySelector('#active').textContent=s.active;document.querySelector('#arrived').textContent=s.arrived;document.querySelector('#tower-total').textContent=actors.state().totalTowers;}
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight,aspect=w/h,span=MAP_SCALE*Math.max(80,119/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=zoom;camera.updateProjectionMatrix();renderer.setSize(w,h,false);draw();}
function setView(next){view=next;zoom=1;target.set(0,0,0);camera.up.set(0,next==='top'?0:1,next==='top'?-1:0);camera.position.set(next==='top'?0:42*MAP_SCALE,100*MAP_SCALE,next==='top'?0:78*MAP_SCALE);camera.lookAt(target);camera.updateMatrixWorld();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));resize();}
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function groundAt(x,y){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());}
function panBy(delta){const next=target.clone().add(delta);next.x=THREE.MathUtils.clamp(next.x,-100,100);next.z=THREE.MathUtils.clamp(next.z,-85,85);next.y=0;camera.position.add(next.clone().sub(target));target.copy(next);camera.updateMatrixWorld();}
function setZoom(value,pointer){if(capture?.state().running)return;const before=pointer?groundAt(pointer.x,pointer.y):null;zoom=THREE.MathUtils.clamp(value,.6,6);camera.zoom=zoom;camera.updateProjectionMatrix();if(before){const after=groundAt(pointer.x,pointer.y);if(after)panBy(before.sub(after));}draw();}
canvas.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1);setZoom(zoom*Math.exp(-THREE.MathUtils.clamp(delta,-200,200)*.002),{x:e.clientX,y:e.clientY});},{passive:false});
let drag=null;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||capture?.state().running)return;const point=groundAt(e.clientX,e.clientY);if(!point)return;drag={id:e.pointerId,point,x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(capture?.state().running)return;if(!drag){placement?.pointer(e.clientX,e.clientY);return;}if(drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)return;drag.moved=true;canvas.dataset.dragging='true';placement?.hide();const p=groundAt(e.clientX,e.clientY);if(p){panBy(drag.point.clone().sub(p));draw();}});
function endDrag(e){if(drag?.id!==e.pointerId)return;const click=!drag.moved&&e.type==='pointerup';drag=null;delete canvas.dataset.dragging;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click)placement?.click(e.clientX,e.clientY);}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
canvas.addEventListener('pointerleave',()=>{if(!drag)placement?.hide();});
function loop(timestamp){
 frame=0;if(!animating||document.hidden)return;
 if(!last){last=timestamp;lastStep=timestamp;}
 if(timestamp-last>=1000/30-.2){const started=metrics.begin(),dt=Math.min((timestamp-lastStep)/1000,.1);lastStep=timestamp;last+=(1000/30)*Math.max(1,Math.floor((timestamp-last+.2)/(1000/30)));actors.update(dt);draw(started);}
 frame=requestAnimationFrame(loop);
}
function setAnimating(value){animating=value;cancelAnimationFrame(frame);last=0;metrics?.breakCadence();if(value&&!document.hidden)frame=requestAnimationFrame(loop);}
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.info.autoReset=false;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene.add(new THREE.HemisphereLight(0xfff8df,0x35595b,2));const sun=new THREE.DirectionalLight(0xffedcf,2.6);sun.position.set(-35*MAP_SCALE,65*MAP_SCALE,30*MAP_SCALE);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-95,right:95,top:90,bottom:-90,near:1,far:240});sun.shadow.normalBias=.05;scene.add(sun);
 const loader=new GLTFLoader(),models=new Map(await Promise.all([...MODELS,...[...DECOR_IDS,...STRUCTURE_IDS].map(id=>({id,url:`/TowerDefense/runtime/${id}.glb?v=mufbvk10`}))].map(async spec=>[spec.id,await loader.loadAsync(spec.url)])));
 map=createMap(scene,models);actors=createActors(scene,map,models,settings);
 metrics=createCampusPerformance(renderer,scene,{getScene:state,reportName:'map-performance.json',getFrameContext:actors.telemetry});
 placement=createPlacement({scene,camera,canvas,map,models,actors,draw,isLocked:()=>!!capture?.state().running});
 capture=createCapture({renderer,metrics,actors,draw,state,setView,setAnimating,beforeRun:()=>placement.prepareCapture(),afterRun:()=>placement.refresh()});
 const menu=document.querySelector('#settings-panel');
 document.querySelector('#settings-toggle').addEventListener('click',()=>menu.showModal());
 document.querySelector('#settings-close').addEventListener('click',()=>menu.close());
 function updateSettingsUI(){document.querySelector('#toggle-bert').checked=settings.bert;document.querySelector('#toggle-octocat').checked=settings.octocat;document.querySelector('#max-enemies').value=settings.maxEnemies;document.querySelector('#enemy-limit').textContent=`/ ${settings.maxEnemies}`;document.querySelector('#cap-caption').textContent=`MAX ${settings.maxEnemies} ENEMIES · OVERFLOW QUEUES AT ENTRY`;document.querySelector('#bert-note').textContent=settings.bert?'Includes 2 Berts':'Copilot + Developer mix';document.querySelector('#octocat-note').textContent=settings.octocat?'2 Octocats await at the destination.':'Octocat is disabled.';}
 function saveSettings(next){if(capture.state().running)return;settings=next;actors.setSettings(settings);try{localStorage.setItem('garden-simulation-settings',JSON.stringify(settings));}catch{}updateSettingsUI();draw();}
 for(const id of ['bert','octocat'])document.querySelector('#toggle-'+id).addEventListener('change',e=>saveSettings({...settings,[id]:e.target.checked}));
 document.querySelector('#max-enemies').addEventListener('change',e=>{if(!e.target.checkValidity()){e.target.reportValidity();e.target.value=settings.maxEnemies;return;}saveSettings({...settings,maxEnemies:enemyCap(e.target.value)});});
 updateSettingsUI();
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
 for(const [id,factor] of [['zoom-in',1.2],['zoom-out',1/1.2]])document.querySelector('#'+id).addEventListener('click',()=>setZoom(zoom*factor));
 document.querySelector('#camera-reset').addEventListener('click',()=>setView(view));
 document.querySelector('#tower-count').addEventListener('change',e=>{actors.setTowers(Number(e.target.value));draw();});
 setView('home');new ResizeObserver(resize).observe(stage);document.querySelector('#loading').hidden=true;metrics.ready();
 window.simulationStudy={state,run:capture.run,cancel:capture.cancel,capture:capture.state,performance:metrics.snapshot,placement};
}catch(error){console.error(error);document.querySelector('#loading').textContent=`Unable to open the map: ${error.message}`;}

