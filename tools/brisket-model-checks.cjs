const assert=require('node:assert/strict'),M=require('../games/briskets-crossing/model.js');
function play(seed=3){const s=M.create(1,seed);M.ready(s);return s;}
function hopUp(s,n=1){const p=M.current(s);for(let i=0;i<n;i++){assert.equal(M.hop(s,0,-1),true);M.advance(s,M.HOP+.01);}return p;}

const a=play();const p=M.current(a);assert.equal(M.hop(a,0,1),false,'cannot hop off the south bank');
hopUp(a);assert.equal(p.y,9);assert.equal(p.score,10);
const off=play();M.current(off).x=.5;assert.equal(M.hop(off,-1,0),false,'cannot hop off the west edge');

const road=play();const rp=M.current(road);rp.y=8;rp.x=4.5;rp.best=8;const lane=rp.lanes.find(l=>l.y===8);lane.items=[{x:3.2,w:1.65}];
assert.equal(M.hitCart(rp),true);M.advance(road,.02);assert.equal(rp.lives,M.LIVES-1);assert.equal(rp.y,M.START.y,'a cart sends Brisket back to the bank');

const water=play();const wp=M.current(water);wp.y=3;wp.x=2.5;wp.best=3;wp.lanes.find(l=>l.y===3).items=[{x:8,w:2}];
M.advance(water,.02);assert.equal(wp.lives,M.LIVES-1,'open water is a fall');

const river=play();const lp=M.current(river);lp.y=2;lp.x=5;lp.best=2;const rlane=lp.lanes.find(l=>l.y===2);rlane.items=[{x:4,w:3}];rlane.dir=1;rlane.speed=1;
const before=lp.x;M.advance(river,.5);assert.equal(lp.lives,M.LIVES);assert.ok(lp.x>before,'a log carries Brisket');

const home=play();const hp=M.current(home);hp.y=1;hp.x=M.HOME_COLS[0]+.5;hp.best=1;hp.lanes.find(l=>l.y===1).items=[{x:hp.x-1,w:3}];
assert.equal(M.hop(home,0,-1),true);M.advance(home,M.HOP+.02);
assert.equal(hp.homes[0].filled,true);assert.ok(hp.score>=100);assert.equal(hp.y,M.START.y,'a delivered lantern sends Brisket back for the next one');

const clear=play();const cp=M.current(clear);cp.homes.forEach(h=>h.filled=true);cp.homes[4].filled=false;cp.y=1;cp.x=cp.homes[4].x;cp.best=1;
const slow=M.plan(1).speed;cp.lanes.find(l=>l.y===1).items=[{x:cp.x-1,w:3}];
M.hop(clear,0,-1);M.advance(clear,M.HOP+.02);assert.ok(cp.clearing>0,'the last lantern clears the crossing');
for(let i=0;i<8;i++)M.advance(clear,.25);assert.equal(cp.round,2);assert.ok(M.plan(2).speed>slow);assert.ok(cp.homes.every(h=>!h.filled));

const dead=play();const dp=M.current(dead);dp.lives=1;dp.y=8;dp.x=4.5;dp.lanes.find(l=>l.y===8).items=[{x:3,w:2}];
M.advance(dead,.05);assert.equal(dead.phase,'over','the last life ends the turn');

const two=M.create(2,9);M.ready(two);M.current(two).lives=1;M.current(two).time=.01;M.advance(two,.2);
assert.equal(two.phase,'ready');assert.equal(two.active,1,'player 2 waits for a turn');

assert.equal(M.scores([{name:'<x>',score:9},{name:'AAA',score:Infinity},{name:'ab1',score:12}]).length,0);
assert.deepEqual(M.record([],'ab',4).map(r=>r.name+r.score),['ABA4']);

const idle=play();let t=0;while(idle.phase==='playing'&&t<200){M.advance(idle,.25);t+=.25;}
assert.equal(idle.phase,'over','standing still runs out the lantern time');

const d1=M.create(1,42),d2=M.create(1,42);M.ready(d1);M.ready(d2);M.advance(d1,3,{dy:-1});M.advance(d2,3,{dy:-1});
assert.equal(JSON.stringify(M.current(d1).lanes),JSON.stringify(M.current(d2).lanes));
assert.equal(M.current(d1).x,M.current(d2).x);
console.log('PASS brisket model');
