"""Shared construction helpers for the versioned Glacier campus kit recipes.

Each asset owns its build.py, manifest, source, and guarded export. This module
contains art geometry only, not asset-delivery logic or gameplay behavior.
"""
import bpy, math, os
from pathlib import Path
from mathutils import Vector

PALETTE={'chalk':'#E2EDF0','shell':'#89A4B8','edge':'#ADC5D2','glass':'#305775','blue':'#659FCC','aqua':'#B1DFE8','ground':'#A5BFCB','path':'#D2E1E5','soil':'#7B9E9F','leaf':'#70B5B4','leaf_light':'#86C2BD','leaf_dark':'#609D9E','trunk':'#65918F','water':'#619FBE','wood':'#A6BBBE','tech':'#7E9EB0','signal':'#8CCBD8','tile_seam':'#7B9DB0'}
def build(asset_id,folder):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
    mat=bpy.data.materials.new('glacier_palette');mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.85
    color=mat.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Color'
    mat.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color'])
    palette=dict(PALETTE)
    if asset_id=='campus_base_hex':palette.update({'shell':'#24354E','chalk':'#6787A3','ground':'#354B64','tile_seam':'#577693'})
    if asset_id.startswith('campus_walk_'):palette.update({'path':'#48647D','edge':'#2D435C','chalk':'#577B95','signal':'#82DADD','tech':'#65859D','shell':'#25384F'})
    roles={k:i+1 for i,k in enumerate(palette)};parts=[]
    def rgba(role):
        h=palette[role];s=[int(h[i:i+2],16)/255 for i in (1,3,5)]
        return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in s)+(1,)
    def finish(obj,name,role):
        obj.name=name;bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        obj.data.materials.clear();obj.data.materials.append(mat)
        colors=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
        attrs=obj.data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
        for v in colors.data:v.color=rgba(role)
        for v in attrs.data:v.value=roles[role]
        parts.append(obj);return obj
    def mesh(name,verts,faces,role):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
        return finish(obj,name,role)
    def box(name,p,s,role,bevel=.025):
        x,d,h=p;bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-d,h));obj=bpy.context.object;obj.dimensions=s
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if bevel:
            mod=obj.modifiers.new('Soft edge','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
        return finish(obj,name,role)
    def prism(name,outline,bottom,top,role):
        n=len(outline);verts=[(x,-d,h) for h in (bottom,top) for x,d in outline]
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        return mesh(name,verts,faces,role)
    def ring(name,outer,inner,bottom,top,role):
        n=len(outer);verts=[(x,-d,h) for h in (bottom,top) for loop in (outer,inner) for x,d in loop];faces=[]
        for i in range(n):
            j=(i+1)%n;faces.extend([(i,j,j+2*n,i+2*n),(i+n,i+3*n,j+3*n,j+n),(i,i+n,j+n,j),(i+2*n,j+2*n,j+3*n,i+3*n)])
        return mesh(name,verts,faces,role)
    def clipped(w,d,c):return [(-w/2+c,-d/2),(w/2-c,-d/2),(w/2,-d/2+c),(w/2,d/2-c),(w/2-c,d/2),(-w/2+c,d/2),(-w/2,d/2-c),(-w/2,-d/2+c)]
    def ellipse(rx,rz,n=20):return [(rx*math.cos(i*2*math.pi/n),rz*math.sin(i*2*math.pi/n)) for i in range(n)]
    def anchor(name,p):
        obj=bpy.data.objects.new(name,None);scene.collection.objects.link(obj);obj.parent=root;obj.location=(p[0],-p[2],p[1])
    def ico(name,p,s,role='leaf'):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(p[0],-p[1],p[2]));obj=bpy.context.object;obj.scale=s;return finish(obj,name,role)
    def trunk(x,d,h,r=.14):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=r,depth=h,location=(x,-d,.28+h/2));finish(bpy.context.object,'Trunk','trunk')
    def planter(w,d):
        outline=clipped(w,d,.13);prism('Planter foundation',outline,0,.24,'edge')
        ring('Continuous planter rim',outline,clipped(w-.18,d-.18,.1),.24,.32,'chalk')
        prism('Planter soil',clipped(w-.18,d-.18,.1),.24,.29,'soil')
    def sweep(points):
        # A continuous dark deck with inset cyan rails and recessed shoulders.
        lanes=[-1.6,-1.51,-1.37,-1.30,1.30,1.37,1.51,1.6]
        top_roles=['edge','signal','shell','path','shell','signal','edge']
        n=len(points);wcount=len(lanes);offset=n*wcount
        verts=[(x+nx*w,-(z+nz*w),h) for h in (0,.08) for x,z,nx,nz in points for w in lanes]
        faces=[];colors=[]
        for i in range(n-1):
            for j,role in enumerate(top_roles):
                a=i*wcount+j;b=(i+1)*wcount+j
                faces.extend([(a,a+1,b+1,b),(a+offset,b+offset,b+offset+1,a+offset+1)])
                colors.extend(['edge',role])
            for j in (0,wcount-1):
                a=i*wcount+j;b=(i+1)*wcount+j
                faces.append((a,b,b+offset,a+offset));colors.append('edge')
        for i in (0,n-1):
            for j in range(wcount-1):
                a=i*wcount+j;faces.append((a,a+offset,a+offset+1,a+1));colors.append('edge')
        obj=mesh('Inset rail walkway',verts,faces,'path')
        for poly,role in zip(obj.data.polygons,colors):
            for li in poly.loop_indices:
                obj.data.color_attributes['Color'].data[li].color=rgba(role)
                obj.data.attributes['_palette_role'].data[li].value=roles[role]
    if asset_id=='campus_base_hex':
        radius=18
        outer=[(radius*math.cos(i*math.pi/3),radius*math.sin(i*math.pi/3)) for i in range(6)]
        inner=[((radius-.14)*math.cos(i*math.pi/3),(radius-.14)*math.sin(i*math.pi/3)) for i in range(6)]
        prism('Hex structural shell',outer,0,1.05,'shell')
        prism('Continuous pale trim',outer,1.05,1.13,'chalk')
        prism('Level campus surface',inner,1.13,1.20,'ground')
        ring('Flush joining surface',outer,inner,1.13,1.20,'ground')
        anchor('anchor_surface',(0,1.2,0))
        for i,name in enumerate(['ne','n','nw','sw','s','se']):
            angle=math.pi/6+i*math.pi/3
            anchor('anchor_edge_'+name,(radius*math.cos(math.pi/6)*math.cos(angle),1.2,radius*math.cos(math.pi/6)*math.sin(angle)))
    elif asset_id=='campus_platform':
        prism('Floating foundation',clipped(30,26,4),0,1.05,'shell')
        prism('Pale structural trim',clipped(30,26,4),1.05,1.14,'chalk')
        prism('Campus surface',clipped(29.8,25.8,3.94),1.14,1.2,'ground')
        ring('Perimeter inlay',clipped(29.8,25.8,3.94),clipped(29.5,25.5,3.85),1.2,1.225,'chalk')
        anchor('anchor_surface',(0,1.2,0))
    elif asset_id=='campus_lab':
        project=Path(__file__).resolve().parents[2]
        source=project/'blender/environment/campus_home_study/v01/campus_home_study_v01.blend'
        with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.objects=['Lab','anchor_ui','anchor_door_min','anchor_door_max']
        for obj in dst.objects:
            scene.collection.objects.link(obj);obj.parent=None;obj.location.z-=.65
            if obj.type=='MESH':
                bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
            obj.parent=root
        bpy.data.materials.remove(mat)
    elif asset_id in ('campus_walk_straight','campus_walk_short'):
        length=4 if asset_id.endswith('straight') else 2
        sweep([(0,-length/2,1,0),(0,length/2,1,0)])
        anchor('anchor_start',(0,.08,-length/2));anchor('anchor_end',(0,.08,length/2))
    elif asset_id=='campus_walk_corner':
        sweep([(0,0,1,0),(0,4,1,-1),(4,4,0,-1)])
        anchor('anchor_start',(0,.08,0));anchor('anchor_end',(4,.08,4))
    elif asset_id in ('campus_walk_bend','campus_walk_bend_45'):
        angle=math.pi/2 if asset_id.endswith('bend') else math.pi/4;steps=12 if angle>1 else 6
        sweep([(4-4*math.cos(angle*i/steps),4*math.sin(angle*i/steps),math.cos(angle*i/steps),-math.sin(angle*i/steps)) for i in range(steps+1)])
        anchor('anchor_start',(0,.08,0));anchor('anchor_end',(4-4*math.cos(angle),.08,4*math.sin(angle)))
    elif asset_id=='campus_walk_landing':
        # Flush 3.2 m throat expands into a small, closed destination court.
        outline=[(-1.6,0),(1.6,0),(2.4,1.2),(2.4,2.9),(1.7,3.6),(-1.7,3.6),(-2.4,2.9),(-2.4,1.2)]
        inner=[(-1.37,0),(1.37,0),(2.17,1.27),(2.17,2.80),(1.60,3.37),(-1.60,3.37),(-2.17,2.80),(-2.17,1.27)]
        prism('Arrival foundation',outline,0,.08,'edge')
        # Replace the exposed top with a seated deck; trim is deliberately inset.
        prism('Arrival deck',inner,.08,.084,'path')
        # Open throat: continuous side/back inlay, never a rail across the entry.
        for side in (-1,1):
            rail=[(side*1.51,0),(side*2.31,1.23),(side*2.31,2.86),(side*1.66,3.51),(0,3.51),(0,3.40),(side*1.61,3.40),(side*2.20,2.81),(side*2.20,1.26),(side*1.40,0)]
            prism('Arrival perimeter inlay',rail,.080,.084,'signal')
        anchor('anchor_start',(0,.08,0));anchor('anchor_arrival',(0,.084,2))
    elif asset_id=='campus_walk_junction':
        outline=[(-2,-1.6),(-1.6,-1.6),(-1.6,-2),(1.6,-2),(1.6,-1.6),(2,-1.6),(2,1.6),(-2,1.6)]
        prism('T junction',outline,0,.08,'path')
        # Continuous L-shaped shoulders and rails turn around both inner corners.
        box('Front shoulder',(0,1.45,.081),(4,.30,.002),'shell',0)
        box('Front cyan rail',(0,1.44,.084),(4,.14,.002),'signal',0)
        for side in (-1,1):
            shoulder=[(-2,-1.6),(-1.6,-1.6),(-1.6,-2),(-1.3,-2),(-1.3,-1.3),(-2,-1.3)]
            rail=[(-2,-1.51),(-1.51,-1.51),(-1.51,-2),(-1.37,-2),(-1.37,-1.37),(-2,-1.37)]
            prism('Branch shoulder',[(x*side,z) for x,z in shoulder],.080,.082,'shell')
            prism('Continuous branch rail',[(x*side,z) for x,z in rail],.082,.085,'signal')
        anchor('anchor_start',(-2,.08,0));anchor('anchor_end',(2,.08,0));anchor('anchor_branch',(0,.08,-2))
    elif asset_id=='campus_tree_round':
        planter(2,2);trunk(0,0,1.55);ico('Round crown',(0,0,2.43),(1.2,1.13,1.46));anchor('anchor_ui',(0,4.0,0))
    elif asset_id=='campus_tree_tall':
        planter(1.8,1.8);trunk(0,0,2.12,.13);ico('Tall crown',(0,0,3.04),(.88,.88,1.68),'leaf_light');anchor('anchor_ui',(0,4.9,0))
    elif asset_id=='campus_tree_cluster':
        planter(3.1,1.85)
        for x,d,h,s,role in [(-.72,.08,1.08,.80,'leaf'),(.55,-.17,1.42,.92,'leaf_dark')]:trunk(x,d,h,.10);ico('Cluster crown',(x,d,.28+h+.55),(s,s*.85,s*1.2),role)
        anchor('anchor_ui',(0,3.6,0))
    elif asset_id=='campus_pond':
        prism('Pond base',ellipse(3,1.85),0,.23,'edge')
        ring('Continuous pond rim',ellipse(3,1.85),ellipse(2.76,1.61),.23,.39,'chalk')
        prism('Still water',ellipse(2.76,1.61),.23,.31,'water')
        for x,d,w in [(-.8,-.25,1.0),(-.5,0,1.3),(.7,.55,.75)]:box('Quiet water line',(x,d,.312),(w,.035,.004),'aqua',.001)
        for x,d,s in [(-2.4,.5,.28),(-2.0,.9,.19),(2.15,-.7,.26)]:ico('Pond stone',(x,d,.35+s*.6),(s,s*.75,s*.6),'edge')
        anchor('anchor_ui',(0,.6,0))
    elif asset_id=='campus_solar':
        box('Solar footing',(0,0,.10),(3.65,2.8,.20),'edge',.055)
        angle=math.radians(25)
        for x in (-1.25,1.25):
            for d in (-.85,.85):
                h=1.2-d*math.tan(angle)-.055
                box('Panel support',(x,d,.20+(h-.20)/2),(.13,.16,h-.20),'glass',.015)
        def panel(name,x,d,height,size,role):
            p=(x,d*math.cos(angle)+height*math.sin(angle),1.2-d*math.sin(angle)+height*math.cos(angle))
            obj=box(name,p,size,role,.01);obj.rotation_euler.x=angle
        panel('Panel frame',0,0,0,(3.6,2.4,.14),'chalk')
        for x in (-1.29,-.43,.43,1.29):
            for d in (-.57,.57):panel('Photovoltaic cell',x,d,.084,(.80,1.06,.025),'glass')
        anchor('anchor_ui',(0,2.0,0))
    else:raise ValueError(asset_id)

    # Surface-applied wayfinding marks: a restrained open hexagon and paired
    # cyan dashes. These are deliberate thin paint layers, not structural joins.
    if asset_id.startswith('campus_walk_'):
        if asset_id in ('campus_walk_straight','campus_walk_short'):
            positions=[(0,0,0)]
        elif asset_id=='campus_walk_corner':
            positions=[(0,3.8,0)]
        elif asset_id in ('campus_walk_bend','campus_walk_bend_45'):
            theta=math.pi/4 if asset_id.endswith('bend') else math.pi/8
            positions=[(4-4*math.cos(theta),4*math.sin(theta),theta)]
        elif asset_id=='campus_walk_landing':positions=[(0,2,0)]
        else:positions=[(0,0,math.pi/2)]
        for x,d,angle in positions:
            outer=[(x+.30*math.cos(i*math.pi/3+angle),d+.30*math.sin(i*math.pi/3+angle)) for i in range(6)]
            inner=[(x+.24*math.cos(i*math.pi/3+angle),d+.24*math.sin(i*math.pi/3+angle)) for i in range(6)]
            ring('Hex wayfinding paint',outer,inner,.081,.086,'tech')
            for side in (-1,1):
                for along in (-.72,.72):
                    px=x+side*1.02*math.cos(angle)+along*math.sin(angle)
                    pd=d-side*1.02*math.sin(angle)+along*math.cos(angle)
                    paint=box('Deck panel joint',(px,pd,.083),(.46,.045,.004),'shell',0)
                    paint.rotation_euler.z=angle
    if parts:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in parts:obj.select_set(True)
        bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name=asset_id
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.parent=root
        obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':roles}
    # Keep only intended hierarchy; source-only studio data is not necessary here.
    scene.frame_set(0)
    destination=Path(os.environ.get('ASSET_BUILD_DIR',folder))/os.environ.get('ASSET_SOURCE_NAME',asset_id+'_v01.blend')
    destination.parent.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(destination))







