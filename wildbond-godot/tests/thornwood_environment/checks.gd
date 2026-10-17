extends RefCounted
const Scene := preload("res://tests/thornwood_environment/scene.gd")

static func run(tree: SceneTree, check: Callable, private_pack: bool = false) -> void:
	var sources: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/thornwood_environment/assets/kenney/sources.json"))
	for file in sources.files:
		check.call(FileAccess.get_sha256("res://tests/thornwood_environment/assets/kenney/"+file.file)==file.sha256,"selected GLB is unchanged from source")
	var scene := Scene.new()
	scene.pack_path = "Z:/no-private-pack" if not private_pack else scene.Pack.configured_root()
	tree.root.add_child(scene)
	await tree.process_frame
	check.call(scene.props.size()>55 and scene.occluders.size()>20,"forest uses measured 3D model instances")
	check.call(scene.water != null and scene.water_material.shader != null,"animated water exists")
	check.call(scene.environment.fog_enabled and scene.sun.shadow_enabled,"environment depth and directional shadows configured")
	var occluder: Node3D = scene.occluders[0]
	var tree_before := occluder.position
	occluder.position=scene.player.position+Vector3(0,0,3)
	scene._process(.3)
	check.call(occluder.get_meta("meshes")[0].transparency > .5,"foreground scenery fades rather than hiding player")
	occluder.position=tree_before
	for c in scene.ui.get_children():
		if c is Button: check.call(c.position.y+c.size.y<=216,"native overlay button stays within game window")
	check.call(scene._blocked(Vector3(-6,0,1)) and scene._blocked(Vector3(-6,0,3.9)),"pond interior and shoreline cannot be walked through")
	check.call(not scene._blocked(Vector3(0,0,5)),"trail start remains walkable")
	var before := scene.player.position
	scene.move_player(Vector2.UP,.2)
	check.call(scene.player.position.z < before.z,"walking remains functional")
	scene.player.position=Vector3(-2.7,0,1)
	scene.move_player(Vector2.LEFT,.2)
	check.call(scene.player.position.x > -3,"walking cannot enter pond")
	scene.set_night(true)
	check.call(scene.lamps[0].light_energy > 1 and scene.motes[0].visible,"night lights and fireflies activate")
	scene.set_rain(true)
	check.call(scene.splashes[0].visible and not scene.motes[0].visible,"rain adds water impacts and hides fireflies")
	check.call(scene.ground_material.get_shader_parameter("wetness")==1.0,"rain changes ground material")
	scene.set_rain(false)
	scene.set_night(false)
	check.call(not scene.splashes[0].visible and scene.lamps[0].light_energy < .1,"day clears rain and dims lantern light")
	scene.player.position=Vector3(1,0,2)
	scene.enter_battle()
	await tree.process_frame
	check.call(not scene.active and scene.battle!=null,"near creature opens reused battle")
	scene.battle.sounds.on=false
	scene.battle._act({"kind":"run"})
	while not scene.battle.event.is_empty(): scene.battle._continue()
	scene.battle.return_to_world.emit(scene.battle.model.result)
	await tree.process_frame
	check.call(scene.active and scene.player.position==Vector3(1,0,2),"battle return restores exact position")
	scene.open_bag()
	check.call(scene.bag != null,"bag remains available")
	scene.close_bag()
	scene.Art.cache.clear()
	scene.queue_free()
	await tree.process_frame
	await tree.process_frame
