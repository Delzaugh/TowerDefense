import fs from 'node:fs/promises';
const dir='blender/towers/copilot_tester/v01/validation';
let js=await fs.readFile('tools/asset-inspector/verify-digital-resolve.mjs','utf8');
js=js.replace("from './server.mjs'","from '../../../../../tools/asset-inspector/server.mjs'").replace("from '../asset-pipeline/validate.mjs'","from '../../../../../tools/asset-pipeline/validate.mjs'").replace("from '../asset-pipeline/contracts.mjs'","from '../../../../../tools/asset-pipeline/contracts.mjs'");
js=js.replaceAll('copilot_developer','copilot_tester').replaceAll('<=5000','<=2500').replaceAll('<=64','<=2').replace('createResolveBudget(128)','createResolveBudget(4)').replace('resourceChecks.used,128','resourceChecks.used,4').replace('resourceChecks.reused,64','resourceChecks.reused,2').replace('maxFragmentsPerAsset:64,modelTriangles:4228,maxCombinedTriangles:4996','maxFragmentsPerAsset:2,modelTriangles:2468,maxCombinedTriangles:2492');
await fs.writeFile(dir+'/review_effect.mjs',js);
