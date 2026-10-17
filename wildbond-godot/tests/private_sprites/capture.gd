extends SceneTree
var scene: Node3D
var output := ""
var seconds := 0.0

func _initialize() -> void:
	run.call_deferred()

func _process(dt: float) -> bool:
	seconds += dt
	if seconds > 45: quit(3)
	return false

func settle() -> void:
	for i in 5: await process_frame
	await RenderingServer.frame_post_draw

func capture(name: String) -> void:
	await settle()
	root.get_texture().get_image().save_png(output.path_join(name + ".png"))

func tap(button: Button) -> void:
	var at := root.get_final_transform() * button.get_global_rect().get_center()
	for down in [true, false]:
		var e := InputEventMouseButton.new()
		e.position = at
		e.button_index = MOUSE_BUTTON_LEFT
		e.pressed = down
		root.push_input(e)
	await settle()

func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2); return
	output = args[0]
	DirAccess.make_dir_recursive_absolute(output)
	scene = load("res://tests/private_sprites/play.tscn").instantiate()
	if "--fallback" in args: scene.pack_path = "Z:/no-private-pack"
	root.add_child(scene)
	await capture("clearing-day")
	var before: Vector3 = scene.player.position
	var key := InputEventKey.new()
	key.physical_keycode = KEY_W
	key.keycode = KEY_W
	key.pressed = true
	Input.parse_input_event(key)
	for i in 8: await process_frame
	key = key.duplicate()
	key.pressed = false
	Input.parse_input_event(key)
	assert(scene.player.position.z < before.z, "actual held W moves the player")
	await capture("walking")
	scene.player.position = Vector3(1, 0, 2)
	await settle()
	var first: Button
	for child in scene.ui.get_children():
		if child is Button and child.text == "Encounter [E]": first = child
	assert(first != null and first.text == "Encounter [E]", "actual encounter control exists")
	await tap(first)
	assert(scene.battle != null, "pointer opens battle")
	scene.battle.sounds.on = false
	await capture("battle")
	await tap(scene.battle.buttons[0])
	assert(scene.battle.page == "moves", "pointer Fight opens moves")
	await capture("moves")
	await tap(scene.battle.buttons.back())
	await tap(scene.battle.buttons[4]) # Run
	await tap(scene.battle.buttons[0]) # Finish event
	assert(scene.battle.model.result == "escaped", "actual Run reaches escape")
	await tap(scene.battle.buttons.back())
	assert(scene.active and scene.battle == null, "Return control restores clearing")
	await capture("returned")
	if not "--fallback" in args:
		var next_button: Button
		for child in scene.ui.get_children():
			if child is Button and child.text == "Next": next_button = child
		for i in 2:
			await tap(next_button)
			await capture("creature-" + str(i + 2))
			await tap(first)
			scene.battle.sounds.on = false
			await capture("battle-" + str(i + 2))
			await tap(scene.battle.buttons[4])
			await tap(scene.battle.buttons[0])
			await tap(scene.battle.buttons.back())
	scene.set_night(true)
	scene.set_rain(true)
	await capture("night-rain")
	scene.Art.cache.clear()
	var sprites = load("res://scripts/creature_sprites.gd")
	sprites._tex.clear()
	sprites._ink.clear()
	scene.queue_free()
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	print("Native clearing keyboard/pointer capture passed: ", output)
	quit()
