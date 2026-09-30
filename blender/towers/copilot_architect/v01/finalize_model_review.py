"""Record the completed author assessment and bind inspected evidence to delivery."""
from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;root=p.parents[3]
manifest=json.loads((p/'asset.json').read_text())
review=json.loads((p/'validation/visual_review.json').read_text())
sha=lambda q:hashlib.sha256(q.read_bytes()).hexdigest()
assert sha(root/manifest['source']['path'])==manifest['delivery']['sourceHash']
assert sha(root/manifest['runtime'])==manifest['delivery']['sha256']
assert review['sha256']==manifest['delivery']['sha256'] and review['revision']==manifest['revision']
manifest['animationHandoff'].update({'sha256':manifest['delivery']['sha256'],
    'sourceHash':manifest['delivery']['sourceHash'],'modelRevision':manifest['revision'],
    'status':'animation-pending','modelAcceptance':'pending',
    'authorization':'Model rebuild authorized. Animations remain deferred; ask about baseline animation after the user reviews this delivered model.'})
for r in manifest['references']:
    if r['path'].endswith(('/anatomy.png','/silhouettes.png','/turnaround.png','/side_module.png','/concept_sheet.png')):
        if not r['role'].startswith('Historical Pavilion'):
            r['role']='Historical Pavilion reference, superseded by the selected Keystone Field Architect. '+r['role']
current=[('references/keystone_placeable_2026-09-27/keystone_field_architect.png',
    'Current primary authority: compact Keystone Field Architect concept explicitly selected by user; shape, proportions and visible feature inventory.'),
    ('references/keystone_spec_pack_2026-09-27/architect-spec-sheet.png','Current illustrative model specification; not measured runtime statistics.'),
    ('references/keystone_spec_pack_2026-09-27/architect-six-angle-sheet.png','Current illustrative six-angle reference; unseen rear inferred.'),
    ('references/keystone_spec_pack_2026-09-27/architect-anatomy-sheet.png','Current feature inventory and named external construction.'),
    ('references/keystone_spec_pack_2026-09-27/architect-shape-study.png','Current silhouette/contour study used for approximate uniform-scale overlay comparison.'),
    ('references/keystone_spec_pack_2026-09-27/architect-accessory-blueprint-pod.png','Current blueprint pod reference.'),
    ('references/keystone_spec_pack_2026-09-27/architect-accessory-stylus.png','Current drafting stylus reference.'),
    ('references/keystone_spec_pack_2026-09-27/architect-accessory-application-diagram.png','Current connected application/database/service assembly reference.')]
for rel,role in current:
    path=(p/rel).relative_to(root).as_posix()
    if not any(r['path']==path for r in manifest['references']):manifest['references'].append({'path':path,'role':role})
palette_note='Field Architect delivery: muted teal #1B536B matches selected concept; preserve ivory, dark display, cyan, orange and royal-blue paper. Cyan details use the same palette as an unlit material; no baked bloom.'
if palette_note not in manifest['overrides']:manifest['overrides'].append(palette_note)
(p/'asset.json').write_text(json.dumps(manifest,indent=2)+'\n')
review['reviewedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
review['scope']='model'
review['checks']={
 'referenceFidelity':{'status':'passed','findings':
 'Inspected selected concept, six-angle pairs, contour overlays and detail comparisons. Compact deep faceted shell, lower crown, low bowed face, two cyan eyes, ivory drafting frame with two openings, upright blue paper roll, opposing orange pencil and connected application/database/service tiles are present in their intended regions. Front aspect difference is +0.2%; approximate outline overlaps are 87.2-91.4%. Remaining illustrated-camera and faceting differences are stated in the comparison report; this is not pixel-exact reproduction.'},
 'construction':{'status':'passed','findings':
 'Inspected closeups of both tools, frame openings and diagram, plus top and underside of actual GLB. Smoothed manufactured frame spans and consistent wall thickness remove creases and broad cap artifacts. Offset blueprint flap exposes its complete plan glyph without cylinder occlusion. Pencil seats on its dock and action anchor is at its tip. Geometry audit: 2652 triangles, zero zero-area triangles, 32 named editable component groups, no missing parts, two meshes/materials, one packed/embedded 48x8 palette. Grounding/dimensions/anchors and budget validation passed without warnings.'},
 'readability':{'status':'passed','findings':
 'Reviewed phone-width gameplay lighting, 128px render and small Inspector view. Face, ivory border, orange application tile and opposite blue/orange tools remain distinct. Fine hierarchy lines become small marks at the smallest view, while primary role cues survive. Quiet faceted back and underside avoid unnecessary detail.'},
 'motion':{'status':'not_applicable','findings':'Model-only delivery. No rig or clips were added; baseline animation remains pending separate authorization.'}}
review['secondPass']={'status':'passed','findings':
 'After repairs, rechecked exported six-angle geometry, masks, side details, top/underside and phone/small views. Lowered and widened primary volume; cleaned ivory sweep and cheek joins; removed blueprint-side mirrored truss that obscured its glyph; moved final flap clear of its roll; removed a degenerate bevel sliver and duplicate capsule endpoints. Final source/GLB audit and Inspector loaded hash agree. Last revision places the action anchor at the pencil tip without changing visible geometry.'}
evidence=[]
for rel in ['spec-comparison/spec-vs-model-six-angles.png','spec-comparison/silhouette-overlays.png',
            'spec-comparison/spec-vs-model-details.png','spec-comparison/hero.png',
            'spec-comparison/front.png','spec-comparison/front-left.png','spec-comparison/left.png',
            'spec-comparison/back.png','spec-comparison/back-right.png','spec-comparison/right.png',
            'spec-comparison/top.png','spec-comparison/underside.png',
            'spec-comparison/blueprint-close.png','spec-comparison/stylus-close.png',
            'spec-comparison/diagram-close.png','spec-comparison/small.png',
            'inspector/phone.png','inspector/bottom.png','inspector/small.png']:
    q=p/'validation'/rel
    evidence.append({'path':q.relative_to(root).as_posix(),'sha256':sha(q),'view':q.stem})
review['evidence']=evidence
review['userAcceptance']={'status':'pending','note':'User explicitly selected the concept and authorized this model rebuild; no acceptance of the delivered 3D revision is inferred.'}
review['limitations']=[
 'Generated reference sheets are illustrative and include an inferred rear. Camera/projection differences remain; uniform-height overlap metrics are approximate diagnostics.',
 'Production frame and face corners are more angular than the painted reference; soft ambient occlusion and cyan bloom are not baked into the asset.',
 'Rear width/height diagnostic is +8.7% and left profile is -5.9% versus the generated shape study; these are documented rather than presented as exact matches.',
 'Fine line symbols are not individually readable at the smallest gameplay view. Primary face, tool and tile cues remain visible.',
 'Animation is pending and user artistic acceptance remains open.']
(p/'validation/visual_review.json').write_text(json.dumps(review,indent=2)+'\n')
print(json.dumps({'revision':manifest['revision'],'sha256':review['sha256'],'sourceHash':review['sourceHash'],'evidence':len(evidence)}))
