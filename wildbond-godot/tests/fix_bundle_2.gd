extends RefCounted
## The second playtest bundle. Each check is the thing a player reported: a click lands once, a held
## walk keeps up with a tap, Choose is ready, a placeholder stays on screen, one press reads one
## battle line, closing a talk does not open it again, the menu appears at once, the barn's words
## do not cover each other, and the catch marker moves at a pace you can aim.

static func run(host: Node, check: Callable) -> void:
	var keep_mode: int = host.process_mode
	host.process_mode = Node.PROCESS_MODE_DISABLED
	var emulate: bool = Input.emulate_mouse_from_touch
	Input.emulate_mouse_from_touch = true
	var game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	host.get_tree().root.add_child(game)
	game.set_process(false)
	game.battle.set_process(false)
	game.get_tree().paused = false
	_clicks(game, check)
	_walk(game, check)
	_starter(game, check)
	_heights(game, check)
	_sprites(game, check)
	_battle_lines(game, check)
	_talk(game, check)
	_menu(game, check)
	_layout(game, check)
	_catch(game, check)
	game.free()
	Input.emulate_mouse_from_touch = emulate
	host.process_mode = keep_mode

static func _clicks(game: Node, check: Callable) -> void:
	var view := game.get_viewport().get_visible_rect().size
	var title_at: Vector2 = game.title._btn(2).get_center()
	var brought: Vector2 = Controls.into_view(title_at * 4.0, view, Vector2(1536, 864), Transform2D.IDENTITY)
	check.call(brought.distance_to(title_at) < 1.0, "a 4× window click on a title button lands on that button")
	var boxed := Vector2(192.0 * 3.0 + 107.0, 115.0 * 3.0 + 60.0)
	var lettered: Vector2 = Controls.into_view(boxed, view, Vector2(1366, 768), Transform2D.IDENTITY)
	check.call(lettered.distance_to(Vector2(192, 115)) < 1.0, "a click in a letterboxed window lands on the same pixel")
	check.call(Controls.into_view(title_at, view, Vector2(1536, 864), Transform2D.IDENTITY).distance_to(title_at) < 1.0, "a click already inside the view is not scaled twice")
	var picks := [0]
	game.title.chosen.connect(func(_choice: String) -> void: picks[0] += 1)
	game.title.open("Rowan and Ripplet, in Thornwood.")
	click(game, title_at)
	check.call(picks[0] == 1 and not game.title.visible, "a mouse click on a title button activates it once")
	click(game, title_at)
	check.call(picks[0] == 1, "a second click on a closed title page does not activate it again")
	game.howto.visible = false
	game.title.visible = false
	game.register.keep = false
	var signed := [0]
	game.register.signed.connect(func(_look: Dictionary) -> void: signed[0] += 1)
	game.register.open()
	var sign_at := Vector2(277, 173)
	release(game, sign_at)
	check.call(game.register.visible and signed[0] == 0, "Sign the register ignores a lift that had no press")
	click(game, sign_at)
	check.call(signed[0] == 1 and not game.register.visible, "a mouse click on Sign the register signs once")
	game.lines.clear()
	game.card.open("ripplet", game.card_info("ripplet"))
	var chose := [0]
	game.card.chosen.connect(func(_id: String) -> void: chose[0] += 1)
	release(game, game.card._btn(0).get_center())
	check.call(game.card.visible and chose[0] == 0, "Choose ignores a lift that had no press")
	click(game, game.card._btn(0).get_center())
	check.call(chose[0] == 1 and not game.card.visible and game.partner != null and game.partner.id == "ripplet", "a mouse click on Choose picks that starter once")
	_battle_buttons(game, check)

static func _battle_buttons(game: Node, check: Callable) -> void:
	_shut(game)
	var ally: Dictionary = game.R.make("cindercub", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.bag = { "lures": 3, "berries": 0 }
	Input.emulate_mouse_from_touch = false
	tap(game, game.battle._menu_rect(0).get_center())
	check.call(game.battle.state == "moves", "a finger on Fight opens the moves once and does not also use one")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	Input.emulate_mouse_from_touch = true
	click(game, game.battle._menu_rect(3).get_center())
	check.call(game.battle.state == "capture" and int(game.battle.bag.lures) == 2, "a mouse click on Catch throws one lure")
	game.battle.visible = false
	game.battle.state = "off"
	game.lines.clear()

static func _walk(game: Node, check: Callable) -> void:
	_shut(game)
	game._skip_opening()
	for _i in 8:
		game._process(0.05)
	game.lines.clear()
	game.stage = "free"
	game.trans_t = -1.0
	game.title.visible = false
	game.card.visible = false
	game.battle.visible = false
	game.walk_to.clear()
	game.me.path.clear()
	game.grass_n = 100
	game.letter_steps = 100
	var way := _straight(game)
	check.call(way != Vector2i.ZERO, "the walk check has a clear stretch of road")
	if way == Vector2i.ZERO:
		return
	_release_dirs(game)
	var origin: Vector2 = game.me.pos
	_hold(game, way, true)
	var stalls := 0
	var prev: Vector2 = origin
	for i in 60:
		game._process(1.0 / 60.0)
		var step: float = Vector2(game.me.pos).distance_to(prev)
		if i > 2 and step < 0.25:
			stalls += 1
		prev = game.me.pos
	var held: float = origin.distance_to(game.me.pos)
	var at_release: Vector2 = game.me.pos
	_hold(game, way, false)
	for _i in 45:
		game._process(1.0 / 60.0)
	var coast: float = at_release.distance_to(game.me.pos)
	# Back to the same tile, then the same second of taps.
	var back: Vector2i = Vector2i(round(origin.x / 16.0), round(origin.y / 16.0))
	game.me.tile = back
	game.me.pos = Vector2(back) * 16.0
	game.me.path.clear()
	game.walk_to.clear()
	game.lines.clear()
	var tap_from: Vector2 = game.me.pos
	for i in 60:
		if i % 15 == 0:
			_hold(game, way, true)
			_hold(game, way, false)
		game._process(1.0 / 60.0)
	var tapped: float = tap_from.distance_to(game.me.pos)
	check.call(held + 1.0 >= tapped and held >= 3.2 * 16.0, "holding a direction walks at least as far as tapping it (held %.1f px, tap %.1f px)" % [held, tapped])
	check.call(stalls < 6, "a held walk keeps moving instead of stopping on each tile (%d still frames)" % stalls)
	check.call(coast <= 16.5, "letting go stops within one tile (%.1f px)" % coast)
	_release_dirs(game)

static func _starter(game: Node, check: Callable) -> void:
	game.card.open("ripplet", game.card_info("ripplet"))
	check.call(game.card.visible and game.card.sel == 0 and game.card._label(0).begins_with("Choose"), "the starter card opens on Choose")
	game.card.open("bench", { "name": "Bench" }, ["Have it made", "Next"])
	check.call(game.card.sel == 1 and game.card._label(1) == "Next", "a custom row still opens on its waiting choice")
	game.card.visible = false

static func _heights(game: Node, check: Callable) -> void:
	check.call(game.Figures.drawn_px(2.0) == 24, "a 2.0 m creature walks at 24px, on the door line")
	check.call(game.Figures.drawn_px(2.66) == 28, "a 2.66 m creature walks at 28px")
	check.call(game.Figures.drawn_px(0.24) == 12, "a creature under 12px is raised to the floor")
	check.call(game.Figures.drawn_px(1.5) == 19, "1.5 m stays at round(metres × 12.35), which is 19px")
	var sun_m := float(game.DATA.SPECIES.sunford.metres)
	var sun_raw := int(round(sun_m * 12.35))
	var sun_curved := int(round(24.0 + 8.0 * log(float(sun_raw) / 24.0) / log(2.0)))
	check.call(sun_raw > 24 and game.Figures.drawn_px(sun_m) == mini(32, sun_curved) and game.Figures.drawn_px(sun_m) < sun_raw, "a catalogue height above the door line uses the walking curve")
	var pup_m := float(game.DATA.SPECIES.smoulderpup.metres)
	var pup_raw := int(round(pup_m * 12.35))
	check.call(pup_raw <= 24 and pup_raw >= 12 and game.Figures.drawn_px(pup_m) == pup_raw, "a catalogue height on or under the door line keeps round(metres × 12.35)")

static func _sprites(game: Node, check: Callable) -> void:
	check.call(game.battle._stage_px(1) == 44 and game.battle._stage_px(2) == 54 and game.battle._stage_px(3) == 64, "a battle figure's stage height is 44, 54 or 64")
	check.call(game.battle.FIGURE_WIDTH_CAP == 62 and is_equal_approx(game.battle.FIGURE_LIMIT.end.y, 160.0), "a battle figure is at most 62 px wide and stands on the ground line at y160")
	check.call(game.battle._figure_scale(Vector2i(26, 10), 1) == 2, "a 26×10 stage-1 figure is drawn at 2×, which is 52×20")
	check.call(game.battle._figure_scale(Vector2i(15, 12), 1) == 3, "a 15×12 stage-1 figure is drawn at 3×, which is 45×36")
	check.call(game.battle._battle_stage("bogsnap") == 1 and game.battle._battle_stage("glimmerwing") == 1 and game.battle._battle_stage("blazefang") == 3, "Bogsnap and Glimmerwing are stage 1, and a final form is stage 3")
	var pose := { "ears_up": true }
	var bare: Array = []
	for id in game.DATA.SPECIES:
		var sid := str(id)
		if not game.Sprites.has(sid) and not game.Sprites.has_battle_front(sid):
			bare.append(sid)
	check.call(not bare.is_empty(), "a species with no sheet still uses the procedural battle figure")
	game.battle.allies = [{}]
	game.battle.foes = [{}]
	var limit: Rect2 = game.battle.FIGURE_LIMIT
	for id in bare:
		var species: Dictionary = game.DATA.SPECIES[id]
		var stage: int = int(game.battle._battle_stage(str(id)))
		var stage_h: int = int(game.battle._stage_px(stage))
		var parts: Array = game.Figures.sized_parts(species, true, pose)
		var span: Vector2i = game.Figures.pixel_span(parts)
		var k: int = int(game.battle._figure_scale(span, stage))
		var expect: int = maxi(1, mini(int(floor(float(stage_h) / float(span.y))), int(floor(float(game.battle.FIGURE_WIDTH_CAP) / float(span.x)))))
		check.call(k == expect and k >= 1, "%s scales by a whole number from its stage height and the 62px cap (k %d, span %s)" % [id, k, span])
		check.call(span.y * k <= stage_h or k == 1, "%s stays within its stage height of %d" % [id, stage_h])
		check.call(span.x * k <= int(game.battle.FIGURE_WIDTH_CAP) or k == 1, "%s stays within the 62px width cap" % id)
		for spot in [Vector2(100, 158), Vector2(286, 92), Vector2(168, 142)]:
			var place: Dictionary = game.battle._figure_place(spot, str(id), parts)
			var rect: Rect2 = place.rect
			var clear := true
			for box in game.battle._clearance_boxes():
				if rect.intersects((box as Rect2).grow(float(game.battle.PANEL_CLEARANCE))):
					clear = false
			check.call(int(place.scale) == k and limit.encloses(rect) and rect.end.y <= 160.01 and clear, "%s at %s stays on screen, at %d×, and clear of the panels" % [id, spot, k])
	var sample := str(bare[0])
	var sample_parts: Array = game.Figures.sized_parts(game.DATA.SPECIES[sample], true, pose)
	var sample_k: int = int(game.battle._figure_scale(game.Figures.pixel_span(sample_parts), game.battle._battle_stage(sample)))
	game.battle.phone_view = Rect2(0, 0, 140, 216)
	var phone_place: Dictionary = game.battle._figure_place(Vector2(100, 158), sample, sample_parts)
	var phone_rect: Rect2 = phone_place.rect
	check.call(int(phone_place.scale) == sample_k and game.battle.phone_view.encloses(phone_rect) and limit.encloses(phone_rect), "the upright frame keeps the same whole scale and holds the figure inside the view")
	game.battle.phone_view = Rect2()
	game.battle.allies = []
	game.battle.foes = []

static func _shut(game: Node) -> void:
	for page in [game.title, game.howto, game.register, game.card, game.book, game.shop, game.lessons, game.turn_card]:
		if page:
			page.visible = false
	if game.menu and game.menu.visible:
		game.menu.close()
	game.lines.clear()

static func _battle_lines(game: Node, check: Callable) -> void:
	_shut(game)
	var ally: Dictionary = game.R.make("cindercub", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 30, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("moves")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.line_queue.clear()
	var move: String = game.R.moves_of(game.battle.wait_u.c)[0]
	game.battle._use_move(move)
	var first: String = game.battle.shown_line
	var waiting: int = game.battle.line_queue.size()
	check.call(game.battle.state == "beat" and "used" in first.to_lower(), "the first battle line is the move that was used")
	key(game, KEY_ENTER)
	check.call(game.battle.shown_line == first and game.battle.line_queue.size() == waiting, "the press that brought the line up does not skip it")
	game.battle.line_frame = Engine.get_process_frames() - 2
	key(game, KEY_ENTER)
	if waiting > 0:
		check.call(game.battle.shown_line != first and game.battle.line_queue.size() == waiting - 1, "the next press reads exactly one more battle line")
	else:
		check.call(game.battle.state_t >= game.battle.beat_t - 0.001, "the next press leaves the last battle line")
	game.battle.visible = false
	game.battle.state = "off"

static func _talk(game: Node, check: Callable) -> void:
	_shut(game)
	game.lines.clear()
	game.then_do = Callable()
	game.stage = "free"
	game.battle.visible = false
	game.card.visible = false
	game.title.visible = false
	game._set_map("larkhaven")
	game.maren.where = "larkhaven"
	game.maren.tile = game.me.tile + Vector2i.RIGHT
	game.maren.pos = Vector2(game.maren.tile) * game.TILE
	game.say("maren", "Mind how you go.")
	key(game, KEY_ENTER)
	check.call(game.lines.is_empty(), "Enter closes Maren's line")
	key(game, KEY_ENTER)
	check.call(game.lines.is_empty(), "the Enter that closed the talk does not start it again")

static func _menu(game: Node, check: Callable) -> void:
	_shut(game)
	game.lines.clear()
	game.stage = "free"
	game.trans_t = -1.0
	game.title.visible = false
	game.card.visible = false
	game.battle.visible = false
	game.book.visible = false
	if game.menu.visible:
		game.menu.close()
	check.call(not Input.use_accumulated_input, "key presses are not saved up to replay a moment later")
	key(game, KEY_I)
	check.call(game.menu.visible, "the menu opens on the same press, with no wait for the next step")
	game.menu.close()

static func _layout(game: Node, check: Callable) -> void:
	_shut(game)
	game.lines.clear()
	game.stage = "barn_choose"
	game.title.visible = false
	game.card.visible = false
	game.battle.visible = false
	game.book.visible = false
	game._set_map("barn")
	var sign := Vector2(7, 2) * float(game.TILE) + Vector2(9, 4)
	game.maren.where = "barn"
	game.maren.pos = sign + Vector2(8, 24)
	game.me.pos = game.maren.pos
	game.get_viewport().canvas_transform = Transform2D(Vector2(1, 0), Vector2(0, 1), Vector2(0, 20.0 - sign.y))
	game.say("maren", "The stalls have names on them. Read those before you choose, and don't let this line hide under the banner.")
	game._update_ui()
	var bubble := Rect2(game.bubble.position, game.bubble.size)
	var status := Rect2(game.status.position, game.status.size)
	var banner := Rect2(game.objective.position, game.objective.size)
	check.call(game.bubble.visible and game.objective.visible and not bubble.intersects(status), "the speech box sits clear of the status bar")
	check.call(not bubble.intersects(banner), "the speech box sits clear of the objective")
	check.call(bubble.position.y >= game._speech_floor() - 0.5, "the speech box starts below the bar and the banner")
	var covered := false
	for s in game._stall_sign_rects():
		if banner.intersects(s):
			covered = true
	check.call(not covered, "the objective does not cover the stall names")
	game.lines.clear()
	game.get_viewport().canvas_transform = Transform2D.IDENTITY

static func _catch(game: Node, check: Callable) -> void:
	var ally: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.rng.seed = 2
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.bag = { "lures": 4, "berries": 0 }
	game.battle.sure_catch = false
	game.battle._choose(3)
	check.call(game.battle.state == "capture", "Catch opens the timing bar")
	var start: float = float(game.battle.cap.pos)
	for _i in 30:
		game.battle._process(1.0 / 60.0)
	var moved: float = float(game.battle.cap.pos) - start
	check.call(moved > 0.55 and moved < 0.85, "the catch marker crosses the bar at a pace you can aim (%.2f in half a second)" % moved)
	game.battle.cap.pos = float(game.battle.cap.zone)
	game.battle._calm()
	check.call(game.battle.catch_note == "hit" and game.battle.catch_note_t > 1.0, "pressing in the green says you hit")
	var foe2: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe2], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.bag = { "lures": 3, "berries": 0 }
	game.battle.sure_catch = false
	game.battle._choose(3)
	game.battle.cap.pos = 0.0
	game.battle.cap.zone = 0.9
	game.battle.cap.wide = 0.2
	game.battle._calm()
	check.call(game.battle.catch_note == "miss", "pressing outside the green says you missed")
	var foe3: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe3], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.bag = { "lures": 2, "berries": 0 }
	game.battle.sure_catch = true
	game.battle._choose(3)
	check.call(is_equal_approx(float(game.battle.cap.wide), 1.0), "the guided first catch keeps the whole bar green")
	game.battle.cap.pos = 0.02
	game.battle._calm()
	check.call(game.battle.catch_note == "hit", "the guided first catch still reads as a hit")
	game.battle.visible = false
	game.battle.state = "off"

static func _straight(game: Node) -> Vector2i:
	for d in [Vector2i.RIGHT, Vector2i.LEFT, Vector2i.DOWN, Vector2i.UP]:
		var n := 0
		var p: Vector2i = game.me.tile
		while n < 8 and game.walkable(p + d) and game.tile_at(p + d) != "\"":
			n += 1
			p += d
		if n >= 6:
			return d
	for d in [Vector2i.RIGHT, Vector2i.LEFT, Vector2i.DOWN, Vector2i.UP]:
		var n := 0
		var p: Vector2i = game.me.tile
		while n < 8 and game.walkable(p + d):
			n += 1
			p += d
		if n >= 6:
			return d
	return Vector2i.ZERO

static func _key_for(d: Vector2i) -> Key:
	if d == Vector2i.RIGHT:
		return KEY_RIGHT
	if d == Vector2i.LEFT:
		return KEY_LEFT
	if d == Vector2i.UP:
		return KEY_UP
	return KEY_DOWN

static func _hold(game: Node, d: Vector2i, down: bool) -> void:
	var action := "move_right"
	if d == Vector2i.LEFT:
		action = "move_left"
	elif d == Vector2i.UP:
		action = "move_up"
	elif d == Vector2i.DOWN:
		action = "move_down"
	if down:
		Input.action_press(action)
	else:
		Input.action_release(action)
	_dir(game, _key_for(d), down)

static func _dir(game: Node, code: Key, down: bool) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = down
	game._unhandled_input(event)

static func _release_dirs(game: Node) -> void:
	for code in [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_W, KEY_A, KEY_S, KEY_D]:
		_dir(game, code, false)
		Input.action_release("move_up")
		Input.action_release("move_down")
		Input.action_release("move_left")
		Input.action_release("move_right")

static func click(game: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)

static func release(game: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = false
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)

static func tap(game: Node, at: Vector2) -> void:
	var event := InputEventScreenTouch.new()
	event.index = 0
	event.pressed = true
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)

static func key(game: Node, code: Key) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = true
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)
