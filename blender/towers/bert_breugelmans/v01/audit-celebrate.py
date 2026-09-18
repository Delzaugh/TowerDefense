"""Contact, continuity and preservation checks on the authored celebration."""
import bpy, json, hashlib, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
def signature(apply_proportions=False):
    out={}
    for o in bpy.data.objects:
        if o.type=='MESH':
            def mapped(v):
                p=v.co.copy()
                if apply_proportions:
                    z=p.z
                    p.z=z*.8 if z<=.265 else z-.134 if z>=1.34 else .212+(z-.265)*(.994/1.075)
                return [round(x,5) for x in p]
            payload={'vertices':[mapped(v) for v in o.data.vertices],
                     'faces':[list(p.vertices) for p in o.data.polygons],
                     'weights':[[(g.group,g.weight) for g in v.groups] for v in o.data.vertices],
                     'uvs':[[list(d.uv) for d in uv.data] for uv in o.data.uv_layers]}
            out[o.name]=hashlib.sha256(json.dumps(payload).encode()).hexdigest()
    for a in bpy.data.actions:
        if a.name!='idle': continue
        payload=[(c.data_path,c.array_index,[(list(k.co),k.interpolation,list(k.handle_left),list(k.handle_right)) for k in c.keyframe_points])
                 for l in a.layers for s in l.strips for bag in s.channelbags for c in bag.fcurves]
        out['clip:'+a.name]=hashlib.sha256(json.dumps(payload).encode()).hexdigest()
    for i in bpy.data.images:
        if i.packed_file: out['image:'+i.name]=hashlib.sha256(bytes(i.packed_file.data)).hexdigest()
    return out
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig']; skin=bpy.data.objects['bert_skin']; clothing=bpy.data.objects['bert_clothing']
rig.animation_data.action=bpy.data.actions['celebrate_team']
hand_ids={}; hand_faces={}
for side in ('l','r'):
    groups={skin.vertex_groups[n+'_'+side].index for n in ('hand','fingers','digits','thumb')}
    ids={v.index for v in skin.data.vertices if any(g.group in groups and g.weight>0 for g in v.groups)}
    hand_ids[side]=ids
    hand_faces[side]=[tuple(p.vertices) for p in skin.data.polygons if all(v in ids for v in p.vertices)]
sole_ids=[v.index for v in clothing.data.vertices if abs(v.co.z)<1e-6]
rest_soles={i:clothing.data.vertices[i].co.copy() for i in sole_ids}
frames=[]; prev={}; prev_hand={}; max_jump=0; max_step=0; min_elbow=100; contacts=[]
max_sole_drift=0; min_floor=0; max_floor=0; overlaps=[]
for f in range(193):
    frame=f*.5; bpy.context.scene.frame_set(int(frame),subframe=frame%1)
    bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get()
    se=skin.evaluated_get(dg); sm=se.to_mesh(); points=[se.matrix_world@v.co for v in sm.vertices]
    trees={side:BVHTree.FromPolygons(points,hand_faces[side]) for side in ('l','r')}
    hits=len(trees['l'].overlap(trees['r']))
    if hits: overlaps.append({'frame':frame,'trianglePairs':hits})
    distance=min(min(trees['r'].find_nearest(points[i])[3] for i in hand_ids['l']),
                 min(trees['l'].find_nearest(points[i])[3] for i in hand_ids['r']))
    if frame in (28,40,54): contacts.append({'frame':frame,'surfaceVertexDistance':distance,'triangleIntersections':hits})
    se.to_mesh_clear()
    ce=clothing.evaluated_get(dg); cm=ce.to_mesh()
    for i in sole_ids:
        p=ce.matrix_world@cm.vertices[i].co
        max_sole_drift=max(max_sole_drift,(p-rest_soles[i]).length)
        min_floor=min(min_floor,p.z); max_floor=max(max_floor,p.z)
    ce.to_mesh_clear()
    for side in ('l','r'):
        elbow=rig.pose.bones['fore_'+side].head; shoulder=rig.pose.bones['upper_'+side].head
        min_elbow=min(min_elbow,shoulder.z-elbow.z)
        p=rig.pose.bones['hand_'+side].head.copy()
        if side in prev_hand: max_step=max(max_step,(p-prev_hand[side]).length)
        prev_hand[side]=p
    for p in rig.pose.bones:
        q=p.rotation_quaternion.copy()
        if p.name in prev: max_jump=max(max_jump,math.degrees(q.rotation_difference(prev[p.name]).angle))
        prev[p.name]=q
    if frame in (0,96):
        frames.append({'frame':frame,'maxRestMatrixError':max(max(abs(p.matrix_basis[i][j]-(1 if i==j else 0)) for i in range(4) for j in range(4)) for p in rig.pose.bones)})
manifest=json.loads((base/'asset.json').read_text())
result={'revision':manifest['revision'],'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),
    'scope':'Celebration contacts and continuity; preservation is checked separately in work-walk-arms-audit.json.',
    'samples':193,'contacts':contacts,'handIntersections':overlaps,
    'maxSoleDriftMetres':max_sole_drift,'soleHeightRange':[min_floor,max_floor],
    'minimumElbowBelowShoulderMetres':min_elbow,'maxHalfFrameBoneRotationDegrees':max_jump,
    'maxHalfFrameWristTravelMetres':max_step,'endpoints':frames}
result['passed']=not overlaps and all(.0003<c['surfaceVertexDistance']<.004 for c in contacts) and max_sole_drift<1e-5 and max_jump<25 and all(x['maxRestMatrixError']<1e-5 for x in frames)
(base/'validation/celebrate-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result)); assert result['passed'],result
