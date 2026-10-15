extends RefCounted
## Wildbond fix bundle 3. Placement, landscape turn order, input, the road gaps' neighbours,
## and the desktop re-test: battle lines, the HUD, the bag, How to play, held walking, the follower.

static func run(host: Node, check: Callable) -> void:
	var keep_mode: int = host.process_mode
	host.process_mode = Node.PROCESS_MODE_DISABLED
	var game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	host.get_tree().root.add_child(game)
	game.set_process(false)
	game.battle.set_process(false)
	_gear(game, check)
	_figures(game, check)
	_backs(game, check)
	_chips(game, check)
	_input(game, check)
	_lines(game, check)
	_bag(game, check)
	_hud(game, check)
	_howto(game, check)
	_walk(game, check)
	_follower(game, check)
	_card(game, check)
	game.free()
	host.process_mode = keep_mode

static func _gear(game: Node, check: Callable) -> void:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for y in range(20, 64):
		for x in range(12, 52):
			img.set_pixel(x, y, Color(1, 1, 1, 1))
	var tex := ImageTexture.create_from_image(img)
	var ink: Rect2i = game.Sprites.ink_box(tex)
	var band: Rect2i = game.Sprites.gear_band(tex, Rect2i(), Vector2i(64, 64))
	check.call(ink == Rect2i(12, 20, 40, 44), "gear follows the visible pixels, here a 40×44 block on the feet (%s)" % ink)
	check.call(band.position.x == ink.position.x and band.size.x == ink.size.x, "gear uses the ink's full width")
	check.call(band.position.y == ink.position.y + int(floor(float(ink.size.y) * 0.25)), "gear starts a quarter of the way down the ink")
	check.call(band.end.y <= ink.end.y and band.position.y >= ink.position.y, "gear stays on the ink")
	var full := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	full.fill(Color(1, 1, 1, 1))
	var full_tex := ImageTexture.create_from_image(full)
	var full_band: Rect2i = game.Sprites.gear_band(full_tex, Rect2i(), Vector2i(64, 64))
	check.call(full_band.position.y == 16 and full_band.size.y == 32 and full_band.size.x == 64, "a full-frame sprite keeps the old gear band")
	var foot := Vector2(100, 164)
	var small: Vector2 = game.Sprites.tamer_anchor(foot, Vector2i(64, 64), 1.0, tex, true)
	var bleed: Vector2 = game.Sprites.tamer_anchor(foot, Vector2i(64, 64), 1.0, full_tex, true)
	check.call(bleed.distance_to(Vector2(74, 88)) < 1.0, "a full-bleed front keeps the tamer on the old spot (%s)" % bleed)
	check.call(absf(small.y - 108.0) < 1.0 and small.y > bleed.y, "a shorter front drops the tamer to just above its ink (%s)" % small)

static func _figures(game: Node, check: Callable) -> void:
	var bare: Array = []
	for id in game.DATA.SPECIES:
		var sid := str(id)
		if not game.Sprites.has(sid) and not game.Sprites.has_battle_front(sid):
			bare.append(sid)
	var poses: Array = game.battle._battle_poses()
	for id in bare:
		for facing in [true, false]:
			var origin_x := -99999.0
			var steady := true
			for step in poses:
				var parts: Array = game.Figures.sized_parts(game.DATA.SPECIES[id], facing, step)
				var place: Dictionary = game.battle._figure_place(Vector2(100, 158), str(id), parts, facing)
				var ox: float = (place.origin as Vector2).x
				if origin_x < -9999.0:
					origin_x = ox
				elif absf(ox - origin_x) > 0.01:
					steady = false
			check.call(steady, "%s keeps one sideways centre on the %s" % [id, "right" if facing else "left"])

static func _backs(game: Node, check: Callable) -> void:
	check.call(game.Sprites.has_battle_back("bogsnap") and game.Sprites.has_battle_back("glimmerwing"), "Bogsnap and Glimmerwing have back sprites")
	check.call(not game.Sprites.has_battle_back("ripplet"), "a species without a back file keeps the front")
	var ally: Dictionary = game.R.make("bogsnap", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("glimmerwing", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("choose")
	var mine: Rect2 = game.battle.sprite_rect(game.battle.allies[0])
	var theirs: Rect2 = game.battle.sprite_rect(game.battle.foes[0])
	check.call(mine.size.x > 8.0 and theirs.size.x > 8.0, "the player's back sprite and the foe's front both have a size")
	game.battle.visible = false
	game.battle.state = "off"

static func _chips(game: Node, check: Callable) -> void:
	var ally: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.external_ui = false
	var names := PackedStringArray(["Breakwatermane", "Ripplet", "Mosshog", "Cindercub"])
	for win in [Vector2(780, 360), Vector2(844, 390)]:
		game.battle.layout_scale = minf(win.x / 384.0, win.y / 216.0)
		var chips: Dictionary = game.battle._chip_boxes(names)
		var foe_box := Rect2(10, 8, 150, 26).grow(1.0)
		var ally_box: Rect2 = game.battle._ally_panel().grow(1.0)
		var clear := true
		var detail := ""
		for r in chips["rects"]:
			var box: Rect2 = r
			if box.intersects(foe_box) or box.intersects(ally_box):
				clear = false
				detail = "%s hits foe %s or ally %s" % [box, foe_box, ally_box]
		var nxt: Rect2 = chips.get("next", Rect2())
		if nxt.size.x < 8.0 or nxt.intersects(foe_box) or nxt.intersects(ally_box):
			clear = false
			detail = "Next: %s" % nxt
		var word: float = game.battle.font.get_string_size("Breakwatermane", HORIZONTAL_ALIGNMENT_LEFT, -1, int(chips["font"])).x
		var chip: Rect2 = chips["rects"][0]
		check.call(clear and word <= chip.size.x - 8.0 + 0.5, "at %s the Next row is clear of both health panels and Breakwatermane fits (%s)" % [win, detail])
	game.battle.layout_scale = 0.0
	game.battle.visible = false
	game.battle.state = "off"

static func _input(game: Node, check: Callable) -> void:
	var view := game.get_viewport().get_visible_rect().size
	var raw := Vector2(20, 30)
	check.call(Controls.into_view(raw, view, view, Transform2D.IDENTITY).distance_to(raw) < 0.5, "a headless point inside the view stays put")
	var saved: Array = InputMap.action_get_events("move_right")
	InputMap.action_erase_events("move_right")
	var bound := InputEventKey.new()
	bound.physical_keycode = KEY_L
	InputMap.action_add_event("move_right", bound)
	_key_state(KEY_L, true)
	check.call(Controls.held_dir() == Vector2i.RIGHT, "a rebound walk key is the direction that is held")
	_key_state(KEY_L, false)
	_key_state(KEY_D, true)
	check.call(Controls.held_dir() != Vector2i.RIGHT, "the old key does not keep walking after it is unbound")
	_key_state(KEY_D, false)
	InputMap.action_erase_events("move_right")
	for ev in saved:
		InputMap.action_add_event("move_right", ev)
	game.stage = "free"
	game.lines.clear()
	game.battle.visible = false
	game.title.visible = false
	if game.menu.visible:
		game.menu.close()
	var was: bool = Input.use_accumulated_input
	Input.use_accumulated_input = true
	var menu := InputEventKey.new()
	menu.keycode = KEY_I
	menu.physical_keycode = KEY_I
	menu.pressed = true
	Input.parse_input_event(menu)
	Controls.flush_buffered_events()
	game._process(0.05)
	check.call(not game.menu.visible, "a press flushed during a fade does not open the menu afterwards")
	Input.use_accumulated_input = was

static func _key_state(code: Key, down: bool) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = down
	Input.parse_input_event(event)
	Input.flush_buffered_events()

static func _lines(game: Node, check: Callable) -> void:
	var ally: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	foe["moves"] = ["charge"]
	game.battle.open("trainer", [ally], [foe], "Wren")
	game.battle._go_to("moves")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.line_queue.clear()
	game.battle._use_move("howl")
	var stat_line: String = game.battle.shown_line
	var stat_id: int = game.battle.line_id
	check.call(game.battle.state == "beat" and "Howl" in stat_line, "a stat move puts its own line up (%s)" % stat_line)
	game.battle.line_frame = Engine.get_process_frames() - 2
	_pointer(game.battle, true)
	_pointer(game.battle, false)
	check.call(game.battle.state == "beat" and game.battle.state_t >= game.battle.beat_t - 0.001, "the click that owns the stat line dismisses it on the lift")
	var hp_before: int = int(game.battle.allies[0].c.hp)
	game.battle.state_t = game.battle.beat_t
	game.battle._process(0.05)
	game.battle._process(0.05)
	game.battle.foes[0].atb = game.R.ACT_AT
	game.battle._process(0.05)
	var enemy_line: String = game.battle.shown_line
	check.call(game.battle.state == "beat" and enemy_line != stat_line and "used" in enemy_line.to_lower(), "the enemy's damaging line is on screen before the menu (%s)" % enemy_line)
	check.call(game.battle.state_t < 0.02, "the enemy line's timer starts when that line appears (%.3f)" % game.battle.state_t)
	check.call(int(game.battle.allies[0].c.hp) < hp_before, "the enemy's hit has already landed")
	var budget: float = game.battle.beat_t / maxf(game.battle.pace, 0.01)
	var step := 0.05
	var spent := 0.0
	while game.battle.state == "beat" and game.battle.shown_line == enemy_line and (game.battle.state_t + step) * game.battle.pace <= game.battle.beat_t:
		game.battle._process(step)
		spent += step
	var shown_hp: float = float(game.battle.allies[0].shown)
	check.call(game.battle.state == "beat" and game.battle.shown_line == enemy_line and spent > budget - step - 0.001, "the enemy damage line stays for its full timer after it appears (%.2f of %.2f)" % [spent, budget])
	check.call(shown_hp < float(hp_before) - 0.5, "the health number falls while the enemy's damage line is up (%.1f from %d)" % [shown_hp, hp_before])
	var frozen: float = game.battle.state_t
	game.battle.pointer_held = true
	game.battle._process(0.4)
	check.call(game.battle.state == "beat" and game.battle.shown_line == enemy_line and absf(game.battle.state_t - frozen) < 0.001, "a held pointer pauses the enemy line's timer")
	game.battle.pointer_held = false
	check.call(game.battle.state != "choose", "that same click does not open the command menu")
	var during: int = game.battle.line_id
	game.battle.pointer_held = true
	game.battle.down_line = stat_id
	game.battle.line_frame = Engine.get_process_frames() - 2
	_pointer(game.battle, false)
	check.call(game.battle.state == "beat" and game.battle.shown_line == enemy_line and game.battle.line_id == during, "a press that began on the earlier line does not dismiss the enemy line")
	game.battle.line_frame = Engine.get_process_frames() - 2
	_pointer(game.battle, true)
	_pointer(game.battle, false)
	check.call(game.battle.state_t >= game.battle.beat_t - 0.001, "a new click, begun while the enemy line is up, dismisses it")
	game.battle._process(0.05)
	game.battle._process(0.05)
	game.battle.allies[0].atb = game.R.ACT_AT
	for _i in 4:
		if game.battle.state == "choose":
			break
		game.battle._process(0.05)
	check.call(game.battle.state == "choose", "the command menu comes after the enemy line has had its own click")
	game.battle.visible = false
	game.battle.state = "off"

static func _pointer(battle: Node, pressed: bool) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = pressed
	event.position = Vector2(16, 180)
	battle._input(event)

static func _bag(game: Node, check: Callable) -> void:
	var ally: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.battle.open("wild", [ally], [foe], "")
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.bag = { "lures": 0, "berries": 0 }
	_pointer_at(game.battle, game.battle._menu_rect(4).get_center())
	check.call(game.battle.state == "choose" and game.battle.bag_note == "Your bag is empty.", "an empty bag says so (%s)" % game.battle.bag_note)
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game.battle.resume_menu = false
	game.battle.bag = { "lures": 0, "berries": 2 }
	var before: int = int(game.battle.allies[0].c.hp)
	game.battle.allies[0].c.hp = maxi(1, before - 8)
	_pointer_at(game.battle, game.battle._menu_rect(4).get_center())
	check.call(game.battle.state == "beat" and "berry" in game.battle.shown_line.to_lower() and int(game.battle.bag.berries) == 1, "a berry in the bag is used and the line says so (%s)" % game.battle.shown_line)
	game.battle.visible = false
	game.battle.state = "off"

static func _pointer_at(battle: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = battle.get_viewport().get_final_transform() * at
	battle._input(event)

static func _hud(game: Node, check: Callable) -> void:
	game.lines.clear()
	game.stage = "free"
	game.title.visible = false
	game.card.visible = false
	game.battle.visible = false
	game.book.visible = false
	game.team = [game.team[0]] if not game.team.is_empty() else [game.R.make("ripplet", 5, { "rar": 1 }, game.rng)]
	game.ranch.clear()
	game.story_done.erase("marenRanchTip")
	game.badges.clear()
	game._set_map("larkhaven")
	game.me.pos = Vector2(12, 1) * float(game.TILE)
	var sign := Rect2(Vector2(12 * game.TILE + 1, game.TILE + 1), Vector2(14, 15))
	game.get_viewport().canvas_transform = Transform2D(Vector2(1, 0), Vector2(0, 1), Vector2(30, 18) - sign.position)
	game._update_ui()
	var sign_s: Rect2 = game._world_screen(sign)
	var banner := Rect2(game.objective.position, game.objective.size)
	var sign_clear: bool = not banner.intersects(sign_s) or game.objective.modulate.a < 0.5
	check.call(sign_clear and "Thornwood" in game.objective.line, "the objective moves or fades off the Larkhaven signpost")
	game._set_map("barn")
	game.stage = "free"
	game.me.tile = Vector2i(11, 8)
	game.me.pos = Vector2(game.me.tile) * float(game.TILE)
	var player := Rect2(game.me.pos + Vector2(1, -12), Vector2(14, 28))
	game.get_viewport().canvas_transform = Transform2D(Vector2(1, 0), Vector2(0, 1), Vector2(40, 20) - player.position)
	game._update_ui()
	var player_s: Rect2 = game._world_screen(player)
	banner = Rect2(game.objective.position, game.objective.size)
	check.call(not banner.intersects(player_s) or game.objective.modulate.a < 0.5, "inside the barn the objective moves or fades off the player")
	var door := Rect2(Vector2(game.BARN_EXIT) * float(game.TILE), Vector2(game.TILE, game.TILE))
	game.get_viewport().canvas_transform = Transform2D(Vector2(1, 0), Vector2(0, 1), Vector2(160, 198) - door.position)
	game.caption.text = "The door out of the barn is just here."
	game._place_caption()
	game._fit_caption()
	var door_s: Rect2 = game._world_screen(door)
	var band := Rect2(0, 216.0 + float(game.caption.offset_top), 384, maxf(1.0, float(game.caption.offset_bottom - game.caption.offset_top)))
	check.call(not band.intersects(door_s) or game.caption.modulate.a < 0.5, "the hint moves or fades off the barn door")
	var pen: Rect2 = game._pen_world_rects()[0]
	game.get_viewport().canvas_transform = Transform2D(Vector2(1, 0), Vector2(0, 1), Vector2(20, 16) - pen.position)
	game.place_t = 0.0
	game.map_name = "barn"
	game._update_ui()
	var pen_s: Rect2 = game._world_screen(pen)
	var title := Rect2(game.place.offset_left, game.place.offset_top, 220, 26)
	check.call(not title.intersects(pen_s) or game.place.modulate.a < 0.5, "the place name stays off the Cindercub pen")
	game.say("", "The name is written on the stall.")
	game._update_ui()
	var bub := Rect2(game.bubble.position, game.bubble.size)
	var hit := false
	for s in game._pen_sign_rects():
		if bub.intersects(s):
			hit = true
	check.call(game.bubble.visible and not hit, "a speech box stays off the pen signs")
	game.lines.clear()
	game.caption.text = ""
	game.get_viewport().canvas_transform = Transform2D.IDENTITY

static func _howto(game: Node, check: Callable) -> void:
	var page: Node = game.howto
	var paper := Rect2(14, 14, 356, 188)
	for use in ["keys", "touch"]:
		var blocks: Array = page.layout_blocks(use)
		var footer: Rect2 = blocks[blocks.size() - 1]
		var overlap := false
		for i in range(1, blocks.size() - 1):
			var box: Rect2 = blocks[i]
			if not paper.encloses(box) or box.intersects(footer):
				overlap = true
		if not paper.encloses(footer):
			overlap = true
		check.call(not overlap, "How to play (%s) keeps every line inside the page and off the footer" % use)
	var touch_body: Rect2 = page._touch_body()
	var sentence: float = page.font.get_multiline_string_size(page.TOUCH_COPY, HORIZONTAL_ALIGNMENT_LEFT, touch_body.size.x, 14, -1).y
	check.call(sentence <= touch_body.size.y + 0.5 and "save" in page.TOUCH_COPY, "the Menu sentence is wrapped, not cut off")

static func _walk(game: Node, check: Callable) -> void:
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
	game.partner.tile = Vector2i(-40, -40)
	game.partner.pos = Vector2(-40, -40) * float(game.TILE)
	game.partner.path.clear()
	var way := _stretch(game, 12)
	check.call(way != Vector2i.ZERO, "held walking has a clear stretch")
	if way == Vector2i.ZERO:
		return
	var home_tile: Vector2i = game.me.tile
	var home_pos: Vector2 = game.me.pos
	_release_move()
	var tap_d := _tap_distance(game, way)
	_settle(game, home_tile, home_pos)
	var held_from: Vector2 = game.me.pos
	# One press, held. No key-repeat events: the action stays down on its own.
	Input.action_press(_action(way))
	for _i in 120:
		game._process(1.0 / 60.0)
	var held: float = Vector2(game.me.pos).distance_to(held_from) / float(game.TILE) / 2.0
	_release_move()
	var tap_speed: float = tap_d / 2.0
	check.call(held + 0.05 >= tap_speed and held >= 3.5 and held <= 6.0, "holding the action for 2s walks at %.2f tiles/s, at least the tap (%.2f)" % [held, tap_speed])
	_settle(game, home_tile, home_pos)
	# A walker on the next tile waits; the click is not thrown away.
	var ahead: Vector2i = game.me.tile + way
	game.wren.where = game.map_name
	game.wren.tile = ahead
	game.wren.pos = Vector2(ahead) * float(game.TILE)
	var crossing: Array[Vector2i] = [ahead + way]
	game.wren.path = crossing
	var planned: Array[Vector2i] = [ahead, ahead + way]
	game.walk_to = planned
	game.me.path.clear()
	game._process(0.05)
	check.call(not game.walk_to.is_empty() and game.me.tile != ahead, "a click waits while someone is crossing, instead of dropping the walk")
	game.wren.path.clear()
	game.wren.tile = ahead + way + way
	game.wren.pos = Vector2(game.wren.tile) * float(game.TILE)
	game.wren.where = "gone"
	game._process(0.05)
	check.call(game.me.path.size() > 0 or game.me.tile == ahead, "once the tile is free the waiting walk steps on")

static func _settle(game: Node, tile: Vector2i, pos: Vector2) -> void:
	_release_move()
	game.lines.clear()
	game.me.path.clear()
	game.walk_to.clear()
	game.me.tile = tile
	game.me.pos = pos
	game.stage = "free"
	game.trans_t = -1.0

static func _tap_distance(game: Node, way: Vector2i) -> float:
	var origin: Vector2 = game.me.pos
	var action := _action(way)
	var frame := 0
	while frame < 120:
		Input.action_press(action)
		for _i in 8:
			if frame >= 120:
				break
			game._process(1.0 / 60.0)
			frame += 1
		Input.action_release(action)
		if frame < 120:
			game._process(1.0 / 60.0)
			frame += 1
	return Vector2(game.me.pos).distance_to(origin) / float(game.TILE)

static func _action(d: Vector2i) -> String:
	if d == Vector2i.LEFT:
		return "move_left"
	if d == Vector2i.UP:
		return "move_up"
	if d == Vector2i.DOWN:
		return "move_down"
	return "move_right"

static func _release_move() -> void:
	for a in ["move_up", "move_down", "move_left", "move_right"]:
		Input.action_release(a)

static func _stretch(game: Node, need: int) -> Vector2i:
	for d in [Vector2i.RIGHT, Vector2i.LEFT, Vector2i.DOWN, Vector2i.UP]:
		var n := 0
		var p: Vector2i = game.me.tile
		while n < need and game.walkable(p + d) and game.tile_at(p + d) != "\"":
			n += 1
			p += d
		if n >= need:
			return d
	return Vector2i.ZERO

static func _follower(game: Node, check: Callable) -> void:
	game.me.pos = Vector2(80, 80)
	game.partner.pos = Vector2(80, 96)
	check.call(is_equal_approx(game._follower_nudge(game.partner), 10.0), "a follower on your column stands a step to the side")
	game.partner.pos = Vector2(120, 96)
	check.call(is_zero_approx(game._follower_nudge(game.partner)), "a follower already beside you is not shoved again")
	game.me.pos = Vector2(80, 80)
	game.partner.pos = Vector2(80, 96)
	var order: Array = game._paint_order([game.partner, game.me])
	check.call(order[0] == game.partner and order[1] == game.me, "you are drawn after the follower, so it does not cover your head")

static func _card(game: Node, check: Callable) -> void:
	check.call(is_equal_approx(game.card.strength_baseline(100.0), 100.0 + game.card.STATS_H + game.card.STRENGTH_GAP), "the strength line is measured from the bars")
	check.call(game.card.STRENGTH_GAP >= 12, "the strength line has room under the bars")
