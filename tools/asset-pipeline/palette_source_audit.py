"""Read-only inventory of registered vertex-colour Blender sources."""
import bpy, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
reports=[]
for entry in json.loads((ROOT/'assets/asset_catalog.json').read_text())['assets']:
    m=json.loads((ROOT/entry['manifest']).read_text())
    raw=(ROOT/m['runtime']).read_bytes()
    g=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')])
    if not any('COLOR_0' in p['attributes'] for x in g['meshes'] for p in x['primitives']):continue
    source=ROOT/m['source']['path'];bpy.ops.wm.open_mainfile(filepath=str(source))
    r={'id':m['id'],'manifest':entry['manifest'],'revision':m['revision'],
       'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),
       'runtimeHash':hashlib.sha256(raw).hexdigest(),'meshes':[],'materials':g['materials']}
    assert r['sourceHash']==m['delivery']['sourceHash'],m['id']+' changed source'
    assert r['runtimeHash']==m['delivery']['sha256'],m['id']+' changed runtime'
    for o in bpy.data.objects['root'].children_recursive:
        if o.type!='MESH':continue
        r['meshes'].append({'name':o.name,'colors':[(c.name,c.domain,c.data_type) for c in o.data.color_attributes],
          'uvs':[u.name for u in o.data.uv_layers],
          'roles':o['palette_roles'].to_dict() if 'palette_roles' in o else None,
          'shapeKeys':[k.name for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else [],
          'materials':[{'name':mat.name,'links':[(l.from_node.bl_idname,l.from_socket.name,l.to_node.bl_idname,l.to_socket.name) for l in mat.node_tree.links]} for mat in o.data.materials]})
    reports.append(r)
    print('AUDIT',m['id'],json.dumps(r['meshes']))
(ROOT/'assets/palette_conversion_source_audit.json').write_text(json.dumps(reports,indent=2)+'\n')
