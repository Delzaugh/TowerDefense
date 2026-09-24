import * as THREE from 'three';

// Presentation feedback is independent of source art and shared GLB materials.
export function createBuildingFeedback({scene,campus,canvas,camera,stage,draw}){
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),records=[];
 let hovered=null,focused=null,pinned=null;
 const active=()=>hovered||focused||pinned;
 const existing=document.querySelector('#lab-label');
 for(const instance of campus.children.filter(o=>o.userData.building)){
  const info=instance.userData.building,bounds=new THREE.Box3().setFromObject(instance);
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const button=records.length?existing.cloneNode(true):existing;
  if(records.length){button.removeAttribute('id');stage.append(button);}
  button.classList.add('building-label');button.dataset.building=info.id;
  button.querySelector('strong').textContent=info.label;button.querySelector('small').textContent=info.description;
  button.setAttribute('aria-label','Highlight '+info.label);button.setAttribute('aria-pressed','false');
  const effect=new THREE.Group();effect.visible=false;scene.add(effect);
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(size.x+4,size.z+4),new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,
   uniforms:{halfSize:{value:new THREE.Vector2(size.x/2,size.z/2)},extent:{value:new THREE.Vector2(size.x+4,size.z+4)}},
   vertexShader:'varying vec2 p;uniform vec2 extent;void main(){p=uv*extent-extent*.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec2 p;uniform vec2 halfSize;void main(){vec2 q=abs(p)-halfSize;float d=length(max(q,0.))+min(max(q.x,q.y),0.);float a=exp(-abs(d)*2.4)*.34+exp(-pow((d-.35)*9.,2.))*.65;gl_FragColor=vec4(.76,.98,.91,a);}'
  }));
  halo.rotation.x=-Math.PI/2;halo.position.set(center.x,bounds.min.y+.015,center.z);effect.add(halo);
  const outlineMaterial=new THREE.LineBasicMaterial({color:0xe1fff2,transparent:true,opacity:.82,depthWrite:false,toneMapped:false});
  instance.traverse(o=>{if(o.isMesh){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,32),outlineMaterial);edges.matrixAutoUpdate=false;edges.matrix.copy(o.matrixWorld);effect.add(edges);}});
  const record={id:info.id,instance,button,effect,anchor:instance.getObjectByName('anchor_ui'),center};records.push(record);
  button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){hovered=record;refresh();}});
  button.addEventListener('pointerleave',()=>{hovered=null;refresh();});
  button.addEventListener('focus',()=>{focused=record;refresh();});
  button.addEventListener('blur',()=>{focused=null;refresh();});
  button.addEventListener('click',()=>{pinned=pinned===record?null:record;refresh();});
 }
 function refresh(){
  for(const r of records){const on=r===active();r.effect.visible=on;r.button.classList.toggle('is-highlighted',on);r.button.setAttribute('aria-pressed',String(on));}
  canvas.style.cursor=canvas.dataset.dragging?'grabbing':hovered?'pointer':'grab';draw();
 }
 function hit(e){
  const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.x)/rect.width*2-1,-(e.clientY-rect.y)/rect.height*2+1);
  ray.setFromCamera(pointer,camera);
  const intersection=ray.intersectObjects(campus.children,true)[0];
  let object=intersection?.object;
  while(object&&object!==campus){const r=records.find(r=>r.instance===object);if(r)return r;object=object.parent;}
  return null;
 }
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const next=hit(e);if(next!==hovered){hovered=next;refresh();}});
 canvas.addEventListener('pointerleave',()=>{hovered=null;refresh();});
 canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){const next=hit(e);pinned=pinned===next?null:next;refresh();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){hovered=focused=pinned=null;if(records.some(r=>r.button===document.activeElement))document.activeElement.blur();refresh();}});
 const p=new THREE.Vector3();
 return {
  update(){for(const r of records){if(r.anchor)r.anchor.getWorldPosition(p);else p.copy(r.center);p.project(camera);r.button.style.left=(p.x*.5+.5)*stage.clientWidth+'px';r.button.style.top=((-p.y*.5+.5)*stage.clientHeight-26)+'px';r.button.hidden=false;}},
  clearHover(){hovered=null;refresh();},
  state:()=>({active:active()?.id||null,buildings:records.map(r=>({id:r.id,highlighted:r.effect.visible,screen:r.center.clone().project(camera).toArray()}))})
 };
}

export function createCompanionBeacon(scene,stage,actor){
 const group=new THREE.Group();scene.add(group);
 const ring=new THREE.Mesh(new THREE.RingGeometry(1.40,1.59,48),new THREE.MeshBasicMaterial({color:0xffd078,side:THREE.DoubleSide,transparent:true,opacity:.22,depthWrite:false,toneMapped:false}));
 ring.rotation.x=-Math.PI/2;group.add(ring);
 const halo=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 p;void main(){p=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 p;void main(){float r=length(p);float a=exp(-pow((r-.29)*13.,2.))*.045;gl_FragColor=vec4(1.,.66,.25,a);}'
 }));halo.rotation.x=-Math.PI/2;halo.position.y=-.004;group.add(halo);
 const tag=document.createElement('span');tag.className='companion-tag';tag.textContent='COPILOT';tag.setAttribute('aria-hidden','true');stage.append(tag);
 const p=new THREE.Vector3();
 return {
  update(camera){group.position.set(actor.position.x,actor.position.y+.018,actor.position.z);p.copy(actor.position);p.y+=2.7;p.project(camera);let x=(p.x*.5+.5)*stage.clientWidth,y=(-p.y*.5+.5)*stage.clientHeight;
   const base=stage.getBoundingClientRect(),w=tag.offsetWidth,h=tag.offsetHeight;
   for(const label of stage.querySelectorAll('.building-label')){
    const r=label.getBoundingClientRect(),left=r.left-base.left,right=r.right-base.left,top=r.top-base.top,bottom=r.bottom-base.top;
    if(x+w/2>left-5&&x-w/2<right+5&&y-h*.65>top-5&&y-h*1.65<bottom+5)y=bottom+h*1.65+8;
   }
   tag.style.left=x+'px';tag.style.top=y+'px';},
  state:()=>({color:'#ffd078',label:'COPILOT',sourceScalePreserved:true})
 };
}



