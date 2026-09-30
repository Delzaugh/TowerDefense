"""Closed upper chest seated beneath the V-neck, blending into the moving neck."""
import math

def geometry(shift=0):
    vertices=[];faces=[];weights=[];rings=[]
    for count,z,rx,ry,weight in [
        (12,2.145,.198,.168,{'body':1}),
        (8,2.175,.140,.125,{'body':.15,'head':.85}),
        (8,2.320,.145,.130,{'head':1})]:
        ring=[]
        for i in range(count):
            a=math.tau*i/count
            zz=z-(.18*max(0,-math.sin(a))**6+.014 if not rings else 0)
            ring.append(len(vertices));vertices.append((rx*math.cos(a),ry*math.sin(a),zz+shift));weights.append(weight)
        rings.append(ring)
    # A nonplanar V-shaped rim needs a low fan closure; one large n-gon
    # can triangulate across the V and expose its underside above the chest.
    bottom=len(vertices);vertices.append((0,0,1.91+shift));weights.append({'body':1})
    for a,b in zip(rings[0],rings[0][1:]+rings[0][:1]):faces.append((bottom,b,a))
    for a,b in zip(rings,rings[1:]):
        i=j=0;m=len(a);n=len(b)
        while i<m or j<n:
            ta=(i+1)/m if i<m else 2;tb=(j+1)/n if j<n else 2
            if abs(ta-tb)<1e-8:faces.append((a[i%m],a[(i+1)%m],b[(j+1)%n],b[j%n]));i+=1;j+=1
            elif ta<tb:faces.append((a[i%m],a[(i+1)%m],b[j%n]));i+=1
            else:faces.append((a[i%m],b[(j+1)%n],b[j%n]));j+=1
    faces.append(tuple(rings[-1]))
    return vertices,faces,weights
