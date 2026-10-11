/* Runs in the existing isolated scenario iframe, with saves restored by run.html. */
async function checkRealmPhone(frame) {
 const w=frame.contentWindow,d=w.document,checks=[];
 const check=(ok,label)=>{if(!ok)throw Error('RB1.4: '+label);checks.push('RB1.4: '+label);};
 const details=frame.closest('details');details.open=true;
 frame.style.cssText='position:fixed;left:-10000px;top:0;border:0;max-width:none';
 w.eval("clearRealmRoad();clearTownService();closeRealmNotebook(false);const phoneHero=newHero('Phonecheck','concord','human','hunter');phoneHero.lvl=60;phoneHero.onboarding={arrival:true,hints:{}};phoneHero.mode='focus';S.chars=[phoneHero];S.cur=phoneHero.id;boot();closeModal();updateWorld();");
 const settle=()=>new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve))));
 const rect=selector=>d.querySelector(selector).getBoundingClientRect();
 for(const [width,height,text]of [[320,568,1],[375,812,1],[390,844,1],[390,844,1.5],[667,375,1],[1366,768,1],[1920,1080,1],[3440,1440,1]]){
  d.documentElement.style.setProperty("--arc-text",text);
  frame.style.width=width+'px';frame.style.height=height+'px';await settle();
  const label=width+'×'+height+' text '+text;
  check(d.documentElement.scrollWidth<=w.innerWidth,label+' keeps page within viewport');
  check(rect('#fieldDock').bottom<=height+1,label+' dock stays on screen');
  const bar=rect('.abar');check(bar.left>=0&&bar.right<=width+1,label+' action bar fits horizontally');
  check(bar.bottom<=rect('.xp').top+1,label+' action bar clears XP and dock');
  for(const ability of d.querySelectorAll('#slots .ab')){
   const name=ability.querySelector('.ic'),r=name.getBoundingClientRect(),b=ability.getBoundingClientRect();
   check(parseFloat(w.getComputedStyle(name).fontSize)>=14,label+' readable name: '+name.textContent);
   const range=d.createRange();range.selectNodeContents(name);
   check([...range.getClientRects()].every(line=>line.left>=b.left+1&&line.right<=b.right-1&&line.top>=b.top+1&&line.bottom<=b.bottom-1),label+' full name fits: '+name.textContent);
   check(b.left>=bar.left&&b.right<=bar.right,label+' ability stays inside bar: '+name.textContent);
  }
  if(width<=700){
   check([...d.querySelectorAll('#slots button')].every(el=>el.getBoundingClientRect().width>=44&&el.getBoundingClientRect().height>=44),label+' abilities have 44px tap targets');
   check([...d.querySelectorAll('#fieldDock button')].filter(el=>!el.hidden).every(el=>el.getBoundingClientRect().height>=44),label+' dock has 44px tap targets');
   d.querySelector('#fieldOptions').open=true;await settle();const options=rect('.field-options-list');
   check(options.left>=0&&options.right<=width+1&&options.bottom<=height+1,label+' Options stays inside screen');d.querySelector('#fieldOptions').open=false;
   w.eval('questOffer(QUESTS.thornvale[0].id);SCN.skip();');await settle();const dialogue=rect('.scene .dlg');
   check(dialogue.top>=0&&dialogue.bottom<=bar.top+1,label+' conversation fits above abilities');
   w.eval('clearTownService();RTALK=null;SCN.el.hidden=true;');
  }
  d.querySelector('[data-field-book="bags"]').click();await settle();
  check(!d.querySelector('.menu').hidden,label+' tap opens Satchel');
  const book=rect('.menu');check(book.left>=0&&book.right<=width+1&&book.top>=0&&book.bottom<=height+1,label+' notebook fits screen');
  d.querySelector('#fieldPutAway').click();check(d.querySelector('.menu').hidden,label+' tap puts notebook away');
 }
 frame.removeAttribute('style');details.open=false;return checks;
}
