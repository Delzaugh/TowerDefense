import * as THREE from 'three';
export const WAREHOUSE=[-12,0,-6], ATRIUM=[17,0,-6];
export const VIEWS={
campus:{kicker:'THE CAMPUS',title:'A place to build together.',note:'Warm warehouse spaces, bright collaboration rooms and a green courtyard.',target:[-1,4,0],distance:82,theta:.66,phi:1.00},
warehouse:{kicker:'BRANNAN, REIMAGINED',title:'Warm wood. Open ideas.',note:'Exposed timber, oak desks and a café beneath the historic warehouse silhouette.',target:[-12,2,-5],distance:36,theta:.35,phi:1.00},
library:{kicker:'A QUIETER CORNER',title:'Settle into a good idea.',note:'Oak bookshelf pods, quilted reading alcoves and a softly lit work lounge. A small friend is hiding among the books.',target:[-20,6.65,-10.6],distance:24,theta:.08,phi:1.48},
atrium:{kicker:'COMMIT TO THE FUTURE',title:'Contributions, in space.',note:'Green contribution plates and a playful Octocat universe mural bring the gathering space to life.',target:[17,4,-6],distance:27,theta:.36,phi:1.10},
terrace:{kicker:'ABOVE THE CITY',title:'Take the conversation outside.',note:'A timber deck, concrete chess tables and a collaboration mural frame the rooftop gathering space.',target:[-12,16,-6],distance:37,theta:.45,phi:.86},
assets:{kicker:'THE REUSABLE KIT',title:'Every piece, up close.',note:'Explore the individual models for buildings, workspaces, roofs, floors, murals and landscape.',target:[0,1,0],distance:14,theta:.48,phi:1.03}
};
export function buildLayout(put,scene){
const levels=[];for(let level=0;level<3;level++){const g=new THREE.Group();g.name=`office-floor-${level}`;scene.add(g);levels.push(g);const y=level*5;
for(let ix=0;ix<5;ix++)for(let iz=0;iz<3;iz++){
if(level>0&&ix===4&&iz<2){
if(iz===0){const landing=put('gh_floor_wood',[0,y,-13.25],0,g);landing.scale.z=3.5/6;}
const z=iz===0?-10.25:-6,depth=iz===0?2.5:6;
const left=put('gh_floor_wood',[-1.95,y,z],0,g);left.scale.set(2.1/6,1,depth/6);
const right=put('gh_floor_wood',[2.55,y,z],0,g);right.scale.set(.9/6,1,depth/6);
}else put(level===0&&ix<2?'gh_floor_hex':'gh_floor_wood',[-24+ix*6,y,-12+iz*6],0,g);
}
for(const x of [-21,-9])for(const z of [-9,0])put('gh_timber_frame',[x,y+.18,z],0,g);
put('gh_stairs',[.6,y+.18,-8],0,g);
}
put('gh_cafe_bar',[-21,.18,-11],0,levels[0]);put('gh_lounge',[-21,.18,-3],0,levels[0]);put('gh_meeting_set',[-11,.18,-8],0,levels[0]);
put('gh_container',[-4,.18,-11],0,levels[0]);put('gh_workstation',[-4,.35,-11],0,levels[0]);
for(const x of [-21,-12,-3])put('gh_pendant',[x,3.5,-7],0,levels[0]);
put('gh_planter',[-15,.18,.9],0,levels[0]);put('gh_planter',[-8,.18,.9],0,levels[0]);
put('gh_bookshelf_pod',[-25.7,5.18,-11],0,levels[1]);
put('gh_worklounge_pod',[-21.2,5.18,-11],0,levels[1]);
put('gh_recessed_lounge',[-12.5,5.18,-11],0,levels[1]);
const secret=put('gh_secret_octocat',[-25.18,6.7925,-10.07],0,levels[1]);secret.scale.setScalar(.42);
put('gh_mural_currents',[-26.6,5.2,-3.5],Math.PI/2,levels[1]);
for(const x of [-13,-7])put('gh_workstation',[x,5.18,-3],0,levels[1]);
put('gh_glass_partition',[-16,5.18,-4.9],Math.PI/2,levels[1]);for(const x of [-21,-9])put('gh_pendant',[x,8.7,-7],0,levels[1]);put('gh_planter',[-3,5.18,-2],0,levels[1]);
put('gh_meeting_set',[-20,10.18,-9],0,levels[2]);put('gh_lounge',[-11,10.18,-9],0,levels[2]);put('gh_workstation',[-4,10.18,-10],0,levels[2]);put('gh_library',[-21,10.18,-2],0,levels[2]);
put('gh_membrane_wall',[-20,10.18,-12.5],0,levels[2]);put('gh_indoor_park',[-5,10.18,-3],0,levels[2]);
for(const [level,x] of [[0,-21],[1,-9],[2,-21]])put('gh_ceiling_services',[x,level*5+3.5,-9],0,levels[level]);
put('gh_glass_partition',[-15,10.18,-8],Math.PI/2,levels[2]);for(const x of [-12,-8,-4])put('gh_planter',[x,10.18,.5],0,levels[2]);for(const x of [-20,-7])put('gh_pendant',[x,13.5,-8],0,levels[2]);
const warehouse=put('gh_warehouse',WAREHOUSE);const roof=put('gh_roof_terrace',[-12,15.24,-6]);const terrace=new THREE.Group();scene.add(terrace);
put('gh_roof_furniture',[-20,15.45,-5],0,terrace);put('gh_roof_furniture',[-8,15.45,-6],0,terrace);put('gh_planter',[-24,15.45,.9],0,terrace);put('gh_planter',[-18,15.45,.9],0,terrace);put('gh_planter',[-12,15.45,.9],0,terrace);put('gh_planter',[-6,15.45,.9],0,terrace);
put('gh_mural_collaboration',[-9,15.45,-13.8],0,terrace);
const atrium=put('gh_atrium',ATRIUM);put('gh_contribution_art',[17,2,-9]);put('gh_lounge',[14.8,.3,-2]);put('gh_lounge',[20,.3,-2]);put('gh_planter',[12,.3,-10]);put('gh_planter',[22,.3,-10]);const bridge=put('gh_bridge',[7,5,-6]);
put('gh_mural_universe',[17,6.35,1.05]);
put('gh_entry_portal',[-12,0,4]);
for(let x=-33;x<=27;x+=6)for(let z=6;z<=24;z+=6)put('gh_floor_paving',[x,-.12,z]);
for(let x=3;x<=27;x+=6)for(let z=-15;z<=3;z+=6)put('gh_floor_paving',[x,-.12,z]);
put('gh_thinktocat',[-2,.07,13]);put('gh_sign',[-15,.05,19]);put('gh_courtyard',[12,.05,16]);put('gh_courtyard',[-26,.05,16],Math.PI/2);
put('gh_container',[24,.06,14]);put('gh_workstation',[22.5,.24,13.7]);put('gh_workstation',[25.5,.24,13.7]);
put('gh_facade_bay',[-31,0,4]);put('gh_facade_bay',[-34,0,4]);
for(const [x,z] of [[-34,-13],[-34,-4],[-32,24],[-20,25],[0,26],[18,25],[32,20],[32,5],[30,-16],[14,-19],[1,-19],[-21,-20]])put('gh_tree',[x,0,z]);
for(const [x,z,r] of [[-23,6,0],[-18,6,0],[-7,6,0],[2,18,0],[28,21,Math.PI/2],[4,-16,0],[-33,12,Math.PI/2]])put('gh_planter',[x,.07,z],r);
return {levels,warehouse,roof,terrace,atrium,bridge,secret};
}


