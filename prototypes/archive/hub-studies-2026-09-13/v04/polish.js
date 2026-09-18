let interfaceSound=false;
try{interfaceSound=localStorage.getItem('tower-garden-v04-sound')==='on'}catch{}
let soundContext;
function updateSoundButton(){const b=document.querySelector('.sound-toggle');b.setAttribute('aria-pressed',String(interfaceSound));b.setAttribute('aria-label',interfaceSound?'Mute interface sounds':'Enable interface sounds')}
function soundTap(confirm=false){if(!interfaceSound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;soundContext??=new AC();if(soundContext.state==='suspended')void soundContext.resume();const start=soundContext.currentTime,osc=soundContext.createOscillator(),gain=soundContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(confirm?680:540,start);osc.frequency.exponentialRampToValueAtTime(confirm?1020:690,start+.065);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.022,start+.009);gain.gain.exponentialRampToValueAtTime(.0001,start+.10);osc.connect(gain);gain.connect(soundContext.destination);osc.start(start);osc.stop(start+.115)}catch{}}
updateSoundButton();
document.addEventListener('change',e=>{if(e.target.id!=='sound-setting')return;interfaceSound=e.target.checked;try{localStorage.setItem('tower-garden-v04-sound',interfaceSound?'on':'off')}catch{}updateSoundButton();soundTap(true)});
dialog.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 const controls=[...dialogBody.querySelectorAll('button,input')].filter(el=>!el.disabled&&el.getClientRects().length);
 const current=controls.indexOf(document.activeElement);
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  if(!controls.length)return;e.preventDefault();const step=e.key==='ArrowDown'?1:-1;const next=current<0?(step>0?0:controls.length-1):(current+step+controls.length)%controls.length;controls[next].focus();controls[next].closest('.setting-row')?.scrollIntoView({block:'nearest'});
 }
 if(document.activeElement.matches('input[type=checkbox]')&&['ArrowLeft','ArrowRight','Enter'].includes(e.key)){
  e.preventDefault();const input=document.activeElement;input.checked=e.key==='ArrowLeft'?false:e.key==='ArrowRight'?true:!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));
 }
});
document.addEventListener('click',e=>{const target=e.target.closest('button,[role=button]');if(!target)return;if(target.dataset.polish==='sound'){interfaceSound=!interfaceSound;try{localStorage.setItem('tower-garden-v04-sound',interfaceSound?'on':'off')}catch{}updateSoundButton();soundTap(true);return}if(target.dataset.polish==='new-run')openBriefing(false);soundTap(target.dataset.action==='continue'||!!target.dataset.planning)});
const gardenStage=document.querySelector('.world-stage');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer=matchMedia('(pointer: coarse)');
function resetLook(){gardenStage.style.setProperty('--look-x','0px');gardenStage.style.setProperty('--look-y','0px')}
document.querySelector('main').addEventListener('pointermove',e=>{if(dialog.open||coarsePointer.matches||innerWidth<900||motionPreference.matches||document.body.classList.contains('reduced-motion'))return;gardenStage.style.setProperty('--look-x',((e.clientX/innerWidth-.5)*5).toFixed(2)+'px');gardenStage.style.setProperty('--look-y',((e.clientY/innerHeight-.5)*3).toFixed(2)+'px')});
document.querySelector('main').addEventListener('pointerleave',resetLook);
window.addEventListener('resize',resetLook);
motionPreference.addEventListener('change',resetLook);
document.addEventListener('change',e=>{if(e.target.id==='motion-setting')resetLook()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetLook()});
