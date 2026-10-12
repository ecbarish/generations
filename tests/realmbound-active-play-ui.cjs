const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.argv[2]||'http://localhost:8776';
const output='docs/screenshots/realmbound-active-play';
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    for(const [width,height] of [[375,812],[1366,768],[1920,1080],[3440,1440]]){
      const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];let visibilityChecks=0;
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/games/realmbound/');
      await page.waitForFunction(()=>window.__rb);
      // Isolated fixture; this is UI regression evidence, not a scored human playtest.
      await page.evaluate(()=>{
        const h=newHero('Active Traveler','concord','human','warrior');h.onboarding=null;
        S.chars=[h];S.cur=h.id;boot();closeModal();spawn();updateWorld();
      });
      const snapshot=()=>page.evaluate(()=>({hp:C.hp,mhp:C.mob?.hp,kills:H().stats.kills,xp:H().xp,money:H().money}));
      const waiting=await snapshot();
      await page.evaluate(()=>{for(let i=0;i<6000;i++)step(.1);updateWorld();});
      assert.deepEqual(await snapshot(),waiting);
      assert.ok(await page.locator('#fightBtn').isVisible());
      assert.ok(await page.locator('#mAuto').isDisabled());
      await page.screenshot({path:output+'/waiting-'+width+'.png'});
      await page.locator('#fightBtn').click();
      await page.waitForFunction(()=>C.fightT>.5);
      await page.waitForFunction(()=>C.mob&&(C.mob.hp<C.mob.max||C.hp<ST.hpMax));
      assert.ok(await page.evaluate(()=>C.mob.hp<C.mob.max||C.hp<ST.hpMax));
      await page.screenshot({path:output+'/fighting-'+width+'.png'});
      // Deterministically reach the same inactivity threshold, then exercise real interval ticks.
      await page.evaluate(()=>{C.run=C.lastInput+10;updateWorld();});
      const paused=await snapshot();await page.waitForTimeout(1500);
      assert.deepEqual(await snapshot(),paused);
      assert.ok((await page.locator('#modeHint').innerText()).includes('waits for you'));
      await page.screenshot({path:output+'/paused-'+width+'.png'});
      await page.locator('#fightBtn').click();assert.ok(await page.evaluate(()=>!combatWaiting()));
      // Emulate an old Auto save in a current-level area, then reload through the normal boot path.
      const stored=await page.evaluate(()=>{H().mode='auto';save();return {lvl:H().lvl,xp:H().xp,kills:H().stats.kills,money:H().money};});
      await page.reload();await page.waitForFunction(()=>window.__rb&&H());
      assert.deepEqual(await page.evaluate(()=>({lvl:H().lvl,xp:H().xp,kills:H().stats.kills,money:H().money})),stored);
      assert.equal(await page.evaluate(()=>H().mode),'focus');
      await page.evaluate(()=>{spawn();updateWorld();});
      await page.waitForTimeout(300);assert.ok(await page.locator('#fightBtn').isVisible());
      // Real tab visibility changes: active combat stops and cannot farm behind another tab.
      await page.locator('#fightBtn').click();
      const other=await context.newPage();await other.goto(base+'/tests/run.html');await other.bringToFront();
      if(await page.evaluate(()=>document.hidden)){visibilityChecks++;
        const hidden=await snapshot();await other.waitForTimeout(1200);assert.deepEqual(await snapshot(),hidden);
        await page.bringToFront();assert.ok(await page.evaluate(()=>combatWaiting()));
      }
      await other.close();
      await page.evaluate(()=>{H().lvl=20;H().addons.unl.macro=true;H().mode='focus';boot();spawn();updateWorld();});
      assert.ok(await page.locator('#mAuto').isEnabled());await page.locator('#mAuto').click();assert.ok(await page.evaluate(()=>aiOn()));
      await page.screenshot({path:output+'/earned-auto-'+width+'.png'});
      // Explicit lifecycle fixture because Playwright can keep every tab reported visible.
      // This exercises the real application event handler/intervals, not a native focus claim.
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
      assert.equal(await page.evaluate(()=>H().mode),'focus');
      const hiddenFixture=await snapshot();await page.waitForTimeout(1200);assert.deepEqual(await snapshot(),hiddenFixture);
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
      assert.ok(await page.evaluate(()=>combatWaiting()&&!aiOn()));

      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const idleTab=await context.newPage();await idleTab.goto(base+'/tests/run.html');await idleTab.bringToFront();
      if(await page.evaluate(()=>document.hidden)){visibilityChecks++;
        assert.equal(await page.evaluate(()=>H().mode),'focus');
        const before=await snapshot();await idleTab.waitForTimeout(1200);assert.deepEqual(await snapshot(),before);
        await page.bringToFront();assert.ok(await page.evaluate(()=>combatWaiting()&&!aiOn()));
      }
      await idleTab.close();
      // Persist a historical timestamp directly, close without unload (which would save now), then reopen normally.
      const away=await page.evaluate(()=>{H().mode='auto';save();const old=JSON.parse(localStorage.getItem(KEY));const hero=old.chars.find(c=>c.id===old.cur);hero.lastPlayed=Date.now()-2*3600e3;old.last=hero.lastPlayed;localStorage.setItem(KEY,JSON.stringify(old));return {lvl:hero.lvl,xp:hero.xp,money:hero.money,kills:hero.stats.kills,rested:hero.rested,save:JSON.stringify(old)};});
      await page.close({runBeforeUnload:false});
      const back=await context.newPage();back.on('pageerror',e=>errors.push(e.message));await back.goto(base+'/tests/run.html');await back.evaluate(old=>localStorage.setItem('realmbound-save-v1',old),away.save);await back.goto(base+'/games/realmbound/');await back.waitForFunction(()=>window.__rb&&H());
      assert.deepEqual(await back.evaluate(()=>({lvl:H().lvl,xp:H().xp,money:H().money,kills:H().stats.kills})),{lvl:away.lvl,xp:away.xp,money:away.money,kills:away.kills});
      assert.ok(await back.evaluate(()=>H().rested)>away.rested);assert.equal(await back.evaluate(()=>H().mode),'focus');
      assert.ok((await back.locator('#sheet').innerText()).includes('road waits'));
      await back.screenshot({path:output+'/rested-return-'+width+'.png'});
      await context.close();
      assert.deepEqual(errors,[]);console.log('ok',width,'idle, Fight, pause, reload, rested return; actual hidden-tab assertions:',visibilityChecks);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
