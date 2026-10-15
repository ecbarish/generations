'use strict';
// Logic-only reproduction against unmodified source; DOM/canvas/audio are stubs.
// LR-POLISH (2026-10): waits lengthened (420->520, 60/70->130 s) because the bedtime cues now wait 18 s and the dusk fade takes 16 s.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../../..'), file=path.join(root,'games/little-ranch/game.js');
const current=fs.readFileSync(file,'utf8');
const baseline=execFileSync('git',['show','c0d55bc85312c4061aa08278a261cdafae514f1e:games/little-ranch/game.js'],{cwd:root,encoding:'utf8'});
function boot(source,width=375,height=812,friend=false){
 const els={},noop=()=>{},handlers={},store={'little-ranch-settings-v1':'{"sound":false}','unrelated-save':'keep'};
 const cx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(t,k)=>t[k]||noop,set:(t,k,v)=>(t[k]=v,true)});
 const el=id=>els[id]||(els[id]={hidden:id==='grown',width:0,height:0,style:{},classList:{add:noop,toggle:noop},addEventListener:(n,f)=>(handlers[id]??={})[n]=f,setAttribute:noop,setPointerCapture:noop,getContext:()=>cx,getBoundingClientRect:()=>({width,height,left:0,top:0})});
 const c={document:{getElementById:el},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},matchMedia:()=>({matches:false}),innerWidth:width,innerHeight:height,location:{search:''},performance:{now:()=>c.LR?.state.t*1000||0},requestAnimationFrame:noop,addEventListener:noop,setTimeout:noop,clearTimeout:noop,Math,console}; c.window=c;
 vm.runInNewContext(source,c,{filename:file});const lr=c.LR;lr.setFriend(friend);lr.newVisit();let pid=0;
 const ev=(type,p)=>handlers.ranch[type]({type,pointerId:pid,clientX:p.x,clientY:p.y,preventDefault:noop});
 const tap=q=>{const p=lr.toScreen(q);pid++;ev('pointerdown',p);ev('pointerup',p)};
 const snapshot=()=>({seconds:+lr.state.t.toFixed(2),mode:lr.state.mode,place:lr.state.place,acts:lr.state.acts,dusk:+lr.state.dusk.toFixed(2),babyAct:lr.state.baby.act,routine:lr.state.routine&&lr.state.routine.step});
 return{lr,tap,snapshot,store,ev};
}

const report={baseline:'c0d55bc85312c4061aa08278a261cdafae514f1e',scope:'Deterministic logic only. DOM, canvas and audio are stubbed; this is not browser/phone/toddler acceptance.',checks:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});assert(pass,name+': '+JSON.stringify(detail));}
const rooms={shed:'sign',wagon:'wsign',kitchen:'ksign',door:'dsign',dough:'tsign'};
for(const source of [baseline,current])for(const friend of [false,true])for(const [room,sign] of Object.entries(rooms)){
 const g=boot(source,375,812,friend);g.tap(g.lr.layout[sign]);g.lr.advance(520);
 check((source===baseline?'Baseline reproduces ':'Repair clears ')+room+' timeout, friend='+friend,
 source===baseline?g.lr.state.place===room&&g.lr.state.mode==='play':g.lr.state.place==='ranch'&&g.lr.state.mode==='sleep'&&g.lr.state.acts===0,g.snapshot());
}
for(const [width,height] of [[320,568],[375,812],[667,375],[1024,768],[1366,768],[3440,1440]])for(const [room,sign] of Object.entries(rooms)){
 const g=boot(current,width,height);g.lr.advance(355);g.tap(g.lr.layout[sign]);g.lr.advance(12);
 check(width+'x'+height+' late-entry '+room,g.lr.state.mode==='dusk'&&g.lr.state.place==='ranch'&&g.lr.state.acts===0,g.snapshot());
 g.lr.advance(130);check(width+'x'+height+' asleep '+room,g.lr.state.mode==='sleep',g.snapshot());
}
for(const action of ['feed','peek','bath'])for(const [room,sign] of Object.entries(rooms)){
 const g=boot(current);g.lr.advance(359);g.lr.act[action]();g.tap(g.lr.layout[sign]);g.lr.advance(8);
 check('Frozen '+action+' in '+room,g.lr.state.mode==='dusk'&&g.lr.state.place==='ranch'&&!g.lr.state.baby.then&&!g.lr.state.sponge.auto&&!g.lr.state.sponge.drag,g.snapshot());
 g.lr.advance(130);check('Frozen '+action+' still ends in sleep in '+room,g.lr.state.mode==='sleep',g.snapshot());
}
for(const [room,sign] of Object.entries(rooms)){
 const g=boot(current);g.lr.advance(359);g.tap(g.lr.layout[sign]);
 if(room==='shed'){for(const part of g.lr.PARTS)g.tap(g.lr.partPoint(part));}
 if(room==='door'){for(const k of g.lr.GADGETS)g.tap(g.lr.layout.door.g[k]);}
 if(room==='dough'){g.lr.state.dough.stamps=2;g.tap(g.lr.layout.dough.cutter);}
 if(room==='kitchen'){g.lr.state.kitchen.berries=2;g.tap(g.lr.layout.kitchen.foods[0]);}
 if(room==='wagon'){g.lr.state.wagon.phase='end';g.lr.state.wagon.endAt=g.lr.state.t;}
 g.lr.advance(130);check('Natural completion counts once near expiry: '+room,g.lr.state.mode==='sleep'&&g.lr.state.acts===1,g.snapshot());
}
const gate=boot(current);gate.lr.advance(359.8);gate.tap(gate.lr.layout.wsign);gate.lr.state.wagon.phase='gate';gate.tap(gate.lr.layout.wagon.cars[0]);gate.lr.advance(.5);check('Wagon gate opening gets its short grace',gate.lr.state.place==='wagon'&&gate.lr.state.mode==='play',gate.snapshot());gate.lr.advance(8);check('Wagon ride still ends by the grace deadline',gate.lr.state.place==='ranch'&&gate.lr.state.mode==='dusk',gate.snapshot());
const flowers=boot(current);for(let i=0;i<100&&flowers.lr.state.mode==='play';i++){flowers.tap(flowers.lr.layout.flowers[0]);flowers.lr.advance(1);}
check('Repeated flowers cannot defer bedtime forever',flowers.lr.state.mode==='dusk'&&flowers.lr.state.t<100,flowers.snapshot());
const drag=boot(current);drag.lr.advance(359);drag.tap(drag.lr.layout.tsign);const p=drag.lr.toScreen(drag.lr.layout.dough.lump);drag.ev('pointerdown',p);drag.lr.advance(10);drag.ev('pointermove',p);drag.ev('pointerup',p);drag.ev('pointercancel',p);
check('Held dough gesture and late release are cleared',drag.lr.state.mode==='dusk'&&!drag.lr.state.down&&!drag.lr.state.dough,drag.snapshot());
drag.lr.advance(130);check('Gesture handoff still sleeps',drag.lr.state.mode==='sleep',drag.snapshot());
const settingsBefore=JSON.stringify(drag.store);drag.lr.newVisit();check('New visit clears pending bedtime',drag.lr.state.bedtimeAt===null&&drag.lr.state.mode==='play',drag.snapshot());check('Stored sound choice and unrelated save untouched',JSON.stringify(drag.store)===settingsBefore,drag.store);
console.log(JSON.stringify(report,null,2));console.log('PASS: '+report.checks.length+' logic-only LRL-1 checks.');
