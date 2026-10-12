// SF-MOBILE-FIT: real exported packs, production shell/engine, isolated browser storage.
// The only engine response override exposes Emscripten FS for save assertions; no game hooks.
const fs = require('fs'), path = require('path'), http = require('http');
const assert = require('assert/strict'), crypto = require('crypto');
const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.MOBILE_FIT_OUTPUT || path.join(root, 'mobile-fit-review'));
const beforePack = path.resolve(process.env.BEFORE_PACK || path.join(out, 'pack/before.pck'));
const afterPack = path.resolve(process.env.AFTER_PACK || path.join(out, 'pack/after.pck'));
const savePath = '/userfs/godot/app_userdata/Starfall (Godot)/starfall.json';
const profiles = {
  android: {userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', hasTouch:true, isMobile:true},
  ios: {userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', hasTouch:true, isMobile:true},
  desktop: {userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', hasTouch:false, isMobile:false},
};
function bounds(image, predicate, region={x:0,y:0,width:image.width,height:image.height}) {
  let left=image.width, top=image.height, right=-1, bottom=-1, count=0;
  for(let y=Math.max(0,Math.ceil(region.y));y<Math.min(image.height,Math.floor(region.y+region.height));y++) {
    for(let x=Math.max(0,Math.ceil(region.x));x<Math.min(image.width,Math.floor(region.x+region.width));x++) {
      const i=(y*image.width+x)*4;
      if(predicate(image.data[i],image.data[i+1],image.data[i+2],image.data[i+3])) {
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;
      }
    }
  }
  return count ? {x:left,y:top,width:right-left+1,height:bottom-top+1,count} : null;
}
function addedTextPixels(before,after,region) {
  assert(before.width===after.width&&before.height===after.height,'Text comparison needs equal-size rendered frames');
  let count=0;
  for(let y=Math.ceil(region.y);y<Math.floor(region.y+region.height);y++)for(let x=Math.ceil(region.x);x<Math.floor(region.x+region.width);x++) {
    const i=(y*after.width+x)*4,a=after.data,b=before.data;
    // Actual small font coverage is antialiased below its nominal #f4efe4 label colour.
    // Require newly bright, near-neutral pixels relative to the same static UI region.
    if(Math.min(a[i],a[i+1],a[i+2])>=120 && Math.max(a[i],a[i+1],a[i+2])-Math.min(a[i],a[i+1],a[i+2])<50 &&
      a[i]+a[i+1]+a[i+2]-b[i]-b[i+1]-b[i+2]>60)count++;
  }
  return count;
}
const painted = (im,region) => bounds(im,(r,g,b,a)=>a>0&&Math.max(r,g,b)>4,region);
const cream = (r,g,b) => r>=225 && g>=219 && b>=203 && Math.abs(r-g)<32;
const gold = (r,g,b) => r>155 && g>120 && b<140 && r>b*1.45 && g>b*1.3;
function logicalRegion(f,x,y,w,h) {return {x:f.x+x*f.width/384,y:f.y+y*f.height/216,width:w*f.width/384,height:h*f.height/216};}
function dialogueBounds(im, frame) {
  // Find the long cream rows of the actual dialogue panel, ignoring small status glyphs.
  const scale=frame.width/384, rows=[];
  for(let y=frame.y;y<frame.y+frame.height;y++) {
    const b=bounds(im,cream,{x:frame.x,y,width:frame.width,height:1});
    if(b&&b.count>130*scale) rows.push({y,b});
  }
  if(!rows.length)return null;
  return {x:Math.min(...rows.map(r=>r.b.x)),y:rows[0].y,
    width:Math.max(...rows.map(r=>r.b.x+r.b.width))-Math.min(...rows.map(r=>r.b.x)),
    height:rows.at(-1).y-rows[0].y+1,count:rows.reduce((n,r)=>n+r.b.count,0)};
}
if(process.argv.includes('--self-test')) {
  const im=PNG.sync.read(fs.readFileSync(path.join(root,'docs/screenshots/starfall-opening-view/after-812x375-welcome.png')));
  const f=painted(im);assert.deepEqual([f.x,f.y,f.width,f.height],[214,79,384,216]);
  const d=dialogueBounds(im,f);assert(d&&d.width>=235&&d.width<=240&&d.height>20);
  assert.equal(addedTextPixels(im,im,{x:0,y:0,width:im.width,height:im.height}),0,'Identical frames cannot count as newly rendered text');
  console.log('PASS: screenshot pixel decoder finds the real 384x216 integer-scale witness and dialogue panel');
  process.exit(0);
}
const { chromium } = require('playwright');
fs.mkdirSync(path.join(out,'screens'),{recursive:true});
const report={started:new Date().toISOString(),source:process.env.SOURCE_SHA||null,base:process.env.BASE_SHA||null,
  scope:'Chromium Android/iPhone UA, touch, viewport and DPR emulation; not physical devices or Safari/WebKit.',
  limitations:['Existing dialogue panels consume taps; dialogue is advanced with the supported open-world tap below the panel. This scaling test does not change dialogue input handling.','Text evidence is rendered glyph/panel pixels and full-resolution screenshots, not automated OCR or a human readability rating.'],
  checks:[],captures:[],sessions:[],saves:[],textTransitions:[],errors:[],packs:{}};
const write=()=>fs.writeFileSync(path.join(out,'web-review.json'),JSON.stringify(report,null,2)+'\n');
const check=(ok,message)=>{assert(ok,message);report.checks.push(message);console.log('PASS',message);write();};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const server=http.createServer((req,res)=>{
  if(req.url==='/__review_blank__'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Isolated review storage</title>');}
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
let activePage;
async function open(browser,platform,size,{before=false,fixture=null,instrument=true,dpr=1}={}) {
  const context=await browser.newContext({...profiles[platform],viewport:size,deviceScaleFactor:dpr,serviceWorkers:'block'});
  const page=await context.newPage();activePage=page;page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/SCRIPT ERROR|Parse Error|Failed to load script|Aborted\(/.test(m.text()))errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/__review_blank__`);
  await page.evaluate(()=>{localStorage.setItem('starfall-guild-save-v1','classic-starfall-sentinel');localStorage.setItem('unrelated-sentinel','keep');});
  const pack=before?beforePack:afterPack;
  await page.route('**/play/starfall/index.pck',route=>route.fulfill({path:pack,contentType:'application/octet-stream'}));
  // Match the temporary QA pack size without writing the committed preview or changing its canvas setup.
  await page.route('**/play/starfall/',route=>{
    let html=fs.readFileSync(path.join(root,'play/starfall/index.html'),'utf8');
    html=html.replace(/("index.pck"\s*:\s*)\d+/,(_,prefix)=>prefix+fs.statSync(pack).size);
    if(fixture)html=html.replace('const engine = new Engine(GODOT_CONFIG);',
      'const engine = new Engine(GODOT_CONFIG);'+`engine.preloadFile(new TextEncoder().encode(${JSON.stringify(JSON.stringify(fixture))}), ${JSON.stringify(savePath)});`);
    return route.fulfill({contentType:'text/html',body:html});
  });
  if(instrument)await page.route('**/play/starfall/index.js',route=>{
    const code=fs.readFileSync(path.join(root,'play/starfall/index.js'),'utf8');assert(code.includes('var FS={'));
    return route.fulfill({contentType:'text/javascript',body:code.replace('var FS={','var FS=globalThis.__reviewFS={')});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/play/starfall/`);
  await ready(page);
  const actual=await page.evaluate(()=>({userAgent:navigator.userAgent,touchPoints:navigator.maxTouchPoints,dpr:devicePixelRatio,innerWidth,innerHeight}));
  check(actual.userAgent===profiles[platform].userAgent,platform+' uses the intended host UA');
  check(actual.dpr===dpr,platform+' uses the intended device pixel ratio '+dpr);
  check(actual.innerWidth===size.width&&actual.innerHeight===size.height,platform+' uses the intended CSS viewport');
  if(platform!=='desktop')check(actual.touchPoints>0,platform+' emulates touch input');
  check(errors.length===0,platform+' '+size.width+'x'+size.height+' engine starts without script errors');
  report.sessions.push({platform,size,before,instrument,dpr,...actual});write();
  return {page,context,errors,platform,before,dpr};
}
async function ready(page) {
  await page.waitForFunction(()=>!document.querySelector('#status'),null,{timeout:90000});
  await page.waitForTimeout(1000);
}
async function capture(g,label,{fit=true,goal=false,dialogue=false}={}) {
  const p=g.page, size=p.viewportSize();
  const box=await p.locator('#canvas').boundingBox();
  check(Math.abs(box.x)<1&&Math.abs(box.y)<1&&Math.abs(box.width-size.width)<=1&&Math.abs(box.height-size.height)<=1,label+' canvas covers the CSS viewport within one-pixel engine rounding');
  const backing=await p.locator('#canvas').evaluate(c=>({width:c.width,height:c.height}));
  const data=await p.screenshot({path:path.join(out,'screens',label+'.png'),scale:'css',timeout:20000});
  const im=PNG.sync.read(data), frame=painted(im,box);
  check(im.width===size.width&&im.height===size.height&&frame&&frame.count>size.width*size.height*.05,label+' has a nonblank real rendered screenshot');
  const fractional=g.platform!=='desktop'&&!g.before;
  const rawScale=Math.min(backing.width/384,backing.height/216);
  const pixelScale=fractional?rawScale:Math.max(1,Math.floor(rawScale));
  const sx=pixelScale*box.width/backing.width,sy=pixelScale*box.height/backing.height,scale=Math.min(sx,sy);
  const expected={x:box.x+(box.width-384*sx)/2,y:box.y+(box.height-216*sy)/2,width:384*sx,height:216*sy};
  if(fit) {
    for(const k of ['x','y','width','height'])check(Math.abs(frame[k]-expected[k])<=2,label+' painted '+k+' matches '+(fractional?'fractional aspect fit':'unchanged integer scale'));
    check(Math.abs(frame.width/frame.height-16/9)<.02,label+' preserves 16:9 without stretching');
  }
  const goalPixels=bounds(im,gold,logicalRegion(frame,4,13,374,10));
  const dialog=dialogueBounds(im,frame);
  if(goal)check(goalPixels&&goalPixels.count>18*scale*scale,label+' has visible goal-line glyph pixels inside the view');
  if(dialogue)check(dialog&&dialog.width>225*scale&&dialog.width<244*scale&&dialog.height>12*scale,label+' has a complete dialogue panel inside the view');
  const entry={name:label+'.png',platform:g.platform,before:g.before,dpr:g.dpr,viewport:size,canvas:box,backing,frame,expected,scale,goalPixels,dialogue:dialog,
    textSizeCss:{status:8*scale,goal:7*scale,dialogue:8*scale}};
  report.captures.push(entry);write();return {im,frame,entry};
}
async function pressAt(g,point) {
  const {width,height}=g.page.viewportSize();
  check(point.x>=0&&point.x<width&&point.y>=0&&point.y<height,'input target stays inside '+width+'x'+height);
  if(g.platform==='desktop')await g.page.mouse.click(point.x,point.y);else await g.page.touchscreen.tap(point.x,point.y);
  await g.page.waitForTimeout(250);
}
function uiPoint(c,x,y) {return {x:c.frame.x+x*c.frame.width/384,y:c.frame.y+y*c.frame.height/216};}
async function readSave(page,browser=false) {
  if(!browser)return page.evaluate(p=>{try{return JSON.parse(globalThis.__reviewFS.readFile(p,{encoding:'utf8'}));}catch{return null;}},savePath);
  return page.evaluate(p=>new Promise((resolve,reject)=>{
    const req=indexedDB.open('/userfs');const timer=setTimeout(()=>reject(Error('IndexedDB timeout')),8000);
    req.onerror=()=>{clearTimeout(timer);reject(req.error);};
    req.onsuccess=()=>{const db=req.result;const tx=db.transaction('FILE_DATA','readonly');const file=tx.objectStore('FILE_DATA').get(p);
      file.onsuccess=()=>{clearTimeout(timer);db.close();const bytes=file.result?.contents;resolve(bytes?JSON.parse(new TextDecoder().decode(bytes)):null);};
      file.onerror=()=>{clearTimeout(timer);db.close();reject(file.error);};};
  }),savePath);
}
async function waitSave(g,test,label,browser=false) {
  let last;
  for(let i=0;i<60;i++) {last=await readSave(g.page,browser);if(last&&test(last)) {
    check(true,label);report.saves.push({label,me:last.me,coins:last.coins,day:last.day,day_t:last.day_t,built:last.built,hints:last.hints});write();return last;
  }await g.page.waitForTimeout(250);}
  throw Error(label+': '+JSON.stringify(last));
}
async function fresh(g,tag) {
  let c=await capture(g,tag+'-welcome',{dialogue:true});
  for(let i=0;i<3;i++) {
    // Existing PanelContainer consumes clicks inside its cream panel. Use real touch on
    // the open world below it to advance, preserving the game's current input contract.
    assert(c.entry.dialogue,'Expected opening dialogue '+i);
    await pressAt(g,uiPoint(c,192,214));
    c=await capture(g,tag+'-dialogue-'+(i+1),{dialogue:i<2,goal:i===2});
  }
  await waitSave(g,d=>JSON.stringify(d.me)==='[15,5]'&&d.coins===100&&d.day===1,tag+' touch/click dismisses all opening lines and freshly saves the correct spawn');
  return c;
}
async function toggleGoals(g,tag,c) {
  const region=logicalRegion(c.frame,5,23,374,48),minimum=80*c.entry.scale*c.entry.scale;
  await pressAt(g,uiPoint(c,20,17));
  const shown=await capture(g,tag+'-goals-shown',{goal:true});
  const added=addedTextPixels(c.im,shown.im,region);
  check(added>minimum,tag+' goal-line input renders additional text glyphs ('+added+' changed pixels)');
  await waitSave(g,d=>d.hints.goals===true,tag+' goal-line input persists its acknowledgement');
  await pressAt(g,uiPoint(shown,20,17));
  const hidden=await capture(g,tag+'-goals-hidden',{goal:true});
  const removed=addedTextPixels(hidden.im,shown.im,region);
  check(removed>minimum,tag+' second goal-line input hides the extra text ('+removed+' changed pixels)');
  report.textTransitions.push({tag,added,removed,minimum,region});write();
  return hidden;
}
async function walk(g,tag,target,me) {
  const size=g.page.viewportSize(), scale=g.platform==='desktop'?Math.max(1,Math.floor(Math.min(size.width/384,size.height/216))):Math.min(size.width/384,size.height/216);
  const cx=Math.max(-416+192,Math.min(704-192,me[0]*16+8));
  const cy=Math.max(-16+108,Math.min(288-108,me[1]*16+8));
  // Real OS input is aimed through the expected transform. The saved tile is the independent oracle.
  await g.page.waitForTimeout(350);
  await pressAt(g,{x:(size.width-384*scale)/2+(target[0]*16+8-cx+192)*scale,
    y:(size.height-216*scale)/2+(target[1]*16+8-cy+108)*scale});
  return waitSave(g,d=>JSON.stringify(d.me)===JSON.stringify(target),tag+' world input reaches '+JSON.stringify(target));
}
async function reload(g,tag,test,last) {
  await waitSave(g,d=>test(d)&&d.day_t>=last.day_t,tag+' save reaches IndexedDB',true);
  // Drop only fixture injection; keep the same QA pack and exact-size shell response.
  await g.page.unroute('**/play/starfall/');
  const pack=g.before?beforePack:afterPack;
  await g.page.route('**/play/starfall/',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'play/starfall/index.html'),'utf8').replace(/("index.pck"\s*:\s*)\d+/,(_,prefix)=>prefix+fs.statSync(pack).size)}));
  await g.page.reload();await ready(g.page);
  // The ordinary returning-player greeting is dismissed by real input.
  await g.page.keyboard.press('Enter');
  await waitSave(g,d=>test(d)&&d.day_t>last.day_t+.5,tag+' fixture-free reload writes a new save preserving the town');
  await capture(g,tag+'-reload',{goal:true});
  check(await g.page.evaluate(()=>localStorage.getItem('starfall-guild-save-v1')==='classic-starfall-sentinel'&&localStorage.getItem('unrelated-sentinel')==='keep'),tag+' preserves Classic and unrelated browser storage');
}
async function finish(g,tag) {check(g.errors.length===0,tag+' has no runtime errors');await g.context.close();activePage=null;}
(async()=>{
  for(const [name,file] of Object.entries({before:beforePack,after:afterPack})) {assert(fs.statSync(file).size>1000000,name+' real export missing');report.packs[name]={bytes:fs.statSync(file).size,sha256:hash(file)};}
  const engineBefore={};for(const name of ['index.js','index.wasm','index.html','index.pck'])engineBefore[name]=hash(path.join(root,'play/starfall',name));
  report.previewBytes=engineBefore;write();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  try {
    // Before/after control uses untouched engine JS and the same fresh dialogue, including DPR 3.
    for(const platform of ['android','ios'])for(const dpr of platform==='android'?[1,2.75,3]:[1,3]) {
      const pair=[];
      for(const before of [true,false]) {
        const g=await open(browser,platform,{width:812,height:375},{before,instrument:false,dpr});
        pair.push(await capture(g,platform+'-dpr'+dpr+'-'+(before?'before':'after')+'-landscape',{dialogue:true}));
        if(!before) {await g.page.setViewportSize({width:375,height:812});await g.page.waitForTimeout(750);
          await capture(g,platform+'-dpr'+dpr+'-after-portrait',{dialogue:true});}
        await finish(g,platform+' unaltered engine');
      }
      check(pair[1].frame.width>pair[0].frame.width+20,platform+' DPR '+dpr+' painted landscape world is wider than the integer before witness');
    }
    for(const platform of ['android','ios'])for(const portrait of [{width:375,height:812},{width:393,height:851}]) {
      const dpr=portrait.width===393?3:1;
      const tag=platform+'-'+portrait.width+'x'+portrait.height+'-dpr'+dpr,g=await open(browser,platform,portrait,{dpr});
      const opening=await fresh(g,tag);await toggleGoals(g,tag,opening);
      let saved=await walk(g,tag+'-portrait',[15,7],[15,5]);
      await capture(g,tag+'-portrait-walk',{goal:true});
      const landscape={width:portrait.height,height:portrait.width};
      const resizes=[landscape,{...landscape,height:landscape.height-57},landscape,portrait,
        {...portrait,height:portrait.height-74},portrait,landscape,portrait];
      for(let i=0;i<resizes.length;i++) {
        await g.page.setViewportSize(resizes[i]);await g.page.waitForTimeout(700);
        const label=tag+'-resize-'+i+'-'+resizes[i].width+'x'+resizes[i].height;
        const c=await capture(g,label,{goal:true});
        if(i===0||i===4||i===6) {
          await toggleGoals(g,label,c);
          const target=saved.me[1]===7?[15,5]:[15,7];saved=await walk(g,label,target,saved.me);
        }
      }
      await reload(g,tag,d=>JSON.stringify(d.me)===JSON.stringify(saved.me)&&d.coins===100,saved);
      await finish(g,tag);
    }
    for(const size of [{width:1366,height:768},{width:1920,height:1080},{width:3440,height:1440}]) {
      const tag='desktop-'+size.width+'x'+size.height;
      const before=await open(browser,'desktop',size,{before:true,instrument:false});
      const old=await capture(before,tag+'-before',{dialogue:true});await finish(before,tag+' before');
      const g=await open(browser,'desktop',size);const c=await capture(g,tag+'-after',{dialogue:true});
      check(JSON.stringify([c.frame.x,c.frame.y,c.frame.width,c.frame.height])===JSON.stringify([old.frame.x,old.frame.y,old.frame.width,old.frame.height]),tag+' actual painted bounds are unchanged from before');
      const ready=await fresh(g,tag);await toggleGoals(g,tag,ready);
      let saved=await walk(g,tag,[15,7],[15,5]);
      await g.page.keyboard.down('ArrowRight');await g.page.waitForTimeout(300);await g.page.keyboard.up('ArrowRight');
      saved=await waitSave(g,d=>d.me[0]>15&&d.me[1]===7,tag+' real keyboard still moves the player');
      await reload(g,tag,d=>JSON.stringify(d.me)===JSON.stringify(saved.me)&&d.coins===100,saved);
      await finish(g,tag);
    }
    const legacy=JSON.parse(fs.readFileSync(path.join(out,'legacy.json'),'utf8'));
    check(legacy.coins===321&&legacy.day===7&&JSON.stringify(legacy.me)==='[14,10]','legacy fixture comes from the previous save writer');
    for(const platform of ['android','ios','desktop']) {
      const size=platform==='desktop'?{width:1366,height:768}:{width:375,height:812};
      const tag=platform+'-legacy',g=await open(browser,platform,size,{fixture:legacy});
      await g.page.keyboard.press('Enter');
      const match=d=>d.coins===321&&d.day===7&&d.meals===12&&d.rank===1&&JSON.stringify(d.me)==='[14,10]'&&d.built.west.what==='healer'&&d.heroes.length===3;
      const saved=await waitSave(g,d=>match(d)&&d.day_t>legacy.day_t+.5,tag+' preserves old position, progress and buildings in a new save');
      await capture(g,tag+'-loaded',{goal:true});await reload(g,tag,match,saved);await finish(g,tag);
    }
    for(const [name,digest] of Object.entries(engineBefore))check(hash(path.join(root,'play/starfall',name))===digest,'committed preview '+name+' remains byte-for-byte unchanged');
    report.passed=true;report.finished=new Date().toISOString();write();
    console.log('STARFALL_MOBILE_FIT_PASS',report.checks.length,'checks',report.captures.length,'real screenshots');
  } catch(e) {
    report.errors.push(String(e));report.passed=false;
    if(activePage&&!activePage.isClosed())try{await activePage.screenshot({path:path.join(out,'screens/failure.png'),scale:'css',timeout:15000});}catch{}
    write();throw e;
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{report.errors.push(String(e));report.passed=false;write();console.error(e);server.close();process.exitCode=1;});
