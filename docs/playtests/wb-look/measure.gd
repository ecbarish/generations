extends SceneTree
# Read-only baseline instrument. Starts at an isolated patch of real route grass.
# Calls the game's step/walk/explore handlers; timing is simulated movement only.
var game: Node
var shots: Array = []
var failures: Array = []
func _initialize() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	root.add_child(game)
	run.call_deferred()
func reset(seed_value: int, heritage: String, starter: String) -> void:
	game.set_process(false)
	game.sfx.on = false
	game.music_on = false
	game.battle.set_process(false)
	game.get_tree().paused = false
	game.my_look = game.LOOKS.tamer.duplicate(true)
	game.my_look.name = "Rowan"
	game.my_look.heritage = heritage
	game._set_map("thornwood_route")
	game.stage = "free"
	game.painted = true
	game.spilled = true
	game.rng.seed = seed_value
	game.team = [game.R.make(starter, 5, { "rar": 1 }, game.rng)]
	game.badges = []
	game.story_done = {}
	game.story_retry = {}
	game.wren.where = "gone"
	game.wren.path.clear()
	game.spotter = null
	game.explored_in = {}
	game.lines.clear()
	game.then_do = Callable()
	game.letter_steps = 100000
	game.grass_n = 10
	game.me.where = "thornwood_route"
	game.me.tile = Vector2i(17, 12)
	game.me.face = Vector2i.DOWN
	game.me.pos = Vector2(game.me.tile) * game.TILE
	game.me.path.clear()
	# Isolate movement timing from the un-ticked follower; render it below.
	game.partner = null
	for creature_actor in game.starters:
		creature_actor.where = "gone"
		creature_actor.path.clear()
	game.walk_to.clear()
	game.bag = { "berries": 0, "coins": 120, "lures": 5 }
	game.trans_t = -1.0
	for page in [game.battle, game.card, game.title, game.howto, game.menu, game.register, game.book, game.shop, game.lessons, game.turn_card]:
		page.visible = false
	game.battle.state = "off"
	game.cam.position = game.me.pos + Vector2(8, 8)
	game.cam.reset_smoothing()
	game.cam.force_update_scroll()
	game.place_t = 4.0
	game.fade_in = 1.0
	game.fade_rect.color.a = 0.0
	game.rng.seed = seed_value
func run() -> void:
	var rows: Array = []
	for heritage in ["farm", "wander"]:
		for starter in ["cindercub", "ripplet", "mosshog"]:
			for seed_value in range(1, 101):
				reset(seed_value, heritage, starter)
				var steps := 0
				var frames := 0
				var grass_steps := 0
				var direction := 1
				var first_find_steps := 0
				var first_find_seconds := 0.0
				while not game.battle.visible and steps < 400:
					if game.me.tile.x >= 19: direction = -1
					if game.me.tile.x <= 17: direction = 1
					game._step(Vector2i(direction, 0))
					var tick := 0
					while not game.me.path.is_empty() and tick < 120:
						game._walk(game.me, 1.0 / 60.0)
						frames += 1
						tick += 1
					steps += 1
					if game.tile_at(game.me.tile) == "\"": grass_steps += 1
					if int(game.explored_in.get("thornwood", 0)) > 0 and first_find_steps == 0:
						first_find_steps = steps
						first_find_seconds = frames / 60.0
					game.lines.clear()
					if game.then_do.is_valid():
						var action: Callable = game.then_do
						game.then_do = Callable()
						action.call()
				rows.append({ "heritage": heritage, "starter": starter, "seed": seed_value, "grass_steps": grass_steps, "world_steps": steps, "movement_seconds": frames / 60.0, "first_find_world_steps": first_find_steps, "first_find_movement_seconds": first_find_seconds, "battle_opened": game.battle.visible })
	var finds := { "battle": 0, "loot": 0, "flavour": 0, "healing": 0, "berry_gain": 0 }
	for seed_value in range(1, 1001):
		reset(seed_value, "farm", "ripplet")
		game.team[0].hp = 1
		game._explore()
		if game.battle.visible: finds.battle += 1
		elif game.bag.coins != 120 or game.bag.lures != 5: finds.loot += 1
		else: finds.flavour += 1
		if game.team[0].hp > 1: finds.healing += 1
		if game.bag.berries > 0: finds.berry_gain += 1
	var cadence: Array = story_cadence()
	if OS.get_environment("PACE_RENDER") == "1":
		await capture_views()
	var out := OS.get_environment("PACE_OUTPUT")
	var file := FileAccess.open(out, FileAccess.WRITE)
	file.store_string(JSON.stringify({ "engine": Engine.get_version_info().string, "source_sha": OS.get_environment("SOURCE_SHA"), "method": "Game step/walk handlers at 60 Hz, isolated Thornwood Trail patch. Movement time only; no opening, navigation, reading, battle duration, rendering or human fun acceptance.", "rows": rows, "finds_1000_seeds": finds, "story_cadence": cadence, "screenshots": shots, "failures": failures }, "\t"))
	file.close()
	print("PACING: ", rows.size(), " first-encounter walks; outcomes ", JSON.stringify(finds))
	game.free()
	game = null
	await process_frame
	quit(0 if failures.is_empty() else 1)

func story_cadence() -> Array:
	var out: Array = []
	for heritage in ["farm", "wander"]:
		for seed_value in range(1, 101):
			reset(seed_value, heritage, "ripplet")
			var steps := 0
			var frames := 0
			var grass := 0
			var battles := 0
			var direction := 1
			while not game.story_done.has("elder") and steps < 2000:
				if game.me.tile.x >= 19: direction = -1
				if game.me.tile.x <= 17: direction = 1
				game._step(Vector2i(direction, 0))
				var tick := 0
				while not game.me.path.is_empty() and tick < 120:
					game._walk(game.me, 1.0 / 60.0)
					frames += 1
					tick += 1
				steps += 1
				if game.tile_at(game.me.tile) == "\"": grass += 1
				game.lines.clear()
				if game.then_do.is_valid():
					var action: Callable = game.then_do
					game.then_do = Callable()
					action.call()
					var id: String = game.battle_story.trim_prefix("story:")
					if id in ["rival2", "elder"]:
						out.append({ "heritage": heritage, "seed": seed_value, "story": id, "explorations": game.explored_in.get("thornwood", 0), "grass_steps": grass, "movement_seconds": frames / 60.0, "prior_battles": battles })
						# Model a successful completion; no battle or reading time is claimed.
						game.story_done[id] = true
						game.wren.where = "gone"
				if game.battle.visible:
					battles += 1
					game.battle.visible = false
					game.battle.state = "off"
	return out

func capture_views() -> void:
	if DisplayServer.get_name() == "headless":
		failures.append("Rendered views requested with a headless display")
		return
	var quiet_seed := 0
	for candidate in range(1, 1000):
		var rng := RandomNumberGenerator.new()
		rng.seed = candidate
		if rng.randf() >= 0.76:
			quiet_seed = candidate
			break
	for dims in [Vector2i(1536, 864), Vector2i(390, 844)]:
		root.size = dims
		DisplayServer.window_set_size(dims)
		reset(quiet_seed, "farm", "ripplet")
		game.team[0].hp = 1
		var before: int = game.team[0].hp
		game._explore()
		await capture("quiet-%dx%d" % [dims.x, dims.y], { "hp_before": before, "hp_after": game.team[0].hp, "max_hp": game.R.stats(game.team[0]).hp, "text": str(game.lines), "seed": quiet_seed })
		reset(1, "farm", "ripplet")
		game._wild_battle()
		game.battle._go_to("choose")
		game.battle.wait_u = game.battle.allies[0]
		await capture("encounter-%dx%d" % [dims.x, dims.y], { "battle": game.battle.visible, "foe": game.battle.foes[0].c.name })

func capture(name: String, info: Dictionary) -> void:
	game.partner = game.starters.filter(func(m): return m.id == game.team[0].sp)[0]
	game.partner.where = game.map_name
	game.partner.tile = game.me.tile + Vector2i.LEFT
	game.partner.face = Vector2i.DOWN
	game.partner.pos = Vector2(game.partner.tile) * game.TILE
	game.partner.path.clear()
	for _i in 6:
		game._thumbs_tick()
		game._update_ui()
		game.queue_redraw()
		game.colour_layer.queue_redraw()
		game.canopy.queue_redraw()
		game.battle.queue_redraw()
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	var dir := OS.get_environment("PACE_OUTPUT").get_base_dir()
	var path := dir.path_join(name + ".png")
	var result := img.save_png(path)
	if result != OK or img.get_width() < 300 or img.get_height() < 200:
		failures.append("Capture failed: " + path)
	info["file"] = name + ".png"
	info["width"] = img.get_width()
	info["height"] = img.get_height()
	info["display"] = DisplayServer.get_name()
	shots.append(info)
