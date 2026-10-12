extends SceneTree
var main: Node

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	capture.call_deferred()

func capture() -> void:
	DirAccess.make_dir_recursive_absolute("res://frames/wd4b")
	main._skip_opening()
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	main.trans_t = -1.0
	main.letter_steps = 999
	main.register.visible = false
	main.card.visible = false
	main.lines.clear()
	main.title.visible = false
	main.howto.visible = false
	main.stage = "free"
	main.painted = true
	main.spilled = true
	main.key_learn = { "walk": 9, "act": 9, "book": 9 }
	for place_id in ["saltmarsh", "saltmarsh_route", "saltmarsh_pool"]:
		main.restore.append({ "where": place_id, "at": Vector2(192, 108), "r": 5000.0, "goal": 5000.0 })
	root.borderless = true
	root.min_size = Vector2i(1, 1)
	root.position = Vector2i.ZERO
	root.size = Vector2i(1366, 768)
	for shot in [
		["road", "saltmarsh_route", Vector2i(13, 8)],
		["settlement", "saltmarsh", Vector2i(18, 8)],
		["pool", "saltmarsh_pool", Vector2i(10, 8)],
	]:
		main._set_map(shot[1])
		main.map_name = shot[1]
		main.me.where = shot[1]
		main.me.tile = shot[2]
		main.me.pos = Vector2(main.me.tile) * main.TILE
		main.me.path.clear()
		main.partner.where = shot[1]
		main.partner.tile = main.me.tile + Vector2i.LEFT
		main.partner.pos = Vector2(main.partner.tile) * main.TILE
		main.partner.path.clear()
		main.cam.position = main.me.pos + Vector2(8, 8)
		main.cam.reset_smoothing()
		main.lines.clear()
		main.queue_redraw()
		for _i in 12:
			await process_frame
		await RenderingServer.frame_post_draw
		var image := root.get_texture().get_image()
		if image == null:
			push_error("WD4b capture had no image: " + shot[0])
			quit(2)
			return
		var err := image.save_png("res://frames/wd4b/%s.png" % shot[0])
		print("WD4b screen: %s %dx%d save %s" % [shot[0], image.get_width(), image.get_height(), err])
		if err != OK:
			quit(2)
			return
	main.queue_free()
	await process_frame
	quit()
