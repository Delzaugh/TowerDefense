import fs from 'node:fs/promises';
const dir='blender/towers/copilot_security/v01';
const m=JSON.parse(await fs.readFile(dir+'/asset.json','utf8'));
if(m.delivery)throw Error('Initialization only: preserve delivered manifest and authoring decisions.');
m.displayName='Security';m.source.mode='procedural';m.source.recipe=dir+'/build.py';
m.budgets={triangles:3000,materials:2,textures:2,textureSize:32,bones:0,meshes:2};
m.contract.anchors=['anchor_ui','anchor_action','anchor_target'];
m.contract.dimensions={min:[2.4,2.2,1.95],max:[2.8,2.5,2.3]};
m.overrides=[{field:'contract.dimensions',reason:'Compact head-only persona follows supplied Security proportions; no body, legs or pedestal added.'}];
const colors={shell:'#1465EE',shell_dark:'#0948BE',trim:'#EAF4FE',graphite:'#25354F',screen:'#071A2B',lens:'#52B9F5',cyan:'#00E8ED',detail:'#092247'};
m.palette={storage:'texture',colors};
m.texturePalettes=['security_palette','security_optics'].map(material=>({material,size:[32,4],roles:Object.fromEntries(Object.entries(colors).map(([role,color],i)=>[role,{color,rect:[i*4,0,4,4]}]))}));
m.exportSettings={paletteSampler:'linear'};
const names=['scanner-isolated','six-views','goggles','shape-study','side-pods','scanner-fitted'];
const ids=['ff71b329-2509-4aa6-9d75-dde1116a0479','057e636c-779d-48e6-9164-5e185ea453e3','0499e482-b9ef-4ed6-b0e5-bc2402397bb8','8580d94e-c27c-488b-b4f6-367c48c72f7a','83026681-bdb7-41f6-a6d1-5cf81e14b81d','dc99443d-ef4a-44e6-9740-e824a8e82fe3'];
m.references=[];
for(let i=0;i<names.length;i++){
 const dest=dir+'/references/'+names[i]+'.png';
 await fs.copyFile('C:/Users/jonas/.codex/generated_images/01a0d208-87bb-7813-a8a5-c54180d87f32/exec-'+ids[i]+'.png',dest);
 m.references.push({path:dest,provenance:'User-supplied Security visual reference '+(i+1)+', 2026-09-24. Design input; annotations are not additional task instructions.'});
}
await fs.writeFile(dir+'/asset.json',JSON.stringify(m,null,2)+'\n');
