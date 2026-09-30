"""Surgical refinement from the preserved r10 source; ordinary export follows.

Retains original shell outline, six radial mouths, scale, anchors and rest pose.
The root rings are fitted against the real chassis, the face is cut into it,
and the visor/lenses are replaced with a seated manufactured assembly.
"""
import bpy, bmesh, json, math, hashlib
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
BASE = HERE / 'revisions/r10_before_attachment_face_refinement/copilot_linter_v01.blend'
DEST = HERE / 'copilot_linter_v01.blend'
AUDIT = HERE / 'validation/attachment_face_source.json'
R10_HASH = '5f0ef331dbb3943758bc0c1a4fe05ba686192073eba9fe5ac51eac57a42cc4ca'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
allowed = {R10_HASH}
if AUDIT.exists(): allowed.add(json.loads(AUDIT.read_text())['sourceHash'])
assert digest(DEST) in allowed, 'Source changed outside this refinement; inspect before editing.'
assert digest(BASE) == R10_HASH
bpy.ops.wm.open_mainfile(filepath=str(BASE))
original = bpy.data.objects['linter_agent_model']
root = bpy.data.objects['root']
materials = list(original.data.materials)
roles = ['shell', 'visor', 'edge', 'graphite', 'screen', 'lens', 'cyan', 'lens_shade']
colors = ['#D1E817', '#152635', '#49697C', '#333E48', '#031D28', '#00A8DA', '#00E6F4', '#006A92']
parts = []

def selected(group):
    index = original.vertex_groups[group].index
    return {v.index for v in original.data.vertices if any(w.group == index for w in v.groups)}

def new_mesh(name, vertices, faces, per_face_roles=None, optics=False, smooth=False):
    mesh = bpy.data.meshes.new(name + '_geometry')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for material in materials: mesh.materials.append(material)
    uv = mesh.uv_layers.new(name='PaletteUV')
    for p in mesh.polygons:
        role = per_face_roles[p.index] if isinstance(per_face_roles, list) else per_face_roles or 'graphite'
        p.material_index = int(optics)
        p.use_smooth = smooth
        for i in p.loop_indices: uv.data[i].uv = ((roles.index(role) * 4 + 2) / 32, .5)
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh); bm.free()
    obj.vertex_groups.new(name=name).add(list(range(len(vertices))), 1, 'REPLACE')
    parts.append(obj)
    return obj

def extract(name, ids):
    old_mesh = original.data
    polygons = [p for p in old_mesh.polygons if all(i in ids for i in p.vertices)]
    used = sorted({i for p in polygons for i in p.vertices})
    remap = {old: new for new, old in enumerate(used)}
    obj = new_mesh(name, [old_mesh.vertices[i].co.copy() for i in used],
                   [tuple(remap[i] for i in p.vertices) for p in polygons])
    for dst, src in zip(obj.data.polygons, polygons):
        dst.material_index = src.material_index; dst.use_smooth = src.use_smooth
        for dl, sl in zip(dst.loop_indices, src.loop_indices):
            obj.data.uv_layers.active.data[dl].uv = old_mesh.uv_layers.active.data[sl].uv
    if name.startswith('lid_dark_latch_'):
        # The old bevel collapsed opposing edges at the thin latch mid-plane.
        # Weld only coincident latch vertices, retaining its visible outline.
        bm=bmesh.new(); bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
        bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=1e-8)
        bm.to_mesh(obj.data); bm.free()
    return obj

def rounded(w, h, r, n=3):
    points = []
    for x, z, a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(n+1):
            t = math.radians(a + 90*i/n)
            points.append((x+r*math.cos(t), z+r*math.sin(t)))
    return points

def loft(name, rings, center_z, band_roles, caps=True, optics=False, smooth=False):
    count = len(rings[0][0])
    vertices = [(x,y,z+center_z) for outline,y in rings for x,z in outline]
    faces, face_roles = [], []
    for j in range(len(rings)-1):
        for i in range(count):
            faces.append((j*count+i, j*count+(i+1)%count, (j+1)*count+(i+1)%count, (j+1)*count+i))
            face_roles.append(band_roles[j])
    if caps == 'ring':
        for i in range(count):
            faces.append(((len(rings)-1)*count+i,(len(rings)-1)*count+(i+1)%count,(i+1)%count,i))
            face_roles.append(band_roles[0])
    elif caps:
        faces.extend([tuple(range(count-1,-1,-1)), tuple((len(rings)-1)*count+i for i in range(count))])
        face_roles.extend([band_roles[0], band_roles[-1]])
    return new_mesh(name, vertices, faces, face_roles, optics, smooth)

# Fit rear housing loops to the real octagonal chassis at every root vertex.
chassis = extract('sculpted_octagonal_chassis', selected('sculpted_octagonal_chassis'))
bpy.context.view_layer.update()
mounts = []
unchanged_mouths = {}
for i in range(6):
    azimuth = math.radians(30+60*i)
    normal = Vector((math.sin(azimuth), -math.cos(azimuth), 0))
    tangent = Vector((math.cos(azimuth), math.sin(azimuth), 0))
    ids = sorted(selected('lime_rule_socket_' + str(i)))
    zc = sum(original.data.vertices[j].co.z for j in ids) / len(ids)
    rear_radius = min(original.data.vertices[j].co.dot(normal) for j in ids)
    roots = [j for j in ids if abs(original.data.vertices[j].co.dot(normal)-rear_radius) < 1e-5]
    assert len(roots) == 16
    fits = []
    for j in roots:
        point = original.data.vertices[j].co.copy()
        tangent_pos = point.dot(tangent) * .78
        z = zc + (point.z-zc) * .82
        start = tangent * tangent_pos + normal * 2 + Vector((0,0,z))
        hit, location, _, _ = chassis.ray_cast(start, -normal, distance=4)
        assert hit, ('No chassis seat', i, j)
        original.data.vertices[j].co = location - normal * .035
        fits.append({'surface':list(location), 'root':list(original.data.vertices[j].co), 'embedDepth':.035})
    mouths = selected('rule_port_' + str(i))
    unchanged_mouths[str(i)] = [list(original.data.vertices[j].co) for j in sorted(mouths)]
    mounts.append({'pod': i+1, 'azimuth': 30+60*i, 'fittedRootVertices': fits})

# The original little face panel was inside solid body skin. Cut a real well.
cutter = loft('face_cavity_cutter', [
    (rounded(.75,.47,.10),-1.20),
    (rounded(.67,.40,.075),-.917),
    (rounded(.57,.31,.065),-.852),
], .352, ['edge','edge'])
tag = bpy.data.materials.new('temporary_cavity_surface')
chassis.data.materials.append(tag); cutter.data.materials.append(tag)
for p in cutter.data.polygons: p.material_index = 2
bpy.context.view_layer.objects.active = chassis
modifier = chassis.modifiers.new('True recessed face well', 'BOOLEAN')
modifier.operation = 'DIFFERENCE'; modifier.solver = 'EXACT'; modifier.object = cutter
bpy.ops.object.modifier_apply(modifier=modifier.name)
parts.remove(cutter); bpy.data.objects.remove(cutter, do_unlink=True)
cavity_faces = []
for p in chassis.data.polygons:
    if p.material_index != 2: continue
    back = all(abs(chassis.data.vertices[j].co.y + .852) < 1e-4 for j in p.vertices)
    role = 'screen' if back else 'edge'
    p.material_index = 0; p.use_smooth = False
    for li in p.loop_indices: chassis.data.uv_layers.active.data[li].uv = ((roles.index(role)*4+2)/32,.5)
    cavity_faces.append({'back':back, 'vertices':len(p.vertices)})
assert cavity_faces and any(p['back'] for p in cavity_faces)
chassis.data.materials.pop(index=2)
chassis.vertex_groups.clear()
chassis.vertex_groups.new(name='sculpted_octagonal_chassis').add(list(range(len(chassis.data.vertices))),1,'REPLACE')

drop = ('sculpted_octagonal_chassis','continuous_visor','recessed_rule_lens','face_display','display_eye')
for group in original.vertex_groups:
    if any(group.name.startswith(prefix) for prefix in drop): continue
    extract(group.name, selected(group.name))

# A dark continuous outer frame, restrained bevel highlight and recessed tray.
loft('continuous_visor', [
    (rounded(1.65,.33,.085),-.910),
    (rounded(1.70,.37,.100),-1.067),
    (rounded(1.65,.32,.082),-1.110),
    (rounded(1.604,.276,.066),-1.110),
    (rounded(1.59,.262,.059),-1.082),
], .752, ['visor','visor','edge','visor'], smooth=False)

# Shallow convex lenses inside matching angular sockets, using the optics material.
outline = [(.12,.055),(.66,.105),(.69,.005),(.60,-.075),(.19,-.12)]
for s in (-1,1):
    points = [(s*x,z) for x,z in outline]
    cx, cz = [sum(p[j] for p in points)/len(points) for j in range(2)]
    def scale(k): return [(cx+(x-cx)*k,cz+(z-cz)*k) for x,z in points]
    name = 'visor_lens_' + ('left' if s<0 else 'right')
    loft(name+'_seat', [(scale(1.07),-1.078),(scale(1.07),-1.101),
                      (scale(.94),-1.105),(scale(.94),-1.086)], .752,
         ['visor','edge','visor'], caps='ring')
    rings = [(scale(.94),-1.088),(scale(.72),-1.119),(scale(.34),-1.126)]
    vertices = [(x,y,z+.752) for points2,y in rings for x,z in points2]
    vertices.append((cx,-1.128,cz+.752))
    faces = [tuple(range(4,-1,-1))]; face_roles = ['lens_shade']
    for j in range(2):
        for i in range(5):
            faces.append((j*5+i,j*5+(i+1)%5,(j+1)*5+(i+1)%5,(j+1)*5+i))
            # Lower edge is a restrained deeper blue; main lens stays saturated cyan.
            face_roles.append('lens_shade' if j==0 and (points[i][1]+points[(i+1)%5][1])/2 < -.07 else 'lens')
    for i in range(5):
        faces.append((10+i,10+(i+1)%5,15)); face_roles.append('lens')
    new_mesh(name+'_glass',vertices,faces,face_roles,optics=True,smooth=True)

# Put the two status marks on the back of the face well, no longer on body skin.
for i,x in enumerate((-.13,.13)):
    points = [(px+x,pz) for px,pz in rounded(.074,.164,.036)]
    loft('recessed_face_indicator_'+str(i),[(points,-.851),(points,-.861)],.352,
         ['cyan'],optics=True,smooth=False)

# Retain one editable mesh and the existing two-material runtime interface.
bpy.ops.object.select_all(action='DESELECT')
for obj in parts: obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
model = parts[0]
bpy.data.objects.remove(original,do_unlink=True)
model.name = 'linter_agent_model'; model.data.name = 'linter_agent_refined_geometry'; model.parent = root
bm=bmesh.new(); bm.from_mesh(model.data)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
degenerate = [f for f in bm.faces if f.calc_area()<1e-10]
assert not degenerate, 'Degenerate faces: ' + str([[tuple(v.co) for v in f.verts] for f in degenerate])
nonmanifold = [e for e in bm.edges if not e.is_manifold]
bm.to_mesh(model.data); bm.free()
model.data.set_sharp_from_angle(angle=math.radians(55))
model.data.calc_loop_triangles()
assert len(model.data.loop_triangles) <= 4000
for i in range(6):
    group = model.vertex_groups['rule_port_'+str(i)]
    actual = [list(v.co) for v in model.data.vertices if any(g.group==group.index for g in v.groups)]
    assert actual == unchanged_mouths[str(i)], 'A shooter mouth moved'

image = bpy.data.images['linter_agent_palette']
pixels=[]
for y in range(4):
    for x in range(32):
        c=colors[x//4].lstrip('#')
        pixels += [int(c[i:i+2],16)/255 for i in (0,2,4)] + [1]
image.pixels = pixels; image.pack()
optics = materials[1].node_tree.nodes.get('Principled BSDF')
optics.inputs['Roughness'].default_value = .28
optics.inputs['Specular IOR Level'].default_value = .14
optics.inputs['Coat Weight'].default_value = .04
optics.inputs['Coat Roughness'].default_value = .24
optics.inputs['Emission Strength'].default_value = .12
root['design'] = 'Six-shooter refinement: chassis-fitted pods, true recessed face, dark framed convex cyan visor'
root['reference_sha256'] = 'acd510f7ecf0d4cef8d4789de9a1001496e326ef175faf7a5041f168243d1c98'
root['refinement'] = 'User feedback 2026-09-24: floating pods, buried face panel and pale visor corrected'
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(DEST))
report={'sourceHash':digest(DEST),'baseHash':R10_HASH,'triangles':len(model.data.loop_triangles),
        'unchangedShooterMouths':True,'rootSeats':mounts,'cavityFaces':cavity_faces,
        'nonManifoldEdges':len(nonmanifold),'roles':dict(zip(roles,colors)),
        'faceBackY':-.852,'faceIndicatorFrontY':-.861}
AUDIT.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('rootSeats','cavityFaces')},indent=2))
