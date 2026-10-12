const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const origin='https://ecbarish.github.io/generations/',out='docs/playtests/brisket-ac3-2/live';fs.mkdirSync(out,{recursive:true});
const files=['games/briskets-crossing/index.html','games/briskets-crossing/game.js','games/briskets-crossing/model.js','games/briskets-crossing/style.css','shared/engine.js','shared/settings.js','shared/sound.js','shared/feedback.js'];
// Pinned to release 032bbd09; rerunning after later releases must not relabel newer bytes.
const releaseHashes={
  "games/briskets-crossing/index.html": "693ba605850999ea5b57583d947289d0e04151644e435866798b7e5225cb8b5b",
  "games/briskets-crossing/game.js": "1af51d843876c202223192a2be76709602e08aab32fa4793a6a1a1588d4bd91e",
  "games/briskets-crossing/model.js": "65542ac97e2ca822a8fee66c274b2d62fb25122bf93635b3d9a2abe21f71f066",
  "games/briskets-crossing/style.css": "17ebe8c47287ecbc0396fe579df93ee0f89d1ff7e9f031c2dece8e1c6b044a4d",
  "shared/engine.js": "a700b8e63f0e72d37baa0404c3d62689414599c72bc7f94fa244a2216ed2880c",
  "shared/settings.js": "5e2dc6aab195d2571b82a745f50fa1e513deaf118040eecf7e1d625f906bf177",
  "shared/sound.js": "abfb57483cf62aa20f8c1bb134e844c8b218eec5d20c9fb17d7af6c082421473",
  "shared/feedback.js": "8dbc9a3a11dfcedbf6a667cf4c99c9e1c0da9b530bf6519f4f9338f582509057"
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const checks=[];const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
(async()=>{
 let hashes=[];
 for(let attempt=0;attempt<40;attempt++){
  hashes=await Promise.all(files.map(async file=>{const expected=releaseHashes[file],r=await fetch(origin+file,{headers:{'cache-control':'no-cache'}}),b=Buffer.from(await r.arrayBuffer());return{file,status:r.status,bytes:b.length,expected,actual:hash(b),match:r.ok&&hash(b)===expected};}));
  if(hashes.every(x=>x.match))break;
  console.log('Waiting for public release:',hashes.filter(x=>!x.match).map(x=>x.file));await sleep(15000);
 }
 check('all eight public file hashes match reviewed source',hashes.every(x=>x.match));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});const views=[];
 try{for(const [width,height]of [[375,812],[812,375],[1366,768]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'games/briskets-crossing/',{waitUntil:'networkidle'});
  // Seed once in this isolated test browser. Never reseed on the final reload.
  await page.evaluate(()=>localStorage.setItem('briskets-crossing-save-v1',JSON.stringify({v:1,game:'briskets-crossing',scores:[{name:'QA1',score:321}],sound:0,scanlines:false})));
  await page.reload({waitUntil:'networkidle'});check('public localhost hook absent '+width,await page.evaluate(()=>typeof window.__brisket==='undefined'));
  check('old score shown '+width,(await page.locator('.scores').textContent()).includes('QA1'));
  const saved=await page.evaluate(()=>localStorage.getItem('briskets-crossing-save-v1'));
  await page.locator('[data-start="1"]').click();await page.keyboard.press('Space');check('keyboard starts public game '+width,await page.locator('#curtain').isHidden());
  await page.waitForTimeout(100);check('uniform public rendering '+width,await page.locator('#sea').evaluate(c=>{const t=c.getContext('2d').getTransform();return Math.abs(t.a-t.d)<.001;}));
  await page.screenshot({path:path.join(out,`${width}x${height}-play.png`)});

  const opening=await page.evaluate(()=>{const M=BrisketModel,p=M.current(M.create(1,17)),roads=p.lanes.filter(l=>l.kind==='road');return{time:p.time,speed:M.plan(1).speed,roads:roads.map(l=>{const a=[...l.items].sort((x,y)=>x.x-y.x);return{count:a.length,gaps:a.map((it,i)=>(a[(i+1)%a.length].x-it.x+M.COLS)%M.COLS-it.w)};})};});
  check('public easier clock and speed '+width,opening.time===56&&Math.abs(opening.speed-.8)<1e-9);
  check('public three wagons and wide cyclic gaps '+width,opening.roads.every(l=>l.count===3&&l.gaps.every(g=>g>2.683)));
  const box=await page.locator('#sea').boundingBox();await page.touchscreen.tap(box.x+box.width*6.5/13,box.y+box.height*9.5/11);
  await page.waitForFunction(()=>document.querySelector('#score').textContent==='000010',null,{timeout:2000});
  check('public first touch retains three lives '+width,await page.locator('#lives').getAttribute('aria-label')==='3 lives');
  await page.screenshot({path:path.join(out,`${width}x${height}-first-touch.png`)});
  await page.keyboard.down('ArrowUp');await page.waitForSelector('#recovery:not([hidden])',{timeout:30000});await page.keyboard.up('ArrowUp');
  const caption=await page.locator('#recovery').evaluate(e=>({text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize)}));check('readable real-hit caption '+width,caption.font>=16&&/Steady|Release/.test(caption.text));
  await page.screenshot({path:path.join(out,`${width}x${height}-recovery.png`)});await page.locator('#recovery').waitFor({state:'hidden',timeout:2500});
  await page.locator('#pause').click();check('public pause menu '+width,await page.locator('[data-resume]').isVisible());
  await page.setViewportSize({width:height,height:width});check('public rotation no overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  await page.locator('[data-resume]').click();check('resumes after rotation '+width,await page.locator('#curtain').isHidden());
  await page.locator('#pause').click();await page.locator('[data-title]').click();await page.reload({waitUntil:'networkidle'});
  check('old public score unchanged after reload '+width,(await page.evaluate(()=>localStorage.getItem('briskets-crossing-save-v1')))===saved);
  check('no runtime errors '+width,errors.length===0);views.push({width,height,caption,errors});await context.close();
 }}finally{await browser.close();}
 const result={verified_at:new Date().toISOString(),source_commit:'032bbd09988e8186567309c9c567a5f03b365eb3',url:origin+'games/briskets-crossing/',checks:checks.length,check_names:checks,hashes,views};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log('PASS live release: '+checks.length+' checks, eight matching public hashes');
})().catch(e=>{console.error(e);process.exitCode=1;});
