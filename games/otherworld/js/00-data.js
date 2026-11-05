'use strict';
/* Otherworld: the worlds, gifts, people and stories (docs/otherworld-design.md). Data only.
   A story node: { bg, lines (or a function of the life), choices: [{ t, go, need(life), why, fx(life) }], go, end }.
   Lines are [who, text] for shared/dialogue.js; '' is narration; {name} is the player's name. */
const KEY = 'otherworld-save-v1';

/* the people (portrait looks for shared/dialogue.js) */
const CAST = {
  archivist: { name: 'The Archivist', title: 'Keeper of Lives', skin: '#e8d6c2', hair: 'long', hairCol: '#c8c8e8', shirt: '#3a3a6a', bg: '#1d1b3a' },
  bren: { name: 'Old Bren', title: 'Carter', skin: '#d8a882', hair: 'short', hairCol: '#9a9a9a', shirt: '#7a5a3a', bg: '#e8d8b8', beard: '#9a9a9a' },
  hesta: { name: 'Hesta', title: 'Guild Registrar', skin: '#f0c8a8', hair: 'bun', hairCol: '#6a3a2a', shirt: '#4a6a8a', bg: '#d8e4f0' },
  mira: { name: 'Mira', title: 'Apprentice Mage', skin: '#f2cfb0', hair: 'long', hairCol: '#c84a3a', shirt: '#4a3a7a', bg: '#e4dcf4' },
  corvin: { name: 'Corvin', title: 'Merchant', skin: '#d8b090', hair: 'short', hairCol: '#3a2a1a', shirt: '#7a2a2a', bg: '#f0e0c8' },
  voss: { name: 'Guild Master Voss', title: 'Lanthorn Guild', skin: '#c89878', hair: 'short', hairCol: '#5a5a5a', shirt: '#2a3a2a', bg: '#d8d8c8', beard: '#5a5a5a' }
};

/* the worlds the Archivist can offer; built ones have a start node */
const WORLDS = {
  asterhold: { name: 'Asterhold', tone: 'Adventurous fantasy', start: 'a_wake', col: '#e8b84a',
    pitch: 'A frontier town, an adventurers\' guild, and a beast tide coming down from the Deepwood in three days.' },
  hearthmere: { name: 'Hearthmere', tone: 'Cozy slice of life', col: '#7fc8a8',
    pitch: 'A shuttered lakeside inn in a village of spirits, and a long winter that will close the passes.' },
  ashen: { name: 'The Ashen Throne', tone: 'Dark and dramatic', col: '#c85a5a',
    pitch: 'A dying empire, plague bells, and a noble house about to fall, with you inside it.' }
};

/* each world's gifts: a strength with a cost */
const GIFTS = {
  asterhold: {
    appraisal: { name: 'Appraisal', good: 'See the truth of people and things.', cost: 'People can feel you reading them.' },
    pocket: { name: 'Pocket Space', good: 'Carry anything, any size, weightless.', cost: 'Everyone wants you to carry something.' },
    sword: { name: 'Sword Saint\'s Instinct', good: 'Fight like a master from your first day.', cost: 'Once a fight starts, you cannot hold back.' }
  }
};

/* soul memories: knowledge carried from one life to the next */
const MEMORIES = {
  tide: 'The beasts of the Deepwood were running from something, not hunting.',
  oldroot: 'The sick heart of the Deepwood has a name: Oldroot.',
  guildmaster: 'Guild Master Voss planned to let the outer farms fall.',
  lantern: 'Mira\'s lantern charm: a small light that burns away rot.',
  seed: 'A seed from Oldroot, warm as a heartbeat.',
  rootsong: 'The slow song the forest sings to itself.'
};

/* the endings: a title, a feel, and what the soul remembers */
const ENDINGS = {
  e_lantern: { title: 'The Lantern of Lanthorn', feel: 'hopeful', keep: ['lantern', 'oldroot'] },
  e_oldroot: { title: 'The Name in the Roots', feel: 'hopeful', keep: ['oldroot', 'seed'] },
  e_walls: { title: 'The Wall Held', feel: 'bittersweet', keep: ['guildmaster'] },
  e_fell: { title: 'The Felled Keeper', feel: 'bittersweet', keep: ['oldroot'] },
  e_away: { title: 'The Road Out', feel: 'bittersweet', keep: ['guildmaster'] },
  e_forest: { title: 'The Forest Remembers', feel: 'strange', keep: ['oldroot', 'rootsong'], death: true },
  e_death_tide: { title: 'Lost in the Tide', feel: 'death', keep: ['tide'], death: true },
  e_death_root: { title: 'Fallen at the Heart', feel: 'death', keep: ['tide'], death: true }
};

/* ---- Asterhold: one life ---- */
const has = (life, k) => !!life.flags[k];
const NODES = {
  a_wake: { bg: 'road', lines: [
    ['', 'Hay. Sunlight. The creak of a wheel. You are lying in the back of a cart, and you have no idea how you got here.'],
    ['bren', 'Easy there! Found you lying in the road at dawn, not a scratch on you. Fell out of the sky, I reckon.'],
    ['bren', 'Lanthorn\'s just ahead. The guild takes in folk who turn up from nowhere. Happens more than you\'d think.'],
    ['', 'A bell begins to ring in the town ahead: three long tolls, then three more.'],
    ['bren', 'That\'s the tide bell. The beasts are coming down out of the Deepwood. Three days, they say.']], go: 'a_guild' },
  a_guild: { bg: 'guild', status: true, lines: life => [
    ['hesta', 'Name? ... {name}. Another one from nowhere. Hand on the crystal, please.'],
    ['', 'The crystal hums under your palm. Light unfolds into a pale blue window that hangs in the air in front of you, full of words.'],
    ...{ appraisal: [['hesta', 'Appraisal. Oh, wonderful. And don\'t look at me like that, I can feel you reading my age.']],
      pocket: [['hesta', 'Pocket Space! The porters will love you. Saying no is going to be harder than you think.']],
      sword: [['hesta', 'Sword Saint\'s... well. Keep your hands where I can see them, please.']] }[life.gift],
    ['hesta', 'Rank F. Welcome to the guild. With the tide coming, everyone\'s needed.']], go: 'a_mira' },
  a_mira: { bg: 'guild', lines: life => [
    ['mira', 'You! The new one. Are you any good? Never mind, it doesn\'t matter. I need a partner for my rank test and nobody will go with an apprentice.'],
    ['mira', 'The test: find out why the beasts are moving before they get here. The Guild Master says they\'re just hungry. I don\'t believe him.'],
    ...(life.mem.tide ? [['', 'Something stirs in you, a memory that isn\'t from this life: the beasts are running from something.'],
      ['mira', '...How do you know that? You only just got here.']] : []),
    ['corvin', 'Or you could take honest coin. I leave Lanthorn tonight with my wagons and I need a guard. Twenty silver.']],
    fx: life => { if (life.mem.tide) life.flags.truth = true; },
    choices: [
      { t: 'Partner with Mira', go: 'a_tower', fx: life => { life.flags.mira = true; } },
      { t: 'Guard Corvin\'s wagons (twenty silver)', go: 'a_corvin', fx: life => { life.flags.corvin = true; life.silver = 20; } },
      { t: 'Go into the Deepwood alone', go: 'a_alone', fx: life => { life.flags.alone = true; } }] },
  a_tower: { bg: 'tower', lines: life => [
    ['', 'An old watchtower at the edge of the Deepwood. Below it, beasts are streaming out of the trees: wolves, boars, deer, all together.'],
    ['mira', 'They\'re not attacking anything. They\'re just... running.'],
    ...{ appraisal: [['', 'You look closer, and your gift looks with you: fear. Every one of them is afraid of something behind it.']],
      sword: [['', 'A boar breaks from the herd and charges the tower door. Your hands move before you think, and it falls. Mira stares at you. Your hands are shaking.']],
      pocket: [['', 'In the tower\'s storeroom: a crate of old ballista bolts. You slip all of them into your Pocket Space.'], ['mira', 'Where did they... how did you... never mind.']] }[life.gift],
    ['mira', 'Something in the deep forest is frightening them. If the Guild Master knows that, why would he lie?']],
    fx: life => { if (life.gift === 'appraisal') life.flags.truth = true; if (life.gift === 'pocket') life.flags.bolts = true; }, go: 'a_council' },
  a_corvin: { bg: 'road', night: true, lines: [
    ['', 'The wagons roll out at dusk. Corvin pays you half up front, as promised.'],
    ['', 'Past the walls, the outer farms are dark. One still has a light in the window.'],
    ['corvin', 'Don\'t look at me like that. The Guild Master paid me to move the goods out. He\'ll let the farms fall, so the beasts glut themselves before they reach the walls.'],
    ['corvin', 'It\'s not my plan. I\'m just a merchant.'],
    ['', 'Far behind you, through the trees, the Deepwood glows a sick and sullen green.']],
    fx: life => { life.flags.betrayal = true; },
    choices: [
      { t: 'Turn back and warn Lanthorn', go: 'a_council', fx: life => { life.flags.warned = true; } },
      { t: 'Keep riding with Corvin', end: 'e_away' }] },
  a_alone: { bg: 'forest', lines: life => [
    ['', 'The Deepwood swallows the light. Beasts crash past you in the dark, heading out, never in.'],
    ['', 'Ahead, a glow. In a clearing stands something like a tree the size of a hall, its bark split by a black rot. A voice, slow as sap: *it hurts*.'],
    ...(life.gift === 'appraisal' ? [['', 'Your gift reads it before you can stop it: Oldroot, keeper of the Deepwood. Poisoned.']] : []),
    ['', 'The ground shakes. A stampede of boars comes thundering through the clearing, straight at you.']],
    fx: life => { if (life.gift === 'appraisal') life.flags.truth = true; life.flags.saw = true; },
    choices: [
      { t: 'Stand and fight', why: 'You would need the Sword Saint\'s Instinct to stand against a stampede.', need: life => life.gift === 'sword', go: 'a_alone_live', fx: life => { life.flags.swordwalk = true; } },
      { t: 'Call it by its name', why: 'You do not know its name. Appraisal or a memory of Oldroot could tell you.', need: life => life.mem.oldroot || life.gift === 'appraisal', go: 'a_alone_live', fx: life => { life.flags.named = true; } },
      { t: 'Run', end: 'e_death_tide' }] },
  a_alone_live: { bg: 'forest', lines: life => [
    ...(has(life, 'named') ? [['', 'You say its name. The great roots shift, closing around you like cupped hands, and the stampede breaks around them.']]
      : [['', 'You cut a path through the stampede. You don\'t remember choosing to. When it\'s over, you are alone, and the forest is very quiet.']]),
    ['', 'You make it back to Lanthorn by nightfall, covered in bark dust, with something to tell the guild.']], go: 'a_council' },
  a_council: { bg: 'guild', night: true, lines: life => [
    ['voss', 'The walls will hold. We close the gates at dawn and let the outer farms go. They\'re empty anyway.'],
    ...(has(life, 'mira') ? [['mira', 'Empty? The Fennel family is still out there! I saw their lamp!']] : []),
    ...(has(life, 'warned') ? [['', 'You tell the hall what Corvin told you. Voss\'s face doesn\'t change, but his hand closes on the table.']] : []),
    ...(has(life, 'truth') && life.gift === 'appraisal' ? [['', 'Your gift reads Voss: he knows the farms aren\'t empty. He\'s counting on it.']] : [])],
    choices: [
      { t: 'Defend the walls', go: 'a_walls', fx: life => { life.flags.walls = true; } },
      { t: 'Go to the heart of the Deepwood', go: 'a_heart', fx: life => { life.flags.source = true; } },
      { t: 'Expose Voss\'s plan to the hall', why: 'You would need to have seen the truth of Voss, heard Corvin\'s confession, or remembered his plan.', need: life => has(life, 'betrayal') || (has(life, 'truth') && life.gift === 'appraisal') || life.mem.guildmaster,
        go: 'a_exposed', fx: life => { life.flags.exposed = true; } }] },
  a_exposed: { bg: 'guild', night: true, lines: [
    ['', 'You say it plainly: the farms aren\'t empty, and Voss knows it. The hall goes quiet, then loud.'],
    ['hesta', 'Is it true? ... It is. I can see it on him.'],
    ['', 'By midnight, the outer farms are brought in behind the walls, and half the guild follows you to the forest\'s edge.']], go: 'a_heart' },
  a_walls: { bg: 'walls', night: true, lines: life => [
    ['', 'The tide comes at midnight: a river of eyes and backs in the torchlight. The palisade shudders.'],
    ...(has(life, 'bolts') ? [['', 'You empty your Pocket Space onto the wall: a hundred ballista bolts. The archers whoop.']] : []),
    ['', 'The walls hold. By dawn the beasts have turned aside. Beyond the walls, the outer farms are smoke.']], end: 'e_walls' },
  a_heart: { bg: 'heart', night: true, lines: life => [
    ['', 'The heart of the Deepwood. Oldroot rises out of the earth, black rot crawling up its bark, and every beast in the forest circles it, terrified.'],
    ...(has(life, 'mira') ? [['mira', 'It\'s not evil. It\'s sick! I can see the rot moving. If I had more light... my lantern charm burns rot, but it needs someone to hold it close.']] : []),
    ...(life.mem.oldroot ? [['', 'You know this tree. You\'ve stood here before, in another life.']] : [])],
    choices: [
      { t: 'Strike it down', go: 'a_strike' },
      { t: 'Hold Mira\'s lantern to the rot', why: 'Mira would need to be here with her lantern.', need: life => has(life, 'mira'), end: 'e_lantern' },
      { t: 'Call it by its name', why: 'You have not learned Oldroot\'s name in this life or another.', need: life => life.mem.oldroot || has(life, 'named') || (life.gift === 'appraisal' && has(life, 'truth')), end: 'e_oldroot' },
      { t: 'Take the rot into yourself', end: 'e_forest' }] },
  a_strike: { bg: 'heart', night: true, lines: life => life.gift === 'sword' || has(life, 'bolts') || has(life, 'exposed') ? [
    ['', life.gift === 'sword' ? 'Once you begin, you cannot stop. Your blade finds the heart of the rot, and the heart of the tree behind it.' : 'Bolts and blades and the whole guild together: the great tree falls.'],
    ['', 'The beasts scatter. The tide is over. The forest is very, very quiet.']] : [
    ['', 'You strike, and the rot strikes back. Roots close over you. The last thing you hear is the slow song of the forest.']],
    end: life => life.gift === 'sword' || has(life, 'bolts') || has(life, 'exposed') ? 'e_fell' : 'e_death_root' }
};

/* each ending's closing scene */
const EPILOGUES = {
  e_lantern: [['', 'You hold the lantern while Mira speaks the charm. The rot burns away in white light, and Oldroot breathes.'],
    ['mira', 'We did it. We actually did it! Rank D, both of us, and they\'ll have to stop calling me an apprentice.'],
    ['', 'The beasts drift home to the Deepwood. Lanthorn lights every lantern it owns.']],
  e_oldroot: [['', 'You say its name: Oldroot. The great tree stills. The rot loosens, and falls away like old bark.'],
    ['', 'Something drops into your palm: a seed, warm as a heartbeat. The forest exhales, and the tide turns home.']],
  e_walls: [['', 'Lanthorn stands. Voss is thanked for his foresight. Nobody says the Fennels\' name at the feast.'],
    ['', 'You know what he did. You carry it with you, all the way back to the Between.']],
  e_fell: [['', 'Lanthorn is saved. They give you a medal for felling the beast of the Deepwood.'],
    ['', 'The forest grows quieter every year after. The beasts never come home.']],
  e_away: [['', 'You ride until the green glow is gone behind the hills. Corvin pays you the rest, and you never learn what became of Lanthorn.']],
  e_forest: [['', 'You lay your hands on the rot, and it pours into you. It hurts, and then it doesn\'t.'],
    ['', 'Oldroot heals. You become something slower: a part of the forest\'s song, for a while.']],
  e_death_tide: [['', 'The stampede takes you. It is quick.']],
  e_death_root: [['', 'The forest keeps you.']]
};

/* the Between: the Archivist's words */
const BETWEEN = {
  first: [['', 'Light, like a library made of stars. Shelves without walls. Somewhere, pages turning.'],
    ['archivist', 'Ah. You\'re awake. Gently does it.'],
    ['archivist', 'Your old life has ended. I\'m sorry, though I hope it was a kind ending. I keep the record of lives here, and yours isn\'t finished.'],
    ['archivist', 'You may begin again. Choose a world, and I\'ll give you one gift to carry into it. Choose well, or choose boldly; both make good stories.']],
  back: [['archivist', 'Welcome back, {name}. Let me see what you brought me.']],
  died: [['archivist', 'That was sooner than either of us hoped. Death teaches, though. Here is what it taught you.']]
};
