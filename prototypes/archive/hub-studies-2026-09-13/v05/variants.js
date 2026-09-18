// Only Glacier changes input behavior; the other variants retain the baseline.
if(VARIANT==='glacier'){
 const destinations=['product','team','missions','settings'];
 document.querySelectorAll('.site-pin').forEach(pin=>{const number=destinations.indexOf(pin.dataset.zone)+1;pin.insertAdjacentHTML('afterbegin','<span class="station-index" aria-hidden="true">0'+number+'</span>');pin.setAttribute('aria-keyshortcuts',String(number))});
 document.querySelector('.keyboard-hint').innerHTML='<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> OPEN DESTINATION <kbd>ESC</kbd> BACK';
 document.addEventListener('keydown',e=>{if(dialog.open||e.altKey||e.metaKey||e.ctrlKey||e.repeat||e.target.closest('input,textarea,select,[contenteditable=true]'))return;const id=destinations[+e.key-1];if(id&&/^[1-4]$/.test(e.key)){e.preventDefault();enterZone(document.querySelector('.site-pin[data-zone="'+id+'"]'))}});
}
