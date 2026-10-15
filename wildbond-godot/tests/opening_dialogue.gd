extends RefCounted
## WB-FUNNEL1: immediate opening dialogue through the real viewport input pipeline.
## Fixtures enter each existing story phase; all advancement is input, never advance().
const MODES := ["enter", "e", "space", "keypad", "gamepad", "mouse", "bubble", "native", "emulated"]
const KEYS := { "enter": KEY_ENTER, "e": KEY_E, "space": KEY_SPACE, "keypad": KEY_KP_ENTER }

static func run(host: Node, check: Callable) -> void:
	var root := host.get_tree().root
	var old_mode := host.process_mode
	var old_mouse := Input.emulate_mouse_from_touch
	var old_touch := Input.emulate_touch_from_mouse
	var old_touch_hint := Controls.touch
	# An older scene must not consume the test scene's real input events.
	host.process_mode = Node.PROCESS_MODE_DISABLED
	Input.emulate_touch_from_mouse = false
	for mode in MODES:
		for family in ["farm", "coast", "highland", "wander"]:
			for starter in ["cindercub", "ripplet", "mosshog"]:
				var game := fresh(root)
				Input.emulate_mouse_from_touch = mode == "emulated"
				journey(game, mode, family, starter, check)
				game.free()
	var game := fresh(root)
	Input.emulate_mouse_from_touch = false
	callbacks(game, check)
	modal_guards(game, check)
	modal_handoffs(game, check)
	mouse_emulation(game, check)
	game.free()
	Input.emulate_mouse_from_touch = old_mouse
	Input.emulate_touch_from_mouse = old_touch
	Controls.touch = old_touch_hint
	host.process_mode = old_mode

static func fresh(root: Window) -> Node:
	var game: Node = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	game.settings.keep = false
	game.show_howto = false
	root.add_child(game)
	game.register.keep = false
	game.sfx.on = false                         # thousands of same-frame presses need no overlapping audio
	game.set_process(false)
	game.battle.set_process(false)
	game.rng.seed = 20261014
	game.battle.rng.seed = 20261014
	return game

static func journey(game: Node, mode: String, family: String, starter: String, check: Callable) -> void:
	var label := "WB-FUNNEL1 %s/%s/%s" % [mode, family, starter]
	drain(game, mode, "maren_walks", label + " intro", check)
	game.maren.path.clear()
	game.maren.pos = Vector2(game.maren.tile) * game.TILE
	game._process(0.0)
	check.call(game.stage == "maren_talks", label + ": Maren arrives")
	drain(game, mode, "register", label + " greeting", check)
	check.call(game.register.visible and game.register.row == 0, label + ": greeting opens the register without choosing a row")
	# Character/starter choices themselves remain unchanged and outside this task.
	game.register.visible = false
	var look: Dictionary = game.register.look()
	look.heritage = family
	game._on_signed(look)
	check.call(game.lines.size() == 4, label + ": all four signed lines remain")
	drain(game, mode, "to_barn", label + " signed", check)
	game.trans_to = "barn"
	game._switch()
	drain(game, mode, "barn_choose", label + " barn greeting", check)
	check.call(not game.card.visible and game.team.is_empty(), label + ": barn greeting does not choose a starter")
	game._on_chosen(starter)
	check.call(game.lines.size() == 7 and game.lines.any(func(line): return line.text == game.HERITAGES[family].tale), label + ": every bond line and heritage tale remains")
	drain(game, mode, "walk_out", label + " bonded", check)
	game.trans_to = "larkhaven"
	game._switch()
	drain(game, mode, "wren_runs", label + " spill", check)
	game.wren.path.clear()
	game.wren.pos = Vector2(game.wren.tile) * game.TILE
	game._process(0.0)
	check.call(game.stage == "rival1", label + ": Wren arrives")
	drain(game, mode, "battle", label + " rival", check)
	check.call(game.battle.visible and game.battle.state == "fog_in", label + ": last rival line opens battle without selecting a move")
	for outcome in ["won", "lost"]:
		game.battle.visible = false
		game.battle_story = "rival1"
		game._on_battle_result(outcome)
		drain(game, mode, "free", label + " after rival " + outcome, check)
	check.call(game.partner.id == starter and game.team.size() == 1 and game.heritage() == family, label + ": fast-forward preserves partner and heritage")

static func drain(game: Node, mode: String, next_stage: String, label: String, check: Callable) -> void:
	var expected: Array = game.lines.duplicate(true)
	var stage: String = game.stage
	check.call(not expected.is_empty(), label + ": dialogue exists")
	# No elapsed game time between any of these presses: no reading/reveal cooldown.
	for i in expected.size():
		check.call(not game.lines.is_empty() and game.lines[0] == expected[i], label + ": line %d is in order" % (i + 1))
		game._thumbs_tick()
		game._update_ui()
		var event := event_for(game, mode, true)
		dispatch(game, mode, event)
		check.call(game.lines.size() == expected.size() - i - 1, label + ": fresh press advances exactly line %d immediately" % (i + 1))
		var after: Array = game.lines.duplicate(true)
		if event is InputEventKey:
			var echo := event.duplicate()
			echo.echo = true
			dispatch(game, mode, echo)
			check.call(game.lines == after, label + ": held-key echo does not advance")
		event.pressed = false
		dispatch(game, mode, event)
		check.call(game.lines == after, label + ": release does not advance")
		if i + 1 < expected.size():
			check.call(game.stage == stage, label + ": phase waits for its final line")
	check.call(game.lines.is_empty() and game.stage == next_stage, label + ": final line completes the phase once")

static func event_for(game: Node, mode: String, down: bool) -> InputEvent:
	if KEYS.has(mode):
		var event := InputEventKey.new()
		event.physical_keycode = KEYS[mode]
		event.keycode = KEYS[mode]
		event.pressed = down
		return event
	if mode == "gamepad":
		var event := InputEventJoypadButton.new()
		event.button_index = JOY_BUTTON_A
		event.pressed = down
		return event
	var at := Vector2(192, 100)
	if mode == "bubble": at = game.bubble.get_global_rect().get_center()
	if mode in ["native", "emulated"]:
		var event := InputEventScreenTouch.new()
		event.index = 0
		event.pressed = down
		event.window_id = game.get_viewport().get_window_id()
		event.position = game.get_viewport().get_screen_transform() * at if mode == "emulated" else game.get_viewport().get_final_transform() * at
		return event
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = down
	event.position = game.get_viewport().get_final_transform() * at
	return event

static func dispatch(game: Node, mode: String, event: InputEvent) -> void:
	if mode == "emulated":
		# parse_input_event generates BOTH mouse and touch, in real engine order.
		# push_input intentionally does not emulate, so it exercises native-only too.
		Input.parse_input_event(event.duplicate())
		Input.flush_buffered_events()
	else:
		game.get_viewport().push_input(event)

static func press(game: Node, mode: String) -> void:
	var event := event_for(game, mode, true)
	dispatch(game, mode, event)
	event.pressed = false
	dispatch(game, mode, event)

static func callbacks(game: Node, check: Callable) -> void:
	for mode in MODES:
		Input.emulate_mouse_from_touch = mode == "emulated"
		game.lines.clear()
		game.stage = "intro"
		var calls := [0]
		game.say("", "Before the callback.")
		game.then_do = func():
			calls[0] += 1
			game.say("maren", "The callback's new first line.")
			game.say("maren", "The callback's second line.")
		game._thumbs_tick()
		press(game, mode)
		check.call(calls[0] == 1 and not game.then_do.is_valid() and game.lines.size() == 2 and game.lines[0].text == "The callback's new first line.", "WB-FUNNEL1 %s: a queued callback runs once and its first line survives the press/release" % mode)
		check.call(game.stage == "intro", "WB-FUNNEL1 %s: callback takes precedence over the phase transition" % mode)
		press(game, mode)
		check.call(calls[0] == 1 and game.lines.size() == 1, "WB-FUNNEL1 %s: callback dialogue advances without invoking it twice" % mode)
		press(game, mode)
		check.call(calls[0] == 1 and game.lines.is_empty() and game.stage == "maren_walks", "WB-FUNNEL1 %s: callback queue finishes normally" % mode)

static func modal_guards(game: Node, check: Callable) -> void:
	Input.emulate_mouse_from_touch = false
	game.stage = "intro"
	game.lines.clear()
	game.say("", "Still underneath the menu.")
	var panels := { "how-to": game.howto, "title": game.title, "register": game.register, "starter card": game.card, "battle": game.battle, "book": game.book, "shop": game.shop, "lessons": game.lessons, "turn phone": game.turn_card }
	for label in panels:
		var panel: Control = panels[label]
		panel.visible = true
		game._thumbs_tick()
		press(game, "native")
		check.call(game.lines.size() == 1 and game.stage == "intro", "WB-FUNNEL1: native touch does not advance behind " + label)
		panel.visible = false
	game._thumbs_tick()
	var drag := InputEventScreenDrag.new()
	drag.position = Vector2(192, 100)
	game.get_viewport().push_input(drag)
	var right := InputEventMouseButton.new()
	right.button_index = MOUSE_BUTTON_RIGHT
	right.pressed = true
	game.get_viewport().push_input(right)
	check.call(game.lines.size() == 1, "WB-FUNNEL1: dragging and right-clicking do not skip dialogue")
	press(game, "native")
	check.call(game.lines.is_empty(), "WB-FUNNEL1: native touch resumes immediately when the overlay closes")
	game.say("maren", "Touch the bubble itself.")
	game.say("maren", "The next line remains.")
	game._thumbs_tick()
	game._update_ui()
	var bubble_tap := event_for(game, "native", true)
	bubble_tap.position = game.get_viewport().get_final_transform() * game.bubble.get_global_rect().get_center()
	dispatch(game, "native", bubble_tap)
	bubble_tap.pressed = false
	dispatch(game, "native", bubble_tap)
	check.call(game.bubble.mouse_filter == Control.MOUSE_FILTER_IGNORE and game.lines.size() == 1, "WB-FUNNEL1: native bubble taps preserve WB-C3 passthrough")

static func modal_handoffs(game: Node, check: Callable) -> void:
	# The default emulated path must retain existing protected menu-to-dialogue edges.
	for mode in ["enter", "emulated"]:
		Input.emulate_mouse_from_touch = mode == "emulated"
		game.lines.clear()
		game.stage = "register"
		game.register.open()
		game.register.row = game.register.SIGN_ROW
		var event := event_for(game, mode, true)
		if mode == "emulated": event.position = game.get_viewport().get_screen_transform() * Vector2(270, 173)
		dispatch(game, mode, event)
		event.pressed = false
		dispatch(game, mode, event)
		check.call(not game.register.visible and game.stage == "signed" and game.lines.size() == 4, "WB-FUNNEL1 %s: signing does not consume the first signed line" % mode)
		game.lines.clear()
		game.stage = "barn_choose"
		game.card.open("ripplet", game.card_info("ripplet"))
		check.call(game.card.sel == 0, "WB-FUNNEL1 %s: the starter card opens on Choose" % mode)
		game.card.sel = 0
		event = event_for(game, mode, true)
		if mode == "emulated": event.position = game.get_viewport().get_screen_transform() * Vector2(230, 190)
		dispatch(game, mode, event)
		event.pressed = false
		dispatch(game, mode, event)
		check.call(not game.card.visible and game.stage == "bonded" and game.lines.size() == 7, "WB-FUNNEL1 %s: choosing preserves the first bond line" % mode)

static func mouse_emulation(game: Node, check: Callable) -> void:
	# Desktop touch emulation produces the reverse pair: mouse plus synthetic touch.
	Input.emulate_mouse_from_touch = false
	Input.emulate_touch_from_mouse = true
	game.lines.clear()
	game.stage = "intro"
	game.say("", "One physical click.")
	game.say("", "This line must remain.")
	game._thumbs_tick()
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = game.get_viewport().get_screen_transform() * Vector2(192, 100)
	Input.parse_input_event(event)
	Input.flush_buffered_events()
	var release := event.duplicate()
	release.pressed = false
	Input.parse_input_event(release)
	Input.flush_buffered_events()
	check.call(game.lines.size() == 1, "WB-FUNNEL1: mouse-to-touch emulation does not double-advance a physical click")
	Input.emulate_touch_from_mouse = false
