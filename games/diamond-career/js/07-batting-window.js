'use strict';
// A small field overlay, reusable when the rest of the career moves into the world.
// While the ball is in the air nothing covers the field: you swing by tapping anywhere on it (or Space), and a circle
// at the plate lights up when the ball arrives (Evan, 2026-10-08: the controls hid the pitch).
function renderBattingWindow() {
  const host=document.querySelector('#batting-window'),stage=document.querySelector('#stage'),tip=document.querySelector('#swing-tip');
  stage.classList.toggle('batting-play',['pitch','result'].includes(S.phase));
  const timing=S.phase==='pitch'&&S.mode==='timing';
  const flying=timing&&pitchClock.running;
  tip.hidden=!flying;
  const window=swingWindow(S);
  document.querySelector("#timing-bar").style.setProperty("--swing-zone",(window*2/(1+window)*100)+"%");
  tip.textContent=window>.10?"Learning the swing: tap while the plate circle glows.":"Tap when the ball reaches the glowing plate circle.";
  stage.classList.toggle('pitch-flying',flying);
  host.hidden=!(S.phase==='pitch'||S.phase==='result')||flying;
  if(host.hidden){host.replaceChildren();return;}
  if(S.phase==='result'){
    host.innerHTML='<p class="field-result" role="status">'+esc(S.active.last.text)+'</p>'+btn('continue',S.active.last.ended?'Watch the game move on':'Next pitch',true);
    return;
  }
  const p=S.active.pitch;
  if(S.mode==='tactical') {
    host.innerHTML='<fieldset><legend>Your approach</legend><div class="field-choices">'+['patience','contact','power'].map(x=>'<button data-stance="'+x+'" aria-pressed="'+(S.stance===x)+'" class="'+(S.stance===x?'selected':'')+'">'+x[0].toUpperCase()+x.slice(1)+'</button>').join('')+'</div></fieldset>'+
      '<p class="field-cue">'+esc(S.active.pitcher.name)+' favors '+esc(S.active.pitcher.favorite)+'. This release shows '+esc(DC.pitches[p.hint].cue)+'. A clue, not a promise.</p>'+
      '<label for="field-guess">Read the pitch</label><select id="field-guess">'+Object.keys(DC.pitches).map(x=>'<option '+(S.guess===x?'selected':'')+'>'+x+'</option>').join('')+'</select><div class="field-choices">'+btn('tactical','Commit to your read',true)+btn('take','Let it go')+'</div>';
    return;
  }
  // Loaded old pitches keep the original cue model; never reroll an existing hint.
  const chance=Number.isFinite(p.cueChance)&&p.cueChance>=0&&p.cueChance<=1?p.cueChance:cueAccuracy({discipline:50});
  host.innerHTML='<fieldset><legend>Your swing</legend><div class="field-choices">'+['contact','power'].map(x=>'<button data-stance="'+x+'" aria-pressed="'+(timingStance(S)===x)+'" class="'+(timingStance(S)===x?'selected':'')+'">'+x[0].toUpperCase()+x.slice(1)+'</button>').join('')+'</div></fieldset>'+
    '<p class="field-cue">'+esc(DC.pitches[p.hint].cue)+' · cue matches about '+(chance*100).toFixed(1)+'% of the time.</p>'+
    '<p class="field-help">'+(timingStance(S)==='power'?'Power: fewer contacts, more extra-base chances.':'Contact: more chances to get aboard.')+
    ' <b>How to hit:</b> press Throw the pitch (or Space). Watch the ball come in from the pitcher, then tap anywhere on the field (or press Space) the moment it reaches the glowing circle at the plate. Do nothing to let it go by.</p>'+
    '<div class="field-choices">'+btn('ready','Throw the pitch',true)+'</div>';
}
document.querySelector('#batting-window').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.stance)chooseStance(b.dataset.stance);
  else if(b.dataset.act)actCareer(b.dataset.act);
});
// Tap or click anywhere on the field while the ball is coming: swing.
document.querySelector('#stage').addEventListener('pointerdown',e=>{
  if(S.phase!=='pitch'||S.mode!=='timing'||!pitchClock.running||sceneState||e.target.closest('button,a,input,select'))return;
  e.preventDefault();actCareer('swing');
});

document.querySelector('#batting-window').addEventListener('change',e=>{if(e.target.id==='field-guess'){S.guess=e.target.value;saveCareer();}});
