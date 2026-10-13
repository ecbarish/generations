'use strict';
/* Story scenes (S1): quest givers speak in portrait scenes, using the arcade's shared scene system
   (shared/dialogue.js) in Realmbound's stone-and-bronze colours. Accepting a quest by hand shows the giver's request
   with "Accept" and "Not now"; turning one in by hand plays their thanks. The QuestHelper addon and Auto never open
   scenes, so idle play is never interrupted. Every giver gets a portrait generated from their name (the same face
   every time), dressed in their faction's colours and drawn from its peoples; a giver can be given a hand-made
   look in GIVER_LOOKS below. */
let RTALK = null;
const FACTION_LOOK = { concord: { palette: 'cool', races: ['human', 'human', 'stonekin'] }, wild: { palette: 'warm', races: ['grishar', 'duskelf'] } };
const GIVER_LOOKS = {}; // name -> { skin, hair, hairCol, hatCol, shirt, bg, beard, ears, tusks } to override a generated face
function giverLook(name) {
  const h = H(), f = (h && FACTION_LOOK[h.faction]) || FACTION_LOOK.concord; // a scene can outlive its hero (switching, tests)
  return Object.assign(Dialogue.lookFor(name, { palette: f.palette, races: f.races }), GIVER_LOOKS[name] || {}, { name, title: h ? hubName() : '' });
}
const SCN = Dialogue.create({
  host: $('.scene'), theme: 'realmbound',
  get: () => RTALK, set: s => { RTALK = s; },
  cast: who => memberStoryPortrait(who) || giverLook(who),
  blip: who => sfx('blip', voiceOf(who)),
  auto: () => false // every deliberately opened conversation waits for its reader
});
// The typewriter stays, but its first press now says what it does and reveals text immediately.
function renderTalkAction(){
  const talk=RTALK;if(!talk)return;
  const text=talk.lines[talk.i][1],typing=talk.shown<text.length;
  SCN.el.querySelector('.dlg-continue').textContent=typing?'Show line':'Continue';
  SCN.el.querySelector('.dlg-say').textContent=text.slice(0,talk.shown);
  const arrival=document.querySelector('[data-road="advance"]');
  if(arrival)arrival.textContent=typing?'Show line (Enter)':'Continue (Enter)';
}
for(const method of ['play','advance']){const original=SCN[method];SCN[method]=function(...args){const result=original(...args);renderTalkAction();return result;};}
setInterval(renderTalkAction,45);
/* the Accept button in the quest log: hear the request first */
function questOffer(id) {
  const q = ALLQ[id]; if (!q || qState(q) !== 'avail') return;
  SCN.play([[giver(q), q.text]], choice => { if (choice === 0) { accept(id); updateWorld(); } }, { choices: ['Accept', 'Not now'] });
}
/* turning in by hand: the giver answers in their own words */
function questThanks(id) {
  const q = ALLQ[id]; if (!q || !H().quests.done[id] || !q.done) return;
  const line = Array.isArray(q.done) ? q.done[H().faction === 'concord' ? 0 : 1] : q.done;
  SCN.play([[giver(q) + ':happy', line]], null);
}
