extends SceneTree
const Profile := preload("res://tests/journey/profile.gd")
var scene: Node3D
var output := ""
var save_path := ""
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
	for down in [true,false]:
		var e := InputEventMouseButton.new()
		e.position=at
		e.button_index=MOUSE_BUTTON_LEFT
		e.pressed=down
		root.push_input(e)
	for i in 4: await process_frame
func button_named(parent: Node, title: String) -> Button:
	for child in parent.get_children():
		if child is Button and child.text==title: return child
	return null
func make_scene(fallback: bool) -> Node3D:
	var s=load("res://tests/journey/play.tscn").instantiate()
	s.save_path=save_path
	if fallback: s.pack_path="Z:/no-private-pack"
	root.add_child(s)
	return s
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty(): quit(2); return
	output=args[0]
	DirAccess.make_dir_recursive_absolute(output)
	save_path="user://wb_journey_capture_%d.json" % OS.get_process_id()
	Profile.Safe.remove(save_path)
	scene=make_scene("--fallback" in args)
	for i in 24: await process_frame
	await capture("choose-partner")
	await tap(scene.modal_buttons[2])
	assert(scene.supplies.team[0].id=="pokemon:194","pointer choice selects Wooper")
	await tap(button_named(scene.dialogue,"Continue"))
	await capture("first-journey")
	scene.change_room("trail")
	scene.player.position=Vector3(122,0,-2)
	scene._update_camera()
	scene.interact()
	scene.battle.sounds.on=false
	await capture("pokemon-battle")
	# Controlled weak wild encounter for deterministic catch/save UI evidence.
	scene.battle.model.foe.hp=1
	var values := preload("res://tests/battle_slice/muse_math.gd").catch_values(scene.battle.model.foe.max_hp,1)
	var rng := RandomNumberGenerator.new()
	for seed_value in 1000:
		rng.seed=seed_value
		rng.randi_range(0,scene.battle.model.available(scene.battle.model.foe).size()-1)
		if preload("res://tests/battle_slice/muse_math.gd").shake_count(values,rng)==4: scene.battle.model.rng.seed=seed_value; break
	await tap(scene.battle.buttons[3])
	while not scene.battle.event.is_empty(): await tap(scene.battle.buttons[0])
	assert(scene.battle.model.result=="caught","pointer catch succeeds in deterministic test fixture")
	await tap(scene.battle.buttons[0])
	assert(scene.supplies.team.size()==2,"capture adds a real party member")
	await tap(button_named(scene.dialogue,"Continue"))
	scene.change_room("town")
	scene.player.position=Vector3(-7,0,-1.4)
	scene.interact()
	scene.player.position.z=.7
	scene._update_camera()
	scene.interact()
	await tap(button_named(scene.dialogue,"Restore"))
	assert(scene.profile.state.healed_after_catch,"catch-and-return objective completes")
	await capture("caught-and-restored")
	await tap(button_named(scene.dialogue,"Continue"))
	scene.change_room("town")
	scene.player.position=Vector3(0,0,6)
	scene.save_progress()
	scene.Art.cache.clear()
	scene.queue_free()
	for i in 5: await process_frame
	scene=make_scene("--fallback" in args)
	for i in 12: await process_frame
	assert(scene.profile.state.healed_after_catch and scene.supplies.team.size()==2,"fresh scene resumes saved collection and milestone")
	await tap(scene.menu_button)
	await tap(scene.modal_buttons[0])
	await capture("saved-party")
	scene.no_save=true
	scene.Art.cache.clear()
	scene.queue_free()
	for i in 5:
		await process_frame
		await RenderingServer.frame_post_draw
	Profile.Safe.remove(save_path)
	print("Journey native partner/catch/heal/save/reopen capture passed.")
	quit()
