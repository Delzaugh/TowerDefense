"""Weaver: dimensional application-architect copilot with connected components."""
import bpy, bmesh, math, os, json
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
OUT = Path(os.environ.get('ASSET_BUILD_DIR', str(HERE)))
DETAIL = os.environ.get('PAVILION_BLOCKOUT') != '1'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
root = bpy.data.objects.new('root', None)
scene.collection.objects.link(root)
root['asset_id'] = 'copilot_architect'
root['design'] = 'Systems Architect / Application Architecture'

COLORS = {'cream':'F4DFC0', 'teal':'08607A', 'screen':'041D2A', 'cyan':'00E5EF', 'orange':'FF7308'}
W,H = 40,8
im = bpy.data.images.new('pavilion_palette', width=W, height=H, alpha=True)
pixels=[]
for y in range(H):
    for x in range(W):
        hx=list(COLORS.values())[x//8]
        pixels.extend([int(hx[i:i+2],16)/255 for i in (0,2,4)]+[1.])
im.pixels = pixels
im.filepath_raw=str(OUT/'pavilion_palette.png'); im.file_format='PNG'; im.save(); im.pack()
def material(name, emissive=False):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.77
    tex=m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=im; tex.interpolation='Linear'
    m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    if emissive:
        bs.inputs['Emission Color'].default_value=(0,.72,.8,1)
        bs.inputs['Emission Strength'].default_value=.55
    return m
mat=material('pavilion_palette')
eye_mat=material('pavilion_eyes',True)
parts=[]
def xyz(p):
    x,h,d=p
    return (x,-d,h)
def mesh(name, verts, faces, role, bevel=0,face_roles=None):
    me=bpy.data.meshes.new(name); me.from_pydata([xyz(v) for v in verts],[],faces); me.update()
    ob=bpy.data.objects.new(name,me); scene.collection.objects.link(ob); ob.parent=root
    ob.data.materials.append(eye_mat if role=='cyan' else mat)
    if bevel:
        bpy.context.view_layer.objects.active=ob; ob.select_set(True)
        mod=ob.modifiers.new('manufactured edge','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name); ob.select_set(False)
    bm=bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(ob.data); bm.free()
    uv=ob.data.uv_layers.new(name='PaletteUV')
    for poly in ob.data.polygons:
        index=list(COLORS).index(face_roles[poly.index] if face_roles else role)
        for li in poly.loop_indices:uv.data[li].uv=((index*8+4)/W,.5)
    for p in ob.data.polygons: p.use_smooth=False
    ob['palette_role']=role
    group=ob.vertex_groups.new(name=name)
    group.add(list(range(len(ob.data.vertices))),1.0,'REPLACE')
    parts.append(ob)
    return ob
def extrusion(name, outline, a,b,role,bevel=0,axis='depth'):
    # Outline coordinates are x,height for depth extrusion; depth,height for side panels.
    verts=[]
    for k in (a,b):
        verts += [(u,v,k) if axis=='depth' else (k,v,u) for u,v in outline]
    n=len(outline)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,role,bevel)

exec(compile((HERE/'weaver_geometry.py').read_text(), str(HERE/'weaver_geometry.py'), 'exec'))

for group,name in (([p for p in parts if p.get('palette_role')!='cyan'],'pavilion_body'),([p for p in parts if p.get('palette_role')=='cyan'],'pavilion_eyes')):
    if not group:continue
    bpy.ops.object.select_all(action='DESELECT')
    for p in group:p.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join();bpy.context.object.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.select_all(action='DESELECT')
for name,p in [('anchor_ui',(0,3.30,0)),('anchor_action',(.035,1.42,1.33)),('anchor_target',(0,1.55,0))]:
    a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=xyz(p)
scene.render.fps=30;scene.frame_set(0)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_architect_v01.blend')))
