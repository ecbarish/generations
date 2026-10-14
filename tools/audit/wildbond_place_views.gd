extends SceneTree
## WB-C4 evidence: whole-map views and player-eye views of Larkhaven and the Thornwood Trail. Never saves.
## Real renderer only (not --headless). SHOT_COLOUR=1 restores the colour over both maps; otherwise they're faded.
##   SHOT_OUT=out SHOT_COLOUR=1 xvfb-run -a -s '-screen 0 2000x1200x24' Godot --path wildbond-godot \
##     --audio-driver Dummy --rendering-method gl_compatibility --script ../tools/audit/wildbond_place_views.gd
var main: Node
var out := OS.get_environment("SHOT_OUT")
func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	run.call_deferred()
func settle() -> void:
	for i in 4:
		await process_frame
	await RenderingServer.frame_post_draw
func place(name: String, p: Vector2i) -> void:
	main._set_map(name)
	main.me.where = name
	main.me.tile = p
	main.me.pos = Vector2(p) * main.TILE
	main.me.path.clear()
	main.lines.clear()
	main.trans_t = -1.0
	if main.partner:
		main.partner.where = name
		main.partner.tile = p + Vector2i.DOWN
		main.partner.pos = Vector2(main.partner.tile) * main.TILE
func run() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	main._skip_opening()
	main.stage = "free"
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	root.size = Vector2i(1536, 864)
	var colour := OS.get_environment("SHOT_COLOUR") == "1"
	for name in ["larkhaven", "thornwood_route"]:
		if colour:
			main.restore.append({ "where": name, "at": Vector2(192, 108), "r": 5000.0, "goal": 5000.0 })
		place(name, Vector2i(10, 8))
		for i in 6:
			main._process(0.05)
		var m: Array = main.cur_map()
		var w: float = m[0].length() * main.TILE
		var h: float = m.size() * main.TILE
		var z: float = minf(384.0 / w, 216.0 / h)
		main.cam.limit_left = -100000; main.cam.limit_top = -100000; main.cam.limit_right = 100000; main.cam.limit_bottom = 100000
		main.cam.zoom = Vector2(z, z)
		main.cam.position = Vector2(w, h) / 2.0
		main.cam.reset_smoothing()
		main.set_process(false)

		await settle()
		root.get_texture().get_image().save_png(out + "/%s-whole.png" % name)
		main.cam.zoom = Vector2.ONE
		main.set_process(true)
		main._set_map(name)
		var spots: Array = [Vector2i(16, 7), Vector2i(20, 5)] if name == "larkhaven" else [Vector2i(7, 12), Vector2i(22, 11)]
		for k in spots.size():
			var p: Vector2i = spots[k]
			place(name, p)
			for i in 6:
				main._process(0.05)
			main.cam.position = main.me.pos + Vector2(8, 8)
			main.cam.reset_smoothing()
			await settle()
			root.get_texture().get_image().save_png(out + "/%s-view%d.png" % [name, k])
		print(name, " size ", m[0].length(), "x", m.size())
	quit(0)
