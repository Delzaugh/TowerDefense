export const ENEMY_CAP=200;
export function enemyCap(value){const n=Number(value);return Number.isInteger(n)&&n>=25&&n<=500?n:ENEMY_CAP;}
export const ENEMY_SPEED=10;
export const MAP_SCALE=Math.sqrt(2);
export const MAP_AREA_MULTIPLIER=2;
export const DEFAULT_SETTINGS={bert:true,octocat:true,maxEnemies:ENEMY_CAP};
export const wavesForCap=cap=>[{start:0,count:Math.round(cap*.4)},{start:8,count:cap-Math.round(cap*.4)},{start:16,count:cap}];
export const WAVES=wavesForCap(ENEMY_CAP);
export const MODELS=[
 {id:'copilot_base',version:'v02',url:'/TowerDefense/runtime/copilot_base_v02.glb?v=mufbvk10',clip:'work'},
 {id:'bert_breugelmans',version:'v01',url:'/TowerDefense/runtime/bert_breugelmans.glb?v=mufbvk10',clip:'work'},
 {id:'github_octocat_classic_lowpoly',version:'v01',url:'/TowerDefense/runtime/github_octocat_classic_lowpoly.glb?v=mufbvk10',clip:'idle'},
 {id:'copilot_developer',version:'v01',url:'/TowerDefense/runtime/copilot_developer.glb?v=mufbvk10',clip:'work',readyClip:'idle',placeClip:'place',resolveClip:'resolve'},
 {id:'copilot_rubber_duck',version:'v01',url:'/TowerDefense/runtime/copilot_rubber_duck.glb?v=mufbvk10',clip:null},
 {id:'copilot_shield',version:'v01',url:'/TowerDefense/runtime/copilot_shield.glb?v=mufbvk10',clip:null},
 {id:'golden_compiler',version:'v01',url:'/TowerDefense/runtime/golden_compiler.glb?v=mufbvk10',clip:'work'},
 {id:'copilot_commit_halo',version:'v01',url:'/TowerDefense/runtime/copilot_commit_halo.glb?v=mufbvk10',clip:'work'},
 {id:'linter_agent',version:'v01',url:'/TowerDefense/runtime/linter_agent.glb?v=mufbvk10',clip:null},
 {id:'problem_bug',version:'v01',url:'/TowerDefense/runtime/problem_bug.glb?v=mufbvk10',clip:'move',enemy:true,speedFactor:1.25},
 {id:'problem_vague_spec',version:'v01',url:'/TowerDefense/runtime/problem_vague_spec.glb?v=mufbvk10',clip:'move',enemy:true,speedFactor:.75},
 {id:'problem_missing_details',version:'v01',url:'/TowerDefense/runtime/problem_missing_details.glb?v=mufbvk10',clip:'move',enemy:true,speedFactor:1}
];
export const TOWER_TYPES=[['copilot_base','Copilot','General support'],['copilot_developer','Developer','Build specialist'],['copilot_rubber_duck','Rubber Duck','Debug companion'],['copilot_shield','Shield','Defensive support'],['golden_compiler','Golden Compiler','Compilation expert'],['copilot_commit_halo','Commit Halo','Version control'],['linter_agent','Linter','Code quality'],['bert_breugelmans','Bert','Heavy specialist']].map(([id,label,detail])=>({...MODELS.find(m=>m.id===id),label,detail}));
export const DECOR_IDS=['campus_tree_round','campus_tree_tall','campus_tree_cluster','campus_planter_bench','campus_bush_round','campus_flower_bed','campus_hedge','campus_wayfinding_sign','kaykit_rock_a','campus_coffee_kiosk'];
export const STRUCTURE_IDS=['kaykit_basemodule_a','kaykit_basemodule_b','kaykit_basemodule_garage','kaykit_tunnel_straight_a','kaykit_roofmodule_solarpanels','kaykit_cargodepot_a','kaykit_containers_a','kaykit_landingpad_small','kaykit_windturbine_tall','kaykit_solarpanel'];
export const MAP_SEED=230924;

