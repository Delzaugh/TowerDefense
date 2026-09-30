import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const pages=[
 ['original-gallery','https://officesnapshots.com/2015/04/06/github-san-francisco-headquarters/'],
 ['original-architect','https://fm-arch.com/workitems/github/'],
 ['rapt-expansion','https://raptstudio.com/work/github/'],
 ['atrium','https://interiorarchitects.com/projects/githubatrium/'],
 ['furniture','https://mashstudios.com/projects/github/'],
 ['roof-furniture','https://concreteworks.com/projects/github-hq/'],
 ['contractor','https://www.truebeck.com/project/github-headquarters/'],
 ['expansion-contractor','https://www.scbuildersinc.com/projects/github-sf-hq/'],
 ['amsterdam-mural','https://sasj.nl/portfolio/tesselatedplots/'],
 ['boulder','https://github.blog/news-insights/the-library/patchwork-night-boulder-edition/'],
 ['brand-logo','https://brand.github.com/foundations/logo'],
 ['exterior','https://json-schema.org/blog/posts/github-case-study']
];
const documents=[
 ['fourth-street-leasing.pdf','https://images1.showcase.com/d2/x3rCf2s1Leabz87sMnGnmrNo4pqx95ytPong8NAHowo/document.pdf'],
 ['sf-planning-2016-000845COA-02.pdf','https://commissions.sfplanning.org/hpcpackets/2016-000845COA-02.pdf'],
 ['newlight-2019-usa.pdf','https://newmatworld.com/headquarters/wp-content/uploads/2019/02/Catalogue_NEWLIGHT_2019_USA_Web.pdf']
];
const results=await Promise.allSettled(pages.map(async([id,url])=>{
 const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`${id}: HTTP ${r.status}`);
 const html=await r.text();await fs.writeFile(path.join(root,'work',id+'.html'),html);
 const images=[...new Set([...html.matchAll(/(?:https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|svg)(?:\?[^\s"'<>]*)?)/gi)].map(m=>m[0].replace(/&amp;/g,'&')))];
 const record={id,url,finalUrl:r.url,images};await fs.writeFile(path.join(root,'work',id+'-images.json'),JSON.stringify(record,null,2));
 console.log(JSON.stringify({id,status:r.status,imageCount:images.length,images:images.filter(x=>/github|rapt|octocat|mona|plot/i.test(x)).slice(0,30)}));
}));
for(const r of results)if(r.status==='rejected')console.log(String(r.reason));
for(const[name,url]of documents){try{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());await fs.writeFile(path.join(root,'documents',name),b);console.log(JSON.stringify({document:name,bytes:b.length,url}));}catch(e){console.log(JSON.stringify({document:name,error:String(e)}));}}
