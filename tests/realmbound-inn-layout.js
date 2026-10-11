/* RB1.7: use the real walker and service handlers in run.html's save-isolated iframe. */
function checkRealmInnLayout(frame) {
 return frame.contentWindow.eval('('+function(){
  const checks=[],check=(ok,label)=>{if(!ok)throw Error('RB1.7: '+label);checks.push('RB1.7: '+label);};
  clearRealmRoad();clearTownService();closeRealmNotebook(false);RTALK=null;SCN.el.hidden=true;
  const hero=newHero('Inncheck','concord','human','warrior');hero.lvl=60;hero.mode='focus';hero.onboarding={arrival:true,hints:{}};S.chars=[hero];S.cur=hero.id;boot();closeModal();clearArrival();
  const settle=()=>{for(let i=0;i<200;i++)TOWN_WALK.tick(.05);};
  for(const faction of ['concord','wild'])for(const zone of Object.keys(TOWN_HUBS)){
   hero.faction=faction;hero.zone=zone;C.phase='intown';townEnter();TOWN.on=true;
   const building=townBuildings().find(b=>b.kind==='inn');townDoor(building);
   const room=TOWN.map,label=faction+' '+zone;
   check(TOWN.inside==='inn'&&room.rows.every(r=>r.length===16),label+' enters a rectangular inn');
   const seen=new Set(),pending=[room.start.slice(0,2)],keeper=townPeople()[0];
   for(let i=0;i<pending.length;i++){
    const [x,y]=pending[i],key=x+','+y,ch=room.rows[y]?.[x];
    if(!ch||seen.has(key)||TOWN_WALK.blocked(room,x,y)||ch==='G')continue;
    seen.add(key);pending.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
   }
   check([6,7,8,9].every(x=>seen.has(x+',8'))&&seen.has('7,4'),label+' has a clear entry and route to the Keeper');
   const furniture=[];let beds=0,allFloors=true;
   room.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(['U','V','E','B'].includes(ch))furniture.push([x,y,ch]);if(ch==='E')beds++;if(['_','r'].includes(ch)&&!(keeper.at[0]===x&&keeper.at[1]===y)&&!seen.has(x+','+y))allFloors=false;}));
   check(allFloors&&beds===2,label+' sleeping and dining corners join the same walkable room');
   check(furniture.every(([x,y])=>TOWN_WALK.blocked(room,x,y)),label+' furniture is solid at the drawn footprint');
   check(furniture.every(([x,y])=>[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(p=>seen.has(p.join(',')))),label+' every bed, chair, cupboard and table has an accessible side');
   check(TOWN_WALK.walkTo(...keeper.at),label+' click routing finds the Keeper');settle();
   check(!!RTALK?.townService&&Math.abs(TOWN.pos.x-keeper.at[0])+Math.abs(TOWN.pos.y-keeper.at[1])===1,label+' movement reaches the Keeper and opens the existing rest service');
   clearTownService();TOWN_WALK.place(...room.start);TOWN_WALK.keyDown({key:'ArrowUp',repeat:false});TOWN_WALK.keyUp({key:'ArrowUp'});settle();
   check(TOWN.pos.x===7&&TOWN.pos.y===7,label+' keyboard movement leaves the entry freely');
   check(TOWN_WALK.walkTo(7,9),label+' click routing finds the exit');settle();
   check(!TOWN.inside&&TOWN.pos.x===building.door&&TOWN.pos.y===building.y+building.h,label+' exit returns to the original front step');
  }
  clearTownService();return checks;
 }.toString()+')()');
}