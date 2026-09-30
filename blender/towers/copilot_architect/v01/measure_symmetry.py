import json,struct,hashlib
from pathlib import Path
here=Path(__file__).parent;data=(here.parents[3]/'assets/runtime/towers/copilot_architect_v01.glb').read_bytes();off=12
while off<len(data):
    length,kind=struct.unpack_from('<II',data,off);chunk=data[off+8:off+8+length];off+=8+length
    if kind==0x4e4f534a:doc=json.loads(chunk)
    elif kind==0x004e4942:binary=chunk
def read(index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size=struct.calcsize(fmt)*n;start=v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*n,binary,start+i*v.get('byteStride',size)) for i in range(a['count'])]
verts=[];tris={};roles=['shell','trim','slate','screen','amber','cyan','shell_dark','detail']
for mesh in doc['meshes']:
    for p in mesh['primitives']:
        pos=read(p['attributes']['POSITION']);uv=read(p['attributes']['TEXCOORD_0']);ids=[x[0] for x in read(p['indices'])];verts.extend(pos)
        for i in range(0,len(ids),3):
            role=roles[min(7,int(uv[ids[i]][0]*8))];tris[role]=tris.get(role,0)+1
unique=list(set(verts));key=lambda p:tuple(round(v,5) for v in p);pool=set(map(key,unique));missing=[p for p in unique if key((-p[0],p[1],p[2])) not in pool]
def distance(a,b):return sum((x-y)**2 for x,y in zip(a,b))**.5
worst=max((min(distance((-p[0],p[1],p[2]),q) for q in unique) for p in missing),default=0)
out={'sha256':hashlib.sha256(data).hexdigest(),'unique_positions':len(unique),'mirror_key_tolerance_m':.00001,'positions_without_rounded_mirror':len(missing),'worst_nearest_mirror_distance_m':worst,'triangles_by_palette_role':tris,'note':'Position symmetry only; topology triangulation and shading can differ. Role totals are material regions, not independent parts.'}
folder=here/'validation/side-detail-evaluation-r45';folder.mkdir(exist_ok=True);(folder/'symmetry.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
