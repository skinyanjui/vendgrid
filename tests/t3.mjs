import { JSDOM } from 'jsdom'; import fs from 'fs';
const errors=[];
const dom=new JSDOM('<!doctype html><html><body>'+fs.readFileSync(new URL('../dist/index.html', import.meta.url),'utf8')+'</body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.scrollTo=()=>{};w.fetch=()=>Promise.reject(new Error('offline'));w.console.error=(...a)=>errors.push(a.join(' ').slice(0,200));w.addEventListener('error',e=>errors.push(e.message));}});
const w=dom.window,d=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const nav=async h=>{w.location.hash=h;await sleep(450)};
const btn=t=>[...d.querySelectorAll('button,a.btn')].find(b=>b.textContent.includes(t));
const click=async t=>{const b=btn(t);if(!b){console.log('MISSING',t);return}b.click();await sleep(350)};
const setv=(id,v)=>{const el=d.getElementById(id);if(el&&el.getAttribute('role')==='radiogroup'){const b=[...el.querySelectorAll('[role=radio]')].find(x=>x.textContent===v);if(b)b.click();return;}Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}))};
await sleep(600);
await nav('#/admin'); setv('em','admin@vendgrid.test'); await sleep(50); d.querySelector('form button.btn').click(); await sleep(450);
console.log('admin page', w.location.hash, d.querySelector('h1')?.textContent);
await nav('#/billing');
await click('Start Professional'); console.log('pending badge:', d.querySelector('.panel .badge')?.textContent);
await nav('#/my-listings'); console.log('analytics before pay:', !!d.querySelector('[aria-label=Analytics]'));
await nav('#/billing'); await click('Sandbox: send payment'); console.log('plan badge:', d.querySelector('.panel .badge')?.textContent, '| invoices', d.querySelectorAll('.list .item').length);
await click('replay last payment'); await sleep(100);console.log('toast:', d.querySelector('.toast')?.textContent);
await nav('#/my-listings'); console.log('analytics after pay:', !!d.querySelector('[aria-label=Analytics]'));
// promote listing 104
const prom=[...d.querySelectorAll('button')].find(b=>b.textContent.includes('Promote'));prom.click();await sleep(400);
console.log('billing after promote ->', w.location.hash, d.body.textContent.includes('Waiting for payment confirmation'));
await click('Sandbox: send payment'); 
await nav('#/?cat=machines'); console.log('sponsored badges now', d.querySelectorAll('.badge.sp').length);
// verification
await nav('#/business-settings'); setv('vb-l','Demo Vending LLC'); setv('vb-p','812-555-0100'); setv('vb-d','demovending.example');
// file input can't be set easily; check error path
await click('Submit for review'); console.log('verif err:', d.querySelector('.err')?.textContent);
// report + admin
await nav('#/listing/102/x'); await click('Report listing'); setv('rep','Spam or duplicate'); await sleep(50); await click('Submit report');
await nav('#/admin?tab=reports'); console.log('reports rows', d.querySelectorAll('.item').length); await click('Withdraw listing');
await nav('#/?cat=machines'); console.log('machines after withdraw', d.querySelectorAll('article.card').length);
await nav('#/admin?tab=audit'); console.log('audit rows', d.querySelectorAll('.item').length);
console.log('JS errors', errors.length, errors.slice(0,4));
process.exit(0);
