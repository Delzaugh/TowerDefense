import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const folder='blender/towers/copilot_octocat_2_0/v01';
// One-time scaffolding only. Never replace an authored recipe or source on rerun.
try { await fs.access(folder+'/copilot_octocat_2_0_v01.blend'); throw Error('Asset already authored; edit build.py or the authoritative source directly.'); }
catch(e) { if(e.code!=='ENOENT')throw e; }
const old='blender/towers/copilot_octocat_modern/v01';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline={};
for(const id of ['copilot_octocat_classic','copilot_octocat_classic_lowpoly','copilot_octocat_modern']){
 const m=JSON.parse(await fs.readFile(`blender/towers/${id}/v01/asset.json`));
 baseline[id]={source:m.source.path,sourceHash:hash(await fs.readFile(m.source.path)),runtime:m.runtime,runtimeHash:hash(await fs.readFile(m.runtime))};
}
await fs.writeFile(folder+'/validation/existing_octocats_baseline.json',JSON.stringify(baseline,null,2));
let s=await fs.readFile(old+'/sculpt.py','utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing recipe section '+a);s=s.replace(a,b);}
replace("STYLE=globals().get('OCTOCAT_STYLE','modern');MODERN=STYLE=='modern'", "STYLE='2_0';MODERN=True\nPRIMARY=os.environ.get('OCTOCAT_PRIMARY')=='1'");
replace("FOLDER=PROJECT/'blender'/'towers'/('github_octocat_'+STYLE)/'v01'", "FOLDER=Path(__file__).resolve().parent");
replace("ROLES=['fur','face','eyes','iris','suckers','inner_ear','smile','highlight']", "ROLES=['fur','face','eyes','iris','suckers','inner_ear','smile','highlight','mouth','tongue']");
replace("HEX=['252A31','F6C3AA','F3F9F6','A85444','9FD5D1','343C45','8E4C40','FFFFFF']", "HEX=['252A31','F6C3AA','D9F0EA','A85444','9FD5D1','171D23','8E4C40','FFFFFF','522735','CF6B87']");
s=s.replaceAll('32x4','40x4').replaceAll('width=32','width=40').replaceAll('range(32)','range(40)').replaceAll('/32,.5','/40,.5');
replace('if MODERN and y<CY:y-=.055*math.exp', 'if MODERN:\n            x*=1+.075*math.exp(-((z-(CZ-.36))/.22)**2)\n        if MODERN and y<CY:y-=.12*math.exp');
replace("outline=[(-.84,-.30),(-.83,.02),(-.74,.34),(-.54,.49),(-.33,.43),(-.09,.31),(.13,.29),(.38,.42),(.60,.56),(.77,.43),(.84,.12),(.83,-.19),(.89,-.36),(.81,-.54),(.59,-.67),(.27,-.72),(-.10,-.72),(-.48,-.66),(-.76,-.54)]", "outline=[(-.85,-.22),(-.82,.09),(-.69,.34),(-.48,.45),(-.24,.40),(0,.32),(.25,.40),(.48,.45),(.69,.34),(.82,.09),(.85,-.22),(.94,-.35),(.91,-.49),(.76,-.61),(.48,-.67),(.20,-.65),(0,-.68),(-.20,-.65),(-.48,-.67),(-.76,-.61),(-.91,-.49),(-.94,-.35)]");
replace('SIZE=1024;', 'SIZE=512;');
replace("'_face_1024'", "'_face_512'");
// The body is established before fitting detailed facial parts. Primary build omits them.
const faceStart=s.indexOf('# Paint a single seamless face region');
const faceEnd=s.indexOf('# Exactly five appendages');
let detail=s.slice(faceStart,faceEnd);
const start=detail.indexOf('sm=[];');const end=detail.indexOf('for s in [-1,1]:\n    for k in range(2):',start);
detail=detail.slice(0,start)+`# Joyful open smile projected onto the resolved cheek surface.
mouth_outline=[(-.255,NZ-.09),(-.15,NZ-.14),(0,NZ-.155),(.15,NZ-.14),(.255,NZ-.09),(.18,NZ-.29),(0,NZ-.36),(-.18,NZ-.29)]
def surface_shape(name,outline,role,offset):
    boundary=closed_curve([(x,z,0) for x,z in outline],6)
    cx=sum(p.x for p in boundary)/len(boundary);cz=sum(p.y for p in boundary)/len(boundary)
    vv=[(cx,front_y(cx,cz)-offset,cz)]+[(p.x,front_y(p.x,p.y)-offset,p.y) for p in boundary]
    ff=[(0,i+1,(i+1)%len(boundary)+1) for i in range(len(boundary))]
    return mesh(name,vv,ff,role)
surface_shape('smile_open',mouth_outline,'mouth',.012)
surface_shape('smile_tongue',[(-.115,NZ-.285),(-.055,NZ-.263),(.06,NZ-.267),(.115,NZ-.29),(.055,NZ-.332),(-.05,NZ-.332)],'tongue',.016)
# Inset ear colour lies on the continuous skull. No floating ear triangles.
for sign in [-1,1]:
    surface_shape('inner_ear_'+str(sign),[(sign*.68,CZ+.64),(sign*.77,CZ+.94),(sign*.84,CZ+1.00),(sign*.84,CZ+.66)],'inner_ear',.006)
`+detail.slice(end);
// Primary phase provides the same skull seat function for attachment anchors.
const primary=`bvh=BVHTree.FromPolygons([v.co for v in head.data.vertices],[list(p.vertices) for p in head.data.polygons])
def front_y(x,z):
    hit=bvh.ray_cast(Vector((x,-4,z)),Vector((0,1,0)))
    if hit[0] is None:raise RuntimeError('Facial landmark outside skull')
    return hit[0].y
`;
s=s.slice(0,faceStart)+primary+'if not PRIMARY:\n'+detail.split('\n').map(l=>'    '+l).join('\n')+'\n'+s.slice(faceEnd);
replace("body=union_sculpt(bodyparts,'body_five_tentacles',.013,.22)", `# Rounded broad feet and a soft flattened waving hand retain tentacle anatomy.
for sign in [-1,1]:
    bodyparts.append(ellipsoid('foot_volume_'+str(sign),(sign*.30,-.45,.17),(.19,.26,.17),segments=32,rings=16))
bodyparts.append(ellipsoid('wave_palm',(1.15,-.15,1.68),(.23,.15,.14),segments=32,rings=16))
body=union_sculpt(bodyparts,'body_five_tentacles',.013,.20)`);
const cupStart=s.indexOf('for name,ps,rs,direction,start,end,count in paths:');const cupEnd=s.indexOf('for name,ps,rs,*_ in paths:',cupStart);
s=s.slice(0,cupStart)+'if not PRIMARY:\n'+s.slice(cupStart,cupEnd).split('\n').map(l=>'    '+l).join('\n')+'\n'+s.slice(cupEnd);
replace("root['ears']=2;", "root['ears']=2;");
replace("root['production_status']='Reference-led static sculpt. No wardrobe or animations.'", "root['production_status']='Octocat 2.0 model; animation pending. Official brand and MyOctocat references.'");
replace("(OUT/'authoring_stats.json').write_text", `unit_scale=1.8002899885177612/height
for o in objects:
    for v in o.data.vertices:v.co*=unit_scale
for o in root.children:
    if o.type=='EMPTY':o.location*=unit_scale
for o in guides.objects:
    for spline in o.data.splines:
        for point in spline.points:
            point.co.x*=unit_scale;point.co.y*=unit_scale;point.co.z*=unit_scale
    o['radii']=[r*unit_scale for r in o['radii']]
stats.update(height=1.8002899885177612,unit_scale=unit_scale,primary_only=PRIMARY)
(OUT/'authoring_stats.json').write_text`);
replace("'github_octocat_'+STYLE+'_v01.blend'", "'copilot_octocat_2_0_v01.blend'");
await fs.writeFile(folder+'/build.py',s);
const m=JSON.parse(await fs.readFile(folder+'/asset.json'));
m.displayName='GitHub Octocat 2.0';m.source.mode='procedural';m.source.recipe=folder+'/build.py';
m.budgets={triangles:75000,meshes:24,materials:2,textures:2,textureSize:512,bones:0};
m.contract.anchors=['anchor_ui','anchor_action','anchor_target','anchor_hat','anchor_face','anchor_chest','anchor_back','anchor_hand_left','anchor_hand_right'];
m.contract.dimensions={min:[1.3,1.799,0.6],max:[1.7,1.802,1.0]};
m.references=[{path:folder+'/references/github_octocat_2_0_official.png',url:'https://brand.github.com/graphic-elements/mascots',provenance:'User-selected official Octocat 2.0 illustration. Character volume, cheeks, ears and expression; scene and props omitted.'},{path:folder+'/references/myoctocat_base.svg',url:'https://myoctocat.com',provenance:'Official unadorned Octocat linked by the brand page. Primary anatomy, upright proportion and tentacle pose.'},{path:old+'/copilot_octocat_modern_v01.blend',provenance:'Existing Tower Modern Octocat revision 9, preserved as starting construction reference.'}];
const roles=['fur','face','eyes','iris','suckers','inner_ear','smile','highlight','mouth','tongue'];
const colors=['252A31','F6C3AA','D9F0EA','A85444','9FD5D1','171D23','8E4C40','FFFFFF','522735','CF6B87'];
m.texturePalettes=[{material:'octocat_palette',size:[40,4],roles:Object.fromEntries(roles.map((r,i)=>[r,{rect:[i*4,0,4,4],color:'#'+colors[i]}]))}];
m.exportSettings={paletteSampler:'linear'};
await fs.writeFile(folder+'/asset.json',JSON.stringify(m,null,2)+'\n');
