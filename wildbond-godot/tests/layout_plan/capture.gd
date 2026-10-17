extends SceneTree
var scene: Node3D
var output := ""
func _initialize() -> void: run.call_deferred()
func capture(title: String) -> void:
	for i in 12: await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(title+".png"))
func key(code: Key, pressed: bool) -> void:
	var e := InputEventKey.new()
	e.keycode=code
	e.physical_keycode=code
	e.pressed=pressed
	Input.parse_input_event(e)
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2); return
	output=args[0]
	DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/layout_plan/play.tscn").instantiate()
	if "--fallback" in args: scene.pack_path="Z:/no-private-pack"
	root.add_child(scene)
	for i in 20: await process_frame
	await capture("walking-view")
	var before: Vector3=scene.player.position
	key(KEY_W,true)
	await create_timer(.25).timeout
	key(KEY_W,false)
	assert(scene.player.position.z<before.z,"held walking moves trainer")
	key(KEY_TAB,true)
	key(KEY_TAB,false)
	for i in 3: await process_frame
	assert(scene.overhead,"Tab opens overhead view")
	await capture("overhead-planned")
	key(KEY_P,true)
	key(KEY_P,false)
	for i in 3: await process_frame
	assert(not scene.proposed,"P switches current geometry")
	await capture("overhead-current")
	scene.queue_free()
	for i in 4:
		await process_frame
		await RenderingServer.frame_post_draw
	print("Layout native held-key/camera/toggle capture passed.")
	quit()
