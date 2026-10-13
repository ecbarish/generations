/* RB1.12a: isolated by tests/run.html, including existing v1/v2 save forms. */
async function checkRealmParallelQuests(frame){
 const w=frame.contentWindow,d=w.document,checks=[];
 const check=(ok,label)=>{if(!ok)throw Error('RB1.12a: '+label);checks.push('RB1.12a: '+label);};
 const run=code=>w.eval(code),json=code=>JSON.parse(run('JSON.stringify('+code+')'));
 run("clearTownService();clearArrival();RTALK=null;SCN.el.hidden=true;closeModal();const parallelHero=newHero('Three Roads','concord','human','hunter');parallelHero.onboarding={arrival:true,hints:{}};S=emptyS();S.chars=[parallelHero];S.cur=parallelHero.id;boot();C.phase='intown';townEnter();");
 check(run("['t1','t2','t3'].every(id=>qState(ALLQ[id])==='avail')"),'three existing requests available at level one');
 run('H().lvl=10;');
 check(run("qState(ALLQ.t7)==='locked'&&qState(ALLQ.t8)==='locked'"),'later story and elite prerequisites remain locked at eligible level');
 run("H().quests.done.t3=true;H().quests.done.t1=true;");
 check(run("qState(ALLQ.t7)==='avail'&&qState(ALLQ.t8)==='avail'"),'later requests unlock only after their existing prerequisite');
 run('H().lvl=1;H().quests.done={};');
 run("accept('t1');accept('t2');accept('t3');accept('t2');");
 check(run("H().quests.active.join(',')==='t1,t2,t3'"),'three accepted requests; repeated acceptance adds no duplicate');
 const reward=json('H().quests.rewards');
 run("H().lvl=3;accept('t4');");check(run('H().quests.active.length===3&&!H().quests.active.includes("t4")'),'fourth request refused without replacing existing work');
 run("H().quests.prog.t1=3;H().quests.prog.t2=2;H().quests.prog.t3=4;save();S=migrate(JSON.parse(localStorage.getItem(KEY)));boot();");
 check(run("H().quests.active.join(',')==='t1,t2,t3'&&H().quests.prog.t1===3&&H().quests.prog.t2===2&&H().quests.prog.t3===4"),'three objectives and progress survive save/load');
 check(JSON.stringify(json('H().quests.rewards'))===JSON.stringify(reward),'saved reward identities survive reload');
 // Following changes the existing queue only, never the current encounter or progress.
 run("C.phase='fight';C.mob={id:'wolf',hp:17};H().grind='boar';followThornvaleQuest('t2');");
 check(run("targetMob().id==='digger'&&H().grind===null&&C.mob.id==='wolf'&&C.mob.hp===17"),'follow switches the next target without replacing a current fight');
 check(run("H().quests.prog.t1===3&&H().quests.prog.t3===4"),'following preserves every objective');
 run("C.mob=null;H().quests.prog.t2=0;H().quests.prog.t3=0;for(let i=0;i<80;i++){C.mob={id:'digger',name:'Digger',kind:'humanoid',lvl:1,xpM:1};onKill();if(H().quests.prog.t2>=8&&H().quests.prog.t3>=10)break;}");
 check(run("H().quests.prog.t2===8&&H().quests.prog.t3===10&&H().quests.prog.t1===3"),'same mine encounters progress both requests, capped independently, leaving wolves unchanged');
 check(run("qState(ALLQ.t2)==='ready'&&qState(ALLQ.t3)==='ready'"),'both mine requests ready before either turn-in');
 run("C.phase='intown';townEnter();const parallelBefore={money:H().money,quests:H().stats.quests};H().bags=Array.from({length:16},(_,i)=>({id:90000+i,name:'Full bag',junk:true,value:1}));turnIn('t2',0,false);");
 check(run("!H().quests.done.t2&&H().quests.active.includes('t2')&&H().money===parallelBefore.money&&H().stats.quests===parallelBefore.quests"),'full inventory preserves ready quest and pays nothing');
 run("H().bags=[];turnIn('t2',0,false);const parallelPaid={money:H().money,quests:H().stats.quests,bags:JSON.stringify(H().bags)};turnIn('t2',0,false);");
 check(run("H().money===parallelPaid.money&&H().stats.quests===parallelPaid.quests&&JSON.stringify(H().bags)===parallelPaid.bags"),'repeated completion cannot pay twice');
 check(run("qState(ALLQ.t3)==='ready'&&H().quests.active.includes('t3')"),'completing candles preserves mine-clearing progress');
 run("turnIn('t3',1,false);");check(run("H().stats.quests===parallelBefore.quests+2&&H().bags.length===2&&H().bags[0].id===H().quests.rewards.t2[0].id&&H().bags[1].id===H().quests.rewards.t3[1].id"),'each mine request pays its own selected reward exactly once');
 run("abandon('t1');accept('t1');");check(run("H().quests.prog.t1===0&&H().quests.done.t2&&H().quests.done.t3"),'abandon and reaccept resets only that request');
 check(JSON.stringify(json('H().quests.rewards.t1'))===JSON.stringify(reward.t1),'abandon does not reroll saved rewards');
 // Old saves have always had an active array, even with only one request.
 run("const legacyQuestHero=newHero('Old Road','concord','human','warrior');legacyQuestHero.onboarding=null;legacyQuestHero.quests={active:['t2'],prog:{t2:5},done:{t1:true},rewards:{t2:H().quests.rewards.t2}};const legacyQuestBefore=JSON.stringify(legacyQuestHero.quests);const legacyQuestAccount={v:1,hero:legacyQuestHero,last:Date.now(),log:['old log']};S=migrate(JSON.parse(JSON.stringify(legacyQuestAccount)));boot();");
 check(run('JSON.stringify(H().quests)===legacyQuestBefore'),'legacy v1 single-active save preserves completed quests, progress and rewards');
 run("accept('t3');save();S=migrate(JSON.parse(localStorage.getItem(KEY)));boot();");check(run("H().quests.prog.t2===5&&H().quests.prog.t3===0&&H().quests.done.t1&&H().quests.active.length===2"),'legacy hero can add overlapping request and reload safely');
 run("const otherQuestHero=newHero('Other Road','wild','grishar','warrior');const otherQuestBefore=JSON.stringify(otherQuestHero);S.chars.push(otherQuestHero);const accountBefore=JSON.stringify(S);S=migrate(JSON.parse(accountBefore));");
 check(run('JSON.stringify(S)===accountBefore'),'v2 multicharacter save migration is unchanged');
 check(run("QUESTS.redsand.some(q=>q.req)&&JSON.stringify(S.chars[1])===otherQuestBefore"),'other faction quests and character are untouched');
 // Real rendered Journal: all three compact objectives, tap-size controls and full-log message.
 run("S.cur=S.chars[0].id;H().quests.done={};H().quests.active=[];H().quests.prog={};H().lvl=3;accept('t1');accept('t2');accept('t3');boot();C.phase='intown';townEnter();openRealmNotebook('quests');");
 const settle=()=>new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));
 frame.closest('details').open=true;frame.style.cssText='position:fixed;left:-10000px;top:0;border:0;max-width:none';
 for(const [width,height] of [[375,812],[667,375],[1366,768],[1920,1080],[3440,1440]]){
  frame.style.width=width+'px';frame.style.height=height+'px';await settle();
  check(d.documentElement.scrollWidth<=width,width+'px Journal stays inside viewport');
  check(d.querySelectorAll('.thornvale-requests [data-act="followquest"]').length===3,width+'px shows all three objective controls');
  check([...d.querySelectorAll('.thornvale-requests .rowl')].every(el=>el.getBoundingClientRect().right<=width+1),width+'px objectives do not overflow');
  check([...d.querySelectorAll('.thornvale-requests button')].every(el=>el.getBoundingClientRect().height>=44),width+'px objective buttons have 44px tap targets');
  check([...d.querySelectorAll('.thornvale-requests .l')].every(el=>el.scrollWidth<=el.clientWidth+1),width+'px objective text wraps without clipping');
  check(d.querySelector('[data-act="accept"][data-arg="t4"]').disabled,width+'px fourth acceptance clearly unavailable');
 }
 d.querySelector('[data-act="followquest"][data-arg="t3"]').click();
 check(run("H().quests.active[0]==='t3'"),'actual Journal button follows selected request');
 run("closeRealmNotebook(false);C.phase='intown';townEnter();abandon('t2');const cancelSnapshot=JSON.stringify(H().quests);talkPlaceQuest(townPeople().find(n=>n.name==='Deputy Rhea'));SCN.skip();");
 const buttons=[...d.querySelectorAll('.dlg-choices button')];buttons[buttons.length-1].click();
 check(run('JSON.stringify(H().quests)===cancelSnapshot'),'Another time leaves quests and rewards untouched');
 run("talkPlaceQuest(townPeople().find(n=>n.name==='Deputy Rhea'));SCN.skip();");
 [...d.querySelectorAll('.dlg-choices button')].find(b=>b.textContent.includes('Candles in the Dark')).click();run('SCN.skip();');
 [...d.querySelectorAll('.dlg-choices button')].find(b=>b.textContent.startsWith('Another time')).click();
 check(run('JSON.stringify(H().quests)===cancelSnapshot'),'cancelling the actual offer leaves the open slot unchanged');
 run("talkPlaceQuest(townPeople().find(n=>n.name==='Deputy Rhea'));SCN.skip();");
 [...d.querySelectorAll('.dlg-choices button')].find(b=>b.textContent.includes('Candles in the Dark')).click();run('SCN.skip();');
 [...d.querySelectorAll('.dlg-choices button')].find(b=>b.textContent.startsWith('I can help')).click();
 check(run("H().quests.active.length===3&&H().quests.active.includes('t2')&&H().quests.prog.t2===0"),'actual giver offer accepts a third request alongside the other two');
 run("clearTownService();RTALK=null;SCN.el.hidden=true;closeRealmNotebook(false);");
 return checks;
}
