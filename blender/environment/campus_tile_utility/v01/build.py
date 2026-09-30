"""Utility court: shared slate frame, flush concrete service pads, buried ducts."""
import bpy, math, os, runpy
from pathlib import Path
folder=Path(__file__).resolve().parent; project=folder.parents[3]
runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))['build']('campus_base_hex',folder)
s=runpy.run_path(str(project/'blender/environment/campus_base_hex/v01/surface.py'));s['apply_surface'](folder)
rgb=s['rgb'];smooth=s['smooth'];noise=s['noise'];colors=s['COLORS'];order=list(colors);base=rgb('#8C9084');rows=[]
for iy in range(512):
    row=bytearray()
    for ix in range(512):
        value=base
        if iy<8 and ix<len(order)*8:value=rgb(colors[order[ix//8]])
        elif 16<=ix<496 and 16<=iy<496:
            x=(ix-16+.5)/480*36-18;z=(iy-16+.5)/480*36-18
            clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
            blend=smooth(max(0,min(1,(clearance-.06)/.48)))
            slab=(-12<x<-2.4 and -7<z<6.5) or (4<x<12 and -8<z<7)
            val=rgb('#99A19B') if slab else rgb('#7D8987')
            if slab:
                # Deliberately large concrete panels and two covered cable ducts.
                if min((x+12)%4,4-(x+12)%4,(z+8)%4,4-(z+8)%4)<.045:val=rgb('#7E8D91')
                if (abs(x+3.4)<.15 and -6<z<5.5) or (abs(x-4.8)<.15 and -7<z<6):val=rgb('#62777F')
            # Concrete court continues across the open yard; broad expansion joints.
            if not slab and min((x+18)%4,4-(x+18)%4,(z+18)%4,4-(z+18)%4)<.045:val=rgb('#707D7B')
            # Service bays south of the plant, deliberately outside its foundations.
            if 3.8<x<11.7 and 8.2<z<12.6:
                stripe=abs(z-8.5)<.075 or abs(z-12.3)<.075 or min(abs(x-4.1),abs(x-7.8),abs(x-11.4))<.075
                if stripe:val=rgb('#CEBB80')
            # Flush drain covers read as inset maintenance details, not obstacles.
            if -10<x<-3 and 8.2<z<8.65:
                val=rgb('#526967') if int((x+10)*6)%2 else rgb('#86928B')
            grain=(noise(x*.4+19,z*.4-7)-.5)*.016
            value=tuple(round(a*(1-blend)+b*(1+grain)*blend) for a,b in zip(base,val))
        row.extend(value)
    rows.append(bytes(row))
dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));p=dest/'utility_surface_atlas.png';s['png'](p,rows)
image=bpy.data.images.load(str(p),check_existing=False);image.name='Utility paved service court';image.colorspace_settings.name='sRGB';image.pack()
obj=next(o for o in bpy.data.objects['root'].children_recursive if o.type=='MESH');obj.name='campus_tile_utility'
for mat in obj.data.materials:
    for node in mat.node_tree.nodes:
        if node.type=='TEX_IMAGE':node.image=image
obj['surface_profile']='utility';obj['surface_contract']='All top y1.20, radius18, outer.54m neutral surface transition; service pads and covered channels flush. No baked route.'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_tile_utility_v01.blend')))
