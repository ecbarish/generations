const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const origin='https://ecbarish.github.io/idle-arcade/',out='docs/playtests/brisket-ac3-1/live';fs.mkdirSync(out,{recursive:true});
const files=['games/briskets-crossing/index.html','games/briskets-crossing/game.js','games/briskets-crossing/model.js','games/briskets-crossing/style.css','shared/engine.js','shared/settings.js','shared/sound.js','shared/feedback.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const checks=[];const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
(async()=>{
 let hashes=[];
 for(let attempt=0;attempt<40;attempt++){
  hashes=await Promise.all(files.map(async file=>{const expected=hash(fs.readFileSync(file)),r=await fetch(origin+file,{headers:{'cache-control':'no-cache'}}),b=Buffer.from(await r.arrayBuffer());return{file,status:r.status,bytes:b.length,expected,actual:hash(b),match:r.ok&&hash(b)===expected};}));
  if(hashes.every(x=>x.match))break;
  console.log('Waiting for public release:',hashes.filter(x=>!x.match).map(x=>x.file));await sleep(15000);
 }
 check('all eight public file hashes match reviewed source',hashes.every(x=>x.match));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});const views=[];
 try{for(const [width,height]of [[375,812],[812,375],[1366,768]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const k='briskets-crossing-save-v1';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({v:1,game:'briskets-crossing',scores:[{name:'QA1',score:321}],sound:0,scanlines:false}));});
  await page.goto(origin+'games/briskets-crossing/',{waitUntil:'networkidle'});check('public localhost hook absent '+width,await page.evaluate(()=>typeof window.__brisket==='undefined'));
  check('old score shown '+width,(await page.locator('.scores').textContent()).includes('QA1'));
  const saved=await page.evaluate(()=>localStorage.getItem('briskets-crossing-save-v1'));
  await page.locator('[data-start="1"]').click();await page.keyboard.press('Space');check('keyboard starts public game '+width,await page.locator('#curtain').isHidden());
  await page.waitForTimeout(100);check('uniform public rendering '+width,await page.locator('#sea').evaluate(c=>{const t=c.getContext('2d').getTransform();return Math.abs(t.a-t.d)<.001;}));
  await page.screenshot({path:path.join(out,`${width}x${height}-play.png`)});
  await page.keyboard.down('ArrowUp');await page.waitForSelector('#recovery:not([hidden])',{timeout:10000});await page.keyboard.up('ArrowUp');
  const caption=await page.locator('#recovery').evaluate(e=>({text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize)}));check('readable real-hit caption '+width,caption.font>=16&&/Steady|Release/.test(caption.text));
  await page.screenshot({path:path.join(out,`${width}x${height}-recovery.png`)});await page.waitForSelector('#recovery[hidden]',{timeout:2500});
  await page.locator('#pause').click();check('public pause menu '+width,await page.locator('[data-resume]').isVisible());
  await page.setViewportSize({width:height,height:width});check('public rotation no overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  await page.locator('[data-resume]').click();check('resumes after rotation '+width,await page.locator('#curtain').isHidden());
  await page.locator('#pause').click();await page.locator('[data-title]').click();await page.reload({waitUntil:'networkidle'});
  check('old public score unchanged after reload '+width,(await page.evaluate(()=>localStorage.getItem('briskets-crossing-save-v1')))===saved);
  check('no runtime errors '+width,errors.length===0);views.push({width,height,caption,errors});await context.close();
 }}finally{await browser.close();}
 const result={verified_at:new Date().toISOString(),source_commit:'19a7ee377e8097b3cdd47a7e15152663bbd7455e',url:origin+'games/briskets-crossing/',checks:checks.length,check_names:checks,hashes,views};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log('PASS live release: '+checks.length+' checks, eight matching public hashes');
})().catch(e=>{console.error(e);process.exitCode=1;});
