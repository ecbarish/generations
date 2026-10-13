/* CI review pictures; use a fresh context for every page and never read player saves. */
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/rb-pictures');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'localhost',resolve));
 const browser=await chromium.launch({headless:true});
 try{
 for(const [width,height,text]of [[375,812,1],[390,844,1.5],[667,375,1],[1366,768,1],[1920,1080,1],[3440,1440,1]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  await page.goto('http://localhost:'+server.address().port+'/games/realmbound/');
  await page.waitForFunction(()=>window.__rb);
  await page.evaluate(text=>{document.documentElement.style.setProperty('--arc-text',text);window.eval("const pictureHero=newHero('Fieldreview','concord','human','hunter');pictureHero.lvl=60;pictureHero.onboarding={arrival:true,hints:{}};pictureHero.mode='focus';S.chars=[pictureHero];S.cur=pictureHero.id;boot();closeModal();clearArrival();C.phase='seek';C.t=100;updateWorld();");},text);
  await page.waitForTimeout(500);
  const prefix=width+'x'+height+'-text'+text;
  await page.screenshot({path:path.join(out,prefix+'-field.png')});
  await page.evaluate(()=>window.eval('questOffer(QUESTS.thornvale[0].id);SCN.skip();'));
  await page.screenshot({path:path.join(out,prefix+'-conversation.png')});
  await page.evaluate(()=>window.eval("RTALK=null;SCN.el.hidden=true;openRealmNotebook('bags');"));
  await page.screenshot({path:path.join(out,prefix+'-satchel.png')});
  await page.evaluate(()=>window.eval("closeRealmNotebook(false);clearTownService();RTALK=null;SCN.el.hidden=true;const questPicture=newHero('Three Roads','concord','human','hunter');questPicture.onboarding={arrival:true,hints:{}};S.chars=[questPicture];S.cur=questPicture.id;boot();closeModal();accept('t1');accept('t2');accept('t3');C.phase='intown';townEnter();openRealmNotebook('quests');"));
  await page.waitForTimeout(200);
  await page.screenshot({path:path.join(out,prefix+'-thornvale-journal.png')});
  await page.evaluate(()=>window.eval("closeRealmNotebook(false);abandon('t2');abandon('t3');talkPlaceQuest(townPeople().find(n=>n.name==='Deputy Rhea'));SCN.skip();"));
  await page.screenshot({path:path.join(out,prefix+'-thornvale-requests.png')});
  await context.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
