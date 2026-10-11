extends RefCounted
## #149: an accepted tap must finish without replanning around roof collision.
static func run(host: Node, check: Callable) -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	host.get_tree().root.add_child(game)
	game.set_process(false)
	game.battle.set_process(false)
	game.stage = "free"
	game.partner = null
	game.painted = true
	game.title.visible = false
	game.howto.visible = false
	game.register.visible = false
	game.trans_t = -1.0
	for panel in [game.lessons, game.card, game.battle, game.shop, game.book]:
		panel.visible = false
	for shot in [
		["larkhaven", Vector2i(11, 5), Vector2i(21, 1)],
		["larkhaven", Vector2i(21, 1), Vector2i(11, 5)],
		["sunthread", Vector2i(27, 3), Vector2i(28, 2)],
		["sunthread", Vector2i(28, 2), Vector2i(27, 3)],
	]:
		game._set_map(shot[0])
		game.lines.clear()
		game.grass_n = 1000
		for actor in game.actors():
			actor.where = "roof-test-hidden"
		game.me.where = shot[0]
		game.me.tile = shot[1]
		game.me.pos = Vector2(game.me.tile) * game.TILE
		game.me.path.clear()
		game.walk_to.clear()
		var goal: Vector2i = shot[2]
		var label: String = "#149 %s %s to %s" % [shot[0], shot[1], goal]
		check.call(game.walkable(goal), label + ": legal destination")
		game._tap(Vector2(goal) * game.TILE + Vector2(8, 8))
		check.call(not game.walk_to.is_empty(), label + ": tap queues a route")
		var hits_roof := false
		for step in game.walk_to:
			hits_roof = hits_roof or game._under_roof(step)
		check.call(not hits_roof, label + ": queued route stays outside roofs")
		# No retries: a stuck route must fail rather than being rescued by the test.
		for i in 400:
			game._process(0.05)
			if game.me.tile == goal and game.me.path.is_empty():
				break
		check.call(game.me.tile == goal and game.me.path.is_empty(), label + ": one tap reaches the destination (at %s, lines %d)" % [game.me.tile, game.lines.size()])
	game._set_map("larkhaven")
	for actor in game.actors():
		actor.where = "roof-test-hidden"
	for door in game.DOORS:
		var path: Array = game.route(door + Vector2i.DOWN, door)
		check.call(path == [door], "#149: intentional door destination %s remains routable" % door)
	check.call(game.route(game.BARN_DOOR + Vector2i.DOWN, game.BARN_DOOR) == [game.BARN_DOOR], "#149: barn door remains routable")
	game.maren.where = "larkhaven"
	game.maren.tile = Vector2i(20, 5)
	game.maren.path.clear()
	var around: Array = game.route(Vector2i(21, 5), Vector2i(19, 5))
	check.call(not around.is_empty() and not around.has(game.maren.tile), "#149: route still avoids a stationary NPC on the way")
	var approach: Array = game.route(Vector2i(21, 5), game.maren.tile)
	check.call(not approach.is_empty() and approach.back() == game.maren.tile, "#149: intentional NPC destination remains routable")
	game.free()
