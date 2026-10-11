'use strict';
/* R6: original regional footprints. Services and the road home remain available in every hub. */
const HUB_LAYOUTS = {
  thornvale: { theme: 'abbey', plots: [[2,2,5,3],[8,3,4,2],[12,1,5,4],[18,3,4,2],[23,2,3,3]] },
  redsand: { theme: 'caravan', plots: [[2,2,5,3],[21,2,4,3],[10,1,6,4],[2,9,5,3],[21,9,4,3]] },
  fens: { theme: 'causeway', plots: [[2,2,6,3],[20,2,5,3],[10,1,6,4],[2,9,5,3],[21,9,4,3]] },
  ashen: { theme: 'forge', plots: [[2,8,5,3],[20,2,5,4],[2,1,6,4],[12,1,5,3],[21,10,4,3]] },
  frostmere: { theme: 'lodge', plots: [[2,2,7,4],[20,2,5,3],[11,1,6,4],[2,10,5,3],[20,10,5,3]] },
  barrowfield: { theme: 'barrows', plots: [[2,2,5,3],[20,9,5,3],[10,1,6,4],[20,2,5,3],[2,10,5,3]] },
  hollowcrown: { theme: 'roots', plots: [[2,8,6,3],[20,2,5,3],[10,1,6,4],[2,1,5,3],[21,10,4,3]] },
  crownheart: { theme: 'heart', plots: [[10,1,6,4],[20,2,5,3],[2,2,6,4],[20,9,5,3],[2,10,5,3]] }
};
function makeHubMap(zone, kind) {
  const profile = HUB_LAYOUTS[zone], keys = ['inn','smith','guild','trainer','stable'];
  const buildings = profile.plots.map(([x,y,w,h],i) => ({ kind: keys[i], name: TOWN_BUILDINGS[i].name, x,y,w,h,door:x+Math.floor(w/2) }));
  const grid = Array.from({length:TOWN_H},(_,y)=>Array.from({length:TOWN_W},(_,x)=>y===0||x===0||y===15||x===27?'T':','));
  const put=(x,y,ch)=>{ if(x>0&&x<27&&y>0&&y<15)grid[y][x]=ch; };
  if(profile.theme==='causeway') for(let y=7;y<15;y++)for(let x=1;x<27;x++)if(x<9||x>18)put(x,y,'~');
  if(profile.theme==='lodge') for(let y=1;y<15;y++)for(let x=1;x<27;x++)put(x,y,'s');
  for(const [x,y] of [[3,8],[4,8],[22,8],[24,13],[7,13],[19,13]])put(x,y,profile.theme==='roots'?'T':profile.theme==='barrows'||profile.theme==='forge'?'K':'f');
  if(profile.theme==='caravan')for(let x=3;x<26;x+=4)put(x,13,'=');
  if(profile.theme==='heart')for(let x=9;x<20;x++)put(x,11,'f');
  // Sheltered islands and lanes are cut before footprints, so roads never erase a building.
  for(const b of buildings)for(let y=b.y-1;y<=b.y+b.h;y++)for(let x=b.x-1;x<=b.x+b.w;x++)put(x,y,profile.theme==='lodge'?'s':',');
  const lane=(x,y)=>{if(x>0&&x<27&&y>0&&y<15)grid[y][x]=grid[y][x]==='~'?'_':'.';};
  for(let y=1;y<15;y++){lane(13,y);lane(14,y);}
  for(const b of buildings){const y=b.y+b.h;for(let x=Math.min(b.door,13);x<=Math.max(b.door,14);x++){lane(x,y);lane(x,y+1);}}
  const doors={};for(const b of buildings){for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)grid[y][x]='#';const y=b.y+b.h-1;grid[y][b.door]='D';doors[b.door+','+y]=b;}
  // The bottom door row may occupy the main lane. Each service has a connected front approach.
  for(let y=5;y<15;y++)for(let x=12;x<=15;x++)if(!['#','D'].includes(grid[y][x]))lane(x,y);
  grid[15][13]=grid[15][14]='G';
  const spots={},taken=new Set(['13,14','13,13','14,14',...buildings.map(b=>b.door+','+(b.y+b.h))]);
  const near=(id,cx,cy)=>{const candidates=[];for(let y=1;y<15;y++)for(let x=1;x<27;x++)if(['.',',','s','f','_'].includes(grid[y][x])&&!taken.has(x+','+y))candidates.push([x,y]);candidates.sort((a,b)=>Math.abs(a[0]-cx)+Math.abs(a[1]-cy)-Math.abs(b[0]-cx)-Math.abs(b[1]-cy));const at=candidates[0];taken.add(at.join(','));spots[id]=at;};
  const guild=buildings[2];near('registrar',guild.door+2,guild.y+guild.h);near('giver',18,8);near('kid',9,9);near('pell',6,12);near('brisket',5,12);
  // Reserve actors' cells before setting the square's light and landmark.
  for(const [x,y,ch] of [[11,9,kind==='camp'?'F':'O'],[10,8,kind==='camp'?'Y':'f'],[7,7,'L'],[19,7,'L'],[12,12,'L'],[16,12,'L']])if(!taken.has(x+','+y)&&!['#','D','~'].includes(grid[y][x]))put(x,y,ch);
  return {rows:grid.map(r=>r.join('')),doors,buildings,people:spots,start:[13,14,'up'],theme:profile.theme};
}
const SERVICE_ROOMS = {
  trainer: {rows:['################','#______HH______#','#_QQ________QQ_#','#______________#','#_BB________BB_#','#______rr______#','#______rr______#','#______________#','#______rr______#','#######GG#######'],doors:{},start:[7,8,'up']},
  stable: {rows:['################','#______________#','#_EE________EE_#','#______________#','#_==________==_#','#______________#','#_BB________BB_#','#______________#','#______________#','#######GG#######'],doors:{},start:[7,8,'up']},
  inn: {rows:['################','#______HH______#','#_UE__V__V__EU_#','#______________#','#_rr________rr_#','#__BB______BB__#','#__VV__rr__VV__#','#______rr______#','#______rr______#','#######GG#######'],doors:{},start:[7,8,'up']},
  smith: {rows:['################','#______HH______#','#_QQ________QQ_#','#______________#','#__AA______AA__#','#______________#','#_BB________BB_#','#______________#','#______________#','#######GG#######'],doors:{},start:[7,8,'up']}
};
function inGuildHall(){return TOWN.inside===true||TOWN.inside==='guild';}
function townOutsideMap(){const h=H();return h&&TOWN_HUBS[h.zone]?TOWN_HUBS[h.zone][townKind()]:TOWN_MAPS[townKind()];}
function townBuildings(){return townOutsideMap().buildings||TOWN_BUILDINGS;}
const HUB_KEEPERS={thornvale:['Brother Cedran','Smith Daven'],redsand:['Keeper Orva','Smith Korrin'],fens:['Keeper Sella','Smith Vask'],ashen:['Keeper Tannel','Smith Breska'],frostmere:['Keeper Heddra','Smith Rulven'],barrowfield:['Keeper Maelin','Smith Issar'],hollowcrown:['Keeper Vedra','Smith Ferran'],crownheart:['Keeper Aster','Smith Nolven']};
function serviceRoomPeople(){const h=H(),inn=TOWN.inside==='inn';return [{id:'keeper',name:TOWN.inside==='trainer'?'Trainer Saren':TOWN.inside==='stable'?'Stable Keeper Vella':(HUB_KEEPERS[h.zone]||HUB_KEEPERS.thornvale)[inn?0:1],at:[7,3],dir:'down',look:{race:FACTIONS[h.faction].races[0],cls:inn?'priest':'warrior',hair:inn?'#b87a4a':'#787878'}}];}
