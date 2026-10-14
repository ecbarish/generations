extends SceneTree
## EVO-1: the three starters in Maren's barn, the full lines, and one battle.
## The same script runs on current main (procedural figures) and on this branch (painted sprites).
const R := preload("res://scripts/rules.gd")
const MainScript := preload("res://scripts/main.gd")
var main: Node

func _initialize() -> void:
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
	main.stage = "barn_choose"
	main.painted = true
	main.spilled = true
	main.fade_in = 1.0
	main.fade_rect.color.a = 0.0
	main.place.visible = false
	main._set_map("barn")
	main.me.where = "gone"
	main.maren.where = "gone"
	main.pup.where = "gone"
	main.wren.where = "gone"
	main.cam.position = Vector2(192, 108)
	main.cam.reset_smoothing()
	main.set_process(false)
	main.battle.set_process(false)
	var shade: ShaderMaterial = main.get_node("FadeWorld/Shade").material
	shade.set_shader_parameter("fade", 0.0)
	main.queue_redraw()
	await process_frame
	await RenderingServer.frame_post_draw
	save_shot("barn-starters")
	if main.DATA.SPECIES.has("smoulderpup"):
		for s in main.starters:
			s.where = "gone"
		var rows := [
			["cindercub", "smoulderpup", "blazefang"],
			["ripplet", "riverwisp", "tidewyrm"],
			["mosshog", "thicketboar", "thornback"],
		]
		var i := 0
		for row in rows:
			var x := 4
			for sid in row:
				var m := MainScript.Mover.new(sid, "barn", Vector2i(x, 4 + i * 2))
				var species: Dictionary = main.DATA.SPECIES[sid]
				m.look = main.CREATURE_LOOKS[sid] if main.CREATURE_LOOKS.has(sid) else MainScript.Figures.look_for(species)
				m.right = true
				main.ranch_movers.append(m)
				x += 6
			i += 1
		main.queue_redraw()
		await process_frame
		await RenderingServer.frame_post_draw
		save_shot("barn-lines")
		var rng := RandomNumberGenerator.new()
		rng.seed = 1
		var ally: Dictionary = R.make("smoulderpup", 20, {}, rng)
		var foe: Dictionary = R.make("riverwisp", 20, {}, rng)
		main.battle.open("wild", [ally], [foe], "")
		main.battle.wait_u = main.battle.allies[0]
		main.battle.state = "choose"
		main.battle.state_t = 1.0
		main.battle.queue_redraw()
		await process_frame
		await RenderingServer.frame_post_draw
		save_shot("battle-ember-tide")
	main.queue_free()
	await process_frame
	quit()

func save_shot(label: String) -> void:
	var img := root.get_texture().get_image()
	DirAccess.make_dir_recursive_absolute("res://frames/evo1")
	var path := "res://frames/evo1/%s.png" % label
	img.save_png(path)
	var out := OS.get_environment("EVO1_OUT")
	if out != "":
		DirAccess.make_dir_recursive_absolute(out)
		img.save_png(out.path_join(label + ".png"))
	print("EVO1 shot %s %s" % [label, img.get_size()])
