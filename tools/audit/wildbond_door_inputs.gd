extends SceneTree
## Rendered regression for PR #177. Run under Xvfb; see wildbond-door-inputs.yml.
## Only initial positioning uses fixture state. Every tested transition enters through
## Input.parse_input_event, the normal input handlers, and the game loop. Never call
## _tap, _step, _go, or _switch to produce a tested entry, exit, or re-entry.
## Coordinate recipe: https://docs.godotengine.org/en/stable/tutorials/2d/2d_transforms.html#feeding-custom-input-events

const SIZES := [Vector2i(1920, 1080), Vector2i(812, 375)]
const METHODS := ["mouse", "touch", "keyboard"]
const BUILDINGS := {
	"inn": Vector2i(4, 4),
	"shop": Vector2i(7, 10),
	"pip_home": Vector2i(13, 4),
	"gran_home": Vector2i(2, 10),
	"barn": Vector2i(18, 4),
}
const DT := 1.0 / 60.0
const MAX_FRAMES := 240

class InputWitness extends Node2D:
	var events: Array = []
	var observing := false
	func _input(event: InputEvent) -> void:
		observe(event, "input")
	func _unhandled_input(event: InputEvent) -> void:
		observe(event, "unhandled_input")
	func observe(event: InputEvent, phase: String) -> void:
		if not observing:
			return
		var record := {"phase": phase, "kind": event.get_class(), "device": event.device}
		if event is InputEventMouseButton or event is InputEventScreenTouch:
			record["pressed"] = event.pressed
			record["viewport_position"] = [event.position.x, event.position.y]
			var world := get_global_mouse_position()
			record["world_mouse_position"] = [world.x, world.y]
		elif event is InputEventKey:
			record["pressed"] = event.pressed
			record["physical_keycode"] = event.physical_keycode
		else:
			return
		events.append(record)

var main: Node
var witness: InputWitness
var folder := ""
var failures: Array = []
var cases: Array = []
var captures: Array = []
var phone_diagnostics: Array = []
var current_case := ""
var active_key := 0

func _initialize() -> void:
	folder = OS.get_environment("DOOR_OUTPUT")
	if folder.is_empty():
		push_error("DOOR_OUTPUT must name the capture directory")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(folder)
	if DisplayServer.get_name() == "headless":
		push_error("This fixture requires a rendered display; use Xvfb, not --headless")
		quit(2)
		return
	main = load("res://scenes/main.tscn").instantiate()
	# Before _ready: do not load, overwrite, or create a player save/settings file.
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	witness = InputWitness.new()
	root.add_child(witness)
	run.call_deferred()

func xy(value: Vector2) -> Array:
	return [value.x, value.y]

func tiles(values: Array) -> Array:
	return values.map(func(value): return xy(Vector2(value)))

func check(condition: bool, message: String) -> bool:
	if not condition:
		failures.append({"case": current_case, "message": message})
		push_error(current_case + ": " + message)
	return condition

func wait_frames(count: int = 4) -> void:
	for frame in count:
		await process_frame

func key_event(code: int, pressed: bool) -> void:
	var event := InputEventKey.new()
	event.window_id = root.get_window_id()
	event.physical_keycode = code
	event.keycode = code
	event.pressed = pressed
	Input.parse_input_event(event)
	Input.flush_buffered_events()

func release_key() -> void:
	if active_key != 0:
		key_event(active_key, false)
		active_key = 0

func dismiss_arrival_dialogue() -> int:
	var count := 0
	while not main.lines.is_empty() and count < 30:
		key_event(KEY_E, true)
		key_event(KEY_E, false)
		count += 1
		await process_frame
	check(main.lines.is_empty(), "Arrival dialogue did not close through normal interact input")
	return count

func place_initial(door: Vector2i) -> void:
	# Position each independent scenario once. Exit and re-entry never teleport.
	main._set_map("larkhaven")
	var start := door + Vector2i(0, 2)
	main.me.where = "larkhaven"
	main.me.tile = start
	main.me.pos = Vector2(start) * main.TILE
	main.me.face = Vector2i.UP
	main.me.path.clear()
	main.walk_to.clear()
	main.meet_after = null
	main.trans_t = -1.0
	main.lines.clear()
	main.partner.where = "larkhaven"
	main.partner.tile = start + Vector2i.RIGHT
	main.partner.pos = Vector2(main.partner.tile) * main.TILE
	main.partner.path.clear()
	main._stop(main.partner)
	check(not main.solid(main.tile_at(start)) and not main._under_roof(start), "Player fixture starts on blocked terrain")
	check(not main.solid(main.tile_at(main.partner.tile)) and not main._under_roof(main.partner.tile), "Partner fixture starts on blocked terrain")
	main.cam.position = main.me.pos + Vector2(8, 8)
	main.cam.reset_smoothing()
	main.cam.force_update_scroll()

func refresh_render() -> void:
	main.place_t = 4.0
	main._thumbs_tick()
	main._update_ui()
	main.cam.force_update_scroll()
	main.queue_redraw()
	main.colour_layer.queue_redraw()
	main.canopy.queue_redraw()
	await wait_frames()
	await RenderingServer.frame_post_draw

func pointer_event(method: String, position: Vector2, pressed: bool) -> void:
	if method == "touch":
		var event := InputEventScreenTouch.new()
		event.window_id = root.get_window_id()
		event.index = 0
		event.position = position
		event.pressed = pressed
		Input.parse_input_event(event)
	else:
		var event := InputEventMouseButton.new()
		event.window_id = root.get_window_id()
		event.position = position
		event.global_position = position
		event.button_index = MOUSE_BUTTON_LEFT
		event.button_mask = MOUSE_BUTTON_MASK_LEFT if pressed else 0
		event.pressed = pressed
		Input.parse_input_event(event)
	Input.flush_buffered_events()

func state() -> Dictionary:
	return {
		"map": main.map_name, "stage": main.stage, "player": xy(Vector2(main.me.tile)),
		"partner": xy(Vector2(main.partner.tile)), "partner_map": main.partner.where,
		"partner_id": main.partner.id, "partner_instance": main.partner.get_instance_id(),
		"camera_position": xy(main.cam.position), "camera_screen_center": xy(main.cam.get_screen_center_position()),
		"canvas_transform": str(main.get_global_transform_with_canvas()),
		"screen_transform": str(root.get_screen_transform()),
		"walk_to": tiles(main.walk_to), "player_path": tiles(main.me.path),
		"transition": main.trans_t,
	}

func shot(label: String, requested: Vector2i) -> void:
	await refresh_render()
	var position := DisplayServer.window_get_position()
	var actual := DisplayServer.window_get_size()
	var filename := "%s-%dx%d.png" % [label, requested.x, requested.y]
	var output: Array = []
	var status := OS.execute("import", ["-window", "root", "-crop", "%dx%d+%d+%d" % [actual.x, actual.y, position.x, position.y], "+repage", folder + "/" + filename], output, true)
	check(status == 0 and FileAccess.file_exists(folder + "/" + filename), "Screenshot failed: " + filename + str(output))
	check(actual == requested, "Window has wrong size: " + str(actual))
	var record := state()
	record.merge({"file": filename, "case": current_case, "window_size": xy(Vector2(actual)), "window_position": xy(Vector2(position))})
	captures.append(record)
	print("DOOR_CAPTURE ", filename)

func transition(method: String, destination: String, goal: Vector2i, phase: String, size: Vector2i) -> bool:
	await dismiss_arrival_dialogue()
	await refresh_render()
	var before := state()
	var old_partner = main.partner
	var partner_start: Vector2 = main.partner.pos
	var world: Vector2 = Vector2(goal) * main.TILE + Vector2(8, 8)
	# Root window is pinned at (0,0); this is actual display/window pixel space.
	# Godot converts it back through stretch/letterboxing before _input.
	var viewport: Vector2 = main.get_global_transform_with_canvas() * world
	var screen: Vector2 = root.get_screen_transform() * viewport
	var expected_route: Array = main.route(main.me.tile, goal)
	var record := {
		"case": current_case, "method": method, "phase": phase, "expected_map": destination,
		"size": xy(Vector2(size)), "goal": xy(Vector2(goal)), "world_target": xy(world),
		"viewport_target": xy(viewport), "screen_target": xy(screen),
		"before": before, "route_candidate": tiles(expected_route),
		"goal_walkable": main.walkable(goal), "touch_buttons_visible": main.touch.visible,
		"phone_buttons_setting": main.settings.buttons(),
	}
	check(Rect2(Vector2.ZERO, Vector2(size)).has_point(screen), "Target falls outside rendered window")
	check(root.position == Vector2i.ZERO, "Input fixture requires window origin (0,0)")
	witness.events.clear()
	witness.observing = true
	if method == "keyboard":
		active_key = KEY_DOWN if phase == "exit" else KEY_UP
		key_event(active_key, true)
		check(Input.is_action_pressed("move_down" if phase == "exit" else "move_up"), "Physical key did not reach the named movement action")
	else:
		pointer_event(method, screen, true)
		pointer_event(method, screen, false)
		var actual_world: Vector2 = main.get_global_mouse_position()
		record["world_mouse_after_input"] = xy(actual_world)
		check(actual_world.distance_to(world) < 0.5, "Pointer screen/camera round trip did not select the target")
		check(not main.walk_to.is_empty() and main.walk_to.back() == goal, "Pointer input failed to queue the target door")
		record["queued_at_input"] = tiles(main.walk_to)
		var received_mouse := false
		var received_touch := false
		var reached_unhandled := false
		for event in witness.events:
			if not event.pressed:
				continue
			if event.kind == "InputEventScreenTouch" and event.phase == "input":
				received_touch = true
			if event.kind == "InputEventMouseButton":
				if event.phase == "input":
					received_mouse = true
					check(Vector2(event.viewport_position[0], event.viewport_position[1]).distance_to(viewport) < 0.5, "Mouse event was not transformed into expected viewport coordinates")
					if method == "touch":
						check(event.device == InputEvent.DEVICE_ID_EMULATION, "Touch case did not use Godot's emulated mouse")
				if event.phase == "unhandled_input":
					reached_unhandled = true
		check(received_mouse and reached_unhandled, "Click did not travel through _input and _unhandled_input")
		if method == "touch":
			check(received_touch and main.touch.touched, "Phone touch did not reach the touch controls")
	var followed_before_switch := false
	var transition_started := false
	var arrived := false
	var frames := 0
	for frame in MAX_FRAMES:
		main._process(DT)
		frames = frame + 1
		if main.map_name == before.map and main.partner.pos.distance_to(partner_start) > 0.5:
			followed_before_switch = true
		if main.trans_t >= 0.0:
			transition_started = true
			release_key()
		if main.map_name == destination and main.trans_t < 0.0 and main.me.path.is_empty():
			arrived = true
			break
		await process_frame
	release_key()
	witness.observing = false
	record["input_events"] = witness.events.duplicate(true)
	record["simulation_frames"] = frames
	record["transition_started"] = transition_started
	record["partner_followed_before_switch"] = followed_before_switch
	record["arrived"] = arrived
	check(arrived and transition_started, "Input did not complete the expected map transition")
	check(main.partner == old_partner, "Transition replaced the following partner")
	check(main.partner.where == main.map_name, "Partner did not arrive on the player's map")
	check(main.partner.tile.distance_to(main.me.tile) <= 1.5, "Partner did not arrive beside the player")
	if phase == "entry":
		check(followed_before_switch, "Partner did not follow the approach step before entering")
	if arrived:
		var expected_tile: Vector2i
		if phase == "exit":
			expected_tile = BUILDINGS[current_case.split("/")[1]] + Vector2i.DOWN
		else:
			expected_tile = (main.BARN_EXIT if destination == "barn" else main.INTERIORS[destination].exit) + Vector2i.UP
		check(main.me.tile == expected_tile, "Transition landed on the wrong player tile")
		record["arrival_dialogue_dismissed"] = await dismiss_arrival_dialogue()
	record["after"] = state()
	cases.append(record)
	await shot(current_case.replace("/", "-") + "-" + phase, size)
	write_report()
	return arrived

func phone_diagnostic(building: String, size: Vector2i, already_touched: bool) -> void:
	# Separately observe the normal auto-pad state. An intercepted tap is a reported
	# UI limitation, never counted as a successful door regression. No UI fix here.
	current_case = "%dx%d/%s/touch-auto-%s" % [size.x, size.y, building, "settled" if already_touched else "first"]
	var door: Vector2i = BUILDINGS[building]
	main.settings.values.buttons = 0
	main.touch.touched = already_touched
	place_initial(door)
	await shot(current_case.replace("/", "-") + "-before", size)
	var world: Vector2 = Vector2(door) * main.TILE + Vector2(8, 8)
	var viewport: Vector2 = main.get_global_transform_with_canvas() * world
	var screen: Vector2 = root.get_screen_transform() * viewport
	var pad_hit: bool = main.touch._on_pad(viewport)
	var button_hit: bool = main.touch._on_btn(viewport)
	var before := state()
	var controls_visible: bool = main.touch.visible
	witness.events.clear()
	witness.observing = true
	pointer_event("touch", screen, true)
	pointer_event("touch", screen, false)
	var queued := tiles(main.walk_to)
	await process_frame  # Also deliver any deferred phone Interact action.
	var reached_unhandled := false
	for event in witness.events:
		if event.kind == "InputEventMouseButton" and event.pressed and event.phase == "unhandled_input":
			reached_unhandled = true
	var input_events := witness.events.duplicate(true)
	witness.observing = false
	var arrived := false
	for frame in MAX_FRAMES:
		main._process(DT)
		if main.map_name == building and main.trans_t < 0.0:
			arrived = true
			break
		if main.walk_to.is_empty() and main.me.path.is_empty() and main.trans_t < 0.0:
			break
		await process_frame
	var status := "entered" if arrived else "failed-other"
	if not arrived and not reached_unhandled and (pad_hit or button_hit):
		status = "intercepted-by-phone-controls"
	check(status != "failed-other", "Default phone diagnostic failed for a reason other than a verified control hit")
	check(main.get_global_mouse_position().distance_to(world) < 0.5 or arrived, "Phone diagnostic input transform was wrong")
	phone_diagnostics.append({
		"case": current_case, "building": building, "size": xy(Vector2(size)),
		"phone_buttons_setting": "auto", "previous_touch": already_touched,
		"controls_visible_before": controls_visible, "target_hits_pad": pad_hit, "target_hits_button": button_hit,
		"screen_target": xy(screen), "viewport_target": xy(viewport), "world_target": xy(world),
		"mouse_reached_unhandled_input": reached_unhandled, "queued_at_input": queued,
		"input_events": input_events, "arrived": arrived, "status": status,
		"before": before, "after": state(),
	})
	await shot(current_case.replace("/", "-") + "-after", size)
	write_report()
	print("PHONE_AUTO_DIAGNOSTIC ", current_case, ": ", status)

func write_report() -> void:
	var report := {
		"schema": 1, "source_sha": OS.get_environment("SOURCE_SHA"),
		"engine": Engine.get_version_info(), "display_server": DisplayServer.get_name(),
		"input_method": "Input.parse_input_event with physical keys or camera/stretch-transformed screen coordinates",
		"touch_method": "InputEventScreenTouch, engine emulate_mouse_from_touch, normal touch-pad listener and unhandled-input pipeline; Phone buttons: Never",
		"scope_note": "Direct tap-to-walk with the supported Phone buttons: Never setting. Visible corner D-pad occlusion is a separate UI concern; physical mobile-browser behavior is not tested.",
		"fixture": "Authored _skip_opening; no_save and settings.keep=false before scene enters tree; actors retained; only initial approach positioning",
		"emulate_mouse_from_touch": Input.is_emulating_mouse_from_touch(),
		"emulate_touch_from_mouse": Input.is_emulating_touch_from_mouse(),
		"cases": cases, "captures": captures, "failures": failures,
		"phone_diagnostics": phone_diagnostics,
		"expected_transitions": SIZES.size() * METHODS.size() * BUILDINGS.size() * 3,
	}
	var file := FileAccess.open(folder + "/manifest.json", FileAccess.WRITE)
	if file == null:
		push_error("Cannot write manifest")
		quit(2)
		return
	file.store_string(JSON.stringify(report, "  ") + "\n")
	file.close()

func run() -> void:
	main._skip_opening()
	main.set_process(false)
	main.battle.set_process(false)
	main.stage = "free"
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	main.painted = true
	main.spilled = true
	main.rng.seed = 177
	for panel in [main.register, main.card, main.title, main.howto, main.lessons, main.battle, main.shop, main.book]:
		panel.visible = false
	# Keep normal HUD/phone controls and every resident/creature in the real scene.
	main.lines.clear()
	main.restore.clear()
	for name in ["larkhaven", "barn"] + main.INTERIORS.keys():
		main.restore.append({"where": name, "at": Vector2(192, 108), "r": 5000.0, "goal": 5000.0})
	root.borderless = true
	root.min_size = Vector2i.ONE
	root.position = Vector2i.ZERO
	Input.use_accumulated_input = false
	# Godot's standard phone path: touch -> emulated mouse, without mouse -> touch recursion.
	check(Input.is_emulating_mouse_from_touch(), "Project must enable its normal mouse-from-touch path")
	Input.emulate_touch_from_mouse = false
	for size in SIZES:
		root.size = size
		root.grab_focus()
		await wait_frames(8)
		for method in METHODS:
			main.settings.values.buttons = 2  # Supported "Never" setting isolates tap-to-walk from corner D-pad hit areas.
			for building in BUILDINGS:
				current_case = "%dx%d/%s/%s" % [size.x, size.y, building, method]
				var door: Vector2i = BUILDINGS[building]
				place_initial(door)
				await shot(current_case.replace("/", "-") + "-approach", size)
				if not await transition(method, building, door, "entry", size):
					continue
				var exit_tile: Vector2i = main.BARN_EXIT if building == "barn" else main.INTERIORS[building].exit
				if not await transition(method, "larkhaven", exit_tile, "exit", size):
					continue
				await transition(method, building, door, "reentry", size)
	for size in SIZES:
		root.size = size
		await wait_frames(8)
		for building in BUILDINGS:
			for already_touched in [false, true]:
				await phone_diagnostic(building, size, already_touched)
	check(cases.size() == SIZES.size() * METHODS.size() * BUILDINGS.size() * 3, "Some transition cases were never reached")
	write_report()
	print("DOOR_INPUT_REVIEW: ", cases.size(), " transitions, ", captures.size(), " captures, ", failures.size(), " failures")
	main.queue_free()
	witness.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)
