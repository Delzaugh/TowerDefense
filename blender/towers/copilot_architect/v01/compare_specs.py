"""Analytical comparison boards of untouched reference crops and actual GLB renders."""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
def label(mask):
    h,w=mask.shape;flat=mask.ravel();lab=np.zeros(flat.shape,dtype=np.int32);n=0
    for seed in np.flatnonzero(flat):
        if lab[seed]:continue
        n+=1;stack=[int(seed)];lab[seed]=n
        while stack:
            p=stack.pop();x=p%w
            neighbors=[]
            if x:neighbors.append(p-1)
            if x<w-1:neighbors.append(p+1)
            if p>=w:neighbors.append(p-w)
            if p<(h-1)*w:neighbors.append(p+w)
            for q in neighbors:
                if flat[q] and not lab[q]:lab[q]=n;stack.append(q)
    return lab.reshape(mask.shape),n
def binary_fill_holes(mask):
    background,_=label(~mask)
    outside=np.unique(np.concatenate((background[0],background[-1],background[:,0],background[:,-1])))
    outside=outside[outside!=0]
    return ~np.isin(background,outside)
HERE=Path(__file__).resolve().parent
OUT=HERE/'validation/spec-comparison'
REF=HERE/'references/keystone_spec_pack_2026-09-27/architect-six-angle-sheet.png'
sheet=Image.open(REF).convert('RGB')
fontpath='C:/Windows/Fonts/segoeui.ttf'
def font(n):return ImageFont.truetype(fontpath,n)
views=['front','front-left','left','back','back-right','right']
crops=[(33,79,472,426),(554,76,993,430),(1083,79,1485,426),
       (39,556,474,898),(559,555,989,900),(1057,557,1479,899)]
shape=Image.open(HERE/'references/keystone_spec_pack_2026-09-27/architect-shape-study.png').convert('L')
shape_a=np.asarray(shape)
shape_mask=shape_a[195:412,:]<50
shape_labels,shape_n=label(shape_mask)
shape_parts=[]
for k in range(1,shape_n+1):
    part=shape_labels==k
    if part.sum()>1000:
        yy,xx=np.where(part);shape_parts.append((int(xx.min()),part))
shape_parts.sort(key=lambda q:q[0])
assert len(shape_parts)==6, len(shape_parts)
def refmask(im):
    a=np.asarray(im).astype(float)
    edges=np.concatenate((a[:,:8,:],a[:,-8:,:]),axis=1)
    bg=np.median(edges,axis=1)[:,None,:]
    dist=np.linalg.norm(a-bg,axis=2)
    mask=(dist>36)&((a[:,:,1]>bg[:,:,1]+9)|(a[:,:,0]>bg[:,:,0]+26)|(a[:,:,2]>bg[:,:,2]+40))
    ids,n=label(mask);counts=np.bincount(ids.ravel());counts[0]=0
    keep=np.where(counts>max(20,counts.max()*.012))[0]
    mask=np.isin(ids,keep)
    return binary_fill_holes(mask)
def bounds(mask):
    y,x=np.where(mask);return (int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1))
def fit_by_height(im,mask,height,canvas=(360,380)):
    bbox=bounds(mask);im=im.crop(bbox);m=Image.fromarray((mask*255).astype('uint8')).crop(bbox)
    scale=height/im.height;size=(round(im.width*scale),height)
    im=im.resize(size,Image.Resampling.LANCZOS);m=m.resize(size,Image.Resampling.NEAREST)
    bg=Image.new('RGB',canvas,'#142b43');mb=Image.new('L',canvas,0)
    xy=((canvas[0]-size[0])//2,(canvas[1]-height)//2)
    bg.paste(im,xy);mb.paste(m,xy)
    return bg,np.asarray(mb)>127,{'crop':bbox,'uniformScale':scale,'normalizedSize':size,'referenceAspect':(bbox[2]-bbox[0])/(bbox[3]-bbox[1])}
board=Image.new('RGB',(2400,1130),'#0d1d2e');d=ImageDraw.Draw(board)
d.text((30,12),'FIELD ARCHITECT  /  SPECIFICATION vs ACTUAL GLB',font=font(34),fill='white')
d.text((30,58),'Uniform silhouette-height alignment. Generated reference views are illustrative; camera and projection differences remain.',font=font(21),fill='#a6c9dc')
overlay=Image.new('RGB',(2400,1030),'#0d1d2e');od=ImageDraw.Draw(overlay)
od.text((30,14),'CONTOUR COMPARISON  /  AMBER = SPEC ONLY    CYAN = MODEL ONLY    WHITE = OVERLAP',font=font(27),fill='white')
records=[]
for i,(name,crop) in enumerate(zip(views,crops)):
    ref=sheet.crop(crop)
    rm=shape_parts[i][1]
    actual=Image.open(OUT/(name+'.png')).convert('RGB')
    am=np.asarray(Image.open(OUT/(name+'-mask.png')).convert('L'))<128
    # Height alignment is uniform; never stretch width and height independently.
    # Use the solid-black shape sheet for masks; shaded teal surfaces cannot be
    # separated reliably from the similarly coloured photographic background.
    empty=Image.new('RGB',(rm.shape[1],rm.shape[0]),'#142b43')
    _,rm,ri=fit_by_height(empty,rm,260)
    a,am,ai=fit_by_height(actual,am,260)
    r=Image.new('RGB',(360,380),'#142b43')
    refsize=(round(ref.width*260/ref.height),260)
    ref=ref.resize(refsize,Image.Resampling.LANCZOS)
    r.paste(ref,((360-refsize[0])//2,60))
    x=(i%3)*800;y=105+(i//3)*510
    d.rounded_rectangle((x+10,y,x+790,y+491),12,fill='#182e45',outline='#355875',width=2)
    d.text((x+30,y+12),name.upper(),font=font(25),fill='white')
    d.text((x+33,y+50),'Concept specification',font=font(20),fill='#ffce89')
    d.text((x+423,y+50),'Actual exported model',font=font(20),fill='#77e7f2')
    board.paste(r,(x+20,y+82));board.paste(a,(x+420,y+82))
    intersection=(rm&am).sum();union=(rm|am).sum()
    iou=float(intersection/union);aspect_delta=(ai['referenceAspect']/ri['referenceAspect']-1)*100
    d.text((x+28,y+459),f'Outline overlap {iou:.1%}  |  width/height difference {aspect_delta:+.1f}%',font=font(18),fill='#bcd0df')
    ov=np.zeros((*rm.shape,3),dtype=np.uint8);ov[:]=[20,43,67]
    ov[rm&~am]=[255,179,74];ov[am&~rm]=[0,227,240];ov[rm&am]=[233,241,246]
    xx=(i%3)*800+220;yy=95+(i//3)*460
    overlay.paste(Image.fromarray(ov),(xx,yy))
    od.text((xx,yy-34),name.upper()+f'   {iou:.1%}',font=font(24),fill='white')
    Image.fromarray((rm*255).astype('uint8')).save(OUT/(name+'-reference-aligned-mask.png'))
    Image.fromarray((am*255).astype('uint8')).save(OUT/(name+'-model-aligned-mask.png'))
    records.append({'view':name,'sourceCrop':crop,'reference':ri,'actual':ai,'approximateSilhouetteIoU':iou,'aspectDifferencePercent':aspect_delta})
board.save(OUT/'spec-vs-model-six-angles.png');overlay.save(OUT/'silhouette-overlays.png')
meta=json.loads((OUT/'cameras.json').read_text())
(OUT/'comparison_metrics.json').write_text(json.dumps({'model':meta['model'],'method':'Solid black silhouettes from the illustrative shape-study sheet compared to actual GLB masks; uniformly scale each complete silhouette to 260px height, center align without rotation or nonuniform distortion. Shaded reference crops are manually framed and uniformly height-aligned. Approximate visual diagnostic, not geometric certification; illustrative camera differences remain.','views':records},indent=2))
print(json.dumps({'model':meta['model'],'views':[(r['view'],round(r['approximateSilhouetteIoU'],3),round(r['aspectDifferencePercent'],1)) for r in records]}))
