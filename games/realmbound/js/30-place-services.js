'use strict';
/* T41: place-bound interfaces use the existing transaction handlers. No save fields. */
let PLACE_BOOK=null, realmPlaceClick=null;
const PLACE_GIVER_SPOTS=new Map();
const PLACE_ACTIONS={talent:'trainer',resettal:'trainer',buyriding:'stable',buymount:'stable',trainpet:'stable',petactive:'stable',petrelease:'stable',guildfound:'guild',guildinvite:'guild',guilddismiss:'guild',guildrequest:'guild',job:'guild',jobstop:'guild'};
const PLACE_NAMES={trainer:'Trainer',stable:'Stable',guild:'Guild Hall'};
function realmPlaceReady(room){return !!H()&&townActive()&&H().mode!=='auto'&&!RTALK&&!modalKind&&(room==='guild'?inGuildHall():TOWN.inside===room);}
function placeText(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function placeChoice(who,text,choices,done){
 if(RTALK||!H()||!townActive()||H().mode==='auto'||modalKind)return false;
 closeRealmNotebook(false);
 const hero=H(),account=S,room=TOWN.inside,state={cancelled:false};let settled=false;
 SCN.play([[who,text]],choice=>{
  SCN.el.classList.remove('town-service-dialogue');
  if(settled||state.cancelled||S!==account||H()!==hero||TOWN.inside!==room||!townActive()||hero.mode==='auto')return;
  settled=true;if(done)done(choice);if(H()===hero){save();updateWorld();}
 },{choices});RTALK.townService=true;RTALK.serviceState=state;C.lastInput=C.run;TOWN.auto=null;SCN.el.classList.add('town-service-dialogue');return true;
}
function openPlaceBook(room,title,build,update){
 if(!realmPlaceReady(room))return false;closeRealmNotebook(false);
 PLACE_BOOK={room,title,build,update,hero:H(),account:S};
 $('.menu').classList.add('place-book');
 $('#tabbody').replaceChildren();curKey=null;
 if(!openRealmNotebook('place')){PLACE_BOOK=null;return false;}renderPlaceBook(true);return true;
}
function renderPlaceBook(force){
 if(!PLACE_BOOK)return;const book=PLACE_BOOK;
 if(S!==book.account||H()!==book.hero||!realmPlaceReady(book.room)||FIELD_BOOK!=='place'){closeRealmNotebook(false);return;}
 const page=$('[data-field-page="place"]');$('#fieldBookTitle').textContent=book.title;
 if(force||!page.childNodes.length)page.innerHTML=book.build();if(book.update)book.update();
}
function openTrainerLessons(n){return openPlaceBook('trainer',n.name+' · Lesson Book',()=>'<p class="sub">Your Trainer keeps the book open while you choose what to practise.</p>'+TABS.talents.build(),()=>TABS.talents.update());}
function openStableNotes(n,key){return openPlaceBook('stable',n.name+' · '+(key==='pets'?'Companions':'Riding'),()=>TABS[key].build(),()=>TABS[key].update());}
function talkPlaceKeeper(n){
 if(TOWN.inside==='trainer')return placeChoice(n.name,'Show me how you fight. We can build on what you know, or work out a different way together.',['Open the Lesson Book','Another time'],c=>{if(c===0)openTrainerLessons(n);});
 if(TOWN.inside==='stable')return placeChoice(n.name,'A companion is more than a way to get somewhere. I can help you with riding'+(H().cls==='hunter'?' or make room for another beast beside you.':'.'),H().cls==='hunter'?['Riding and mounts','Visit your companions','Another time']:['Riding and mounts','Another time'],c=>{if(c===0)openStableNotes(n,'mounts');else if(c===1&&H().cls==='hunter')openStableNotes(n,'pets');});return false;
}
function placeJobsHTML(){
 const ws=workers();let out='<p class="sub">Leave a job for someone who is resting. Work already done is kept when you call them back.</p><p>'+ROSTER.busy()+' of '+jobSlots()+' places filled.</p>';
 if(!ws.length)return out+'<p>No one is resting yet. Your other characters can help even before you found a guild.</p>';
 for(const id of ws){const w=workerOf(id),j=ROSTER.jobOf(id);out+='<div class="rowl"><div class="l"><b>'+placeText(w.name)+'</b><div class="meta" data-job="'+id+'">'+(j?JOBS[j].doing+' · '+fmtLeft(id):workerCanWork(id)?'Resting':'Travelling with you')+'</div></div><div class="r">'+(j?'<button class="btn sm alt" data-act="jobstop" data-arg="'+id+'">Call back</button>':workerCanWork(id)?jobsFor(id).map(job=>'<button class="btn sm" data-act="job" data-arg="'+id+'|'+job+'" '+(!ROSTER.free()?'disabled':'')+'>'+JOB_BTN[job]+'</button>').join(''):'')+'</div></div>';}
 return out;
}
function openPlaceJobs(){return openPlaceBook('guild','Guild Hall · Jobs Board',placeJobsHTML,()=>TABS.supplies.update());}
function placeChestHTML(){const b=bank();return '<p class="sub">The chest holds supplies for every character. Your equipment stays in your Satchel.</p><div class="rowl"><div>Ore: '+b.ore+' · Repair kits: '+b.kit+'</div><button class="btn sm" data-act="craftkit" '+(b.ore<KIT_ORE?'disabled':'')+'>Make a repair kit ('+KIT_ORE+' ore)</button></div><div class="rowl"><div>Herbs: '+b.herb+' · Healing potions: '+b.potion+'</div><button class="btn sm" data-act="craftpot" '+(b.herb<POTION_HERBS?'disabled':'')+'>Brew a potion ('+POTION_HERBS+' herbs)</button></div>';}
function openPlaceChest(){return openPlaceBook('guild','Guild Hall · Supply Chest',placeChestHTML);}
function talkPlaceRegistrar(n){
 if(!guildOn())return placeChoice(n.name,'Every hall starts with people who will sign their names beside yours. Let us look over your charter.', ['Look over the charter','Another time'],c=>{if(c===0)openPlaceBook('guild','Registrar Mott · Guild Charter',guildHTML);});
 return placeChoice(n.name,'The board holds our work, the chest our supplies, and the Hearth Book what we have shared. Who would you like to see?', ['The guild roll','The Hearth Book','Another time'],c=>{if(c===0)openPlaceBook('guild',G().name+' · Guild Roll',()=>{
  const candidates=(H().npcs||[]).filter(n=>n.met&&affLvl(n)>=2&&!isMember(n));
  return '<p class="sub">Visit a member where they stand to talk, share a favour, or say farewell.</p>'+Object.keys(G().members).map(key=>{const w=workerOf(key);return w?'<div class="rowl"><b>'+placeText(w.name)+'</b><button class="btn sm" data-place-member="'+key+'">Find by the hearth</button></div>':'';}).join('')+(candidates.length?'<h3>Friends who could join</h3>'+candidates.map(n=>'<div class="rowl"><b>'+placeText(n.name)+'</b><button class="btn sm" data-act="guildinvite" data-arg="'+n.id+'">Invite to the guild</button></div>').join(''):'');
 });else if(c===1)openMemberStoryBook();});
}
function talkPlaceMember(key){
 const w=workerOf(key);if(!w||w.kind!=='adv')return false;
 const why=ROSTER.jobOf(key)?'They are away working. You can call them back at the board.':memberRaiding(key)?'They are away with the expedition. They will be here when it returns.':'';
 if(why)return placeChoice(w.name,why,['Another time']);
 return placeChoice(w.name,'There is room beside the hearth. What is on your mind?', ['Sit and talk','Arrange work','Say farewell','Another time'],c=>{
  if(c===0)memberTalk(key);else if(c===1)TOWN_WALK.walkTo(14,2);else if(c===2)placeChoice(w.name,'Are you asking me to leave the guild? We can part as friends, if that is what you want.', ['Part as friends','Stay with us'],choice=>{if(choice===0&&dismissMember(key))line(w.name+' leaves the guild on good terms.','l-sys');});
 });
}
function visitRealmPlace(room){
 if(!H()||!C||RTALK||modalKind)return false;closeRealmNotebook(false);
 if(!townActive()){toast('Visit the '+PLACE_NAMES[room]+' in '+hubName()+'. Use Go to town on your Map.');return false;}
 if(H().mode==='auto'){toast('Choose Focus to visit the '+PLACE_NAMES[room]+'.');return false;}
 if(TOWN.inside===room||room==='guild'&&inGuildHall()){const person=townPeople().find(n=>n.id===(room==='guild'?'registrar':'keeper'));return !!person&&TOWN_WALK.walkTo(...person.at);}
 if(TOWN.inside)townExit();const b=townBuildings().find(b=>b.kind===room);return !!b&&TOWN_WALK.walkTo(b.door,b.y+b.h-1);
}
function talkPlaceQuest(n){
 const qs=(QUESTS[H().zone]||[]).filter(q=>giver(q)===n.name&&['avail','ready'].includes(qState(q)));
 return placeChoice(n.name,qs.length?'There is work we can talk through, or something you have brought back for me.':'The road is quieter for your work. Come and see me again when you are ready.',qs.map(q=>placeText(q.name)+(qState(q)==='ready'?' · Finish':' · Hear the request')).concat('Another time'),c=>{const q=qs[c];if(q){if(qState(q)==='ready')finishPlaceQuest(q);else placeChoice(giver(q),q.text,['I can help','Another time'],i=>{if(i===0&&qState(q)==='avail'&&H().quests.active.length<3)accept(q.id);else if(i===0)toast('Finish one of your three requests first.');});}});
}
function finishPlaceQuest(q){
 if(qState(q)!=='ready')return false;const rewards=qReward(q);
 return placeChoice(giver(q),q.name+' is ready. Choose what will help you on the next road. '+moneyTxt(qMoney(q))+' and '+fmtI(qXP(q))+' experience, with one of these:',rewards.map(itemSpan).concat('Another time'),c=>{if(c<rewards.length&&qState(q)==='ready'){turnIn(q.id,c,false);if(H().quests.done[q.id])questThanks(q.id);}});
}
function placeTownReachable(people,at){
 const map=TOWN.map,actors=people.flatMap(n=>[n.at,...(n.mule?[n.mule]:[])]).concat([at]),blocked=new Set(actors.map(p=>p.join(','))),seen=new Set(),pending=[map.start.slice(0,2)];
 const around=([x,y])=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
 for(let i=0;i<pending.length;i++){const [x,y]=pending[i],key=x+','+y,tile=map.rows[y]?.[x];if(!tile||seen.has(key)||blocked.has(key)||TOWN_TILES[tile]?.solid||tile==='D')continue;seen.add(key);pending.push(...around([x,y]));}
 return actors.every(p=>around(p).some(a=>seen.has(a.join(','))))&&townBuildings().every(b=>seen.has(b.door+','+(b.y+b.h)));
}
function findPlaceQuest(id){
 const q=ALLQ[id];if(!q||!H())return false;if(q.zone!==H().zone){closeRealmNotebook(false);toast('Meet '+giver(q)+' in '+ZONES[q.zone].name+'. Choose that road on your Map.');return false;}closeRealmNotebook(false);
 if(!townActive()){openRealmNotebook('map');toast('Meet '+giver(q)+' in '+hubName()+'. Use Go to town on your Map.');return false;}
 if(H().mode==='auto'){toast('Choose Focus to talk with '+giver(q)+'.');return false;}
 if(TOWN.inside)townExit();const n=townPeople().find(n=>n.id==='giver'&&n.name===giver(q));return !!n&&TOWN_WALK.walkTo(...n.at);
}
(() => {
 FIELD_TITLES.place='In town';
 const page=document.createElement('div');page.dataset.fieldPage='place';page.className='field-page';page.hidden=true;$('.menu').append(page);
 const oldClose=closeRealmNotebook;closeRealmNotebook=function(restore){PLACE_BOOK=null;curKey=null;$('.menu').classList.remove('place-book');oldClose(restore);};
 const oldDoor=townDoor;townDoor=function(b){if(b&&['trainer','stable','guild'].includes(b.kind)&&townActive()&&!townAuto()){TOWN.inside=b.kind;TOWN.auto=null;TOWN_WALK.place(...(b.kind==='guild'?GUILD_HALL:SERVICE_ROOMS[b.kind]).start);line('You step into the '+buildingName(b)+'.','l-sys');sfx('select');return;}oldDoor(b);};
 const oldTalk=townTalk;townTalk=function(n){if(n.id==='keeper'&&['trainer','stable'].includes(TOWN.inside)){talkPlaceKeeper(n);return;}if(n.id==='registrar'){if(inGuildHall())talkPlaceRegistrar(n);else placeChoice(n.name,'You will find the charter, records and Hearth Book inside the Guild Hall. Shall we go over?', ['Walk to the Guild Hall','Another time'],c=>{if(c===0)visitRealmPlace('guild');});return;}if(n.id==='member'&&inGuildHall()){talkPlaceMember(n.key);return;}if(n.id==='giver'){talkPlaceQuest(n);return;}oldTalk(n);};
 const oldSign=townSign;townSign=function(x,y){const tile=TOWN.map.rows[y]?.[x];if(inGuildHall()&&tile==='J'){openPlaceJobs();return;}if(inGuildHall()&&tile==='C'){openPlaceChest();return;}oldSign(x,y);};
 const oldHallPeople=hallPeople;hallPeople=function(){return oldHallPeople().filter(n=>n.id!=='member'||!ROSTER.jobOf(n.key)&&!memberRaiding(n.key));};
 const oldStoryBook=openMemberStoryBook;openMemberStoryBook=function(){
  if(!oldStoryBook())return false;
  for(const row of document.querySelectorAll('#sheet .member-story')){
   const buttons=[...row.querySelectorAll('[data-act="memberstory"],[data-act="memberrepair"],[data-act="membermemory"]')];
   if(!buttons.length)continue;const key=buttons[0].dataset.arg;
   const find=document.createElement('button');find.className='btn sm';find.dataset.placeMember=key;find.textContent='Find by the hearth';find.disabled=!!ROSTER.jobOf(key)||memberRaiding(key);
   buttons[0].replaceWith(find);buttons.slice(1).forEach(b=>b.remove());
  }return true;
 };
 const oldPeople=townPeople;townPeople=function(){
  const people=oldPeople();if(!H()||TOWN.inside)return people;
  for(const n of people){if(TOWN.map.people?.[n.id])n.at=TOWN.map.people[n.id];if(n.mule&&TOWN.map.people?.brisket)n.mule=TOWN.map.people.brisket;}
  const names=[...new Set((QUESTS[H().zone]||[]).map(giver))],first=people.find(n=>n.id==='giver');if(!first)return people;
  const cacheKey=H().zone+'|'+H().faction+'|'+people.some(n=>n.id==='pell');if(PLACE_GIVER_SPOTS.has(cacheKey))return people.concat(PLACE_GIVER_SPOTS.get(cacheKey).map(n=>({...first,...n})));
  const taken=new Set(people.flatMap(n=>[n.at,...(n.mule?[n.mule]:[])]).concat(townBuildings().map(b=>[b.door,b.y+b.h]),[TOWN.map.start.slice(0,2)]).map(at=>at.join(',')));
  const cells=[];for(let y=1;y<TOWN.map.rows.length-1;y++)for(let x=1;x<TOWN.map.rows[y].length-1;x++){const tile=TOWN.map.rows[y][x];if(!taken.has(x+','+y)&&!TOWN_TILES[tile]?.solid&&!['D','G'].includes(tile))cells.push([x,y]);}
  cells.sort((a,b)=>Math.abs(a[0]-18)+Math.abs(a[1]-9)-Math.abs(b[0]-18)-Math.abs(b[1]-9));
  for(const name of names.filter(name=>name!==first.name)){const index=cells.findIndex(at=>people.every(n=>Math.abs(n.at[0]-at[0])+Math.abs(n.at[1]-at[1])>=2)&&placeTownReachable(people,at));if(index>=0){const [at]=cells.splice(index,1);people.push({...first,name,at});}}PLACE_GIVER_SPOTS.set(cacheKey,people.filter(n=>n.id==='giver'&&n.name!==first.name).map(n=>({name:n.name,at:n.at})));return people;
 };
 const oldTab=renderTab;renderTab=function(force){if(PLACE_BOOK){if(force)renderPlaceBook(true);return;}oldTab(force);if(!PLACE_BOOK&&['talents','mounts','pets','supplies'].includes(S.tab)){
  const body=$('#tabbody');for(const control of body.querySelectorAll('[data-act]'))if(PLACE_ACTIONS[control.dataset.act]||['memberstory','membermemory','memberrepair','guildstories'].includes(control.dataset.act))control.remove();
  if(!body.querySelector('[data-place-record]')){const hint=document.createElement('p');hint.className='sub';hint.dataset.placeRecord='';const room=S.tab==='talents'?'trainer':S.tab==='supplies'?'guild':'stable';hint.textContent='These are your records. Visit the '+PLACE_NAMES[room]+' in '+hubName()+' to make arrangements.';body.prepend(hint);}
 }};
 const oldWorld=updateWorld;updateWorld=function(){oldWorld();renderPlaceBook(false);};
 realmPlaceClick=function(e){
  const member=e.target.closest('[data-place-member]');if(member){e.preventDefault();e.stopImmediatePropagation();const key=member.dataset.placeMember;if(ROSTER.jobOf(key)||memberRaiding(key)){toast('They are away. Call a worker back at the Jobs Board, or wait for the expedition.');return;}if(modalKind==='memberstories')closeModal();closeRealmNotebook(false);if(!realmPlaceReady('guild'))return;TOWN.storyGuest=key;const person=hallPeople().find(n=>n.key===key);if(person)TOWN_WALK.walkTo(...person.at);return;}
  const action=e.target.closest('[data-act]');if(!action)return;const a=action.dataset.act;
  if(['accept','turnin'].includes(a)&&$('.menu').contains(action)){e.preventDefault();e.stopImmediatePropagation();findPlaceQuest((action.dataset.arg||'').split(':')[0]);return;}
  if(a==='tab'&&['talents','mounts','pets','supplies'].includes(action.dataset.arg)){e.preventDefault();e.stopImmediatePropagation();visitRealmPlace(action.dataset.arg==='talents'?'trainer':action.dataset.arg==='supplies'?'guild':'stable');return;}
  if(PLACE_BOOK&&page.contains(action)&&PLACE_ACTIONS[a]&&!realmPlaceReady(PLACE_ACTIONS[a])){e.preventDefault();e.stopImmediatePropagation();closeRealmNotebook(false);return;}
 };
 document.addEventListener('click',e=>{if(PLACE_BOOK&&page.contains(e.target)&&e.target.closest('[data-act]')&&!e.target.closest('.armed'))renderPlaceBook(true);});
})();
