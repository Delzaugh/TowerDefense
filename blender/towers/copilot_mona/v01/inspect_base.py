import bpy,json
from pathlib import Path
p=Path('blender/towers/copilot_octocat_classic_lowpoly/v01/copilot_octocat_classic_lowpoly_v01.blend').resolve();bpy.ops.wm.open_mainfile(filepath=str(p))
r={'objects':[],'images':[],'materials':[]}
for o in bpy.data.objects:
 if o.type=='MESH':r['objects'].append({'name':o.name,'parent':o.parent.name if o.parent else None,'triangles':sum(len(f.vertices)-2 for f in o.data.polygons),'materials':[m.name for m in o.data.materials],'modifiers':[m.type for m in o.modifiers],'bounds':[[min(v.co[i] for v in o.data.vertices),max(v.co[i] for v in o.data.vertices)] for i in range(3)]})
for m in bpy.data.materials:
 r['materials'].append({'name':m.name,'images':[(n.image.name,list(n.image.size)) for n in m.node_tree.nodes if n.type=='TEX_IMAGE']})
for im in bpy.data.images:
 if im.type=='IMAGE':r['images'].append({'name':im.name,'size':list(im.size)})
Path('blender/towers/copilot_mona/v01/references/classic_base_audit.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
