import {STRESS_PLAN as PLAN} from './stress-config.js';
const LIMITS={fps:28,frameP95Ms:50,cpuP95Ms:16.7,calls:600,triangles:1000000,textures:64};
export function createStressTest({renderer,metrics,load,draw,getState,setState}){
 const button=document.querySelector('#simulation-toggle'),status=document.querySelector('#simulation-status');
 const download=document.querySelector('#simulation-download');
 let running=false,controller,lastReport=null,phase='idle';
 function downloadReport(){
  if(!lastReport)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`campus-stress-${lastReport.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 download.addEventListener('click',downloadReport);
 const cancel=reason=>{if(running&&!controller.signal.aborted)controller.abort(new Error(reason));};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel('Page hidden; timing sample interrupted');});
 addEventListener('resize',()=>cancel('Viewport changed; timing sample interrupted'));
 renderer.domElement.addEventListener('webglcontextlost',()=>cancel('WebGL context lost'));
 function wait(ms){return new Promise((resolve,reject)=>{
  const signal=controller.signal;
  if(signal.aborted){reject(signal.reason);return;}
  const abort=()=>{clearTimeout(timer);reject(signal.reason);};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
  signal.addEventListener('abort',abort,{once:true});
 });}
 function announce(text){status.textContent=text;}
 async function run(){
  if(running)return;
  running=true;controller=new AbortController();lastReport=null;download.hidden=true;
  const saved=getState(),disabled=[];
  for(const control of document.querySelectorAll('[data-camera],.zoom-controls button,#motion-toggle,#performance-reset,.building-label')){
   disabled.push([control,control.disabled]);control.disabled=true;
  }
  document.body.dataset.stress='true';
  const panel=document.querySelector('#performance-panel');panel.hidden=false;
  document.querySelector('#performance-toggle').setAttribute('aria-expanded','true');
  button.textContent='Stop simulation';button.setAttribute('aria-pressed','true');
  const report={schemaVersion:1,id:new Date().toISOString().replace(/[:.]/g,'-'),startedAt:new Date().toISOString(),status:'running',
   configuration:{plan:PLAN,views:['home','top'],warmupMs:2000,sampleMs:8000,targetFPS:30,limits:LIMITS},
   notes:['Synthetic rendering/animation load added to the campus; no gameplay targeting, collision, projectiles or wave AI.',
    'Models retain authored scale; stationary tower rings and circular moving lanes may overlap campus props. Counts are added to existing campus actors.',
    'Tower totals include exactly two Bert Breugelmans models in every loaded stage. Tower attack activity maps to the authored looping work clip; movers use move.',
    'Moving counts are distributed round-robin across Octocat, Bug and Vague Spec. All five model types are warmed before the baseline for comparable resource cleanup checks.',
    'Shared geometry/materials, independent skeletons and animation mixers; no instancing. Actual asset triangles may differ from the 3,000-triangle tower reference.',
    '30 FPS cap retained. CPU submission is not GPU time; shadow passes included in render counters. Heap metrics are optional and not VRAM.',
    'Budget flags are provisional diagnostics. Desktop phone emulation does not establish physical phone performance.',
    'Screenshots capture the rendered canvas after each sample; capture/serialization work is outside timed samples.'],
   initialState:saved,initialMetrics:metrics.snapshot(),cases:[],errors:[],events:[]};
  const recordError=(type,message)=>report.errors.push({type,message:String(message),phase,at:new Date().toISOString()});
  const onError=e=>recordError('error',e.message||e.target?.src||'Resource failed');
  const onReject=e=>recordError('unhandledrejection',e.reason?.stack||e.reason);
  addEventListener('error',onError,true);addEventListener('unhandledrejection',onReject);
  const originals={warn:console.warn,error:console.error};
  for(const key of Object.keys(originals))console[key]=(...args)=>{recordError(key,args.map(a=>a?.stack||String(a)).join(' '));originals[key].apply(console,args);};
  const capture=()=>{draw();return renderer.domElement.toDataURL('image/png');};
  async function sample(spec,view){
   const summary=`${spec.towers} attacking towers (${spec.heavyTowers??0} Bert) + ${spec.movers} mixed movers`;
   phase=`${spec.name}/${view}`;announce(`${spec.name}: ${summary} · ${view} · warming up`);
   load.setLoad(spec);setState({view,zoom:1,target:[0,1.6,0],paused:false,time:0});
   await wait(2000);metrics.reset();
   announce(`${spec.name}: ${summary} · ${view} · recording 8 seconds`);
   await wait(8000);
   const measurement=metrics.snapshot({raw:true});
   const checks={enoughFrames:measurement.frames>=30,fps:measurement.fps>=LIMITS.fps,
    frameP95:measurement.frameIntervalMs.p95<=LIMITS.frameP95Ms,cpuP95:measurement.cpuSubmissionMs.p95<=LIMITS.cpuP95Ms,
    calls:measurement.renderDistribution.calls.max<=LIMITS.calls,triangles:measurement.renderDistribution.triangles.max<=LIMITS.triangles,
    textures:measurement.textures<=LIMITS.textures};
   report.cases.push({name:spec.name,view,load:load.state(),measurement,checks,screenshot:capture()});
  }
  try{
   phase='preparing';announce('Preparing repeatable stress simulation…');
   const response=await fetch('/TowerDefense/stress-revision',{signal:controller.signal});if(!response.ok)throw new Error('Unable to capture source revision');
   report.revision=await response.json();
   await load.prepare(controller.signal);
   // Compile/upload every model before baseline so resource checks compare warm caches.
   setState({view:'home',zoom:1,target:[0,1.6,0],paused:false,time:0});
   load.setLoad({towers:3,heavyTowers:2,movers:3});draw();load.clear();draw();
   for(const spec of PLAN){await sample(spec,'home');await sample(spec,'top');}
   load.clear();await sample({name:'recovery',towers:0,movers:0},'home');
   phase='pause-check';setState({paused:true});metrics.reset();await wait(1000);
   report.pausedFrames=metrics.snapshot().frames;
   const baseline=report.cases[0].measurement,recovery=report.cases.at(-1).measurement;
   report.cleanup={before:{geometries:baseline.geometries,textures:baseline.textures,meshes:baseline.meshes,skinnedMeshes:baseline.skinnedMeshes},
    after:{geometries:recovery.geometries,textures:recovery.textures,meshes:recovery.meshes,skinnedMeshes:recovery.skinnedMeshes}};
   report.cleanup.passed=Object.keys(report.cleanup.before).every(k=>report.cleanup.before[k]===report.cleanup.after[k]);
   report.status='completed';
  }catch(error){
   report.status=controller.signal.aborted?'cancelled':'failed';report.reason=error.message;
   report.partial={phase,load:load.state(),measurement:metrics.snapshot({raw:true})};
   if(report.status==='failed')recordError('runner',error.stack||error.message);
  }finally{
   load.clear();setState(saved);metrics.reset();
   report.finalState=getState();report.finishedAt=new Date().toISOString();
   report.correctnessPassed=report.status==='completed'&&report.cleanup?.passed&&report.pausedFrames===0&&report.errors.length===0&&report.cases.every(c=>c.checks.enoughFrames);
   report.overBudgetCases=report.cases.filter(c=>Object.values(c.checks).some(v=>!v)).map(c=>`${c.name}/${c.view}`);
   removeEventListener('error',onError,true);removeEventListener('unhandledrejection',onReject);
   Object.assign(console,originals);
   disabled.forEach(([control,value])=>control.disabled=value);delete document.body.dataset.stress;
   phase='saving';announce('Saving measurements and screenshots…');lastReport=report;
   try{
    const response=await fetch('/TowerDefense/stress-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(`Save returned ${response.status}`);
    report.saved=await response.json();
    announce(`${report.status==='completed'?'Simulation complete':`Simulation ${report.status}: ${report.reason}`}. ${report.overBudgetCases.length} samples exceeded a budget. ${report.correctnessPassed?'Cleanup and checks passed.':report.status==='completed'?'A correctness check failed; see report.':''} Saved: ${report.saved.path}`);
   }catch(error){report.saveError=error.message;announce(`Simulation ${report.status}. Project save failed; downloading report. Use “Download simulation report” to retry the download.`);downloadReport();}
   running=false;phase='idle';button.textContent='Run simulation';button.setAttribute('aria-pressed','false');download.hidden=false;
  }
 }
 button.disabled=false;button.addEventListener('click',()=>running?cancel('Stopped by user'):void run());
 return {run,cancel,state:()=>({running,phase,load:load.state(),lastReport})};
}
