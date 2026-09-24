import * as THREE from 'three';
import {cloneActor} from '/TowerDefense/stress-load.js';
import {TOWER_TYPES} from './config.js';

export function createPlacement({scene,camera,canvas,map,models,actors,draw,isLocked}){
 const panel=document.querySelector('#tower-palette'),list=document.querySelector('#tower-cards'),status=document.querySelector('#placement-status');
 const ray=new THREE.Raycaster(),preview=new THREE.Group();scene.add(preview);preview.visible=false;
 const ringGeometry=new THREE.RingGeometry(1.55,1.72,48),ringMaterial=new THREE.MeshBasicMaterial({color:0xbfea9d,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false,depthTest:false});
 const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.06;ring.renderOrder=10;preview.add(ring);
 const cursor=document.createElement('span');cursor.id='placement-hover';cursor.hidden=true;canvas.parentElement.append(cursor);
 const range=new THREE.Mesh(new THREE.RingGeometry(15.9,16,96),new THREE.MeshBasicMaterial({color:0xcaf5b5,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));range.rotation.x=-Math.PI/2;range.position.y=.08;preview.add(range);
 let selected=null,ghost=null,hover=null,effectFrame=0,lastEffectTime=0;const effects=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const key='garden-placed-towers-v1';
 function releaseGhost(){if(!ghost)return;const skeletons=new Set();ghost.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}if(o.isSkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());preview.remove(ghost);ghost=null;}
 function ui(){const s=actors.state();document.querySelector('#placed-count').textContent=s.manualTowers;document.querySelector('#placement-undo').disabled=isLocked()||!s.manualTowers;document.querySelector('#placement-clear').disabled=isLocked()||!s.manualTowers;document.querySelectorAll('[data-tower]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.tower===selected));b.disabled=isLocked();});document.querySelector('#placement-cancel').disabled=isLocked()||!selected;}
 function save(){try{localStorage.setItem(key,JSON.stringify(actors.state().placedTowers.map(t=>({...t,position:[t.position[0],map.heightAt(t.position[0],t.position[2])+.18,t.position[2]]}))));}catch{status.textContent='Placed. Browser storage is full; this layout stays in this session.';}ui();}
 function select(id){if(isLocked())return;selected=id;hover=null;preview.visible=false;cursor.hidden=true;releaseGhost();
  if(id){ghost=cloneActor(models.get(id).scene);ghost.traverse(o=>{if(o.isMesh){const tint=m=>{const c=m.clone();c.transparent=true;c.opacity=.45;c.depthWrite=false;return c;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);o.castShadow=false;}});preview.add(ghost);status.textContent='Choose a clearing. Click to place; drag to pan.';}
  else status.textContent='Select a tower, then click a clearing. No placement limit.';ui();draw();
 }
 function validAt(x,z){const result=map.placementAt(x,z);if(result.valid&&actors.occupied(x,z))return {...result,valid:false,reason:'Too close to another tower'};return result;}
 function pointer(x,y){if(!selected||isLocked())return;const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);const hit=ray.intersectObject(map.surface,false)[0];
  if(!hit){hide();return;}const {x:px,z:pz}=hit.point,result=validAt(px,pz);hover={x:px,z:pz,...result};preview.visible=true;preview.position.set(px,result.y+.18,pz);ringMaterial.color.set(result.valid?0xbfea9d:0xf08f79);range.material.color.copy(ringMaterial.color);ghost.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.color)m.color.set(result.valid?0xc8f2be:0xf29887);}});status.textContent=result.valid?`${TOWER_TYPES.find(t=>t.id===selected).label} · click to place`:result.reason;cursor.textContent=result.valid?`+ ${TOWER_TYPES.find(t=>t.id===selected).label}`:result.reason;cursor.dataset.valid=String(result.valid);cursor.style.left=`${Math.max(8,Math.min(rect.width-170,x-rect.left+15))}px`;cursor.style.top=`${Math.max(8,Math.min(rect.height-40,y-rect.top+15))}px`;cursor.hidden=false;draw();
 }
 function hide(){hover=null;preview.visible=false;cursor.hidden=true;draw();}
 function finishEffects(){cancelAnimationFrame(effectFrame);effectFrame=0;for(const e of effects){e.actor.scale.setScalar(1);e.actor.position.y=e.y;scene.remove(e.pulse);e.pulse.material.dispose();}effects.length=0;actors.finishEffects();lastEffectTime=0;}
 function animate(now){effectFrame=0;actors.updateEffects(lastEffectTime?Math.min(.1,(now-lastEffectTime)/1000):0);lastEffectTime=now;for(let i=effects.length-1;i>=0;i--){const e=effects[i],t=Math.min(1,(now-e.start)/e.duration),settle=1-Math.pow(1-t,3);if(e.authored){actors.presentPlacement(e.actor,t);}else{e.actor.position.y=e.y+5*(1-settle);e.actor.scale.setScalar(t<.7?.75+.25*settle:1+Math.sin((t-.7)/.3*Math.PI)*.06);}e.pulse.scale.setScalar(1+t*2.5);e.pulse.material.opacity=(1-t)*.8;
   if(t===1){e.actor.position.y=e.y;e.actor.scale.setScalar(1);scene.remove(e.pulse);e.pulse.material.dispose();effects.splice(i,1);}}
  draw();if(effects.length||actors.effectsActive())effectFrame=requestAnimationFrame(animate);else lastEffectTime=0;
 }
 function placeAt(x,z){if(!selected||isLocked()||!validAt(x,z).valid)return false;const actor=actors.addTower(selected,x,z);if(!actor)return false;const y=actor.position.y;
  // Save settled transforms, so a reload never restores an actor above the ground.
  save();if(!reduced.matches){const pulse=new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({color:0xd1f5a3,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));pulse.rotation.x=-Math.PI/2;pulse.position.set(x,y+.05,z);scene.add(pulse);const authored=actors.placementDuration(actor);effects.push({actor,y,pulse,start:performance.now(),authored:!!authored,duration:authored?authored*1000:700});if(authored)actors.presentPlacement(actor,0);else{actor.position.y+=5;actor.scale.setScalar(.75);}if(!effectFrame)effectFrame=requestAnimationFrame(animate);}
  status.textContent=`${TOWER_TYPES.find(t=>t.id===selected).label} placed. Click another clearing to add more.`;preview.visible=false;cursor.hidden=true;hover=null;draw();return true;
 }
 function click(x,y){pointer(x,y);return hover?.valid?placeAt(hover.x,hover.z):false;}
 function prepareCapture(){finishEffects();select(null);document.querySelector('#build-toggle').setAttribute('aria-expanded','false');panel.classList.remove('open');status.textContent='Layout locked while recording. Added towers join the simulation.';}
 document.querySelector('#placement-cancel').addEventListener('click',()=>select(null));
 document.querySelector('#placement-undo').addEventListener('click',()=>{if(isLocked())return;finishEffects();actors.undoTower();if(reduced.matches)actors.finishEffects();else if(actors.effectsActive()&&!effectFrame)effectFrame=requestAnimationFrame(animate);save();status.textContent='Last added tower removed.';hide();});
 document.querySelector('#placement-clear').addEventListener('click',()=>{if(isLocked())return;finishEffects();actors.clearTowers();if(reduced.matches)actors.finishEffects();else if(actors.effectsActive()&&!effectFrame)effectFrame=requestAnimationFrame(animate);save();status.textContent='Added towers cleared. Preset towers remain.';hide();});
 document.querySelector('#build-toggle').addEventListener('click',()=>{const open=panel.classList.toggle('open');document.querySelector('#build-toggle').setAttribute('aria-expanded',String(open));});
 document.querySelector('#palette-close').addEventListener('click',()=>{panel.classList.remove('open');document.querySelector('#build-toggle').setAttribute('aria-expanded','false');});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&selected)select(null);});
 // Render portraits once from the same registered models used on the map.
 const thumbs=new THREE.WebGLRenderer({alpha:true,antialias:true});thumbs.setSize(160,112);thumbs.outputColorSpace=THREE.SRGBColorSpace;thumbs.toneMapping=THREE.ACESFilmicToneMapping;
 const portraitScene=new THREE.Scene();portraitScene.add(new THREE.HemisphereLight(0xfff9e5,0x416571,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,5,4);portraitScene.add(light);
 const portraitCamera=new THREE.PerspectiveCamera(32,160/112,.01,100);
 for(const spec of TOWER_TYPES.filter(t=>t.id!=='bert_breugelmans')){const model=cloneActor(models.get(spec.id).scene);portraitScene.add(model);const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z);portraitCamera.position.copy(center).add(new THREE.Vector3(.9,.55,1.4).normalize().multiplyScalar(span*2.25));portraitCamera.lookAt(center);thumbs.render(portraitScene,portraitCamera);
  const button=document.createElement('button');button.className='tower-card';button.dataset.tower=spec.id;button.setAttribute('aria-pressed','false');button.innerHTML=`<img alt="" src="${thumbs.domElement.toDataURL('image/png')}"><span><strong>${spec.label}</strong><small>${spec.detail}</small></span>`;button.addEventListener('click',()=>{select(spec.id);if(innerWidth<=1100){panel.classList.remove('open');document.querySelector('#build-toggle').setAttribute('aria-expanded','false');}});list.append(button);portraitScene.remove(model);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});
 }
 thumbs.dispose();thumbs.forceContextLoss();
 try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))for(const item of saved){if(TOWER_TYPES.some(t=>t.id===item?.id)&&Array.isArray(item.position)&&item.position.every(Number.isFinite))actors.addTower(item.id,item.position[0],item.position[2]);}}catch{}
 ui();
 function screenPoint(x,z){const rect=canvas.getBoundingClientRect(),p=new THREE.Vector3(x,map.heightAt(x,z),z).project(camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};}
 return {pointer,click,hide,select,placeAt,validAt,screenPoint,prepareCapture,finishEffects,refresh:()=>{ui();if(!isLocked())status.textContent='Select a tower to keep building. Your added towers stay in place.';},state:()=>({selected,hover,animating:effects.length+(actors.effectsActive()?1:0),locked:isLocked()})};
}

