"""Reference-led static sculptural Octocats. Runtime coordinate tuples: X,Z,Y."""
import bpy, math
from mathutils import Vector
from props_tools import initialize
PALETTE={'wood':'#BF9465','wood_dark':'#835739','mahogany':'#77483B','dark':'#232925','paper':'#F2F5F3','slate':'#89A4B8','screen':'#153F50','green':'#0FBF3E','leaf':'#70B5B4','gold':'#E9B864','purple':'#8534F3','blue':'#5579B8','bordeaux':'#7C354D','stone':'#D2D0C5','bronze':'#98794C','bronze_dark':'#65583C'}
SECRET={'black':'#232925','peach':'#E5B89F','pink':'#C66973','cream':'#F2E3C9','turquoise':'#70B5B4','white':'#F2F5F3','eye':'#985257','graphite':'#333E48'}
def sphere(m,name,x,z,y,scale,role,segments=32,rings=16,smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=(x,-z,y))
    o=bpy.context.object;o.scale=scale;o=m.finish(o,name,role)
    for p in o.data.polygons:p.use_smooth=smooth
    return o
def interpolate(points,n=6):
    points=[Vector(p) for p in points];out=[]
    for i in range(len(points)-1):
        a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
        for j in range(n):
            t=j/n;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    out.append(points[-1]);return out
def tube(m,name,points,radius,role,sides=12,n=6,taper=.65,caps=True):
    pts=interpolate(points,n);verts=[];last_u=None
    for i,p in enumerate(pts):
        tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
        if last_u is None:
            ref=Vector((0,0,1)) if abs(tangent.z)<.92 else Vector((0,1,0));u=tangent.cross(ref).normalized()
        else:u=(last_u-tangent*last_u.dot(tangent)).normalized()
        v=tangent.cross(u).normalized();last_u=u
        end=i/(len(pts)-1);r=radius*(1-(1-taper)*max(0,(end-.7)/.3))
        verts.extend([tuple(p+r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))) for j in range(sides)])
    faces=[(i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j) for i in range(len(pts)-1) for j in range(sides)]
    faces.append(tuple(range(sides-1,-1,-1)))
    if caps:
        # Shared-ring hemispherical cap avoids a separate sphere's equator seam.
        r=radius*taper;start=(len(pts)-1)*sides;p=pts[-1]
        for k in range(1,5):
            a=k*math.pi/10;ring=len(verts)
            verts.extend([tuple(p+tangent*r*math.sin(a)+r*math.cos(a)*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))) for j in range(sides)])
            faces.extend((start+j,start+(j+1)%sides,ring+(j+1)%sides,ring+j) for j in range(sides));start=ring
        tip=len(verts);verts.append(tuple(p+tangent*r));faces.extend((start+j,start+(j+1)%sides,tip) for j in range(sides))
    else:faces.append(tuple((len(pts)-1)*sides+j for j in range(sides)))
    o=m.mesh(name,verts,faces,role)
    for p in o.data.polygons:p.use_smooth=True
    return o
def ear(m,x,base,scale,role,inset):
    # Soft triangular continuous ring with an inset inner bowl; no slab spikes.
    profile=[(-.27,0),(-.26,.17),(-.18,.35),(-.03,.42),(.19,.22),(.25,-.04)]
    verts=[]
    for z,factor in [(.01,1),(.27,1),(.285,.64),(.16,.64)]:
        verts.extend((x+u*scale,z*scale,base+h*scale) for u,h in [(u*factor,h*factor+.11*(1-factor)) for u,h in profile])
    n=len(profile);faces=[tuple(reversed(range(n))),tuple(range(3*n,4*n))]
    faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    faces.extend((i+n,(i+1)%n+n,(i+1)%n+2*n,i+2*n) for i in range(n))
    faces.extend((i+2*n,(i+1)%n+2*n,(i+1)%n+3*n,i+3*n) for i in range(n))
    o=m.mesh('Rounded recessed cat ear rim',verts,faces,role)
    for p in o.data.polygons:p.use_smooth=True
    o=m.mesh('Ear inset bowl',verts[3*n:], [tuple(range(n))],inset)
    for p in o.data.polygons:p.use_smooth=True
def face_patch(m,name,cx,cz,cy,rx,ry,rz,role,front_base):
    # Curved ellipsoidal face, continuous broad central field rather than eye-mask islands.
    vs=[(cx,cz+rz,cy)];segments=40;rings=9
    for j in range(1,rings+1):
        r=j/rings
        for i in range(segments):
            a=i*math.tau/segments;u=r*math.cos(a);v=r*math.sin(a)
            vs.append((cx+rx*u,cz+rz*math.sqrt(max(0,1-r*r)),cy+ry*v))
    fs=[(0,1+i,1+(i+1)%segments) for i in range(segments)]
    fs.extend((1+(j-1)*segments+i,1+(j-1)*segments+(i+1)%segments,1+j*segments+(i+1)%segments,1+j*segments+i) for j in range(1,rings) for i in range(segments))
    # Rim loops close inward onto the underlying head, no exposed wafer backing.
    k=len(vs);vs.extend((cx+rx*math.cos(i*math.tau/segments),front_base,cy+ry*math.sin(i*math.tau/segments)) for i in range(segments))
    start=1+(rings-1)*segments
    fs.extend((start+i,start+(i+1)%segments,k+(i+1)%segments,k+i) for i in range(segments));fs.append(tuple(range(k,k+segments)))
    o=m.mesh(name,vs,fs,role)
    for p in o.data.polygons:p.use_smooth=True
    return o
def weld_sculpture(m,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True);m.parts.remove(o)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    mod=o.modifiers.new('Continuous cast bronze facial surface','REMESH');mod.mode='VOXEL';mod.voxel_size=.013;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Cast surface blending before reduction','SMOOTH');mod.factor=.70;mod.iterations=8;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Purposeful sculpture topology','DECIMATE');mod.ratio=.11;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Cast surface blending','SMOOTH');mod.factor=.45;mod.iterations=4;bpy.ops.object.modifier_apply(modifier=mod.name)
    m.finish(o,'Continuous cast forehead face eyelids and nose','bronze')
    for p in o.data.polygons:p.use_smooth=True
def thinktocat(m):
    vs=[(-.81,-.72,0),(.81,-.72,0),(.81,.72,0),(-.81,.72,0),(-.66,-.61,.77),(.66,-.61,.77),(.66,.61,.77),(-.66,.61,.77)]
    m.mesh('Preserved tapered chalk stone plinth',vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'paper')
    m.box('Bronze monument plaque',0,.726,.42,.68,.018,.18,'bronze_dark',0);m.group('Tapered chalk plinth')
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(0,.04,1.03));o=bpy.context.object;o.scale=(.53,.42,.29);m.finish(o,'Faceted cast rock seat','bronze_dark')
    sphere(m,'Seated bronze torso',0,-.06,1.40,(.46,.36,.55),'bronze')
    sculpt=[sphere(m,'Round thoughtful forehead',-.04,.13,2.40,(.97,.67,.84),'bronze',40,24)]
    for x in (-.67,.59):ear(m,x,2.87,1,'bronze','bronze_dark')
    sculpt.append(face_patch(m,'Lowered sculpted bronze face',-.04,.66,2.16,.61,.38,.17,'bronze',.39))
    for x in (-.29,.21):
        sculpt.append(sphere(m,'Rounded closed eye volume',x,.815,2.18,(.155,.031,.13),'bronze',24,12))
        tube(m,'Closed eyelid sculpted crease',[(x-.135,.817,2.16),(x-.07,.844,2.115),(x+.03,.849,2.107),(x+.135,.818,2.155)],.0115,'bronze_dark',8,5,taper=.85)
    sculpt.append(sphere(m,'Soft muzzle bridge',-.04,.822,2.025,(.17,.044,.085),'bronze',24,12))
    sculpt.append(sphere(m,'Rounded cat nose',-.04,.883,2.035,(.068,.052,.048),'bronze',24,12))
    weld_sculpture(m,sculpt)
    # A true continuous curled chin support, closed rounded tips, and seated overlaps.
    tube(m,'Continuous chin-rest tentacle',[(-.31,.10,1.15),(-.37,.37,1.38),(-.35,.60,1.63),(-.25,.76,1.82),(-.10,.85,1.92),(.06,.85,1.89),(.10,.82,1.79),(.02,.82,1.75)],.137,'bronze',14,7,taper=.58)
    tube(m,'Continuous crossing elbow tentacle',[(.35,-.03,1.53),(.49,.28,1.68),(.44,.49,1.62),(.20,.67,1.48),(-.03,.71,1.25),(-.05,.71,1.11)],.143,'bronze',14,7,taper=.64)
    tube(m,'Left relaxed seated leg',[(-.24,-.04,1.29),(-.42,.22,1.14),(-.48,.46,.98),(-.42,.53,.91)],.123,'bronze',14,7,taper=.75)
    tube(m,'Right relaxed seated leg',[(.22,-.05,1.25),(.34,.24,1.06),(.44,.48,.90),(.38,.55,.87)],.124,'bronze',14,7,taper=.73)
    tube(m,'Swept rear tentacle',[(.31,-.30,1.33),(.70,-.40,1.52),(.94,-.28,1.77),(.96,-.06,1.93),(.88,.02,1.98)],.115,'bronze',14,7,taper=.7)
    m.group('Polished reference-led Thinktocat sculpture')
def secret(m):
    # Author at metre size .65 high, rooted at pedestal contact; head is dominant.
    m.cylinder('Turquoise collectible pedestal',0,0,.025,.145,.05,'turquoise',32)
    m.box('White pedestal inset plaque',0,.139,.028,.115,.011,.028,'white',0)
    sphere(m,'Tiny classic Octocat torso',0,0,.22,(.057,.050,.09),'black',24,12)
    sphere(m,'Glossy broad classic Octocat head',0,.012,.435,(.205,.133,.181),'black',40,24)
    for x in (-.14,.14):ear(m,x,.55,.20,'black','graphite')
    face_patch(m,'Classic peach face inset',0,.112,.414,.164,.106,.045,'peach',.09)
    # Ivory eye outlines contain rose-pink iris rings and cream highlights.
    for x in (-.077,.077):
        sphere(m,'Cream oval eye rim',x,.152,.430,(.032,.010,.044),'cream',24,12)
        sphere(m,'Rose eye iris',x,.164,.430,(.023,.006,.034),'pink',24,12)
        sphere(m,'Dark rose pupil',x,.171,.429,(.013,.005,.022),'eye',24,12)
        sphere(m,'Eye glint',x-.005,.175,.440,(.004,.002,.007),'white',12,8)
    sphere(m,'Classic tiny nose',0,.160,.397,(.009,.007,.007),'pink',16,8)
    tube(m,'Friendly curved smile',[(-.020,.157,.377),(-.011,.163,.366),(0,.165,.363),(.013,.163,.366),(.023,.157,.378)],.004,'pink',8,4,taper=.8)
    for i,(x,z) in enumerate([(-.05,.025),(.015,.05),(.062,.014)]):
        tube(m,'Standing classic tentacle '+str(i),[(x*.7,0,.230),(x,z,.16),(x*1.25,z+.025,.078),(x*1.4,z+.04,.058)],.020,'black',12,6,taper=.65)
    tube(m,'Long curling classic side tentacle',[(-.035,-.005,.245),(-.10,.014,.206),(-.18,.012,.215),(-.24,.013,.253),(-.30,.022,.250)],.019,'black',12,7,taper=.42)
    for i in range(8):
        x=-.12-i*.023;y=.213+max(0,i-2)*.008
        sphere(m,'Tiny turquoise sucker',x,.032,y,(.005,.003,.004),'turquoise',10,6)
    m.group('Secret classic Octocat shelf figurine')
def build(asset,folder):
    palette=PALETTE if asset=='gh_thinktocat' else SECRET;m=initialize(palette,asset+'_palette',folder)
    bs=m.material.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.57 if asset=='gh_thinktocat' else .39
    bs.inputs['Metallic'].default_value=.12 if asset=='gh_thinktocat' else 0
    if asset=='gh_thinktocat':thinktocat(m)
    else:secret(m)
    m.root['interpretation']='Original stylized interpretation from user photo and Tony Jaramillo Thinktocat sculpture references.'
    m.save(asset+'_v01.blend')
