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
	var D: Dictionary = main.DATA
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
	check(g.lvl == 14 and g.sp == "cindercub" and R.evo_target(g) == "blazefang", "at 14 Cindercub is ready to become Blazefang (you're asked; it isn't forced): %s" % [msgs])
	check(R.evolve(g, "blazefang") == "Cindercub" and g.sp == "blazefang" and g.name == "Blazefang", "letting it change: Cindercub becomes Blazefang")
	# ---- evolution with shapes and conditions (data/evolution.json)
	var bf := R.make("blazefang", 32, { "rar": 1 }, main.rng)
	check(R.evo_target(bf, { "place": "thornwood" }) == "" and R.evo_target(bf, { "place": "emberfall" }) == "pyremane", "a third stage: Blazefang becomes Pyremane at 32, but only in the heat of Emberfall")
	var tw := R.make("tidewyrm", 32, { "rar": 1 }, main.rng)
	tw.bond = 10.0
	check(R.evo_target(tw) == "", "Tidewyrm won't change for a tamer it doesn't trust completely")
	tw.bond = 150.0
	check(R.evo_target(tw) == "deeptide", "with complete trust (Devoted) it becomes Deeptide")
	var tb := R.make("thornback", 32, { "rar": 1 }, main.rng)
	check(R.evo_target(tb, { "team": ["thornback"] }) == "" and R.evo_target(tb, { "team": ["thornback", "glimmerwing"] }) == "elderthorn", "Thornback becomes Elderthorn when raised alongside a Glimmerwing")
	var pk := R.make("poolkit", 24, { "rar": 1 }, main.rng)
	pk.bond = 0.0
	check(R.evo_target(pk, { "place": "cloudglass" }) == "mistlynx", "a branching line: Poolkit in the cloud of the pass becomes Mistlynx")
	check(R.evo_target(pk, { "place": "saltmarsh" }) == "rilllynx", "elsewhere, most become Rilllynx")
	pk.bond = 150.0
	check(R.evo_target(pk, { "place": "saltmarsh" }) == "sunlynx", "and one devoted to its tamer becomes Sunlynx")
	check(R.evo_target(R.make("hearthlaugh", 60, { "rar": 1 }, main.rng)) == "", "Hearthlaugh never evolves; it's itself")
	check(main.DATA.SPECIES.has("pyremane") and main.DATA.SPECIES.size() >= 98, "the new forms are in the Wilddex (%d creatures)" % main.DATA.SPECIES.size())
	# ---- music: a tune for each place; Larkhaven's comes back with its colour
	check(main._music_key() == "faded", "the faded valley has a lost, quiet tune")
	main.spilled = true
	check(main._music_key() == "larkhaven", "once the colour spills into town, a warm village tune")
	main.spilled = false
	check(["faded", "larkhaven", "barn", "thornwood_route", "thornwood", "thornwood_grove", "saltmarsh", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch", "wild", "trainer"].all(func(k): return ResourceLoader.exists(main.music_path(k))), "every tune is in the game, including both new Thornwood maps sharing Thornwood's theme")
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
		check(main.map_name == "saltmarsh" and main.me.tile == Vector2i(13, 12), "through the gate: Saltmarsh Coast, arriving where the map says")
		check(main.level_cap() == 25, "one badge raises the level cap to 25 (CAP_TABLE)")
		check(main.npcs.any(func(n): return n.id == "nerys" and n.where == "saltmarsh" and main.npc_info.nerys.warden), "Warden Nerys waits on the coast")
		check(main.npcs.filter(func(n): return n.where == "saltmarsh").size() >= 4, "the coast's people: Tobin, Cato, Marit and Nerys")
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
		check(walk_to(Vector2i(13, 13)) or main.map_name == "thornwood", "back to the coast road south (at %s, battle %s)" % [main.me.tile, main.battle.visible])
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
	# ---- every move resting (T56's Deeptide at Halen): no stuck menu; it catches its breath, and you choose once one is ready
	var keep_bag: Dictionary = ob.bag
	ob.bag = { "lures": 0, "berries": 0 }
	var deep_sp: String = "deeptide" if main.DATA.SPECIES.has("deeptide") else "tidewyrm"
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
	var cub: Dictionary = main.R.make("cindercub", 14, { "rar": 1 }, main.rng)
	main.team = [cub]
	tick(0.1)
	check(main.card.visible and main.card.buttons == ["Let it change", "Not yet"] and main.evolve_to == "blazefang", "after the battle that made it ready, Cindercub's change is offered")
	main.card._pick(1)
	talk_through()
	tick(0.2)
	check(not main.card.visible and cub.sp == "cindercub" and int(cub.hold) == 14, "Not yet: it stays itself, and isn't asked again at this level")
	cub.lvl = 15
	tick(0.1)
	check(main.card.visible and main.evolve_to == "blazefang", "a level later, it's ready again")
	main.card._pick(0)
	check(cub.sp == "blazefang" and main.seen.has("blazefang") and main.partner.look.body == Color(main.DATA.SPECIES.blazefang.col), "Let it change: Blazefang, now walking with you")
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
	check(FileAccess.file_exists(main.save_path), "your journey saves")
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
	# ---- every door and road out has a tile in front of it you can stand on and reach (Adam, 2026-10-10)
	var blocked := door_problems()
	for problem in blocked:
		print("  door check: " + problem)
	check(blocked.is_empty(), "every door, doorway and road out has an open, reachable tile in front of it (%d problems)" % blocked.size())
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
