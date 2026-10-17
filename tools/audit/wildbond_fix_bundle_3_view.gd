extends SceneTree
## Pictures for Wildbond fix bundle 3.
##   SHOT_OUT=docs/screenshots/wb-fix-bundle-3 xvfb-run -a -s '-screen 0 1800x1000x24' \
##     Godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility \
##     --script ../tools/audit/wildbond_fix_bundle_3_view.gd

var main: Node
var out := ""

func _initialize() -> void:
	out = OS.get_environment("SHOT_OUT")
	if out == "":
		out = "res://frames/wb-fix-bundle-3"
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

func window(size: Vector2i) -> void:
	root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
	root.size = size
	DisplayServer.window_set_size(size)
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

func frame_on(world: Vector2) -> void:
	main.cam.position = world
	main.cam.reset_smoothing()

func run() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	main._skip_opening()
	await window(Vector2i(1536, 864))
	wake()
	await _hud()
	await _howto()
	await _follower()
	await _card()
	await _bag()
	await _chips()
	quit(0)

func _hud() -> void:
	wake()
	main._set_map("larkhaven")
	main.stage = "free"
	main.team = [main.team[0]] if not main.team.is_empty() else [main.R.make("ripplet", 5, { "rar": 1 }, main.rng)]
	main.badges.clear()
	main.story_done.erase("marenRanchTip")
	var sign := Vector2(12, 1) * float(main.TILE) + Vector2(8, 8)
	main.me.tile = Vector2i(12, 6)
	main.me.pos = Vector2(main.me.tile) * float(main.TILE)
	main.me.where = "larkhaven"
	frame_on(Vector2(sign.x, sign.y + 88.0))
	main._update_ui()
	await shot("hud-signpost")
	wake()
	main._set_map("barn")
	main.stage = "free"
	main.me.tile = Vector2i(11, 4)
	main.me.pos = Vector2(main.me.tile) * float(main.TILE)
	main.me.where = "barn"
	var body: Vector2 = main.me.pos + Vector2(8, 2)
	frame_on(Vector2(body.x, body.y + 70.0))
	main._update_ui()
	await shot("hud-barn-player")
	main.me.tile = main.BARN_EXIT + Vector2i(0, -2)
	main.me.pos = Vector2(main.me.tile) * float(main.TILE)
	var door := Vector2(main.BARN_EXIT) * float(main.TILE) + Vector2(8, 8)
	frame_on(Vector2(door.x, door.y - 70.0))
	main.caption.text = "The door out of the barn is just here."
	main._update_ui()
	await shot("hud-barn-door")
	main.caption.text = ""
	var pen: Rect2 = main._pen_world_rects()[0]
	frame_on(pen.get_center() + Vector2(0, 70))
	main.place_t = 0.0
	main._update_ui()
	await shot("hud-pen-title")
	main.say("", "The name is written on the stall.")
	main._update_ui()
	await shot("hud-pen-speech")
	main.lines.clear()

func _howto() -> void:
	wake()
	main.HowTo.note("keys")
	await window(Vector2i(1536, 864))
	main.howto.open("begin")
	await shot("howto-keys")
	main.howto.visible = false
	main.HowTo.note("touch")
	await window(Vector2i(390, 844))
	main._update_ui()
	main.howto.open("begin")
	await shot("howto-touch-upright")
	main.howto.visible = false
	await window(Vector2i(780, 360))
	main._update_ui()
	main.howto.open("begin")
	await shot("howto-touch-landscape")
	main.howto.visible = false

func _follower() -> void:
	wake()
	await window(Vector2i(1536, 864))
	main._set_map("larkhaven")
	main.stage = "free"
	main.me.tile = Vector2i(12, 8)
	main.me.pos = Vector2(main.me.tile) * float(main.TILE)
	main.me.where = "larkhaven"
	main.partner.where = "larkhaven"
	main.partner.tile = main.me.tile + Vector2i(0, 1)
	main.partner.pos = Vector2(main.partner.tile) * float(main.TILE)
	main.partner.path.clear()
	frame_on(main.me.pos + Vector2(8, 16))
	main._update_ui()
	await shot("follower")

func _card() -> void:
	wake()
	await window(Vector2i(1536, 864))
	main.card.open("ripplet", main.card_info("ripplet"))
	await shot("starter-card")
	main.card.visible = false

func _bag() -> void:
	wake()
	await window(Vector2i(1536, 864))
	var ally: Dictionary = main.R.make("ripplet", 5, { "rar": 1 }, main.rng)
	var foe: Dictionary = main.R.make("mosshog", 3, { "rar": 1 }, main.rng)
	main.battle.open("trainer", [ally], [foe], "Wren")
	main.battle._go_to("choose")
	main.battle.wait_u = main.battle.allies[0]
	main.battle.bag = { "lures": 0, "berries": 0 }
	main.battle.bag_note = "Your bag is empty."
	main.battle.state_t = 0.2
	await shot("battle-empty-bag")
	main.battle.visible = false

func _chips() -> void:
	var names := ["ripplet", "cindercub", "mosshog", "bogsnap"]
	var team: Array = []
	var foes: Array = []
	team.append(main.R.make(names[0], 8, { "rar": 1 }, main.rng))
	team.append(main.R.make(names[1], 8, { "rar": 1 }, main.rng))
	foes.append(main.R.make(names[2], 8, { "rar": 1 }, main.rng))
	var long: Dictionary = main.R.make(names[3], 8, { "rar": 1 }, main.rng)
	long.name = "Breakwatermane"
	foes.append(long)
	for win in [Vector2i(780, 360), Vector2i(844, 390)]:
		await window(win)
		main._update_ui()
		main.battle.open("wild", team, foes, "")
		main.battle._go_to("choose")
		main.battle.wait_u = main.battle.allies[0]
		main.battle.external_ui = false
		main.battle.state_t = 0.2
		var tag := "%dx%d" % [win.x, win.y]
		await shot("battle-next-" + tag)
		main.battle.visible = false
