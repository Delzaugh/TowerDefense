"""Campus Visitor – Man. Original static environment character from the supplied views.

Blender Z is up and -Y is forward. The saved root/mesh are identity transforms;
glTF conversion gives +Y up / +Z forward. Set VISITOR_BLOCKOUT=1 for primary
volume review. The recipe writes only to ASSET_BUILD_DIR.
"""
import math
import os
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'towers' / '_shared'))
from persona_quality import Maker

bpy.ops.wm.read_factory_settings(use_empty=True)
a = Maker({'id': 'campus_visitor_man'})
DETAIL = os.environ.get('VISITOR_BLOCKOUT') != '1'

# Eight small swatches, with variations on cloth and skin held back for shape.
COLORS = {
    'skin': '#F4BF89',
    'skin_shadow': '#9F6E50',
    'hair': '#373238',
    'hair_light': '#494047',
    'olive': '#668055',
    'olive_light': '#778F62',
    'olive_shadow': '#4E6745',
    'cream': '#F5EAD5',
    'navy': '#293B59',
    'navy_light': '#344866',
    'brick': '#AF6255',
    'brick_shadow': '#925047',
    'sole': '#FFF1DA',
    'ink': '#241F24',
    'eye_white': '#FFF9EE',
    'button': '#D6D4B9',
}


def signed_power(v, p):
    return math.copysign(abs(v) ** p, v)


def z_loft(name, sections, role, n=12, squareness=2.25, smooth=False):
    """Sections are (x,y,z,rx,ry) in metres; distinct rings control contours."""
    verts = []
    for x, y, z, rx, ry in sections:
        for i in range(n):
            t = math.tau * i / n
            verts.append((x + rx*signed_power(math.cos(t), 2/squareness),
                          y + ry*signed_power(math.sin(t), 2/squareness), z))
    faces = [tuple(reversed(range(n)))]
    for j in range(len(sections)-1):
        faces += [(j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i)
                  for i in range(n)]
    faces.append(tuple((len(sections)-1)*n+i for i in range(n)))
    a.add(name, verts, faces, role, smooth)


def ellipsoid(name, center, radii, role, segments=12, rings=8, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings,
                                         location=center)
    obj = bpy.context.object
    obj.scale = radii
    a.collect(obj, name, role, smooth)


def tube(name, points, radii, role, sides=9, smooth=False):
    path = [Vector(p) for p in points]
    verts = []
    for j, c in enumerate(path):
        tangent = (path[min(j+1,len(path)-1)] - path[max(0,j-1)]).normalized()
        right = tangent.cross(Vector((0,1,0))).normalized()
        front = tangent.cross(right).normalized()
        for i in range(sides):
            t = math.tau*i/sides
            verts.append(tuple(c + radii[j]*(math.cos(t)*right+math.sin(t)*front)))
    faces = [tuple(reversed(range(sides)))]
    for j in range(len(points)-1):
        faces += [(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,
                   (j+1)*sides+i) for i in range(sides)]
    faces.append(tuple((len(points)-1)*sides+i for i in range(sides)))
    a.add(name, verts, faces, role, smooth)


def closed_outline(name, outline, y0, y1, role):
    """A slim extruded face contour in the XZ plane."""
    n = len(outline)
    verts = [(x,y,z) for y in (y0,y1) for x,z in outline]
    faces = [tuple(reversed(range(n))), tuple(n+i for i in range(n))]
    faces += [(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
    a.add(name, verts, faces, role)


def surface_lace(name, upper_name, x_center, y_center):
    """Conform a triangulated lace ribbon to the shoe upper's actual triangles."""
    start,count=next((start,count) for part,start,count in a.parts if part==upper_name)
    vertices=[Vector(v) for v in a.v[start:start+count]]
    polygons=[tuple(k-start for k in face) for face in a.f
              if all(start <= k < start+count for k in face)]
    surface=BVHTree.FromPolygons(vertices,polygons,all_triangles=False)
    lace_vertices=[]
    columns=6
    rows=3
    for j in range(rows):
        y=y_center+(-.011+.022*j/(rows-1))
        for i in range(columns):
            x=x_center+(-.055+.110*i/(columns-1))
            hit,normal,face,distance=surface.ray_cast(Vector((x,y,1.0)),
                                                       Vector((0,0,-1)))
            if hit is None:
                raise RuntimeError(f'Lace vertex missed shoe upper: {name} {x} {y}')
            lace_vertices.append((x,y,hit.z+.002))
    lace_faces=[]
    for j in range(rows-1):
        for i in range(columns-1):
            k=j*columns+i
            lace_faces.extend(((k,k+1,k+columns+1),
                               (k,k+columns+1,k+columns)))
    a.add(name,lace_vertices,lace_faces,'sole')


# Landmarks: soles 0–.105, trouser hems .13, crotch .82, jacket hem .86,
# shoulders 1.28, chin 1.37, eyes 1.56, crown 1.80. Body height: 1.80 m.
# The shoe width and slightly separated straight legs remain readable from above.
for sign, side in [(-1,'left'), (1,'right')]:
    x = sign*.165
    a.box('cream_sneaker_sole_'+side, (x,-.085,.037),
          (.282,.420,.074), 'sole', .034, 2)
    z_loft('brick_sneaker_upper_'+side,
           [(x,-.082,.068,.129,.202), (x,-.070,.105,.132,.194),
            (x,-.020,.164,.105,.124)], 'brick', 10, 2.1)
    if DETAIL:
        # Two broad strips match the reference and remain seated on the sloping
        # upper all the way across, including the faceted side shoulders.
        for index,y in enumerate((-.202,-.139)):
            surface_lace('white_lace_'+side+'_'+str(index),
                         'brick_sneaker_upper_'+side,x,y)
        a.box('sole_rim_'+side,(x,-.091,.063),(.272,.405,.018),
              'sole',.007,1)
    z_loft('straight_trouser_'+side,
           [(x,.012,.145,.106,.112), (x,.015,.220,.110,.118),
            (x,.020,.405,.107,.113), (sign*.156,.018,.685,.113,.116),
            (sign*.151,.018,.905,.121,.122)],
           'navy', 10, 2.30)
    if DETAIL:
        z_loft('turned_trouser_hem_'+side,
               [(x,.013,.164,.110,.114), (x,.013,.196,.111,.116)],
               'navy_light',10,2.3)

z_loft('trouser_waist',[(0,.015,.813,.247,.130),(0,.017,.885,.278,.130),
                        (0,.014,.935,.267,.120)],'navy',12,2.5)

# The tee sits under the separated overshirt fronts. Its curved neckline is
# mostly concealed by the neck; the pale center remains a strong color landmark.
z_loft('cream_tee',[(0,.005,.889,.150,.150),(0,.001,1.04,.150,.148),
                     (0,.007,1.225,.132,.125),(0,.012,1.270,.091,.090),
                     (0,.017,1.286,.068,.068)],'cream',14,2.0)
z_loft('neck',[(0,.003,1.292,.079,.080),(0,.006,1.415,.081,.079)],
       'skin',10,2.0,True)

# A shaped U shell supplies one continuous back/side cloth with a true open
# front. Each vertical section is tuned independently to avoid a barrel torso.
angles = [-1.33,-1.17,-1.02,-.82,-.58,-.30,0,.31,.62,.94,1.25,1.57,
          1.89,2.20,2.51,2.82,3.14,3.45,3.76,4.06,4.30,4.46]
sections = [(.872,.261,.184),(.904,.276,.190),(1.04,.272,.193),
            (1.20,.281,.190),(1.278,.270,.177),(1.311,.203,.139)]
verts=[]
for inner in (False,True):
    for z,rx,ry in sections:
        for t in angles:
            scale = .948 if inner else 1.0
            verts.append((rx*scale*math.cos(t),.018+ry*scale*math.sin(t),z))
n=len(angles); layer=n*len(sections);faces=[];roles=[]
for shell in range(2):
    for j in range(len(sections)-1):
        for i in range(n-1):
            k=shell*layer+j*n+i
            faces.append((k,k+1,k+1+n,k+n))
            roles.append('olive' if shell==0 else 'olive_shadow')
for j in range(len(sections)-1):
    for i in (0,n-1):
        k=j*n+i
        faces.append((k,k+n,k+n+layer,k+layer));roles.append('olive_shadow')
for j in (0,len(sections)-1):
    for i in range(n-1):
        k=j*n+i
        faces.append((k,k+layer,k+1+layer,k+1));roles.append('olive_shadow')
a.add('open_olive_overshirt',verts,faces,roles)

# A low collar arc closes the visible back of the neckline without sealing the
# front opening or hiding the short exposed neck.
collar_v=[];collar_n=10
for inner in (False,True):
    for z in (1.295,1.325):
        for i in range(collar_n):
            t=math.pi*i/(collar_n-1)
            rx,ry=(.166,.123) if not inner else (.095,.075)
            collar_v.append((rx*math.cos(t),.018+ry*math.sin(t),z))
collar_f=[]
ring_order=(0,1,3,2)
for layer in range(4):
    for i in range(collar_n-1):
        current=ring_order[layer];nxt=ring_order[(layer+1)%4]
        collar_f.append((current*collar_n+i,current*collar_n+i+1,
                         nxt*collar_n+i+1,nxt*collar_n+i))
a.add('continuous_rear_collar',collar_v,collar_f,'olive_shadow')

# Collar is fitted over the neckline and has two pointed, folded front leaves.
for sign,side in [(-1,'left'),(1,'right')]:
    # A fitted four-corner leaf: its upper edge shares the shoulder/neck rim,
    # while its point lies on the garment's front contour.
    leaf=[(sign*.050,-.119,1.314),(sign*.165,-.066,1.314),
          (sign*.171,-.108,1.268),(sign*.119,-.166,1.272)]
    leaf_inner=[(x,y+.009,z-.008) for x,y,z in leaf]
    verts=leaf+leaf_inner
    faces=[(0,1,2,3),(7,6,5,4)]
    faces += [(i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4)]
    a.add('fitted_folded_collar_'+side,verts,faces,'olive_light')
    # The placket follows the shaped front edge, instead of crossing the tee.
    if DETAIL:
        for z in (.965,1.055,1.145,1.235):
            if sign == -1:
                ellipsoid('cream_button',(-.069,-.166,z),(.008,.003,.008),
                          'button',8,4)

# Jacket sleeves taper gently, with a separate turned cuff. Hands hang well
# below the jacket hem and away from the trousers, retaining a small gap.
for sign,side in [(-1,'left'),(1,'right')]:
    z_loft('olive_sleeve_'+side,
           [(sign*.300,-.018,.890,.078,.085),
            (sign*.289,-.006,.955,.086,.090),
            (sign*.274,.000,1.080,.094,.100),
            (sign*.242,.010,1.200,.102,.112),
            (sign*.203,.018,1.265,.079,.091)],
           'olive',10,2.0)
    tube('turned_cuff_'+side,
         [(sign*.301,-.018,.918),(sign*.310,-.028,.865)],
         [.082,.078],'olive_light',10)
    ellipsoid('relaxed_hand_'+side,(sign*.321,-.035,.784),
              (.062,.056,.105),'skin',10,6)
    ellipsoid('thumb_'+side,(sign*.263,-.086,.786),
              (.026,.032,.058),'skin',8,5)
    if DETAIL:
        # Short dark line yields a thumb gap at game scale, without separate digits.
        a.stroke('hand_finger_seam_'+side,
                 [(sign*.309,.744),(sign*.315,.724)],.007,
                 (0,-.094,0),'skin_shadow',depth=.004)

# Broad cheeks and a defined chin. The side depth is as significant as the
# front outline; the face is allowed to project ahead of the ears and collar.
z_loft('warm_face',[(0,-.012,1.370,.077,.086),
                    (0,-.014,1.395,.126,.133),
                    (0,-.005,1.459,.191,.177),
                    (0,.000,1.579,.214,.190),
                    (0,.006,1.661,.196,.182),
                    (0,.017,1.722,.135,.143)],
       'skin',16,2.0,True)
for sign,side in [(-1,'left'),(1,'right')]:
    ellipsoid('ear_'+side,(sign*.211,.005,1.535),
              (.052,.064,.078),'skin',10,6)
    if DETAIL:
        ellipsoid('ear_inner_'+side,(sign*.250,-.019,1.531),
                  (.009,.034,.038),'skin_shadow',8,4)

# Hair grows from a swept, uneven hairline into an asymmetric faceted crown.
# Separate broad clumps are embedded in the cap so they read as large locks.
hair_n=16
hair_v=[]
for j in range(5):
    for i in range(hair_n):
        t=math.tau*i/hair_n
        front=max(0,-math.sin(t))
        rear=max(0,math.sin(t))
        front_plateau=min(1,front/.45)
        if j==0:
            rx,ry,z=.217,.190,1.560+.126*front_plateau-.132*rear+.007*math.cos(3*t)
        elif j==1:rx,ry,z=.236,.214,1.585+.139*front_plateau+.005*math.cos(t)
        elif j==2:rx,ry,z=.230,.209,1.711+.025*front_plateau
        elif j==3:rx,ry,z=.192,.185,1.766+.015*math.cos(t)
        else:rx,ry,z=.101,.112,1.807+.006*math.cos(t)
        waviness=1+.045*math.sin(3*t+.6)+.025*math.cos(5*t)
        hair_v.append((rx*waviness*math.cos(t)+.004*j,
                       .018+ry*waviness*math.sin(t),z))
hair_f=[];hair_roles=[]
for j in range(4):
    hair_f += [(j*hair_n+i,j*hair_n+(i+1)%hair_n,
                (j+1)*hair_n+(i+1)%hair_n,(j+1)*hair_n+i)
               for i in range(hair_n)]
    for i in range(hair_n):
        hair_roles.append('hair_light' if (j in (2,3) and i in (2,3,11,12,13)) else 'hair')
# Close only the lower edge with a narrow underside rim tucked inside the head.
# This avoids a nonplanar face cap and seals the tiny temple silhouette crack.
inner_start=len(hair_v)
for i in range(hair_n):
    x,y,z=hair_v[i]
    hair_v.append((x*.75,.018+(y-.018)*.75,z+.002))
for i in range(hair_n):
    hair_f.append((i,inner_start+i,inner_start+(i+1)%hair_n,(i+1)%hair_n))
    hair_roles.append('hair')
hair_f.append(tuple(4*hair_n+i for i in range(hair_n)))
hair_roles.append('hair')
a.add('dark_hair_mass',hair_v,hair_f,hair_roles)
if DETAIL:
    # Three shallow swept locks overlap the cap by most of their volume; the
    # unified hair surface remains the silhouette rather than a separate visor.
    for name,center,radii in [
        ('left_swept_lock',(-.139,-.143,1.752),(.078,.045,.047)),
        ('center_swept_lock',(-.019,-.151,1.766),(.091,.050,.047)),
        ('right_swept_lock',(.115,-.146,1.751),(.076,.046,.046))]:
        ellipsoid(name,center,radii,'hair',10,5,False)

    # Friendly features are slightly oversized for the elevated game camera.
    for sign,side in [(-1,'left'),(1,'right')]:
        ellipsoid('eye_white_'+side,(sign*.092,-.169,1.573),
                  (.048,.017,.052),'eye_white',12,6)
        ellipsoid('dark_pupil_'+side,(sign*.094,-.185,1.570),
                  (.024,.008,.032),'ink',10,5)
        ellipsoid('eye_spark_'+side,(sign*.087,-.194,1.585),
                  (.009,.003,.010),'eye_white',8,4)
        a.stroke('brow_'+side,[(sign*.050,1.643),(sign*.093,1.657),
                               (sign*.134,1.646)],.016,
                 (0,-.188,0),'hair',depth=.006)
    ellipsoid('small_nose',(0,-.195,1.501),(.027,.026,.028),'skin',10,5)
    # Follow the face curvature in depth, especially at the two smile corners.
    smile=[(-.061,-.155,1.443),(-.028,-.167,1.430),
           (.015,-.168,1.430),(.060,-.155,1.445)]
    smile_v=[]
    for x,y,z in smile:
        smile_v.extend(((x,y-.002,z-.004),(x,y-.002,z+.004)))
    smile_f=[(2*i,2*i+2,2*i+3,2*i+1) for i in range(len(smile)-1)]
    a.add('seated_gentle_smile',smile_v,smile_f,'skin_shadow')

# Merge the authored parts into one mesh and one packed semantic palette.
roles = list(COLORS)
width,height = 32,8
image = bpy.data.images.new('campus_visitor_man_palette',width=width,height=height,
                            alpha=True)
pixels=[]
for y in range(height):
    for x in range(width):
        role = roles[min(((height-1-y)//2)*8+x//4,len(roles)-1)]
        c = COLORS[role].lstrip('#')
        pixels.extend([int(c[k:k+2],16)/255 for k in (0,2,4)]+[1])
image.pixels = pixels
image.pack()
mat = bpy.data.materials.new('campus_visitor_palette')
mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.85
bs.inputs['Specular IOR Level'].default_value=.22
tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=image
tex.interpolation='Closest'
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
mesh=bpy.data.meshes.new('campus_visitor_geometry')
mesh.from_pydata(a.v,[],a.f)
mesh.update()
mesh.materials.append(mat)
uv=mesh.uv_layers.new(name='PaletteUV')
for poly,role,smooth in zip(mesh.polygons,a.r,a.s):
    idx=roles.index(role)
    poly.use_smooth=smooth
    for li in poly.loop_indices:
        uv.data[li].uv=((idx%8*4+2)/width,1-(idx//8*2+1)/height)
bm=bmesh.new();bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('campus_visitor_man',mesh)
bpy.context.collection.objects.link(obj)
for name,start,count in a.parts:
    obj.vertex_groups.new(name=name).add(list(range(start,start+count)),1,'REPLACE')
root=bpy.data.objects.new('root',None)
bpy.context.collection.objects.link(root)
obj.parent=root
root['asset']='campus_visitor_man_v01'
root['design']='Reference-led friendly technology campus visitor; static environment art.'
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
scene.render.fps=24
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
out=Path(os.environ.get('ASSET_BUILD_DIR',HERE))
out.mkdir(parents=True,exist_ok=True)
name=os.environ.get('ASSET_SOURCE_NAME','campus_visitor_man_v01.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(out/name))
mesh.calc_loop_triangles()
print('CAMPUS_VISITOR',len(mesh.loop_triangles),'triangles',
      'detail',DETAIL,'dimensions',(max(v[0] for v in a.v)-min(v[0] for v in a.v),
                         max(v[1] for v in a.v)-min(v[1] for v in a.v),
                         max(v[2] for v in a.v)-min(v[2] for v in a.v)))
