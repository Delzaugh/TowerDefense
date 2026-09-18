import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,cp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {findAsset,validateManifest,resolvePath,hash,projectRoot} from './contracts.mjs';
import {exportAsset,blenderExecutable} from './asset.mjs';
import {checkContainer} from './validate.mjs';

const item=await findAsset('problem_bug'),before=await readFile(resolvePath(item.data.runtime)),source=await readFile(resolvePath(item.data.source.path));
assert.throws(()=>resolvePath('../outside.glb'));
assert.throws(()=>validateManifest({...item.data,clips:[{name:'hit',playback:'loop',fps:24,meaning:'test'}]}));
assert.throws(()=>checkContainer(Buffer.from('broken')));
await assert.rejects(()=>exportAsset({...item,data:{...structuredClone(item.data),source:{...item.data.source,authoritativeHash:'stale'}}},{build:true}),/rebuild refused/);
await assert.rejects(()=>exportAsset({...item,data:{...structuredClone(item.data),budgets:{...item.data.budgets,triangles:1}}}),/Candidate rejected/);
assert.equal(hash(await readFile(resolvePath(item.data.runtime))),hash(before));assert.equal(hash(await readFile(resolvePath(item.data.source.path))),hash(source));

// Exercise creation and a subsequent color/attachment refinement in a disposable
// project, without adding a test model to Tower's catalog or runtime folders.
const temporary=await mkdtemp(path.join(os.tmpdir(),'tower-pipeline-'));
await mkdir(path.join(temporary,'assets'),{recursive:true});await writeFile(path.join(temporary,'assets/asset_catalog.json'),JSON.stringify({schemaVersion:1,assets:[]}));
await cp(resolvePath('tools/asset-pipeline'),path.join(temporary,'tools/asset-pipeline'),{recursive:true});await cp(resolvePath('tools/asset-inspector/vendor'),path.join(temporary,'tools/asset-inspector/vendor'),{recursive:true});
await cp(resolvePath('tools/asset-inspector/server.mjs'),path.join(temporary,'tools/asset-inspector/server.mjs'));
await cp(resolvePath('tools/asset-inspector/review.js'),path.join(temporary,'tools/asset-inspector/review.js'));
async function run(executable,args){await new Promise((resolve,reject)=>{const p=spawn(executable,args,{cwd:temporary,windowsHide:true,stdio:'pipe'});let log='';p.stdout.on('data',c=>log+=c);p.stderr.on('data',c=>log+=c);p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(Error(log)));});}
const cli=['tools/asset-pipeline/asset.mjs'];await run(process.execPath,[...cli,'init','prop_status_module','environment']);
const inspectorProbe=`import assert from 'node:assert/strict';import {createInspectorServer} from './tools/asset-inspector/server.mjs';const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/models');assert.equal(response.status,200);assert.equal((await response.json()).length,Number(process.argv[2]));}finally{await new Promise(r=>server.close(r));}`;
await writeFile(path.join(temporary,'probe.mjs'),inspectorProbe);await run(process.execPath,['probe.mjs','0']);
const file='blender/environment/prop_status_module/v01/prop_status_module_v01.blend';
const recipe=`import bpy,sys\nbpy.ops.wm.read_factory_settings(use_empty=True)\nroot=bpy.data.objects.new('root',None);bpy.context.scene.collection.objects.link(root)\nbpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1\nrefined='refine' in sys.argv\nfor name,location,scale,color in [('body',(0,0,.5),(.5,.5,.5),(.15,.25,.4,1)),('status_panel',(.35 if refined else .65,-.4,1.06),(.15,.10,.12),( .8,.05,.08,1) if refined else (.02,.7,.7,1))]:\n bpy.ops.mesh.primitive_cube_add(size=2,location=location);o=bpy.context.object;o.name=name;o.scale=scale;o.parent=root;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)\n m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color;m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8;o.data.materials.append(m)\nbpy.context.preferences.filepaths.save_version=0\nbpy.ops.wm.save_as_mainfile(filepath=${JSON.stringify(path.join(temporary,file).replaceAll('\\','/'))})\n`;
await writeFile(path.join(temporary,'author.py'),recipe);const blender=await blenderExecutable();
await run(blender,['--factory-startup','--background','--python-exit-code','1','--python','author.py']);
await run(process.execPath,[...cli,'export','prop_status_module']);
await run(process.execPath,['probe.mjs','1']);
const runtime=path.join(temporary,'assets/runtime/environment/prop_status_module_v01.glb'),firstHash=hash(await readFile(runtime));
await run(blender,['--factory-startup','--background','--python-exit-code','1','--python','author.py','--','refine']);await run(process.execPath,[...cli,'export','prop_status_module']);
assert.notEqual(hash(await readFile(runtime)),firstHash);
const manifest=JSON.parse(await readFile(path.join(temporary,'blender/environment/prop_status_module/v01/asset.json'))),report=JSON.parse(await readFile(path.join(temporary,manifest.delivery.report)));
assert.equal(manifest.revision,3);assert.equal(manifest.milestones.length,1);assert.equal(report.passed,true);assert.equal(report.clips.length,0);assert.equal(report.sha256,hash(await readFile(runtime)));assert.equal(report.sourceHash,hash(await readFile(path.join(temporary,file))));
console.log(JSON.stringify({passed:true,checks:'Manifest/clip/path rejection, malformed GLB, stale-source rebuild refusal, failed-candidate preservation, new-model scaffold/export and manual color/attachment refinement with synchronized source/runtime hashes',fixture:temporary},null,2));
