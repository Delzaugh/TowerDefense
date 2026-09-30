"""Keystone Field Architect geometry; coordinates are x, height, forward depth."""
from mathutils.bvhtree import BVHTree

def loft(name, loops, role, cap=True):
    n=len(loops[0]); vs=[p for loop in loops for p in loop]
    fs=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
        for j in range(len(loops)-1) for i in range(n)]
    if cap: fs += [tuple(reversed(range(n))),tuple(range(len(vs)-n,len(vs)))]
    return mesh(name,vs,fs,role)

def rounded(w,h,r,n=3):
    pts=[]
    for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),
                        (-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for j in range(n+1):
            a=math.radians(start+j*90/n)
            pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    clean=[]
    for p in pts:
        if not clean or (Vector(p)-Vector(clean[-1])).length>1e-8:clean.append(p)
    if (Vector(clean[0])-Vector(clean[-1])).length<1e-8:clean.pop()
    return clean

def patch(name,center,U,V,outline,role,thickness=.04,bevel=.015):
    C=Vector(center); U=Vector(U).normalized();V=Vector(V).normalized();N=U.cross(V).normalized()
    rings=[]
    for t,f in [(0,1),(max(.001,thickness-bevel),1),(thickness,.92)]:
        rings.append([tuple(C+U*u*f+V*v*f+N*t) for u,v in outline])
    return loft(name,rings,role)

def flat(name,center,U,V,outline,role,offset=.003):
    C=Vector(center);U=Vector(U);V=Vector(V);N=U.cross(V).normalized()
    vs=[tuple(C+U*u+V*v+N*offset) for u,v in outline]
    return mesh(name,vs,[tuple(range(len(vs)))],role)

# Sparse changing body sections. Large broad panels carry no tiny tessellation.
sections=[(0,.48,.40,-.40),(.18,.93,.79,-.66),(.52,1.23,1.04,-.92),
          (1.04,1.386,1.15,-1.37),(1.52,1.376,1.01,-1.47),
          (1.94,1.21,.61,-1.33),(2.29,.92,.08,-.97),
          (2.45,.63,-.17,-.77),(2.50,.32,-.28,-.63)]
loops=[]
for h,rx,df,db in sections:
    loop=[]
    for i in range(16):
        a=math.tau*i/16;co=math.cos(a)
        dc=(df+db)/2;rd=(df-db)/2
        si=math.sin(a)
        loop.append((rx*math.copysign(abs(si)**.75,si),h,dc+rd*math.copysign(abs(co)**.45,co)))
    loops.append(loop)
core=loft('01_faceted_core',loops,'teal')
bm=bmesh.new();bm.from_mesh(core.data);core_tree=BVHTree.FromBMesh(bm)
def front_hit(x,h):
    hit,n,idx,dist=core_tree.ray_cast(Vector((x,-5,h)),Vector((0,1,0)))
    assert hit is not None,('front miss',x,h)
    return Vector((hit.x,hit.z,-hit.y)),Vector((n.x,n.z,-n.y))
def side_x(h,d):
    hit,n,idx,dist=core_tree.ray_cast(Vector((5,-d,h)),Vector((-1,0,0)))
    assert hit is not None,('side miss',h,d)
    return hit.x
def front_d(x,h): return front_hit(x,h)[0].z

# Bowed display with a continuous manufactured rim; bottom rim is teal.
face=[(-.72,.40),(-.42,.355),(0,.34),(.42,.355),(.72,.40),(.89,.48),
      (.975,.64),(1.0,.87),(1.0,1.16),(.955,1.31),(.86,1.40),(.68,1.445),
      (.34,1.46),(0,1.465),(-.34,1.46),(-.68,1.445),(-.86,1.40),
      (-.955,1.31),(-1.0,1.16),(-1.0,.87),(-.975,.64),(-.89,.48)]
def fd(x,h):return 1.33-.16*(x/1.12)**2-.13*(h-.94)**2
n=len(face); vs=[]
for scale,t in [(1.25,-.30),(1.25,-.035),(1.02,.020),(.99,-.025)]:
    vs += [(x*scale,.92+(h-.92)*scale,fd(x*scale,.92+(h-.92)*scale)+t) for x,h in face]
fs=[];roles=[]
for j,k in [(0,1),(1,2),(2,3),(3,0)]:
    for i in range(n):
        fs.append((j*n+i,j*n+(i+1)%n,k*n+(i+1)%n,k*n+i))
        roles.append('teal' if (face[i][1]+face[(i+1)%n][1])/2<.47 else 'cream')
mesh('02_continuous_face_frame',vs,fs,'cream',face_roles=roles)
v=[]
for scale in [1,.6,.20]:
    v += [(x*scale,.92+(h-.92)*scale,fd(x*scale,.92+(h-.92)*scale)-.006) for x,h in face]
v.append((0,.92,fd(0,.92)-.006));f=[]
for j in range(2):
    f += [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)]
f += [(2*n+i,2*n+(i+1)%n,3*n) for i in range(n)]
screen=mesh('03_bowed_display',v,f,'screen')
for poly in screen.data.polygons:poly.use_smooth=True
for i,x in enumerate([-.41,.41]):
    outline=rounded(.19,.49,.095,4)
    vs=[(x+u,.93+v,fd(x+u,.93+v)+.004) for u,v in outline]
    mesh('04_eye_'+str(i),vs,[tuple(range(len(vs)))],'cyan')

# A connected two-opening side truss, with teal shell behind its recesses.
def side_frame(side):
    from mathutils.geometry import delaunay_2d_cdt
    outer=[(.91,.34),(1.01,1.48),(.90,1.61),(-.20,2.10),(-.34,2.00),(.69,.36)]
    holes=[[(.78,1.45),(-.04,1.84),(.39,1.12)],[(.78,.98),(.50,.87),(.71,.53)]]
    if side<0:
        # The blueprint flank uses a single cradle rail, not a mirrored set-square
        # that would cover the plan symbol on the paper flap.
        outer=[(.97,.34),(1.06,1.48),(.83,1.68),(.03,2.10),
               (-.13,2.02),(.62,1.52),(.82,1.33),(.77,.45)]
        holes=[]
    def inside(p,poly):
        hit=False
        for a,b in zip(poly,poly[1:]+poly[:1]):
            if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:hit=not hit
        return hit
    def contains(p):return inside(p,outer) and not any(inside(p,h) for h in holes)
    vv=[];ee=[]
    for loop in [outer]+holes:
        dense=[]
        for a,b in zip(loop,loop[1:]+loop[:1]):
            a=Vector(a);b=Vector(b);steps=math.ceil((b-a).length/.24)
            dense += [a.lerp(b,i/steps) for i in range(steps)]
        start=len(vv);vv += dense
        ee += [(start+i,start+(i+1)%len(dense)) for i in range(len(dense))]
    for yi in range(8):
        for xi in range(7):
            p=(-.28+xi*.21,.43+yi*.21)
            if contains(p):vv.append(Vector(p))
    coords,_,ff,_,_,_=delaunay_2d_cdt(vv,ee,[],0,1e-6)
    ff=[tuple(f) for f in ff if contains(sum((coords[i] for i in f),Vector((0,0)))/len(f))]
    used=sorted({i for f in ff for i in f});remap={j:i for i,j in enumerate(used)}
    coords=[coords[i] for i in used];ff=[tuple(remap[i] for i in f) for f in ff]
    edge_counts={}
    for f in ff:
        for a,b in zip(f,f[1:]+f[:1]):
            e=tuple(sorted((a,b)));edge_counts[e]=edge_counts.get(e,0)+1
    vertices=[]
    for layer in [0,1]:
        for d,h in coords:
            # A continuous manufactured sweep avoids copying every faceted-shell
            # normal change into the ivory frame. The shell remains faceted.
            surface=1.405-(.65 if h>1.26 else .35)*((h-1.26)/1.3)**2-.30*max(d-.45,0)**1.7
            surface-=.19*max(0,(.75-h)/.41)
            outer_x=surface+.055-(.10 if side<0 else 0)
            inner=outer_x-.13
            vertices.append((side*(outer_x if layer else inner),h,d))
    n=len(coords)
    faces=[tuple(reversed(f)) for f in ff]+[tuple(i+n for i in f) for f in ff]
    faces += [(a,b,b+n,a+n) for (a,b),count in edge_counts.items() if count==1]
    ob=mesh('05_'+('stylus' if side>0 else 'blueprint')+'_drafting_frame',vertices,faces,'cream')
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bevel=ob.modifiers.new('frame edge bevel','BEVEL');bevel.limit_method='ANGLE'
    bevel.angle_limit=math.radians(35);bevel.width=.027;bevel.segments=1
    bpy.ops.object.modifier_apply(modifier=bevel.name);ob.select_set(False)
    for poly in ob.data.polygons:poly.use_smooth=True
    # Keep the bevel and side-wall borders crisp while smoothing curved spans.
    bm_frame=bmesh.new();bm_frame.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm_frame,verts=list(bm_frame.verts),dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm_frame,edges=list(bm_frame.edges),dist=1e-6)
    for edge in bm_frame.edges:
        edge.smooth = not edge.is_manifold or edge.calc_face_angle()<math.radians(35)
    bm_frame.to_mesh(ob.data);bm_frame.free()
    # Newly created bevel loops inherit the same palette swatch.
    for poly in ob.data.polygons:
        for li in poly.loop_indices:ob.data.uv_layers.active.data[li].uv=(4/W,.5)
    return ob

side_frame(1);side_frame(-1)

# Curved top diagram on three rigid seated tile planes.
tile_frames={}
for key,x,h,w,ht,role in [('application',0,2.20,.52,.47,'orange'),
                           ('database',-.46,1.84,.54,.49,'cream'),
                           ('service',.46,1.84,.54,.49,'cream')]:
    C,N=front_hit(x,h);N=N.normalized()
    U=(Vector((1,0,0))-N*N.x).normalized();V=N.cross(U).normalized()
    C += N*.034
    patch('06_'+key+'_tile',C,U,V,rounded(w,ht,.065),role,.07,.018)
    tile_frames[key]=(C+N*.072,U,V)

def surface_route(name,points,width):
    pp=[Vector(p) for p in points];outline=[]
    for side in [-1,1]:
        indices=range(len(pp)) if side<0 else reversed(range(len(pp)))
        for i in indices:
            t=(pp[min(i+1,len(pp)-1)]-pp[max(i-1,0)]).normalized()
            normal=Vector((-t.y,t.x))
            outline.append(tuple(pp[i]+normal*width/2*side))
    verts=[(x,h,front_d(x,h)+.032) for x,h in outline]
    return mesh(name,verts,[tuple(range(len(verts)))],'cyan')
for sign in [-1,1]:
    surface_route('07_diagram_route_'+str(sign),
                  [(sign*.17,2.13),(sign*.40,2.07),(sign*.51,1.99),(sign*.48,1.92)],.065)

# Rolled paper: true spiral cross-section, cream cut edge, economical wall loops.
cx,cd=-1.54,.24
samples=40;spiral=[]
for i in range(samples+1):
    f=i/samples;a=math.tau*2.10*f;r=.027+.194*f
    spiral.append((a,r))
verts=[]
for h in [2.20,2.29]:
    for edge in [0,.018]:
        verts += [(cx+(r+edge)*math.cos(a),h,cd+(r+edge)*math.sin(a)) for a,r in spiral]
n=samples+1;faces=[];roles=[]
for i in range(samples):
    faces += [(i,i+1,2*n+i+1,2*n+i),
              (n+i,3*n+i,3*n+i+1,n+i+1),
              (2*n+i,2*n+i+1,3*n+i+1,3*n+i)]
    roles += ['blue','blue','cream']
faces += [(0,2*n,3*n,n),(n-1,2*n-1,4*n-1,3*n-1)];roles+=['blue','blue']
mesh('08_blueprint_spiral',verts,faces,'blue',face_roles=roles)
loft('08_blueprint_outer_roll',[
    [(cx+.239*math.cos(math.tau*i/20),h,cd+.239*math.sin(math.tau*i/20)) for i in range(20)]
    for h in [.54,2.285]],'blue',cap=False)
mesh('08_roll_lower_cap',[(cx+.239*math.cos(math.tau*i/20),.54,cd+.239*math.sin(math.tau*i/20)) for i in range(20)],
     [tuple(range(20))],'blue')

def band(name,h):
    angles=[math.radians(45+270*i/15) for i in range(16)]
    vs=[]
    for hh,rr in [(h-.07,.245),(h-.07,.286),(h+.07,.286),(h+.07,.245)]:
        vs += [(cx+rr*math.cos(a),hh,cd+rr*math.sin(a)) for a in angles]
    n=len(angles);fs=[]
    for j,k in [(0,1),(1,2),(2,3),(3,0)]:
        fs += [(j*n+i,j*n+i+1,k*n+i+1,k*n+i) for i in range(n-1)]
    fs += [(0,n,2*n,3*n),(n-1,4*n-1,3*n-1,2*n-1)]
    mesh(name,vs,fs,'cream')
band('09_blueprint_upper_cradle',1.79);band('09_blueprint_lower_cradle',.73)
# Visible backbone is an inferred simple continuation of the cradle, no hardware.
extrusion('09_blueprint_cradle_backbone',[(.04,.69),(.45,.69),(.45,1.88),(.04,1.88)],
          -1.36,-1.22,'cream',.025,axis='side')
flapC=Vector((-1.695,1.25,.44));flapU=Vector((.7071,0,.7071));flapV=Vector((0,1,0))
patch('10_blueprint_flap',flapC,flapU,flapV,rounded(.49,.91,.025,2),'blue',.025,.007)

# Pencil dock and short shaft, seated close to the other flank.
dock=[(.77,.57),(.55,.42),(.28,.56),(-.48,1.68),(-.41,1.91),(-.14,1.97),(.03,1.78)]
dock=[(d-.27,h) for d,h in dock]
vs=[]
for t in [0,.095]:
    vs += [(max(side_x(h,d)+.03,1.325)+t,h,d) for d,h in dock]
n=len(dock);fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
fs += [(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
mesh('11_stylus_fitted_dock',vs,fs,'teal',.018)
tip=Vector((1.515,.66,.27));axis=Vector((-.035,1.16,-.80));length=axis.length;axis.normalize()
U=Vector((1,0,0));U=(U-axis*U.dot(axis)).normalized();V=axis.cross(U)
def pencil_segment(name,rings,role):
    loops=[]
    for t,r in rings:
        loops.append([tuple(tip+axis*t+U*math.cos(math.tau*i/6)*r+
                            V*math.sin(math.tau*i/6)*r) for i in range(6)])
    return loft(name,loops,role)
pencil_segment('12_graphite_tip',[(0,.018),(.16,.082)],'screen')
pencil_segment('12_wood_cone',[(.16,.082),(.38,.143)],'cream')
pencil_segment('12_orange_shaft',[(.38,.143),(.41,.15),(length-.18,.15)],'orange')
pencil_segment('12_ivory_cap',[(length-.18,.152),(length-.035,.152),(length,.13)],'cream')
# Broad exposed retention clip, no speculative moving joint.
clipC=tip+axis*.79+U*.163
patch('13_stylus_clip',clipC,V,axis,rounded(.125,.35,.025,2),'cream',.055,.012)
for i,d in enumerate([.35,.60]):
    h=.58
    C=Vector((1.435,h,d-.27))
    flat('14_dock_status_'+str(i),C,(0,0,-1),(0,1,0),rounded(.09,.045,.008,1),'cyan')

# Flat glyphs are real economical surfaces. Union a rectilinear glyph without overlaps.
def rect_union(name,C,U,V,rects,role):
    xs=sorted(set(x for r in rects for x in r[:2]));ys=sorted(set(y for r in rects for y in r[2:]))
    cells=set()
    for j in range(len(ys)-1):
        for i in range(len(xs)-1):
            x=(xs[i]+xs[i+1])/2;y=(ys[j]+ys[j+1])/2
            if any(a<x<b and c<y<d for a,b,c,d in rects):cells.add((i,j))
    quads=[]
    while cells:
        i,j=min(cells,key=lambda p:(p[1],p[0]));k=i+1
        while (k,j) in cells:k+=1
        l=j+1
        while all((a,l) in cells for a in range(i,k)):l+=1
        for a in range(i,k):
            for b in range(j,l):cells.remove((a,b))
        quads.append((xs[i],xs[k],ys[j],ys[l]))
    C=Vector(C);U=Vector(U);V=Vector(V);N=U.cross(V).normalized();verts=[];fs=[]
    for a,b,c,d in quads:
        k=len(verts);verts += [tuple(C+U*x+V*y+N*.003) for x,y in [(a,c),(b,c),(b,d),(a,d)]]
        fs.append((k,k+1,k+2,k+3))
    return mesh(name,verts,fs,role)
def outline_rect(x,y,w,h,t):
    return [(x-w/2,x+w/2,y-h/2,y-h/2+t),(x-w/2,x+w/2,y+h/2-t,y+h/2),
            (x-w/2,x-w/2+t,y-h/2,y+h/2),(x+w/2-t,x+w/2,y-h/2,y+h/2)]
if DETAIL:
    C,U,V=tile_frames['application']
    for x in [-.10,.10]:
        for y in [-.09,.09]:
            flat('15_app_window',C,U,V,[(x-.068,y-.06),(x+.068,y-.06),(x+.068,y+.06),(x-.068,y+.06)],'cream')
    C,U,V=tile_frames['database']
    flat('16_database_top',C,U,V,[(.16*math.cos(i*math.tau/16),.115+.055*math.sin(i*math.tau/16)) for i in range(16)],'teal')
    for yy in [.005,-.10]:
        p=[]
        for i in range(9):
            x=-.16+.32*i/8;p.append((x,yy-.035*math.sqrt(max(0,1-(x/.16)**2))+.045))
        for i in reversed(range(9)):
            x=-.16+.32*i/8;p.append((x,yy-.04*math.sqrt(max(0,1-(x/.16)**2))-.028))
        flat('16_database_band',C,U,V,p,'teal')
    C,U,V=tile_frames['service']
    rr=[(-.048,.048,.105,.19),(-.012,.012,.015,.13),(-.16,.16,-.002,.024)]
    for x in [-.14,0,.14]:
        rr += [(x-.012,x+.012,-.095,.015)]
        rr += outline_rect(x,-.115,.086,.085,.020)
    rect_union('17_service_hierarchy',C,U,V,rr,'teal')
    N=flapU.cross(flapV).normalized();C=flapC+N*.028
    rr=outline_rect(0,.22,.135,.13,.023)+[(-.012,.012,-.015,.155),(-.13,.13,-.035,-.012)]
    for x in [-.12,.12]:
        rr += [(x-.012,x+.012,-.145,-.018)] + outline_rect(x,-.20,.13,.125,.023)
    rect_union('18_blueprint_plan',C,flapU,flapV,rr,'cream')
bm.free()
