"""Compact, softly rounded hands with shared palm/finger/thumb boundaries."""
import math
from mathutils import Vector,Quaternion

def rest_orientation(s):return Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2)

def pivots(side,s,wrist):
    q=rest_orientation(s);w=Vector(wrist)
    return {name+'_'+side:tuple(w+q@Vector((s*x,y,z))) for name,(x,y,z) in {
        'fingers':(-.012,-.024,.096),'digits':(-.012,-.033,.136),
        'thumb':(-.082,-.012,.057)}.items()}

def geometry(side,s,wrist):
    hn='hand_'+side;pn='fingers_'+side;dn='digits_'+side;tn='thumb_'+side
    vs=[];fs=[];ws=[]
    def vertex(p,weight):vs.append(tuple(p));ws.append(weight);return len(vs)-1
    def bridge(a,b):
        # Join rings of six and eight vertices without a split seam.
        i=j=0;m=len(a);n=len(b)
        while i<m or j<n:
            ta=(i+1)/m if i<m else 2;tb=(j+1)/n if j<n else 2
            if abs(ta-tb)<1e-8:fs.append((a[i%m],a[(i+1)%m],b[(j+1)%n],b[j%n]));i+=1;j+=1
            elif ta<tb:fs.append((a[i%m],a[(i+1)%m],b[j%n]));i+=1
            else:fs.append((a[i%m],b[(j+1)%n],b[j%n]));j+=1
    centers=[-.072,-.032,.008,.048];heights=[.096,.103,.099,.088]
    lengths=[.064,.079,.073,.054];radii=[.0178,.0183,.0178,.0166]
    roots=[]
    for u,z,r in zip(centers,heights,radii):
        roots.append([vertex((u+x,-.024+y,z),{hn:.85,pn:.15}) for x,y in
            [(-r,-.017),(r,-.017),(r*1.1,0),(r,.017),(-r,.017),(-r*1.1,0)]])
    perimeter=[i for r in roots for i in r[:2]]+[roots[3][2]]+[i for r in reversed(roots) for i in (r[3],r[4])]+[roots[0][5]]
    mid=[]
    for i in perimeter:
        u,y,z=vs[i];mid.append(vertex((-.012+(u+.012)*1.02,-.010+(y+.024)*1.3,.047),{hn:1}))
    wrist_ring=[]
    for j in range(6):
        c=sum((Vector(vs[mid[(j*3+k)%18]]) for k in range(3)),Vector())/3
        wrist_ring.append(vertex(((c.x+.012)*.63,c.y*.66,-.015),{hn:1}))
    fs.append(tuple(reversed(wrist_ring)))
    for j in range(18):
        k=(j+1)%18;a=j//3;b=k//3
        fs.append((wrist_ring[a],mid[j],mid[k]) if a==b else (wrist_ring[a],mid[j],mid[k],wrist_ring[b]))
        if j not in (16,17):fs.append((mid[j],perimeter[j],perimeter[k],mid[k]))
    for j in range(3):
        a,b=roots[j],roots[j+1];fs.append((a[1],a[2],a[3],b[4],b[5],b[0]))
    for u,z,length,r,root in zip(centers,heights,lengths,radii,roots):
        rings=[root]
        for cy,cz,rx,depth,angle,weight in [
            (-.030,z+length*.46,r*1.02,.0195,.12,{pn:.75,dn:.25}),
            (-.040,z+length*.88,r*.94,.0165,.30,{dn:1}),
            (-.043,z+length+.003,r*.59,.010,.40,{dn:1})]:
            section=[(-.70,-1),(.70,-1),(1,-.60),(1,.60),(.70,1),(-.70,1),(-1,.60),(-1,-.60)]
            ring=[vertex((u+x*rx,cy+y*depth*math.cos(angle),cz+y*depth*math.sin(angle)),weight) for x,y in section]
            bridge(rings[-1],ring);rings.append(ring)
        fs.append(tuple(reversed(rings[-1])))
    # A fuller thenar mound continues the palm, with a short rounded thumb.
    thumb_root=[perimeter[16],perimeter[17],perimeter[0],mid[0],mid[17],mid[16]]
    for i in thumb_root:ws[i]={hn:.9,tn:.1}
    root_center=sum((Vector(vs[i]) for i in thumb_root),Vector())/6
    # Progress outward/distally from the palm with no reversing centreline.
    # The previous first ring stepped back toward the wrist and the last ring
    # reversed sideways, producing the visible hooked/crooked silhouette.
    path=[Vector((-.1055,-.020,.0835)),Vector((-.1195,-.023,.0965)),Vector((-.130,-.025,.1065))]
    previous=thumb_root;basis=None;start=None;sign=1
    for index,(center,radius) in enumerate(zip(path,[.021,.0175,.009])):
        before=root_center if index==0 else path[index-1]
        after=path[min(index+1,len(path)-1)]
        tangent=(after-before).normalized()
        basis=Vector((0,1,0)) if basis is None else basis
        basis=(basis-tangent*basis.dot(tangent)).normalized();cross=tangent.cross(basis).normalized()
        if start is None:
            v=Vector(vs[thumb_root[0]])-root_center;v1=Vector(vs[thumb_root[1]])-root_center
            start=math.atan2(v.dot(cross),v.dot(basis));sign=1 if v.cross(v1).dot(tangent)>0 else -1
        ring=[vertex(center+radius*(basis*math.cos(start+sign*j*math.tau/6)+cross*math.sin(start+sign*j*math.tau/6)),{tn:1}) for j in range(6)]
        bridge(previous,ring);previous=ring
    fs.append(tuple(reversed(previous)))
    q=rest_orientation(s);w=Vector(wrist)
    return [tuple(w+q@Vector((s*x,y,z))) for x,y,z in vs],fs,ws
