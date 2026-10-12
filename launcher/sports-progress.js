/* AR2.15: the games share an old report ID, never a save. Build a display-only index;
   do not migrate, write, validate through the game engine, or stamp a made-up last-played date. */
(function () {
  'use strict';
  const number=n=>Number.isFinite(n)&&n>=0;
  const whole=n=>Number.isInteger(n)&&n>=0;
  const money=n=>'$'+Math.round(n).toLocaleString('en-US');
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function manager(s) {
    const club=s?.clubs?.[0];
    if(s?.game!=='diamond-manager'||s.schema!==1||!whole(s.season)||s.season<1||!number(s.cash)||
      !club||typeof club.name!=='string'||!whole(club.w)||!whole(club.l))return null;
    // Manager amounts are in thousands; Career amounts are in dollars.
    return {summary:club.name+' '+club.w+'–'+club.l+' · Season '+s.season,detail:'Cash '+money(s.cash*1000),last:null};
  }
  function career(s) {
    if(s?.game!=='diamond-career'||s.schema!==1||typeof s.player?.name!=='string'||
      !whole(s.day)||s.day<1||!number(s.cash)||!whole(s.record?.hits))return null;
    return {summary:s.player.name+' · '+(typeof s.contract?.tier==='string'?s.contract.tier:'First call-up'),
      detail:'Day '+s.day+' · '+s.record.hits+' hits · '+money(s.cash),last:null};
  }
  window.ArcadeSportsProgress={forHall(index) {
    return {...index,baseball:manager(read('diamond-manager-save-v1')),
      'diamond-career':career(read('diamond-career-save-v1'))};
  }};
})();
