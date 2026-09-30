"""Original GitHub-inspired modular architecture. Coordinates are runtime X,Z,Y.
Shared implementation is deliberately separate from the permanent editable scenes.
"""
import bpy, bmesh, math, os, json, struct, zlib
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

PALETTE={'stucco':'#CAD1CE','trim':'#E2EDF0','stone':'#89A4B8','iron':'#232925','wood':'#A77B55','oak':'#CFAC77','orange':'#D86C35','orange_light':'#F19A50','slate':'#48647D','teal':'#82DADD','green':'#0FBF3E','cream':'#F2E3C9'}

class Kit:
    def __init__(self, asset, folder):
        bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
        bpy.context.scene.unit_settings.system='METRIC'; bpy.context.scene.unit_settings.scale_length=1
        self.asset=asset; self.folder=Path(os.environ.get('ASSET_BUILD_DIR',folder)); self.folder.mkdir(parents=True,exist_ok=True)
        self.root=bpy.data.objects.new('root',None); bpy.context.scene.collection.objects.link(self.root)
        self.root['art_direction']='Original friendly low-poly interpretation of public GitHub office references; not measured as-built architecture.'
        self.root['coordinates']='Y up, positive Z front, metres, base Y=0'
        self.groups={}; self.current='body'
        def chunk(k,d):return struct.pack('!I',len(d))+k+d+struct.pack('!I',zlib.crc32(k+d)&0xffffffff)
        row=bytes([int(list(PALETTE.values())[min(x//4,len(PALETTE)-1)][i:i+2],16) for x in range(64) for i in (1,3,5)])
        png=self.folder/'github_architecture_palette.png'; png.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,4,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(b'\0'+row for _ in range(4)),9))+chunk(b'IEND',b''))
        self.mat=bpy.data.materials.new('github_architecture_palette'); self.mat.use_nodes=True
        bs=self.mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.82
        im=bpy.data.images.load(str(png),check_existing=False); im.colorspace_settings.name='sRGB'; im.pack()
        tex=self.mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=im; tex.interpolation='Closest'
        self.mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        self.glass=bpy.data.materials.new('clear_architectural_glazing'); self.glass.use_nodes=True
        bs=self.glass.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(.55,.78,.82,.12); bs.inputs['Alpha'].default_value=.12; bs.inputs['Roughness'].default_value=.32
        self.glass.surface_render_method='DITHERED'
        self.glass.use_backface_culling=True

    def group(self,name): self.current=name
    def mesh(self,vs,fs,role):
        verts,faces,roles=self.groups.setdefault(self.current,([],[],[])); offset=len(verts)
        verts.extend((x,-z,y) for x,z,y in vs); faces.extend(tuple(i+offset for i in face) for face in fs); roles.extend([role]*len(fs))
    def prism(self,profile,cx,cz,tx,tz,nx,nz,depth,role):
        n=len(profile); vs=[]
        for dist in (-depth/2,depth/2):
            vs.extend((cx+u*tx+dist*nx,cz+u*tz+dist*nz,h) for u,h in profile)
        vectors=[Vector((u,h,0)) for u,h in profile]; tris=tessellate_polygon([vectors]); index={tuple(v):i for i,v in enumerate(vectors)}
        fs=[]
        for tri in tris:
            ids=tuple(v if isinstance(v,int) else index[tuple(v)] for v in tri); fs.append(tuple(reversed(ids))); fs.append(tuple(i+n for i in ids))
        fs.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)); self.mesh(vs,fs,role)
    def box(self,name,x,z,y,w,d,h,role,bevel=.025):
        c=min(bevel,w/5,d/5)
        p=[(-w/2+c,-d/2),(w/2-c,-d/2),(w/2,-d/2+c),(w/2,d/2-c),(w/2-c,d/2),(-w/2+c,d/2),(-w/2,d/2-c),(-w/2,-d/2+c)] if c>0 else [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]
        n=len(p);vs=[(x+a,z+b,y+dy) for dy in (-h/2,h/2) for a,b in p]; fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        self.mesh(vs,fs,role)
    def beam(self,name,a,b,w,d,role):
        delta=Vector((b[0]-a[0],b[1]-a[1],b[2]-a[2])); direction=delta.normalized(); cross=direction.cross(Vector((0,1,0)))
        if cross.length<.001:cross=direction.cross(Vector((1,0,0)))
        cross.normalize(); other=direction.cross(cross).normalized(); vs=[]
        for end in (Vector(a),Vector(b)):
            for q,r in ((-1,-1),(1,-1),(1,1),(-1,1)):
                v=end+cross*q*w/2+other*r*d/2; vs.append(tuple(v))
        self.mesh(vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],role)
    def cylinder(self,x,z,y,r,h,role,n=12):
        vs=[(x+r*math.cos(i*math.tau/n),z+r*math.sin(i*math.tau/n),y+dy) for dy in (-h/2,h/2) for i in range(n)]
        self.mesh(vs,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],role)
    def local_box(self,cx,cz,tx,tz,nx,nz,u,out,h,w,d,height,role):
        profile=[(u-w/2,h-height/2),(u+w/2,h-height/2),(u+w/2,h+height/2),(u-w/2,h+height/2)]
        self.prism(profile,cx+out*nx,cz+out*nz,tx,tz,nx,nz,d,role)
    def bay(self,cx,cz,tx,tz,nx,nz,base,width=3,height=5,entry=False):
        # Continuous stucco segments form a real opening, including a curved
        # intrados through the full .45 m wall, rather than a painted fake arch.
        if entry:
            for u in (-width/2+.22,width/2-.22):self.local_box(cx,cz,tx,tz,nx,nz,u,0,base+height/2,.44,.45,height,'stucco')
            self.local_box(cx,cz,tx,tz,nx,nz,0,0,base+4.5,width,.45,1,'stucco');return
        radius=.91; bottom=base+1.04; spring=base+3.08; top=base+height
        for u in (-width/2+(width/2-radius)/2,width/2-(width/2-radius)/2):
            self.local_box(cx,cz,tx,tz,nx,nz,u,0,base+height/2,width/2-radius,.45,height,'stucco')
        self.local_box(cx,cz,tx,tz,nx,nz,0,0,(base+bottom)/2,2*radius,.45,bottom-base,'stucco')
        curve=[(radius*math.cos(i*math.pi/12),spring+radius*math.sin(i*math.pi/12)) for i in range(13)]
        profile=[(-radius,top),(radius,top)]+curve
        self.prism(profile,cx,cz,tx,tz,nx,nz,.45,'stucco')
        # Shallow voussoir ring is a coherent segmented solid with no crossed bars.
        for i in range(12):
            a=i*math.pi/12;b=(i+1)*math.pi/12; r2=radius+.15
            p=[(radius*math.cos(a),spring+radius*math.sin(a)),(r2*math.cos(a),spring+r2*math.sin(a)),(r2*math.cos(b),spring+r2*math.sin(b)),(radius*math.cos(b),spring+radius*math.sin(b))]
            self.prism(p,cx+.24*nx,cz+.24*nz,tx,tz,nx,nz,.09,'trim')
        for u in (-radius-.07,radius+.07):self.local_box(cx,cz,tx,tz,nx,nz,u,.24,(bottom+spring)/2,.14,.10,spring-bottom,'trim')
        self.local_box(cx,cz,tx,tz,nx,nz,0,.27,bottom-.10,2*radius+.36,.72,.20,'trim')
        glass=[(-radius+.065,bottom+.07),(radius-.065,bottom+.07)]+[((radius-.065)*math.cos(i*math.pi/12),spring+(radius-.065)*math.sin(i*math.pi/12)) for i in range(13)]
        self.prism(glass,cx-.10*nx,cz-.10*nz,tx,tz,nx,nz,.024,'glass')
        self.local_box(cx,cz,tx,tz,nx,nz,0,-.062,(bottom+spring+radius)/2,.08,.10,spring+radius-bottom,'iron')
        for h in (bottom+.91,spring-.06):self.local_box(cx,cz,tx,tz,nx,nz,0,-.062,h,2*radius,.10,.08,'iron')
        for u in (-radius+.05,radius-.05):self.local_box(cx,cz,tx,tz,nx,nz,u,-.062,(spring+bottom)/2,.07,.10,spring-bottom,'iron')
    def save(self):
        for name,(verts,faces,roles) in self.groups.items():
            mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
            bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
            obj=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(obj);obj.parent=self.root
            mesh.materials.append(self.mat);mesh.materials.append(self.glass)
            uv=mesh.uv_layers.new(name='Palette')
            for poly,role in zip(mesh.polygons,roles):
                poly.material_index=1 if role=='glass' else 0
                u=.5 if role=='glass' else (list(PALETTE).index(role)*4+2)/64
                for loop in poly.loop_indices:uv.data[loop].uv=(u,.5)
        bpy.context.scene.frame_set(0);bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(self.folder/os.environ.get('ASSET_SOURCE_NAME',self.asset+'_v01.blend')))

def build(asset,folder):
    m=Kit(asset,folder);b=m.box
    if asset=='gh_warehouse':
        for level in range(3):
            base=level*5;height=5 if level<2 else 5.24
            for label,cx,cz,tx,tz,nx,nz,count in [('front',0,8.775,1,0,0,1,10),('back',0,-8.775,-1,0,0,-1,10),('sides',14.775,0,0,-1,1,0,6),('sides',-14.775,0,0,1,-1,0,6)]:
                m.group(f'level_{level}_{label}')
                for i in range(count):
                    if level==1 and label=='sides' and cx>0 and i in (2,3):continue
                    u=(i-(count-1)/2)*3;m.bay(cx+u*tx,cz+u*tz,tx,tz,nx,nz,base,3,height,entry=level==0 and label=='front' and i in (4,5))
                if level==1 and label=='sides' and cx>0:
                    for u in (-2.3,2.3):m.local_box(cx,cz,tx,tz,nx,nz,u,0,7.5,1.4,.45,5,'stucco')
                    m.local_box(cx,cz,tx,tz,nx,nz,0,0,9.40,3.2,.45,1.20,'stucco')
                    for u in (-1.65,1.65):m.local_box(cx,cz,tx,tz,nx,nz,u,.25,6.97,.15,.13,3.64,'trim')
                    m.local_box(cx,cz,tx,tz,nx,nz,0,.25,8.84,3.45,.13,.20,'trim')
                # Front/back trim continues across corners; side trim terminates
                # at the inner edge of those bands, a true butt join. This avoids
                # coincident top/end faces and flicker at all repeated corners.
                for h,d,thick,role in [(base+.16,.57,.32,'stone'),(base+4.72,.60,.18,'trim')]:
                    length=29.55+d if label!='sides' else 17.55-d
                    m.local_box(cx,cz,tx,tz,nx,nz,0,0,h,length,d,thick,role)
                if level==2:
                    for h,d,thick in [(14.86,.64,.24),(15.07,.78,.18)]:
                        length=29.55+d if label!='sides' else 17.55-d
                        m.local_box(cx,cz,tx,tz,nx,nz,0,0,h,length,d,thick,'trim')
        m.group('structural_corner_pilasters')
        for x in (-14.78,14.78):
            for z in (-8.78,8.78):
                b('',x,z,7.6,.58,.58,15.2,'stucco',.07)
                for h in (.23,5.10,10.10,14.99):b('',x,z,h,.69,.69,.22,'trim',.04)
    elif asset=='gh_facade_bay':
        m.group('facade');m.bay(0,0,1,0,0,1,0)
        b('',0,.015,.14,3.035,.55,.28,'stone');b('',0,.015,4.87,3.035,.55,.26,'trim')
    elif asset=='gh_container':
        m.group('body');b('',0,0,.11,6,3,.22,'iron');b('',0,0,.23,5.78,2.8,.07,'oak')
        for h,th in ((.69,.98),(2.695,.83)):b('',0,-1.44,h,5.85,.12,th,'orange',0)
        for x,w in ((-2.47,.91),(0,.85),(2.47,.91)):b('',x,-1.44,1.73,w,.12,1.10,'orange',0)
        for i in range(30):
            x=-2.82+i*.195
            if .425<abs(x)<1.975:
                for h,th in ((.76,.80),(2.66,.74)):b('',x,-1.355,h,.064,.07,th,'orange_light',.008)
            else:b('',x,-1.355,1.65,.064,.07,2.75,'orange_light',.008)
        for x in (-2.91,2.91):
            b('',x,0,1.65,.12,2.90,2.92,'orange',0)
            for i in range(14):b('',x+(-.075 if x>0 else .075),-1.32+i*.203,1.65,.055,.07,2.75,'orange_light',.008)
        for x in (-2.89,2.89):
            for z in (-1.39,1.39):
                b('',x,z,1.6,.22,.22,3.2,'orange_light',.025)
                for h in (.13,3.06):b('',x,z,h,.30,.30,.26,'iron',.025)
        b('',0,1.40,3.03,5.85,.22,.24,'orange_light');b('',0,-1.40,3.03,5.85,.22,.24,'orange_light')
        for x in (-1.2,1.2):
            for dx in (-.74,.74):b('',x+dx,-1.305,1.73,.07,.08,1.10,'iron',0)
            for h in (1.215,2.245):b('',x,-1.305,h,1.55,.08,.07,'iron',0)
            b('',x,-1.272,1.73,1.41,.025,.96,'glass',0)
            b('',x,-1.24,1.73,.06,.04,.96,'trim',0)
        m.group('roof');b('',0,0,3.14,5.78,2.82,.12,'orange',0)
        for i in range(28):b('',-2.7+i*.20,0,3.22,.065,2.74,.045,'orange_light',0)
    elif asset=='gh_atrium':
        m.group('base');b('',0,0,.09,14,14,.18,'trim',.09);b('',0,0,.205,13.7,13.7,.05,'oak',0)
        for label,cx,cz,tx,tz,nx,nz in [('front',0,6.90,1,0,0,1),('back',0,-6.90,-1,0,0,-1),('sides',6.90,0,0,-1,1,0),('sides',-6.90,0,0,1,-1,0)]:
            m.group(label)
            for i in range(8):
                u=-6.8+i*13.6/7
                if label=='sides' and cx<0 and -1.8<u<.25:
                    for h,th in ((2.515,4.93),(9.225,1.45)):m.local_box(cx,cz,tx,tz,nx,nz,u,0,h,.16,.20,th,'trim')
                else:m.local_box(cx,cz,tx,tz,nx,nz,u,0,5,.16,.20,9.9,'trim')
            for h in (.4,4.85,9.72):m.local_box(cx,cz,tx,tz,nx,nz,0,0,h,13.8,.25,.22,'iron')
            for i in range(7):
                u=-5.83+i*1.943
                for h in (2.60,7.25):
                    if label=='front' and i==3 and h<3:continue
                    if label=='sides' and cx<0 and h>5 and u+.88>-1.8 and u-.88<.25:
                        for a,c in ((u-.88,min(u+.88,-1.8)),(max(u-.88,.25),u+.88)):
                            if c>a:m.local_box(cx,cz,tx,tz,nx,nz,(a+c)/2,0,h,c-a,.025,4.3,'glass')
                        m.local_box(cx,cz,tx,tz,nx,nz,u,0,8.95,1.76,.025,.90,'glass');continue
                    m.local_box(cx,cz,tx,tz,nx,nz,u,0,h,1.76,.025,4.3,'glass')
            if label=='front':
                for u in (-1.00,1.00):m.local_box(cx,cz,tx,tz,nx,nz,u,.025,1.64,.16,.27,2.98,'iron')
                m.local_box(cx,cz,tx,tz,nx,nz,0,.025,3.20,2.10,.27,.18,'iron')
            if label=='sides' and cx<0:
                for u in (-1.8,.25):m.local_box(cx,cz,tx,tz,nx,nz,u,.025,6.86,.13,.27,3.20,'iron')
                m.local_box(cx,cz,tx,tz,nx,nz,-.775,.025,8.50,2.18,.27,.16,'iron')
        m.group('bridge_landing')
        b('',-5.80,-.875,5.19,2.10,2.25,.14,'iron',0);b('',-5.80,-.875,5.28,2.10,2.25,.04,'oak',0)
        for x in (-6.73,-4.82):
            for z in (-1.95,.17):b('',x,z,5.82,.075,.075,1.10,'iron',0)
        for z in (-1.95,):b('',-5.80,z,6.35,1.98,.11,.09,'wood',.01)
        b('',-4.82,-.875,6.35,.11,2.18,.09,'wood',.01)
        m.group('atrium_stairs')
        for i in range(25):
            z=6.37-i*.26;top=.23+(i+1)*.20
            b('',-5.75,z,top-.04,1.80,.28,.08,'oak',.015)
            b('',-5.75,z+.13,top-.10,1.80,.045,.20,'iron',0)
            if i%5==0 or i==24:
                for x in (-6.63,-4.87):b('',x,z,top+.50,.065,.065,1.00,'iron',0)
        for x in (-6.63,-4.87):
            m.beam('',(x,6.50,.30),(x,0,5.15),.10,.16,'iron')
            m.beam('',(x,6.37,1.43),(x,.13,6.23),.09,.09,'wood')
        m.group('seating')
        for i in range(4):
            z=-5.78+i*.88;height=(4-i)*.34
            b('',0,z,height/2+.24,8.4,.89,height,'trim',.025);b('',0,z,height+.28,8.4,.87,.08,'oak',.02)
        for x in (-6.68,6.68):
            for z in (-6.68,6.68):b('',x,z,5,.35,.35,10,'iron',.06)
        m.group('roof')
        for x in (-6.72,6.72):b('',x,0,9.82,.40,13.85,.30,'trim',.04)
        for z in (-6.72,6.72):b('',0,z,9.82,13.85,.40,.30,'trim',.04)
        for i in range(5):b('',-5.3+i*2.65,0,9.75,.13,13.35,.20,'oak',.02)
        b('',0,0,9.89,13.4,13.4,.03,'glass',0)
    elif asset=='gh_entry_portal':
        m.group('portal');b('',0,-.88,3.09,4.72,.16,.38,'iron',.02)
        b('',0,-.78,1.48,3.5,.026,2.78,'glass',0)
        for x in (-2.31,2.31):b('',x,-.86,1.66,.25,.30,3.32,'trim',.04)
        b('',0,-.86,3.29,4.9,.35,.25,'trim',.045)
        for x in (-1.65,0,1.65):b('',x,-.735,1.48,.075,.095,2.8,'iron',0)
        b('',0,-.735,.34,3.50,.095,.17,'iron',0)
        for x in (-.16,.16):b('',x,-.66,1.39,.07,.09,.48,'cream',.015)
        b('',0,0,3.44,5,2.2,.26,'trim',.07)
        for x in (-2.16,2.16):m.beam('',(x,-.75,2.87),(x,.89,3.31),.07,.07,'iron')
        b('',0,.93,3.57,4.55,.10,.05,'green',.005)
    elif asset=='gh_glass_partition':
        m.group('partition')
        for x in (-2.94,-1,1,2.94):b('',x,0,1.80,.12,.20,3.30,'iron',.014)
        for h in (.075,3.52):b('',0,0,h,6,.20,.15,'iron',.014)
        for x in (-1.96,1.96):b('',x,0,1.80,1.80,.025,3.35,'glass',0)
        for x in (-.5,.5):
            b('',x,0,1.80,.88,.025,3.30,'glass',0)
            b('',x,.03,.77,.88,.035,.46,'cream',0)
        b('',0,0,1.80,.075,.12,3.30,'iron',.01)
        for x in (-.15,.15):b('',x,.11,1.48,.06,.08,.36,'wood',.01)
        for x in (-2.94,2.94):b('',x,0,.05,.16,.2,.1,'trim',0)
    elif asset=='gh_roof_terrace':
        m.group('deck')
        # Fixed warehouse interface for the top 5 m flight, a genuine through-
        # opening in both structural slab and boards. No opaque backing remains.
        def roof_rectangle(cx,cz,w,d,y,h,role):
            x0=cx-w/2;x1=cx+w/2;z0=cz-d/2;z1=cz+d/2
            if x1<=11.1 or x0>=14.1 or z1<=-5.5 or z0>=1.25:
                b('',cx,cz,y,w,d,h,role,0);return
            for a,c in ((x0,min(x1,11.1)),(max(x0,14.1),x1)):
                if c>a:b('',(a+c)/2,cz,y,c-a,d,h,role,0)
            a=max(x0,11.1);c=min(x1,14.1)
            for za,zc in ((z0,min(z1,-5.5)),(max(z0,1.25),z1)):
                if zc>za:b('',(a+c)/2,(za+zc)/2,y,c-a,zc-za,h,role,0)
        roof_rectangle(0,0,30,18,.10,.20,'slate')
        for i in range(36):roof_rectangle(0,-8.75+i*.5,29.75,.485,.225,.05,'oak')
        # Stair's landing at worldY15.18 is followed by an intermediate step,
        # then the deck at15.49; neither rise exceeds .3 m.
        b('',12.6,-5.38,.08,2.90,.24,.16,'oak',0)
        m.group('rails')
        for x in (-14.7,14.7):
            b('',x,0,.72,.08,17.5,.065,'iron',0);b('',x,0,1.20,.15,17.5,.10,'wood',.02)
            for i in range(10):b('',x,-8.6+i*1.91,.72,.09,.09,1.12,'iron',.01)
        for z in (-8.7,8.7):
            b('',0,z,.72,29.5,.08,.065,'iron',0);b('',0,z,1.20,29.5,.15,.10,'wood',.02)
            for i in range(16):b('',-14.5+i*1.93,z,.72,.09,.09,1.12,'iron',.01)
        for x in (11.02,14.18):
            for z in (-5.5,-3.25,-1,1.25):b('',x,z,.79,.09,.09,1.08,'iron',.01)
            for y,role in ((.76,'iron'),(1.29,'wood')):b('',x,-2.125,y,.11,6.85,.07,role,.01)
        for y,role in ((.76,'iron'),(1.29,'wood')):b('',12.6,1.33,y,3.25,.11,.07,role,.01)
        m.group('pavilion')
        for x in (-11.5,-3.5):
            for z in (-6.5,-1.5):b('',x,z,1.92,.22,.22,3.40,'wood',.03)
        for z in (-6.5,-1.5):b('',-7.5,z,3.60,8.5,.26,.24,'wood',.035)
        m.group('roof')
        for i in range(11):b('',-11.6+i*.82,-4,3.73,.16,5.6,.14,'oak',.02)
        for x in (-11.5,-3.5):b('',x,-4,3.64,.20,5.6,.18,'wood',.025)
    elif asset=='gh_bridge':
        m.group('deck');b('',0,0,.12,8,3,.24,'iron',.025)
        for i in range(24):b('',-3.83+i*.333,0,.27,.323,2.92,.06,'oak',0)
        m.group('rails')
        for z in (-1.40,1.40):
            for i in range(5):b('',-3.90+i*1.95,z,1.80,.13,.13,3.42,'iron',.02)
            for h in (.75,1.30,3.28):b('',0,z,h,8,.13,.12,'wood' if h==1.30 else 'iron',.015)
            for i in range(4):
                for j in range(3):b('',-2.925+i*1.95,z,.86+j*.15,1.80,.018,.018,'iron',0)
            b('',0,z,.79,7.65,.025,.91,'glass',0)
        m.group('roof');b('',0,0,3.43,8,3,.14,'trim',.035)
        for i in range(6):b('',-3.35+i*1.34,0,3.33,.12,2.9,.15,'oak',.01)
    else:raise ValueError(asset)
    m.save()
