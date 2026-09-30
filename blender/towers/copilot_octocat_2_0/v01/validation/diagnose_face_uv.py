import bpy,json,hashlib
from pathlib import Path
folder=Path(__file__).resolve().parent.parent
source=folder/'copilot_octocat_2_0_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
head=bpy.data.objects['head_and_ears'];uv=head.data.uv_layers.active
img=next(n.image for n in head.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE')
pixels=list(img.pixels);w,h=img.size
leaks=[]
for p in head.data.polygons:
    if p.center.y<=0:continue
    coord=sum((uv.data[i].uv for i in p.loop_indices),__import__('mathutils').Vector((0,0)))/len(p.loop_indices)
    x=max(0,min(w-1,int(coord.x*w)));y=max(0,min(h-1,int(coord.y*h)))
    c=pixels[(y*w+x)*4:(y*w+x)*4+3]
    if c[0]>.6 and c[1]>.35:leaks.append({'index':p.index,'center':list(p.center),'normal':list(p.normal),'uv':list(coord)})
report={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'peach_back_triangles':len(leaks),'examples':leaks[:12]}
(folder/'validation/face_uv_diagnosis.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
