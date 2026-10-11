extends SceneTree
## Native-renderer visual fixture. Run against a temporary, imported Starfall project:
## xvfb-run -s '-screen 0 2048x1200x24' GODOT --path TEMP_PROJECT --rendering-method gl_compatibility --script /tmp/map-render-probe/starfall_render.gd -- --no-save
## REVIEW_OUTPUT may override the output directory. No game source or save is written.
const BASELINE := "3c77e086fd95a55112f855abc9a73a55bce64b48"
const VIEWPORTS := [Vector2i(1920, 1080), Vector2i(812, 375), Vector2i(375, 812)]
const ORIGIN := Vector2i(14, 10)
var game: Node
var out_dir := "/tmp/map-render-probe/starfall-render"
var manifest := {"game": "Starfall", "baseline": BASELINE, "capture_method": "ImageMagick import of actual X11 framebuffer, cropped to native window", "captures": [], "errors": []}

func _initialize() -> void:
	var env := OS.get_environment("REVIEW_OUTPUT")
	if not env.is_empty():
		out_dir = env
	DirAccess.make_dir_recursive_absolute(out_dir)
	run.call_deferred()

func xy(v) -> Array:
	return [v.x, v.y]

func rect_json(r: Rect2) -> Dictionary:
	return {"position": xy(r.position), "size": xy(r.size)}

func run() -> void:
	manifest["engine"] = Engine.get_version_info()
	manifest["display_server"] = DisplayServer.get_name()
	manifest["rendering_method"] = RenderingServer.get_current_rendering_method()
	manifest["project_root"] = ProjectSettings.globalize_path("res://")
	manifest["project_viewport_configuration"] = {
		"viewport_width": ProjectSettings.get_setting("display/window/size/viewport_width", 0),
		"viewport_height": ProjectSettings.get_setting("display/window/size/viewport_height", 0),
		"stretch_mode": ProjectSettings.get_setting("display/window/stretch/mode", "disabled"),
		"stretch_aspect": ProjectSettings.get_setting("display/window/stretch/aspect", "keep")}
	if DisplayServer.get_name() == "headless":
		manifest.errors.append("A real X11 renderer is required; headless screenshots are not accepted.")
		finish()
		return
	var scene = load("res://scenes/main.tscn")
	if scene == null:
		manifest.errors.append("Could not load res://scenes/main.tscn")
		finish()
		return
	game = scene.instantiate()
	game.no_save = true
	root.add_child(game)
	game.set_process(false)
	game.set_physics_process(false)
	game.set_process_unhandled_input(false)
	game.music_on = false
	game.lines.clear()
	game.barks.clear()
	game.feels.clear()
	game.bubble.hide()
	game.board_open = false
	game.shelf_open = false
	game.build_plot = ""
	game.t = 7.0
	game.day_t = game.DAY_SECONDS * 0.20
	root.mode = Window.MODE_WINDOWED
	root.borderless = true
	root.position = Vector2i.ZERO
	# Preserve the shipped project's content scaling and camera limits.
	# Only the real native window changes between desktop and phone sizes.
	manifest["no_save"] = game.no_save
	manifest["scene_processing_disabled"] = not game.is_processing()
	manifest["camera_limits"] = [game.cam.limit_left, game.cam.limit_top, game.cam.limit_right, game.cam.limit_bottom]
	manifest["visual_scope"] = "Empty rank 0 plus two completed rank 3 permutations cover all five building art types and all four plot positions. Exhaustive logical accessibility is a separate 501-state fixture."
	var states := [
		{"id": "empty-rank0", "rank": 0, "buildings": {}},
		{"id": "completed-a-rank3", "rank": 3, "buildings": {"west": "smithy", "east": "yard", "north": "apothecary", "south": "healer"}},
		{"id": "completed-b-rank3", "rank": 3, "buildings": {"west": "tavern", "east": "healer", "north": "yard", "south": "smithy"}}]
	for window_size in VIEWPORTS:
		root.size = window_size
		root.position = Vector2i.ZERO
		await settle()
		for state in states:
			apply_state(state)
			var targets := make_targets()
			for target in targets:
				await capture(state, window_size, target)
	finish()

func apply_state(state: Dictionary) -> void:
	game.rank = state.rank
	game.built.clear()
	for plot in state.buildings:
		game.built[plot] = {"what": state.buildings[plot], "left": 0.0}
	game.ama.where = "gone"
	game._place_ama()
	game.herbs = 4 if state.rank > 0 else 0
	game.stock = 3 if state.buildings.values().has("apothecary") else 0
	game.total_jobs = 30 if state.rank == 3 else 0
	game.lines.clear()
	game.bubble.hide()
	game.caption.text = ""
	game.caption_t = 0.0
	game.queue_redraw()

func make_targets() -> Array:
	var targets := [
		{"id": "square", "tile": ORIGIN, "purpose": "Town square overview from initial player position"},
		{"id": "gate-approach", "tile": game.GATE_IN, "purpose": "Inside west gate, approach and player foot"},
		{"id": "hall-approach", "tile": game.HALL_DOOR + Vector2i.DOWN, "purpose": "Guild Hall front and approach"},
		{"id": "inn-approach", "tile": game.INN_STEP, "purpose": "Inn doorstep and approach"},
		{"id": "inn-service", "tile": game.SERVE_AT, "purpose": "Inn service position behind counter"},
		{"id": "board-approach", "tile": game.READ_AT, "purpose": "Guild board reading position"}]
	for plot in game.PLOTS:
		targets.append({"id": "plot-" + plot + "-approach", "tile": game._step_of(plot), "purpose": "Plot front, doorstep, player foot, roof and surroundings", "plot": plot})
	for kind in ["smithy", "tavern", "apothecary"]:
		var plot: String = game.finished(kind)
		if not plot.is_empty():
			var service: Vector2i = game.forge_at() if kind == "smithy" else (game._tap_at() if kind == "tavern" else game._pot_at())
			targets.append({"id": "service-" + kind + "-" + plot, "tile": service, "purpose": "Building service position at front", "plot": plot})
	return targets

func settle() -> void:
	# Force real render completion; neither a headless viewport nor an artist's reconstruction.
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	await create_timer(0.06).timeout

func capture(state: Dictionary, requested: Vector2i, target: Dictionary) -> void:
	var tile: Vector2i = target.tile
	game.me.tile = tile
	game.me.pos = Vector2(tile) * game.TILE
	game.me.path.clear()
	game.me.face = Vector2i.UP
	game.walk_to.clear()
	game.use_after = ""
	game.cam.position = game.me.pos + Vector2(8, 8)
	game.cam.reset_smoothing()
	game.cam.force_update_scroll()
	game._update_ui()
	game.bubble.hide()
	game.queue_redraw()
	await settle()
	var win_size: Vector2i = DisplayServer.window_get_size()
	var win_pos: Vector2i = DisplayServer.window_get_position()
	var stem := "%s_%dx%d_%s" % [state.id, requested.x, requested.y, target.id]
	var file := out_dir.path_join(stem + ".png")
	var geometry := "%dx%d%+d%+d" % [win_size.x, win_size.y, win_pos.x, win_pos.y]
	var output: Array = []
	var exit_code := OS.execute("import", PackedStringArray(["-window", "root", "-crop", geometry, "+repage", file]), output, true)
	var capture_ok := exit_code == 0 and FileAccess.file_exists(file)
	var img: Image
	if capture_ok:
		img = Image.load_from_file(file)
		capture_ok = img != null and not img.is_empty()
	var dimensions := Vector2i.ZERO if not capture_ok else img.get_size()
	var size_ok := win_size == requested and dimensions == requested
	var contrast := image_contrast(img) if capture_ok else 0.0
	var nonblank := contrast > 0.04
	var world_foot: Vector2 = game.me.pos + Vector2(8, 16)
	var screen_xform: Transform2D = game.get_screen_transform()
	var frame := {
		"id": stem, "file": file, "state": state.id, "rank": state.rank,
		"buildings": state.buildings.duplicate(true), "target": target.id, "purpose": target.purpose,
		"player_tile": xy(tile), "player_foot_world_px": xy(world_foot),
		"player_foot_capture_px": xy(screen_xform * world_foot - Vector2(win_pos)),
		"requested_window_size": xy(requested), "actual_window_size": xy(win_size),
		"window_position": xy(win_pos), "image_size": xy(dimensions),
		"logical_viewport_rect": rect_json(root.get_visible_rect()),
		"camera_position": xy(game.cam.position), "camera_screen_center": xy(game.cam.get_screen_center_position()),
		"camera_zoom": xy(game.cam.zoom), "capture_exit_code": exit_code,
		"capture_ok": capture_ok, "size_ok": size_ok, "nonblank_check": nonblank,
		"sample_luminance_range": contrast, "target_solid": game.solid(tile),
		"target_reachable_from_initial_position": tile == ORIGIN or not game.route(ORIGIN, tile, game.me).is_empty(),
		"plot_geometry": plot_geometry(screen_xform, win_pos)}
	if target.has("plot"):
		frame["target_plot"] = target.plot
	if not capture_ok or not size_ok or not nonblank:
		var err := "%s: capture=%s size=%s nonblank=%s output=%s" % [stem, capture_ok, size_ok, nonblank, str(output)]
		manifest.errors.append(err)
		push_warning(err)
	manifest.captures.append(frame)
	write_manifest()
	print("CAPTURE ", stem, " ", dimensions, " ok=", capture_ok and size_ok and nonblank)

func plot_geometry(screen_xform: Transform2D, win_pos: Vector2i) -> Array:
	var results := []
	for plot in game.PLOTS:
		var anchor: Vector2i = game.PLOTS[plot]
		var step: Vector2i = game._step_of(plot)
		var item := {"plot": plot, "unlocked": int(game.PLOT_RANK[plot]) <= game.rank, "anchor_tile": xy(anchor), "approach_tile": xy(step), "approach_center_capture_px": xy(screen_xform * (Vector2(step) * game.TILE + Vector2(8, 8)) - Vector2(win_pos))}
		if game._plot_done(plot):
			item["building"] = game.built[plot].what
			item["solid_footprint_tiles"] = rect_json(Rect2(game.built_rect(plot)))
			var texture: Texture2D = game.F_BUILT[game.built[plot].what]
			var art_rect := Rect2(Vector2(anchor) * game.TILE + Vector2(0, 32 - texture.get_height()), texture.get_size())
			item["art_rect_world_px"] = rect_json(art_rect)
			item["art_top_left_capture_px"] = xy(screen_xform * art_rect.position - Vector2(win_pos))
			item["art_bottom_right_capture_px"] = xy(screen_xform * art_rect.end - Vector2(win_pos))
		results.append(item)
	return results

func image_contrast(img: Image) -> float:
	var low := 1.0
	var high := 0.0
	for y in range(0, img.get_height(), maxi(1, img.get_height() / 32)):
		for x in range(0, img.get_width(), maxi(1, img.get_width() / 32)):
			var c := img.get_pixel(x, y)
			var value := (c.r + c.g + c.b) / 3.0
			low = minf(low, value)
			high = maxf(high, value)
	return high - low

func write_manifest() -> void:
	var f := FileAccess.open(out_dir.path_join("manifest.json"), FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(manifest, "\t") + "\n")
		f.close()

func finish() -> void:
	manifest["capture_count"] = manifest.captures.size()
	manifest["passed"] = manifest.errors.is_empty() and manifest.captures.size() == 102
	write_manifest()
	print("STARFALL_RENDER_DONE ", manifest.capture_count, " captures; passed=", manifest.passed, "; ", out_dir.path_join("manifest.json"))
	quit(0 if manifest.passed else 1)
