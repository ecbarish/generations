'use strict';
/* Otherworld: state, saves, the story runner, the Between (choose a world, a gift, a name and look), the status
   window, endings, soul memories and rebirth (by choice after an ending, or on death). docs/otherworld-design.md */
const VERSION = '0.4.0';
const STORY_NAMES = ['Ren', 'Aki', 'Sora', 'Kai', 'Yuna', 'Haru'];
const HAIR = ['#2a1a12', '#7a4a2a', '#d8b06a', '#c84a3a', '#e8e8f0', '#4a5aa8'];
const SKIN = ['#f6d8c0', '#f1c9a0', '#d8a882', '#a8744e', '#7a4a2e'];

function fresh() { return { v: 1, name: '', look: { hair: HAIR[0], skin: SKIN[1] }, mem: {}, lives: [], life: null, met: false }; }
let S = fresh();
Arcade.validators[KEY] = o => !!(o && Array.isArray(o.lives) && o.mem && typeof o.mem === 'object');
function load() {
  const o = Arcade.load(KEY); if (!o || !Arcade.validators[KEY](o)) return;
  S = Object.assign(fresh(), o); S.look = Object.assign(fresh().look, o.look || {});
  if (S.life) prepareLife(S.life, true);
}
function save() {
  Arcade.save(KEY, S);
  const n = S.lives.length, l = S.life;
  Arcade.report('otherworld', { summary: l ? `${l.name} in ${WORLDS[l.world].name}` : n ? `${n} ${n === 1 ? 'life' : 'lives'} lived` : 'Waiting in the Between',
    detail: `${Object.keys(S.mem).length} soul memories · ${n} ending${n === 1 ? '' : 's'} seen` });
}

/* ---------------------------------------------------------------- the story runner */
let D = null, sceneState = null;
function linesOf(n) { return typeof n.lines === 'function' ? n.lines(S.life) : n.lines || []; }
function choicesOf(n) { return n.choices || []; }
function choiceReady(c, life = S.life) { return !!c && !!life && (!c.need || !!c.need(life)); }
function storyNext(next, life) { return typeof next === 'function' ? next(life) : next; }
const escapeStory = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function choiceLabel(c, life) {
  const title = typeof c.t === 'function' ? c.t(life) : c.t;
  return escapeStory(title) + (!choiceReady(c, life) ? '<span class="choice-why">' + escapeStory(typeof c.why === 'function' ? c.why(life) : c.why) + '</span>' : '');
}
function run(id) {
  D.el.querySelector('[data-between-shortcut]')?.remove();
  const n = NODES[id], life = S.life; if (!n || !life) return;
  prepareLife(life);
  life.at = id;
  if (!life.entered[id]) { if (n.fx) n.fx(life); life.entered[id] = true; }
  setScene(n.bg, !!n.night);
  if (n.status) life.status = true;
  save(); renderHUD();
  const avail = choicesOf(n);
  if (n.status) showStatus();
  D.play(linesOf(n), i => {
    if (S.life !== life || life.at !== id) return;
    if (avail.length) {
      const c = avail[i || 0];
      if (!c || !choiceReady(c, life)) { run(id); return; }
      if (c.fx) c.fx(life);
      if (c.end) finish(c.end); else run(storyNext(c.go, life));
    }
    else if (n.end) finish(typeof n.end === 'function' ? n.end(life) : n.end);
    else run(storyNext(n.go, life));
  }, avail.length ? { choices: avail.map(c => choiceLabel(c, life)) } : undefined);
}
/* an ending: its scene, then the soul keeps what the ending gives, and you return to the Between */
function finish(endId) {
  const e = ENDINGS[endId], life = S.life;
  if (!e || !life) return;
  life.ending = endId; save();
  D.play([...endingLines(life, endId), ...townEpilogue(life, endId)], () => {
    if (S.life !== life) return;
    const learned = e.keep.filter(k => !S.mem[k]);
    for (const k of e.keep) S.mem[k] = true;
    S.lives.push({ world: life.world, gift: life.gift, name: life.name, ending: endId, at: Date.now() });
    S.life = null; save();
    toBetween(e, learned);
  });
}

/* ---------------------------------------------------------------- the Between */
function toBetween(ending, learned) {
  setScene('between', false); renderHUD();
  const lines = !ending ? (S.met ? BETWEEN.back : BETWEEN.first) : (ending.death ? BETWEEN.died : BETWEEN.back).slice();
  if (ending) {
    lines.push(['archivist', `"${ending.title}". ${{ hopeful: 'A good ending. I like that one.', bittersweet: 'Not every story ends warmly. It was still yours.', strange: 'Now that is one I haven\'t filed before.', death: 'A short chapter. They count too.' }[ending.feel]}`]);
    if (learned.length) lines.push(['archivist', 'Your soul keeps this, into every life to come: ' + learned.map(k => MEMORIES[k]).join(' ')]);
    else lines.push(['archivist', 'Nothing new for your soul this time, but you\'ll carry what you already know.']);
  }
  lines.push(...archivistMemories(S.mem));
  S.met = true; save();
  D.el.querySelector('[data-between-shortcut]')?.remove();
  D.play(lines, () => { D.el.querySelector('[data-between-shortcut]')?.remove(); chooseWorld(); });
  if (!ending) {
    const intro = sceneState, shortcut = document.createElement('button');
    shortcut.type = 'button'; shortcut.className = 'hbtn between-shortcut';
    shortcut.dataset.betweenShortcut = ''; shortcut.textContent = 'Choose a world';
    shortcut.setAttribute('aria-label', 'Skip the introduction and choose a world');
    shortcut.addEventListener('click', e => {
      e.stopPropagation();
      if (sceneState === intro && !S.life && panel().hidden) D.skip();
    });
    D.el.querySelector('.dlg-body').append(shortcut);
  }
}
const panel = () => document.getElementById('choose');
function overlay(html) { const p = panel(); p.innerHTML = html; p.hidden = false; p.setAttribute('role','dialog'); p.setAttribute('aria-label',p.querySelector('h2')?.textContent || 'Choose your life'); p.querySelector('button:not([disabled])')?.focus(); }
function chooseWorld() {
  overlay(`<h2>Choose a world</h2><p class="sub">The Archivist spreads three lives across the table, each a different kind of story.</p><div class="cards">` +
    Object.entries(WORLDS).map(([id, w]) => `<button class="card" data-world="${id}" ${w.start ? '' : 'disabled'} style="--c:${w.col}">
      <b>${w.name}</b><i>${w.tone}</i><span>${w.pitch}</span>${w.start ? '' : '<em>This world\'s thread is still being woven.</em>'}</button>`).join('') + '</div>');
}
function chooseGift(world) {
  overlay(`<h2>${WORLDS[world].name}: choose your gift</h2><p class="sub">Every gift is a strength, and every strength costs something.</p><div class="cards">` +
    Object.entries(GIFTS[world]).map(([id, g]) => `<button class="card" data-gift="${id}" data-w="${world}" style="--c:${WORLDS[world].col}">
      <b>${g.name}</b><span>${g.good}</span><span class="cost">Cost: ${g.cost}</span></button>`).join('') + '</div>');
}
function chooseSelf(world, gift) {
  const sw = (list, cur, kind) => list.map(c => `<button class="swatch${c === cur ? ' on' : ''}" data-${kind}="${c}" style="background:${c}" aria-label="${kind} ${c}"></button>`).join('');
  overlay(`<h2>Who will you be?</h2><p class="sub">A new name, or the one you've carried before.</p>
    <div class="row"><input id="pname" maxlength="16" value="${S.name || ''}" placeholder="Your name" aria-label="Your name">
      ${STORY_NAMES.map(n => `<button class="chip" data-pick="${n}">${n}</button>`).join('')}</div>
    <div class="row"><span class="lbl">Hair</span>${sw(HAIR, S.look.hair, 'hair')}</div>
    <div class="row"><span class="lbl">Skin</span>${sw(SKIN, S.look.skin, 'skin')}</div>
    <div class="row end"><button class="go" data-begin="${world}" data-gift="${gift}">Be born in ${WORLDS[world].name}</button></div>`);
}
function begin(world, gift) {
  S.name = (document.getElementById('pname').value || '').trim().replace(/[<>&"]/g, '').slice(0, 16) || STORY_NAMES[0];
  S.life = { world, gift, name: S.name, flags: {}, at: WORLDS[world].start, silver: 0, status: false, mem: Object.assign({}, S.mem) };
  prepareLife(S.life);
  panel().hidden = true; save();
  D.play([['archivist', `${WORLDS[world].name}, then, with ${GIFTS[world][gift].name}. Live it well, {name}. Bring me back a good story.`]], () => run(WORLDS[world].start));
}
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !panel().contains(b)) return;
  if (b.dataset.world) chooseGift(b.dataset.world);
  else if (b.dataset.begin) begin(b.dataset.begin, b.dataset.gift);
  else if (b.dataset.gift) chooseSelf(b.dataset.w, b.dataset.gift);
  else if (b.dataset.pick) document.getElementById('pname').value = b.dataset.pick;
  else if (b.dataset.hair || b.dataset.skin) {
    if (b.dataset.hair) S.look.hair = b.dataset.hair; else S.look.skin = b.dataset.skin;
    b.parentNode.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === b));
  }
});

/* ---------------------------------------------------------------- the status window (Asterhold shows it) */
function showStatus() {
  const l = S.life; if (!l) return; const g = GIFTS[l.world][l.gift];
  const el = document.getElementById('status');
  el.innerHTML = `<div class="st-title">STATUS</div><div class="st-row"><span>Name</span><b>${l.name}</b></div>
    <div class="st-row"><span>Race</span><b>Human</b></div><div class="st-row"><span>Title</span><b>Otherworlder</b></div>
    <div class="st-row"><span>Guild rank</span><b>F</b></div><div class="st-row"><span>Gift</span><b>${g.name}</b></div>
    <div class="st-note">${g.good}<br><i>${g.cost}</i></div>${l.silver ? `<div class="st-row"><span>Silver</span><b>${l.silver}</b></div>` : ''}
    ${Object.keys(S.mem).length ? `<div class="st-note">Soul memories: ${Object.keys(S.mem).length}</div>` : ''}<button class="st-close" data-close>Close</button>`;
  el.hidden = false; el.querySelector('button')?.focus();
}
document.addEventListener('click', e => { if (e.target.closest('#status [data-close]')) { document.getElementById('status').hidden = true; if (sceneState) D.el.focus(); else document.getElementById('statusBtn').focus(); } if (e.target.closest('#statusBtn')) showStatus(); });

/* ---------------------------------------------------------------- the corner of the screen */
function renderHUD() {
  const l = S.life;
  document.getElementById('where').textContent = l ? `${WORLDS[l.world].name} · Life ${S.lives.length + 1}` : 'The Between';
  document.getElementById('statusBtn').hidden = !(l && l.status);
}
