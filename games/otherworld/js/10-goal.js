'use strict';
/* OW-FINISH: one goal stays on the screen, in the world's own words, for every beat of a life. */
const LIFE_GOALS = {
  a_wake: 'The tide bell is ringing. Ride into Lanthorn and learn what it means.',
  a_guild: 'Give Hesta your name. The crystal will show your gift.',
  a_mira: 'Choose who faces the tide with you: Mira, Corvin, or the Deepwood alone.',
  a_market: 'Help the market, or keep your silver. The road you chose is still waiting.',
  a_pocket_job: 'Corvin wants your Pocket Space. Carry the crate, pay him off, or work until dusk.',
  a_departure: 'Leave the market. Go and learn why the beasts are running.',
  a_tower: 'Watch the beasts with Mira, then bring what you saw back to Lanthorn.',
  a_corvin: 'The Guild Master means to abandon the farms. Warn Lanthorn, or ride on.',
  a_alone: 'The stampede is here. Fight if you can, speak a name you know, or run.',
  a_alone_live: 'You lived through the stampede. Tell Lanthorn what the Deepwood showed you.',
  a_return_market: 'One night remains. Help the square, then go to the council.',
  a_last_market: 'Hesta is calling the council. Go in. One night remains.',
  a_council: 'The tide comes at dawn. Defend the walls, seek the heart, or speak what you know.',
  a_exposed: 'The hall has heard you. Go to the heart of the Deepwood.',
  a_walls: 'Hold Lanthorn\'s wall until dawn.',
  a_heart: 'Oldroot is sick, and the beasts are afraid. Choose what you do with the rot.',
  a_strike: 'The blow is struck. Listen for how this life ends.',
  h_key: 'You hold the key to the Reedlight Inn. Three mornings remain before the snow.',
  h_threshold: 'Open the inn, mend one warm room, or wait until you trust the well.',
  h_well: 'Something lives in the well. Leave a cup, listen, or draw water for the kitchen.',
  h_gift: 'Your gift has touched the inn. See what it changed, and what it cost.',
  h_morning: 'The second morning. Decide what the inn can still do before the pass closes.',
  h_prep: 'Choose one job you can finish today. Vesper will take the other end.',
  h_spring: 'Puddle brought you to the warm spring. Invite it, promise to stay, or return with water.',
  h_pack: 'The last lantern can still cross the pass. Pack, or stay with the inn.',
  h_prepared: 'The snow is close. Stay for a last meal, or leave while the upper road is open.',
  h_winter: 'Winter has arrived. Keep the table, keep one ember, or walk the pass.',
  s_wake: 'House Ardel is waking under the bells. Take the west stair, or learn the street first.',
  s_stair: 'Families are at the door. Help Kael, ask Lady Isera, or follow the steward.',
  s_permission: 'Lady Isera has opened the lower rooms. Help carry the beds.',
  s_gift: 'Your gift is awake in this house. See what it asks of you, then go on.',
  s_square: 'The quay bells are a warning. Stand with the store, the seal, or the boats.',
  s_closed: 'The upper passage is closing. Remember what the bell was trying to say.',
  s_store: 'The cold store is full while the house is hungry. Choose who receives the grain.',
  s_seal: 'The rooms are kept, and the lower door is shut. There is still a way to help.',
  s_record: 'The seals are where people can read them. There is still work before dusk.',
  s_boats: 'The boats can take the families across. Count the people, then go on.',
  s_work: 'One task before dusk. Work beside someone, guide the families, or keep a light.',
  s_dusk: 'The crest is coming down. Choose what this house keeps.'
};

function roadWaiting(life) {
  if (life.flags && life.flags.mira) return ' Mira is waiting by the gate.';
  if (life.flags && life.flags.corvin) return ' Corvin\'s wagons leave at dusk.';
  if (life.flags && life.flags.alone) return ' The Deepwood is still ahead of you.';
  return '';
}
function currentGoalText() {
  const life = S.life;
  if (life && life.ending && ENDINGS[life.ending]) {
    return ENDINGS[life.ending].death
      ? 'This life is ending. Listen. Death still has something to teach.'
      : 'This life is ending. Listen, then return to the Between.';
  }
  if (life) {
    let text = LIFE_GOALS[life.at] || (WORLDS[life.world] ? `Live this day in ${WORLDS[life.world].name}.` : 'Choose your next step.');
    if (life.at === 'a_market' || life.at === 'a_pocket_job' || life.at === 'a_departure') text += roadWaiting(life);
    return text;
  }
  if (!panel().hidden) {
    const heading = panel().querySelector('h2')?.textContent || '';
    if (/gift/i.test(heading)) return 'Choose a gift. It will help you, and it will cost you.';
    if (/Who will you be/i.test(heading)) return 'Name yourself, then be born.';
    return 'Choose one world for this life. The others can wait.';
  }
  return 'Listen to the Archivist, or choose a world when you are ready.';
}
function placeBelowHud() {
  const hud = document.querySelector('.hud');
  if (hud) document.documentElement.style.setProperty('--ow-below-hud', (Math.ceil(hud.getBoundingClientRect().height) + 8) + 'px');
  const dlg = document.querySelector('.dlg.dlg-otherworld');
  const reserve = dlg && !dlg.hidden && dlg.getClientRects().length
    ? Math.max(8, Math.ceil(innerHeight - dlg.getBoundingClientRect().top + 8))
    : 12;
  document.documentElement.style.setProperty('--ow-above-dlg', reserve + 'px');
}
function refreshGoal() {
  const el = document.getElementById('goal');
  if (!el) return;
  el.textContent = currentGoalText();
  placeBelowHud();
}
const renderHUDBeforeGoal = renderHUD;
renderHUD = function () { renderHUDBeforeGoal(); refreshGoal(); };
const overlayBeforeGoal = overlay;
overlay = function (html) { overlayBeforeGoal(html); refreshGoal(); };
const finishBeforeGoal = finish;
finish = function (endId) { finishBeforeGoal(endId); refreshGoal(); };
const beginBeforeGoal = begin;
begin = function (world, gift) { beginBeforeGoal(world, gift); refreshGoal(); };
addEventListener('resize', placeBelowHud);
/* Short landscape docks the dialogue beside the crystal. That dock is only for an open reading window. */
function syncReading() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const status = document.getElementById('status'), ledger = document.getElementById('ledger');
  stage.classList.toggle('reading', !!(status && !status.hidden) || !!(ledger && !ledger.hidden));
}
for (const id of ['status', 'ledger']) {
  const el = document.getElementById(id);
  if (el) new MutationObserver(syncReading).observe(el, { attributes: true, attributeFilter: ['hidden'] });
}
syncReading();
