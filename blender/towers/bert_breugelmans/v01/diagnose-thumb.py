"""Read-only thumb join search in canonical hand coordinates."""
import math,bmesh
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
code=(base/'hands.py').read_text()
for offset in (0,.004,.008,.012):
    for radius in (.023,.021,.019):
        candidate=code.replace('(-.1055,-.020,.0835)',f'({-.1055-offset},-.020,.0835)').replace('[.023,.0175,.009]',f'[{radius},.0175,.009]')
        scope={};exec(compile(candidate,'hands.py','exec'),scope)
        vs,faces,weights=scope['geometry']('r',1,(0,0,0))
        tree=BVHTree.FromPolygons(vs,faces)
        hits=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(faces[a])&set(faces[b])]
        print('CANDIDATE',offset,radius,'intersections',hits)
        if offset==0 and radius==.023:
            q=scope['rest_orientation'](1).inverted()
            for a,b in hits:
                for f in (a,b):print('FACE',f,[tuple(round(c,5) for c in q@Vector(vs[i])) for i in faces[f]])
