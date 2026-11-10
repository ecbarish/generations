/* HUB-REDESIGN (2026-10-14): the game-first hub, the Lab and the per-game pages. Real links, share tags, layout at
   phone-to-ultrawide widths, and saved-progress isolation. All contexts are fresh; no player data touched. */
const {chromium}=require('playwright');
const origin=process.env.ARCADE_TEST_ORIGIN||'http://localhost:8766';let count=0;function check(ok,label){if(!ok)throw Error(label);count++;}
// The featured Continue Wildbond control is the hero link (Hub.cta reads the Godot journey in IndexedDB).
// Wildbond has left the public hub. When that link is gone, this check skips instead of failing.
function wildbondSaveSuffix(source){
  const block=source.match(/const GODOT_SAVES\s*=\s*\{([\s\S]*?)\};/);
  if(!block)return null;
  const pair=[...block[1].matchAll(/['"]([^'"]*)['"]\s*:\s*['"]([^'"]*wildbond[^'"]*)['"]/gi)][0]
    ||[...block[1].matchAll(/['"]([^'"]*wildbond[^'"]*)['"]\s*:\s*['"]([^'"]+)['"]/gi)][0];
  return pair?pair[2]:null;
}
// Version 2 is the journey the game writes to user://journey.json. The hub only looks for the file's name.
function wildbondJourney(){
  return {v:2,saved:new Date().toISOString().slice(0,19).replace('T',' '),look:{name:'Roadie'},
    team:[{sp:'ripplet',name:'Puddle',lvl:5,xp:0,rar:0,hp:20,pot:{hp:0,atk:0,def:0,spd:0},bond:0}],
    ranch:[],bag:{},badges:[],seen:{},bonded:{},items:[],beaten:[],restore:[],explored:{},story:{},retry:{},egg:{},gear:[],taught:{},
    letter:[0,[]],calendar:{},festival:{done:[],keep:[],flowers:[]},league:0,
    spire:{floor:0,best:0,active:false},rematches:{},bondDay:0,keysLearned:{},
    map:'larkhaven',x:12,y:14,partner:''};
}
async function plantWildbondJourney(page,suffix){
  const key=suffix.startsWith('/userfs')?suffix:'/userfs/godot'+suffix;
  await page.evaluate(async({key,json})=>{
    await new Promise((resolve,reject)=>{
      const req=indexedDB.open('/userfs',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('FILE_DATA'))db.createObjectStore('FILE_DATA');};
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
        const db=req.result,tx=db.transaction('FILE_DATA','readwrite');
        tx.objectStore('FILE_DATA').put({contents:new TextEncoder().encode(json),mode:33206,timestamp:new Date()},key);
        tx.oncomplete=()=>{db.close();resolve();};
        tx.onerror=()=>reject(tx.error);
      };
    });
  },{key,json:JSON.stringify(wildbondJourney())});
  return key;
}
async function continueWildbond(browser){
  const c=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),p=await c.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await p.goto(origin+'/');
    await p.waitForFunction(()=>window.Hub&&document.querySelector('#heroPlay'));
    const offer=await p.evaluate(()=>{
      const links=[...document.querySelectorAll('a[href]')];
      const textOf=a=>((a.textContent||'')+' '+(a.getAttribute('href')||''));
      const play=links.find(a=>a.id==='heroPlay'&&/wildbond/i.test(textOf(a)))
        ||links.find(a=>/wildbond/i.test(a.getAttribute('href')||'')&&/play|continue/i.test(a.textContent||''));
      if(!play)return null;
      const card=play.closest('[data-game]');
      const selector=play.id?'#'+CSS.escape(play.id):card?`[data-game="${card.dataset.game}"] a.play`:`a[href="${play.getAttribute('href')}"]`;
      return {selector,text:play.textContent.replace(/\s+/g,' ').trim(),href:play.getAttribute('href')};
    });
    if(!offer){console.log('skip — Continue Wildbond is not on the hub');return;}
    check(!/continue/i.test(offer.text),'Wildbond offers Play before a journey exists ('+offer.text+')');
    const hubJs=await (await p.request.get(origin+'/shared/hub.js')).text();
    const suffix=wildbondSaveSuffix(hubJs);
    check(!!suffix,'hub looks up the Wildbond journey file');
    const key=await plantWildbondJourney(p,suffix);
    await p.reload();
    await p.waitForFunction(sel=>{const el=document.querySelector(sel);return !!el&&/continue/i.test(el.textContent);},offer.selector,{timeout:8000});
    const label=await p.locator(offer.selector).innerText(),href=await p.locator(offer.selector).getAttribute('href');
    check(/continue/i.test(label)&&/wildbond/i.test(label+' '+href),'button says Continue and still opens Wildbond ('+label+' → '+href+')');
    await p.locator(offer.selector).click();
    const wanted=new URL(href,origin).pathname.replace(/index\.html$/,'').replace(/\/$/,'');
    await p.waitForURL(u=>u.pathname.replace(/index\.html$/,'').replace(/\/$/,'')===wanted||u.pathname.startsWith(wanted+'/'));
    check(true,'Continue Wildbond opens '+wanted+' (save '+key+')');
    check(errors.length===0,'Continue Wildbond has no page errors: '+errors.join(';'));
  }finally{await c.close();}
}
const SHELVED=['starfall-guild','diamond-career','primordial'];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});try{
 const WIDTHS=process.env.LAUNCHER_WIDTHS?process.env.LAUNCHER_WIDTHS.split(',').map(w=>w.split('x').map(Number)):[[360,780],[390,844],[768,1024],[1280,800],[1920,1080],[2560,1080],[3440,1440],[5120,1440]];
 const seed=()=>{const index={'starfall-guild':{summary:'Classic winter guild',detail:'Season 4',last:1},realmbound:{summary:'Level 12 hero',detail:'Thornvale',last:1},'starfall-preview':{summary:'Wrong shared progress',detail:'Must never be shown',last:1}};localStorage.setItem('arcade-index-v1',JSON.stringify(index));localStorage.setItem('starfall-guild-save-v1','classic-starfall-sentinel');localStorage.setItem('realmbound-save-v1','realmbound-sentinel');localStorage.setItem('little-ranch-settings-v1','little-ranch-sentinel');localStorage.setItem('unrelated-sentinel','keep');};
 const savesIntact=p=>p.evaluate(()=>localStorage.getItem('starfall-guild-save-v1')==='classic-starfall-sentinel'&&localStorage.getItem('realmbound-save-v1')==='realmbound-sentinel'&&localStorage.getItem('little-ranch-settings-v1')==='little-ranch-sentinel'&&localStorage.getItem('unrelated-sentinel')==='keep');
 const linksOk=async(p,label)=>{const hrefs=await p.evaluate(()=>[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)).map(h=>h.split('#')[0]))]);for(const h of hrefs){const r=await p.request.get(h);check(r.ok(),label+' link works: '+h);}};
 const shareOk=async(p,label)=>{for(const s of ['meta[property="og:title"]','meta[property="og:description"]','meta[name="twitter:card"]','meta[name="description"]','link[rel="canonical"]'])check(await p.locator(s).count()===1,label+' has '+s);
  const img=await p.locator('meta[property="og:image"]').getAttribute('content');check(/^https:\/\/ecbarish\.github\.io\/generations\/.+\.(png|jpg)$/.test(img),label+' absolute og:image');const local=origin+'/'+img.split('/generations/')[1];const r=await p.request.get(local);check(r.ok(),label+' og:image exists');
  const size=await p.evaluate(u=>new Promise(res=>{const i=new Image();i.onload=()=>res([i.naturalWidth,i.naturalHeight]);i.onerror=()=>res([0,0]);i.src=u;}),local);
  check(String(size[0])===await p.locator('meta[property="og:image:width"]').getAttribute('content')&&String(size[1])===await p.locator('meta[property="og:image:height"]').getAttribute('content'),label+' og:image size tags match the image ('+size.join('x')+')');};
 for(const [width,height]of WIDTHS){
  const c=await b.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage(),errors=[],engineRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/\.(wasm|pck)(\?|$)/.test(r.url()))engineRequests.push(r.url())});
  await p.addInitScript(seed);
  // --- hub ---
  await p.goto(origin+'/');await p.waitForFunction(()=>window.Hub&&document.querySelector('#current .cab'));
  const games=await p.evaluate(()=>window.ArcadeGames);
  check(new Set(games.map(g=>g.id)).size===games.length,'catalogue IDs are distinct');
  check(games.every(g=>g.goal&&g.controls),'every catalogue game has a goal and controls');
  const cta=p.locator('#heroPlay');check(await cta.isVisible()&&await cta.getAttribute('href')==='games/little-ranch/index.html','one big Play Little Ranch button');
  const box=await cta.boundingBox();check(box.y+box.height<=height,'Play button is on the first screen ('+width+'x'+height+')');check(box.height>=44,'Play button is a big touch target');
  check((await p.locator('h1').innerText()).trim().toLowerCase()==='little ranch','Little Ranch is the headline');
  check(await p.locator('.hero .shot img').first().evaluate(i=>i.complete&&i.naturalWidth>0),'hero screenshot loads');
  const ids=await p.locator('#current .cab').evaluateAll(els=>els.map(e=>e.dataset.game));check(JSON.stringify(ids)==='["little-ranch","starfall-preview","realmbound"]','Play now row leads with Little Ranch');
  for(const [id,target]of [['little-ranch','games/little-ranch/index.html'],['starfall-preview','play/starfall/'],['realmbound','games/realmbound/index.html']])check(await p.locator(`#current [data-game="${id}"] a.play`).getAttribute('href')===target,'play link '+id);
  check(!(await p.locator('[data-game="starfall-preview"]').innerText()).includes('Wrong shared progress'),'preview ignores arbitrary shared index starfall-preview');
  check((await p.locator('[data-game="realmbound"] .prog').innerText()).includes('Level 12 hero'),'saved progress shown');check((await p.locator('[data-game="realmbound"] a.play').innerText())==='Continue','Continue when a save exists');
  check(await p.locator('#heroPlay').innerText().then(t=>t.includes('Play')),'hero offers Play for Little Ranch');
  check(!/Classic edition|Wildbond Classic|Starfall Guild Classic|Primordial|Diamond Career/.test(await p.locator('main').innerText()),'no Classic or shelved game on the hub');
  for(const id of SHELVED)check(await p.locator(`[data-game="${id}"]`).count()===0,'no card for '+id);
  check(await p.locator('a[href="lab.html"]').count()>0,'hub links to the Lab');
  const hubBare=await p.evaluate(()=>Promise.all([...document.querySelectorAll('#current .cab')].map(el=>new Promise(res=>{const img=el.querySelector('.card-art img');if(!img||!img.getAttribute('src'))return res(el.dataset.game);if(img.complete&&img.naturalWidth>0)return res(null);const probe=new Image();probe.onload=()=>res(probe.naturalWidth>0?null:el.dataset.game);probe.onerror=()=>res(el.dataset.game);probe.src=img.src;}))).then(rows=>rows.filter(Boolean)));
  check(hubBare.length===0,'every hall card cover resolves'+(hubBare.length?': '+hubBare.join(', '):''));
  check(await p.locator('footer #installArcade').count()===1&&await p.locator('footer .fb-btn').count()===1&&await p.locator('footer .arc-set-btn').count()===1&&await p.locator('footer .app-help').count()===1,'utilities live in the footer');
  check(await p.locator('.launch-view,#launchCv,.kinds-nav').count()===0,'no walk-around hall');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow (hub '+width+')');
  const hero=await p.locator('.hero').boundingBox();check(hero.width>=width-1,'hero is full-bleed');
  const shot=await p.locator('.hero .shot').boundingBox();check(Math.abs(shot.width/shot.height-16/9)<0.03,'hero screenshot keeps 16:9 (not stretched)');
  if(width<=760){check(await p.locator('.foot').evaluate(e=>getComputedStyle(e).display)!=='none','footer on phones');}
  if(width===WIDTHS[0][0]){await shareOk(p,'hub');await linksOk(p,'hub');
   await p.locator('[data-game="realmbound"] [data-reset]').click();await p.locator('[data-game="realmbound"] [data-keep]').click();check(await p.evaluate(()=>localStorage.getItem('realmbound-save-v1')==='realmbound-sentinel'),'cancel reset preserves save');}
  // --- lab ---
  await p.goto(origin+'/lab.html');await p.waitForFunction(()=>document.querySelector('#lab .cab'));
  const lab=await p.locator('#lab .cab').evaluateAll(els=>els.map(e=>e.dataset.game));const expectLab=games.filter(g=>!['little-ranch','starfall-preview','realmbound'].includes(g.id)).map(g=>g.id);
  check(JSON.stringify(lab)===JSON.stringify(expectLab),'Lab holds every other catalogue game');check(!lab.includes('little-ranch'),'Little Ranch is on the hub, not in the Lab');
  const bare=await p.evaluate(()=>Promise.all([...document.querySelectorAll('#lab .cab')].map(el=>new Promise(res=>{const img=el.querySelector('.card-art img');if(!img||!img.getAttribute('src'))return res(el.dataset.game);if(img.complete&&img.naturalWidth>0)return res(null);const probe=new Image();probe.onload=()=>res(probe.naturalWidth>0?null:el.dataset.game);probe.onerror=()=>res(el.dataset.game);probe.src=img.src;}))).then(rows=>rows.filter(Boolean)));
  check(bare.length===0,'every Lab card cover resolves'+(bare.length?': '+bare.join(', '):''));
  for(const id of SHELVED)check(!lab.includes(id),'not in the Lab: '+id);
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow (lab '+width+')');
  if(width===WIDTHS[0][0]){await shareOk(p,'lab');await linksOk(p,'lab');for(const g of games.filter(g=>g.href)){const r=await p.request.get(origin+'/'+g.href);check(r.ok(),'play target exists: '+g.id);}}
  // --- game pages ---
  for(const [slug,target]of [['starfall','../play/starfall/'],['realmbound','../games/realmbound/index.html']]){
   await p.goto(origin+'/game/'+slug+'.html');await p.waitForFunction(()=>window.Hub);
   check(await p.locator('#heroPlay').getAttribute('href')===target,'game page Play: '+slug);
   check(await p.locator('.panel h2').allInnerTexts().then(t=>t.join('|').includes('Controls')&&t.join('|').includes('What’s new')),'controls and what’s new: '+slug);
   check(await p.locator('.gallery img').count()>=2,'screenshots: '+slug);
   check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow ('+slug+' '+width+')');
   if(width===WIDTHS[0][0]){await shareOk(p,slug);await linksOk(p,slug);}
  }
  for(const id of SHELVED){const r=await p.request.get(origin+'/games/'+id+'/index.html');check(r.ok(),'old direct link still opens: '+id);}
  check(engineRequests.length===0,'visiting the hub never fetches Godot payloads');check(errors.length===0,'no page errors: '+errors.join(';'));
  check(await savesIntact(p),'saves untouched');
  await c.close();console.log(width+'x'+height+': PASS');
 }
 const settle=async(p,re)=>{for(let i=0;i<50&&!re.test(p.url());i++)await p.waitForTimeout(100);await p.waitForLoadState('load');};
 // old hub links (v1.7 sections and the canvas hall) still land somewhere sensible
 {const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();
  for(const h of ['shelf','launcher','start-here','kind-adventure','kind-build','kind-kids']){await p.goto(origin+'/index.html#'+h);await p.waitForFunction(()=>document.querySelector('#current .cab'));check(new URL(p.url()).pathname.endsWith('/index.html')&&await p.locator('#games').count()===1,'old anchor stays on the hub: '+h);}
  for(const h of ['kind-sports','kind-story','kind-different']){await p.goto(origin+'/index.html#'+h);await settle(p,/lab\.html/);await p.waitForSelector('#lab .cab',{state:'attached'});check(p.url().endsWith('lab.html#'+h),'kept the section: '+h);check(await p.locator('#'+h).count()===1,'old anchor moves to the Lab: '+h);}
  await p.goto(origin+'/index.html#more-games');await settle(p,/lab\.html/);check(/lab\.html$/.test(p.url()),'More games url');check(true,'More games goes to the Lab');
  await c.close();}
 // missing screenshots don't break the card, and keyboard Enter on the hero reaches the game
 const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();await p.route('**/images/**',r=>r.abort());await p.goto(origin+'/');await p.waitForFunction(()=>document.querySelector('#current .cab'));
 check(await p.locator('#current .cab .ttl').first().isVisible(),'card title shows without its image');
 await p.locator('#heroPlay').focus();await p.keyboard.press('Enter');await p.waitForURL('**/games/little-ranch/**');check(true,'keyboard enters the game');
 await c.close();
 await continueWildbond(b);
 console.log('PASS — '+count+' launcher checks.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
