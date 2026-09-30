"""Read-only fitting study for the front strap route against the saved sleeves."""
import bpy,importlib.util,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];cloth=bpy.data.objects['bert_clothing']
spec=importlib.util.spec_from_file_location('straps',base/'straps.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
groups={g.index for g in cloth.vertex_groups if g.name.startswith(('upper_','fore_','hand_'))}
ids={v.index for v in cloth.data.vertices if any(g.group in groups and g.weight>0 for g in v.groups)}
faces=[tuple(p.vertices) for p in cloth.data.polygons if all(i in ids for i in p.vertices)]
rig.animation_data.action=bpy.data.actions['celebrate_team'];bpy.context.scene.frame_set(28);bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get();ce=cloth.evaluated_get(dg);cm=ce.to_mesh()
cb=BVHTree.FromPolygons([v.co for v in cm.vertices],faces)
print('JOINTS',json.dumps({n:list(rig.pose.bones[n].head) for n in ('upper_r','fore_r','hand_r')}))
body=rig.pose.bones['body'].matrix@rig.data.bones['body'].matrix_local.inverted()
results=[]
for shift in (0,.025,.05,.075,.10):
    for depth in (-.025,0,.02):
        vs=[];fs=[]
        for s in (-1,1):
            v,f=m.geometry(s)
            for p in v:
                p=Vector(p);g=max(0,min(1,(.06-p.y)/.23))*max(0,min(1,(2.16-p.z)/.20))
                p.x-=s*shift*g;p.y+=depth*g;vs.append(body@p)
            offset=len(vs)-len(v);fs.extend([tuple(i+offset for i in poly) for poly in f])
        pb=BVHTree.FromPolygons(vs,fs);overlap=pb.overlap(cb)
        results.append({'inward':shift,'depth':depth,'pairs':len(overlap)})
print('FITS',json.dumps(results))
ce.to_mesh_clear()
