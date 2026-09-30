"""Mona 2.0: two walking legs, distinct arms, carried rear appendage.

Run Blender with --python animate.py -- <source.blend> <output.blend>.
The ordinary guarded export owns GLB delivery. No rest mesh/UV edits occur.
"""
import bpy, json, math, sys, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

FOLDER = Path(__file__).resolve().parent
CLIPS = {'idle':54, 'work':42, 'move':28, 'run':20, 'place':26, 'hit':10, 'resolve':26}
LIMBS = ['leg_left','arm_left','leg_rear','arm_right','leg_right']
LEGS = ['leg_left','leg_right']
GAITS = {'move':{'speed':.40,'stance':.62,'lift':.10},'run':{'speed':.75,'stance':.42,'lift':.16}}
EXPRESSIONS = ['blink_left','blink_right','focus','surprise','concern','delight','gaze_left','gaze_right']

def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)))
    return t*t*(3-2*t)

def pulse(t,c,w):
    return smooth(0,1,max(0,1-abs(t-c)/w))

def sample(path,u):
    dist=[0]
    for a,b in zip(path,path[1:]):dist.append(dist[-1]+(b-a).length)
    d=u*dist[-1]
    for i in range(len(dist)-1):
        if d<=dist[i+1]:
            return path[i].lerp(path[i+1],(d-dist[i])/max(1e-8,dist[i+1]-dist[i]))
    return path[-1].copy()

def rest_digest(obj):
    return hashlib.sha256(json.dumps({
        'vertices':[list(v.co) for v in obj.data.vertices],
        'polygons':[list(p.vertices) for p in obj.data.polygons],
        'uv':[[list(v.uv) for v in layer.data] for layer in obj.data.uv_layers],
        'materials':[m.name for m in obj.data.materials],
        'smooth':[p.use_smooth for p in obj.data.polygons],
    },sort_keys=True).encode()).hexdigest()

def animate_current(output):
    root=bpy.data.objects['root']
    if any(o.type=='ARMATURE' for o in root.children_recursive):
        raise RuntimeError('Use the preserved pre-animation source; do not replace an existing rig blindly')
    meshes=[o for o in root.children_recursive if o.type=='MESH']
    before={o.name:rest_digest(o) for o in meshes}
    low='octocat_features' in bpy.data.objects
    body=bpy.data.objects['octocat_features' if low else 'body_five_tentacles']
    head=bpy.data.objects['head_and_ears']
    paths={n:[Vector(p.co[:3]) for p in bpy.data.objects[n+'_path'].data.splines[0].points] for n in LIMBS}
    # Five equal arc-length segments per tentacle; each segment is parented to
    # the base independently so a posed curve can bend without an elbow hinge.
    points={n:[sample(paths[n],i/5) for i in range(6)] for n in LIMBS}
    collar=sum((p[0] for p in points.values()),Vector())/5
    data=bpy.data.armatures.new('mona_2_0_rig')
    rig=bpy.data.objects.new('mona_2_0_rig',data)
    bpy.context.scene.collection.objects.link(rig);rig.parent=root
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
    bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
    specs=[('base',collar,collar+Vector((0,0,.14)),None),
           ('head',Vector((0,.037,1.23)),Vector((0,.037,1.40)),'base')]
    for n in LIMBS:
        specs += [(f'{n}_{i}',points[n][i],points[n][i+1],'base') for i in range(5)]
    for s,label in [(-1,'left'),(1,'right')]:
        p=Vector((s*.37,.02,1.62));specs.append(('ear_'+label,p,p+Vector((s*.04,0,.13)),'head'))
    for n,a,b,parent in specs:
        bone=data.edit_bones.new(n);bone.head=a;bone.tail=b
        if parent:bone.parent=data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in rig.pose.bones:b.rotation_mode='QUATERNION'
    names=[n for n,*_ in specs]
    bone_index={n:i for i,n in enumerate(names)}
    rest_matrices={b.name:b.matrix_local.copy() for b in data.bones}

    # The nearest curve supplies limb identity and longitudinal coordinates.
    # Blend smoothly into the common base to avoid a torn five-way junction.
    path_points=[];path_labels=[];path_u=[]
    for k,n in enumerate(LIMBS):
        for j in range(81):
            path_points.append(sample(paths[n],j/80));path_labels.append(k);path_u.append(j/80)
    path_array=np.array(path_points);path_labels=np.array(path_labels);path_u=np.array(path_u)
    def nearest_path(p):
        ix=int(np.argmin(np.sum((path_array-np.array(p))**2,axis=1)))
        return int(path_labels[ix]),float(path_u[ix])
    def skin_weights(p):
        k,u=nearest_path(p);n=LIMBS[k]
        blend=smooth(.03,.20,u)
        q=max(0,min(4,u*5-.5));a=int(q);b=min(4,a+1);v=q-a
        ww={'base':1-blend,f'{n}_{a}':blend*(1-v)}
        ww[f'{n}_{b}']=ww.get(f'{n}_{b}',0)+blend*v
        return {n:w for n,w in ww.items() if w>1e-7}

    # Preserve low-poly semantic groups. They also identify face components in
    # the combined palette mesh for independently editable expression targets.
    part_members={}
    if low:
        group_names={g.index:g.name for g in body.vertex_groups}
        for v in body.data.vertices:
            for g in v.groups:
                n=group_names[g.group]
                if n.startswith('part_') and g.weight>.5:part_members[v.index]=n[5:]
    def semantic(obj,i):
        return part_members.get(i,'body_five_tentacles') if obj==body and low else obj.name
    body_skin_indices=[v.index for v in body.data.vertices if semantic(body,v.index)=='body_five_tentacles']
    body_weights={i:skin_weights(body.data.vertices[i].co) for i in body_skin_indices}
    body.data.calc_loop_triangles()
    skin_triangles=[list(t.vertices) for t in body.data.loop_triangles if all(i in body_weights for i in t.vertices)]
    body_tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],skin_triangles,all_triangles=True)
    # Use exact fitted skin coordinates for cups; identical weight fields retain
    # their shallow relief while the surface bends.
    def cup_weights(p):
        hit,normal,index,distance=body_tree.find_nearest(p)
        if hit is None:return skin_weights(p)
        inds=skin_triangles[index];a,b,c=[body.data.vertices[i].co for i in inds]
        v0,v1,v2=b-a,c-a,hit-a
        d00,d01,d11=v0.dot(v0),v0.dot(v1),v1.dot(v1)
        d20,d21=v2.dot(v0),v2.dot(v1);den=d00*d11-d01*d01
        if abs(den)<1e-14:return skin_weights(hit)
        v=(d11*d20-d01*d21)/den;w=(d00*d21-d01*d20)/den
        bary=[max(0,1-v-w),max(0,v),max(0,w)];total=sum(bary)
        ww={}
        for i,factor in zip(inds,bary):
            for n,weight in body_weights[i].items():ww[n]=ww.get(n,0)+factor/total*weight
        # glTF supports four influences. Match its truncation explicitly.
        chosen=sorted(ww.items(),key=lambda item:item[1],reverse=True)[:4]
        total=sum(w for n,w in chosen)
        return {n:w/total for n,w in chosen}
    for obj in meshes:
        groups={n:obj.vertex_groups.get(n) or obj.vertex_groups.new(name=n) for n in names}
        for v in obj.data.vertices:
            part=semantic(obj,v.index)
            if part=='body_five_tentacles':ww=skin_weights(v.co)
            elif part=='suction_cup_rows':ww=cup_weights(v.co)
            elif part.startswith('inner_ear_'):
                ww={'ear_left' if part.endswith('-1') else 'ear_right':1}
            elif obj==head:
                ear=smooth(1.61,1.73,v.co.z)*smooth(.25,.39,abs(v.co.x))
                ww={'head':1-ear,'ear_left' if v.co.x<0 else 'ear_right':ear}
            else:ww={'head':1}
            for n,w in ww.items():
                if w>1e-7:groups[n].add([v.index],w,'REPLACE')
        obj.parent=rig;mod=obj.modifiers.new('Mona elastic skin','ARMATURE');mod.object=rig

    # Reproject expression vertices onto the SAME rest skull with their original
    # relief. Simple Z scaling alone would bury the eye corners in the head.
    skull_tree=BVHTree.FromPolygons([v.co for v in head.data.vertices],[list(p.vertices) for p in head.data.polygons])
    features={}
    for obj in meshes:
        for v in obj.data.vertices:
            part=semantic(obj,v.index)
            if part.startswith('eye_') or part.startswith('smile_'):
                features.setdefault((obj.name,part),[]).append(v.index)
    centers={k:sum((bpy.data.objects[k[0]].data.vertices[i].co for i in ix),Vector())/len(ix) for k,ix in features.items()}
    morph_objects=[]
    for obj in meshes:
        selections={part:ix for (objname,part),ix in features.items() if objname==obj.name}
        if not selections:continue
        obj.shape_key_add(name='Basis',from_mix=False);morph_objects.append(obj)
        for expression in EXPRESSIONS:
            key=obj.shape_key_add(name=expression,from_mix=False)
            for part,inds in selections.items():
                iseye=part.startswith('eye_');sign=-1 if part.endswith('-1') else 1
                center=centers[(obj.name,part)]
                # Eye layers must share one white-eye center when squashing.
                if iseye:center=centers[(obj.name,'eye_white_'+str(sign))] if (obj.name,'eye_white_'+str(sign)) in centers else centers.get(('eye_white_'+str(sign),'eye_white_'+str(sign)),center)
                sx,sz,dx,angle=1,1,0,0
                if iseye:
                    if expression==('blink_left' if sign<0 else 'blink_right'):sz=.035
                    elif expression=='focus':sz=.73
                    elif expression=='surprise':sz=1.08;sx=1.04
                    elif expression=='concern':sz=.87;angle=-sign*.12
                    elif expression=='delight':sz=.86
                    elif expression.startswith('gaze_') and not part.startswith('eye_white_'):
                        dx=(-1 if expression=='gaze_left' else 1)*.012
                else:
                    if expression=='focus':sx=.82;sz=.55
                    elif expression=='surprise':sx=.54;sz=1.07
                    elif expression=='concern':sx=.8;sz=.28
                    elif expression=='delight':sx=1.06;sz=1.03
                if (sx,sz,dx,angle)==(1,1,0,0):continue
                for i in inds:
                    p=obj.data.vertices[i].co;v=p-center
                    x,z=v.x*sx,v.z*sz
                    q=p.copy();q.x=center.x+x*math.cos(angle)-z*math.sin(angle)+dx
                    q.z=center.z+x*math.sin(angle)+z*math.cos(angle)
                    old=skull_tree.ray_cast(Vector((p.x,-4,p.z)),Vector((0,1,0)))[0]
                    new=skull_tree.ray_cast(Vector((q.x,-4,q.z)),Vector((0,1,0)))[0]
                    if old is not None and new is not None:
                        relief=p.y-old.y;q.y=new.y+relief
                        # Morph interpolation follows a chord inside a convex
                        # skull. Bound the entire blend, not only its endpoint.
                        for alpha in [.0625,.125,.25,.375,.5,.625,.75,.875,1]:
                            xz=p.lerp(q,alpha)
                            skin=skull_tree.ray_cast(Vector((xz.x,-4,xz.z)),Vector((0,1,0)))[0]
                            if skin is not None:
                                q.y=min(q.y,(skin.y+relief-(1-alpha)*p.y)/alpha-.0005)
                    key.data[i].co=q

    # Bake driven morphs together with the armature action. Independent shape
    # NLA tracks were evaluated as constant by Blender 5.2's NLA export path.
    # The exporter explicitly samples armature-driven child shape keys.
    controls=list(EXPRESSIONS)
    for expression in controls:rig['expression_'+expression]=0.0
    for obj in morph_objects:
        for expression in EXPRESSIONS:
            key=obj.data.shape_keys.key_blocks[expression]
            driver=key.driver_add('value').driver;driver.type='SCRIPTED'
            var=driver.variables.new();var.name='amount';var.type='SINGLE_PROP'
            var.targets[0].id=rig;var.targets[0].data_path='["expression_'+expression+'"]'
            driver.expression='amount'

    # Keep fitting anchors at their exact rest seats while making hand/action
    # origins follow their actual limbs. UI stays at the placement root.
    bpy.context.view_layer.update()
    anchor_before={o.name:list(o.matrix_world.translation) for o in root.children_recursive if o.name.startswith('anchor_')}
    for obj in list(root.children):
        if not obj.name.startswith('anchor_') or obj.name=='anchor_ui':continue
        bone='head' if obj.name in ['anchor_hat','anchor_face','anchor_target'] else 'arm_left_4' if obj.name=='anchor_hand_left' else 'arm_right_4' if obj.name in ['anchor_hand_right','anchor_action'] else 'base'
        world=obj.matrix_world.copy();obj.parent=rig;obj.parent_type='BONE';obj.parent_bone=bone
        bpy.context.view_layer.update();obj.matrix_world=world

    # Skin-space contacts provide per-version millimetre corrections without
    # modifying rest topology. At least three stance limbs support the head.
    contact_sets={n:[] for n in LIMBS}
    for i in body_skin_indices:
        k,u=nearest_path(body.data.vertices[i].co)
        if u>.58:contact_sets[LIMBS[k]].append(i)
    coords=np.array([list(v.co)+[1] for v in body.data.vertices])
    weight_array=np.zeros((len(coords),len(names)))
    for i,ww in body_weights.items():
        for n,w in ww.items():weight_array[i,bone_index[n]]=w
    def contact_z(n):
        inds=contact_sets[n];result=np.zeros(len(inds))
        for j,bone_name in enumerate(names):
            ww=weight_array[inds,j]
            if not np.any(ww):continue
            mat=rig.pose.bones[bone_name].matrix @ rest_matrices[bone_name].inverted()
            result += ww*(coords[inds] @ np.array(mat)[2])
        return float(result.min())
    def put_segment(n,i,a,b):
        bone=data.bones[f'{n}_{i}'];direction=b-a
        old=(bone.tail_local-bone.head_local).normalized()
        q=old.rotation_difference(direction.normalized()) @ bone.matrix_local.to_quaternion()
        mat=Matrix.Translation(a) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((1,direction.length/bone.length,1,1))
        rig.pose.bones[bone.name].matrix=mat
    def set_paths(targets):
        for n,ps in targets.items():
            for i in range(5):put_segment(n,i,ps[i],ps[i+1])
    contacts=[]
    def pose(clip,t):
        for b in rig.pose.bones:b.matrix_basis.identity()
        for expression in controls:rig['expression_'+expression]=0.0
        env=math.sin(math.pi*t)**2
        base=rig.pose.bones['base'];hb=rig.pose.bones['head']
        dz=0;head_x=0;head_z=0;targets={n:[p.copy() for p in ps] for n,ps in points.items()}
        exp={};lift={n:0 for n in LIMBS}
        if clip=='idle':
            dz=-.004*env;head_z=.032*math.sin(math.tau*t);head_x=-.018*env
            for n,amount in [('arm_left',.014),('arm_right',.018)]:
                for i,p in enumerate(targets[n]):p.x+=amount*math.sin(math.tau*t)*(i/5)**2
        elif clip=='work':
            dz=-.009*env;head_x=.09*pulse(t,.40,.32);head_z=-.04*env
            exp={'focus':.85*env,'gaze_left':.65*pulse(t,.35,.28),'delight':.6*pulse(t,.79,.17)}
            reach=pulse(t,.45,.34);tap=pulse(t,.50,.10)
            for i in range(6):
                u=i/5
                targets['arm_right'][i]+=Vector((-.12,-.17,-.17))*reach*u*u
                targets['arm_right'][i].z-=.035*tap*u*u
                targets['arm_left'][i]+=Vector((-.07,-.06,.055))*reach*u*u
        elif clip in GAITS:
            gait=GAITS[clip];running=clip=='run'
            # Upright two-foot locomotion. Arms never become ground supports.
            dz=(-.018 if running else -.006)+(.014 if running else .008)*math.cos(2*math.tau*t)
            head_x=(.065 if running else .02)+.015*math.cos(2*math.tau*t)
            head_z=.028*math.sin(math.tau*t)
            for k,n in enumerate(LEGS):
                phase=(t+k/2)%1;stance=gait['stance'];stride=gait['speed']*(CLIPS[clip]/24)*stance
                if phase<stance:
                    travel=stride*(phase/stance-.5);height=0
                else:
                    u=(phase-stance)/(1-stance)
                    # Match stance velocity and acceleration at both contacts.
                    # The foot reverses in recovery without a speed hitch.
                    r=(1-stance)/stance
                    easing=10*u**3-15*u**4+6*u**5
                    travel=stride*(.5+r*u-(1+r)*easing);height=gait['lift']*math.sin(math.pi*u)**2
                lift[n]=height
                ps=[]
                for i,p0 in enumerate(points[n]):
                    u=i/5;p=p0.copy()
                    p.y+=travel*smooth(0,.8,u)-height*.35*math.sin(math.pi*u)
                    p.z+=dz*(1-u)**2+height*smooth(.1,.75,u)
                    ps.append(p)
                targets[n]=ps
            for k,n in enumerate(['arm_left','arm_right']):
                swing=(.16 if running else .105)*math.sin(math.tau*t+k*math.pi)
                for i,p in enumerate(targets[n]):
                    u=i/5;p.y+=swing*u*u;p.z+=dz*(1-u)**2
                    # Bring the raised greeting hand into a bent arm carriage.
                    if n=='arm_right':p.z-=.22*u*u;p.x-=.065*u*u
                    p.z+=abs(swing)*.20*u*u
        elif clip=='hit':
            impact=pulse(t,.24,.24);recover=pulse(t,.68,.25)
            dz=-.055*impact+.008*recover;head_x=-.13*impact+.035*recover;head_z=.08*impact
            exp={'surprise':impact,'concern':.35*recover}
            for n in ['arm_left','arm_right']:
                for i,p in enumerate(targets[n]):p.y+=.05*impact*(i/5)**2;p.z+=.035*impact*(i/5)**2
        else:
            q=t if clip=='resolve' else 1-t
            gesture=math.sin(math.pi*q)**2
            head_x=.045*gesture;head_z=-.045*gesture;dz=-.006*gesture
            exp={'delight':.5*gesture,'blink_left':.75*smooth(.48,.86,q),'blink_right':.75*smooth(.48,.86,q)}
            for i,p in enumerate(targets['arm_right']):p.x-=.025*gesture*(i/5)**2;p.z+=.035*gesture*(i/5)**2
        # Upper support segments follow compression; distal pads stay grounded.
        if clip not in GAITS:
            for n in LIMBS:
                for i,p in enumerate(targets[n]):p.z+=dz*(1-i/5)**2
        # The fifth appendage follows behind; it never plants as a third leg.
        for i,p in enumerate(targets['leg_rear']):
            u=i/5;p.y+=.14*u*u;p.z+=.24*u**1.5
            p.x+=.015*math.sin(math.tau*t)*u*u
        base.location.y=dz
        from mathutils import Quaternion
        hb.rotation_quaternion=Quaternion((0,0,1),head_z) @ Quaternion((1,0,0),head_x)
        for label,s in [('left',-1),('right',1)]:
            rig.pose.bones['ear_'+label].rotation_quaternion=Quaternion((0,1,0),s*.035*env if clip=='work' else s*.07*pulse(t,.25,.25) if clip=='hit' else 0)
        bpy.context.view_layer.update();set_paths(targets)
        planted=LEGS
        for _ in range(3):
            bpy.context.view_layer.update()
            for n in planted:
                delta=lift[n]-contact_z(n)
                for i,p in enumerate(targets[n]):p.z+=delta*smooth(.1,.65,i/5)
            delta=.20-contact_z('leg_rear')
            for i,p in enumerate(targets['leg_rear']):p.z+=delta*smooth(.1,.65,i/5)
            set_paths(targets)
        bpy.context.view_layer.update()
        contacts.append({'clip':clip,'phase':round(t,6),'floor':{n:round(contact_z(n),6) for n in planted},'expectedLift':lift,
            'nonSupportClearance':{n:round(contact_z(n),6) for n in ['arm_left','arm_right','leg_rear']}})
        for name,value in exp.items():rig['expression_'+name]=value
        for name,amount in cup_schedule(clip,t).items():rig['expression_'+name]=amount
        rig.update_tag();bpy.context.view_layer.update()

    # Pose-space corrective morphs keep shallow cups on the exact skinned
    # triangle surface during large curls/unrolling. Skin-weight interpolation
    # alone is not exact because vertex matrices differ across a triangle.
    cup_snapshots={}
    def cup_schedule(clip,t):
        snapshots=cup_snapshots.get(clip,[])
        ready=cup_snapshots.get('idle',[])
        fallback={ready[0][1]:1} if ready else {}
        if not snapshots:return fallback
        if clip=='idle':return fallback
        if clip in GAITS:
            q=(t%1)*8;a=int(q);b=(a+1)%8
            return {snapshots[a][1]:1-(q-a),snapshots[b][1]:q-a}
        baseline=ready[0][1] if ready else None
        samples=[(0,baseline),*snapshots,(1,baseline)]
        for (ta,na),(tb,nb) in zip(samples,samples[1:]):
            if ta<=t<=tb:
                u=(t-ta)/(tb-ta);out={}
                if na:out[na]=1-u
                if nb:out[nb]=u
                return out
        return {}
    cup_obj=body if low else bpy.data.objects['suction_cup_rows']
    cup_indices=[v.index for v in cup_obj.data.vertices if semantic(cup_obj,v.index)=='suction_cup_rows']
    cup_bindings=[]
    for i in cup_indices:
        p=cup_obj.data.vertices[i].co
        hit,n,index,distance=body_tree.find_nearest(p);inds=skin_triangles[index]
        a,b,c=[body.data.vertices[j].co for j in inds]
        v0,v1,v2=b-a,c-a,hit-a;d00,d01,d11=v0.dot(v0),v0.dot(v1),v1.dot(v1)
        den=d00*d11-d01*d01
        v=(d11*v2.dot(v0)-d01*v2.dot(v1))/den if abs(den)>1e-14 else 0
        w=(d00*v2.dot(v1)-d01*v2.dot(v0))/den if abs(den)>1e-14 else 0
        cup_bindings.append((i,inds,[1-v-w,v,w],max(.00025,(p-hit).dot(n))))
    if not cup_obj.data.shape_keys:cup_obj.shape_key_add(name='Basis',from_mix=False)
    if cup_obj not in morph_objects:morph_objects.append(cup_obj)
    for clip,phases in [('idle',[0]),('move',[i/8 for i in range(8)]),('run',[i/8 for i in range(8)]),('work',[.25,.5,.75]),('hit',[.2,.5,.8])]:
        created=[]
        for j,t in enumerate(phases):
            pose(clip,t)
            matrices={n:rig.pose.bones[n].matrix @ rest_matrices[n].inverted() for n in names}
            deformed=np.zeros((len(coords),3))
            for k,n in enumerate(names):
                deformed += (coords @ np.array(matrices[n]).T)[:,:3]*weight_array[:,k,None]
            name=f'cup_{clip}_{j}'
            key=cup_obj.shape_key_add(name=name,from_mix=False)
            for i,inds,bary,relief in cup_bindings:
                a,b,c=[Vector(deformed[k]) for k in inds]
                normal=(b-a).cross(c-a).normalized()
                target=a*bary[0]+b*bary[1]+c*bary[2]+normal*relief
                matrix=Matrix(((0,0,0,0),)*4)
                for g in cup_obj.data.vertices[i].groups:
                    n=cup_obj.vertex_groups[g.group].name
                    if n in matrices:matrix+=matrices[n]*g.weight
                if abs(matrix.determinant())>1e-9:key.data[i].co=matrix.inverted() @ target
            controls.append(name);rig['expression_'+name]=0.0
            driver=key.driver_add('value').driver;driver.type='SCRIPTED'
            var=driver.variables.new();var.name='amount';var.type='SINGLE_PROP'
            var.targets[0].id=rig;var.targets[0].data_path='["expression_'+name+'"]'
            driver.expression='amount';created.append((t,name))
        cup_snapshots[clip]=created

    scene=bpy.context.scene;scene.render.fps=24;rig.animation_data_create()
    for clip,frames in CLIPS.items():
        action=bpy.data.actions.new(clip);rig.animation_data.action=action
        for f in range(frames+1):
            pose(clip,f/frames)
            for bone in rig.pose.bones:
                for prop in ['location','rotation_quaternion','scale']:bone.keyframe_insert(data_path=prop,frame=f+1,group=bone.name)
            for expression in controls:rig.keyframe_insert(data_path='["expression_'+expression+'"]',frame=f+1)
        for owner,act in [(rig,action)]:
            track=owner.animation_data.nla_tracks.new();track.name=clip
            strip=track.strips.new(clip,0,act);strip.action_frame_start=1;strip.action_frame_end=frames+1
            track.mute=True;owner.animation_data.action=None
    for b in rig.pose.bones:b.matrix_basis.identity()
    for expression in controls:rig['expression_'+expression]=0.0
    scene.frame_start=0;scene.frame_end=54;scene.frame_set(0)
    root['resolve_effect']={'type':'digital_blocks','version':1,'clip':'resolve','assembleClip':'place','cellSize':.13,'maxFragments':3 if low else 32,'edgeColor':'#9FD5D1'}
    root['expression_states']={
        'attentive':{},'interest':{'gaze_left':.55},'focused':{'focus':.85},
        'surprised':{'surprise':1},'concerned':{'concern':.8},
        'amused':{'delight':.5},'delighted':{'delight':1}}
    root['locomotion']={'type':'biped','legs':LEGS,'arms':['arm_left','arm_right'],'rearAppendage':'leg_rear',
        'virtualSpeedMetresPerSecond':GAITS['move']['speed'],'stanceFraction':GAITS['move']['stance'],
        'limbPhaseOffsets':[0,.5],'cycleSeconds':28/24,
        'run':{'cycleSeconds':20/24,'virtualSpeedMetresPerSecond':GAITS['run']['speed'],'stanceFraction':GAITS['run']['stance']}}
    root['supporting_legs']=2;root['arms']=2;root['rear_appendages']=1
    root['production_status']='User-corrected Mona 2.0: upright biped walk/run, distinct arms, carried rear appendage; nonverbal maker acting.'
    bpy.context.view_layer.update()
    after={o.name:rest_digest(o) for o in meshes}
    assert before==after,'Rest geometry/UV/material assignments changed'
    anchor_after={o.name:list(o.matrix_world.translation) for o in root.children_recursive if o.name.startswith('anchor_')}
    assert max(abs(a-b) for n in anchor_before for a,b in zip(anchor_before[n],anchor_after[n]))<1e-6
    report={'restParity':'exact source geometry, polygon, UV, material-slot and smooth-flag hashes',
        'meshDigests':after,'deformBones':len(data.bones),'clipFrames':CLIPS,
        'fps':24,'anchors':anchor_after,'contactSamples':contacts,'expressionTargets':EXPRESSIONS}
    path=Path(output);path.parent.mkdir(parents=True,exist_ok=True)
    (path.parent/'animation_authoring_audit.json').write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(path))
    print(json.dumps({'source':str(path),'bones':len(data.bones),'clips':list(CLIPS),'restParity':before==after}))

if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:]
    bpy.ops.wm.open_mainfile(filepath=args[0])
    animate_current(args[1])

