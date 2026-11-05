import { JSDOM } from 'jsdom'; import fs from 'fs';
const dom=new JSDOM('<!doctype html><html><body>'+fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8')+'</body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.scrollTo=()=>{};}});
const w=dom.window,d=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const nav=async h=>{w.location.hash=h;await sleep(450)};
const setv=(id,v)=>{const el=d.getElementById(id);if(el&&el.getAttribute('role')==='radiogroup'){const b=[...el.querySelectorAll('[role=radio]')].find(x=>x.textContent===v);if(b)b.click();return;}const P=el.tagName==='SELECT'?w.HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?w.HTMLTextAreaElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(P,'value').set.call(el,v);el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}))};
const btn=t=>[...d.querySelectorAll('button,a.btn')].find(b=>b.textContent.includes(t));
await sleep(500);
console.log('h1 on browse:', d.querySelectorAll('h1').length);
// 1. race: type + Enter inside debounce window
const s=d.querySelector('input[type=search]');
const set=Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set;
set.call(s,'vending route'); s.dispatchEvent(new w.Event('input',{bubbles:true}));
await sleep(100); s.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
await sleep(900); console.log('race hash after 900ms:', decodeURIComponent(w.location.hash));
// login
await nav('#/login'); setv('em','sam@test.com'); await sleep(30); d.querySelector('form button.btn').click(); await sleep(400);
// 2. duplicate inquiry drops message
await nav('#/listing/105/inquire'); await sleep(200);
const doInq=async(note)=>{ await nav('#/listing/105/inquire'); setv('q-intent','Ask a question first'); setv('q-note',note); await sleep(30); d.querySelector('form button.btn.block').click(); await sleep(900); };
await doInq('first message'); await doInq('SECOND MESSAGE should be sent');
console.log('thread has second msg?', d.querySelector('.thread')?.textContent.includes('SECOND MESSAGE'));
// 3. negotiable price dropped
await nav('#/post?type=machines'); setv('p-title','Test machine listing'); setv('p-desc','A description that is certainly longer than thirty characters.'); setv('p-city','Evansville, IN');
console.log('sel opts ok');
console.log('JS done');
process.exit(0);
