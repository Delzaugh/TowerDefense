"""Second production pass: shaped shells, seated optics and referenced rear construction.
All dimensions are metres. Forward is Blender -Y / glTF +Z.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector, Matrix

PI=math.pi
def signpow(x,p):return math.copysign(abs(x)**p,x)
def ellipse(w,h,p=2.7,n=24):
    return [(w*.5*signpow(math.cos(2*PI*i/n),2/p),h*.5*signpow(math.sin(2*PI*i/n),2/p)) for i in range(n)]
def rounded(w,h,r,n=3):
    r=min(r,w*.49,h*.49);out=[]
    for x,z,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(n+1):
            t=math.radians(a+90*i/n);out.append((x+r*math.cos(t),z+r*math.sin(t)))
    return out
def matrix(c,axis='front',pitch=0,yaw=0):
    r=Matrix.Identity(3)
    if axis=='rear':r=Matrix.Rotation(PI,3,'Z')
    if axis=='right':r=Matrix.Rotation(PI/2,3,'Z')
    if axis=='left':r=Matrix.Rotation(-PI/2,3,'Z')
    if axis=='top':r=Matrix.Rotation(-PI/2,3,'X')
    r=r@Matrix.Rotation(pitch,3,'X')@Matrix.Rotation(yaw,3,'Z')
    return Matrix.Translation(Vector(c))@r.to_4x4()

class Maker:
    def __init__(self,m):
        self.m=m;self.kind=m['id'].replace('copilot_','')
        self.v=[];self.f=[];self.r=[];self.s=[];self.mi=[];self.parts=[]
    def add(self,name,v,f,role,smooth=False,optics=False,xf=None):
        if xf:v=[xf@Vector(p) for p in v]
        off=len(self.v);self.v.extend([tuple(p) for p in v]);self.f.extend([tuple(off+i for i in face) for face in f])
        self.r.extend([role]*len(f) if isinstance(role,str) else role)
        self.s.extend([smooth]*len(f));self.mi.extend([int(optics)]*len(f));self.parts.append((name,off,len(v)))
    def collect(self,o,name,role,smooth=False,optics=False):
        bpy.context.view_layer.update()
        self.add(name,[o.matrix_world@v.co for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons],role,smooth,optics)
        bpy.data.objects.remove(o,do_unlink=True)
    def box(self,name,c,size,role,bevel=.06,segments=2,rot=None):
        bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if bevel:
            mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=segments
            bpy.ops.object.modifier_apply(modifier=mod.name)
        if rot:o.rotation_euler=rot
        self.collect(o,name,role)
    def loft(self,name,rings,role,xf=None,smooth=False,cap=True):
        # rings: [(outline in XZ, local Y)]
        n=len(rings[0][0]);v=[(x,y,z) for outline,y in rings for x,z in outline];f=[]
        for j in range(len(rings)-1):
            f.extend([(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)])
        if cap:f.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+i for i in range(n))])
        self.add(name,v,f,role,smooth,False,xf)
    def panel(self,name,c,w,h,role,r=.10,depth=.07,axis='front',smooth=False):
        self.loft(name,[(rounded(w,h,r),depth/2),(rounded(w,h,r),-depth/2+.025),(rounded(w-.045,h-.045,max(.01,r-.02)),-depth/2)],role,matrix(c,axis),smooth)
    def poly(self,name,points,c,depth,role,axis='front',bevel=0):
        n=len(points);v=[(x,y,z) for y in (0,depth) for x,z in points]
        f=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        xf=matrix(c,axis)
        if not bevel:self.add(name,v,f,role,xf=xf);return
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
        o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.matrix_world=xf
        bpy.context.view_layer.objects.active=o
        mod=o.modifiers.new('Edge radius','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name);self.collect(o,name,role)
    def stroke(self,name,points,width,c,role,axis='front',depth=.014):
        # Mitered continuous stroke; no overlapping disconnected bars at elbows.
        a=[];b=[]
        for i,p in enumerate(points):
            p=Vector(p)
            before=(p-Vector(points[max(0,i-1)])).normalized() if i else (Vector(points[1])-p).normalized()
            after=(Vector(points[min(len(points)-1,i+1)])-p).normalized() if i<len(points)-1 else before
            n1=Vector((-before.y,before.x));n2=Vector((-after.y,after.x));bis=(n1+n2).normalized()
            offset=bis*(width*.5/max(.35,bis.dot(n1)))
            a.append(tuple(p+offset));b.append(tuple(p-offset))
        self.poly(name,a+list(reversed(b)),c,depth,role,axis)
    def optic(self,name,c,w,h,frame='graphite',round=False,gear=False,pitch=0,yaw=0,stroke=.09,slant=0):
        n=32 if gear else 24 if round else 16
        outline=ellipse(w,h,2,n) if round else rounded(w,h,min(w,h)*.25,3)
        outline=[(x*(1+slant*z/h),z) for x,z in outline];n=len(outline)
        if gear:outline=[(x*(1.025 if i%4 in (1,2) else 1),z*(1.025 if i%4 in (1,2) else 1)) for i,(x,z) in enumerate(outline)]
        innerx=1-2*stroke/w;innerz=1-2*stroke/h
        rings=[(1,1,.075), (1.025,1.025,.006),(.995,.995,-.06),(.94,.94,-.096),(innerx,innerz,-.096),(innerx,innerz,.07)]
        vs=[(x*sx,y,z*sz) for sx,sz,y in rings for x,z in outline];fs=[]
        for j in range(len(rings)):
            fs.extend([(j*n+i,j*n+(i+1)%n,((j+1)%len(rings))*n+(i+1)%n,((j+1)%len(rings))*n+i) for i in range(n)])
        xf=matrix(c,pitch=pitch,yaw=yaw)
        self.add(name+'_continuous_bezel',vs,fs,frame,True,xf=xf)
        # Lens has two curved support rings, closed back and softly convex center.
        vs=[]
        for scale,y in [(1,.02),(1,-.079),(.72,-.13),(.32,-.154)]:
            vs.extend([(x*innerx*scale,y,z*innerz*scale) for x,z in outline])
        vs.append((0,-.16,0));fs=[tuple(range(n-1,-1,-1))]
        for j in range(3):fs.extend([(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)])
        fs.extend([(3*n+i,3*n+(i+1)%n,4*n) for i in range(n)])
        self.add(name+'_convex_glass',vs,fs,'lens',True,True,xf)
    def disc(self,name,c,r,depth,role,axis='front',n=20):
        self.loft(name,[(ellipse(r*2,r*2,2,n),depth/2),(ellipse(r*2,r*2,2,n),-depth/2+.02),(ellipse(r*2-.035,r*2-.035,2,n),-depth/2)],role,matrix(c,axis),True)
    def eye(self,c,height=.30,width=.11):
        outline=rounded(width,height,width/2,3);n=len(outline)
        v=[(x,0,z) for x,z in outline]+[(x,-.015,z) for x,z in outline];f=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]
        f.extend([(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
        self.add('display_eye',v,f,'cyan',False,True,matrix(c))
    def shell(self,width=1.95,height=1.9,depth=1.65,p=2.6,rim='shell',lower=None):
        # One continuous manufactured skin: recessed display joins its inset lip;
        # no full helmet cube behind the screen, no intersecting face overlay.
        zc=height*.49;n=24
        levels=[(-.47,.84,.80),(-.42,.98,.91),(-.25,1,1),(0,1,1),(.27,.94,.96),(.43,.73,.78),(.49,.38,.45)]
        rings=[]
        for yy,ww,hh in levels:rings.append(([(x,z+zc) for x,z in ellipse(width*ww,height*hh,p,n)],yy*depth))
        v=[(x,y,z) for outline,y in rings for x,z in outline];fs=[];roles=[]
        for j in range(len(rings)-1):
            for i in range(n):
                f=(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i);fs.append(f)
                z=sum(v[k][2] for k in f)/4
                roles.append(lower if lower and z<height*.30 else 'shell')
        end=len(v);v.append((0,depth*.515,zc))
        for i in range(n):fs.append(((len(rings)-1)*n+i,(len(rings)-1)*n+(i+1)%n,end));roles.append(lower if lower and v[(len(rings)-1)*n+i][2]<height*.30 else 'shell')
        # Recessed screen perimeter has exactly shared boundaries with the body.
        previous=0
        for scale,y in [(1.005,-.493),(.91,-.51),(.875,-.487),(.58,-.515)]:
            start=len(v);v.extend([(x*scale,y*depth,(z-zc)*scale+zc) for x,z in rings[0][0]])
            for i in range(n):fs.append((previous+i,previous+(i+1)%n,start+(i+1)%n,start+i));roles.append(rim if scale>.90 else 'screen')
            previous=start
        center=len(v);v.append((0,-.526*depth,zc))
        for i in range(n):fs.append((previous+i,previous+(i+1)%n,center));roles.append('screen')
        self.add('continuous_shell_and_recessed_display',v,fs,roles,True)
        return -.526*depth
    def rear_hatch(self,c,w,h,role='shell',slots=2,slotrole='screen'):
        # A thick inset hatch with real boolean recesses and a darker inner well.
        self.panel('hatch_gasket',(c[0],c[1]-.015,c[2]),w+.05,h+.05,'shell_dark',r=.15,depth=.10,axis='rear')
        bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.dimensions=(w,.13,h)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        bevel=o.modifiers.new('Hatch corners','BEVEL');bevel.width=.095;bevel.segments=2;bpy.ops.object.modifier_apply(modifier=bevel.name)
        for i in range(slots):
            z=c[2]+(i-(slots-1)/2)*.175
            bpy.ops.mesh.primitive_cube_add(size=1,location=(c[0],c[1]+.065,z));cut=bpy.context.object;cut.dimensions=(w*.52,.16,.065)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            b=cut.modifiers.new('Rounded vent','BEVEL');b.width=.028;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
            bpy.context.view_layer.objects.active=o
            mod=o.modifiers.new('Recessed horizontal slot','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
            bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
            self.box('vent_dark_well',(c[0],c[1]+.034,z),(w*.53,.011,.067),slotrole,.018,1)
        self.collect(o,'rear_access_hatch',role)
    def ear(self,s,c=(0,.03,.91),w=.70,h=.70,outer='trim',inner='graphite',extent=1.22):
        axis='right' if s>0 else 'left'
        self.panel('ear_mount',(s*.96,c[1],c[2]),w*.88,h*.88,'graphite',.17,.21,axis)
        self.panel('ear_frame',(s*(extent-.10),c[1],c[2]),w,h,outer,.17,.23,axis)
        self.panel('ear_face',(s*extent,c[1],c[2]),w-.11,h-.11,inner,.14,.08,axis)
    def finish(self,output,source_name):
        scene=bpy.context.scene;m=self.m;roles=list(m['texturePalettes'][0]['roles'])
        atlas=bpy.data.images.new(self.kind+'_palette',width=32,height=4,alpha=True)
        pixels=[]
        for y in range(4):
            for x in range(32):
                c=m['texturePalettes'][0]['roles'][roles[x//4]]['color'].lstrip('#');pixels.extend([int(c[i:i+2],16)/255 for i in (0,2,4)]+[1])
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
            for li in f.loop_indices:uv.data[li].uv=((roles.index(role)*4+2)/32,.5)
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

def build(manifest_path,output,source_name):
    m=json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    bpy.ops.wm.read_factory_settings(use_empty=True);a=Maker(m);kind=a.kind
    if kind=='developer':
        fy=a.shell(1.86,1.76,1.64,2.55,'graphite','graphite')
        for s in (-1,1):
            a.eye((s*.23,fy-.015,.64),.30)
            a.optic('angular_coder_goggle',(s*.40,-.83,1.33),.77,.55,'graphite',pitch=-.16,yaw=s*.13,slant=.20)
            a.ear(s,c=(0,.06,.88),w=.74,h=.76,extent=1.13)
            # Curling code braces, correctly paired and contained within the ear.
            for k in (-1,1):
                pts=[(k*.17,.19),(k*.105,.17),(k*.105,.075),(k*.06,.03),(k*.045,0),(k*.06,-.03),(k*.105,-.075),(k*.105,-.17),(k*.17,-.19)]
                a.stroke('code_brace',pts,.035,(s*1.173,.06,.88),'trim','right' if s>0 else 'left')
        a.box('goggle_bridge',(0,-.88,1.34),(.18,.14,.13),'graphite',.035,2)
        # Three broad layered swept plates, rather than three vertical hair prongs.
        for i,(front,base,tip,width) in enumerate([(-.60,1.48,2.06,1.50),(-.02,1.40,1.85,1.55),(.29,1.27,1.63,1.46)]):
            rings=[]
            for y,w,z,th in [(front,width*.71,base,.15),(.38,width,base+.26,.145),(.98,width*.88,tip,.10),(1.04,width*.80,tip+.005,.04)]:
                rings.append(([(x,z+zz) for x,zz in rounded(w,th,.035,1)],y))
            a.loft('layered_swept_fin_'+str(i),rings,'shell',smooth=False)
            if i<2:a.box('fin_dark_radiator_'+str(i),(0,.68,tip-.21),(1.13,.38,.085),'graphite',.035,1)
        a.rear_hatch((0,.86,.48),1.05,.50,'graphite',2)
    elif kind=='tester':
        fy=a.shell(1.95,1.91,1.77,2.30,'trim','trim')
        for s in (-1,1):a.eye((s*.235,fy-.018,.66),.33)
        a.optic('small_test_lens',(-.55,-.85,1.44),.61,.64,'trim',True,pitch=-.12,yaw=-.10,stroke=.07)
        a.optic('precision_magnifier',(.37,-.88,1.49),.96,.99,'trim',True,True,pitch=-.13,yaw=.08,stroke=.10)
        a.box('lens_bridge',(-.11,-.90,1.45),(.27,.13,.09),'trim',.027,2)
        for s in (-1,1):
            a.ear(s,c=(0,.02,.90),w=.79,h=.79,outer='trim',inner='shell',extent=1.15)
            for k in (-1,1):a.stroke('test_bracket',[(k*.07,.19),(k*.16,.19),(k*.16,-.19),(k*.07,-.19)],.035,(s*1.193,.02,.90),'trim','right' if s>0 else 'left')
        a.disc('quality_badge_socket',(.66,-.745,.40),.205,.105,'trim')
        a.disc('quality_badge',(.66,-.811,.40),.162,.045,'shell_dark')
        a.stroke('check', [(-.085,.0),(-.022,-.06),(.091,.086)],.045,(.66,-.839,.40),'trim')
        a.rear_hatch((0,.89,.83),1.03,.79,'shell',0)
        a.panel('rear_lower_latch',(0,.872,.30),.43,.105,'trim',.028,.07,'rear')
    elif kind=='analyst':
        fy=a.shell(1.95,1.76,1.57,3.2,'shell')
        for s in (-1,1):
            a.eye((s*.225,fy-.017,.61),.29)
            a.optic('analyst_spectacle',(s*.435,-.81,1.27),.72,.72,'shell_dark',True,pitch=-.10,yaw=s*.12,stroke=.075)
        a.box('spectacle_bridge',(0,-.85,1.28),(.25,.115,.085),'shell_dark',.03,2)
        a.panel('top_inset_gasket',(0,-.015,1.744),.85,.53,'trim',.09,.032,'top')
        a.panel('top_inset',(0,-.015,1.764),.76,.44,'graphite',.075,.016,'top')
        a.ear(-1,c=(0,.0,.84),w=.66,h=.68,outer='shell_dark',inner='shell_dark',extent=1.09)
        a.ear(1,c=(0,-.005,.84),w=.77,h=.87,outer='shell',inner='screen',extent=1.11)
        a.poly('requirements_paper',[(-.23,-.30),(.22,-.30),(.22,.20),(.10,.31),(-.23,.31)],(1.158,-.005,.84),.02,'shell','right',.008)
        a.poly('folded_paper_corner',[(.10,.31),(.10,.20),(.22,.20)],(1.183,-.005,.84),.008,'trim','right')
        for z in (.90,1.01):a.panel('requirement_line',(1.188,-.055,z),.28,.031,'shell_dark',.014,.011,'right')
        # Pencil with graphite point, exposed wood, painted shaft and dark ferrule.
        pa=Vector((1.207,-.23,.53));pb=Vector((1.207,.19,.96));d=(pb-pa).normalized()
        for name,start,end,rad,role in [('pencil_shaft',pa+d*.095,pb-d*.06,.035,'detail'),('pencil_ferrule',pb-d*.06,pb,.039,'graphite')]:
            bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=rad,depth=(end-start).length,location=(start+end)/2);o=bpy.context.object;o.rotation_euler=Vector((0,0,1)).rotation_difference(d).to_euler();a.collect(o,name,role)
        bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.035,radius2=0,depth=.11,location=pa+d*.045);o=bpy.context.object;o.rotation_euler=Vector((0,0,1)).rotation_difference(-d).to_euler();a.collect(o,'wood_tip','trim')
        a.rear_hatch((0,.80,.82),1.19,1.03,'shell',1,'shell_dark')
    elif kind=='security':
        fy=a.shell(2.07,1.96,1.82,2.6,'trim','shell_dark')
        for s in (-1,1):
            a.eye((s*.24,fy-.021,.78),.31)
            a.optic('protective_goggle',(s*.41,-.90,1.45),.78,.55,'shell_dark',pitch=-.13,yaw=s*.12,stroke=.075,slant=.20)
            a.ear(s,c=(0,.03,.97),w=.96,h=1.13,outer='trim',inner='shell',extent=1.27)
            a.panel('ear_inset',(s*1.317,.07,.97),.55,.72,'shell_dark',.18,.03,'right' if s>0 else 'left')
            # Raised white armor band follows each shoulder from forehead to rear.
            yz=[(-.53,1.55),(-.22,1.77),(.26,1.76),(.62,1.53),(.80,1.08),(.74,.54),(.51,.29)]
            v=[]
            for inset in (0,.055):
                for side in (-1,1):
                    for y,z in yz:v.append((s*.78+side*.065,y,z-inset))
            n=len(yz);f=[]
            for i in range(n-1):f.extend([(i,i+1,n+i+1,n+i),(2*n+i,3*n+i,3*n+i+1,2*n+i+1),(i,2*n+i,2*n+i+1,i+1),(n+i,n+i+1,3*n+i+1,3*n+i)])
            f.extend([(0,n,3*n,2*n),(n-1,3*n-1,4*n-1,2*n-1)])
            a.add('wraparound_white_armor_band',v,f,'trim')
        # Substantial continuous brows and chin instead of flat white bars.
        a.poly('white_goggle_brow',[(-.89,.04),(-.66,.16),(-.16,.12),(0,.08),(.16,.12),(.66,.16),(.89,.04),(.87,-.12),(.70,-.12),(.65,.015),(.16,-.015),(.07,-.12),(-.07,-.12),(-.16,-.015),(-.65,.015),(-.70,-.12),(-.87,-.12)],(0,-1.012,1.61),.10,'trim',bevel=.025)
        a.panel('armored_chin',(0,-.765,.32),1.43,.53,'shell_dark',.19,.28)
        a.poly('shield_rim',[(-.17,.12),(-.06,.14),(0,.19),(.06,.14),(.17,.12),(.14,-.10),(0,-.21),(-.14,-.10)],(0,-.926,.37),.036,'trim',bevel=.014)
        a.poly('shield_inlay',[(-.12,.082),(0,.139),(.12,.082),(.096,-.071),(0,-.145),(-.096,-.071)],(0,-.971,.37),.017,'detail',bevel=.008)
        # Broad crest following the dome with dark recessed flanking supports.
        for s in (-1,1):a.box('crown_dark_rail',(s*.46,.08,1.92),(.24,.74,.15),'graphite',.06,2)
        a.loft('arched_blue_crown',[( [(x,z+zz) for x,zz in rounded(w,.12,.035,1)],y) for y,w,z in [(-.59,.62,1.72),(-.27,.68,1.94),(.25,.67,1.96),(.63,.55,1.70)]],'shell')
        a.panel('sensor_pod',(.89,-.22,1.64),.33,.32,'shell',.12,.46)
        a.optic('threat_detector',(.89,-.474,1.64),.25,.25,'trim',True,stroke=.035)
        a.rear_hatch((0,.94,.94),1.18,1.13,'shell',3)
    elif kind=='architect':
        fy=a.shell(2.19,1.66,1.78,4.8,'shell_dark')
        for s in (-1,1):
            a.eye((s*.245,fy-.02,.58),.28)
            a.optic('square_architect_goggle',(s*.43,-.875,1.20),.80,.50,'trim',pitch=-.07,yaw=s*.07,stroke=.085)
            # Four load-bearing corner blocks and stepped upper shoulders.
            for y in (-.63,.62):
                a.box('ivory_corner_bumper',(s*.88,y,.27),(.38,.45,.51),'trim',.075,2)
                a.box('stepped_shoulder',(s*.87,y*.71,1.34),(.48,.65,.43),'shell_dark',.11,2)
            a.disc('gold_side_collar',(s*1.09,.02,.79),.33,.23,'detail','right' if s>0 else 'left',24)
            a.disc('side_pivot',(s*1.23,.02,.79),.249,.07,'graphite','right' if s>0 else 'left',24)
        a.poly('open_handle_arch',[(-.88,-.27),(-.88,.10),(-.69,.27),(.69,.27),(.88,.10),(.88,-.27),(.61,-.27),(.61,.055),(-.61,.055),(-.61,-.27)],(0,-.14,1.89),.39,'trim',bevel=.045)
        a.box('instrument_mount',(0,.06,1.90),(.66,.64,.44),'trim',.075,2)
        a.panel('instrument_dark_seat',(0,.015,2.144),.53,.48,'shell_dark',.055,.085,'top')
        a.panel('instrument_glass',(0,.015,2.191),.37,.32,'lens',.025,.016,'top')
        a.panel('instrument_indicator',(0,-.015,2.207),.15,.07,'cyan',.018,.009,'top')
        a.rear_hatch((0,.915,.85),1.42,1.10,'shell',2)
    elif kind=='linter_agent':
        # Eight-sector lid with sloped shoulders and a recessed dark octagonal crown.
        def octa(r,z):return [(r*math.cos(2*PI*i/8+PI/8),r*math.sin(2*PI*i/8+PI/8),z) for i in range(8)]
        rings=[(.79,.02),(.95,.12),(1.02,.34),(1.02,.65),(1.12,.73),(1.07,.91),(.87,1.08),(.69,1.085)]
        v=[p for r,z in rings for p in octa(r,z)];f=[];rr=[]
        for j in range(len(rings)-1):
            for i in range(8):f.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i));rr.append('shell' if j>=3 else 'graphite')
        f.extend([tuple(range(7,-1,-1)),tuple(56+i for i in range(8))]);rr.extend(['graphite','graphite']);a.add('sculpted_octagonal_chassis',v,f,rr)
        a.disc('bottom_service_plate',(0,0,.038),.62,.05,'graphite','top',8)
        # Chunky front brow is a single sloping visor carrying recessed narrow optics.
        a.panel('visor_backing',(0,-.963,.73),1.62,.36,'graphite',.12,.15)
        for s in (-1,1):
            a.optic('slim_rule_scanner',(s*.42,-1.045,.77),.65,.27,'graphite',pitch=-.13,yaw=s*.18,stroke=.050,slant=.36)
            a.eye((s*.14,-.965,.39),.20,.085)
        a.panel('face_display',(0,-.92,.36),.62,.42,'screen',.15,.062)
        for i in range(8):
            t=2*PI*i/8+PI/8;axis='front';center=Vector((1.10*math.cos(t),1.10*math.sin(t),.49))
            xf=matrix(center,yaw=t+PI/2)
            a.loft('lime_rule_socket_'+str(i),[(rounded(.48,.45,.09),.13),(rounded(.48,.45,.09),-.10),(rounded(.43,.40,.075),-.15)],'shell',xf)
            a.loft('socket_inner_recess_'+str(i),[(rounded(.35,.32,.055),-.145),(rounded(.35,.32,.055),-.166),(rounded(.285,.255,.035),-.183)],'graphite',xf)
            # Recessed dog-bone port silhouette, no olive square labels.
            pts=[(-.09,-.063),(-.055,-.063),(-.035,-.04),(.035,-.04),(.055,-.063),(.09,-.063),(.09,.063),(.055,.063),(.035,.04),(-.035,.04),(-.055,.063),(-.09,.063)]
            vv=[xf@Vector((x,-.187,z)) for x,z in pts];a.add('dogbone_rule_port_'+str(i),vv,[tuple(range(len(vv)))],'screen')
            a.box('lid_dark_latch_'+str(i),(.87*math.cos(t),.87*math.sin(t),.988),(.22,.09,.027),'graphite',.018,1,rot=(0,0,t+PI/2))
        # Top service hatch: three coherent engraved channels meeting the center.
        for i in range(3):
            t=2*PI*i/3
            a.box('top_panel_groove_'+str(i),(.29*math.sin(t),.29*math.cos(t),1.089),(.017,.56,.007),'screen',.003,1,rot=(0,0,-t))
    else:raise ValueError(kind)
    a.finish(output,source_name)
