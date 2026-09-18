const zoneData={product:{code:'01',name:'Product Core',detail:'View the Product and its growth.'},team:{code:'02',name:'Copilot Lab',detail:'Explore your Personas.'},missions:{code:'03',name:'Deployment',detail:'Choose a level or resume your run.'},settings:{code:'04',name:'Operations',detail:'Adjust your preferences.'}};
let chosenZone='product';
function highlightZone(id,temporary=false){
  if(!zoneData[id])return;
  const data=zoneData[id];
  document.querySelectorAll('.world-zone').forEach(el=>{el.classList.toggle('is-current',el.dataset.zone===id);el.classList.toggle('is-hover',temporary&&el.dataset.zone===id)});
  document.querySelectorAll('.site-pin').forEach(el=>el.classList.toggle('is-current',el.dataset.zone===id));
  document.getElementById('readout-name').textContent=data.name;
  document.getElementById('readout-description').textContent=data.detail;
  document.getElementById('readout-code').textContent=data.code+' / '+(temporary?'SELECT BUILDING':'CAMPUS DESTINATION');
}
function enterZone(target){const id=target.dataset.zone;if(!zoneData[id])return;chosenZone=id;highlightZone(id);target.focus();({product:()=>openProduct(growthStage),team:openTeam,missions:openLevels,settings:openSettings})[id]()}
document.addEventListener('click',e=>{const target=e.target.closest('[data-zone]');if(target)enterZone(target)});
document.addEventListener('pointerover',e=>{const target=e.target.closest('[data-zone]');if(target)highlightZone(target.dataset.zone,true)});
document.addEventListener('pointerout',e=>{const target=e.target.closest('[data-zone]');if(target&&!target.contains(e.relatedTarget))highlightZone(chosenZone)});
document.addEventListener('focusin',e=>{const target=e.target.closest('[data-zone]');if(target)highlightZone(target.dataset.zone,true)});
document.addEventListener('keydown',e=>{
  if(dialog.open)return;
  const target=e.target.closest?.('.world-zone[data-zone]');
  if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();enterZone(target);return}
  if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!e.altKey&&!e.ctrlKey&&!e.metaKey){const ids=Object.keys(zoneData),current=document.activeElement.dataset.zone||chosenZone;const next=ids[(ids.indexOf(current)+(e.key==='ArrowRight'?1:ids.length-1))%ids.length];e.preventDefault();document.querySelector('.site-pin[data-zone="'+next+'"]').focus()}
});
dialog.addEventListener('close',()=>highlightZone(chosenZone));
