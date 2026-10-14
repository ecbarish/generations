extends SceneTree
## CR4: screenshots of the evolution moment.
const R := preload("res://scripts/rules.gd")
var main: Node

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.show_howto = false
	root.add_child(main)
	capture.call_deferred()

func capture() -> void:
	DirAccess.make_dir_recursive_absolute("res://frames/cr4")
	main.register.visible = false
	main.card.visible = false
	main.lines.clear()
	main.title.visible = false
	main.howto.visible = false
	main.satchel.visible = false
	var rng := RandomNumberGenerator.new()
	rng.seed = 1
	# Elderhorn is still Legend, so this keeps the full 4.5s cinematic. The starter final is no longer a third form.
	var cub: Dictionary = R.make("cindercub", 30, {}, rng)
	main.team = [cub]
	main._evo_cine_start(cub, "elderhorn")
	# Freeze at mid-grow phase for the silhouette shot (set t right before capture)
	main.evo_cine["t"] = 2.8
	await RenderingServer.frame_post_draw
	var img1 := root.get_texture().get_image()
	img1.save_png("res://frames/cr4/evo-silhouette.png")
	print("CR4 silhouette saved")
	# Freeze at the reveal
	main.evo_cine["t"] = 3.8
	await RenderingServer.frame_post_draw
	var img2 := root.get_texture().get_image()
	img2.save_png("res://frames/cr4/evo-reveal.png")
	print("CR4 reveal saved")
	main.queue_free()
	await process_frame
	quit()
