'use strict';
/* DM-N1c: recent form is temporary, separate from permanent ability and morale.
   Only completed, qualifying appearances count. No random rolls or bench penalties. */
function freshForm(){return {recent:[],lastGame:null};}
function validForm(f){return f===undefined||!!(f&&Array.isArray(f.recent)&&f.recent.length<=5&&f.recent.every(n=>Number.isInteger(n)&&n>=-1&&n<=1)&&(f.lastGame===null||(typeof f.lastGame==='string'&&f.lastGame.length>0&&f.lastGame.length<=80)));}
function formBonus(p){return clamp((p.form?.recent||[]).reduce((n,x)=>n+x,0),-3,3);}
function formWord(p){const n=formBonus(p);return n>=2?'Hot':n<=-2?'Cold':n===1?'Warming':n===-1?'Cooling':'Steady';}
function formRatings(p){const q={...p},n=formBonus(p);for(const k of p.pitcher?['stuff','control']:['contact','power','eye'])q[k]=clamp(p[k]+n,0,99);return q;}
function formGameKey(L){return L.season+':'+(L.phase==='final'?'final:'+L.final.games.length:'day:'+L.day);}
function recordForm(L,g){
  if(!g.done)return;
  const key=g.formKey||formGameKey(L);g.formChanges=g.formChanges||[];
  for(const ci of [g.home,g.away])for(const p of L.clubs[ci].players){
    const s=p.pitcher?g.pbox?.[p.id]:g.box?.[p.id];
    if(!s||(p.pitcher?(s.outs||0)<9:(s.ab||0)+(s.bb||0)<3))continue;
    const f=p.form||(p.form=freshForm());if(f.lastGame===key)continue;
    const before=formBonus(p),mark=p.pitcher?((s.r||0)*27<=s.outs*3?1:(s.r||0)*27>=s.outs*6?-1:0):((s.h||0)>=2||(s.hr||0)>0?1:!(s.h||0)&&(s.ab||0)>=3?-1:0);
    f.recent=f.recent.concat(mark).slice(-5);f.lastGame=key;
    const after=formBonus(p);if(before!==after)g.formChanges.push({club:ci,id:p.id,name:p.name,before,after});
  }
}
function formSummary(p){const n=formBonus(p);return formWord(p)+' · next game '+(n>0?'+':'')+n+' '+(p.pitcher?'Stuff / Control':'Contact / Power / Eye');}
