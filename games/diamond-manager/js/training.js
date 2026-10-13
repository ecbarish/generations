'use strict';
/* DM-N1b: mirror the deterministic ceiling part of develop(), without rolls or mutation.
   Scouting rounds the result exactly as it rounds the current player; no hidden ceiling is displayed. */
function trainingForecast(L,p,rooms){
  const level=Math.max(0,Math.min(DM.upgrades.training.cost.length,Math.floor(rooms)));
  if(p.age>27)return null;
  const ceiling=p.pot||overall(p),after=Math.min(92,ceiling+Math.ceil(level*2/2));
  return {before:scoutCeiling(L,p),after:scoutCeiling(L,{...p,pot:after}),approximate:L.upgrades.scouting<2,level,growthLimit:level*2};
}
