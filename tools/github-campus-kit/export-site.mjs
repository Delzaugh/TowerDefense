import {readFile} from 'node:fs/promises';
import {findAsset} from '../asset-pipeline/contracts.mjs';
import {exportAsset} from '../asset-pipeline/asset.mjs';
const plan=JSON.parse(await readFile('tools/github-campus-kit/plan.json','utf8'));
for(const asset of plan.assets.filter(a=>a.owner==='site'&&a.id!=='gh_floor_wood')){
 await exportAsset(await findAsset(asset.id,'v01'));
}
