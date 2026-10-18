extends SceneTree
var scene: Node3D
var output := ""
func _initialize() -> void: run.call_deferred()
func snap(title: String) -> void:
	for i in 15: await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(title+".png"))
func at(cell: Vector2i) -> void:
	scene.player.position=scene.Map.point(cell);scene._reset_follow();scene._update_camera()
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2);return
	output=args[0];DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/opening/play.tscn").instantiate()
	scene.save_path="user://wb_opening_capture_%d.json" % OS.get_process_id();scene.no_save=true
	if "--fallback" in args: scene.pack_path="Z:/no-private-pack"
	root.add_child(scene)
	await process_frame
	scene.start_journey("pokemon:194");scene.close_dialogue()
	await snap("larkhaven")
	var before: Vector3=scene.player.position
	for down in [true,false]:
		var key := InputEventKey.new();key.physical_keycode=KEY_W;key.keycode=KEY_W;key.pressed=down
		Input.parse_input_event(key)
		if down: await create_timer(.35).timeout
	assert(scene.player.position.z<before.z-.3,"held-key walk advances in the measured world")
	for child in scene.ui.get_children():
		if child is Button and child.text=="Map [Tab]":
			var pointer := InputEventMouseButton.new();pointer.position=root.get_final_transform()*child.get_global_rect().get_center();pointer.button_index=MOUSE_BUTTON_LEFT;pointer.pressed=true;root.push_input(pointer)
			pointer=pointer.duplicate();pointer.pressed=false;root.push_input(pointer)
	assert(scene.detail!=null,"pointer opens local map")
	await snap("local-map");scene.close_menu()
	at(Vector2i(9,11));scene.interact()
	await snap("maren")
	scene.close_dialogue();scene.story_queue=[]
	at(Vector2i(11,-7))
	await snap("thornwood")
	at(Vector2i(-10,7))
	await snap("millgrass")
	at(Vector2i(29,-10))
	await snap("dewcut")
	at(Vector2i(13,7));scene.begin_encounter("wren","pokemon:16");scene.battle.sounds.on=false
	await snap("wren-battle")
	scene.battle.model.foe.hp=1;scene.battle.model.team[0].speed=999;scene.battle.model.rng.seed=123
	scene.battle._act({"kind":"move","id":"water-gun"})
	while not scene.battle.event.is_empty():scene.battle._continue()
	assert(scene.battle.model.result=="won","controlled trainer action wins")
	scene.battle.return_to_world.emit("won")
	while not scene.story_queue.is_empty():scene._next_story()
	scene.close_dialogue()
	at(Vector2i(4,5));scene.interact();scene.player.position.z=.5;scene._update_camera();scene.heal_party()
	await snap("healing-inn")
	scene.Art.cache.clear();scene.queue_free()
	for i in 3:await process_frame
	print("Opening native captures completed.")
	quit()
