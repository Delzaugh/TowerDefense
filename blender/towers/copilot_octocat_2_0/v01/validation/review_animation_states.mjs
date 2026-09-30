import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime} from '../../../../../tools/asset-pipeline/validate.mjs';
import {findAsset} from '../../../../../tools/asset-pipeline/contracts.mjs';
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const id of ['copilot_octocat_2_0','copilot_octocat_2_0_lowpoly']){
  const item=await findAsset(id),m=item.data;
  const result=await page.evaluate(async(id)=>{
   const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
   const g=await new GLTFLoader().loadAsync('/runtime/towers/'+id+'_v01.glb'),meshes=[];
   g.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
   const root=g.scene.getObjectByName('root'),presets=root.userData.expression_states,expressions={};
   for(const [state,values] of Object.entries(presets)){
    let energy=0;
    for(const mesh of meshes){if(!mesh.morphTargetDictionary)continue;mesh.morphTargetInfluences.fill(0);
     for(const [name,value] of Object.entries(values))mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]]=value;
     const position=mesh.geometry.attributes.position;
     for(let i=0;i<position.count;i++){const p=mesh.getVertexPosition(i,new THREE.Vector3()),base=new THREE.Vector3().fromBufferAttribute(position,i);energy+=p.distanceToSquared(base);}
    }expressions[state]=energy;
   }
   meshes.forEach(mesh=>mesh.morphTargetInfluences?.fill(0));
   const body=g.scene.getObjectByName(id.endsWith('lowpoly')?'octocat_features':'body_five_tentacles'),groups={};
   const limbs=['leg_left','arm_left','leg_rear','arm_right','leg_right'];limbs.forEach(n=>groups[n]=[]);
   const joints=body.geometry.attributes.skinIndex,weights=body.geometry.attributes.skinWeight;
   for(let i=0;i<joints.count;i++){
    const js=[joints.getX(i),joints.getY(i),joints.getZ(i),joints.getW(i)],ws=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)];
    const k=ws.indexOf(Math.max(...ws)),name=body.skeleton.bones[js[k]].name;
    for(const n of limbs)if(name===n+'_3'||name===n+'_4')groups[n].push(i);
   }
   const locomotion=root.userData.locomotion,legs=locomotion.legs,mixer=new THREE.AnimationMixer(g.scene),gaits={};
   for(const clipName of ['move','run']){
   const clip=g.animations.find(a=>a.name===clipName);mixer.stopAllAction();const action=mixer.clipAction(clip);action.reset().play();
   const stance=clipName==='move'?locomotion.stanceFraction:locomotion.run.stanceFraction;
   let penetration=0,stanceGap=0,minNonSupportClearance=Infinity,flightSamples=0;const samples=[];
   for(let f=0;f<240;f++){
    const phase=f/240;action.time=clip.duration*phase;mixer.update(0);g.scene.updateMatrixWorld(true);body.skeleton.update();
    const floors={};for(const n of limbs){
     let y=Infinity;for(const i of groups[n])y=Math.min(y,body.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(body.matrixWorld).y);
     floors[n]=y;
     if(legs.includes(n)){penetration=Math.max(penetration,-y);if((phase+legs.indexOf(n)/2)%1<stance)stanceGap=Math.max(stanceGap,Math.abs(y));}
     else minNonSupportClearance=Math.min(minNonSupportClearance,y);
    }if(legs.every(n=>floors[n]>.001))flightSamples++;if(f%24===0)samples.push({phase,floors});
   }
   gaits[clipName]={runtimeContactSamples:samples,maxRuntimePenetrationMetres:penetration,maxRuntimeStanceGapMetres:stanceGap,minNonSupportClearanceMetres:minNonSupportClearance,flightSamples};
   }
   mixer.stopAllAction();g.scene.updateMatrixWorld(true);
   return {locomotion,expressions,independentReset:meshes.every(o=>!o.morphTargetInfluences||o.morphTargetInfluences.every(v=>v===0)),gaits};
  },id);
  assert(result.expressions.attentive<1e-9);for(const [name,energy] of Object.entries(result.expressions))if(name!=='attentive')assert(energy>1e-8,name+' constant');assert(result.independentReset);
  assert.equal(result.locomotion.type,'biped');assert.deepEqual(result.locomotion.legs,['leg_left','leg_right']);
  for(const gait of Object.values(result.gaits)){assert(gait.maxRuntimePenetrationMetres<.01);assert(gait.maxRuntimeStanceGapMetres<.01);assert(gait.minNonSupportClearanceMetres>.10);}
  assert.equal(result.gaits.move.flightSamples,0);assert(result.gaits.run.flightSamples>0);
  const report={passed:true,asset:id,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,...result};
  await fs.writeFile(path.posix.dirname(item.manifest)+'/validation/animation_states.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({asset:id,passed:true,gaits:Object.fromEntries(Object.entries(result.gaits).map(([n,g])=>[n,{penetration:g.maxRuntimePenetrationMetres,stanceGap:g.maxRuntimeStanceGapMetres,nonSupportClearance:g.minNonSupportClearanceMetres,flightSamples:g.flightSamples}]))}));
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}

