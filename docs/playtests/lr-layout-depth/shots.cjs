// LR-G2 screenshots: the same seven moments at four sizes. Usage: node shots.cjs <repo-root> <out-dir>
// Needs the playwright (or playwright-core) package and Chrome at /usr/bin/google-chrome (CHROME_PATH overrides).
let chromium;try{({chromium}=require('playwright-core'));}catch(e){({chromium}=require('playwright'));}const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.argv[2],OUT=process.argv[3],PRE='';fs.mkdirSync(OUT,{recursive:true});
const T={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const SIZES=[[390,844],[844,390],[360,780],[1024,594]];
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream'});r.end(d)})}).listen(0,'127.0.0.1',async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});const facts={};
 for(const [w,h] of SIZES){const sz=w+'x'+h;const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://127.0.0.1:'+srv.address().port+'/games/little-ranch/');await pg.waitForFunction(()=>window.LR);
  const shot=async n=>{await pg.evaluate(()=>LR.redraw());await pg.waitForTimeout(80);await pg.screenshot({path:path.join(OUT,`${PRE}${sz}-${n}.png`)})};
  const tap=async q=>{const p=await pg.evaluate(q=>LR.toScreen(q),q);await pg.touchscreen.tap(p.x,p.y);await pg.waitForTimeout(60)};
  await pg.evaluate(()=>{LR.prefs.sound=false;LR.setRoutine(false);LR.setFriend(false);LR.newVisit();LR.advance(.6)});
  await shot('1a-fox-ball-start');
  const bq=await pg.evaluate(()=>LR.ballNow());await tap(bq);await pg.evaluate(()=>LR.advance(2.2));await shot('1b-fox-ball-after-roll');
  await pg.evaluate(()=>{LR.newVisit();LR.advance(.6)});await shot('2-signs');
  // bedtime bubble
  await pg.evaluate(()=>{LR.setRoutine(true);LR.setFriend(false);LR.newVisit();LR.advance(.5);LR.bedtime()});
  for(let i=0;i<40;i++){await pg.evaluate(()=>LR.advance(1));const ok=await pg.evaluate(()=>{const r=LR.state.routine;return !!(r&&!r.doing&&r.step<2&&LR.state.baby.act!=='yawn'&&LR.state.baby.tx===null&&LR.state.mode==='dusk')});if(ok)break}
  await shot('3-bedtime-bubble');
  // Pebblit eating path
  await pg.evaluate(()=>{LR.setRoutine(false);LR.setFriend(true);LR.newVisit();LR.advance(8);LR.act.feed();LR.advance(.2)});
  let best=null;for(let i=0;i<260;i++){await pg.evaluate(()=>LR.advance(.1));const f=await pg.evaluate(()=>{const S=LR.state,L=LR.layout,f=S.friend;return f?{x:f.x*(LR.layout.home.x*2),act:f.act,tx:f.tx,bx:L.basket.x,by:L.basket.y,br:L.basket.r}:null});if(!f)break;if(f.act==='eat'){best=f;break}}
  await shot('4-pebblit-eating');
  // puddles with ball each side
  for(const side of [-1,1]){await pg.evaluate(s=>{LR.setRoutine(false);LR.setFriend(false);LR.newVisit();LR.advance(.3);const S=LR.state;S.puddles=[0,1].map(i=>({i,at:S.t,splash:-9}));S.ball.from=s;S.ball.to=s;S.ball.at=-9;LR.advance(.7)},side);await shot('5'+(side<0?'a':'b')+'-puddles-ball-'+(side<0?'left':'right'))}
  facts[sz]=errs;await ctx.close()}
 console.log(JSON.stringify(facts));await b.close();srv.close()});
