import './style.css';
import { createDraftController } from './draft';
import { createUI } from './ui';
import { CourtyardWorld } from './world';
import { SITES } from './map';
import type { Point, Result, UIAction } from './types';

const controller=createDraftController();
let selected:number|null=null,placing=false,coverage=true,camera:'iso'|'top'='iso',loading=0;
let ghost:Point|null=null,ghostValid=false,notice='Place a Base Copilot, or try the suggested team.';
let loadError:string|undefined;
const ui=createUI(document.querySelector<HTMLElement>('#app')!,act);
const host=document.querySelector<HTMLElement>('#viewport')!;
let world:CourtyardWorld;
try{world=new CourtyardWorld(host);}catch(error){host.innerHTML='<div class="loading-banner">3D rendering could not start. Try a browser with WebGL enabled.</div>';throw error;}

const messages:Record<string,string>={path_blocked:'Keep Copilots beside the route.',blocked:'This space belongs to the Server or scenery.',outside_buildable:'Place inside the courtyard boundary.',overlap:'Leave room between Copilots.',insufficient_compute:'More Compute is needed for that choice.',paused:'Resume before changing your team.',wrong_phase:'Prepare the next round before changing the team.',already_owned:'This Copilot already has a permanent Persona.',persona_locked:'This Copilot already has a permanent Persona.',persona_already_chosen:'This Copilot already has a permanent Persona.',tower_limit:'The draft team is at its limit.'};
function feedback(result:Result,success:string){notice=result.accepted?success:messages[result.reason??'']??result.reason??'That action is unavailable.';ui.toast(notice);return result.accepted;}
function syncUI(){const game=controller.state();const tower=game.towers.find(t=>t.id===selected)??null;if(!tower)selected=null;ui.update({game,selected:tower,placing,coverage,camera,loading,loadError,notice});}
function cancel(){placing=false;ghost=null;notice='Click a Copilot to inspect its coverage and focus.';}
function act(action:UIAction){
  if(action.type==='camera'){camera=action.view;world.setView(camera);syncUI();return;}
  if(action.type==='zoom'){if(action.direction==='fit')world.setView(camera);else world.zoom(action.direction==='in'?-1:1);return;}
  if(action.type==='coverage'){coverage=action.enabled;syncUI();return;}
  if(loading<1)return;
  switch(action.type){
    case 'place': placing=true;selected=null;notice='Click a lawn to place a Base. Green fits; red is blocked. Escape cancels.';break;
    case 'cancel':cancel();break;
    case 'start':cancel();feedback(controller.start(),'Round started. Work and Bugs share this route.');break;
    case 'pause':cancel();feedback(controller.pause(),controller.state().phase==='paused'?'Paused. The map and tactical controls are frozen.':'Resumed.');break;
    case 'next':cancel();feedback(controller.next(),'Your team, health and Compute carry into the next round.');break;
    case 'reset':controller.reset();selected=null;cancel();notice='Fresh draft. Try another opening placement.';world.setView(camera);break;
    case 'speed':feedback(controller.setSpeed(action.speed),`${action.speed}× speed`);break;
    case 'mode':if(selected!==null)feedback(controller.setMode(selected,action.mode),`${action.mode==='auto'?'Auto handles visible Bugs first.':action.mode==='build'?'Build handles Work only.':'Defend handles Bugs only.'}`);break;
    case 'specialize':if(selected!==null)feedback(controller.specialize(selected,action.persona),action.persona==='developer'?'Developer: faster Work and stronger Bug resolution.':'Tester: active output plus a visible, non-stacking Quality Aura.');break;
    case 'suggested':{
      if(controller.state().phase!=='preparation'||controller.state().towers.length)return;
      for(const point of[SITES[0],SITES[2],SITES[4]]){const result=controller.place(point);if(!result.accepted){feedback(result,'');break;}}
      selected=controller.state().towers[0]?.id??null;placing=false;notice='Three Bases cover early Work, the Server bend and the final approach.';break;
    }
  }syncUI();
}
let down:{x:number;y:number;id:number}|null=null;
world.canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;down={x:event.clientX,y:event.clientY,id:event.pointerId};world.canvas.setPointerCapture(event.pointerId);world.canvas.focus({preventScroll:true});});
world.canvas.addEventListener('pointermove',event=>{
  if(!placing||loading<1)return;
  const point=world.point(event.clientX,event.clientY);if(!point)return;
  ghost={x:Math.round(point.x*10)/10,z:Math.round(point.z*10)/10};ghostValid=controller.preview(ghost).accepted;
});
world.canvas.addEventListener('pointerup',event=>{
  if(!down||down.id!==event.pointerId)return;const moved=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;
  if(world.canvas.hasPointerCapture(event.pointerId))world.canvas.releasePointerCapture(event.pointerId);
  if(moved>8||loading<1)return;
  if(placing){const point=world.point(event.clientX,event.clientY);if(point&&feedback(controller.place({x:Math.round(point.x*10)/10,z:Math.round(point.z*10)/10}),'Copilot placed. Inspect its coverage or choose a Persona.')){selected=controller.state().towers.at(-1)?.id??null;cancel();}}
  else{selected=world.pickTower(event.clientX,event.clientY);notice=selected===null?'Place on the lawns; the dashed circles suggest starting positions.':'The tinted area shows usable coverage. The Server cuts sight.';}
  syncUI();
});
world.canvas.addEventListener('pointercancel',()=>{down=null;ghost=null;});
world.canvas.addEventListener('lostpointercapture',()=>{down=null;});
world.canvas.addEventListener('pointerleave',()=>{if(!down)ghost=null;});
world.canvas.addEventListener('contextmenu',event=>{event.preventDefault();cancel();syncUI();});
world.canvas.addEventListener('wheel',event=>{event.preventDefault();world.zoom(event.deltaY);},{passive:false});
window.addEventListener('keydown',event=>{
  if((event.target as HTMLElement).closest('input,textarea,select,button'))return;
  if(event.key==='Escape'){cancel();syncUI();}
  else if(event.code==='Space'){event.preventDefault();act({type:controller.state().phase==='active'||controller.state().phase==='paused'?'pause':'start'});}
  else if(event.key.toLowerCase()==='r')act({type:'reset'});
  else if(event.key.toLowerCase()==='t')act({type:'camera',view:camera==='iso'?'top':'iso'});
});
function freeze(){if(controller.state().phase==='active'){controller.pause();notice='Paused while this window was away.';syncUI();}down=null;ghost=null;}
window.addEventListener('blur',freeze);document.addEventListener('visibilitychange',()=>{if(document.hidden)freeze();});

let last=performance.now(),lastUI=0,frameId=0;
function frame(timestamp:number){
  const before=controller.state().phase;controller.update(timestamp);
  const state=controller.state(),events=controller.events();
  const delta=state.phase==='active'?Math.min(.05,(timestamp-last)/1000)*state.speed:before==='active'?Math.min(.05,(timestamp-last)/1000):0;last=timestamp;
  if(loading===1)world.update(state,delta,events);else world.renderer.render(world.scene,world.camera);
  world.showSelection(selected,placing?ghost:null,ghostValid,coverage,(origin,target)=>controller.coverage(origin,target));
  if(events.some(e=>e.type==='work_missed'))notice='A Work item was missed: +1 debt, with no payout.';
  if(events.some(e=>e.type==='problem_leaked'))notice='A Bug reached the Product. Completed Work can heal the damage.';
  if(before!==state.phase){cancel();notice=state.phase==='cleared'?'Round clear. Inspect your team, then prepare the next round.':state.phase==='complete'?`Draft complete: ${state.completed} Work built and ${state.resolved} Bugs fixed.`:state.phase==='failed'?'The Product was lost. Reset and cover more of the route.':notice;syncUI();}
  if(timestamp-lastUI>100){syncUI();lastUI=timestamp;}
  frameId=requestAnimationFrame(frame);
}
syncUI();frameId=requestAnimationFrame(frame);
world.load(progress=>{loading=Math.min(.99,progress);syncUI();}).then(()=>{loading=1;syncUI();}).catch(error=>{notice=String(error instanceof Error?error.message:error);loadError='The models could not load. Reload this page to retry.';syncUI();console.error(error);});

// Development inspection uses the same controller as pointer/keyboard/UI input.
if(import.meta.env.DEV){
  Object.assign(window,{__COURTYARD_DRAFT__:{state:()=>controller.state(),act,project:(point:Point,height=0)=>world.screenPoint(point,height),diagnostics:()=>world.diagnostics(),preview:(point:Point)=>controller.preview(point),coverage:(point:Point,target:Point)=>controller.coverage(point,target)}});
}
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);world.destroy();ui.destroy();},{once:true});
