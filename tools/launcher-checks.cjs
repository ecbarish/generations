/* T46: real launcher links and saved-progress isolation. All contexts are fresh; no player data touched. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const origin=process.env.ARCADE_TEST_ORIGIN||'http://localhost:8766';let count=0;function check(ok,label){if(!ok)throw Error(label);count++;}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});try{
 for(const [width,height]of [[375,812],[1366,768],[1920,1080],[3440,1440]]){
  const c=await b.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage(),errors=[],engineRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/\.(wasm|pck)(\?|$)/.test(r.url()))engineRequests.push(r.url())});
  await p.addInitScript(()=>{const index={wildbond:{summary:'Classic eight badges',detail:'League cleared',last:1},'starfall-guild':{summary:'Classic winter guild',detail:'Season 4',last:1},'wildbond-preview':{summary:'Wrong shared progress',detail:'Must never be shown',last:1},'starfall-preview':{summary:'Wrong shared progress',detail:'Must never be shown',last:1}};localStorage.setItem('arcade-index-v1',JSON.stringify(index));localStorage.setItem('wildbond-save-v1','classic-wildbond-sentinel');localStorage.setItem('starfall-guild-save-v1','classic-starfall-sentinel');localStorage.setItem('unrelated-sentinel','keep');});
  await p.goto(origin+'/');await p.waitForFunction(()=>window.ARCADE);
  const games=await p.evaluate(()=>window.ArcadeGames),kinds=await p.evaluate(()=>window.ArcadeKinds.map(k=>k.id));const window_kinds_ok=g=>kinds.includes(g.kind);
  check(new Set(games.map(g=>g.id)).size===games.length,'catalogue IDs are distinct');
  check(games.every(g=>g.goal&&g.controls&&window_kinds_ok(g)),'every catalogue game has a valid kind, goal and controls');
  check(games.filter(g=>g.edition==='classic').every(g=>g.kind==='classic'&&games.some(o=>o.id===g.newer&&o.edition==='new')),'each Classic sits in Classic editions and links its new version');
  check(await p.locator('.cab').count()===games.length,'every distinct game/edition has a card');
  for(const game of games.filter(g=>g.href)){const response=await p.request.get(origin+'/'+game.href);check(response.ok(),'play target exists: '+game.id);}
  for(const [id,target,classic]of [['wildbond-preview','play/wildbond/','wildbond'],['starfall-preview','play/starfall/','starfall-guild']]){
   const card=p.locator('[data-game="'+id+'"]');await card.scrollIntoViewIfNeeded();await card.locator('img').waitFor({state:'visible'});await p.waitForFunction(id=>{const img=document.querySelector('[data-game="'+id+'"] img');return img.complete&&img.naturalWidth>0},id);
   check(await card.locator('a.play').getAttribute('href')===target,'preview link '+id);check(await card.locator('img').getAttribute('alt')!==null,'named actual image '+id);
   check(await card.locator('[data-reset]').count()===0,'preview has no Classic reset');check(!(await card.innerText()).includes('Wrong shared progress'),'preview ignores arbitrary shared index');
   check((await p.locator('[data-game="'+classic+'"] .prog').innerText()).includes('Classic'),'Classic progress retained');
   const oldLink=await card.locator('.preview-classic a').getAttribute('href');check(oldLink===(classic==='wildbond'?'games/wildbond/index.html':'games/starfall-guild/index.html'),'explicit Classic alternative');
   await card.locator('a.play').focus();await p.keyboard.press('Tab');check(await p.evaluate(()=>document.activeElement.matches('.preview-classic a')),'keyboard reaches Classic alternative');
  }
  check(!await p.locator('#shelf').innerText().then(s=>s.includes('Wrong shared progress')),'no mixed save display');
  await p.locator('[data-game="wildbond"] [data-reset]').click();await p.locator('[data-game="wildbond"] [data-keep]').click();check(await p.evaluate(()=>localStorage.getItem('wildbond-save-v1')==='classic-wildbond-sentinel'),'cancel reset preserves save');
  check(await p.locator('.kind').count()===kinds.length,'a section for each kind of game, Classic editions last');check(await p.locator('.edition.ed-classic').count()===2&&await p.locator('.edition.ed-new').count()===2,'edition ribbons on both editions');check(await p.locator('.cab .howto').count()===games.length,'every game says what you do and its controls');
  check(await p.locator('button[data-mode]').count()===0,'one launcher style: the arcade hall');
  for(const mode of ['hall']){
   await p.waitForTimeout(180);
   const expected=games.filter(g=>g.href).length;check(await p.locator('#launchHits a').count()===expected,'mode destination count '+mode);
   for(const [id,href]of [['wildbond-preview','play/wildbond/'],['starfall-preview','play/starfall/']]){const hit=p.locator('#launchHits [data-id="'+id+'"]');check(await hit.getAttribute('href')===href,'primary place goes to preview '+mode+' '+id);await hit.focus();await p.waitForTimeout(100);check(await hit.evaluate(el=>el.getBoundingClientRect().right>0&&el.getBoundingClientRect().left<innerWidth),'keyboard keeps destination on screen '+mode+' '+id);}
   if(mode!=='scene')for(const id of ['wildbond','starfall-guild'])check(await p.locator('#launchHits [data-id="'+id+'"]').count()===1,'Classic place retained '+mode+' '+id);
   if(mode==='hall')check(await p.evaluate(()=>{const r=[...document.querySelectorAll('#launchHits a')].map(el=>el.getBoundingClientRect());return r.every((v,i)=>!i||v.left>=r[i-1].right)}),'hall targets do not overlap');
   check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow '+mode);
  }
  check(engineRequests.length===0,'visiting launcher never fetches Godot payloads');check(errors.length===0,'no page errors: '+errors.join(';'));
  check(await p.evaluate(()=>localStorage.getItem('wildbond-save-v1')==='classic-wildbond-sentinel'&&localStorage.getItem('starfall-guild-save-v1')==='classic-starfall-sentinel'&&localStorage.getItem('unrelated-sentinel')==='keep'),'all saves untouched by launcher');
  await p.locator('#shelf').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.TEMP||require('os').tmpdir(),'preview-shelf-'+width+'.png'),fullPage:true});
  await c.close();console.log(width+': PASS');
 }
 // Verify an unavailable screenshot leaves the procedural fallback, and keyboard navigation enters the actual target route.
 const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();await p.route('**/images/play/**',r=>r.abort());await p.goto(origin+'/');await p.locator('[data-game="wildbond-preview"]').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('[data-game="wildbond-preview"] img').hidden);
 check(await p.locator('[data-game="wildbond-preview"] canvas').isVisible(),'missing photo uses canvas fallback');
 await p.route('**/play/wildbond/',r=>r.fulfill({contentType:'text/html',body:'<h1>Preview destination</h1>'}));await p.locator('[data-game="wildbond-preview"] a.play').focus();await p.keyboard.press('Enter');await p.waitForURL('**/play/wildbond/');check(true,'Enter enters preview route, without a second chooser');await c.close();
 console.log('PASS — '+count+' launcher checks.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
