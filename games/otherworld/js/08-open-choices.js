'use strict';
/* OW-N1: at least two open choices at every beat (Flint, newcomer round 2). Each beat that could narrow to a single
   clickable option gains one alternative that is always open. They lead to existing scenes and endings, set only
   life flags (which already live inside the save's life object), and never replace or reprice an existing choice. */
const OPEN_CHOICES = {
  a_alone: { t: 'Climb the split oak; let the stampede pass beneath you', go: 'a_alone_live', fx: l => { l.flags.climbed = true; } },
  a_heart: { t: 'Turn from the heart; take the drawn blade back to Lanthorn\'s wall', end: 'e_walls', fx: l => { l.flags.heldWall = true; } },
  h_prepared: { t: 'Teach the neighbors to bank the stove; stay for the first snow', go: 'h_winter', fx: l => { l.flags.bankedStove = true; hearthShift(l, 0, 1, 0); } },
  h_winter: { t: 'Hand out the stores house by house; keep your own fire small', end: 'e_hearth_banked', fx: l => { l.flags.doorToDoor = true; } },
  s_wake: { t: 'Wait at the shutter; learn the street before you take the stair', go: 's_stair', fx: l => { l.flags.watchedStreet = true; } },
  s_dusk: { t: 'Give Kael the keys; walk the last family down to the boats', end: 'e_ash_quay', fx: l => { l.flags.gaveKeys = true; } },
  s_work: { t: 'Carry water up the lower stair for the families waiting there', go: 's_dusk', fx: l => { l.flags.boats = true; l.flags.waterCarried = true; } }
};
for (const [id, c] of Object.entries(OPEN_CHOICES)) {
  const fx = c.fx; c.fx = l => { fx(l); rememberPeople(l); }; c.open = true;
  NODES[id].choices.push(c);
}
appendMemoryLines('a_alone_live', l => has(l, 'climbed') ? [['', 'You wedge yourself in the split oak while the boars thunder below. Nothing was fought, and nothing was named. You only waited, and lived.']] : []);
appendMemoryLines('h_winter', l => has(l, 'bankedStove') ? [['vesper', 'Three houses banked their stoves the way you showed them. That is three fewer doors knocking in the night.']] : []);
appendMemoryLines('s_stair', l => has(l, 'watchedStreet') ? [['', 'From the shutter you counted the guards\' turns. The stair is quieter than it looked.']] : []);
const epilogueBeforeOpen = townEpilogue;
townEpilogue = function (l, id) {
  return [...epilogueBeforeOpen(l, id),
    ...(id === 'e_walls' && has(l, 'heldWall') ? [['', 'You set the Instinct\'s blade against the gate instead of the rot. The Deepwood still aches, but no one in Lanthorn dies tonight.']] : []),
    ...(id === 'e_hearth_banked' && has(l, 'doorToDoor') ? [['', 'Every house in Reedlight has a sack of something with your knot on it.']] : []),
    ...(id === 'e_ash_quay' && has(l, 'gaveKeys') ? [['kael', 'You gave me the keys and carried the child yourself. I will lock nothing with them.']] : [])];
};
