"""Actual palm direction, arm range, clearances and preservation checks."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Quaternion
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
def digest(value):return hashlib.sha256(json.dumps(value).encode()).hexdigest()
def signature():
    result={}
    for o in bpy.data.objects:
        if o.type=='MESH':
            excluded={g.index for g in o.vertex_groups if g.name.startswith(('hand_','fingers_','digits_','thumb_'))} if o.name=='bert_skin' else set()
            # The subsequent user-requested collar cavity repair intentionally
            # replaces the isolated neck component as well as the hands.
            neck_ids=set()
            if o.name=='bert_skin':
                adjacency={v.index:set() for v in o.data.vertices}
                for e in o.data.edges:
                    a,b=e.vertices;adjacency[a].add(b);adjacency[b].add(a)
                remaining=set(adjacency);found=[]
                while remaining:
                    component={remaining.pop()};pending=list(component)
                    while pending:
                        for i in adjacency[pending.pop()]&remaining:remaining.remove(i);component.add(i);pending.append(i)
                    if len(component) in (20,29) and all(abs(o.data.vertices[i].co.x)<.21 and abs(o.data.vertices[i].co.y)<.18 and 1.75<o.data.vertices[i].co.z<2.19 for i in component):found.append(component)
                assert len(found)==1,'Expected exactly one old or fitted neck component.'
                neck_ids=found[0]
            vertices=[v for v in o.data.vertices if v.index not in neck_ids and not any(g.group in excluded and g.weight>0 for g in v.groups)]
            indices={v.index:i for i,v in enumerate(vertices)}
            faces=[p for p in o.data.polygons if all(i in indices for i in p.vertices)]
            result[o.name]=digest({'v':[list(v.co) for v in vertices],
                'f':[[indices[i] for i in p.vertices] for p in faces],
                'w':[[(g.group,g.weight) for g in v.groups] for v in vertices],
                'uv':[[list(uv.data[i].uv) for p in faces for i in p.loop_indices] for uv in o.data.uv_layers]})
    for im in bpy.data.images:
        if im.packed_file:result['image:'+im.name]=hashlib.sha256(bytes(im.packed_file.data)).hexdigest()
    for action in bpy.data.actions:
        curves=[]
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for c in bag.fcurves:
                        changed=(action.name=='work' and 'hand_' in c.data_path or action.name=='move' and any(n in c.data_path for n in ('upper_','fore_','hand_','fingers_','digits_','thumb_')) or action.name=='celebrate_team' and any(n in c.data_path for n in ('upper_','fore_','hand_')))
                        if not changed:curves.append((c.data_path,c.array_index,[(list(k.co),k.interpolation) for k in c.keyframe_points]))
        result['clip:'+action.name]=digest(sorted(curves))
    return result
bpy.ops.wm.open_mainfile(filepath=str(base/'revisions/r30_before_inward_palms_relaxed_arms/bert_breugelmans_v01.blend'));original=signature()
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'));current=signature()
rig=bpy.data.objects['bert_rig'];skin=bpy.data.objects['bert_skin'];cloth=bpy.data.objects['bert_clothing'];pack=bpy.data.objects['cohesion_pack']
tips={};q0s={};digit_faces={};arm_faces=[]
for side,s in [('l',-1),('r',1)]:
    q0=Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2);q0s[side]=q0
    wrist=rig.data.bones['hand_'+side].head_local
    g=skin.vertex_groups['digits_'+side].index
    ids=[v.index for v in skin.data.vertices if any(w.group==g and w.weight>.99 for w in v.groups)]
    furthest=max((q0.inverted()@(skin.data.vertices[i].co-wrist)).z for i in ids)
    tips[side]=[i for i in ids if (q0.inverted()@(skin.data.vertices[i].co-wrist)).z>furthest-.016]
    groups={skin.vertex_groups[n+'_'+side].index for n in ('fingers','digits','thumb')}
    digit_ids={v.index for v in skin.data.vertices if sum(w.weight for w in v.groups if w.group in groups)>.60}
    digit_faces[side]=[tuple(p.vertices) for p in skin.data.polygons if all(i in digit_ids for i in p.vertices)]
arm_groups={g.index for g in cloth.vertex_groups if g.name.startswith(('upper_','fore_','hand_'))}
arm_ids={v.index for v in cloth.data.vertices if any(w.group in arm_groups and w.weight>0 for w in v.groups)}
arm_faces=[tuple(p.vertices) for p in cloth.data.polygons if all(i in arm_ids for i in p.vertices)]
pack_roles=pack['palette_roles']['roles'];teal=pack_roles['teal'];attribute=pack.data.attributes['_palette_role']
pack_faces=[tuple(p.vertices) for p in pack.data.polygons if round(attribute.data[p.loop_start].value)!=teal]
clothing_faces=[tuple(p.vertices) for p in cloth.data.polygons]
results={}
for clip in ('work','move'):
    action=bpy.data.actions[clip];rig.animation_data.action=action;end=int(action.frame_range[1]);samples=[]
    minimum_inward=100;min_elbow=100;max_elbow=0;max_rotation=0;previous={};finger_cloth=[];arm_pack=[]
    for n in range(end*2+1):
        f=n/2;bpy.context.scene.frame_set(int(f),subframe=f%1);bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
        se=skin.evaluated_get(dg);sm=se.to_mesh();ce=cloth.evaluated_get(dg);cm=ce.to_mesh();pe=pack.evaluated_get(dg);pm=pe.to_mesh()
        points=[v.co.copy() for v in sm.vertices];cp=[v.co.copy() for v in cm.vertices];pp=[v.co.copy() for v in pm.vertices]
        cb=BVHTree.FromPolygons(cp,clothing_faces);ab=BVHTree.FromPolygons(cp,arm_faces);pb=BVHTree.FromPolygons(pp,pack_faces)
        overlaps=len(ab.overlap(pb))
        if overlaps:arm_pack.append({'frame':f,'pairs':overlaps})
        row={'frame':f,'hands':{}}
        for side,s in [('l',-1),('r',1)]:
            h=rig.pose.bones['hand_'+side];body_q=rig.pose.bones['body'].matrix.to_quaternion()
            normal=body_q.inverted()@(h.matrix.to_quaternion()@(q0s[side]@Vector((0,-1,0))))
            inward=normal.dot(Vector((-s,0,0)));minimum_inward=min(minimum_inward,inward)
            tip=sum((points[i] for i in tips[side]),Vector())/len(tips[side])
            digit_tree=BVHTree.FromPolygons(points,digit_faces[side]);hits=len(digit_tree.overlap(cb))
            if hits:finger_cloth.append({'frame':f,'side':side,'pairs':hits})
            upper=rig.pose.bones['upper_'+side].head;e=rig.pose.bones['fore_'+side].head
            elbow=math.degrees((e-upper).angle(h.head-e));min_elbow=min(min_elbow,elbow);max_elbow=max(max_elbow,elbow)
            row['hands'][side]={'palmNormalTorsoSpace':list(normal),'inwardDot':inward,'tipRelativeToWrist':list(tip-h.head),'elbowFlexDegrees':elbow,'wrist':list(h.head)}
        if clip=='work' and f in (24,38,40,64,76,108) or clip=='move' and f%3==0:samples.append(row)
        se.to_mesh_clear();ce.to_mesh_clear();pe.to_mesh_clear()
        for p in rig.pose.bones:
            q=p.rotation_quaternion.copy()
            if p.name in previous:max_rotation=max(max_rotation,math.degrees(q.rotation_difference(previous[p.name]).angle))
            previous[p.name]=q
    results[clip]={'samples':end*2+1,'minimumInwardPalmDot':minimum_inward,'elbowFlexRangeDegrees':[min_elbow,max_elbow],
        'maximumHalfFrameRotationDegrees':max_rotation,'fingerClothingIntersections':finger_cloth,'armPackIntersections':arm_pack,'keyPoses':samples}
manifest=json.loads((base/'asset.json').read_text())
report={'revision':manifest['revision'],'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),
    'preservationScope':'All art except the requested hand and neck replacements; idle and body/leg motion unchanged.',
    'preservedOtherArtIdleAndBodyLegMotion':original==current,
    'preservationDifferences':[k for k in original if original[k]!=current.get(k)],'clips':results}
report['passed']=(original==current and all(r['minimumInwardPalmDot']>.3 and not r['fingerClothingIntersections'] and not r['armPackIntersections'] and r['maximumHalfFrameRotationDegrees']<10 for r in results.values()))
(base/'validation/work-walk-arms-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'preservationDifferences':report['preservationDifferences'],
    'clips':{name:{k:(len(v) if isinstance(v,list) and k.endswith('Intersections') else v) for k,v in r.items() if k!='keyPoses'} for name,r in results.items()},
    'workPeakTips':[row for row in results['work']['keyPoses'] if row['frame'] in (40,64)]}))
assert report['passed'],'See work-walk-arms-audit.json for contact or preservation failures.'
