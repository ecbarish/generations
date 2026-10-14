'use strict';
async function engineSaveChecks() {
  const checks = [];
  const NOTE = 'This save is from a newer version, so progress will not be saved.';
  const PREFIX = 'engine-savever-test-';
  const check = (label, test) => { try { if (!test()) throw Error('Expected condition was false.'); checks.push({ ok: true, label }); } catch (e) { checks.push({ ok: false, label: label + ' — ' + e.message }); } };
  const snap = () => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
    return out;
  };
  const savedStorage = snap();
  const wipe = () => {
    Object.keys(localStorage).forEach(k => { if (!Object.prototype.hasOwnProperty.call(savedStorage, k)) localStorage.removeItem(k); });
    Object.keys(savedStorage).forEach(k => localStorage.setItem(k, savedStorage[k]));
    document.querySelectorAll('[data-arc-held]').forEach(el => el.remove());
    document.querySelectorAll('[role="status"]').forEach(el => { if (/could not be read/.test(el.textContent)) el.remove(); });
  };
  const forget = key => { delete Arcade.versions[key]; delete Arcade.migrates[key]; delete Arcade.held[key]; delete Arcade.recovered[key]; delete Arcade.validators[key]; };
  try {
    wipe();
    const plain = PREFIX + 'plain';
    const body = { coins: 3, note: 'plain' };
    check('a game with no version saves and loads the same object', () => {
      if (!Arcade.save(plain, body)) return false;
      const raw = localStorage.getItem(plain);
      const loaded = Arcade.load(plain);
      return raw === JSON.stringify(body) && JSON.stringify(loaded) === raw && !Arcade.held[plain] && Arcade.save(plain, { coins: 4, note: 'plain' }) === true && JSON.parse(localStorage.getItem(plain)).coins === 4;
    });
    const high = PREFIX + 'high';
    const highRaw = '{"v":99,"coins":1,"kept":"yes"}';
    check('a game with no version still loads a high v and keeps saving', () => {
      localStorage.setItem(high, highRaw);
      const loaded = Arcade.load(high);
      return loaded && loaded.v === 99 && loaded.kept === 'yes' && localStorage.getItem(high) === highRaw && !Arcade.held[high] && Arcade.save(high, loaded) === true;
    });

    const oldKey = PREFIX + 'old';
    const oldRaw = '{"v":1,"coins":4,"flag":"kept"}';
    let fromSeen = null;
    check('an older save runs migrate and the stored text stays put', () => {
      localStorage.setItem(oldKey, oldRaw);
      Arcade.versions[oldKey] = 3;
      Arcade.migrates[oldKey] = (save, fromVersion) => { fromSeen = fromVersion; return { v: 3, coins: save.coins, flag: save.flag, stepped: true }; };
      const loaded = Arcade.load(oldKey);
      const stored = localStorage.getItem(oldKey) === oldRaw;
      const migrated = !!loaded && fromSeen === 1 && loaded.v === 3 && loaded.coins === 4 && loaded.flag === 'kept' && loaded.stepped === true;
      const stillSaves = Arcade.save(oldKey, loaded) === true && JSON.parse(localStorage.getItem(oldKey)).v === 3;
      return stored && migrated && stillSaves && !Arcade.held[oldKey];
    });
    const sameKey = PREFIX + 'same';
    let sameCalled = false;
    check('a save at the current version is not migrated', () => {
      const raw = '{"v":2,"coins":8}';
      localStorage.setItem(sameKey, raw);
      Arcade.versions[sameKey] = 2;
      Arcade.migrates[sameKey] = () => { sameCalled = true; return { v: 9 }; };
      const loaded = Arcade.load(sameKey);
      return !sameCalled && loaded && loaded.v === 2 && loaded.coins === 8 && localStorage.getItem(sameKey) === raw && !Arcade.held[sameKey];
    });
    const bareKey = PREFIX + 'bare';
    let bareCalled = false;
    check('an older save with no migrate function is returned as stored', () => {
      const raw = '{"v":1,"coins":2}';
      localStorage.setItem(bareKey, raw);
      Arcade.versions[bareKey] = 4;
      Arcade.migrates[bareKey] = () => { bareCalled = true; };
      delete Arcade.migrates[bareKey];
      const loaded = Arcade.load(bareKey);
      return !bareCalled && loaded && loaded.v === 1 && loaded.coins === 2 && localStorage.getItem(bareKey) === raw && Arcade.save(bareKey, loaded) === true;
    });

    const newKey = PREFIX + 'newer';
    const newRaw = '{"v":5,"coins":9,"kept":true}';
    const beforeNewer = snap();
    localStorage.setItem(newKey, newRaw);
    Arcade.versions[newKey] = 2;
    Arcade.migrates[newKey] = () => { throw Error('migrate must not run for a newer save'); };
    const loadedNewer = Arcade.load(newKey);
    const notice = document.querySelector('[data-arc-held="' + newKey + '"]');
    check('a newer save is refused and the notice says progress will not be saved', () => {
      return loadedNewer === null && Arcade.held[newKey] === NOTE && !!notice && notice.textContent === NOTE && !notice.hidden;
    });
    check('a newer save leaves the stored data untouched and turns saving off', () => {
      const afterLoad = localStorage.getItem(newKey) === newRaw;
      const saved = Arcade.save(newKey, { v: 2, coins: 0 });
      const erased = Arcade.erase(newKey, 'engine-savever-test');
      const again = Arcade.save(newKey, { v: 2, coins: 1, extra: true });
      return afterLoad && saved === false && again === false && localStorage.getItem(newKey) === newRaw && Arcade.held[newKey] === NOTE && erased === undefined;
    });
    check('refusing a newer save does not stop another game saving', () => {
      const other = PREFIX + 'other';
      const ok = Arcade.save(other, { coins: 6 }) === true && Arcade.load(other).coins === 6 && !Arcade.held[other];
      return ok && localStorage.getItem(newKey) === newRaw && beforeNewer[newKey] === undefined;
    });
    const toolsHtml = Arcade.saveToolsHTML(newKey);
    check('the save box shows the newer-save notice', () => toolsHtml.indexOf(NOTE) >= 0 && toolsHtml.indexOf('arc-held-note') >= 0);

    const bkKey = PREFIX + 'backup';
    check('a save with no version still keeps an automatic backup', () => {
      forget(bkKey);
      if (!Arcade.save(bkKey, { team: ['Ada'], coins: 7 })) return false;
      const raw = localStorage.getItem(bkKey);
      const recent = Arcade.backups(bkKey).find(b => b.k.endsWith(':auto-recent'));
      const day = Arcade.backups(bkKey).some(b => b.k.indexOf(':auto-day-') >= 0);
      return !!recent && recent.data === raw && JSON.parse(recent.data).coins === 7 && day && Arcade.saveToolsHTML(bkKey).indexOf('data-arcsave="download"') >= 0 && Arcade.saveToolsHTML(bkKey).indexOf('data-arcsave="restore"') >= 0;
    });
    check('a damaged save with no version loads from the newest backup', () => {
      const raw = localStorage.getItem(bkKey);
      localStorage.setItem(bkKey, '{"team":[broken');
      const loaded = Arcade.load(bkKey);
      const primary = localStorage.getItem(bkKey) === '{"team":[broken';
      const backup = Arcade.backups(bkKey).some(b => b.data === raw);
      const ok = !!loaded && loaded.coins === 7 && Array.isArray(loaded.team) && Arcade.recovered[bkKey] && primary && backup && !Arcade.held[bkKey];
      document.querySelectorAll('[role="status"]').forEach(el => { if (/could not be read/.test(el.textContent)) el.remove(); });
      return ok;
    });
    check('an exported code and a downloaded file both bring the same save back', () => {
      const file = { team: ['Ada'], coins: 7 };
      return Arcade.decodeAny(Arcade.encode(file)).coins === 7 && Arcade.decodeAny(JSON.stringify(file)).coins === 7 && Arcade.decode(Arcade.encode(file)).team[0] === 'Ada';
    });

    const boxKey = PREFIX + 'export';
    const exportRaw = '{"v":1,"coins":11,"name":"Ada"}';
    localStorage.setItem(boxKey, exportRaw);
    document.querySelector('#tools').innerHTML = Arcade.saveToolsHTML(boxKey);
    const blobs = [];
    const origUrl = URL.createObjectURL;
    URL.createObjectURL = blob => { blobs.push(blob); return origUrl.call(URL, blob); };
    try { document.querySelector('#tools [data-arcsave="download"]').click(); }
    finally { URL.createObjectURL = origUrl; }
    const exported = blobs[0] ? await blobs[0].text() : '';
    check('download exports the stored save unchanged', () => exported === exportRaw && localStorage.getItem(boxKey) === exportRaw);
    document.querySelector('#tools').innerHTML = Arcade.saveToolsHTML(newKey);
    const heldBlobs = [];
    URL.createObjectURL = blob => { heldBlobs.push(blob); return origUrl.call(URL, blob); };
    try { document.querySelector('#tools [data-arcsave="download"]').click(); }
    finally { URL.createObjectURL = origUrl; }
    const heldExport = heldBlobs[0] ? await heldBlobs[0].text() : '';
    check('a newer save can still be exported and stays byte for byte', () => heldExport === newRaw && localStorage.getItem(newKey) === newRaw);

    const recKey = PREFIX + 'recover';
    const recRaw = '{"v":1,"coins":4,"flag":"kept"}';
    check('recovery of an older backup migrates in memory and leaves both copies stored', () => {
      localStorage.setItem('arcade-backup:' + recKey + ':auto-recent', JSON.stringify({ at: Date.now(), why: 'automatic (every 10 minutes)', data: recRaw, ver: '' }));
      localStorage.setItem(recKey, '{"v":1,');
      Arcade.versions[recKey] = 2;
      Arcade.migrates[recKey] = (save, fromVersion) => ({ v: 2, coins: save.coins, flag: save.flag, from: fromVersion });
      const loaded = Arcade.load(recKey);
      const backup = Arcade.backups(recKey).find(b => b.k.endsWith(':auto-recent'));
      document.querySelectorAll('[role="status"]').forEach(el => { if (/could not be read/.test(el.textContent)) el.remove(); });
      return !!loaded && loaded.v === 2 && loaded.coins === 4 && loaded.flag === 'kept' && loaded.from === 1 && localStorage.getItem(recKey) === '{"v":1,' && !!backup && backup.data === recRaw && !Arcade.held[recKey];
    });
    const skipKey = PREFIX + 'skip-newer-backup';
    const primaryNew = '{"v":6,"coins":3,"kept":"primary"}';
    const backupOld = '{"v":1,"coins":1}';
    check('a readable newer save is not replaced by an older backup', () => {
      localStorage.setItem(skipKey, primaryNew);
      localStorage.setItem('arcade-backup:' + skipKey + ':auto-recent', JSON.stringify({ at: Date.now() - 1000, why: 'automatic (every 10 minutes)', data: backupOld, ver: '' }));
      Arcade.versions[skipKey] = 2;
      let called = false;
      Arcade.migrates[skipKey] = () => { called = true; return { v: 2 }; };
      const loaded = Arcade.load(skipKey);
      return loaded === null && !called && !Arcade.recovered[skipKey] && localStorage.getItem(skipKey) === primaryNew && Arcade.backups(skipKey)[0].data === backupOld && Arcade.held[skipKey] === NOTE && Arcade.save(skipKey, { v: 2 }) === false && localStorage.getItem(skipKey) === primaryNew;
    });

    const throwKey = PREFIX + 'throw';
    const throwRaw = '{"v":1,"coins":5,"kept":"yes"}';
    localStorage.setItem(throwKey, throwRaw);
    Arcade.versions[throwKey] = 3;
    Arcade.migrates[throwKey] = () => { throw Error('migrate failed'); };
    const thrownLoad = Arcade.load(throwKey);
    const thrownNotice = document.querySelector('[data-arc-held="' + throwKey + '"]');
    check('a migrate that throws leaves the save untouched and turns saving off', () => {
      return thrownLoad === null && localStorage.getItem(throwKey) === throwRaw && Arcade.held[throwKey] === NOTE && !!thrownNotice && thrownNotice.textContent === NOTE && Arcade.save(throwKey, { v: 3, coins: 0 }) === false && localStorage.getItem(throwKey) === throwRaw;
    });

    const nullKey = PREFIX + 'null-migrate';
    const nullRaw = '{"v":1,"coins":6,"kept":"byte"}';
    localStorage.setItem(nullKey, nullRaw);
    Arcade.versions[nullKey] = 4;
    Arcade.migrates[nullKey] = () => null;
    const nullLoad = Arcade.load(nullKey);
    const nullNotice = document.querySelector('[data-arc-held="' + nullKey + '"]');
    check('a migrate that returns null holds the session and leaves the stored text byte for byte', () => {
      const held = nullLoad === null && Arcade.held[nullKey] === NOTE && !!nullNotice && nullNotice.textContent === NOTE;
      const saved = Arcade.save(nullKey, { v: 4, coins: 0 }) === false;
      return held && saved && localStorage.getItem(nullKey) === nullRaw;
    });

    const undefKey = PREFIX + 'undefined-migrate';
    const undefRaw = '{"v":1,"coins":8,"flag":"kept"}';
    let undefCalled = false;
    check('a migrate that returns undefined still loads the save', () => {
      localStorage.setItem(undefKey, undefRaw);
      Arcade.versions[undefKey] = 2;
      Arcade.migrates[undefKey] = (save, fromVersion) => { undefCalled = fromVersion; return undefined; };
      const loaded = Arcade.load(undefKey);
      const same = !!loaded && loaded.v === 1 && loaded.coins === 8 && loaded.flag === 'kept' && undefCalled === 1;
      const stillSaves = Arcade.save(undefKey, loaded) === true && JSON.parse(localStorage.getItem(undefKey)).coins === 8;
      return same && stillSaves && !Arcade.held[undefKey];
    });

    const heldEraseKey = PREFIX + 'held-erase';
    const heldEraseRaw = '{"v":2,"coins":3,"kept":"hub"}';
    const heldEraseId = 'engine-held-erase-game';
    const heldIndexRaw = '{"' + heldEraseId + '":{"summary":"Held journey","detail":"still on the hub","last":1},"other-game":{"summary":"Other","detail":"stays","last":2}}';
    check('erase on a held key keeps the save and the hub row', () => {
      localStorage.setItem(heldEraseKey, heldEraseRaw);
      localStorage.setItem('arcade-index-v1', heldIndexRaw);
      Arcade.held[heldEraseKey] = NOTE;
      Arcade.erase(heldEraseKey, heldEraseId);
      const again = Arcade.save(heldEraseKey, { v: 2, coins: 0 }) === false;
      return again && localStorage.getItem(heldEraseKey) === heldEraseRaw && localStorage.getItem('arcade-index-v1') === heldIndexRaw;
    });

    const normalEraseKey = PREFIX + 'normal-erase';
    const normalEraseId = 'engine-normal-erase-game';
    const keepId = 'engine-normal-erase-keep';
    check('erase on a normal key removes the save and the hub row', () => {
      delete Arcade.versions['arcade-index-v1'];
      delete Arcade.migrates['arcade-index-v1'];
      delete Arcade.held['arcade-index-v1'];
      delete Arcade.held[normalEraseKey];
      localStorage.setItem(normalEraseKey, '{"coins":3,"note":"plain"}');
      localStorage.setItem('arcade-index-v1', JSON.stringify({
        [normalEraseId]: { summary: 'Gone', detail: 'row', last: 4 },
        [keepId]: { summary: 'Stay', detail: 'other', last: 5 }
      }));
      Arcade.erase(normalEraseKey, normalEraseId);
      const idx = JSON.parse(localStorage.getItem('arcade-index-v1'));
      return localStorage.getItem(normalEraseKey) === null && !!idx && !Object.prototype.hasOwnProperty.call(idx, normalEraseId) && idx[keepId].summary === 'Stay' && idx[keepId].detail === 'other';
    });

    const importKey = PREFIX + 'import';
    const importCurrent = '{"v":2,"coins":3,"mine":true}';
    const importNewer = '{"v":8,"coins":99,"kept":"newer"}';
    localStorage.setItem(importKey, importCurrent);
    Arcade.versions[importKey] = 2;
    Arcade.validators[importKey] = (o) => !!(o && o.v === 2);
    const importStored = () => Object.keys(localStorage).filter(k => k.indexOf(importKey) >= 0).sort().map(k => k + '=' + localStorage.getItem(k)).join('\n');
    const importBefore = importStored();
    let importMessage = '';
    try { Arcade.replaceSave(importKey, importNewer, 'before loading a file'); importMessage = 'did not throw'; }
    catch (e) { importMessage = e.message; }
    const importAfter = importStored();
    localStorage.setItem('arcade-backup:' + importKey + ':manual', JSON.stringify({ at: 1, why: 'manual', data: importNewer, ver: '' }));
    document.querySelector('#tools').innerHTML = Arcade.saveToolsHTML(importKey);
    const confirmPrev = window.confirm;
    window.confirm = () => true;
    try { document.querySelector('#tools [data-arcsave="restore"]').click(); }
    finally { window.confirm = confirmPrev; }
    const restoreMessage = document.querySelector('#tools .arc-save-msg').textContent;
    check('import and restore reject a newer file before writing', () => {
      return importMessage === NOTE && importBefore === importAfter && restoreMessage === NOTE && localStorage.getItem(importKey) === importCurrent && JSON.parse(localStorage.getItem('arcade-backup:' + importKey + ':manual')).data === importNewer;
    });
  } finally {
    wipe();
    [PREFIX + 'plain', PREFIX + 'high', PREFIX + 'old', PREFIX + 'same', PREFIX + 'bare', PREFIX + 'newer', PREFIX + 'other', PREFIX + 'backup', PREFIX + 'export', PREFIX + 'recover', PREFIX + 'skip-newer-backup', PREFIX + 'throw', PREFIX + 'null-migrate', PREFIX + 'undefined-migrate', PREFIX + 'held-erase', PREFIX + 'normal-erase', PREFIX + 'import'].forEach(forget);
  }
  return checks;
}

document.querySelector('#run').addEventListener('click', async () => {
  const button = document.querySelector('#run');
  button.disabled = true;
  try {
    const checks = await engineSaveChecks();
    const fail = checks.filter(c => !c.ok);
    document.querySelector('#results').replaceChildren(...checks.map(c => {
      const li = document.createElement('li');
      li.className = c.ok ? 'pass' : 'fail';
      li.textContent = (c.ok ? 'PASS' : 'FAIL') + ' — ' + c.label;
      return li;
    }));
    const summary = document.querySelector('#summary');
    summary.className = fail.length ? 'fail' : 'pass';
    summary.textContent = fail.length ? 'FAIL — ' + fail.length + ' of ' + checks.length + ' failed.' : 'PASS — ' + checks.length + ' shared save checks.';
  } catch (e) {
    document.querySelector('#summary').textContent = 'FAIL — ' + e.message;
  } finally {
    button.disabled = false;
  }
});
