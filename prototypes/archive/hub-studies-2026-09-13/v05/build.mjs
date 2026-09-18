import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const base=readFileSync(root+'source/circuit-garden.html','utf8');
const styles=readFileSync(root+'variants.css','utf8');
const behavior=readFileSync(root+'variants.js','utf8');
const variants=[
 {id:'sage',number:'01',name:'Sage',file:'01-sage.html',subtitle:'A quieter place to return to.',description:'Soft ivory and eucalyptus. Compact destination labels and a centered Continue bar keep the garden in focus.',ux:'Quiet labels · Centered Continue',colors:['#e8eedc','#639a82','#c8dfb7']},
 {id:'glacier',number:'02',name:'Glacier',file:'02-glacier.html',subtitle:'Every destination, one key away.',description:'Cool porcelain and glacier blue. Numbered destinations, direct keyboard shortcuts, and a sharper command panel.',ux:'Number keys 1–4 · Angular controls',colors:['#dfeefa','#6899be','#9ce2f1']},
 {id:'dusk',number:'03',name:'Dusk',file:'03-dusk.html',subtitle:'One more wave before lights out.',description:'Twilight violet and soft apricot. Icon-led building markers, a left-hand Continue bar, and centered game menus.',ux:'Icon-led markers · Centered menus',colors:['#292e4b','#8785b4','#f4c6a2']}
];
function hsl(hex){let [r,g,b]=hex.match(/../g).slice(0,3).map(n=>parseInt(n,16)/255);const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60}return[h,s,l]}
function rgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2;const channels=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return channels.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('')}
function palette(text,id,world=false){return text.replace(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi,(match,value)=>{
 const expanded=value.length<5?value.split('').map(v=>v+v).join(''):value;let[h,s,l]=hsl(expanded);const alpha=expanded.slice(6);
 if(id==='sage'){if(s>.06&&h>65&&h<200)h=h<155?137:164;s*=.83;}
 if(id==='glacier'){if(s>.05&&h>45&&h<205){h=l>.72?203:h<150?178:210;s=Math.min(.65,s*.95+.04)}else if(h>205&&h<310)h=222;}
 if(id==='dusk'&&world){
  if(l>.87){h=232;s=.12;l=.65+(l-.87)*.7}
  else if(s>.24&&h>150&&h<205){h=199;s=.43;l=.39+l*.4}
  else if(s>.09&&h>65&&h<150){h=236;s=.18;l=.24+l*.23}
  else if(s>.28&&h>15&&h<65){h=29;s=.6;l=.55+l*.25}
  else{h=235;s=.15;l=.13+l*.63}
 }else if(id==='dusk'){if(s>.05&&h>45&&h<205){h=l>.74?32:238;s=l>.74?Math.min(.65,s*.85):Math.min(.5,s*.7+.08)}}
 return '#'+rgb(h,s,l)+alpha;
})}
function make(v){
 let html=palette(base,v.id);
 if(v.id==='dusk'){
  const originalWorld=base.match(/<svg class="world-svg[\s\S]*?<\/svg>/)[0];
  const originalPreview=JSON.parse(base.match(/const WORLD_PREVIEW=("(?:\\.|[^"\\])*");const campus=/)[1]);
  html=html.replace(/<svg class="world-svg[\s\S]*?<\/svg>/g,()=>palette(originalWorld,'dusk',true));
  html=html.replace(/const WORLD_PREVIEW=("(?:\\.|[^"\\])*");const campus=/,()=>'const WORLD_PREVIEW='+JSON.stringify(palette(originalPreview,'dusk',true))+';const campus=');
 }
 html=html.replace('<body>','<body class="variant-'+v.id+'">').replace(/<title>.*?<\/title>/,'<title>'+v.name+' — Circuit Garden 05</title>');
 if(v.id==='sage')html=html.replace('<h2>Just One<br>Small Feature</h2>','<h2>Just One Small Feature</h2>');
 html=html.replaceAll('tower-hub-v04-','tower-hub-v05-'+v.id+'-').replaceAll('tower-garden-v04-sound','tower-garden-v05-'+v.id+'-sound');
 html=html.replace('href="../v03/index.html"','href="index.html"').replace('DESIGN HISTORY','ALL VARIANTS');
 html=html.replace('EARLY BUILD · UI PROTOTYPE',`<nav class="variant-switch" aria-label="Visual variants">${variants.map(x=>`<a href="${x.file}" ${x.id===v.id?'aria-current="page"':''} title="${x.name}">${x.number}<span>${x.name}</span></a>`).join('')}</nav>`);
 html=html.replace('</style>',styles+'</style>').replace('</script>',`\nconst VARIANT=${JSON.stringify(v.id)};\n${behavior}</script>`);
 writeFileSync(root+v.file,html);return html.match(/<svg class="world-svg[\s\S]*?<\/svg>/)[0].replaceAll('tabindex="0"','tabindex="-1"').replaceAll('role="button"','role="presentation"');
}
const previews=variants.map(v=>make(v));
const cards=variants.map((v,i)=>`<a class="study ${v.id}" href="${v.file}"><div class="study-art">${previews[i].replaceAll('home-',`card${i}-`)}</div><div class="study-copy"><span class="study-number">0${i+1} / CIRCUIT GARDEN</span><h2>${v.name}</h2><p>${v.subtitle}</p><div class="swatches">${v.colors.map(c=>`<i style="background:${c}"></i>`).join('')}<span>${v.ux}</span></div><span class="open-study">ENTER GARDEN <b>↗</b></span></div></a>`).join('');
writeFileSync(root+'index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Circuit Garden — Three refinements</title><style>*{box-sizing:border-box}body{margin:0;background:#172d2d;color:#e6ecdb;font-family:'Segoe UI',Arial,sans-serif;min-height:100dvh;padding:5vh 5vw 25px;display:flex;flex-direction:column}header{display:flex;align-items:end;justify-content:space-between;gap:20px}header small{font:10px Consolas,monospace;letter-spacing:2px;color:#9db7a3}h1{font-size:clamp(30px,3.5vw,58px);line-height:1.1;letter-spacing:-1.4px;margin:14px 0 9px}header p{font-size:14px;color:#9fb5a4;margin:0}header a{color:#b8c8b1;text-decoration:none;font-size:11px;white-space:nowrap}.studies{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:25px;width:100%;max-width:1850px;margin:5vh auto;flex:1;align-items:center}.study{text-decoration:none;color:#e6eedc;overflow:hidden;border:1px solid #8ba68d45;background:#25433c;transition:translate .2s,border-color .2s;display:block}.study:hover{translate:0 -7px;border-color:#c5dcb2}.study:focus-visible{outline:3px solid #d5eab4;outline-offset:5px}.study-art{aspect-ratio:1.55;position:relative;overflow:hidden;background:radial-gradient(ellipse,#eff0d9,#b4cbbb)}.study-art svg{width:120%;height:120%;position:absolute;left:-10%;top:-5%;pointer-events:none}.study.glacier{background:#233c51}.glacier .study-art{background:radial-gradient(ellipse,#e5f2f8,#a4bbd2)}.study.dusk{background:#282d48}.dusk .study-art{background:radial-gradient(ellipse,#737796,#282e49)}.study-copy{padding:27px 28px 24px}.study-number{font:9px Consolas,monospace;letter-spacing:1.5px;color:#a1b6a2}h2{font-size:36px;letter-spacing:-1px;margin:8px 0}.study-copy p{font-size:13px;color:#b2c3ae;margin:0 0 23px}.glacier p{color:#b5c8d8}.dusk p{color:#bcbad2}.swatches{display:flex;align-items:center;gap:5px}.swatches i{height:12px;width:12px;border-radius:50%}.swatches span{font-size:10px;margin-left:7px;color:#b4c4b0}.open-study{display:flex;justify-content:space-between;margin-top:26px;padding-top:20px;border-top:1px solid #b3c5a826;font-size:12px;font-weight:750;letter-spacing:1px}.open-study b{font-size:20px}footer{display:flex;justify-content:space-between;color:#8ca591;font:9px Consolas,monospace;letter-spacing:1px}footer a{color:#b3c4ac;text-decoration:none}@media(max-width:900px){body{padding:28px 24px}.studies{gap:15px}.study-copy{padding:20px 17px}.swatches{flex-wrap:wrap}.swatches span{width:100%;margin:8px 0 0}h2{font-size:30px}}@media(max-width:650px){header{align-items:start}header p{font-size:12px;line-height:1.6;max-width:240px}header a{font-size:9px}.studies{grid-template-columns:1fr;max-width:450px;margin-top:30px}.study-art{aspect-ratio:1.8}.study-copy{padding:22px}.swatches span{width:auto;margin:0 0 0 7px}footer{font-size:8px;line-height:1.6;gap:15px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}</style></head><body><header><div><small>COPILOT / HOME SCREEN STUDIES 05</small><h1>One garden. Three moods.</h1><p>The same campus and game menus, with small shifts in color and interaction.</p></div><a href="../v04/index.html">← REFERENCE VERSION</a></header><main class="studies">${cards}</main><footer><span>SELECT A GARDEN TO EXPLORE</span><span>STANDALONE UI PROTOTYPES · NO GAME SAVES</span></footer></body></html>`);
console.log('Built Sage, Glacier, Dusk, and the comparison screen.');
