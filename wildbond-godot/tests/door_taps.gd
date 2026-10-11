extends RefCounted
## WB-DOOR-TAP: accepted input must enter, leave and re-enter all five buildings.
## Separate scene and no_save keep these checks away from the caller's journey.
static func run(host: Node, check: Callable) -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	host.get_tree().root.add_child(game)
	game.set_process(false)
	game.battle.set_process(false)
	game._skip_opening()
	for panel in [game.title, game.register, game.howto, game.lessons, game.card, game.battle, game.shop, game.book]:
		panel.visible = false
	var doors: Dictionary = game.DOORS.duplicate()
	doors[game.BARN_DOOR] = "barn"
	for door in doors:
		var destination: String = doors[door]
		for distance in [1, 3]:
			place(game, "larkhaven", door + Vector2i.DOWN * distance)
			var label := "WB-DOOR-TAP %s from %d tiles" % [destination, distance]
			var route_before: Array = game.route(game.me.tile, door)
			check.call(not route_before.is_empty(), label + ": approach is routable")
			game._tap(Vector2(door) * game.TILE + Vector2(8, 8))
			check.call(game.walk_to == route_before, label + ": one tap queues the actual walking route")
			check.call(game.map_name == "larkhaven" and game.trans_t < 0.0, label + ": no remote teleport at input")
			settle(game, destination)
			check.call(game.map_name == destination and game.trans_t < 0.0, label + ": enters without retry")
			check.call(game.partner.where == destination and game.partner.tile != game.me.tile, label + ": partner follows with space")
			var exit_tile: Vector2i = game.BARN_EXIT if destination == "barn" else game.INTERIORS[destination].exit
			game._tap(Vector2(exit_tile) * game.TILE + Vector2(8, 8))
			settle(game, "larkhaven")
			check.call(game.map_name == "larkhaven" and game.me.tile == door + Vector2i.DOWN, label + ": tap exit returns to the matching doorstep")
			check.call(game.partner.where == "larkhaven" and game.partner.tile != game.me.tile, label + ": partner returns beside the player")
			game._tap(Vector2(door) * game.TILE + Vector2(8, 8))
			settle(game, destination)
			check.call(game.map_name == destination, label + ": immediate re-entry works with partner")
		# Use the real action reader in _process, not _step, to preserve keyboard entry.
		place(game, "larkhaven", door + Vector2i.DOWN)
		Input.action_press("move_up")
		game._process(1.0 / 60.0)
		Input.action_release("move_up")
		settle(game, destination)
		check.call(game.map_name == destination, "WB-DOOR-TAP %s: keyboard still enters" % destination)
		Input.action_press("move_down")
		game._process(1.0 / 60.0)
		Input.action_release("move_down")
		settle(game, "larkhaven")
		check.call(game.map_name == "larkhaven", "WB-DOOR-TAP %s: keyboard still exits past partner" % destination)
	# Registered doors must not become generally walkable terrain or open in the intro.
	for door in game.DOORS:
		place(game, "larkhaven", door + Vector2i.DOWN)
		check.call(not game.walkable(door), "WB-DOOR-TAP: %s retains door collision" % door)
		for stage in ["intro", "to_barn", "barn_choose", "walk_out"]:
			game.stage = stage
			game._tap(Vector2(door) * game.TILE + Vector2(8, 8))
			check.call(game.walk_to.is_empty() and game.trans_t < 0.0, "WB-DOOR-TAP: %s stays closed during %s" % [door, stage])
	# Same coordinate elsewhere is not a registered entrance: keep original goal rules.
	for map_id in ["barn", "thornwood", "sunthread"]:
		for door in game.DOORS:
			place(game, map_id, Vector2i(11, 10))
			var expected: bool = not game.route(game.me.tile, door).is_empty() and game.walkable(door)
			game._tap(Vector2(door) * game.TILE + Vector2(8, 8))
			check.call(not game.walk_to.is_empty() == expected, "WB-DOOR-TAP: %s on %s keeps existing target rules" % [door, map_id])
	for panel in [game.lessons, game.card, game.battle, game.shop, game.book]:
		place(game, "larkhaven", Vector2i(4, 5))
		panel.visible = true
		game._tap(Vector2(4, 4) * game.TILE + Vector2(8, 8))
		check.call(game.walk_to.is_empty(), "WB-DOOR-TAP: open %s blocks door input" % panel.name)
		panel.visible = false
	place(game, "larkhaven", Vector2i(4, 5))
	game.trans_t = 0.1
	game._tap(Vector2(4, 4) * game.TILE + Vector2(8, 8))
	check.call(game.walk_to.is_empty(), "WB-DOOR-TAP: a transition blocks repeated door input")
	game.free()

static func place(game: Node, map_id: String, at: Vector2i) -> void:
	game._set_map(map_id)
	game.stage = "free"
	game.lines.clear()
	game.trans_t = -1.0
	game.me.where = map_id
	game.me.tile = at
	game.me.pos = Vector2(at) * game.TILE
	game.me.path.clear()
	game.walk_to.clear()
	game.meet_after = null
	game.partner.where = map_id
	game.partner.tile = at + Vector2i.DOWN
	game.partner.pos = Vector2(game.partner.tile) * game.TILE
	game.partner.path.clear()
	game._stop(game.partner)
	game.cam.position = game.me.pos + Vector2(8, 8)
	game.cam.reset_smoothing()

static func settle(game: Node, target: String) -> void:
	# A single input has a bounded time to complete. Never re-plan or repair its route.
	for frame in 600:
		game._process(1.0 / 60.0)
		if game.map_name == target and game.trans_t < 0.0 and game.me.path.is_empty():
			break
