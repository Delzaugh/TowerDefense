import bpy
from mathutils import Vector
from pathlib import Path
p=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(p/'.staging/landmark_blockout/copilot_developer_v01.blend'))
o=bpy.data.objects['developer_model']
for y,z in [(-.68,.75),(-.62,.75),(-.57,.75),(-.48,.20),(-.32,.15),(-.20,.15)]:
    hit,loc,norm,face=o.ray_cast(Vector((3,y,z)),Vector((-1,0,0)))
    poly=o.data.polygons[face]
    names=[o.vertex_groups[g.group].name for g in o.data.vertices[poly.vertices[0]].groups]
    print('SURFACE',y,z,tuple(loc),names)
