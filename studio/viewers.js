'use strict';
/* Studio creature and quest viewers (E5, Lane C task C2). Read-only.
   Lists Realmbound's quests, and can still flag a creature roster passed in by a check.
   Realmbound's rules match tests/realmbound-scenarios.cjs (quest targets and prerequisites).
   Checks: tests/studio.html. */
(function () {
  const FAMILIES = ['wolf', 'cat', 'boar', 'lizard', 'croc', 'bird', 'spider', 'horse', 'sprite', 'hyena'];
  const STATS = ['grd', 'hp', 'pow', 'spd', 'spi', 'wit'];
  const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

  /* Wildbond (either version): rows for each view, each with its problems in plain words. */
  function wildbond(D) {
    const { SPECIES = {}, MOVES = {}, ELEMENTS = {}, BIOMES = {}, BADGES = {}, STORY = [] } = D, EVOS = D.EVOS || null;
    const names = {}; for (const [id, s] of Object.entries(SPECIES)) (names[String(s.name).toLowerCase()] = names[String(s.name).toLowerCase()] || []).push(id);
    const species = Object.entries(SPECIES).map(([id, s]) => {
      const p = [];
      if (!FAMILIES.includes(s.fam)) p.push(`unknown body family "${s.fam}"`);
      if (!has(ELEMENTS, s.el)) p.push(`unknown element "${s.el}"`);
      for (const [lvl, m] of s.learn || []) { if (!has(MOVES, m)) p.push(`learns a move that doesn't exist: ${m}`); if (!(lvl > 0)) p.push(`move ${m} at level ${lvl}`); }
      if (!(s.learn || []).length) p.push('learns no moves');
      if (s.evo && !has(SPECIES, s.evo.to)) p.push(`evolves into a creature that doesn't exist: ${s.evo.to}`);
      if (!s.dex) p.push('no Wilddex entry');
      const base = s.base || {};
      if (Object.keys(base).sort().join() !== STATS.join() || !Object.values(base).every(n => n > 0)) p.push('base stats need all six, each above 0');
      if ((names[String(s.name).toLowerCase()] || []).length > 1) p.push(`same name as ${names[String(s.name).toLowerCase()].filter(x => x !== id).join(', ')}`);
      const total = Object.values(base).reduce((a, b) => a + (+b || 0), 0);
      return { id, cells: [s.name, s.fam, s.el, total, (s.learn || []).map(([l, m]) => `${l}: ${MOVES[m] ? MOVES[m].name : m}`).join(', '), s.evo ? `${s.evo.to} at ${s.evo.at}` : ''], problems: p };
    });
    const moves = Object.entries(MOVES).map(([id, m]) => {
      const p = []; if (m.el != null && !has(ELEMENTS, m.el)) p.push(`unknown element "${m.el}"`); if (!m.name) p.push('no name');
      if (m.pow != null && !(typeof m.pow === 'number' && m.pow >= 0)) p.push(`power "${m.pow}" is not a number`);
      const users = Object.values(SPECIES).filter(s => (s.learn || []).some(([, x]) => x === id)).length;
      if (!users) p.push('no creature learns it');
      return { id, cells: [m.name, m.el || 'none', m.kind || '', m.pow ?? '', m.cd ?? '', users], problems: p };
    });
    const evolutions = [];
    for (const [id, s] of Object.entries(SPECIES)) {
      const list = EVOS && has(EVOS, id) ? EVOS[id] : s.evo ? [s.evo] : [];
      for (const e of list) {
        const p = []; if (!has(SPECIES, id)) p.push(`starts from a creature that doesn't exist: ${id}`);
        if (!has(SPECIES, e.to)) p.push(`evolves into a creature that doesn't exist: ${e.to}`);
        if (!(e.at > 0)) p.push(`level "${e.at}" is not above 0`);
        if (e.place != null && !has(BIOMES, e.place)) p.push(`place "${e.place}" is not an area with wild creatures`);
        if (e.with != null && !has(SPECIES, e.with)) p.push(`raised with a creature that doesn't exist: ${e.with}`);
        if (e.bond != null && !(e.bond > 0)) p.push(`trust level "${e.bond}" is not above 0`);
        const how = [e.place && `in ${e.place}`, e.bond && `trust ${e.bond}`, e.with && `beside ${e.with}`].filter(Boolean).join(', ');
        evolutions.push({ id: id + '>' + e.to, cells: [SPECIES[id] ? SPECIES[id].name : id, SPECIES[e.to] ? SPECIES[e.to].name : e.to, e.at, how || 'level only', e.hint || ''], problems: p });
      }
    }
    for (const id of Object.keys(EVOS || {})) if (!has(SPECIES, id)) for (const e of EVOS[id]) evolutions.push({ id: id + '>' + e.to, cells: [id, e.to, e.at, '', e.hint || ''], problems: [`starts from a creature that doesn't exist: ${id}`] });
    const wild = [];
    for (const [id, b] of Object.entries(BIOMES)) {
      const table = b.wild || [], sum = table.reduce((a, [, w]) => a + (+w || 0), 0);
      if (b.req && !(has(BADGES, b.req) && STORY.some(s => s.gate === b.req))) wild.push({ id: id + ':req', cells: [b.name || id, '(needs badge)', b.req, '', ''], problems: [`needs badge "${b.req}", which no Warden gives`] });
      for (const [sp, w] of table) {
        const p = []; if (!has(SPECIES, sp)) p.push(`a creature that doesn't exist: ${sp}`); if (!(w > 0)) p.push(`chance weight "${w}" is not above 0`);
        wild.push({ id: id + ':' + sp, cells: [b.name || id, SPECIES[sp] ? SPECIES[sp].name : sp, w, sum ? Math.round(100 * w / sum) + '%' : '', (b.lv || []).join('-')], problems: p });
      }
    }
    return { species, moves, evolutions, wild };
  }
  /* Realmbound quests: the target creature lives in the quest's zone, and the quest before it exists. */
  function realmbound(D) {
    const { QUESTS = {}, ZONES = {} } = D, ids = new Set(Object.values(QUESTS).flat().map(q => q.id)), seen = {};
    const quests = [];
    for (const [zone, qs] of Object.entries(QUESTS)) for (const q of qs) {
      const p = [], z = ZONES[zone];
      if (!z) p.push(`zone "${zone}" doesn't exist`);
      else if (q.mob && !(z.mobs || []).some(m => m.id === q.mob)) p.push(`its target "${q.mob}" doesn't live in ${z.name || zone}`);
      if (q.req && !ids.has(q.req)) p.push(`needs quest "${q.req}", which doesn't exist`);
      if (seen[q.id]) p.push(`the id "${q.id}" is used twice`); seen[q.id] = 1;
      if (!q.name || !q.text) p.push('no name or text');
      quests.push({ id: q.id, cells: [z ? z.name : zone, q.name, q.giver || '', q.type || '', q.mob ? `${q.n || ''} ${q.mob}`.trim() : '', q.lvl ?? '', q.req || ''], problems: p });
    }
    return { quests };
  }
  const COLUMNS = {
    species: ['Name', 'Body', 'Element', 'Base total', 'Moves (level: move)', 'Evolves'], moves: ['Name', 'Element', 'Kind', 'Power', 'Rest', 'Creatures'],
    evolutions: ['From', 'To', 'Level', 'Condition', 'Hint'], wild: ['Area', 'Creature', 'Weight', 'Chance', 'Levels'],
    quests: ['Zone', 'Quest', 'Giver', 'Type', 'Target', 'Level', 'After'] };

  async function load(root) {
    const T = window.StudioText;
    const rb = await T.loadGameData(root, 'games/realmbound/', ['QUESTS', 'ZONES']);
    return { realmbound: realmbound(rb) };
  }
  window.StudioViewers = { FAMILIES, COLUMNS, wildbond, realmbound, load };
})();
