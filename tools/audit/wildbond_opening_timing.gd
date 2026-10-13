extends SceneTree
## WB-C2 input-only deterministic opening protocol. Use --fixed-fps 60.
## Simulated reading budget is a repeatable comparison, not a novice timing guarantee.
## No story-state writes, direct transition calls, skip-opening, or teleportation.
var main: Node
var method := "keyboard"
var folder := ""
var frames := 0
var events := 0
var transcript: Array = []
var milestones: Array = []
var failures: Array = []
var rendered := false
var starter_index := 0
var first_partner_seconds := -1.0

func _initialize() -> void:
	starter_index = int(OS.get_environment("OPENING_STARTER"))
	method = OS.get_environment("OPENING_METHOD")
	if method.is_empty(): method = "keyboard"
	folder = OS.get_environment("OPENING_OUTPUT")
	if folder.is_empty():
		push_error("Set OPENING_OUTPUT")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(folder)
	rendered = DisplayServer.get_name() != "headless"
	Input.emulate_touch_from_mouse = false
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	root.add_child(main)
	run.call_deferred()

func tick(n: int = 1) -> void:
	for i in n:
		await process_frame
		frames += 1

func pause(seconds: float) -> void:
	await tick(int(ceil(seconds * 60.0)))

func read_for(seconds: float) -> void:
	# The reading budget still advances every 60Hz game frame. Repainting identical
	# dialogue thousands of times only measures CI's software GPU; capture every
	# checkpoint and render all input/movement normally instead.
	if rendered: RenderingServer.set_render_loop_enabled(false)
	await pause(seconds)
	if rendered: RenderingServer.set_render_loop_enabled(true)
	await tick(2)

func key(code: int, down: bool) -> void:
	var e := InputEventKey.new()
	e.window_id = root.get_window_id()
	e.physical_keycode = code
	e.keycode = code
	e.pressed = down
	Input.parse_input_event(e)
	Input.flush_buffered_events()
	events += 1

func touch(p: Vector2, down: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.window_id = root.get_window_id()
	e.position = root.get_screen_transform() * p
	e.index = 0
	e.pressed = down
	Input.parse_input_event(e)
	Input.flush_buffered_events()
	events += 1

func tap(p: Vector2) -> void:
	# Real desktop cursor positioning is necessary for menu get_local_mouse_position.
	# This is X11-injected touch, not a physical mobile/browser test.
	if rendered:
		Input.warp_mouse(root.get_screen_transform() * p)
		await tick(4)
	touch(p, true)
	await tick()
	touch(p, false)
	await tick(2)

func press(code: int = KEY_ENTER) -> void:
	key(code, true)
	await tick()
	key(code, false)
	await tick()

func interact() -> void:
	if method == "touch":
		await tick(2)  # _thumbs_tick refreshes the context button after arrival.
		await tap(main.touch.BTN)
	else: await press()

func capture(label: String) -> void:
	milestones.append({"label": label, "seconds": frames / 60.0, "stage": main.stage, "map": main.map_name})
	print("OPENING ", label, " ", frames / 60.0, " ", main.stage)
	if rendered:
		await RenderingServer.frame_post_draw
		# Capture real display/window pixels, including scaling and letterboxing.
		var at := DisplayServer.window_get_position()
		var size := DisplayServer.window_get_size()
		var output: Array = []
		var result := OS.execute("import", ["-window", "root", "-crop", "%dx%d+%d+%d" % [size.x, size.y, at.x, at.y], "+repage", folder + "/" + label + ".png"], output, true)
		if result != 0: failures.append("Screenshot failed: " + label + str(output))

func move_to(goal: Vector2i, one_step := false) -> bool:
	var budget := 0
	while main.me.tile != goal and budget < 2400:
		budget += 1
		if main.trans_t >= 0.0: return true
		if not main.me.path.is_empty() or main.me.pos.distance_to(Vector2(main.me.tile) * main.TILE) >= 0.5:
			await tick()
			continue
		var path: Array = main.route(main.me.tile, goal)
		if path.is_empty():
			failures.append("No walkable input route to " + str(goal))
			return false
		var direction: Vector2i = path[0] - main.me.tile
		var code: int = KEY_RIGHT if direction.x > 0 else KEY_LEFT if direction.x < 0 else KEY_DOWN if direction.y > 0 else KEY_UP
		var before: Vector2i = main.me.tile
		if method == "touch": touch(main.touch.PAD + Vector2(direction) * main.touch.ARM, true)
		else: key(code, true)
		for i in 60:
			await tick()
			if not main.me.path.is_empty() or main.me.tile != before: break
		if method == "touch": touch(main.touch.PAD + Vector2(direction) * main.touch.ARM, false)
		else: key(code, false)
		await tick()
		while not main.me.path.is_empty(): await tick()
		if one_step: return true
	if budget >= 2400: failures.append("Movement timed out")
	return budget < 2400

func run() -> void:
	root.position = Vector2i.ZERO
	root.size = Vector2i(812, 375) if method == "touch" else Vector2i(1920, 1080)
	await tick(4)
	main.register.keep = false
	main.rng.seed = 20261013  # Identical wandering sequence seed for baseline and current.
	await capture("howto")
	await read_for(12.0)
	if method == "touch": await tap(Vector2(190, 100))
	else: await press()
	var loops := 0
	while main.team.is_empty() and loops < 100:
		loops += 1
		if main.register.visible:
			await capture("register")
			await read_for(30.0)
			if method == "touch": await tap(Vector2(270, 173))
			else:
				for i in 9: await press(KEY_DOWN)
				await press()
			if main.register.visible:
				failures.append("Register did not sign through input")
				break
		elif not main.lines.is_empty():
			if main.stage == "signed" and main.lines.size() == 1:
				await capture("signed-invitation")
			var line: Dictionary = main.lines[0].duplicate()
			var words := str(line.text).split(" ", false).size()
			var seconds := words / 3.0 + 0.75
			line.merge({"stage": main.stage, "words": words, "reading_seconds": seconds})
			transcript.append(line)
			await read_for(seconds)
			await interact()
		elif main.stage == "to_barn":
			await capture("follow-maren")
			if not await move_to(main.BARN_DOOR): break
			await pause(0.7)
		elif main.stage == "barn_choose":
			await capture("barn-choice")
			var starter = main.starters[starter_index]
			for attempt in 100:
				if main._starter_beside_me() == starter:
					await interact()
					if main.card.visible: break
				var best: Array = []
				var goal: Vector2i = main.me.tile
				for d in [Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP]:
					var candidate: Vector2i = starter.tile + d
					if not main.walkable(candidate): continue
					var ambiguous := false
					for other in main.starters:
						if other != starter and (candidate - other.tile).length() <= 1.01: ambiguous = true
					if ambiguous: continue
					var route: Array = main.route(main.me.tile, candidate)
					if not route.is_empty() and (best.is_empty() or route.size() < best.size()):
						best = route
						goal = candidate
				if best.is_empty():
					await tick(15)
				else:
					if not await move_to(goal, true): break
			if not main.card.visible:
				failures.append("Meeting input did not show card; player=" + str(main.me.tile) + " starter=" + str(starter.tile))
				break
			if main.card.id != starter.id:
				failures.append("Meeting opened a different starter")
				break
			await capture("partner-card")
			# Exercise safe decline and reopen without acquiring a partner.
			await read_for(2.0)
			if method == "touch": await tap(Vector2(312, 190))
			else: await press()
			if not main.team.is_empty() or main.card.visible:
				failures.append("Not yet did not decline safely")
				break
			await tick(6)
			await interact()
			if not main.card.visible:
				failures.append("Card did not reopen through input")
				break
			if main.card.sel != 1: failures.append("Card lost safe Not yet default")
			await read_for(12.0)
			if method == "touch": await tap(Vector2(230, 190))
			else:
				await press(KEY_LEFT)
				await pause(1.0)
				await press()
		else: await pause(0.5)
	if main.team.is_empty(): failures.append("No partner acquired")
	elif main.partner != main.starters[starter_index]: failures.append("Acquired a different starter")
	first_partner_seconds = frames / 60.0
	await capture("first-partner")
	while not main.lines.is_empty() and failures.is_empty():
		var line: Dictionary = main.lines[0].duplicate()
		var words := str(line.text).split(" ", false).size()
		var seconds := words / 3.0 + 0.75
		line.merge({"stage": main.stage, "words": words, "reading_seconds": seconds})
		transcript.append(line)
		await read_for(seconds)
		await interact()
	if main.stage != "walk_out": failures.append("Partner encounter did not return control")
	await capture("partner-control")
	var report := {"source_sha": OS.get_environment("SOURCE_SHA"), "main_sha256": FileAccess.get_sha256("res://scripts/main.gd"), "engine": Engine.get_version_info().string, "method": method, "display": DisplayServer.get_name(), "rendered": rendered, "window_size": [root.size.x, root.size.y], "protocol": "60Hz simulated elapsed time; wandering seed 20261013; redraw paused only during simulated reading budgets (all game frames still advance); how-to 12s; dialogue 180wpm + 0.75s each; character creator 30s; Not yet/reopen 2s; first partner card 12s; keyboard deliberate selection 1s; optimal read-only route navigation via actual keyboard/touch-pad inputs. Fresh New Game starts directly without saved-title menu. No novice guarantee or physical mobile claim.", "starter_index": starter_index, "partner_id": main.partner.id if main.partner else "", "first_partner_seconds": first_partner_seconds, "elapsed_seconds": frames / 60.0, "input_events": events, "partner_acquired": not main.team.is_empty(), "milestones": milestones, "transcript": transcript, "failures": failures}
	# Extra shape captures occur after both timing metrics are frozen.
	if rendered and method == "keyboard" and starter_index == 0:
		for size in [Vector2i(1366, 768), Vector2i(3440, 1440)]:
			root.size = size
			root.position = Vector2i.ZERO
			for i in 6: await process_frame
			await capture("partner-control-%dx%d" % [size.x, size.y])
	var f := FileAccess.open(folder + "/report.json", FileAccess.WRITE)
	f.store_string(JSON.stringify(report, "\t"))
	print("OPENING_RESULT ", JSON.stringify(report))
	main.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)
