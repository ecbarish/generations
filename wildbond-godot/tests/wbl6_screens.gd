extends SceneTree
## WBL-6: battle screens before and after the 64x64 fronts.
## Headless or a real window both work: the picture is the game's own canvas.
const R := preload("res://scripts/rules.gd")
var main: Node

func _initialize() -> void:
	print("WBL6 screens starting")
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	capture.call_deferred()

func capture() -> void:
	main.register.visible = false
	main.card.visible = false
	main.lines.clear()
	main.title.visible = false
	main.howto.visible = false
	main.satchel.visible = false
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	main.set_process(false)
	main.battle.set_process(false)
	var rng := RandomNumberGenerator.new()
	rng.seed = 6
	# A starter against a starter: your Cindercub, a wild Ripplet.
	await _battle(R.make("cindercub", 8, {}, rng), R.make("ripplet", 8, {}, rng), "starter-vs-starter")
	# A creature with no battle front. Duskweaver keeps the figure fallback.
	await _battle(R.make("cindercub", 8, {}, rng), R.make("duskweaver", 8, {}, rng), "fallback")
	main.queue_free()
	await process_frame
	quit()

func _battle(ally: Dictionary, foe: Dictionary, label: String) -> void:
	main.battle.open("wild", [ally], [foe], "")
	main.battle.area = "larkhaven"
	main.battle.wait_u = main.battle.allies[0]
	main.battle.state = "choose"
	main.battle.state_t = 1.0
	main.battle.t = 0.4
	main.battle.queue_redraw()
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	var prefix := OS.get_environment("WBL6_PREFIX")
	if prefix == "":
		prefix = "shot"
	var name := "%s-%s.png" % [prefix, label]
	DirAccess.make_dir_recursive_absolute("res://frames/wbl6")
	var path := "res://frames/wbl6/%s" % name
	var err := img.save_png(path)
	var out := OS.get_environment("WBL6_OUT")
	if out != "":
		DirAccess.make_dir_recursive_absolute(out)
		img.save_png(out.path_join(name))
	print("WBL6 shot %s %s err=%s" % [name, img.get_size(), err])
