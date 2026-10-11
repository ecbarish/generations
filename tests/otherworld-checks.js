/* Otherworld checks: every path through every built world reaches an ending, for every gift and every set of soul
   memories; the save, rebirth and memories behave as the design promises. Runs inside the game page (iframe). */
function otherworldChecks() {
  const ow = window.__ow, out = [];
  const check = (label, fn) => { try { out.push({ ok: !!fn(), label }); } catch (e) { out.push({ ok: false, label: label + ' (' + e.message + ')' }); } };
  const clone = l => JSON.parse(JSON.stringify(l));
  // walk every branch: returns { endings: Set, problems: [] }
  function explore(world, gift, mem, town) {
    const endings = new Set(), problems = [], reachableChoices = new Set();
    const life0 = { world, gift, name: 'Test', flags: {}, at: WORLDS[world].start, silver: 0, status: false, mem, ...(town ? { town: { ...town } } : {}) };
    const stack = [[WORLDS[world].start, life0, 0]];
    while (stack.length) {
      const [id, life, depth] = stack.pop(), n = NODES[id];
      if (!n) { problems.push('missing node ' + id); continue; }
      if (depth > 40) { problems.push('loop at ' + id); continue; }
      ow.prepareLife(life); life.at = id; if (!life.entered[id]) { if (n.fx) n.fx(life); life.entered[id] = true; }
      const lines = typeof n.lines === 'function' ? n.lines(life) : n.lines;
      if (!Array.isArray(lines) || lines.some(l => !Array.isArray(l) || typeof l[1] !== 'string')) problems.push('bad lines at ' + id);
      const avail = (n.choices || []).filter(c => !c.need || c.need(life));
      if (n.choices && !avail.length) problems.push('no choice available at ' + id);
      if (avail.length) for (const c of avail) { reachableChoices.add(c); const l2 = clone(life); l2.mem = life.mem; if (c.fx) c.fx(l2);
        if (c.end) endings.add(c.end); else stack.push([typeof c.go === 'function' ? c.go(l2) : c.go, l2, depth + 1]); }
      else if (n.end) endings.add(typeof n.end === 'function' ? n.end(life) : n.end);
      else if (n.go) stack.push([typeof n.go === 'function' ? n.go(life) : n.go, life, depth + 1]);
      else problems.push('dead end at ' + id);
    }
    return { endings, problems, reachableChoices };
  }
  const built = Object.keys(WORLDS).filter(w => WORLDS[w].start);
  const memSets = [{}, { tide: true }, { oldroot: true }, { guildmaster: true }, Object.fromEntries(Object.keys(MEMORIES).map(k => [k, true]))];
  for (const w of built) for (const g of Object.keys(GIFTS[w])) for (const m of memSets) {
    const r = explore(w, g, m);
    check(`${WORLDS[w].name}, ${GIFTS[w][g].name}, memories [${Object.keys(m).join(',') || 'none'}]: every path reaches an ending`, () => !r.problems.length && r.endings.size > 0 || (() => { throw Error(r.problems.slice(0, 3).join('; ')); })());
    check(`${WORLDS[w].name}, ${GIFTS[w][g].name}, memories [${Object.keys(m).join(',') || 'none'}]: endings are real and have epilogues`, () => [...r.endings].every(e => ENDINGS[e] && EPILOGUES[e]));
  }
  check('every ending can be reached by some gift and memories', () => {
    const all = new Set(); for (const w of built) for (const g of Object.keys(GIFTS[w])) for (const m of memSets) explore(w, g, m).endings.forEach(e => all.add(e));
    const missing = Object.keys(ENDINGS).filter(e => !all.has(e)); if (missing.length) throw Error('unreachable: ' + missing.join(', ')); return true;
  });
  check('at least three kinds of ending per world (hopeful, bittersweet, strange or death)', () => new Set(Object.values(ENDINGS).map(e => e.feel)).size >= 3);
  check('every ending\'s memories exist', () => Object.values(ENDINGS).every(e => e.keep.every(k => MEMORIES[k])));
  check('every world offers three gifts, each with a strength and a cost', () => built.every(w => Object.values(GIFTS[w]).length === 3 && Object.values(GIFTS[w]).every(g => g.good && g.cost)));
  check('a memory from a past life opens a new choice (Oldroot\'s name)', () => {
    const fresh = explore('asterhold', 'pocket', {}).endings, wise = explore('asterhold', 'pocket', { oldroot: true }).endings;
    return !fresh.has('e_oldroot') && wise.has('e_oldroot');
  });
  check('finishing a life keeps the ending\'s memories, records the life and returns to the Between', () => {
    const keep = JSON.stringify(ow.S);
    try { ow.S = Object.assign(JSON.parse(keep), { mem: {}, lives: [], life: { world: 'asterhold', gift: 'sword', name: 'T', flags: {}, at: 'a_heart', silver: 0, status: true, mem: {} } });
      ow.finish('e_fell'); ow.D.skip(); for (let i = 0; i < 20; i++) ow.D.advance();
      return ow.S.mem.oldroot && ow.S.lives.length === 1 && ow.S.lives[0].ending === 'e_fell' && ow.S.life === null; }
    finally { ow.S = JSON.parse(keep); }
  });
  check('a death keeps only what death teaches', () => ENDINGS.e_death_tide.death && ENDINGS.e_death_tide.keep.join() === 'tide');
  check('saves are validated: another game\'s save is refused', () => Arcade.validators['otherworld-save-v1']({ lives: [], mem: {} }) && !Arcade.validators['otherworld-save-v1']({ team: [] }));

  // T35: exercise every memory combination, every gift and hungry/frightened alternatives, not only the happy route.
  const keys = Object.keys(MEMORIES);
  const asterKeys = keys.filter(k => ['tide','oldroot','guildmaster','lantern','seed','rootsong','broth'].includes(k));
  for (let mask = 0; mask < (1 << asterKeys.length); mask++) {
    const mem = Object.fromEntries(asterKeys.filter((k, i) => mask & (1 << i)).map(k => [k, true]));
    for (const gift of Object.keys(GIFTS.asterhold)) for (const town of [
      { day: 1, food: 4, fear: 1 }, { day: 1, food: 0, fear: 6 }, { day: 2, food: 6, fear: 0 }, { day: 3, food: 0, fear: 6 }
    ]) {
      const r = explore('asterhold', gift, mem, town);
      check('Lanthorn paths: ' + gift + ', memories ' + mask + ', town ' + JSON.stringify(town), () => {
        if (r.problems.length) throw Error(r.problems.slice(0, 3).join('; ')); return r.endings.size > 0;
      });
    }
  }
  const fixture = (gift = 'appraisal', town) => ow.prepareLife({ world: 'asterhold', gift, name: 'Test', flags: {},
    at: 'a_market', silver: 6, mem: {}, status: true, ...(town ? { town } : {}) });
  const withLife = fn => { const old = ow.S; try { ow.S = { ...fresh(), life: fixture() }; return fn(ow.S.life); } finally { ow.S = old; } };
  check('every conditional choice has an authored reason', () => Object.values(NODES).every(n => (n.choices || []).every(c => !c.need || typeof c.why === 'string' || typeof c.why === 'function')));
  check('locked options remain in their original order, rather than disappearing', () => withLife(l => {
    l.gift = 'pocket'; return ow.choicesOf(NODES.a_alone).length === 4 && !ow.choiceReady(NODES.a_alone.choices[0]) && !ow.choiceReady(NODES.a_alone.choices[1]);
  }));
  check("Appraisal closes Ressa's private door but keeps bread and labor available", () => withLife(l => {
    ow.run('a_market'); ow.D.skip();
    const buttons = [...ow.D.el.querySelectorAll('.dlg-choices button')];
    return l.flags.readRessa && buttons.length === 4 && buttons[1].disabled && !buttons[0].disabled && !buttons[2].disabled && /felt you reading/.test(buttons[1].textContent);
  }));
  check('neither a direct choice nor a numbered key can pay or advance a locked option', () => withLife(l => {
    ow.run('a_market'); ow.D.skip(); const before = JSON.stringify(l);
    ow.D.choose(1); document.dispatchEvent(new KeyboardEvent('keydown', {key:'2', bubbles:true}));
    return JSON.stringify(l) === before && l.at === 'a_market' && !l.flags.hearth;
  }));
  check('a disabled native button cannot select its story', () => withLife(l => {
    ow.run('a_market'); ow.D.skip(); const before = JSON.stringify(l); ow.D.el.querySelectorAll('.dlg-choices button')[1].click(); return JSON.stringify(l) === before;
  }));
  check('a forged choice is rechecked against the current purse', () => withLife(l => {
    ow.run('a_market'); ow.D.skip(); l.silver = 0; const before = JSON.stringify(l); ow.D.choose(2); return JSON.stringify(l) === before;
  }));
  check('Pocket Space: accepting is paid once and diverts relief flour', () => withLife(l => {
    l.gift = 'pocket'; ow.run('a_pocket_job'); ow.D.skip(); ow.D.choose(0); ow.D.skip();
    return l.flags.crate && l.silver === 10 && l.town.food === 1 && l.town.fear === 4;
  }));
  check('Pocket Space: refusal pays the promised cart cost and preserves relief flour', () => withLife(l => {
    l.gift = 'pocket'; ow.run('a_pocket_job'); ow.D.skip(); ow.D.choose(1); ow.D.skip();
    return l.flags.refusedCrate && !l.flags.crate && l.silver === 3 && l.town.food === 3;
  }));
  check('Pocket Space: no silver still has a refusal with a time cost', () => withLife(l => {
    l.gift = 'pocket'; l.silver = 0; ow.run('a_pocket_job'); ow.D.skip();
    const buttons = [...ow.D.el.querySelectorAll('.dlg-choices button')];
    if (!buttons[1].disabled || buttons[2].disabled) return false; ow.D.choose(2); ow.D.skip();
    return l.flags.delayed && l.flags.refusedCrate && l.town.day === 2 && l.silver === 0 && l.town.food === 2 && l.town.fear === 4;
  }));
  check('the crate decision can be repaired, without another forced permanent penalty', () => withLife(l => {
    l.gift = 'pocket'; l.flags.crate = true; l.silver = 10; ow.run('a_return_market'); ow.D.skip(); ow.D.choose(3);
    return !l.flags.crate && l.flags.mendedCrate && l.silver === 6 && l.town.food === 4;
  }));
  check('Sword Saint explicitly cannot choose the gentle ways at the heart', () => withLife(l => {
    l.gift = 'sword'; l.flags.mira = true; l.mem.oldroot = true;
    return NODES.a_heart.choices.slice(1).every(c => !ow.choiceReady(c) && /will not let you/.test(c.why(l))) && ow.choiceReady(NODES.a_heart.choices[0]);
  }));
  check('each new dawn consumes food and raises fear exactly once', () => {
    const l = fixture(); ow.townDay(l, 3); const before = JSON.stringify(l.town); ow.townDay(l, 3); ow.townDay(l, 1);
    return l.town.day === 3 && l.town.food === 2 && l.town.fear === 5 && JSON.stringify(l.town) === before;
  });
  check('prices respond to food and fear, not elapsed reading time', () => {
    const normal = fixture(), hungry = fixture('pocket', {day:2, food:1, fear:1}), afraid = fixture('pocket', {day:2, food:5, fear:6});
    return ow.breadPrice(normal) === 2 && ow.breadPrice(hungry) === 4 && ow.breadPrice(afraid) === 3;
  });
  check('bread uses the displayed current price and changes the town', () => withLife(l => {
    l.town = {day:2, food:1, fear:4}; ow.run('a_return_market'); ow.D.skip();
    if (!ow.D.el.querySelector('.dlg-choices button').textContent.includes('4 silver')) return false;
    ow.D.choose(0); return l.silver === 2 && l.town.food === 2 && l.town.fear === 4;
  }));
  check('help responds to hunger and fear; the well remains a free way to improve things', () => withLife(l => {
    l.gift = 'sword'; l.town = {day:2, food:0, fear:6}; ow.run('a_return_market'); ow.D.skip();
    if (ow.choiceReady(NODES.a_return_market.choices[2]) || !ow.choiceReady(NODES.a_return_market.choices[1])) return false;
    ow.D.choose(1); return l.flags.reassured && l.town.food === 0 && l.town.fear === 5;
  }));
  check('a fed and reassured town can rally neighbors; Appraisal and diverted flour change who helps', () => {
    const l = fixture('sword'); if (!NODES.a_return_market.choices[2].need(l)) return false;
    l.flags.crate = true; if (NODES.a_return_market.choices[2].need(l)) return false;
    l.flags.crate = false; l.flags.readRessa = true; return !NODES.a_return_market.choices[2].need(l);
  });
  check('town scene shows fewer stalls, more shutters and a longer well queue when struggling', () => {
    const calm = ow.townView(fixture('pocket', {day:2, food:6, fear:0})), struggling = ow.townView(fixture('pocket', {day:3, food:0, fear:6}));
    return struggling.stalls < calm.stalls && struggling.shutters > calm.shutters && struggling.queue > calm.queue;
  });
  check('people speak differently when food or fear change; no raw meters in their lines', () => withLife(l => {
    l.town = {day:3, food:0, fear:6}; const poor = JSON.stringify(ow.linesOf(NODES.a_council));
    l.town = {day:3, food:6, fear:0}; const calm = JSON.stringify(ow.linesOf(NODES.a_council));
    return poor !== calm && /shutters/.test(poor) && /bread and water/.test(calm) && !/food:|fear:|mood|cooldown|XP/.test(poor + calm);
  }));
  check('every soul memory has a distinct Archivist line; none is invented for an empty soul', () => {
    const lines = ow.archivistMemories(Object.fromEntries(keys.map(k => [k,true])));
    return lines.length === keys.length && new Set(lines.map(l => l[1])).size === keys.length && !ow.archivistMemories({}).length;
  });
  check('node effects do not repeat when resuming registration or the council', () => withLife(l => {
    ow.run('a_guild'); const silver = l.silver; ow.run('a_guild'); if (l.silver !== silver) return false;
    ow.run('a_council'); const before = JSON.stringify(l); ow.run('a_council'); return JSON.stringify(l) === before;
  }));
  check('save/reload preserves paid decisions and exact town state', () => withLife(l => {
    l.gift = 'pocket'; ow.run('a_pocket_job'); ow.D.skip(); ow.D.choose(1); ow.D.skip(); ow.save(); const before = JSON.stringify(ow.S.life);
    ow.S = fresh(); ow.load(); ow.run(ow.S.life.at); return JSON.stringify(ow.S.life) === before;
  }));
  check('legacy active lives resume with sensible defaults and no repeated silver reward', () => withLife(l => {
    delete l.town; delete l.entered; l.at = 'a_guild'; l.silver = 17; l.flags.mira = true; l.mem.seed = true;
    ow.save(); ow.S = fresh(); ow.load(); ow.run('a_guild');
    return ow.S.life.silver === 17 && ow.S.life.flags.mira && ow.S.life.mem.seed && ow.S.life.town.day === 1;
  }));
  check('legacy later scenes start on their authored day without erasing choices', () => {
    const l = fixture(); delete l.town; delete l.entered; l.at = 'a_heart'; l.flags.named = true; ow.prepareLife(l, true);
    return l.town.day === 3 && l.entered.a_heart && l.flags.named;
  });
  check('an ending in progress reloads its epilogue rather than allowing another decision', () => withLife(l => {
    ow.finish('e_lantern'); ow.save(); ow.S = fresh(); ow.load(); const resumed = ow.S.life;
    if (resumed.ending !== 'e_lantern') return false;
    ow.finish(resumed.ending); ow.D.skip(); return ow.S.life === null && ow.S.lives.length === 1 && ow.S.mem.lantern;
  }));
  check('a stale portrait callback cannot mutate a replacement life', () => withLife(l => {
    ow.run('a_market'); const replacement = fixture('pocket'); ow.S.life = replacement; const before = JSON.stringify(replacement); ow.D.choose(0);
    return JSON.stringify(replacement) === before;
  }));

  // T39: every gift, relevant carried-memory combination and struggling/thriving inn.
  const hk=['broth','thaw','rootsong','shelter'];
  for(let mask=0;mask<16;mask++)for(const gift of Object.keys(GIFTS.hearthmere)){
    const mem=Object.fromEntries(hk.filter((k,i)=>mask&(1<<i)).map(k=>[k,true]));
    const r=explore('hearthmere',gift,mem);
    check('Hearthmere every path: '+gift+', memories '+mask,()=>{if(r.problems.length)throw Error(r.problems.join('; '));return r.endings.size>=2;});
  }
  const hf=(gift='cooking',mem={})=>ow.prepareLife({world:'hearthmere',gift,name:'Test',flags:{},at:'h_key',silver:0,status:false,mem});
  const withH=fn=>{const old=ow.S;try{ow.S={...fresh(),life:hf()};return fn(ow.S.life);}finally{ow.S=old;}};
  check('Hearthmere offers all four reachable endings, including hope and a strange life',()=>{
    const all=new Set();for(const g of Object.keys(GIFTS.hearthmere))for(const m of [{},{thaw:true},{rootsong:true}])explore('hearthmere',g,m).endings.forEach(e=>all.add(e));
    return ['e_hearth_shared','e_hearth_banked','e_hearth_pass','e_hearth_lake'].every(e=>all.has(e));
  });
  check('Hearth Cooking helps the table but misses the caravan; costs apply once on reload',()=>withH(l=>{
    ow.run('h_gift');const before=JSON.stringify(l);ow.save();ow.S=fresh();ow.load();ow.run('h_gift');
    return l.flags.late&&l.hearth.stores===3&&!NODES.h_prep.choices[4].need(l)&&JSON.stringify(ow.S.life)===before;
  }));
  check('Spirit Speech warms the stove but unsettles neighbors; visible work can mend this',()=>{
    const l=hf('speech');NODES.h_gift.fx(l);if(!l.flags.odd||l.hearth.warmth!==1)return false;
    NODES.h_prep.choices[1].fx(l);return !l.flags.odd&&l.hearth.welcome===2;
  });
  check('Green Thumb feeds people but blocks the cart; clearing the step makes departure possible',()=>{
    const l=hf('green');NODES.h_gift.fx(l);if(!l.flags.weeds||l.hearth.stores!==4||NODES.h_prep.choices[4].need(l))return false;
    NODES.h_prep.choices[1].fx(l);return !l.flags.weeds&&NODES.h_prep.choices[4].need(l);
  });
  check('winter consumes supplies at authored dawns only once; reading has no time penalty',()=>{
    const l=hf();l.hearth.stores=6;hearthDay(l,3);const before=JSON.stringify(l);hearthDay(l,3);hearthDay(l,1);return l.hearth.stores===4&&JSON.stringify(l)===before;
  });
  check('all gifts have a hopeful route without memories, not only an optimal new-game gift',()=>Object.keys(GIFTS.hearthmere).every(g=>explore('hearthmere',g,{}).endings.has('e_hearth_shared')));
  check('the spring respects Puddle trust; borrowed songs do not skip the promise',()=>{
    const l=hf('green',{rootsong:true});if(NODES.h_spring.choices[1].need(l))return false;l.flags.puddle=true;
    if(!NODES.h_spring.choices[1].need(l)||NODES.h_winter.choices[3].need(l))return false;
    NODES.h_spring.choices[1].fx(l);return NODES.h_winter.choices[3].need(l);
  });
  check('Hearthmere locked choices show reasons and cannot be selected by click or key',()=>withH(l=>{
    ow.run('h_prep');ow.D.skip();const bs=[...ow.D.el.querySelectorAll('.dlg-choices button')];const before=JSON.stringify(l);
    ow.D.choose(2);document.dispatchEvent(new KeyboardEvent('keydown',{key:'3',bubbles:true}));
    return bs[2].disabled&&/recipe/.test(bs[2].textContent)&&JSON.stringify(l)===before;
  }));
  check('every Hearthmere ending returns exactly its promised memories, keeps old memories and records one life',()=>{
    for(const e of Object.keys(ENDINGS).filter(k=>k.startsWith('e_hearth_'))){const old=ow.S;try{
      ow.S={...fresh(),mem:{oldroot:true},life:hf()};ow.finish(e);ow.D.skip();
      if(ow.S.life!==null||ow.S.lives.length!==1||ow.S.lives[0].world!=='hearthmere'||JSON.stringify(Object.keys(ow.S.mem).sort())!==JSON.stringify(['oldroot',...ENDINGS[e].keep].sort()))return false;
    }finally{ow.S=old;}}return true;
  });
  check('Hearthmere ending reload resumes epilogue once, without inventing Asterhold villagers',()=>withH(l=>{
    l.flags.puddle=true;ow.finish('e_hearth_lake');ow.save();ow.S=fresh();ow.load();const resumed=ow.S.life;
    if(resumed.ending!=='e_hearth_lake'||/Ressa|Bren|Lanthorn/.test(JSON.stringify(townEpilogue(resumed,resumed.ending))))return false;
    ow.finish(resumed.ending);ow.D.skip();return ow.S.lives.length===1&&ow.S.mem.thaw;
  }));
  check('Hearthmere memories travel to Asterhold as knowledge; broth creates a new working choice',()=>{
    const l=fixture('pocket');const c=NODES.a_return_market.choices.find(c=>c.t==='Make winter broth for the well queue');
    if(c.need(l))return false;l.mem.broth=true;const before={...l.town};if(!c.need(l))return false;c.fx(l);
    return l.town.food===before.food+1&&l.town.fear===Math.max(0,before.fear-2)&&l.flags.hearthBroth;
  });
  check('Asterhold forest song opens a different Hearthmere life',()=>{
    const no=explore('hearthmere','green',{}).endings,yes=explore('hearthmere','green',{rootsong:true}).endings;
    return !no.has('e_hearth_lake')&&yes.has('e_hearth_lake');
  });
  check('scene details show winter, food, welcome and overgrowth without a score panel',()=>{
    const l=hf('green');const before=hearthView(l);l.flags.innOpen=true;l.flags.weeds=true;l.flags.puddle=true;l.hearth={day:3,stores:4,warmth:2,welcome:3};const after=hearthView(l);
    return after.snow>before.snow&&after.bowls>before.bowls&&after.guests>before.guests&&after.fire&&after.open&&after.weeds&&after.puddle;
  });
  check('corrupt new Hearthmere counters get bounded defaults without wiping choices or memories',()=>{
    const l=hf();l.hearth={day:Infinity,stores:NaN,warmth:-3,welcome:99};l.flags.puddle=true;l.mem.thaw=true;ow.prepareLife(l,true);
    return l.hearth.day===1&&l.hearth.stores===1&&l.hearth.warmth===0&&l.hearth.welcome===3&&l.flags.puddle&&l.mem.thaw;
  });

  // OW0c: authored branch graph plus the real Return dispatcher and its in-flight saves.
  const af=(gift='return',mem={})=>ow.prepareLife({world:'ashen',gift,name:'Test',flags:{},at:'s_wake',silver:0,status:false,mem});
  const withA=fn=>{const old=ow.S;try{ow.S={...fresh(),life:af()};return fn(ow.S.life);}finally{ow.S=old;}};
  for(const gift of Object.keys(GIFTS.ashen))for(const mem of [{},{broth:true},{thaw:true},{bellcode:true},{mercy:true},{broth:true,thaw:true,bellcode:true,mercy:true}]){
    const r=explore('ashen',gift,mem);
    check('Ashen Throne paths: '+gift+', memories '+Object.keys(mem),()=>{if(r.problems.length)throw Error(r.problems.join('; '));return r.endings.has('e_ash_hearth')&&r.endings.has('e_ash_quay');});
  }
  check('all three worlds now have a playable opening and exactly three gifts',()=>Object.keys(WORLDS).every(w=>NODES[WORLDS[w].start]&&Object.keys(GIFTS[w]).length===3));
  check('Return death resets objects, choices, entered receipts and world day, but preserves only learned knowledge',()=>withA(l=>{
    l.flags={shelter:true,supplies:true,kael:true};l.entered={s_gift:true};l.silver=19;l.ash.day=3;l.ash.knowledge.store=true;const beforeMem=JSON.stringify(ow.S.mem);
    ow.finish('e_ash_death');ow.D.skip();const r=ow.S.life;
    return r===l&&r.at==='s_wake'&&r.ash.returns===1&&r.ash.day===1&&r.ash.knowledge.store&&r.silver===0&&Object.keys(r.flags).length===0&&!r.entered.s_gift&&!r.ending&&ow.S.lives.length===0&&JSON.stringify(ow.S.mem)===beforeMem;
  }));
  check('saving during Return death resumes the rewind once, not a duplicate finished life',()=>withA(l=>{
    l.ash.knowledge.store=true;ow.finish('e_ash_death');ow.save();ow.S=fresh();ow.load();const r=ow.S.life;ow.finish(r.ending);ow.D.skip();
    if(r.ash.returns!==1||ow.S.lives.length)return false;ow.save();ow.S=fresh();ow.load();ow.run(ow.S.life.at);return ow.S.life.ash.returns===1&&!ow.S.life.ending&&ow.S.lives.length===0;
  }));
  check('Return can repeat without granting a soul memory, then the player can deliberately leave the dawn',()=>withA(l=>{
    for(let i=0;i<3;i++){ow.finish('e_ash_death');ow.D.skip();}
    if(l.ash.returns!==3||!NODES.s_wake.choices[1].need(l)||ow.S.lives.length||Object.keys(ow.S.mem).length)return false;
    ow.finish('e_ash_rest');ow.D.skip();return ow.S.life===null&&ow.S.lives.length===1&&ow.S.lives[0].ending==='e_ash_rest'&&ow.S.mem.bellcode;
  }));
  check('Return resets friendship: Kael and the world do not remember the previous dawn',()=>withA(l=>{
    l.flags.kael=true;l.flags.recordPublic=true;ow.finish('e_ash_death');ow.D.skip();return !l.flags.kael&&!l.flags.recordPublic&&ow.linesOf(NODES.s_wake).some(([,t])=>t.includes('Nobody remembers'));
  }));
  check('non-Return deaths finish normally with fewer promised memories',()=>withA(l=>{
    l.gift='oath';ow.finish('e_ash_death');ow.D.skip();return ow.S.life===null&&ow.S.lives.length===1&&Object.keys(ow.S.mem).join()==='bellcode';
  }));
  check('Blood Oath gives a promise; breaking it closes manual shelter work but keeps rescue available',()=>{
    const l=af('oath');NODES.s_gift.fx(l);NODES.s_square.choices[1].fx(l);l.flags.supplies=true;
    return l.flags.sworn&&l.flags.oathBroken&&!NODES.s_work.choices[0].need(l)&&!NODES.s_dusk.choices[0].need(l)&&!NODES.s_dusk.choices[1].need&&townEpilogue(l,'e_ash_quay').some(([,t])=>t.includes('loosens slowly'));
  });
  check('Silence learns the store but costs recognition; shared work restores it, chosen unseen work does not',()=>{
    const l=af('silence');NODES.s_gift.fx(l);if(!l.flags.forgotten||!l.flags.records||!l.ash.knowledge.store)return false;
    l.flags.recordPublic=true;if(NODES.s_dusk.choices[2].need(l))return false;NODES.s_work.choices[0].fx(l);
    if(l.flags.forgotten||!NODES.s_dusk.choices[2].need(l))return false;NODES.s_work.choices[2].fx(l);return l.flags.forgotten&&NODES.s_dusk.choices[3].need(l);
  });
  check('Ashen locked choices show their reason and cannot run by numbered key',()=>withA(l=>{
    l.gift='oath';l.flags.oathBroken=true;ow.run('s_work');ow.D.skip();const before=JSON.stringify(l),button=ow.D.el.querySelector('.dlg-choices button');ow.D.choose(0);document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',bubbles:true}));
    return button.disabled&&/hands shut/.test(button.textContent)&&JSON.stringify(l)===before;
  }));
  check('Return preserves a record actually read, but the warning passage does not invent it',()=>withA(l=>{
    NODES.s_closed.fx(l);if(NODES.s_square.choices[3].need(l))return false;
    NODES.s_store.fx(l);ow.finish('e_ash_death');ow.D.skip();return !l.flags.records&&l.ash.knowledge.record&&NODES.s_square.choices[3].need(l);
  }));
  check('locked first response keeps a readable dark background after shared dialogue styles load',()=>withA(l=>{
    l.gift='oath';l.flags.oathBroken=true;ow.run('s_work');ow.D.skip();const b=ow.D.el.querySelector('.dlg-choices button'),style=getComputedStyle(b);return b.disabled&&style.backgroundColor==='rgb(37, 32, 56)'&&style.color==='rgb(170, 162, 184)';
  }));
  check('new world defaults retain old life records and carried memories on load',()=>withA(l=>{
    delete l.ash;l.flags.kael=true;ow.S.mem.oldroot=true;ow.S.lives=[{world:'hearthmere',gift:'green',ending:'e_hearth_shared',name:'Before',at:1}];ow.save();ow.S=fresh();ow.load();return ow.S.life.ash.day===1&&ow.S.life.ash.returns===0&&ow.S.life.flags.kael&&ow.S.mem.oldroot&&ow.S.lives.length===1;
  }));
  check('Ashen gift receipts and final-day state do not repeat on save reload',()=>withA(l=>{
    l.gift='silence';ow.run('s_gift');ow.save();const before=JSON.stringify(l);ow.S=fresh();ow.load();ow.run('s_gift');if(JSON.stringify(ow.S.life)!==before)return false;
    ow.run('s_dusk');ow.save();const dusk=JSON.stringify(ow.S.life);ow.S=fresh();ow.load();ow.run('s_dusk');return JSON.stringify(ow.S.life)===dusk;
  }));
  check('Ashen final epilogue reload records exactly one life and its precise keep list',()=>withA(l=>{
    ow.finish('e_ash_hearth');ow.save();ow.S=fresh();ow.load();ow.finish(ow.S.life.ending);ow.D.skip();return ow.S.life===null&&ow.S.lives.length===1&&Object.keys(ow.S.mem).sort().join()==='bellcode,mercy';
  }));
  check('an Ashen memory opens a working Hearthmere option; it does not merely change flavor',()=>{
    const l=hf('green'),c=NODES.h_well.choices.find(c=>c.t.includes('quay'));if(c.need(l))return false;l.mem.bellcode=true;if(!c.need(l))return false;c.fx(l);return l.flags.puddle&&l.flags.listened&&l.hearth.welcome===1;
  });
  check('Hearthmere recipe changes the Ashen shelter route without a stat bonus',()=>{
    const no=af('return'),yes=af('return',{broth:true});const c=NODES.s_work.choices[3];if(c.need(no)||!c.need(yes))return false;c.fx(yes);return NODES.s_dusk.choices[0].need(yes)&&yes.silver===0;
  });
  check('stale Return callback cannot reset a replacement life',()=>withA(l=>{
    ow.finish('e_ash_death');const replacement=af('silence');ow.S.life=replacement;const before=JSON.stringify(replacement);ow.D.skip();return JSON.stringify(replacement)===before&&ow.S.lives.length===0;
  }));
  check('Ashen rendering state and counters stay bounded without erasing learned knowledge',()=>{
    const l=af();l.ash={day:NaN,returns:-9,knowledge:{store:true}};ow.prepareLife(l,true);return l.ash.day===1&&l.ash.returns===0&&l.ash.knowledge.store;
  });
  // T42: knowledge travels; objects, relationships and the previous world's work do not.
  const mf=(world,mem={},gift=Object.keys(GIFTS[world])[0])=>ow.prepareLife({world,gift,name:'Test',flags:{},at:WORLDS[world].start,silver:0,status:false,mem});
  const mc=(node,text)=>NODES[node].choices.find(c=>typeof c.t==='string'&&c.t.includes(text));
  check('every existing soul memory has a concrete use in a different world',()=>Object.keys(MEMORIES).every(k=>MEMORY_USES.some(u=>u.memory===k&&u.world!==MEMORY_ORIGIN[k]&&u.choice&&NODES[u.at].choices.includes(u.choice))));
  for(const u of MEMORY_USES){
    check('cross-life use is reachable: '+u.memory+' in '+u.world,()=>Object.keys(GIFTS[u.world]).some(g=>{
      const r=explore(u.world,g,{[u.memory]:true});return !r.problems.length&&r.reachableChoices.has(u.choice);
    }));
    check('cross-life knowledge changes the world: '+u.memory,()=>{
      const gift=u.world==='hearthmere'?'green':u.world==='ashen'?'return':'pocket';
      const l=mf(u.world,{},gift);l.flags.records=true;
      if(u.choice.need(l))return false;l.mem[u.memory]=true;if(!u.choice.need(l))return false;
      const before=JSON.stringify({flags:l.flags,town:l.town,hearth:l.hearth,ash:l.ash});u.choice.fx(l);
      return before!==JSON.stringify({flags:l.flags,town:l.town,hearth:l.hearth,ash:l.ash})&&l.silver===0;
    });
  }
  for(const world of built)for(const gift of Object.keys(GIFTS[world]))for(const key of Object.keys(MEMORIES)){
    const r=explore(world,gift,{[key]:true});
    check('single carried memory has no dead end: '+world+', '+gift+', '+key,()=>{if(r.problems.length)throw Error(r.problems.slice(0,3).join('; '));return r.endings.size>0;});
  }
  check('each world has two people with wants, not relationship meters',()=>built.every(w=>{
    const people=mf(w).people;return Object.keys(people).length===2&&Object.values(people).every(p=>typeof p.want==='string'&&typeof p.state==='string');
  }));
  check('Ressa remembers diverted flour and its repair, while Appraisal still costs privacy',()=>{
    const l=mf('asterhold',{},'pocket'),ask=mc('a_return_market','kitchen hands');
    NODES.a_market.choices[0].fx(l);if(!ask.need(l)||l.people.bren.state!=='owesHands')return false;
    NODES.a_pocket_job.choices[0].fx(l);if(ask.need(l)||l.people.ressa.state!=='hurt')return false;
    mc('a_return_market','retrieve the relief').fx(l);if(!ask.need(l)||l.people.ressa.state!=='mended')return false;
    l.flags.readRessa=true;ow.prepareLife(l);return !ask.need(l)&&l.people.ressa.state==='guarded';
  });
  check('Bren repays hands with a rescue; the debt cannot be claimed twice',()=>{
    const l=mf('asterhold'),cart=mc('a_return_market','cart journey');if(cart.need(l))return false;
    NODES.a_market.choices[0].fx(l);if(!cart.need(l))return false;cart.fx(l);
    return !cart.need(l)&&l.people.bren.state==='repaid'&&l.flags.farmersRescued&&endingLines(l,'e_walls').some(([,t])=>t.includes('Fennels stand inside'));
  });
  check('a rescued family is not described as still outside or erased at the feast',()=>{
    const l=mf('asterhold',{mercy:true});l.flags.mira=true;mc('a_council','Stand beside Hesta').fx(l);
    return !NODES.a_council.lines(l).some(([,t])=>t.includes('still out there'))&&!endingLines(l,'e_walls').some(([,t])=>t.includes('Nobody says'));
  });
  check('Vesper offers her reserve only after shared work; it can change a banked winter into an open table',()=>{
    const l=mf('hearthmere',{},'cooking'),reserve=mc('h_winter','Vesper\'s own reserve');
    l.hearth={day:3,stores:0,warmth:2,welcome:2};if(reserve.need(l)||winterReady(l))return false;
    l.flags.door=true;ow.prepareLife(l);if(!reserve.need(l))return false;reserve.fx(l);
    return winterReady(l)&&l.people.vesper.state==='sharedReserve'&&townEpilogue(l,'e_hearth_shared').some(([,t])=>t.includes('last sack'));
  });
  check('Puddle shares as a guest; a promise to stay at the spring is not converted into compulsory inn work',()=>{
    const l=mf('hearthmere'),water=mc('h_prepared','share spring water');if(water.need(l))return false;
    NODES.h_spring.choices[0].fx(l);if(!water.need(l))return false;water.fx(l);
    if(water.need(l)||l.people.puddle.state!=='sharedWater'||!l.flags.puddleWater)return false;
    const other=mf('hearthmere',{rootsong:true},'green');other.flags.puddle=true;NODES.h_spring.choices[1].fx(other);return other.people.puddle.state==='companioned'&&!water.need(other);
  });
  check('Kael remembers a hurt door, accepts repair, and then offers his word',()=>{
    const l=mf('ashen',{},'silence'),witness=mc('s_work','your witness');l.flags.kael=true;l.flags.records=true;ow.prepareLife(l);if(!witness.need(l))return false;
    NODES.s_square.choices[1].fx(l);if(witness.need(l)||l.people.kael.state!=='hurt')return false;
    NODES.s_work.choices[0].fx(l);if(!witness.need(l)||l.people.kael.state!=='mended')return false;witness.fx(l);return l.flags.recordPublic&&l.flags.kaelWitness;
  });
  check('Emmet can carry evidence after help at the boats; no record is invented',()=>{
    const l=mf('ashen'),copy=mc('s_work','Emmet to carry');l.flags.records=true;ow.prepareLife(l);if(copy.need(l))return false;
    NODES.s_square.choices[2].fx(l);if(!copy.need(l))return false;copy.fx(l);return !copy.need(l)&&l.people.emmet.state==='repaid'&&l.flags.recordPublic&&l.flags.guided;
  });
  check('the forest song calms a beast in Asterhold, without overriding the Sword Saint\'s cost',()=>{
    const l=mf('asterhold',{rootsong:true},'pocket'),song=mc('a_alone','Sing the forest');
    if(!song.need(l))return false;song.fx(l);if(!l.flags.songCalmed||!NODES.a_alone_live.lines(l).some(([,t])=>t.includes('boar slows')))return false;
    l.gift='sword';return !song.need(l);
  });
  check('all memories together cannot free hands bound by Blood Oath',()=>{
    const l=mf('ashen',Object.fromEntries(Object.keys(MEMORIES).map(k=>[k,true])),'oath');l.flags.records=true;l.flags.oathBroken=true;
    return !mc('s_work','Mira\'s lantern').need(l)&&!NODES.s_work.choices[0].need(l)&&!NODES.s_work.choices[3].need(l)&&!NODES.s_dusk.choices[0].need(l);
  });
  check('old saves derive wants and debts from choices without repeating their rewards',()=>{
    const old=ow.S;try{const l=mf('asterhold');l.flags.unloaded=true;l.flags.mendedCrate=true;l.entered.a_market=true;l.silver=9;delete l.people;
      ow.S={...fresh(),life:l,mem:{seed:true}};ow.save();ow.S=fresh();ow.load();const r=ow.S.life;
      if(r.people.bren.state!=='owesHands'||r.people.ressa.state!=='mended'||r.silver!==9||!r.entered.a_market)return false;
      const before=JSON.stringify(r);ow.save();ow.S=fresh();ow.load();return before===JSON.stringify(ow.S.life)&&ow.S.mem.seed;
    }finally{ow.S=old;}
  });
  check('a returned dawn forgets all personal debts but remembers knowledge and soul memories',()=>withA(l=>{
    l.flags.boats=true;l.flags.kael=true;l.ash.knowledge.record=true;l.mem.mercy=true;ow.prepareLife(l);
    if(l.people.emmet.state!=='owesHands')return false;ow.finish('e_ash_death');ow.D.skip();
    return l.people.emmet.state==='waiting'&&l.people.kael.state==='waiting'&&l.ash.knowledge.record&&l.mem.mercy;
  }));
  check('a memory decision cannot be clicked or selected with a key before it is carried',()=>{
    const old=ow.S;try{const l=mf('ashen',{},'return');ow.S={...fresh(),life:l};ow.run('s_stair');ow.D.skip();const i=NODES.s_stair.choices.findIndex(c=>c.memory==='shelter');
      const button=ow.D.el.querySelectorAll('.dlg-choices button')[i],before=JSON.stringify(l);button.click();ow.D.choose(i);document.dispatchEvent(new KeyboardEvent('keydown',{key:String(i+1),bubbles:true}));
      return button.disabled&&/Hearthmere/.test(button.textContent)&&JSON.stringify(l)===before;
    }finally{ow.S=old;}
  });
  check('real portrait choice, reload and resume preserve one lantern supply delivery',()=>{
    const old=ow.S;try{const l=mf('ashen',{lantern:true},'return');l.flags.records=true;l.flags.shelter=true;ow.S={...fresh(),mem:{lantern:true},life:l};
      ow.run('s_work');ow.D.skip();const i=NODES.s_work.choices.findIndex(c=>c.memory==='lantern');ow.D.el.querySelectorAll('.dlg-choices button')[i].click();
      if(l.at!=='s_dusk'||!l.flags.supplies||!NODES.s_dusk.choices[0].need(l))return false;
      ow.save();const before=JSON.stringify(l);ow.S=fresh();ow.load();ow.run(ow.S.life.at);return before===JSON.stringify(ow.S.life);
    }finally{ow.S=old;}
  });
  check('Between introduction offers a visible shortcut without choosing a world or gift',()=>{
    const old=ow.S;try{ow.S=fresh();panel().hidden=true;toBetween(null,[]);
      const b=ow.D.el.querySelector('[data-between-shortcut]');if(!b||b.textContent!=='Choose a world')return false;
      b.click();return !panel().hidden&&panel().querySelectorAll('[data-world]').length===3&&!ow.S.life&&ow.S.met&&ow.D.el.hidden&&!ow.D.el.querySelector('[data-between-shortcut]');
    }finally{ow.S=old;panel().hidden=true;}
  });
  check('reading the introduction normally still reaches the same world choices',()=>{
    const old=ow.S;try{ow.S=fresh();panel().hidden=true;toBetween(null,[]);for(let i=0;i<30;i++)ow.D.advance();
      return !panel().hidden&&panel().querySelectorAll('[data-world]').length===3&&!ow.S.life&&!ow.D.el.querySelector('[data-between-shortcut]');
    }finally{ow.S=old;panel().hidden=true;}
  });
  check('returning to the Between keeps memories and endings when taking the shortcut',()=>{
    const old=ow.S;try{ow.S={...fresh(),met:true,mem:{tide:true},lives:[{ending:'e_death_tide',world:'asterhold'}]};panel().hidden=true;
      const before=JSON.stringify(ow.S);toBetween(null,[]);ow.D.el.querySelector('[data-between-shortcut]').click();return JSON.stringify(ow.S)===before&&!panel().hidden;
    }finally{ow.S=old;panel().hidden=true;}
  });
  check('a stale introduction shortcut cannot skip a live story or its choices',()=>{
    const old=ow.S;try{ow.S=fresh();panel().hidden=true;toBetween(null,[]);const b=ow.D.el.querySelector('[data-between-shortcut]');
      const l=mf('ashen',{},'return');ow.S={...fresh(),life:l};ow.run('s_stair');const before=sceneState;b.click();
      return sceneState===before&&!ow.D.el.querySelector('[data-between-shortcut]')&&!ow.D.el.classList.contains('asking');
    }finally{ow.S=old;panel().hidden=true;}
  });
  return out;
}
