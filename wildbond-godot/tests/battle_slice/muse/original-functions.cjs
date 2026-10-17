// User-provided Muse demo; isolated original functions for comparison, not a runtime dependency.
const TYPE_CHART={
        Fire: { Grass: 2, Fire: .5, Water: .5, Rock: .5 },
        Water: { Fire: 2, Rock: 2, Water: .5, Grass: .5 },
        Grass: { Water: 2, Rock: 2, Fire: .5, Grass: .5 },
        Electric: { Water: 2, Electric: .5, Grass: .5 },
        Rock: { Fire: 2, Electric: 2, Rock: .5 },
        Normal: {}
      };
const ORBS={
        snare: { name: "Snare Orb", bonus: 1, start: 5 },
        great: { name: "Great Snare", bonus: 1.5, start: 3 },
        ultra: { name: "Ultra Snare", bonus: 2, start: 2 }
      };
let state;
      function stageMultiplier(stage) {
        return stage >= 0 ? (2 + stage) / 2 : 2 / (2 + Math.abs(stage));
      }
      function effectiveSpeed(creature) {
        return Math.floor(creature.speed * (creature.status === "paralysis" ? .5 : 1));
      }
      function effectiveness(moveType, targetType) {
        return (TYPE_CHART[moveType] && TYPE_CHART[moveType][targetType]) || 1;
      }
      function calculateDamage(attacker, defender, move) {
        const attackBase = move.category === "physical" ? attacker.attack : attacker.spAttack;
        const defenseBase = move.category === "physical" ? defender.defense : defender.spDefense;
        const stage = move.category === "physical" ? attacker.stages.attack : 0;
        const attackUsed = attackBase * stageMultiplier(stage);
        const levelTerm = Math.floor(2 * attacker.level / 5 + 2);
        const scaled = Math.floor(levelTerm * move.power * attackUsed / defenseBase);
        const base = Math.floor(scaled / 50) + 2;
        const stab = move.type === attacker.type ? 1.5 : 1;
        const type = effectiveness(move.type, defender.type);
        const random = .85 + Math.random() * .15;
        const burn = attacker.status === "burn" && move.category === "physical" ? .5 : 1;
        const damage = Math.max(1, Math.floor(base * stab * type * random * burn));
        return { damage, levelTerm, attackBase, stage, stageMultiplier: stageMultiplier(stage), attackUsed, defenseBase, scaled, base, stab, type, random, burn };
      }
      function computeCatch(orbKey, timing) {
        const target = state.wild;
        const orb = ORBS[orbKey];
        const rawBase = ((3 * target.maxHp - 2 * target.hp) * 45 * orb.bonus) / (3 * target.maxHp);
        const baseA = Math.floor(rawBase);
        const statusBonus = (target.status === "sleep" || target.status === "frozen") ? 2 : (target.status === "paralysis" || target.status === "burn" || target.status === "poison") ? 1.5 : 1;
        const modified = baseA * statusBonus * timing.bonus;
        const a = Math.min(255, Math.floor(modified));
        const guaranteed = a >= 255;
        const b = guaranteed ? 65536 : Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a))));
        const perShake = guaranteed ? 1 : Math.min(1, b / 65536);
        return { rawBase, baseA, statusBonus, timingBonus: timing.bonus, a, b, perShake, guaranteed, orb };
      }
module.exports={stageMultiplier,effectiveSpeed,calculateDamage,compute:(target,orb,timing)=>{state={wild:target};return computeCatch(orb,{bonus:timing});}};
