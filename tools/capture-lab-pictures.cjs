/* WEB-THUMBS: capture the Lab card pictures (960x540 JPEG) from a real moment of play, each in a fresh browser
   context, so no player's save or setting is read or written. Serve the checkout first, e.g. python3 -m http.server 8766,
   then:  node tools/capture-lab-pictures.cjs   (OUT=folder, default images/lab; ONLY=storm-front,otherworld to limit;
   ARCADE_TEST_ORIGIN, default http://localhost:8766). Look at every picture before committing it: a moment of play,
   not a title box, a welcome note or a lost life. Keymaster and Little Ranch were captured separately. */
const {chromium}=require('playwright'),path=require('path'),browserPath=require('./find-browser.cjs');
const OUT=process.env.OUT||path.join(__dirname,'..','images','lab'), ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
const ORIGIN=process.env.ARCADE_TEST_ORIGIN||'http://localhost:8766';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function press(p,loc,ms=160){const b=await loc.boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await wait(ms);await p.mouse.up();}
async function hold(p,key,ms){await p.keyboard.down(key);await wait(ms);await p.keyboard.up(key);}
const plays={
 'storm-front':async p=>{await p.getByRole('button',{name:'One player'}).click();await wait(600);
   for(let i=0;i<10;i++){await hold(p,i%4<2?'ArrowLeft':'ArrowRight',260);await p.keyboard.press('Space');}await wait(250);},
 'lighthouse-watch':async p=>{await p.getByRole('button',{name:'One player'}).click();await wait(600);
   for(let i=0;i<10;i++){await hold(p,['ArrowLeft','ArrowUp','ArrowRight','ArrowUp'][i%4],240);await p.keyboard.press('Space');}await wait(250);},
 'briskets-crossing':async p=>{await p.getByRole('button',{name:'One player'}).click();await wait(600);
   await p.locator('button:visible',{hasText:'Lead Brisket out'}).first().click();await wait(500);
   const up=p.locator('button:visible',{hasText:'▲'}).first();const hops=+(process.env.HOPS||3);for(let i=0;i<hops;i++){await press(p,up);await wait(220);}},
 'ember-bricks':async p=>{await p.getByRole('button',{name:'One player'}).click();await wait(600);
   const send=p.locator('button:visible',{hasText:'Send the coal'}).first();await send.click();await wait(700);
   await press(p,p.locator('button:visible',{hasText:/^Send$/}).last());await wait(+(process.env.FLY||700));},
 'diamond-manager':async p=>{await p.getByRole('button',{name:"Let's play ball"}).click();await wait(400);
   await p.getByRole('button',{name:/Play ball/}).click();await wait(2600);},
 'otherworld':async p=>{await p.getByRole('button',{name:'Choose a world'}).click();await wait(500);
   await p.locator('.card').first().click();await wait(500);
   for(let i=0;i<4;i++){const c=p.locator('.card:visible');if(await c.count())await c.first().click();await wait(400);}
   const nm=p.getByRole('button',{name:'Ren'});if(await nm.count())await nm.click();await wait(200);
   const born=p.getByRole('button',{name:/Be born/});if(await born.count())await born.click();await wait(700);
   // Read on until the story asks for a choice (the dialogue shows choice buttons), at most 25 lines.
   for(let i=0;i<25;i++){if(await p.locator('.dlg-choices button:visible').count())break;await p.keyboard.press('Enter');await wait(350);}
   await wait(500);},
};
(async()=>{
 const b=await chromium.launch({executablePath:browserPath()});
 for(const [g,play] of Object.entries(plays)){
  if(ONLY.length&&!ONLY.includes(g))continue;
  const c=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:0.75});const p=await c.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(ORIGIN+'/games/'+g+'/');await wait(900);
  try{await play(p);}catch(e){errs.push('script: '+e.message.split('\n')[0]);}
  await p.screenshot({path:path.join(OUT,g+'.jpg'),type:'jpeg',quality:82});
  const visible=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.textContent.trim().slice(0,20)).slice(0,10));
  console.log(g.padEnd(18),errs.length?'ERR '+errs.join(' | '):'ok',JSON.stringify(visible));
  await c.close();
 }
 await b.close();
})();
