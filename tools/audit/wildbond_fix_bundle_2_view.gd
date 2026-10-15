extends SceneTree
## Pictures for the second Wildbond fix bundle.
##   SHOT_OUT=docs/screenshots/wb-fix-bundle-2 xvfb-run -a -s '-screen 0 1800x1000x24' \
##     Godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility \
##     --script ../tools/audit/wildbond_fix_bundle_2_view.gd

var main: Node
var out := ""

func _initialize() -> void:
	out = OS.get_environment("SHOT_OUT")
	if out == "":
		out = "res://frames/wb-fix-bundle-2"
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	run.call_deferred()

func settle() -> void:
	for _i in 4:
		await process_frame
	await RenderingServer.frame_post_draw

func shot(name: String) -> void:
	await settle()
	var img := root.get_texture().get_image()
	img.save_png(out + "/" + name + ".png")
	print("saved ", name, " ", img.get_width(), "x", img.get_height())

func desktop() -> void:
	root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
	root.size = Vector2i(1536, 864)
	DisplayServer.window_set_size(Vector2i(1536, 864))
	await settle()

func wake() -> void:
	main.lines.clear()
	main.walk_to.clear()
	main.me.path.clear()
	main.trans_t = -1.0
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	main.stage = "free"
	for page in [main.battle, main.card, main.title, main.howto, main.register, main.book, main.shop, main.menu]:
		if page:
			page.visible = false
	main.get_tree().paused = false

func run() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	main._skip_opening()
	await desktop()
	wake()
	main._set_map("barn")
	main.stage = "barn_choose"
	main.me.tile = Vector2i(12, 6)
	main.me.pos = Vector2(main.me.tile) * main.TILE
	main.me.where = "barn"
	main.maren.where = "barn"
	main.maren.tile = Vector2i(12, 5)
	main.maren.pos = Vector2(main.maren.tile) * main.TILE
	main.cam.position = main.me.pos + Vector2(8, 8)
	main.say("maren", "The stalls have names on them. Have a proper look before you choose.")
	main._update_ui()
	await shot("barn-speech")
	wake()
	main.card.open("ripplet", main.card_info("ripplet"))
	await shot("starter-choose")
	main.card.visible = false
	var ally: Dictionary = main.R.make("bogsnap", 8, { "rar": 1 }, main.rng)
	var foe: Dictionary = main.R.make("glimmerwing", 8, { "rar": 1 }, main.rng)
	main.battle.open("wild", [ally], [foe], "")
	main.battle._go_to("choose")
	main.battle.wait_u = main.battle.allies[0]
	main.battle.state_t = 0.2
	await shot("battle-bogsnap")
	main.battle.bag = { "lures": 3, "berries": 0 }
	main.battle.sure_catch = true
	main.battle._choose(3)
	main.battle.cap.pos = 0.5
	main.battle.catch_note = "hit"
	main.battle.catch_note_t = 1.1
	await shot("catch-hit")
	quit(0)
