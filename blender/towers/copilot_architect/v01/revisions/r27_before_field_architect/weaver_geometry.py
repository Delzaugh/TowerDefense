"""Weaver primary volumes and seated details. Executed by the guarded build recipe."""

def rect(x,h,w,ht,c):
    return [(x-w/2+c,h-ht/2),(x+w/2-c,h-ht/2),(x+w/2,h-ht/2+c),
            (x+w/2,h+ht/2-c),(x+w/2-c,h+ht/2),(x-w/2+c,h+ht/2),
            (x-w/2,h+ht/2-c),(x-w/2,h-ht/2+c)]

def loft(name,loops,role,bevel=0):
    n=len(loops[0]); verts=[p for loop in loops for p in loop]
    faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))]
    faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i)
              for k in range(len(loops)-1) for i in range(n)]
    return mesh(name,verts,faces,role,bevel)

def bar(name,a,b,width,depth,role,bevel=.025):
    # The long axis follows a genuine 3D route. Local width axis stays in X/H.
    a=Vector(a);b=Vector(b);t=(b-a).normalized()
    side=Vector((-t.y,t.x,0)).normalized()
    if side.length<.01:side=Vector((1,0,0))
    normal=t.cross(side).normalized()
    loops=[]
    for p in (a,b):
        loops.append([tuple(p+side*u*width/2+normal*v*depth/2)
                      for u,v in [(-1,-1),(1,-1),(1,1),(-1,1)]])
    return loft(name,loops,role,min(bevel,width*.2,depth*.2))

def bent_bracket(name,points,width,thickness):
    verts=[]
    for depthsign in (-.5,.5):
        for i,p in enumerate(points):
            prev=Vector(points[max(0,i-1)][:2]);nxt=Vector(points[min(len(points)-1,i+1)][:2])
            t=(nxt-prev).normalized();normal=Vector((-t.y,t.x))
            for sign in (-.5,.5):
                verts.append((p[0]+normal.x*width*sign,p[1]+normal.y*width*sign,p[2]+depthsign*thickness))
    n=len(points)*2;faces=[]
    for i in range(len(points)-1):
        k=i*2
        faces += [(k,k+2,k+3,k+1),(n+k+1,n+k+3,n+k+2,n+k),
                  (k,n+k,n+k+2,k+2),(k+1,k+3,n+k+3,n+k+1)]
    faces += [(0,1,n+1,n),(n-2,2*n-2,2*n-1,n-1)]
    return mesh(name,verts,faces,'cream',.045)

# Angular keel: the center moves back/sideways and its sections change in X and D.
sections=[(0,-.20,-.30,.13,.19),(.25,-.20,-.36,.37,.48),
          (.72,-.15,-.40,.72,.89),(1.12,-.06,-.40,.65,1.10),
          (1.55,.01,-.31,.46,.70),(1.94,.00,-.25,.38,.53),
          (2.19,.00,-.28,.31,.40)]
loops=[]
for h,cx,cd,rx,rd in sections:
    outline=[(-.65,-1),(.65,-1),(1,-.62),(1,.62),(.65,1),(-.65,1),(-1,.62),(-1,-.62)]
    loops.append([(cx+rx*x,h,cd+rd*d) for x,d in outline])
core=loft('folded_keel_core',loops,'teal',.035)
from mathutils.bvhtree import BVHTree
core_bm=bmesh.new();core_bm.from_mesh(core.data)
core_bvh=BVHTree.FromBMesh(core_bm)

def fitted_depth(x,h,front=True):
    hit,normal,index,distance=core_bvh.ray_cast(Vector((x,-5 if front else 5,h)),Vector((0,1 if front else -1,0)))
    assert hit is not None, (x,h,front)
    return -hit.y

# Recessed physical neck collar connects the overhanging head into the rear core.
loft('head_neck_collar',[
    [(x,h,d) for x,d in [(-.27,-.50),(.27,-.50),(.34,-.32),(.25,.08),(-.25,.08),(-.34,-.32)]]
    for h in (2.08,2.30)],'screen',.025)

# A head that projects forward from a recessed shoulder/neck bridge.
FACE_H=2.46
FACE_TILT=math.radians(5)
face_outline=[(-.91,.43),(.91,.43),(1.01,.24),(.43,-.48),(.25,-.57),(-.25,-.57),(-.43,-.48),(-1.01,.24)]
def facepoint(u,v,depth=0):
    return (u*math.cos(FACE_TILT)-v*math.sin(FACE_TILT),
            FACE_H+u*math.sin(FACE_TILT)+v*math.cos(FACE_TILT),
            .88-.22*v+depth)

headloops=[]
for scale,dh,d,crown in [(1,0,-.06,0),(.96,.015,-.30,.07),(.73,.05,-.91,.12),(.47,.08,-1.42,.02)]:
    loop=[]
    for i,((u,v),(uu,vv)) in enumerate(zip(face_outline,face_outline[1:]+face_outline[:1])):
        loop += [facepoint(u*scale,v*scale+dh,d),
                 facepoint((u+uu)*.5*scale,(v+vv)*.5*scale+dh+(crown if i==0 else 0),d)]
    headloops.append(loop)
loft('tapered_face_pod',headloops,'teal',.025)

# Continuous cream rim with a recessed inner return; no overlapping plate joints.
verts=[];n=len(face_outline)
for scale,d in [(1,-.10),(1.025,.035),(.80,.055),(.79,-.025)]:
    verts += [facepoint(u*scale,v*scale,d) for u,v in face_outline]
faces=[(k*n+i,k*n+(i+1)%n,l*n+(i+1)%n,l*n+i)
       for k,l in [(0,1),(1,2),(2,3),(3,0)] for i in range(n)]
mesh('keystone_face_bezel',verts,faces,'cream')

loops=[]
for scale,dep in [(.79,-.006),(.51,.042),(.22,.064)]:
    loops.append([facepoint(u*scale,v*scale,dep) for u,v in face_outline])
verts=[p for loop in loops for p in loop]+[facepoint(0,-.035,.070)]
faces=[(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for k in range(2) for i in range(n)]
faces += [(2*n+i,2*n+(i+1)%n,3*n) for i in range(n)]
display=mesh('bowed_keystone_display',verts,faces,'screen')
for polygon in display.data.polygons:polygon.use_smooth=True
screen_bm=bmesh.new();screen_bm.from_mesh(display.data)
screen_bvh=BVHTree.FromBMesh(screen_bm)

for j,cx in enumerate((-.31,.31)):
    outline=[];r=.071;half=.125
    for k in range(9):
        a=math.pi*k/8;outline.append((cx+r*math.cos(a),.015+half+r*math.sin(a)))
    for k in range(9):
        a=math.pi+math.pi*k/8;outline.append((cx+r*math.cos(a),.015-half+r*math.sin(a)))
    e=extrusion('friendly_eye_'+str(j),outline,.004,.019,'cyan',.002)
    for vertex in e.data.vertices:
        u,v,d=vertex.co.x,vertex.co.z,-vertex.co.y
        pos=Vector(xyz(facepoint(u,v,0)))
        hit,normal,index,distance=screen_bvh.ray_cast(Vector((pos.x,-5,pos.z)),Vector((0,1,0)))
        if hit:pos.y=hit.y-d
        vertex.co=pos
screen_bm.free()

# Open brackets staggered by depth and height, visibly socketed into the core.
bar('left_shoulder_link',(-.30,1.92,-.48),(-1.03,2.10,-.34),.22,.30,'teal')
bar('right_shoulder_link',(.29,1.93,-.51),(1.01,2.12,-.62),.23,.30,'teal')
left_bracket=bent_bracket('left_open_bracket',[(-1.07,2.14,-.32),(-1.49,1.77,.02),(-1.48,1.16,.34),(-.79,.62,.60)],.30,.46)
right_bracket=bent_bracket('right_open_bracket',[(1.00,2.18,-.64),(1.43,1.94,-.36),(1.56,1.29,.01),(.86,.73,.51)],.30,.46)
bar('left_lower_socket',(-.48,.69,.29),(-.86,.69,.47),.21,.29,'teal')
bar('right_lower_socket',(.46,.84,.26),(.90,.81,.41),.21,.29,'teal')

# Three supported foreground components, deliberately off the same vertical plane.
bar('application_mount',(0,1.15,.20),(.06,1.22,.94),.24,.24,'teal')
bar('service_rail',(-1.12,1.27,.72),(.04,1.43,1.04),.14,.15,'screen')
bar('data_rail',(.07,1.43,1.04),(1.12,1.60,.54),.14,.15,'screen')
app_outline=rect(.035,1.42,.66,.64,.10)
extrusion('orange_application_block',app_outline,.89,1.30,'orange',.025)
service_outline=rect(-1.02,1.27,.46,.48,.055)
extrusion('cream_service_block',service_outline,.55,.96,'cream',.018)

def database(name,x,h,d,r,ht,role):
    loops=[]
    for hh,rr in [(h-ht/2,r*.86),(h-ht/2+.05,r),(h+ht/2-.05,r),(h+ht/2,r*.86)]:
        loops.append([(x+rr*math.cos(k*math.tau/12),hh,d+rr*math.sin(k*math.tau/12)) for k in range(12)])
    return loft(name,loops,role)
database('cream_database',1.03,1.58,.60,.245,.59,'cream')

if DETAIL:
    # Exposed routes are broad seated rails, supporting the component assemblies.
    bar('service_route',(-.82,1.35,.906),(-.23,1.43,1.131),.045,.025,'cyan',.004)
    bar('database_route',(.32,1.48,1.012),(.88,1.58,.763),.045,.025,'cyan',.004)

    # The orange app is an actual small window, with title bar and content panes.
    extrusion('app_screen',rect(.035,1.43,.47,.43,.045),1.302,1.316,'screen',.002)
    extrusion('app_titlebar',rect(.035,1.554,.355,.030,.005),1.318,1.329,'cyan',.002)
    extrusion('app_sidebar',rect(-.088,1.377,.085,.15,.007),1.318,1.331,'cream',.002)
    extrusion('app_content',rect(.09,1.377,.18,.15,.01),1.318,1.331,'cream',.002)

    # Component glyph on the service block: frame with two tabs, readable up close.
    extrusion('service_inset',rect(-1.02,1.28,.30,.28,.025),.963,.977,'teal',.002)
    extrusion('service_component',rect(-1.005,1.28,.13,.14,.01),.979,.988,'cream',.001)
    for h in (1.235,1.325):
        extrusion('service_tab',rect(-1.085,h,.065,.032,.005),.979,.989,'cream',.001)

    # Dark shallow rings are seated around the database, not decal circles.
    for h in (1.465,1.655):
        ring=[]
        for hh in (h-.014,h+.014):
            ring.append([(1.03+.247*math.cos(k*math.tau/12),hh,.60+.247*math.sin(k*math.tau/12)) for k in range(12)])
        n=12;vs=ring[0]+ring[1]
        mesh('database_division',vs,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'teal')

    # Folded underside accent and shoulder couplers use designed seats.
    inlay=extrusion('keel_orange_inlay',[(-.28,.56),(.01,.56),(-.15,.36)],.003,.021,'orange',.004)
    for v in inlay.data.vertices:
        v.co.y-=fitted_depth(v.co.x,v.co.z)
    for name,x,h,bracket in [('left',-1.145,2.07,left_bracket),('right',1.087,2.123,right_bracket)]:
        bm=bmesh.new();bm.from_mesh(bracket.data);tree=BVHTree.FromBMesh(bm)
        key=extrusion(name+'_socket_key',rect(x,h,.11,.09,.018),.004,.025,'orange',.003)
        for v in key.data.vertices:
            hit,normal,index,distance=tree.ray_cast(Vector((v.co.x,-5,v.co.z)),Vector((0,1,0)))
            assert hit is not None, (name,tuple(v.co))
            v.co.y+=hit.y
        bm.free()

    # Narrow spine sampled against actual rear facets, including bevel bands.
    verts=[];rows=37
    for j in range(rows):
        h=.38+j*1.08/(rows-1)
        cx=-.19+.19*(h-.38)/1.08
        width=.09+.10*math.sin(math.pi*(h-.38)/1.08)
        for x in (cx-width/2,cx+width/2):verts.append((x,h,fitted_depth(x,h,False)-.012))
    faces=[(j*2,j*2+1,j*2+3,j*2+2) for j in range(rows-1)]
    start=len(verts);verts += [(x,h,d+.018) for x,h,d in verts]
    faces += [(start+j*2,start+j*2+2,start+j*2+3,start+j*2+1) for j in range(rows-1)]
    faces += [(j*2,(j+1)*2,start+(j+1)*2,start+j*2) for j in range(rows-1)]
    faces += [(j*2+1,start+j*2+1,start+(j+1)*2+1,(j+1)*2+1) for j in range(rows-1)]
    faces += [(0,start,start+1,1),(start-2,start-1,2*start-1,2*start-2)]
    mesh('rear_maintenance_spine',verts,faces,'cream')

core_bm.free()
