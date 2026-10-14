extends RefCounted
## WBL-1 and WBL-14: the menu opens and closes, it blocks walking, and a mouse click chooses a starter.
## Its own scene and no_save keep these checks off the caller's journey.

const SAVE_KEYS := ["v", "saved", "look", "team", "ranch", "bag", "badges", "seen", "bonded", "items", "beaten", "restore", "explored", "story", "retry", "egg", "gear", "taught", "letter", "calendar", "festival", "league", "spire", "rematches", "bondDay", "keysLearned", "map", "x", "y", "partner"]

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
	game.turn_card.set_process(false)
	game.get_tree().paused = false
	game._skip_opening()
	for _i in 40:
		game._process(0.05)
		if game.trans_t < 0.0 and game.map_name == "thornwood":
			break
	game.lines.clear()
	game.stage = "free"
	game.walk_to.clear()
	game.me.path.clear()
	game._update_ui()
	var tile: Vector2i = game.me.tile
	check.call(game.menu != null and game.status != null, "WBL-1: the journey has a menu and a status strip")
	check.call(game.menu.size.x >= 384 and game.menu.size.y >= 216, "WBL-1: the menu covers the view, so a click cannot fall through a zero-size page")
	check.call(game.card.size.x >= 384 and game.card.size.y >= 216, "WBL-14: the starter card covers the view")
	check.call(game.status.visible and game.status.area == game.place.text and game.status.area != "", "WBL-1: the status strip shows the area name")
	check.call(game.status.lead == str(game.team[0].name) and game.status.hp == int(game.team[0].hp) and game.status.hp_max == int(game.R.stats(game.team[0]).hp) and game.status.hp_max > 0, "WBL-1: the status strip shows the party lead and its health")
	check.call(game.status.coins == int(game.bag.coins) and game.status.coins == 120, "WBL-1: the status strip shows the coins in the bag")
	check.call(game.status.position == Vector2.ZERO and game.status.size == Vector2(352, 12) and game.status.mouse_filter == Control.MOUSE_FILTER_IGNORE, "WBL-1: the status strip is a small whole-pixel bar and lets clicks through")
	key(game, KEY_I)
	check.call(game.menu.visible and game.me.tile == tile and game.walk_to.is_empty() and game.me.path.is_empty(), "WBL-1: I opens the menu and stops you where you stand")
	check.call(game.status.visible, "WBL-1: the status strip stays up while the menu is open")
	Input.action_press("move_down")
	for _i in 6:
		game._process(0.05)
	Input.action_release("move_down")
	check.call(game.me.tile == tile and game.walk_to.is_empty() and game.me.path.is_empty() and game.menu.visible, "WBL-1: held walking keys do nothing while the menu is open")
	click(game, Vector2(20, 180))
	check.call(not game.menu.visible and game.me.tile == tile and game.walk_to.is_empty(), "WBL-1: a click outside the menu closes it and does not walk")
	key(game, KEY_ESCAPE)
	check.call(game.menu.visible, "WBL-1: Esc opens the menu")
	key(game, KEY_ESCAPE)
	check.call(not game.menu.visible, "WBL-1: Esc closes the menu")
	key(game, KEY_Q)
	check.call(not game.menu.visible, "WBL-1: Q still goes back, and does not open the menu by itself")
	click(game, game.satchel.position + game.satchel.size * 0.5)
	check.call(game.menu.visible and game.walk_to.is_empty(), "WBL-1: the bag opens the menu")
	for _i in 3:
		key(game, KEY_DOWN)
	key(game, KEY_ENTER)
	check.call(not game.menu.visible, "WBL-1: Down to Close and Enter resumes")
	var joy := InputEventJoypadButton.new()
	joy.button_index = JOY_BUTTON_START
	joy.pressed = true
	game.get_viewport().push_input(joy)
	joy = joy.duplicate()
	joy.pressed = false
	game.get_viewport().push_input(joy)
	check.call(game.menu.visible, "WBL-1: Start on a gamepad opens the menu")
	click(game, Vector2(192, 73))
	game._update_ui()
	check.call(not game.menu.visible and game.book.visible and game.book.tab == 1, "WBL-1: Party opens the field book on your team")
	check.call(not game.status.visible, "WBL-1: the status strip steps aside for the field book")
	game.book.close()
	game._update_ui()
	check.call(not game.book.visible and game.menu.visible and game.status.visible, "WBL-1: closing the book from Party returns to the menu, and the strip comes back")
	click(game, Vector2(192, 95))
	game._update_ui()
	check.call(game.book.visible and game.book.tab == 0 and not game.menu.visible and not game.status.visible, "WBL-1: Field book opens the Wilddex and the strip steps aside")
	game.book.close()
	game._update_ui()
	check.call(game.menu.visible and game.status.visible and game.satchel.visible, "WBL-1: closing the Wilddex returns to the menu")
	var coins: int = int(game.bag.coins)
	click(game, Vector2(192, 117))
	check.call(game.menu.visible and game.menu.note == "" and int(game.bag.coins) == coins, "WBL-1: Save stays quiet when this session is not saving")
	game.no_save = false
	game.save_path = "user://wbl1_menu_test.json"
	click(game, Vector2(192, 117))
	var written := FileAccess.get_file_as_string(game.save_path)
	var parsed = JSON.parse_string(written)
	var keys: Array = []
	if parsed is Dictionary:
		keys = parsed.keys()
		keys.sort()
	var expect: Array = SAVE_KEYS.duplicate()
	expect.sort()
	check.call(parsed is Dictionary and keys == expect and int(parsed.v) == 2, "WBL-1: Save writes the existing journey file, version 2, with the same fields")
	check.call(parsed is Dictionary and str(parsed.team[0].sp) == str(game.team[0].sp) and str(parsed.map) == game.map_name and int(parsed.x) == game.me.tile.x and int(parsed.y) == game.me.tile.y and str(parsed.partner) == game.partner.id, "WBL-1: the saved journey matches where you are and who leads")
	check.call(game.menu.visible and game.menu.note == "Saved.", "WBL-1: a successful save says Saved and leaves the menu open")
	game.no_save = true
	var SafeSave := preload("res://scripts/safe_save.gd")
	SafeSave.remove(game.save_path)
	game.save_path = "user://journey.json"
	click(game, Vector2(192, 139))
	check.call(not game.menu.visible, "WBL-1: Close resumes")
	Input.emulate_mouse_from_touch = false
	tap(game, game.satchel.position + game.satchel.size * 0.5)
	check.call(game.menu.visible and game.walk_to.is_empty(), "WBL-1: a finger on the bag opens the menu when the phone is not also sending a mouse click")
	tap(game, Vector2(192, 139))
	check.call(not game.menu.visible and game.walk_to.is_empty() and game.me.tile == tile, "WBL-1: a finger on Close resumes and does not walk")
	Input.emulate_mouse_from_touch = true
	var neighbor: Vector2i = game.me.tile + Vector2i.DOWN
	if not game.walkable(neighbor):
		neighbor = game.me.tile + Vector2i.RIGHT
	var route: Array = game.route(game.me.tile, neighbor)
	game._tap(Vector2(neighbor) * game.TILE + Vector2(8, 8))
	check.call(not route.is_empty() and game.walk_to == route, "WBL-1: with the menu shut, a tap still walks")
	game.walk_to.clear()
	game.battle.visible = true
	key(game, KEY_I)
	key(game, KEY_ESCAPE)
	click(game, game.satchel.position + game.satchel.size * 0.5)
	check.call(not game.menu.visible and game.walk_to.is_empty(), "WBL-1: the menu stays shut during a battle")
	game.battle.visible = false
	game.battle.state = ""
	game.say("", "Hold on.")
	game._update_ui()
	key(game, KEY_I)
	check.call(not game.menu.visible and game.lines.size() == 1 and str(game.lines[0].text) == "Hold on.", "WBL-1: the menu stays shut during dialogue, and the line stays")
	check.call(game.status.visible, "WBL-1: the status strip stays up while someone is talking")
	game.lines.clear()
	game._update_ui()
	var here: Vector2i = game.me.tile
	game.book.open()
	click(game, Vector2(8, 8))
	check.call(not game.book.visible and game.walk_to.is_empty() and game.me.tile == here, "WBL-14: a click outside the field book closes it and does not walk")
	game.shop.open([{ "name": "5 lures", "give": { "lures": 5 }, "cost": 50 }])
	click(game, Vector2(8, 8))
	check.call(game.shop.visible and int(game.bag.coins) == 120 and game.walk_to.is_empty(), "WBL-14: a click off the shop's rows stays at the counter and does not walk")
	game.shop.visible = false
	game.title.open("A saved journey.")
	click(game, Vector2(8, 8))
	check.call(game.title.visible and game.walk_to.is_empty(), "WBL-14: a click off the title's buttons stays on the title and does not walk")
	game.title.visible = false
	game.register.visible = true
	click(game, Vector2(8, 8))
	check.call(game.register.visible and game.stage == "free" and game.walk_to.is_empty(), "WBL-14: a click off the register does not sign and does not walk")
	game.register.visible = false
	game.lessons.open(game.team)
	click(game, Vector2(8, 8))
	check.call(game.lessons.visible and game.walk_to.is_empty(), "WBL-14: a click off the lesson rows stays on the page and does not walk")
	game.lessons.visible = false
	game.battle.visible = true
	click(game, Vector2(8, 8))
	check.call(game.battle.visible and game.walk_to.is_empty(), "WBL-14: a click during battle does not walk")
	game.battle.visible = false
	game.battle.state = ""
	game.howto.open()
	game.howto.t = 0.0
	click(game, Vector2(8, 8))
	check.call(game.howto.visible and game.walk_to.is_empty(), "WBL-14: the click that is still on How to play does not reach the world")
	game.howto.visible = false
	game.turn_card.visible = true
	click(game, Vector2(8, 8))
	check.call(game.turn_card.visible and game.walk_to.is_empty(), "WBL-14: a click on the turn-your-phone card does not walk")
	game.turn_card.visible = false
	game.card.open("ripplet", game.card_info("ripplet"))
	click(game, Vector2(30, 30))
	check.call(game.card.visible and game.stage == "free" and game.walk_to.is_empty(), "WBL-14: a click off a creature's buttons does not choose and does not walk")
	game.card.visible = false
	game.lines.clear()
	game.stage = "barn_choose"
	var stood: Vector2i = game.me.tile
	game.card.open("ripplet", game.card_info("ripplet"))
	check.call(game.card.visible and game.card.sel == 1, "WBL-14: the starter card still opens on Not yet")
	click(game, Vector2(30, 30))
	check.call(game.card.visible and game.stage == "barn_choose" and game.me.tile == stood and game.walk_to.is_empty(), "WBL-14: a click off the choice buttons does not choose and does not walk")
	click(game, game.card._btn(0).get_center())
	check.call(not game.card.visible and game.partner.id == "ripplet" and game.stage == "bonded" and game.walk_to.is_empty() and game.me.tile == stood, "WBL-14: a mouse click on Choose picks that starter and does not walk")
	game.lines.clear()
	game.stage = "barn_choose"
	game.card.open("mosshog", game.card_info("mosshog"))
	Input.emulate_mouse_from_touch = false
	tap(game, game.card._btn(0).get_center())
	check.call(not game.card.visible and game.partner.id == "mosshog" and game.walk_to.is_empty() and game.me.tile == stood, "WBL-14: a finger on Choose picks that starter and does not walk")
	Input.emulate_mouse_from_touch = emulate
	for action in ["move_down", "move_up", "move_left", "move_right"]:
		if Input.is_action_pressed(action):
			Input.action_release(action)
	game.free()
	host.process_mode = keep_mode
	host.get_tree().paused = false

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

static func key(game: Node, code: Key) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = true
	game.get_viewport().push_input(event)
	event = event.duplicate()
	event.pressed = false
	game.get_viewport().push_input(event)
