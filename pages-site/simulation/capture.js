import {MAP_SEED,MODELS,MAP_AREA_MULTIPLIER} from './config.js';

export function createCapture({renderer,metrics,actors,draw,state,setView,setAnimating,beforeRun,afterRun}){
 let report=null,running=false,phase='ready',abort=null;
 const staticHosting=document.querySelector('meta[name="campus-hosting"]')?.content==='static';
 const button=document.querySelector('#run'),status=document.querySelector('#simulation-status'),download=document.querySelector('#download-report');
 const controls=()=>document.querySelectorAll('#tower-count,[data-view],#zoom-in,#zoom-out,#performance-reset,#toggle-bert,#toggle-octocat,#max-enemies,#camera-reset,[data-tower],#placement-cancel,#placement-undo,#placement-clear');
 function saveDownload(){if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`garden-waves-${report.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 download.addEventListener('click',saveDownload);
 function cancel(reason='Stopped by user'){if(running)abort.abort(new Error(reason));}
 function wait(ms){return new Promise((resolve,reject)=>{const signal=abort.signal;if(signal.aborted)return reject(signal.reason);const stop=()=>{clearTimeout(timer);reject(signal.reason);};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},ms);signal.addEventListener('abort',stop,{once:true});});}
 function capture(name){
  const measurement=metrics.snapshot({raw:true});draw();
  const load=actors.state();report.cases.push({name,load,measurement,screenshot:renderer.domElement.toDataURL('image/png'),checks:{manualTowers:load.manualTowers===report.configuration.manualTowers,enemyCap:load.peak<=report.configuration.enemyCap,octocats:load.octocats===report.configuration.octocats,heavyTowers:load.heavyTowers===report.configuration.heavyTowers,
   fps:measurement.fps>=28,frameP95:measurement.frameIntervalMs.p95<=50,cpuP95:measurement.cpuSubmissionMs.p95<=16.7,calls:measurement.renderDistribution.calls.max<=600,triangles:measurement.renderDistribution.triangles.max<=1000000}});
  metrics.reset();
 }
 async function run(){
  if(running)return;beforeRun?.();running=true;abort=new AbortController();phase='preparing';download.hidden=true;
  document.querySelector('#navigation-hint').textContent='Camera locked during recording';button.textContent='Stop simulation';button.dataset.running='true';controls().forEach(c=>c.disabled=true);
  report={schemaVersion:1,scene:'garden-switchback-v3',id:new Date().toISOString().replace(/[:.]/g,'-'),status:'running',startedAt:new Date().toISOString(),cases:[],errors:[],configuration:{waves:actors.state().waves,enemyCap:actors.state().settings.maxEnemies,mapSeed:MAP_SEED,towers:actors.state().towers,manualTowers:actors.state().manualTowers,totalTowers:actors.state().totalTowers,placedTowers:actors.state().placedTowers,octocats:actors.state().octocats,heavyTowers:actors.state().heavyTowers,settings:actors.state().settings,mapAreaMultiplier:MAP_AREA_MULTIPLIER,enemySpeeds:MODELS.filter(m=>m.enemy).map(m=>({id:m.id,factor:m.speedFactor})),targetFPS:30},
   notes:['Dedicated map with seeded environment decor. Bert and Octocat can each be enabled or disabled. Enabled Octocats are two stationary special characters; enabled Berts occupy two slots in the chosen tower total.',
    'Bug, Vague Spec and Missing Details walk the same route in three waves. Overflow waits at entry; the chosen cap limits active enemies. Wave totals scale to twice the cap. All spawned enemies reach the destination.',
    'Placed towers are separate from preset counts and are retained through cleanup. Copilot and Bert play work. Developer currently has no authored clips and uses runtime aiming and cosmetic beams. No damage, kills, economy or gameplay balance simulation.',
    'Counts include shadow rendering. CPU submission is not GPU time. Bone textures contribute to texture counts. Fixed 30 FPS target; no GPU headroom estimate.',
    'Each case is a consecutive timeline sample. Capture work is excluded. Device emulation is not physical phone testing.'],initialState:state()};
  const original={warn:console.warn,error:console.error};
  const record=(type,message)=>report.errors.push({type,message:String(message),phase});
  const onError=e=>record('error',e.message||e.target?.src||'Resource error'),onReject=e=>record('rejection',e.reason?.stack||e.reason);
  addEventListener('error',onError,true);addEventListener('unhandledrejection',onReject);
  for(const key of Object.keys(original))console[key]=(...args)=>{record(key,args.join(' '));original[key](...args);};
  try{
   status.textContent='Warming models and preparing automatic capture…';
   const response=await fetch(staticHosting?'/TowerDefense/stress-revision.json':'/TowerDefense/stress-revision',{signal:abort.signal});if(!response.ok)throw new Error('Source revision capture failed');report.revision=await response.json();
   actors.warm();draw();actors.clearEnemies();draw();setAnimating(true);phase='baseline';await wait(1000);metrics.reset();await wait(2000);capture('baseline');
   actors.start();phase='waves';metrics.reset();const thresholds=[8,20,32,44,56,68,80,92];let index=0;
   const started=performance.now();
   while(!actors.state().done){
    await wait(100);const s=actors.state();status.textContent=`Wave ${s.wave} / 3 · ${s.active} enemies on the path · ${Math.max(0,s.queued)} queued · recording automatically`;
    if(index<thresholds.length&&s.time>=thresholds[index]){capture(`waves-${thresholds[index]}s`);index++;}
    if(performance.now()-started>180000)throw new Error('Wave run exceeded three minutes');
   }
   capture('waves-complete');report.waveResult=actors.state();
   actors.clearEnemies();draw();phase='recovery';metrics.reset();await wait(2000);capture('recovery');
   const before=report.cases[0].measurement,after=report.cases.at(-1).measurement;
   report.cleanup={before:{geometries:before.geometries,textures:before.textures,meshes:before.meshes},after:{geometries:after.geometries,textures:after.textures,meshes:after.meshes}};
   report.cleanup.passed=Object.keys(report.cleanup.before).every(k=>report.cleanup.before[k]===report.cleanup.after[k]);
   setAnimating(false);metrics.reset();await wait(700);report.pausedFrames=metrics.snapshot().frames;report.status='completed';
  }catch(error){report.status=abort.signal.aborted?'cancelled':'failed';report.reason=error.message;report.partial={phase,state:state(),measurement:metrics.snapshot({raw:true})};}
  finally{
   actors.clearEnemies();setAnimating(false);draw();
   report.finishedAt=new Date().toISOString();report.finalState=state();
   report.correctnessPassed=report.status==='completed'&&report.cleanup?.passed&&report.pausedFrames===0&&report.errors.length===0&&report.waveResult?.peak<=report.configuration.enemyCap&&report.waveResult?.arrived===report.configuration.enemyCap*2;
   report.overBudgetCases=report.cases.filter(c=>Object.values(c.checks).some(v=>!v)).map(c=>c.name);
   removeEventListener('error',onError,true);removeEventListener('unhandledrejection',onReject);Object.assign(console,original);
   phase='saving';status.textContent='Saving the full report and map screenshots…';
   if(staticHosting){report.storage={mode:'browser-download',screenshots:report.cases.length};status.textContent=report.status==='completed'?`Complete · peak ${report.waveResult.peak} / ${report.configuration.enemyCap} enemies · report ready. Tap Download full report to save it.`:`${report.status}: ${report.reason}. Tap Download full report to save the partial capture.`;}
   else try{const response=await fetch('/TowerDefense/stress-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Save returned ${response.status}`);report.saved=await response.json();
    status.textContent=report.status==='completed'?`Complete · peak ${report.waveResult.peak} / ${report.configuration.enemyCap} enemies · ${report.overBudgetCases.length} samples above a performance budget · report and screenshots saved.`:`${report.status}: ${report.reason}. Partial report saved.`;
   }catch(error){report.saveError=error.message;status.textContent='Project save failed. Your full report is downloading; the download button remains available.';saveDownload();}
   document.querySelector('#navigation-hint').textContent='Scroll to zoom · Drag to pan';running=false;phase='ready';controls().forEach(c=>c.disabled=false);afterRun?.();button.textContent='Run again ↗';button.dataset.running='false';download.hidden=false;
  }
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel('Page hidden during capture');});
 addEventListener('resize',()=>cancel('Viewport changed during capture'));
 renderer.domElement.addEventListener('webglcontextlost',()=>cancel('WebGL context lost'));
 button.disabled=false;button.addEventListener('click',()=>running?cancel():void run());
 return {run,cancel,state:()=>({running,phase,report})};
}
