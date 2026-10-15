'use strict';
// SG-TAP source/save checks: node tests/sg-tap.cjs
// Rendered geometry, interactions and screenshots (requires Playwright + Chromium):
//   node tests/sg-tap.cjs --browser --output /tmp/sg-tap-evidence
// CHROME_PATH selects an installed browser. Each run uses disposable contexts/saves.
// --css-file /path/to/baseline.css checks an unchanged stylesheet as a negative control.
// Source assertions are not a substitute for the rendered run or screenshot review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const args = process.argv.slice(2);
let browserMode = false, output = null, cssFile = path.join(ROOT, 'games/starfall-guild/style.css');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--browser') browserMode = true;
  else if (['--output', '--css-file'].includes(args[i]) && args[i + 1]) {
    const flag = args[i++];
    if (flag === '--output') output = path.resolve(args[i]); else cssFile = path.resolve(args[i]);
  } else throw Error('Unknown or incomplete argument: ' + args[i]);
}
if (output && !browserMode) throw Error('--output requires --browser');
const css = fs.readFileSync(cssFile, 'utf8');
let checks = 0;
function check(ok, label) { assert.ok(ok, label); checks++; }
function equal(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
function declarations(selector, expectedRules = 1) {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const found = rules.filter(r => r[1].trim() === selector);
  equal(found.length, expectedRules, 'expected rule count for ' + selector);
  return Object.fromEntries(found[0][2].split(';').filter(v => v.trim()).map(v => {
    const colon = v.indexOf(':'); return [v.slice(0, colon).trim(), v.slice(colon + 1).trim()];
  }));
}
function sourceChecks() {
  for (const selector of ['.home', '.tabs button', '.seg button']) {
    const rule = declarations(selector);
    check(/^\d+(?:\.\d+)?px$/.test(rule['min-height']), selector + ' has a pixel minimum');
    check(parseFloat(rule['min-height']) >= 44, selector + ' is at least 44px tall');
    check(!rule.height && !rule['max-height'], selector + ' may grow with larger text');
  }
  const home = declarations('.home');
  equal(home.display, 'inline-flex', 'Arcade link has a box that accepts min-height');
  equal(home['align-items'], 'center', 'Arcade link text is vertically centered');
  equal(declarations('.tabs')['flex-wrap'], 'wrap', 'tabs can still wrap on narrow screens');
  equal(declarations('.recovery-actions button'), { 'min-height': '44px', flex: '1' }, 'recovery button rule is unchanged');
  const recovery = declarations('.recovery', 3);
  equal(recovery['max-height'], 'calc(100% - 16px)', 'recovery remains contained in the stage');
  equal(recovery.overflow, 'auto', 'recovery keeps its scrolling fallback');
  const html = read('games/starfall-guild/index.html');
  equal((html.match(/role="tab" data-act="tab"/g) || []).length, 6, 'all six real tabs are covered');
  check(/<a class="home" href="\.\.\/\.\.\/index\.html">/.test(html), 'Arcade navigation remains a real link');
  check(/class="recovery" hidden/.test(html), 'recovery starts hidden');
  const ui = read('games/starfall-guild/js/05-ui.js');
  check(/const MODES=\[1,10,'max'\]/.test(ui) && /class="seg" role="group"/.test(ui), 'the three buy amounts use the scoped segment controls');
}
function oldSave() {
  const source = read('tests/starfall-checks.js');
  const start = source.indexOf('const MAIN_SAVE = ');
  const end = source.indexOf('\n};', start);
  assert.ok(start >= 0 && end > start, 'existing unsplit-main save fixture is present');
  return JSON.parse(source.slice(start + 'const MAIN_SAVE = '.length, end + 2));
}
function saveChecks() {
  const stored = new Map();
  const sandbox = vm.createContext({
    Date, Math, JSON, structuredClone,
    Arcade: {validators: {}, fmt:String, fmtI:String, fmtTime:String, save:(k,v)=>stored.set(k, JSON.stringify(v)),
      load:k=>JSON.parse(stored.get(k) || 'null'), report:()=>{},
      encode:v=>Buffer.from(JSON.stringify(v)).toString('base64'),
      decode:v=>JSON.parse(Buffer.from(v,'base64').toString())},
    document:{querySelector:()=>null}
  });
  sandbox.window = sandbox;
  for (const file of ['00-data.js','01-state-save.js']) vm.runInContext(read('games/starfall-guild/js/' + file), sandbox, {filename:file});
  sandbox.fixture = oldSave();
  vm.runInContext('S=merge(structuredClone(fixture));D=derive();save();const encoded=exportSave();importSave(encoded);', sandbox);
  const state = JSON.parse(vm.runInContext('JSON.stringify(load())', sandbox));
  for (const key of ['v','party','biz','fac','crest','staff','stats','region','renown','renownLife','tab','buy']) {
    equal(state[key], sandbox.fixture[key], 'old-save ' + key + ' is retained through load/save/export/import');
  }
  equal([...stored.keys()], ['starfall-guild-save-v1'], 'save key is unchanged');
  check(vm.runInContext('Arcade.validators[KEY](load())', sandbox), 'old save still passes the existing validator');
}
async function renderedChecks() {
  const {chromium} = require('playwright');
  const http = require('node:http'), os = require('node:os');
  output ||= fs.mkdtempSync(path.join(os.tmpdir(), 'sg-tap-evidence-'));
  fs.mkdirSync(output, {recursive:true});
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    let file=path.resolve(ROOT,'.'+decodeURIComponent(pathname));
    if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
    if(pathname.endsWith('/'))file=path.join(file,'index.html');
    if(pathname==='/games/starfall-guild/style.css')file=cssFile;
    fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'localhost',resolve);});
  let browser;
  const hash = file => require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  let checkoutHead = null;
  try { checkoutHead = require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(); } catch {}
  const report={checkoutHead,cssSha256:hash(cssFile),testSha256:hash(__filename),css: path.relative(ROOT,cssFile), viewports:[], fontPolicy:'External requests are blocked; system fallback fonts are tested.', screenshots:[]};
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
    const origin='http://localhost:'+server.address().port;
    for(const [width,height] of [[320,568],[390,844],[844,390],[1280,800],[1920,1080]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'});
      try {
        await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
        await context.addInitScript(()=>{window.setInterval=()=>0;});
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(origin+'/games/starfall-guild/');
        await page.waitForFunction(()=>window.__sg&&document.querySelector('#mode-1'));
        const dimensions=[];
        async function measure(selector,label) {
          const data=await page.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{
            const r=e.getBoundingClientRect();return {text:e.textContent.trim(),height:r.height,width:r.width};
          }));
          check(data.length>0, label+' exists at '+width);
          data.forEach(d=>check(d.height>=43.99,label+' '+d.text+' is at least 44px at '+width));
          dimensions.push({label,controls:data});
        }
        await measure('.home','Arcade');
        await measure('.tabs button','tabs');
        for(const tab of ['party','tavern','town','staff','guild','ledger','party']) {
          const control=page.locator('.tabs button[data-arg="'+tab+'"]');
          await control.tap();
          equal(await page.evaluate(()=>window.__sg.S.tab),tab,'touch selects '+tab+' at '+width);
          equal(await control.getAttribute('aria-selected'),'true','selected state follows '+tab);
          if(tab==='party'||tab==='town') {
            await measure('.seg button',tab+' amounts');
            for(const amount of ['10','max','1']) {
              await page.locator('#mode-'+amount).tap();
              equal(await page.evaluate(()=>window.__sg.S.buy),amount==='max'?'max':Number(amount),'touch selects amount '+amount);
            }
          }
        }
        // Native focused-button activation remains intentional and can be repeated.
        await page.locator('.tabs button[data-arg="town"]').focus();
        await page.keyboard.press('Enter');
        equal(await page.evaluate(()=>window.__sg.S.tab),'town','Enter activates focused tab');
        await page.locator('#mode-10').focus();await page.keyboard.press('Space');await page.keyboard.press('Space');
        equal(await page.evaluate(()=>window.__sg.S.buy),10,'repeated Space preserves chosen amount');
        // Cancelling a press by dragging off a control must not select another tab.
        const party=page.locator('.tabs button[data-arg="party"]');await party.scrollIntoViewIfNeeded();
        const box=await party.boundingBox();
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
        await page.mouse.move(1,1);await page.mouse.up();
        equal(await page.evaluate(()=>window.__sg.S.tab),'town','drag-off cancels tab activation');
        const gold=await page.evaluate(()=>window.__sg.S.gold);
        await page.locator('#mode-max').tap();await page.locator('#mode-1').tap();
        equal(await page.evaluate(()=>window.__sg.S.gold),gold,'amount changes never spend gold');
        // Screenshot a real first-session panel with the taller controls.
        await party.tap();await page.evaluate(()=>scrollTo(0,0));
        const shot=width+'x'+height+'-party.png';
        await page.screenshot({path:path.join(output,shot),fullPage:true});report.screenshots.push(shot);
        await page.evaluate(()=>{S.resting=20;S.floor=3;S.gold=10000;updateUI();});
        await measure('.recovery-actions button','recovery');
        await page.locator('#recovery-train').scrollIntoViewIfNeeded();
        const level=await page.evaluate(()=>S.party[0].lvl);
        await page.locator('#recovery-train').tap();
        equal(await page.evaluate(()=>S.party[0].lvl),level+1,'recovery training still works');
        await page.locator('#recovery-back').tap();
        equal(await page.evaluate(()=>S.floor),2,'recovery safer-floor action works');
        await page.evaluate(()=>{S.resting=20;updateUI();});
        const recoveryShot=width+'x'+height+'-recovery.png';
        await page.locator('.stage').screenshot({path:path.join(output,recoveryShot)});report.screenshots.push(recoveryShot);
        await page.evaluate(()=>{S.resting=0;updateUI();});
        equal(await page.locator('#recovery').isVisible(),false,'recovery hides when rest ends');
        // Text-size settings should expand controls rather than clip them.
        for(const scale of [1.15,1.3]) {
          await page.evaluate(s=>document.documentElement.style.setProperty('--arc-text',s),String(scale));
          await measure('.home','Arcade at text scale '+scale);
          await measure('.tabs button','tabs at text scale '+scale);
          await measure('.seg button','amounts at text scale '+scale);
        }
        // Load the existing old-save fixture through the game's real storage API.
        const fixture=oldSave();fixture.last=Date.now();
        await page.evaluate(o=>importSave(Arcade.encode(o)),fixture);
        await page.reload();
        equal(await page.evaluate(()=>S.party.map(a=>[a.id,a.name,a.lvl])),fixture.party.map(a=>[a.id,a.name,a.lvl]),'old-save party survives browser reload');
        equal(await page.evaluate(()=>S.renownLife),fixture.renownLife,'old-save permanent progress survives reload');
        // Real link navigation is intercepted at the destination only, avoiding the hub's unrelated work.
        await page.route(origin+'/index.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Arcade navigation target</title><p>Arcade</p>'}));
        await page.locator('.home').click();
        equal(page.url(),origin+'/index.html','Arcade link navigates to the original destination');
        await page.goBack();await page.waitForFunction(()=>!!window.__sg);
        equal(await page.evaluate(()=>S.party.map(a=>a.id)),fixture.party.map(a=>a.id),'back navigation preserves the saved party');
        equal(errors,[],'no game page errors at '+width);
        report.viewports.push({width,height,dimensions});
      } finally {await context.close();}
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('Rendered checks and screenshots: '+output);
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
(async()=>{
  sourceChecks();saveChecks();
  console.log('PASS: '+checks+' source/save assertions. Rendered checks '+(browserMode?'follow.':'NOT RUN (use --browser).'));
  if(browserMode){await renderedChecks();console.log('PASS: '+checks+' total assertions including rendered checks.');}
})().catch(e=>{console.error('FAIL: '+e.stack);process.exitCode=1;});
