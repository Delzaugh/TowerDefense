"""Developer, contour-driven quality rebuild. Blender -Y forward, Z up.
Guarded --build only after the initial delivery. The local recipe owns all art.
"""
import bpy, bmesh, os, sys, json, math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker, matrix, ellipse
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a=Maker(m)

def octagon(w,h,c):
    return [(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2)]
def soften(p,t=.065):
    out=[]
    for i,xy in enumerate(p):
        v=Vector(xy)
        out.extend([tuple(v.lerp(Vector(p[(i-1)%len(p)]),t)),tuple(v.lerp(Vector(p[(i+1)%len(p)]),t))])
    return out
def scaled(p,x,z,zc=0):return [(px*x,pz*z+zc) for px,pz in p]
def surface(name,rings,role,xf=None,cap=True,smooth=False):
    a.loft(name,rings,role,xf,smooth,cap)
def mesh_obj(name,v,f):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);return obj
def bevel_collect(obj,name,role,width=.025,segments=2):
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Manufactured edge chamfers','BEVEL');mod.width=width;mod.segments=segments
    bpy.ops.object.modifier_apply(modifier=mod.name)
    a.collect(obj,name,role)

# Rounded faceted core with a recessed, subtly curved screen. Sections narrow
# toward the face and rear; there are no full-width vertical box sides.
outline=soften(octagon(1.93,1.65,.35),.12);n=len(outline)
sections=[(-.76,.80,.84,.85),(-.63,.93,.94,.86),(-.34,1,1,.85),(.12,1,1,.85),(.46,.94,.97,.85),(.65,.80,.86,.86),(.70,.53,.62,.88)]
v=[(x,y,z) for y,sx,sz,zc in sections for x,z in scaled(outline,sx,sz,zc)]
v=[(x*(.90 if z>.38 else 1),y,1.25+(z-1.25)*.60 if z>1.25 else z) for x,y,z in v]
f=[];roles=[]
for j in range(len(sections)-1):
    for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i));roles.append('graphite')
f.append(tuple(range((len(sections)-1)*n,len(sections)*n)));roles.append('graphite');last=0
for sx,sz,y,role in [(.79,.83,-.785,'detail'),(.76,.80,-.766,'screen'),(.56,.57,-.815,'screen'),(.30,.30,-.838,'screen')]:
    start=len(v);v.extend((x,y,z) for x,z in scaled(outline,sx,sz,.85))
    for i in range(n):f.append((last+i,last+(i+1)%n,start+(i+1)%n,start+i));roles.append(role)
    last=start
v.append((0,-.85,.85));end=len(v)-1
for i in range(n):f.append((last+i,last+(i+1)%n,end));roles.append('screen')
a.add('rounded_casing_and_recessed_display',v,f,roles)

# Orange outer helmet is a solid arched mantle with a shaped lower contour.
# Union swept fins into it before beveling, eliminating slab-on-box seams.
mantle_sections=[(-.80,.82,.31,1.52),(-.48,.96,.30,1.68),(-.12,1.00,.35,1.79),(.25,.99,.46,1.72),(.56,.88,.75,1.58),(.74,.70,1.12,1.42)]
cross=[]
for y,w,low,top in mantle_sections:
    cross.append([( -w,y,low),(-w*1.01,y,low+(top-low)*.53),(-w*.90,y,top-.12),(-w*.56,y,top),(w*.56,y,top),(w*.90,y,top-.12),(w*1.01,y,low+(top-low)*.53),(w,y,low)])
v=[p for row in cross for p in row];nn=8;rows=len(cross)
# Thick inside wall follows the shell but is hidden against the graphite core.
v.extend((x*.93,y,z-.045) for row in cross for x,y,z in row);off=nn*rows;f=[]
for j in range(rows-1):
    for i in range(nn-1):
        q=(j*nn+i,j*nn+i+1,(j+1)*nn+i+1,(j+1)*nn+i)
        f.append(q);f.append(tuple(off+k for k in reversed(q)))
for j in range(rows-1):
    for i in [0,nn-1]:f.append((j*nn+i,(j+1)*nn+i,off+(j+1)*nn+i,off+j*nn+i))
for j in [0,rows-1]:
    for i in range(nn-1):f.append((j*nn+i,j*nn+i+1,off+j*nn+i+1,off+j*nn+i))
helmet=mesh_obj('continuous_orange_mantle',v,f)

def blade_obj(name,sections):
    # Peaked cross section gives broad top facets and strong tapered thickness.
    v=[]
    for y,w,z,t in sections:
        v.extend([(-w/2,y,z-t*.40),(-w/2,y,z+t*.16),(-w*.28,y,z+t*.50),(w*.28,y,z+t*.50),(w/2,y,z+t*.16),(w/2,y,z-t*.40)])
    n=6;f=[]
    for j in range(len(sections)-1):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
    f.extend([tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+i for i in range(n))])
    return mesh_obj(name,v,f)
blades=[
 blade_obj('upper_crest',[(-.69,.30,1.46,.25),(-.36,.57,1.82,.30),(.12,.68,1.98,.27),(.88,.61,2.11,.16),(1.08,.53,2.13,.13)]),
 blade_obj('middle_sweep',[(-.48,1.31,1.41,.31),(-.05,1.63,1.62,.30),(.38,1.61,1.77,.27),(1.05,1.46,1.92,.16),(1.12,1.36,1.94,.12)]),
 blade_obj('lower_sweep',[(.05,1.87,1.15,.31),(.40,1.80,1.35,.29),(.79,1.66,1.53,.21),(1.10,1.50,1.65,.15),(1.14,1.40,1.67,.12)])]
for obj in blades:
    bpy.context.view_layer.objects.active=helmet
    mod=helmet.modifiers.new('Integrated fin root','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=obj
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(obj,do_unlink=True)
bm=bmesh.new();bm.from_mesh(helmet.data)
bmesh.ops.dissolve_degenerate(bm,dist=.0001,edges=list(bm.edges))
bmesh.ops.dissolve_limit(bm,angle_limit=.004,verts=list(bm.verts),edges=list(bm.edges))
bm.to_mesh(helmet.data);bm.free()
bevel_collect(helmet,'integrated_helmet_and_three_swept_fins','shell',.026,1)
for z,w,y in [(1.88,.42,.51),(1.61,.93,.55)]:a.box('recessed_cooling_core',(0,y,z),(w,.34,.16),'detail',.025,1)

# Full angular chin with a consistent chamfered U-shaped contour.
chin=[(-.77,.48),(-.74,.24),(-.43,.075),(.43,.075),(.74,.24),(.77,.48),(.67,.52),(.59,.36),(.36,.215),(-.36,.215),(-.59,.36),(-.67,.52)]
a.poly('angular_chin_guard',chin,(0,-.845,0),.22,'graphite',bevel=.026)
for s in (-1,1):a.eye((s*.235,-.842,.645),.315,.118)

# Deep goggles follow the brow, with two chamfers and an inset lens seat.
outer=soften([(-.30,.31),(-.425,.13),(-.395,-.12),(-.245,-.31),(.245,-.31),(.395,-.12),(.425,.13),(.30,.31)],.09)
n=len(outer);lens_normals=[]
for s in (-1,1):
    xf=matrix((s*.438,-.91,1.275),pitch=-.13,yaw=s*.115)
    rings=[(1.02,1.02,.20),(1.05,1.05,.02),(.98,.98,-.062),(.88,.88,-.089),(.70,.64,-.089),(.66,.60,-.042),(.66,.60,.095)]
    v=[(x*sx,y,z*sz) for sx,sz,y in rings for x,z in outer];f=[]
    for j in range(len(rings)):f.extend((j*n+i,j*n+(i+1)%n,((j+1)%len(rings))*n+(i+1)%n,((j+1)%len(rings))*n+i) for i in range(n))
    a.add('beveled_goggle_frame_'+str(s),v,f,'graphite',xf=xf)
    # Black lens gasket as a closed ring, positioned below front chamfer.
    v=[(x*sx,y,z*sz) for sx,sz,y in [(.682,.622,-.068),(.682,.622,.055),(.635,.575,.055),(.635,.575,-.068)] for x,z in outer]
    f=[(j*n+i,j*n+(i+1)%n,((j+1)%4)*n+(i+1)%n,((j+1)%4)*n+i) for j in range(4) for i in range(n)]
    a.add('lens_seal_'+str(s),v,f,'detail',xf=xf)
    v=[]
    for sc,y in [(1,.028),(.83,-.045),(.48,-.074)]:v.extend((x*.65*sc,y,z*.59*sc) for x,z in outer)
    v.append((0,-.080,0));f=[tuple(range(n-1,-1,-1))]
    for j in range(2):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
    f.extend((2*n+i,2*n+(i+1)%n,3*n) for i in range(n))
    lens_normals.append((len(a.v),len(v),xf))
    a.add('curved_teal_lens_'+str(s),v,f,'lens',True,True,xf)
a.box('goggle_bridge',(0,-.90,1.285),(.18,.24,.19),'graphite',.025,2)

# Octagonal temple modules: dark seat, ivory chamfer, recessed rim, flat badge.
for s in (-1,1):
    axis='right' if s>0 else 'left';c=(s*1.01,.08,.81);xf=matrix(c,axis)
    p=soften(octagon(.96,.98,.22),.055)
    surface('temple_gasket_'+str(s),[(scaled(p,.96,.96),.065),(scaled(p,.96,.96),-.04)],'detail',xf)
    surface('ivory_beveled_housing_'+str(s),[(scaled(p,.96,.96),.03),(p,-.025),(p,-.14),(scaled(p,.90,.90),-.18)],'trim',xf)
    surface('badge_dark_seat_'+str(s),[(scaled(p,.79,.79),-.176),(scaled(p,.79,.79),-.196)],'detail',xf)
    surface('graphite_code_badge_'+str(s),[(scaled(p,.775,.775),-.188),(scaled(p,.775,.775),-.22),(scaled(p,.69,.69),-.255)],'graphite',xf)
    for k in (-1,1):
        pts=[(k*.075,.19),(k*.128,.177),(k*.128,.07),(k*.148,.035),(k*.17,.020),(k*.17,-.020),(k*.148,-.035),(k*.128,-.07),(k*.128,-.177),(k*.075,-.19)]
        # Rounded tiny edge highlights on one mitered brace, rather than bars.
        start=len(a.parts);a.stroke('ivory_curly_brace',pts,.038,(s*1.270,.08,.81),'trim',axis,depth=.012)

# Vents are carved into a broad, shaped rear panel rather than a bolt-on box.
rear=soften(octagon(1.29,.90,.26),.09);n=len(rear)
vr=[(x,y,z+.60) for p,y in [(scaled(rear,.84,.87),.635),(rear,.75),(scaled(rear,.90,.92),.835)] for x,z in p]
fr=[]
for j in range(2):fr.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
fr.extend([tuple(range(n-1,-1,-1)),tuple(2*n+i for i in range(n))])
panel=mesh_obj('contoured_rear_vent_panel',vr,fr)
for z in [.54,.735]:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,.82,z));cut=bpy.context.object;cut.dimensions=(.59,.23,.070)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=cut.modifiers.new('Vent end radius','BEVEL');mod.width=.026;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active=panel;mod=panel.modifiers.new('Recessed ventilation slot','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
    a.box('vent_interior',(0,.721,z),(.60,.018,.075),'detail',.014,1)
bevel_collect(panel,'contoured_rear_vent_panel','graphite',.012,1)

# Wrap the complete front assembly around a convex head, including attachment
# seats. The jaw rolls under and temples recede; no vertical extrusion defines
# the front profile. Applying the same field preserves shared shell boundaries.
def wrap_front(p):
    x,y,z=p
    influence=max(0,min(1,(-.12-y)/.55))
    retreat=.22*(x/.90)**2 + (.48 if z<.95 else .22)*(z-.95)**2
    return (x,y+retreat*influence,z)
unwrapped=list(a.v)
a.v=[wrap_front(p) for p in a.v]
output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source_name=os.environ.get('ASSET_SOURCE_NAME','copilot_developer_v01.blend')
a.finish(output,source_name)
# Restore authored flat planes after shared packaging. Smooth only the glass,
# eye capsules and bevel transitions, using area-weighted normals for hard parts.
obj=bpy.data.objects['developer_model'];mesh=obj.data
for poly in mesh.polygons:poly.use_smooth=True
mesh.set_sharp_from_angle(angle=math.radians(38))
bpy.context.view_layer.objects.active=obj
mod=obj.modifiers.new('Planar surface normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50
bpy.ops.object.modifier_apply(modifier=mod.name)
# Glass retains continuous curvature independently of weighted hard-surface normals.
normals=[tuple(n.vector) for n in mesh.corner_normals]
for start,count,xf in lens_normals:
    inv=xf.inverted()
    for loop in mesh.loops:
        if start<=loop.vertex_index<start+count:
            world=Vector(unwrapped[loop.vertex_index]);p=inv@world;normal=xf.to_3x3()@Vector((p.x*1.8,-1,p.z*2.3)).normalized()
            # Inverse-transpose of front-wrap Jacobian transports glass normals.
            influence=max(0,min(1,(-.12-world.y)/.55))
            dx=.44*world.x/(.90**2)*influence
            dz=(.96 if world.z<.95 else .44)*(world.z-.95)*influence
            retreat=.22*(world.x/.90)**2+(.48 if world.z<.95 else .22)*(world.z-.95)**2
            dy=1-retreat/.55 if -.67<world.y<-.12 else 1
            normal=Vector((normal.x-dx*normal.y/dy,normal.y/dy,normal.z-dz*normal.y/dy)).normalized()
            normals[loop.index]=tuple(normal)
mesh.normals_split_custom_set(normals)
mat=bpy.data.materials['developer_palette'];bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.62;bs.inputs['Specular IOR Level'].default_value=.22
bs=bpy.data.materials['developer_optics'].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.24
bpy.data.objects['root']['design']='Developer contour quality rebuild, user 5000 triangle ceiling, 2026-09-24'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
mesh.calc_loop_triangles();print('FINAL_DEVELOPER_TRIANGLES',len(mesh.loop_triangles))
