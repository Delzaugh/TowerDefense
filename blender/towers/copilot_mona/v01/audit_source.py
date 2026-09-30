"""Read-only source parity and topology audit for the selected-base correction."""
import bpy,bmesh,json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
base=p/'references/classic_lowpoly_base_r8.blend';source=p/'copilot_mona_v01.blend'
def rest():
 root=bpy.data.objects['root']
 for o in [root,*root.children_recursive]:
  if o.animation_data:o.animation_data_clear()
  if o.type=='ARMATURE':
   for b in o.pose.bones:b.matrix_basis.identity()
 bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
 return root

def snapshot():
 root=rest();r={'meshes':{},'rig':{},'anchors':{}}
 for o in root.children_recursive:
  if o.type=='MESH':
   r['meshes'][o.name]={'geometry':{'vertices':[list(v.co) for v in o.data.vertices],'faces':[list(f.vertices) for f in o.data.polygons]},'weights':[[[o.vertex_groups[w.group].name,w.weight] for w in v.groups] for v in o.data.vertices]}
  elif o.type=='ARMATURE':r['rig']={b.name:{'head':list(b.head_local),'tail':list(b.tail_local),'parent':b.parent.name if b.parent else None} for b in o.data.bones}
  elif o.name.startswith('anchor_'):r['anchors'][o.name]=list(o.matrix_world.translation)
 return r
bpy.ops.wm.open_mainfile(filepath=str(base));baseline=snapshot()
bpy.ops.wm.open_mainfile(filepath=str(source));current=snapshot();root=bpy.data.objects['root']
r={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'baseSourceHash':hashlib.sha256(base.read_bytes()).hexdigest(),'geometryParity':{},'weightParity':{},'rigUnchanged':baseline['rig']==current['rig'],'anchorsUnchanged':baseline['anchors']==current['anchors'],'parts':{},'contact_by_leg':{},'images':[]}
for name,mesh in baseline['meshes'].items():
 r['geometryParity'][name]=current['meshes'][name]['geometry']==mesh['geometry'];r['weightParity'][name]=current['meshes'][name]['weights']==mesh['weights']
assert all(r['geometryParity'].values()) and all(r['weightParity'].values()) and r['rigUnchanged'] and r['anchorsUnchanged']
for name in ['head_and_ears','body_five_tentacles']:
 o=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(o.data)
 r['parts'][name]={'triangles':sum(len(f.verts)-2 for f in bm.faces),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'degenerateFaces':sum(f.calc_area()<1e-10 for f in bm.faces),'looseVertices':sum(not v.link_edges for v in bm.verts)}
 assert r['parts'][name]['nonManifoldEdges']==0 and r['parts'][name]['degenerateFaces']==0 and r['parts'][name]['looseVertices']==0
 bm.free()
body=bpy.data.objects['body_five_tentacles']
for g in body.vertex_groups:
 if g.name.startswith('foot_'):
  vs=[v for v in body.data.vertices if any(w.group==g.index and w.weight>.01 for w in v.groups)]
  r['contact_by_leg'][g.name]=min(v.co.z for v in vs)
assert len(r['contact_by_leg'])==4 and all(abs(y)<.002 for y in r['contact_by_leg'].values())
for im in bpy.data.images:
 if im.type=='IMAGE' and im.users:r['images'].append({'name':im.name,'size':list(im.size),'packed':bool(im.packed_file)})
assert all(i['packed'] for i in r['images'])
r['anatomy']={'supporting_legs':4,'raised_tail':1,'cupRows':dict(bpy.data.objects['suction_cup_rows']['row_counts']),'whiskers':len([o for o in root.children_recursive if o.name.startswith('whisker_')])}
assert sum(r['anatomy']['cupRows'].values())==45 and r['anatomy']['whiskers']==4
r['passed']=True
p.joinpath('validation/source_audit.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(json.dumps(r))
