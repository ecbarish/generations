/* NM-PHONE: real Chromium viewport evidence, with isolated non-player storage.
   Run: node tools/playtest/night-market-phone.cjs [output-directory] */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(process.argv[2] || 'night-market-phone-review');
fs.mkdirSync(out, {recursive: true});
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const report = {head, mode: 'baseline-diagnosis', checks: [], screens: [], measurements: []};
const check = (name, pass, detail) => {report.checks.push({name, pass: !!pass, detail}); if (!pass) throw Error(name + ': ' + JSON.stringify(detail));};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let name;
  try {name = decodeURIComponent(u.pathname);} catch (_) {res.writeHead(400); return res.end();}
  if (name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  const mime = {'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
  fs.readFile(file, (err, bytes) => {if (err) {res.writeHead(404); return res.end();} res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');res.end(bytes);});
});
(async () => {
  let browser;
  try {
    check('The checkout is the requested PR head', !process.env.REVIEW_HEAD_SHA || process.env.REVIEW_HEAD_SHA === head, head);
    await new Promise((resolve, reject) => {server.once('error', reject);server.listen(0, '127.0.0.1', resolve);});
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({executablePath:process.env.CHROME_PATH});
    for (const [width, height] of [[320,568],[360,640],[390,844],[568,320],[667,375],[844,390],[1280,800]]) {
      const context = await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(origin + '/games/night-market/');
      await page.waitForFunction(() => window.__nightMarket && document.querySelector('[data-act="serve"]'));
      const m = await page.evaluate(() => {
        const rect = s => {const r = document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
        return {home:rect('.home'),title:rect('h1'),stall:rect('.stall'),serve:rect('[data-act="serve"]'),scrollWidth:document.documentElement.scrollWidth,scrollY,viewport:{width:innerWidth,height:innerHeight}};
      });
      report.measurements.push(m);
      const name = 'before-' + width + 'x' + height + '.png';
      await page.screenshot({path:path.join(out,name)}); report.screens.push(name);
      check(width+'x'+height+': the page runs without errors', errors.length===0, errors);
      await context.close();
    }
  } catch (e) {report.error=e.stack;process.exitCode=1;}
  finally {if(browser) await browser.close();server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
