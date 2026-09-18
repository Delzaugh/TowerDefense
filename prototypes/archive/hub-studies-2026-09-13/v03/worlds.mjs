// Original SVG environment studies. These are UI illustrations, not runtime models.
const palettes={nexus:{top:'#d9e6d5',side:'#9cb7aa',deep:'#72938a',water:'#80c6cf',accent:'#48bacc'},cloud:{top:'#d9e6e6',side:'#91abb8',deep:'#667e99',water:'#81b8ce',accent:'#62d0d6'},garden:{top:'#e4e6dc',side:'#b2bfb8',deep:'#849b96',water:'#83c5be',accent:'#70b8a2'}};
export const layouts=[
 {id:'nexus',number:'01',name:'Nexus Campus',subtitle:'CONNECTED TECHNOLOGY PARK',file:'01-nexus-campus.html',summary:'One continuous campus. Four clear destinations.',positions:{product:[0,-1],team:[-4,1.6],missions:[4,2],settings:[3,-4]}},
 {id:'cloud',number:'02',name:'Cloud Cluster',subtitle:'DISTRIBUTED AI CAMPUS',file:'02-cloud-cluster.html',summary:'Linked platforms. A home for every system.',positions:{product:[0,-2.2],team:[-4.8,-.3],missions:[2.5,3.7],settings:[5,-1.1]}},
 {id:'garden',number:'03',name:'Circuit Garden',subtitle:'CENTRAL AI RESEARCH CAMPUS',file:'03-circuit-garden.html',summary:'A central core. A compact ring of activity.',positions:{product:[0,0],team:[-4,2],missions:[2,4],settings:[4,-3]}}
];
export const zones={product:{name:'Product Core',short:'Product',code:'01',action:'product',icon:'product',detail:'View the Product and its growth.'},team:{name:'Copilot Lab',short:'Copilots',code:'02',action:'team',icon:'team',detail:'Explore your Personas.'},missions:{name:'Deployment',short:'Levels',code:'03',action:'missions',icon:'missions',detail:'Choose a level or resume your run.'},settings:{name:'Operations',short:'Settings',code:'04',action:'settings',icon:'settings',detail:'Adjust your preferences.'}};
export function makeWorld(layout,interactive=true,prefix='map'){
 const theme=palettes[layout.id],sx=layout.id==='garden'?48:50,sz=layout.id==='garden'?28:25,sy=layout.id==='garden'?48:52,cx=700,cy=460;
 const p=(x,z,y=0)=>[cx+(x-z)*sx,cy+(x+z)*sz-y*sy];
 const xy=point=>point.map(v=>+v.toFixed(2)).join(',');
 const hull=points=>{
  const sorted=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lower=[],upper=[];
  for(const a of sorted){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),a)<=0)lower.pop();lower.push(a)}
  for(const a of [...sorted].reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),a)<=0)upper.pop();upper.push(a)}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
 };
 const poly=(points,fill,extra='')=>`<polygon points="${points.map(xy).join(' ')}" fill="${fill}" ${extra}/>`;
 const path=(points,color,width=2,extra='')=>`<polyline points="${points.map(xy).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const ground=(x,z,w,d,y=0)=>[p(x-w/2,z-d/2,y),p(x+w/2,z-d/2,y),p(x+w/2,z+d/2,y),p(x-w/2,z+d/2,y)];
 const box=(x,z,y,w,d,h,top='#f3f7ef',left='#b2c8c5',right='#819da7')=>{
  const a=ground(x,z,w,d,y),b=ground(x,z,w,d,y+h);
  return poly([a[3],a[2],b[2],b[3]],left)+poly([a[1],a[2],b[2],b[1]],right)+poly(b,top)+path([b[3],b[2],b[1]],'#ffffff65',1);
 };
 const surface=(points,y,fill,extra='')=>poly(points.map(([x,z])=>p(x,z,y)),fill,extra);
 const line=(coords,y,color,width=2,extra='')=>path(coords.map(([x,z])=>p(x,z,y)),color,width,extra);
 const octPoints=(x,z,w,d,cut=.5)=>[[x-w/2+cut,z-d/2],[x+w/2-cut,z-d/2],[x+w/2,z-d/2+cut],[x+w/2,z+d/2-cut],[x+w/2-cut,z+d/2],[x-w/2+cut,z+d/2],[x-w/2,z+d/2-cut],[x-w/2,z-d/2+cut]];
 const plate=(x,z,w,d,height=.35,fill=theme.top)=>{
  const a=octPoints(x,z,w,d,.65),out=[];
  for(let i=1;i<7;i++){const j=(i+1)%8;out.push(poly([p(...a[i],-height),p(...a[j],-height),p(...a[j],0),p(...a[i],0)],i<4?theme.deep:theme.side));}
  out.push(surface(a,0,fill),line([...a,a[0]],.015,'#f4faf060',1.5));return out.join('');
 };
 const ellipse=(x,z,y,rx,rz,fill,extra='')=>{const pt=p(x,z,y);return `<ellipse cx="${pt[0]}" cy="${pt[1]}" rx="${rx}" ry="${rz}" fill="${fill}" ${extra}/>`};
 const ring=(x,z,r,y,color,width=2,extra='')=>{const a=Array.from({length:49},(_,i)=>p(x+Math.cos(i/48*Math.PI*2)*r,z+Math.sin(i/48*Math.PI*2)*r,y));return path(a,color,width,extra)};
 const tree=(x,z,scale=1)=>{
  let out=ellipse(x,z,.03,18*scale,8*scale,'#3f6a6525');out+=box(x,z,0,.13*scale,.13*scale,.55*scale,'#8a9690','#718780','#56786f');
  out+=box(x,z,.4*scale,.65*scale,.6*scale,.62*scale,'#9fc7a9','#79aa95','#639784');
  out+=box(x-.06,z-.02,.96*scale,.48*scale,.46*scale,.4*scale,'#b4d2b0','#8aba9b','#719f88');return out;
 };
 const planter=(x,z,w=1.1,d=.85)=>box(x,z,0,w,d,.22,'#c5d3c9','#90a99f','#78958d')+box(x,z,.23,w-.12,d-.12,.08,'#8eaf91','#8eaf91','#8eaf91');
 const screenFront=(x,z,y,w,h,color='#4fb8c5')=>poly([p(x-w/2,z,y),p(x+w/2,z,y),p(x+w/2,z,y+h),p(x-w/2,z,y+h)],color);
 const screenSide=(x,z,y,d,h,color='#31616f')=>poly([p(x,z-d/2,y),p(x,z+d/2,y),p(x,z+d/2,y+h),p(x,z-d/2,y+h)],color);
 const miniBot=(x,z,color='#3babb7')=>{
  const q=p(x,z,.15);return `<g transform="translate(${q[0]} ${q[1]})"><ellipse cy="7" rx="13" ry="5" fill="#37565b25"/><path d="M-5 0v6M5 0v6" stroke="#507381" stroke-width="5"/><rect x="-10" y="-14" width="20" height="17" rx="5" fill="${color}"/><rect x="-13" y="-31" width="26" height="19" rx="6" fill="#f1f8f3"/><rect x="-10" y="-27" width="20" height="10" rx="4" fill="#355e6d"/><path d="M-4-24v3M4-24v3" stroke="#b4f2ea" stroke-width="2"/></g>`;
 };
 const solar=(x,z)=>{let out=box(x,z,0,1.35,.8,.15,'#afc8c9','#8babae','#709299');out+=surface([[x-.61,z-.34],[x+.61,z-.34],[x+.61,z+.34],[x-.61,z+.34]],.17,'#3b6779');for(let i=1;i<4;i++)out+=line([[x-.61+i*.305,z-.34],[x-.61+i*.305,z+.34]],.18,'#79b4c0',1);out+=line([[x-.61,z],[x+.61,z]],.18,'#79b4c0',1);return out};
 const lamp=(x,z)=>box(x,z,0,.12,.12,.95,'#d4e2de','#779594','#5a7b80')+box(x,z,.93,.42,.25,.07,'#c0eeea','#8dceca','#70b4be');
 const walk=(points,width=16)=>line(points,.055,'#8baba766',width+5)+line(points,.075,'#e7efe6',width)+line(points,.085,'#7fc7cb',2,'class="data-route" stroke-dasharray="9 22"');
 const core=(x,z)=>{
  let out=plate(x,z,3.6,3.3,.18,'#c1d8d4')+ring(x,z,2,.07,'#8ee4db',3,'class="core-pulse"');
  if(layout.id==='garden'){
   const a=octPoints(x,z,2.2,2.2,.5);for(let i=1;i<7;i++)out+=poly([p(...a[i],.25),p(...a[(i+1)%8],.25),p(...a[(i+1)%8],2.85),p(...a[i],2.85)],i%2?'#bad4cf':'#86abae');
   out+=surface(a,2.85,'#f6faf1');out+=box(x,z,2.88,1.5,1.5,.12,'#d8ece5','#b2d6cc','#83b4b4');
   out+=screenFront(x,z+1.1,.65,.8,1.7,'#447784');out+=screenFront(x,z+1.105,.76,.44,1.46,'#85dad7');
   out+=box(x,z,3.04,.67,.67,.7,'#c1f1e5','#81d3cf','#53aabb');
  }else{
   out+=box(x,z,.12,2.8,2.5,.25,'#edf3ed','#a0bcb7','#809fa6');
   out+=box(x,z,.37,2.4,2.15,2.8,'#edf5f0','#c3d8d0','#91b1b7');
   out+=screenFront(x,z+1.077,.75,1.8,1.95,'#355a6c');
   for(let i=0;i<4;i++)out+=screenFront(x,z+1.084,1+i*.4,1.42,.12,i===3?'#a9e9db':'#5899ac');
   out+=screenSide(x+1.201,z,.73,1.55,2.08,'#447783');
   for(let i=0;i<3;i++)out+=screenSide(x+1.204,z-.46+i*.48,.89,.14,1.79,'#80d0d2');
   out+=box(x,z,3.17,2.55,2.3,.16,'#f7fbf5','#d8e8e0','#afccd0');
   out+=box(x,z,3.33,1.72,1.52,.14,'#c0dad7','#abcdd0','#88b7c3');
   out+=box(x,z,3.47,.75,.75,.48,'#b9f4e6','#73cdcb','#50a9bb');
  }
  out+=line([[x-1.5,z+1.5],[x+1.5,z+1.5]],.24,'#78dfd7',3);return out;
 };
 const lab=(x,z)=>{
  let out=plate(x,z,3.2,2.6,.15,'#cddfe0');
  out+=box(x,z,.12,2.75,2.15,.16,'#eff5f0','#b4cbc7','#8ca9b2');
  out+=box(x-.74,z,.28,1.05,1.9,1.55,'#edf5f3','#bdcfcd','#789da9');
  out+=box(x+.74,z,.28,1.05,1.9,1.55,'#edf5f3','#bdcfcd','#789da9');
  out+=box(x,z-.58,1.35,2.2,.7,.39,'#e9f5f0','#b2d3d0','#7eafb9');
  out+=screenFront(x-.74,z+.952,.69,.65,.62,'#64b9c9');out+=screenFront(x+.74,z+.952,.69,.65,.62,'#64b9c9');
  out+=box(x,z+.34,.3,.56,.65,.33,'#c1ded9','#92c2bf','#69a6b1');
  out+=miniBot(x,z+1.24);out+=line([[x-1.25,z+1.25],[x+1.25,z+1.25]],.18,'#8cdbed',3);return out;
 };
 const deployment=(x,z)=>{
  let out=plate(x,z,3.5,2.85,.15,'#c8d9dc');
  out+=box(x,z,.14,2.95,2.35,.22,'#e7edec','#a3bfc2','#7f9ba9');
  out+=box(x-1.15,z-.3,.37,.35,.55,2.05,'#f2f6ef','#b2cdca','#83a5b1');
  out+=box(x+1.15,z-.3,.37,.35,.55,2.05,'#f2f6ef','#b2cdca','#83a5b1');
  out+=box(x,z-.3,2.22,2.65,.57,.31,'#f5f8ef','#c5dbd7','#8eafb7');
  out+=screenFront(x,z-.009,2.28,1.77,.14,'#82dee3');
  for(const dx of [-1.15,1.15])out+=screenFront(x+dx,z-.019,.61,.12,1.39,'#6fcdd2');
  out+=ring(x,z+.2,.84,.382,'#efc46e',3);
  out+=surface([[x-.28,z+.55],[x+.34,z+.15],[x-.28,z-.25],[x-.12,z+.15]],.39,'#ebb963');
  out+=box(x+1.3,z+.94,.37,.38,.36,.61,'#e3eeeb','#a5c4c0','#789eaa');out+=screenFront(x+1.3,z+1.122,.65,.26,.22,'#68bcc7');return out;
 };
 const ops=(x,z)=>{
  let out=plate(x,z,2.5,2.4,.15,'#cfded9');
  out+=box(x,z,.16,1.8,1.65,1.24,'#eaf2ed','#c2d3ce','#8ca7b0');
  out+=screenFront(x,z+.83,.47,1.2,.66,'#537583');out+=screenFront(x,z+.834,.74,.78,.1,'#a7ded3');
  out+=box(x,z,1.4,1.97,1.8,.13,'#f3f7f0','#d2e0d8','#a8c3c4');
  const q=p(x,z,1.55);out+=`<ellipse cx="${q[0]}" cy="${q[1]}" rx="31" ry="15" fill="#678993"/><ellipse cx="${q[0]}" cy="${q[1]}" rx="21" ry="10" fill="#accdca"/><path d="M${q[0]-15} ${q[1]}h30M${q[0]} ${q[1]-8}v16" stroke="#678993" stroke-width="3"/>`;
  out+=box(x+.9,z-.5,1.55,.1,.1,.77,'#b9d9d2','#779da0','#608693');out+=ellipse(x+.9,z-.5,2.35,4,4,'#9ce9d9');return out;
 };
 let floor='',props=[];
 if(layout.id==='nexus'){
  floor+=ellipse(0,0,-1.05,520,225,'#4b6e6a16')+plate(0,0,14,12,.55);
  floor+=surface([[1,-5.7],[2.1,-5.7],[2.1,1.5],[5.9,1.5],[5.9,2.4],[1,2.4]],.015,theme.water);
  floor+=walk([[-5.5,1.6],[0,1.6],[0,-1],[3,-1],[3,-4]])+walk([[0,1.6],[4,1.6],[4,2],[4,4.7]]);
  floor+=box(1.52,1.6,.13,1.4,.65,.14,'#edf5eb','#b8d1ca','#8eb0b0');
  for(const [x,z,s] of [[-5.8,3.5,1.3],[-5.6,-2.5,1.1],[-3.3,-4.5,1],[-2,-4.9,.8],[5.8,4.2,1.1],[1,4.8,1],[0,5.3,.8],[5.6,-4.5,1]])props.push({depth:x+z,art:planter(x,z)+tree(x,z,s)});
  for(const a of [[-1.8,-4],[.2,-4.7],[5,-1.6]])props.push({depth:a[0]+a[1],art:solar(...a)});
  floor+=line([[-6.6,5.45],[6.2,5.45]],.06,'#91afa24d',1);props.push({depth:2,art:miniBot(-1.5,3.5,'#d5ad65')});
 }else if(layout.id==='cloud'){
  const entries=Object.entries(layout.positions);
  for(const [key,[x,z]]of entries){floor+=ellipse(x,z,-.75,150,65,'#3b607823');floor+=plate(x,z,key==='product'?4.9:4.4,key==='product'?4.4:3.7,.55,key==='product'?'#d4e5e1':'#cadcdf');}
  for(const [a,b]of [['product','team'],['product','settings'],['team','missions'],['settings','missions']]){const pa=layout.positions[a],pb=layout.positions[b];floor+=line([pa,pb],-.13,'#5e8294',28)+line([pa,pb],-.04,'#cfdfdf',22)+line([pa,pb],.015,'#87d9df',3,'class="data-route" stroke-dasharray="6 16"');}
  for(const [x,z]of [[-6,-1.2],[-5.8,.8],[-1,-3.6],[1,-3.7],[3.4,4.8],[5.8,-2.2]])props.push({depth:x+z,art:planter(x,z,.7,.7)+tree(x,z,.75)});
  props.push({depth:5,art:solar(5.8,-.8)});
 }else{
  floor+=ellipse(0,0,-.9,530,205,'#456a6c1a')+plate(0,0,13,12,.42,'#dce3db');
  floor+=ring(0,0,4.9,.02,'#b2c8c0',43)+ring(0,0,4.9,.04,'#f0f2e8',30)+ring(0,0,4.9,.045,'#75bfb4',2,'class="data-route" stroke-dasharray="8 24"');
  floor+=plate(0,0,4.5,4.5,.17,'#abcac3');
  for(const [x,z]of Object.values(layout.positions))floor+=walk([[0,0],[x,z]],14);
  floor+=surface([[-5.9,-2.2],[-3.5,-4.8],[-1.5,-5.2],[-2,-4.5],[-4,-2]],.04,'#98cfc5');
  for(const [x,z,s]of [[-5.2,3.1,.9],[-5.3,-.4,1.1],[-3.8,-3.5,.9],[-2.4,-4.3,.8],[1.5,-4.4,.8],[4.9,1.8,1],[.2,5.3,.85],[-2.2,4.8,1]])props.push({depth:x+z,art:planter(x,z,.9,.8)+tree(x,z,s)});
  for(const [x,z]of [[2,-4.8],[3.4,-4.8]])props.push({depth:x+z,art:solar(x,z)});
  props.push({depth:3,art:miniBot(-1.9,3.4,'#65aaa1')});
 }
 for(const[x,z]of layout.id==='cloud'?[[1,-.5],[-3,1]]:[[-2.4,1.3],[2.5,2.2],[-1,-3.2],[4.5,-1.7]])props.push({depth:x+z,art:lamp(x,z)});
 const renderers={product:core,team:lab,missions:deployment,settings:ops};
 const heights={product:4.15,team:2.05,missions:2.72,settings:2.53};
 const pins={};
 for(const[key,[x,z]]of Object.entries(layout.positions)){
  const h=heights[key];const anchor=p(x,z,h);pins[key]={x:anchor[0]/14,y:(anchor[1]-13)/9};
  let art=renderers[key](x,z);if(key==='product')art='<g class="product-building">'+art+'</g>';
  const highlight=poly(ground(x,z,key==='product'?4.1:3.6,key==='product'?3.8:3.2,.17),'#9df0e21a','class="selection-field" stroke="#45baca" stroke-width="2.5" stroke-dasharray="12 6"');
  const hitPoints=hull([...ground(x,z,3.8,3.4,.1),...ground(x,z,3.8,3.4,h)]);
  const hit=poly(hitPoints,'transparent','class="zone-hit"');
  props.push({depth:x+z+.05,art:`<g class="world-zone ${key==='product'?'is-current':''}" ${interactive?`data-zone="${key}" role="button" tabindex="0" aria-label="Open ${zones[key].name}"`:''}>${highlight}${art}${interactive?hit:''}</g>`});
 }
 props.sort((a,b)=>a.depth-b.depth);
 const svg=`<svg class="world-svg campus-art" viewBox="0 0 1400 900" ${interactive?'aria-label="Interactive AI campus. Select a building to open its menu."':'role="img" aria-label="Illustrated modern AI campus"'}><g class="world-floor">${floor}</g>${props.map(a=>a.art).join('')}</svg>`;
 return{svg,pins};
}
