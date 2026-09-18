import {readFileSync,writeFileSync} from 'node:fs';
const source=new URL('./source/',import.meta.url);
const template=readFileSync(new URL('template.html',source),'utf8');
const css=readFileSync(new URL('styles.css',source),'utf8');
const script=readFileSync(new URL('app.js',source),'utf8');
const html=template.replace('/* GLACIER_STYLES */',()=>css).replace('/* GLACIER_SCRIPT */',()=>script);
writeFileSync(new URL('./index.html',import.meta.url),html);
console.log('Built Glacier.');
