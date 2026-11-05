'use strict';
/* OW-N1: the "Memories carried" ledger. Reads only what the save already holds (S.mem, S.lives) and the game's own
   tables (MEMORIES, ENDINGS, MEMORY_USES), so no save field is added. Open it any time from the corner, or from the
   Choose a world table, to plan which life to live next. */
const endingWorld = id => id.startsWith('e_hearth') ? 'hearthmere' : id.startsWith('e_ash') ? 'ashen' : 'asterhold';
function nodeWorld(id) { return id.startsWith('h_') ? 'hearthmere' : id.startsWith('s_') ? 'ashen' : 'asterhold'; }
function plansFor(memory) {
  const plans = [], seen = new Set();
  for (const [id, n] of Object.entries(NODES)) for (const c of n.choices || []) {
    const tagged = c.memory === memory || (typeof c.need === 'function' && String(c.need).includes('mem.' + memory));
    if (!tagged || typeof c.t !== 'string') continue;
    const key = nodeWorld(id) + '|' + c.t;
    if (seen.has(key)) continue;
    seen.add(key);
    plans.push({ world: nodeWorld(id), title: c.t });
  }
  return plans;
}
function ledgerRows(mem = S.mem, lives = S.lives) {
  const seen = new Set(lives.map(x => x.ending));
  return Object.keys(MEMORIES).map(k => {
    const keptBy = Object.keys(ENDINGS).filter(e => (ENDINGS[e].keep || []).includes(k));
    const uses = MEMORY_USES.filter(u => u.memory === k).map(u => u.world);
    const plain = Object.values(NODES).flatMap(n => n.choices || []).filter(c => !c.memory && c.need && String(c.need).includes('mem.' + k)).length;
    return { id: k, carried: !!mem[k], text: MEMORIES[k], plans: plansFor(k),
      keptBy: keptBy.map(e => ({ id: e, world: endingWorld(e), seen: seen.has(e), title: ENDINGS[e].title })),
      opens: uses.length + plain, worlds: [...new Set(uses)] };
  });
}
function learnSentence(r) {
  const worlds = [...new Set(r.keptBy.map(e => WORLDS[e.world].name))];
  return worlds.length ? `A life in ${worlds.join(' or ')} can teach this, if you reach an ending you have not seen.` : 'A world still being woven can teach this.';
}
function useSentence(r) {
  if (!r.plans.length) return r.opens ? 'Once you carry it, another life can attempt something new.' : '';
  const by = new Map();
  for (const p of r.plans) { if (!by.has(p.world)) by.set(p.world, []); by.get(p.world).push(p.title); }
  return [...by.entries()].map(([w, titles]) => {
    const more = titles.length > 1 ? `, and ${titles.length - 1} more like it` : '';
    return `In ${WORLDS[w].name} you may try “${titles[0]}”${more}.`;
  }).join(' ');
}
function ledgerHTML() {
  const rows = ledgerRows(), have = rows.filter(r => r.carried).length;
  const detail = r => escapeStory(`${r.carried ? '' : learnSentence(r) + ' '}${useSentence(r)}`.trim());
  return `<button class="st-close" data-ledger-close>Put this away</button><div class="st-title">Memories carried</div><div class="st-row"><span>Carried</span><b data-ledger-count>${have} of ${rows.length}</b></div>
    <div class="st-row"><span>Lives lived</span><b>${S.lives.length}</b></div>
    <ul class="ledger">${rows.map(r => r.carried
      ? `<li class="carried" data-memory="${r.id}"><b>✦ ${escapeStory(r.text)}</b><small>${detail(r)}</small></li>`
      : `<li class="unknown" data-memory="${r.id}"><b>◇ Not yet remembered</b><small>${detail(r)}</small></li>`).join('')}</ul>
    <button class="st-close" data-ledger-close>Put this away</button>`;
}
function showLedger() {
  const status = document.getElementById('status'); if (status) status.hidden = true;
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
  p.innerHTML = `Memories carried: <b>${have} of ${rows.length}</b> <button class="chip" data-ledger-open>See what you carry</button>`;
  panel().querySelector('.cards').before(p);
};
