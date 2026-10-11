extends SceneTree
## Actual-renderer SF2.6c evidence. Never writes a player's save.
const SIZES := [Vector2i(1920, 1080), Vector2i(1366, 768), Vector2i(812, 375), Vector2i(3440, 1440)]
var game: Node
var out := OS.get_environment("OPENING_OUTPUT")
var baseline := OS.get_environment("OPENING_BASELINE") == "1"
var report := {"captures": [], "errors": [], "source": OS.get_environment("SOURCE_SHA")}

func _initialize() -> void:
	run.call_deferred()

func check(ok: bool, label: String) -> void:
	if not ok:
		report.errors.append(label)
		push_error(label)

func settle() -> void:
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	await create_timer(0.08).timeout

func run() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	check(DisplayServer.get_name() != "headless", "real display required")
	if not report.errors.is_empty():
		finish()
		return
	report.engine = Engine.get_version_info().string
	report.display = DisplayServer.get_name()
	game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	root.add_child(game)
	game.set_process(false)
	game.music_on = false
	root.mode = Window.MODE_WINDOWED
	root.borderless = true
	root.position = Vector2i.ZERO
	var spawn: Vector2i = game.me.tile
	report.spawn = [spawn.x, spawn.y]
	var introduction: Array = game.lines.duplicate(true)
	for size in SIZES:
		root.size = size
		root.position = Vector2i.ZERO
		await settle()
		game.me.tile = spawn
		game.me.pos = Vector2(spawn) * game.TILE
		game.cam.position = game.me.pos + Vector2(8, 8)
		game.cam.reset_smoothing()
		game.cam.force_update_scroll()
		game.lines = introduction.duplicate(true)
		await capture(size, "welcome", true)
		game.lines.clear()
		await capture(size, "ready", true)
		if not baseline:
			# Walk the same routes used by the real click/tap handler, with movers and camera updating.
			for target in [{"id": "board", "tile": game.READ_AT}, {"id": "inn", "tile": game.INN_STEP}, {"id": "counter", "tile": game.SERVE_AT}, {"id": "return", "tile": spawn}]:
				game.walk_to = game.route(game.me.tile, target.tile, game.me)
				for i in 600:
					game._process(0.05)
					if game.me.tile == target.tile and game.me.path.is_empty():
						break
				check(game.me.tile == target.tile and game.me.path.is_empty(), "%s %s reachable" % [size, target.id])
				game.cam.reset_smoothing()
				game.cam.force_update_scroll()
				await capture(size, target.id, target.id == "return")
	finish()

func capture(size: Vector2i, label: String, opening: bool) -> void:
	game._update_ui()
	game.queue_redraw()
	await settle()
	var transform: Transform2D = game.get_screen_transform()
	var origin: Vector2 = Vector2(DisplayServer.window_get_position())
	var hall := Rect2(Vector2(game.HALL_DOOR.x - 3, game.HALL_DOOR.y - 4) * game.TILE, game.F_HALL[0].get_size())
	var inn := Rect2(Vector2(game.INN_DOOR.x - 2, game.INN_DOOR.y - 4) * game.TILE, game.F_INN[0].get_size())
	var frame := {"size": [size.x, size.y], "label": label, "landmarks": []}
	var logical: Transform2D = game.get_viewport().get_canvas_transform()
	for landmark in [hall, inn]:
		var a: Vector2 = transform * landmark.position - origin
		var b: Vector2 = transform * landmark.end - origin
		var fits := Rect2(Vector2.ZERO, Vector2(size)).encloses(Rect2(a, b - a))
		frame.landmarks.append({"top_left": [a.x, a.y], "bottom_right": [b.x, b.y], "fits": fits})
		if opening and not baseline:
			check(fits, "%s %s complete landmark" % [size, label])
			check((logical * landmark.position).y >= 28.0, "%s %s landmark clears goal/status text" % [size, label])
	var name := "%dx%d-%s.png" % [size.x, size.y, label]
	var path := out.path_join(name)
	var result: Array = []
	var rc := OS.execute("import", PackedStringArray(["-window", "root", "-crop", "%dx%d%+d%+d" % [size.x, size.y, int(origin.x), int(origin.y)], "+repage", path]), result, true)
	check(rc == 0 and FileAccess.file_exists(path), "capture " + name)
	if FileAccess.file_exists(path):
		var image := Image.load_from_file(path)
		check(image != null and image.get_size() == size, "size " + name)
	frame.file = name
	report.captures.append(frame)
	print("CAPTURE ", name)

func finish() -> void:
	report.passed = report.errors.is_empty()
	var file := FileAccess.open(out.path_join("manifest.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "\t"))
	file.close()
	quit(0 if report.passed else 1)
