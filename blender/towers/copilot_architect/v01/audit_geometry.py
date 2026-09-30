"""Read-only component and topology audit of the delivered Field Architect."""
import bpy,json,hashlib
from pathlib import Path
from collections import Counter
p=Path(__file__).resolve().parent
root=p.parents[3]
manifest=json.loads((p/'asset.json').read_text())
digest=lambda q:hashlib.sha256(q.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(p/'copilot_architect_v01.blend'))
report={'revision':manifest['revision'],'sourceHash':digest(root/manifest['source']['path']),
        'exportHash':digest(root/manifest['runtime']),'meshes':[],'components':{},'images':[]}
total=Counter();all_positions=[]
for ob in bpy.context.scene.objects:
    if ob.type!='MESH':continue
    ob.data.calc_loop_triangles();zero=[];part_tri=Counter()
    memberships={v.index:{g.group for g in v.groups if g.weight>.5} for v in ob.data.vertices}
    for i,t in enumerate(ob.data.loop_triangles):
        a,b,c=[ob.data.vertices[v].co for v in t.vertices]
        common=set.intersection(*(memberships[v] for v in t.vertices))
        if (b-a).cross(c-a).length<1e-10:
            zero.append({'triangle':i,'part':[ob.vertex_groups[g].name for g in common],
                         'polygon':t.polygon_index,'vertices':[list(v) for v in [a,b,c]]})
        part_tri[ob.vertex_groups[next(iter(common))].name if len(common)==1 else 'unassigned']+=1
    for g in ob.vertex_groups:
        vs=[v.co for v in ob.data.vertices if g.index in memberships[v.index]]
        if not vs:continue
        report['components'][g.name]={'triangles':part_tri[g.name],'vertices':len(vs),
             'x':[min(v.x for v in vs),max(v.x for v in vs)],
             'height':[min(v.z for v in vs),max(v.z for v in vs)],
             'depth':[-max(v.y for v in vs),-min(v.y for v in vs)]}
    report['meshes'].append({'name':ob.name,'triangles':len(ob.data.loop_triangles),
       'sourceVertices':len(ob.data.vertices),'zeroAreaTriangles':zero,
       'unassignedTriangles':part_tri['unassigned'],'editablePartGroups':len(ob.vertex_groups)})
    total.update(part_tri);all_positions += [v.co for v in ob.data.vertices]
for im in bpy.data.images:
    if im.type=='IMAGE' and im.name=='pavilion_palette':
        report['images'].append({'name':im.name,'dimensions':list(im.size),'packed':bool(im.packed_file)})
report['totalTriangles']=sum(m['triangles'] for m in report['meshes'])
report['dimensionsXYZ']=[max(v.x for v in all_positions)-min(v.x for v in all_positions),
                        max(v.z for v in all_positions)-min(v.z for v in all_positions),
                        max(v.y for v in all_positions)-min(v.y for v in all_positions)]
report['allocation']={}
for label,prefixes in {
    'primary shell and display':['01_','02_','03_','04_'],
    'ivory fitted frame':['05_'],
    'application diagram and paths':['06_','07_','15_','16_','17_'],
    'blueprint roll cradle and glyph':['08_','09_','10_','18_'],
    'stylus dock clip and indicators':['11_','12_','13_','14_']}.items():
    report['allocation'][label]=sum(v for k,v in total.items() if any(k.startswith(a) for a in prefixes))
required=['01_faceted_core','02_continuous_face_frame','03_bowed_display','04_eye_0','04_eye_1',
          '05_stylus_drafting_frame','05_blueprint_drafting_frame','06_application_tile',
          '06_database_tile','06_service_tile','08_blueprint_spiral','08_blueprint_outer_roll',
          '09_blueprint_upper_cradle','09_blueprint_lower_cradle','10_blueprint_flap',
          '11_stylus_fitted_dock','12_graphite_tip','12_wood_cone','12_orange_shaft',
          '12_ivory_cap','13_stylus_clip','14_dock_status_0','14_dock_status_1',
          '17_service_hierarchy','18_blueprint_plan']
report['missingParts']=[x for x in required if x not in report['components']]
report['notes']=['Glyphs and eyes are intentionally single surfaces seated above their backing.',
                 'Frame thickness, spiral paper edge, rigid tools and tile bevels are real geometry.',
                 'Shell is sparse faceted geometry; smooth normals are restricted to display/frame spans.',
                 'This audit complements rendered comparison; presence/counts do not prove artistic fidelity.']
(p/'validation'/'geometry_audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['revision','totalTriangles','dimensionsXYZ','allocation','meshes','missingParts']}))
assert report['sourceHash']==manifest['delivery']['sourceHash']
assert report['exportHash']==manifest['delivery']['sha256']
assert not report['missingParts']
assert all(not m['zeroAreaTriangles'] and not m['unassignedTriangles'] for m in report['meshes'])
assert len(report['images'])==1 and report['images'][0]['packed']
