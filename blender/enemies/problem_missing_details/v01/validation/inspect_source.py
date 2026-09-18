import bpy,json
o=bpy.data.objects['missing_details']
rows=[]
for p in json.loads(o['part_ranges']):
 if p['name'] in ['hip_bridge','shoulder_socket','upper_arm','elbow','forearm','thigh']:
  vs=[o.data.vertices[i].co for i in range(p['start'],p['start']+p['count'])]
  rows.append({'name':p['name'],'bone':p['bone'],'min':[round(min(v[k] for v in vs),4) for k in range(3)],'max':[round(max(v[k] for v in vs),4) for k in range(3)]})
print('SOURCE_JOINTS',json.dumps(rows))
