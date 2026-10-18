extends SceneTree
const Sight := preload("res://tests/opening/sight_lines.gd")
const Profile := preload("res://tests/journey/profile.gd")
var passed := 0
var failed := 0
var output := ""
func _initialize() -> void:run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok:passed+=1
	else:failed+=1;printerr("FAIL: "+title)
func snap(name: String) -> void:
	if output=="" or DisplayServer.get_name()=="headless":return
	for i in 14:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(name+".png"))
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if "--capture" in args:
		output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
	var wide := AABB(Vector3(-4,0,-1),Vector3(8,4,3))
	check(Sight.covers(wide,Vector3(3.5,8,12),Vector3(3.5,0,-3)),"wide roof edge protects a person far from the footprint center")
	check(not Sight.covers(wide,Vector3(0,8,12),Vector3(0,0,5)),"building behind the subject stays opaque")
	check(not Sight.covers(wide,Vector3(10,8,12),Vector3(10,0,-3)),"unrelated building beside the sight line stays opaque")
	var scene=load("res://tests/opening/play.tscn").instantiate()
	var path := "user://wb_centers_%d.json" % OS.get_process_id()
	scene.save_path=path;scene.no_save=true
	scene.pack_path=scene.Pack.configured_root() if "--private" in args else "Z:/no-private-pack"
	root.add_child(scene);await process_frame
	scene.start_journey("wildbond:ripplet");scene.close_dialogue();scene.close_menu()
	check(scene.sight_buildings.size()==6,"all six actual chapter buildings participate in visibility")
	check(scene.npc_art.has("healer") and scene.npc_art.has("shopkeeper"),"service staff exist even when the private pack is absent")
	for who in scene.VISITORS:
		var visitor: Node3D=scene.npc_art[who]
		var data: Dictionary=scene.VISITORS[who]
		check(scene.npc_art.has(who),"authored visitor exists: "+who)
		if data.room=="town":
			check(not scene.world_map.blocked(visitor.position),"outdoor visitor starts on a walkable tile: "+who)
			for place in scene.places:
				if place.kind in ["center","thornwood_center","mart","ranch"]:check(visitor.position.distance_to(place.at)>1.5,"visitor leaves door approach clear: "+who+"/"+place.kind)
		else:
			scene.room="center"
			check(not scene._blocked(visitor.position),"waiting visitor avoids beds and service counter: "+who)
		if "--private" in args:check(scene.npc_actors[who].role==data.role and scene.npc_actors[who].body.texture is AtlasTexture,"visitor uses complete installed Pokemon NPC frames: "+who)
	scene.room="town";scene.player.position=scene.Map.point(Vector2i(4,5));scene._update_camera()
	scene.change_room("center")
	check(scene._nearest().kind=="exit","entrance remains free and usable")
	for who in ["resting_traveler","young_tamer"]:
		scene.player.position=scene.npc_art[who].position+Vector3(0,0,.5);scene._reset_follow();scene._update_camera()
		check(scene._nearest().get("who")==who,"waiting person can be approached and spoken to: "+who)
		scene.interact();check(scene._modal(),"visitor opens real in-world conversation: "+who);scene.close_dialogue()
	scene.player.position=Vector3(60,0,.2);scene._update_camera()
	check(scene._nearest().kind=="heal","visitors do not steal the central healer interaction")
	scene.supplies.team[0].hp=1;scene.heal_party();scene.close_dialogue()
	check(scene.supplies.team[0].hp==scene.supplies.team[0].max_hp,"populated healing room still restores partners")
	scene.player.position=Vector3(60,0,2.3);scene._reset_follow();scene._update_camera()
	await snap("healing-room" )
	scene.change_room("town")
	check(scene.Map.tile(scene.player.position)==Vector2i(4,5),"populated room retains its actual outdoor doorway")
	scene.player.position=scene.Map.point(Vector2i(4,1));scene._reset_follow();scene._update_camera()
	check(not scene.world_map.blocked(scene.player.position),"rear sight-line capture is an actual walkable tile")
	for i in 12:scene._actor_visibility(1.0/60)
	var inn: Node3D=scene.sight_buildings[0]
	check(float(inn.get_meta("sight_fade"))>.9,"actual wide inn cuts away when player walks behind it")
	check(inn.get_meta("meshes").all(func(mesh):return mesh.transparency>.9),"roof, walls and facade fade together")
	await snap("behind-inn")
	scene.player.position=scene.Map.point(Vector2i(11,7));scene._reset_follow();scene._update_camera()
	for i in 12:scene._actor_visibility(1.0/60)
	check(is_zero_approx(float(inn.get_meta("sight_fade"))),"inn returns to opaque after leaving its sight line")
	await snap("inn-plaza")
	var neighbor: Node3D=scene.npc_art.inn_neighbor
	var home := neighbor.position
	neighbor.position=scene.Map.point(Vector2i(6,1))
	scene.player.position=scene.Map.point(Vector2i(8,1));scene._reset_follow();scene._update_camera()
	var box := Sight.world_bounds(inn.get_meta("meshes"))
	check(not Sight.covers(box,scene.camera.position,scene.player.position) and Sight.covers(box,scene.camera.position,neighbor.position),"nearby NPC can be covered while the player's own sight line is clear")
	for i in 12:scene._actor_visibility(1.0/60)
	check(float(inn.get_meta("sight_fade"))>.9,"building cutaway protects nearby people as well as the player")
	neighbor.position=home
	scene.player.position=scene.Map.point(Vector2i(8,-27));scene._reset_follow();scene._update_camera()
	await snap("gate-loft-visitor")
	scene.player.position=scene.Map.point(Vector2i(3,-27));scene.change_room("center")
	check(scene.location.text=="THORNWOOD / GATE LOFT" and scene.npc_art.resting_traveler.position.x<60,"Gate Loft also presents the populated shared healing interior")
	scene.player.position=Vector3(60,0,2.3);scene._reset_follow();scene._update_camera();await snap("gate-loft-room")
	scene.change_room("town");scene.player.position=scene.Map.point(Vector2i(13,7));scene._reset_follow();scene._update_camera()
	scene.begin_encounter("wren","pokemon:16");scene.battle.sounds.on=false
	check(scene.battle.model.foe.id=="pokemon:16","battle presentation keeps Pidgey's exact species identity")
	if "--private" in args:
		var front: Dictionary=scene.pack.battle_frame("pokemon:16",false)
		check(not front.is_empty(),"actual Pidgey front frame comes from the installed private pack")
	await snap("pidgey-art")
	check(not Profile.Safe.exists(path),"visual checks never write a player or test checkpoint")
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	print("Lived-in centers checks: %d passed, %d failed" % [passed,failed]);quit(1 if failed else 0)
