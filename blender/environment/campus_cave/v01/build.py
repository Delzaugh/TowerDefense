"""A solid faceted rock shelter with a deep, open, blind-ended tunnel."""
import bpy, bmesh, math, os, runpy, json
from pathlib import Path
folder=Path(__file__).resolve().parent
project=folder.parents[3]
dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));dest.mkdir(parents=True,exist_ok=True)
kit=runpy.run_path(str(project/'tools/asset-recipes/campus-forest.py'))
colors={'stone':'#87968F','stone_light':'#A6ADA0','stone_dark':'#657974','interior':'#354B48','depth':'#21332F','moss':'#6F8D68','moss_light':'#91A17A','earth':'#8B806B'}
# Reuse the tiny packed swatch writer, with this asset's own semantic palette.
kit['write_palette'].__globals__['COLORS']=colors
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
g=kit['Geometry']();n=9
outer=[(-3.55,0),(-3.4,1.15),(-2.75,2.55),(-1.55,3.55),(-.25,3.95),(1.25,3.6),(2.55,2.8),(3.25,1.4),(3.6,0)]
inner=[(-1.8,.10),(-1.83,.9),(-1.5,1.9),(-.92,2.5),(-.12,2.72),(.75,2.48),(1.38,1.98),(1.78,1.05),(1.85,.10)]
verts=[]
for shape,depth in [(outer,-2.15),([(x*1.03+.12,h*.94) for x,h in outer],-.45),([(x*.83-.25,h*.81) for x,h in outer],1.6),([(x*.56-.4,h*.50) for x,h in outer],2.55),(inner,-2.15),([(x*.73-.12,.10+(h-.10)*.77) for x,h in inner],1.38)]:
    verts.extend((x,depth,h) for x,h in shape)
faces=[];roles=[]
def face(indices,role):faces.append(indices);roles.append(role)
# Continuous front lip: no stacked boulders or dark disk concealing an opening.
for i in range(n):
    j=(i+1)%n;face((i,j,4*n+j,4*n+i),'stone_light' if 2<=i<=5 else 'stone')
for ring in range(3):
    for i in range(n):
        j=(i+1)%n;a,b,c,d=ring*n+i,ring*n+j,(ring+1)*n+j,(ring+1)*n+i
        role=('moss' if (i+ring)%3 else 'moss_light') if 2<=i<=5 else ('stone_dark' if i in (0,7) else 'stone')
        face((a,b,c),role);face((a,c,d),role if (i+ring)%3 else 'stone_light')
face(tuple(3*n+i for i in range(n)),'stone_dark')
for i in range(n):
    j=(i+1)%n;face((4*n+i,5*n+i,5*n+j,4*n+j),'earth' if i==n-1 else 'interior')
face(tuple(5*n+i for i in reversed(range(n))),'depth')
g.add(verts,faces,roles)
# Grounded broken rock shoulders. Large planes stay readable at campus scale.
for x,y,sx,sy,sz in [(-3.3,-1.05,.8,1.0,.68),(3.3,-.75,.76,.95,.85),(-2.7,1.65,.83,.8,.6)]:
    start=len(g.vertices);g.ico((x,y,sz*.7),(sx,sy,sz),'stone_dark')
    for k in range(start,len(g.vertices)):
        a,b,h=g.vertices[k];g.vertices[k]=(a,b,max(0,h))
mat=kit['write_palette'](dest);mat.name='campus_cave_palette'
data=bpy.data.meshes.new('Cave continuous shell and tunnel');data.from_pydata(g.vertices,[],g.faces);data.update();data.materials.append(mat)
obj=bpy.data.objects.new('Cave rock shelter',data);scene.collection.objects.link(obj);obj.parent=root
uv=data.uv_layers.new(name='ForestPalette')
for poly,role in zip(data.polygons,g.roles):
    for li in poly.loop_indices:uv.data[li].uv=((list(colors).index(role)*4+2)/64,.5)
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data)
audit={'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'zeroAreaFaces':sum(f.calc_area()<1e-8 for f in bm.faces),'entranceWidth':3.65,'entranceHeight':2.62,'tunnelDepth':3.53};bm.free()
if audit['nonManifoldEdges'] or audit['zeroAreaFaces']:raise RuntimeError(audit)
for name,pos in [('anchor_entrance',(0,-2.15,.10)),('anchor_ui',(0,0,4.3))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos
(dest/'construction_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_cave_v01.blend')))
