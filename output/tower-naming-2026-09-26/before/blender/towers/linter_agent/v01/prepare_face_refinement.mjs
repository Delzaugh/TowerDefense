import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const manifestFile=path.join(folder,'asset.json');
const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
const audit=JSON.parse(await readFile(path.join(folder,'validation/attachment_face_source.json'),'utf8'));
const roles=Object.entries(audit.roles);
for(const palette of manifest.texturePalettes){
  palette.roles=Object.fromEntries(roles.map(([name,color],i)=>[name,{color,rect:[i*4,0,4,4]}]));
}
manifest.palette.colors=audit.roles;
const referenceFolder=path.join(folder,'references/attachment_face_feedback');
await mkdir(referenceFolder,{recursive:true});
for(const [name,temp] of [
  ['floating_pod.png','codex-clipboard-2877f8cd-0ad7-4b0d-ba04-ff3f84c33355.png'],
  ['face_plate.png','codex-clipboard-69b8ad1f-86bd-4a8d-bfc5-5719cd8b3d00.png'],
  ['visor.png','codex-clipboard-20aa25ae-dab2-478f-9b28-1970f63ea460.png'],
]){
  await copyFile(path.join('C:/Users/jonas/AppData/Local/Temp',temp),path.join(referenceFolder,name));
  const relative='blender/towers/linter_agent/v01/references/attachment_face_feedback/'+name;
  if(!manifest.references.some(r=>r.path===relative))manifest.references.push({path:relative,provenance:'User screenshot on 2026-09-24 illustrating explicit feedback: floating pods, insufficiently recessed face plate, pale visor. Image is design evidence; typed user feedback authorizes the localized correction.'});
}
await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
const reviewFile=path.join(folder,'validation/visual_review.json');
const review=JSON.parse(await readFile(reviewFile,'utf8'));
if(review.revision===10){
  review.userAcceptance={status:'rejected',note:'User identified floating pods, asked for a more recessed/accentuated face plate and improved pale visor. This supersedes the earlier positive author construction assessment.'};
  review.checks.construction={status:'failed',findings:'User close-up exposed a real gap at pod roots and face panel concealed by the uncut chassis. The earlier r10 author assessment missed these defects; follow-up source pass addresses both causes.'};
  await writeFile(reviewFile,JSON.stringify(review,null,2)+'\n');
}
