"""Octocat source authoring. Common geometry recipe for the two distinct silhouettes.

Run in factory-startup background Blender. Canonical output on first authoring;
guarded rebuilds redirect output through ASSET_BUILD_DIR.
"""
import bpy, math, os, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

STYLE = globals().get('OCTOCAT_STYLE', 'modern')
MODERN = STYLE == 'modern'
ROOT_DIR = Path(__file__).resolve().parents[4]
FOLDER = ROOT_DIR / 'blender' / 'towers' / ('github_octocat_' + STYLE) / 'v01'
OUT = Path(os.environ.get('ASSET_BUILD_DIR', str(FOLDER)))
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
root = bpy.data.objects.new('root', None)
scene.collection.objects.link(root)
parts = []
roles = ['fur','face','eyes','iris','suckers','inner_ear','smile','highlight']
colors = ['252A31','F6C3AA','F3F9F6','A85444','9FD5D1','343C45','8E4C40','FFFFFF']
image = bpy.data.images.new('octocat_palette_32x4', width=32, height=4, alpha=False)
pixels = []
for y in range(4):
    for x in range(32):
        c = colors[x//4]
        pixels += [int(c[i:i+2],16)/255 for i in (0,2,4)] + [1]
image.pixels[:] = pixels
image.file_format = 'PNG'
image.pack()
mat = bpy.data.materials.new('octocat_palette')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .82
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = image
tex.interpolation = 'Closest'
mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])

def finish(obj, name, role, smooth=False):
    obj.name = name
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='PaletteUV')
    uv.name = 'PaletteUV'
    for item in uv.data: item.uv = ((roles.index(role)*4+2)/32, .5)
    for poly in obj.data.polygons: poly.use_smooth = smooth
    group = obj.vertex_groups.new(name=name)
    group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    obj.parent = root
    parts.append(obj)
    return obj

def mesh(name, verts, faces, role='fur', smooth=False):
    data=bpy.data.meshes.new(name)
    data.from_pydata(verts,[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    # Consistent outward winding, including concave outlines.
    import bmesh
    bm=bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    return finish(obj,name,role,smooth)

def ellipsoid(name, loc, scale, role='fur', segments=12, rings=6, smooth=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc)
    obj=bpy.context.object
    obj.scale=scale
    return finish(obj,name,role,smooth)

def tube(name, points, radii, role='fur', sides=8, smooth=False):
    pts=[Vector(p) for p in points]; verts=[]; faces=[]
    for i,p in enumerate(pts):
        tangent=(pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized()
        axis=Vector((0,1,0))
        if abs(tangent.dot(axis))>.95: axis=Vector((1,0,0))
        u=tangent.cross(axis).normalized(); v=tangent.cross(u).normalized()
        for j in range(sides):
            a=j*math.tau/sides
            verts.append(tuple(p+radii[i]*(u*math.cos(a)+v*math.sin(a))))
    for i in range(len(pts)-1):
        for j in range(sides):
            a=i*sides+j; b=i*sides+(j+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces += [tuple(reversed(range(sides))), tuple((len(pts)-1)*sides+j for j in range(sides))]
    return mesh(name,verts,faces,role,smooth)

def anchor(name, xyz, note):
    obj=bpy.data.objects.new(name,None)
    scene.collection.objects.link(obj)
    obj.parent=root; obj.location=xyz
    obj['attachment_notes']=note
    return obj

# A single continuous cat shell includes ear roots. Rings round its thickness.
cz=2.29 if MODERN else 1.93
wx=.94 if MODERN else 1.11
hz=.72 if MODERN else .65
outline=[(-.94,-.34),(-1,-.05),(-.97,.33),(-.88,.62),(-.84,1.12),(-.69,1.34),(-.51,1.18),(-.29,.91),(0,.98),(.29,.91),(.51,1.18),(.69,1.34),(.84,1.12),(.88,.62),(.97,.33),(1,-.05),(.94,-.34),(.79,-.65),(.48,-.84),(0,-.9),(-.48,-.84),(-.79,-.65)]
verts=[]; faces=[]; n=len(outline)
for k,(scale,y) in enumerate([(.0,-.52),(.46,-.49),(.76,-.38),(1,-.06),(.9,.27),(.6,.43),(.0,.48)]):
    for x,z in outline:
        xx=x*wx*scale; zz=cz+z*hz*scale
        yy=-.52+.25*(xx/wx)**2+.14*((zz-cz)/hz)**2 if k<4 else y
        verts.append((xx,yy,zz))
for k in range(6):
    for j in range(n): faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
head=mesh('head_shell',verts,faces)
bvh=BVHTree.FromPolygons([v.co for v in head.data.vertices],[list(p.vertices) for p in head.data.polygons])
def surface(x,z,offset=.016):
    return -.52+.25*(x/wx)**2+.14*((z-cz)/hz)**2-offset-.028

# Skin is a flush conforming inlay, with a buried rim around its perimeter.
if MODERN:
    face=[(-.82,-.32),(-.84,-.07),(-.78,.25),(-.64,.46),(-.42,.51),(-.18,.43),(0,.32),(.2,.37),(.48,.59),(.66,.6),(.78,.44),(.84,.12),(.82,-.22),(.88,-.38),(.81,-.57),(.6,-.73),(.3,-.81),(0,-.84),(-.34,-.8),(-.65,-.66),(-.84,-.5)]
else:
    face=[(math.cos(a)*.86,math.sin(a)*.63-.10) for a in [j*math.tau/28 for j in range(28)]]
vs=[]; fs=[]; n=len(face)
for r in [0,.35,.7,1]:
    for x,z in face:
        xx=x*wx*r; zz=cz+z*hz*r
        vs.append((xx,surface(xx,zz),zz))
for k in range(3):
    for j in range(n): fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
for x,z in face:
    xx=x*wx; zz=cz+z*hz
    vs.append((xx,surface(xx,zz)+.04,zz))
for j in range(n): fs.append((3*n+j,3*n+(j+1)%n,4*n+(j+1)%n,4*n+j))
mesh('face_inlay',vs,fs,'face')

for side in [-1,1]:
    # Small ear inlays sit inside the actual tapered ear geometry.
    coords=[(side*wx*.59,cz+hz*.97),(side*wx*.70,cz+hz*1.2),(side*wx*.78,cz+hz*.77)]
    mesh(('left' if side<0 else 'right')+'_ear_inlay',[(x,surface(x,z,.02),z) for x,z in coords],[(0,1,2)],'inner_ear')
    ex=side*(.37 if MODERN else .51)
    ez=cz+(.025 if MODERN else -.03)
    ey=surface(ex,ez,.06)
    ellipsoid('eye_white_'+str(side),(ex,ey,ez),(.16,.055,.25),'eyes',12,6,True)
    ellipsoid('eye_iris_'+str(side),(ex+(.012 if MODERN else 0),ey-.047,ez-(.044 if MODERN else 0)),(.104,.031,.177),'iris',12,6,True)
    if MODERN:
        ellipsoid('eye_glint_'+str(side),(ex+.027,ey-.076,ez+.079),(.03,.012,.054),'highlight',8,4,True)
    for j in range(2):
        if MODERN:
            x=side*.79; z=cz-.33-j*.12
            tube('whisker_'+str(side)+'_'+str(j),[(x,-.14,z),(side*1.02,-.12,z+.07-j*.04),(side*1.20,-.09,z+.09-j*.06)],[.025,.023,.006],sides=5)

nosez=cz-(.30 if MODERN else .23)
ellipsoid('nose',(0,surface(0,nosez,.039),nosez),(.066,.025,.045),'smile',10,5,True)
smile=[]
width=.31 if MODERN else .13
for j in range(9):
    t=j/8; x=width*(2*t-1); z=nosez-.10-(.10 if MODERN else .08)*math.sin(math.pi*t)
    smile.append((x,surface(x,z,.033),z))
tube('smile',smile,[.012 if MODERN else .018]*9,'smile',5,True)

if MODERN:
    ellipsoid('torso',(0,.025,.93),(.31,.25,.79),segments=12,rings=7)
    # Three planted lower tentacles, two articulated-looking upper tentacles.
    for i,(x,y) in enumerate([(-.24,-.2),(.23,-.25),(.30,.23)]):
        sign=-1 if x<0 else 1
        tube('foot_tentacle_'+str(i),[(x*.3,y*.3,.70),(x,y,.39),(x*1.45,y-.05,.19),(x*1.8,y-.16,.10),(x*2.12,y-.15,.17)],[.13,.19,.19,.10,.025],sides=8)
    left=[(-.08,0,1.4),(-.47,-.015,1.23),(-.78,-.05,.99),(-.80,-.16,.83),(-.61,-.30,.74),(-.43,-.38,.82),(-.48,-.39,.95)]
    right=[(.08,0,1.4),(.47,-.01,1.27),(.76,-.07,1.16),(.97,-.09,1.34),(1.07,-.13,1.66),(1.20,-.18,1.76),(1.36,-.23,1.64)]
    tube('arm_left',left,[.10,.13,.13,.14,.16,.14,.065])
    tube('arm_right',right,[.10,.13,.14,.15,.19,.19,.045])
    for i in range(2,6):
        p=Vector(right[i]); p.y-=([.14,.15,.19,.19][i-2])*.94
        ellipsoid('sucker_'+str(i),p,(.078,.018,.055),'suckers',8,4)
    handleft=left[-2]; handright=right[-2]
else:
    ellipsoid('torso',(0,.05,.90),(.39,.29,.50),segments=12,rings=6)
    for i,(x,y) in enumerate([(-.29,-.14),(-.10,-.33),(.13,-.33),(.32,.05)]):
        sign=-1 if x<0 else 1
        tube('foot_tentacle_'+str(i),[(x*.6,y*.5,.87),(x*1.08,y,.47),(x*1.35,y-.04,.22),(x*1.9,y-.15,.105),(x*2.45,y-.13,.12)],[.11,.14,.14,.105,.025],sides=8)
    left=[(-.27,.04,.94),(-.53,.01,.77),(-.83,-.04,.78),(-1.06,-.10,.96),(-1.18,-.13,1.18),(-1.26,-.13,1.23)]
    tube('curl_tentacle',left,[.13,.14,.13,.105,.07,.015])
    for i in range(1,5):
        p=Vector(left[i]); p.y-=.125 if i<3 else .082
        ellipsoid('sucker_'+str(i),p,(.049,.018,.034),'suckers',8,4)
    handleft=left[-2]; handright=(.36,-.05,.80)

# Normalize actual mesh contact to z=0, preserving origin and authored proportions.
floor=min(v.co.z for obj in parts for v in obj.data.vertices)
for obj in parts:
    for v in obj.data.vertices: v.co.z-=floor
height=max(v.co.z for obj in parts for v in obj.data.vertices)
anchor('anchor_ui',(0,0,height+.22),'Nameplate above ear tips')
anchor('anchor_target',(0,0,cz-.35-floor),'Visual target')
anchor('anchor_action',(handright[0],handright[1]-.12,handright[2]-floor),'Visual action origin')
anchor('anchor_hat',(0,0,cz+hz*.98-floor),'Crown seat; ears extend above and to either side. Use ear cutouts or a narrow crown.')
anchor('anchor_face',(0,surface(0,cz,.12),cz-floor),'Glasses bridge; adapt frame width per style')
anchor('anchor_chest',(0,-.27,(1.20 if MODERN else 1.04)-floor),'Garment fitting origin; shell must leave arm roots and hem open')
anchor('anchor_back',(0,.29,(1.20 if MODERN else 1.04)-floor),'Backpack mounting surface')
anchor('anchor_hand_left',(handleft[0],handleft[1],handleft[2]-floor),'Left prop grip')
anchor('anchor_hand_right',(handright[0],handright[1],handright[2]-floor),'Right prop grip')

# Two render meshes, preserving semantic groups for later rigging/fitting.
head_parts=[o for o in parts if not any(w in o.name for w in ['torso','tentacle','arm_','sucker'])]
for group,name in [(head_parts,'octocat_head'),([o for o in parts if o not in head_parts],'octocat_body')]:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in group: obj.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join()
    obj=bpy.context.object; obj.name=name
    scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
root['style']=STYLE
root['accessory_contract']='octocat_attachment_slots_v01'
root['production_status']='Static base; attachment empties are provided, no wardrobe geometry or rig yet.'
bpy.context.view_layer.update()
stats={'style':STYLE,'height':height,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in root.children if o.type=='MESH'),'anchors':{o.name:[round(c,4) for c in (o.location.x,o.location.z,-o.location.y)] for o in root.children if o.type=='EMPTY'}}
(OUT/'authoring_stats.json').write_text(json.dumps(stats,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','github_octocat_'+STYLE+'_v01.blend')))
print(json.dumps(stats))
