/* T46, updated by AR-SHELVE-2 (2026-10-13): the hall after the Classic editions and Diamond Career were shelved. Real launcher links and saved-progress isolation. All contexts are fresh; no player data touched. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const origin=process.env.ARCADE_TEST_ORIGIN||'http://localhost:8766';let count=0;function check(ok,label){if(!ok)throw Error(label);count++;}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});try{
 const WIDTHS=process.env.LAUNCHER_WIDTHS?process.env.LAUNCHER_WIDTHS.split(',').map(w=>w.split('x').map(Number)):[[375,812],[1366,768],[1920,1080],[3440,1440]]; // run-all-checks passes two on CI
 for(const [width,height]of WIDTHS){
  const c=await b.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage(),errors=[],engineRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/\.(wasm|pck)(\?|$)/.test(r.url()))engineRequests.push(r.url())});
  await p.addInitScript(()=>{const index={wildbond:{summary:'Classic eight badges',detail:'League cleared',last:1},'starfall-guild':{summary:'Classic winter guild',detail:'Season 4',last:1},realmbound:{summary:'Level 12 hero',detail:'Thornvale',last:1},'wildbond-preview':{summary:'Wrong shared progress',detail:'Must never be shown',last:1},'starfall-preview':{summary:'Wrong shared progress',detail:'Must never be shown',last:1}};localStorage.setItem('arcade-index-v1',JSON.stringify(index));localStorage.setItem('wildbond-save-v1','classic-wildbond-sentinel');localStorage.setItem('starfall-guild-save-v1','classic-starfall-sentinel');localStorage.setItem('realmbound-save-v1','realmbound-sentinel');localStorage.setItem('unrelated-sentinel','keep');});
  await p.goto(origin+'/');await p.waitForFunction(()=>window.ARCADE);
  check(await p.locator('#heroPlay').getAttribute('href')==='play/wildbond/'&&await p.locator('#heroPlay').isVisible(),'header Play Wildbond button is visible and goes to the preview');
  check(await p.locator('.hero-browse').getAttribute('href')==='#shelf','browse link points at the shelf');
  check(await p.locator('meta[property="og:image"]').getAttribute('content').then(v=>/^https:\/\/.+\.png$/.test(v))&&await p.locator('meta[name="description"]').count()===1,'share and search metadata');
  const games=await p.evaluate(()=>window.ArcadeGames),kinds=await p.evaluate(()=>window.ArcadeKinds.map(k=>k.id));const window_kinds_ok=g=>kinds.includes(g.kind);
  check(new Set(games.map(g=>g.id)).size===games.length,'catalogue IDs are distinct');
  check(games.every(g=>g.goal&&g.controls&&window_kinds_ok(g)),'every catalogue game has a valid kind, goal and controls');
  const off=await p.evaluate(()=>window.ArcadeOffShelf.map(g=>g.id));
  for(const id of ['wildbond','starfall-guild','diamond-career','primordial']){check(off.includes(id)&&!games.some(g=>g.id===id),'kept off the hall: '+id);check(await p.locator('[data-game="'+id+'"]').count()===0,'no card for '+id);const r=await p.request.get(origin+'/games/'+id+'/index.html');check(r.ok(),'old direct link still opens: '+id);}
  check(!kinds.includes('classic')&&await p.locator('#kind-classic').count()===0&&!games.some(g=>g.edition==='classic'||g.classic||g.newer),'no Classic section or Classic links');
  check(games[0].id==='wildbond-preview'&&kinds[0]==='adventure'&&(await p.locator('.cab').first().getAttribute('data-game'))==='wildbond-preview','Wildbond is the headline, first on the page');
  check((await p.locator('.marquee .tag').innerText()).includes('headlined by Wildbond'),'the tagline leads with Wildbond');
  check(await p.locator('#start-here .cab').count()===3&&await p.locator('#start-here [data-game="realmbound"]').count()===1,'Start here holds the current headline games');
  check(await p.locator('#more-games:not([open]) [data-game="little-ranch"]').count()===1,'test versions and prototypes start folded under More games');
  await p.evaluate(()=>document.querySelectorAll('#shelf details').forEach(d=>d.open=true));
  check(!/Primordial|Diamond Career|Wildbond Classic|Starfall Guild Classic|Classic edition/.test(await p.locator('#shelf').innerText()),'no shelved or hidden game named on the shelf');
  check(await p.locator('.cab').count()===games.length,'every distinct game/edition has a card');
  for(const game of games.filter(g=>g.href)){const response=await p.request.get(origin+'/'+game.href);check(response.ok(),'play target exists: '+game.id);}
  for(const [id,target]of [['wildbond-preview','play/wildbond/'],['starfall-preview','play/starfall/']]){
   const card=p.locator('[data-game="'+id+'"]');await card.scrollIntoViewIfNeeded();await card.locator('img').waitFor({state:'visible'});await p.waitForFunction(id=>{const img=document.querySelector('[data-game="'+id+'"] img');return img.complete&&img.naturalWidth>0},id);
   check(await card.locator('a.play').getAttribute('href')===target,'preview link '+id);check(await card.locator('img').getAttribute('alt')!==null,'named actual image '+id);
   check(await card.locator('[data-reset]').count()===0,'preview has no Classic reset');check(!(await card.innerText()).includes('Wrong shared progress'),'preview ignores arbitrary shared index');
   check(await card.locator('.preview-classic,.edition-link').count()===0,'no link to a shelved Classic '+id);
  }
  check(!await p.locator('#shelf').innerText().then(s=>s.includes('Wrong shared progress')),'no mixed save display');
  check((await p.locator('[data-game="realmbound"] .prog').innerText()).includes('Level 12 hero'),'saved progress shown');
  await p.locator('[data-game="realmbound"] [data-reset]').click();await p.locator('[data-game="realmbound"] [data-keep]').click();check(await p.evaluate(()=>localStorage.getItem('realmbound-save-v1')==='realmbound-sentinel'),'cancel reset preserves save');
  check(await p.locator('.launch-view,#launchCv').count()===0,'no walk-around hall in front of the games');check(await p.locator('.edition').count()===0,'no edition ribbons now that the Classics are shelved');check(await p.locator('.cab .howto').count()===games.length,'every game says what you do and its controls');
  check(await p.locator('button[data-mode]').count()===0,'one launcher style: the arcade hall');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
  check(engineRequests.length===0,'visiting launcher never fetches Godot payloads');check(errors.length===0,'no page errors: '+errors.join(';'));
  check(await p.evaluate(()=>localStorage.getItem('wildbond-save-v1')==='classic-wildbond-sentinel'&&localStorage.getItem('starfall-guild-save-v1')==='classic-starfall-sentinel'&&localStorage.getItem('realmbound-save-v1')==='realmbound-sentinel'&&localStorage.getItem('unrelated-sentinel')==='keep'),'all saves untouched by launcher');
  await p.locator('#shelf').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.TEMP||require('os').tmpdir(),'preview-shelf-'+width+'.png'),fullPage:true});
  await c.close();console.log(width+': PASS');
 }
 // Verify an unavailable screenshot leaves the procedural fallback, and keyboard navigation enters the actual target route.
 const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();await p.route('**/images/play/**',r=>r.abort());await p.goto(origin+'/');await p.locator('[data-game="wildbond-preview"]').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('[data-game="wildbond-preview"] img').hidden);
 check(await p.locator('[data-game="wildbond-preview"] canvas').isVisible(),'missing photo uses canvas fallback');
 await p.route('**/play/wildbond/',r=>r.fulfill({contentType:'text/html',body:'<h1>Preview destination</h1>'}));await p.locator('[data-game="wildbond-preview"] a.play').focus();await p.keyboard.press('Enter');await p.waitForURL('**/play/wildbond/');check(true,'Enter enters preview route, without a second chooser');await c.close();
 console.log('PASS — '+count+' launcher checks.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
