"""Canyon source recipe: an open recessed basin, never a top plane overlay."""
import bpy, math, os, runpy
from pathlib import Path
FOLDER=Path(__file__).resolve().parent
PROJECT=FOLDER.parents[3]
COLORS={'chalk':'#6787A3','ground':'#354B64','shell':'#24354E','tile_seam':'#577693','sand':'#B9906B','rock':'#C68D65','strata':'#985F49','light':'#DCB182','bed':'#786C60','water':'#4C939C','edge':'#2D435C','path':'#48647D','signal':'#82DADD','metal':'#89A4B8','leaf':'#698A76','leaflight':'#93A287','dark':'#305775'}

def build(asset_id,folder):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
    verts=[];faces=[];roles=[];spatial=[]
    def mesh(v,f,role,uv=False):
        o=len(verts);verts.extend((x,-z,y) for x,y,z in v)
        faces.extend(tuple(i+o for i in face) for face in f);roles.extend([role]*len(f));spatial.extend([uv]*len(f))
    def box(x,y,z,w,h,d,role):
        v=[(x+sx*w/2,y+sy*h/2,z+sz*d/2) for sy in (-1,1) for sz in (-1,1) for sx in (-1,1)]
        mesh(v,[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)],role)
    def strip(a,b,role,uv=False):
        mesh(a+b,[(i,(i+1)%len(a),(i+1)%len(a)+len(a),i+len(a)) for i in range(len(a))],role,uv)
    def anchor(name,x,y,z):
        a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=(x,-z,y)
    def hexring(radius,y):
        out=[]
        for i in range(48):
            k=i//8;t=i%8/8;a=k*math.pi/3;b=(k+1)*math.pi/3
            out.append((radius*((1-t)*math.cos(a)+t*math.cos(b)),y,radius*((1-t)*math.sin(a)+t*math.sin(b))))
        return out
    if asset_id.endswith('tile_canyon'):
        # Structural shell has walls and bottom only. No hidden face spans the basin.
        ring0=hexring(18,0);ring1=hexring(18,1.05);ring2=hexring(18,1.13);ring3=hexring(18,1.2)
        strip(ring0,ring1,'shell');strip(ring1,ring2,'chalk');strip(ring2,ring3,'ground')
        mesh(ring0,[tuple(range(47,-1,-1))],'shell')
        quiet=hexring(18-1.4/(math.sqrt(3)/2),1.2);strip(ring3,quiet,'ground',True)
        land=[];lip=[];ledge=[];cliff=[];bed=[]
        for i in range(48):
            a=i*math.pi/24
            # Mild asymmetry is carried through all rings to retain clean nested topology.
            wiggle=1+.035*math.sin(3*a)+.028*math.cos(7*a)
            x=12.7*math.cos(a)*wiggle;z=5.1*math.sin(a)*wiggle
            rise=2.65*max(0,1-((abs(x)-7.7)/4.8)**2)*(.65+.35*math.sin(a)**2)
            if abs(x+1)<3.0:rise=0
            land.append((14.3*math.cos(a),1.2,8.3*math.sin(a)))
            lip.append((x,1.2+rise,z));ledge.append((x*.955,.88+rise*.64,z*.955))
            cliff.append((x*.88,.46+rise*.15,z*.88));bed.append((x*.73,.15,z*.73))
        strip(quiet,land,'sand',True);strip(land,lip,'light');strip(lip,ledge,'rock');strip(ledge,cliff,'strata');strip(cliff,bed,'sand')
        mesh(bed,[tuple(range(48))],'bed')
        # A separate narrow river surface lies below every canyon edge, on the bed.
        river=[]
        for j in range(19):
            x=-8.6+j*17.2/18;river.append((x,.175,.5*math.sin(x*.43)-.68))
        for j in range(18,-1,-1):
            x=-8.6+j*17.2/18;river.append((x,.175,.5*math.sin(x*.43)+.68))
        mesh(river,[tuple(range(len(river)))],'water')
        anchor('anchor_surface',0,1.2,0)
        for i,name in enumerate(['ne','n','nw','sw','s','se']):
            a=math.pi/6+i*math.pi/3;r=18*math.cos(math.pi/6);anchor('anchor_edge_'+name,r*math.cos(a),1.2,r*math.sin(a))
    else:
        # One continuous bridge deck with the same seven lateral colour lanes as the campus walk.
        lanes=[-1.6,-1.51,-1.37,-1.30,1.30,1.37,1.51,1.6]
        for j,role in enumerate(['edge','signal','shell','path','shell','signal','edge']):
            box(-1+(lanes[j]+lanes[j+1])/2,.04,-.588457268,lanes[j+1]-lanes[j],.08,12,role)
        # Thin side-mounted parapets leave the entire 3.2 m deck clear.
        for x in (-2.77,.77):
            for z in (-5.8,-3.9,-1.95,0,1.95,3.9,5.8):box(x,.55,z-.588457268,.16,1.1,.16,'metal')
            box(x,1.1,-.588457268,.18,.14,11.8,'metal');box(x,.58,-.588457268,.12,.10,11.8,'dark')
        anchor('anchor_start',-1,.08,-6.588457268);anchor('anchor_end',-1,.08,5.411542732)
        anchor('anchor_route_north',-1,.08,-6.588457268);anchor('anchor_route_south',-1,.08,5.411542732)
        # Compact north-east survey overlook sits on the flat land beyond the rim.
        shelter_start=len(verts)
        box(6.5,.10,9.7,5.2,.2,3.8,'edge');box(6.5,.215,9.7,4.9,.03,3.5,'path')
        for x in (4.2,8.8):
            for z in (8.1,11.3):box(x,1.65,z,.18,2.9,.18,'metal')
        box(6.5,3.16,9.7,5.7,.22,4.25,'metal');box(6.5,3.295,9.7,5.15,.05,3.7,'dark')
        # Open entry on west; unobtrusive perimeter rail along the far and canyon sides.
        for z in (8,11.4):box(6.5,1.03,z,4.7,.12,.12,'metal')
        box(8.8,1.03,9.7,.12,.12,3.5,'metal')
        # Survey desk and large display, chunky enough for game scale.
        box(7.9,.76,9.7,.3,1.05,.95,'dark');box(7.9,1.34,9.7,.95,.16,1.35,'metal')
        box(7.85,1.47,9.7,.65,.1,1.04,'signal')
        # Shift the whole shelter a metre outward so all footing corners clear the rim slope.
        verts[shelter_start:]=[(x,z-1,y) for x,z,y in verts[shelter_start:]]
        # Sparse plants in coherent local clusters off the reserved route.
        for x,z,s in [(-6.5,10,.8),(-7.7,10.3,.55),(9,-10,.7),(10.2,-9.2,.48),(-11,-7.5,.55)]:
            box(x,.08,z,s*1.2,.16,s*1.2,'bed')
            for k in range(3):
                a=k*math.pi*2/3;cx=x+math.cos(a)*s*.22;cz=z+math.sin(a)*s*.22
                v=[(cx+math.cos(t*math.pi/2)*s*.4,.12,cz+math.sin(t*math.pi/2)*s*.4) for t in range(4)]+[(cx,.12+s*(1.1+k*.18),cz)]
                mesh(v,[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(3,2,1,0)],'leaf' if k%2 else 'leaflight')
        anchor('anchor_overlook',6.5,.23,10.7)
    data=bpy.data.meshes.new(asset_id);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(asset_id,data);scene.collection.objects.link(obj);obj.parent=root
    # Spatial slate border, with quiet warm terrace tint, plus editable solid swatches.
    surface=runpy.run_path(str(PROJECT/'blender/environment/campus_base_hex/v01/surface.py'));rgb=surface['rgb'];smooth=surface['smooth'];noise=surface['noise'];hashed=surface['h']
    order=list(COLORS);rows=[]
    for iy in range(512):
        row=bytearray()
        for ix in range(512):
            value=rgb(COLORS['ground'])
            if iy<8 and ix<len(order)*8:value=rgb(COLORS[order[ix//8]])
            elif 16<=ix<496 and 16<=iy<496:
                x=(ix-16+.5)/480*36-18;z=(iy-16+.5)/480*36-18
                clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
                blend=smooth(max(0,min(1,(clearance-.06)/.48)));fade=smooth(max(0,min(1,clearance/.54)))
                variation=((noise(x*.28+12,z*.28-9)-.5)*.035+(hashed(ix,iy)-.5)*.04)*fade
                value=tuple(round((a*(1-blend)+b*blend)*(1+variation)) for a,b in zip(rgb('#8C9084'),rgb(COLORS['sand'])))
            row.extend(value)
        rows.append(bytes(row))
    dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));dest.mkdir(parents=True,exist_ok=True);texture=dest/'canyon_atlas.png';surface['png'](texture,rows)
    image=bpy.data.images.load(str(texture),check_existing=False);image.name=asset_id+' packed palette';image.pack()
    mat=bpy.data.materials.new('canyon_palette');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.92
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Linear';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);data.materials.append(mat)
    uv=data.uv_layers.new(name='CanyonAtlas')
    for p,role,sp in zip(data.polygons,roles,spatial):
        for li in p.loop_indices:
            co=data.vertices[data.loops[li].vertex_index].co
            uv.data[li].uv=((16+(co.x+18)/36*480)/512,1-(16+(-co.y+18)/36*480)/512) if sp else ((order.index(role)*8+4)/512,1-4/512)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    if asset_id.endswith('tile_canyon'):
        # These disconnected open terrain patches have no enclosed volume from
        # which Blender can infer "outside". Assign the authored surface side:
        # terrain and water face upward, foundation underside downward, walls out.
        # Polygon.flip preserves positions, palette assignment and UV corners.
        for poly in data.polygons:
            center=poly.center;normal=poly.normal
            if abs(normal.z)>1e-6:
                underside=all(abs(data.vertices[i].co.z)<1e-6 for i in poly.vertices)
                if (underside and normal.z>0) or (not underside and normal.z<0):poly.flip()
            elif normal.x*center.x+normal.y*center.y<0:poly.flip()
        data.update()
        # Give twisted low-poly strip quads exact per-triangle geometric normals.
        # Keeping one quad normal across a nonplanar pair can still cause shadow
        # self-intersection after glTF triangulates it, despite positive Y normals.
        import bmesh
        bm=bmesh.new();bm.from_mesh(data)
        bmesh.ops.triangulate(bm,faces=list(bm.faces),quad_method='BEAUTY',ngon_method='BEAUTY')
        bm.normal_update();bm.to_mesh(data);bm.free();data.update()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME',asset_id+'_v01.blend')))

if __name__=='__main__':build('campus_tile_canyon',FOLDER)
