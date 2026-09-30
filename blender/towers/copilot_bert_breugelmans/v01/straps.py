"""Fitted, continuous shoulder ribbons shared by the source edit and recipe."""
import math
from mathutils import Vector

def pack_fit(point):
    x,y,z=point;dy=(y-.43)*.90;dz=(z-1.64)*.90;t=math.radians(8)
    return (x*.90,.43+dy*math.cos(t)+dz*math.sin(t),1.64-dy*math.sin(t)+dz*math.cos(t))

def geometry(side):
    # Inboard chest route clears the upper arms. Both ends still seat directly
    # in the original green tier; the extra sections round the shoulder bend.
    s=side
    path=[pack_fit((s*.315,.22,1.73)),(s*.390,.18,1.645),
          (s*.432,.035,1.595),(s*.390,-.120,1.605),
          (s*.308,-.220,1.645),(s*.205,-.285,1.735),
          (s*.183,-.290,1.815),(s*.187,-.284,1.91),
          (s*.195,-.268,2.005),(s*.214,-.191,2.080),
          (s*.230,-.112,2.118),(s*.244,-.025,2.131),
          (s*.270,.060,2.125),(s*.291,.135,2.115),
          tuple(Vector((s*.327,.15,2.14)).lerp(Vector(pack_fit((s*.327,.15,2.14))),.65)),
          pack_fit((s*.315,.23,2.075))]
    path=[Vector(p) for p in path]
    verts=[];faces=[]
    # Shallow eight-sided section: soft edge strips without a large bevel mesh.
    width=.041;half_depth=.014;bevel=.004
    section=[(-width+bevel,-half_depth),(width-bevel,-half_depth),
             (width,-half_depth+bevel),(width,half_depth-bevel),
             (width-bevel,half_depth),(-width+bevel,half_depth),
             (-width,half_depth-bevel),(-width,-half_depth+bevel)]
    for i,p in enumerate(path):
        tangent=path[min(i+1,len(path)-1)]-path[max(i-1,0)];tangent.x=0;tangent.normalize()
        normal=Vector((0,-tangent.z,tangent.y))
        verts.extend(tuple(p+Vector((x,0,0))+normal*d) for x,d in section)
    faces.append(tuple(reversed(range(8))))
    for i in range(len(path)-1):
        for j in range(8):faces.append((i*8+j,i*8+(j+1)%8,(i+1)*8+(j+1)%8,(i+1)*8+j))
    faces.append(tuple((len(path)-1)*8+j for j in range(8)))
    return verts,faces
