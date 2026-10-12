const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=process.cwd(),out=path.join(root,'docs/playtests/brisket-ac3-2/captures'),traces=require('./routes.json');fs.mkdirSync(out,{recursive:true});
const baseline=fs.readFileSync(path.join(__dirname,'baseline-model.cjs'),'utf8');
const server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,p)));}catch{res.writeHead(404);res.end();}});
let checks=0;const results=[],check=(s,v)=>{assert.ok(v,s);checks++;};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});try{
 for(const [width,height]of [[320,568],[375,812],[390,844],[667,375],[812,375],[1366,768],[1920,1080],[3440,1440]]){
  for(const version of ['before','after']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(version==='before')await page.route('**/games/briskets-crossing/model.js',route=>route.fulfill({contentType:'text/javascript',body:baseline}));
   await page.goto(`http://127.0.0.1:${server.address().port}/games/briskets-crossing/`);
   await page.evaluate(()=>{const H=__brisket;H.start(1);H.launch();Object.assign(H.state,H.M.create(1,17));H.M.ready(H.state);H.state.paused=true;});await page.waitForTimeout(60);
   const metrics=await page.evaluate(()=>{const H=__brisket,p=H.M.current(H.state),r=document.querySelector('#sea').getBoundingClientRect();return{canvas:{width:r.width,height:r.height},time:p.time,lanes:p.lanes.map(l=>{const a=[...l.items].sort((a,b)=>a.x-b.x),gaps=a.map((it,i)=>(a[(i+1)%a.length].x-it.x+H.M.COLS)%H.M.COLS-it.w);return{row:l.y,kind:l.kind,count:a.length,width:a[0].w,minGap:Math.min(...gaps),minGapCss:Math.min(...gaps)*r.width/H.M.COLS,minClearSeconds:Math.min(...gaps)/l.speed,landingSeconds:a[0].w/l.speed};})};});
   await page.screenshot({path:path.join(out,`${width}x${height}-${version}-opening.png`)});
   if(version==='after'){
    check('first clock 56 seconds',metrics.time===56);check('all road gaps at least 2.683 columns',metrics.lanes.filter(l=>l.kind==='road').every(l=>l.minGap>2.683));check('all river landing windows over 6 seconds',metrics.lanes.filter(l=>l.kind==='river').every(l=>l.landingSeconds>6));
    // Actual touchscreen and real animation time, with intact moving hazards.
    await page.evaluate(()=>{const H=__brisket;Object.assign(H.state,H.M.create(1,17));H.M.ready(H.state);H.state.paused=false;});
    await page.waitForTimeout(500);const r=await page.locator('#sea').boundingBox();await page.touchscreen.tap(r.x+6.5/13*r.width,r.y+9.5/11*r.height);
    await page.waitForFunction(()=>{const H=__brisket,p=H.M.current(H.state);return p.y===9&&p.hop===0;},null,{timeout:2000});
    check('real first tap clears the moving first road',await page.evaluate(()=>__brisket.M.current(__brisket.state).lives===3));await page.evaluate(()=>__brisket.state.paused=true);
    await page.screenshot({path:path.join(out,`${width}x${height}-after-first-tap.png`)});
    // Exact timed model replays render in the real browser, without removing hazards.
    // This establishes reachability, not human success rates or physical-device feel.
    for(const trace of traces.routes){
     await page.evaluate(seed=>{const H=__brisket;Object.assign(H.state,H.M.create(1,seed));H.M.ready(H.state);H.state.paused=true;},trace.seed);
     for(const leg of trace.legs){
      const state=await page.evaluate(({leg,actions})=>{const H=__brisket,s=H.state;s.paused=false;for(const ai of leg.actions){H.M.advance(s,.2,actions[ai]);H.M.advance(s,.15,{});}s.paused=true;const p=H.M.current(s);return{lives:p.lives,homes:p.homes.map(h=>h.filled),time:p.time,clearing:p.clearing};},{leg,actions:traces.actions});
      check('timed route keeps three lives',state.lives===3);check('timed route reaches its home',state.homes[leg.home]);
      if(trace.seed===17&&[0,4].includes(leg.home)){await page.waitForTimeout(40);await page.screenshot({path:path.join(out,`${width}x${height}-after-home-${leg.home+1}.png`)});}
     }
    }
   }
   check('no runtime errors',errors.length===0);results.push({width,height,version,metrics,errors});await context.close();
  }
 }
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({checks,routeCadenceSeconds:.35,results},null,2));console.log(`PASS easier-opening browser review: ${checks} checks, ${results.length} viewport/version samples`);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
