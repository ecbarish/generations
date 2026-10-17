extends SceneTree
## Render the real native study and exercise pointer and keyboard controls.
var view: Control
var output := ""

func _initialize() -> void:
	run.call_deferred()

func settle() -> void:
	for i in 4: await process_frame
	await RenderingServer.frame_post_draw

func capture(name: String) -> void:
	await settle()
	root.get_texture().get_image().save_png(output.path_join(name + ".png"))

func tap(button: Button) -> void:
	var at := root.get_final_transform() * button.get_global_rect().get_center()
	for down in [true, false]:
		var e := InputEventMouseButton.new()
		e.button_index = MOUSE_BUTTON_LEFT
		e.position = at
		e.pressed = down
		root.push_input(e)
	await settle()

func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		quit(2)
		return
	output = args[0]
	DirAccess.make_dir_recursive_absolute(output)
	view = load("res://tests/battle_slice/play.tscn").instantiate()
	root.add_child(view)
	view.sounds.on = false # This runner captures visuals/input; native play retains its normal sound control.
	await capture("commands")
	await tap(view.buttons[0])
	assert(view.page == "moves", "pointer Fight must open moves")
	await capture("moves")
	await tap(view.buttons[1])
	assert(not view.event.is_empty(), "pointer move must start round")
	await capture("hit")
	# Advance using real Continue buttons through both turns.
	for i in 3:
		if not view.event.is_empty(): await tap(view.buttons[0])
	await tap(view.buttons[1])
	assert(view.page == "party", "Switch opens party")
	await capture("party")
	await tap(view.buttons[1])
	assert(view.model.active == 1, "real party selection switches active")
	await capture("switched")
	for i in 3:
		if not view.event.is_empty(): await tap(view.buttons[0])
	await tap(view.buttons[4])
	await tap(view.buttons[0])
	assert(view.model.result == "escaped", "Run reaches actual escape result")
	await capture("escaped")
	await tap(view.buttons[0])
	assert(view.model.round_number == 1 and view.model.state == "choose", "Try Again restarts")
	for turn in 20:
		if view.model.state == "ended": break
		await tap(view.buttons[0])
		await tap(view.buttons[1])
		for i in 3:
			if not view.event.is_empty(): await tap(view.buttons[0])
	assert(view.model.result == "won", "real Fight/move flow reaches victory")
	await capture("victory")
	view.MuseArt.cache.clear()
	view.Sprites._tex.clear()
	view.Sprites._ink.clear()
	view.queue_free()
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	print("Battle study captures and real pointer flow passed: ", output)
	quit()
