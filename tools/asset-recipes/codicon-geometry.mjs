// Convert the pinned SVG paths to bounded-error contours and closed extrusions.
// Uses the project's existing Three.js triangulator; no raster tracing.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ShapeUtils,Vector2} from '../asset-inspector/vendor/three.module.js';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const commit='6833ea2bc5fc49220e261a4a0fd1986ea02d1d0c';
export const names=['agent','book','lightbulb','mcp','github','code','copilot'];
export const upstream='assets/third_party/microsoft/vscode-codicons/'+commit;
const dist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
function cubic(a,b,c,d,out,depth=0){
  if(Math.max(dist(b,a,d),dist(c,a,d))<=.025||depth===16){out.push(d);return;}
  const ab=mid(a,b),bc=mid(b,c),cd=mid(c,d),abc=mid(ab,bc),bcd=mid(bc,cd),m=mid(abc,bcd);
  cubic(a,ab,abc,m,out,depth+1);cubic(m,bcd,cd,d,out,depth+1);
}
function parse(d){
  const tok=d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);let i=0,cmd,p=[0,0],ring=[];const rings=[];
  const n=()=>{const v=Number(tok[i++]);if(!Number.isFinite(v))throw Error('Invalid SVG number');return v;};
  while(i<tok.length){
    if(/^[A-Za-z]$/.test(tok[i]))cmd=tok[i++];
    if(cmd==='M'){if(ring.length)throw Error('Unclosed contour');p=[n(),n()];ring=[p];cmd='L';}
    else if(cmd==='L'){p=[n(),n()];ring.push(p);}
    else if(cmd==='H'){p=[n(),p[1]];ring.push(p);}
    else if(cmd==='V'){p=[p[0],n()];ring.push(p);}
    else if(cmd==='C'){const a=[n(),n()],b=[n(),n()],end=[n(),n()];cubic(p,a,b,end,ring);p=end;}
    else if(cmd==='Z'||cmd==='z'){
      let clean=ring.filter((v,j)=>!j||Math.hypot(v[0]-ring[j-1][0],v[1]-ring[j-1][1])>1e-7);
      if(Math.hypot(clean[0][0]-clean.at(-1)[0],clean[0][1]-clean.at(-1)[1])<1e-7)clean.pop();
      let changed=true;while(changed&&clean.length>3){changed=false;clean=clean.filter((v,j)=>{const keep=dist(v,clean[(j+clean.length-1)%clean.length],clean[(j+1)%clean.length])>1e-7;if(!keep)changed=true;return keep;});}
      rings.push(clean);ring=[];cmd=null;
    }else throw Error('Unsupported SVG path command '+cmd);
  }
  if(ring.length)throw Error('Unclosed SVG path');return rings;
}
const area=r=>r.reduce((sum,a,i)=>{const b=r[(i+1)%r.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2;
function inside(p,r){let v=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
export async function build(name){
  const svg=await fs.readFile(path.join(project,upstream,'src/icons',name+'.svg'),'utf8');
  const paths=[...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g)];if(paths.length!==1)throw Error('Expected one compound path');
  const rings=parse(paths[0][1]), parents=rings.map((r,i)=>rings.map((s,j)=>({j,size:Math.abs(area(s))})).filter(s=>s.j!==i&&s.size>Math.abs(area(r))&&inside(r[0],rings[s.j])).sort((a,b)=>a.size-b.size)[0]?.j??-1);
  const depths=parents.map((_,i)=>{let d=0;for(let p=parents[i];p!==-1;p=parents[p])d++;return d;});
  // These seven SVGs use properly nested contours. Nonzero and evenodd agree;
  // reject a changed upstream path whose winding would change that assumption.
  if(!svg.includes('fill-rule="evenodd"'))parents.forEach((p,i)=>{if(p!==-1&&Math.sign(area(rings[p]))===Math.sign(area(rings[i])))throw Error('Nonzero winding needs explicit union');});
  const pts=rings.flat(),minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1])),maxY=Math.max(...pts.map(p=>p[1])),scale=.60/Math.max(maxX-minX,maxY-minY);
  const vertices=[],faces=[],roles=[];
  for(let i=0;i<rings.length;i++)if(depths[i]%2===0){
    const outer=rings[i],holes=rings.filter((_,j)=>parents[j]===i),loops=[outer,...holes],flat=loops.flat(),n=flat.length,offset=vertices.length;
    for(const front of [true,false])for(const [x,y] of flat)vertices.push([(x-(minX+maxX)/2)*scale,front?-.03:.03,(maxY-y)*scale]);
    const tris=ShapeUtils.triangulateShape(outer.map(p=>new Vector2(...p)),holes.map(r=>r.map(p=>new Vector2(...p))));
    const expected=Math.abs(area(outer))-holes.reduce((s,r)=>s+Math.abs(area(r)),0),actual=tris.reduce((s,t)=>s+Math.abs(area(t.map(j=>flat[j]))),0);
    if(Math.abs(actual-expected)>1e-6)throw Error('Triangulation area mismatch');
    for(const t of tris){faces.push(t.map(j=>offset+j),[...t].reverse().map(j=>offset+n+j));roles.push(0,0);}
    let k=0;for(const loop of loops){for(let j=0;j<loop.length;j++){const a=offset+k+j,b=offset+k+(j+1)%loop.length;faces.push([a,b,b+n,a+n]);roles.push(1);}k+=loop.length;}
  }
  const data={name,upstreamCommit:commit,sourceSvg:upstream+'/src/icons/'+name+'.svg',curveToleranceSvgUnits:.025,scale,dimensions:[(maxX-minX)*scale,(maxY-minY)*scale,.06],contours:rings.length,solidComponents:depths.filter(d=>d%2===0).length,holes:depths.filter(d=>d%2===1).length,vertices,faces,roles};
  const folder=path.join(project,'blender/environment/codicon_'+name+'/v01');await fs.writeFile(path.join(folder,'geometry.json'),JSON.stringify(data)+'\n');
  console.log(JSON.stringify({name,dimensions:data.dimensions,vertices:vertices.length,triangles:faces.reduce((n,f)=>n+f.length-2,0),components:data.solidComponents,holes:data.holes}));return data;
}
if(process.argv[1]===fileURLToPath(import.meta.url))for(const name of names)await build(name);
