import * as THREE from 'three';
import {MAP_SEED,MAP_SCALE,MAP_AREA_MULTIPLIER} from './config.js';

const v=(x,z)=>new THREE.Vector3(x,0,z);
const districts=[{name:'Research outpost',x:0,z:-53,radius:22,y:5},{name:'Cargo commons',x:-12,z:12,radius:10,y:1.8},{name:'Power station',x:66,z:-7,radius:13,y:3.5}];
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const riverX=z=>91+9*Math.sin(z*.023);
// One continuous height field grounds the terrain, route, actors and scenery.
function terrainHeight(x,z){
 let y=1.2*Math.sin(x*.035)+1.4*Math.cos(z*.052)+.5*Math.sin((x+z)*.065);
 y+=15*Math.exp(-(((x+78)/29)**2+((z+62)/30)**2))+19*Math.exp(-(((x-43)/42)**2+((z+105)/29)**2))+12*Math.exp(-(((x+70)/38)**2+((z-78)/29)**2));
 y+=smooth(70,150,Math.hypot(x,z))*(6+7*Math.sin(x*.022)*Math.cos(z*.028));
 for(const d of districts)y=THREE.MathUtils.lerp(d.y,y,smooth(d.radius,d.radius+8,Math.hypot(x-d.x,z-d.z)));
 return THREE.MathUtils.lerp(-4.2,y,smooth(6,13,Math.abs(x-riverX(z))));
}
// Match the actual two-metre terrain triangles, including on steep hillsides.
export function heightAt(x,z){const x0=Math.floor(x/2)*2,z0=Math.floor(z/2)*2,u=(x-x0)/2,w=(z-z0)/2;
 const nw=terrainHeight(x0,z0+2),se=terrainHeight(x0+2,z0);
 return u+w<=1?terrainHeight(x0,z0)*(1-u-w)+se*u+nw*w:terrainHeight(x0+2,z0+2)*(u+w-1)+nw*(1-u)+se*(1-w);
}
export function createRoute(){
 const controls=[v(-40,-22),v(28,-22),v(28,-3),v(-27,-3),v(-27,20),v(40,20)].map(p=>p.multiplyScalar(MAP_SCALE)),points=[controls[0]];
 for(let i=1;i<controls.length-1;i++){
  const c=controls[i],a=c.clone().add(controls[i-1].clone().sub(c).normalize().multiplyScalar(4)),b=c.clone().add(controls[i+1].clone().sub(c).normalize().multiplyScalar(4));
  points.push(a);const curve=new THREE.QuadraticBezierCurve3(a,c,b);points.push(...curve.getPoints(12).slice(1));
 }
 points.push(controls.at(-1));const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));
 const length=lengths.at(-1);
 function at(distance,offset=0){
  const d=THREE.MathUtils.clamp(distance,0,length);let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;
  const direction=points[i].clone().sub(points[i-1]).normalize(),normal=new THREE.Vector3(-direction.z,0,direction.x);
  const point=points[i-1].clone().lerp(points[i],(d-lengths[i-1])/(lengths[i]-lengths[i-1])).addScaledVector(normal,offset);
  point.y=heightAt(point.x,point.z);
  return {point,direction,heading:Math.atan2(direction.x,direction.z)};
 }
 function distanceTo(x,z){const p=v(x,z);let best=Infinity;for(let i=1;i<points.length;i++){const line=new THREE.Line3(points[i-1],points[i]);best=Math.min(best,line.closestPointToPoint(p,true,new THREE.Vector3()).distanceTo(p));}return best;}
 return {length,at,distanceTo,points:points.map(p=>[p.x,heightAt(p.x,p.z),p.z])};
}
function ribbon(route,width,y,color){
 const positions=[],indices=[],steps=Math.ceil(route.length*2),across=8;
 for(let i=0;i<=steps;i++)for(let j=0;j<=across;j++){const p=route.at(route.length*i/steps,width*(j/across-.5)).point;positions.push(p.x,p.y+y,p.z);}
 for(let i=0;i<steps;i++)for(let j=0;j<across;j++){const n=i*(across+1)+j;indices.push(n,n+across+1,n+1,n+1,n+across+1,n+across+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}));mesh.receiveShadow=true;return mesh;
}
export function createMap(scene,models){
 const route=createRoute(),group=new THREE.Group();group.name='garden-switchback-map';scene.add(group);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.95});
 const ground=new THREE.PlaneGeometry(520,460,260,230);ground.rotateX(-Math.PI/2);
 const colors=[],color=new THREE.Color(),pos=ground.attributes.position;let low=Infinity,high=-Infinity;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=heightAt(x,z);pos.setY(i,y);low=Math.min(low,y);high=Math.max(high,y);
  const bank=1-smooth(8,16,Math.abs(x-riverX(z)));color.set(y>9?0x738b72:0x91ab79);color.lerp(new THREE.Color(0xb6aa86),bank*.8);color.multiplyScalar(.96+.04*Math.sin(x*.17+z*.23));colors.push(color.r,color.g,color.b);}
 ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();
 const lawn=new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));lawn.receiveShadow=true;group.add(lawn);
 const riverPositions=[],riverIndices=[];for(let i=0;i<=230;i++){const z=-230+i*2,x=riverX(z);riverPositions.push(x-7,-2.4,z,x+7,-2.4,z);if(i<230){const n=i*2;riverIndices.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const riverGeometry=new THREE.BufferGeometry();riverGeometry.setAttribute('position',new THREE.Float32BufferAttribute(riverPositions,3));riverGeometry.setIndex(riverIndices);riverGeometry.computeVertexNormals();
 group.add(new THREE.Mesh(riverGeometry,new THREE.MeshStandardMaterial({color:0x528f98,roughness:.35,metalness:.15,side:THREE.DoubleSide})));
 group.add(ribbon(route,5.4,.13,0x718b72),ribbon(route,4.4,.17,0xdec9a0));
 // Roads continue into the surrounding country instead of ending at a display plinth.
 function trail(points,width){const curve=new THREE.CatmullRomCurve3(points.map(p=>v(...p))),length=curve.getLength();const path={length,at(d,offset){const t=d/length,p=curve.getPoint(t),dir=curve.getTangent(t);p.x-=dir.z*offset;p.z+=dir.x*offset;p.y=heightAt(p.x,p.z);return {point:p};}};group.add(ribbon(path,width,.14,0xbcba99));}
 trail([[-190,-80],[-112,-45],[-72,-31],[-56.6,-31.1]],4.4);
 trail([[56.6,28.3],[68,24],[72,10],[66,-7],[59,-39],[26,-53],[0,-53]],3.4);
 trail([[0,-53],[-12,-43],[-14,-31]],2.6);
 const slots=[];
 for(let i=0;i<80;i++){
  const sample=route.at(7+(route.length-14)*i/79,i%2?5:-5),p=sample.point;
  if(Math.abs(p.x)>43*MAP_SCALE||Math.abs(p.z)>29*MAP_SCALE||route.distanceTo(p.x,p.z)<4.5||slots.some(s=>s.point.distanceTo(p)<3.8))continue;
  slots.push({...sample,heading:sample.heading+(i%2?Math.PI/2:-Math.PI/2)});
 }
 if(slots.length<50)throw new Error('Map needs fifty separated tower positions');
 const pads=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.6,1.75,.16,12),material(0x7d9681),50);pads.receiveShadow=true;group.add(pads);
 const matrix=new THREE.Matrix4();
 function towerSlots(count){const selected=Array.from({length:count},(_,i)=>slots[Math.floor(i*slots.length/count)]);pads.count=count;selected.forEach((s,i)=>{matrix.makeTranslation(s.point.x,s.point.y+.12,s.point.z);pads.setMatrixAt(i,matrix);});pads.instanceMatrix.needsUpdate=true;return selected;}
 towerSlots(35);
 let seed=MAP_SEED;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const decor=[],structures=[],destination=route.at(route.length).point;
 function place(id,x,z,{scale=3,rotation=0,y=heightAt(x,z)}={}){const root=models.get(id).scene.clone(true);root.scale.setScalar(scale);root.rotation.y=rotation;root.position.set(x,y,z);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});group.add(root);const bounds=new THREE.Box3().setFromObject(root);structures.push({id,x,y,z,scale,rotation,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});return root;}
 // Three coherent KayKit compounds: connected research rooms, a cargo yard and utilities.
 for(const x of [-12,0,12]){place(x===0?'kaykit_basemodule_b':'kaykit_basemodule_a',x,-53);place('kaykit_roofmodule_solarpanels',x,-53,{y:8});}
 for(const x of [-6,6])place('kaykit_tunnel_straight_a',x,-53);
 place('kaykit_landingpad_small',0,-65,{scale:4});
 place('kaykit_basemodule_garage',-16,12);place('kaykit_cargodepot_a',-7,12);
 for(const x of [-18,-14,-10])place('kaykit_containers_a',x,18,{scale:3,rotation:Math.PI/2});
 place('kaykit_basemodule_a',65,-8);
 for(const [x,z] of [[62,-16],[70,-16]])place('kaykit_windturbine_tall',x,z);
 for(const [x,z] of [[61,0],[65,0],[69,0]])place('kaykit_solarpanel',x,z);
 // Mostly foliage, with a limited number of larger landmarks and seating spots.
 const choices=[['campus_tree_round',18,2.3],['campus_tree_tall',14,2.1],['campus_tree_cluster',6,3.2],['campus_bush_round',20,1.3],['campus_flower_bed',15,1.6],['campus_hedge',10,2],['campus_planter_bench',7,2.3],['kaykit_rock_a',6,1],['campus_wayfinding_sign',2,1.5],['campus_coffee_kiosk',2,2.8]];
 for(let attempt=0;attempt<12000&&decor.length<200;attempt++){
  let pick=random()*100;const choice=choices.find(c=>(pick-=c[1])<0)||choices[0];const [id,,radius]=choice;
  if(id==='campus_coffee_kiosk'&&decor.filter(d=>d.id===id).length>=3)continue;
  const x=(random()-.5)*86*MAP_SCALE,z=(random()-.5)*58*MAP_SCALE;
  if(route.distanceTo(x,z)<2.7+radius||districts.some(d=>Math.hypot(x-d.x,z-d.z)<d.radius+radius)||slots.some(s=>Math.hypot(s.point.x-x,s.point.z-z)<2.2+radius)||decor.some(d=>Math.hypot(d.x-x,d.z-z)<d.radius+radius+.4)||Math.hypot(x-destination.x,z-destination.z)<9)continue;
  const root=models.get(id).scene.clone(true);root.position.set(x,heightAt(x,z),z);root.rotation.y=Math.floor(random()*4)*Math.PI/2;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});group.add(root);decor.push({id,x,y:root.position.y,z,radius,rotation:root.rotation.y});
 }
 // Distant woods share mesh/material buffers, keeping the world backdrop inexpensive.
 const forest=[];for(let i=0;i<2400&&forest.length<420;i++){const x=(random()-.5)*380,z=(random()-.5)*310;
  if((Math.abs(x)<69&&Math.abs(z)<45)||Math.abs(x-riverX(z))<15||districts.some(d=>Math.hypot(x-d.x,z-d.z)<d.radius+5))continue;
  forest.push({x,z,y:heightAt(x,z),scale:1.2+random()*1.8,rotation:random()*Math.PI*2});}
 const tree=models.get('campus_tree_round').scene;tree.updateMatrixWorld(true);const transform=new THREE.Object3D();
 tree.traverse(o=>{if(!o.isMesh)return;const mesh=new THREE.InstancedMesh(o.geometry,o.material,forest.length);mesh.castShadow=true;mesh.receiveShadow=true;forest.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.rotation.y=p.rotation;transform.scale.setScalar(p.scale);transform.updateMatrix();mesh.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(transform.matrix,o.matrixWorld));});group.add(mesh);});
 const gates=[];
 for(const [distance,color] of [[0,0xc98b61],[route.length,0x67aaa9]]){
  const p=route.at(distance).point;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(3,3.3,.35,24),material(color));disc.position.copy(p);disc.position.y+=.2;disc.receiveShadow=true;group.add(disc);
  for(const side of [-1,1]){const column=new THREE.Mesh(new THREE.BoxGeometry(.65,3,.65),material(color));column.position.set(p.x,heightAt(p.x,p.z+side*2.6)+1.5,p.z+side*2.6);column.castShadow=true;group.add(column);}
  gates.push(p.toArray());
 }
 function placementAt(x,z){let reason='Click to place';const y=heightAt(x,z),near=(a,b,r)=>Math.hypot(x-a,z-b)<r;
  if(Math.abs(x)>245||Math.abs(z)>215)reason='Outside the build area';
  else if(Math.abs(x-riverX(z))<12)reason='Choose dry ground';
  else if(route.distanceTo(x,z)<4)reason='Keep the enemy path clear';
  else if(slots.some(s=>near(s.point.x,s.point.z,2.8)))reason='Reserved defense position';
  else if(structures.some(s=>x>s.bounds.min[0]-1.3&&x<s.bounds.max[0]+1.3&&z>s.bounds.min[2]-1.3&&z<s.bounds.max[2]+1.3))reason='Too close to a structure';
  else if(decor.some(d=>near(d.x,d.z,d.radius+1.2))||forest.some(d=>near(d.x,d.z,1.8*d.scale+1)))reason='Choose a clearing';
  else if(Math.max(...[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3]].map(([dx,dz])=>Math.abs(heightAt(x+dx,z+dz)-y)))>.65)reason='The slope is too steep';
  return {valid:reason==='Click to place',reason,y};
 }
 return {route,towerSlots,heightAt,placementAt,surface:lawn,state:()=>({id:'garden-switchback-v3',seed:MAP_SEED,areaMultiplier:MAP_AREA_MULTIPLIER,width:94*MAP_SCALE,depth:66*MAP_SCALE,worldWidth:520,worldDepth:460,terrain:{min:low,max:high},districts,structures,forest,pathWidth:4.4,length:route.length,route:route.points,decor,availableTowerSlots:slots.length,gates})};
}
