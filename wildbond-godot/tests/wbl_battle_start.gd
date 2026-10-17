extends RefCounted
## WBL-2, WBL-3, WBL-4, and the phone pass: battles open on your menu, Catch is a button,
## the first wild lure cannot miss, the objective fits its box, and a finger can reach the opening screens.

static func run(host: Node, check: Callable) -> void:
	var keep_mode: int = host.process_mode
	host.process_mode = Node.PROCESS_MODE_DISABLED
	var emulate: bool = Input.emulate_mouse_from_touch
	var game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	host.get_tree().root.add_child(game)
	game.set_process(false)
	game.battle.set_process(false)
	game.turn_card.set_process(false)
	game.get_tree().paused = false
	game._skip_opening()
	for _i in 40:
		game._process(0.05)
		if game.trans_t < 0.0:
			break
	game.lines.clear()
	game.stage = "free"
	game.walk_to.clear()
	game.me.path.clear()
	_fair(game, check)
	_catch(game, check)
	_objective(game, check)
	_phone(game, check)
	_playtester(game, check)
	_areas(game, check)
	_taps(game, check)
	Input.emulate_mouse_from_touch = emulate
	game.get_tree().paused = false
	for action in ["move_down", "move_up", "move_left", "move_right"]:
		if Input.is_action_pressed(action):
			Input.action_release(action)
	game.free()
	host.process_mode = keep_mode
	host.get_tree().paused = false

static func _fair(game: Node, check: Callable) -> void:
	var b: Control = game.battle
	for kind in ["wild", "trainer"]:
		var me: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
		var foe: Dictionary = game.R.make("cindercub", 60, { "rar": 1 }, game.rng)
		var hp := int(game.R.stats(me).hp)
		me.hp = hp
		b.rng.seed = 11
		b.open(kind, [me], [foe], "" if kind == "wild" else "Wren")
		check.call(b.allies[0].atb >= game.R.ACT_AT, "WBL-2: your lead is ready as %s begins" % kind)
		b.foes[0].atb = game.R.ACT_AT
		var before := int(b.allies[0].c.hp)
		b._go_to("run")
		b._tick(0.2)
		check.call(b.state == "choose" and int(b.allies[0].c.hp) == before, "WBL-2: a %s battle opens on the action menu, and a ready foe does not hit first" % kind)
	b.open("wild", [game.R.make("ripplet", 8, { "rar": 1 }, game.rng)], [game.R.make("mosshog", 8, { "rar": 1 }, game.rng)], "")
	b.foes[0].c.hp = 0
	b._go_to("run")
	b._tick(0.05)
	check.call(b.state == "results" and b.result == "won", "WBL-2: a battle whose foe is already down ends, instead of offering a menu")
	b.visible = false
	b.state = "off"

static func _catch(game: Node, check: Callable) -> void:
	var b: Control = game.battle
	game.team = [game.R.make("ripplet", 5, { "rar": 1 }, game.rng)]
	game.ranch.clear()
	game.story_done.erase("marenRanchTip")
	game.bag.lures = 0
	game.bag.berries = 0
	game.map_name = "thornwood"
	game._wild_battle()
	check.call(b.sure_catch and int(game.bag.lures) >= 5 and b.menu_word(3) == "Catch", "WBL-3: the first wild meeting stocks lures and offers Catch")
	check.call(not b._dimmed("Catch") and not b._dimmed("Bag"), "WBL-3: Catch and Bag are both open when you have lures and no berries")
	b.foes[0].atb = game.R.ACT_AT
	var hp := int(b.allies[0].c.hp)
	b._go_to("run")
	b._tick(0.05)
	check.call(b.state == "choose" and int(b.allies[0].c.hp) == hp, "WBL-3: the guided meeting still waits for you")
	b._choose(3)
	check.call(b.state == "capture" and float(b.cap.wide) >= 1.0, "WBL-3: Catch throws the lure, and the green covers the bar")
	b.cap.pos = 0.0
	b.rng.seed = 99
	b._calm()
	check.call(b.result == "caught" and b.caught.size() == 1, "WBL-3: the first lure brings them with you even if the press is at the edge")
	game.team.append(game.R.make("mosshog", 4, { "rar": 1 }, game.rng))
	var lures: int = int(game.bag.lures)
	game._wild_battle()
	check.call(not b.sure_catch and int(game.bag.lures) == lures, "WBL-3: a later wild meeting is an ordinary catch, and it does not add lures")
	b.bag = { "lures": 2, "berries": 0 }
	b.kind = "wild"
	b.state = "choose"
	b.wait_u = b.allies[0]
	b.sure_catch = false
	b._choose(4)
	check.call(b.state == "choose" and int(b.bag.lures) == 2 and "Catch" in str(b.log_lines[-1]), "WBL-3: Bag with only lures stays open and points at Catch")
	b.bag = { "lures": 0, "berries": 0 }
	check.call(b._dimmed("Bag") and b._dimmed("Catch"), "WBL-3: Bag and Catch grey out only when the bag has nothing to use")
	b.bag = game.bag
	b.visible = false
	b.state = "off"

static func _objective(game: Node, check: Callable) -> void:
	game.battle.visible = false
	game.stage = "to_barn"
	game._update_ui()
	check.call(game.objective.visible and game.objective.line == "Follow Maren into the barn.", "WBL-4: on the way to the barn, the objective says so")
	_fits(game, check, "WBL-4: the barn objective fits its box")
	game.stage = "barn_choose"
	game._update_ui()
	check.call(game.objective.line == "Choose who will walk with you.", "WBL-4: choosing a partner is the objective")
	game.stage = "free"
	game.team = [game.team[0]]
	game.ranch.clear()
	game.story_done.erase("marenRanchTip")
	game.map_name = "larkhaven"
	game.badges.clear()
	game._update_ui()
	check.call(game.objective.line == "Take the north road to Thornwood, then meet someone wild in the tall grass.", "WBL-8: before the first catch, Larkhaven's objective names the road to the tall grass")
	_fits(game, check, "WBL-8: the road objective fits its box")
	game.map_name = "thornwood_route"
	game._update_ui()
	check.call(game.objective.line == "Meet someone wild in the tall grass.", "WBL-4: out on the road, before the first catch, the objective is a wild meeting")
	_fits(game, check, "WBL-4: the wild-meeting objective fits its box")
	game.map_name = "larkhaven"
	game.battle.sure_catch = true
	game.battle.kind = "wild"
	game.battle.state = "choose"
	game.battle.visible = true
	game.battle.wait_u = { "c": { "name": "Ripplet" } }
	game._update_ui()
	check.call("Catch" in game.objective.line and game.objective.position.x + game.objective.size.x <= 240.0, "WBL-4: in that battle the objective is the Catch prompt, clear of the buttons")
	_fits(game, check, "WBL-4: the Catch prompt fits its box")
	game.battle.visible = false
	game.battle.state = "off"
	game.team.append(game.R.make("mosshog", 5, { "rar": 1 }, game.rng))
	game._update_ui()
	check.call(game.objective.line == "The north road leads to Thornwood.", "WBL-4: after the first catch, Larkhaven points at the north road")
	game.caption.text = "%s walks with you now. The north road leads to Thornwood. To talk to someone, stand beside them and press E; your field book: press J." % game._partner_name()
	game.touch.mode = "on"
	game.touch.touched = true
	game.stage = "free"
	game.lines.clear()
	game._thumbs_tick()
	var width: float = (384.0 + game.caption.offset_right) - game.caption.offset_left
	var font: Font = game.caption.get_theme_font("font")
	var sz: int = game.caption.get_theme_font_size("font_size")
	var h := font.get_multiline_string_size(game.caption.text, HORIZONTAL_ALIGNMENT_CENTER, width, sz).y
	var box_h: float = game.caption.offset_bottom - game.caption.offset_top
	var top: float = 216.0 + game.caption.offset_top
	var bottom: float = 216.0 + game.caption.offset_bottom
	check.call(h <= box_h + 0.5 and top >= 0.0 and bottom <= 216.0, "WBL-4: the long note after Wren fits on the screen between the phone controls (%s in %s)" % [h, box_h])
	check.call(game.caption.offset_left >= game.TouchPad.PAD.x + game.TouchPad.PAD_R, "WBL-4: that note still starts clear of the walking pad")

static func _fits(game: Node, check: Callable, what: String) -> void:
	var h: float = game.objective.block_height(game.objective.size.x)
	var r := Rect2(game.objective.position, game.objective.size)
	check.call(game.objective.line != "" and h <= game.objective.size.y + 0.5 and r.position.x >= 0.0 and r.end.x <= 384.0 and r.position.y >= 0.0 and r.end.y <= 216.0, what)

static func _phone(game: Node, check: Callable) -> void:
	check.call(game.turn_card.upright(Vector2(390, 844)) and game.turn_card.upright(Vector2(375, 812)), "phone: a portrait window is the upright card")
	check.call(not game.turn_card.upright(Vector2(844, 390)) and not game.turn_card.upright(Vector2(812, 375)), "phone: a landscape window is not the upright card")
	game.stage = "free"
	game.lines.clear()
	game.walk_to.clear()
	game.battle.visible = false
	game.card.visible = false
	game.title.visible = false
	game.menu.visible = false
	game.turn_card.check(Vector2(390, 844))
	check.call(not game.turn_card.visible and not game.get_tree().paused, "phone: an upright window plays, and the turn page stays away")
	Input.emulate_mouse_from_touch = false
	game.turn_card.check(Vector2(844, 390))
	check.call(not game.turn_card.visible and not game.get_tree().paused, "phone: turning sideways leaves the journey going, with no turn page")
	game.title.open("Rowan and Ripplet, in Thornwood.")
	for i in 3:
		var r: Rect2 = game.title._btn(i)
		var label: String = ["Continue your journey", "Start a new journey", "How to play"][i]
		var tw: float = game.title.font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 8).x
		check.call(r.position.x >= 8.0 and r.end.x <= 376.0 and r.position.y >= 8.0 and r.end.y <= 208.0 and r.size.y >= 16.0 and tw <= r.size.x - 4.0, "phone: the title button \"%s\" is on screen and its words fit" % label)
	tap(game, game.title._btn(2).get_center())
	check.call(game.howto.visible and game.walk_to.is_empty(), "phone: a finger opens How to play from the title")
	game.howto.visible = false
	game.title.visible = false
	game.stage = "barn_choose"
	game.card.open("ripplet", game.card_info("ripplet"))
	var choose: Rect2 = game.card._btn(0)
	var cw: float = game.card.font.get_string_size(game.card._label(0), HORIZONTAL_ALIGNMENT_LEFT, -1, game.card._btn_size()).x
	check.call(choose.end.y <= 216.0 and choose.size.y >= 16.0 and cw <= choose.size.x, "phone: Choose on the starter card is on screen and its words fit")
	var here: Vector2i = game.me.tile
	tap(game, choose.get_center())
	check.call(not game.card.visible and game.partner.id == "ripplet" and game.walk_to.is_empty() and game.me.tile == here, "phone: a finger on Choose picks the starter and does not walk")
	game.lines.clear()
	game.stage = "free"
	game.touch.mode = "on"
	game.touch.touched = true
	game._thumbs_tick()
	check.call(game.touch.visible and game.touch.pad_on, "phone: landscape shows the walking pad")
	var pad := Rect2(game.TouchPad.PAD - Vector2(game.TouchPad.PAD_R, game.TouchPad.PAD_R), Vector2(game.TouchPad.PAD_R * 2, game.TouchPad.PAD_R * 2))
	check.call(pad.position.x >= 0.0 and pad.end.x <= 384.0 and pad.position.y >= 0.0 and pad.end.y <= 216.0, "phone: the walking pad stays inside the view")
	game._update_ui()
	check.call(game.objective.visible and game.status.visible, "phone: the objective and the status strip are up while you walk")
	tap(game, game.satchel.position + game.satchel.size * 0.5)
	check.call(game.menu.visible and game.walk_to.is_empty(), "phone: a finger on the bag opens the menu")
	for i in game.menu.ROWS.size():
		var row: Rect2 = game.menu._row(i)
		check.call(row.end.x <= 384.0 and row.end.y <= 216.0 and row.size.y >= 16.0, "phone: the menu row %s is on screen" % game.menu.ROWS[i])
	tap(game, game.menu._row(3).get_center())
	check.call(not game.menu.visible and game.walk_to.is_empty(), "phone: a finger on Close resumes")
	game.team = [game.R.make("ripplet", 5, { "rar": 1 }, game.rng)]
	game.ranch.clear()
	game.story_done.erase("marenRanchTip")
	game.bag.lures = 0
	game.map_name = "thornwood"
	game._wild_battle()
	game.battle._go_to("choose")
	game.battle.wait_u = game.battle.allies[0]
	game._update_ui()
	var hit: Rect2 = game.battle._menu_rect(3)
	check.call(game.battle.menu_word(3) == "Catch" and hit.size.y >= 20.0 and hit.end.x <= 384.0 and hit.end.y <= 216.0, "phone: Catch is a tall button inside the battle")
	for i in game.battle.MENU.size():
		var word: String = game.battle.menu_word(i)
		var rect: Rect2 = game.battle._menu_rect(i)
		var px: int = game.battle._label_size(word, rect.size.x, 8)
		var ww: float = game.battle.font.get_string_size(word, HORIZONTAL_ALIGNMENT_LEFT, -1, px).x
		check.call(ww <= rect.size.x and rect.end.x <= 384.0 and rect.end.y <= 216.0, "phone: the battle word %s fits its button" % word)
	tap(game, hit.get_center())
	check.call(game.battle.state == "capture", "phone: a finger on Catch throws the lure")
	tap(game, Vector2(192, 194))
	check.call(game.battle.result == "caught", "phone: a finger on the bar brings the creature with you")
	game.battle.visible = false
	game.battle.state = "off"

## Playtester: the two-line hint was clipped on the trees; Sign the register missed near clicks;
## a key tap that was already up again never took a step. A key that stays down keeps walking, tile to tile.
static func _playtester(game: Node, check: Callable) -> void:
	_stand(game)
	game.settings.values.buttons = 2
	game.caption.text = "%s walks with you now. The north road leads to Thornwood. To talk to someone, stand beside them and press E; your field book: press J." % game._partner_name()
	game._thumbs_tick()
	for _i in 24:
		game._process(0.05)
	var plate: ColorRect = game.caption_plate
	var prect := Rect2(plate.position, plate.size)
	var crect: Rect2 = game.caption.get_global_rect()
	var outline: float = float(game.caption.get_theme_constant("outline_size"))
	var font: Font = game.caption.get_theme_font("font")
	var sz: int = game.caption.get_theme_font_size("font_size")
	var width: float = crect.size.x
	var text_h: float = font.get_multiline_string_size(game.caption.text, HORIZONTAL_ALIGNMENT_CENTER, width, sz).y
	var one_h: float = font.get_string_size("Note", HORIZONTAL_ALIGNMENT_LEFT, -1, sz).y
	var view_h: float = game.get_viewport().get_visible_rect().size.y
	var feet_y: float = (game.me.pos.y + float(game.TILE)) - game.cam.position.y + view_h * 0.5
	check.call(text_h > one_h + 1.0, "Playtester: the hint after Wren wraps onto two lines")
	check.call(plate.visible and plate.color.a > 0.9 and prect.position.x >= 0.0 and prect.end.x <= 384.0 and prect.position.y >= 0.0 and prect.end.y <= 216.0, "Playtester: the hint sits on a bar that stays fully on screen")
	check.call(crect.position.x >= 0.0 and crect.end.x <= 384.0 and crect.position.y - outline >= prect.position.y and crect.end.y + outline <= prect.end.y and crect.end.y + outline <= 216.0, "Playtester: both lines, outline included, sit inside that bar")
	check.call(feet_y < prect.position.y - 1.0, "Playtester: you stand above the hint, clear of the trees it used to cover (%s vs %s)" % [feet_y, prect.position.y])
	var way: Vector2i = Vector2i.ZERO
	var action := ""
	var code: Key = KEY_UP
	var best := 0
	for choice in [["move_up", Vector2i.UP, KEY_UP], ["move_down", Vector2i.DOWN, KEY_DOWN], ["move_left", Vector2i.LEFT, KEY_LEFT], ["move_right", Vector2i.RIGHT, KEY_RIGHT]]:
		var run_n: int = _open_steps(game, game.me.tile, choice[1])
		if run_n > best:
			best = run_n
			way = choice[1]
			action = choice[0]
			code = choice[2]
	check.call(best >= 3, "Playtester: Thornwood has a clear stretch to walk (%d)" % best)
	var origin: Vector2i = game.me.tile
	_key_tap(game, code)
	for _i in 12:
		game._process(0.05)
	check.call(game.me.tile == origin + way and game.me.path.is_empty(), "Playtester: a short key tap takes one step (%s -> %s)" % [origin, game.me.tile])
	var after_tap: Vector2i = game.me.tile
	for _i in 12:
		game._process(0.05)
	check.call(game.me.tile == after_tap and game.me.path.is_empty(), "Playtester: that tap does not keep walking after the step")
	_release_move()
	var room: int = _open_steps(game, game.me.tile, way)
	check.call(room >= 3, "Playtester: the held-key walk has room ahead (%d)" % room)
	var held_from: Vector2i = game.me.tile
	Input.action_press(action)
	var prev: Vector2 = game.me.pos
	var stalls := 0
	var crossings := 0
	var seen: Vector2i = held_from
	for i in 32:
		game._process(1.0 / 60.0)
		var step_px: float = game.me.pos.distance_to(prev)
		if i > 0 and step_px < 0.5:
			stalls += 1
		if game.me.tile != seen:
			crossings += 1
			seen = game.me.tile
		prev = game.me.pos
	var held_mid: Vector2i = game.me.tile
	var still_going: bool = not game.me.path.is_empty() and Input.is_action_pressed(action)
	Input.action_release(action)
	game.walk_tap = Vector2i.ZERO
	for _i in 20:
		game._process(1.0 / 60.0)
	var held_end: Vector2i = game.me.tile
	var stepped: int = absi(held_mid.x - held_from.x) + absi(held_mid.y - held_from.y)
	var extra: int = absi(held_end.x - held_mid.x) + absi(held_end.y - held_mid.y)
	check.call(stalls == 0 and crossings >= 2 and stepped >= 2 and still_going and game.me.face == way, "Playtester: a key held across frames walks tile to tile without stopping (%d tiles, %d stalls)" % [stepped, stalls])
	var stopped: Vector2i = game.me.tile
	for _i in 10:
		game._process(1.0 / 60.0)
	check.call(extra <= 1 and game.me.tile == stopped and game.me.path.is_empty() and not Input.is_action_pressed(action), "Playtester: letting go stops, apart from the step already started")
	_release_move()
	game.register.keep = false
	game.lines.clear()
	game.stage = "free"
	game.register.open()
	click(game, Vector2(250, 28))
	check.call(game.register.visible and game.stage == "free", "Playtester: a click on a register line changes that line and does not sign")
	click(game, Vector2(8, 8))
	check.call(game.register.visible, "Playtester: a click on the rest of the page does not sign")
	for spot in [Vector2(277, 181), Vector2(277, 190), Vector2(200, 173), Vector2(277, 164)]:
		game.lines.clear()
		game.stage = "free"
		game.register.open()
		click(game, spot)
		check.call(not game.register.visible, "Playtester: a click at %s signs the register" % spot)
	_release_move()

static func _stand(game: Node) -> void:
	for panel in [game.title, game.register, game.howto, game.lessons, game.card, game.battle, game.shop, game.book, game.turn_card, game.menu]:
		panel.visible = false
	game.get_tree().paused = false
	game.stage = "free"
	game.lines.clear()
	game.trans_t = -1.0
	game.walk_to.clear()
	game.meet_after = null
	game.walk_tap = Vector2i.ZERO
	game.grass_n = 80
	game.letter_steps = 80
	game.battle.state = "off"
	game._set_map("thornwood")
	game.partner.where = "larkhaven"
	game.partner.path.clear()
	game.me.where = "thornwood"
	game.me.tile = Vector2i(13, 14)
	game.me.pos = Vector2(game.me.tile) * float(game.TILE)
	game.me.path.clear()
	game.cam.position = game.me.pos + Vector2(8, 8)
	_release_move()

static func _open_steps(game: Node, origin: Vector2i, d: Vector2i) -> int:
	var n := 0
	var p: Vector2i = origin
	var tiles: Dictionary = game.DATA.TILES
	while n < 6:
		var nxt: Vector2i = p + d
		if not game.walkable(nxt):
			break
		var ch: String = game.tile_at(nxt)
		var info: Dictionary = tiles.get(ch, {})
		if int(info.get("exit", 0)) == 1:
			break
		n += 1
		p = nxt
	return n

static func _key_tap(game: Node, code: Key) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = true
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)

## The menu and the status strip in every area, including Larkhaven before the story sets you free.
## Esc, I, the bag, a finger and Start all open Party, Field book, Save and Close. The bag does not open the field book.
static func _areas(game: Node, check: Callable) -> void:
	var emulate: bool = Input.emulate_mouse_from_touch
	check.call(game.status.INK.a == 1.0, "menu: the status strip is solid, so it shows against Larkhaven's dark roofs")
	var names: Array = []
	for map_name in game.BUILT:
		names.append(str(map_name))
	names.append("barn")
	for room_name in game.INTERIORS:
		names.append(str(room_name))
	for map_name in names:
		_place(game, str(map_name), "free")
		_menu_inputs(game, check, str(map_name))
	_place(game, "larkhaven", "to_barn")
	check.call(game.stage == "to_barn" and game.map_name == "larkhaven" and game._menu_allowed(), "menu: Larkhaven still offers the menu while you follow Maren")
	_menu_inputs(game, check, "Larkhaven before you are free")
	_place(game, "larkhaven", "free")
	_key_code(game, KEY_I)
	check.call(game.menu.visible and not game.book.visible, "menu: I opens the menu even when the key event has no physical code")
	game.menu.close()
	game.book.visible = false
	_key_code(game, KEY_ESCAPE)
	check.call(game.menu.visible and not game.book.visible, "menu: Esc opens the menu even when the key event has no physical code")
	game.menu.close()
	game.book.visible = false
	var bag: Vector2 = game.satchel.position + game.satchel.size * 0.5
	_release(game, bag)
	check.call(not game.menu.visible and not game.book.visible, "menu: a bag lift with no press does not open the menu")
	game.menu.close()
	game.book.visible = false
	_press(game, Vector2(8, 8))
	_release(game, bag)
	check.call(game.menu.visible and not game.book.visible, "menu: a bag tap whose press misses still opens the menu when the finger comes up on the bag")
	game.menu.close()
	game.book.visible = false
	Input.emulate_mouse_from_touch = emulate

static func _menu_inputs(game: Node, check: Callable, where: String) -> void:
	check.call(game.status.visible and str(game.status.area) == str(game.place.text) and str(game.status.area) != "", "menu: the status strip names %s" % where)
	check.call(game.satchel.visible and game._menu_allowed(), "menu: the bag is there in %s" % where)
	var bag: Vector2 = game.satchel.position + game.satchel.size * 0.5
	Input.emulate_mouse_from_touch = true
	_key_tap(game, KEY_I)
	_opened(game, check, "I", where)
	_key_tap(game, KEY_ESCAPE)
	_opened(game, check, "Esc", where)
	click(game, bag)
	_opened(game, check, "the bag", where)
	Input.emulate_mouse_from_touch = false
	tap(game, bag)
	_opened(game, check, "a finger on the bag", where)
	Input.emulate_mouse_from_touch = true
	var down := InputEventJoypadButton.new()
	down.button_index = JOY_BUTTON_START
	down.pressed = true
	game.get_viewport().push_input(down)
	var up := InputEventJoypadButton.new()
	up.button_index = JOY_BUTTON_START
	up.pressed = false
	game.get_viewport().push_input(up)
	_opened(game, check, "Start", where)

static func _opened(game: Node, check: Callable, how: String, where: String) -> void:
	check.call(game.menu.visible and not game.book.visible, "menu: %s in %s opens Party, Field book, Save and Close, and not the field book" % [how, where])
	game.menu.close()
	game.book.visible = false
	game._update_ui()

static func _place(game: Node, map_name: String, stage_name: String) -> void:
	game.lines.clear()
	game.then_do = Callable()
	game.stage = stage_name
	game.trans_t = -1.0
	game.walk_to.clear()
	game.me.path.clear()
	game.walk_tap = Vector2i.ZERO
	game.book.visible = false
	game.battle.visible = false
	game.battle.state = "off"
	game.card.visible = false
	game.register.visible = false
	game.shop.visible = false
	game.title.visible = false
	game.howto.visible = false
	game.lessons.visible = false
	game.turn_card.visible = false
	if game.menu.visible:
		game.menu.close()
	game.get_tree().paused = false
	game.touch.mode = "off"
	game.touch.touched = false
	game.touch.pad_finger = -1
	game.touch.btn_finger = -1
	game._set_map(map_name)
	game._update_ui()

## One tap does one thing, even when the point arrives only as the finger comes up.
static func _taps(game: Node, check: Callable) -> void:
	_place(game, "barn", "barn_choose")
	game.card.open("mosshog", game.card_info("mosshog"))
	var choose_at: Vector2 = game.card._btn(0).get_center()
	_press(game, Vector2(8, 8))
	_release(game, choose_at)
	check.call(not game.card.visible and game.partner.id == "mosshog" and game.lines.size() == 7, "a Choose tap whose press misses still picks when the finger comes up on Choose, once")
	_place(game, "barn", "barn_choose")
	game.card.open("ripplet", game.card_info("ripplet"))
	_release(game, game.card._btn(0).get_center())
	check.call(game.card.visible and game.stage == "barn_choose" and game.lines.is_empty(), "a Choose lift with no press does not pick")
	_place(game, "thornwood", "free")
	game.register.keep = false
	game.register.open()
	_press(game, Vector2(8, 8))
	_release(game, Vector2(277, 181))
	check.call(not game.register.visible and game.stage == "signed" and game.lines.size() == 4, "a Sign the register tap whose press misses still signs when the finger comes up on it, once")
	_place(game, "thornwood", "free")
	game.register.keep = false
	game.register.open()
	_release(game, Vector2(277, 181))
	check.call(game.register.visible and game.stage == "free" and game.lines.is_empty(), "a Sign lift with no press does not sign")
	_place(game, "thornwood", "free")
	game.register.keep = false
	game.register.open()
	var before_name: int = int(game.register.name_i)
	_press(game, Vector2(250, 28))
	_release(game, Vector2(277, 181))
	check.call(game.register.visible and game.stage == "free" and int(game.register.name_i) != before_name, "a tap on a register line still changes that line, and the release does not sign")
	var b: Control = game.battle
	var lead: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	b.open("wild", [lead], [foe], "")
	b.foes[0].atb = game.R.ACT_AT
	b._go_to("run")
	b._tick(0.2)
	var fight: Vector2 = b._menu_rect(0).get_center()
	check.call(b.state == "choose" and b.menu_word(0) == "Fight", "Fight is waiting on the action menu")
	_press(game, Vector2(8, 8))
	_release(game, fight)
	check.call(b.state == "moves" and not game.book.visible, "a Fight tap whose press misses still chooses Fight when the finger comes up on it")
	b._go_to("choose")
	_release(game, fight)
	check.call(b.state == "choose", "a Fight lift with no press does not choose Fight")
	b._go_to("choose")
	click(game, fight)
	check.call(b.state == "moves", "a click on Fight chooses it once")
	b.visible = false
	b.state = "off"
	_place(game, "larkhaven", "free")
	game.say("", "One.")
	game.say("", "Two.")
	game.say("", "Three.")
	game._update_ui()
	var bubble: Control = game.get_node("UI/Bubble")
	var box := Rect2(bubble.position, bubble.size)
	var spot: Vector2 = box.get_center()
	check.call(bubble.visible and box.has_point(spot) and box.size.y > 8.0, "dialogue: the speech box is on screen")
	click(game, spot)
	check.call(game.lines.size() == 2 and str(game.lines[0].text) == "Two.", "dialogue: a click inside the speech box advances one line")
	_release(game, spot)
	check.call(game.lines.size() == 2 and str(game.lines[0].text) == "Two.", "dialogue: a lift inside the speech box with no press does not advance")
	game.say("", "Four.")
	game._update_ui()
	_press(game, Vector2(1, 1))
	_release(game, spot)
	check.call(game.lines.size() == 2 and str(game.lines[0].text) == "Three.", "dialogue: press and release inside the speech box advance one line, not two")
	game.lines.clear()
	_same_finger(game, check)

## The press that opens a page is not a tap on whatever sits under the finger when it lifts.
## The opening check's finger is a touch that Godot also sends as a mouse click. The Talk button sits inside Sign.
static func _same_finger(game: Node, check: Callable) -> void:
	var emulate: bool = Input.emulate_mouse_from_touch
	Input.emulate_mouse_from_touch = true
	_place(game, "larkhaven", "maren_talks")
	game.register.keep = false
	game.say("", "The book is open.")
	game._update_ui()
	var talk: Vector2 = game.touch.BTN
	check.call(not game.register.visible and game.lines.size() == 1, "register: the page is shut before the tap that opens it")
	_finger_tap(game, talk)
	check.call(game.register.visible and game.stage == "register" and game.lines.is_empty(), "register: the tap that opens it does not sign when that finger comes up")
	_place(game, "barn", "barn_choose")
	var was: String = str(game.partner.id)
	game.say("", "This one?")
	game.then_do = func() -> void:
		game.card.open("mosshog", game.card_info("mosshog"))
	var choose_at: Vector2 = game.card._btn(0).get_center()
	_finger_tap(game, choose_at)
	check.call(game.card.visible and game.stage == "barn_choose" and str(game.partner.id) == was and game.lines.is_empty(), "card: the tap that opens it does not choose when that finger comes up")
	_place(game, "thornwood", "free")
	game.say("", "A wild one steps out.")
	var lead: Dictionary = game.R.make("ripplet", 8, { "rar": 1 }, game.rng)
	var foe: Dictionary = game.R.make("mosshog", 8, { "rar": 1 }, game.rng)
	game.then_do = func() -> void:
		game.battle.open("wild", [lead], [foe], "")
		game.battle._go_to("choose")
		game.battle.wait_u = game.battle.allies[0]
	var fight: Vector2 = game.battle._menu_rect(0).get_center()
	_finger_tap(game, fight)
	check.call(game.battle.visible and str(game.battle.state) == "choose", "battle: the tap that opens the action menu does not choose Fight when that finger comes up")
	game.battle.visible = false
	game.battle.state = "off"
	game.lines.clear()
	game.then_do = Callable()
	Input.emulate_mouse_from_touch = emulate

## A finger: the mouse click Godot makes from the touch, then the touch itself, on the way down and on the way up.
static func _finger_tap(game: Node, at: Vector2) -> void:
	_finger(game, at, true)
	_finger(game, at, false)

static func _finger(game: Node, at: Vector2, down: bool) -> void:
	var where: Vector2 = game.get_viewport().get_final_transform() * at
	var mouse := InputEventMouseButton.new()
	mouse.button_index = MOUSE_BUTTON_LEFT
	mouse.device = InputEvent.DEVICE_ID_EMULATION
	mouse.position = where
	mouse.pressed = down
	var finger := InputEventScreenTouch.new()
	finger.index = 0
	finger.position = where
	finger.pressed = down
	game.get_viewport().push_input(mouse)
	game.get_viewport().push_input(finger)

static func _press(game: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)

static func _release(game: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = false
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)

static func _key_code(game: Node, code: Key) -> void:
	var event := InputEventKey.new()
	event.keycode = code
	event.physical_keycode = KEY_NONE
	event.pressed = true
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)

static func _release_move() -> void:
	for move_name in ["move_down", "move_up", "move_left", "move_right"]:
		if Input.is_action_pressed(move_name):
			Input.action_release(move_name)

static func click(game: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = game.get_viewport().get_final_transform() * at
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
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
