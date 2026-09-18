"""Developer spec-sheet refinement. Only this asset uses this recipe.

Three swept cooling vanes, a beveled screen/chin, seated trapezoidal goggles,
octagonal ivory temple housings and correctly paired code braces.
"""
import bpy, bmesh, json, math
from pathlib import Path
from persona_quality import Maker, matrix, rounded, ellipse


def chamfer(w,h,c):
    return [(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),
            (-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c)]


class Developer(Maker):
    def finish(self,output,source_name):
        super().finish(output,source_name)
        obj=bpy.data.objects['developer_model']
        # The shared auto-smooth operation smooths every polygon. Restore crisp
        # manufactured planes here; interpolate only the convex optical glass.
        lens_groups={g.index for g in obj.vertex_groups if 'inset_teal_lens' in g.name}
        lens_verts={v.index for v in obj.data.vertices if any(g.group in lens_groups for g in v.groups)}
        for face in obj.data.polygons:
            face.use_smooth=all(i in lens_verts for i in face.vertices)
        bpy.data.materials['developer_palette'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.5
        bpy.data.materials['developer_optics'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.28
        bpy.context.scene['reference']='Developer detail spec sheet, supplied 2026-09-18'
        bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))

    def body(self):
        # Shared shell/display boundary; the bottom rim thickens into a chin.
        n=24;zc=.80
        rings=[]
        boundaries=[.37,.30,.25,.34,1.18,1.18]
        for y,w,h,z in [(-.70,1.67,1.47,.78),(-.52,1.84,1.54,.81),
                         (-.15,1.90,1.44,.78),(.28,1.88,1.305,.7975),
                         (.56,1.76,1.145,.8175),(.76,1.38,1.00,.79)]:
            rings.append(([(x,zz+z) for x,zz in ellipse(w,h,3.0,n)],y))
        v=[(x,y,z) for outline,y in rings for x,z in outline];f=[];roles=[];cuts={};cut_edges={}
        for j in range(len(rings)-1):
            for i in range(n):
                q=(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
                # Split the shell at a shared sloping color boundary. No added
                # backing plates or stair-step per-face paint around the ear.
                signed={k:v[k][2]-boundaries[j if k//n==j else j+1] for k in q}
                for positive,role in [(True,'shell'),(False,'graphite')]:
                    clipped=[]
                    for aa,bb in zip(q,q[1:]+q[:1]):
                        da,db=signed[aa],signed[bb]
                        inside=da>=0 if positive else da<=0
                        if inside:clipped.append(aa)
                        if da*db<0:
                            t=da/(da-db);p=tuple(v[aa][k]+t*(v[bb][k]-v[aa][k]) for k in range(3))
                            key=tuple(round(c,7) for c in p)
                            if key not in cuts:cuts[key]=len(v);v.append(p)
                            cut_edges[tuple(sorted((aa,bb)))]=cuts[key]
                            clipped.append(cuts[key])
                    if len(clipped)>=3:f.append(tuple(clipped));roles.append(role)
        f.append(tuple((len(rings)-1)*n+i for i in range(n)));roles.append('graphite')
        previous=0
        for w,h,y,z in [(1.69,1.47,-.747,.78),(1.56,1.30,-.805,.80),
                         (1.45,1.20,-.782,.83),(1.03,.86,-.819,.83)]:
            start=len(v);v.extend([(x,y,zz+z) for x,zz in ellipse(w,h,3,n)])
            for i in range(n):
                q=(previous+i,previous+(i+1)%n,start+(i+1)%n,start+i)
                f.append(q)
                low=sum(v[k][2] for k in q)/4<.49
                roles.append(('detail' if low and w==1.56 else 'graphite') if low and w>=1.45 else ('shell' if w>1.5 else 'screen'))
            previous=start
        center=len(v);v.append((0,-.84,.83))
        for i in range(n):f.append((previous+i,previous+(i+1)%n,center));roles.append('screen')
        # Propagate boundary splits into the adjacent front lip and back cap.
        # The color division remains one welded shell without T-junctions.
        conforming=[]
        for face in f:
            polygon=[]
            for aa,bb in zip(face,face[1:]+face[:1]):
                polygon.append(aa)
                midpoint=cut_edges.get(tuple(sorted((aa,bb))))
                if midpoint is not None:polygon.append(midpoint)
            conforming.append(tuple(polygon))
        self.add('faceted_helmet_display_and_chin',v,conforming,roles,False)

    def goggle(self,s):
        outline=chamfer(.74,.54,.10)
        outline=[(x*(1+.18*z/.56),z) for x,z in outline];n=len(outline)
        rings=[(1,1,.095),(1.03,1.03,-.018),(.94,.94,-.078),(.76,.70,-.078),(.74,.68,.056)]
        v=[(x*sx,y,z*sz) for sx,sz,y in rings for x,z in outline];f=[];roles=[]
        for j in range(len(rings)):
            for i in range(n):
                f.append((j*n+i,j*n+(i+1)%n,((j+1)%len(rings))*n+(i+1)%n,((j+1)%len(rings))*n+i))
                roles.append('detail' if j==1 else 'graphite')
        xf=matrix((s*.425,-.826,1.24),pitch=-.22,yaw=s*.14)
        self.add('goggle_'+str(s)+'_beveled_frame',v,f,roles,False,xf=xf)
        v=[]
        for scale,y in [(1,.038),(1,-.064),(.77,-.091),(.30,-.108)]:
            v.extend([(x*.758*scale,y,z*.698*scale) for x,z in outline])
        f=[tuple(range(n-1,-1,-1))]
        for j in range(3):
            f.extend([(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)])
        f.append(tuple(3*n+i for i in range(n)))
        self.add('goggle_'+str(s)+'_inset_teal_lens',v,f,'lens',True,True,xf)

    def temple(self,s):
        axis='right' if s==1 else 'left';cy=.005;cz=.69
        # Nested beveled solids seated into one another. Symbols on outer plane.
        for name,x,w,h,dep,role,c in [
            ('temple_mount',.945,.78,.81,.17,'graphite',.16),
            ('ivory_temple_housing',1.045,.95,.96,.22,'trim',.20),
            ('temple_graphite_inlay',1.166,.73,.75,.038,'graphite',.155)]:
            self.loft(name+str(s),[(chamfer(w-.04,h-.04,c-.02),dep/2),
                (chamfer(w,h,c),dep/2-.025),(chamfer(w,h,c),-dep/2+.035),
                (chamfer(w-.055,h-.055,c-.02),-dep/2)],role,matrix((s*x,cy,cz),axis))
        for k in (-1,1):
            # Opening ends face inward: { } from either external temple view.
            pts=[(k*.085,.16),(k*.142,.16),(k*.151,.135),(k*.151,.052),
                 (k*.182,0),(k*.151,-.052),(k*.151,-.135),(k*.142,-.16),(k*.085,-.16)]
            pts=[(x*1.10,z*1.12) for x,z in pts]
            self.stroke('code_brace_'+str(s)+'_'+str(k),pts,.043,(s*1.189,cy,cz),'trim',axis,.008)

    def goggle_arm(self,s):
        # A substantial swept optical housing, connected to the outer bezel.
        yz=[(-.76,1.49),(-.40,1.45),(-.455,1.275),(-.65,1.17),(-.81,1.205)]
        vertices=[(s*(.77+.13*(y+.81)/.41-inset),y,z) for inset in (.145,0) for y,z in yz];n=len(yz)
        faces=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]
        faces.extend([(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
        mesh=bpy.data.meshes.new('goggle_side_housing');mesh.from_pydata(vertices,[],faces);mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('goggle_side_housing',mesh);bpy.context.collection.objects.link(obj)
        bpy.context.view_layer.objects.active=obj
        bevel=obj.modifiers.new('Housing edge','BEVEL');bevel.width=.022;bevel.segments=1
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        self.collect(obj,'swept_goggle_side_housing_'+str(s),'graphite')

    def fin(self,name,sections,role='shell'):
        # Chamfered volume; each root is buried within the shared orange shell.
        rings=[]
        for y,w,bottom,top in sections:
            h=top-bottom;outline=chamfer(w,h,min(.035,h*.25))
            outline=[(x*(.84 if z>0 else 1),z) for x,z in outline]
            rings.append(([(x,z+(top+bottom)/2) for x,z in outline],y))
        self.loft(name,rings,role,smooth=False)

    def cooling_web(self,name,lower,upper,start,end):
        # Seated core with continuous thin lateral lips. The exposed lips flare
        # 8 degrees upward and sweep 10 degrees aft past the orange upper edge.
        def sample(sections,y):
            for a,b in zip(sections,sections[1:]):
                if a[0]<=y<=b[0]:
                    t=(y-a[0])/(b[0]-a[0])
                    return [a[i]+t*(b[i]-a[i]) for i in (1,2,3)]
            raise ValueError('Web station outside fin')
        verts=[]
        stations=sorted({start,end,*[s[0] for s in lower+upper if start<s[0]<end]})
        for y in stations:
            lw,lb,lt=sample(lower,y);uw,ub,ut=sample(upper,y)
            inner=min(lw,uw)*.34
            reveal=min(1,max(0,(y-start)/.30))
            outer=inner+.005+(uw*.5+.075-inner)*reveal
            lip=ub-.026;bottom=min(lt-.028,lip-.052);top=max(ub+.028,lt+.018)
            lift=(outer-inner)*math.tan(math.radians(8))
            outline=[(outer,lip+lift),(inner,lip),(inner,top),(-inner,top),
                     (-inner,lip),(-outer,lip+lift),(-outer,lip+lift-.036),
                     (-inner,lip-.036),(-inner,bottom),(inner,bottom),
                     (inner,lip-.036),(outer,lip+lift-.036)]
            for x,z in outline:
                sweep=max(0,abs(x)-inner)*math.tan(math.radians(10))
                verts.append((x,y+sweep,z))
        n=12;faces=[]
        for j in range(len(stations)-1):
            faces.extend([(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)])
        faces.extend([tuple(range(n-1,-1,-1)),tuple((len(stations)-1)*n+i for i in range(n))])
        self.add(name,verts,faces,'graphite',False)

    def rear_casing(self):
        # One large fitted service panel, with shallow true vent recesses.
        points=chamfer(1.34,.95,.22);n=len(points)
        v=[(x,y,z+.79) for y in (.66,.795) for x,z in points]
        f=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]
        f.extend([(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
        mesh=bpy.data.meshes.new('rear_casing');mesh.from_pydata(v,[],f);mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
        o=bpy.data.objects.new('rear_casing',mesh);bpy.context.collection.objects.link(o)
        bpy.context.view_layer.objects.active=o
        bevel=o.modifiers.new('Manufactured edge','BEVEL');bevel.width=.035;bevel.segments=1
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        for z in (.61,.79):
            bpy.ops.mesh.primitive_cube_add(size=1,location=(0,.796,z));cut=bpy.context.object;cut.dimensions=(.53,.11,.061)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            bevel=cut.modifiers.new('Vent corners','BEVEL');bevel.width=.017;bevel.segments=1
            bpy.ops.object.modifier_apply(modifier=bevel.name)
            bpy.context.view_layer.objects.active=o
            mod=o.modifiers.new('Cooling recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
            bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
            self.box('vent_well',(0,.769,z),(.50,.008,.052),'screen',.014,1)
        self.collect(o,'fitted_rear_casing','graphite')


def build(manifest_path,output,source_name):
    m=json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    bpy.ops.wm.read_factory_settings(use_empty=True);a=Developer(m);a.body()
    for s in (-1,1):
        a.eye((s*.238,-.837,.59),.285,.10)
        a.goggle(s);a.goggle_arm(s);a.temple(s)
    a.box('goggle_bridge',(0,-.864,1.22),(.16,.115,.12),'graphite',.024,1)
    # Narrow highest crest and progressively wider/lower cooling vanes.
    crown=[
        (-.65,.43,1.40,1.49),(-.39,.76,1.47,1.70),(-.08,.80,1.43,1.91),
        (.40,.68,1.83,2.075),(.81,.43,2.045,2.15),(1.08,.19,2.12,2.17),
        (1.25,.035,2.158,2.17)]
    middle=[
        (-.37,1.27,1.20,1.45),(-.02,1.57,1.20,1.63),(.39,1.55,1.28,1.79),
        (.79,1.16,1.76,1.88),(1.07,.67,1.87,1.92),(1.30,.10,1.915,1.927)]
    lower=[
        (-.06,1.65,.99,1.23),(.25,1.77,1.13,1.39),(.56,1.65,1.17,1.50),
        (.85,1.30,1.49,1.59),(1.09,.79,1.585,1.63),(1.31,.14,1.628,1.64)]
    a.fin('crown_swept_fin',crown)
    a.fin('middle_swept_fin',middle)
    a.fin('lower_swept_fin',lower)
    a.cooling_web('upper_integrated_cooling_core',middle,crown,.18,.86)
    a.cooling_web('lower_integrated_cooling_core',lower,middle,.13,.88)
    a.rear_casing()
    a.finish(output,source_name)
