extends SceneTree
## Starfall's checks: plays the town by itself, without a window, and checks each part works.
##   Godot_v4.7.2-stable_win64_console.exe --headless --path starfall-godot --script res://tests/run_tests.gd
var main: Node2D
var passed := 0
var failed := 0

func check(ok: bool, what: String) -> void:
	if ok:
		passed += 1
	else:
		failed += 1
		print("FAIL: ", what)

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true                           # never touch the real town
	root.add_child(main)
	_run.call_deferred()

func tick(seconds: float) -> void:
	var steps := int(seconds / 0.05)
	for i in steps:
		main._process(0.05)

func talk_through() -> void:
	var guard := 0
	while not main.lines.is_empty() and guard < 40:
		main.advance()
		guard += 1

func walk_to(goal: Vector2i) -> bool:
	# like a player: if someone steps in the way, tap again
	for tries in 6:
		main.walk_to = main.route(main.me.tile, goal, main.me)
		for i in 200:
			tick(0.05)
			if main.me.tile == goal and main.me.path.is_empty():
				return true
			if main.walk_to.is_empty() and main.me.path.is_empty():
				break
	return false

func hero(name: String) -> Variant:
	for h in main.heroes:
		if h.a.name == name:
			return h
	return null

func _run() -> void:
	main.rng.seed = 2026
	# ---- the town at the start
	check(main.MAP.all(func(r): return r.length() == main.MAP[0].length()), "the town map is the same width on every row")
	check(main.heroes.size() == 3 and main.coins == 100 and main.day == 1, "three adventurers, 100 coins, day one")
	check(main.notices.size() == 3 and main.posted.is_empty(), "three requests on the board, none pinned yet")
	check(not main.lines.is_empty() and main.lines.any(func(l): return l.who == "bryn"), "Bryn welcomes you")
	talk_through()
	tick(1.0)
	check(main.heroes.all(func(h): return h.a.state == "town"), "with nothing pinned up, everyone waits in town")
	# ---- the guild board
	check(walk_to(main.READ_AT), "you can walk up to the board")
	check(main.use() and main.board_open, "using it opens the board, close up")
	var easy := ""
	for id in main.notices:
		if int(main.job_of(id).danger) <= 2 and easy == "":
			easy = id
	if easy == "":
		main.notices[0] = "slimes"
		easy = "slimes"
	main.board_pick(main.notices.find(easy))
	check(main.posted == [easy], "picking a notice pins it up")
	main.board_pick(main.notices.find(easy))
	check(main.posted.is_empty(), "picking it again takes it down")
	main.board_pick(main.notices.find(easy))
	main.board_pick(main.notices.size())
	check(not main.board_open, "Done closes the board")
	walk_to(Vector2i(12, 10))                       # step off the road so you're not in anyone's way
	# ---- an adventurer takes it, goes out, comes home hurt and hungry
	var taker: Variant = null
	for i in 400:
		tick(0.1)
		for h in main.heroes:
			if h.a.state != "town" and taker == null:
				taker = h
		if taker != null and taker.where == "away":
			break
	check(taker != null and main.posted.is_empty(), "an adventurer chooses the job for themselves and takes the notice down")
	check(taker != null and taker.where == "away", "and heads out through the gate")
	var coins0: int = main.coins
	var hp0: int = int(taker.a.max) if taker else 0
	for i in 800:
		tick(0.1)
		if taker.a.state == "to_counter" and taker.tile == main.ORDER_AT and taker.path.is_empty():
			break
	check(taker.where == "town" and taker.a.state == "to_counter", "they come home and go to the inn's counter (state %s)" % taker.a.state)
	check(int(taker.a.hp) < hp0, "a little hurt from the job (%d/%d)" % [int(taker.a.hp), hp0])
	check(main.coins >= coins0, "the guild's share of the reward if it went well (%d -> %d)" % [coins0, main.coins])
	# ---- you serve them yourself
	check(walk_to(main.SERVE_AT), "you can step behind the counter")
	main.me.face = Vector2i.RIGHT
	var coins1: int = main.coins
	check(main.use() and main.coins == coins1 + main.MEAL and main.meals == 1, "serving a meal by hand: %d coins" % main.MEAL)
	check(taker.a.state == "to_rest", "fed, they head up to bed")
	for i in 300:
		tick(0.1)
		if taker.where == "inside":
			break
	check(taker.where == "inside" and taker.a.state == "resting", "they go into the inn to rest")
	for i in 900:
		tick(0.1)
		if taker.where == "town":
			break
	check(taker.where == "town" and int(taker.a.hp) == int(taker.a.max), "rested, they come back out good as new")
	# ---- nobody serving: they give up and go hungry
	var waiter: Variant = main.heroes[2] if main.heroes[2] != taker else main.heroes[1]
	walk_to(Vector2i(11, 10))
	waiter.a.state = "to_counter"
	waiter.a.timer = 0.0
	waiter.a.waited = 0.0
	main.queue.append(waiter)
	var morale0: int = int(waiter.a.morale)
	for i in 600:
		tick(0.1)
		if waiter.a.state != "to_counter":
			break
	check(waiter.a.state == "to_rest" and int(waiter.a.morale) == morale0 - 1, "left waiting too long, they give up grumbling (spirits drop)")
	# ---- a disastrous job: never fatal
	var brave: Variant = hero("Ren")
	brave.a.lvl = 1
	brave.a.job = "barrow"
	brave.where = "away"
	brave.a.state = "away"
	brave.a.timer = 0.0
	main.rng.seed = 1
	for k in 6:
		brave.a.hp = 3
		brave.a.job = "barrow"
		main._come_home(brave)
		main.queue.erase(brave)
	check(int(brave.a.hp) >= 1, "however badly a job goes, nobody dies (hp %d)" % int(brave.a.hp))
	check(main.badly_hurt(brave), "they come home badly hurt instead, bandaged")
	brave.a.state = "town"
	brave.a.hp = brave.a.max
	brave.a.morale = 6
	# ---- Bryn offers to take the counter after you've served enough meals
	main.meals = main.HIRE_AFTER - 1
	var h2: Variant = hero("Yuna")
	walk_to(main.SERVE_AT)
	h2.where = "town"
	h2.tile = main.ORDER_AT
	h2.pos = Vector2(main.ORDER_AT) * 16.0
	h2.path.clear()
	h2.a.state = "to_counter"
	h2.a.waited = 0.0
	main.queue.clear()
	main.queue.append(h2)
	main.me.face = Vector2i.RIGHT
	main.use()
	check(main.meals == main.HIRE_AFTER and main.bryn_offered, "after %d meals by hand, Bryn calls you over (me %s, meals %d, queue %d, at %s, lines %d)" % [main.HIRE_AFTER, main.me.tile, main.meals, main.queue.size(), h2.tile, main.lines.size()])
	check(walk_to(main.bryn.tile + Vector2i.DOWN) or (main.me.tile - main.bryn.tile).length() <= 1.01, "you can walk over to Bryn")
	check(main.use() and not main.lines.is_empty(), "she asks to take the counter")
	talk_through()
	talk_through()
	check(main.hired, "agree, and Bryn is hired")
	walk_to(Vector2i(11, 10))
	for i in 200:
		tick(0.1)
		if main.bryn.tile == main.SERVE_AT:
			break
	check(main.bryn.tile == main.SERVE_AT, "Bryn takes her place behind the counter")
	var h3: Variant = hero("Aki")
	h3.where = "town"
	h3.a.state = "to_counter"
	h3.a.timer = 0.0
	h3.a.waited = 0.0
	main.queue.clear()
	main.queue.append(h3)
	var coins2: int = main.coins
	for i in 300:
		tick(0.1)
		if h3.a.state != "to_counter":
			break
	check(h3.a.state == "to_rest" and main.coins == coins2 + main.MEAL, "Bryn serves without you (coins %d -> %d)" % [coins2, main.coins])
	# ---- the end of the day: a short report and Bryn's wages, or she leaves if you can't pay
	main.coins = 50
	main.day_t = main.DAY_SECONDS - 0.01
	tick(0.1)
	check(main.day == 2 and main.coins == 50 - main.WAGE and "Evening falls" in main.caption.text, "evening: a short report, and Bryn's wages paid")
	check(main.notices.size() == 3, "new requests on the board in the morning")
	main.coins = 3
	main.day_t = main.DAY_SECONDS - 0.01
	tick(0.1)
	check(not main.hired and "couldn't pay" in main.caption.text, "can't pay her wages: Bryn goes back to her own kitchen")
	# ---- building on a plot: Hob's plans, coins, scaffolding, then the building
	check(not main.solid(main.PLOTS.west) and main.plot_at(main.PLOTS.west + Vector2i(1, 1)) == "west", "the west plot is open ground, staked out")
	check(walk_to(main.PLOTS.west + Vector2i(2, 0)), "you can walk up to the plot")
	check(main.use() and main.build_plot == "west" and main.plans().has("healer") and main.plans().has("yard"), "using it opens Hob's plans: the healer's hut, a training yard, a smithy, an apothecary")
	main.coins = 50
	check(not main.build("healer") and "more coins" in main.build_note and main.build_plot == "west", "too few coins: Hob says how many more")
	main.coins = 300
	check(main.build("healer") and main.coins == 180 and main.build_plot == "", "building the healer's hut: 120 coins")
	check(main.solid(main.PLOTS.west) and main.finished("healer") == "", "scaffolding goes up; it isn't finished yet")
	tick(main.BUILDINGS.healer.time + 1.0)
	check(main.finished("healer") == "west" and main.ama.where == "town" and "finished" in main.caption.text, "it's finished, and Ama stands at her door")
	# ---- hurt adventurers go to Ama, and mend twice as fast
	var patient: Variant = hero("Aki")
	patient.where = "town"
	patient.a.state = "town"
	patient.a.hp = int(patient.a.max) / 4
	check(main._bed_of(patient) == main._step_of("west"), "badly hurt, an adventurer goes to Ama's hut instead of the inn")
	var light: Variant = hero("Yuna")
	light.a.hp = int(light.a.max) - 2
	check(main._bed_of(light) == main.INN_STEP, "a few bruises: the inn's bed will do")
	main._to_bed(patient)
	for i in 400:
		tick(0.1)
		if patient.where == "healer":
			break
	check(patient.where == "healer" and patient.a.state == "resting", "they go in to Ama")
	var hp_in: int = int(patient.a.hp)
	tick(1.6)
	check(int(patient.a.hp) - hp_in >= int(ceil(float(patient.a.max) * 0.1)), "and mend quickly in her care (+%d)" % (int(patient.a.hp) - hp_in))
	for i in 400:
		tick(0.1)
		if patient.where == "town":
			break
	check(patient.where == "town" and int(patient.a.hp) == int(patient.a.max), "mended, they come back out")
	# ---- the training yard: idle adventurers practise and grow
	main.build_plot = "east"
	main.coins = 300
	check(main.build("yard"), "a training yard on the east plot")
	tick(main.BUILDINGS.yard.time + 1.0)
	check(main.finished("yard") == "east", "the yard is finished")
	main.posted.clear()
	var trainee: Variant = hero("Ren")
	trainee.where = "town"
	trainee.a.state = "training"
	trainee.a.timer = 30.0
	trainee.a.drill = 0.0
	main.send(trainee, main._step_of("east"))
	var xp0: int = int(trainee.a.xp) + int(trainee.a.lvl) * 1000
	for i in 120:
		tick(0.1)
	check(int(trainee.a.xp) + int(trainee.a.lvl) * 1000 > xp0, "practising at the yard brings experience")
	# ---- the town grows: a new rank brings a newcomer through the gate
	var n0: int = main.heroes.size()
	main.total_jobs = 6
	main._check_rank()
	check(main.rank >= 1 and main.heroes.size() > n0 and main.heroes[n0].a.name == "Kaito", "with buildings and jobs done, Starfall becomes a Village, and Kaito arrives")
	check("Village" in main.status.text or main.RANKS[main.rank].name in ["Village", "Town"], "the town's rank shows at the top")
	# ---- more ground as the town grows
	check(main.plot_at(main.PLOTS.north) == "north", "a Village gets a new plot in the north")
	check(main.rank >= 2 or main.plot_at(main.PLOTS.south) == "", "the south plot waits for a Town")
	# ---- the smithy: adventurers save up for better gear, and you work the hammer
	main.build_plot = "north"
	main.coins = 400
	check(main.build("smithy"), "a smithy on the north plot")
	tick(main.BUILDINGS.smithy.time + 1.0)
	check(main.finished("smithy") == "north", "the smithy is finished")
	main.posted.clear()
	var buyer: Variant = hero("Yuna")
	var send_to_smith := func(h: Variant, purse: int) -> bool:
		h.where = "town"
		h.a.hp = h.a.max
		h.a.purse = purse
		h.a.state = "to_smith"
		h.a.waited = 0.0
		h.a.timer = 0.0
		main.smith_customer = h
		main.send(h, main._step_of("north"))
		for i in 400:
			tick(0.1)
			if main._customer_ready():
				return true
		return false
	buyer.a.purse = 50
	buyer.a.gear = 0
	buyer.a.hp = buyer.a.max
	check(main.wants_gear(buyer), "with 50 coins saved, Yuna wants better gear")
	check(send_to_smith.call(buyer, 50), "she waits at the smithy door")
	check(walk_to(main.forge_at()), "you can walk to the anvil beside her")
	check(main.use() and not main.forge.is_empty(), "using the anvil lights the forge: three strikes")
	var c_forge: int = main.coins
	for k in 3:
		main.forge.x = 0.5
		main.strike()
	check(main.forge.is_empty() and int(buyer.a.gear) == 1 and buyer.a.fine and int(buyer.a.purse) == 10 and main.coins == c_forge + 40, "three strikes in the glow: fine gear, paid from her own savings (gear %d, purse %d)" % [int(buyer.a.gear), int(buyer.a.purse)])
	check(main.pieces == 1 and buyer.a.state == "town" and main.smith_customer == null, "and she's off again, pleased")
	var buyer2: Variant = hero("Aki")
	buyer2.a.gear = 0
	check(send_to_smith.call(buyer2, 45), "Aki comes in next")
	main.use()
	for k in 3:
		main.forge.x = 0.05                            # struck cold, every time
		main.strike()
	check(int(buyer2.a.gear) == 1 and not buyer2.a.fine, "poor strikes still make gear, just not fine work")
	# gear makes jobs go better: fewer bruises from the same job, by the same luck
	var test_job := func(h: Variant, gear: int, tonic: bool) -> int:
		h.a.gear = gear
		h.a.tonic = tonic
		h.a.hp = h.a.max
		h.a.job = "wolves"
		main.rng.seed = 99
		main._come_home(h)
		main.queue.erase(h)
		h.a.state = "town"
		return int(h.a.max) - int(h.a.hp)
	var hurt_plain: int = test_job.call(buyer2, 0, false)
	var hurt_geared: int = test_job.call(buyer2, 3, false)
	var hurt_tonic: int = test_job.call(buyer2, 0, true)
	check(hurt_geared < hurt_plain and hurt_tonic < hurt_plain, "better gear and a tonic both mean coming home less hurt (%d plain, %d geared, %d with a tonic)" % [hurt_plain, hurt_geared, hurt_tonic])
	check(not buyer2.a.tonic, "a tonic is used up on the job")
	buyer2.a.gear = 1
	# Garrick: after five pieces by hand a smith walks in and asks for the forge
	main.pieces = main.SMITH_AFTER - 1
	var buyer3: Variant = hero("Ren")
	buyer3.a.gear = 0
	check(send_to_smith.call(buyer3, 60), "Ren comes in with his savings")
	main.use()
	for k in 3:
		main.forge.x = 0.5
		main.strike()
	check(main.garrick.where == "town", "after your fifth piece, Garrick the smith walks in through the gate")
	for i in 300:
		tick(0.1)
		if main.garrick.path.is_empty() and (main.garrick.tile - main.me.tile).length() <= 1.01:
			break
	check((main.garrick.tile - main.me.tile).length() <= 1.01 or walk_to(main.garrick.tile + Vector2i.DOWN), "he comes over to the anvil")
	talk_through()
	check(main.use() and not main.lines.is_empty() and main.lines.any(func(l): return l.who == "garrick"), "he asks for the work")
	talk_through()
	talk_through()
	check(main.smith_hired, "agree, and Garrick takes the forge")
	walk_to(Vector2i(11, 9))
	buyer3.a.gear = 1
	check(send_to_smith.call(buyer3, 100), "another customer comes in")
	for i in 200:
		tick(0.1)
		if int(buyer3.a.gear) == 2:
			break
	check(int(buyer3.a.gear) == 2 and main.pieces == main.SMITH_AFTER, "Garrick makes the gear without you")
	main.coins = 100
	main.day_t = main.DAY_SECONDS - 0.01
	tick(0.1)
	check("Garrick paid" in main.caption.text and "Gear made" in main.caption.text, "the evening report counts the gear, and Garrick's wages are paid")
	# ---- the apothecary: brew tonics from the herbs, set the price
	main.rank = maxi(main.rank, 2)
	check(main.plot_at(main.PLOTS.south) == "south", "a Town gets the south plot")
	main.build_plot = "south"
	main.coins = 400
	check(main.build("apothecary"), "an apothecary on the south plot")
	tick(main.BUILDINGS.apothecary.time + 1.0)
	main.herbs = 0
	main.stock = 0
	main.shelf_open = true
	main.shelf_pick(0)
	check(main.brewing == 0.0 and "two herbs" in main.shelf_note, "no herbs, no tonics")
	main.herbs = 3
	main.shelf_pick(0)
	check(main.brewing > 0.0 and main.herbs == 1 and not main.shelf_open, "two herbs in the pot, and you stir")
	tick(3.5)
	check(main.stock == 3, "three tonics on the shelf")
	var b_ap: Variant = hero("Yuna")
	b_ap.a.job = "wolves"
	b_ap.a.purse = 30
	b_ap.a.tonic = false
	main.price_i = 1
	check(main.wants_tonic(b_ap), "a fair price before a risky job: Yuna wants a tonic")
	var c_ap: int = main.coins
	main.buy_tonic(b_ap)
	check(main.stock == 2 and b_ap.a.tonic and int(b_ap.a.purse) == 18 and main.coins == c_ap + 12, "she leaves twelve coins in the jar")
	b_ap.a.tonic = false
	main.price_i = 2
	check(not main.wants_tonic(b_ap), "too dear for a risky job: she goes without")
	b_ap.a.job = "slimes"
	main.price_i = 0
	check(not main.wants_tonic(b_ap), "nobody needs a tonic for an easy job")
	main.shelf_pick(1)
	check(main.price_i == 1, "the slate changes the price (Cheap, Fair, Dear)")
	var herbs0: int = main.herbs
	b_ap.a.lvl = 9
	for _try in 3:                                    # a 95% job: try again on the rare bad day
		if main.herbs > herbs0:
			break
		b_ap.a.hp = b_ap.a.max
		b_ap.a.job = "slimes"
		main._come_home(b_ap)
		main.queue.erase(b_ap)
	b_ap.a.state = "town"
	b_ap.a.lvl = 2
	check(main.herbs > herbs0, "jobs by the creek and the woods bring herbs home")
	# ---- members' stories: a word when they're ready, a choice that stays with them
	check(main.stories.has("Aki") and main.stories.has("Ren") and main.stories.has("Yuna"), "every first adventurer has a story")
	check(["Aki", "Ren", "Yuna", "Kaito", "Hana", "Sora"].all(func(n): return main.stories.get(n, []).size() == 3), "all six members have a three-part story (Kaito, Hana and Sora too, from ChatGPT's writing)")
	check(main.stories.values().all(func(arc): return not (arc is Array) or arc.all(func(b): return b.options.size() == 2 and b.options.all(func(o): return int(o.get("morale", 0)) == float(o.get("morale", 0))))), "every beat offers two replies")
	var sh: Variant = hero("Ren")
	sh.where = "town"
	sh.a.state = "town"
	sh.a.morale = 6
	sh.a.beat = 0
	sh.a.jobs_done = 0
	sh.a.traits = []
	check(not main.story_ready(sh), "no word yet before they've done a couple of jobs")
	sh.a.jobs_done = 2
	check(main.story_ready(sh), "after two jobs, Ren wants a word")
	sh.a.morale = 2
	check(not main.story_ready(sh), "not while their spirits are low")
	sh.a.morale = 6
	talk_through()
	main.talk_hero(sh)
	check(main.lines.any(func(l): return l.who == "Ren" and "froze" in l.text), "Ren tells you what happened out there")
	talk_through()
	check(not main.story_pick.is_empty() and main.story_pick.opts.size() == 2, "then you choose what to say")
	main.story_choose(0)
	check(main.story_pick.is_empty() and "steady" in sh.a.traits and int(sh.a.beat) == 1 and int(sh.a.morale) == 7, "your answer stays with him: steadier on every job")
	talk_through()
	sh.a.jobs_done = 5
	main.coins = 5
	main.talk_hero(sh)
	talk_through()
	main.story_choose(0)
	check(not main.story_pick.is_empty() and "20 coins" in main.story_note, "you can't give coins the guild doesn't have")
	main.coins = 100
	main.story_choose(0)
	check(main.coins == 80 and "mapper" in sh.a.traits, "twenty coins for ink and paper: Ren charts the roads")
	talk_through()
	var yh: Variant = hero("Yuna")
	yh.where = "town"
	yh.a.state = "town"
	yh.a.morale = 6
	yh.a.beat = 1
	yh.a.jobs_done = 9
	var keep_built: Dictionary = main.built.duplicate(true)
	main.built.erase("west")
	check(not main.story_ready(yh), "Yuna's lesson with Ama needs the Healer's Hut")
	main.built = keep_built
	check(main.story_ready(yh), "with the hut standing, she's ready to ask")
	# ---- failing and excelling, visible (SF2.2)
	main.good_days = 0
	main.bad_days = 0
	main.today = { "done": 0, "failed": 2, "meals": 0, "earned": 0, "unfed": 0 }
	main._judge_day()
	main.today = { "done": 0, "failed": 1, "meals": 0, "earned": 0, "unfed": 2 }
	var hard: String = main._judge_day()
	check(main.bad_days == 2 and "Fewer people" in hard, "two hard days in a row: the town notices")
	main._new_notices()
	check(main.notices.size() == 2, "and the board is quieter (two notices)")
	var low: Variant = hero("Aki")
	low.where = "town"
	low.a.state = "town"
	low.a.morale = 1
	main.today = { "done": 0, "failed": 0, "meals": 0, "earned": 0 }
	var left: String = main._judge_day()
	check(low.a.state == "quitting" and "Aki has packed up" in left, "someone at rock bottom packs up and walks to the gate")
	low.where = "gone"
	low.a.state = "gone"
	main.bad_days = 0
	for i in 3:
		main.today = { "done": 3, "failed": 0, "meals": 4, "earned": 30, "unfed": 0 }
		var said: String = main._judge_day()
		if i == 1:
			check("bunting" in said and "Aki has come back" in said and low.where == "town" and int(low.a.morale) == 6, "two good days: bunting, and Aki comes back")
	check(main.good_days == 3 and main.visitors == ["Mirelle"] and hero("Mirelle") != null and "bold" in hero("Mirelle").a.traits, "three good days: a rarer adventurer comes because of the town's name")
	main._new_notices()
	check(main.notices.size() == 4 and main._note_rect(3).end.x <= 352.0, "and the board fills up (four notices, all on the board)")
	var people_before: int = main.heroes.size()
	main.today = { "done": 3, "failed": 0, "meals": 4, "earned": 30, "unfed": 0 }
	main._judge_day()
	check(main.visitors.size() == 2 and main.heroes.size() == people_before + 1, "a fourth good day brings the second traveller, and only once")
	main.today = { "done": 0, "failed": 0, "meals": 0, "earned": 0 }
	# ---- the apothecary's apprentice (SF2.5): brew enough yourself, then Fen asks to learn
	var keep_built3: Dictionary = main.built.duplicate(true)
	var keep_herbs: int = main.herbs
	var keep_stock: int = main.stock
	main.built["south"] = { "what": "apothecary", "left": 0.0 }
	main.fen.where = "gone"
	main.batches = main.BREW_AFTER - 1
	main.herbs = 4
	main.stock = 0
	main.shelf_pick(0)
	main._brew(5.0)
	check(main.batches == main.BREW_AFTER and main.fen.where == "town", "the fourth batch by hand: Fen walks in, wanting to learn")
	main.fen.tile = main._pot_at() + Vector2i.RIGHT
	main.fen.pos = Vector2(main.fen.tile) * main.TILE
	main.fen.path.clear()
	main.talk_fen()
	talk_through()
	check(main.fen_hired, "and takes the long spoon for six coins a day")
	main.fen.tile = main._pot_at()
	main.fen.pos = Vector2(main.fen.tile) * main.TILE
	main.fen.path.clear()
	main.herbs = 2
	main.stock = 0
	for i in 50:
		main._fen_tick(0.1)
	check(main.stock == 3 and main.herbs == 0, "Fen brews whenever there are herbs and room on the shelf")
	main.fen_hired = false
	main.fen.where = "gone"
	main.built = keep_built3
	main.herbs = keep_herbs
	main.stock = keep_stock
	# ---- the tavern (SF2.3): evening drinks, a pour by hand, Tamsin, a place that shuts, placement
	var keep_built2: Dictionary = main.built.duplicate(true)
	main.built["south"] = { "what": "tavern", "left": 0.0 }
	check(main.plan_note("tavern", "west").begins_with(" Here, near the inn") and main.plan_note("tavern", "east").begins_with(" Here, away"), "Hob says what a spot means: near the inn or away from it")
	main.day_t = main.DAY_SECONDS * 0.7
	var drinker: Variant = hero("Aki")
	drinker.where = "town"
	drinker.a.state = "town"
	drinker.a.purse = 40
	drinker.a.drank = 0
	check(main.evening() and main.wants_drink(drinker), "in the evening, an adventurer with savings wants a drink")
	drinker.a.state = "to_tavern"
	drinker.tile = main._step_of("south")
	drinker.pos = Vector2(drinker.tile) * main.TILE
	drinker.path.clear()
	var tav_coins: int = main.coins
	drinker.a.morale = 5
	main._use_tavern()
	check(not main.pour.is_empty(), "at the tap with someone waiting, you start a pour")
	main.pour_press()
	main.pour.fill = 0.85
	main.pour_press()
	check(main.pour.is_empty() and main.coins == tav_coins + main.DRINK + 2 and int(drinker.a.morale) == 7 and int(drinker.a.purse) == 35, "a good pour: five coins from their savings, a tip, and better spirits")
	check(not main.wants_drink(drinker), "one drink an evening")
	main.pours = main.POUR_AFTER - 1
	drinker.a.drank = 0
	drinker.a.state = "to_tavern"
	main._use_tavern()
	main.pour_press()
	main.pour.fill = 0.5
	main.pour_press()
	check(main.tamsin.where == "town", "after enough pours by hand, Tamsin walks in and asks for the tap")
	main.talk_tamsin()
	talk_through()
	check(main.tamsin_hired, "and takes it on")
	main.today = { "done": 0, "failed": 0, "meals": 0, "earned": 0, "unserved": 1 }
	main.tamsin_hired = false
	main.tavern_quiet = 1
	var said2: String = main._tavern_evening()
	check(main.tavern_shut and "closed its shutters" in said2, "two evenings with nobody served: the tavern shuts")
	check(not main.wants_drink(drinker), "and nobody goes in")
	main._use_tavern()
	talk_through()
	check(not main.tavern_shut, "you open it again yourself")
	main.built = keep_built2
	main.tamsin.where = "gone"
	main.today = { "done": 0, "failed": 0, "meals": 0, "earned": 0 }
	main.day_t = 0.0
	# ---- saving the town and loading it back (a test file, never the real one)
	main.no_save = false
	main.save_path = "user://test_town.json"
	main.coins = 77
	var heroes_saved: int = main.heroes.size()
	var day_saved: int = main.day
	main.save_game()
	main.coins = 0
	main.heroes.clear()
	main.built = {}
	check(main._load() and main.coins == 77 and main.heroes.size() == heroes_saved and main.day == day_saved, "the town saves and loads back")
	check(main.finished("healer") == "west" and main.finished("yard") == "east" and main.ama.where == "town" and main.rank >= 1, "with its buildings, Ama, and its rank")
	check(main.finished("smithy") == "north" and main.smith_hired and main.garrick.where == "town" and main.stock == 2 and main.herbs > 0, "and its smithy, Garrick, the apothecary's shelf and herbs")
	check(main.good_days == 4 and main.visitors.size() == 2, "and how the town has been doing, and who has come")
	# a save from before SF2.6 (the old one-screen map): you may have stood where a wall or building is now
	var old_save: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(main.save_path))
	old_save.me = [10, 3]                         # under the Guild Hall's roof in the new town
	var f := FileAccess.open(main.save_path, FileAccess.WRITE)
	f.store_string(JSON.stringify(old_save))
	f.close()
	check(main._load() and main.walkable(main.me.tile, main.me) and not main.route(main.me.tile, main.INN_STEP, main.me).is_empty(), "an old save standing where the Guild Hall is now loads you onto open ground nearby (%s)" % main.me.tile)
	check(main.finished("healer") == "west" and main.finished("smithy") == "north", "and keeps every building on its plot")
	var stuck := []
	for y in range(1, 13):
		for x in range(1, 23):                        # every spot on the old 24 by 14 map
			var at: Vector2i = main.open_near(Vector2i(x, y))
			if not main.walkable(at, main.me) or (at != main.INN_STEP and main.route(at, main.INN_STEP, main.me).is_empty()):
				stuck.append(Vector2i(x, y))
	check(stuck.is_empty(), "wherever an old save stood, you land somewhere you can walk from (stuck: %s)" % str(stuck))
	main.save_game()
	# a save cut off half-way (a crash, a closed tab) never costs the town: the backup is read instead
	main.save_game()
	check(FileAccess.file_exists(main.save_path + ".bak") and not FileAccess.file_exists(main.save_path + ".tmp"), "the last good save is kept as a backup")
	var broken := FileAccess.open(main.save_path, FileAccess.WRITE)
	broken.store_string('{"v": 1, "coins": 7')
	broken.close()
	check(int(main.SafeSave.read(main.save_path).get("coins", 0)) == 77, "a broken save falls back to the backup")
	main.SafeSave.remove(main.save_path)
	check(not main.SafeSave.exists(main.save_path), "and a cleared save leaves nothing behind")
	main.no_save = true
	# ---- sound effects: every sound the town asks for has a file, and actions answer with one
	var src := FileAccess.get_file_as_string("res://scripts/main.gd")
	var missing: Array[String] = []
	var rx := RegEx.create_from_string("sfx\\.play\\(\"([a-z]+)\"")
	for m in rx.search_all(src):
		if not Sfx.has(m.get_string(1)):
			missing.append(m.get_string(1))
	check(missing.is_empty(), "every sound effect the town plays has a file (missing: %s)" % ", ".join(missing))
	var heard: int = main.sfx.count
	main.lines.clear()
	main.say("", "A test line.")
	main.say("", "And another.")
	main.advance()
	check(main.sfx.count == heard + 1 and main.sfx.last == "talk", "talking makes a soft blip")
	main.open_board()
	check(main.sfx.last == "open", "opening the board makes a sound")
	main.board_open = false
	main.sfx.on = false
	main.open_board()
	main.board_open = false
	check(main.sfx.on == false and main.sfx.last == "open", "sound effects can be turned off (N) without breaking anything")
	main.sfx.on = true
	main.lines.clear()
	# ---- feelings in bubbles over heads (assets/emote)
	var hf = main.heroes[0]
	main.barks.clear()
	main.feel(hf, "heart", 2.0)
	check(main.feeling(hf) == "heart", "a moment's feeling shows over someone's head")
	main.bark(hf, "Hello!")
	check(main.feeling(hf) == "", "but not while they're speaking, so the two never overlap")
	main.barks.clear()
	tick(2.5)
	main.feels.clear()
	var keep_state: String = hf.a.state
	var keep_wait: float = float(hf.a.get("waited", 0.0))
	hf.a.state = "to_counter"
	hf.a.waited = main.PATIENCE * 0.8
	check(main.feeling(hf) == "waiting" or main.story_ready(hf), "someone kept waiting at the counter shows it")
	hf.a.state = keep_state
	hf.a.waited = keep_wait
	var missing_feel: Array[String] = []
	for id in ["notice", "sad", "happy", "waiting", "heart", "heartbreak", "pleased"]:
		if not ResourceLoader.exists("res://assets/emote/%s.png" % id):
			missing_feel.append(id)
	check(missing_feel.is_empty(), "every feeling has its picture (missing: %s)" % ", ".join(missing_feel))
	_own_place()
	print("Starfall Godot checks: %d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)

## SF2.6, Starfall's own place: a frontier stockade drawn with the ART-SF pieces, a town that scrolls, and every
## building, door and service spot still reachable whatever stands on the plots.
func _own_place() -> void:
	var w: int = main.MAP[0].length() * main.TILE
	var h: int = main.MAP.size() * main.TILE
	var screen := Vector2(384, 216)
	check(w > screen.x and h > screen.y and main.cam.limit_right == w and main.cam.limit_bottom == h, "the town is bigger than the screen and the camera scrolls over all of it (%dx%d)" % [w, h])
	check(main.tile_at(main.GATE) == "E" and main.GATE.x == 1 and main.tile_at(main.GATE + Vector2i.UP) == "G" and main.tile_at(main.GATE + Vector2i.DOWN) == "G" and main.solid(main.GATE + Vector2i.UP), "the gate stands in the west wall: two posts with the way out between them")
	var walled := true
	for y in main.MAP.size():
		for x in main.MAP[0].length():
			var edge: bool = x <= 1 or y <= 1 or x >= main.MAP[0].length() - 3 or y >= main.MAP.size() - 2
			if edge and main.MAP[y][x] in ".,qk":
				walled = false
	check(walled, "a palisade (and stakes where it will grow) all the way round; the only way out is the gate")
	var src := FileAccess.get_file_as_string("res://scripts/main.gd")
	check(not "assets/env/house.png" in src and not "assets/env/nature.png" in src and not "assets/env/floor.png" in src and "assets/env/frontier/" in src, "the town is drawn from Starfall's own frontier pictures, not the borrowed cottage pack")
	check(main.F_BUILT.smithy.get_width() == 32 and main.F_BUILT.tavern.get_width() == 32 and main.BUILT_W.smithy == 2 and main.BUILT_W.tavern == 2, "the smithy and tavern pictures fit their two-tile plots, and block only that (ART-SF-7)")
	var keep_day: float = main.day_t
	main.day_t = main.DAY_SECONDS * 0.3
	var noon: float = main.dusk()
	main.day_t = main.DAY_SECONDS * 0.95
	var late: float = main.dusk()
	main.day_t = keep_day
	check(noon == 0.0 and late > 0.9 and main.DUSK_MAX <= 0.4, "evening brings a gentle tint over the town; midday has none")
	check(main.evening() == (main.day_t >= main.DAY_SECONDS * 0.55), "the tint changes only the picture: evening still starts when it did")
	var keep_east: Variant = main.built.get("east")
	main.built["east"] = { "what": "yard", "left": 0.0 }
	var yr: Rect2i = main.built_rect("east")
	check(yr.size == Vector2i(4, 3) and yr.position == main.PLOTS.east + Vector2i(0, -1) and main.solid(main.PLOTS.east + Vector2i(3, -1)), "the training yard blocks the ground its fence stands on, the row above its plot included")
	main.built.erase("east")
	if keep_east != null:
		main.built["east"] = keep_east
	check(main.F_GATE.get_size() == Vector2(32, 80), "the west gate has its own side-on picture (ART-SF-7)")
	for tex in [main.F_GROUND, main.F_PALISADE, main.F_HALL[0], main.F_INN[1], main.F_WELL, main.F_BOARD, main.F_BUILT.smithy]:
		check(tex != null and tex.get_width() > 0, "a frontier picture loads: %s" % tex.resource_path.get_file())
	var keep_built: Dictionary = main.built
	var keep_rank: int = main.rank
	var keep_me: Vector2i = main.me.tile
	var keep_where := {}
	for m in main.people():
		keep_where[m] = m.where
		if m != main.me:
			m.where = "gone"                          # an empty town: only walls and buildings can be in the way
	main.rank = 2
	var start := Vector2i(14, 10)
	var unreachable := []
	for what in main.BUILT_W:                         # every kind of building on every plot at once, the widest case
		main.built = {}
		for k in main.PLOTS:
			main.built[k] = { "what": what, "left": 0.0 }
		var spots := { "the inn's step": main.INN_STEP, "the counter": main.ORDER_AT, "behind the counter": main.SERVE_AT,
			"the board": main.READ_AT, "the Guild Hall's step": main.HALL_DOOR + Vector2i.DOWN, "the gate": main.GATE_IN }
		for k in main.PLOTS:
			for i in 3:                                   # the doorstep, the work spot beside it, and where a helper waits
				spots["%s %s +%d" % [k, what, i]] = main._step_of(k) + Vector2i(i, 0)
		for name in spots:
			var at: Vector2i = spots[name]
			if main.solid(at) or (at != start and main.route(start, at, main.me).is_empty()):
				unreachable.append(name)
	check(unreachable.is_empty(), "every building's door and work spot can be walked to, whatever stands on the plots (not: %s)" % str(unreachable))
	var doors := []
	for y in main.MAP.size():
		for x in main.MAP[0].length():
			var front := Vector2i(x, y) + (Vector2i.DOWN if main.MAP[y][x] == "D" else Vector2i.RIGHT)
			if main.MAP[y][x] in "DE" and (main.solid(front) or main.route(start, front, main.me).is_empty()):
				doors.append(Vector2i(x, y))
	check(doors.is_empty(), "every door and the gate have open, reachable ground in front (blocked: %s)" % str(doors))
	main.built = {}
	for k in main.PLOTS:                              # and nothing standing on a plot blocks the road through town
		main.built[k] = { "what": "smithy", "left": 0.0 }
	check(not main.route(main.GATE_IN, Vector2i(40, 10), main.me).is_empty(), "the road runs east from the gate to the far end of town")
	main.built = keep_built
	main.rank = keep_rank
	main.me.tile = keep_me
	for m in keep_where:
		m.where = keep_where[m]
