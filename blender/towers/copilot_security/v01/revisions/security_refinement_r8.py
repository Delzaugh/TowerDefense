"""Security-only refinement from the user supplied six-view sheet, 2026-09-18.

One connected helmet/display surface; seated armor solids; closed optical rings.
Shared Maker only provides geometry accumulation and packed palette delivery.
"""
import bpy, bmesh, json, math
from pathlib import Path
from persona_quality import Maker, ellipse, rounded, matrix


def octagon(w,h,c=.18):
    return [(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),
            (-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c)]


def ring(a,name,outline,layers,c,role,axis='front',smooth=False):
    # A closed annulus, including back wall: each layer is (sx,sz,depth).
    n=len(outline)
    v=[(x*sx,y,z*sz) for sx,sz,y in layers for x,z in outline]
    f=[(j*n+i,j*n+(i+1)%n,((j+1)%len(layers))*n+(i+1)%n,((j+1)%len(layers))*n+i)
       for j in range(len(layers)) for i in range(n)]
    a.add(name,v,f,role,smooth,xf=matrix(c,axis))


def build(manifest_path,output,source_name):
    m=json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    a=Maker(m)
    # Continuous shell runs from the screen aperture around the rear, keeping
    # dome and cheek planes uninterrupted. The opening is purposefully compact.
    rings=[]
    for w,h,z,y in [(1.54,1.57,1.02,-.71),(1.89,1.86,1.01,-.51),
                     (2.01,1.98,1.00,-.19),(1.99,1.96,1.00,.24),
                     (1.75,1.78,1.00,.59),(1.21,1.35,.99,.79)]:
        rings.append(([(x,z+zz) for x,zz in ellipse(w,h,2.7,24)],y))
    v=[(x,y,z) for out,y in rings for x,z in out];f=[];roles=[]
    for j in range(len(rings)-1):
        for i in range(24):
            f.append((j*24+i,j*24+(i+1)%24,(j+1)*24+(i+1)%24,(j+1)*24+i));roles.append('shell')
    # Flat rear service plane is integral to the shell. Slots are cut below.
    f.append(tuple((len(rings)-1)*24+i for i in range(24)));roles.append('shell')
    prev=0
    for w,h,z,y,role in [(1.39,1.24,.99,-.83,'shell'),(1.30,1.13,.98,-.855,'shell_dark'),
                        (1.25,1.08,.98,-.826,'screen'),(.78,.70,.98,-.849,'screen')]:
        start=len(v);v.extend((x,y,z+zz) for x,zz in ellipse(w,h,3.4,24))
        for i in range(24):f.append((prev+i,prev+(i+1)%24,start+(i+1)%24,start+i));roles.append(role)
        prev=start
    center=len(v);v.append((0,-.854,.98))
    for i in range(24):f.append((prev+i,prev+(i+1)%24,center));roles.append('screen')
    # Boolean only the closed shell, before adding overlapping armor solids.
    mesh=bpy.data.meshes.new('helmet_shell');mesh.from_pydata(v,[],f);mesh.update()
    obj=bpy.data.objects.new('helmet_shell',mesh);bpy.context.collection.objects.link(obj)
    palette_roles=list(m['palette']['colors'])
    temp_mats=[bpy.data.materials.new('construction_'+r) for r in palette_roles]
    for mat in temp_mats:mesh.materials.append(mat)
    for p,r in zip(mesh.polygons,roles):p.material_index=palette_roles.index(r)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    for z in (.80,.95,1.10):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(0,.805,z));cut=bpy.context.object;cut.dimensions=(.54,.17,.070)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        bevel=cut.modifiers.new('Vent corner bevel','BEVEL');bevel.width=.016;bevel.segments=1;bpy.ops.object.modifier_apply(modifier=bevel.name)
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Actual recessed rear vent','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
    for p in obj.data.polygons:
        co=p.center
        if abs(co.x)<.285 and .714<co.y<.795 and any(abs(co.z-z)<.047 for z in (.80,.95,1.10)):
            p.material_index=palette_roles.index('screen')
    a.collect(obj,'helmet_continuous_shell_display',[palette_roles[p.material_index] for p in obj.data.polygons])
    for mat in temp_mats:bpy.data.materials.remove(mat)

    # Heavy lower guard: a single multi-section closed casting and a continuous
    # inset white upper rim. Outline is mirrored and shares the same top seat.
    chin=[(-.73,.66),(-.60,.51),(-.40,.46),(.40,.46),(.60,.51),(.73,.66),
          (.74,.32),(.54,.10),(.30,.035),(-.30,.035),(-.54,.10),(-.74,.32)]
    a.loft('heavy_chin_casting',[(chin,-.62),([(x*.99,z) for x,z in chin],-.91),
                                ([(x*.91,.33+(z-.33)*.92) for x,z in chin],-1.00)],'shell')
    a.stroke('continuous_icy_chin_rim',[(-.70,.64),(-.58,.52),(-.39,.475),(.39,.475),(.58,.52),(.70,.64)],
             .075,(0,-1.014,0),'trim',depth=.07)
    shield=[(-.135,.10),(-.052,.095),(0,.13),(.052,.095),(.135,.10),(.114,-.086),(0,-.18),(-.114,-.086)]
    # One shield solid with a shared center ridge and a material boundary.
    sv=[(x,-1.047-.017*(1-abs(x)/.135),z+.285) for x,z in shield]
    sv.extend((x,-.996,z+.285) for x,z in shield)
    sf=[(0,1,2,6,7),(2,3,4,5,6),tuple(range(15,7,-1))]
    sf.extend((i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8))
    a.add('one_piece_faceted_shield',sv,sf,['trim','detail']+['trim']*9)

    # Compact angular goggles: true open bezel and recessed planar glass with
    # a bevel, instead of inflated rectangular lenses.
    for s in (-1,1):
        outline=[(-.355,.15),(-.28,.21),(.28,.18),(.355,.095),(.265,-.18),(-.21,-.18),(-.355,-.055)]
        outline=[(x*s,z) for x,z in outline]
        if s<0:outline.reverse()
        c=(s*.395,-.864,1.45)
        ring(a,'goggle_bezel',outline,[(1,1,.07),(1,1,-.07),(.90,.89,-.11),(.72,.67,-.11),(.72,.67,.065)],c,'shell_dark')
        lens=[(x*.74,z*.70) for x,z in outline]
        a.loft('pale_blue_goggle_glass',[(lens,-.943),([(x*.94,z*.94) for x,z in lens],-.978)],'lens',matrix((s*.395,0,1.45)))
        a.mi[-(len(lens)+2):]=[1]*(len(lens)+2)
        # Restrained inset glint, large enough to read at close range.
        a.poly('lens_highlight',[(-.11,.04),(-.025,.04),(-.025,.09),(-.11,.09)],(s*.395,-.981,1.45),.003,'detail')
        a.eye((s*.235,-.874,.90),.255,.094)
    brow=[(-.80,1.69),(-.65,1.72),(-.12,1.675),(0,1.655),(.12,1.675),(.65,1.72),(.80,1.69),
          (.78,1.535),(.68,1.525),(.66,1.615),(.13,1.60),(.055,1.505),(-.055,1.505),(-.13,1.60),(-.66,1.615),(-.68,1.525),(-.78,1.535)]
    a.poly('single_white_brow',brow,(0,-.999,0),.14,'trim',bevel=.014)

    for s in (-1,1):
        axis='right' if s>0 else 'left'
        # Deep pods with broad chamfers and concentric, properly seated rings.
        outline=octagon(1.04,1.19,.22)
        a.loft('side_pod_cobalt_housing',[(outline,.14),(outline,-.05),
                    ([(x*.95,z*.95) for x,z in outline],-.14)],'shell',matrix((s*1.025,.045,.99),axis))
        ring(a,'side_pod_white_surround',outline,[(.97,.97,.035),(.98,.98,-.035),(.89,.89,-.10),(.74,.75,-.10),(.74,.75,.035)],
             (s*1.158,.045,.99),'trim',axis)
        ring(a,'side_pod_blue_inner_bevel',outline,[(.75,.76,.005),(.75,.76,-.041),(.62,.63,-.055),(.62,.63,.005)],
             (s*1.235,.045,.99),'shell',axis)
        a.loft('side_pod_navy_inset',[( [(x*.63,z*.64) for x,z in outline],.015),
                                    ([(x*.60,z*.61) for x,z in outline],-.025)],'graphite',matrix((s*1.264,.045,.99),axis))

    # Raised armored crest follows the dome; dark brackets stay embedded.
    for s in (-1,1):
        a.loft('crown_recessed_bracket',[( [(x+s*.40,z+zz) for x,zz in octagon(.23,.12,.035)],y)
               for y,z in [(-.40,1.85),(-.13,1.995),(.22,1.98),(.48,1.83)]],'graphite')
    a.loft('central_helmet_crest',[( [(x,z+zz) for x,zz in octagon(w,.13,.035)],y)
           for y,w,z in [(-.64,.48,1.76),(-.36,.57,1.94),(-.12,.57,2.025),(.25,.56,2.01),(.53,.46,1.81)]],'shell')

    # Camera-like temple scanner: cobalt barrel, white metal bezel, black
    # cavity, cyan ring and inset optical center (no protruding cyan eyeball).
    c=(.90,-.40,1.76);circ=ellipse(.35,.35,2,16)
    a.loft('temple_scanner_barrel',[(circ,.51),(circ,.06),([(x*.91,z*.91) for x,z in circ],-.055)],'shell',matrix(c))
    ring(a,'scanner_white_bezel',circ,[(.91,.91,-.035),(.93,.93,-.081),(.79,.79,-.10),(.68,.68,-.10),(.68,.68,-.025)],c,'trim')
    ring(a,'scanner_dark_recess',circ,[(.70,.70,-.065),(.70,.70,-.105),(.51,.51,-.105),(.51,.51,-.056)],c,'screen')
    ring(a,'scanner_cyan_optical_ring',circ,[(.53,.53,-.079),(.53,.53,-.092),(.43,.43,-.092),(.43,.43,-.079)],c,'cyan')
    a.disc('scanner_recessed_glass',(.90,-.475,1.76),.074,.016,'screen',n=16)
    a.disc('scanner_glint',(.88,-.489,1.791),.020,.008,'detail',n=8)
    # Cyan strip conforms to the barrel's two top facets; a flat applied
    # rectangle would float at its corners on this cylindrical housing.
    iv=[]
    for offset in (-.008,.003):
        for y in (-.24,.01):
            for x in (-.061,0,.061):
                iv.append((.90+x,y,1.935-abs(x)*math.tan(math.pi/16)+offset))
    faces=[(0,1,4,3),(1,2,5,4),(6,9,10,7),(7,10,11,8),
           (0,6,7,1),(1,7,8,2),(3,4,10,9),(4,5,11,10),(0,3,9,6),(2,8,11,5)]
    a.add('flush_cyan_barrel_indicator',iv,faces,'cyan')

    # Preserve named component groups and pack the semantic palette in Blender.
    a.finish(output,source_name)
    bpy.context.scene['reference']='references/security_spec_sheet.png; visual design input only'
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
