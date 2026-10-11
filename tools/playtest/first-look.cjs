// Newcomer first look: opens every game at desktop and phone size, saves a screenshot of each and prints the
// visible text, page errors and any sideways scroll. Usage (from the repo root, with a server on :8765):
//   NODE_PATH=$(npm root -g) node tools/playtest/first-look.cjs <output folder>
// See docs/PLAYTEST.md for how the scorecard uses it.
const { chromium } = require('playwright');
const S = process.argv[2] || "playtest-shots"; require("fs").mkdirSync(S, {recursive: true});
const pages = [['hub','/'],['realmbound','/games/realmbound/'],['diamond','/games/diamond-career/'],['otherworld','/games/otherworld/'],['primordial','/games/primordial/'],['starfall-guild','/games/starfall-guild/'],['wildbond-classic','/games/wildbond/'],['wildbond-godot','/play/wildbond/'],['starfall-godot','/play/starfall/'],['playtest','/playtest.html'],['diamond-manager','/games/diamond-manager/'],['storm-front','/games/storm-front/'],['lighthouse-watch','/games/lighthouse-watch/'],['briskets-crossing','/games/briskets-crossing/'],['little-ranch','/games/little-ranch/']];
(async()=>{
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  for (const [vp,w,h,mob] of [['desk',1280,800,false],['phone',390,844,true]]) {
    for (const [n,u] of pages) {
      const ctx = await b.newContext({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob});
      const p = await ctx.newPage(); const errs=[];
      p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
      await p.goto('http://localhost:8765'+u,{waitUntil:'load'}).catch(e=>errs.push('goto '+e.message));
      await p.waitForTimeout(n.includes('godot')?12000:2500);
      await p.screenshot({path:`${S}/${n}-${vp}.png`});
      const sw = await p.evaluate(()=>document.documentElement.scrollWidth).catch(()=>0);
      if (vp==='desk'){ const t = await p.evaluate(()=>document.body.innerText.slice(0,1500)).catch(()=>''); console.log('=== '+n+' errs:'+JSON.stringify(errs.slice(0,3))+'\n'+t.replace(/\n+/g,' | ')); }
      else console.log('phone '+n+' scrollWidth '+sw+' errs '+errs.length);
      await ctx.close();
    }
  }
  await b.close();
})();
