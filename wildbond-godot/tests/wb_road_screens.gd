extends SceneTree
## WB-ROAD pictures: the Larkhaven goal before you set out, the first step onto the Thornwood road, and the title page
## and the place you land after Continue when the game is closed a moment after crossing the road (the quick-quit gap). Needs a real window (xvfb-run is fine). OUT=/dir picks the folder.
const RC := preload("res://tests/wbl_continue.gd")
var out := OS.get_environment("OUT") if OS.get_environment("OUT") != "" else "/tmp/wb-road"

func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute(out)
	_run.call_deferred()

func shot(name: String) -> void:
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	img.save_png("%s/%s.png" % [out, name])
	print("saved ", name)

func _run() -> void:
	RC.wipe()
	var g: Node = RC.journey_to_road(root, "ripplet")
	g.caption.text = ""
	RC.walk(g, Vector2i(10, 4))
	RC.tick(g, 1.0)
	await shot("1-larkhaven-north-road")
	RC.walk(g, Vector2i(10, 1))
	await shot("2-larkhaven-road-mouth")
	g.save_t = 0.0                                  # the last autosave was just before the road
	Input.action_press("move_up")
	for i in 80:
		RC.tick(g, 0.05)
		if g.map_name != "larkhaven": break
	Input.action_release("move_up")
	RC.tick(g, 0.8)
	await shot("3-thornwood-road-first-step")
	# the tab is closed a moment after the first step (no warning at all), and the player comes back later
	g.free()
	var h: Node = RC.fresh(root, true)
	RC.tick(h, 1.5)
	await shot("4-title-page-on-return")
	RC.press_continue(h)
	RC.tick(h, 2.0)
	h.lines.clear()
	await shot("5-after-continue")
	quit(0)
