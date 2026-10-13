'use strict';

/* ================= loop ================= */
function countTime(sec){S.stats.play+=sec;S.stats.run+=sec;}
function advance(dt){
  if(!(dt>0)||!Number.isFinite(dt))return;
  if(S.regionOffer){countTime(dt);return;}
  const steps=Math.min(400,Math.max(1,Math.ceil(dt/0.25))),h=dt/steps;
  for(let k=0;k<steps;k++){
    D=derive();gain(D.gps*h);countTime(h);
    S.boardT-=h;if(S.boardT<=0)refreshBoard();
    battleTick(h);runStaff(h);if(S.regionOffer){countTime(Math.max(0,dt-(k+1)*h));break;}
  }
  D=derive();checkStaff();
}
function farmRate(){
  if(!S.party.length||!S.mon)return 0;const m=monFor(S.floor);const ticks=Math.ceil(m.max/Math.max(1e-9,D.patk));
  const taken=Math.max(0,m.atk*ticks-D.pmax*D.heal*ticks);if(taken>D.pmax)return 0;
  return m.gold*D.goldM*(1+D.thief)/(ticks*0.5/D.speed);
}
function offline(sec){
  if(!Number.isFinite(sec)||sec<30)return null;sec=Math.min(sec,86400);if(S.regionOffer){countTime(sec);return null;}D=derive();
  const eff=0.5+0.1*(S.crest.night||0),rate=D.gps+farmRate(),g=rate*sec*eff;gain(g);
  S.stats.play+=sec;S.stats.run+=sec;S.boardT=Math.min(S.boardT,0);if(S.resting){S.resting=0;S.php=D.pmax;}
  return {sec,eff,gain:g,farm:farmRate()>0};
}

