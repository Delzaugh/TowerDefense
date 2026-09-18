// Flat silhouette aura. The authored body landmarks are projected into the
// current camera plane; there is no 3D shell, surface shading or refraction.
export function createPresentationEffect(THREE,root){
  const spec=root.getObjectByName('root')?.userData.presentation_effect;
  if(spec?.type!=='golden_flame'||!spec.capsules)return null;
  const anchor=root.getObjectByName(spec.anchor),capsules=Object.values(spec.capsules);
  if(!anchor||!capsules.length||capsules.length>32||!capsules.every(c=>Array.isArray(c.a)&&Array.isArray(c.b)&&c.a.length===3&&c.b.length===3&&[...c.a,...c.b,c.radius].every(Number.isFinite)&&c.radius>0))return null;
  const bounds=new THREE.Box3();
  for(const c of capsules)for(const p of [c.a,c.b])bounds.union(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...p),new THREE.Vector3(1,1,1).multiplyScalar(2*(c.radius+.25))));
  bounds.min.y=Math.max(0,bounds.min.y);
  const uniforms={time:{value:0},size:{value:new THREE.Vector2(4,4)},capsuleA:{value:capsules.map(()=>new THREE.Vector3())},capsuleB:{value:capsules.map(()=>new THREE.Vector2())}};
  const geometry=new THREE.PlaneGeometry(1,1);
  const material=new THREE.ShaderMaterial({name:'golden_flat_silhouette_aura',uniforms,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      precision highp float;varying vec2 vUv;uniform float time;uniform vec2 size;
      uniform vec3 capsuleA[${capsules.length}];uniform vec2 capsuleB[${capsules.length}];
      float smoothUnion(float a,float b){float h=clamp(.5+.5*(b-a)/.20,0.,1.);return mix(b,a,h)-.20*h*(1.-h);}
      void main(){
        vec2 p=(vUv-.5)*size;float d=100.;
        for(int i=0;i<${capsules.length};i++){
          vec2 a=capsuleA[i].xy,e=capsuleB[i]-a;
          float t=clamp(dot(p-a,e)/max(dot(e,e),.0001),0.,1.);
          d=smoothUnion(d,length(p-a-e*t)-capsuleA[i].z);
        }
        // Quiet irregular edges; broad flat golden fill, without internal lines.
        d+=.013*sin(p.y*17.-time*2.2)+.009*sin(p.x*21.+p.y*9.-time*1.6);
        float edge=exp(-abs(d)*13.);
        float fill=1.-smoothstep(-.09,.08,d);
        float halo=exp(-max(d,0.)*14.)*(1.-smoothstep(.13,.25,d));
        float alpha=(fill*.30+edge*.28+halo*.16)*(.96+.04*sin(time*3.8));
        // Explicit zero outside the glow and at the padded quad boundary.
        float margin=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
        alpha*=smoothstep(0.,.025,margin);if(alpha<.001||d>.25)discard;
        vec3 gold=mix(vec3(1.,.63,.005),vec3(1.,.88,.14),edge*.7);
        gl_FragColor=vec4(gold,min(alpha,.80));
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.name='presentation_golden_aura';mesh.frustumCulled=false;
  const world=new THREE.Vector3(),center=new THREE.Vector3(),delta=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),back=new THREE.Vector3(),local=new THREE.Vector3();
  const projected=capsules.map(()=>({a:new THREE.Vector2(),b:new THREE.Vector2(),r:0}));
  return {mesh,bounds,triangles:2,materials:1,meshes:1,
    setEnabled(value){mesh.visible=!!value;},
    update(camera,time){
      uniforms.time.value=time;anchor.updateWorldMatrix(true,false);anchor.getWorldPosition(center);center.y+=1.9;
      camera.updateMatrixWorld();right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);camera.getWorldDirection(back);
      const depth=center.clone().sub(camera.position).dot(back);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(let i=0;i<capsules.length;i++){
        const c=capsules[i],p=projected[i];let factor=1;
        for(const key of ['a','b']){
          world.set(...c[key]);anchor.localToWorld(world);delta.copy(world).sub(center);
          const f=camera.isPerspectiveCamera?depth/Math.max(.01,world.clone().sub(camera.position).dot(back)):1;
          p[key].set(delta.dot(right)*f,delta.dot(up)*f);factor=Math.max(factor,f);
        }
        p.r=c.radius*factor;minX=Math.min(minX,p.a.x-p.r,p.b.x-p.r);maxX=Math.max(maxX,p.a.x+p.r,p.b.x+p.r);minY=Math.min(minY,p.a.y-p.r,p.b.y-p.r);maxY=Math.max(maxY,p.a.y+p.r,p.b.y+p.r);
      }
      const cx=(minX+maxX)/2,cy=(minY+maxY)/2,w=maxX-minX+.65,h=maxY-minY+.65;
      for(let i=0;i<projected.length;i++){const p=projected[i];uniforms.capsuleA.value[i].set(p.a.x-cx,p.a.y-cy,p.r);uniforms.capsuleB.value[i].set(p.b.x-cx,p.b.y-cy);}
      uniforms.size.value.set(w,h);world.copy(center).addScaledVector(right,cx).addScaledVector(up,cy).addScaledVector(back,1.05);
      local.copy(world);if(mesh.parent)mesh.parent.worldToLocal(local);mesh.position.copy(local);mesh.quaternion.copy(camera.quaternion);
      const perspectiveScale=camera.isPerspectiveCamera?(depth+1.05)/Math.max(.01,depth):1;mesh.scale.set(w*perspectiveScale,h*perspectiveScale,1);
    },
    dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();}
  };
}

// Named solid swatches use top-left image pixel coordinates. This read-only
// inspection is shared with delivery validation; previews allocate on edit.
export function inspectTexturePalettes(THREE,root,declarations=[]){
  const materials=new Set();root.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  return declarations.map(spec=>{
    const matches=[...materials].filter(m=>m.name===spec.material);
    if(matches.length!==1)throw Error('Texture palette requires one named material: '+spec.material);
    const material=matches[0],texture=material.map,image=texture?.image;
    if(!texture||texture.colorSpace!==THREE.SRGBColorSpace)throw Error('Texture palette requires an sRGB base-color map: '+spec.material);
    if(image?.width!==spec.size[0]||image?.height!==spec.size[1])throw Error('Texture palette image size mismatch: '+spec.material);
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
    const original=context.getImageData(0,0,canvas.width,canvas.height);
    for(const [name,role] of Object.entries(spec.roles)){
      const [x,y,w,h]=role.rect,rgb=role.color.slice(1).match(/../g).map(v=>parseInt(v,16));
      for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){
        const i=(py*canvas.width+px)*4;
        if(rgb.some((v,c)=>Math.abs(original.data[i+c]-v)>1))throw Error('Texture palette swatch differs from contract: '+spec.material+'/'+name);
      }
    }
    return {spec,material,originalTexture:texture,canvas,context,original,previewTexture:null,changes:{}};
  });
}

export function setTexturePaletteColor(THREE,p,role,hex){
  if(!p.spec.roles[role]||!/^#[a-f0-9]{6}$/i.test(hex))throw Error('Unknown texture swatch or invalid color');
  if(!p.previewTexture){p.previewTexture=p.originalTexture.clone();p.previewTexture.source=new THREE.Source(p.canvas);p.material.map=p.previewTexture;}
  const [x,y,w,h]=p.spec.roles[role].rect,pixels=p.context.getImageData(x,y,w,h),rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16));
  for(let i=0;i<pixels.data.length;i+=4)for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c];
  p.context.putImageData(pixels,x,y);p.previewTexture.needsUpdate=true;p.changes[role]=hex;
}

export function resetTexturePalette(p){
  p.material.map=p.originalTexture;p.previewTexture?.dispose();p.previewTexture=null;
  p.context.putImageData(p.original,0,0);p.changes={};
}

// Non-destructive review controls. All edits live on this imported viewer copy.
export function installReview(api) {
  const {THREE,scene,renderer,key,fill}=api, $=id=>document.getElementById(id);
  const overlay=new THREE.Group();scene.add(overlay);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.22}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;floor.visible=false;scene.add(floor);
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-8;key.shadow.camera.right=key.shadow.camera.top=8;key.shadow.bias=-.0005;
  function clearOverlay(){for(const o of [...overlay.children]){overlay.remove(o);o.traverse(c=>{c.geometry?.dispose();if(c.material){const ms=Array.isArray(c.material)?c.material:[c.material];ms.forEach(m=>{m.map?.dispose();m.dispose();});}});}}
  function data(e){
    if(e.review)return e.review;
    const meshes=[],materials=new Set(),roles=new Map();
    e.root.traverse(o=>{if(!o.isMesh)return;meshes.push(o);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));
      const mapping=o.userData.palette_roles, attribute=o.geometry.attributes[mapping?.attribute], colors=o.geometry.attributes.color;
      if(mapping && attribute && colors){o.userData.originalColors=colors.array.slice();for(const [name,id] of Object.entries(mapping.roles)){if(!roles.has(name))roles.set(name,[]);roles.get(name).push({mesh:o,attribute,id,scale:mapping.scale||1});}}
    });
    let texturePalettes=[],textureError='';
    try{texturePalettes=inspectTexturePalettes(THREE,e.root,e.model.contract.texturePalettes);}catch(error){textureError=error.message;}
    const textureRoles=new Map();
    for(const palette of texturePalettes)for(const name of Object.keys(palette.spec.roles))textureRoles.set('texture:'+palette.spec.material+':'+name,{palette,name});
    return e.review={meshes,materials:[...materials].map(m=>({m,color:m.color.clone(),roughness:m.roughness})),roles,texturePalettes,textureRoles,textureError,changes:{},part:''};
  }
  function paletteColor(e,name){const d=data(e),textured=d.textureRoles.get(name);if(textured)return textured.palette.changes[textured.name]||textured.palette.spec.roles[textured.name].color;const bindings=d.roles.get(name);if(bindings){const {mesh,attribute,id,scale}=bindings[0],c=mesh.geometry.attributes.color;for(let i=0;i<attribute.count;i++)if(Math.round(attribute.getX(i)*scale)===id)return '#'+new THREE.Color(c.getX(i),c.getY(i),c.getZ(i)).getHexString();}return '#'+(d.materials[Number(name.slice(9))]?.m.color.getHexString()||'ffffff');}
  function updatePalette(){const e=api.active();if(!e)return;const d=data(e),name=$('palette-select').value;$('palette-color').value=paletteColor(e,name);$('roughness-range').value=String(d.materials[0]?.m.roughness??.72);}
  function sync(){
    const e=api.active();if(!e){$('revision-status').textContent='';return;}
    const m=e.model.contract,d=data(e),limit=m.budgets.triangles;
    $('revision-status').textContent=`${m.displayName} · ${m.version} · revision ${m.revision} · ${e.model.sha256.slice(0,12)} · ${e.stats.triangles} / ${limit} triangles ${e.stats.triangles<=limit?'✓':'— OVER BUDGET'}`;
    $('structure-status').textContent=`${d.meshes.length} meshes · ${new Set(d.meshes.flatMap(o=>o.skeleton?.bones||[])).size} bones. Mesh isolation uses exported names; merged subparts need authoring metadata.`;
    $('part-select').replaceChildren(new Option('All meshes',''),...d.meshes.map((o,i)=>new Option(o.name||'Mesh '+i,String(i))));$('part-select').value=d.part;
    const previous=$('palette-select').value;
    const options=[...d.roles.keys()].map(n=>new Option(n.replaceAll('_',' '),n));
    for(const [key,{name,palette}] of d.textureRoles)options.push(new Option(name.replaceAll('_',' ')+' · texture'+(d.texturePalettes.length>1?' · '+palette.spec.material:''),key));
    if(!options.length)options.push(...d.materials.map(({m},i)=>new Option((m.name||'Material '+(i+1))+' · tint','material:'+i)));
    $('palette-select').replaceChildren(...options);
    if([...$('palette-select').options].some(o=>o.value===previous))$('palette-select').value=previous;
    $('palette-status').textContent=d.textureError?'Texture palette unavailable: '+d.textureError+'. Whole-material controls remain available.':d.textureRoles.size?'Named texture swatches; preview only. Copy changes to apply them to the packed image in Blender.':d.roles.size?'Explicit palette roles from the source; preview only.':'No semantic role mapping. Material tint affects the whole material, including its vertex colors or texture.';
    const comparisons=api.models().filter(m=>!api.entries().some(e=>e.model.path===m.path));
    $('comparison-select').replaceChildren(...comparisons.map(m=>new Option(m.contract.displayName+' · '+m.contract.version,m.path)));$('compare-asset').disabled=!comparisons.length;
    updatePalette();rebuildOverlay();
  }
  function rebuildOverlay(){
    clearOverlay();
    for(const e of api.entries()){
      if($('skeleton-toggle').checked){const helper=new THREE.SkeletonHelper(e.root);helper.material.depthTest=false;helper.renderOrder=100;overlay.add(helper);}
      if($('anchors-toggle').checked)e.root.traverse(o=>{if(!o.name.startsWith('anchor_'))return;
        const marker=new THREE.AxesHelper(.18);marker.userData.follow=o;overlay.add(marker);
        const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=48;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#12232eee';ctx.fillRect(0,0,256,48);ctx.fillStyle='#abfff2';ctx.font='22px sans-serif';ctx.fillText(o.name,8,32);
        const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(labelCanvas),depthTest:false}));label.scale.set(.8,.15,1);label.userData.follow=o;label.userData.label=true;overlay.add(label);
      });
    }
  }
  function update(){for(const o of overlay.children)if(o.userData.follow){o.userData.follow.getWorldPosition(o.position);if(o.userData.label)o.position.y+=.18;}}
  function note(){const e=api.active();if(!e)return 'Select a model first.';const m=e.model.contract,d=data(e);const texturePaletteEdits=d.texturePalettes.flatMap(p=>Object.entries(p.changes).map(([role,color])=>({material:p.spec.material,slot:'baseColor',texture:p.originalTexture.name,size:p.spec.size,origin:'top-left',role,rect:p.spec.roles[role].rect,from:p.spec.roles[role].color,to:color})));return JSON.stringify({asset:m.id,version:m.version,revision:m.revision,sha256:e.model.sha256,...api.context(),part:d.part===''?null:d.meshes[Number(d.part)]?.name,appearance:{background:$('background-select').value,lighting:$('lighting-select').value,ground:$('ground-toggle').checked,phoneWidth:$('phone-toggle').checked},previewOnlyChanges:d.changes,...(texturePaletteEdits.length?{texturePaletteEdits}:{}),note:$('feedback-note').value.trim()},null,2);}
  async function copy(){const text=note();$('feedback-copy').value=text;$('feedback-copy').hidden=false;try{await navigator.clipboard.writeText(text);$('feedback-status').textContent='Copied. No message was sent.';}catch{$('feedback-copy').focus();$('feedback-copy').select();$('feedback-status').textContent='Select and copy the note below.';}}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function releaseTexturePreviews(d){d.texturePalettes.forEach(resetTexturePalette);}
  function reset(){const e=api.active();if(!e)return;const d=data(e);for(const o of d.meshes){const a=o.geometry.attributes.color;if(o.userData.originalColors){a.array.set(o.userData.originalColors);a.needsUpdate=true;}}releaseTexturePreviews(d);for(const {m,color,roughness} of d.materials){m.color.copy(color);m.roughness=roughness;}d.changes={};updatePalette();}
  $('review-open').onclick=()=>{$('review-panel').hidden=false;$('review-open').setAttribute('aria-expanded','true');};
  $('review-close').onclick=()=>{$('review-panel').hidden=true;$('review-open').setAttribute('aria-expanded','false');};
  $('background-select').onchange=()=>{scene.background.set($('background-select').value==='light'?'#dce5ed':'#172631');};
  $('lighting-select').onchange=()=>{const studio=$('lighting-select').value==='studio';key.color.set(studio?0xffffff:0xfff1dd);fill.color.set(studio?0xffffff:0x75c7ff);key.intensity=studio?3.5:2.8;fill.intensity=studio?1.25:1.5;};$('lighting-select').onchange();
  $('ground-toggle').onchange=()=>{floor.visible=renderer.shadowMap.enabled=$('ground-toggle').checked;};
  $('phone-toggle').onchange=()=>{document.body.classList.toggle('phone-preview',$('phone-toggle').checked);requestAnimationFrame(()=>api.frame());};
  $('silhouette-button').onclick=()=>{api.frame();api.zoom(3);};
  $('skeleton-toggle').onchange=$('anchors-toggle').onchange=rebuildOverlay;
  $('part-select').onchange=()=>{const e=api.active();if(!e)return;const d=data(e);d.part=$('part-select').value;d.meshes.forEach((o,i)=>o.visible=d.part===''||String(i)===d.part);};
  $('compare-asset').onclick=()=>{if($('comparison-select').value)api.choosePath($('comparison-select').value);};
  $('palette-select').onchange=updatePalette;
  $('palette-color').oninput=()=>{const e=api.active();if(!e)return;const d=data(e),name=$('palette-select').value,hex=$('palette-color').value,color=new THREE.Color(hex),textured=d.textureRoles.get(name);if(textured){
      const {palette:p,name:role}=textured;
      setTexturePaletteColor(THREE,p,role,hex);
      d.changes.texturePalettes=Object.fromEntries(d.texturePalettes.filter(p=>Object.keys(p.changes).length).map(p=>[p.spec.material,{...p.changes}]));
    }else{if(d.roles.has(name)){for(const {mesh,attribute,id,scale} of d.roles.get(name)){const c=mesh.geometry.attributes.color;for(let i=0;i<attribute.count;i++)if(Math.round(attribute.getX(i)*scale)===id)c.setXYZ(i,color.r,color.g,color.b);c.needsUpdate=true;}}else d.materials[Number(name.slice(9))].m.color.copy(color);d.changes[name]=hex;}};
  $('roughness-range').oninput=()=>{const e=api.active();if(!e)return;const d=data(e),v=Number($('roughness-range').value);d.materials.forEach(({m})=>m.roughness=v);d.changes.roughness=v;};
  $('palette-reset').onclick=reset;$('copy-changes').onclick=$('copy-feedback').onclick=copy;
  $('capture-feedback').onclick=async()=>{const e=api.active();if(!e)return;const c=api.context(),m=e.model.contract;const filename=m.id+'_'+m.version+'_r'+m.revision+'_'+c.view;api.render();const blob=await new Promise(resolve=>api.canvas.toBlob(resolve,'image/png'));if(blob)download(blob,filename+'.png');download(new Blob([note()],{type:'application/json'}),filename+'.json');$('feedback-status').textContent='Saved the viewport and its matching refinement note.';};
  return {sync,update,dispose:e=>{if(e?.review)releaseTexturePreviews(e.review);clearOverlay();}};
}
