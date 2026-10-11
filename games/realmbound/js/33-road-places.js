'use strict';
/* T48: optional physical pauses along the existing regional road. Runtime only, never saved. */
let REALM_ROAD=null;
const ROAD_TILES=Object.assign({},TOWN_TILES,{I:{solid:1}});
function makeRealmRoad(){
 const g=Array.from({length:16},(_,y)=>Array.from({length:28},(_,x)=>x===0||y===0||x===27||y===15?'T':','));
 const put=(x,y,ch)=>g[y][x]=ch;
 for(let x=0;x<=11;x++)put(x,12,'.');for(let y=3;y<=12;y++)put(11,y,'.');for(let x=11;x<=27;x++)put(x,3,'.');
 for(let x=8;x<=11;x++)put(x,7,'.');put(8,6,'D');
 for(let y=4;y<=6;y++)for(let x=6;x<=10;x++)if(!(x===8&&y===6))put(x,y,'I');
 for(let x=11;x<=20;x++)put(x,10,'.');put(18,9,'F');put(19,11,'B');put(17,11,'B');put(3,11,'P');
 for(const [x,y]of [[3,3],[4,8],[16,4],[23,8],[24,13],[7,14],[20,6]])put(x,y,'T');
 for(const [x,y]of [[5,10],[13,8],[21,11],[24,5]])put(x,y,'f');
 put(0,12,'G');put(27,3,'G');return {rows:g.map(r=>r.join('')),start:[1,12,'right']};
}
const REALM_ROAD_MAP=makeRealmRoad();
const REALM_ROAD_INN={rows:['##############','#____________#','#___HH_______#','#____________#','#_BB_____BB__#','#____________#','#_____rr_____#','#_____rr_____#','######GG######'],start:[6,7,'up']};
function clearRealmRoad(){if(RTALK&&RTALK.roadScene)clearTownService();REALM_ROAD=null;$('.world').classList.remove('on-road');if(typeof ROAD_SURROUNDINGS!=='undefined')ROAD_SURROUNDINGS.hidden=true;}
function realmRoadActive(){
 if(!REALM_ROAD)return false;
 if(!H()||H()!==REALM_ROAD.hero||S!==REALM_ROAD.account||C!==REALM_ROAD.combat||H().zone!==REALM_ROAD.zone||H().dun||H().mode==='auto'){clearRealmRoad();return false;}
 return true;
}
function realmRoadBusy(){return !!RTALK||!!modalKind||realmNotebookOpen()||!!document.querySelector('.arc-set-bg:not([hidden])');}
function realmRoadPeople(){if(!realmRoadActive())return [];return REALM_ROAD.inside?
 [{id:'keeper',name:'Keeper Merran',at:[6,3],look:{race:'human',cls:'priest',hair:'#97734f'}}]:
 [{id:'courier',name:'Courier Edda',at:[16,10],look:{race:'duskelf',cls:'rogue',hair:'#bbb6b0'}}];}
const REALM_ROAD_WALK=World.walker({map:()=>REALM_ROAD.inside?REALM_ROAD_INN:REALM_ROAD_MAP,tiles:ROAD_TILES,pos:()=>REALM_ROAD.pos,people:realmRoadPeople,busy:realmRoadBusy,speed:()=>4.5,
 on:{person:n=>talkRealmRoad(n),door:()=>{REALM_ROAD.inside=true;REALM_ROAD.rest=false;REALM_ROAD_WALK.place(...REALM_ROAD_INN.start);updateWorld();},exit:(x)=>exitRealmRoad(x),sign:()=>roadChoice('Road Marker','The lamps lead to '+hubName()+'. The Lantern Rest and the travelers\' fire stand beside the road.',['Keep walking'])}});
function startRealmRoad(){
 if(!H()||!C||H().dun||H().mode==='auto'||RTALK||modalKind||realmNotebookOpen()||!['seek','rest','intown'].includes(C.phase)||TOWN.inside)return false;
 REALM_ROAD={hero:H(),account:S,combat:C,zone:H().zone,inside:false,rest:false,pos:{x:1,y:12,dir:'right'},fromTown:C.phase==='intown'};
 REALM_ROAD_WALK.place(...(REALM_ROAD.fromTown?[26,3,'left']:REALM_ROAD_MAP.start));C.lastInput=C.run;$('.world').classList.add('on-road');updateWorld();cv.tabIndex=0;cv.focus({preventScroll:true});return true;
}
function exitRealmRoad(x){
 if(!realmRoadActive()||realmRoadBusy())return false;
 if(REALM_ROAD.inside){REALM_ROAD.inside=false;REALM_ROAD.rest=false;REALM_ROAD_WALK.place(8,7,'down');updateWorld();return true;}
 const fromTown=REALM_ROAD.fromTown;clearRealmRoad();
 if(x===27){if(!fromTown)goTown();else C.phase='intown';}else if(fromTown)leaveTown();
 updateWorld();return true;
}
function returnFromRealmRoad(){if(!realmRoadActive()||realmRoadBusy())return false;const fromTown=REALM_ROAD.fromTown;clearRealmRoad();if(fromTown)C.phase='intown';updateWorld();return true;}
function roadChoice(who,text,choices,done){
 if(!realmRoadActive()||realmRoadBusy())return false;const road=REALM_ROAD,state={cancelled:false};let settled=false;
 SCN.play([[who,text]],choice=>{SCN.el.classList.remove('town-service-dialogue');if(settled||state.cancelled||REALM_ROAD!==road||!realmRoadActive())return;settled=true;if(done)done(choice);if(realmRoadActive()){save();updateWorld();}},{choices});
 RTALK.townService=true;RTALK.roadScene=true;RTALK.serviceState=state;SCN.el.classList.add('town-service-dialogue');C.lastInput=C.run;return true;
}
function talkRealmRoad(n){
 if(n.id==='keeper')return roadChoice(n.name,'Welcome to the Lantern Rest. Leave your pack by the bench and catch your breath. A potion for the road costs two silver.',['Catch my breath','Buy a potion (2s)','Another time'],choice=>{
  if(choice===0){C.phase='rest';REALM_ROAD.rest=true;line('You settle beside the Lantern Rest hearth.','l-sys');}
  if(choice===1){if(H().money<200){toast('You need two silver for a potion.');return;}H().money-=200;bank().potion++;sfx('coin');line('Merran puts a healing potion with your supplies.','l-loot');}
 });
 return roadChoice(n.name,'I carry letters between the settlements. A small fire gives tired feet a place to stop. The road to '+hubName()+' follows the lamps.',['Catch my breath','Keep walking'],choice=>{if(choice===0){C.phase='rest';REALM_ROAD.rest=true;line('You catch your breath beside the travelers\' fire.','l-sys');}});
}
const REALM_ROAD_HD=World.hd({src:16});
function drawRealmRoad(t){
 if(!realmRoadActive())return;const r=REALM_ROAD,p=REALM_ROAD_WALK;
 TOWN.pal=townPal();const z=ZONES[H().zone],night=realmNight(),inside=r.inside;
 const people=realmRoadPeople(),things=people.map(n=>({x:n.at[0],y:n.at[1],draw(c,left,base,s){const q=s/11;drawPerson(left+s*.14,base-13*q,q,{...n.look,dir:n.dir||'down'},reduce?0:t,c);}}));
 things.push({x:p.fx,y:p.fy,draw(c,left,base,s){const q=s/11;drawHero(left+s*.14,base-13*q,q,reduce?0:t,c,{dir:r.pos.dir,moving:!p.arrived()});}});
 const stand=(c,ch,left,base,s,tt,x,y,pass)=>{
  if(ch==='I'||ch==='D'){const u=s/8,depth=6-y;c.fillStyle='#c9b596';c.fillRect(left,base-8*u,s,8*u);c.fillStyle='#673b31';c.fillRect(left,base-(11+depth*2)*u,s,(3+depth*2)*u);c.fillStyle='#ad7354';c.fillRect(left,base-(11+depth*2)*u,s,u);if(y===6){c.fillStyle=ch==='D'?'#543321':'#edc675';c.fillRect(left+2*u,base-6*u,4*u,5*u);if(ch==='D')label(c,'Lantern Rest',left+s/2,base-13*u,s);}return;}
  if(ch==='#'){if(x===0||x===REALM_ROAD_INN.rows[0].length-1){drawRoomSideWall(c,x,y,{rows:REALM_ROAD_INN.rows,pos:{x:p.fx,y:p.fy},horizon:.2});return;}c.fillStyle='#493426';c.fillRect(left,base-s*1.4,s,s*1.4);return;}
  townStand(c,ch,left,base,s,tt,x,y,pass,inside?REALM_ROAD_INN.rows:REALM_ROAD_MAP.rows);
 };
 const view={rows:inside?REALM_ROAD_INN.rows:REALM_ROAD_MAP.rows,px:p.fx,py:p.fy,flat:townFlat,stand,things,under:inside?'_':',',stands:{T:1,I:1,F:1,B:1,P:1,H:1,'#':1,D:1},noShadow:{I:1,'#':1,H:1},sky:inside?['#241a16','#483123']:z.sky,hill:inside?'#35271d':z.hill,edgeFill:inside?'#211710':TOWN.pal.treeDk,haze:inside?'#4e3524':z.sky[1],zoom:inside?REALM_ROOM_ZOOM:4.4,dof:false,lamps:inside?[{x:5,y:2.9,h:.55,reach:5}]:[{x:8.5,y:6.8,h:.8,reach:4},{x:18.5,y:9.8,h:.4,reach:6.5}],lt:REALM_WALK_LIGHT,sun:inside?Object.assign(LT.time(.75),{elev:0}):realmSun()};
 r.cam=REALM_ROAD_HD.draw(cx,PW,PH,reduce?0:t,view);
 const lights=[];for(const [x,y,h]of inside?[[5,2.9,.55],[6.5,3.8,.4]]:[[8.5,6.8,.4],[18.5,9.8,.4],[27.5,3.8,.4]]){const q=r.cam.fwd(x,y);if(q)lights.push({x:q[0],y:q[1]-q[2]*h,r:q[2]*2.7,col:'#ffc878'});}
 LT.fog(cx,PW,PH,reduce?0:t,{ground:PH,top:PH*.3,density:inside?.12:.18,col:inside?'#b38551':(ZONE_LIGHT[H().zone]?.col||'#d0d6d1'),lights});
 AMB.lights(cx,PW,PH,reduce?0:t,{dark:inside?.65:night,max:.45,tint:inside?'#21130d':'#101b2a',lights});
}
const ROAD_SURROUNDINGS=document.createElement('details');ROAD_SURROUNDINGS.className='road-surroundings';ROAD_SURROUNDINGS.hidden=true;ROAD_SURROUNDINGS.innerHTML='<summary>Look along the road</summary><div></div>';$('.world').append(ROAD_SURROUNDINGS);
function realmRoadDestinations(){return REALM_ROAD.inside?[{name:'Keeper Merran',at:[6,3]},{name:'The road',at:[6,8]}]:[{name:'The Lantern Rest',at:[8,6]},{name:'Courier Edda at the camp',at:[16,10]},{name:hubName(),at:[27,3]},{name:'The field',at:[0,12]},{name:'The road marker',at:[3,11]}];}
function renderRealmRoad(){
 const active=realmRoadActive();$('.world').classList.toggle('on-road',active);$('#walkRoad').hidden=active;$('#leaveRoad').hidden=!active;ROAD_SURROUNDINGS.hidden=!active||realmRoadBusy();
 if(!active)return;$('#leaveRoad').textContent=REALM_ROAD.fromTown?'Back to town':'Back to the field';$('#zoneName').textContent=REALM_ROAD.inside?'The Lantern Rest':'The road to '+hubName();$('#zoneSub').textContent=ZONES[H().zone].name;$('#status').textContent=RTALK?'':REALM_ROAD.rest?'Catching your breath at the usual pace.':REALM_ROAD.inside?'Walk to Merran to talk · Door: back to the road':'Arrows / WASD or tap to walk · Enter to talk · Lamps: town';
 const ds=realmRoadDestinations(),key=ds.map(d=>d.name).join('|');if(ROAD_SURROUNDINGS.dataset.key===key)return;ROAD_SURROUNDINGS.dataset.key=key;ROAD_SURROUNDINGS.querySelector('div').innerHTML=ds.map((d,i)=>'<button type="button" data-road-destination="'+i+'">Walk to '+placeText(d.name)+'</button>').join('');
}
(() => {
 const b=document.createElement('button');b.id='walkRoad';b.className='btn sm alt';b.textContent='Walk the road';b.onclick=()=>{if(!startRealmRoad())toast('Choose Focus and finish your fight or travel first. Step outside before taking the road.');};$('#fieldDock').append(b);
 const back=document.createElement('button');back.id='leaveRoad';back.className='btn sm alt';back.hidden=true;back.textContent='Put the walk aside';back.onclick=returnFromRealmRoad;$('#fieldDock').append(back);
 const originalStep=step;step=function(dt){if(realmRoadActive()){if(!realmRoadBusy()){REALM_ROAD_WALK.tick(Math.min(.1,dt));if(!realmRoadActive())return;}if(!realmRoadBusy()&&REALM_ROAD.rest&&C.phase==='rest'){originalStep(dt);if(C.phase!=='rest')REALM_ROAD.rest=false;}return;}originalStep(dt);};
 const originalUI=updateWorld;updateWorld=function(){originalUI();renderRealmRoad();};
 ROAD_SURROUNDINGS.addEventListener('click',e=>{const b=e.target.closest('[data-road-destination]');if(!b||!realmRoadActive()||realmRoadBusy())return;const d=realmRoadDestinations()[Number(b.dataset.roadDestination)];if(d){REALM_ROAD_WALK.held=[];REALM_ROAD_WALK.walkTo(...d.at);ROAD_SURROUNDINGS.open=false;}});
 document.addEventListener('keydown',e=>{if(!realmRoadActive()||realmRoadBusy()||e.target.closest('input,textarea,select,button,a,summary,[role="dialog"]')||e.ctrlKey||e.altKey||e.metaKey)return;
  if(REALM_ROAD_WALK.keyDown(e)){REALM_ROAD.rest=false;e.preventDefault();e.stopImmediatePropagation();}else if((e.key==='Enter'||e.key===' ')&&REALM_ROAD_WALK.interact()){e.preventDefault();e.stopImmediatePropagation();}else if(e.key==='Escape'){returnFromRealmRoad();e.preventDefault();e.stopImmediatePropagation();}else if(/^[1-9ldcsaq]$/i.test(e.key)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 document.addEventListener('keyup',e=>REALM_ROAD_WALK.keyUp(e));addEventListener('blur',()=>{REALM_ROAD_WALK.held=[];});
 cv.addEventListener('click',e=>{if(realmRoadActive()&&!realmRoadBusy()&&REALM_ROAD.cam){const r=cv.getBoundingClientRect();REALM_ROAD_WALK.tap(e.clientX-r.left,e.clientY-r.top,REALM_ROAD.cam);REALM_ROAD.rest=false;}});
})();
