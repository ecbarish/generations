const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=process.cwd(),out=path.join(root,'docs/playtests/brisket-ac3-1/responsive');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,p)));}catch{res.writeHead(404);res.end();}});
const results=[];let count=0;const check=(name,ok)=>{assert.ok(ok,name);count++;};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});try{
 for(const dpr of [1,2])for(const [width,height] of [[320,568],[375,812],[667,375],[812,375],[1366,768],[1920,1080],[3440,1440]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const name=`${width}x${height}-dpr${dpr}`;
  await page.goto(`http://127.0.0.1:${server.address().port}/games/briskets-crossing/`);
  await page.locator('[data-start="1"]').click();await page.keyboard.press('ArrowUp');
  await page.evaluate(()=>{const H=__brisket;H.state.paused=true;});
  await page.waitForTimeout(50);
  const metrics=await page.evaluate(()=>{const c=document.querySelector('#sea'),r=c.getBoundingClientRect(),t=c.getContext('2d').getTransform();return{canvas:{x:r.x,y:r.y,width:r.width,height:r.height},transform:{a:t.a,d:t.d},overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,controls:[...document.querySelectorAll('[data-hold]')].map(b=>{const r=b.getBoundingClientRect();return{width:r.width,height:r.height};})};});
  check(name+' isotropic canvas transform',Math.abs(metrics.transform.a-metrics.transform.d)<.001);check(name+' full available world',metrics.canvas.width>=Math.min(width-40,width>2400?2160:1460)&&metrics.canvas.height>150);check(name+' no overflow',!metrics.overflow);check(name+' 44px controls',metrics.controls.every(r=>r.width>=44&&r.height>=44));
  await page.screenshot({path:path.join(out,name+'-normal.png')});
  await page.evaluate(()=>{const H=__brisket;document.querySelector('#notice').textContent='Score kept for this visit. This browser could not save it.';H.M.hurt(H.state);});await page.waitForTimeout(50);
  const caption=await page.locator('#recovery').evaluate(e=>{const r=e.getBoundingClientRect();return{text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize),width:r.width,height:r.height,hidden:e.hidden,pointerEvents:getComputedStyle(e).pointerEvents};});check(name+' readable recovery caption',caption.font>=16&&!caption.hidden&&caption.text==='Steady, Brisket');check(name+' caption does not consume input',caption.pointerEvents==='none');check(name+' existing save warning preserved',(await page.locator('#notice').textContent()).includes('could not save it'));
  await page.locator('#notice').evaluate(e=>e.textContent='');
  await page.screenshot({path:path.join(out,name+'-recovery.png')});
  await page.evaluate(()=>{const H=__brisket;H.M.current(H.state).recovery=0;});await page.waitForTimeout(50);check(name+' release caption',await page.locator('#recovery').textContent()==='Release to hop again');await page.screenshot({path:path.join(out,name+'-release.png')});
  await page.evaluate(()=>{const H=__brisket,p=H.M.current(H.state);p.awaitRelease=false;p.clearing=1;});await page.waitForTimeout(50);await page.screenshot({path:path.join(out,name+'-lanterns.png')});
  await page.evaluate(()=>__brisket.pause());await page.waitForTimeout(50);check(name+' recovery hidden behind menus',await page.locator('#recovery').isHidden());await page.screenshot({path:path.join(out,name+'-pause.png')});
  // Actual canvas pointer input before and after repeated rotation; empty hazards isolate mapping.
  for(const [vw,vh] of [[width,height],[height,width],[width,height]]){
   await page.setViewportSize({width:vw,height:vh});
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
    await page.evaluate(()=>{const H=__brisket;H.start(1);H.launch();const p=H.M.current(H.state);p.x=6.5;p.y=5;p.tx=p.x;p.ty=p.y;p.best=0;p.lanes.forEach(l=>{l.speed=0;l.items=l.kind==='river'?[{x:0,w:13}]:[];});});
    const r=await page.locator('#sea').boundingBox();await page.touchscreen.tap(r.x+(6.5+dx)/13*r.width,r.y+(5.5+dy)/11*r.height);await page.waitForTimeout(230);
    const pose=await page.evaluate(()=>{const H=__brisket,p=H.M.current(H.state);return{x:p.x,y:p.y,lives:p.lives};});check(name+` tap ${dx},${dy} after ${vw}x${vh}`,Math.abs(pose.x-(6.5+dx))<.01&&pose.y===5+dy&&pose.lives===3);
   }
  }
  await page.evaluate(()=>{__brisket.title();});await page.waitForTimeout(50);check(name+' title clears caption',await page.locator('#recovery').isHidden());
  await page.evaluate(()=>{const H=__brisket;H.start(2);H.launch();H.M.current(H.state).lives=1;H.M.hurt(H.state);});await page.waitForTimeout(50);check(name+' next player ready has no stale caption',await page.evaluate(()=>__brisket.state.active===1&&__brisket.state.phase==='ready'&&document.querySelector('#recovery').hidden));
  check(name+' no runtime errors',errors.length===0);results.push({name,metrics,caption,errors});await context.close();
 }
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({checks:count,results},null,2));console.log(`PASS responsive browser review: ${count} checks, ${results.length*5} screenshots`);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
