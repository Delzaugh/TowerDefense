const fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
const base=process.cwd(),out=path.join(__dirname,'validation');
const server=http.createServer((req,res)=>{let p=req.url;
 if(p==='/'){res.setHeader('content-type','text/html');res.end('<style>body{margin:0}</style><script type="importmap">{"imports":{"three":"/vendor/three.module.js","../utils/BufferGeometryUtils.js":"/vendor/BufferGeometryUtils.js"}}</script>');return;}
 const file=p.startsWith('/vendor/')?path.join(base,'tools/asset-inspector',p):path.join(base,'assets/runtime/environment',path.basename(p));
 try{res.setHeader('content-type',p.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1100,height:850}});await page.goto('http://127.0.0.1:'+server.address().port);
const audit=await page.evaluate(async()=>{
 const T=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');const loader=new GLTFLoader();
 const tile=(await loader.loadAsync('/campus_tile_canyon_v01.glb')).scene,decor=(await loader.loadAsync('/campus_canyon_decor_v01.glb')).scene;decor.position.y=1.2;
 const scene=new T.Scene();scene.background=new T.Color('#dce5ed');scene.add(tile,decor);scene.add(new T.HemisphereLight(0xffffff,0x667788,2.5));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-20,35,25);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.1,far:100});light.shadow.normalBias=.035;light.shadow.bias=-.0001;scene.add(light);scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.updateMatrixWorld(true);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setSize(1100,850);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
 const camera=new T.OrthographicCamera(-22,22,17,-17,.01,1000);
 window.capture=(name)=>{let t=[0,1.5,0],p=[30,34,36],s=22;if(name==='reverse')p=[-30,27,-36];if(name==='close'){p=[11,14,17];t=[-1,1.1,0];s=10;}camera.left=-s;camera.right=s;camera.top=s*850/1100;camera.bottom=-camera.top;camera.updateProjectionMatrix();camera.position.set(...p);camera.lookAt(...t);renderer.render(scene,camera);};
 const ray=new T.Raycaster(),height=(x,z)=>{ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));return ray.intersectObject(tile,true)[0]?.point.y;};
 const approaches=[];for(const x of [-2.6,-1,.6])for(const z of [-15,-10,-6.588457268,5.411542732,8,12,15])approaches.push({x,z,y:height(x,z)});
 const shelter=[];for(const x of [3.9,9.1])for(const z of [8.8,12.6])shelter.push({x,z,y:height(x,z)});
 const anchors={};for(const name of ['anchor_route_north','anchor_route_south'])anchors[name]=decor.getObjectByName(name).getWorldPosition(new T.Vector3()).toArray();
 const normals={bed:[],water:[],downwardUpper:0,upwardBottom:0};tile.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<p.count;i++){let y=p.getY(i),ny=n.getY(i);if(Math.abs(y-.15)<.00001)normals.bed.push(ny);if(Math.abs(y-.175)<.00001)normals.water.push(ny);if(y>0&&ny<-.00001)normals.downwardUpper++;if(Math.abs(y)<.00001&&ny>.00001)normals.upwardBottom++;}});
 return {approaches,shelter,anchors,bed:height(0,2),water:height(0,0),normals};
});fs.writeFileSync(path.join(out,'assembly-contact-audit.json'),JSON.stringify(audit,null,2));
for(const name of ['iso','reverse','close']){await page.evaluate(n=>window.capture(n),name);const dest=path.join(out,'shadowed-assembly-'+name+'.png');await page.screenshot({path:dest});fs.copyFileSync(dest,path.join(base,'blender/environment/campus_canyon_decor/v01/validation','shadowed-assembly-'+name+'.png'));}
console.log(JSON.stringify(audit));await browser.close();server.close();
})();

