"""Concept-sheet Persona family. Shared geometry recipe; .blend remains editable.

Blender coordinates: X right, -Y forward, Z up. No gameplay behavior.
Each closed component has its own named vertex group in the assembled mesh.
"""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector, Matrix

def build(manifest_path, output, source_name):
    m=json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    kind=m['id'].replace('copilot_','')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
    scene.render.fps=24
    roles=list(m['texturePalettes'][0]['roles'])
    atlas=bpy.data.images.new(kind+'_palette',width=32,height=4,alpha=True)
    pixels=[]
    for y in range(4):
        for x in range(32):
            c=m['texturePalettes'][0]['roles'][roles[x//4]]['color'].lstrip('#')
            pixels.extend([int(c[i:i+2],16)/255 for i in (0,2,4)]+[1])
    atlas.pixels=pixels; atlas.pack()
    mats=[]
    for i in range(2):
        mat=bpy.data.materials.new(kind+('_palette' if i==0 else '_optics'))
        mat.use_nodes=True
        bs=mat.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Roughness'].default_value=.52 if i==0 else .26
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=atlas;tex.interpolation='Closest'
        mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        if i:
            mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color'])
            bs.inputs['Emission Strength'].default_value=.12
        mats.append(mat)
    V=[];F=[];R=[];S=[];MI=[];parts=[]
    def geom(name,vs,fs,role,smooth=False,optics=False):
        if name.startswith(('face_screen','continuous_face_surround','goggle_','cyan_eye')) and kind!='linter_agent':
            # Wrap the face assembly back into the shell at its perimeter.
            vs=[(x,y+.06*(x/.88)**2,z) for x,y,z in vs]
        off=len(V);V.extend([tuple(v) for v in vs]);F.extend([tuple(off+j for j in f) for f in fs])
        R.extend([role]*len(fs));S.extend([smooth]*len(fs));MI.extend([int(optics)]*len(fs))
        parts.append((name,off,len(vs)))
    def collect(o,name,role,smooth=False,optics=False):
        bpy.context.view_layer.update()
        geom(name,[o.matrix_world@v.co for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons],role,smooth,optics)
        bpy.data.objects.remove(o,do_unlink=True)
    def box(name,p,size,role,bevel=.06,segments=2,rotation=None,smooth=False):
        bpy.ops.mesh.primitive_cube_add(size=1,location=p)
        o=bpy.context.object;o.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if bevel:
            mod=o.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=segments
            bpy.ops.object.modifier_apply(modifier=mod.name)
        if rotation is not None:o.rotation_euler=rotation
        collect(o,name,role,smooth)
    def rr(w,h,r,n=3):
        r=min(r,w/2,h/2)
        points=[]
        for cx,cz,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
            for j in range(n+1):
                t=math.radians(a+j*90/n)
                points.append((cx+r*math.cos(t),cz+r*math.sin(t)))
        return points
    def plate(name,c,w,h,r,depth,role,bevel=.025,optics=False):
        x,y,z=c
        outlines=[(rr(w,h,r),y+depth/2),(rr(w,h,r),y-depth/2+bevel),(rr(w-2*bevel,h-2*bevel,max(.005,r-bevel)),y-depth/2)]
        vs=[(x+a,yy,z+b) for outline,yy in outlines for a,b in outline];n=len(outlines[0][0])
        fs=[tuple(range(n-1,-1,-1))]
        if name=='face_screen':
            # Interior support loops keep a curved screen tessellated coherently;
            # a warped ngon would bridge straight across and intersect the shell.
            vs.extend([(x+a*.55,y-depth/2,z+b*.55) for a,b in outlines[2][0]])
            vs.append((x,y-depth/2,z))
            for i in range(n):
                fs.append((2*n+i,2*n+(i+1)%n,3*n+(i+1)%n,3*n+i))
                fs.append((3*n+i,3*n+(i+1)%n,4*n))
        elif name.startswith('goggle_lens'):
            vs.append((x,y-depth/2-.045,z))
            fs.extend([(2*n+i,2*n+(i+1)%n,3*n) for i in range(n)])
        else:fs.append(tuple(2*n+i for i in range(n)))
        for j in range(2):
            for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        geom(name,vs,fs,role,name.startswith('goggle_lens'),optics)
    def ring(name,c,w,h,r,stroke,depth,role,n=3):
        x,y,z=c;bevel=min(.025,stroke*.23)
        specs=[(w,h,r,y+depth/2),(w,h,r,y-depth/2+bevel),(w-2*bevel,h-2*bevel,r-bevel,y-depth/2),
               (w-2*stroke,h-2*stroke,max(.018,r-stroke),y-depth/2),(w-2*stroke,h-2*stroke,max(.018,r-stroke),y+depth/2)]
        vs=[]
        for ww,hh,rad,yy in specs:vs.extend([(x+a,yy,z+b) for a,b in rr(ww,hh,rad,n)])
        count=len(vs)//len(specs);fs=[]
        for j in range(len(specs)):
            for i in range(count):fs.append((j*count+i,j*count+(i+1)%count,((j+1)%len(specs))*count+(i+1)%count,((j+1)%len(specs))*count+i))
        geom(name,vs,fs,role)
    def round_part(name,p,r,depth,role,axis='front',vertices=20,bevel=.025,optics=False):
        rot=(math.pi/2,0,0) if axis=='front' else (0,math.pi/2,0) if axis=='side' else (0,0,0)
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=p,rotation=rot)
        o=bpy.context.object
        if bevel:
            mod=o.modifiers.new('rim bevel','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
        collect(o,name,role,False,optics)
    def lens(name,c,r,frame='trim',gear=False):
        x,y,z=c;n=24
        # Closed annular bezel: the lens is seated inside, not stacked on a disk.
        specs=[(r,y+.10),(r,y-.005),(r-.028,y-.033),(r-.095,y-.033),(r-.11,y+.085)]
        vs=[]
        for rad,yy in specs:
            for i in range(n):
                t=2*math.pi*i/n
                rad2=rad+(.018 if gear and i%2==0 else 0)
                vs.append((x+rad2*math.cos(t),yy,z+rad2*math.sin(t)))
        fs=[]
        for j in range(len(specs)):
            for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,((j+1)%len(specs))*n+(i+1)%n,((j+1)%len(specs))*n+i))
        geom(name+'_bezel',vs,fs,frame)
        vs=[]
        for rad,yy in [(r-.105,y+.065),(r-.105,y-.012),((r-.105)*.72,y-.07)]:
            vs.extend([(x+rad*math.cos(2*math.pi*i/n),yy,z+rad*math.sin(2*math.pi*i/n)) for i in range(n)])
        vs.append((x,y-.09,z));fs=[tuple(range(n-1,-1,-1))]
        for j in range(2):
            for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        for i in range(n):fs.append((2*n+i,2*n+(i+1)%n,3*n))
        geom(name+'_convex_lens',vs,fs,'lens',True,True)
    def polygon(name,outline,front,depth,role,axis='front'):
        # Arbitrary one-piece outline, including shield, fins and continuous symbols.
        n=len(outline)
        vs=[(a,yy,b) if axis=='front' else (yy,a,b) for yy in (front,front+depth) for a,b in outline]
        fs=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]
        fs.extend([(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
        if name.startswith(('swept_orange_fin','continuous_white_brow','ivory_handle_arch')):
            mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
            o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o)
            bpy.context.view_layer.objects.active=o;o.select_set(True)
            mod=o.modifiers.new('Soft outline edges','BEVEL');mod.width=.027;mod.segments=1
            bpy.ops.object.modifier_apply(modifier=mod.name)
            collect(o,name,role)
        else:geom(name,vs,fs,role)
    def eyes(z=.63,y=-.883,spacing=.24,height=.32):
        for s in (-1,1):plate('cyan_eye_'+str(s),(s*spacing,y,z),.115,height,.056,.035,'cyan',.012,True)
    def face(w=1.57,h=1.22,z=.80,y=-.72,trim='trim'):
        plate('face_screen',(0,y,z),w,h,.32,.18,'screen',.06)
        ring('continuous_face_surround',(0,y+.055,z),w+.17,h+.17,.37,.095,.17,trim)
    def goggles(z=1.36,w=.68,h=.49,frame='graphite',y=-.87):
        for s in (-1,1):
            x=s*(w/2+.04)
            stroke=min(.087,h*.22)
            ring('goggle_frame_'+str(s),(x,y,z),w,h,min(.13,h*.35),stroke,.18,frame,n=2)
            plate('goggle_lens_'+str(s),(x,y-.028,z),w-1.75*stroke,h-1.75*stroke,min(.07,h*.20),.055,'lens',.018,True)
        box('goggle_bridge',(0,y+.012,z),(.16,.11,.10),frame,.025,1)
    def side_boxes(role='shell',z=.92,width=.32):
        for s in (-1,1):
            box('ear_socket_'+str(s),(s*.91,0,z),(.25,.68,.71),'trim',.12,2)
            box('ear_housing_'+str(s),(s*1.04,0,z),(width,.60,.61),role,.12,2)
    def rear_vents(z=1.05,y=.733):
        for s in (-1,0,1):box('rear_cooling_slot_'+str(s),(s*.21,y,z),(.105,.027,.31),'graphite',.035,1)

    if kind=='developer':
        box('orange_helmet',(0,0,.91),(1.78,1.45,1.82),'shell',.49,3,smooth=True)
        face(w=1.46,h=1.10,z=.69,trim='graphite');eyes(.58)
        goggles(z=1.24,w=.66,h=.48)
        # Three swept crests with a continuous polygonal side profile.
        for i,x in enumerate([-.52,0,.52]):
            top=2.03 if i==1 else 1.87
            outline=[(-.56,1.51),(-.48,1.73),(.54,top),(.80,top+.04),(.77,top-.10),(.27,1.50)]
            polygon('swept_orange_fin_'+str(i),outline,x-.15,.30,'shell',axis='side')
            box('crest_dark_separator_'+str(i),(x,.42,1.64),(.21,.48,.16),'graphite',.045,1)
        side_boxes('graphite',.85)
        # Code braces on both ear plates; continuous stepped outlines.
        for s in (-1,1):
            for k in (-1,1):
                pts=[(-.02,.18),(.065,.18),(.065,.13),(.025,.12),(.025,.05),(-.025,0),(.025,-.05),(.025,-.12),(.065,-.13),(.065,-.18),(-.02,-.18),(-.025,-.07),(-.07,0),(-.025,.07)]
                polygon('code_brace_'+str((s,k)),[(k*a+k*.11,.85+b) for a,b in pts],s*1.209,.012*s,'trim',axis='side')
        rear_vents()
    elif kind=='tester':
        box('teal_round_helmet',(0,0,.94),(1.88,1.53,1.88),'shell',.73,4,smooth=True)
        face(w=1.51,h=1.22,z=.75,trim='trim');eyes(.62,y=-.882)
        box('asymmetric_lens_bridge',(0,-.88,1.40),(.33,.13,.11),'trim',.035,2)
        lens('small_inspection_lens',(-.53,-.90,1.41),.285)
        lens('magnifier',(.32,-.92,1.48),.455,gear=True)
        side_boxes('shell',.89,.37)
        round_part('quality_badge',(.66,-.84,.40),.185,.10,'shell',vertices=20)
        polygon('quality_check',[(.55,.40),(.59,.44),(.64,.39),(.74,.51),(.78,.47),(.64,.31)],-.907,.018,'trim')
        for s in (-1,1):
            for k in (-1,1):
                polygon('test_bracket_'+str((s,k)),[(k*.06,.72),(k*.15,.72),(k*.15,1.07),(k*.06,1.07),(k*.06,1.025),(k*.105,1.025),(k*.105,.765),(k*.06,.765)],s*1.232,.012*s,'trim',axis='side')
        rear_vents(1.0,.770)
    elif kind=='analyst':
        box('ivory_notebook_shell',(0,0,.88),(1.86,1.47,1.76),'shell',.43,3,smooth=True)
        face(w=1.48,h=1.13,z=.71,trim='shell');eyes(.60)
        lens('round_spectacle_left',(-.43,-.89,1.23),.33,'shell_dark')
        lens('round_spectacle_right',(.43,-.89,1.23),.33,'shell_dark')
        box('spectacle_bridge',(0,-.91,1.24),(.23,.10,.09),'shell_dark',.025,1)
        box('top_notebook_inset',(0,0,1.755),(.83,.66,.035),'graphite',.09,2)
        side_boxes('shell_dark',.87)
        # Right requirements card: inset border, one clipped paper corner and two lines.
        box('requirements_frame',(1.235,-.015,.89),(.13,.66,.88),'trim',.10,2)
        box('requirements_screen',(1.31,-.015,.89),(.045,.51,.70),'screen',.07,2)
        polygon('requirements_paper',[(-.20,.59),(.19,.59),(.19,1.07),(.07,1.20),(-.20,1.20)],1.337,.015,'shell',axis='side')
        for z in (.94,1.05):box('requirement_line_'+str(z),(1.36,-.035,z),(.016,.27,.035),'shell_dark',.005,1)
        # Orange edit pencil runs diagonally across the bottom corner of the card.
        a=Vector((1.393,-.24,.57));b=Vector((1.393,.19,.91));d=b-a
        bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.036,depth=d.length,location=(a+b)/2)
        o=bpy.context.object;o.rotation_euler=Vector((0,0,1)).rotation_difference(d.normalized()).to_euler();collect(o,'edit_pencil','detail')
        bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.038,radius2=0,depth=.105,location=a-d.normalized()*.052)
        o=bpy.context.object;o.rotation_euler=Vector((0,0,1)).rotation_difference(-d.normalized()).to_euler();collect(o,'pencil_tip','trim')
        rear_vents()
    elif kind=='security':
        box('blue_armored_helmet',(0,0,.95),(2.04,1.58,1.90),'shell',.50,3,smooth=True)
        face(w=1.52,h=1.23,z=.81,y=-.77,trim='trim');eyes(.68,y=-.90)
        goggles(z=1.36,w=.74,h=.51,frame='shell_dark',y=-.91)
        polygon('continuous_white_brow',[(-.84,1.52),(-.61,1.65),(.61,1.65),(.84,1.52),(.84,1.34),(.66,1.34),(.61,1.48),(.15,1.48),(.08,1.37),(-.08,1.37),(-.15,1.48),(-.61,1.48),(-.66,1.34),(-.84,1.34)],-1.022,.095,'trim')
        for s in (-1,1):
            box('white_ear_armor_'+str(s),(s*1.035,0,.97),(.39,.91,1.07),'trim',.20,2)
            box('blue_ear_armor_'+str(s),(s*1.17,.015,.97),(.31,.78,.91),'shell',.17,2)
            box('ear_inset_'+str(s),(s*1.328,.02,.97),(.035,.43,.57),'shell_dark',.105,2)
            box('top_armor_rail_'+str(s),(s*.48,.16,1.87),(.25,.75,.18),'graphite',.07,1)
        box('helmet_center_ridge',(0,.05,1.88),(.59,1.03,.21),'shell',.10,2)
        plate('chin_guard',(0,-.72,.26),1.24,.46,.16,.35,'shell_dark',.035)
        polygon('shield_border',[(-.175,.47),(-.10,.49),(0,.55),(.10,.49),(.175,.47),(.145,.25),(0,.15),(-.145,.25)],-.926,.045,'trim')
        polygon('shield_inlay',[(-.127,.443),(0,.50),(.127,.443),(.106,.278),(0,.20),(-.106,.278)],-.975,.016,'cyan')
        round_part('threat_sensor_mount',(.80,-.51,1.64),.145,.17,'trim',vertices=16)
        round_part('threat_sensor',(.80,-.607,1.64),.094,.045,'lens',vertices=16,optics=True)
        rear_vents(1.0,.795)
    elif kind=='architect':
        box('teal_heavy_chassis',(0,0,.80),(2.15,1.64,1.60),'shell',.27,2)
        face(w=1.56,h=1.01,z=.64,y=-.82,trim='shell_dark');eyes(.56,y=-.97)
        goggles(z=1.15,w=.76,h=.47,frame='trim',y=-.96)
        for s in (-1,1):
            box('front_bumper_'+str(s),(s*.83,-.72,.31),(.36,.57,.53),'trim',.075,1)
            box('shoulder_block_'+str(s),(s*.89,.15,1.30),(.40,1.21,.43),'shell_dark',.12,1)
            round_part('gold_hinge_'+str(s),(s*1.10,.08,.73),.30,.22,'detail','side',16)
            round_part('hinge_center_'+str(s),(s*1.227,.08,.73),.222,.07,'graphite','side',16)
        # One continuous squared arch; open space is true geometry.
        polygon('ivory_handle_arch',[(-.87,1.48),(-.87,1.92),(-.69,2.08),(.69,2.08),(.87,1.92),(.87,1.48),(.62,1.48),(.62,1.82),(-.62,1.82),(-.62,1.48)],-.15,.44,'trim')
        box('handle_center_mount',(0,.07,1.85),(.71,.66,.54),'trim',.07,1)
        box('top_instrument',(0,.02,2.095),(.54,.56,.21),'shell_dark',.055,1)
        box('top_instrument_screen',(0,-.025,2.205),(.34,.32,.015),'lens',.025,1)
        box('instrument_indicator',(0,-.04,2.219),(.15,.095,.015),'cyan',.006,1)
        rear_vents(.90,.825)
    elif kind=='linter_agent':
        # Squat octagonal body with eight readable radial rule-scanning ports.
        round_part('octagonal_core',(0,0,.53),1.02,.82,'graphite','top',8,.06)
        round_part('lime_top_shell',(0,0,.93),1.10,.29,'shell','top',8,.08)
        round_part('dark_top_panel',(0,0,1.089),.74,.028,'graphite','top',8,.015)
        round_part('lower_impact_rim',(0,0,.18),.91,.23,'shell_dark','top',8,.045)
        face(w=1.24,h=.55,z=.41,y=-.92,trim='graphite');eyes(.35,y=-1.037,spacing=.14,height=.19)
        goggles(z=.77,w=.54,h=.31,frame='graphite',y=-1.07)
        for i in range(8):
            t=2*math.pi*i/8+math.pi/8
            x,y=1.07*math.cos(t),1.07*math.sin(t)
            box('radial_lime_port_'+str(i),(x,y,.51),(.39,.42,.38),'shell',.07,1,rotation=(0,0,t-math.pi/2))
            # Oriented socket face faces radially outwards.
            x,y=1.275*math.cos(t),1.275*math.sin(t)
            box('radial_socket_'+str(i),(x,y,.51),(.28,.045,.26),'graphite',.035,1,rotation=(0,0,t-math.pi/2))
            box('socket_inset_'+str(i),(1.30*math.cos(t),1.30*math.sin(t),.51),(.12,.021,.11),'shell_dark',.013,1,rotation=(0,0,t-math.pi/2))
        for i in range(3):
            t=2*math.pi*i/3
            box('top_rule_groove_'+str(i),(.30*math.sin(t),.30*math.cos(t),1.108),(.025,.57,.008),'shell_dark',.002,1,rotation=(0,0,-t))
    else:raise ValueError(kind)

    # Ground every authored rest pose. Retain full face-group editability.
    bottom=min(p[2] for p in V);V=[(x,y,z-bottom) for x,y,z in V]
    mesh=bpy.data.meshes.new(kind+'_geometry');mesh.from_pydata(V,[],F);mesh.update()
    obj=bpy.data.objects.new(kind+'_model',mesh);scene.collection.objects.link(obj)
    for mat in mats:mesh.materials.append(mat)
    uv=mesh.uv_layers.new(name='PaletteUV')
    for p,role,smooth,mi in zip(mesh.polygons,R,S,MI):
        p.material_index=mi;p.use_smooth=smooth
        for li in p.loop_indices:uv.data[li].uv=((roles.index(role)*4+2)/32,.5)
    # Recalculate coherent outward normals for all individually closed components.
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    for name,start,count in parts:
        obj.vertex_groups.new(name=name).add(list(range(start,start+count)),1,'REPLACE')
    root=bpy.data.objects.new('root',None);scene.collection.objects.link(root);obj.parent=root
    root['asset']=m['id']+'_v01';root['design']='User concept sheet 2026-09-18; modeled geometry; static rest pose'
    height=max(v[2] for v in V)
    for name,pos in [('anchor_ui',(0,0,height+.24)),('anchor_action',(0,-1.10,.68-bottom)),('anchor_target',(0,0,.85-bottom))]+([('anchor_aura',(0,0,.50-bottom))] if kind=='tester' else []):
        a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=pos;a.empty_display_size=.10
    scene.world=bpy.data.worlds.new('Authoring world');scene.world.color=(.25,.25,.25)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':area.spaces.active.shading.type='MATERIAL'
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    scene.frame_set(0)
    out=Path(output);out.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/source_name))
    mesh.calc_loop_triangles()
    print('PERSONA_BUILT',m['id'],'triangles',len(mesh.loop_triangles),'bounds',list(obj.dimensions))
