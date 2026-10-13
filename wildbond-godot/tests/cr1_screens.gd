extends SceneTree
## CR1: screenshot a small creature beside a huge one in battle.
const R := preload("res://scripts/rules.gd")
var main: Node

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.show_howto = false
	root.add_child(main)
	capture.call_deferred()

func capture() -> void:
	DirAccess.make_dir_recursive_absolute("res://frames/cr1")
	main.register.visible = false
	main.card.visible = false
	main.lines.clear()
	main.title.visible = false
	main.howto.visible = false
	main.satchel.visible = false
	var rng := RandomNumberGenerator.new()
	rng.seed = 1
	# Small ally (cindercub, small) vs huge foe (pyremane, huge)
	var ally := R.make("cindercub", 5, {}, rng)
	var foe := R.make("pyremane", 30, {}, rng)
	main.team = [ally]
	main.battle.open("wild", [ally], [foe], "")
	# Let the battle draw a few frames
	for i in 12:
		await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	img.save_png("res://frames/cr1/battle-small-vs-huge.png")
	print("CR1 screen saved")
	main.queue_free()
	await process_frame
	quit()
