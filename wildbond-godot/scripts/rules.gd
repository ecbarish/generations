extends RefCounted
## Wildbond's rules, translated line by line from the browser game so both versions give the same numbers:
## shared/creatures.js (individual creatures, stats, XP, bonds) and games/wildbond/js/02-state.js, 03-battle.js
## (moves, damage, element advantage, how a creature picks a move, levelling up and evolving).
## The data (species, moves, elements) comes from data/wildbond.json. Random rolls come from an rng you pass in, so the
## checks in tests/run_tests.gd can fix them and compare with the browser.

const Effects := preload("res://scripts/battle_effects.gd")

const STATS := ["hp", "pow", "grd", "spd", "wit", "spi"]
const STAT_NAME := { "hp": "Health", "pow": "Power", "grd": "Guard", "spd": "Speed", "wit": "Wits", "spi": "Spirit" }
const RARITY := [
	{ "name": "Common", "m": 1.00, "traits": [0, 1], "pot": [0, 15] },
	{ "name": "Uncommon", "m": 1.06, "traits": [1, 1], "pot": [3, 18] },
	{ "name": "Rare", "m": 1.12, "traits": [1, 2], "pot": [6, 22] },
	{ "name": "Epic", "m": 1.2, "traits": [2, 2], "pot": [10, 26] },
	{ "name": "Legendary", "m": 1.3, "traits": [2, 3], "pot": [14, 29] },
	{ "name": "Mythical", "m": 1.42, "traits": [3, 3], "pot": [18, 31] },
]
const TEMPERAMENTS := {
	"bold": { "name": "Bold", "up": "pow", "down": "grd" }, "calm": { "name": "Calm", "up": "spi", "down": "spd" },
	"skittish": { "name": "Skittish", "up": "spd", "down": "hp" }, "proud": { "name": "Proud", "up": "wit", "down": "spi" },
	"playful": { "name": "Playful", "up": "spd", "down": "wit" }, "lazy": { "name": "Lazy", "up": "hp", "down": "spd" },
	"steady": { "name": "Steady", "up": "", "down": "" },
}
const TRAITS := ["ferocious", "thick", "swift", "keen", "loyal", "hardy", "lucky", "gentle"]
const BOND := [["Wary", 0], ["Friendly", 20], ["Loyal", 60], ["Devoted", 140], ["Bonded", 280]]
const ACT_AT := 2.2                           # a creature acts when its turn meter reaches this

static var DATA: Dictionary = {}

## Godot adds evolution forms after importing the shared catalogue. Give those forms the same lessons.
static func prepare_move_choices() -> void:
	var lessons: Dictionary = DATA.BATTLE_LESSONS
	for id in DATA.SPECIES:
		var species: Dictionary = DATA.SPECIES[id]
		if species.has("legacyLearn"): continue
		species["legacyLearn"] = species.learn.duplicate(true)
		var element: Array = lessons.element[species.el]
		var extra: Array = [[8, lessons.family[species.fam]], [15, element[0]], [22, element[1]], [30, element[2]]]
		var known: Array = []
		for old in species.learn:
			if not old[1] in known: known.append(old[1])
		for new_lesson in extra:
			if known.size() >= 8: break
			if not new_lesson[1] in known:
				species.learn.append(new_lesson)
				known.append(new_lesson[1])
		species.learn.sort_custom(func(a, b): return a[0] < b[0])

static func sp(c: Dictionary) -> Dictionary:
	return DATA.SPECIES[c.sp]

static func bond_lvl(c: Dictionary) -> int:
	var l := 0
	for i in BOND.size():
		if c.bond >= BOND[i][1]:
			l = i
	return l

## A new creature (Creatures.make). opts: rar, temp, traits, pot, name. Rolls what isn't given.
static func make(species_id: String, lvl: int, opts: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var rar: int = opts.get("rar", 0)
	var pr: Array = RARITY[rar].pot
	var pot := {}
	for s in STATS:
		pot[s] = opts.pot[s] if opts.has("pot") and opts.pot.has(s) else rng.randi_range(pr[0], pr[1])
	var traits: Array = opts.get("traits", [])
	if not opts.has("traits"):
		var n := rng.randi_range(RARITY[rar].traits[0], RARITY[rar].traits[1])
		while traits.size() < n:
			var k: String = TRAITS[rng.randi() % TRAITS.size()]
			if k not in traits:
				traits.append(k)
	var c := { "sp": species_id, "name": opts.get("name", DATA.SPECIES[species_id].name), "lvl": lvl, "xp": 0, "rar": rar,
		"pot": pot, "temp": opts.get("temp", TEMPERAMENTS.keys()[rng.randi() % TEMPERAMENTS.size()]), "traits": traits, "bond": 0.0 }
	c.hp = stats(c).hp
	c["moves"] = default_moves(c)
	return c

## Breeding (games/wildbond/js/07-ranch.js breedInfo, shared/creatures.js breed): which pairs can have an egg, and
## what hatches. Same family: one of the parents' base forms. Some different families make a hybrid (HYBRIDS).
const BREED_COST := 80
static func base_form(id: String) -> String:
	for k in DATA.SPECIES:
		var e = DATA.SPECIES[k].get("evo")
		if e and str(e.to) == id:
			return base_form(k)
	for k in DATA.get("EVOS", {}):
		for o in DATA.EVOS[k]:
			if str(o.to) == id:
				return base_form(k)
	return id

static func breed_info(a: Dictionary, b: Dictionary) -> Dictionary:
	if a.is_empty() or b.is_empty() or a == b:
		return { "ok": false, "why": "Two different creatures are needed." }
	if sp(a).get("unique", false) or sp(b).get("unique", false):
		return { "ok": false, "why": "Guardians don't have eggs. They belong to their places." }
	for c in [a, b]:
		if c.lvl < 8:
			return { "ok": false, "why": "%s is too young yet (level 8 at least)." % c.name }
		if bond_lvl(c) < 1:
			return { "ok": false, "why": "%s doesn't trust you enough yet (Friendly at least)." % c.name }
	var fa: String = sp(a).fam
	var fb: String = sp(b).fam
	if fa == fb:
		var opts: Array = []
		for id in [base_form(a.sp), base_form(b.sp)]:
			if id not in opts:
				opts.append(id)
		return { "ok": true, "opts": opts, "text": "Same family: the egg will hatch into %s." % " or ".join(opts.map(func(i): return DATA.SPECIES[i].name)) }
	var pair := [fa, fb]
	pair.sort()
	var hy: String = DATA.get("HYBRIDS", {}).get("+".join(pair), "")
	if hy != "":
		return { "ok": true, "opts": [hy], "hybrid": true, "text": "These two seem to get along... something new might hatch." }
	return { "ok": false, "why": "These two families won't have an egg together. Try a pair from the same family, or experiment." }

static func breed(a: Dictionary, b: Dictionary, id: String, rng: RandomNumberGenerator) -> Dictionary:
	var pot := {}
	for s in STATS:
		var lo := mini(int(a.pot[s]), int(b.pot[s]))
		var hi := maxi(int(a.pot[s]), int(b.pot[s]))
		var v := rng.randi_range(lo, hi)
		if rng.randf() < 0.12:
			v = mini(31, hi + rng.randi_range(1, 3))         # now and then, better than either parent
		pot[s] = v
	var traits: Array = []
	for t in a.traits + b.traits:
		if t not in traits and rng.randf() < 0.5:
			traits.append(t)
	var rar: int = clampi(maxi(int(a.rar), int(b.rar)) - (1 if rng.randf() < 0.6 else 0) + (1 if rng.randf() < 0.05 else 0), 0, 5)
	var c := make(id, 3, { "rar": rar, "pot": pot, "traits": traits.slice(0, 3), "temp": [a.temp, b.temp][rng.randi() % 2] }, rng)
	c.bond = 20.0
	c["gen"] = maxi(int(a.get("gen", 1)), int(b.get("gen", 1))) + 1
	c["parents"] = [a.name, b.name]
	return c

## Stats from species, potential, level, temperament, rarity and bond (Creatures.stats): a Pokemon-style curve.
static func stats(c: Dictionary) -> Dictionary:
	var base: Dictionary = sp(c).base
	var t: Dictionary = TEMPERAMENTS.get(c.temp, TEMPERAMENTS.steady)
	var rm: float = RARITY[c.rar].m
	var bl := bond_lvl(c)
	var out := {}
	for s in STATS:
		var v: float = floorf((2.0 * base[s] + c.pot[s]) * c.lvl / 100.0)
		v = v + c.lvl + 10 if s == "hp" else v + 5
		v += floorf(float(c.get("train", {}).get(s, 0)) / 4.0)
		if t.up == s: v *= 1.1
		if s == "grd" and str(c.get("gear", "")) == "harness": v *= 1.1
		if t.down == s: v *= 0.9
		out[s] = maxi(1, roundi(v * rm * (1.0 + 0.02 * bl)))
	return out

static func xp_need(lvl: int) -> int:
	return roundi(5.0 * pow(lvl, 2.2) + 15.0)

## XP for a win (WB3.6b, after T56's pacing test). The browser's reward (foe levels x 12) grew with level while the XP
## needed grew with level^2.2, so a level cost 24 even-level wins at level 5 and 390 by level 55: fine for an idle game,
## a wall when every battle is played by hand. Now a win is worth a share of the level you're fighting at, so a level
## costs about WINS_PER_LEVEL even-level wild wins all the way through (trainer battles count 1.6 times). The foe's level
## counts up to 3 above yours (beating stronger creatures is worth more, but you can't leap); weaker foes are worth less
## because the curve is steep. journey_xp is the journey's XP setting (Classic 0.13, Breezy 0.36, Long Road 0.08).
const WINS_PER_LEVEL := 12.0                 # Evan chose 12 (2026-10-09): training before each Warden matters
static func win_xp(foe_count: int, foe_avg_lvl: float, my_lvl: int, trainer: bool, journey_xp: float) -> float:
	var at := clampi(roundi(foe_avg_lvl), 1, my_lvl + 3)
	return foe_count * xp_need(at) / WINS_PER_LEVEL * (journey_xp / 0.13) * (1.6 if trainer else 1.0)

## Learned moves stay available; Maren's workbench chooses up to four to bring.
static func default_moves(c: Dictionary) -> Array:
	var known := learned_moves(c)
	var chosen := known.slice(-4)
	if not chosen.any(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"]):
		var attacks := known.filter(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"])
		if not attacks.is_empty(): chosen[0] = attacks[-1]
	return chosen

static func learned_moves(c: Dictionary) -> Array:
	var out: Array = []
	for l in sp(c).learn:
		if l[0] <= c.lvl and l[1] not in out:
			out.append(l[1])
	return out

static func moves_of(c: Dictionary) -> Array:
	var known := learned_moves(c)
	var chosen: Array = []
	if c.get("moves") is Array:
		for m in c.moves:
			if m in known and m not in chosen:
				chosen.append(m)
	if chosen.is_empty():
		# Old saves keep the four moves they had before WD3, until their player chooses.
		for l in sp(c).get("legacyLearn", sp(c).learn):
			if l[0] <= c.lvl and l[1] not in chosen:
				chosen.append(l[1])
		chosen = chosen.slice(-4)
	if chosen.is_empty():
		chosen = known.slice(-4)
	chosen = chosen.slice(0, 4)
	if not chosen.any(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"]):
		var attacks := known.filter(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"])
		if not attacks.is_empty():
			if chosen.size() < 4: chosen.append(attacks[-1])
			else: chosen[0] = attacks[-1]
	return chosen

static func keep_moves(c: Dictionary, list: Array) -> bool:
	var known := learned_moves(c)
	if list.is_empty() or list.size() > 4:
		return false
	var clean: Array = []
	for m in list:
		if m not in known or m in clean:
			return false
		clean.append(m)
	if not clean.any(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"]):
		return false
	c["moves"] = clean.duplicate()
	return true

## XP in, levels out: new moves and evolution included (grow). Returns the messages to show.
static func grow(c: Dictionary, xp: int, cap: int) -> Array:
	var msgs: Array = []
	var before := learned_moves(c)
	var chosen := moves_of(c)
	var gained := 0
	if c.lvl < cap:
		c.xp += xp
		while c.lvl < cap and c.xp >= xp_need(c.lvl):
			c.xp -= xp_need(c.lvl)
			c.lvl += 1
			gained += 1
		if c.lvl >= cap:
			c.xp = 0
	if gained > 0:
		msgs.append("%s grew to level %d!" % [c.name, c.lvl])
		for m in learned_moves(c):
			if m not in before:
				if chosen.size() < 4:
					chosen.append(m)
				msgs.append("%s learned %s!" % [c.name, DATA.MOVES[m].name])
		c["moves"] = chosen
		var st := stats(c)
		c.hp = mini(st.hp, c.hp + roundi(st.hp * 0.2))
	return msgs

## The ways a creature can change (data/evolution.json, or the browser game's single level evolution).
static func evo_options(c: Dictionary) -> Array:
	var evos: Dictionary = DATA.get("EVOS", {})
	if evos.has(c.sp):
		return evos[c.sp]
	var evo = sp(c).get("evo")
	return [evo] if evo else []

## What a creature is ready to become right now, or "". ctx: place (the map's area), team (species ids with it).
## Conditions: level (at), trust (bond: 1 Friendly .. 4 Bonded), a place, a companion (with). First match wins.
static func evo_target(c: Dictionary, ctx: Dictionary = {}) -> String:
	for o in evo_options(c):
		if c.lvl < int(o.at):
			continue
		if o.has("place") and str(ctx.get("place", "")) != str(o.place):
			continue
		if o.has("bond") and bond_lvl(c) < int(o.bond):
			continue
		if o.has("with") and str(o.with) not in ctx.get("team", []):
			continue
		return str(o.to)
	return ""

## Change a creature into its new form, keeping everything that makes it itself (and a name you gave it).
static func evolve(c: Dictionary, to: String) -> String:
	var old: String = c.name
	var was_default: bool = c.name == sp(c).name
	c.sp = to
	if was_default:
		c.name = sp(c).name
	c.erase("hold")
	var st := stats(c)
	c.hp = mini(st.hp, c.hp + roundi(st.hp * 0.3))
	return old

static func add_bond(c: Dictionary, v: float) -> bool:
	var b := bond_lvl(c)
	c.bond += v * (1.5 if "loyal" in c.traits else 1.0)
	return bond_lvl(c) > b

## Element advantage: 1.5 when the move's element beats the target's, 0.67 when the target's beats it.
static func advantage(el, target: Dictionary) -> float:
	if el == null or el == "":
		return 1.0
	var te: String = sp(target).el
	if te in DATA.ELEMENTS[el].beats:
		return 1.5
	if DATA.ELEMENTS.has(te) and el in DATA.ELEMENTS[te].beats:
		return 0.67
	return 1.0

## Damage (03-battle.js damage). att/def are battle units: { c, st, side, buff }. roll is the 0-1 random spread, crit_roll
## decides a critical hit, so a check can fix both.
static func damage(att: Dictionary, def: Dictionary, mv: Dictionary, mult: float, roll: float, crit_roll: float) -> Dictionary:
	var spec: bool = mv.get("spec", 0) == 1
	var A: float = att.st.wit if spec else att.st.pow
	var D: float = def.st.spi if spec else def.st.grd
	var d: float = ((2.0 * att.c.lvl / 5.0 + 2.0) * mv.pow * A / maxf(1.0, D)) / 50.0 + 2.0
	var el = mv.get("el")
	var adv := advantage(el, def.c)
	d *= (1.2 if el != null and el == sp(att.c).el else 1.0) * adv * (0.85 + roll * 0.15) * mult
	if att.buff.get("dmg", 0.0) > 0: d *= 1.25
	if att.get("joined", false): d *= 1.6                 # the wild bond (battle.gd _join): one form, both strengths
	if def.get("joined", false): d *= 0.6
	d *= Effects.modifier(att, def, mv)
	if def.buff.get("guard", 0.0) > 0 and not mv.get("pierce", false) and not mv.get("breakGuard", false): d *= 0.5 if def.side == "a" and def.buff.get("guardCmd", 0) else 0.6
	if "ferocious" in att.c.traits: d *= 1.1
	if "thick" in def.c.traits: d *= 0.9
	if el != null and gear_of(def.c).get("resist", "") == el: d *= 0.75
	var crit := crit_roll < 0.06 + (0.08 if "keen" in att.c.traits else 0.0)
	if crit: d *= 1.5
	return { "d": maxi(1, roundi(d)), "crit": crit, "adv": adv }

## How a creature picks its move when nobody tells it (chooseMove, without Hardcore).
static func choose_move(u: Dictionary, allies: Array, rng: RandomNumberGenerator, enemies: Array = [], plan: String = "") -> String:
	var moves: Array = moves_of(u.c).filter(func(m): return not (u.cds.get(m, 0.0) > 0))
	if not enemies.is_empty():
		return tactical_move(u, allies, enemies, plan)
	var low = allies.filter(func(x): return x.c.hp < x.st.hp * 0.45)
	if not low.is_empty() and "regrowth" in moves:
		return "regrowth"
	for m in moves:
		var k: String = DATA.MOVES[m].kind
		if k == "buff" and not allies.any(func(x): return x.buff.get("dmg", 0.0) > 0): return m
		if k == "haste" and not allies.any(func(x): return x.buff.get("haste", 0.0) > 0): return m
		if k == "guard" and not allies.any(func(x): return x.buff.get("guard", 0.0) > 0) and rng.randf() < 0.6: return m
		if (k == "slow" or k == "dot") and rng.randf() < 0.5: return m
	var dmg: Array = moves.filter(func(m): return DATA.MOVES[m].kind in ["hit", "aoe", "dot"])
	dmg.sort_custom(func(a, b): return DATA.MOVES[a].pow > DATA.MOVES[b].pow)
	return dmg[0] if not dmg.is_empty() else moves_of(u.c)[0]

## Enemy tactics score ready moves against the situation rather than raw power alone.
static func move_value(u: Dictionary, m: String, allies: Array, enemies: Array, plan: String = "") -> float:
	var mv: Dictionary = DATA.MOVES[m]
	if u.cds.get(m, 0.0) > 0:
		return -1.0
	var low := 1.0
	for a in allies:
		low = minf(low, float(a.c.hp) / a.st.hp)
	if mv.kind == "heal":
		var sick: bool = allies.any(func(a): return not Effects.label(a).is_empty() or not a.get("dots", []).is_empty())
		return 115.0 if mv.get("cleanse", false) and sick else (100.0 if low < 0.45 else 0.0)
	if mv.kind in ["buff", "haste", "guard"]:
		if mv.get("cleanse", false) and allies.any(func(a): return not Effects.label(a).is_empty() or not a.get("dots", []).is_empty()): return 110.0
		var key: String = {"buff": "dmg", "haste": "haste", "guard": "guard"}[mv.kind]
		var useful: bool = not allies.any(func(a): return a.buff.get(key, 0.0) > 0)
		return (65.0 if plan in ["shelter", "patient"] else 38.0) if useful else 0.0
	if mv.kind == "slow":
		return 52.0 if enemies.any(func(e): return e.buff.get("slow", 0.0) <= 0) else 0.0
	if enemies.is_empty():
		return 0.0
	var value := 0.0
	for target in enemies:
		var score := float(mv.get("pow", 0)) * (1.2 if mv.get("el") != null and mv.el == sp(u.c).el else 1.0) * advantage(mv.get("el"), target.c) * Effects.modifier(u, target, mv)
		if target.buff.get("guard", 0.0) > 0:
			score *= 1.4 if mv.get("breakGuard", false) else (1.1 if mv.get("pierce", false) else 0.6)
		if mv.has("status") and not Effects.active(target, str(mv.status)):
			score += 28.0 if plan in ["setup", "patient"] else 14.0
		if mv.kind == "aoe":
			score *= 0.75 * enemies.size()
		value = maxf(value, score)
	return value

static func tactical_move(u: Dictionary, allies: Array, enemies: Array, plan: String = "") -> String:
	var best := ""
	var value := -2.0
	for m in moves_of(u.c):
		var next := move_value(u, m, allies, enemies, plan)
		if next > value:
			value = next
			best = m
	return best if value >= 0 else ""

## A move in plain words (moveInfo), for the move list.
static func move_info(m: String) -> String:
	var mv: Dictionary = DATA.MOVES[m]
	if mv.has("text"):
		return str(mv.text)
	var extra := ""
	if mv.get("breakGuard", false): extra = "; breaks guard"
	elif mv.get("pierce", false): extra = "; ignores guard"
	elif mv.has("status"): extra = "; " + {"soaked": "sets up Steam Burst", "scorched": "burns; weakens physical hits", "rooted": "slows turns; sets up rooted follow-ups", "sleep": "pauses turns until hit or waking", "marked": "the next hit lands 25% harder"}[str(mv.status)]
	elif mv.has("combo"): extra = "; stronger on " + Effects.LABEL[str(mv.combo)].to_lower() + " foes"
	var el: String = (mv.el + " ") if mv.get("el") != null else ""
	var how := "special (uses Wits)" if mv.get("spec", 0) == 1 else "physical (uses Power)"
	match mv.kind:
		"hit": return "%s%s attack, power %d" % [el, how, mv.pow] + extra
		"aoe": return "%shits every foe, power %d" % [el, mv.pow]
		"dot": return "%spoisons a foe over time" % el
		"buff": return "your team hits harder for a while"
		"haste": return "your team acts faster for a while"
		"guard": return "your team braces against damage" + ("; clears harmful effects" if mv.get("cleanse", false) else "")
		"slow": return "slows a foe down"
		"heal": return "heals your most hurt ally" + ("; clears harmful effects" if mv.get("cleanse", false) else "")
	return ""

## How fast a unit's turn meter fills each second (battleTick).
static func atb_rate(u: Dictionary) -> float:
	if Effects.active(u, "sleep"):
		return 0.0
	return (1.35 if u.get("joined", false) else 1.0) * (0.65 if Effects.active(u, "rooted") else 1.0) * (u.st.spd + 40.0) / 100.0 * (1.3 if u.buff.get("haste", 0.0) > 0 else 1.0) * (0.6 if u.buff.get("slow", 0.0) > 0 else 1.0) * (1.1 if "swift" in u.c.traits else 1.0)

## A wild creature's rarity (Creatures.rollRarity): boost raises the odds (lures, traits, a Long Road lowers them).
static func roll_rarity(boost: float, rng: RandomNumberGenerator) -> int:
	var r := rng.randf() / (1.0 + boost)
	return 3 if r < 0.004 else (2 if r < 0.03 else (1 if r < 0.15 else 0))

## A list in plain words: "A", "A and B", "A, B and C".
static func words(list: Array) -> String:
	var l: Array = list.map(func(x): return str(x))
	if l.size() <= 2:
		return " and ".join(l)
	return ", ".join(l.slice(0, -1)) + " and " + l[-1]

## Creature gear (docs/proposals/creature-catalogue-and-evolution.md §3): made at Maren's workbench in the barn. Each
## piece does one thing and shows on the creature that wears it. One piece each.
const GEAR := {
	"harness": { "name": "Leather Harness", "cost": 60, "col": "8a5a32", "text": "Light armour of soft leather. It takes knocks a little better." },
	"bell": { "name": "Calm Bell", "cost": 70, "col": "e8c040", "text": "A soft bell on a cord. Trust grows half again as fast in battle." },
	"ribbon": { "name": "Swift Ribbon", "cost": 70, "col": "e04a8a", "text": "A bright ribbon on the tail. It's quicker off the mark when a battle starts." },
	"ember": { "name": "Ember-Glass Band", "cost": 90, "col": "e0602a", "resist": "Ember", "text": "Cool glass from Emberfall's vents. Ember moves hurt it a quarter less." },
	"tide": { "name": "Shell Charm", "cost": 90, "col": "6ab0e8", "resist": "Tide", "text": "Saltmarsh shells on a cord. Tide moves hurt it a quarter less." },
	"grove": { "name": "Bark Charm", "cost": 90, "col": "5d9a3e", "resist": "Grove", "text": "A knot of Thornwood bark. Grove moves hurt it a quarter less." },
	"stone": { "name": "Slate Charm", "cost": 90, "col": "9a9488", "resist": "Stone", "text": "A thin slate from the high pass. Stone moves hurt it a quarter less." },
}

static func gear_of(c: Dictionary) -> Dictionary:
	return GEAR.get(str(c.get("gear", "")), {})
