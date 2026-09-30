"""Small original mesh construction helpers shared by the two story set sources."""
import bpy, bmesh, math, os, struct, zlib
from pathlib import Path
from mathutils import Vector

def initialize(palette, material_name, folder):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
    root=bpy.data.objects.new('root',None); scene.collection.objects.link(root)
    mat=bpy.data.materials.new(material_name); mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.86
    destination=Path(os.environ.get('ASSET_BUILD_DIR',folder)); destination.mkdir(parents=True,exist_ok=True)
    texture=destination/(material_name+'.png')
    def chunk(kind,data): return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    row=bytes([int(list(palette.values())[min(x//4,len(palette)-1)][i:i+2],16) for x in range(64) for i in (1,3,5)])
    texture.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,4,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(b'\0'+row for _ in range(4)),9))+chunk(b'IEND',b''))
    image=bpy.data.images.load(str(texture),check_existing=False); image.name=material_name; image.colorspace_settings.name='sRGB'; image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image; tex.interpolation='Closest'
    uvnode=mat.node_tree.nodes.new('ShaderNodeUVMap'); uvnode.uv_map='Palette'
    mat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector']); mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    return ModelTools(palette,mat,root,destination)

class ModelTools:
    def __init__(self,palette,material,root,destination):
        self.palette=palette; self.material=material; self.root=root; self.destination=destination; self.parts=[]
    def finish(self,obj,name,role):
        obj.name=name; bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        obj.data.materials.clear(); obj.data.materials.append(self.material)
        for layer in list(obj.data.uv_layers):obj.data.uv_layers.remove(layer)
        uv=obj.data.uv_layers.new(name='Palette')
        for loop in uv.data: loop.uv=((list(self.palette).index(role)*4+2)/64,.5)
        self.parts.append(obj); return obj
    def box(self,name,x,z,y,w,d,h,role,bevel=.035):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y)); obj=bpy.context.object; obj.dimensions=(w,d,h)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if bevel and min(w,d,h)>.14:
            mod=obj.modifiers.new('Deliberate soft edge','BEVEL'); mod.width=min(bevel,min(w,d,h)*.2); mod.segments=1
            bpy.ops.object.modifier_apply(modifier=mod.name)
        return self.finish(obj,name,role)
    def cylinder(self,name,x,z,y,radius,height,role,vertices=12):
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=height,location=(x,-z,y))
        return self.finish(bpy.context.object,name,role)
    def cone(self,name,x,z,y,r1,r2,height,role,vertices=9):
        bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=height,location=(x,-z,y))
        return self.finish(bpy.context.object,name,role)
    def ico(self,name,x,z,y,radius,role,scale=(1,1,1)):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=radius,location=(x,-z,y)); obj=bpy.context.object; obj.scale=scale
        return self.finish(obj,name,role)
    def beam(self,name,a,b,width,depth,role):
        delta=Vector((b[0]-a[0],-b[1]+a[1],b[2]-a[2]))
        obj=self.box(name,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,depth,delta.length,role,.018)
        obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler(); return obj
    def mesh(self,name,vertices,faces,role):
        mesh=bpy.data.meshes.new(name); mesh.from_pydata([(x,-z,y) for x,z,y in vertices],[],faces); mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new(name,mesh); bpy.context.scene.collection.objects.link(obj); return self.finish(obj,name,role)
    def anchor(self,name,x,z,y):
        obj=bpy.data.objects.new(name,None); bpy.context.scene.collection.objects.link(obj); obj.parent=self.root; obj.location=(x,-z,y); return obj
    def group(self,name):
        if not self.parts:return
        bpy.ops.object.select_all(action='DESELECT')
        for obj in self.parts:obj.select_set(True)
        bpy.context.view_layer.objects.active=self.parts[0]; bpy.ops.object.join(); obj=bpy.context.object; obj.name=name
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True); obj.parent=self.root; self.parts=[]
    def save(self,default_name):
        bpy.context.scene.frame_set(0); bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(self.destination/os.environ.get('ASSET_SOURCE_NAME',default_name)))
