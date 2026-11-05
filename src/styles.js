export const CSS = `
:root{
  --background:#fff;--background-subtle:#f5f5f5;--foreground:#0a0a0a;
  --gray-100:#f0f0f0;--gray-200:#e6e6e6;--gray-300:#d4d4d4;--gray-400:#b8b8b8;--gray-500:#8a8a8a;
  --gray-700:#4a4a4a;--gray-800:#333;--gray-1000:#0a0a0a;
  --blue:#0058d1;--red:#c4262b;--green:#1f7a35;--amber:#8a5a00;
  --border:var(--gray-300);--text-muted:#444;
  --radius-sm:4px;--radius-md:6px;--radius-lg:8px;--radius-xl:12px;
  --shadow-md:0 4px 12px rgba(0,0,0,.12);--shadow-lg:0 12px 32px rgba(0,0,0,.2);
  --ease:cubic-bezier(.4,0,.2,1);--fast:100ms;--base:150ms;--slow:250ms;
  --font-sans:"Geist",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --header-h:56px;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --background:#0a0a0a;--background-subtle:#141414;--foreground:#f5f5f5;
  --gray-100:#1c1c1c;--gray-200:#242424;--gray-300:#3a3a3a;--gray-400:#555;--gray-500:#9a9a9a;
  --gray-700:#c8c8c8;--gray-800:#dedede;--gray-1000:#f5f5f5;
  --blue:#5aa2ff;--red:#ff7a7f;--green:#5fd07a;--amber:#f2b94b;
  --text-muted:#c8c8c8;--shadow-md:0 4px 12px rgba(0,0,0,.6);--shadow-lg:0 12px 32px rgba(0,0,0,.8);;color-scheme:dark}}
:root[data-theme="dark"]{
  --background:#0a0a0a;--background-subtle:#141414;--foreground:#f5f5f5;
  --gray-100:#1c1c1c;--gray-200:#242424;--gray-300:#3a3a3a;--gray-400:#555;--gray-500:#9a9a9a;
  --gray-700:#c8c8c8;--gray-800:#dedede;--gray-1000:#f5f5f5;
  --blue:#5aa2ff;--red:#ff7a7f;--green:#5fd07a;--amber:#f2b94b;
  --text-muted:#c8c8c8;--shadow-md:0 4px 12px rgba(0,0,0,.6);--shadow-lg:0 12px 32px rgba(0,0,0,.8);;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0}
html{color-scheme:light}body{background:var(--background);color:var(--foreground);font:400 14px/20px var(--font-sans);-webkit-font-smoothing:antialiased}
button,input,select,textarea{font:inherit;color:inherit}
a{color:inherit;text-decoration:none}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.muted{color:var(--text-muted)}
h1,h2,h3{margin:0;font-weight:600}
h1{font-size:24px;line-height:32px;letter-spacing:-.015em}
h2{font-size:20px;line-height:28px;letter-spacing:-.01em}
h3{font-size:14px;line-height:20px}
.icon{width:20px;height:20px;flex:none}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:var(--radius-md);border:1px solid transparent;font-weight:500;cursor:pointer;background:var(--foreground);color:var(--background);transition:background var(--fast) var(--ease),border-color var(--fast) var(--ease);white-space:nowrap}
.btn:hover{background:var(--gray-800)}
.btn.secondary{background:var(--background);color:var(--foreground);border-color:var(--border)}
.btn.secondary:hover{background:var(--gray-100)}
.btn.ghost{background:transparent;color:var(--gray-700)}
.btn.ghost:hover{background:var(--gray-100);color:var(--foreground)}
.btn.danger{background:var(--red);color:#fff}
.btn.sm{height:32px;padding:0 12px}
.btn.block{width:100%;height:44px}
.btn[disabled]{background:var(--gray-100);color:var(--gray-500);cursor:not-allowed;border-color:var(--gray-200)}
.iconbtn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius-md);border:0;background:transparent;cursor:pointer;color:var(--foreground)}
.iconbtn:hover{background:var(--gray-100)}

/* inputs */
.field{display:flex;flex-direction:column;gap:4px}
.field label,.label{font-weight:500;font-size:14px}
.field .hint{font-size:12px;line-height:16px;color:var(--text-muted)}
.field .err{font-size:12px;line-height:16px;color:var(--red)}
.input,.select,.textarea{height:40px;border:1px solid var(--gray-400);border-radius:var(--radius-md);background:var(--background);padding:0 12px;font-size:16px;max-width:100%}
.select{width:auto;padding-right:8px}
.textarea{height:auto;min-height:96px;padding:8px 12px;resize:vertical;width:100%}
.input:focus,.select:focus,.textarea:focus{outline:2px solid var(--blue);outline-offset:0;border-color:var(--blue)}
.input.bad,.select.bad,.textarea.bad{border-color:var(--red)}
.input.full{width:100%}
@media(min-width:768px){.input,.select,.textarea{font-size:14px}}

/* chips */
.chip{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 12px;border-radius:9999px;background:var(--gray-100);border:1px solid var(--gray-200);font-size:12px;font-weight:500;line-height:16px;white-space:nowrap;color:var(--foreground)}
button.chip{cursor:pointer}
button.chip:hover{background:var(--gray-200)}
.chip.on{background:var(--foreground);color:var(--background);border-color:var(--foreground)}
.chip .x{display:inline-flex;margin-right:-6px;width:20px;height:20px;align-items:center;justify-content:center;border:0;background:transparent;border-radius:50%;cursor:pointer;color:inherit}
.chip .x:hover{background:var(--gray-300)}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:12px;line-height:16px;font-weight:500;padding:0 6px;height:20px;border-radius:var(--radius-sm);border:1px solid var(--border);color:var(--text-muted);background:var(--background)}
.badge.ok{color:var(--green);border-color:var(--green)}
.badge.sp{color:var(--foreground);border-color:var(--foreground)}
.badge.warn{color:var(--amber);border-color:var(--amber)}
.badge.bad{color:var(--red);border-color:var(--red)}

/* shell */
.hdr{position:sticky;top:0;z-index:30;background:var(--background);border-bottom:1px solid var(--border);display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"brand search menu";gap:8px 8px;padding:8px 16px;align-items:center}
.brand{grid-area:brand;font-weight:600;font-size:20px;letter-spacing:-.02em;display:flex;align-items:center;gap:8px;height:40px}
.brand i{flex:none;display:inline-flex;width:24px;height:24px;border-radius:6px;background:var(--foreground);color:var(--background);align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:600}
.sbox{grid-area:search;position:relative}
.sbox .input{width:100%;padding-left:36px;height:44px;border-radius:var(--radius-lg)}
.sbox .sicon{position:absolute;left:10px;top:12px;color:var(--gray-700);pointer-events:none}
.sugg{position:absolute;left:0;right:0;top:48px;background:var(--background);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-md);overflow:hidden;z-index:40}
.sugg [role=option]{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;min-height:44px}
.sugg [role=option][aria-selected=true],.sugg [role=option]:hover{background:var(--gray-100)}
.sugg .kind{font-size:12px;color:var(--text-muted)}
.locwrap{grid-area:loc;position:relative}
.menubtn{grid-area:menu;justify-self:end}
.bname{display:none}
.brand{min-width:40px;justify-content:center}
.crumbs a{display:inline-flex;align-items:center;min-height:32px}
.hdr-end{display:none}
.hdr-end{grid-area:end}
.locwrap{grid-area:auto}
.bar{position:relative}
@media(min-width:700px) and (max-width:900px){.toprow .flabel{display:none}}
@media(min-width:700px){.toprow{display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;gap:8px 16px}.toprow .chips{flex:1 1 auto;min-width:0;margin:0;padding:2px 0}.toprow .bar{flex:none;margin-left:auto;justify-content:flex-end}.toprow .bar .grow{display:none}}
.bar .locwrap{position:static}
.bar .pop{left:0;right:auto;top:52px}
.hdr-right{display:none;grid-area:acct;gap:8px;align-items:center}
.pop{position:absolute;right:0;top:48px;width:300px;max-width:calc(100vw - 32px);background:var(--background);border:1px solid var(--border);border-radius:var(--radius-xl);box-shadow:var(--shadow-lg);padding:16px;z-index:50;display:flex;flex-direction:column;gap:12px}
.pop .opts{display:flex;flex-direction:column}
.pop .opts button{text-align:left;border:0;background:transparent;padding:8px;border-radius:var(--radius-md);cursor:pointer;min-height:40px}
.pop .opts button:hover{background:var(--gray-100)}
.sidebar{display:none}
.main{padding:16px;max-width:1920px;width:100%;min-width:0;margin:0 auto;padding-bottom:96px}
.layout{display:block}
@media(min-width:768px){
  .hdr{grid-template-columns:minmax(max-content,1fr) minmax(240px,560px) minmax(max-content,1fr);grid-template-areas:"brand search end";padding:8px 24px;gap:16px}
  .brand{justify-self:start}
  .bname{display:inline}
  .brand{justify-content:flex-start}
  .hdr-end{display:flex;justify-content:flex-end;align-items:center;gap:8px}
  .menubtn{display:none}
  .hdr-right{display:flex}
  .layout{display:grid;grid-template-columns:200px minmax(0,1fr)}
  .sidebar{display:flex;flex-direction:column;gap:2px;padding:16px 12px;border-right:1px solid var(--border);position:sticky;top:var(--header-h);align-self:start;height:calc(100vh - var(--header-h))}
  .sidebar a{display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;border-radius:var(--radius-md);color:var(--gray-800);font-weight:500}
  .sidebar a:hover{background:var(--gray-100)}
  .sidebar a[aria-current=page]{background:var(--foreground);color:var(--background)}
  .sidebar .note{margin-top:auto;font-size:12px;line-height:16px;color:var(--text-muted);padding:12px}
  .main{padding:16px 32px 64px}
  .hdr{--header-h:64px}
}
.count{margin-left:auto;background:var(--foreground);color:var(--background);border-radius:9999px;min-width:20px;height:20px;font-size:12px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.sidebar [aria-current=page] .count{background:var(--background);color:var(--foreground)}

/* browse */
.chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none;margin:0 -16px;padding-left:16px;padding-right:16px}
.chips::-webkit-scrollbar{display:none}
.bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0}
.bar .btn,.bar .select{height:32px;font-size:13px}
.bar .btn{padding:0 12px}
.bar .btn.vtoggle.on,.bar .btn.vtoggle.on:hover{background:var(--foreground);color:var(--background);border-color:var(--foreground)}
@media(max-width:560px){.bar{flex-wrap:nowrap;gap:6px}.bar .grow{display:none}.bar .row2{margin-left:auto}.bar .btn{padding:0 10px}}
@media(max-width:400px){.flabel{display:none}}
@media(max-width:767px){.bar .select{font-size:16px}}
.bar .select{padding-top:0;padding-bottom:0}
.bar .grow{flex:1}
.llabel{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ctx{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;color:var(--text-muted);padding:8px 0 8px}
.ctx>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ctx .btn{flex:none;margin-right:-12px}
.ctx b{color:var(--foreground);font-weight:600}
.tokens{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:4px 0}
.grid{display:grid;gap:16px 12px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:359px){.grid{grid-template-columns:minmax(0,1fr)}}
@media(min-width:768px){.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}
@media(min-width:1024px){.grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:1200px){.grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(min-width:1440px){.grid{grid-template-columns:repeat(6,minmax(0,1fr))}}

.card{position:relative;background:var(--background);border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;display:flex;flex-direction:column;transition:border-color var(--fast) var(--ease)}
.card:hover,.card:focus-within{border-color:var(--foreground)}
.thumb{position:relative;aspect-ratio:4/3;background:var(--gray-200);display:flex;align-items:center;justify-content:center;color:var(--gray-700);overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb .fallback{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;font-weight:500}
.thumb .fallback .g{width:40px;height:40px;border-radius:10px;border:1.5px solid var(--gray-700);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600}
.thumb .cat{position:absolute;left:8px;top:8px}
.vbadge{position:absolute;left:8px;bottom:8px;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--green);color:var(--background);z-index:1}
.card:hover .vbadge,.card:focus-within .vbadge{opacity:0}
.thumb .peek{position:absolute;inset:0;background:var(--foreground);color:var(--background);padding:12px;font-size:12px;line-height:16px;opacity:0;transition:opacity var(--base) var(--ease);display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;overflow:hidden;pointer-events:none}
.card:hover .peek,.card:focus-within .peek{opacity:1}
@media(hover:none){.thumb .peek{display:none}}
.save{position:absolute;right:8px;top:8px;z-index:2;width:44px;height:44px;margin:-6px -6px 0 0;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer}
.save span{width:32px;height:32px;border-radius:50%;background:var(--background);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--foreground)}
.save:hover span{border-color:var(--foreground)}
.save[aria-pressed=true] span{background:var(--foreground);color:var(--background)}
.cbody{padding:12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.ctitle{font-weight:400;color:var(--gray-800);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:40px}
.ctitle::after{content:"";position:absolute;inset:0}
.cprice{font-size:16px;line-height:24px;font-weight:600;letter-spacing:-.005em}
.cmeta,.cloc{font-size:12px;line-height:16px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cseller{display:flex;gap:4px;align-items:center;margin-top:4px;position:relative;z-index:1;flex-wrap:wrap}
.cseller .org{font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.skel{background:var(--gray-200);border-radius:var(--radius-md);animation:pulse 1.5s var(--ease) infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
.empty{border:1px dashed var(--gray-400);border-radius:var(--radius-xl);padding:48px 24px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}
.empty p{margin:0;max-width:440px;color:var(--text-muted)}
.empty h1{font-size:20px;line-height:28px;margin:0}
.alert{border:1px solid var(--red);border-radius:var(--radius-lg);padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}

/* drawer */
.scrim{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:60}
.drawer{position:fixed;z-index:61;background:var(--background);display:flex;flex-direction:column;box-shadow:var(--shadow-lg);bottom:0;left:0;right:0;max-height:88vh;border-radius:var(--radius-xl) var(--radius-xl) 0 0}
@media(min-width:768px){.drawer{left:auto;top:0;width:400px;max-height:none;border-radius:0}}
.drawer header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}
.drawer .body{padding:16px;overflow:auto;display:flex;flex-direction:column;gap:16px}
.drawer footer{padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:space-between;padding-bottom:calc(12px + env(safe-area-inset-bottom))}
.checks{display:flex;flex-wrap:wrap;gap:8px}
.row2{display:flex;gap:8px;align-items:center}

/* detail */
.crumbs{display:flex;gap:8px;align-items:center;color:var(--text-muted);font-size:12px;line-height:16px;flex-wrap:wrap;margin-bottom:12px}
.crumbs a:hover{text-decoration:underline}
.detail{display:grid;gap:24px}
@media(min-width:1024px){.detail{grid-template-columns:minmax(0,1fr) 340px;align-items:start}}
.gallery{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;border-radius:var(--radius-xl)}
.gallery .thumb{flex:0 0 100%;scroll-snap-align:start;border-radius:var(--radius-xl);aspect-ratio:4/3;max-height:520px}
.panel{border:1px solid var(--border);border-radius:var(--radius-xl);background:var(--background);padding:16px;display:flex;flex-direction:column;gap:16px}
.actionpanel{position:fixed;left:0;right:0;bottom:0;z-index:25;border-radius:0;border-width:1px 0 0;padding:12px 16px calc(12px + env(safe-area-inset-bottom));flex-direction:row;align-items:center;gap:12px}
.actionpanel .pv{flex:1 1 auto;min-width:0}
.actionpanel .pv .price-lg{font-size:20px;line-height:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.actionpanel .pv .muted{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;line-height:16px}
.actionpanel .btn.block,.actionpanel>a.btn{width:auto;flex:none;min-width:148px;padding:0 20px}
@media(max-height:500px){.actionpanel{padding-top:8px;padding-bottom:calc(8px + env(safe-area-inset-bottom))}.actionpanel .btn.block{height:40px}}
.actionpanel .extra{display:none}
@media(min-width:1024px){.actionpanel .pv .price-lg{font-size:24px;line-height:32px;white-space:normal}.actionpanel .btn.block,.actionpanel>a.btn{width:100%;min-width:0}.actionpanel{position:sticky;top:calc(var(--header-h) + 16px);flex-direction:column;align-items:stretch;border-width:1px;border-radius:var(--radius-xl);padding:16px}.actionpanel .extra{display:flex}}
.price-lg{font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.015em}
.facts{display:grid;grid-template-columns:1fr;gap:0;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
.facts div.r{display:flex;justify-content:space-between;gap:16px;padding:12px 16px;border-top:1px solid var(--border)}
.facts div.r:first-child{border-top:0}
.facts dt{color:var(--text-muted)}
.facts dd{margin:0;text-align:right;font-weight:500}
details.disc{border:1px solid var(--border);border-radius:var(--radius-lg)}
details.disc summary{cursor:pointer;padding:12px 16px;font-weight:500;min-height:44px;display:flex;align-items:center}
details.disc[open] summary{border-bottom:1px solid var(--border)}
.sect{display:flex;flex-direction:column;gap:12px}
.banner{border:1px solid var(--amber);color:var(--foreground);border-radius:var(--radius-lg);padding:12px 16px}

/* forms / pages */
.page{max-width:720px;margin:0;display:flex;flex-direction:column;gap:24px}
.page.wide{max-width:1100px}
.stack{display:flex;flex-direction:column;gap:16px}
.stack>h2:not(:last-child){margin-bottom:-8px}
h2+.muted{margin-top:4px}
input[type=file]{font-size:14px;max-width:100%}
input[type=file]::file-selector-button{height:32px;padding:0 12px;margin-right:12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--background);color:var(--foreground);font:inherit;font-weight:500;cursor:pointer}
.sbox input::placeholder,.input::placeholder{color:#6b6b6b;opacity:1}
.catgrid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:768px){.catgrid{gap:16px}.catcard{padding:20px}}
.catcard{border:1px solid var(--border);background:var(--background);border-radius:var(--radius-xl);padding:16px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:8px;min-height:120px}
.catcard:hover{border-color:var(--foreground)}
.catcard b{font-size:16px}
.catcard small{color:var(--text-muted);font-size:12px;line-height:16px}
.photos{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}
.ph{position:relative;aspect-ratio:4/3;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border)}
.ph img{width:100%;height:100%;object-fit:cover}
.ph .tools{position:absolute;inset:auto 4px 4px 4px;display:flex;gap:4px;justify-content:flex-end}
.ph .tools button{height:28px;min-width:28px;border-radius:var(--radius-sm);border:0;background:var(--foreground);color:var(--background);cursor:pointer;font-size:12px}
.steps{display:flex;gap:8px;color:var(--text-muted);font-size:12px;align-items:center}
.steps b{color:var(--foreground)}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;white-space:nowrap;border:0;background:transparent;height:44px;padding:0 12px;cursor:pointer;font-weight:500;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px}
.tab[aria-selected=true]{color:var(--foreground);border-color:var(--foreground)}
.list{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden}
.item{display:flex;gap:12px;align-items:center;padding:12px 16px;border-top:1px solid var(--border);background:var(--background);width:100%;text-align:left;border-left:0;border-right:0;border-bottom:0;cursor:pointer;min-height:64px}
.item:first-child{border-top:0}
a.item:hover,button.item:hover{background:var(--gray-100)}
.item .t{flex:1;min-width:0}
.item .t b,.item .t span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.thread{display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--border);border-radius:var(--radius-xl);min-height:240px}
.msg{max-width:80%;padding:8px 12px;border-radius:var(--radius-lg);background:var(--gray-100);align-self:flex-start;white-space:pre-wrap;overflow-wrap:anywhere}
.msg.me{align-self:flex-end;background:var(--foreground);color:var(--background)}
.msg small{display:block;opacity:.7;font-size:12px}
.msgs-layout{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media(min-width:1024px){.msgs-layout{grid-template-columns:340px minmax(0,1fr)}}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:88px;z-index:80;background:var(--foreground);color:var(--background);border-radius:var(--radius-lg);padding:8px 8px 8px 16px;display:flex;gap:8px;align-items:center;box-shadow:var(--shadow-lg);max-width:calc(100vw - 32px)}
.toast button{border:0;background:transparent;color:inherit;font-weight:600;cursor:pointer;height:32px;padding:0 12px;border-radius:var(--radius-md);text-decoration:underline}
@media(min-width:768px){.toast{bottom:24px}}
.fullmenu{position:fixed;inset:0;z-index:70;background:var(--background);display:flex;flex-direction:column;overflow:auto}
.fullmenu nav{display:flex;flex-direction:column;padding:8px 16px}
.fullmenu nav a,.fullmenu nav button{display:flex;align-items:center;gap:12px;height:52px;border:0;background:transparent;border-bottom:1px solid var(--border);font-size:16px;font-weight:500;text-align:left;cursor:pointer}

.skip{position:absolute;left:8px;top:-56px;z-index:100;height:44px;padding:0 16px;border-radius:6px;background:var(--foreground);color:var(--background);border:0;font-weight:500;cursor:pointer}
.skip:focus{top:8px}
.main:focus{outline:none}
.catchip{height:28px;padding:0 12px;font-size:13px}
.back-m{display:inline-flex}
.foot{display:flex;gap:16px 24px;flex-wrap:wrap;align-items:center;justify-content:space-between;border-top:1px solid var(--border);margin-top:64px;padding-top:16px;font-size:12px;line-height:16px}
.foot nav{display:flex;gap:16px;flex-wrap:wrap}
.foot a{display:inline-flex;align-items:center;min-height:44px;text-decoration:underline}
@media(min-width:1024px){.back-m{display:none}}
@media(max-width:1023px){.hide-m{display:none}}
@media(pointer:coarse),(max-width:767px){.btn.sm{height:44px}button.chip{height:44px}button.chip.catchip{height:32px}.chip{height:40px}.chip .x{width:36px;height:36px;margin-right:-10px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}

@media(min-width:768px){.hide-d{display:none}}
/* ── Apple HIG: touch targets >= 44pt, >= 8pt between targets, readable text. Mouse users keep the compact sizes. ── */
@media(pointer:coarse),(max-width:767px){
  body{font-size:16px;line-height:24px}
  .btn,.btn.sm,.btn.block{min-height:44px;height:44px}
  .iconbtn{width:44px;height:44px}
  .input,.select{height:44px}
  .bar{gap:8px}
  .brand{min-width:44px;height:44px}
  .bar .btn{min-width:44px}
  .sellerlink{display:block;min-height:44px;padding:2px 0}
  .bar .btn,.bar .select{height:44px;font-size:16px}
  .chips{gap:8px}
  .chip{position:relative}
  .chip::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px}
  button.chip.catchip{height:36px}
  .chip .x{width:28px;height:28px;margin-right:-10px;position:relative}
  .chip .x::after{content:"";position:absolute;inset:-8px}
  .crumbs a{min-height:44px}
  .tab{min-height:44px}
  .item .t span,.cloc,.cmeta,.hint,.muted{font-size:13px;line-height:18px}
  .badge{height:22px;font-size:12px}
  .tokens{gap:8px}
  .nophone{display:none}
}

/* ── Navigation (Apple HIG): tab bar on phones, sidebar on regular widths ── */
.backbtn,.hdr-title,.tabbar{display:none}
.menubtn{grid-area:menu;justify-self:end}
.sech{font-size:13px;line-height:18px;font-weight:500;color:var(--text-muted);text-transform:none;margin:8px 0 -8px 16px}
.item.nav::after{content:"›";margin-left:auto;color:var(--gray-500);font-size:22px;line-height:1}
@media(max-width:767px){
  .hdr.pushed .brand,.hdr.pushed .sbox{display:none}
  .hdr.pushed .menubtn{visibility:hidden}
  .hdr.pushed .backbtn{display:inline-flex;grid-area:brand;margin-left:-8px}
  .hdr.pushed .hdr-title{display:block;grid-area:search;text-align:center;font-weight:600;font-size:17px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity var(--base) var(--ease)}
  .hdr.pushed .hdr-title.on{opacity:1}
  .crumbs,.hide-compact{display:none}
  .foot nav{display:none}
  .tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--background);border-top:1px solid var(--border);padding-bottom:env(safe-area-inset-bottom)}
  .tabbar a{flex:1;min-width:0;min-height:49px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;line-height:13px;font-weight:500;color:var(--text-muted)}
  .tabbar a[aria-current=page]{color:var(--foreground);font-weight:600}
  .tabbar a[aria-current=page] .ticon::before{content:"";position:absolute;left:50%;top:-6px;width:24px;height:3px;margin-left:-12px;border-radius:2px;background:var(--foreground)}
  .ticon{position:relative;display:inline-flex}
  .tbadge{position:absolute;left:14px;top:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:9999px;background:var(--red);color:#fff;font-size:11px;line-height:18px;font-weight:600;text-align:center}
  .main{padding-bottom:calc(72px + env(safe-area-inset-bottom))}
}

/* iPad-style sidebar: collapses to an icon rail at tablet widths; Post becomes icon-only so the search stays centred */
@media(min-width:768px) and (max-width:1023px){
  .layout{grid-template-columns:72px minmax(0,1fr)}
  .sidebar{padding:16px 0;align-items:center}
  .sidebar a{position:relative;justify-content:center;width:48px;height:44px;padding:0}
  .slabel{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
  .sidebar .count{position:absolute;top:2px;right:0;margin:0}
}
@media(min-width:768px) and (max-width:1099px){
  .hdr-right .btn .plabel{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
  .hdr-right .btn{padding:0;width:44px}
}
@media(max-width:767px){
  .brand{min-width:0;justify-content:flex-start}
  .menubtn{margin-right:-10px}
}
/* keep the footer at the bottom of short pages; give the detail page room above its fixed action bar */
.main{display:flex;flex-direction:column;min-height:calc(100dvh - 61px)}
.main>.foot{margin-top:auto}
@media(max-width:767px){.main:has(.actionpanel){padding-bottom:calc(104px + env(safe-area-inset-bottom))}}
/* detail page polish */
.main>:nth-last-child(2):not(.foot){margin-bottom:64px}
.gallery .thumb:only-child:has(.fallback){aspect-ratio:16/9}
.panel .btn.ghost.sm{margin-left:-12px}
@media(max-width:767px){.main>:nth-last-child(2):not(.foot){margin-bottom:48px}}
/* gallery */
.gwrap{position:relative}
.gwrap .gallery{scrollbar-width:none}
.gwrap .gallery::-webkit-scrollbar{display:none}
.gcount{position:absolute;right:12px;top:12px;background:rgba(0,0,0,.72);color:#fff;font-size:12px;line-height:16px;padding:4px 10px;border-radius:999px;font-variant-numeric:tabular-nums}
.gdots{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:0}
.gdots button{width:24px;height:24px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.gdots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.7);box-shadow:0 0 0 1px rgba(0,0,0,.25);transition:transform var(--fast) var(--ease)}
.gdots .on i{background:#fff;transform:scale(1.25)}
.gnav{display:none;position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:var(--background);color:var(--foreground);align-items:center;justify-content:center;cursor:pointer}
.gnav.prev{left:12px}.gnav.prev .icon{transform:scaleX(-1)}.gnav.next{right:12px}
.gnav:disabled{opacity:.4;cursor:default}
@media(hover:hover) and (min-width:768px){.gnav{display:flex}}
/* area map */
.areamap{margin:0;border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;display:flex;flex-direction:column}
.areamap svg{display:block;width:100%;height:auto;max-height:260px}
.areamap figcaption{display:flex;flex-direction:column;gap:2px;padding:12px 16px;border-top:1px solid var(--border);font-size:14px;line-height:20px}
.areamap .muted{font-size:12px;line-height:16px}
.am-bg{fill:var(--gray-100)}
.am-ring{fill:none;stroke:var(--border);stroke-dasharray:3 4}
.am-cov{fill:var(--foreground);fill-opacity:.07;stroke:var(--foreground);stroke-opacity:.5;stroke-dasharray:4 3}
.am-dot{fill:var(--gray-700)}
.am-txt{font-size:9px;fill:var(--gray-700);font-family:inherit}
.am-me{fill:var(--foreground);fill-opacity:.18}
.am-mec{fill:var(--foreground)}
.ractions{display:flex;flex-wrap:wrap;gap:8px;width:100%;align-items:center}
.ractions .select{flex:1 1 150px;min-width:0}
.section-gap{margin-top:8px}
@media(max-width:767px){.brand{min-width:44px}}
input[type=file]:not(.sr){font-size:16px;min-height:44px;line-height:44px}
/* ── posting flow ── */
.thumb .fallback .g{font-size:0}
.catgrid{grid-template-columns:minmax(0,1fr)!important;gap:12px}
@media(min-width:600px){.catgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
.catcard{flex-direction:row!important;align-items:center;gap:16px!important;min-height:88px!important;padding:16px!important}
.catcard>.icon:last-child{margin-left:auto;color:var(--gray-500)}
.catcard:hover>.icon:last-child{color:var(--foreground)}
.caticon{flex:none;width:48px;height:48px;border-radius:12px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;color:var(--foreground)}
.cattext{display:flex;flex-direction:column;gap:2px;min-width:0}
.cattext small{font-size:13px!important;line-height:18px!important}
.postnotes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;color:var(--text-muted);font-size:13px;line-height:18px}
.postnotes li{display:flex;gap:8px;align-items:flex-start}
.postnotes .icon{margin-top:1px;color:var(--green)}
.stepper{list-style:none;margin:0 0 8px;padding:0;display:flex;align-items:center;gap:8px;font-size:13px;line-height:18px;color:var(--text-muted)}
.stepper li{display:flex;align-items:center;gap:6px}
.stepper li+li::before{content:"";width:24px;height:1px;background:var(--border);margin-right:2px}
.stepper button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;min-height:44px;padding:0;text-decoration:underline;text-underline-offset:2px}
.stepper .done .icon{width:18px!important;height:18px!important;padding:2px;border-radius:50%;background:var(--green);color:var(--background)}
.stepper [aria-current] {color:var(--foreground);font-weight:600}
.stepper [aria-current] span{width:18px;height:18px;border-radius:50%;background:var(--foreground);color:var(--background);display:inline-flex;align-items:center;justify-content:center;font-size:11px}
.psec{display:flex;flex-direction:column;gap:16px;padding-top:24px;border-top:1px solid var(--border)}
.psec>h2{font-size:17px;line-height:24px;margin:0;display:flex;align-items:center;gap:8px}
.psec .req,.psec .opt{font-size:12px;font-weight:500;line-height:16px;padding:2px 8px;border-radius:999px;background:var(--gray-100);color:var(--text-muted)}
.psec .req{color:var(--foreground)}
.ph .cover{position:absolute;left:6px;top:6px;font-size:11px;line-height:16px;padding:2px 8px;border-radius:999px;background:var(--foreground);color:var(--background);font-weight:500}
.ph .tools{inset:auto 6px 6px 6px!important;gap:6px!important}
.ph .tools button{width:32px;height:32px;border-radius:50%!important;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72)!important;color:#fff!important;position:relative}
.ph .tools button::after{content:"";position:absolute;inset:-6px}
.addph{aspect-ratio:4/3;border:1.5px dashed var(--gray-400);border-radius:var(--radius-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;color:var(--text-muted);font-size:13px;font-weight:500;position:relative;min-height:88px}
.addph:hover,.addph:focus-within{border-color:var(--foreground);color:var(--foreground)}
.addph:focus-within{outline:2px solid var(--foreground);outline-offset:2px}
.addph.bad{border-color:var(--red)}
.money{position:relative;display:inline-flex;align-items:center}
.money>span{position:absolute;left:12px;color:var(--text-muted);pointer-events:none}
.money .input{width:160px;padding-left:26px}
.publishbar{display:flex;flex-direction:column;gap:8px;padding-top:8px}
@media(max-width:767px){.publishbar{position:sticky;bottom:0;z-index:5;background:var(--background);margin:0 -16px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--border)}}
.postlayout{display:flex;gap:32px;align-items:flex-start}
.postlayout>.page{flex:1 1 auto;min-width:0}
.postpreview{display:none}
@media(min-width:1100px){.postpreview{display:flex;flex-direction:column;gap:8px;flex:0 0 260px;position:sticky;top:calc(var(--header-h,64px) + 16px)}}
.postpreview .card{pointer-events:none}
[aria-pressed=true] .i-heart{fill:currentColor}
/* ── segmented controls & switches: show the choice, don't describe it ── */
.seg{display:inline-flex;gap:2px;padding:2px;border-radius:10px;background:var(--gray-100);border:1px solid var(--border);max-width:100%}
.seg [role=radio]{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:var(--text-muted);font:inherit;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.seg [role=radio]:hover{color:var(--foreground)}
.seg [role=radio][aria-checked=true]{background:var(--background);color:var(--foreground);box-shadow:0 1px 2px rgba(0,0,0,.12),0 0 0 1px var(--border)}
.seg.wrap{display:flex;flex-wrap:wrap;gap:8px;padding:0;background:transparent;border:0}
.seg.wrap [role=radio]{border:1px solid var(--border);border-radius:999px;background:var(--background);color:var(--foreground);min-height:40px;font-weight:400}
.seg.wrap [role=radio][aria-checked=true]{background:var(--foreground);color:var(--background);border-color:var(--foreground);box-shadow:none}
.seg.wrap.bad [role=radio]{border-color:var(--red)}
.seg [role=radio]{position:relative}.seg [role=radio]::after{content:"";position:absolute;inset:-2px 0}
@media(max-width:767px){.seg [role=radio]{font-size:15px}}
.item.static{cursor:default;flex-wrap:wrap;row-gap:8px}
.item.static:hover{background:var(--background)}
.switch{position:relative;flex:none;width:51px;height:31px;border-radius:999px;border:0;padding:0;background:var(--gray-400);cursor:pointer;transition:background var(--fast) var(--ease);display:inline-block}
.switch i{position:absolute;left:2px;top:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform var(--fast) var(--ease)}
.switch[aria-checked=true],[aria-checked=true]>.switch{background:var(--green)}
.switch[aria-checked=true] i,[aria-checked=true]>.switch i{transform:translateX(20px)}
button.switch::after{content:"";position:absolute;inset:-7px -2px}
.switchrow{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px}
.menuswitch{display:flex!important;align-items:center;gap:8px}
.menuswitch .switch{margin-left:auto;transform:scale(.8);transform-origin:right center}
.saved{display:flex;align-items:center;gap:4px;margin:4px 0 0;font-size:12px;line-height:16px;color:var(--green)}
.fcount{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--foreground);color:var(--background);font-size:12px;font-weight:600;line-height:1}
.inlineicon{display:block}
.heartdemo{display:inline-flex;vertical-align:middle;width:26px;height:26px;margin:0 2px;border-radius:50%;border:1px solid var(--border);background:var(--background);color:var(--foreground);align-items:center;justify-content:center}
.heartdemo .i-heart{fill:currentColor}
kbd{font:inherit;font-size:11px;padding:1px 6px;border:1px solid var(--border);border-bottom-width:2px;border-radius:4px;background:var(--gray-100);color:var(--foreground)}
.item.pref .t{flex:1 0 auto;min-width:max-content}
.item.pref .t b{overflow:visible}
/* ── listing card: fixed slots so every card in a row lines up ── */
.grid>.card,.card{height:100%}
.cbody{flex:1 1 auto;--tl:20px}
.cprice{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:24px}
.ctitle{line-height:var(--tl);min-height:calc(var(--tl) * 2);max-height:calc(var(--tl) * 2)}
.cloc{margin-top:auto;padding-top:6px;display:flex;align-items:center;gap:4px;min-width:0}
.cloc .icon{flex:none;color:var(--gray-500)}
.cloc span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
@media(max-width:767px){.cbody{--tl:22px}.ctitle{font-size:15px}}
.thumb .onphoto{position:absolute;right:8px;bottom:8px;z-index:1;background:var(--background);height:22px;padding:0 8px;border-radius:999px;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.card:hover .onphoto,.card:focus-within .onphoto{opacity:1;z-index:3}
.thumb .cat{background:var(--background)}
.cprice.txt{font-size:14px;line-height:24px}
.hint .icon,.iconline .icon{vertical-align:-2px;margin-right:4px;color:var(--gray-500)}
.iconline{margin:0;display:flex;align-items:center;gap:6px}
.iconline .icon{margin:0}
.lockedstats{display:flex;align-items:center;gap:24px;flex-wrap:wrap;padding:12px 16px;border:1px dashed var(--gray-400);border-radius:var(--radius-xl);color:inherit;text-decoration:none}
.lockedstats:hover{border-color:var(--foreground)}
.ls-v{display:flex;flex-direction:column}
.ls-v b{font-size:20px;line-height:28px;color:var(--gray-500)}
.ls-v small{font-size:12px;color:var(--text-muted)}
.ls-cta{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500}
.checklist{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.checklist li{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted)}
.checklist li .icon{color:var(--gray-400)}
.checklist li.ok{color:var(--foreground)}
.checklist li.ok .icon{color:#fff;background:var(--green);border-radius:50%;padding:2px}
@media(max-width:400px){.checklist{grid-template-columns:minmax(0,1fr)}}
.plans{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media(min-width:600px){.plans{grid-template-columns:repeat(2,minmax(0,1fr))}}
.plan{border:1px solid var(--border);border-radius:var(--radius-xl);padding:16px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.plan.current{border-color:var(--foreground)}
.plan-h{display:flex;justify-content:space-between;align-items:baseline;width:100%}
.plan-h b{font-size:17px}.plan-h span{font-weight:600}
.plan ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14px}
.plan li{display:flex;gap:8px;align-items:center}
.plan li .icon{color:var(--green)}
.plan li.no{color:var(--text-muted)}.plan li.no .icon{color:var(--gray-500)}
.bmark{flex:none;width:28px;height:28px;display:block}
.bm-body{fill:#007AFF}
.bm-glass{fill:#E8F4FF}
.bm-item.c0{fill:#FF3B30}.bm-item.c1{fill:#FF9500}.bm-item.c2{fill:#FFCC00}.bm-item.c3{fill:#34C759}.bm-item.c4{fill:#007AFF}
.bm-key{fill:#FFCC00}
.bm-slot{fill:#E8F4FF;opacity:.55}
/* product photos are portrait machine shots on a light studio backdrop: show the whole machine */
.card .thumb{aspect-ratio:1/1}
.card .thumb img{object-fit:cover;object-position:center 42%}
.thumb:has(img){background:#CBC9CD}
.gallery .thumb img{object-fit:contain}
.gallery .thumb:has(img){background:radial-gradient(ellipse at 50% 45%,#D8D6DA 0%,#CFCDD1 55%,#C6C4C8 100%)}
.gallery .thumb img{-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}
.gallery .thumb img{width:auto!important;height:100%!important;max-width:100%;margin:0 auto}
.gdots button{position:relative}.gdots button::after{content:"";position:absolute;inset:-10px 0}
.safety{display:flex;align-items:center;gap:6px;margin:0 0 8px;padding:8px 12px;border-radius:var(--radius-lg);background:var(--gray-100);font-size:12px;line-height:16px;color:var(--text-muted)}
.gallery .thumb img[src*="svc-"],.gallery .thumb img[src*="loc-"]{-webkit-mask-image:none;mask-image:none;width:100%!important;object-fit:cover}
.inqcard{display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:var(--radius-xl);color:inherit;text-decoration:none}
.inqcard:hover{border-color:var(--foreground)}
.iq-photo{flex:none;width:88px;height:88px;border-radius:var(--radius-lg);overflow:hidden;background:var(--gray-100);display:flex;align-items:center;justify-content:center;color:var(--gray-700)}
.iq-photo img{width:100%;height:100%;object-fit:cover}
.iq-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.iq-text b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.iq-text .muted{font-size:13px;line-height:18px;display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iq-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:-8px}
.iq-strip img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius-lg);display:block}
.newbadge{flex:none;font-size:12px;font-weight:600;line-height:20px;padding:0 8px;border-radius:999px;background:var(--green);color:#fff}
.iq-photo.sm{width:48px;height:48px}
.viewtgl{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--border);border-radius:8px;background:var(--gray-100)}
.viewtgl button{width:32px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
.viewtgl button::after{content:"";position:absolute;inset:-8px -2px}
.viewtgl [aria-checked=true]{background:var(--background);color:var(--foreground);box-shadow:0 0 0 1px var(--border)}
.rmap{display:flex;flex-direction:column;gap:12px}
.rmap-frame{border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden}
.rmap svg{display:block;width:100%;height:auto;max-height:420px}
.rm-grid{stroke:var(--border);stroke-dasharray:2 6}
.rm-pt{cursor:pointer}
.rm-pt circle{fill:var(--foreground);fill-opacity:.12;stroke:var(--foreground);stroke-opacity:.5;transition:fill-opacity var(--fast) var(--ease)}
.rm-pt:hover circle{fill-opacity:.25}
.rm-pt.on circle{fill:var(--green);fill-opacity:.9;stroke:var(--green);stroke-opacity:1}
.rm-n{font-size:13px;font-weight:700;fill:var(--foreground)}
.rm-pt.on .rm-n{fill:#fff}
.rm-l{font-size:11px;fill:var(--gray-700)}
@media(max-width:767px){.rm-l{font-size:12px}.rm-n{font-size:13px}}
.composer{display:flex;flex-direction:column;gap:8px}
.attach{width:44px;padding:0;cursor:pointer;flex:none}
.pendpics{display:flex;gap:8px;flex-wrap:wrap}
.pp{position:relative;width:64px;height:64px;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border)}
.pp img{width:100%;height:100%;object-fit:cover}
.pp button{position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.72);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.pp button::after{content:"";position:absolute;inset:-11px}
.msgpics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin:4px 0;max-width:280px}
.msgpics img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
.msgpics img:only-child{grid-column:span 2;aspect-ratio:4/3}
@media(max-width:560px){.bar>*{flex:none}.bar>label.row2{flex:1 1 auto;min-width:0}.bar>label.row2 .select{width:100%;min-width:0}.viewtgl button{width:30px}}
/* OpenStreetMap */
.osm{position:relative;width:100%;background:var(--gray-100)}
.osm-map{position:absolute;inset:0;z-index:0}
.osm .leaflet-container{font:inherit;background:var(--gray-100)}
.osm-ico{background:none;border:0}
.osm-pin{display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.92);border:2px solid #007AFF;color:#0b3d91;font-weight:700;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer}
.osm-pin.on{background:#34C759;border-color:#1f8f3c;color:#fff}
.osm-pin.dot{background:#007AFF;border-color:#fff}
.osm-tip{font-size:12px;font-weight:500;padding:2px 6px}
.areamap .osm{border-bottom:1px solid var(--border)}
.rmap-frame .osm{border-radius:var(--radius-xl)}
.leaflet-control-attribution{font-size:10px}
.osm .leaflet-control-attribution{background:rgba(255,255,255,.9)!important;color:#333}
.osm .leaflet-control-attribution a{color:#0645ad}
@media(pointer:coarse),(max-width:767px){.osm .leaflet-bar a{width:44px!important;height:44px!important;line-height:44px!important;font-size:22px!important}}
.checklist.wide{grid-template-columns:minmax(0,1fr)}
@media(min-width:600px){.checklist.wide{grid-template-columns:repeat(2,minmax(0,1fr))}}
.checklist.wide li{align-items:flex-start}
.checklist.wide li>span{display:flex;flex-direction:column;min-width:0}
.checklist.wide li b{font-weight:500;color:var(--foreground)}
.checklist.wide li .icon{margin-top:2px;flex:none}
.checkpanel h3{margin:0}
.pricecheck{display:flex;flex-direction:column;gap:6px;padding:12px 16px;border:1px solid var(--border);border-radius:var(--radius-xl)}
.pricecheck.warn{border-color:#FF9500;background:rgba(255,149,0,.08)}
.pricecheck.warn .icon{color:#C93400}
.pc-bar{position:relative;height:8px;margin:6px 0}
.pc-range{position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,var(--gray-200),var(--gray-400))}
.pc-me{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#007AFF;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.pc-legend{display:flex;justify-content:space-between;font-size:12px;line-height:16px;gap:8px}
.guide .qa{display:flex;flex-direction:column;gap:10px;padding-top:20px;border-top:1px solid var(--border)}
.guide .qa h2{font-size:17px;line-height:24px;margin:0}
.guide .qa p{margin:0}
.guide>div:first-child{display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.pricegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media(min-width:600px){.pricegrid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.pg{display:flex;flex-direction:column;gap:2px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-lg);color:inherit;text-decoration:none}
.pg:hover{border-color:var(--foreground)}
.pg b{font-size:16px}.pg small{font-size:12px;color:var(--text-muted)}
`;
