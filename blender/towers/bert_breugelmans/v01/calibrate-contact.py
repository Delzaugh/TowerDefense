import bpy,json,importlib.util
from mathutils.bvhtree import BVHTree
from pathlib import Path
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];skin=bpy.data.objects['bert_skin']
spec=importlib.util.spec_from_file_location('bert_celebrate',base/'celebrate.py')
performance=importlib.util.module_from_spec(spec);spec.loader.exec_module(performance)
rig.animation_data.action=None
for gap in (.022,.024,.025,.026,.027,.028,.030):
    performance.CONTACT_GAP=gap; performance.pose(rig,28)
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get();se=skin.evaluated_get(dg);sm=se.to_mesh()
    inverse=rig.pose.bones['body'].matrix.inverted();result={};trees={};hand_pts={}
    for side in ('l','r'):
        groups={skin.vertex_groups[n+'_'+side].index for n in ('hand','fingers','digits','thumb')}
        ids=[v.index for v in skin.data.vertices if any(g.group in groups and g.weight>0 for g in v.groups)]
        pts=[inverse@sm.vertices[i].co for i in ids]
        result[side]={'xmin':min(p.x for p in pts),'xmax':max(p.x for p in pts)}
        faces=[tuple(p.vertices) for p in skin.data.polygons if all(i in ids for i in p.vertices)]
        points=[sm.vertices[i].co.copy() for i in range(len(sm.vertices))]
        trees[side]=BVHTree.FromPolygons(points,faces);hand_pts[side]=[points[i] for i in ids]
    result['intersections']=len(trees['l'].overlap(trees['r']))
    result['nearest']=min(trees['r'].find_nearest(p)[3] for p in hand_pts['l'])
    se.to_mesh_clear();print('CONTACT_EXTENTS',gap,json.dumps(result))
