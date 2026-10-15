extends SceneTree
## Before/after views for the battle-start bundle (WBL-2, WBL-3, WBL-4) and a phone-sized pass.
## SHOT_PHASE=before forces the old unfair meters so the foe can act first. The default, after, leaves
## the battle's own opening alone. SHOT_OUT is the folder. Never saves a journey.
##   SHOT_PHASE=before SHOT_OUT=docs/screenshots/wbl-battle-start xvfb-run -a -s '-screen 0 1800x1000x24' \
##     Godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility \
##     --script ../tools/audit/wildbond_wbl_battle_start_view.gd

var main: Node
var out := ""
var phase := "after"

func _initialize() -> void:
	out = OS.get_environment("SHOT_OUT")
	phase = OS.get_environment("SHOT_PHASE") if OS.get_environment("SHOT_PHASE") != "" else "after"
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

func size_window(w: int, h: int) -> void:
	root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_FRACTIONAL
	root.size = Vector2i(w, h)
	DisplayServer.window_set_size(Vector2i(w, h))
	await settle()

func wake() -> void:
	main.lines.clear()
	main.walk_to.clear()
	main.me.path.clear()
	main.trans_t = -1.0
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	if main.battle:
		main.battle.visible = false
		main.battle.state = "off"
	if main.card:
		main.card.visible = false
	if main.title:
		main.title.visible = false
	if main.menu:
		main.menu.visible = false
	if main.howto:
		main.howto.visible = false
	main.get_tree().paused = false
	if main.turn_card:
		main.turn_card.visible = false
		main.turn_card.check(Vector2(root.size))

func desktop() -> void:
	root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
	root.size = Vector2i(1536, 864)
	DisplayServer.window_set_size(Vector2i(1536, 864))
	await settle()

func show_battle(unfair: bool) -> void:
	wake()
	main.stage = "free"
	var foe: Dictionary = main.R.make("cindercub", 30, { "rar": 1 }, main.rng)
	main.battle.rng.seed = 3
	main.battle.open("wild", main.team, [foe], "")
	if unfair:
		main.battle.allies[0].atb = 0.0
	main.battle.foes[0].atb = main.R.ACT_AT
	main.battle._go_to("run")
	main.battle._process(0.35)
	if not unfair:
		main.battle.sure_catch = true
		if int(main.bag.get("lures", 0)) < 5:
			main.bag.lures = 5
	main._thumbs_tick()
	main._update_ui()

func show_catch() -> void:
	wake()
	main.stage = "free"
	main.team = [main.R.make("ripplet", 5, { "rar": 1 }, main.rng)]
	main.ranch.clear()
	main.story_done.erase("marenRanchTip")
	main.bag.lures = 0
	if not main.DATA.MAPS[main.map_name].has("biome"):
		main.map_name = "thornwood"
	main._wild_battle()
	main.battle._go_to("choose")
	main.battle.wait_u = main.battle.allies[0]
	main.battle.state_t = 0.2
	var catch_i := 3
	for k in main.battle.MENU.size():
		if main.battle.menu_word(k) == "Catch":
			catch_i = k
	main.battle._choose(catch_i)
	main._thumbs_tick()
	main._update_ui()

func run() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	main._skip_opening()
	main.touch.mode = "on"
	main.touch.touched = true
	var tag := "before" if phase == "before" else "after"
	await desktop()
	show_battle(phase == "before")
	await shot(tag + "-desktop-battle")
	if phase != "before":
		show_catch()
		await shot(tag + "-desktop-catch")
	wake()
	main.stage = "free"
	main.caption.text = "%s walks with you now. The north road leads to Thornwood. To talk to someone, stand beside them and press E; your field book: press J." % main._partner_name()
	main._thumbs_tick()
	main._update_ui()
	await shot(tag + "-desktop-objective")
	await size_window(844, 390)
	main.turn_card.check(Vector2(844, 390))
	main.get_tree().paused = false
	wake()
	main.title.open("Rowan and Ripplet, in Thornwood.")
	main._update_ui()
	await shot(tag + "-phone-landscape-title")
	wake()
	main.stage = "barn_choose"
	main.card.open("ripplet", main.card_info("ripplet"))
	main._update_ui()
	await shot(tag + "-phone-landscape-starter")
	wake()
	main.stage = "free"
	main._set_map("larkhaven")
	main.me.tile = Vector2i(16, 8)
	main.me.pos = Vector2(main.me.tile) * main.TILE
	main.cam.position = main.me.pos + Vector2(8, 8)
	main.caption.text = ""
	main._thumbs_tick()
	main._update_ui()
	await shot(tag + "-phone-landscape-overworld")
	main.menu.open()
	main._update_ui()
	await shot(tag + "-phone-landscape-menu")
	show_battle(phase == "before")
	await shot(tag + "-phone-landscape-battle")
	if phase != "before":
		show_catch()
		await shot(tag + "-phone-landscape-catch")
	await size_window(390, 844)
	main.turn_card.check(Vector2(390, 844))
	await shot(tag + "-phone-portrait")
	print("wbl battle-start views done (", phase, ")")
	quit(0)
