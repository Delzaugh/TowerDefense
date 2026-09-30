# Asset-local extended palette; shared family builder remains unchanged.
import bpy,bmesh,math
from pathlib import Path
from persona_quality import Maker
class AnalystMaker(Maker):
    def finish(self,output,source_name):
        scene=bpy.context.scene;m=self.m;roles=list(m['texturePalettes'][0]['roles'])
        width=m['texturePalettes'][0]['size'][0]
        atlas=bpy.data.images.new(self.kind+'_palette',width=width,height=4,alpha=True)
        pixels=[]
        for y in range(4):
            for x in range(width):
                c=m['texturePalettes'][0]['roles'][roles[min(x//4,len(roles)-1)]]['color'].lstrip('#');pixels.extend([int(c[i:i+2],16)/255 for i in (0,2,4)]+[1])
        atlas.pixels=pixels;atlas.pack();mats=[]
        for i in range(2):
            mat=bpy.data.materials.new(self.kind+('_palette' if i==0 else '_optics'));mat.use_nodes=True
            bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.40 if i==0 else .22
            bs.inputs['Specular IOR Level'].default_value=.27 if i==0 else .5
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=atlas;tex.interpolation='Closest'
            mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
            if i:mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.065
            mats.append(mat)
        bottom=min(v[2] for v in self.v);verts=[(x,y,z-bottom) for x,y,z in self.v]
        mesh=bpy.data.meshes.new(self.kind+'_quality_geometry');mesh.from_pydata(verts,[],self.f);mesh.update()
        obj=bpy.data.objects.new(self.kind+'_model',mesh);scene.collection.objects.link(obj)
        for mat in mats:mesh.materials.append(mat)
        uv=mesh.uv_layers.new(name='PaletteUV')
        for f,role,s,mi in zip(mesh.polygons,self.r,self.s,self.mi):
            f.material_index=mi;f.use_smooth=s
            for li in f.loop_indices:uv.data[li].uv=((roles.index(role)*4+2)/width,.5)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
        mesh.set_sharp_from_angle(angle=math.radians(55))
        for name,start,count in self.parts:obj.vertex_groups.new(name=name).add(list(range(start,start+count)),1,'REPLACE')
        root=bpy.data.objects.new('root',None);scene.collection.objects.link(root);obj.parent=root
        root['asset']=m['id']+'_v01';root['design']='Quality pass based on front and rear user concept sheets, 2026-09-18'
        height=max(v[2] for v in verts)
        for name,pos in [('anchor_ui',(0,0,height+.24)),('anchor_action',(0,-1.10,.68-bottom)),('anchor_target',(0,0,.85-bottom))]+([('anchor_aura',(0,0,.50-bottom))] if self.kind=='tester' else []):
            a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=pos;a.empty_display_size=.10
        scene.world=bpy.data.worlds.new('Authoring world');scene.world.color=(.25,.25,.25)
        scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
        bpy.context.view_layer.objects.active=obj;obj.select_set(True);scene.frame_set(0)
        for screen in bpy.data.screens:
            for area in screen.areas:
                if area.type=='VIEW_3D':area.spaces.active.shading.type='MATERIAL'
        out=Path(output);out.mkdir(parents=True,exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(out/source_name));mesh.calc_loop_triangles()
        print('QUALITY_MODEL',m['id'],len(mesh.loop_triangles),'triangles')
