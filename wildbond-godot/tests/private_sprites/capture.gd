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
	for spec in [[KEY_S, "down", Vector2i.DOWN], [KEY_A, "left", Vector2i.LEFT], [KEY_D, "right", Vector2i.RIGHT], [KEY_W, "up", Vector2i.UP]]:
		key = InputEventKey.new()
		key.physical_keycode = spec[0]
		key.keycode = spec[0]
		key.pressed = true
		Input.parse_input_event(key)
		await create_timer(0.22).timeout
		assert(scene.gait.face == spec[2] and scene.gait.moving, "real held input changes facing and walking")
		await capture("walk-" + spec[1])
		key = key.duplicate()
		key.pressed = false
		Input.parse_input_event(key)
		await settle()
		assert(not scene.gait.moving and scene.gait.face == spec[2], "release stops feet without resetting facing")
	for code in [KEY_W, KEY_SHIFT]:
		key = InputEventKey.new()
		key.physical_keycode = code
		key.keycode = code
		key.pressed = true
		Input.parse_input_event(key)
	await create_timer(0.15).timeout
	assert(scene.gait.running, "actual Shift changes to running gait")
	await capture("running")
	for code in [KEY_W, KEY_SHIFT]:
		key = InputEventKey.new()
		key.physical_keycode = code
		key.keycode = code
		key.pressed = false
		Input.parse_input_event(key)
	for spec in [[KEY_W, -1, "bogsnap-back"], [KEY_S, 1, "bogsnap-front"]]:
		scene.companion.position = scene.player.position + Vector3(0, 0, -spec[1] * 1.3)
		scene.trail.clear()
		scene.trail.append(scene.player.position)
		key = InputEventKey.new()
		key.keycode = spec[0]
		key.physical_keycode = spec[0]
		key.pressed = true
		Input.parse_input_event(key)
		await create_timer(0.3).timeout
		assert(scene.partner_gait.moving and scene.partner_atlas.atlas == scene.axial_texture, "straight following uses actual front/back walking art")
		await capture(spec[2])
		if spec[1] == 1:
			scene.human.hide()
			await capture("bogsnap-front-unoccluded")
			scene.human.show()
		key = key.duplicate()
		key.pressed = false
		Input.parse_input_event(key)
	scene.player.position = Vector3(0, 0, 5)
	scene.companion.position = Vector3(0, 0, 6.5)
	scene.trail.clear()
	scene.trail.append(scene.player.position)
	key = InputEventKey.new()
	key.physical_keycode = KEY_W
	key.keycode = KEY_W
	key.pressed = true
	Input.parse_input_event(key)
	var stride_poses := {}
	for i in 24:
		await create_timer(0.05).timeout
		if scene.partner_gait.moving: stride_poses[scene.partner_gait.phase()] = true
	assert(stride_poses.size() >= 3, "actual sustained following advances through the walking poses")
	await capture("bogsnap-stride")
	key = key.duplicate()
	key.pressed = false
	Input.parse_input_event(key)
	var bag_button: Button
	for child in scene.ui.get_children():
		if child is Button and child.text == "Bag [B]": bag_button = child
	scene.supplies.team[1].hp -= 10 # Wounded fixture, so native target selection has an effect to verify.
	await tap(bag_button)
	assert(scene.bag != null, "pointer opens world bag")
	await capture("bag-world")
	for control in scene.bag.controls:
		if control is Button and control.text.begins_with("Ranch Berry"):
			await tap(control)
			break
	await capture("bag-party")
	var stock: int = scene.supplies.berries
	for control in scene.bag.controls:
		if control is Button and control.text.begins_with("Glimmerwing"):
			await tap(control)
			break
	assert(scene.bag == null and scene.supplies.berries == stock - 1 and scene.supplies.team[1].hp == scene.supplies.team[1].max_hp, "pointer targets wounded partner and consumes one berry")
	await settle()
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
	await tap(scene.battle.buttons[2])
	assert(scene.battle.bag != null, "pointer Bag opens item pockets")
	await capture("bag-battle")
	for control in scene.battle.bag.controls:
		if control is Button and control.text == "Balls":
			await tap(control)
			break
	await capture("bag-balls")
	for control in scene.battle.bag.controls:
		if control is Button and control.text == "Close Bag":
			await tap(control)
			break
	await settle()
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
