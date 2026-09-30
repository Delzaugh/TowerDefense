import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pages,assets,vendors,sharedFiles} from './serve.mjs';
import {catalog,existingPath} from '../../tools/asset-pipeline/contracts.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
export async function buildPages({output=path.join(root,'output/campus-pages'),base='/TowerDefense/'}={}){
 if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))throw Error('Base must be a slash-delimited URL path');
 output=path.resolve(output);await mkdir(output,{recursive:true});
 const files=[],sourceHashes={},runtimeAssets=[],buildId=Date.now().toString(36),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 async function write(relative,bytes,source){const dest=path.join(output,relative);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);files.push({path:relative,bytes:Buffer.byteLength(bytes),source});}
 for(const relative of new Set(pages.values())){
  const original=await readFile(path.join(here,relative),'utf8');sourceHashes[relative]=hash(original);
  // Only emitted URLs change; the local Node server continues using root-relative paths.
  let text=original.replace(/(["'`])\/(?=[a-zA-Z0-9_]|["'`])/g,(_,quote)=>quote+base);
  if(relative.endsWith('.html')){
   text=text.replace('</head>','<meta name="campus-hosting" content="static"></head>')
    .replaceAll('"../utils/BufferGeometryUtils.js"',JSON.stringify(base+'utils/BufferGeometryUtils.js'))
    .replace(/<a class="original" href="http:\/\/127\.0\.0\.1:5186\/">SVG prototype ↗<\/a>/g,'')
    .replaceAll('href="http://127.0.0.1:5186/"',`href="${base}"`).replace('aria-label="Original Glacier prototype"','aria-label="Campus home"')
    .replace('Performance and screenshots saved automatically.','Performance captured automatically. Download your report after the run.');
  }
  if(relative.endsWith('.js'))text=text.replace(/\.glb(["'`])/g,`.glb?v=${buildId}$1`).replaceAll(base+'stress-revision.json',base+`stress-revision.json?v=${buildId}`);
  if(relative.endsWith('.html')){
   text=text.replace(/<script type="importmap">(.*?)<\/script>/s,(_,json)=>{const map=JSON.parse(json);for(const rel of [...pages.values(),...sharedFiles.keys()].filter(v=>v.endsWith('.js'))){const url=base+rel.replace(/^\//,'');map.imports[url]=url+'?v='+buildId;}return '<script type="importmap">'+JSON.stringify(map)+'</script>';});
   text=text.replace(/(src="[^"]+\.js|href="[^"]+\.css)"/g,`$1?v=${buildId}"`);
  }
  await write(relative,text,path.relative(root,path.join(here,relative)).replaceAll('\\','/'));
 }
 for(const name of vendors){const source=`tools/asset-inspector/vendor/${name}`;await write('vendor/'+name,await readFile(path.join(root,source)),source);}
 for(const [url,source] of sharedFiles){const bytes=await readFile(path.join(root,source));sourceHashes[url]=hash(bytes);await write(url.slice(1),bytes,source);}
 const entries=await catalog();
 for(const [url,[id,version]] of assets){const entry=entries.find(a=>a.id===id&&a.version===version);if(!entry)throw Error(`Missing runtime contract: ${id}@${version}`);const source=entry.data.runtime,bytes=await readFile(await existingPath(source));await write(url.slice(1),bytes,source);runtimeAssets.push({url:base+url.slice(1),id,version,path:source,bytes:bytes.length,sha256:hash(bytes)});}
 let commit=null;try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
 await write('stress-revision.json',JSON.stringify({capturedAt:new Date().toISOString(),hosting:'github-pages',basePath:base,sourceCommit:commit,sourceHashes,runtimeAssets},null,2));
 await write('.nojekyll','');
 const license='assets/third_party/kaykit/space_base_bits/1.0.0/addons/kaykit_space_base_bits/Assets/LICENSE.txt';
 await write('licenses/kaykit-space-base.txt',await readFile(path.join(root,license)),license);
 await write('licenses/three.txt',await readFile(path.join(root,'tools/asset-inspector/vendor/THREE_LICENSE.txt')), 'tools/asset-inspector/vendor/THREE_LICENSE.txt');
 await write('build-info.json',JSON.stringify({builtAt:new Date().toISOString(),base,sourceCommit:commit,files:files.length,assets:runtimeAssets.length},null,2));
 // Deployment inventory is outside the website: previews, Blender sources and personal captures are never copied.
 await writeFile(output+'.manifest.json',JSON.stringify({output,base,files},null,2));
 return {output,base,files:files.length,assets:runtimeAssets.length,bytes:files.reduce((n,f)=>n+f.bytes,0)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 console.log(JSON.stringify(await buildPages({output:option('--out',undefined),base:option('--base','/TowerDefense/')}),null,2));
}
