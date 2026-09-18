const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]:0;};
export function createCampusPerformance(renderer,scene){
 const panel=document.querySelector('#performance-panel'),button=document.querySelector('#performance-toggle'),output=document.querySelector('#performance-output');
 let samples=[],last=0,loadMs=0,longTasks=[],ready=false;
 let observer;
 try{observer=new PerformanceObserver(list=>{longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})));longTasks=longTasks.slice(-500);});observer.observe({type:'longtask',buffered:true});}catch{}
 const reset=()=>{samples=[];last=0;longTasks=[];};
 button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));refresh();});
 document.querySelector('#performance-reset').addEventListener('click',reset);
 document.querySelector('#performance-download').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='campus-performance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 function snapshot(){
  const cpu=samples.map(s=>s.cpu),intervals=samples.map(s=>s.interval).filter(Boolean),resources=performance.getEntriesByType('resource').filter(r=>r.name.includes('/runtime/'));
  let meshes=0,skinnedMeshes=0;scene.traverse(o=>{if(o.isMesh)meshes++;if(o.isSkinnedMesh)skinnedMeshes++;});
  const mean=intervals.reduce((a,b)=>a+b,0)/(intervals.length||1);
  const gl=renderer.getContext();
  return {capturedAt:new Date().toISOString(),ready,loadMs,frames:samples.length,fps:mean?1000/mean:0,frameIntervalMs:{p50:percentile(intervals,.5),p95:percentile(intervals,.95)},cpuSubmissionMs:{p50:percentile(cpu,.5),p95:percentile(cpu,.95)},framesOver50ms:intervals.filter(v=>v>50).length,longTasks:longTasks.length,longTaskMs:longTasks.reduce((a,b)=>a+b.duration,0),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length,meshes,skinnedMeshes,glbRequests:resources.length,uniqueGLBs:new Set(resources.map(r=>r.name)).size,glbDecodedBytes:resources.reduce((a,b)=>a+b.decodedBodySize,0),viewport:{width:innerWidth,height:innerHeight,dpr:renderer.getPixelRatio(),bufferWidth:renderer.domElement.width,bufferHeight:renderer.domElement.height},renderer:gl.getParameter(gl.RENDERER),userAgent:navigator.userAgent,scene:window.campusStudyState?.(),notes:['Target: 30 rendered frames/s during ambience. Paused frames are demand-driven.','CPU time includes animation, presentation and WebGL submission; it is not GPU time.','Renderer counters include the shadow pass. Texture/geometries are counts, not VRAM bytes.','Local load time includes parsing, assembly, validation and first render; production network latency is not represented.','Rolling window: up to 900 frames. Hidden-tab transitions and pause transitions reset frame intervals.']};
 }
 function refresh(){if(panel.hidden)return;const s=snapshot();output.textContent=`${s.fps.toFixed(1)} FPS · target 30\nFrame p95 ${s.frameIntervalMs.p95.toFixed(1)} ms\nCPU submit p95 ${s.cpuSubmissionMs.p95.toFixed(1)} ms\n${s.drawCalls} calls · ${s.triangles.toLocaleString()} triangles\n${s.geometries} geometries · ${s.textures} textures\n${s.skinnedMeshes} skinned meshes · ${s.longTasks} long tasks\nReady ${(s.loadMs/1000).toFixed(2)} s · GLBs ${(s.glbDecodedBytes/1048576).toFixed(2)} MiB`;}
 const timer=setInterval(refresh,1000);addEventListener('pagehide',()=>{clearInterval(timer);observer?.disconnect();},{once:true});
 return {begin:()=>performance.now(),end(start){const now=performance.now();samples.push({cpu:now-start,interval:last?now-last:0});last=now;if(samples.length>900)samples.shift();},breakCadence(){last=0;},ready(){loadMs=performance.now();ready=true;reset();refresh();},snapshot,reset};
}
