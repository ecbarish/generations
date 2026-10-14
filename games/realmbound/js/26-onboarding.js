'use strict';
/* L4/V1: optional guidance for new heroes only. Existing combat, quests and earned addons are authoritative.
   Legacy heroes have onboarding:null; replaying their arrival is read-only. Only arrival pauses combat. */
let ARRIVAL_HERO = null;
function roadState(h) {
  const o = h && h.onboarding;
  return o && typeof o === 'object' && !Array.isArray(o) && o.hints && typeof o.hints === 'object' && !Array.isArray(o.hints) ? o : null;
}
function arrivalPaused() { return !!(RTALK && H() && ARRIVAL_HERO === H().id); }
function clearArrival() { if (ARRIVAL_HERO !== null) { RTALK = null; SCN.el.hidden = true; ARRIVAL_HERO = null; } }
function firstErrand(h) { return QUESTS[FACTIONS[h.faction].start][0]; }
function beginArrival(replay) {
  const h = H(); if (!h || RTALK || modalKind) return;
  const o = roadState(h); if (!replay && (!o || o.arrival !== false)) return;
  const q = firstErrand(h); if (!replay && !h.quests.active.includes(q.id)) return;
  const home = ZONES[FACTIONS[h.faction].start].name;
  ARRIVAL_HERO = h.id;
  SCN.play([
    ['@The Sundered Reach', 'Before the roads broke, a traveler counted the Reach by the fires where they could sleep.'],
    ['@The Sundered Reach', 'Stone roads in the west. Witnessed promises on the steppe. Different ways to keep a neighbor safe.'],
    ['@' + home, 'Your road begins with a small request. Someone is waiting for help.'],
    [giver(q), q.text],
    ['@The first errand', replay ? 'That is where this road began. Your present quests and progress are unchanged.' : q.name + ' is already in your Quests. Look for its target, start each fight yourself, then meet the giver in town to choose a reward.' + (h.zone==='thornvale'?' You can carry three requests together. Deputy Rhea has two jobs in the old mine; find her through your Quest Journal.':'')]
  ], () => {
    ARRIVAL_HERO = null;
    if (!replay && o) { o.arrival = true; if (H() === h) save(); }
    if (H() && C) { updateWorld(); renderRoadGuide(); }
    const focus = document.activeElement;
    if (focus && focus.blur && focus.closest && focus.closest('#modal,[hidden]')) focus.blur();
  });
  renderRoadGuide();
}
function roadAction() {
  const a = bar().find(a => canUse(a, true));
  if (a) return 'Try ' + a.name + ' (' + (bar().indexOf(a) + 1) + '). It uses ' + a.cost() + ' ' + CLASSES[H().cls].res + '.';
  const a0 = bar().find(a => knows(a.id) && !a.react && (!a.cond || a.cond()));
  if (C.cast) return 'Your cast is underway. Let it finish before giving another order.';
  if (a0 && C.res < a0.cost()) return CLASSES[H().cls].res === 'rage' ? 'Rage builds as blows land. Let the first exchange build enough for ' + a0.name + '; it needs ' + a0.cost() + ' rage.' : 'Wait for enough ' + CLASSES[H().cls].res + ' for ' + a0.name + ' (' + a0.cost() + ').';
  return 'Wait for your ability to become ready. Lit buttons show available actions; their tooltips explain conditions.';
}
function roadHint() {
  const h = H(), o = roadState(h); if (!h || !C || !o || !o.arrival || arrivalPaused() || h.dun || RTALK) return null;
  const q = firstErrand(h), state = qState(q), show = (id, title, text, tab) => o.hints[id] ? null : {id,title,text,tab};
  if (C.phase === 'dead') return show('recovery', 'The road continues', 'Your hero recovers after a defeat. Nothing in this guide requires a perfect start; your quest progress stays with you.');
  if (state === 'ready') return show('reward', 'Bring the errand home', 'The objective is ready, but the errand is not finished. Open Quests and choose one reward. It goes into Bags, not straight onto your character. A full bag? Sell an item or visit the smith first.', 'quests');
  if (C.phase === 'loot' && C.loot && !h.stats.loots) return show('loot', 'Something for the road', 'Press Loot all or L when you are ready. Money is collected and items go into your Satchel if there is room; the rest waits for you. AutoLoot is earned after 60 manual loots; it is not on yet.');
  if (C.phase === 'intown') return show('town', 'A fire to come back to', 'Walk with arrows or WASD, or tap the ground. Walk into the inn or longhouse for rest, or the smith to sell junk and repair if you can afford it. Repairs are optional. Walk to the gate, or use Leave town, to return.');
  if ((state !== 'done' || o.hints.home) && h.stats.loots && !h.stats.equips && h.bags.some(i => !i.junk && !i.food && !i.mountItem)) {
    const hint = show('bags', 'Finding is not equipping', 'Open Bags to inspect what you found. Your class can only wear suitable gear; compare it with the current item before choosing Equip. Junk can be sold in town.', 'bags'); if (hint) return hint;
  }
  if (state === 'done') { const hint = show('home', 'A moment at home', 'Your first request is finished. Between fights, use Town to head home. There is a free rest at the inn or longhouse, and a smith for junk and repairs. You can also choose your next request in Quests.'); if (hint) return hint; }
  const n = C.enc && npcOf(C.enc.id) || (C.party[0] && C.party[0].n);
  if (n) return show('companion', n.name + ', a fellow traveler', n.name + ' is a ' + ROLE_NAME[roleOf(n)].toLowerCase() + '. ' + ({tank:'They can draw attacks away from others.',heal:'They can mend the party when someone is hurt.',dps:'They help bring enemies down.'}[roleOf(n)] || 'They fight alongside you.') + ' Wave or help when offered; Invite to group asks them to join. Strangers may decline or leave later. Friendship grows by sharing the road; you still give your own orders.', 'friends');
  if (C.phase === 'fight' && !h.stats.manual) return show('fight', 'Your first deliberate action', roadAction() + ' Choose Fight or an ability to start. Basic attacks follow while you play; ten seconds without combat input pauses the encounter, including enemies and companions. There is no idle takeover. Active Focus kills earn 10% extra XP.');
  if(h.zone==='thornvale'&&h.quests.active.length<3&&['t2','t3'].some(id=>qState(ALLQ[id])==='avail')) {
    const hint=show('thornvaleRequests','More to do on one road','You can carry three requests together. Deputy Rhea needs candles recovered and Diggers driven from the old mine. Both requests can progress on the same hunt. Open your Quest Journal to find her in Thornvale Abbey.','quests');if(hint)return hint;
  }
  return null;
}
/* The shared presenter never reads or writes a hero. These labels describe existing actions only. */
const ROAD_GOALS = {
  recovery:'Recover and keep your progress.', reward:'Return your finished request.', loot:'Collect what you found.',
  town:'Rest, trade, or choose your next road.', bags:'Compare the gear in your Satchel.',
  home:'Choose another request.', companion:'Meet your fellow traveler.', fight:'Choose your next combat action.',
  thornvaleRequests:'Ask Deputy Rhea about the mine.'
};
function roadInputHint(hint) {
  if (hint.id === 'town') return {keyboard:'Put away this note, then walk with arrows or WASD. Enter talks to someone nearby.',touch:'Put away this note, then tap the ground to walk or a person to approach and talk.'};
  if (hint.id === 'fight') return {keyboard:'Put away this note, then press a lit ability’s number or choose Fight.',touch:'Put away this note, then tap a lit ability or the Fight button.'};
  if (hint.id === 'loot') return {keyboard:'Put away this note, then press L or choose Loot all when you are ready.',touch:'Put away this note, then tap Loot all when you are ready.'};
  if (hint.tab === 'bags') return {keyboard:'Choose Open bags below. B opens the Satchel from the world; Esc puts it away.',touch:'Tap Open bags below. Tap Put away to return.'};
  if (hint.tab === 'quests') return {keyboard:'Choose Open quests below. J opens the Quest Journal from the world; Esc puts it away.',touch:'Tap Open quests below. Tap Put away to return.'};
  return {keyboard:'Esc puts this note away. Your actions remain yours to choose.',touch:'Tap Put away to return to the world. Take your time.'};
}
let ROAD_PRESENTER = null;
function renderRoadGuide() {
  const controls = $('#arrivalControls'); if (controls) controls.hidden = !arrivalPaused();
  const el = $('#roadGuide'); if (!el) return;
  if (!ROAD_PRESENTER) {
    ROAD_PRESENTER = ArcadeOnboarding.create({element:el,
      onDismiss:id => { const o = roadState(H()); if (o) { o.hints[id] = true; save(); renderRoadGuide(); if (typeof FIELD_BOOK !== 'undefined' && FIELD_BOOK === 'road') { const target = el.hidden ? $('#fieldPutAway') : el.querySelector('.onboarding-dismiss'); if (target) target.focus(); } } },
      onAction:tab => { if (typeof openRealmNotebook === 'function') openRealmNotebook(tab, FIELD_OPENER || $('#fieldDock [data-field-book="road"]')); }
    });
  }
  const hint = roadHint();
  ROAD_PRESENTER.update(hint ? {id:hint.id,title:hint.title,text:hint.text,goal:ROAD_GOALS[hint.id] || hint.title,
    inputs:roadInputHint(hint),
    orientation:{portrait:'You can turn your phone sideways for a wider view. Portrait play still works.'},
    actions:hint.tab ? [{id:hint.tab,label:'Open ' + hint.tab[0].toUpperCase() + hint.tab.slice(1)}] : []} : null);
  // Reuse the existing Road note control, with no new overlay over walking or dialogue.
  const opener = $('#fieldDock [data-field-book="road"]');
  if (opener) {
    let next = $('#roadNextGoal');
    if (!next) { next = document.createElement('span'); next.id = 'roadNextGoal'; opener.append(next); }
    const visible = !!hint && !RTALK && !modalKind;
    next.hidden = !visible; next.textContent = visible ? ROAD_GOALS[hint.id] || hint.title : '';
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-road]'); if (!b) return;
  if (b.dataset.road === 'advance') { if (arrivalPaused()) SCN.advance(); return; }
  if (b.dataset.road === 'skip') { if (arrivalPaused()) SCN.skip(); return; }
  if (b.dataset.road === 'replay') { beginArrival(true); return; }
  if (b.dataset.road === 'reset') { const h = H(); if (h) { const o = roadState(h) || (h.onboarding = {arrival:true,hints:{}}); o.hints = {}; save(); renderRoadGuide(); } return; }
  if (b.dataset.road === 'dismiss') { const o = roadState(H()); if (o) { o.hints[b.dataset.hint] = true; save(); renderRoadGuide(); } }
});
