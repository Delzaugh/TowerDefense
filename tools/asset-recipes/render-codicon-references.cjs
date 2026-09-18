const path=require('node:path'),fs=require('node:fs/promises');
const sharp=require(path.join(path.dirname(process.env.PLAYWRIGHT_MODULE_PATH),'sharp'));
const names=['agent','book','lightbulb','mcp','github','code','copilot'];
(async()=>{
 const layers=[];
 for(const [i,name] of names.entries()){
  const svg=await fs.readFile('assets/third_party/microsoft/vscode-codicons/6833ea2bc5fc49220e261a4a0fd1986ea02d1d0c/src/icons/'+name+'.svg');
  layers.push({input:await sharp(svg,{density:1200}).resize(280,280,{fit:'contain',background:'#dce5ed'}).flatten({background:'#dce5ed'}).png().toBuffer(),left:(i%4)*320+20,top:Math.floor(i/4)*340+10});
  layers.push({input:Buffer.from('<svg width="320" height="40"><text x="160" y="27" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#172531">'+name+'</text></svg>'),left:(i%4)*320,top:Math.floor(i/4)*340+290});
 }
 await fs.mkdir('artifacts/codicons',{recursive:true});
 await sharp({create:{width:1280,height:680,channels:4,background:'#dce5ed'}}).composite(layers).png().toFile('artifacts/codicons/svg-reference-board.png');
})();
