import bpy,bmesh,json,hashlib
from pathlib import Path
folder=Path(__file__).resolve().parent.parent
source=folder/'copilot_octocat_2_0_lowpoly_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
head=bpy.data.objects['head_and_ears'];features=bpy.data.objects['octocat_features'];root=bpy.data.objects['root']
def group_ids(name):
    gi=features.vertex_groups[name].index
    return {v.index for v in features.data.vertices if any(g.group==gi and g.weight>.5 for g in v.groups)}
def inspect(obj,ids=None):
    ids=ids or {v.index for v in obj.data.vertices};mapping={v:i for i,v in enumerate(sorted(ids))}
    verts=[obj.data.vertices[i].co.copy() for i in sorted(ids)]
    faces=[[mapping[i] for i in p.vertices] for p in obj.data.polygons if all(i in ids for i in p.vertices)]
    temp=bpy.data.meshes.new('audit only');temp.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(temp);seen=set();components=0
    for seed in bm.verts:
        if seed in seen:continue
        components+=1;seen.add(seed);stack=[seed]
        while stack:
            v=stack.pop()
            for e in v.link_edges:
                other=e.other_vert(v)
                if other not in seen:seen.add(other);stack.append(other)
    result={'components':components,'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'degenerate_faces':sum(f.calc_area()<1e-12 for f in bm.faces)}
    bm.free();bpy.data.meshes.remove(temp);return result
parts={'head':inspect(head),'body':inspect(features,group_ids('part_body_five_tentacles')),'cups':inspect(features,group_ids('part_suction_cup_rows'))}
for n in ['head','body']:
    if parts[n]!={'components':1,'nonmanifold_edges':0,'degenerate_faces':0}:raise RuntimeError('Invalid shell '+str(parts))
if parts['cups']['components']!=25 or parts['cups']['degenerate_faces']:raise RuntimeError('Invalid cups')
if (root['appendage_count'],root['supporting_legs'],root['arms'],root['tails'])!=(5,3,2,0):raise RuntimeError('Invalid anatomy')
foot_points=[]
for name in ['leg_left','leg_right','leg_rear']:
    foot_points.append(bpy.data.objects[name+'_path'].data.splines[0].points[-12].co)
body_ids=group_ids('part_body_five_tentacles')
def region(v):return min(range(3),key=lambda i:(v.x-foot_points[i].x)**2+(v.y-foot_points[i].y)**2)
contacts={name:min(v.co.z for v in features.data.vertices if v.index in body_ids and v.co.z<.15 and region(v.co)==i) for i,name in enumerate(['left','right','rear'])}
if any(abs(z)>.002 for z in contacts.values()):raise RuntimeError('Foot not grounded')
used_images={node.image for obj in [head,features] for mat in obj.data.materials if mat and mat.use_nodes for node in mat.node_tree.nodes if node.type=='TEX_IMAGE' and node.image}
images=[{'name':img.name,'size':list(img.size),'packed':bool(img.packed_file)} for img in used_images]
if len(images)!=2 or any(not img['packed'] for img in images):raise RuntimeError('Textures not packed')
report={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'parts':parts,'contacts':contacts,'images':images,'anatomy':{'tentacles':5,'supports':3,'arms':2,'tails':0},'passed':True}
(folder/'validation/source_audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
