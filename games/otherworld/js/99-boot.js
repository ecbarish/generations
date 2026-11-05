'use strict';
/* Otherworld: startup. Loads the save, then resumes your life where you were, or opens the Between. */
D = Dialogue.create({
  host: document.getElementById('stage'), theme: 'otherworld',
  keys: false,
  get: () => sceneState, set: v => { sceneState = v; },
  cast: who => who === 'me' ? { name: S.name, skin: S.look.skin, hair: 'short', hairCol: S.look.hair, shirt: '#4a4a7a', bg: '#d8d0f0' } : CAST[who] || null,
  fill: t => String(t).replace(/\{name\}/g, (S.life && S.life.name) || S.name || 'traveller'),
  onEnd: () => save()
});
D.el.querySelector('.dlg-continue').textContent = 'Go on';
const skipSpeech = document.createElement('button');
skipSpeech.type = 'button'; skipSpeech.className = 'dlg-skip'; skipSpeech.textContent = 'Skip';
skipSpeech.setAttribute('aria-label', 'Skip the rest of this speech');
skipSpeech.addEventListener('click', e => { e.stopPropagation(); D.skip(); });
D.el.querySelector('.dlg-body').append(skipSpeech);
const goOn = D.el.querySelector('.dlg-continue');
let goHold = 0, goTimer = 0;
const stopGoHold = () => { clearInterval(goTimer); goTimer = 0; };
goOn.addEventListener('pointerdown', () => {
  goHold = performance.now();
  stopGoHold();
  goTimer = setInterval(() => { goHoldTick(performance.now()); }, 80);
});
goOn.addEventListener('pointerup', stopGoHold);
goOn.addEventListener('pointercancel', stopGoHold);
goOn.addEventListener('pointerleave', stopGoHold);
function goHoldTick(now) {
  if (!goHold || now - goHold < 400 || !sceneState || D.el.classList.contains('asking')) return false;
  D.advance();
  return true;
}
const playBeforeRoom = D.play.bind(D);
D.play = (...args) => { const result = playBeforeRoom(...args); placeBelowHud(); refreshGoal(); return result; };
function parkGoOn() {
  const go = D.el.querySelector('.dlg-continue');
  if (!go) return;
  const asking = D.el.classList.contains('asking');
  go.classList.toggle('go-slot', asking);
  if (!asking) return;
  go.hidden = false;
  const choice = document.activeElement && document.activeElement.closest && document.activeElement.closest('.dlg-choices button');
  if (choice) D.el.focus({ preventScroll: true });
}
Settings.create({ mount: '#hudRight', before: '.version-label', btnClass: 'hbtn', rows: [] });
setupFeedback('Otherworld', VERSION, () => S.life ? `${WORLDS[S.life.world].name}, ${S.life.gift}, at ${S.life.at}` : 'The Between');
/* Keep the shared portrait scene, with local locked-choice support. Neither clicks nor keys can select a lock. */
const originalChoose = D.choose.bind(D);
D.choose = i => {
  const choices = sceneState && sceneState.choices && S.life && NODES[S.life.at]?.choices;
  if (choices && (!choices[i] || !choiceReady(choices[i]))) return;
  originalChoose(i);
};
function paintChoiceLocks() {
  const choices = sceneState && sceneState.choices && S.life && NODES[S.life.at]?.choices;
  D.el.querySelectorAll('.dlg-choices button').forEach((button, i) => {
    button.disabled = !!choices && !choiceReady(choices[i]);
    button.setAttribute('aria-disabled', String(button.disabled));
  });
}
for (const method of ['skip', 'advance']) {
  const original = D[method].bind(D);
  D[method] = (...args) => { const result = original(...args); paintChoiceLocks(); parkGoOn(); refreshGoal(); return result; };
}
new MutationObserver(paintChoiceLocks).observe(D.el.querySelector('.dlg-choices'), { childList: true });
document.addEventListener('keydown', e => {
  const hit = e.target && e.target.closest ? e.target : null;
  if (hit?.closest('a, .arc-set-bg, button:not(.dlg-choices button):not(.dlg-continue)')) return;
  if (!sceneState || e.target.matches?.('input,textarea,select') || !panel().hidden) return;
  if (!document.getElementById('status').hidden && hit?.closest('#status')) return;
  if (!document.getElementById('ledger').hidden && hit?.closest('#ledger')) return;
  const asking = D.el.classList.contains('asking');
  if (asking && /^[1-9]$/.test(e.key)) { e.preventDefault(); D.choose(Number(e.key) - 1); }
  else if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest?.('.dlg button')) return; // native focused button wins
    e.preventDefault();
    if (asking) {
      const ready = choicesOf(NODES[S.life.at]).map((c, i) => choiceReady(c) ? i : -1).filter(i => i >= 0);
      if (ready.length === 1) D.choose(ready[0]);
    }
    else D.advance();
  } else if (e.key === 'Escape') { e.preventDefault(); D.skip(); }
});
load();
if (S.life && S.life.ending && ENDINGS[S.life.ending]) finish(S.life.ending);
else if (S.life && NODES[S.life.at]) run(S.life.at); else { S.life = null; toBetween(null, []); }
renderHUD();
/* test hook, local dev server only */
if (location.hostname === 'localhost') window.__ow = { get S() { return S; }, set S(v) { S = v; }, run, finish, begin, choicesOf, NODES, ENDINGS, WORLDS, GIFTS, D, choiceReady, linesOf, prepareLife, townDay, townShift, townView, breadPrice, archivistMemories, save, load, goHoldTick };
