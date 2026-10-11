// Exact release-PCK browser review; FS exposure and fixture injection are response overrides only.
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'preview-review');
fs.mkdirSync(path.join(out, 'screens'), {recursive:true});
const report = {checks:[], screenshots:[], errors:[], saves:[], started:new Date().toISOString()};
const check = (ok, message) => {assert(ok, message); report.checks.push(message); console.log('PASS', message); write();};
function write(){fs.writeFileSync(path.join(out,'web-review.json'),JSON.stringify(report,null,2));}
const server=http.createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const savePath='/userfs/godot/app_userdata/Starfall (Godot)/starfall.json';
async function open(browser,size,{fixture=null,before=false,instrument=true}={}){
  const context=await browser.newContext({viewport:size,hasTouch:size.width<=960,isMobile:size.width<=960,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/SCRIPT ERROR|Parse Error|Failed to load script|Aborted\(/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('starfall-guild-save-v1','classic-starfall-sentinel');localStorage.setItem('unrelated-sentinel','keep');});
  if(instrument)await page.route('**/play/starfall/index.js',route=>{
    const code=fs.readFileSync(path.join(root,'play/starfall/index.js'),'utf8');
    assert(code.includes('var FS={'));return route.fulfill({contentType:'text/javascript',body:code.replace('var FS={','var FS=globalThis.__reviewFS={')});
  });
  if(fixture)await page.route('**/play/starfall/',route=>{
    let html=fs.readFileSync(path.join(root,'play/starfall/index.html'),'utf8');
    const hook=`engine.preloadFile(new TextEncoder().encode(${JSON.stringify(JSON.stringify(fixture))}), ${JSON.stringify(savePath)});`;
    html=html.replace('const engine = new Engine(GODOT_CONFIG);','const engine = new Engine(GODOT_CONFIG);'+hook);
    return route.fulfill({contentType:'text/html',body:html});
  });
  if(before)await page.route('**/play/starfall/index.pck',route=>route.fulfill({path:process.env.BEFORE_PACK,contentType:'application/octet-stream'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/play/starfall/`);
  await page.waitForFunction(()=>!document.querySelector('#status'),null,{timeout:90000});
  await page.waitForTimeout(900);
  check(errors.length===0,`engine starts ${size.width}x${size.height} ${before?'before':'after'} ${instrument?'instrumented':'unaltered'}`);
  return {context,page,errors};
}
async function shot(page,label){const filename=label+'.png';await page.screenshot({path:path.join(out,'screens',filename),timeout:15000});report.screenshots.push(filename);write();}
async function dismiss(page,count=3){for(let i=0;i<count;i++){await page.keyboard.press('Enter');await page.waitForTimeout(160);}}
async function readSave(page){return page.evaluate(p=>{try{return JSON.parse(globalThis.__reviewFS.readFile(p,{encoding:'utf8'}));}catch{return null;}},savePath);}
async function stored(page){return page.evaluate(p=>new Promise((resolve,reject)=>{
  const req=indexedDB.open('/userfs');const timer=setTimeout(()=>reject(Error('IndexedDB timeout')),8000);
  req.onerror=()=>{clearTimeout(timer);reject(req.error)};
  req.onsuccess=()=>{const db=req.result;const tx=db.transaction('FILE_DATA','readonly');const file=tx.objectStore('FILE_DATA').get(p);
    file.onsuccess=()=>{clearTimeout(timer);db.close();const bytes=file.result?.contents;resolve(bytes?JSON.parse(new TextDecoder().decode(bytes)):null)};
    file.onerror=()=>{clearTimeout(timer);db.close();reject(file.error)};
  };
}),savePath);}
async function waitSave(page,test,label,browser=false){let last;for(let i=0;i<40;i++){last=await (browser?stored(page):readSave(page));if(last&&test(last)){check(true,label);report.saves.push({label,me:last.me,coins:last.coins,day:last.day,built:last.built});write();return last;}await page.waitForTimeout(300);}throw Error(label+': '+JSON.stringify(last));}
async function verifySentinels(page,label){check(await page.evaluate(()=>localStorage.getItem('starfall-guild-save-v1')==='classic-starfall-sentinel'&&localStorage.getItem('unrelated-sentinel')==='keep'),label+' keeps Classic/unrelated storage');}
async function targetPoint(page,size,tile,me){
  const box=await page.locator('#canvas').boundingBox();
  const scale=Math.max(1,Math.floor(Math.min(box.width/384,box.height/216)));
  const cx=Math.max(-416+192,Math.min(704-192,me[0]*16+8));
  const cy=Math.max(-16+108,Math.min(288-108,me[1]*16+8));
  return {x:box.x+(box.width-384*scale)/2+(tile[0]*16+8-cx+192)*scale,y:box.y+(box.height-216*scale)/2+(tile[1]*16+8-cy+108)*scale};
}
async function reload(page){await page.unroute('**/play/starfall/');await page.reload();await page.waitForFunction(()=>!document.querySelector('#status'),null,{timeout:90000});await page.waitForTimeout(800);await dismiss(page,1);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const legacy=JSON.parse(fs.readFileSync(path.join(out,'legacy.json'),'utf8'));
  check(legacy.coins===321&&legacy.day===7&&JSON.stringify(legacy.me)==='[14,10]','legacy fixture is the previous writer’s saved town');
  const plain=await open(browser,{width:1920,height:1080},{instrument:false});
  await shot(plain.page,'unaltered-desktop-welcome');await plain.context.close();
  for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:812,height:375},{width:3440,height:1440}]){
    const tag=`${size.width}x${size.height}`;
    const g=await open(browser,size);const p=g.page;
    await shot(p,tag+'-fresh-welcome');await dismiss(p);
    await waitSave(p,d=>JSON.stringify(d.me)==='[15,5]'&&d.coins===100&&d.day===1,tag+' fresh town uses new opening');
    await shot(p,tag+'-fresh-ready');
    await p.keyboard.down('ArrowDown');await p.waitForTimeout(300);await p.keyboard.up('ArrowDown');
    const moved=await waitSave(p,d=>d.me[0]===15&&d.me[1]>5,tag+' real keyboard walks away');
    const at=await targetPoint(p,size,[15,5],moved.me);
    if(size.width<=960)await p.touchscreen.tap(at.x,at.y);else await p.mouse.click(at.x,at.y);
    await waitSave(p,d=>JSON.stringify(d.me)==='[15,5]',tag+' real pointer returns to opening');
    await shot(p,tag+'-returned');
    await waitSave(p,d=>JSON.stringify(d.me)==='[15,5]',tag+' fresh position reaches IndexedDB',true);
    await reload(p);
    await waitSave(p,d=>JSON.stringify(d.me)==='[15,5]'&&d.coins===100,tag+' fixture-free reload keeps new town');
    await verifySentinels(p,tag);check(g.errors.length===0,tag+' has no runtime errors');await g.context.close();
  }
  for(const size of [{width:1920,height:1080},{width:812,height:375}]){
    const tag=`${size.width}x${size.height}`;
    const old=await open(browser,size,{fixture:legacy,before:true});await dismiss(old.page,1);
    await waitSave(old.page,d=>d.coins===321&&JSON.stringify(d.me)==='[14,10]',tag+' previous pack loads legacy town');
    await shot(old.page,tag+'-legacy-before');await old.context.close();
    const current=await open(browser,size,{fixture:legacy});await dismiss(current.page,1);
    const matches=d=>d.coins===321&&d.day===7&&d.meals===12&&d.rank===1&&JSON.stringify(d.me)==='[14,10]'&&d.built.west.what==='healer'&&d.heroes.length===3;
    await waitSave(current.page,matches,tag+' refreshed pack preserves legacy position/progress');
    await shot(current.page,tag+'-legacy-after');
    await waitSave(current.page,matches,tag+' legacy town reaches IndexedDB',true);
    await reload(current.page);await waitSave(current.page,matches,tag+' fixture-free reload keeps legacy town');
    await verifySentinels(current.page,tag+' legacy');check(current.errors.length===0,tag+' legacy has no runtime errors');await current.context.close();
  }
  report.passed=true;write();console.log('STARFALL_WEB_PASS',report.checks.length,'checks',report.screenshots.length,'screenshots');
 }catch(e){report.errors.push(String(e));report.passed=false;write();throw e;}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
