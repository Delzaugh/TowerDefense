import {readFile, writeFile, mkdir, rename, realpath} from 'node:fs/promises';
import path from 'node:path';
import {projectRoot, resolvePath, hash} from './contracts.mjs';

const read = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const identityKeys = ['asset', 'version', 'revision', 'sha256', 'sourceHash'];
const checkNames = ['referenceFidelity', 'construction', 'readability', 'motion'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// This verifies the evidence record, never the artistic judgment it contains.
export async function reviewAsset(item, {initialize = false, root = projectRoot} = {}) {
  const m = item.data, folder = path.posix.dirname(item.manifest);
  const relative = folder + '/validation/visual_review.json';
  const file = resolvePath(relative, root), rootReal = await realpath(root);
  async function localFile(name) {
    const resolved = await realpath(resolvePath(name, root));
    if (!resolved.startsWith(rootReal + path.sep)) throw Error('Evidence path escapes project: ' + name);
    return resolved;
  }
  const [source, runtime] = await Promise.all([
    readFile(await localFile(m.source.path)), readFile(await localFile(m.runtime))
  ]);
  const identity = {asset:m.id, version:m.version, revision:m.revision, sha256:hash(runtime), sourceHash:hash(source)};
  const errors = [];
  // Runtime visuals are part of the reviewed result even when GLB bytes stay
  // unchanged. Keep this mapping explicit; manifests cannot load arbitrary code.
  const presentationFiles = [];
  const effectRenderers=[];
  if (m.presentation?.resolve?.type === 'digital_blocks') effectRenderers.push('tools/asset-presentation/digital-resolve.js');
  if (m.presentation?.resolve?.type === 'digital_blocks' || ['glitch_breach','blueprint'].includes(m.presentation?.lifecycle?.type))
    effectRenderers.push('tools/asset-presentation/lifecycle.js');
  for (const renderer of effectRenderers) {
    try { presentationFiles.push({path:renderer, sha256:hash(await readFile(await localFile(renderer)))}); }
    catch (e) { errors.push('Presentation renderer unavailable: ' + e.message); }
  }
  if (m.delivery?.sha256 !== identity.sha256 || m.delivery?.sourceHash !== identity.sourceHash)
    errors.push('Source/runtime differ from the synchronized delivery; export before review.');
  let technical;
  try { technical = await read(await localFile(folder + '/validation/report.json')); }
  catch (e) { errors.push('Technical report unavailable: ' + e.message); }
  if (!technical || !technical.passed || !Array.isArray(technical.errors) || technical.errors.length || identityKeys.some(k => technical[k] !== identity[k]))
    errors.push('Technical validation failed or belongs to different files/revision.');

  let record;
  try { record = await read(await localFile(relative)); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (initialize) {
    if (errors.length) throw Error(errors.join('\n'));
    if (record?.schemaVersion === 1 && identityKeys.every(k => record[k] === identity[k]) &&
        JSON.stringify(record.presentationFiles || []) === JSON.stringify(presentationFiles))
      return {initialized:false, file:relative, message:'Current record preserved; run review without --init to check its status.'};
    if (record) {
      const history = resolvePath(folder + '/validation/review_history', root);
      await mkdir(history, {recursive:true});
      // Content hash also protects records made before the structured format.
      await writeFile(path.join(history, hash(Buffer.from(JSON.stringify(record))) + '.json'), JSON.stringify(record,null,2)+'\n');
    }
    let evidence = [];
    try {
      const rendered = await read(await localFile(folder + '/validation/render_evidence.json'));
      if (rendered.sha256 === identity.sha256) evidence = rendered.views.map(v => ({
        path:folder+'/validation/'+v.file, sha256:v.sha256, view:v.view, mode:v.mode,
        ...(v.clip ? {clip:v.clip, progress:v.progress} : {})
      }));
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const pending = () => ({status:'pending', findings:''});
    record = {schemaVersion:1, ...identity, scope:'model', reviewedAt:null,
      checks:{referenceFidelity:pending(), construction:pending(), readability:pending(),
        motion:m.clips.length ? pending() : {status:'not_applicable', findings:['towers','enemies'].includes(m.category) ? 'Model-stage review; no authored clips yet. Record the animation handoff or deferral in decisions; baseline animation remains pending.' : 'Static asset; no motion clips in the contract.'}},
      secondPass:pending(), evidence, ...(presentationFiles.length ? {presentationFiles} : {}), userAcceptance:{status:'pending', note:''}, limitations:[]};
    await mkdir(path.dirname(file), {recursive:true});
    // A draft is deliberately pending. The command never marks artwork passed.
    await writeFile(file+'.pending', JSON.stringify(record,null,2)+'\n');
    await rename(file+'.pending', file);
    return {ready:false, initialized:true, file:relative, message:'Draft created; inspect the export, then fill findings and a second-pass assessment.'};
  }
  if (!record) errors.push('No visual review. Run review <id> --init after export.');
  else {
    if (record.schemaVersion !== 1) errors.push('Legacy review: preserve/migrate it with review <id> --init.');
    for (const key of identityKeys) if (record[key] !== identity[key]) errors.push('Stale review identity: ' + key);
    if (JSON.stringify(record.presentationFiles || []) !== JSON.stringify(presentationFiles))
      errors.push('Presentation renderer changed or is missing from this review; inspect the effect again.');
    if (!['model','refinement','palette','animation'].includes(record.scope)) errors.push('Declare the review scope.');
    if (!nonempty(record.reviewedAt) || !Number.isFinite(Date.parse(record.reviewedAt))) errors.push('Record when the visual review was completed.');
    for (const name of checkNames) {
      const c = record.checks?.[name];
      if (!['passed','not_applicable'].includes(c?.status) || !nonempty(c?.findings))
        errors.push(name + ': record a completed assessment or a reason it is not applicable.');
    }
    if (record.secondPass?.status !== 'passed' || !nonempty(record.secondPass?.findings))
      errors.push('Second author review is incomplete or failed.');
    if (!Array.isArray(record.evidence) || !record.evidence.length) errors.push('Include inspected evidence files.');
    else for (const evidence of record.evidence) {
      try {
        if (!evidence?.path?.startsWith(folder + '/') || !nonempty(evidence.view)) throw Error('Use an asset-local evidence path and view description.');
        if (hash(await readFile(await localFile(evidence.path))) !== evidence.sha256) throw Error('Evidence bytes changed since review.');
      } catch (e) { errors.push((evidence?.path || 'Evidence') + ': ' + e.message); }
    }
    if (!['pending','accepted','rejected'].includes(record.userAcceptance?.status)) errors.push('Declare user acceptance separately.');
    else if (record.userAcceptance.status !== 'pending' && !nonempty(record.userAcceptance.note)) errors.push('Record the explicit user feedback.');
    if (record.userAcceptance?.status === 'rejected') errors.push('User rejected this revision; the previous positive assessment is superseded.');
    if (!Array.isArray(record.limitations) || !record.limitations.every(nonempty)) errors.push('limitations must be a list of concrete notes (or empty).');
  }
  return {ready:errors.length === 0, file:relative, ...identity, userAcceptance:record?.userAcceptance?.status || 'pending', errors,
    meaning:'Checks record completeness and current files; author judgment is not independently verified.'};
}
