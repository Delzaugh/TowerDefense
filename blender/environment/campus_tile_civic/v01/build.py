"""Civic stone plaza. Shared foundation geometry with an authored paving atlas."""
import bpy, math, os, runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
project=folder.parents[3]
runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))['build']('campus_base_hex',folder)
surface=runpy.run_path(str(project/'blender/environment/campus_base_hex/v01/surface.py'))
surface['apply_surface'](folder)
rgb=surface['rgb'];smooth=surface['smooth'];noise=surface['noise'];colors=surface['COLORS'];order=list(colors)
base=rgb('#8C9084');rows=[]
for iy in range(512):
    row=bytearray()
    for ix in range(512):
        value=base
        if iy<8 and ix<len(order)*8:value=rgb(colors[order[ix//8]])
        elif 16<=ix<496 and 16<=iy<496:
            x=(ix-16+.5)/480*36-18;z=(iy-16+.5)/480*36-18
            clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
            blend=smooth(max(0,min(1,(clearance-.06)/.48)))
            # Broad staggered ashlar: restrained, low contrast joints, no micro grain.
            r=math.floor(z/3);u=x+(1.5 if r%2 else 0);c=math.floor(u/3)
            joint=min(u%3,3-u%3,z%3,3-z%3)<.042
            slab=rgb('#909891' if (r+c)%3==0 else '#979D96' if (r+c)%3==1 else '#9BA099')
            if joint:slab=rgb('#808B88')
            broad=(noise(x*.23+19,z*.23-7)-.5)*.018
            value=tuple(round(a*(1-blend)+b*(1+broad)*blend) for a,b in zip(base,slab))
        row.extend(value)
    rows.append(bytes(row))
dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));texture=dest/'civic_stone_atlas.png';surface['png'](texture,rows)
image=bpy.data.images.load(str(texture),check_existing=False);image.name='Civic ashlar and shared slate frame';image.colorspace_settings.name='sRGB';image.pack()
obj=next(o for o in bpy.data.objects['root'].children_recursive if o.type=='MESH');obj.name='campus_tile_civic'
for mat in obj.data.materials:
    for node in mat.node_tree.nodes:
        if node.type=='TEX_IMAGE':node.image=image
obj['surface_profile']='civic';obj['surface_contract']='Flat top y1.20; radius18; narrow .54m neutral surface transition; independent existing campus routes'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_tile_civic_v01.blend')))
