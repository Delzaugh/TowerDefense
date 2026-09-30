import bpy,json
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath=str(Path('blender/towers/copilot_mona_head/v01/copilot_mona_head_v01.blend').resolve()))
r={'objects':[],'images':[],'materials':[]}
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  r['objects'].append({'name':o.name,'verts':len(o.data.vertices),'triangles':sum(len(p.vertices)-2 for p in o.data.polygons),'bounds':[[min((o.matrix_world@v.co)[i] for v in o.data.vertices),max((o.matrix_world@v.co)[i] for v in o.data.vertices)] for i in range(3)],'materials':[m.name for m in o.data.materials],'attrs':list(o.data.color_attributes.keys())})
for m in bpy.data.materials:
 r['materials'].append({'name':m.name,'nodes':[(n.name,n.type) for n in m.node_tree.nodes] if m.use_nodes else []})
for im in bpy.data.images:r['images'].append({'name':im.name,'size':list(im.size),'path':im.filepath})
Path('blender/towers/copilot_mona/v01/references/head_source_audit.json').write_text(json.dumps(r,indent=2))
print(json.dumps(r))
