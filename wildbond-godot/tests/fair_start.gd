extends RefCounted
## WBL-2: a battle starts fair. However quick the foe, the battle opens on your action menu, and nobody has been
## hurt before you choose: wild or trainer, one foe or two.
static func run(main: Node, check: Callable) -> void:
	var b: Node = main.battle
	var keep_team: Array = main.team.duplicate(true)
	for kind in ["wild", "trainer"]:
		var mine: Array = [main.team[0].duplicate(true)]
		mine[0].hp = int(main.R.stats(mine[0]).hp)          # fresh, so it can stand in the battle
		var foes: Array = [main.team[0].duplicate(true), main.team[0].duplicate(true)]
		for f in foes:
			f.lvl = 60                                   # far quicker than you
		b.open(kind, mine, foes, "" if kind == "wild" else "Wren")
		for u in b.foes:
			u.atb = main.R.ACT_AT - 0.01                    # and a breath away from acting
		var hp_before: int = int(b.allies[0].c.hp)
		var guard := 0
		while b.state != "choose" and guard < 200:
			b._process(0.05)
			guard += 1
		check.call(b.state == "choose" and b.wait_u == b.allies[0], "WBL-2: a %s battle against quicker foes opens on your menu" % kind)
		check.call(int(b.allies[0].c.hp) == hp_before, "WBL-2: no free hit before your first choice (%s)" % kind)
		b.visible = false
		b.state = ""
	main.team = keep_team
