extends SceneTree
var scene: Node3D
var output := ""
var elapsed := 0.0

func _process(dt: float) -> bool:
	elapsed += dt
	if elapsed > 45: quit(3)
	return false

func _initialize() -> void:
	run.call_deferred()

func capture(name: String) -> void:
	for i in 8: await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(name+".png"))

func tap(button: Button) -> void:
	var at := root.get_final_transform()*button.get_global_rect().get_center()
	for down in [true,false]:
		var e := InputEventMouseButton.new()
		e.position=at
		e.button_index=MOUSE_BUTTON_LEFT
		e.pressed=down
		root.push_input(e)
	for i in 4: await process_frame

func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2); return
	output=args[0]
	DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/thornwood_environment/play.tscn").instantiate()
	if "--fallback" in args: scene.pack_path="Z:/no-private-pack"
	root.add_child(scene)
	for i in 30: await process_frame
	await capture("day")
	var before: Vector3 = scene.player.position
	var key := InputEventKey.new()
	key.keycode=KEY_W
	key.physical_keycode=KEY_W
	key.pressed=true
	Input.parse_input_event(key)
	await create_timer(.22).timeout
	check_movement(scene.player.position.z < before.z)
	key=key.duplicate()
	key.pressed=false
	Input.parse_input_event(key)
	await capture("walking")
	scene.sunset=true
	scene._apply_light()
	await capture("sunset")
	scene.player.position=Vector3(-2.3,0,2.6)
	scene._update_camera()
	await capture("brook")
	scene.set_night(true)
	await capture("night")
	scene.set_rain(true)
	await capture("night-rain")
	scene.set_night(false)
	await capture("rain")
	scene.set_rain(false)
	scene.player.position=Vector3(1,0,2)
	var encounter: Button
	for c in scene.ui.get_children():
		if c is Button and c.text=="Encounter [E]": encounter=c
	await tap(encounter)
	for i in 3: await process_frame
	assert(scene.battle!=null,"atmosphere scene enters existing battle")
	scene.battle.sounds.on=false
	await tap(scene.battle.buttons[4])
	await tap(scene.battle.buttons[0])
	await tap(scene.battle.buttons.back())
	for i in 3: await process_frame
	assert(scene.active and scene.player.position==Vector3(1,0,2),"same position restored")
	await capture("returned")
	scene.Art.cache.clear()
	scene.queue_free()
	for i in 5:
		await process_frame
		await RenderingServer.frame_post_draw
	print("Thornwood native capture/return passed: ",output)
	quit()

func check_movement(ok: bool) -> void:
	assert(ok,"actual held-key input moves through the atmosphere scene")
