from pathlib import Path
from pypdf import PdfReader
import json
root=Path(__file__).resolve().parent.parent
out=[]
for p in (root/'documents').glob('*.pdf'):
    reader=PdfReader(p)
    texts=[page.extract_text() or '' for page in reader.pages]
    (root/'work'/f'{p.stem}.txt').write_text('\n\n'.join(f'PDF PAGE {i+1}\n{t}' for i,t in enumerate(texts)),encoding='utf-8')
    hits=[{'page':i+1,'excerpt':t[:800]} for i,t in enumerate(texts) if '275 BRANNAN' in t.upper() or 'GITHUB' in t.upper() or 'TOB1320' in t.upper()]
    out.append({'file':p.name,'pages':len(texts),'hits':hits})
print(json.dumps(out,indent=2))
