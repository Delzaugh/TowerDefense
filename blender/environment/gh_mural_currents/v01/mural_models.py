"""Authored vector murals informed by the commissioned office-art vocabulary.

All design shapes are editable shallow solids. SVGs contain the same contours.
No reference photograph or downloaded illustration is used as a texture.
"""
import math,json,random
from pathlib import Path
from site_tools import initialize

PALETTE={'ink':'#232925','cream':'#F2EAD8','paper':'#F2F5F3','blue':'#5579B8','navy':'#302C59','pink':'#E99BA6','coral':'#D76369','gold':'#E9B864','green':'#0FBF3E','teal':'#70B5B4','purple':'#8534F3','skin':'#E5BA9C','orange':'#D89046','slate':'#89A4B8','wood':'#A77B55','white':'#FFFFFF'}

def build(folder,asset):
    folder=Path(folder); w=8 if asset=='gh_mural_universe' else 6; h=3.4
    t=initialize(PALETTE,'github_mural_palette',folder)
    svg=[]; layer=[.058]
    t.box('Wall panel backing',0,0,h/2,w,.10,h,'ink',.02)
    t.box('Mural ground',0,.054,h/2,w-.10,.008,h-.10,'navy' if asset=='gh_mural_currents' else 'cream',0)
    t.group('panel')
    def poly(name,p,role,z=None):
        z=layer[0] if z is None else z; thick=.003
        n=len(p);verts=[(x,z,y) for x,y in p]+[(x,z+thick,y) for x,y in p]
        faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        t.mesh(name,verts,faces,role)
        points=' '.join(f'{(x+w/2)*200:.2f},{(h-y)*200:.2f}' for x,y in p)
        svg.append(f'<polygon points="{points}" fill="{PALETTE[role]}"/>')
    def ellipse(name,x,y,rx,ry,role):
        poly(name,[(x+rx*math.cos(i*math.tau/48),y+ry*math.sin(i*math.tau/48)) for i in range(48)],role)
    def rect(name,x,y,a,b,role):poly(name,[(x-a/2,y-b/2),(x+a/2,y-b/2),(x+a/2,y+b/2),(x-a/2,y+b/2)],role)
    def stroke(name,p,width,role):
        # Coherent mitered outline, fitted endpoint discs. No overlapping rod joins.
        left=[];right=[]
        for i,(x,y) in enumerate(p):
            a=p[max(0,i-1)];b=p[min(len(p)-1,i+1)];dx=b[0]-a[0];dy=b[1]-a[1];l=math.hypot(dx,dy)
            nx=-dy/l*width/2;ny=dx/l*width/2;left.append((x+nx,y+ny));right.append((x-nx,y-ny))
        poly(name,left+right[::-1],role)
        ellipse(name+' tip1',*p[0],width/2,width/2,role);ellipse(name+' tip2',*p[-1],width/2,width/2,role)
    def curve(name,p,width,role):
        a,b,c,d=p
        samples=[]
        for i in range(33):
            s=i/32;v=1-s;samples.append((v**3*a[0]+3*v*v*s*b[0]+3*v*s*s*c[0]+s**3*d[0],v**3*a[1]+3*v*v*s*b[1]+3*v*s*s*c[1]+s**3*d[1]))
        stroke(name,samples,width,role)
    def octocat(name,x,y,s,face='skin'):
        # Custom friendly office-art character, cat ears, open face and five tentacles.
        layer[0]+=.008
        for i,dx in enumerate([-.37,-.2,0,.2,.37]):
            curve(name+' tentacle'+str(i),[(x+dx*s*.42,y-.3*s),(x+dx*s,y-.95*s),(x+dx*s*1.5,y-.7*s),(x+dx*s*1.7,y-.59*s)],.14*s,'ink')
        ellipse(name+' head',x,y,.66*s,.56*s,'ink')
        poly(name+' left ear',[(x-.57*s,y+.20*s),(x-.57*s,y+.77*s),(x-.17*s,y+.47*s)],'ink')
        poly(name+' right ear',[(x+.57*s,y+.20*s),(x+.57*s,y+.77*s),(x+.17*s,y+.47*s)],'ink')
        layer[0]+=.006;ellipse(name+' face',x,y-.07*s,.51*s,.40*s,face)
        layer[0]+=.006
        for dx in [-.23,.23]:
            ellipse(name+' eye',x+dx*s,y-.06*s,.085*s,.135*s,'coral')
            ellipse(name+' eye glint',x+dx*s-.025*s,y-.02*s,.018*s,.034*s,'paper')
        ellipse(name+' nose',x,y-.21*s,.043*s,.029*s,'coral')
        curve(name+' smile',[(x-.09*s,y-.28*s),(x-.04*s,y-.36*s),(x+.04*s,y-.36*s),(x+.09*s,y-.28*s)],.018*s,'ink')
    if asset=='gh_mural_currents':
        # Inspired by the contrasting flowing-line rhythm visible in Hobbs' office murals;
        # independently authored deterministic paths, not traced from the paintings.
        for i in range(35):
            x=-2.78+i*.164
            endx=x+.30*math.sin(i*.51); endy=.26+.67*(.5+.5*math.sin(i*.67))
            role=['blue','blue','slate','coral','pink','cream'][i%6]
            curve('Flowing strand '+str(i),[(x,3.23),(x-.60,2.52),(endx+.64,1.32),(endx,endy)],.029+(i%3)*.008,role)
        layer[0]+=.009
        for i in range(7):
            x=-2.5+i*.82;ellipse('Node '+str(i),x,2.8-(i%3)*.35,.048,.048,'gold')
        # Low perimeter maker's glyph repeats branching code without a loud logo.
        stroke('branch spine',[(-2.55,.38),(-2.55,.19),(-2.28,.19)],.035,'teal')
        ellipse('branch node',-2.55,.38,.062,.062,'teal');ellipse('branch node2',-2.28,.19,.062,.062,'teal')
    elif asset=='gh_mural_collaboration':
        # Tiled patchwork rhythm from Amsterdam artist-partnership reference.
        for row in range(3):
            for col in range(8):
                x=-2.54+col*.73;y=.56+row*.99;role=['blue','teal','gold','slate'][(col+row*2)%4]
                if (col+2*row)%4==0:
                    poly('Patchwork diamond',[(x,y-.24),(x+.24,y),(x,y+.24),(x-.24,y)],role)
                    layer[0]+=.0002;rect('Stitch',x,y,.04,.24,'cream')
                elif (col+row)%3==0:
                    stroke('Keyboard bracket',[(x-.17,y-.17),(x-.30,y),(x-.17,y+.17)],.055,role)
                    stroke('Keyboard bracket',[(x+.17,y-.17),(x+.30,y),(x+.17,y+.17)],.055,role)
                else:
                    rect('Contribution cell',x,y,.28,.28,role)
        # Three related characters travel along one collaboration branch.
        layer[0]=.087
        stroke('Shared collaboration line',[(-1.65,.36),(-1.65,.19),(0,.19),(1.65,.19),(1.65,.36)],.044,'ink')
        for i,x in enumerate([-1.65,0,1.65]):octocat('Collaborator '+str(i),x,1.65,.68,['skin','paper','pink'][i])
    else:
        # San Francisco cafe's dense illustrated laboratory translated to a graphic
        # transit/planet composition with a clear Octocat focal point.
        ellipse('Sun',2.95,2.64,.38,.38,'gold')
        ellipse('Planet',-2.86,2.61,.34,.34,'teal')
        layer[0]+=.006
        curve('Orbit',[(-3.50,2.80),(-3.0,2.15),(-2.34,2.12),(-2.13,2.68)],.055,'blue')
        for i in range(9):
            x=-3.58+i*.87;y=3.05 if i%2 else .4
            poly('Navigation star',[(x-.08,y),(x,y+.12),(x+.08,y),(x,y-.12)],'slate')
        for i in range(5):
            x=-2.88+i*1.45
            rect('Lab machine',x,.57,.66,.55,['blue','teal','gold','slate','blue'][i])
            layer[0]+=.0004;rect('Lab display',x,.65,.45,.17,'paper')
            for j in range(3):ellipse('Machine dial',x-.18+j*.18,.40,.035,.035,'ink')
        layer[0]=.085
        curve('Circuit path',[(-3.60,1.65),(-2.35,1.65),(-2.14,2.3),(-1.48,2.3)],.065,'orange')
        curve('Circuit path2',[(3.58,1.57),(2.3,1.57),(2.26,2.13),(1.48,2.13)],.065,'teal')
        for x in [-3.6,3.58]:ellipse('Connector',x,1.6,.10,.10,'ink')
        octocat('Mona laboratory',0,1.88,.97)
        layer[0]+=.008
        # Readable paired code chevrons flank the central silhouette.
        for sign in [-1,1]:
            x=sign*1.72
            stroke('Code chevron',[(x+sign*.12,1.24),(x-sign*.17,1.45),(x+sign*.12,1.66)],.07,'purple')
    t.group('authored_mural_graphic')
    t.save(asset+'_v01.blend')
    bg=PALETTE['navy' if asset=='gh_mural_currents' else 'cream']
    out=f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(w*200)}" height="680" viewBox="0 0 {int(w*200)} 680"><rect width="100%" height="100%" fill="{bg}"/>'+''.join(svg)+'</svg>'
    (t.destination/(asset+'_v01.svg')).write_text(out)

