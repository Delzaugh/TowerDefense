import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {catalog,existingPath,resolvePath,hash} from './contracts.mjs';
import {validateExport} from './validate.mjs';

const results=[];
for(const item of await catalog()){
  const m=item.data,folder=path.posix.dirname(item.manifest),report=await validateExport(await existingPath(m.runtime),m,resolvePath(folder+'/validation'));
  report.source=m.source.path;report.sourceHash=hash(await readFile(await existingPath(m.source.path)));report.runtime=m.runtime;
  if(m.delivery && (m.delivery.sha256!==report.sha256 || m.delivery.sourceHash!==report.sourceHash)){report.errors.push('Files differ from recorded delivery');report.passed=false;}
  await writeFile(resolvePath(folder+'/validation/report.json'),JSON.stringify(report,null,2)+'\n');
  results.push({id:m.id,version:m.version,source:m.source.path,runtime:m.runtime,sha256:report.sha256,sourceHash:report.sourceHash,passed:report.passed,triangles:report.triangles,errors:report.errors});
  console.log((report.passed?'PASS ':'FAIL ')+m.id+(report.errors.length?' '+report.errors.join('; '):''));
}
const passed=results.every(r=>r.passed);
await writeFile(resolvePath('assets/validation_catalog.json'),JSON.stringify({checkedAt:new Date().toISOString(),passed,count:results.length,assets:results},null,2)+'\n');
console.log('Validated '+results.length+' assets; '+results.filter(r=>!r.passed).length+' failures.');
if(!passed)process.exitCode=1;
