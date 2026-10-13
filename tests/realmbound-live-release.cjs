/* Fresh-profile release verification; never uses or reads an existing player's save. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base='https://ecbarish.github.io/generations/';
const files=['games/realmbound/js/01-world.js','games/realmbound/js/08-inventory-quests.js','games/realmbound/js/12-tabs.js','games/realmbound/js/15-events.js','games/realmbound/js/26-onboarding.js','games/realmbound/phone.css','games/realmbound/style.css','tests/realmbound-parallel-quests.js','tests/run.html'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const out='/tmp/realmbound-live-release';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const deadline=Date.now()+10*60*1000;let hashes;
 while(true){
  hashes=await Promise.all(files.map(async file=>{try{const r=await fetch(base+file+'?rb-release='+Date.now(),{cache:'no-store'});const expected=hash(fs.readFileSync(file)),actual=hash(Buffer.from(await r.arrayBuffer()));return{file,expected,actual,ok:r.ok&&actual===expected};}catch(e){return{file,ok:false,error:e.message};}}));
  if(hashes.every(x=>x.ok))break;
  if(Date.now()>deadline)throw Error('Pages did not serve the approved bytes: '+JSON.stringify(hashes.filter(x=>!x.ok)));
  await new Promise(r=>setTimeout(r,15000));
 }
 fs.writeFileSync(path.join(out,'hashes.json'),JSON.stringify(hashes,null,2));
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();
   await page.goto(base+'games/realmbound/',{waitUntil:'networkidle'});
   await page.evaluate(()=>window.eval("var releaseHero=newHero('Releasecheck','concord','human','hunter');releaseHero.onboarding={arrival:true,hints:{}};S.chars=[releaseHero];S.cur=releaseHero.id;boot();closeModal();clearArrival();accept('t1');accept('t2');accept('t3');if(H().quests.active.length!==3)throw Error('Three requests were not accepted');C.phase='intown';townEnter();openRealmNotebook('quests');save();"));
   const saved=await page.evaluate(()=>window.eval('JSON.stringify(H().quests)'));
   await page.screenshot({path:path.join(out,viewport.width+'-journal.png')});
   await page.reload({waitUntil:'networkidle'});
   const reloaded=await page.evaluate(()=>window.eval('JSON.stringify(H().quests)'));
   if(saved!==reloaded)throw Error('Live quest state changed after reload');
   await page.goto(base+'tests/run.html');await page.locator('#run').click();
   await page.waitForFunction(()=>/^(PASS|FAIL)/.test(document.querySelector('#summary').textContent),{},{timeout:300000});
   const summary=await page.locator('#summary').textContent();
   if(!summary.startsWith('PASS'))throw Error(summary);
   console.log(viewport.width+'px live reload and '+summary);
   fs.writeFileSync(path.join(out,viewport.width+'-result.txt'),summary+'\nActual live browser accept-three/save/reload passed.\n');
   await context.close();
  }
 }finally{await browser.close();}
 console.log('Approved public hashes and live Thornvale quest/save flow PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
