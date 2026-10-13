extends SceneTree
# Captures Starfall's town: the opening view and views over the grown town. Out dir and tag from user args.
var main: Node2D
func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	root.add_child(main)
	_go.call_deferred()
func _shot(name: String, at: Vector2) -> void:
	main.cam.position_smoothing_enabled = false
	main.me.pos = at; main.me.tile = Vector2i(at / 16.0)
	for i in 12:
		await process_frame
	var img := root.get_texture().get_image()
	var args := OS.get_cmdline_user_args()
	img.save_png(args[0] + "/" + args[1] + "-" + name + ".png")
func _go() -> void:
	for i in 10:
		await process_frame
	main.lines.clear()
	await _shot("opening", main.me.pos)
	await _shot("square", Vector2(10, 9) * 16)
	await _shot("plots", Vector2(28, 9) * 16)
	quit()
