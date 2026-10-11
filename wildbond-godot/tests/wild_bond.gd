extends RefCounted
## WB4.2: the wild bond. Only your last creature, badly hurt and trusting you completely, in a battle that matters,
## once a day; it looks back first; Run's place becomes "Stand with it"; joined you hit harder and take less; then
## you're both spent; the first time is named afterwards and remembered in the save.
const R := preload("res://scripts/rules.gd")
static func run(main: Node, check: Callable) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 4202
	var b: Node = main.battle
	var keep_team: Array = main.team
	var keep_story: Dictionary = main.story_done.duplicate()
	var keep_day: String = main.bond_day
	var me := R.make("cindercub", 30, {}, rng)
	me.bond = R.BOND[R.BOND.size() - 1][1]
	var foe := R.make("ripplet", 30, {}, rng)
	b.open("trainer", [me], [foe], "Test Tamer")
	b.bond_ok = true
	var u: Dictionary = b.allies[0]
	check.call(not b.can_join(u), "the wild bond: not while your partner is still strong")
	u.c.hp = roundi(u.st.hp * 0.2)
	check.call(b.can_join(u), "the wild bond: your last partner, badly hurt, Bonded, in a tamer battle")
	me.bond = R.BOND[R.BOND.size() - 2][1]
	check.call(not b.can_join(u), "the wild bond: not without complete trust")
	me.bond = R.BOND[R.BOND.size() - 1][1]
	b.bond_ok = false
	check.call(not b.can_join(u), "the wild bond: only once a day")
	b.bond_ok = true
	b.kind = "wild"
	check.call(not b.can_join(u), "the wild bond: never against an ordinary wild creature (it can't be farmed)")
	foe.lvl = 34
	check.call(b.can_join(u), "the wild bond: against a wild foe clearly stronger, yes")
	b.kind = "trainer"
	var friend := R.make("ripplet", 30, {}, rng)
	b.allies.append(b.unit(friend, "a"))
	check.call(not b.can_join(u), "the wild bond: not while another partner still stands")
	b.allies.pop_back()
	# it looks back at you before the choice appears
	u.atb = R.ACT_AT
	b.foes[0].atb = 0.0
	b._go_to("run")
	b._tick(0.01)
	check.call(b.state == "beat" and b.looked_back and b.log_lines[-1].ends_with("looks back at you."), "the wild bond: your partner looks back at you first, and the moment holds")
	b._after_beat()
	b.foes[0].atb = 0.0
	b._tick(0.01)
	check.call(b.state == "choose" and b.menu_word(5) == "Stand with it" and b.menu_word(0) == "Fight", "the wild bond: one new choice takes Run's place, \"Stand with it\"")
	b._choose(5)
	check.call(b.bond_used and u.get("joined", false) and u.c.hp >= roundi(u.st.hp * 0.6) and b.flood_t >= 0.0, "the wild bond: you become one; colour floods the field and your partner rallies")
	var hits: Array = R.moves_of(u.c).filter(func(m): return float(R.DATA.MOVES[m].get("pow", 0)) > 0)
	var mv: Dictionary = R.DATA.MOVES[hits[0]]
	var v: Dictionary = b.foes[0]
	var plain: Dictionary = b.unit(me.duplicate(true), "a")
	check.call(R.damage(u, v, mv, 1.0, 0.5, 1.0).d > R.damage(plain, v, mv, 1.0, 0.5, 1.0).d and R.damage(v, u, mv, 1.0, 0.5, 1.0).d < R.damage(v, plain, mv, 1.0, 0.5, 1.0).d, "the wild bond: joined, you hit harder and take less")
	check.call(not b.can_join(u), "the wild bond: once in a battle")
	b.joined_t = 0.0
	b._go_to("run")
	b._tick(0.01)
	check.call(b.joined.is_empty() and not u.has("joined") and b.orders == 0.0 and u.c.hp <= roundi(u.st.hp * 0.15), "the wild bond: when it fades you're both spent")
	b.visible = false
	b.state = "off"
	# afterwards: named the first time, once a day, and kept in the save
	main.story_done.erase("wildBond")
	main.bond_day = ""
	main.team = keep_team
	main.lines.clear()
	main._on_battle("won")
	check.call(main.story_done.has("wildBond") and main.bond_day == main._today(), "the wild bond: the first time is remembered, and it waits for tomorrow")
	check.call(main.lines.any(func(l): return "the wild bond" in str(l.text)), "the wild bond: only now, afterwards, is it named")
	main.lines.clear()
	main._process(0.0)
	check.call(not b.bond_ok, "the wild bond: the next battle today can't join again")
	main.story_done = keep_story
	main.bond_day = keep_day
	main.lines.clear()
