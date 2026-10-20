'use strict';
// Read-only study checker. It never imports candidates into the game or writes saves.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
function validateStudy(data, contract, readReference) {
  const errors = [], blockers = [];
  const need = (ok, message) => { if (!ok) errors.push(message); };
  need(data?.schema_version === 1, 'Unsupported candidate schema.');
  need(contract?.schema_version === 1, 'Unsupported production contract schema.');
  need(data?.status === 'design-study-not-runtime' && data?.runtime_ready === false,
    'Candidate data must remain explicitly non-runtime-ready.');
  const species = Array.isArray(data?.species) ? data.species : [];
  const expected = contract?.species || {};
  need(species.length === Object.keys(expected).length, 'Species count differs from approved contract.');
  const ids = species.map(s => s.candidate_id);
  need(new Set(ids).size === ids.length, 'Duplicate species IDs.');
  for (const s of species) {
    const pin = expected[s.candidate_id];
    need(!!pin, 'Unknown species: ' + s.candidate_id);
    if (!pin) continue;
    const b = s.base_stats || {}, values = STATS.map(k => b[k]);
    need(Object.keys(b).sort().join() === [...STATS].sort().join(), s.name + ': exactly six canonical stat keys required.');
    need(values.every(v => Number.isInteger(v) && v >= 1 && v <= 255), s.name + ': stats must be integers from 1 to 255.');
    need(values.reduce((a, b) => a + b, 0) === s.base_stat_total, s.name + ': total does not match spread.');
    need(s.base_stat_total === pin.total, s.name + ': approved tier changed.');
    need(s.family === pin.family && s.stage === pin.stage, s.name + ': family/stage changed.');
    need(s.ability_candidate === pin.ability_candidate, s.name + ': ability candidate changed without contract review.');
    need(JSON.stringify(s.types) === JSON.stringify(pin.types), s.name + ': typing changed.');
    if (pin.preserve_spread) need(JSON.stringify(values) === JSON.stringify(pin.preserve_spread), s.name + ': preserved early-stage spread changed.');
    if (s.stage === 'mega') {
      const normal = species.find(n => n.candidate_id === s.temporary_form_of);
      need(!!normal && normal.stage === 3 && normal.family === s.family, s.name + ': invalid normal-form reference.');
      if (normal) {
        need(s.base_stat_total - normal.base_stat_total === 100, s.name + ': Mega must add exactly 100.');
        need(b.hp === normal.base_stats.hp, s.name + ': Mega HP must stay unchanged.');
        need(STATS.every(k => b[k] >= normal.base_stats[k]), s.name + ': Mega component stat decreased.');
      }
    }
  }
  for (const family of new Set(Object.values(expected).map(p => p.family))) {
    need(JSON.stringify(species.filter(s => s.family === family).map(s => s.stage).sort()) === JSON.stringify([1,2,3,'mega'].sort()), family + ': requires exactly three stages plus temporary Mega.');
  }
  need(JSON.stringify(data?.ability_contracts) === JSON.stringify(contract?.ability_contracts), 'Ability semantics changed without contract review.');
  const mega = data?.mega_contract || {};
  need(mega.temporary === true && mega.once_per_team_per_battle === true && mega.base_stat_delta === 100 &&
    mega.hp_base_stat_delta === 0 && mega.replaces_normal_ability === true && mega.persistent_save_form === false,
    'Temporary Mega contract changed.');
  need(data?.power_tier?.normal_final_total === 600 && data?.power_tier?.mega_total === 700 &&
    data?.power_tier?.starter_targets_unchanged === true, 'Stillmaw tier must be 600/700 with starter targets unchanged.');
  need(data?.art_direction?.status === 'approved-concept-direction' && data?.art_direction?.approved_by === 'Evan' &&
    data?.art_direction?.production_sprites_approved === false, 'Concept approval must not be promoted to production-sprite approval.');
  for (const [role, ref] of Object.entries(contract?.references || {})) {
    need(typeof ref.file === 'string' && /^[a-z0-9][a-z0-9.-]*\.png$/.test(ref.file), role + ': reference must be a local PNG filename.');
    if (typeof ref.file !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.png$/.test(ref.file)) continue;
    try {
      const bytes = readReference(ref.file);
      need(crypto.createHash('sha256').update(bytes).digest('hex') === ref.sha256, role + ': approved reference bytes changed.');
      need(bytes.length >= 26 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), role + ': invalid PNG.');
    } catch (e) { errors.push(role + ': reference unavailable (' + e.message + ').'); }
    if (role === 'normal' || role === 'mega') need(data.art_direction?.[role + '_reference'] === ref.file, role + ': data points to another reference.');
  }
  need(Object.keys(contract?.references || {}).sort().join() === 'early,mega,normal', 'Expected early, normal and Mega references.');
  const evolution = Array.isArray(data?.evolution_candidate) ? data.evolution_candidate : [];
  need(evolution.length === 2, 'Exactly two permanent evolution edges required.');
  const edges = [['wildbond:boglet','wildbond:bogsnap'],['wildbond:bogsnap','wildbond:stillmaw']];
  for (const [from,to] of edges) {
    const matches = evolution.filter(e => e.from === from && e.to === to);
    need(matches.length === 1 && Number.isInteger(matches[0]?.level) && matches[0].level >= 1 && matches[0].level <= 100,
      'Invalid evolution edge ' + from + ' -> ' + to);
  }
  need(contract?.production?.status === 'not-built' && contract.production.runtime_integration === false,
    'Study checker cannot certify production assets or runtime integration.');
  need(contract?.progression?.status === 'unresolved-for-600-tier', 'Higher-tier maturation remains an explicit balance decision.');
  blockers.push('Production front/back/overworld assets are not built or accepted.');
  blockers.push('Evolution levels, availability, learnsets and first-Warden roster need balance review.');
  blockers.push('Current chapter lacks abilities/critical hits/evolution/Mega support; no implementation is certified.');
  blockers.push('Existing individuals, HP/PP and save migration need an explicit runtime-owner contract.');
  return {kind:'study-contract-only', ok:errors.length === 0, errors, runtime_ready:false, blockers,
    species_checked:species.length, battle_simulations_run:0, production_assets_checked:0};
}
module.exports = {validateStudy};
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(a => a !== '--require-runtime')) throw new Error('Usage: node docs/art/bogsnap-family/check-study.cjs [--require-runtime]');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname,'balance-candidates.json'),'utf8'));
    const contract = JSON.parse(fs.readFileSync(path.join(__dirname,'production-contract.json'),'utf8'));
    const result = validateStudy(data,contract,file => fs.readFileSync(path.join(__dirname,file)));
    console.log(JSON.stringify(result,null,2));
    process.exitCode = !result.ok ? 1 : args.includes('--require-runtime') ? 2 : 0;
  } catch (e) { console.error(e.message); process.exitCode=1; }
}
