extends SceneTree
var scene: Node3D
var output := ""
var elapsed := 0.0
func _initialize() -> void: run.call_deferred()
func _process(dt: float) -> bool:
	elapsed+=dt
	if elapsed>55: quit(3)
	return false
func capture(title: String) -> void:
	for i in 12: await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(title+".png"))
func tap(button: Button) -> void:
	var at := root.get_final_transform()*button.get_global_rect().get_center()
	for pressed in [true,false]:
		var event := InputEventMouseButton.new()
		event.position=at
		event.button_index=MOUSE_BUTTON_LEFT
		event.pressed=pressed
		root.push_input(event)
	for i in 4: await process_frame
func key(code: Key, pressed: bool) -> void:
	var event := InputEventKey.new()
	event.keycode=code
	event.physical_keycode=code
	event.pressed=pressed
	Input.parse_input_event(event)
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2); return
	output=args[0]
	DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/town/play.tscn").instantiate()
	if "--fallback" in args: scene.pack_path="Z:/no-private-pack"
	root.add_child(scene)
	for i in 30: await process_frame
	await capture("town")
	var before: Vector3=scene.player.position
	key(KEY_W,true)
	await create_timer(.25).timeout
	key(KEY_W,false)
	assert(scene.player.position.z<before.z,"held key walks in town")
	await tap(scene.menu_button)
	await tap(scene.modal_buttons[0])
	await capture("party-menu")
	scene.close_menu()
	scene.player.position=Vector3(-7,0,-1.4)
	scene._update_camera()
	await capture("center-door")
	key(KEY_E,true)
	key(KEY_E,false)
	for i in 5: await process_frame
	assert(scene.room=="center","E enters center")
	scene.player.position.z=.7
	scene._update_camera()
	scene.supplies.team[0].hp=1
	scene.interact()
	await capture("center")
	var restore: Button
	for child in scene.dialogue.get_children():
		if child is Button and child.text=="Restore": restore=child
	await tap(restore)
	assert(scene.supplies.team[0].hp==scene.supplies.team[0].max_hp,"pointer heal restores HP")
	await capture("healing")
	scene.change_room("town")
	scene.player.position=Vector3(7,0,-1.4)
	scene.interact()
	scene.player.position.z=.7
	scene._update_camera()
	scene.interact()
	await capture("mart")
	var buy: Button
	for child in scene.dialogue.get_children():
		if child is Button and child.text=="Ball  75": buy=child
	await tap(buy)
	assert(scene.coins==225,"pointer shop purchase charges 75")
	scene.change_room("town")
	scene.player.position=Vector3(0,0,6)
	scene.companion.position=Vector3(-1,0,7)
	scene._update_camera()
	scene.set_night(true)
	await capture("night")
	scene.set_rain(true)
	await capture("night-rain")
	scene.set_rain(false)
	scene.set_night(false)
	scene.player.position=Vector3(0,0,12)
	scene.interact()
	scene.player.position=Vector3(122,0,-2)
	scene._update_camera()
	await capture("trail")
	scene.interact()
	for i in 4: await process_frame
	assert(scene.battle!=null,"trail encounter")
	scene.battle.sounds.on=false
	await tap(scene.battle.buttons[4])
	await tap(scene.battle.buttons[0])
	await tap(scene.battle.buttons.back())
	assert(scene.active and scene.player.position==Vector3(122,0,-2),"pointer run returns to exact trail spot")
	scene.Art.cache.clear()
	scene.queue_free()
	for i in 5:
		await process_frame
		await RenderingServer.frame_post_draw
	print("Town native input/heal/shop/battle capture passed: "+output)
	quit()
