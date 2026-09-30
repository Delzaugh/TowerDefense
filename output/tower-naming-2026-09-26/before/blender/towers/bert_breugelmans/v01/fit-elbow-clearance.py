import bpy,importlib.util,json
from pathlib import Path
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];cloth=bpy.data.objects['bert_clothing'];pack=bpy.data.objects['cohesion_pack']
spec=importlib.util.spec_from_file_location('celebrate',base/'celebrate.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
groups={g.index for g in cloth.vertex_groups if g.name.startswith(('upper_','fore_','hand_'))}
ids={v.index for v in cloth.data.vertices if any(g.group in groups and g.weight>0 for g in v.groups)}
faces=[tuple(p.vertices) for p in cloth.data.polygons if all(i in ids for i in p.vertices)]
role=pack.data.attributes[pack['palette_roles']['attribute']];teal=pack['palette_roles']['roles']['teal']
straps=[tuple(p.vertices) for p in pack.data.polygons if round(role.data[p.loop_start].value)==teal]
rig.animation_data.action=None;results=[]
for forward in (.035,.055):
 for outward in (1.3,2):
  for shift in (.03,.06,.09):
    m.ARM_FORWARD=forward;m.ELBOW_OUT=outward;hits=0;maxhits=0;drop=10
    for f in (18,22,28,35,40,48,54,68,78):
        try:m.pose(rig,f)
        except ValueError:hits=99999;break
        bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
        ce=cloth.evaluated_get(dg);cm=ce.to_mesh();pe=pack.evaluated_get(dg);pm=pe.to_mesh()
        points=[];body=rig.pose.bones['body'].matrix@rig.data.bones['body'].matrix_local.inverted()
        for v in pack.data.vertices:
            p=v.co.copy();g=max(0,min(1,(.15-p.y)/.20));p.x-=(-1 if p.x<0 else 1)*shift*g;points.append(body@p)
        cb=BVHTree.FromPolygons([v.co for v in cm.vertices],faces);pb=BVHTree.FromPolygons(points,straps)
        h=len(cb.overlap(pb));hits+=h;maxhits=max(maxhits,h)
        drop=min(drop,rig.pose.bones['upper_r'].head.z-rig.pose.bones['fore_r'].head.z)
        ce.to_mesh_clear();pe.to_mesh_clear()
    results.append({'forward':forward,'outward':outward,'inward':shift,'totalPairs':hits,'maxPairs':maxhits,'elbowDrop':round(drop,3)})
print(json.dumps(results))
