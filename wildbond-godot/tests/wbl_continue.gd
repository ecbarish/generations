extends SceneTree
## WBL-9, WBL-10 and WBL-16: a journey that really starts, walks out of Larkhaven onto the Thornwood road, is quit, and is
## continued through the title screen, landing in the same place. Nothing here loads a fixture file: the save is the one
## the game wrote itself (autosave, or the window closing), and Continue is pressed on the title page with a real key,
## a mouse click and a touch. run_tests.gd calls run(). It can also run by itself:
##   godot --headless --path wildbond-godot --script res://tests/wbl_continue.gd
## The four road gaps are real checks now. A miss fails the run.
const SAVE := "user://wbl_continue.json"

var passed := 0
var failed := 0
var gaps_open: Array[String] = []

func check(ok: bool, what: String) -> void:
	if ok:
		passed += 1
	else:
		failed += 1
		print("FAIL: ", what)

func gap(ok: bool, what: String) -> void:
	check(ok, what)

func _initialize() -> void:
	_go.call_deferred()

func _go() -> void:
	run(root, check, gap)
	print("Wildbond Continue checks: %d passed, %d failed, %d gaps reproduced in main.gd" % [passed, failed, gaps_open.size()])
	quit(1 if failed > 0 else 0)

static func fresh(root: Window, keep_saves: bool) -> Node:
	var game: Node = load("res://scenes/main.tscn").instantiate()
	game.save_path = SAVE
	game.no_save = not keep_saves
	game.settings.keep = false
	game.show_howto = false
	root.add_child(game)
	game.register.keep = false
	game.sfx.on = false
	game.set_process(false)
	game.battle.set_process(false)
	game.rng.seed = 20261015
	game.battle.rng.seed = 20261015
	return game

static func tick(game: Node, seconds: float) -> void:
	for i in int(seconds / 0.05):
		game._process(0.05)
		game.battle._process(0.05)

static func talk(game: Node) -> void:
	var guard := 0
	while not game.lines.is_empty() and guard < 60:
		game.advance()
		guard += 1

static func walk(game: Node, goal: Vector2i) -> bool:
	game.walk_to = game.route(game.me.tile, goal)
	for i in 600:
		tick(game, 0.05)
		if game.me.tile == goal and game.me.path.is_empty():
			return true
		if game.walk_to.is_empty() and game.me.path.is_empty() and i % 10 == 9:
			game.walk_to = game.route(game.me.tile, goal)
	return false

## The opening, played as the real game plays it, up to the moment you are free in Larkhaven with a partner beside you.
static func play_opening(game: Node, starter: String) -> void:
	talk(game)
	tick(game, 6.0)
	talk(game)
	game.register.name_text = "Roadie"
	game.register.sign_it()
	talk(game)
	walk(game, game.BARN_DOOR + Vector2i.DOWN)
	game._step(Vector2i.UP)
	tick(game, 1.0)
	talk(game)
	for s in game.starters:
		if s.id == starter:
			game._meet(s)
	game.card._close(true)
	talk(game)
	walk(game, game.BARN_EXIT + Vector2i.UP)
	game._step(Vector2i.DOWN)
	tick(game, 1.0)
	talk(game)
	for i in 300:
		tick(game, 0.05)
		if game.stage == "rival1":
			break
	talk(game)
	var bt: Control = game.battle
	for i in 4000:
		tick(game, 0.05)
		if bt.state == "choose":
			bt._choose(0)
			var mv: Array = game.R.moves_of(bt.wait_u.c).filter(func(m): return bt.wait_u.cds.get(m, 0.0) <= 0)
			mv.sort_custom(func(a, b): return bt.best_value(a) > bt.best_value(b))
			bt._use_move(mv[0])
		if bt.state == "results":
			break
	bt._go_to("fog_out")
	tick(game, 1.5)
	talk(game)

## Everything a player would notice on coming back: where they are, who is with them, what they carry and the story so far.
static func snapshot(game: Node) -> Dictionary:
	return {
		"map": game.map_name, "tile": game.me.tile, "stage": game.stage,
		"partner": game.partner.id if game.partner else "", "partner_where": game.partner.where if game.partner else "",
		"team": JSON.stringify(game.team), "ranch": JSON.stringify(game.ranch), "bag": JSON.stringify(game.bag),
		"badges": JSON.stringify(game.badges), "seen": JSON.stringify(game.seen), "story": JSON.stringify(game.story_done),
		"name": str(game.my_look.get("name", "")), "wren": game.wren.where, "spilled": game.spilled,
		"objective": game.next_objective(),
	}

static func differences(a: Dictionary, b: Dictionary) -> Array:
	var out: Array = []
	for k in a:
		if a[k] != b.get(k):
			out.append("%s: %s became %s" % [k, str(a[k]).left(60), str(b.get(k)).left(60)])
	return out

static func key_event(code: Key, down := true) -> InputEvent:
	var e := InputEventKey.new()
	e.physical_keycode = code
	e.keycode = code
	e.pressed = down
	return e

## Presses Continue on the title page the way a player does, with the Enter key through the viewport.
static func press_continue(game: Node) -> void:
	var vp := game.get_viewport()
	vp.push_input(key_event(KEY_ENTER, true))
	vp.push_input(key_event(KEY_ENTER, false))

## Starts a journey that saves itself, then returns the game still running on the Thornwood road.
static func journey_to_road(root: Window, starter: String) -> Node:
	var game := fresh(root, true)
	game.title.visible = false
	play_opening(game, starter)
	tick(game, 8.0)                                # Wren runs off up the road first, as he does for a player
	return game

static func wipe() -> void:
	for f in ["", ".bak", ".tmp"]:
		var p := ProjectSettings.globalize_path(SAVE + f)
		if FileAccess.file_exists(SAVE + f):
			DirAccess.remove_absolute(p)

## Holds the real Up key for up to `seconds`, stopping early when the map changes or `stop_on_map` is reached.
static func hold_up(game: Node, seconds: float, until_map := "") -> void:
	Input.action_press("move_up")
	for i in int(seconds / 0.05):
		tick(game, 0.05)
		if until_map != "" and game.map_name == until_map and game.trans_t < 0.0:
			break
	Input.action_release("move_up")

static func click_continue(game: Node, touch: bool) -> void:
	var vp := game.get_viewport()
	var at: Vector2 = vp.get_final_transform() * Vector2(192, 115)   # the middle of "Continue your journey"
	for down in [true, false]:
		var e: InputEvent
		if touch:
			var t := InputEventScreenTouch.new()
			t.index = 0
			t.pressed = down
			t.window_id = vp.get_window_id()
			t.position = at
			e = t
		else:
			var m := InputEventMouseButton.new()
			m.button_index = MOUSE_BUTTON_LEFT
			m.pressed = down
			m.position = at
			e = m
		vp.push_input(e)

## Quits as a player does: "close" is the window closing, which writes a save. "autosave" is killed with no warning at
## all (power cut, a tab dying), so the save is the last automatic one. Then the next launch opens on the title page.
static func quit_and_relaunch(root: Window, game: Node, how: String) -> Node:
	if how == "close":
		game.propagate_notification(Node.NOTIFICATION_WM_CLOSE_REQUEST)
	game.free()
	return fresh(root, true)

static func run(root: Window, check: Callable, gap: Callable) -> void:
	Input.emulate_touch_from_mouse = false
	Input.emulate_mouse_from_touch = false
	for starter in ["ripplet", "cindercub", "mosshog"]:
		for how in ["close", "autosave"]:
			_one_journey(root, starter, how, check)
	_click_paths(root, check)
	_unfinished_opening(root, check)
	_gaps(root, gap)
	wipe()

## WBL-10: start a journey, walk it onto the Thornwood road, quit, come back, press Continue, and be in the same place.
static func _one_journey(root: Window, starter: String, how: String, check: Callable) -> void:
	var label := "WBL-10 %s/%s" % [starter, how]
	wipe()
	var game := journey_to_road(root, starter)
	check.call(game.stage == "free" and game.map_name == "larkhaven" and game.wren.where == "gone", label + ": the opening ends with you free in Larkhaven and Wren gone up the road")
	walk(game, Vector2i(10, 3))
	hold_up(game, 6.0, "thornwood_route")
	check.call(game.map_name == "thornwood_route" and game.me.where == "thornwood_route", label + ": holding Up from the road mouth leads onto Thornwood Trail")
	hold_up(game, 0.4)                               # a few steps along the trail
	tick(game, 6.0)                                  # long enough for the game's own autosave to have run on the trail
	var before := snapshot(game)
	var spot: Vector2i = game.me.tile
	var relaunched := quit_and_relaunch(root, game, how)
	check.call(relaunched.title.visible and "Thornwood Trail" in relaunched.title.summary and relaunched.title.summary.begins_with("Roadie and"),
		label + ": the next launch opens the title page, and it says where you are (%s)" % relaunched.title.summary)
	check.call(relaunched.lines.is_empty() and relaunched.stage == "intro", label + ": the story does not begin again behind the title page")
	press_continue(relaunched)
	tick(relaunched, 2.0)
	check.call(not relaunched.title.visible, label + ": Continue closes the title page")
	var after := snapshot(relaunched)
	var diff := differences(before, after)
	check.call(diff.is_empty(), label + ": Continue lands in the same place with the same journey (%s)" % str(diff))
	check.call(relaunched.map_name == "thornwood_route" and relaunched.me.tile == spot, label + ": it is Thornwood Trail, on the tile you left (%s, was %s)" % [relaunched.me.tile, spot])
	check.call(relaunched.partner != null and relaunched.partner.where == "thornwood_route" and (relaunched.partner.tile - relaunched.me.tile).length() <= 1.5, label + ": your partner is beside you")
	check.call(relaunched.wren.where == "gone" and relaunched.maren.where == "larkhaven", label + ": Wren is still off up the road, and Maren is home")
	talk(relaunched)
	var here: Vector2i = relaunched.me.tile
	hold_up(relaunched, 0.4)
	check.call(relaunched.me.tile != here, label + ": after Continue you can walk on")
	relaunched.free()

static func _click_paths(root: Window, check: Callable) -> void:
	for mode in ["mouse", "touch"]:
		wipe()
		var game := journey_to_road(root, "ripplet")
		walk(game, Vector2i(10, 3))
		hold_up(game, 6.0, "thornwood_route")
		var relaunched := quit_and_relaunch(root, game, "close")
		check.call(relaunched.title.visible, "WBL-9 %s: the title page waits for you" % mode)
		click_continue(relaunched, mode == "touch")
		tick(relaunched, 2.0)
		check.call(not relaunched.title.visible and relaunched.map_name == "thornwood_route" and relaunched.stage == "free", "WBL-9 %s: clicking Continue your journey returns to Thornwood Trail" % mode)
		relaunched.free()
	# A save that is only a page-load away: nothing should start a new journey until the player chooses it.
	wipe()
	var g := journey_to_road(root, "ripplet")
	var r := quit_and_relaunch(root, g, "close")
	r.title._pick(1)
	check.call(r.title.visible and r.title.confirm_new and r.stage == "intro", "WBL-9: Start a new journey asks a second time and keeps the saved one")
	check.call(FileAccess.file_exists(SAVE), "WBL-9: the saved journey is still on disk after only one press on Start a new journey")
	r.free()

## The opening is never saved half-way, so quitting before you are free in Larkhaven starts the opening again.
static func _unfinished_opening(root: Window, check: Callable) -> void:
	wipe()
	var game := fresh(root, true)
	talk(game)
	tick(game, 6.0)
	talk(game)
	game.register.name_text = "Early"
	game.register.sign_it()
	talk(game)
	game.propagate_notification(Node.NOTIFICATION_WM_CLOSE_REQUEST)
	check.call(not FileAccess.file_exists(SAVE), "WBL-9: quitting during the opening writes no half-finished journey")
	game.free()
	var again := fresh(root, true)
	check.call(not again.title.visible and not again.lines.is_empty(), "WBL-9: with no saved journey the game opens on the story, not on Continue")
	again.free()

## What this test found in scripts/main.gd. The Wildbond fix bundle owns that file, so these are reported, not changed.
static func _gaps(root: Window, gap: Callable) -> void:
	# 1. Larkhaven's goal before the first catch names tall grass the village does not have, and not the road to it.
	wipe()
	var game := journey_to_road(root, "ripplet")
	game._update_ui()
	gap.call("north road" in game.objective.line and "Thornwood" in game.objective.line,
		"before the first catch, Larkhaven's goal says '%s' and never names the north road (next_objective in main.gd)" % game.objective.line)
	game.free()
	# 2. Quit a moment after crossing the road with no warning: the crossing was never saved, so Continue is a map behind.
	wipe()
	game = journey_to_road(root, "ripplet")
	walk(game, Vector2i(10, 3))
	game.save_t = 0.0                                # the last autosave was just before the road
	hold_up(game, 6.0, "thornwood_route")
	tick(game, 0.7)
	var relaunched := quit_and_relaunch(root, game, "autosave")
	gap.call(relaunched.title.visible and "Thornwood Trail" in relaunched.title.summary,
		"killed under a second after crossing onto Thornwood Trail, Continue says '%s' (the save waits for the next five-second tick; _autosave in main.gd)" % relaunched.title.summary)
	relaunched.free()
	# 3. The tab hidden or the app switched away is not a close request, and nothing saves on it.
	wipe()
	game = journey_to_road(root, "ripplet")
	walk(game, Vector2i(10, 3))
	game.save_t = 0.0
	hold_up(game, 6.0, "thornwood_route")
	tick(game, 0.7)
	game.propagate_notification(Node.NOTIFICATION_WM_WINDOW_FOCUS_OUT)
	relaunched = quit_and_relaunch(root, game, "autosave")
	gap.call(relaunched.title.visible and "Thornwood Trail" in relaunched.title.summary,
		"hiding the tab right after crossing onto Thornwood Trail, Continue says '%s' (a browser tab or phone app never sends the close request; _notification in main.gd)" % relaunched.title.summary)
	relaunched.free()
	# 4. The first click on the road after Wren's battle does nothing: Wren is still standing on the way, and the
	#    walk is dropped without a word. A second click, a few seconds later, works.
	wipe()
	game = fresh(root, true)
	game.title.visible = false
	play_opening(game, "ripplet")
	var mouth := Vector2i(game.cur_map()[0].find("N"), 0)
	game._tap(Vector2(mouth) * game.TILE + Vector2(8, 8))
	for i in 160:
		tick(game, 0.05)
		if game.map_name != "larkhaven":
			break
	gap.call(game.map_name != "larkhaven",
		"the first click on the north road right after Wren's battle walks nowhere: Wren stands on the route and main.gd drops the walk without a word (now %s at %s)" % [game.map_name, game.me.tile])
	game.free()
