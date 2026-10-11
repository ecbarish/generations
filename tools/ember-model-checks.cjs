const assert=require('node:assert/strict'),M=require('../games/ember-bricks/model.js');
function play(seed=3){const s=M.create(1,seed);M.ready(s);return s;}
function put(p,x,y,vx,vy){p.stuck=false;p.ball.x=x;p.ball.y=y;p.ball.vx=vx;p.ball.vy=vy;}

const held=M.create(1,1);
assert.equal(M.serve(held),false,'the coal stays on the peel until the firing starts');
const move=play();const mp=M.current(move),x0=mp.peel;
M.advance(move,.2,{dx:1});
assert.ok(mp.peel>x0+40,'the peel moves while the coal is waiting');
assert.equal(mp.ball.x,mp.peel,'a waiting coal stays on the peel');
assert.equal(mp.stuck,true);
mp.peel=M.PEEL_W/2;M.advance(move,.2,{dx:-1});assert.equal(mp.peel,M.PEEL_W/2,'the peel stops at the wall');

const served=play();assert.equal(M.serve(served),true);assert.equal(M.current(served).stuck,false);assert.ok(M.current(served).ball.vy<0,'a serve sends the coal up');

const wall=play();const wp=M.current(wall);put(wp,M.COAL_R+1,400,-200,-20);M.advance(wall,.05);assert.ok(wp.ball.vx>0,'the left wall sends the coal back');
const sky=play();const sp=M.current(sky);put(sp,200,M.COAL_R+1,30,-220);M.advance(sky,.05);assert.ok(sp.ball.vy>0,'the kiln roof sends the coal back');

const brick=play();const bp=M.current(brick);const one=bp.bricks.find(b=>b.c===0&&b.r===5);assert.equal(one.hp,1);
const rect=M.brickRect(0,5);put(bp,rect.x+rect.w/2,rect.y+rect.h+M.COAL_R+8,0,-420);const sc=bp.score;M.advance(brick,.08);
assert.ok(!bp.bricks.includes(one),'a clay brick goes out in one hit');assert.ok(bp.score>sc);

const hearth=play();const hp=M.current(hearth);const dark=hp.bricks.find(b=>b.c===4&&b.r===2);assert.equal(dark.max,2);
hp.bricks=[dark];
const hr=M.brickRect(4,2);put(hp,hr.x+hr.w/2,hr.y+hr.h+M.COAL_R+8,0,-420);M.advance(hearth,.08);
assert.equal(dark.hp,1,'a hearth brick cracks before it lights');assert.ok(hp.ball.vy>0);
M.advance(hearth,.05);assert.equal(dark.hp,1,'the coal does not chip the same brick twice on the way out');
put(hp,hr.x+hr.w/2,hr.y+hr.h+M.COAL_R+8,0,-420);M.advance(hearth,.08);assert.ok(!hp.bricks.includes(dark));

const peel=play();const pp=M.current(peel);pp.peel=320;put(pp,330,M.PEEL_Y-M.COAL_R-2,10,260);M.advance(peel,.05);assert.ok(pp.ball.vy<0,'the peel sends the coal back up');assert.equal(pp.lives,M.LIVES);

const miss=play();const ip=M.current(miss);ip.peel=80;put(ip,500,620,0,400);M.advance(miss,.2);
assert.equal(ip.lives,M.LIVES-1,'a fallen coal costs a life');assert.equal(ip.stuck,true,'the next coal waits on the peel');

const dead=play();const dp=M.current(dead);dp.lives=1;dp.peel=80;put(dp,500,620,0,400);M.advance(dead,.2);
assert.equal(dead.phase,'over','the last life ends the turn');

const clear=play();const cp=M.current(clear);cp.lives=2;cp.bricks=[cp.bricks.find(b=>b.c===0&&b.r===5)];
const cr=M.brickRect(0,5);put(cp,cr.x+cr.w/2,cr.y+cr.h+10,0,-420);const before=cp.score;M.advance(clear,.08);
assert.ok(cp.clearing>0,'the last brick clears the kiln');assert.ok(cp.score>=before+200);
for(let i=0;i<8;i++)M.advance(clear,.25);assert.equal(cp.round,2);assert.ok(M.plan(2).speed>M.plan(1).speed);assert.equal(cp.lives,2,'the first clear does not return a life');
cp.bricks=[cp.bricks.find(b=>b.c===1&&b.r===5)];const cr2=M.brickRect(1,5);put(cp,cr2.x+cr2.w/2,cr2.y+cr2.h+10,0,-480);M.advance(clear,.08);
for(let i=0;i<8;i++)M.advance(clear,.25);assert.equal(cp.round,3);assert.equal(cp.lives,3,'every second clear returns a life, up to three');

const two=M.create(2,9);M.ready(two);const tp=M.current(two);tp.lives=1;tp.peel=80;put(tp,500,620,0,400);M.advance(two,.2);
assert.equal(two.phase,'ready');assert.equal(two.active,1,'player 2 waits for a turn');

assert.equal(M.scores([{name:'<x>',score:9},{name:'AAA',score:Infinity},{name:'ab1',score:12}]).length,0);
assert.deepEqual(M.record([],'ab',4).map(r=>r.name+r.score),['ABA4']);

function run(seed){const s=M.create(1,seed);M.ready(s);M.advance(s,.3,{dx:1,launch:true});M.advance(s,1.2,{dx:-1});const p=M.current(s);return JSON.stringify([p.ball,p.score,p.bricks.length,p.peel]);}
assert.equal(run(4),run(4));assert.notEqual(run(4),run(5));
assert.equal(M.layout().length,M.COLS*M.ROWS);
console.log('PASS ember model');
