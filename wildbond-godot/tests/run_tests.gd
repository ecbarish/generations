extends SceneTree
## Automated checks for the Wildbond Godot trial: the same idea as tests/wildbond.html for the browser game. They play the
## opening by themselves (register, barn, choosing a partner, walking out) and check the data and rules on the way.
## Run (prints each failure and a total, exit code 0 when everything passes):
##   Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --script res://tests/run_tests.gd

var passed := 0
var failed := 0
var main: Node
var elapsed := 0.0

func _process(dt: float) -> bool:
	# a safety net: if something breaks and the checks stop, quit instead of hanging
	elapsed += dt
	if elapsed > 120.0:
		print("Wildbond Godot checks: TIMED OUT (a script error stopped them; see the errors above)")
		quit(3)
	return false

func check(ok: bool, what: String) -> void:
	if ok:
		passed += 1
	else:
		failed += 1
		print("FAIL: ", what)

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true                           # never touch a real saved journey
	main.demo = false
	main.settings.keep = false                    # nor read or write this computer's settings
	main.show_howto = false                       # the How to play page has its own checks below
	root.add_child(main)
	_run.call_deferred()

func tick(seconds: float) -> void:
	# advance the game by hand in small steps, so the checks don't depend on the computer's speed
	var steps := int(seconds / 0.05)
	for i in steps:
		main._process(0.05)
		main.battle._process(0.05)

func talk_through() -> void:
	var guard := 0
	while not main.lines.is_empty() and guard < 40:
		main.advance()
		guard += 1

func wait_map(n: String) -> bool:
	for i in 80:
		tick(0.05)
		if main.map_name == n and main.trans_t < 0.0:
			return true
	return false

func walk_to(goal: Vector2i) -> bool:
	var r: Array[Vector2i] = main.route(main.me.tile, goal)
	main.walk_to = r
	for i in 400:
		tick(0.05)
		if main.me.tile == goal and main.me.path.is_empty():
			return true
		if main.walk_to.is_empty() and main.me.path.is_empty() and i % 10 == 9:
			main.walk_to = main.route(main.me.tile, goal)   # someone crossed our path: set off again, as a player would
	return false

func _run() -> void:
	main.register.keep = false
	main.rng.seed = 2026                          # the same rolls every run, so the checks always see the same story
	main.battle.rng.seed = 2026
	preload("res://tests/opening_dialogue.gd").run(main, check)
	var D: Dictionary = main.DATA
	# WB-C2: keep every heritage clue and every starter identity through the shorter opening.
	for family in main.HERITAGES:
		for starter_id in main.DATA.STARTERS:
			var opening: Node = load("res://scenes/main.tscn").instantiate()
			opening.no_save = true
			opening.settings.keep = false
			opening.show_howto = false
			root.add_child(opening)
			opening.register.keep = false
			var look: Dictionary = opening.register.look()
			look.heritage = family
			opening.lines.clear()
			opening._on_signed(look)
			check(opening.lines.size() == 4 and opening.lines.any(func(l): return opening.HERITAGES[family].maren in l.text), "WB-C2: %s still receives personal recognition before the barn" % family)
			check(not opening.lines.any(func(l): return l.text == opening.HERITAGES[family].tale), "WB-C2: %s meets a partner before the longer family tale" % family)
			opening.lines.clear()
			opening._on_chosen(starter_id)
			check(opening.team.size() == 1 and opening.team[0].sp == starter_id and opening.team[0].lvl == 5 and opening.partner.id == starter_id, "WB-C2: %s keeps the chosen %s at level five" % [family, starter_id])
			check(opening.rival_c.sp == opening.DATA.COUNTER[starter_id], "WB-C2: Wren still picks the counter to %s" % starter_id)
			check(opening.lines.filter(func(l): return l.text == opening.HERITAGES[family].tale).size() == 1 and opening.lines.any(func(l): return "four tellings" in l.text), "WB-C2: %s keeps its exact tale and the conflicting-accounts clue once after bonding" % family)
			check(opening.lines.any(func(l): return "Nobody owns a creature" in l.text) and opening.lines.any(func(l): return "world remembered" in l.text), "WB-C2: free choice and the returning-memory story remain")
			opening.free()
	# Frozen v1 save written by pre-WB-C2 main 40fcaf9, not reconstructed by this version.
	var legacy: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/fixtures/wb-c2-pre-change.json"))
	var returning: Node = load("res://scenes/main.tscn").instantiate()
	returning.no_save = true
	returning.settings.keep = false
	returning.show_howto = false
	root.add_child(returning)
	returning.register.keep = false
	returning.save_path = "user://wb_c2_legacy_test.json"
	returning.lines.clear()
	check(returning.SafeSave.write(returning.save_path, legacy) and returning._load_game(), "WB-C2: a real pre-change v1 save still loads")
	for i in 20: returning._process(0.05)
	check(returning.stage == "free" and returning.map_name == legacy.map and returning.me.tile == Vector2i(legacy.x, legacy.y), "WB-C2: returning players keep their location and never replay the opening")
	check(returning.my_look.name == legacy.look.name and returning.heritage() == legacy.look.heritage, "WB-C2: existing name and heritage survive")
	check(JSON.parse_string(JSON.stringify(returning.team)) == legacy.team and JSON.parse_string(JSON.stringify(returning.ranch)) == legacy.ranch and returning.partner.id == legacy.partner, "WB-C2: exact partner, nickname, stats, trust and ranch survive")
	check(JSON.parse_string(JSON.stringify(returning.bag)) == legacy.bag and returning.badges == legacy.badges and returning.story_done == legacy.story, "WB-C2: inventory, badges and story progress survive")
	check(not returning.lines.any(func(l): return l.text == returning.HERITAGES.coast.tale), "WB-C2: old saves do not replay the relocated heritage tale")
	returning.SafeSave.remove(returning.save_path)
	returning.free()
	# ---- the data bridge: the browser game's content arrived intact
	check(D.has("SPECIES") and D.SPECIES.size() >= 60, "creatures exported from the browser game")
	check(D.has("MOVES") and D.has("COUNTER") and D.has("STORY"), "moves, matchups and story exported")
	check(D.STARTERS == ["cindercub", "ripplet", "mosshog"], "the three starters")
	for id in D.STARTERS:
		var c: Dictionary = main.card_info(id)
		check(c.name == D.SPECIES[id].name and c.moves.size() == 2, "%s's page: name and two first moves" % id)
		check(main.CREATURE_LOOKS.has(id), "%s has a body" % id)
	check(main.card_info("cindercub").weak == "Tide (Ripplet)" and main.card_info("cindercub").strong == "Grove (Mosshog)", "Cindercub's matchups")
	check(main.card_info("ripplet").moves == ["Tail Whip", "Bubble Jet"], "Ripplet's first moves")
	# roles use the browser game's formula
	check(main.role_of(D.SPECIES.cindercub.base).begins_with("Skirmisher"), "Cindercub is a Skirmisher")
	check(main.role_of(D.SPECIES.ripplet.base).begins_with("All-rounder"), "Ripplet is an All-rounder")
	check(main.role_of({ "hp": 90, "pow": 40, "grd": 90, "spd": 30, "wit": 40, "spi": 90 }).begins_with("Tank"), "a tough creature is a Tank")
	# ---- the rules give the browser game's exact numbers (values taken from the browser on 2026-10-08)
	var R := preload("res://scripts/rules.gd")
	R.DATA = D
	var mk := func(s: String, lvl: int, temp: String) -> Dictionary:
		var c := { "sp": s, "name": D.SPECIES[s].name, "lvl": lvl, "xp": 0, "rar": 1, "temp": temp, "traits": [], "bond": 0.0,
			"pot": { "hp": 10, "pow": 12, "grd": 8, "spd": 14, "wit": 9, "spi": 11 } }
		return c
	var a: Dictionary = mk.call("cindercub", 5, "bold")
	var b: Dictionary = mk.call("ripplet", 4, "calm")
	var c3: Dictionary = mk.call("mosshog", 7, "lazy")
	var sa: Dictionary = R.stats(a)
	var sb: Dictionary = R.stats(b)
	var sc: Dictionary = R.stats(c3)
	check(sa == { "hp": 21, "pow": 13, "grd": 9, "spd": 12, "wit": 11, "spi": 11 }, "Cindercub's stats match the browser: %s" % sa)
	check(sb == { "hp": 19, "pow": 10, "grd": 10, "spd": 9, "wit": 11, "spi": 10 }, "Ripplet's stats match the browser: %s" % sb)
	check(sc == { "hp": 30, "pow": 14, "grd": 14, "spd": 10, "wit": 12, "spi": 13 }, "Mosshog's stats match the browser: %s" % sc)
	var U := func(c: Dictionary, st: Dictionary, side: String) -> Dictionary: return { "c": c, "st": st, "side": side, "buff": {}, "cds": {} }
	var d1: Dictionary = R.damage(U.call(a, sa, "a"), U.call(b, sb, "f"), D.MOVES.emberSnap, 1.0, 0.5, 0.5)
	var d2: Dictionary = R.damage(U.call(b, sb, "f"), U.call(a, sa, "a"), D.MOVES.bubbleJet, 1.0, 0.5, 0.5)
	var d3: Dictionary = R.damage(U.call(c3, sc, "a"), U.call(a, sa, "f"), D.MOVES.vineLash, 1.3, 0.5, 0.5)
	var d4: Dictionary = R.damage(U.call(a, sa, "a"), U.call(c3, sc, "f"), D.MOVES.bite, 1.0, 0.01, 0.01)
	check(d1.d == 5 and is_equal_approx(d1.adv, 0.67) and not d1.crit, "Ember Snap on Ripplet: 5, not very effective (%s)" % d1)
	check(d2.d == 10 and d2.adv == 1.5, "Bubble Jet on Cindercub: 10, it hits hard (%s)" % d2)
	check(d3.d == 10, "Vine Lash with a 1.3 boost: 10 (%s)" % d3)
	check(d4.d == 6 and d4.crit, "a critical Bite: 6 (%s)" % d4)
	check(R.xp_need(5) == 187 and R.xp_need(13) == 1426, "XP needed per level matches")
	var early: float = R.xp_need(10) / R.win_xp(1, 10, 10, false, 0.13)
	var late: float = R.xp_need(55) / R.win_xp(1, 55, 55, false, 0.13)
	check(absf(early - late) < 0.5 and early > 10.0 and early < 14.0, "pacing (WB3.6b): a level costs about the same number of even wins at level 10 (%.1f) and level 55 (%.1f)" % [early, late])
	check(R.win_xp(1, 40, 20, false, 0.13) == R.win_xp(1, 23, 20, false, 0.13) and R.win_xp(1, 15, 20, false, 0.13) < R.win_xp(1, 20, 20, false, 0.13) and R.win_xp(1, 20, 20, true, 0.13) > R.win_xp(1, 20, 20, false, 0.13), "stronger foes are worth up to three levels more, weaker ones less, trainers more")
	check(R.moves_of(a) == ["bite", "emberSnap"], "moves at level 5")
	var a12 := a.duplicate(true)
	a12.lvl = 12
	a12.erase("moves") # a pre-WD3 save keeps its original four
	check(R.moves_of(a12) == ["bite", "emberSnap", "howl", "flameRush"], "moves at level 12")
	var g := a.duplicate(true)
	g.lvl = 13
	g.hp = 1
	var msgs: Array = R.grow(g, 2000, 20)
	check(g.lvl == 14 and g.sp == "cindercub" and R.evo_target(g) == "", "at 14 Cindercub is still a cub; the middle stage waits for 16: %s" % [msgs])
	g.lvl = 16
	check(R.evo_target(g) == "smoulderpup", "at 16 Cindercub is ready to become Smoulderpup (you're asked; it isn't forced)")
	check(R.evolve(g, "smoulderpup") == "Cindercub" and g.sp == "smoulderpup" and g.name == "Smoulderpup", "letting it change: Cindercub becomes Smoulderpup")
	# ---- EVO-1: three starter stages. A level on every change; Devoted trust as well on the final. No trust-only route.
	var Sprites := load("res://scripts/creature_sprites.gd")
	var lines := {
		"cindercub": ["smoulderpup", "blazefang"],
		"ripplet": ["riverwisp", "tidewyrm"],
		"mosshog": ["thicketboar", "thornback"],
	}
	for base in lines:
		var mid: String = lines[base][0]
		var fin: String = lines[base][1]
		var young := R.make(base, 15, { "rar": 1 }, main.rng)
		check(R.evo_target(young) == "", "EVO-1: %s does not change before level 16" % base)
		young.lvl = 16
		young.bond = 0.0
		check(R.evo_target(young) == mid, "EVO-1: %s becomes %s at 16 with no trust required" % [base, mid])
		var teen := R.make(mid, 35, { "rar": 1 }, main.rng)
		teen.bond = 280.0
		check(R.evo_target(teen) == "", "EVO-1: Bonded before level 36, %s still waits" % mid)
		teen.lvl = 36
		teen.bond = 139.0
		check(R.evo_target(teen) == "", "EVO-1: level 36 without Devoted trust does not change %s" % mid)
		teen.bond = 140.0
		check(R.evo_target(teen, { "place": "emberfall", "team": [mid, "glimmerwing"] }) == fin, "EVO-1: %s becomes %s at 36 with Devoted trust, and place or a companion does not choose it" % [mid, fin])
		var done := R.make(fin, 50, { "rar": 1 }, main.rng)
		done.bond = 280.0
		check(R.evo_target(done, { "place": "emberfall", "team": [fin, "glimmerwing"] }) == "", "EVO-1: %s is the final form" % fin)
		check(is_equal_approx(float(main.DATA.SPECIES[mid].metres) * 12.35, float(Sprites.frame_size(mid, "idle").y)), "EVO-1: %s height in metres matches its sprite (%dpx)" % [mid, Sprites.frame_size(mid, "idle").y])
	check(not main.DATA.SPECIES.has("pyremane") and not main.DATA.SPECIES.has("deeptide") and not main.DATA.SPECIES.has("elderthorn"), "EVO-1: Deeptide, Pyremane and Elderthorn are retired")
	var painted := ["cindercub", "smoulderpup", "blazefang", "ripplet", "riverwisp", "tidewyrm", "mosshog", "thicketboar", "thornback"]
	for sid in painted:
		check(Sprites.has(sid) and Sprites.frame_count(sid, "walk") == 4, "EVO-1: %s has an idle sheet and a 4-frame walk" % sid)
	check(not Sprites.has("poolkit") and not Sprites.has("elderhorn"), "EVO-1: a species without a PNG is not claimed as painted")
	check(Sprites.frame_size("smoulderpup", "idle").y == 16 and Sprites.frame_size("riverwisp", "idle").y == 14 and Sprites.frame_size("thicketboar", "idle").y == 15, "EVO-1: middle-stage sprites are 16, 14 and 15 pixels tall")
	check(Sprites.frame_count("tidewyrm", "crawl") == 4 and Sprites.frame_size("tidewyrm", "walk").x == 32 and Sprites.frame_size("tidewyrm", "crawl").x == 38, "EVO-1: Tidewyrm's crawl sheet is separate from its walk, and provisional")
	var fang_sz: Vector2i = Sprites.frame_size("blazefang", "idle")
	var thorn_sz: Vector2i = Sprites.frame_size("thornback", "idle")
	var slot: float = Sprites.fit_scale(fang_sz, Vector2(16, 16), 1.0)
	var page: float = Sprites.fit_scale(thorn_sz, Vector2(120, 70), 4.0)
	var row: float = Sprites.fit_scale(thorn_sz, Vector2(36, 30), 2.0)
	check(slot == 1.0 and page == 3.0 and row == 1.0 and slot == floor(slot) and page == floor(page) and row == floor(row), "EVO-1: a sprite fits at a whole scale of at least 1 (Blazefang %s, Thornback page %s, row %s)" % [slot, page, row])
	var pup_sz: Vector2i = Sprites.frame_size("smoulderpup", "idle")
	var ally_foot := Vector2(100, 158) + Vector2(0, 6)
	var ally_panel := Rect2(222, 116, 154, 36)
	var pup_rect: Rect2 = Sprites.dest_rect(ally_foot, pup_sz, 4.0)
	var pup_foot: Vector2 = Sprites.foot_clear_of(ally_foot, pup_sz, 4.0, [ally_panel], 4.0)
	check(pup_rect.size == Vector2(float(pup_sz.x) * 4.0, float(pup_sz.y) * 4.0) and pup_foot == ally_foot, "EVO-1: Smoulderpup stays at 4x and its feet stay on the ally spot")
	check(is_equal_approx(pup_rect.position.x + pup_rect.size.x * 0.5, ally_foot.x) and is_equal_approx(pup_rect.position.y + pup_rect.size.y, ally_foot.y), "EVO-1: a painted sprite is anchored on its bottom centre")
	check(not pup_rect.intersects(ally_panel.grow(4.0)), "EVO-1: Smoulderpup at 4x stays clear of its HP panel")
	var shifted := pup_rect
	shifted.position.x += pup_rect.size.x
	check(shifted.intersects(ally_panel), "EVO-1: shifting Smoulderpup by its own width would hide it behind the HP panel")
	var wide := Vector2i(70, 16)
	var wide_foot: Vector2 = Sprites.foot_clear_of(ally_foot, wide, 4.0, [ally_panel], 4.0)
	var wide_rect: Rect2 = Sprites.dest_rect(wide_foot, wide, 4.0)
	check(wide_rect.size.x == 280.0 and not wide_rect.intersects(ally_panel.grow(4.0)), "EVO-1: a wider sprite slides clear of the HP panel and is not shrunk")
	var battle_clear := true
	var spots := [
		[Vector2(100, 164), 4.0, [ally_panel, Rect2(10, 8, 150, 26)]],
		[Vector2(286, 98), 3.0, [Rect2(10, 8, 150, 26), ally_panel]],
		[Vector2(168, 148), 4.0, [Rect2(236, 140, 140, 20)]],
		[Vector2(100, 166), 5.0, [ally_panel]],
	]
	for sid in painted:
		var bsz: Vector2i = Sprites.frame_size(sid, "idle")
		for spot in spots:
			var placed: Vector2 = Sprites.foot_clear_of(spot[0], bsz, spot[1], spot[2], 4.0)
			var placed_rect: Rect2 = Sprites.dest_rect(placed, bsz, spot[1])
			if placed_rect.size != Vector2(float(bsz.x) * spot[1], float(bsz.y) * spot[1]):
				battle_clear = false
			for panel in spot[2]:
				if placed_rect.intersects((panel as Rect2).grow(4.0)):
					battle_clear = false
	check(battle_clear, "EVO-1: every painted battle sprite keeps its whole scale and stays clear of the HP panels")
	var wash_tex: Texture2D = Sprites.texture("blazefang", "idle")
	var wash_a: Texture2D = Sprites._washed(wash_tex, Rect2i(0, 0, fang_sz.x, fang_sz.y), 0.5)
	var wash_b: Texture2D = Sprites._washed(wash_tex, Rect2i(0, 0, fang_sz.x, fang_sz.y), 0.51)
	check(wash_a != null and wash_a == wash_b, "EVO-1: a washed frame is kept and reused")
	var wild_hits: Array = []
	var banned := painted
	for map_id in main.DATA.MAPS:
		var map: Dictionary = main.DATA.MAPS[map_id]
		var lists: Array = [map.get("wild", [])]
		for season in map.get("seasonal", {}):
			lists.append(map.seasonal[season].get("wild", []))
		for list in lists:
			for pair in list:
				if str(pair[0]) in banned:
					wild_hits.append(str(map_id) + ":" + str(pair[0]))
	for biome_id in main.DATA.BIOMES:
		for pair in main.DATA.BIOMES[biome_id].get("wild", []):
			if str(pair[0]) in banned:
				wild_hits.append("biome:" + str(pair[0]))
	check(wild_hits.is_empty(), "EVO-1: starter lines are never in the wild" + ("" if wild_hits.is_empty() else " (%s)" % ", ".join(wild_hits.slice(0, 4))))
	# ---- WB-BOND: trust is required with the level, not instead of it (DD-5). The example is now Riverwisp to Tidewyrm.
	var cared := R.make("cindercub", 5, { "rar": 1, "traits": [] }, main.rng)
	check(R.add_bond(cared, 20.0, "care") and is_equal_approx(float(cared.bond), 20.0) and is_equal_approx(float(cared.raised.care), 20.0) and R.raised_lvl(cared, "care") == 1, "WB-BOND: feeding-trust is remembered as care, and Friendly is step 1")
	var loyal_cub := R.make("cindercub", 5, { "rar": 1, "traits": ["loyal"] }, main.rng)
	R.add_bond(loyal_cub, 20.0, "care")
	check(is_equal_approx(float(loyal_cub.bond), 30.0) and is_equal_approx(float(loyal_cub.raised.care), 30.0), "WB-BOND: the loyal trait multiplies the remembered trust too")
	var branch: Array = main.DATA.BOND_BRANCH.options
	main.DATA.EVOS["bondbranch"] = branch
	var stand := R.make("cindercub", 8, { "rar": 1, "traits": [] }, main.rng)
	stand.sp = "bondbranch"
	check(R.evo_target(stand) == "", "WB-BOND: a young bond-branch creature with no trust stays as it is")
	R.add_bond(stand, 40.0, "care")
	R.add_bond(stand, 40.0, "battle")
	check(R.bond_lvl(stand) == 2 and R.raised_lvl(stand, "care") == 1 and R.evo_target(stand) == "", "WB-BOND: trust split across care and battle does not pick a special form")
	stand.lvl = 16
	check(R.evo_target(stand) == "grownform", "WB-BOND: at the level, split trust takes the ordinary form")
	var cared_for := R.make("cindercub", 8, { "rar": 1, "traits": [] }, main.rng)
	cared_for.sp = "bondbranch"
	R.add_bond(cared_for, 60.0, "care")
	check(R.evo_target(cared_for) == "", "WB-BOND: Loyal care before the level does not change it")
	cared_for.lvl = 16
	check(R.evo_target(cared_for) == "careform", "WB-BOND: at the level, raised by care, the gentle final comes first")
	var fought := R.make("cindercub", 8, { "rar": 1, "traits": [] }, main.rng)
	fought.sp = "bondbranch"
	R.add_bond(fought, 60.0, "battle")
	check(R.evo_target(fought) == "", "WB-BOND: Loyal from the fight, before the level, it waits")
	fought.lvl = 16
	check(R.evo_target(fought) == "battleform", "WB-BOND: at the level, raised in the fight, the keen final is the one offered")
	var both := R.make("cindercub", 16, { "rar": 1, "traits": [] }, main.rng)
	both.sp = "bondbranch"
	R.add_bond(both, 60.0, "battle")
	R.add_bond(both, 60.0, "care")
	check(R.evo_target(both) == "careform", "WB-BOND: when both ways of raising are far enough, the first option wins")
	var ordinary := R.make("cindercub", 16, { "rar": 1, "traits": [] }, main.rng)
	ordinary.sp = "bondbranch"
	check(R.evo_target(ordinary) == "grownform", "WB-BOND: with no raising record, the level change is the ordinary form")
	main.DATA.EVOS.erase("bondbranch")
	var young_tw := R.make("riverwisp", 20, { "rar": 1 }, main.rng)
	young_tw.bond = 280.0
	var held := young_tw.duplicate(true)
	held["hold"] = 20
	held["hold_bond"] = 4
	check(main.evolution_held(held), "WB-BOND: not yet waits at this level and this trust")
	held["hold_bond"] = 3
	check(not main.evolution_held(held), "WB-BOND: a new trust step asks again, even at the same level")
	held.erase("hold_bond")
	held.lvl = 20
	check(main.evolution_held(held), "WB-BOND: an older not-yet, with no trust step stored, still waits for a level")
	held.lvl = 21
	check(not main.evolution_held(held), "WB-BOND: that older not-yet asks again after a level")
	var bond_save := { "sp": "tidewyrm", "name": "Tidewyrm", "lvl": 20, "xp": 0, "rar": 1, "hp": 10, "pot": { "hp": 1, "pow": 1, "grd": 1, "spd": 1, "wit": 1, "spi": 1 }, "bond": 12.5, "traits": [] }
	var bond_fixed: Dictionary = main._fix_creature(bond_save.duplicate(true))
	check(not bond_fixed.has("raised") and is_equal_approx(float(bond_fixed.bond), 12.5), "WB-BOND: a save without a raising record loads as it was")
	var bond_marked := bond_save.duplicate(true)
	bond_marked["raised"] = { "care": 20, "battle": 4 }
	var bond_fixed_marked: Dictionary = main._fix_creature(bond_marked)
	check(is_equal_approx(float(bond_fixed_marked.raised.care), 20.0) and is_equal_approx(float(bond_fixed_marked.raised.battle), 4.0), "WB-BOND: a raising record loads back")
	var bond_missing := bond_save.duplicate(true)
	bond_missing.erase("bond")
	var bond_fixed_old: Dictionary = main._fix_creature(bond_missing)
	check(is_equal_approx(float(bond_fixed_old.bond), 0.0) and R.bond_lvl(bond_fixed_old) == 0, "WB-BOND: a creature saved with no trust number is Wary")
	var retired := { "sp": "deeptide", "name": "Old Salt", "lvl": 40, "xp": 12, "rar": 2, "hp": 77, "pot": { "hp": 8, "pow": 11, "grd": 9, "spd": 4, "wit": 14, "spi": 7 }, "bond": 180.0, "traits": ["loyal"], "temp": "steady", "raised": { "care": 60.0, "battle": 40.0 }, "hold": 32, "hold_bond": 3, "moves": ["tidePulse", "harden"] }
	var kept: Dictionary = retired.duplicate(true)
	var number_only: Dictionary = main._fix_creature(retired.duplicate(true))
	check(number_only.sp == "deeptide" and number_only.name == "Old Salt" and int(number_only.lvl) == 40, "EVO-1: reading a creature only fixes numbers; it does not convert a retired form")
	var plain := { "sp": "pyremane", "name": "Pyremane", "lvl": 36, "xp": 4, "rar": 1, "hp": 50, "pot": kept.pot.duplicate(), "bond": 140.0, "traits": [] }
	var thorn := { "sp": "elderthorn", "name": "Elderthorn", "lvl": 33, "xp": 1, "rar": 1, "hp": 40, "pot": kept.pot.duplicate(), "bond": 20.0, "traits": [], "raised": { "care": 10.0 } }
	var sprout := thorn.duplicate(true)
	sprout.name = "Sprout"
	sprout.lvl = 5
	var step_file := { "v": 1, "team": [retired, plain], "ranch": [thorn], "seen": { "deeptide": "old-tide", "tidewyrm": "kept-final", "pyremane": true }, "bonded": { "elderthorn": true }, "egg": { "steps": 4, "child": sprout }, "look": { "name": "Rowan" }, "badges": [], "map": "thornwood" }
	var stepped: Dictionary = main.migrate_save(step_file)
	var fixed: Dictionary = stepped.team[0]
	check(int(stepped.v) == main.SAVE_V and step_file.v == 1 and step_file.team[0].sp == "deeptide", "EVO-1: the version 1 step becomes version 2 and leaves the original save alone")
	check(fixed.sp == "tidewyrm" and fixed.name == "Old Salt" and int(fixed.lvl) == 40 and int(fixed.xp) == 12 and is_equal_approx(float(fixed.bond), 180.0), "EVO-1: a nicknamed Deeptide becomes Tidewyrm and keeps level, experience and trust")
	check(is_equal_approx(float(fixed.raised.care), 60.0) and is_equal_approx(float(fixed.raised.battle), 40.0) and int(fixed.hold) == 32 and int(fixed.hold_bond) == 3, "EVO-1: raising, hold and hold_bond survive the conversion")
	check(fixed.pot == kept.pot and int(fixed.hp) == 77 and fixed.moves == kept.moves and fixed.temp == "steady" and fixed.traits == ["loyal"], "EVO-1: potentials, stored health, moves, temperament and traits stay")
	var plain_fixed: Dictionary = stepped.team[1]
	check(plain_fixed.sp == "blazefang" and plain_fixed.name == "Blazefang" and int(plain_fixed.hp) == 50 and plain_fixed.pot == kept.pot and int(plain_fixed.xp) == 4, "EVO-1: a default-named Pyremane becomes Blazefang and keeps its stats")
	var thorn_fixed: Dictionary = stepped.ranch[0]
	check(thorn_fixed.sp == "thornback" and thorn_fixed.name == "Thornback" and is_equal_approx(float(thorn_fixed.raised.care), 10.0) and is_equal_approx(float(thorn_fixed.bond), 20.0), "EVO-1: Elderthorn becomes Thornback and keeps its raising and trust")
	check(stepped.egg.child.sp == "thornback" and stepped.egg.child.name == "Sprout" and int(stepped.egg.child.lvl) == 5, "EVO-1: an egg's child converts, and a nickname stays")
	check(stepped.seen.tidewyrm == "kept-final" and not stepped.seen.has("deeptide") and not stepped.seen.has("pyremane") and stepped.seen.blazefang == true and stepped.bonded.thornback == true and not stepped.bonded.has("elderthorn"), "EVO-1: the Wilddex follows a retired form, and does not drop a final already seen")
	var stayed: Dictionary = main.migrate_save(stepped)
	check(int(stayed.v) == main.SAVE_V and stayed.team[0].sp == "tidewyrm" and stayed.team[1].sp == "blazefang" and stayed.ranch[0].sp == "thornback", "EVO-1: a version 2 save is not converted a second time")
	var current := { "v": 2, "team": [{ "sp": "ripplet", "name": "Puddle", "lvl": 5 }] }
	var current_back: Dictionary = main.migrate_save(current)
	check(int(current_back.v) == main.SAVE_V and current_back.team[0].sp == "ripplet" and current_back.team[0].name == "Puddle" and current.team[0].sp == "ripplet", "EVO-1: a version 2 creature that was never retired stays as it is")
	check(main.migrate_save({ "v": 3, "team": [{ "sp": "deeptide", "name": "Old Salt" }], "kept": "byte-for-byte" }).is_empty(), "EVO-1: a newer save is not reshaped")
	# Frozen v1 save written by current main's save_game() (origin/main b0cd249), before these forms were retired.
	var fixture_text := FileAccess.get_file_as_string("res://tests/fixtures/evo1-retired-forms.json")
	var retired_save: Dictionary = JSON.parse_string(fixture_text)
	check(retired_save.team[0].sp == "deeptide" and retired_save.team[1].sp == "pyremane" and retired_save.ranch[0].sp == "elderthorn", "EVO-1: the frozen save still names Deeptide, Pyremane and Elderthorn")
	var migrated_fix: Dictionary = main.migrate_save(retired_save)
	check(int(migrated_fix.v) == main.SAVE_V and migrated_fix.team[0].sp == "tidewyrm" and migrated_fix.team[0].name == retired_save.team[0].name and int(migrated_fix.team[0].lvl) == int(retired_save.team[0].lvl) and int(migrated_fix.team[0].xp) == int(retired_save.team[0].xp) and is_equal_approx(float(migrated_fix.team[0].bond), float(retired_save.team[0].bond)) and int(migrated_fix.team[0].hold) == int(retired_save.team[0].hold) and int(migrated_fix.team[0].hold_bond) == int(retired_save.team[0].hold_bond), "EVO-1: the frozen version 1 save steps to version 2, and Old Salt keeps nickname, level, experience, trust, hold and hold_bond")
	check(migrated_fix.team[1].sp == "blazefang" and migrated_fix.team[1].name == "Blazefang" and migrated_fix.ranch[0].sp == "thornback" and migrated_fix.egg.child.sp == "thornback" and migrated_fix.egg.child.name == "Sprout", "EVO-1: the frozen Pyremane, Elderthorn and egg child step to Blazefang and Thornback")
	check(migrated_fix.seen.tidewyrm == retired_save.seen.tidewyrm and not migrated_fix.seen.has("deeptide") and not migrated_fix.seen.has("pyremane") and not migrated_fix.seen.has("elderthorn") and migrated_fix.seen.has("blazefang") and migrated_fix.seen.has("thornback") and migrated_fix.bonded.has("tidewyrm") and not migrated_fix.bonded.has("deeptide"), "EVO-1: the frozen Wilddex follows the retired forms and keeps the Tidewyrm entry")
	check(FileAccess.get_file_as_string("res://tests/fixtures/evo1-retired-forms.json") == fixture_text and retired_save.team[0].sp == "deeptide", "EVO-1: the migration does not rewrite the frozen fixture")
	var returned: Node = load("res://scenes/main.tscn").instantiate()
	returned.no_save = true
	returned.settings.keep = false
	returned.show_howto = false
	root.add_child(returned)
	returned.register.keep = false
	returned.save_path = "user://evo1_retired_load.json"
	returned.lines.clear()
	check(returned.SafeSave.write(returned.save_path, retired_save), "EVO-1: the frozen save can be put on disk")
	var retired_bytes := FileAccess.get_file_as_string(returned.save_path)
	check(returned._load_game(), "EVO-1: a real pre-change save holding the retired forms still loads")
	for i in 20: returned._process(0.05)
	var old_lead: Dictionary = retired_save.team[0]
	var new_lead: Dictionary = returned.team[0]
	check(new_lead.sp == "tidewyrm" and new_lead.name == old_lead.name and int(new_lead.lvl) == int(old_lead.lvl) and int(new_lead.xp) == int(old_lead.xp) and is_equal_approx(float(new_lead.bond), float(old_lead.bond)), "EVO-1: Deeptide becomes Tidewyrm and keeps its nickname, level, experience and trust")
	check(is_equal_approx(float(new_lead.raised.care), float(old_lead.raised.care)) and is_equal_approx(float(new_lead.raised.battle), float(old_lead.raised.battle)) and int(new_lead.hold) == int(old_lead.hold) and int(new_lead.hold_bond) == int(old_lead.hold_bond), "EVO-1: that Tidewyrm keeps its raising, hold and hold_bond")
	check(int(new_lead.hp) == int(old_lead.hp) and new_lead.moves == old_lead.moves and new_lead.temp == old_lead.temp and new_lead.traits == old_lead.traits, "EVO-1: stored health, moves, temperament and traits stay on Tidewyrm")
	var pot_same := true
	for stat in old_lead.pot:
		if int(new_lead.pot[stat]) != int(old_lead.pot[stat]):
			pot_same = false
	check(pot_same, "EVO-1: Tidewyrm's potentials stay")
	var old_pyre: Dictionary = retired_save.team[1]
	var new_pyre: Dictionary = returned.team[1]
	check(new_pyre.sp == "blazefang" and new_pyre.name == "Blazefang" and int(new_pyre.lvl) == int(old_pyre.lvl) and int(new_pyre.xp) == int(old_pyre.xp) and is_equal_approx(float(new_pyre.bond), float(old_pyre.bond)) and int(new_pyre.hp) == int(old_pyre.hp), "EVO-1: a default-named Pyremane becomes Blazefang and keeps level, experience, trust and health")
	var old_thorn: Dictionary = retired_save.ranch[0]
	var new_thorn: Dictionary = returned.ranch[0]
	check(new_thorn.sp == "thornback" and new_thorn.name == "Thornback" and int(new_thorn.lvl) == int(old_thorn.lvl) and is_equal_approx(float(new_thorn.bond), float(old_thorn.bond)) and is_equal_approx(float(new_thorn.raised.care), float(old_thorn.raised.care)) and int(new_thorn.hold) == int(old_thorn.hold), "EVO-1: Elderthorn becomes Thornback and keeps level, trust, raising and hold")
	check(not returned.seen.has("deeptide") and not returned.seen.has("pyremane") and not returned.seen.has("elderthorn") and returned.seen.has("tidewyrm") and returned.seen.has("blazefang") and returned.seen.has("thornback"), "EVO-1: the loaded Wilddex follows the retired forms")
	check(returned.seen.tidewyrm == retired_save.seen.tidewyrm, "EVO-1: a final already in the Wilddex is not replaced")
	check(returned.partner != null and returned.partner.id == retired_save.partner and returned.stage == "free", "EVO-1: the partner you set out with, and the journey, stay")
	var old_egg: Dictionary = retired_save.egg.child
	var new_egg: Dictionary = returned.egg.child
	check(returned.egg.steps == int(retired_save.egg.steps) and new_egg.sp == "thornback" and new_egg.name == old_egg.name and int(new_egg.lvl) == int(old_egg.lvl) and is_equal_approx(float(new_egg.bond), float(old_egg.bond)), "EVO-1: an egg that was going to be Elderthorn hatches as Thornback and keeps its nickname, level and trust")
	check(FileAccess.get_file_as_string(returned.save_path) == retired_bytes and "deeptide" in retired_bytes, "EVO-1: loading the frozen save migrates it in memory and does not rewrite the file")
	returned.SafeSave.remove(returned.save_path)
	returned.free()
	var newer_src: Dictionary = retired_save.duplicate(true)
	newer_src.v = 3
	newer_src.kept = "byte-for-byte"
	var newer_node: Node = load("res://scenes/main.tscn").instantiate()
	newer_node.no_save = false
	newer_node.settings.keep = false
	newer_node.show_howto = false
	newer_node.save_path = "user://evo1_newer.json"
	newer_node.SafeSave.remove(newer_node.save_path)
	check(newer_node.SafeSave.write(newer_node.save_path, newer_src), "EVO-1: a newer save can be put on disk for the guard")
	var newer_bytes := FileAccess.get_file_as_string(newer_node.save_path)
	root.add_child(newer_node)
	check(newer_node.no_save and newer_node.hold_save and newer_node.title.visible and newer_node.title.get("summary") == main.NEWER_NOTE, "EVO-1: a newer save turns saving off and shows the notice")
	check(FileAccess.get_file_as_string(newer_node.save_path) == newer_bytes, "EVO-1: opening a newer save does not rewrite it")
	newer_node.lines.clear()
	newer_node.stage = "free"
	newer_node.trans_t = -1.0
	newer_node.no_save = false
	newer_node.battle.visible = false
	newer_node.lessons.visible = false
	newer_node.save_game()
	check(FileAccess.get_file_as_string(newer_node.save_path) == newer_bytes, "EVO-1: a free moment does not overwrite a newer save")
	newer_node._on_title("continue")
	check(FileAccess.get_file_as_string(newer_node.save_path) == newer_bytes and newer_node.lines.any(func(l): return l.text == main.NEWER_NOTE), "EVO-1: continuing says the notice and still does not save")
	newer_node.lines.clear()
	newer_node.stage = "free"
	newer_node.trans_t = -1.0
	newer_node.hold_save = false
	newer_node.no_save = false
	newer_node.save_game()
	check(FileAccess.get_file_as_string(newer_node.save_path) == newer_bytes and "byte-for-byte" in newer_bytes and newer_node.migrate_save(newer_src).is_empty(), "EVO-1: with the hold cleared, the newer file on disk is still not overwritten")
	newer_node.SafeSave.remove(newer_node.save_path)
	newer_node.free()
	var tb := R.make("thornback", 36, { "rar": 1 }, main.rng)
	tb.bond = 280.0
	check(R.evo_target(tb, { "team": ["thornback", "glimmerwing"] }) == "", "EVO-1: Thornback no longer becomes Elderthorn beside a Glimmerwing")
	var pk := R.make("poolkit", 24, { "rar": 1 }, main.rng)
	pk.bond = 0.0
	check(R.evo_target(pk, { "place": "cloudglass" }) == "" and R.evo_target(pk, { "place": "saltmarsh" }) == "", "Poolkit at 24 without trust stays itself")
	pk.bond = 20.0
	check(R.evo_target(pk, { "place": "cloudglass" }) == "mistlynx", "a branching line: Poolkit in the cloud of the pass, once it trusts you a little, becomes Mistlynx")
	check(R.evo_target(pk, { "place": "saltmarsh" }) == "rilllynx", "elsewhere, once it trusts you a little, most become Rilllynx")
	pk.bond = 150.0
	check(R.evo_target(pk, { "place": "saltmarsh" }) == "sunlynx", "and one that trusts you deeply becomes Sunlynx")
	check(R.evo_target(R.make("hearthlaugh", 60, { "rar": 1 }, main.rng)) == "", "Hearthlaugh never evolves; it's itself")
	check(main.DATA.SPECIES.has("smoulderpup") and main.DATA.SPECIES.has("riverwisp") and main.DATA.SPECIES.has("thicketboar") and main.DATA.SPECIES.size() >= 98, "the middle stages are in the Wilddex (%d creatures)" % main.DATA.SPECIES.size())
	# ---- CR1: every species has a size and tier; huge finals outscale their young forms
	var sizes := { "tiny": 0.7, "small": 0.85, "medium": 1.0, "large": 1.2, "huge": 1.45 }
	var tiers := ["Plain", "Strong", "Showpiece", "Legend"]
	var bad_st: Array = []
	for sid in main.DATA.SPECIES:
		var s: Dictionary = main.DATA.SPECIES[sid]
		if not sizes.has(str(s.get("size", ""))) or not tiers.has(str(s.get("tier", ""))):
			bad_st.append(sid)
	check(bad_st.is_empty(), "CR1: every species has a valid size and tier" + ("" if bad_st.is_empty() else " (bad: %s)" % ", ".join(bad_st.slice(0, 5))))
	var scale_ok := true
	for sid in main.DATA.SPECIES:
		var s: Dictionary = main.DATA.SPECIES[sid]
		var evo: Dictionary = s.get("evo", {})
		var to: String = str(evo.get("to", ""))
		if to != "" and main.DATA.SPECIES.has(to):
			var young_sc: float = sizes.get(str(s.get("size", "medium")), 1.0)
			var final_sc: float = sizes.get(str(main.DATA.SPECIES[to].get("size", "medium")), 1.0)
			if final_sc < young_sc:
				scale_ok = false
	check(scale_ok, "CR1: no final form is drawn smaller than its young form")
	# ---- catalogue batch: twelve new species. Every change asks for a level; a final also asks for trust (DD-5).
	var batch := ["creekribbon", "murkcoil", "gloomtide", "seedmoth", "sootcloak", "hearthbloom", "dawnfoal", "sunford", "whisperpup", "ridgehowl", "charcup", "kilnback"]
	var batch_ok := true
	for id in batch:
		batch_ok = batch_ok and main.DATA.SPECIES.has(id)
	check(batch_ok and main.DATA.SPECIES.size() == 189, "catalogue: 189 in the Wilddex, evolved forms at least half (%d)" % main.DATA.SPECIES.size())
	var finals := { "gloomtide": true, "hearthbloom": true, "sunford": true, "ridgehowl": true, "kilnback": true }
	var evo_ok := true
	var bond_ok := true
	for id in batch:
		if not main.DATA.EVOS.has(id):
			continue
		for o in main.DATA.EVOS[id]:
			if not o.has("at"):
				evo_ok = false
			if finals.has(str(o.to)) and not o.has("bond"):
				bond_ok = false
	check(evo_ok, "catalogue batch: every new evolution asks for a level")
	check(bond_ok, "catalogue batch: every final form also asks for trust")
	check(int(main.DATA.SPECIES.cindercub.evo.at) == 16 and str(main.DATA.SPECIES.cindercub.evo.to) == "smoulderpup", "catalogue batch: Cindercub still becomes Smoulderpup at 16")
	check(int(main.DATA.EVOS.smoulderpup[0].at) == 36 and int(main.DATA.EVOS.smoulderpup[0].bond) == 3 and str(main.DATA.EVOS.smoulderpup[0].to) == "blazefang", "catalogue batch: Smoulderpup becomes Blazefang at 36 with Devoted trust")
	check(int(main.DATA.SPECIES.ripplet.evo.at) == 16 and str(main.DATA.SPECIES.ripplet.evo.to) == "riverwisp", "catalogue batch: Ripplet still becomes Riverwisp at 16")
	check(int(main.DATA.EVOS.riverwisp[0].at) == 36 and int(main.DATA.EVOS.riverwisp[0].bond) == 3 and str(main.DATA.EVOS.riverwisp[0].to) == "tidewyrm", "catalogue batch: Riverwisp becomes Tidewyrm at 36 with Devoted trust")
	check(int(main.DATA.SPECIES.mosshog.evo.at) == 16 and str(main.DATA.SPECIES.mosshog.evo.to) == "thicketboar", "catalogue batch: Mosshog still becomes Thicketboar at 16")
	check(int(main.DATA.EVOS.thicketboar[0].at) == 36 and int(main.DATA.EVOS.thicketboar[0].bond) == 3 and str(main.DATA.EVOS.thicketboar[0].to) == "thornback", "catalogue batch: Thicketboar becomes Thornback at 36 with Devoted trust")
	check(not main.DATA.EVOS.has("blazefang") and not main.DATA.EVOS.has("tidewyrm") and not main.DATA.EVOS.has("thornback"), "catalogue batch: Blazefang, Tidewyrm and Thornback have no further evolution")
	var ribbon: Dictionary = main.R.make("creekribbon", 16, {}, main.rng)
	check(main.R.evo_target(ribbon) == "murkcoil", "catalogue batch: Creekribbon becomes Murkcoil at 16")
	var coil: Dictionary = main.R.make("murkcoil", 34, {}, main.rng)
	coil.bond = 59.0
	check(main.R.evo_target(coil) == "", "catalogue batch: Murkcoil at 34 without Loyal trust stays")
	coil.bond = 60.0
	check(main.R.evo_target(coil) == "gloomtide", "catalogue batch: grown and Loyal, Murkcoil becomes Gloomtide")
	var young_coil: Dictionary = main.R.make("murkcoil", 20, {}, main.rng)
	young_coil.bond = 280.0
	check(main.R.evo_target(young_coil) == "", "catalogue batch: Bonded before the level, Murkcoil still waits")
	var size_ok := true
	var size_note := ""
	var stand_pose := { "walking": false, "wag": 0, "ears_up": true }
	for id in batch:
		var sp: Dictionary = main.DATA.SPECIES[id]
		var want: int = main.Figures.drawn_px(float(sp.metres))
		var span: Vector2i = main.Figures.pixel_span(main.Figures.sized_parts(sp, true, stand_pose))
		if span.y != want or span.x < 8:
			size_ok = false
			size_note += "%s %dx%d want %d " % [id, span.x, span.y, want]
	check(size_ok, "catalogue batch: drawn height is metres times 12.35" + ("" if size_note == "" else " (" + size_note + ")"))
	var placed := {}
	for mid in main.DATA.MAPS:
		var area: Dictionary = main.DATA.MAPS[mid]
		var lists: Array = [area.get("wild", [])]
		for season in area.get("seasonal", {}):
			lists.append(area.seasonal[season].get("wild", []))
		for list in lists:
			for pair in list:
				placed[str(pair[0])] = true
	for mid in main.DATA.get("WILD_EXTRA", {}):
		for pair in main.DATA.WILD_EXTRA[mid]:
			placed[str(pair[0])] = true
	var unplaced: Array = []
	for id in batch:
		if not placed.has(id):
			unplaced.append(id)
	check(unplaced.is_empty(), "catalogue batch: every new species can be met in the wild" + ("" if unplaced.is_empty() else " (missing %s)" % ", ".join(unplaced)))
	# Roster audit: every change asks for a level. A final form also asks for trust, including the starter lines.
	var audit_level: Array = []
	var audit_trust: Array = []
	var audit_missing: Array = []
	var audit_parent := {}
	for sid in main.DATA.SPECIES:
		var audit_opts: Array = []
		if main.DATA.EVOS.has(sid):
			audit_opts = main.DATA.EVOS[sid]
		elif main.DATA.SPECIES[sid].has("evo"):
			audit_opts = [main.DATA.SPECIES[sid].evo]
		for audit_o in audit_opts:
			if not audit_o.has("at"):
				audit_level.append(str(sid))
			var audit_to := str(audit_o.get("to", ""))
			if audit_to == "" or not main.DATA.SPECIES.has(audit_to):
				audit_missing.append(str(sid))
				continue
			audit_parent[audit_to] = true
			var audit_next: Array = []
			if main.DATA.EVOS.has(audit_to):
				audit_next = main.DATA.EVOS[audit_to]
			elif main.DATA.SPECIES[audit_to].has("evo"):
				audit_next = [main.DATA.SPECIES[audit_to].evo]
			if audit_next.is_empty() and not audit_o.has("bond"):
				audit_trust.append("%s->%s" % [sid, audit_to])
	check(audit_level.is_empty(), "roster audit: every evolution asks for a level" + ("" if audit_level.is_empty() else " (" + ", ".join(audit_level.slice(0, 6)) + ")"))
	check(audit_trust.is_empty(), "roster audit: every final form also asks for trust" + ("" if audit_trust.is_empty() else " (" + ", ".join(audit_trust.slice(0, 6)) + ")"))
	check(audit_missing.is_empty(), "roster audit: every evolution names a real creature")
	var audit_keep := { "hearthlaugh": true, "cinderstitch": true, "laughrill": true, "fordfoal": true }
	var audit_orphans: Array = []
	for sid in main.DATA.SPECIES:
		var audit_s: Dictionary = main.DATA.SPECIES[sid]
		var audit_size := str(audit_s.get("size", ""))
		if audit_s.get("unique", false) or audit_keep.has(sid):
			continue
		if audit_size != "large" and audit_size != "huge":
			continue
		var audit_has_child: bool = bool(main.DATA.EVOS.has(sid) or audit_s.has("evo"))
		if not audit_parent.has(sid) and not audit_has_child:
			audit_orphans.append(str(sid))
	check(audit_orphans.is_empty(), "roster audit: no large creature is an orphan" + ("" if audit_orphans.is_empty() else " (" + ", ".join(audit_orphans) + ")"))
	check(main.DATA.SPECIES.has("fogslip") and main.DATA.SPECIES.has("raylet") and main.DATA.SPECIES.has("emberdrake"), "roster audit: Fogsail, Sunfrill and Drakelet have the missing stage")
	var ratio_evolved := audit_parent.size()
	check(float(ratio_evolved) / float(main.DATA.SPECIES.size()) >= 0.477, "roster shape: evolved forms are at least 47.7 percent (%d of %d)" % [ratio_evolved, main.DATA.SPECIES.size()])
	var ratio_one := 0
	var ratio_two := 0
	var ratio_three := 0
	for sid in main.DATA.SPECIES:
		if audit_parent.has(sid):
			continue
		var ratio_depth := 1
		var ratio_wave: Array = [sid]
		while not ratio_wave.is_empty():
			var ratio_next: Array = []
			for ratio_id in ratio_wave:
				var ratio_opts: Array = []
				if main.DATA.EVOS.has(ratio_id):
					ratio_opts = main.DATA.EVOS[ratio_id]
				elif main.DATA.SPECIES[ratio_id].has("evo"):
					ratio_opts = [main.DATA.SPECIES[ratio_id].evo]
				for ratio_o in ratio_opts:
					var ratio_to := str(ratio_o.get("to", ""))
					if ratio_to != "" and main.DATA.SPECIES.has(ratio_to):
						ratio_next.append(ratio_to)
			if ratio_next.is_empty():
				break
			ratio_depth += 1
			ratio_wave = ratio_next
		if ratio_depth <= 1:
			ratio_one += 1
		elif ratio_depth == 2:
			ratio_two += 1
		else:
			ratio_three += 1
	check(ratio_two + ratio_three > ratio_one, "roster shape: most families have 2 or 3 stages (%d of one, %d of two, %d of three)" % [ratio_one, ratio_two, ratio_three])
	var mark_note := ""
	var mark_colors := {}
	var height_note := ""
	var sheet_cols := { "e6dcc6": true, "1e1a22": true }
	for sid in main.DATA.SPECIES:
		var mark_sp: Dictionary = main.DATA.SPECIES[sid]
		var mark_parts: Array = main.Figures.sized_parts(mark_sp, true, stand_pose)
		for mark_p in mark_parts:
			var mark_hex := (mark_p[4] as Color).to_html(false)
			sheet_cols[mark_hex] = true
			if not main.Figures.PALETTE_HEX.has(mark_hex):
				mark_colors[mark_hex] = sid
		if not mark_sp.get("marks", false):
			continue
		if not mark_sp.has("metres"):
			height_note += "%s no metres " % sid
			continue
		var mark_want: int = main.Figures.drawn_px(float(mark_sp.metres))
		var mark_span: Vector2i = main.Figures.pixel_span(mark_parts)
		if mark_span.y != mark_want:
			mark_note += "%s %dpx want %d " % [sid, mark_span.y, mark_want]
		var mark_walk: Vector2i = main.Figures.pixel_span(main.Figures.sized_parts(mark_sp, true, { "walking": true, "frame": 1, "wag": 1, "ears_up": true }))
		if mark_walk.y < 12 or mark_walk.y > 34:
			mark_note += "%s walk %d " % [sid, mark_walk.y]
	check(mark_note == "" and height_note == "", "roster audit: marked creatures draw at metres times 12.35" + ("" if mark_note == "" and height_note == "" else " (" + height_note + mark_note + ")"))
	var grow_note := ""
	for sid in main.DATA.SPECIES:
		var grow_opts: Array = []
		if main.DATA.EVOS.has(sid):
			grow_opts = main.DATA.EVOS[sid]
		elif main.DATA.SPECIES[sid].has("evo"):
			grow_opts = [main.DATA.SPECIES[sid].evo]
		for grow_o in grow_opts:
			var grow_to := str(grow_o.get("to", ""))
			if grow_to == "" or not main.DATA.SPECIES.has(grow_to):
				continue
			var grow_young: int = main.Figures.world_height(main.DATA.SPECIES[sid])
			var grow_next: int = main.Figures.world_height(main.DATA.SPECIES[grow_to])
			var young_new: bool = main.DATA.SPECIES[sid].get("marks", false)
			var next_new: bool = main.DATA.SPECIES[grow_to].get("marks", false)
			if young_new and next_new and grow_next <= grow_young:
				grow_note += "%s %d→%s %d " % [sid, grow_young, grow_to, grow_next]
			elif next_new and not young_new and grow_next <= grow_young:
				grow_note += "%s %d→%s %d " % [sid, grow_young, grow_to, grow_next]
			elif young_new and not next_new and grow_young > grow_next:
				grow_note += "%s %d→%s %d " % [sid, grow_young, grow_to, grow_next]
	check(grow_note == "", "catalogue height: a later stage is taller" + ("" if grow_note == "" else " (" + grow_note + ")"))
	check(mark_colors.is_empty(), "palette: every creature colour is on the shared ramps" + ("" if mark_colors.is_empty() else " (" + ", ".join(mark_colors.keys()) + ")"))
	var tamer_parts: Array = main.Figures.person_parts(Vector2i.DOWN, false, 0, false, {
		"skin": Color("f4eddc"), "hair": Color("6a4a32"), "hat": Color("33465e"),
		"shirt": Color("8e342c"), "legs": Color("435a78"), "shoes": Color("4a3426"),
		"style": "short", "outfit": "trousers", "body": "broad",
	})
	for tamer_p in tamer_parts:
		var snapped: Color = main.Figures.nearest_palette(tamer_p[4])
		var snapped_hex := snapped.to_html(false)
		sheet_cols[snapped_hex] = true
	check(sheet_cols.size() <= 32, "palette: the figure sheet stays within 32 colours (%d)" % sheet_cols.size())
	for sheet_hex in sheet_cols:
		check(main.Figures.PALETTE_HEX.has(sheet_hex), "palette: sheet colour #%s is a ramp colour" % sheet_hex)
	# ---- CR4: the evolution moment has staged phases; showpieces get the full version
	main._evo_cine_start({ "sp": "cindercub", "name": "Test" }, "elderhorn")
	check(not main.evo_cine.is_empty(), "CR4: starting the cinematic sets state")
	check(bool(main.evo_cine["full"]), "CR4: Legend-tier evolution gets the full version")
	check(float(main.evo_cine["dur"]) > 3.0, "CR4: full version runs longer than the simple one")
	check(float(main.evo_cine["new_sc"]) > float(main.evo_cine["old_sc"]), "CR4: silhouette grows (huge final > small young)")
	main.evo_cine = {}
	main._evo_cine_start({ "sp": "ripplet", "name": "Test" }, "tidewyrm")
	check(not bool(main.evo_cine["full"]), "CR4: Plain-tier evolution gets the simple version")
	main.evo_cine = {}
	# ---- CR5: new evolution conditions (time, weather, ate)
	check(main.cal.time_of_day() in ["dawn", "day", "dusk", "night"], "CR5: time_of_day returns a valid phase")
	check(main.cal.weather() in ["clear", "rain", "wind", "snow"], "CR5: weather returns a valid condition")
	# Time-based branching: mistfinch at dawn -> dawnchorus
	var finch: Dictionary = main.R.make("mistfinch", 18, {}, main.rng)
	finch.bond = 0.0
	var ctx_dawn := { "place": "larkhaven", "team": [], "time": "dawn", "weather": "clear" }
	check(main.R.evo_target(finch, ctx_dawn) == "", "CR5: mistfinch at dawn without trust stays")
	finch.bond = 20.0
	check(main.R.evo_target(finch, ctx_dawn) == "dawnchorus", "CR5: mistfinch at dawn, once it trusts you a little, becomes Dawnchorus")
	var ctx_dusk := { "place": "larkhaven", "team": [], "time": "dusk", "weather": "clear" }
	check(main.R.evo_target(finch, ctx_dusk) == "duskwing", "CR5: mistfinch at dusk becomes Duskwing")
	var ctx_day := { "place": "larkhaven", "team": [], "time": "day", "weather": "clear" }
	check(main.R.evo_target(finch, ctx_day) == "cloudharrier", "CR5: mistfinch by day becomes Cloudharrier (default)")
	# Weather/diet branching: brineskit
	var skit: Dictionary = main.R.make("brineskit", 18, {}, main.rng)
	skit.bond = 0.0
	var ctx_rain := { "place": "larkhaven", "team": [], "time": "day", "weather": "rain" }
	check(main.R.evo_target(skit, ctx_rain) == "", "CR5: brineskit in the rain without trust stays")
	skit.bond = 20.0
	check(main.R.evo_target(skit, ctx_rain) == "rainback", "CR5: brineskit in rain, once it trusts you a little, becomes Rainback")
	skit["ate"] = "fish"
	var ctx_clear := { "place": "larkhaven", "team": [], "time": "day", "weather": "clear" }
	check(main.R.evo_target(skit, ctx_clear) == "gorgebelly", "CR5: brineskit fed fish becomes Gorgebelly")
	# ---- music: a tune for each place; Larkhaven's comes back with its colour
	check(main._music_key() == "faded", "the faded valley has a lost, quiet tune")
	main.spilled = true
	check(main._music_key() == "larkhaven", "once the colour spills into town, a warm village tune")
	main.spilled = false
	check(["faded", "larkhaven", "barn", "thornwood_route", "thornwood", "thornwood_grove", "saltmarsh_route", "saltmarsh", "saltmarsh_pool", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch", "wild", "trainer"].all(func(k): return ResourceLoader.exists(main.music_path(k))), "every tune is in the game, including both new Thornwood maps sharing Thornwood's theme")
	check(["saltmarsh", "emberfall", "cloudglass"].all(func(k): return ResourceLoader.exists("res://assets/ambience/%s.ogg" % k)), "waves on the coast and wind in the highlands and the pass")
	# ---- the map: closed doors, the barn opens with the story
	check(not main.walkable(Vector2i(4, 4)), "cottage doors stay shut")
	check(not main.walkable(main.BARN_DOOR), "the barn is shut before you sign the register")
	# ---- the opening: narration, Maren walks up, the register
	talk_through()
	check(main.stage == "maren_walks", "after the narration Maren walks over")
	tick(6.0)
	check(main.stage == "maren_talks", "Maren arrives and talks")
	talk_through()
	check(main.stage == "register" and main.register.visible, "the register opens")
	main.register.row = 3
	main.register.change(1)
	check(main.register.look().style == "short", "the register changes your hair")
	main.register.name_text = "Testa"
	main.register.sign_it()
	check(main.painted and main.my_look.name == "Testa" and main.stage == "signed", "signing paints you in, with your name")
	talk_through()
	check(main.stage == "to_barn", "Maren leads you to the barn")
	check(main.walkable(main.BARN_DOOR) or main.maren.tile == main.BARN_DOOR, "the barn door is open now")
	# ---- into the barn
	check(walk_to(main.BARN_DOOR + Vector2i.DOWN), "you can walk to the barn")
	main._step(Vector2i.UP)
	tick(1.0)
	check(main.map_name == "barn" and main.me.where == "barn", "you go inside the barn")
	check(main.maren.where == "barn", "Maren is inside too")
	check(main.actors().size() == 5, "you, Maren and three young creatures in the barn")
	talk_through()
	check(main.stage == "barn_choose", "you're free to meet them")
	# ---- tap a creature to walk up and meet it
	var rip: Object = main.starters[1]
	main._tap(Vector2(rip.tile) * main.TILE + Vector2(8, 8))
	for i in 200:
		tick(0.05)
		if main.card.visible:
			break
	check(main.card.visible and main.card.id == "ripplet", "tapping Ripplet walks you up to it and opens its page")
	check(main.card.sel == 1, "the page starts on Not yet (no accidental choice)")
	main.card._close(false)
	check(not main.card.visible and main.partner == null, "Not yet closes the page and chooses nothing")
	main._meet(main.starters[2])
	main.card._close(true)
	check(main.partner == main.starters[2] and main.stage == "bonded", "choosing Mosshog makes it your partner")
	check(main.restore.size() == 1 and main.restore[0].where == "barn", "the bond brings colour back in the barn")
	talk_through()
	check(main.stage == "walk_out", "after the bond you walk out together")
	check(main.team.size() == 1 and main.team[0].sp == "mosshog" and main.team[0].lvl == 5, "Mosshog joins your team at level 5")
	check(main.rival_c.sp == "cindercub" and main.rival_c.lvl == 4, "Wren will take Cindercub, the one that beats Mosshog")
	# ---- your partner follows you out, and the colour has spilled into town
	check(walk_to(main.BARN_EXIT + Vector2i.UP), "you can walk back to the barn door")
	main._step(Vector2i.DOWN)
	tick(1.0)
	check(main.map_name == "larkhaven" and main.partner.where == "larkhaven", "you and Mosshog step outside")
	check(main.spilled and main.restore.size() == 2, "the colour spills out of the barn into town")
	check(main.maren.where == "larkhaven", "Maren comes out of the barn with you")
	talk_through()
	# ---- Wren runs in and challenges you
	check(main.stage == "wren_runs" and main.wren.where == "larkhaven", "Wren arrives, running")
	for i in 300:
		tick(0.05)
		if main.stage == "rival1": break
	check(main.stage == "rival1" and (main.wren.tile - main.me.tile).length() <= 1.01, "Wren stops beside you")
	check(main.lines.size() == main.DATA.SCENES.rival1.size() and "Mosshog" in main.lines[-1].text and "Cindercub" in main.lines[-1].text, "Wren's lines name both partners")
	talk_through()
	check(main.stage == "battle" and main.battle.visible, "the battle starts")
	check(main.battle.foes.size() == 1 and main.battle.allies.size() == 1 and main.battle.trainer != "", "you against Wren, one each")
	var bt: Control = main.battle
	var turns := 0
	for i in 4000:
		tick(0.05)
		if bt.state == "choose":
			turns += 1
			bt._choose(0)
			if turns == 1: check(bt.state == "moves", "Fight opens the moves")
			var mv: Array = main.R.moves_of(bt.wait_u.c).filter(func(m): return bt.wait_u.cds.get(m, 0.0) <= 0)
			mv.sort_custom(func(a, b): return bt.best_value(a) > bt.best_value(b))
			bt._use_move(mv[0])
		if bt.state == "results": break
	check(bt.state == "results" and bt.result in ["won", "lost"], "the battle ends with a result (%s after %d turns)" % [bt.result, turns])
	check(turns >= 2, "you get to choose on your turns")
	if bt.result == "won":
		check(bt.results.any(func(l): return "XP" in l) and main.team[0].xp + main.team[0].lvl > 5, "winning gives XP")
	bt._go_to("fog_out")
	tick(1.5)
	check(not bt.visible and main.stage == "after_rival", "the results close and the story carries on")
	check(main.team[0].hp == main.R.stats(main.team[0]).hp, "Maren patches your team up")
	talk_through()
	check(main.stage == "free", "after Wren you're free")
	check(main.caption.text != "" and not "trial" in main.caption.text.to_lower() and main._partner_name() in main.caption.text, "the note after Wren says who walks with you, not that the trial has ended (%s)" % main.caption.text)
	check("press E" in main.caption.text and "press J" in main.caption.text, "the note after Wren names the keys to talk and to open the field book (Playtester)")
	check(main.keys_for("walk") != "" and main.keys_for("talk") != "" and main.keys_for("book") != "", "every control has words for the device in use")
	var before: Vector2i = main.me.tile
	for d in [Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP]:
		if main.walkable(main.me.tile + d):
			main._step(d)
			break
	tick(0.6)
	check(main.partner.tile == before, "your partner follows in your footsteps")
	# ---- the road north: Thornwood, its items, tall grass, a wild creature and the first catch
	check(walk_to(Vector2i(10, 1)), "you can walk up to the road north")
	main._step(Vector2i.UP)
	tick(1.0)
	check(main.map_name == "thornwood_route" and main.me.tile == Vector2i(13, 16), "the north road opens onto Thornwood Trail, arriving where the route says")
	check(main.caption.text == "", "out on the road, the note after Wren is gone")
	check(main.partner.where == "thornwood_route", "your partner comes onto the trail too")
	check(main.DATA.MAPS.thornwood_route.exits.N.to == "thornwood" and main.DATA.MAPS.thornwood.exits.S.to == "thornwood_route", "WD4a: the trail and Thornwood settlement are separate connected maps")
	check(main.DATA.MAPS.thornwood_route.exits.E.requiresElement == "Stone" and main.DATA.MAPS.has("thornwood_grove"), "WD4a: Old Root Grove is a return spot behind a Stone-partner gate")
	# ---- a route trainer spots you, walks over and battles (Bram, from the game data)
	# ---- the turning year (WS1, WS2)
	var Cal := preload("res://scripts/calendar.gd")
	var yr = Cal.new()
	check(yr.season() == "spring" and yr.day() == 1 and yr.date_text() == "Early spring, day 1", "the world's year begins on the first day of spring")
	yr.advance(Cal.DAY_SECONDS * Cal.DAYS + Cal.DAY_SECONDS * 22.5)
	check(yr.season() == "summer" and yr.day() == 23 and yr.date_text() == "Late summer, day 23", "a season is thirty days of play, and the date is in full words")
	yr.played = Cal.DAY_SECONDS * (Cal.DAYS * 3 + 24)
	check(yr.season() == "winter" and yr.festival() == "midwinter", "late in winter: the Midwinter Hearth")
	yr.mode = "real"
	yr.today = { "month": 12, "day": 24 }
	check(yr.season() == "winter" and yr.festival() == "midwinter", "on the real calendar, Christmas Eve falls in the Midwinter Hearth")
	yr.today = { "month": 7, "day": 4 }
	check(yr.season() == "summer" and yr.festival() == "", "July is summer, with no festival that day")
	yr.south = true
	check(yr.season() == "winter", "and winter, south of the equator")
	yr.mode = "autumn"
	check(yr.season() == "autumn" and yr.festival() == "" and yr.date_text() == "Always autumn", "a season held stays put")
	var yr2 = Cal.new()
	yr2.from_dict(yr.to_dict())
	check(yr2.mode == "autumn" and yr2.south, "the calendar saves and loads")
	# ---- seasons and festivals in the world (WS3, WS5), from ChatGPT's data
	var fest_played: float = main.cal.played
	var fest_map: String = main.map_name
	var fest_tile: Vector2i = main.me.tile
	main.map_name = "thornwood"
	main.cal.played = Cal.DAY_SECONDS * Cal.DAYS * 1 + 10.0
	check(main._wild_table() == main.DATA.MAPS.thornwood.seasonal.summer.wild and main._wild_table().any(func(w): return w[0] == "sunspark" and int(w[1]) == 6), "in summer, Thornwood's wild table favours Sunspark")
	main.cal.played = 10.0
	check(main._wild_table().any(func(w): return w[0] == "sunspark" and int(w[1]) == 2), "and Sunspark is rare in spring, but still there")
	main.map_name = "larkhaven"
	main.lines.clear()
	main._season_word(main._maren_data())
	check(main.lines.size() == 1 and "shoots" in str(main.lines[0]), "Maren says something about the spring")
	main.lines.clear()
	main.cal.played = Cal.DAY_SECONDS * 10.0 + 1.0                       # day 11 of spring: Planting Day
	main.fest_done = {}
	main._festival_invite()
	check(main.fest_task == "planting" and main.lines.size() >= 3, "on Planting Day, Maren asks you to plant a flower and says how")
	main.lines.clear()
	main.me.tile = main.PADDOCK.position
	check(main._festival_here() and main.flowers.has([main.PADDOCK.position.x, main.PADDOCK.position.y]) and main.keepsakes.has("planting_ribbon"), "a flower in the paddock, and the Seed Basket Ribbon to keep")
	main.lines.clear()
	main._festival_invite()
	check(main.fest_task == "" and main.lines.is_empty(), "once a year: she doesn't ask again today")
	main.flowers.clear()
	main.keepsakes.clear()
	main.fest_done = {}
	main.lines.clear()
	main.cal.played = fest_played
	main.map_name = fest_map
	main.me.tile = fest_tile
	var keep_mode: String = main.cal.mode
	main.cal.mode = "winter"
	check(main._leaf_tint() != Color.WHITE and main.cal.season() == "winter", "winter turns the leaves")
	main.cal.mode = keep_mode
	var wd4a_map_after_calendar: String = main.map_name
	main.map_name = "thornwood"                  # this legacy geometry check belongs to the original settlement map
	check(main._tree_at(8, 4).y == 3.0 * main.TILE and main._tree_at(12, 14).y > 13.5 * main.TILE, "trees beside open ground stand tall, but never over the first signpost")
	main.map_name = wd4a_map_after_calendar
	check(main.canopy != null and main.canopy.material is ShaderMaterial, "tree tops that pass in front of you are washed out like the world around them")
	check(main.npcs.filter(func(n): return n.where in ["thornwood_route", "thornwood"]).size() == 3 and main.npc_info.has("bram") and main.npc_info.has("lise") and main.npc_info.has("isolde"), "WD4a: Bram is on the trail; Lise and Warden Isolde are in the settlement")
	main.npc_info.lise.beaten = true                # keep Lise out of the way for these checks
	main.walk_to = main.route(main.me.tile, Vector2i(14, 10))
	for i in 200:
		tick(0.05)
		if main.spotter or not main.lines.is_empty(): break
	check(main.spotter != null or not main.lines.is_empty(), "walking into Bram's line of sight gets you spotted")
	for i in 100:
		tick(0.05)
		if not main.lines.is_empty(): break
	check(not main.lines.is_empty() and main.lines[0].who == "bram", "Bram walks over and speaks")
	talk_through()
	check(main.battle.visible and main.battle.kind == "trainer" and main.battle.foes.size() == 2, "Bram's battle: his two creatures at once")
	var coins0: int = main.bag.coins
	for u in main.battle.foes: u.c.hp = 0           # the checks win this one outright
	for i in 100:
		tick(0.05)
		if main.battle.state == "results": break
	check(main.battle.result == "won", "beating Bram")
	main.battle._go_to("fog_out")
	tick(1.5)
	check(main.npc_info.bram.beaten and main.bag.coins > coins0, "Bram counts as beaten and pays out coins (%d)" % (main.bag.coins - coins0))
	talk_through()
	check(not main._gate_open("thornwood"), "the hawthorn gate stays shut until you beat the Warden")
	# ---- story moments while you explore: Wren's rematch on the trail, then the guardian of Thornwood
	main.explored_in["thornwood"] = 11
	main._explore()
	check(main.wren.where == "thornwood_route" and not main.lines.is_empty() and main.lines.any(func(l): return l.who == "wren"), "after 12 explorations Wren catches you up on the expanded trail")
	talk_through()
	check(main.battle.visible and main.battle.foes.size() == 2 and main.battle.foes.any(func(u): return u.c.sp == main.rival_c.sp), "Wren's team: a Glimmerwing and the partner Wren chose")
	for u in main.battle.foes: u.c.hp = 0
	for i in 100:
		tick(0.05)
		if main.battle.state == "results": break
	main.battle._go_to("fog_out")
	tick(1.5)
	check(main.story_done.has("rival2") and main.wren.where == "gone", "beating Wren marks the moment done, and Wren heads off")
	talk_through()
	main.explored_in["thornwood"] = 19
	main._explore()
	check(not main.lines.is_empty() and "Elderhorn" in " ".join(main.lines.map(func(l): return l.text)), "at 20, Elderhorn steps out of the old trees")
	talk_through()
	check(main.battle.visible and main.battle.kind == "wild" and main.battle.foes[0].c.sp == "elderhorn" and main.battle.foes[0].c.rar == 4, "a legendary encounter: Elderhorn, level 11")
	for u in main.battle.foes: u.c.hp = 0
	for i in 100:
		tick(0.05)
		if main.battle.state == "results": break
	main.battle._go_to("fog_out")
	tick(1.5)
	check(not main.story_done.has("elder") and int(main.story_retry.get("elder", 0)) == 26, "knocked out, it slips away and can be met again after six more explorations")
	talk_through()
	for c in main.team: c.hp = main.R.stats(c).hp
	# ---- WD4a: a place to return to with the right partner
	check(walk_to(Vector2i(28, 10)), "WD4a: the east spur reaches the stone shelf above Old Root Grove")
	main._step(Vector2i.RIGHT)
	tick(0.8)
	check(main.map_name == "thornwood_route" and not main.lines.is_empty() and "Stone partner" in str(main.lines[0].text), "without a Stone partner, the hidden grove stays out of reach")
	talk_through()
	var stone_helper: Dictionary = main.R.make("pebblepaw", 8, { "rar": 1 }, main.rng)
	main.team.append(stone_helper)
	check(main._team_has_element("Stone"), "a Stone creature in the team satisfies the return gate")
	check(walk_to(Vector2i(28, 10)), "back to the stone shelf with Pebblepaw")
	main._step(Vector2i.RIGHT)
	tick(0.8)
	check(main.map_name == "thornwood_grove" and main.me.tile == Vector2i(1, 8), "the Stone partner opens Old Root Grove")
	check(main._wild_table().any(func(w): return w[0] == "sunspark" and int(w[1]) == 12), "the hidden pocket makes rare Sunspark substantially easier to find")
	check(main.DATA.MAPS.thornwood_grove.signs["17,6"].contains("antler"), "the hidden pocket has a small Elderhorn clue already consistent with Thornwood's story")
	main._go("thornwood_route", Vector2i(28, 10), Vector2i.LEFT)
	tick(0.8)
	main.team.erase(stone_helper)
	check(main.map_name == "thornwood_route", "you can return from the hidden grove to the trail")
	# the north end of the trail reaches Thornwood's settlement; old saves keep the original 'thornwood' map id
	check(walk_to(Vector2i(13, 1)), "the trail continues north to the settlement")
	main._step(Vector2i.UP)
	tick(0.8)
	check(main.map_name == "thornwood" and main.me.tile == Vector2i(13, 14), "WD4a: the original Thornwood map is now the settlement, preserving old-save map ids and coordinates")
	var lures0: int = main.bag.lures
	check(walk_to(Vector2i(27, 10)), "you can walk to the lures lying in the grass")
	check(main.bag.lures == lures0 + 3 and main.got_items.has("tw2"), "picking up 3 lures (%d)" % main.bag.lures)
	talk_through()
	var wild := false
	for attempt in 6:
		main.grass_n = 1
		main.rng.seed = 11 + attempt
		var walked := walk_to(Vector2i(20, 7))
		if attempt == 0: check(walked or main.battle.visible or not main.lines.is_empty(), "walking into the tall grass")
		talk_through()
		if main.battle.visible:
			wild = true
			break
		walk_to(Vector2i(14, 10))
		talk_through()
	check(wild and main.battle.kind == "wild", "the tall grass turns up a wild creature")
	if wild:
		var foe: Dictionary = main.battle.foes[0].c
		check(foe.sp in main.DATA.BIOMES.thornwood.wild.map(func(w): return w[0]) and foe.lvl >= 2 and foe.lvl <= 12, "it lives in Thornwood, at a fitting level (%s, level %d)" % [foe.sp, foe.lvl])
		check(main.seen.has(foe.sp), "the Wilddex records it as seen")
		var bt2: Control = main.battle
		var tries := 0
		for i in 4000:
			tick(0.05)
			if bt2.state == "choose":
				if int(main.bag.lures) > 0 and tries < 6:
					var before_l: int = main.bag.lures
					bt2._choose(3)
					if tries == 0: check(bt2.state == "capture" and main.bag.lures == before_l - 1, "Bond throws a lure and starts the calm meter")
					bt2.cap.pos = bt2.cap.zone
					bt2._calm()
					tries += 1
				else:
					bt2._choose(0)
					bt2._use_move(main.R.moves_of(bt2.wait_u.c)[0])
			if bt2.state == "results": break
		check(bt2.state == "results", "the wild battle ends (%s, %d lures thrown)" % [bt2.result, tries])
		var team0: int = main.team.size()
		bt2._go_to("fog_out")
		tick(1.5)
		if bt2.result == "caught":
			check(main.team.size() == team0 + 1 and main.bonded.has(foe.sp), "the creature you calmed joins your team")
		talk_through()
	# ---- Warden Isolde at the hawthorn gate: her scene, her battle, the Thorn Badge, the gate
	if main.map_name == "thornwood" and not main.battle.visible:
		check(walk_to(Vector2i(12, 2)), "you can walk up to Warden Isolde")
		main.me.face = Vector2i.UP
		var ev2 := InputEventKey.new()
		ev2.pressed = true
		ev2.keycode = KEY_ENTER
		ev2.physical_keycode = KEY_ENTER
		main._unhandled_input(ev2)
		check(not main.lines.is_empty() and main.lines.size() - main.DATA.STORY.filter(func(b): return b.id == "warden")[0].lines.size() in [0, 1], "Isolde's scene from the game data (after she recognises your family)")
		talk_through()
		check(main.battle.visible and main.battle.foes.size() == 3 and main.battle.trainer == "Warden Isolde", "the Warden battle: three creatures")
		for u in main.battle.foes: u.c.hp = 0
		for i in 100:
			tick(0.05)
			if main.battle.state == "results": break
		main.battle._go_to("fog_out")
		tick(1.5)
		check("thorn" in main.badges and main._gate_open("thornwood"), "the Thorn Badge, and the gate opens")
		talk_through()
		check(walk_to(Vector2i(13, 1)), "you can walk to the open gate (at %s, stage %s, lines %d, battle %s, map %s)" % [main.me.tile, main.stage, main.lines.size(), main.battle.visible, main.map_name])
		main._step(Vector2i.UP)
		tick(1.0)
		check(main.map_name == "saltmarsh_route" and main.me.tile == Vector2i(13, 14), "through the gate: the coast road below Saltmarsh")
		check(main.DATA.MAPS.saltmarsh_route.exits.N.to == "saltmarsh" and main.DATA.MAPS.saltmarsh.exits.S.to == "saltmarsh_route", "WD4b: the coast road and the original Saltmarsh map are separate")
		check(main.DATA.MAPS.saltmarsh_route.exits.W.requiresElement == "Tide" and main.DATA.MAPS.has("saltmarsh_pool"), "WD4b: Moon Pool is a return spot behind a Tide-partner gate")
		check(walk_to(Vector2i(1, 8)), "WD4b: the west spur reaches the tide shelf")
		main._step(Vector2i.LEFT)
		tick(0.8)
		check(main.map_name == "saltmarsh_route" and not main.lines.is_empty() and "Tide partner" in str(main.lines[0].text), "without a Tide partner, Moon Pool stays out of reach")
		talk_through()
		var tide_helper: Dictionary = main.R.make("brineskit", 8, { "rar": 1 }, main.rng)
		main.team.append(tide_helper)
		check(main._team_has_element("Tide"), "a Tide creature in the team satisfies the return gate")
		check(walk_to(Vector2i(1, 8)), "back to the tide shelf with Brineskit")
		main._step(Vector2i.LEFT)
		tick(0.8)
		check(main.map_name == "saltmarsh_pool" and main.me.tile == Vector2i(1, 8), "the Tide partner opens Moon Pool")
		check(main._wild_table().any(func(w): return w[0] == "foamglint" and int(w[1]) == 12), "the hidden pool makes rare Foamglint substantially easier to find")
		check(str(main.DATA.MAPS.saltmarsh_pool.signs["22,8"]).contains("tide"), "the hidden pool keeps Tobin's story: the tide that walked out")
		main._go("saltmarsh_route", Vector2i(1, 8), Vector2i.RIGHT)
		tick(0.8)
		main.team.erase(tide_helper)
		check(main.map_name == "saltmarsh_route", "you can return from Moon Pool to the coast road")
		check(walk_to(Vector2i(13, 1)), "the coast road continues north to the settlement")
		main._step(Vector2i.UP)
		tick(0.8)
		check(main.map_name == "saltmarsh" and main.me.tile == Vector2i(13, 12), "WD4b: the original Saltmarsh map is the settlement, so old saves keep their coordinates")
		check(main.level_cap() == 25, "one badge raises the level cap to 25 (CAP_TABLE)")
		check(main.npcs.any(func(n): return n.id == "nerys" and n.where == "saltmarsh" and main.npc_info.nerys.warden), "Warden Nerys waits in the settlement")
		check(main.npcs.any(func(n): return n.id == "tobin" and n.where == "saltmarsh_route") and main.npcs.filter(func(n): return n.where == "saltmarsh").size() >= 3, "WD4b: Tobin is on the coast road; Cato, Marit and Nerys stay in the settlement")
		# ---- the cliff road east to the Emberfall Highlands: roped off until Nerys gives you the Tide Badge
		main.npc_info.cato.beaten = true                # (walk past the beach trainers for this check)
		main.npc_info.marit.beaten = true
		check(walk_to(Vector2i(28, 8)), "you can walk along the beach to the cliff road")
		main._step(Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "saltmarsh" and not main.lines.is_empty() and "Tide Badge" in main.lines[0].text, "the cliff road is roped off without the Tide Badge, and the sign says so")
		talk_through()
		tick(0.5)
		main.npc_info.nerys.beaten = true
		main.badges.append("tide")
		check(walk_to(Vector2i(28, 8)), "back at the foot of the cliff road")
		main._step(Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "emberfall" and main.me.tile == Vector2i(1, 8), "with the Tide Badge: up to the Emberfall Highlands, arriving where the map says")
		check(main.level_cap() == 35 and main.battle.area == "emberfall", "two badges raise the cap to 35, and battles here happen in the highlands")
		check(main.npcs.any(func(n): return n.id == "toren" and n.where == "emberfall" and main.npc_info.toren.warden), "Warden Toren waits above the springs")
		check(main.npcs.any(func(n): return n.id == "orsk") and main.npcs.any(func(n): return n.id == "sela"), "Orsk the ridge hiker and Sela the spring keeper")
		check(main.solid("o") and main.solid("R") and main.route(Vector2i(1, 8), Vector2i(8, 5)).is_empty(), "the hot springs and the cliffs block the way")
		main.explored_in["emberfall"] = 6
		check(main._beat_here("emberfall").get("id", "") == "rival4", "Wren waits on Warmstep Rise after a few explorations")
		main.explored_in["emberfall"] = 0
		check(not main._gate_open("emberfall"), "the high path north into the cloud stays roped until Toren is beaten")
		# ---- up the high path into Cloudglass Pass with the Ember Badge
		main.npc_info.orsk.beaten = true                # (walk past the ridge trainers for this check)
		main.npc_info.sela.beaten = true
		main.npc_info.toren.beaten = true
		main.badges.append("ember")
		check(walk_to(Vector2i(13, 8)) and walk_to(Vector2i(13, 1)), "you can climb to the foot of the high path")
		main._step(Vector2i.UP)
		tick(1.0)
		check(main.map_name == "cloudglass" and main.me.tile == Vector2i(13, 12), "with the Ember Badge: up into Cloudglass Pass, arriving where the map says")
		check(main.level_cap() == 45 and main.battle.area == "cloudglass" and main.CLIFF == main.MOUNTAINS.cloudglass.rock, "three badges: cap 45; the pass has its own cold stone and its own battle skyline")
		check(main.npcs.any(func(n): return n.id == "vessa" and n.where == "cloudglass" and main.npc_info.vessa.warden), "Warden Vessa keeps the shelter at the top")
		check(main.npcs.any(func(n): return n.id == "ilka") and main.npcs.any(func(n): return n.id == "teodor"), "Ilka the rope-mender and Teodor on the trail")
		main.explored_in["cloudglass"] = 6
		check(main._beat_here("cloudglass").get("id", "") == "rival5", "Wren is somewhere in the cloud after a few explorations")
		main.explored_in["cloudglass"] = 0
		# ---- Stillreed Basin (WB3.1): down the basin path to the ferry landing
		main.badges.append("beacon")
		main._go("stillreed", Vector2i(1, 8), Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "stillreed" and main.level_cap() == int(main.DATA.CAP_TABLE[4]), "four badges: into Stillreed Basin, with the cap the game data sets")
		check(main.npcs.any(func(n): return n.id == "tavil" and n.where == "stillreed") and main.npcs.any(func(n): return n.id == "evren" and n.where == "stillreed"), "Tavil the rope-mender and Evren on the orchard path")
		check(main.npcs.any(func(n): return n.where == "stillreed" and main.npc_info[n.id].warden), "a Warden keeps the basin")
		check(not main._gate_open("stillreed"), "the hill trail east stays shut until the basin's Warden is beaten")
		check(main.tile_at(Vector2i(13, 7)) == "j" and main.solid("j") and main.solid("q"), "the ferry skiff is moored at the landing and you can't walk through it")
		check(not main.solid("b") and main.route(Vector2i(1, 8), Vector2i(20, 9)).size() > 0, "the footbridges carry you across the river")
		check(ResourceLoader.exists(main.music_path("stillreed")) and ResourceLoader.exists("res://assets/ambience/stillreed.ogg"), "the basin has its own tune and the sound of running water")
		# ---- Hollowecho Hills (WB3.2), with the Reed Badge
		main.badges.append("reed")
		main._go("hollowecho", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "hollowecho" and main.level_cap() == int(main.DATA.CAP_TABLE[5]), "five badges: into Hollowecho Hills, with the cap the game data sets")
		check(["veslin", "narro", "orri"].all(func(id): return main.npcs.any(func(n): return n.id == id and n.where == "hollowecho")), "Veslin the bell keeper, Narro the surveyor and Orri the bell mender")
		check(not main._gate_open("hollowecho"), "the gathering trail east stays shut until Warden Senna is beaten")
		check(main.route(Vector2i(1, 9), Vector2i(23, 5)).size() > 0 and main.route(Vector2i(1, 9), Vector2i(7, 6)).size() > 0, "a clear path to the hamlet's sign and to Senna's cave")
		check(main.DATA.MAPS.hollowecho.get("items", []).size() == 3, "the three supplies lie where the map says")
		check(main._heritage_line("orri", main.npc_info.orri.data) != "", "Orri has a word for your family")
		check(main.MOUNTAINS.has("hollowecho") and main.CLIFF == main.MOUNTAINS.hollowecho.rock, "the hills have their own grey-green stone")
		# ---- Sunthread Commons (WB3.3), with the Echo Badge
		main.badges.append("echo")
		main._go("sunthread", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "sunthread" and main.level_cap() == int(main.DATA.CAP_TABLE[6]), "six badges: into Sunthread Commons, with the cap the game data sets")
		check(["mirel", "aldren", "pell", "nesla"].all(func(id): return main.npcs.any(func(n): return n.id == id and n.where == "sunthread")), "Mirel the mender, Aldren the runner, Pell passing through and Nesla the weaver")
		check(not main._gate_open("sunthread"), "the road east stays shut until Warden Halen is beaten")
		check(main.route(Vector2i(1, 9), Vector2i(24, 6)).size() > 0 and main.route(Vector2i(1, 9), Vector2i(27, 5)).size() > 0, "a clear path to Halen and to the shelter sign")
		check(main.DATA.MAPS.sunthread.get("items", []).size() == 3 and main._heritage_line("nesla", main.npc_info.nesla.data) != "", "three supplies, and Nesla has a word for your family")
		# ---- Farwatch Reach (WB3.4), with the Loom Badge
		main.badges.append("loom")
		main._go("farwatch", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		check(main.map_name == "farwatch" and main.level_cap() == int(main.DATA.CAP_TABLE[7]), "seven badges: into Farwatch Reach, with the cap the game data sets")
		check(["delka", "sivren", "ceryn"].all(func(id): return main.npcs.any(func(n): return n.id == id and n.where == "farwatch")), "Delka the recorder, Sivren the harbor keeper and Ceryn the witness keeper")
		check(not main._gate_open("farwatch"), "the road north to the league stays shut until Warden Rysa is beaten")
		check(main.route(Vector2i(1, 9), Vector2i(27, 9)).size() > 0 and main.solid("~"), "you can walk out to the end of the pier, and the sea stays sea")
		check(main.route(Vector2i(1, 9), Vector2i(20, 4)).size() > 0 and main._heritage_line("ceryn", main.npc_info.ceryn.data) != "", "a clear path up to Rysa's ledger, and Ceryn has a word for your family")
		check(ResourceLoader.exists("res://assets/ambience/farwatch.ogg"), "waves against the harbor")
		# ---- the Returning Light League (WB4.1): Wren, four courts in order, the Champion
		main.badges.append_array(["loom", "horizon"])
		main._go("league", Vector2i(3, 16), Vector2i.UP)
		tick(1.0)
		check(main.map_name == "league" and ["wren", "nelva", "edrin", "maela", "corven", "liora", "avenne"].all(func(id): return main.npcs.any(func(n): return n.id == id and n.where == "league")), "the league: Wren at the gate, Nelva, four court challengers and the Champion")
		main.me.tile = Vector2i(3, 13)
		main.me.pos = Vector2(main.me.tile) * main.TILE
		main.lines.clear()
		check(main._talk_here() and main.lines.size() == 4 and main.then_do.is_valid(), "talk to Wren at the gate: her words before the battle")
		main.lines.clear()
		main.then_do.call()
		main.then_do = Callable()
		check(main.battle.visible and main.battle.foes.size() == 3 and main.battle_story == "league:leagueWren", "and the gate battle begins, three of her team")
		main.battle.visible = false
		main.battle_story = ""
		check(main._league_next().id == "leagueWren", "Wren first")
		main._after_league("leagueWren", "won")
		check(main._league_next().id == "league1" and main.league_room == 0, "then Edrin's listening court")
		main._after_league("league1", "won")
		main._after_league("league2", "won")
		check(main._league_next().id == "league3" and main.league_room == 2, "the courts go in order")
		main._after_league("league3", "lost")
		check(main.league_room == 0 and main._league_next().id == "league1" and main.story_done.has("leagueWren"), "lose a court and the courts begin again (Wren stays beaten)")
		for id in ["league1", "league2", "league3", "league4"]:
			main._after_league(id, "won")
		check(main._league_next().id == "leagueChampion", "four courts won: Champion Avenne on the terrace")
		main.lines.clear()
		main._after_league("leagueChampion", "won")
		check(main.story_done.has("leagueEnding") and main.lines.size() >= 9, "the Champion, and the homecoming at the gate")
		check(main.guests.size() == 2 and main.guests.all(func(g): return g.where == "league") and main.npcs.any(func(n): return n.id == "avenne" and n.tile == Vector2i(5, 14)), "Maren and Isolde come to the gate, and Avenne walks down to meet them")
		check(main.lines.any(func(l): return "smallest paws" in str(l.text)), "then everyone quiets for water and rest (ChatGPT's homecoming lines)")
		# ---- WB5.1: the Lighthouse Spire opens after the Champion
		main.lines.clear()
		main._go("spire", Vector2i(17, 14), Vector2i.LEFT)
		tick(1.0)
		check(main.map_name == "spire" and main.npcs.any(func(n): return n.id == "orla" and n.where == "spire"), "WB5.1: the Champion can enter the Lighthouse Spire and Orla is waiting")
		var orla = main.npcs.filter(func(n): return n.id == "orla")[0]
		main.me.tile = orla.tile + Vector2i.RIGHT
		main.me.pos = Vector2(main.me.tile) * main.TILE
		main.lines.clear()
		check(main._talk_here() and main.lines.any(func(l): return "climb begins rested" in str(l.text)), "Orla explains the Spire climb and its five-floor rests")
		talk_through()
		check(main.battle.visible and main.battle_story == "spire:1" and main.battle.foes.size() == 3 and main.battle.foes.all(func(u): return int(u.c.lvl) == 75), "floor 1 is a three-partner level-75 Spire battle")
		var spire_coins: int = main.bag.coins
		main.battle.visible = false
		main._on_battle("won")
		check(main.spire_floor == 1 and main.spire_best == 1 and main.bag.coins > spire_coins, "winning remembers the current and best floor and pays the floor reward")
		main.lines.clear()
		main.spire_floor = 4
		for creature in main.team: creature.hp = 1
		main._spire_fight()
		check(main.battle_story == "spire:5", "the next fight can reach the fifth-floor rest")
		main.battle.visible = false
		main._on_battle("won")
		check(main.spire_floor == 5 and main.team.all(func(creature): return creature.hp == main.R.stats(creature).hp), "every fifth floor fully rests the team")
		main.spire_active = false
		main.spire_floor = 0
		var isolde_info: Dictionary = main.npc_info.isolde
		var was_beaten: bool = isolde_info.beaten
		isolde_info.beaten = true
		main.lines.clear()
		main._go("thornwood", Vector2i(12, 3), Vector2i.UP)
		tick(1.0)
		main.me.tile = Vector2i(12, 2)
		for n in main.npcs:
			if n.id == "isolde":
				main.me.tile = n.tile + Vector2i.DOWN
		main.lines.clear()
		main._talk_here()
		check(main.lines.any(func(l): return "Champion" in str(l.text)), "back in Thornwood, Isolde welcomes the Champion")
		talk_through()
		var badge_count_before_rematch: int = main.badges.size()
		main.lines.clear()
		main._talk_here()
		check(main.lines.any(func(l): return "last battle taught us" in str(l.text)), "a second Champion visit offers Isolde's stronger rematch")
		talk_through()
		check(main.battle.visible and main.battle_story == "rematch:isolde" and main.battle.foes.all(func(u): return int(u.c.lvl) >= 19), "the Warden rematch uses a stronger version of the original team")
		main.battle.visible = false
		main._on_battle("won")
		check(int(main.rematch_wins.get("isolde", 0)) == 1 and main.badges.size() == badge_count_before_rematch, "winning a rematch advances its tier without awarding another badge")
		talk_through()
		isolde_info.beaten = was_beaten
		check(main.guests.is_empty(), "and the guests have gone home from the league gate")
		main._go("league", Vector2i(3, 16), Vector2i.UP)
		tick(1.0)
		for id in ["leagueWren", "league1", "league2", "league3", "league4", "leagueChampion", "leagueEnding"]:
			main.story_done.erase(id)
		main.league_room = 0
		main.lines.clear()
		main.badges.erase("horizon")
		main._go("farwatch", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		main.badges.erase("loom")
		main._go("sunthread", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		main.badges.erase("echo")
		main._go("hollowecho", Vector2i(1, 9), Vector2i.RIGHT)
		tick(1.0)
		main.badges.erase("reed")
		main._go("cloudglass", Vector2i(13, 12), Vector2i.UP)
		tick(1.0)
		main.badges.erase("beacon")
		main._step(Vector2i.DOWN)
		tick(1.0)
		check(main.map_name == "emberfall" and main.me.tile == Vector2i(13, 1) and main.CLIFF == main.MOUNTAINS.emberfall.rock, "and back down to the warm stone of Emberfall")
		talk_through()
		check(walk_to(Vector2i(13, 8)) and walk_to(Vector2i(1, 8)), "back along the ridge path to the coast road")
		main.badges.erase("ember")
		main.npc_info.toren.beaten = false
		main._step(Vector2i.LEFT)
		tick(1.0)
		check(main.map_name == "saltmarsh" and main.me.tile == Vector2i(28, 8), "and back down to the coast")
		talk_through()
		main.badges.erase("tide")                       # back to one badge, as the checks below expect
		main.npc_info.nerys.beaten = false
		walk_to(Vector2i(14, 8))                        # along the beach path, out of the tall grass
		check(walk_to(Vector2i(13, 13)) or main.map_name == "saltmarsh_route", "back to the settlement's south edge (at %s, battle %s)" % [main.me.tile, main.battle.visible])
		main._step(Vector2i.DOWN)
		tick(1.0)
		check(main.map_name == "saltmarsh_route" and main.me.tile == Vector2i(13, 1), "WD4b: south from the settlement returns to the coast road")
		talk_through()
		var followed := false
		for _try in 3:
			if walk_to(Vector2i(13, 14)):
				followed = true
				break
			if main.lines.is_empty() and not main.battle.visible:
				break
			talk_through()
		check(followed, "follow the coast road back toward Thornwood")
		main._step(Vector2i.DOWN)
		tick(1.0)
		check(main.map_name == "thornwood" and main.me.tile == Vector2i(13, 1), "and back into Thornwood by the gate")
		talk_through()
	# ---- Maren heals your team
	if main.map_name == "thornwood":
		check(walk_to(Vector2i(13, 15)), "back down through the Thornwood settlement")
		main._step(Vector2i.DOWN)
		tick(1.0)
		check(main.map_name == "thornwood_route" and main.me.tile == Vector2i(13, 1), "WD4a: south from the settlement returns to Thornwood Trail")
		talk_through()
	if main.map_name == "thornwood_route":
		check(walk_to(Vector2i(13, 16)), "follow the expanded trail back toward Larkhaven")
		main._step(Vector2i.DOWN)
		tick(1.0)
	elif main.map_name != "larkhaven":
		check(false, "unexpected map on the way home: %s" % main.map_name)
	talk_through()
	check(main.map_name == "larkhaven", "home to Larkhaven")
	for c in main.team: c.hp = 1
	main.walk_to = main.route(main.me.tile, main.maren.tile + Vector2i.LEFT)
	tick(8.0)
	if (main.me.tile - main.maren.tile).length() <= 1.01:
		var ev := InputEventKey.new()
		ev.pressed = true
		ev.keycode = KEY_ENTER
		ev.physical_keycode = KEY_ENTER
		main._unhandled_input(ev)
	check(main.team.all(func(c): return c.hp == main.R.stats(c).hp), "talking to Maren heals your team")
	# ---- Larkhaven: the shop counter, the inn, and Pip
	talk_through()
	check(main.map_name == "larkhaven", "in Larkhaven for the shop")
	if main.map_name == "larkhaven" and main.lines.is_empty():
		var coins1: int = main.bag.coins
		var lures1: int = main.bag.lures
		main.bag.coins = maxi(coins1, 60)
		coins1 = main.bag.coins
		check(walk_to(Vector2i(7, 11)), "you can walk up to the shop door")
		main._step(Vector2i.UP)
		check(wait_map("shop") and main.place.text == "Juniper's Shop", "walking into the shop door takes you inside Juniper's Shop")
		check(walk_to(main.INTERIORS.shop.keeper_at + Vector2i(0, 2)), "you can walk up to the counter")
		check(main._near_keeper() == "juniper", "Juniper is behind the counter")
		main._keeper_talk("juniper")
		check(main.lines.any(func(l): return l.who == "juniper"), "she greets you")
		talk_through()
		check(main.shop.visible, "and sets out her goods")
		main.shop._buy(0)
		check(main.bag.lures == lures1 + 5 and main.bag.coins == coins1 - 50, "5 lures for 50 coins, like the browser")
		main.bag.coins = 0
		main.shop._buy(1)
		check(main.bag.berries >= 0 and main.bag.coins == 0 and "coins" in main.shop.note, "no coins, no berries (the shopkeeper says so)")
		main.shop._buy(2)
		check(not main.shop.visible, "leaving the counter")
		check(walk_to(main.INTERIORS.shop.exit) and wait_map("larkhaven") and main.me.tile == main.INTERIORS.shop.door + Vector2i.DOWN, "out through the shop door, back in the street (me %s)" % [main.me.tile])
		for c in main.team: c.hp = 1
		check(walk_to(Vector2i(4, 5)), "you can walk to the inn")
		main._step(Vector2i.UP)
		check(wait_map("inn"), "inside the Larkhaven Inn")
		check(walk_to(main.INTERIORS.inn.keeper_at + Vector2i(0, 2)) and main._near_keeper() == "ned", "Old Ned at his counter")
		main._keeper_talk("ned")
		check(main.team.all(func(c): return c.hp == main.R.stats(c).hp), "a night at the inn heals your team")
		talk_through()
		check(walk_to(main.INTERIORS.inn.exit) and wait_map("larkhaven"), "and back out into Larkhaven")
		check(main.npcs.any(func(n): return n.id == "pip" and n.where == "larkhaven"), "Pip lives in Larkhaven")
		check(walk_to(Vector2i(20, 7)), "you can walk up to Pip")
		main.me.face = Vector2i.RIGHT
		check(main._talk_here() and main.lines[0].who == "pip" and main.lines.any(func(l): return "YELLOW" in l.text), "Pip has noticed the colour since your Thorn Badge")
		talk_through()
		# ---- WB2.4: the last two homes, Pip's family home and his gran's cottage
		for home in [["pip_home", "pip_mum"], ["gran_home", "pip_gran"]]:
			var room: Dictionary = main.INTERIORS[home[0]]
			check(main.tile_at(room.door) == "D" and main.DOORS.get(room.door) == home[0], "%s has a door on the Larkhaven map" % room.name)
			check(walk_to(room.door + Vector2i.DOWN), "you can walk up to the door of %s" % room.name)
			main._step(Vector2i.UP)
			check(wait_map(home[0]) and main.place.text == room.name, "walking into its door takes you inside %s" % room.name)
			check(main.keepers.any(func(k): return k.id == home[1] and k.where == home[0]), "someone lives there (%s)" % home[1])
			check(walk_to(room.keeper_at + Vector2i(0, 1)) and main._near_keeper() == home[1], "you can walk up to them")
			main._keeper_talk(home[1])
			check(main.lines.any(func(l): return l.who == home[1]), "and they talk with you")
			check(main.lines.any(func(l): return main.KEEPER_LOOKS[home[1]].name in l.text) and main.story_done.has("met:" + home[1]), "the first time, %s says who she is" % main.KEEPER_LOOKS[home[1]].name)
			talk_through()
			main._keeper_talk(home[1])
			check(not main.lines.any(func(l): return ("I'm " + main.KEEPER_LOOKS[home[1]].name) in l.text), "and doesn't introduce herself again")
			talk_through()
			var bag_before: Dictionary = main.bag.duplicate()
			check(walk_to(room.find.at) and main.got_items.has(room.find.id), "something to find in %s" % room.name)
			check(room.find.give.keys().all(func(k): return int(main.bag[k]) == int(bag_before.get(k, 0)) + int(room.find.give[k])), "it goes in your satchel")
			check(main.lines.any(func(l): return l.who == home[1]), "and they say a word about it")
			talk_through()
			main._go(home[0], room.find.at + Vector2i.LEFT, Vector2i.RIGHT)
			tick(1.0)
			var bag_again: Dictionary = main.bag.duplicate()
			check(walk_to(room.find.at) and main.bag == bag_again, "it's only found once")
			check(walk_to(room.exit) and wait_map("larkhaven") and main.me.tile == room.door + Vector2i.DOWN, "out of %s, back in the street in front of its door (me %s)" % [room.name, main.me.tile])
			check(main.caption.text == "" or not "trial" in main.caption.text.to_lower(), "no stale note outside")
		check(main.KEEPER_LOOKS.pip_mum.name == "Mira" and main.KEEPER_LOOKS.pip_gran.name == "Nora" and main.INTERIORS.gran_home.name == "Nora's cottage", "the homes' people have their names: Mira (Pip's mum) and Nora (his gran)")
		check(main.buildings().size() == 5, "Larkhaven has five buildings now: the inn, the shop, the barn and two homes")
	# ---- the field book
	talk_through()
	var evj := InputEventKey.new()
	evj.pressed = true
	evj.keycode = KEY_J
	evj.physical_keycode = KEY_J
	main._unhandled_input(evj)
	check(main.book.visible and main.book.seen.size() >= 3 and main.book.team == main.team, "J opens the field book: your Wilddex and team")
	check(main.book.bag == main.bag and main.book.badges.size() == main.badges.size(), "the book's Satchel page holds your coins, lures, berries and badges (WD1: the numbers live here)")
	main.book.close()
	tick(0.05)
	check(main.satchel.visible and not ("text" in main.satchel), "on the screen, only the satchel itself: no line of numbers")
	# ---- phone controls and settings (WB6.1-6.2)
	check(InputMap.has_action("move_up") and InputMap.has_action("interact") and InputMap.has_action("open_book"), "every control has a name, for keys, gamepads and the phone pad (WB6.1)")
	var kw := InputEventKey.new()
	kw.pressed = true
	kw.physical_keycode = KEY_W
	check(Controls.dir(kw) == Vector2i.UP, "W walks up, wherever W sits on the keyboard")
	var joy := InputEventJoypadButton.new()
	joy.pressed = true
	joy.button_index = JOY_BUTTON_A
	check(Controls.pressed(joy, "interact"), "a gamepad's A button talks")
	check(not main.touch.visible, "on a computer with no touch screen, no phone pad")
	main.settings.values.buttons = 1                           # Phone buttons: Always
	tick(0.05)
	check(main.touch.visible and main.touch.pad_on and Controls.touch, "the phone pad shows while you walk (Phone buttons: Always)")
	var thumb := InputEventScreenTouch.new()
	thumb.index = 0
	thumb.pressed = true
	thumb.position = main.touch.PAD + Vector2(0, -12)
	main.touch._input(thumb)
	check(Input.is_action_pressed("move_up") and Controls.held_dir() == Vector2i.UP, "a thumb on the pad's top arrow walks up")
	var lift := InputEventScreenTouch.new()
	lift.index = 0
	lift.position = thumb.position
	main.touch._input(lift)
	check(Controls.held_dir() == Vector2i.ZERO, "and lifting it stops")
	var folk: Array = main.npcs.filter(func(n): return n.where == main.map_name)
	if not folk.is_empty():
		var was: Vector2i = main.me.tile
		main.me.tile = folk[0].tile + Vector2i.DOWN
		check(main.action_word() == "Talk", "beside someone, the phone button says Talk")
		main.me.tile = was
	main.say("", "One.")
	main.say("", "Two.")
	tick(0.05)
	check(main.action_word() == "" and not main.touch.btn_on, "while someone speaks, the button steps aside (a tap anywhere moves the talk on)")
	var act := InputEventAction.new()
	act.action = "interact"
	act.pressed = true
	main._unhandled_input(act)
	check(main.lines.size() == 1, "and its press moves the talk on, just like Enter")
	main.lines.clear()
	main.settings.values.buttons = 2                           # Never
	tick(0.05)
	check(not main.touch.visible, "Phone buttons: Never hides them")
	main.settings.values.buttons = 0
	main._open_book()
	main.book.tab = main.book.SETTINGS_TAB
	main.book.row = 0
	var kl := InputEventKey.new()
	kl.pressed = true
	kl.physical_keycode = KEY_LEFT
	for i in 10:
		main.book._input(kl)
	check(main.settings.values.music == 0 and AudioServer.is_bus_mute(AudioServer.get_bus_index("Music")), "the book's Settings page turns the music right down (WB6.2)")
	check(main.music.bus == "Music" and main.ambience.bus == "Ambience" and main.sfx._players[0].bus == "Effects", "music, ambience and effects each play through their own sound bus")
	main.book.row = 3
	main.book._settings_key(Vector2i.RIGHT)
	main.book.row = 4
	main.book._settings_key(Vector2i.RIGHT)
	main.book._settings_key(Vector2i.RIGHT)
	tick(0.05)
	check(main.bubble_text.label_settings.font_size == 10 and main.battle.pace == 2.0, "Text size Large makes speech bigger; Battle pace Fastest halves the waiting")
	main.settings.values = { "music": 10, "ambience": 10, "effects": 10, "text": 0, "pace": 0, "buttons": 0 }
	main.settings.apply()
	main.book.close()
	tick(0.05)
	check(main.bubble_text.label_settings.font_size == 8 and not AudioServer.is_bus_mute(AudioServer.get_bus_index("Music")), "and back to normal")
	check(main.FLOOR.resource_path.contains("/wild/") and main.NATURE.resource_path.contains("/wild/") and main.HOUSE.resource_path.contains("/wild/") and main.WATER.resource_path.contains("/wild/"), "the ground, trees, houses and water are Wildbond's own tiles (assets/env/wild), not the pack Starfall uses")
	main.turn_card.check(Vector2(390, 844))
	check(main.turn_card.visible and main.get_tree().paused, "a phone held upright gets the \"turn your phone sideways\" card, and the game holds still")
	main.turn_card.check(Vector2(844, 390))
	check(not main.turn_card.visible and not main.get_tree().paused, "turned sideways, the card goes and the game carries on")
	# ---- How to play, and solid roofs (Evan's feedback, 2026-10-09)
	main.touch.touched = false                    # (the pad checks above touched the screen)
	tick(0.05)
	main.howto.open()
	check(main.howto.visible and main.howto.in_use() == "keys", "the How to play page shows the controls, the keyboard marked on a computer")
	var anykey := InputEventKey.new()
	anykey.pressed = true
	anykey.physical_keycode = KEY_SPACE
	main.howto._input(anykey)
	check(main.howto.visible, "a key pressed the moment it opens doesn't close it")
	main.howto._process(0.5)
	main.howto._input(anykey)
	check(not main.howto.visible, "then any key closes it")
	_phone_fixes()
	var asked := [false]
	main.book.want_howto.connect(func(): asked[0] = true, CONNECT_ONE_SHOT)
	main.book.row = Settings.ROWS.size()
	main.book._settings_key(Vector2i.RIGHT)
	check(asked[0] and main.howto.visible, "the book's Settings page opens it too (Controls, the last row)")
	main.howto.visible = false
	var map_was: String = main.map_name
	main.map_name = "larkhaven"
	main._roof_map = ""
	var roofs_ok := true
	for house in main.buildings():
		for ry in range(house.position.y, house.end.y - 1):
			for rx in range(house.position.x, house.end.x):
				if main.walkable(Vector2i(rx, ry)): roofs_ok = false
	check(roofs_ok and main.buildings().size() >= 3 and not main.walkable(Vector2i(18, 1)), "nobody walks on a roof: the path behind Maren's barn is closed, so you're never drawn on top of it")
	main.map_name = map_was
	main._roof_map = ""
	main._set_map(main.map_name)
	tick(0.5)
	var place_on: float = main.place.modulate.a
	tick(4.0)
	check(place_on > 0.9 and main.place.modulate.a < 0.05, "a place's name shows large on arrival, then fades")
	check(not main.book.visible, "and closes it")
	# ---- Maren's ranch: creatures you aren't carrying live in the paddock and the barn, where you can visit them
	talk_through()
	var keep_team: Array = main.team.duplicate()
	for c in keep_team:
		c["hold"] = 999                            # (these checks aren't about evolving: "not yet" for now)
	if main.card.visible and main.card_mode == "evolve":
		main.card._pick(1)                           # an offer that came up during the earlier checks: not yet
		talk_through()
		for c in keep_team:
			c["hold"] = 999
	var keep_ranch: Array = main.ranch.duplicate()
	main.team = [main.team[0]]
	main.ranch = [main.R.make("fernruff", 10, { "rar": 1 }, main.rng), main.R.make("poolkit", 12, { "rar": 1 }, main.rng)]
	main._place_ranch()
	check(main.ranch_movers.size() == 2 and main.ranch_movers.all(func(m): return m.where == "larkhaven" and main.PADDOCK.has_point(m.tile)), "creatures at the ranch stand in Maren's paddock")
	var fern: Variant = main.ranch_movers[0]
	main._tap(fern.pos + Vector2(8, 8))               # tap it: you walk over (following if it wanders) and meet it
	for i in 200:
		tick(0.05)
		if main.card.visible: break
	check(main.card.visible and main.card.buttons == ["Take along", "To the stall", "Let it rest"], "tapping a ranch creature walks you over and opens its page: Take along, To the stall or Let it rest (me %s, it %s, card %s %s %s, lines %s, stage %s, team %s)" % [main.me.tile, fern.tile, main.card.visible, main.card_mode, main.card.buttons, main.lines.map(func(l): return l.text.left(30)), main.stage, main.team.map(func(c): return [c.sp, c.lvl, c.get("hold")])])
	main.card._pick(0)
	check(main.team.size() == 2 and main.team[1].sp == "fernruff" and main.ranch.size() == 1 and main.ranch_movers.size() == 1, "Take along: it joins your team and leaves the paddock")
	talk_through()
	main.team.append(main.R.make("bogbough", 9, { "rar": 1 }, main.rng))
	main._visit(main.ranch_movers[0])
	check(main.card.visible and main.card.buttons[0] == "Swap in", "with a full team the page offers a swap")
	main.card._pick(0)
	check(main.card.visible and main.card.buttons.size() == 4 and main.card.buttons[3] == "Never mind", "and asks who rests at the ranch instead (your three, or never mind)")
	var lead: String = main.team[0].sp
	main.card._pick(0)
	check(main.team[0].sp == "poolkit" and main.ranch.size() == 1 and main.ranch[0].sp == lead, "the swap: Poolkit joins, your old lead creature goes to rest")
	check(main.partner.look.kind == "cat", "the new lead creature is the one that walks with you")
	talk_through()
	for k in 5:
		main.ranch.append(main.R.make("dewspinner", 8, { "rar": 1 }, main.rng))
	main._place_ranch()
	check(main.ranch_movers.filter(func(m): return m.where == "larkhaven").size() == 4 and main.ranch_movers.filter(func(m): return m.where == "barn").size() == 2, "four creatures in the paddock, the rest inside the barn")
	main._visit(main.ranch_movers[0])
	main.card._pick(2)
	check(not main.card.visible and main.team.size() == 3 and main.ranch.size() == 6, "Let it rest changes nothing")
	# ---- the barn: the trough and the nursery (breeding)
	var keep_tile: Vector2i = main.me.tile
	main.ranch = [main.R.make("cindercub", 10, { "rar": 1 }, main.rng), main.R.make("blazefang", 16, { "rar": 2 }, main.rng), main.R.make("poolkit", 3, { "rar": 1 }, main.rng)]
	main.ranch[0].bond = 25.0
	main.ranch[1].bond = 30.0
	main._place_ranch()
	main._set_map("barn")
	main.me.tile = Vector2i(21, 7)
	main.bag.berries = 3
	var b0: float = main.ranch[2].bond
	check(main._near_trough(), "standing by the trough in Maren's barn")
	main._feed()
	check(int(main.bag.berries) == 1 and main.ranch[2].bond > b0, "two berries in the trough: your ranch creatures trust you more")
	talk_through()
	main._feed()
	check(int(main.bag.berries) == 1 and main.lines.size() > 0 and "empty" in main.lines[0].text, "with one berry left the trough stays empty")
	talk_through()
	for k in 3:
		main._visit(main.ranch_movers[k])
		main.card._pick(1)
		talk_through()
	check(main.in_stall().size() == 2 and not main.ranch[2].get("stall", false), "two creatures go to the nursery; a third is turned away")
	check(main.ranch_movers.filter(func(m): return main.BREED_STALL.has_point(m.tile)).size() == 2, "and they stand in its straw")
	main.me.tile = Vector2i(4, 5)
	check(main._near_stall(), "standing at the nursery")
	main.bag.coins = 100
	main._breed_here()
	check(main.card.visible and main.card_mode == "breed" and main.breed_opts == ["cindercub"], "a wolf pair: the egg will be a Cindercub (%s)" % [main.breed_opts])
	main.card._pick(0)
	check(int(main.bag.coins) == 20 and not main.egg.is_empty() and main.egg.child.sp == "cindercub" and main.in_stall().is_empty(), "an egg for 80 coins; the parents go back to the ranch")
	talk_through()
	var n_ranch: int = main.ranch.size()
	for k in main.EGG_STEPS:
		main._egg_step()
	check(main.egg.is_empty() and main.ranch.size() == n_ranch + 1 and main.ranch[-1].lvl == 3 and int(main.ranch[-1].gen) == 2, "after a walk on your journey the egg hatches into the ranch")
	talk_through()
	check(not main.R.breed_info(main.ranch[0], main.ranch[2]).ok, "a level-3 creature is too young to breed")
	# ---- Maren's letters on the road, and where to go next
	var keep_badges: Array = main.badges.duplicate()
	main.badges = []
	check("Isolde" in main.where_next() and "Thornwood" in main.where_next(), "with no badges, Maren points you to Warden Isolde in Thornwood")
	main.badges = ["thorn", "tide"]
	check("Emberfall" in main.where_next() and "Toren" in main.where_next(), "two badges: on to Emberfall and Toren")
	main.letter_steps = 1
	var bond_before: float = main.ranch[0].bond
	main._letter_step()
	check(main.lines.size() >= 3 and main.lines.any(func(l): return l.who == "maren" and "Emberfall" in l.text) and main.ranch[0].bond > bond_before, "a runner brings Maren's letter: ranch news, and where next (%s)" % [main.lines.map(func(l): return l.text.left(40))])
	check(main.letter_steps == main.LETTER_STEPS, "and the next one comes after another stretch of road")
	talk_through()
	main.badges = keep_badges
	# ---- Maren's workbench: gear for your creatures, worn and seen
	main.me.tile = Vector2i(2, 9)
	check(main._near_bench(), "standing at Maren's workbench")
	main.story_done.erase("bench")
	main._open_bench()
	check(main.lines.size() >= 2 and main.lines[0].who == "maren", "the first time, Maren explains her workbench")
	talk_through()
	check(main.card.visible and main.card_mode == "bench" and main.card.buttons.size() == 4, "then whoever walks with you tries gear on (%s)" % [main.card.buttons])
	var coins_was: int = int(main.bag.coins)
	main.bag.coins = 0
	var cut: Array = []
	for gi in main.R.GEAR.size():                  # every piece, with "Have it made (N coins)" showing: no button's words cut off
		main.bench_i = gi
		main._open_bench()
		for bi in main.card.buttons.size():
			if main.card._label_w(bi, main.card._btn_size()) > main.card._btn(bi).size.x - 2.0:
				cut.append(main.card.buttons[bi])
		var last: Rect2 = main.card._btn(main.card.buttons.size() - 1)
		if last.end.x > 353.0:
			cut.append("row runs off the page")
	check(cut.is_empty(), "every workbench button's words fit inside it (%s)" % [cut])
	main.bag.coins = coins_was
	main.bench_i = 0
	main.card.visible = false
	main.bench_i = main.R.GEAR.keys().find("harness")
	main._open_bench()
	main.bag.coins = 100
	var wearer: Dictionary = main.team[0]
	main.card._pick(1)
	check(wearer.get("gear") == "harness" and int(main.bag.coins) == 40, "Maren makes a Leather Harness for 60 coins, and it goes on")
	talk_through()
	check(main.partner.look.get("gear") == "harness", "it shows on your partner as you walk")
	check(main.card.visible and main.card.buttons[1] == "Take it off", "back at the bench: Take it off")
	main.card._pick(1)
	check(not wearer.has("gear") and int(main.gear_owned.harness) == 1, "taken off, it goes in your satchel")
	main.card._pick(1)
	check(wearer.get("gear") == "harness" and int(main.gear_owned.harness) == 0, "and goes back on, for nothing")
	main.card._pick(3)
	check(not main.card.visible, "Done closes the bench")
	var bare: Dictionary = wearer.duplicate(true)
	bare.erase("gear")
	check(main.R.stats(wearer).grd > main.R.stats(bare).grd, "a harness: it takes knocks better (Guard %d against %d)" % [main.R.stats(wearer).grd, main.R.stats(bare).grd])
	var foe_c: Dictionary = main.R.make("cindercub", 20, { "rar": 1 }, main.rng)
	var att := { "c": foe_c, "st": main.R.stats(foe_c), "buff": {}, "side": "f" }
	var tgt: Dictionary = main.R.make("mosshog", 20, { "rar": 1 }, main.rng)
	var d_bare: int = main.R.damage(att, { "c": tgt, "st": main.R.stats(tgt), "buff": {}, "side": "a" }, main.DATA.MOVES.emberSnap, 1.0, 0.5, 1.0).d
	tgt["gear"] = "ember"
	var d_band: int = main.R.damage(att, { "c": tgt, "st": main.R.stats(tgt), "buff": {}, "side": "a" }, main.DATA.MOVES.emberSnap, 1.0, 0.5, 1.0).d
	check(d_band < d_bare, "an Ember-Glass Band: Ember moves hurt less (%d against %d)" % [d_band, d_bare])
	var shapes_ok := true
	for sid in main.Figures.SHAPE_FOR:
		if not main.DATA.SPECIES.has(sid):
			continue
		var lk: Dictionary = main.Figures.look_for(main.DATA.SPECIES[sid])
		shapes_ok = shapes_ok and lk.kind == main.Figures.SHAPE_FOR[sid] and main.Figures.call("_" + str(lk.kind), { "wag": 1, "walking": true, "frame": 1 }, lk).size() > 8
	check(shapes_ok and main.Figures.look_for(main.DATA.SPECIES.mosshog).kind == "boar", "WD2: twelve species take the new serpent, turtle, moth and tree-folk shapes; the rest keep their family's")
	check(main.Figures._gear_parts(main.Figures._wolf({}, main.CREATURE_LOOKS.cindercub), "bell").size() > 0, "gear is drawn on the body, whatever its shape")
	# ---- tamer orders: Rally, your family's order, and orders people teach you
	var ob = main.battle
	ob.heritage = "coast"
	ob.taught = ["steady"]
	check(ob.known_orders() == ["rally", "tide", "steady"], "orders: Rally, the coast family's Read the Tide, and Toren's Steady (%s)" % [ob.known_orders()])
	ob.heritage = "farm"
	ob.taught = []
	check(ob.known_orders() == ["rally", "patch"], "a farm family's tamer knows Patch Up")
	var o_team: Array = [main.R.make("cindercub", 12, { "rar": 1 }, main.rng), main.R.make("poolkit", 12, { "rar": 1 }, main.rng)]
	ob.open("wild", o_team, [main.R.make("mosshog", 10, { "rar": 1 }, main.rng)], "")
	ob.wait_u = ob.allies[0]
	ob.orders = 3.0
	ob.allies[1].c.hp = 5
	ob.allies[1].dots = [{ "per": 2, "left": 3, "tick": 1.0 }]
	check(ob.use_order("patch") and ob.allies[1].c.hp > 5 and ob.allies[1].dots.is_empty() and ob.orders == 2.0, "Patch Up: the most hurt creature recovers and its poison eases, for one order")
	ob.heritage = "coast"
	check(ob.use_order("tide") and ob.tide_ready, "Read the Tide: ready for the next big attack")
	ob.orders = 0.0
	check(not ob.use_order("rally"), "not enough orders: nothing happens, and you're told why")
	ob.orders = 3.0
	ob.heritage = "wander"
	ob.allies[1].atb = 0.0
	check(ob.use_order("opening") and ob.allies[1].atb >= main.R.ACT_AT, "Find an Opening: another of your creatures acts at once")
	# ---- every move resting (a Tidewyrm at Halen): no stuck menu; it catches its breath, and you choose once one is ready
	var keep_bag: Dictionary = ob.bag
	ob.bag = { "lures": 0, "berries": 0 }
	var deep_sp := "tidewyrm"
	ob.open("trainer", [main.R.make(deep_sp, 65, { "rar": 1 }, main.rng)], [main.R.make("mosshog", 5, { "rar": 1 }, main.rng)], "Halen")
	var deep: Dictionary = ob.allies[0]
	for m in main.R.moves_of(deep.c):
		deep.cds[m] = 3.0 + 2.0 * main.R.moves_of(deep.c).find(m)
	deep.atb = main.R.ACT_AT
	ob.foes[0].atb = -1000.0
	ob._go_to("run")
	ob._process(0.1)
	check(ob.state == "run" and ob.wait_u != deep and ob.log_lines[-1].ends_with("catches its breath."), "every move resting: no menu with nothing to pick; %s catches its breath" % deep.c.name)
	for i in 200:
		ob._process(0.1)
		if ob.state == "choose": break
	check(ob.state == "choose" and ob.wait_u == deep and ob.has_ready_move(deep), "time runs on, and you choose as soon as a move is ready")
	ob.bag = keep_bag
	ob.visible = false
	ob.state = "off"
	main.battle.heritage = main.heritage()
	check(main.TEACHERS.has("ember") and main.TEACHERS.ember.order == "steady", "Toren teaches Steady with the Ember Badge")
	wearer.erase("gear")
	main.gear_owned.clear()
	main._lead_look()
	main._set_map("larkhaven")
	main.me.tile = keep_tile
	# ---- a creature ready to change: you're asked, and "not yet" is respected until it grows again
	var cub: Dictionary = main.R.make("cindercub", 16, { "rar": 1 }, main.rng)
	main.team = [cub]
	tick(0.1)
	check(main.card.visible and main.card.buttons == ["Let it change", "Not yet"] and main.evolve_to == "smoulderpup", "after the battle that made it ready, Cindercub's change is offered")
	main.card._pick(1)
	talk_through()
	tick(0.2)
	check(not main.card.visible and cub.sp == "cindercub" and int(cub.hold) == 16, "Not yet: it stays itself, and isn't asked again at this level")
	cub.lvl = 17
	tick(0.1)
	check(main.card.visible and main.evolve_to == "smoulderpup", "a level later, it's ready again")
	main.card._pick(0)
	check(not main.evo_cine.is_empty(), "CR4: Let it change starts the evolution moment")
	# Fast-forward through the cinematic
	for i in 60:
		tick(0.1)
	check(cub.sp == "smoulderpup" and main.seen.has("smoulderpup") and main.partner.look.body == main.Figures.look_for(main.DATA.SPECIES.smoulderpup).body, "Let it change: Smoulderpup, now walking with you")
	talk_through()
	for c in keep_team:
		c.erase("hold")
	main.team = keep_team
	main.ranch = keep_ranch
	main._place_ranch()
	main._lead_look()
	# ---- heritage: your family, chosen in the register (docs/proposals/wildbond-heritage.md)
	var reg = main.register
	check(reg.ROWS[8][0] == "Family" and reg.look().heritage == "farm", "the register has a Family line (Farmfolk first)")
	reg.row = 8
	reg.change(1)
	check(reg.look().heritage == "coast" and "partner" in reg.FAMILY_TEXT.coast, "choosing Coastfolk, with what it means written under it")
	reg.change(-1)
	check(main.heritage() == "farm" or main.my_look.has("heritage"), "old journeys without a family count as farmfolk")
	var keep_look: Dictionary = main.my_look.duplicate()
	var keep_team2: Array = main.team.duplicate()
	var h_lead: Dictionary = main.R.make("cindercub", 10, { "rar": 1 }, main.rng)
	var h_second: Dictionary = main.R.make("ripplet", 10, { "rar": 1 }, main.rng)
	for c in [h_lead, h_second]:
		c.traits = []
		c.bond = 0.0
		c["hold"] = 999
	var bond_after := func(fam: String, kind: String) -> Array:
		h_lead.bond = 0.0
		h_second.bond = 0.0
		main.my_look["heritage"] = fam
		main.battle.heritage = fam
		main.team = [h_lead, h_second]
		var foe: Dictionary = main.R.make("glimmerwing", 3, { "rar": 1 }, main.rng)
		main.battle.open(kind, main.team, [foe], "" if kind == "wild" else "Test")
		for u in main.battle.foes: u.c.hp = 0
		for i in 120:
			tick(0.05)
			if main.battle.state == "results": break
		main.battle._go_to("fog_out")
		main.battle_story = "test"
		tick(1.5)
		talk_through()
		return [float(h_lead.bond), float(h_second.bond)]
	var farm_w: Array = bond_after.call("farm", "wild")
	var coast_w: Array = bond_after.call("coast", "wild")
	check(is_equal_approx(coast_w[0], farm_w[0] * 1.5) and is_equal_approx(coast_w[1], farm_w[1]), "coastfolk: the lead creature's trust grows half again as fast (%s vs %s)" % [coast_w, farm_w])
	var farm_t: Array = bond_after.call("farm", "trainer")
	var high_t: Array = bond_after.call("highland", "trainer")
	check(is_equal_approx(high_t[0], farm_t[0] * 1.5) and is_equal_approx(high_t[1], farm_t[1] * 1.5), "highlanders: trust grows faster in battles against tamers (%s vs %s)" % [high_t, farm_t])
	main.team = keep_team2
	main.my_look = keep_look
	main.my_look["heritage"] = "farm"
	main.story_done.erase("her:pip")
	check(walk_to(Vector2i(20, 7)), "back over to Pip")
	main.me.face = Vector2i.RIGHT
	main._talk_here()
	check(not main.lines.is_empty() and main.lines[0].text == main._fill(main._heritage_line("pip", main.npc_info.pip.data)) and main.npc_info.pip.data.has("byHeritage"), "Pip recognises a farm family, the first time, in the line written for him (%s)" % [main.lines[0].text.left(50) if not main.lines.is_empty() else ""])
	talk_through()
	main._talk_here()
	check(not main.lines.is_empty() and not ("farms" in main.lines[0].text), "and only the first time")
	talk_through()
	# ---- saving your journey and loading it back (to a test file, never your real one)
	talk_through()
	main.no_save = false
	main.save_path = "user://test_journey.json"
	main.save_game()
	check(FileAccess.file_exists(main.save_path) and int(main._peek_save().get("v", 0)) == main.SAVE_V, "your journey saves as version 2")
	var lures_saved: int = main.bag.lures
	var lvl_saved: int = main.team[0].lvl
	var team_saved: int = main.team.size()
	main.bag.lures = 0
	main.badges = []
	check(main._load_game(), "and loads back")
	tick(1.0)
	talk_through()
	check(main.bag.lures == lures_saved and "thorn" in main.badges and main.team.size() == team_saved, "with your satchel, badges and team intact")
	check(main.team[0].lvl == lvl_saved and typeof(main.team[0].lvl) == TYPE_INT and main.R.stats(main.team[0]).hp > 0, "creatures come back whole (level %d)" % main.team[0].lvl)
	check(main._gate_open("thornwood") and main.npc_info.bram.beaten, "beaten trainers and the open gate are remembered")
	check(main.ranch_movers.size() == main.ranch.size(), "the ranch creatures are back in the paddock after loading (%d)" % main.ranch.size())
	check(main._save_summary().begins_with(str(main.my_look.name)), "the start page sums it up: %s" % main._save_summary())
	# WD4a keeps the original thornwood map id, so a pre-expansion save opens in the settlement instead of being displaced
	var pre_wd4a: Dictionary = main._read_save()
	pre_wd4a["map"] = "thornwood"
	pre_wd4a["x"] = 13
	pre_wd4a["y"] = 14
	main.SafeSave.write(main.save_path, pre_wd4a)
	check(main._load_game(), "WD4a: a pre-expansion save whose map is thornwood still loads")
	tick(1.0)
	talk_through()
	check(main.map_name == "thornwood" and main.me.tile == Vector2i(13, 14), "WD4a: that old save lands at the same Thornwood coordinate, now in the settlement")
	var pre_wd4b: Dictionary = main._read_save()
	pre_wd4b["map"] = "saltmarsh"
	pre_wd4b["x"] = 13
	pre_wd4b["y"] = 12
	main.SafeSave.write(main.save_path, pre_wd4b)
	check(main._load_game(), "WD4b: a pre-expansion save whose map is saltmarsh still loads")
	tick(1.0)
	talk_through()
	check(main.map_name == "saltmarsh" and main.me.tile == Vector2i(13, 12), "WD4b: that old save lands at the same Saltmarsh coordinate, now in the settlement")
	# WB2.4 adds two cottages to Larkhaven: an old save standing where one now is steps out in front of its door
	var pre_homes: Dictionary = main._read_save()
	pre_homes["map"] = "larkhaven"
	pre_homes["x"] = 13
	pre_homes["y"] = 3
	main.SafeSave.write(main.save_path, pre_homes)
	check(main._load_game(), "WB2.4: a save from before the homes still loads")
	tick(1.0)
	talk_through()
	check(main.map_name == "larkhaven" and main.me.tile == Vector2i(13, 5) and main.walkable(main.me.tile + Vector2i.DOWN), "WB2.4: standing where Pip's home now is, you're put in front of its door (me %s)" % [main.me.tile])
	pre_homes["x"] = 11
	pre_homes["y"] = 7
	main.SafeSave.write(main.save_path, pre_homes)
	main._load_game()
	tick(1.0)
	talk_through()
	check(main.me.tile == Vector2i(11, 7), "WB2.4: anywhere else in Larkhaven, an old save lands exactly where it was")
	# WB5.1 adds only optional save fields: an older journey without them must still load cleanly
	var pre_wb5: Dictionary = main._read_save()
	pre_wb5.erase("spire")
	pre_wb5.erase("rematches")
	main.SafeSave.write(main.save_path, pre_wb5)
	main.spire_floor = 9
	main.spire_best = 12
	main.spire_active = true
	main.rematch_wins = { "isolde": 3 }
	check(main._load_game(), "WB5.1: a pre-Spire save without post-game fields still loads")
	tick(1.0)
	talk_through()
	check(main.spire_floor == 0 and main.spire_best == 0 and not main.spire_active and main.rematch_wins.is_empty(), "WB5.1: missing Spire/rematch fields get safe defaults")
	main._go("larkhaven", Vector2i(10, 1), Vector2i.DOWN)
	tick(1.0)
	main.save_game()
	# a save cut off half-way (a crash, a closed tab) never costs the journey: the backup is read instead
	main.save_game()
	check(FileAccess.file_exists(main.save_path + ".bak") and not FileAccess.file_exists(main.save_path + ".tmp"), "the last good save is kept as a backup")
	var broken := FileAccess.open(main.save_path, FileAccess.WRITE)
	broken.store_string('{"v": 1, "team": [{"sp": "emb')
	broken.close()
	check(not main._read_save().is_empty() and main._save_summary().begins_with(str(main.my_look.name)), "a broken save falls back to the backup")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(main.save_path))
	check(main.SafeSave.exists(main.save_path) and main._load_game(), "a missing save falls back to the backup too")
	main.SafeSave.remove(main.save_path)
	check(not main.SafeSave.exists(main.save_path), "and a cleared save leaves nothing behind")
	main.no_save = true
	# ---- sound effects: every sound asked for has a file, and battles and talk answer with one
	var missing: Array[String] = []
	var rx := RegEx.create_from_string("(?:sfx\\.play|_sfx)\\(\"([a-z]+)\"")
	for f in ["main", "battle", "shop"]:
		for m in rx.search_all(FileAccess.get_file_as_string("res://scripts/%s.gd" % f)):
			if not Sfx.has(m.get_string(1)):
				missing.append(m.get_string(1))
	for el in main.battle.EL_FX:
		if not Sfx.has(main.battle.EL_FX[el][0]):
			missing.append(main.battle.EL_FX[el][0])
	check(missing.is_empty(), "every sound effect has a file, each element's hit included (missing: %s)" % ", ".join(missing))
	check(main.battle.sfx == main.sfx and main.shop.sfx == main.sfx, "the battle and the shop share the game's sound effects")
	var heard: int = main.sfx.count
	main.say("", "A test line.")
	main.say("", "And another.")
	main.advance()
	check(main.sfx.count == heard + 1 and main.sfx.last == "talk", "talking makes a soft blip")
	main.lines.clear()
	var foe2: Dictionary = main.team[0].duplicate(true)
	main.battle.open("wild", main.team, [foe2], "")
	var fu: Dictionary = main.battle.foes[0]
	main.battle._hurt(fu, 1, false, "Ember")
	check(main.sfx.last == "ember", "an Ember hit sounds like fire")
	main.battle._hurt(fu, 1, false, null)
	check(main.sfx.last == "hit", "a plain hit thumps")
	main.battle.visible = false
	main.battle.state = ""
	preload("res://tests/battle_choices.gd").run(main, check)
	preload("res://tests/wild_bond.gd").run(main, check)
	preload("res://tests/reveal.gd").run(main, check)
	preload("res://tests/key_hints.gd").run(main, check)
	# ---- every door and road out has a tile in front of it you can stand on and reach (Adam, 2026-10-10)
	var blocked := door_problems()
	for problem in blocked:
		print("  door check: " + problem)
	check(blocked.is_empty(), "every door, doorway and road out has an open, reachable tile in front of it (%d problems)" % blocked.size())
	_dressing_checks()
	preload("res://tests/roof_routes.gd").run(main, check)
	preload("res://tests/door_taps.gd").run(main, check)
	# ---- the done line
	print("Wildbond Godot checks: %d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)


## Doors that work: on every map (outdoors, the barn, the rooms), the tile in front of each door, doorway and road out
## must be open (not solid, not a roof, nobody standing there) and reachable on foot from where you arrive.
func door_problems() -> Array:
	var out: Array = []
	var keep_map: String = main.map_name
	var maps: Array = main.BUILT.duplicate() + ["barn"] + main.INTERIORS.keys()
	var inward := { "N": Vector2i.DOWN, "S": Vector2i.UP, "E": Vector2i.LEFT, "W": Vector2i.RIGHT }
	for n in maps:
		main._set_map(n)
		var rows: Array = main.cur_map()
		var people: Dictionary = {}
		for m in main.npcs + main.keepers:
			if m.where == n:
				people[m.tile] = m.id
		var open := func(p: Vector2i) -> bool:
			return p.y >= 0 and p.y < rows.size() and p.x >= 0 and p.x < rows[0].length() and not main.solid(main.tile_at(p)) and not main._under_roof(p) and main.tile_at(p) != "D" and not people.has(p)
		var fronts: Array = []                            # [what, tile in front]
		for y in rows.size():
			for x in rows[0].length():
				var p := Vector2i(x, y)
				var ch: String = rows[y][x]
				if indoorsish(n) and (ch == "d" or (n == "barn" and p == main.BARN_EXIT)):
					fronts.append(["the way out at %s" % p, p + Vector2i.UP])
				elif not indoorsish(n) and ch == "D":
					var used: bool = n == "larkhaven" and (main.DOORS.has(p) or p == main.BARN_DOOR)
					fronts.append([("door %s" if used else "shut door %s") % p, p + Vector2i.DOWN])
				elif not indoorsish(n) and inward.has(ch) and main.DATA.MAPS[n].get("exits", {}).has(ch):
					fronts.append(["road %s at %s" % [ch, p], p + inward[ch]])
		# where you can walk from: where you arrive on this map
		var starts: Array = []
		if indoorsish(n):
			starts.append((main.BARN_EXIT if n == "barn" else main.INTERIORS[n].exit) + Vector2i.UP)
		else:
			var st: Array = main.DATA.MAPS[n].get("start", [])
			if st.size() >= 2:
				starts.append(Vector2i(int(st[0]), int(st[1])))
			for other in main.BUILT:
				for k in main.DATA.MAPS[other].get("exits", {}):
					var ex: Dictionary = main.DATA.MAPS[other].exits[k]
					if ex.get("to", "") == n:
						var at := Vector2i(int(ex.x), int(ex.y))
						if not open.call(at) and main.tile_at(at) not in inward:
							out.append("%s: you arrive from %s on %s, which isn't open (%s)" % [n, other, at, main.tile_at(at)])
						starts.append(at)
		var seen := {}
		var queue: Array = starts.duplicate()
		for q in queue:
			seen[q] = true
		while not queue.is_empty():
			var c: Vector2i = queue.pop_front()
			for d in [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
				var nb: Vector2i = c + d
				if not seen.has(nb) and (open.call(nb) or main.tile_at(nb) in inward):
					seen[nb] = true
					queue.append(nb)
		for f in fronts:
			var front: Vector2i = f[1]
			if not open.call(front):
				var why: String = ("%s stands there" % people[front]) if people.has(front) else ("a roof" if main._under_roof(front) else "'%s'" % main.tile_at(front))
				out.append("%s: %s is blocked in front (%s: %s)" % [n, f[0], front, why])
			elif not seen.has(front):
				out.append("%s: %s can't be reached on foot (front %s)" % [n, f[0], front])
	main._set_map(keep_map)
	return out

func indoorsish(n: String) -> bool:
	return n == "barn" or main.INTERIORS.has(n)

## WB-C3, Wildbond on a phone held sideways: what a phone-size run by touch found.
func _phone_fixes() -> void:
	# a phone fills the screen it has (fractional fit, as Starfall's SF-MOBILE-FIT); a computer keeps whole pixels
	var mobile := OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios")
	check(root.content_scale_stretch == (Window.CONTENT_SCALE_STRETCH_FRACTIONAL if mobile else Window.CONTENT_SCALE_STRETCH_INTEGER), "a phone fills its screen; a computer keeps whole-pixel scaling")
	check(root.content_scale_size == Vector2i(384, 216) and root.content_scale_aspect == Window.CONTENT_SCALE_ASPECT_KEEP, "either way the same 384 by 216 view, in proportion")
	# How to play marks the phone column once the pad is showing, even if it opened first
	main.touch.touched = true
	main.touch.refresh()
	main.howto.open()
	main.howto._process(0.05)
	check(main.howto.in_use() == "touch", "on a touch screen, How to play marks the phone or tablet column")
	main.howto.visible = false
	main.touch.touched = false
	main.touch.refresh()
	# WB-C3b: the register's help matches the device (a phone was told "Up/Down" too)
	main.touch.touched = true
	main.touch.refresh()
	var ph: Array = main.register.hints()
	check(ph.size() == 1 and not "Up/Down" in str(ph) and "Tap" in str(ph[0]), "on a phone the register says only how to tap")
	main.touch.touched = false
	main.touch.refresh()
	var kh: Array = main.register.hints()
	check(kh.size() == 2 and "Up/Down" in str(kh[0]), "with a keyboard the register keeps both lines")
	# WB-C3b: the note under the partner card's stat bars has room (three rows of 12px, then a gap)
	check(preload("res://scripts/card.gd").STATS_H >= 3 * 12 + 4, "the partner card's note sits clear of its stat bars")
	# a tap on the speech bubble itself moves the talk on (it used to swallow the tap)
	check(main.bubble.mouse_filter == Control.MOUSE_FILTER_IGNORE, "the speech bubble lets taps through to the game")
	main.lines.clear()
	main.say("maren", "One.")
	main.say("maren", "Two.")
	tick(0.1)
	check(main.bubble.visible, "the bubble is up")
	var at: Vector2 = root.get_final_transform() * main.bubble.get_global_rect().get_center()
	var down := InputEventMouseButton.new()           # (a phone's tap reaches the game as a click, emulated from the touch)
	down.button_index = MOUSE_BUTTON_LEFT
	down.pressed = true
	down.position = at
	var up := down.duplicate()
	up.pressed = false
	root.push_input(down)
	root.push_input(up)
	tick(0.1)
	check(main.lines.size() == 1 and str(main.lines[0].text) == "Two.", "a tap on the bubble itself shows the next line")
	main.lines.clear()
	tick(0.1)
	# a caption two lines long grows upward from the foot of the screen, instead of running off it (the phone run shows it)
	check(main.caption.grow_vertical == Control.GROW_DIRECTION_BEGIN and main.caption.anchor_bottom == 1.0 and main.caption.offset_bottom < 0.0, "a long caption grows upward and stays on screen")
	# and keeps clear of the pad and the button while they show; the whole width otherwise
	var keep_stage: String = main.stage
	main.stage = "free"
	main.touch.touched = true
	main._thumbs_tick()
	var pad_edge: float = main.TouchPad.PAD.x + main.TouchPad.PAD_R
	check(not main.touch.visible or (main.caption.offset_left >= pad_edge), "with the pad showing, the caption starts past it")
	check(main.touch.visible, "(the pad shows for that check)")
	main.touch.touched = false
	main._thumbs_tick()
	check(main.caption.offset_left == 8.0 and main.caption.offset_right == -8.0, "without the pad, the caption has the whole width")
	main.stage = keep_stage

## WB-C4: Larkhaven and the Thornwood Trail dressed. Everything lies flat on open ground, so these check that it still
## sits where it was drawn for: the vegetable patch on open grass, a stone at each cottage door, straw in the pen.
func _dressing_checks() -> void:
	var keep: String = main.map_name
	main._set_map("larkhaven")
	var rows: Array = main.cur_map()
	var patch_ok := true
	for y in range(main.VEG_PATCH.position.y, main.VEG_PATCH.end.y):
		for x in range(main.VEG_PATCH.position.x, main.VEG_PATCH.end.x):
			patch_ok = patch_ok and rows[y][x] == "," and not main.buildings().any(func(b): return b.has_point(Vector2i(x, y)))
	check(patch_ok, "Larkhaven's vegetable patch lies on open grass, clear of every building")
	var doors := 0
	for d in [Vector2i(4, 4), Vector2i(13, 4), Vector2i(2, 10), Vector2i(7, 10)]:
		if rows[d.y][d.x] == "D" and rows[d.y + 1][d.x] in ",.f":
			doors += 1
	check(doors == 4, "a doorstep stone in front of each of Larkhaven's four cottage doors (%d of 4)" % doors)
	var pen: Array = main.DATA.MAPS.larkhaven.pen
	check(pen.size() == 4 and rows[int(pen[1])][int(pen[0])] == ",", "the straw is inside the pen")
	main._set_map("thornwood_route")
	rows = main.cur_map()
	check(rows[12][5] == "," and rows[12][4] == "~", "the trail's pond stone is on dry land where the clearing meets the water")
	check("thornwood_route" in main.WOODLAND_PONDS and not "saltmarsh" in main.WOODLAND_PONDS, "woodland ponds get a muddy bank; the sea keeps its beach")
	main._set_map(keep)
