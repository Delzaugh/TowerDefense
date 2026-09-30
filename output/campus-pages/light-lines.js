import * as THREE from 'three';


// Presentation-only void grid. Tile materials and terrain live in Blender.
export function createCampusLightLines(scene){
 const group=new THREE.Group();group.name='campus_light_lines';scene.add(group);
 const gridMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,
  uniforms:{uStrength:{value:.025}},
  vertexShader:'varying vec2 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xz;gl_Position=projectionMatrix*viewMatrix*world;}',
  fragmentShader:[
   'uniform float uStrength;varying vec2 vWorld;',
   'void main(){vec2 p=vWorld/3.;vec2 d=abs(fract(p-.5)-.5)/max(fwidth(p),vec2(.00001));float line=1.-smoothstep(.15,.9,min(d.x,d.y));',
   'vec3 color=mix(vec3(.22,.60,.67),vec3(.50,.39,.79),smoothstep(-45.,45.,vWorld.x));float fade=1.-smoothstep(60.,100.,length(vWorld));gl_FragColor=vec4(color,line*uStrength*fade);',
   '#include <colorspace_fragment>',
   '}'
  ].join('\n')
 });
 // The grid sits below the opaque campus; no grid geometry is placed on tiles.
 const backgroundGrid=new THREE.Mesh(new THREE.PlaneGeometry(240,240),gridMaterial);
 backgroundGrid.name='void_grid';backgroundGrid.rotation.x=-Math.PI/2;backgroundGrid.position.y=-.63;backgroundGrid.renderOrder=1;group.add(backgroundGrid);
 // Edge streaks removed at the user's request. Keep only the quiet void grid.
 return {setTime:()=>{},traceCount:0,gridTiles:0,state:()=>({time:0,heads:[],paths:[],pathStyle:'disabled',gridY:backgroundGrid.position.y,implementation:'void grid only'})};
}
