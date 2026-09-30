import json
from pathlib import Path
p=Path(__file__).parent/'asset.json'
m=json.loads(p.read_text(encoding='utf-8'))
m['displayName']='Architect Copilot — Boundary Bridge'
m['budgets']['textures']=2
m['contract']['dimensions']={'min':[2.8,2.0,1.5],'max':[3.5,2.6,2.5]}
colors={'shell':'#485995','trim':'#E2EDF0','slate':'#89A4B8','screen':'#041D2A','amber':'#F2B54D','cyan':'#00E5EF','shell_dark':'#303E72','detail':'#89A4B8'}
m['palette']={'storage':'texture','colors':colors}
roles={role:{'rect':[i*4,0,4,4],'color':color} for i,(role,color) in enumerate(colors.items())}
m['texturePalettes']=[{'material':'architect_'+name,'size':[32,4],'roles':roles} for name in ('palette','optics')]
for ref in m['references']:ref['role']='Historical, superseded by Boundary Bridge: '+ref['role']
folder='blender/towers/copilot_architect/v01/references/boundary_bridge_spec_pack_2026-09-30/'
for f in Path(__file__).parent.joinpath('references/boundary_bridge_spec_pack_2026-09-30').glob('*.png'):
    m['references'].append({'path':folder+f.name,'role':'Approved primary concept' if f.name=='approved-concept.png' else 'Illustrative reference; concealed construction conceptual, counts unverified.'})
m['overrides'].append('2026-09-30 approved Boundary Bridge and replacement model. Broad curved head, proud chalk pillars, indigo bridge and amber cartridges; small rear three-node panel. Keep 4500 triangles and two materials, tiny palette with two texture bindings.')
p.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
