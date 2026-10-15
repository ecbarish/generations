/* NM-PHONE: real Chromium viewport evidence, with isolated non-player storage.
   Run: node tools/playtest/night-market-phone.cjs [output-directory].
   These are browser-engineering checks, not a physical-phone or newcomer playtest. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(process.argv[2] || 'night-market-phone-review');
fs.mkdirSync(out, {recursive: true});
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const report = {head, mode:'phone-regression', checks:[], screens:[], measurements:[]};
const check = (name, pass, detail) => {report.checks.push({name, pass:!!pass, detail}); if(!pass) console.error('FAIL: '+name, detail);};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let name;
  try {name = decodeURIComponent(u.pathname);} catch (_) {res.writeHead(400); return res.end();}
  if (name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  const mime = {'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
  fs.readFile(file, (err, bytes) => {if(err){res.writeHead(404); return res.end();} res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(bytes);});
});
async function measure(page, label, requireServe=true) {
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const m = await page.evaluate(() => {
    const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
    const home=document.querySelector('.home'),serve=document.querySelector('[data-act="serve"]');
    const hit = el => {const r=rect(el);return [[.5,.5],[.12,.12],[.88,.12],[.12,.88],[.88,.88]].every(([x,y])=>{const target=document.elementFromPoint(r.x+r.width*x,r.y+r.height*y);return target===el||el.contains(target);});};
    const lane=document.querySelector('#lane');
    return {home:rect(home),serve:rect(serve),title:rect(document.querySelector('.stall h2')),homeHits:hit(home),serveHits:hit(serve),scrollWidth:document.documentElement.scrollWidth,scrollY,viewport:{width:innerWidth,height:innerHeight},lane:lane?rect(lane):null,visibleInfo:['h1','.scene','.coins','#away-rule','#rate','#goal','.stall .habit','.stall .wait'].every(s=>{const e=document.querySelector(s),cs=getComputedStyle(e);return e.textContent.trim()&&cs.display!=='none'&&cs.visibility==='visible'&&e.scrollWidth<=e.clientWidth+1;})};
  });
  report.measurements.push({label,...m});
  const inside=r=>r.x>=-.5&&r.y>=-.5&&r.right<=m.viewport.width+1&&r.bottom<=m.viewport.height+1;
  check(label+': Back is fully visible and at least 44px',m.home.height>=44&&inside(m.home),m.home);
  check(label+': Back is unobstructed at center and corners',m.homeHits);
  if(requireServe){check(label+': first whole serve button is above the fold',m.serve.height>=44&&inside(m.serve),m.serve);check(label+': first serve is unobstructed at center and corners',m.serveHits);}
  check(label+': no horizontal overflow',m.scrollWidth<=m.viewport.width+1,m);
  check(label+': informational text is retained without horizontal clipping',m.visibleInfo);
  check(label+': Back and serve never overlap',!(m.home.x<m.serve.right&&m.home.right>m.serve.x&&m.home.y<m.serve.bottom&&m.home.bottom>m.serve.y));
  return m;
}
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png')});report.screens.push(name+'.png');}
(async()=>{
  let browser;
  try{
    if(process.env.REVIEW_HEAD_SHA&&process.env.REVIEW_HEAD_SHA!==head)throw Error('Checkout differs from requested PR head');
    check('The checkout is the requested PR head',true,head);
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const origin='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
    for(const [width,height] of [[320,568],[360,640],[390,844],[568,320],[667,375],[844,390],[1280,800]]){
      const phone=width<1000;
      const context=await browser.newContext({viewport:{width,height},hasTouch:phone,isMobile:phone,deviceScaleFactor:1,serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/games/night-market/');
      await page.waitForFunction(()=>window.__nightMarket&&document.querySelector('[data-act="serve"]'));
      await page.evaluate(()=>localStorage.setItem('nm-phone-unrelated-save','{"level":27}'));
      const label=width+'x'+height;
      await measure(page,label+' fresh'); await shot(page,'fresh-'+label);
      const serve=page.locator('[data-i="0"] [data-act="serve"]');
      const tap=async locator=>phone?locator.tap():locator.click();
      await tap(serve);await tap(serve);
      check(label+': two real taps pour exactly two cups',await page.evaluate(()=>__nightMarket.state.stalls[0].serves===2));
      if(phone){
        const session=await context.newCDPSession(page),r=await serve.boundingBox();
        const point={x:r.x+r.width/2,y:r.y+r.height/2};
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
        await page.waitForTimeout(950);
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        const held=await page.evaluate(()=>__nightMarket.state.stalls[0].serves);
        await page.waitForTimeout(400);
        check(label+': a held touch pours and stops after release',held>=6&&await page.evaluate(n=>__nightMarket.state.stalls[0].serves===n,held),held);
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
        await page.waitForTimeout(550);
        await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
        const cancelled=await page.evaluate(()=>__nightMarket.state.stalls[0].serves);
        await page.waitForTimeout(400);
        check(label+': cancelled active touch stops pouring',cancelled>held&&await page.evaluate(n=>__nightMarket.state.stalls[0].serves===n,cancelled),{held,cancelled});
        await session.detach();
      }
      // Real repeated presses reach the existing hire threshold; no model shortcut.
      for(let attempts=0;attempts<26;attempts++){if(await page.evaluate(()=>__nightMarket.state.stalls[0].serves>=25))break;await tap(serve);}
      await page.evaluate(()=>scrollTo(0,0));
      await measure(page,label+' hire ready');await shot(page,'hire-ready-'+label);
      await tap(page.locator('[data-i="0"] [data-act="hire"]'));
      await page.evaluate(()=>scrollTo(0,0));
      await measure(page,label+' hired');await shot(page,'hired-'+label);
      await tap(page.locator('[data-i="0"] [data-act="buy"]'));
      check(label+': the first hire and purchase still work',await page.evaluate(()=>__nightMarket.state.stalls[0].hired&&__nightMarket.state.stalls[0].owned===1));
      if(width===390){
        for(const [rw,rh] of [[844,390],[390,844],[844,390],[390,844]]){await page.setViewportSize({width:rw,height:rh});await page.evaluate(()=>scrollTo(0,0));await measure(page,'rotation '+rw+'x'+rh);}
        await shot(page,'portrait-after-rotation');
        // Keyboard focus remains DOM-based; decorations cannot intercept it.
        await page.reload();await page.keyboard.press('Tab');
        check('Keyboard first stops at Back with visible focus',await page.evaluate(()=>document.activeElement.matches('.home')&&getComputedStyle(document.activeElement).outlineStyle!=='none'));
        await page.keyboard.press('Tab');
        check('Keyboard then reaches the first bulk control',await page.evaluate(()=>document.activeElement.matches('[data-bulk="1"]')));
        await page.keyboard.press('Shift+Tab');await Promise.all([page.waitForURL('**/index.html'),page.keyboard.press('Enter')]);
        check('Keyboard Back reaches the arcade',new URL(page.url()).pathname==='/index.html',page.url());
        await page.goBack();await page.waitForFunction(()=>window.__nightMarket);
        check('Browser Back returns with the first stall intact',await page.evaluate(()=>__nightMarket.state.stalls[0].owned===1));
        await page.goForward();check('Browser Forward returns to the arcade',new URL(page.url()).pathname==='/index.html');
        await page.goBack();await page.waitForFunction(()=>window.__nightMarket);
        check('A second Browser Back keeps the stall intact',await page.evaluate(()=>__nightMarket.state.stalls[0].owned===1));
        for(let n=0;n<2;n++){await page.locator('.home').tap();check('Touch Back reaches arcade '+n,new URL(page.url()).pathname==='/index.html');await page.goBack();await page.waitForFunction(()=>window.__nightMarket);}
        await page.evaluate(()=>{__nightMarket.idle.stop();const k=NightMarket.SAVE_KEY;const s=JSON.parse(localStorage.getItem(k));s.seen=Date.now()-3600000;localStorage.setItem(k,JSON.stringify(s));});
        await page.reload();await page.waitForFunction(()=>window.__nightMarket);
        check('A return still shows the away summary',await page.locator('#away').isVisible());await shot(page,'away-portrait');
        await page.locator('[data-act="away"]').tap();await page.evaluate(()=>scrollTo(0,0));
        await measure(page,'after away dismiss');
        const box=page.locator('details.save');
        for(let n=0;n<2;n++){await box.locator('> summary').tap();check('Save disclosure opens '+n,await box.getAttribute('open')!==null);await box.locator('> summary').tap();check('Save disclosure closes '+n,await box.getAttribute('open')===null);}
        await page.evaluate(()=>{document.body.style.fontSize='34px';document.documentElement.style.fontSize='32px';scrollTo(0,0);});
        check('200% body and rem text stays horizontally scroll-free',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await shot(page,'large-text-portrait');
      }
      check(label+': unrelated save survives',await page.evaluate(()=>localStorage.getItem('nm-phone-unrelated-save')==='{"level":27}'));
      check(label+': no page errors',errors.length===0,errors);
      await context.close();
    }
  }catch(e){report.error=e.stack;process.exitCode=1;}
  finally{if(browser)await browser.close();server.close();if(report.checks.some(c=>!c.pass))process.exitCode=1;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
