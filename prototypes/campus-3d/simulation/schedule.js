import {ENEMY_CAP,ENEMY_SPEED,wavesForCap,enemyCap,MODELS} from './config.js';
const enemies=MODELS.filter(m=>m.enemy);

// Deterministic presentation-only wave scheduling. The cap includes every active enemy.
export function createWaveSchedule(length,limit=ENEMY_CAP){
 const cap=enemyCap(limit),waves=wavesForCap(cap);
 let time=0,spawned=0,arrived=0,peak=0;const active=[],events=[];
 const total=waves.reduce((sum,w)=>sum+w.count,0);
 function update(dt){
  time+=dt;
  for(let i=active.length-1;i>=0;i--){const e=active[i];e.distance+=dt*e.speed;if(e.distance>=length){active.splice(i,1);arrived++;}}
  let released=0;
  waves.forEach((w,index)=>{if(time>=w.start){released+=Math.min(w.count,Math.floor((time-w.start)*cap*.12)+1);if(!events.some(e=>e.wave===index+1))events.push({wave:index+1,at:time,count:w.count});}});
  while(spawned<released&&active.length<cap){const kind=spawned%enemies.length,speedFactor=enemies[kind].speedFactor;active.push({id:spawned,kind,wave:spawned<waves[0].count?1:spawned<cap?2:3,distance:0,lane:(spawned%3-1)*1.05,speedFactor,speed:ENEMY_SPEED*speedFactor});spawned++;}
  peak=Math.max(peak,active.length);
  return state();
 }
 function state(){return {time,spawned,arrived,active:active.length,peak,cap,total,waves,queued:waves.filter(w=>time>=w.start).reduce((s,w)=>s+w.count,0)-spawned,
  wave:Math.min(3,events.length),done:arrived===total,events:events.map(e=>({...e}))};}
 return {update,state,active};
}
