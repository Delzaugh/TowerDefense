// Explicit presentation clip mappings; gameplay remains outside this render fixture.
export const STRESS_ASSETS=[
 {id:'copilot_base',version:'v02',url:'/TowerDefense/runtime/copilot_base_v02.glb?v=mufbvk10',role:'tower',clip:'work',activity:'attack'},
 {id:'bert_breugelmans',version:'v01',url:'/TowerDefense/runtime/bert_breugelmans.glb?v=mufbvk10',role:'heavyTower',clip:'work',activity:'attack'},
 {id:'github_octocat_classic_lowpoly',version:'v01',url:'/TowerDefense/runtime/github_octocat_classic_lowpoly.glb?v=mufbvk10',role:'mover',clip:'move',activity:'move'},
 {id:'problem_bug',version:'v01',url:'/TowerDefense/runtime/problem_bug.glb?v=mufbvk10',role:'mover',clip:'move',activity:'move'},
 {id:'problem_vague_spec',version:'v01',url:'/TowerDefense/runtime/problem_vague_spec.glb?v=mufbvk10',role:'mover',clip:'move',activity:'move'}
];
export const STRESS_PLAN=[
 {name:'baseline',towers:0,movers:0,heavyTowers:0},
 {name:'standard',towers:20,movers:100,heavyTowers:2},
 {name:'heavy',towers:35,movers:100,heavyTowers:2},
 {name:'overload',towers:50,movers:200,heavyTowers:2}
];

