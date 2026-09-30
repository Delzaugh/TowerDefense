"""Editable campus terrain family. Metres; shared level hex interfaces."""
import bpy, math, os, runpy
from pathlib import Path

def build(asset_id, folder):
    project=folder.parents[3]
    # Reuse the registered foundation's geometry convention, without editing it.
    runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))['build']('campus_base_hex',folder)
    root=bpy.data.objects['root'];obj=next(o for o in root.children_recursive if o.type=='MESH')
    obj.name=asset_id
    original=obj.data;roles=obj['palette_roles']['roles'];attr=original.attributes['_palette_role']
    verts=[tuple(v.co) for v in original.vertices];faces=[];face_roles=[]
    # Replace the entire horizontal top, leaving its side wall and shared frame.
    for p in original.polygons:
        role=round(attr.data[p.loop_start].value)
        if role==roles['ground'] and p.normal.z>.99 and max(math.hypot(verts[vi][0],verts[vi][1]) for vi in p.vertices)<17.9:continue
        faces.append(tuple(p.vertices));face_roles.append(role)
    profile=asset_id.removeprefix('campus_tile_')
    def height(x,z):
        if profile!='hill':return 0
        def ridge(cx,cz,rx,rz,h,angle):
            dx,dz=x-cx,z-cz;c,s=math.cos(angle),math.sin(angle)
            u,v=dx*c+dz*s,-dx*s+dz*c
            return h*max(0,1-(u/rx)**2-(v/rz)**2)**1.3
        # Linked, unequal ridgelines with saddles and long shoulders. Keep the
        # path, existing furnishing pockets and the shared joining band level.
        west=max(ridge(-8,-3,3.8,8.3,3.35,-.20),ridge(-10,2.8,3.8,4.0,2.65,.35))
        east=max(ridge(8,-4.7,3.3,5.4,3.65,.32),ridge(9.9,1.4,3.5,4.5,2.55,-.4),ridge(6.8,5.4,2.8,2.7,1.35,.1))
        corridor=max(0,min(1,(abs(x)-4.8)/1.4))
        clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
        boundary=max(0,min(1,(clearance-1.4)/1.5))
        return max(west,east)*corridor*boundary
    center=len(verts);verts.append((0,0,1.2))
    rings=[];segments=72 if profile=='hill' else 48;levels=12 if profile=='hill' else 9;per_side=segments//6
    for level in range(1,levels+1):
        ring=[]
        for i in range(segments):
            side=i//per_side;t=(i%per_side)/per_side;a=side*math.pi/3;b=(side+1)*math.pi/3
            x=17.86*((1-t)*math.cos(a)+t*math.cos(b))*level/levels
            z=17.86*((1-t)*math.sin(a)+t*math.sin(b))*level/levels
            ring.append(len(verts));verts.append((x,-z,1.2+height(x,z)))
        rings.append(ring)
    for i in range(segments):
        j=(i+1)%segments
        faces.append((center,rings[0][j],rings[0][i]));face_roles.append(roles['ground'])
    for inner,outer in zip(rings,rings[1:]):
        for i in range(segments):
            j=(i+1)%segments
            faces.extend([(inner[i],inner[j],outer[j]),(inner[i],outer[j],outer[i])]);face_roles.extend([roles['ground']]*2)
    if profile=='hill':
        # Equilateral terrain samples avoid the stretched radial triangles that
        # made the corridor-facing slopes look pinched and pleated.
        terrain_start=next(i for i,f in enumerate(faces) if center in f)
        faces=faces[:terrain_start];face_roles=face_roles[:terrain_start];verts=verts[:center]
        grid={};steps=14
        for a in range(-steps,steps+1):
            for b in range(-steps,steps+1):
                if max(abs(a),abs(b),abs(a+b))>steps:continue
                x=(a+b*.5)*17.86/steps;z=b*math.sqrt(3)/2*17.86/steps
                grid[a,b]=len(verts);verts.append((x,-z,1.2+height(x,z)))
        # A boundary triangle can have its cell origin outside the hex even
        # though all three of its own vertices are inside.
        for a,b in ((a,b) for a in range(-steps-1,steps+1) for b in range(-steps-1,steps+1)):
            for tri in [((a,b),(a+1,b),(a,b+1)),((a+1,b),(a+1,b+1),(a,b+1))]:
                if all(p in grid for p in tri):
                    faces.append(tuple(grid[p] for p in reversed(tri)));face_roles.append(roles['ground'])
    data=bpy.data.meshes.new(asset_id+'_terrain');data.from_pydata(verts,[],faces);data.update()
    mat=original.materials[0];data.materials.append(mat);obj.data=data
    semantic=data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
    for p,role in zip(data.polygons,face_roles):
        for li in p.loop_indices:semantic.data[li].value=role
    # One packed spatial atlas plus solid structural swatches, authored in Blender.
    surface=runpy.run_path(str(project/'blender/environment/campus_base_hex/v01/surface.py'))
    noise=surface['noise'];hashed=surface['h'];smooth=surface['smooth'];rgb=surface['rgb'];size=512
    colors=surface['COLORS'];order=list(colors);base=rgb('#8C9084')
    tint=rgb({'park':'#63836D','hill':'#70866C','plaza':'#96918A'}[profile])
    rows=[]
    for iy in range(size):
        row=bytearray()
        for ix in range(size):
            value=base
            if iy<8 and ix<len(order)*8:value=rgb(colors[order[ix//8]])
            elif 16<=ix<496 and 16<=iy<496:
                x=(ix-16+.5)/480*36-18;z=(iy-16+.5)/480*36-18
                clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
                blend=smooth(max(0,min(1,(clearance-.06)/.48)))
                # Match the foundation's quiet boundary at every shared edge.
                # Independent grain must vanish before two atlas domains meet.
                edge_fade=smooth(max(0,min(1,clearance/.54)))
                variation=((noise(x*.28+12,z*.28-9)-.5)*.075+(hashed(ix,iy)-.5)*.055)*edge_fade
                # A restrained gravel collar makes the grass read as landscaping.
                field=tint
                if profile=='hill' and height(x,z)>.7:
                    # Muted exposed stone, subordinate to the actual faceted slope.
                    rock=smooth(max(0,min(1,(height(x,z)-1.1)/1.8)))*.45
                    field=tuple(round(c*(1-rock)+s*rock) for c,s in zip(tint,rgb('#A2A08B')))
                value=tuple(max(0,min(255,round((a*(1-blend)+b*blend)*(1+variation)))) for a,b in zip(base,field))
            row.extend(value)
        rows.append(bytes(row))
    dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));texture=dest/'terrain_atlas.png';surface['png'](texture,rows)
    image=bpy.data.images.load(str(texture),check_existing=False);image.name=profile+' terrain · packed 512 atlas';image.colorspace_settings.name='sRGB';image.pack()
    uv=data.uv_layers.new(name='TerrainAtlas');by_id={int(v):k for k,v in roles.items()}
    for p,role in zip(data.polygons,face_roles):
        for li in p.loop_indices:
            v=data.vertices[data.loops[li].vertex_index].co
            if role==roles['ground'] and p.normal.z>.05 and all(data.vertices[vi].co.z>1.199 for vi in p.vertices):
                coord=((16+(v.x+18)/36*480)/size,1-(16+(-v.y+18)/36*480)/size)
            else:coord=((order.index(by_id[role])*8+4)/size,1-4/size)
            uv.data[li].uv=coord
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
    for link in list(bs.inputs['Base Color'].links):links.remove(link)
    for n in list(nodes):
        if n.bl_idname in ('ShaderNodeVertexColor','ShaderNodeTexImage','ShaderNodeUVMap'):nodes.remove(n)
    tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Linear';tex.extension='EXTEND'
    uvnode=nodes.new('ShaderNodeUVMap');uvnode.uv_map=uv.name
    links.new(uvnode.outputs['UV'],tex.inputs['Vector']);links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.92
    obj['surface_profile']=profile
    obj['surface_contract']='18 m hex radius; y=1.20 edge anchors; flat 1.4 m boundary; hill has flat central north/south corridor |x| <= 3.5 m'
    obj['terrain_max_rise']=max(v[2] for v in verts)-1.2
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME',asset_id+'_v01.blend')))
