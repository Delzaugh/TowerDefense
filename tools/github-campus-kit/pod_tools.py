"""Owned mesh authoring helpers for the three reference-guided reading pods."""
import bpy, bmesh, math, os, struct, zlib
from pathlib import Path
from mathutils import Vector

PALETTE={'oak':'#BF9465','oak_edge':'#9C744C','grain':'#C8A274','walnut':'#835739','ivory':'#E5DBC4','fabric':'#A69A86','dark':'#232925','brick':'#A56548','mortar':'#C9B69C','gold':'#E9B864','green':'#70B5B4','blue':'#5579B8','bordeaux':'#7C354D','purple':'#8534F3','paper':'#F2F5F3','red':'#B84035'}

def rounded_rect(w,h,r,cy=0,segments=5):
    points=[]
    for cx,yy,a in [(w/2-r,cy+h/2-r,0),(-w/2+r,cy+h/2-r,90),(-w/2+r,cy-h/2+r,180),(w/2-r,cy-h/2+r,270)]:
        for j in range(segments+1):
            t=math.radians(a+j*90/segments);points.append((cx+r*math.cos(t),yy+r*math.sin(t)))
    return points

class Pod:
    def __init__(self,asset,folder):
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
        self.asset=asset;self.folder=Path(os.environ.get('ASSET_BUILD_DIR',folder));self.folder.mkdir(parents=True,exist_ok=True)
        self.root=bpy.data.objects.new('root',None);bpy.context.scene.collection.objects.link(self.root)
        self.root['design']='Original low-poly reading furniture from supplied GitHub office reference photos, 2026-09-30.'
        self.groups={};self.current='Oak shell and shelving';self.materials={}
        def chunk(k,d):return struct.pack('!I',len(d))+k+d+struct.pack('!I',zlib.crc32(k+d)&0xffffffff)
        row=bytes([int(list(PALETTE.values())[x//4][i:i+2],16) for x in range(64) for i in (1,3,5)])
        png=self.folder/(asset+'_palette.png');png.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,4,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(b'\0'+row for _ in range(4)),9))+chunk(b'IEND',b''))
        im=bpy.data.images.load(str(png),check_existing=False);im.colorspace_settings.name='sRGB';im.pack()
        for key,roughness in [('palette',.70),('fabric',.96),('warm_light',.65)]:
            mat=bpy.data.materials.new(asset+'_'+key);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=roughness
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
            if key=='warm_light':bs.inputs['Emission Color'].default_value=(1,.69,.32,1);bs.inputs['Emission Strength'].default_value=.60
            self.materials[key]=mat
    def group(self,name):self.current=name
    def mesh(self,name,vs,fs,role,kind='palette'):
        vertices,faces,roles=self.groups.setdefault((self.current,kind),([],[],[]));o=len(vertices)
        vertices.extend((x,-z,y) for x,z,y in vs);faces.extend(tuple(i+o for i in f) for f in fs);roles.extend([role]*len(fs))
    def box(self,name,x,z,y,w,d,h,role,bevel=.025,kind='palette'):
        c=min(bevel,w/5,d/5)
        p=[(-w/2+c,-d/2),(w/2-c,-d/2),(w/2,-d/2+c),(w/2,d/2-c),(w/2-c,d/2),(-w/2+c,d/2),(-w/2,d/2-c),(-w/2,-d/2+c)] if c else [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]
        n=len(p);vs=[(x+a,z+b,y+dy) for dy in (-h/2,h/2) for a,b in p];fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        self.mesh(name,vs,fs,role,kind)
    def profile(self,name,profile,x,z,depth,role,side=False,kind='palette'):
        from mathutils.geometry import tessellate_polygon
        n=len(profile);vs=[]
        for dist in (-depth/2,depth/2):vs.extend((x+dist,z+u,y) if side else (x+u,z+dist,y) for u,y in profile)
        ps=[Vector((u,y,0)) for u,y in profile];lookup={tuple(v):i for i,v in enumerate(ps)};fs=[]
        for tri in tessellate_polygon([ps]):
            ids=tuple(v if isinstance(v,int) else lookup[tuple(v)] for v in tri);fs.extend([tuple(reversed(ids)),tuple(i+n for i in ids)])
        fs.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n));self.mesh(name,vs,fs,role,kind)
    def ring(self,name,outer,inner,x,z,depth,role,side=False,kind='palette'):
        n=len(outer);assert len(inner)==n
        vs=[]
        for dist in (-depth/2,depth/2):
            vs.extend((x+dist,z+u,y) if side else (x+u,z+dist,y) for u,y in outer+inner)
        fs=[]
        for i in range(n):
            j=(i+1)%n;fs.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
        self.mesh(name,vs,fs,role,kind)
    def cylinder(self,name,x,z,y,r,h,role,n=20,axis='y',kind='palette'):
        vs=[]
        for t in (-h/2,h/2):
            for i in range(n):
                a=i*math.tau/n;u=r*math.cos(a);v=r*math.sin(a)
                vs.append((x+u,z+v,y+t) if axis=='y' else ((x+u,z+t,y+v) if axis=='z' else (x+t,z+u,y+v)))
        self.mesh(name,vs,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],role,kind)
    def cone(self,name,x,z,y,r1,r2,h,role,n=16):
        vs=[(x+r*math.cos(i*math.tau/n),z+r*math.sin(i*math.tau/n),y+t) for r,t in [(r1,-h/2),(r2,h/2)] for i in range(n)]
        self.mesh(name,vs,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],role)
    def sphere(self,name,x,z,y,s,role,n=14,rings=8):
        vs=[]
        for row in range(rings+1):
            theta=math.pi*row/rings
            for j in range(n):
                a=j*math.tau/n;vs.append((x+s[0]*math.sin(theta)*math.cos(a),z+s[1]*math.sin(theta)*math.sin(a),y+s[2]*math.cos(theta)))
        fs=[]
        for row in range(rings):
            for j in range(n):fs.append((row*n+j,row*n+(j+1)%n,(row+1)*n+(j+1)%n,(row+1)*n+j))
        self.mesh(name,vs,fs,role)
    def beam(self,name,a,b,width,role):
        d=Vector(b)-Vector(a);u=d.cross(Vector((0,1,0)))
        if u.length<.001:u=d.cross(Vector((1,0,0)))
        u.normalize();v=d.normalized().cross(u);vs=[]
        for end in (Vector(a),Vector(b)):
            for q,r in [(-1,-1),(1,-1),(1,1),(-1,1)]:vs.append(tuple(end+u*q*width/2+v*r*width/2))
        self.mesh(name,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],role)
    def anchor(self,name,x,z,y):
        o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);o.parent=self.root;o.location=(x,-z,y)
    def save(self):
        for (name,kind),(vs,fs,roles) in self.groups.items():
            me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();me.materials.append(self.materials[kind]);uv=me.uv_layers.new(name='Palette')
            for poly,role in zip(me.polygons,roles):
                for j in poly.loop_indices:uv.data[j].uv=((list(PALETTE).index(role)*4+2)/64,.5)
            bm=bmesh.new();bm.from_mesh(me)
            bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
            ob=bpy.data.objects.new(name+' '+kind,me);bpy.context.scene.collection.objects.link(ob);ob.parent=self.root
        bpy.context.scene.frame_set(0);bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(self.folder/os.environ.get('ASSET_SOURCE_NAME',self.asset+'_v01.blend')))
