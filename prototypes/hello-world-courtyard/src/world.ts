import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import baseAsset from 'tower-asset:copilot_base@v02';
import developerAsset from 'tower-asset:copilot_developer@v01';
import testerAsset from 'tower-asset:copilot_tester@v01';
import taskAsset from 'tower-asset:work_coding_task@v01';
import bugAsset from 'tower-asset:problem_bug@v01';
import labAsset from 'tower-asset:campus_lab@v01';
import treeAsset from 'tower-asset:campus_tree_round@v01';
import pondAsset from 'tower-asset:campus_pond@v01';
import benchAsset from 'tower-asset:campus_planter_bench@v01';
import { FOOTPRINT, PATH_WIDTH, RANGE, ROUTE, SERVER, SITES, TREES } from './map';
import type { DraftEvent, DraftState, Point, Persona } from './types';

interface Actor { root: THREE.Group; model: THREE.Object3D; mixer: THREE.AnimationMixer; clips: Map<string, THREE.AnimationAction>; current: string; persona?: Persona; bar?: THREE.Mesh; barGroup?: THREE.Group; }
const palette = { path: 0x48647d, chalk: 0xe2edf0, slate: 0x89a4b8, signal: 0x82dadd, grass: 0x9dbbac, soil: 0x729a89, dark: 0x243d52, amber: 0xe8b567 };
const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: .03 });

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s;
}
function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
}
function label(text: string, width: number, color='#243d52', background='#e2edf0') {
  const c = document.createElement('canvas'); c.width=512; c.height=128;
  const ctx=c.getContext('2d')!; ctx.fillStyle=background; ctx.beginPath(); ctx.roundRect(4,4,504,120,18); ctx.fill();
  ctx.fillStyle=color; ctx.font='600 42px Segoe UI, sans-serif'; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,65,476);
  const texture=new THREE.CanvasTexture(c); texture.colorSpace=THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false})); sprite.scale.set(width,width/4,1); sprite.renderOrder=8; return sprite;
}
function circleLine(radius: number, mat: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
  const ps=Array.from({length:97},(_,i)=>new THREE.Vector3(Math.cos(i/96*Math.PI*2)*radius,.08,Math.sin(i/96*Math.PI*2)*radius));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(ps),mat);line.computeLineDistances();return line;
}

export class CourtyardWorld {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.OrthographicCamera(-25,25,20,-20,.1,160);
  readonly renderer: THREE.WebGLRenderer;
  readonly canvas: HTMLCanvasElement;
  private templates=new Map<string,GLTF>();
  private towers=new Map<number,Actor>();
  private entities=new Map<number,Actor>();
  private dynamic=new THREE.Group();
  private highlights=new THREE.Group();
  private beams=new Map<number,{line:THREE.Line,ttl:number}>();
  private floating: {sprite:THREE.Sprite,ttl:number}[]=[];
  private coverageMesh: THREE.Mesh;
  private nominal: THREE.Line;
  private selectedRing: THREE.Line;
  private ghostRing: THREE.Line;
  private ghostModel: THREE.Object3D | null=null;
  private ghostRoot=new THREE.Group();
  private coverageKey='';
  private raycaster=new THREE.Raycaster();
  private rayPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  private view: 'iso'|'top'='iso';
  private resizeObserver: ResizeObserver;
  private abort=new AbortController();
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private feature:THREE.Mesh;

  constructor(private host:HTMLElement) {
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.canvas=this.renderer.domElement;this.canvas.setAttribute('aria-label','Hello World Courtyard 3D map');this.canvas.tabIndex=0;
    this.host.append(this.canvas);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene.background=new THREE.Color(0xdce7e1);
    this.scene.add(new THREE.HemisphereLight(0xf7fcff,0x779889,2.8));
    const sun=new THREE.DirectionalLight(0xfff4df,3.3);sun.position.set(-14,28,15);sun.castShadow=true;
    sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
    Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:75});sun.shadow.bias=-.00015;sun.shadow.normalBias=.045;
    this.scene.add(sun,new THREE.AmbientLight(0xe2f0ff,.35));
    this.makeTerrain();this.makeServer();this.makeGate();
    this.scene.add(this.dynamic,this.highlights,this.ghostRoot);
    const coverageMat=new THREE.MeshBasicMaterial({color:0x33b4b8,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
    this.coverageMesh=new THREE.Mesh(new THREE.BufferGeometry(),coverageMat);this.coverageMesh.renderOrder=2;this.highlights.add(this.coverageMesh);
    this.nominal=circleLine(RANGE,new THREE.LineDashedMaterial({color:0x2c858c,dashSize:.28,gapSize:.18,transparent:true,opacity:.55}));this.highlights.add(this.nominal);
    this.selectedRing=circleLine(FOOTPRINT+.14,new THREE.LineBasicMaterial({color:0x159faa,linewidth:2}));this.highlights.add(this.selectedRing);
    this.ghostRing=circleLine(FOOTPRINT,new THREE.LineBasicMaterial({color:0x35a06c}));this.ghostRoot.add(this.ghostRing);
    this.feature=box(1.5,.18,1.3,material(palette.signal),17,2.1,10.5);this.feature.visible=false;this.scene.add(this.feature);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  }

  private makeTerrain() {
    const base=new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(42,34,2),{depth:.85,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.3,bevelThickness:.2,curveSegments:5}),material(palette.soil));
    base.rotation.x=-Math.PI/2;base.position.y=-1.08;base.receiveShadow=true;this.scene.add(base);
    const lawn=new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(41.8,33.8,2),5),material(palette.grass));lawn.rotation.x=-Math.PI/2;lawn.position.y=-.015;lawn.receiveShadow=true;this.scene.add(lawn);
    const outer:Point[]=[],inner:Point[]=[];
    const contour=(width:number)=> {
      const left:Point[]=[],right:Point[]=[];
      ROUTE.forEach((p,i)=>{
        const before=ROUTE[Math.max(0,i-1)],after=ROUTE[Math.min(ROUTE.length-1,i+1)];
        const v1=new THREE.Vector2(p.x-before.x,p.z-before.z),v2=new THREE.Vector2(after.x-p.x,after.z-p.z);
        if(i===0)v1.copy(v2);if(i===ROUTE.length-1)v2.copy(v1);v1.normalize();v2.normalize();
        const n1=new THREE.Vector2(-v1.y,v1.x),n2=new THREE.Vector2(-v2.y,v2.x),n=n1.clone().add(n2).normalize();
        const dist=width/2/Math.max(.4,n.dot(n1));left.push({x:p.x+n.x*dist,z:p.z+n.y*dist});right.push({x:p.x-n.x*dist,z:p.z-n.y*dist});
      });return [...left,...right.reverse()];
    };
    outer.push(...contour(PATH_WIDTH+.48));inner.push(...contour(PATH_WIDTH));
    for(const [points,y,color] of [[outer,.018,palette.chalk],[inner,.04,palette.path]] as const) {
      const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z));shape.closePath();
      const road=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));road.rotation.x=-Math.PI/2;road.position.y=y;road.receiveShadow=true;this.scene.add(road);
    }
    const paving=box(9,.04,8,material(0xbdd0c9),15,-.002,12);paving.castShadow=false;this.scene.add(paving);
    const whiteMat=new THREE.MeshBasicMaterial({color:palette.signal,side:THREE.DoubleSide});
    for(let i=1;i<ROUTE.length;i++){
      const a=ROUTE[i-1],b=ROUTE[i],angle=Math.atan2(b.z-a.z,b.x-a.x);
      const shape=new THREE.Shape();shape.moveTo(-.32,-.25);shape.lineTo(.12,0);shape.lineTo(-.32,.25);shape.lineTo(-.1,.25);shape.lineTo(.34,0);shape.lineTo(-.1,-.25);shape.closePath();
      const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),whiteMat);arrow.rotation.set(-Math.PI/2,0,-angle);arrow.position.set((a.x+b.x)/2,.06,(a.z+b.z)/2);this.scene.add(arrow);
    }
    const siteMaterial=new THREE.LineDashedMaterial({color:0x578570,dashSize:.2,gapSize:.18,transparent:true,opacity:.55});
    SITES.forEach((p,i)=>{const ring=circleLine(FOOTPRINT+.2,siteMaterial);ring.position.set(p.x,.005,p.z);this.scene.add(ring);const n=label(String(i+1),.75,'#47715b','#d1e2d8');n.position.set(p.x,.18,p.z);this.scene.add(n);});
    const boundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-18,-13],[18,-13],[18,13],[-18,13]].map(([x,z])=>new THREE.Vector3(x,.015,z))),new THREE.LineDashedMaterial({color:0x729784,dashSize:.22,gapSize:.2,transparent:true,opacity:.25}));boundary.computeLineDistances();this.scene.add(boundary);
    const pondPlaque=label('POND GARDEN',3.4,'#e2edf0','#48647d');pondPlaque.position.set(-12.4,.4,9.7);this.scene.add(pondPlaque);
    const goal=label('THE PRODUCT',4.5,'#e2edf0','#48647d');goal.position.set(15,6.2,12);this.scene.add(goal);
  }
  private makeServer() {
    const footprint=SERVER.footprint,w=footprint.max.x-footprint.min.x,d=footprint.max.z-footprint.min.z,x=(footprint.min.x+footprint.max.x)/2,z=0;
    const server=new THREE.Group();server.add(box(w,3.3,d,material(palette.slate),0,1.65,0));
    server.add(box(w+.06,.14,d+.06,material(palette.chalk),0,3.32,0));
    server.add(box(w-.12,2.75,.045,material(0x333e48),0,1.6,d/2+.024));
    const slotMat=material(palette.signal);
    for(let i=0;i<6;i++)server.add(box(w-.38,.07,.065,slotMat,0,.54+i*.4,d/2+.053));
    for(const edge of [-1,1])server.add(box(.08,2.75,.065,material(palette.chalk),edge*(w/2-.1),1.6,d/2+.058));
    server.position.set(x,.05,z);this.scene.add(server);
    const name=label('SERVER · BLOCKS SIGHT',4.7,'#e2edf0','#48647d');name.position.set(x,4.05,0);this.scene.add(name);
    const shape=new THREE.Box3(new THREE.Vector3(footprint.min.x,.065,footprint.min.z),new THREE.Vector3(footprint.max.x,.08,footprint.max.z));
    const outline=new THREE.Box3Helper(shape,0x334d61);this.scene.add(outline);
  }
  private makeGate() {
    const gate=new THREE.Group(),chalk=material(palette.chalk),slate=material(palette.slate);
    gate.add(box(.34,2.5,.4,chalk,-2,1.25,0),box(.34,2.5,.4,chalk,2,1.25,0),box(4.4,.7,.52,slate,0,2.5,0));
    const welcome=label('HELLO, WORLD!',4,'#e2edf0','#48647d');welcome.position.set(0,2.52,.3);gate.add(welcome);
    gate.position.set(-15,.05,-8);gate.rotation.y=Math.PI/2;this.scene.add(gate);
    const pulse=new THREE.Mesh(new THREE.RingGeometry(.62,.78,32),new THREE.MeshBasicMaterial({color:palette.signal,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;pulse.position.set(-15,.068,-8);this.scene.add(pulse);
  }
  async load(progress:(n:number)=>void) {
    const loader=new GLTFLoader();
    const assets={base:baseAsset,developer:developerAsset,tester:testerAsset,work:taskAsset,problem:bugAsset,lab:labAsset,tree:treeAsset,pond:pondAsset,bench:benchAsset};
    let done=0;
    await Promise.all(Object.entries(assets).map(async([id,asset])=>{
      const response=await fetch(asset.url,{signal:this.abort.signal});if(!response.ok)throw new Error(`Unable to load ${id} (HTTP ${response.status}).`);
      const gltf=await loader.parseAsync(await response.arrayBuffer(),asset.url.slice(0,asset.url.lastIndexOf('/')+1));
      gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      this.templates.set(id,gltf);progress(++done/Object.keys(assets).length);
    }));
    for(const p of TREES)this.addStatic('tree',p);
    this.addStatic('pond',{x:-12.5,z:7});
    const lab=this.addStatic('lab',{x:15,z:12},true);lab.rotation.y=Math.PI; // centered bounds; scene proxy only
    this.addStatic('bench',{x:-7,z:7});
    this.addStatic('bench',{x:7,z:-11.6});
    const ghost=clone(this.templates.get('base')!.scene);
    ghost.traverse(o=>{if(o instanceof THREE.Mesh){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone();copy.transparent=true;copy.opacity=.3;copy.depthWrite=false;return copy;});o.castShadow=false;}});
    this.ghostModel=ghost;this.ghostRoot.add(ghost);this.ghostRoot.visible=false;
  }
  private addStatic(id:string,p:Point,center=false) {
    const model=clone(this.templates.get(id)!.scene);const root=new THREE.Group();
    if(center){const b=new THREE.Box3().setFromObject(model),c=b.getCenter(new THREE.Vector3());model.position.x-=c.x;model.position.z-=c.z;model.position.y-=b.min.y;}
    root.add(model);root.position.set(p.x,.06,p.z);this.scene.add(root);return root;
  }
  private actor(key:string,bar=false):Actor {
    const template=this.templates.get(key)!;const model=clone(template.scene),root=new THREE.Group();root.add(model);root.position.y=.06;this.dynamic.add(root);
    const mixer=new THREE.AnimationMixer(model),clips=new Map(template.animations.map(c=>[c.name,mixer.clipAction(c)]));
    const actor:Actor={root,model,mixer,clips,current:''};this.play(actor,bar?'move':'idle');
    if(bar){
      const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.12),new THREE.MeshBasicMaterial({color:0x334958,side:THREE.DoubleSide,depthTest:false}));
      const fg=new THREE.Mesh(new THREE.PlaneGeometry(1.29,.07),new THREE.MeshBasicMaterial({color:key==='work'?palette.amber:0x82dadd,side:THREE.DoubleSide,depthTest:false}));
      fg.position.z=.004;const group=new THREE.Group();group.add(bg,fg);group.position.y=1.95;group.renderOrder=10;root.add(group);actor.bar=fg;actor.barGroup=group;
    }return actor;
  }
  private play(a:Actor,name:string) {
    if(a.current===name)return;const next=a.clips.get(name);if(!next)return;
    a.clips.get(a.current)?.fadeOut(.15);next.reset().fadeIn(.15).play();a.current=name;
  }
  private retireActor(a:Actor) {
    this.dynamic.remove(a.root);a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);
    // Cloned GLB geometry/materials are shared. Only these per-entity bars are owned here.
    a.barGroup?.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
  }
  point(clientX:number,clientY:number):Point|null {
    const rect=this.canvas.getBoundingClientRect(),p=new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(p,this.camera);const hit=this.raycaster.ray.intersectPlane(this.rayPlane,new THREE.Vector3());return hit?{x:hit.x,z:hit.z}:null;
  }
  pickTower(clientX:number,clientY:number):number|null {
    const rect=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),this.camera);
    const hits=this.raycaster.intersectObjects([...this.towers.values()].map(a=>a.root),true);
    for(const hit of hits){let o:THREE.Object3D|null=hit.object;while(o){if(typeof o.userData.towerId==='number')return o.userData.towerId;o=o.parent;}}
    // Oversized touch hit area projected in screen space, separate from model/collision.
    let nearest:number|null=null,best=25;
    for(const[id,a]of this.towers){const p=a.root.position.clone();p.y+=.9;p.project(this.camera);const distance=Math.hypot(rect.left+(p.x+1)/2*rect.width-clientX,rect.top+(1-p.y)/2*rect.height-clientY);if(distance<best){best=distance;nearest=id;}}return nearest;
  }
  setView(view:'iso'|'top') { this.view=view;this.camera.zoom=1;this.resize(); }
  private resize() {
    const width=this.host.clientWidth,height=this.host.clientHeight;if(!width||!height)return;
    this.renderer.setSize(width,height,false);
    if(this.view==='top'){this.camera.up.set(0,0,-1);this.camera.position.set(0,70,0);this.camera.lookAt(0,0,0);}else{this.camera.up.set(0,1,0);this.camera.position.set(37,44,49);this.camera.lookAt(0,0,1);}
    this.camera.updateMatrixWorld();
    const bounds=new THREE.Box3(new THREE.Vector3(-21,-1.5,-17),new THREE.Vector3(21,6.5,17)),lo=new THREE.Vector2(Infinity,Infinity),hi=new THREE.Vector2(-Infinity,-Infinity);
    for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse);lo.min(new THREE.Vector2(p.x,p.y));hi.max(new THREE.Vector2(p.x,p.y));}
    const aspect=width/height,vh=Math.max((hi.y-lo.y)*1.04,(hi.x-lo.x)*1.04/aspect),vw=vh*aspect,cx=(lo.x+hi.x)/2,cy=(lo.y+hi.y)/2;
    this.camera.left=cx-vw/2;this.camera.right=cx+vw/2;this.camera.top=cy+vh/2;this.camera.bottom=cy-vh/2;this.camera.updateProjectionMatrix();
    this.coverageKey='';
  }
  zoom(delta:number) {this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*(delta>0?.92:1.08),.8,1.7);this.camera.updateProjectionMatrix();}
  showSelection(selected:number|null,ghost:Point|null,valid:boolean,coverage:boolean,visible:(origin:Point,target:Point)=>boolean) {
    this.selectedRing.visible=selected!==null;const actor=selected===null?undefined:this.towers.get(selected);if(actor)this.selectedRing.position.copy(actor.root.position);
    this.ghostRoot.visible=Boolean(ghost)&&Boolean(this.ghostModel);if(ghost){this.ghostRoot.position.set(ghost.x,.06,ghost.z);(this.ghostRing.material as THREE.LineBasicMaterial).color.set(valid?0x2a9d6d:0xc34c4c);}
    const origin=ghost??(actor?{x:actor.root.position.x,z:actor.root.position.z}:null);
    this.nominal.visible=this.coverageMesh.visible=coverage&&Boolean(origin);
    if(!origin)return;
    this.nominal.position.set(origin.x,.03,origin.z);
    const key=`${origin.x.toFixed(2)}:${origin.z.toFixed(2)}:${coverage}`;if(key===this.coverageKey)return;this.coverageKey=key;
    const vertices:number[]=[];let prev:THREE.Vector3|null=null;
    for(let i=0;i<=96;i++){
      const angle=i/96*Math.PI*2,dx=Math.cos(angle),dz=Math.sin(angle);let length=RANGE;
      if(!visible(origin,{x:origin.x+dx*RANGE,z:origin.z+dz*RANGE})){let low=0,high=RANGE;for(let j=0;j<10;j++){const mid=(low+high)/2;if(visible(origin,{x:origin.x+dx*mid,z:origin.z+dz*mid}))low=mid;else high=mid;}length=low;}
      const p=new THREE.Vector3(origin.x+dx*length,.075,origin.z+dz*length);
      if(prev)vertices.push(origin.x,.075,origin.z,prev.x,prev.y,prev.z,p.x,p.y,p.z);prev=p;
    }
    this.coverageMesh.geometry.dispose();this.coverageMesh.geometry=new THREE.BufferGeometry();this.coverageMesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  }
  update(state:DraftState,delta:number,events:DraftEvent[]) {
    for(const event of events){
      if(event.type==='tower_action'&&event.towerId!==undefined&&event.entityId!==undefined){
        const tower=this.towers.get(event.towerId),entity=this.entities.get(event.entityId);
        if(tower&&entity){
          let beam=this.beams.get(event.towerId);
          if(!beam){const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({transparent:true,opacity:.75}));this.dynamic.add(line);beam={line,ttl:.16};this.beams.set(event.towerId,beam);}
          (beam.line.material as THREE.LineBasicMaterial).color.set(entity.root.userData.entityKind==='work'?palette.amber:0x58c4ce);
          beam.line.geometry.dispose();beam.line.geometry=new THREE.BufferGeometry().setFromPoints([tower.root.position.clone().add(new THREE.Vector3(0,1.1,0)),entity.root.position.clone().add(new THREE.Vector3(0,.8,0))]);beam.ttl=.17;beam.line.visible=true;
        }
      }
      if(['work_completed','problem_resolved','work_missed','problem_leaked'].includes(event.type)&&event.entityId!==undefined){const a=this.entities.get(event.entityId);if(a){const text=event.type==='work_completed'?`✓ +${event.compute??12}`:event.type==='problem_resolved'?'FIXED':event.type==='work_missed'?'+1 DEBT':'LEAK';const sprite=label(text,2.15,event.type.includes('missed')||event.type.includes('leaked')?'#913c3c':'#266151');sprite.position.copy(a.root.position).add(new THREE.Vector3(0,2,0));this.dynamic.add(sprite);this.floating.push({sprite,ttl:1.05});}}
    }
    const ids=new Set(state.towers.map(t=>t.id));for(const[id,a]of this.towers){if(!ids.has(id)){this.retireActor(a);this.towers.delete(id);}}
    for(const t of state.towers){let a=this.towers.get(t.id);if(!a||a.persona!==t.persona){if(a)this.retireActor(a);a=this.actor(t.persona);a.persona=t.persona;a.root.userData.towerId=t.id;this.towers.set(t.id,a);}
      a.root.position.set(t.x,.06,t.z);const target=state.entities.find(e=>e.id===t.targetId);if(target)a.root.rotation.y=Math.atan2(target.x-t.x,target.z-t.z);else a.root.rotation.y=.4;
      this.play(a,target?'work':'idle');a.mixer.update(delta);
    }
    const entityIds=new Set(state.entities.map(e=>e.id));for(const[id,a]of this.entities){if(!entityIds.has(id)){this.retireActor(a);this.entities.delete(id);}}
    for(const e of state.entities){let a=this.entities.get(e.id);if(!a){a=this.actor(e.kind,true);a.root.userData.entityId=e.id;a.root.userData.entityKind=e.kind;this.entities.set(e.id,a);}
      a.root.position.set(e.x,.07,e.z);a.root.rotation.y=Math.PI/2-e.facing;a.mixer.update(delta);
      if(a.bar){a.bar.scale.x=e.kind==='work'?Math.max(.02,e.progress):Math.max(.02,e.remaining/e.maximum);a.bar.position.x=(a.bar.scale.x-1)*.645;}
      if(a.barGroup){a.barGroup.quaternion.copy(this.camera.quaternion);a.barGroup.quaternion.premultiply(a.root.quaternion.clone().invert());}
      if(e.kind==='work'){a.model.traverse(o=>{if(o instanceof THREE.Mesh&&o.morphTargetDictionary&&o.morphTargetInfluences){const entries=Object.entries(o.morphTargetDictionary).filter(([name])=>/check/i.test(name));entries.forEach(([,index],i)=>{o.morphTargetInfluences![index]=e.progress>=(i+1)/3?1:0;});}});}
    }
    for(const beam of this.beams.values()){beam.ttl-=delta;beam.line.visible=beam.ttl>0;}
    for(let i=this.floating.length-1;i>=0;i--){const f=this.floating[i];f.ttl-=delta;if(!this.reduced)f.sprite.position.y+=delta*.8;(f.sprite.material as THREE.SpriteMaterial).opacity=Math.min(1,f.ttl*3);if(f.ttl<=0){this.dynamic.remove(f.sprite);f.sprite.material.map?.dispose();f.sprite.material.dispose();this.floating.splice(i,1);}}
    this.feature.visible=state.phase==='complete'&&state.completed>0;
    if(state.towers.length===0&&state.time===0){for(const beam of this.beams.values()){beam.ttl=0;beam.line.visible=false;}for(const f of this.floating){this.dynamic.remove(f.sprite);f.sprite.material.map?.dispose();f.sprite.material.dispose();}this.floating=[];}
    this.renderer.render(this.scene,this.camera);
  }
  screenPoint(point:Point,height=0) {const p=new THREE.Vector3(point.x,height,point.z).project(this.camera),r=this.canvas.getBoundingClientRect();return{x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};}
  diagnostics(){return{calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,dpr:this.renderer.getPixelRatio(),camera:this.view,zoom:this.camera.zoom};}
  destroy(){
    this.abort.abort();this.resizeObserver.disconnect();
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    const collect=(o:THREE.Object3D)=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Sprite){if('geometry' in o)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}};
    this.scene.traverse(collect);for(const template of this.templates.values())template.scene.traverse(collect);
    for(const m of materials){for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);m.dispose();}
    for(const g of geometries)g.dispose();for(const t of textures)t.dispose();
    this.renderer.dispose();this.canvas.remove();
  }
}
