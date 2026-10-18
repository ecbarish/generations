/* T44 browser regressions. Run against an isolated local server with Playwright installed.
   Every page uses a fresh browser context: the player's saves/settings are never read or changed. */
const {chromium}=require('playwright'),fs=require('fs'),os=require('os'),nodePath=require('path'),browserPath=require('./find-browser.cjs');
// Screenshots go to the system temp folder (TEMP on Windows, /tmp elsewhere), or ACCESSIBILITY_SHOTS.
const shots=process.env.ACCESSIBILITY_SHOTS||os.tmpdir();
async function auditText(page) { return page.evaluate(() => {
 const parse=s=>s.match(/[\d.]+/g)?.map(Number), luminance=a=>{const x=a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return x[0]*.2126+x[1]*.7152+x[2]*.0722};
 const failures=[];let checked=0;
 for(const el of document.querySelectorAll('*')){
  if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||el.closest('script,style,canvas,[hidden],[inert],button:disabled,.dlg-reader'))continue;
  const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight||cs.visibility==='hidden')continue;
  let bg=null,complex=false;for(let n=el;n;n=n.parentElement){const st=getComputedStyle(n),color=parse(st.backgroundColor);if(st.backgroundImage!=='none'||Number(st.opacity)<1){complex=true;break;}if(color&&(color[3]??1)===1){bg=color;break;}if(color&&color[3]>0){complex=true;break;}}
  if(complex||!bg)continue;const a=luminance(parse(cs.color)),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);checked++;
  if(ratio<4.5)failures.push(el.tagName+' '+el.textContent.trim().slice(0,40)+': '+ratio);
 }return {checked,failures};
 }); }
const origin=process.env.ARCADE_TEST_ORIGIN||'http://localhost:8766';
let count=0;function check(ok,why){if(!ok)throw Error(why);count++;}
(async()=>{const browser=await chromium.launch({executablePath:browserPath(),headless:true});try{
for(const [width,height]of [[375,812],[1366,768],[1920,1080],[3440,1440]]){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 // Exercise the real shared scene with a deliberately different second decision.
 await p.goto(origin+'/tests/sound.html');await p.addScriptTag({url:origin+'/shared/settings.js'});await p.addScriptTag({url:origin+'/shared/dialogue.js'});await p.addStyleTag({url:origin+'/shared/accessibility.css'});
 await p.evaluate(()=>{document.body.innerHTML='<button id="opener">Talk</button><div id="host"></div>';let state=null;window.result=null;window.testScene=Dialogue.create({host:document.querySelector('#host'),get:()=>state,set:v=>state=v,cast:()=>({name:'Guide',shirt:'#444444'})});document.querySelector('#opener').focus();testScene.play([['guide','Read this whole sentence.']],i=>window.result=i,{choices:['First path','Second path']});});
 await p.waitForSelector('.dlg.asking');check(await p.locator('.dlg-reader').textContent()==='Guide: Read this whole sentence.','full accessible line');check(await p.locator('.dlg-say').getAttribute('aria-hidden')==='true','typewriter not repeated to screen reader');
 await p.locator('.dlg-choices button').nth(1).focus();await p.keyboard.press('Enter');check(await p.evaluate(()=>result===1),'focused second choice chosen, never first');check(await p.evaluate(()=>document.activeElement.id==='opener'),'scene restores opener');
 await p.evaluate(()=>{window.testSettings=Settings.create({mount:'#host'});testSettings.button.focus();testSettings.open();});
 await p.locator('[data-close]').focus();await p.keyboard.press('Tab');check(await p.evaluate(()=>document.activeElement.matches('[data-r="0"][data-o="0"]')),'settings Tab wraps');await p.keyboard.press('Shift+Tab');check(await p.evaluate(()=>document.activeElement.matches('[data-close]')),'settings Shift Tab wraps');await p.keyboard.press('Escape');check(await p.evaluate(()=>document.activeElement===testSettings.button&&!document.querySelector('#host').inert),'settings focus/inert restored');
 for(const path of ['','games/otherworld/','games/diamond-career/','games/realmbound/']){
  await p.evaluate(()=>localStorage.setItem('arcade-settings-v1',JSON.stringify({motion:'auto',text:1})));
  await p.goto(origin+'/'+path);await p.waitForTimeout(200);
  const name=path.split('/')[1]||'launcher';
  check(await p.locator('.arc-set-btn').count()===1,name+' has shared Settings');
  if(name==='realmbound')await p.evaluate(()=>window.eval("const h=newHero('Reader','concord','human','hunter');h.onboarding={arrival:true,hints:{}};h.mode='focus';S.chars=[h];S.cur=h.id;boot();closeModal();C.phase='intown';townEnter();updateWorld();"));
  if(name==='otherworld')await p.evaluate(()=>window.__ow.D.skip());
  const fontSelector=name==='otherworld'?'.choose':name==='diamond-career'?'#panel':name==='realmbound'?'.menu':'.hero-lede';
  const normal=await p.locator(fontSelector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  if(name==='realmbound')await p.locator('#fieldOptions summary').click();
  await p.locator('.arc-set-btn').click();await p.locator('[data-r]').filter({hasText:/^Larger$/}).click();await p.keyboard.press('Escape');
  const larger=await p.locator(fontSelector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));check(larger>normal*1.29,name+' reading font scales');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' no horizontal overflow');
  if(name==='realmbound'){
   await p.locator('#fieldOptions summary').click();
   check(await p.locator('.realm-surroundings').isVisible(),'town named paths visible');await p.locator('.realm-surroundings summary').focus();await p.keyboard.press('Enter');check(await p.locator('.realm-surroundings').getAttribute('open')!==null,'Enter opens surroundings instead of talking');
   await p.evaluate(()=>{document.querySelector('[data-field-book="quests"]').focus()});await p.keyboard.press('Enter');check(await p.locator('.menu').isVisible(),'native Journal Enter');await p.keyboard.press('Escape');
  }
  if(name==='otherworld'){await p.locator('.card').first().focus();await p.keyboard.press('Enter');check((await p.locator('#choose h2').textContent()).includes('choose your gift'),'native gift card Enter');
   await p.evaluate(()=>window.eval("S.life={world:'asterhold',gift:'appraisal',name:'Reader',silver:0,flags:{},at:'arrival'};panel().hidden=true;showStatus();D.play([['archivist','A status window opens.']]);"));
   await p.keyboard.press('Tab');check(await p.evaluate(()=>document.activeElement.matches('#status button')),'status reached while scene is open');
   await p.keyboard.press('Escape');check(await p.locator('#status').isHidden(),'Escape closes status without skipping conversation');
   check(await p.locator('.dlg').isVisible(),'story remains open after closing status');
  }
  // Device motion and shared user override both feed the same preference.
  check(await p.evaluate(()=>Settings.reduced()&&document.documentElement.classList.contains('arc-reduce')),name+' reduced motion on');
  const contrast=await auditText(p);check(contrast.failures.length===0,name+' text contrast: '+contrast.failures.join(';'));check(contrast.checked>0,name+' contrast samples present');
  await p.screenshot({path:nodePath.join(shots,'accessibility-'+name+'-'+width+'.png')});
 }
 await p.evaluate(()=>localStorage.setItem('arcade-settings-v1',JSON.stringify({text:1,motion:'off'})));await p.reload();
 check(await p.evaluate(()=>!Settings.reduced()&&!matchMedia('(prefers-reduced-motion: reduce)').matches),'explicit Full motion overrides device');
 await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>localStorage.setItem('arcade-settings-v1',JSON.stringify({text:1,motion:'on'})));await p.reload();
 check(await p.evaluate(()=>Settings.reduced()&&matchMedia('(prefers-reduced-motion: reduce)').matches),'explicit Reduced motion overrides device');
 check(errors.length===0,'no page errors: '+errors.join(';'));await c.close();console.log(width+': PASS');
}
console.log('PASS — '+count+' accessibility checks.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
