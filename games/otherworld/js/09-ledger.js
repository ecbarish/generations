'use strict';
/* OW-N1: the "Memories carried" ledger. Reads only what the save already holds (S.mem, S.lives) and the game's own
   tables (MEMORIES, ENDINGS, MEMORY_USES), so no save field is added. Open it any time from the corner, or from the
   Choose a world table, to plan which life to live next. */
const endingWorld = id => id.startsWith('e_hearth') ? 'hearthmere' : id.startsWith('e_ash') ? 'ashen' : 'asterhold';
function ledgerRows(mem = S.mem, lives = S.lives) {
  const seen = new Set(lives.map(x => x.ending));
  return Object.keys(MEMORIES).map(k => {
    const keptBy = Object.keys(ENDINGS).filter(e => (ENDINGS[e].keep || []).includes(k));
    const uses = MEMORY_USES.filter(u => u.memory === k).map(u => u.world);
    const plain = Object.values(NODES).flatMap(n => n.choices || []).filter(c => !c.memory && c.need && String(c.need).includes('mem.' + k)).length;
    return { id: k, carried: !!mem[k], text: MEMORIES[k],
      keptBy: keptBy.map(e => ({ id: e, world: endingWorld(e), seen: seen.has(e), title: ENDINGS[e].title })),
      opens: uses.length + plain, worlds: [...new Set(uses)] };
  });
}
function ledgerHTML() {
  const rows = ledgerRows(), have = rows.filter(r => r.carried).length;
  const where = r => r.keptBy.length ? r.keptBy.map(e => e.seen ? `“${e.title}”` : `an unseen ending in ${WORLDS[e.world].name}`)
    .filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'a world still being woven';
  const opens = r => r.opens ? `Opens ${r.opens} choice${r.opens === 1 ? '' : 's'}${r.worlds.length ? ' in ' + r.worlds.map(w => WORLDS[w].name).join(', ') : ''}.` : '';
  return `<div class="st-title">MEMORIES CARRIED</div><div class="st-row"><span>Carried</span><b data-ledger-count>${have} of ${rows.length}</b></div>
    <div class="st-row"><span>Lives lived</span><b>${S.lives.length}</b></div>
    <ul class="ledger">${rows.map(r => r.carried
      ? `<li class="carried" data-memory="${r.id}"><b>✦ ${escapeStory(r.text)}</b><small>${opens(r)}</small></li>`
      : `<li class="unknown" data-memory="${r.id}"><b>◇ Not yet remembered</b><small>Kept by ${escapeStory(where(r))}. ${opens(r)}</small></li>`).join('')}</ul>
    <button class="st-close" data-ledger-close>Close</button>`;
}
function showLedger() {
  const el = document.getElementById('ledger'); el.innerHTML = ledgerHTML(); el.hidden = false;
  el.querySelector('button')?.focus({ preventScroll: true }); el.scrollTop = 0;
}
function hideLedger() { document.getElementById('ledger').hidden = true; document.getElementById('ledgerBtn').focus(); }
(() => {
  const stage = document.getElementById('stage'), sec = document.createElement('section');
  sec.id = 'ledger'; sec.className = 'status ledger-panel'; sec.hidden = true;
  sec.setAttribute('role', 'dialog'); sec.setAttribute('aria-label', 'Memories carried');
  stage.append(sec);
  const btn = document.createElement('button'); btn.id = 'ledgerBtn'; btn.className = 'hbtn'; btn.type = 'button'; btn.textContent = 'Memories';
  btn.setAttribute('aria-label', 'Memories carried between lives');
  document.getElementById('statusBtn').before(btn);
})();
document.addEventListener('click', e => {
  if (e.target.closest?.('#ledgerBtn, [data-ledger-open]')) { e.stopPropagation(); showLedger(); }
  else if (e.target.closest?.('[data-ledger-close]')) { e.stopPropagation(); hideLedger(); }
}, true);
document.addEventListener('keydown', e => {
  if (document.getElementById('ledger').hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); hideLedger(); }
  else if (!e.target.closest?.('#ledger')) e.stopImmediatePropagation();
}, true);
/* the Choose a world table names what you carry, so the ledger is one tap away when you plan a life */
const chooseWorldBeforeLedger = chooseWorld;
chooseWorld = function () {
  chooseWorldBeforeLedger();
  const rows = ledgerRows(), have = rows.filter(r => r.carried).length, p = document.createElement('p');
  p.className = 'sub ledger-line';
  p.innerHTML = `Memories carried: <b>${have} of ${rows.length}</b> <button class="chip" data-ledger-open>See the ledger</button>`;
  panel().querySelector('.cards').before(p);
};
