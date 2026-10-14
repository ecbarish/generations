'use strict';

// Captured from unsplit main b76f050 after three real minutes of play.
const MAIN_SAVE = {
  "v": 1,
  "gold": 979.3082812609304,
  "floor": 8,
  "best": 10,
  "push": true,
  "pushWait": 9.799499999999938,
  "party": [
    {
      "id": 2,
      "name": "Ren",
      "cls": "swordsman",
      "star": 1,
      "lvl": 4,
      "hair": "#9b6bd6"
    },
    {
      "id": 5,
      "name": "Emi",
      "cls": "archer",
      "star": 1,
      "lvl": 1,
      "hair": "#ff8fb1"
    },
    {
      "id": 3,
      "name": "Ryo",
      "cls": "swordsman",
      "star": 2,
      "lvl": 1,
      "hair": "#ff8fb1"
    }
  ],
  "nextId": 8,
  "board": [
    {
      "id": 6,
      "name": "Rin",
      "cls": "mage",
      "star": 4,
      "lvl": 1,
      "hair": "#d8dde6"
    },
    {
      "id": 7,
      "name": "Ichika",
      "cls": "monk",
      "star": 1,
      "lvl": 1,
      "hair": "#59c38a"
    },
    {
      "id": 8,
      "name": "Kaito",
      "cls": "cleric",
      "star": 1,
      "lvl": 1,
      "hair": "#9b6bd6"
    }
  ],
  "boardT": 0.0035000000003485854,
  "rerolls": 0,
  "biz": [
    4,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "fac": {},
  "relics": [],
  "relicPending": 0,
  "relicOffer": null,
  "mon": {
    "f": 8,
    "boss": false,
    "name": "Slime",
    "k": "slime",
    "c": "#5ccf6b",
    "hp": 135.17261671137555,
    "max": 135.17261671137555,
    "atk": 18.007452696418373,
    "gold": 15.006210580348645
  },
  "php": 31.74876805662224,
  "resting": 0,
  "acc": 0.29459999996423486,
  "region": "meadow",
  "regionOffer": null,
  "renown": 0,
  "renownLife": 0,
  "crest": {},
  "staff": {
    "unl": {},
    "on": {},
    "t": {}
  },
  "autoAt": 10,
  "seenStaff": true,
  "combosFound": {},
  "stats": {
    "recruits": 2,
    "maxLvl": 4,
    "bosses": 0,
    "seasons": 0,
    "kills": 73,
    "play": 180.000699999986,
    "run": 180.000699999986,
    "bestEver": 10,
    "bizMax": 4,
    "facMax": 0
  },
  "tab": "party",
  "buy": 1,
  "last": 1791345587107,
  "log": [
    "<b>Ryo</b> the ★★ Swordsman joined the guild.",
    "<b>Emi</b> the ★ Archer joined the guild.",
    "The Starfall Guild opens its doors. <b>Ren</b> signs up first."
  ]
};

// Runs in the game iframe to exercise the unchanged classic-script functions.
async function starfallChecks(oldSave) {
  const checks = [];
  const check = (label, test) => {
    try { if (!test()) throw Error('Expected condition was false.'); checks.push({ok:true,label}); }
    catch (error) { checks.push({ok:false,label:label+' — '+error.message}); }
  };
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function reset() { S=fresh(); D=derive(); closeModal(); curKey=''; boot0(); fx.hits=[]; }
  const sg=window.__sg;
  check('Localhost hook exposes the live state and main tick',()=>sg && sg.S===S && sg.advance===advance && sg.save===save && sg.load===load);
  check('Fresh game starts with Ren, 60 gold and floor 1',()=>S.v===1 && S.gold===60 && S.floor===1 && S.best===1 && S.party.length===1 && S.party[0].name==='Ren' && S.party[0].cls==='swordsman' && S.php===D.pmax && S.mon.f===1);
  check('Fresh tavern has three valid candidates',()=>S.board.length===3 && S.board.every(a=>CLASSES[a.cls] && a.lvl===1 && a.star>=1 && a.star<=5));
  check('Three-minute main fixture has real dungeon and town progress',()=>oldSave && oldSave.stats.play>=175 && oldSave.stats.kills>0 && oldSave.biz[0]>0 && oldSave.party[0].lvl>1);
  check('Original main save loads with every value unchanged',()=>{
    localStorage.setItem(KEY,JSON.stringify(oldSave)); const loaded=sg.load();
    if(!same(loaded,oldSave))return false; S=merge(loaded); D=derive(); return same(S,oldSave);
  });
  check('Old save keeps party, gold, floors, town and lifetime totals',()=>same(S.party,oldSave.party) && S.gold===oldSave.gold && S.floor===oldSave.floor && S.best===oldSave.best && same(S.biz,oldSave.biz) && same(S.fac,oldSave.fac) && same(S.stats,oldSave.stats));
  check('Old save round-trips through portable export without changing values',()=>same(Arcade.decode(exportSave()),oldSave));
  check('Recruiting costs gold, moves the candidate and increments recruits once',()=>{
    reset(); const a=S.board[0],cost=recruitCost(a); S.gold=cost; const n=S.party.length;
    return sg.recruit(a.id) && S.gold===0 && S.party.length===n+1 && S.party.at(-1)===a && !S.board.some(b=>b.id===a.id) && S.stats.recruits===1 && !sg.recruit(a.id);
  });
  check('Unaffordable recruits leave the state unchanged',()=>{reset();S.gold=0;const before=JSON.stringify(S);return !sg.recruit(S.board[0].id) && JSON.stringify(S)===before;});
  check('A full party cannot recruit',()=>{reset();S.gold=10000;while(S.party.length<D.size)S.party.push(makeAdv(1,'mage'));D=derive();const before=JSON.stringify(S);return !sg.recruit(S.board[0].id) && JSON.stringify(S)===before;});
  check('Town purchase costs the original 15 gold and earns 1 gold/second',()=>{
    reset();const gold=S.gold;return sg.buyBiz(0,1) && Math.abs(S.gold-(gold-15))<1e-9 && S.biz[0]===1 && S.stats.bizMax===1 && D.gps===1;
  });
  check('Locked buildings cannot be purchased',()=>{reset();S.gold=100000;const before=JSON.stringify(S);return !sg.buyBiz(1,1) && JSON.stringify(S)===before;});
  check('Shop income and play time advance through the real tick',()=>{reset();sg.buyBiz(0,1);S.party=[];D=derive();const gold=S.gold;sg.advance(2);return Math.abs(S.gold-gold-2)<1e-9 && S.stats.play===2 && S.stats.run===2;});
  check('Leveling spends the original cost and updates party stats',()=>{reset();const a=S.party[0],cost=lvlCostN(a,1),gold=S.gold,atk=D.patk;return sg.levelUp(a.id,1) && a.lvl===2 && Math.abs(S.gold-(gold-cost))<1e-9 && D.patk>atk && S.stats.maxLvl===2;});
  check('Dungeon combat defeats a monster, earns gold and pushes deeper',()=>{reset();S.party[0].lvl=20;D=derive();S.php=D.pmax;const gold=S.gold;sg.advance(0.5);return S.stats.kills>0 && S.floor>1 && S.best===S.floor && S.stats.bestEver===S.best && S.gold>gold && S.mon.f===S.floor;});
  check('Farming defeats monsters without advancing the floor',()=>{reset();S.party[0].lvl=20;S.push=false;D=derive();S.php=D.pmax;sg.advance(1);return S.stats.kills>0 && S.floor===1 && S.best===1;});
  check('Boss victory awards a relic choice',()=>{reset();S.party[0].lvl=100;S.floor=S.best=10;S.push=false;D=derive();S.php=D.pmax;spawn();sg.advance(0.5);ensureRelicOffer();return S.stats.bosses===1 && S.relicPending===1 && S.relicOffer.length===3 && S.relicOffer.every(id=>RELICS[id]);});
  check('Season cannot reset before floor 20',()=>{reset();const before=JSON.stringify(S);sg.newSeason(false);return JSON.stringify(S)===before;});
  check('Season reset earns Renown and preserves permanent progress',()=>{
    reset();S.best=20;S.biz[0]=3;S.fac.smith=1;S.relics=['phoenix'];S.crest.funds=1;S.staff.unl.mina=true;S.staff.on.mina=true;S.combosFound.test=true;S.stats.play=200;D=derive();sg.newSeason(false);
    return S.renown===1 && S.renownLife===1 && S.stats.seasons===1 && S.floor===1 && S.best===1 && S.gold===startGold(1) && S.party.length===0 && S.biz.every(n=>n===0) && Object.keys(S.fac).length===0 && S.relics.length===0 && S.crest.funds===1 && S.staff.unl.mina && S.staff.on.mina && S.combosFound.test && S.stats.play===200 && S.stats.run===0 && S.regionOffer.length===3;
  });
  check('Region choice starts the next season with a party and monster',()=>{const id=S.regionOffer[0];sg.chooseRegion(id,false);return S.region===id && S.regionOffer===null && S.party.length===1 && S.board.length===D.boardN && S.php===D.pmax && S.mon.f===1;});
  check('Save key, version and hub report remain compatible',()=>{reset();sg.save();const loaded=sg.load();return KEY==='starfall-guild-save-v1' && loaded.v===1 && same(loaded,S) && Arcade.readIndex()['starfall-guild'].summary.includes('Season 1');});
  check('Every existing tab renders and updates without errors',()=>{reset();for(const tab of Object.keys(TABS)){S.tab=tab;renderTab(true);updateUI();if(!document.querySelector('#tabbody').innerHTML)return false;}return true;});
  check('Canvas renderer still draws a frame',()=>{reset();frame(performance.now());return cv.width>0 && cv.height>0;});
  check('SG-N1 region decisions count foreground time without advancing the world',()=>{reset();S.regionOffer=['meadow','cavern','coast'];const before={gold:S.gold,hp:S.mon.hp,board:S.boardT};advance(120);return S.stats.play===120&&S.stats.run===120&&S.gold===before.gold&&S.mon.hp===before.hp&&S.boardT===before.board;});
  check('SG-N1 paused offline catch-up counts once without granting income or healing',()=>{reset();S.regionOffer=['meadow','cavern','coast'];S.resting=8;S.php=0;const gold=S.gold;return offline(120)===null&&S.stats.play===120&&S.stats.run===120&&S.gold===gold&&S.resting===8&&S.php===0;});
  check('SG-N1 invalid durations cannot corrupt the clock',()=>{reset();for(const sec of [NaN,Infinity,-1,0])advance(sec);offline(Infinity);return S.stats.play===0&&S.stats.run===0;});
  check('SG-N1 paused catch-up retains the existing one-day limit',()=>{reset();S.regionOffer=['meadow','cavern','coast'];offline(100000);return S.stats.play===86400&&S.stats.run===86400;});
  check('SG-N1 existing time survives loading and season time resets normally',()=>{reset();const saved=JSON.parse(JSON.stringify(S));saved.stats.play=123;saved.stats.run=45;S=merge(saved);D=derive();S.regionOffer=['meadow'];advance(5);return S.stats.play===128&&S.stats.run===50&&S.v===saved.v;});
  check('SG-N1 preparation is visible only during real recovery',()=>{reset();updateUI();if(!document.querySelector('#recovery').hidden)return false;S.resting=8;S.php=0;updateUI();const seen=!document.querySelector('#recovery').hidden;S.regionOffer=['meadow'];updateUI();return seen&&document.querySelector('#recovery').hidden;});
  check('SG-N1 recovery training buys one normal level even in Max mode',()=>{reset();S.resting=8;S.php=0;S.buy='max';S.gold=100;updateUI();const a=S.party[0],cost=lvlCostN(a,1);document.querySelector('#recovery-train').click();return a.lvl===2&&Math.abs(S.gold-(100-cost))<1e-9&&S.php===0&&S.resting===8;});
  check('SG-N1 unaffordable training and lowest-floor retreat are disabled',()=>{reset();S.resting=8;S.gold=0;updateUI();const btn=document.querySelector('#recovery-train');btn.click();return btn.disabled&&S.party[0].lvl===1&&document.querySelector('#recovery-back').disabled;});
  check('SG-N1 choosing a safer floor preserves recovery and stops pushing',()=>{reset();S.floor=5;S.best=5;spawn();S.resting=8;S.php=0;updateUI();document.querySelector('#recovery-back').click();return S.floor===4&&!S.push&&S.resting===8&&S.php===0&&S.mon.f===4;});
  check('SG-N1 recovery ends naturally with the trained party health',()=>{reset();S.resting=8;S.php=0;updateUI();document.querySelector('#recovery-train').click();advance(8);updateUI();return S.resting===0&&S.php===D.pmax&&document.querySelector('#recovery').hidden;});
  check('Tick advances without errors or nonfinite state',()=>{reset();for(let i=0;i<100;i++)sg.advance(0.1);updateUI();return Math.abs(S.stats.play-10)<1e-9 && S.stats.kills>0 && [S.gold,S.php,D.patk,D.pmax,S.mon.hp,S.mon.atk].every(Number.isFinite);});
  // T26: shared sound, original tunes, controls, saved settings and real event hooks.
  check('Three original themes have 32 melody notes and 16 or 32 bass notes',()=>['town','delve','boss'].every(k=>SND.tracks[k]&&SND.tracks[k].mel.length===32&&[16,32].includes(SND.tracks[k].bass.length)));
  check('Every melody and bass token is a rest or a real pitch',()=>Object.values(SND.tracks).every(t=>t.mel.concat(t.bass).every(n=>n==='.'||ArcadeSound.hz(n)>0)));
  check('Delve has drums and the faster boss theme has no echo',()=>SND.tracks.delve.drum.length>0&&SND.tracks.boss.bpm>SND.tracks.delve.bpm&&!SND.tracks.boss.echo);
  check('Fresh sound is off without adding a save field',()=>{reset();SND.render();return !Object.hasOwn(S,'snd')&&$('#sndBtn').textContent==='Sound: off'&&$('#sndBtn').getAttribute('aria-pressed')==='false';});
  check('Header clicks cycle off, effects, music and off with matching text and saved setting',()=>{
    const b=$('#sndBtn');for(const [mode,text] of [[1,'Sound: effects'],[2,'Sound: effects + music'],[0,'Sound: off']]){b.click();if(S.snd!==mode||load().snd!==mode||b.textContent!==text||b.getAttribute('aria-pressed')!==(mode?'true':'false'))return false;}return true;
  });
  check('Old save without snd loads unchanged and silent',()=>{localStorage.setItem(KEY,JSON.stringify(oldSave));S=merge(load());D=derive();SND.render();return same(S,oldSave)&&!Object.hasOwn(S,'snd')&&$('#sndBtn').textContent==='Sound: off';});
  check('Sound-on setting survives save and load',()=>{reset();S.snd=2;save();S=merge(load());SND.render();return S.snd===2&&$('#sndBtn').textContent==='Sound: effects + music';});
  check('Importing an old save refreshes the header to sound off',()=>{reset();S.snd=2;S.tab='ledger';renderTab(true);SND.render();$('#saveTxt').value=Arcade.encode(oldSave);document.querySelector('[data-act="import"]').click();return !Object.hasOwn(S,'snd')&&S.gold===oldSave.gold&&$('#sndBtn').textContent==='Sound: off'&&$('#sndBtn').getAttribute('aria-pressed')==='false';});
  check('Erasing a sound-on save refreshes the header to sound off',()=>{reset();S.snd=2;S.tab='ledger';renderTab(true);SND.render();document.querySelector('[data-act="reset"]').click();document.querySelector('[data-act="reset"]').click();return !Object.hasOwn(S,'snd')&&S.gold===60&&$('#sndBtn').textContent==='Sound: off'&&$('#sndBtn').getAttribute('aria-pressed')==='false';});
  check('Town and inactive-party states choose the warm town theme',()=>{reset();S.tab='town';if(musicKey()!=='town')return false;S.tab='party';S.party=[];return musicKey()==='town';});
  check('Normal floor selects delve and a boss floor selects boss',()=>{reset();S.tab='party';S.floor=1;const normal=musicKey();S.floor=10;return normal==='delve'&&musicKey()==='boss';});
  check('Regional five-floor bosses also select boss',()=>{reset();S.region=Object.keys(REGIONS).find(k=>REGIONS[k].boss5);S.floor=5;return isBoss(5)&&musicKey()==='boss';});
  check('Resting party returns to the town theme',()=>{reset();S.resting=1;return musicKey()==='town';});
  check('Modals and a pending region choice silence music',()=>{reset();openModal('export','Test','Test');const quiet=musicKey()===null;closeModal();S.regionOffer=['meadow'];return quiet&&musicKey()===null;});
  const played=[],originalSfx=SND.sfx;
  SND.sfx=(name,...args)=>{played.push(name);return originalSfx(name,...args);};
  function audible(){reset();S.snd=1;soundPlayed.clear();soundPending.clear();played.length=0;}
  try {
    audible();for(const name of ['win','loot','quest','level','coin','lose','badge'])sfx(name);await Promise.resolve();
    check('Every required shared effect runs without throwing',()=>['win','loot','quest','level','coin','lose','badge'].every(n=>played.includes(n)));
    audible();S.party[0].lvl=100;S.floor=S.best=10;S.push=false;D=derive();S.php=D.pmax;spawn();advance(2);await Promise.resolve();
    check('Repeated boss kills in a catch-up tick play one victory cue',()=>S.stats.bosses>1&&played.filter(n=>n==='win').length===1);
    audible();S.party[0].lvl=100;S.push=false;D=derive();advance(2);await Promise.resolve();
    check('Ordinary farm kills do not add hit or kill sounds',()=>S.stats.kills>1&&played.length===0);
    audible();S.gold=10000;for(let i=0;i<5;i++)levelUp(S.party[0].id,1);await Promise.resolve();
    check('Batch leveling plays one level cue',()=>S.party[0].lvl===6&&played.filter(n=>n==='level').length===1);
    audible();S.gold=10000;buyBiz(0,1);buyBiz(0,1);buyFac('smith');await Promise.resolve();
    check('Town purchases play one coin cue per batch',()=>S.biz[0]===2&&S.fac.smith===1&&played.filter(n=>n==='coin').length===1);
    audible();S.gold=10000;recruit(S.board[0].id);await Promise.resolve();
    check('Actual recruiting plays the quest cue',()=>S.stats.recruits===1&&played.includes('quest'));
    audible();S.relicPending=1;S.relicOffer=['phoenix'];takeRelic('phoenix',false);await Promise.resolve();
    check('Choosing a relic plays loot',()=>S.relics.includes('phoenix')&&played.includes('loot'));
    audible();S.best=20;newSeason(false);await Promise.resolve();
    check('Season reset plays badge',()=>S.stats.seasons===1&&played.includes('badge'));
    audible();S.floor=2;spawn();S.mon.hp=1e9;S.mon.atk=1e9;S.php=1;advance(0.5);await Promise.resolve();
    check('Actual wipe and forced retreat play lose',()=>S.php===0&&S.floor===1&&played.includes('lose'));
    audible();S.gold=0;buyBiz(0,1);recruit(S.board[0].id);levelUp(S.party[0].id,1);await Promise.resolve();
    check('Failed actions remain silent',()=>played.length===0);
  } finally {SND.sfx=originalSfx;reset();SND.render();}
  return checks;
}

(() => {
  const button = document.querySelector('#run'), summary = document.querySelector('#summary'), results = document.querySelector('#results');
  const keys = ['starfall-guild-save-v1', 'arcade-index-v1'];
  let active = null;
  function result(ok, label) {
    const li = document.createElement('li'); li.className = ok ? 'pass' : 'fail'; li.textContent = (ok ? 'PASS — ' : 'FAIL — ') + label; results.appendChild(li);
  }
  function restore() {
    if (!active) return;
    // Destroy the writer (timers and beforeunload save) BEFORE restoring the originals.
    if (active.frame) { active.frame.remove(); active.frame = null; }
    const errors = [];
    for (const k of Object.keys(localStorage)) if (k.startsWith('arcade-backup:') && !active.backup.has(k)) localStorage.removeItem(k);
    for (const [key, value] of active.backup) {
      try {
        if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
        if (localStorage.getItem(key) !== value) throw Error('Value did not match backup.');
      } catch (error) { errors.push(key + ': ' + error.message); }
    }
    if (errors.length) throw Error('Save restoration failed: ' + errors.join('; '));
    active = null;
  }
  addEventListener('pagehide', restore);
  button.addEventListener('click', async () => {
    button.disabled = true; results.replaceChildren(); summary.className = ''; summary.textContent = 'Running…';
    let total = 0, failed = 0;
    const record = (ok, label) => { total++; if (!ok) failed++; result(ok, label); };
    try {
      if (location.hostname !== 'localhost' || !/^https?:$/.test(location.protocol)) throw Error('Open this page through serve.ps1 at http://localhost:8765/tests/starfall.html.');
      // Finish ALL reads before changing storage; if backup fails, no game is loaded.
      const backup = new Map(keys.concat(Object.keys(localStorage).filter(k => k.startsWith('arcade-backup:'))).map(key => [key, localStorage.getItem(key)])); // automatic save backups too (engine.js)
      active = { backup, frame: null };
      localStorage.removeItem(keys[0]);
      // The unchanged canvas uses its visible bounds; reopen it for repeated runs.
      document.querySelector('details').open = true;
      const frame = document.createElement('iframe'); frame.title = 'Starfall Guild test instance'; active.frame = frame;
      document.querySelector('#game').appendChild(frame);
      // The guild page's load event waits on fonts.googleapis.com. A stalled stylesheet
      // never fires load, even after the game has booted. The localhost hook is the ready signal.
      await new Promise((resolve, reject) => {
        let poll;
        const timer = setTimeout(() => { clearInterval(poll); reject(Error('Game iframe load timed out.')); }, 15000);
        const done = () => { clearTimeout(timer); clearInterval(poll); resolve(); };
        frame.onerror = () => { clearTimeout(timer); clearInterval(poll); reject(Error('Game iframe failed to load.')); };
        poll = setInterval(() => {
          try { if (frame.contentWindow && frame.contentWindow.__sg) done(); }
          catch (error) { /* The frame is still navigating. */ }
        }, 50);
        frame.src = '../games/starfall-guild/';
      });
      const w = frame.contentWindow;
      if (!w.__sg) throw Error('Starfall Guild localhost test hook is unavailable.');
      for (const c of await w.eval('(' + starfallChecks.toString() + ')(' + JSON.stringify(MAIN_SAVE) + ')')) record(c.ok, c.label);
    } catch (error) {
      record(false, error.message);
    } finally {
      try { restore(); } catch (error) { record(false, error.message); }
      summary.textContent = failed ? 'FAIL — ' + failed + ' of ' + total + ' failed.' : 'PASS — ' + total + ' checks.';
      summary.className = failed ? 'fail' : 'pass'; button.disabled = false;
    }
  });
})();
