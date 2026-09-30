import bpy,json,hashlib,sys
from pathlib import Path
project=Path(__file__).resolve().parents[5]
ids=['copilot_octocat_2_0','copilot_octocat_2_0_lowpoly']
for asset_id in ids:
    folder=project/'blender/towers'/asset_id/'v01';manifest=json.loads((folder/'asset.json').read_text(encoding='utf-8-sig'))
    source=project/manifest['source']['path'];bpy.ops.wm.open_mainfile(filepath=str(source))
    head=bpy.data.objects['head_and_ears'];uv=head.data.uv_layers.active;projection=head['face_uv_projection'];failures=[];back=0
    for polygon in head.data.polygons:
        if polygon.center.y>=projection['split_y'] or polygon.normal.y>=0:
            back+=1
            if any((uv.data[li].uv-__import__('mathutils').Vector(projection['fur_uv'])).length>1e-6 for li in polygon.loop_indices):failures.append(polygon.index)
    if failures:raise RuntimeError('Rear face UV projection survived: '+str(failures))
    image=next(n.image for n in head.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE')
    x=int(projection['fur_uv'][0]*image.size[0]);y=int(projection['fur_uv'][1]*image.size[1]);p=(y*image.size[0]+x)*4
    if max(image.pixels[p:p+3])>.3:raise RuntimeError('Fur UV does not sample a dark texel')
    report={'asset':asset_id,'revision':manifest['revision'],'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'checkedBackFacingOrRearPolygons':back,'rearProjectionFailures':0,'furPixel':list(image.pixels[p:p+4]),'passed':True}
    (folder/'validation/face_uv_audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
