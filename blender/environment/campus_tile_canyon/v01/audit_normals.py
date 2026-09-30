import bpy,collections
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath=str(Path('blender/environment/campus_tile_canyon/v01/campus_tile_canyon_v01.blend').resolve()))
o=bpy.data.objects['campus_tile_canyon'];groups=collections.defaultdict(list)
for p in o.data.polygons:
 uv=o.data.uv_layers.active.data[p.loop_start].uv
 slot=round((uv.x*512-4)/8) if uv.y>.98 else -1
 groups[slot].append(round(p.normal.z,3))
for k,v in groups.items():print(k,len(v),min(v),max(v),'negative',sum(n<-.01 for n in v))
