const fs=require('node:fs');const {spawnSync}=require('node:child_process');
process.env.PLAYWRIGHT_MODULE_PATH='C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const ids=process.argv.slice(2);
for(const id of ids){
 const out=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','export',id],{encoding:'utf8',windowsHide:true,env:process.env});
 fs.writeFileSync(`blender/environment/${id}/v01/validation/delivery-log.txt`,out.stdout+'\n'+out.stderr);
 console.log(id+': '+out.status+' '+out.stdout.trim().split('\n').at(-1));if(out.status!==0){console.error(out.stdout,out.stderr);process.exit(out.status||1);}
}
