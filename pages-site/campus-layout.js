// Authored scene composition, metres. Reusable GLBs retain their own 1:1 scale.
export const DECOR_IDS=['campus_coffee_kiosk','campus_planter_bench','campus_code_sculpture','campus_meeting_nook','campus_wayfinding_sign'];
export const LIFE_IDS=['campus_flower_bed','campus_bush_round','campus_hedge','campus_path_bollard','campus_cafe_table','campus_noticeboard'];
DECOR_IDS.push(...LIFE_IDS);
export const KIT_IDS=['campus_base_hex','campus_tile_park','campus_tile_plaza','campus_tile_hill','campus_platform','campus_lab','campus_walk_straight','campus_walk_short','campus_walk_landing','campus_walk_corner','campus_walk_bend','campus_walk_bend_45','campus_walk_junction','campus_tree_round','campus_tree_tall','campus_tree_cluster','campus_pond','campus_solar',...DECOR_IDS];
export const SURFACE_Y=1.2;
export const HEX_RADIUS=18;
export const BASE_TILES=[[0,0],[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const hexCenter=(q,r)=>[1.5*HEX_RADIUS*q,0,Math.sqrt(3)*HEX_RADIUS*(r+q/2)];
export const STROLL_ROUTE={left:[-5.5,1.28,7],right:[2.5,1.28,7],width:3.2,minZ:5.4,maxZ:8.6};
export const WALK_TERMINALS=[[-4,1.28,1]]; // The single open port meets the lab entrance.
export const TILE_PROFILES={'0,1':'park','-1,0':'park','1,0':'plaza','0,-1':'hill'};
export function layout(){
  const items=BASE_TILES.map(([q,r])=>{const profile=TILE_PROFILES[q+','+r]||'mineral_composite';return {id:profile==='mineral_composite'?'campus_base_hex':'campus_tile_'+profile,position:hexCenter(q,r),rotation:profile==='mineral_composite'?((q*2+r*3+12)%6)*Math.PI/3:0,tile:{q,r,profile}};});items.push({id:'campus_lab',position:[-2,SURFACE_Y,-1.925],building:{id:'copilot-lab',label:'Copilot Lab',description:'A place to build together'}});
  const add=(id,x,z,rotation=0)=>items.push({id,position:[x,SURFACE_Y,z],rotation,decor:DECOR_IDS.includes(id)});
  for(const x of [-4,0,4]){add(x===0?'campus_walk_straight':'campus_walk_junction',x,7,x===-4?0:x===4?Math.PI:Math.PI/2);add(x===0?'campus_walk_junction':'campus_walk_straight',x,-9,x===0?0:Math.PI/2);}
  for(const x of [-10,10])for(const z of [-3,1]){const branch=x===-10&&z===-3||x===10&&z===1;add(branch?'campus_walk_junction':'campus_walk_straight',x,z,branch?(x<0?Math.PI/2:-Math.PI/2):0);}
  for(const [x,z,rotation] of [[-10,3,0],[6,7,Math.PI/2],[10,-5,Math.PI],[-6,-9,-Math.PI/2]])add('campus_walk_bend',x,z,rotation);
  add('campus_walk_straight',-4,3);
  // Four connected promenades join the lab loop to distinct campus destinations.
  for(let z=11;z<=31;z+=4)add('campus_walk_straight',4,z);
  for(let z=-13;z>=-33;z-=4)add('campus_walk_straight',0,z);
  for(const x of [14,18,22])add('campus_walk_straight',x,1,Math.PI/2);
  add('campus_walk_bend',28,5,Math.PI);
  for(const z of [7,11,15])add('campus_walk_straight',28,z);
  for(const x of [-14,-18,-22])add('campus_walk_straight',x,-3,Math.PI/2);
  add('campus_walk_bend',-28,-7);
  for(const z of [-9,-13,-17])add('campus_walk_straight',-28,z);
  for(const [x,z,rotation] of [[4,33,0],[0,-35,Math.PI],[28,17,0],[-28,-19,Math.PI]])add('campus_walk_landing',x,z,rotation);
  for(const [id,x,z,rotation] of [
    ['campus_tree_round',-13.6,-6.8,0],['campus_tree_round',-14,.5,0],['campus_tree_round',-7.5,12.3,0],
    ['campus_tree_tall',-4,-11.9,0],['campus_tree_tall',4,-11.9,0],['campus_tree_tall',12.5,6.5,0],
    ['campus_tree_cluster',-.1,12,0],['campus_tree_cluster',13.1,-3.8,Math.PI/2],
    ['campus_tree_tall',-31.5,15,0],['campus_tree_tall',28.5,-21,0],
    ['campus_tree_round',-10,29,0],['campus_tree_round',-7,37,0],['campus_tree_tall',10,29,0],['campus_tree_cluster',8,39,0],
    ['campus_tree_cluster',-35,-20,0],['campus_tree_tall',-21,-23,0],['campus_tree_round',-37,-8,0],['campus_tree_round',-18,-12,0],
    ['campus_tree_tall',20,21,0],['campus_tree_cluster',36,9,0],['campus_tree_round',32,28,0],
    ['campus_tree_tall',-11,-22,0],['campus_tree_round',11,-22,0],['campus_tree_cluster',-4,-41,0],
    ['campus_solar',2.4,-5.3,0],['campus_solar',6.3,-5.3,0]
  ])add(id,x,z,rotation);
  // Park commons: a coffee stop, sculpture and places to sit around the pond.
  for(const [id,x,z,r] of [
    ['campus_coffee_kiosk',-1,23,Math.PI/2],['campus_planter_bench',0,29,Math.PI/2],
    ['campus_planter_bench',8,34,-Math.PI/2],['campus_code_sculpture',4.4,1,0],
    ['campus_pond',-5,29,0],['campus_meeting_nook',-6,22,0],['campus_wayfinding_sign',7,20,0],
    // Warm stone plaza: kiosk faces the promenade, seating faces inward.
    ['campus_coffee_kiosk',23,9,Math.PI/2],['campus_meeting_nook',22,16,0],
    ['campus_code_sculpture',34,16,0],['campus_planter_bench',25,23,0],
    ['campus_planter_bench',34,22,0],['campus_wayfinding_sign',31,7,0],
    // Collaboration grove with clear access between two outdoor nooks.
    ['campus_meeting_nook',-22,-17,0],['campus_meeting_nook',-34,-12,Math.PI/2],
    ['campus_planter_bench',-24,-9,Math.PI/2],['campus_wayfinding_sign',-24,-21,0],
    // Hill route stays in the authored flat corridor; furniture uses level ground.
    ['campus_planter_bench',4,-40,0],['campus_wayfinding_sign',3,-23,0],
    ['campus_wayfinding_sign',13,4,0],['campus_planter_bench',-4,26,0]
  ])add(id,x,z,r);
  // Low planting frames gathering places; fixtures stay outside travel corridors.
  for(const [id,x,z,r] of [
    ['campus_cafe_table',-.5,18.5,0],['campus_cafe_table',22,25.2,0],
    ['campus_noticeboard',-1,38,0],['campus_noticeboard',33,11,-Math.PI/2],
    ['campus_flower_bed',-10,21,Math.PI/2],['campus_flower_bed',-9,34,0],
    ['campus_flower_bed',8,24,Math.PI/2],['campus_flower_bed',35,26,0],
    ['campus_flower_bed',-20,-12,Math.PI/2],['campus_flower_bed',-34,-17,0],
    ['campus_bush_round',-11,25,0],['campus_bush_round',-10,38,0],['campus_bush_round',11,34,0],
    ['campus_bush_round',38,15,0],['campus_bush_round',18.5,25.5,0],['campus_bush_round',-18,-19.5,0],
    ['campus_bush_round',-35,-6,0],['campus_bush_round',8,-42,0],
    ['campus_hedge',-5,42,0],['campus_hedge',34,5,0],['campus_hedge',-30,-25,0],
    ['campus_hedge',-38,-14,Math.PI/2],
    ['campus_path_bollard',1.6,15,0],['campus_path_bollard',6.4,27,0],
    ['campus_path_bollard',1,35,0],['campus_path_bollard',-2.4,-17,0],
    ['campus_path_bollard',2.8,-37,0],['campus_path_bollard',25.6,7,0],
    ['campus_path_bollard',32.1,20,0],['campus_path_bollard',-25.6,-13,0],
    ['campus_path_bollard',-31,-21,0],['campus_path_bollard',-16,-.6,0]
  ])add(id,x,z,r);
  return items;
}


export function auditWalkwayConnections(campus){
 const ports=[],pieces=campus.children.filter(o=>o.name.startsWith('campus_walk_'));
 for(const [piece,instance] of pieces.entries()){
  instance.traverse(node=>{if(['anchor_start','anchor_end','anchor_branch'].includes(node.name)){
   const m=node.matrixWorld.elements;
   let direction=node.name==='anchor_start'?[0,-1]:[0,1];
   if(instance.name==='campus_walk_junction')direction=node.name==='anchor_start'?[-1,0]:node.name==='anchor_end'?[1,0]:[0,-1];
   else if(instance.name==='campus_walk_bend'||instance.name==='campus_walk_corner')direction=node.name==='anchor_start'?[0,-1]:[1,0];
   else if(instance.name==='campus_walk_bend_45')direction=node.name==='anchor_start'?[0,-1]:[Math.SQRT1_2,Math.SQRT1_2];
   const [x,z]=direction,c=Math.cos(instance.rotation.y),s=Math.sin(instance.rotation.y);
   ports.push({piece,asset:instance.name,anchor:node.name,position:[m[12],m[13],m[14]],direction:[c*x+s*z,-s*x+c*z]});
  }});
 }
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const loose=[],invalid=[],neighbors=pieces.map(()=>new Set());
 for(const [index,port] of ports.entries()){
  const mates=ports.filter((p,i)=>i!==index&&distance(p.position,port.position)<.0001);
  if(!mates.length)loose.push(port);
  if(mates.length>1||Math.abs(port.position[1]-1.28)>.0001)invalid.push(port);
  if(mates.length===1){const mate=mates[0];neighbors[port.piece].add(mate.piece);if(port.direction[0]*mate.direction[0]+port.direction[1]*mate.direction[1]>-.99999)invalid.push({...port,reason:'joined paths do not face each other'});}
 }
 const reached=new Set(),queue=pieces.length?[0]:[];while(queue.length){const p=queue.pop();if(reached.has(p))continue;reached.add(p);queue.push(...neighbors[p]);}
 const connected=reached.size===pieces.length;
 const passed=connected&&invalid.length===0&&loose.length===WALK_TERMINALS.length&&WALK_TERMINALS.every(end=>loose.some(port=>distance(port.position,end)<.0001));
 return {passed,connected,pieces:pieces.length,ports:ports.length,connections:(ports.length-loose.length)/2,entrance:loose,invalid,tolerance:.0001};
}



export function auditBaseTiles(campus){
 const tiles=campus.children.filter(o=>o.userData.campusTile),edges=[];
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(const [index,tile] of tiles.entries()){
  tile.traverse(node=>{if(node.name.startsWith('anchor_edge_')){const m=node.matrixWorld.elements;edges.push({tile:index,name:node.name,position:[m[12],m[13],m[14]]});}});
 }
 let matched=0,exposed=0;const invalid=[];
 for(const edge of edges){const mates=edges.filter(other=>other.tile!==edge.tile&&distance(edge.position,other.position)<.0001);if(mates.length===1)matched++;else if(mates.length===0)exposed++;else invalid.push(edge);if(Math.abs(edge.position[1]-SURFACE_Y)>.0001)invalid.push(edge);}
 const occupied=new Set(BASE_TILES.map(([q,r])=>q+','+r));
 const neighbors=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const expectedPairs=BASE_TILES.reduce((n,[q,r])=>n+neighbors.filter(([dq,dr])=>occupied.has((q+dq)+','+(r+dr))).length,0)/2;
 const centers=BASE_TILES.map(([q,r])=>hexCenter(q,r)),xs=centers.map(p=>p[0]),zs=centers.map(p=>p[2]);
 return {passed:tiles.length===BASE_TILES.length&&matched===2*expectedPairs&&exposed===6*tiles.length-2*expectedPairs&&invalid.length===0,tiles:tiles.length,joinedEdges:matched/2,exposedEdges:exposed,area:tiles.length*3*Math.sqrt(3)/2*HEX_RADIUS**2,width:Math.max(...xs)-Math.min(...xs)+2*HEX_RADIUS,depth:Math.max(...zs)-Math.min(...zs)+Math.sqrt(3)*HEX_RADIUS,surfaceProfiles:[...new Set(tiles.map(t=>t.userData.campusTile.profile))],invalid};
}











