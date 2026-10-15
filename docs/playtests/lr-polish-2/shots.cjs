const {run,open}=require('./lib.cjs');
run(async(b,base)=>{for(const [tag,vp,mob] of [['desktop',{width:1280,height:800},false],['phone',{width:390,height:844},true]]){
 const pg=await open(b,base,vp,mob);const sh=async n=>{await pg.waitForTimeout(150);await pg.screenshot({path:`shots/${tag}-${n}.png`})};
 const ev=f=>pg.evaluate(f);
 const tap=async(expr)=>pg.evaluate(e=>{const q=eval(e);const p=LR.toScreen(q);const cv=document.querySelector('canvas');window.__pid=(window.__pid||50)+1;for(const ty of ['pointerdown','pointerup'])cv.dispatchEvent(new PointerEvent(ty,{clientX:p.x,clientY:p.y,pointerId:window.__pid,bubbles:true,pointerType:'touch',isPrimary:true}))},expr);
 await ev(()=>{LR.setFriend(false);LR.setRoutine(true);LR.newVisit();LR.advance(.5)});
 // sign wiggle (mid-wiggle frame: ranch left alone)
 await ev(()=>{LR.advance(5.2)}); await sh('1-ranch-sign-wiggle');
 // dough dots
 await tap('LR.layout.tsign');await ev(()=>LR.advance(.6));await sh('2-dough-default');
 await tap('LR.layout.dough.dots[0]');await ev(()=>LR.advance(.15));await sh('3-dough-pink-tap');
 await tap('LR.layout.dough.dots[1]');await ev(()=>LR.advance(.5));await sh('4-dough-blue');
 await tap('LR.layout.dough.cutter');await ev(()=>LR.advance(LR.STAMP_SECS*.5+.1));await sh('5-dough-stamp-blue');
 await ev(()=>LR.advance(1.6));await sh('6-dough-cookie-clear');
 await tap('LR.layout.dough.barn');await ev(()=>LR.advance(.3));
 // fox fed
 await ev(()=>{LR.newVisit();LR.advance(.5)});await tap('LR.layout.bowl');await ev(()=>LR.advance(.12));await sh('7-fox-fed-instant');
 await ev(()=>LR.advance(2.5));await sh('8-fox-eating');
 // shed early leave
 await ev(()=>{LR.newVisit();LR.advance(.5)});await tap('LR.layout.sign');await ev(()=>LR.advance(.3));await tap('LR.layout.shed.pots[1]');await tap("LR.partPoint('tail')");await tap("LR.partPoint('body')");await ev(()=>LR.advance(.3));await sh('9-shed-painted');
 await tap('LR.layout.shed.barn');await ev(()=>LR.advance(.3));await sh('10-shed-left-early');
 await ev(()=>LR.advance(3));await sh('11-shed-left-wave');
 // bedtime cue + dusk
 await ev(()=>{LR.newVisit();LR.advance(.5);LR.bedtime();LR.advance(3)});await sh('12-bedtime-cue-big');
 await ev(()=>LR.advance(14));await sh('13-bedtime-cue-still-there-17s');
 await ev(()=>{LR.setRoutine(false);LR.newVisit();LR.advance(.5);LR.bedtime();LR.advance(8)});await sh('14-dusk-8s-halfway');
 console.log(tag,pg.errs);await pg.context().close();}});
