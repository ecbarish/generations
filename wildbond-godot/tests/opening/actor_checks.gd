extends SceneTree
const Pack := preload("res://tests/private_sprites/pack.gd")
const Actor := preload("res://tests/opening/npc_actor.gd")
const Map := preload("res://tests/opening/map.gd")
var passed := 0
var failed := 0
func _initialize() -> void: run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok: passed+=1
	else: failed+=1;printerr("FAIL: "+title)
func run() -> void:
	var pack := Pack.new()
	check(pack.open_pack(pack.configured_root()),"installed private pack loads")
	if pack.npcs.is_empty():printerr(pack.issue);quit(2);return
	check(pack.npcs.size()==6 and pack.entries.size()==3,"six actor roles and all three existing creatures are installed")
	for role in pack.npcs:
		var meta: Dictionary=pack.npcs[role]
		var texture: Texture2D=pack.textures[meta.file]
		check(texture.get_image().get_pixel(0,0).a==0,"background decoded for "+role)
		for logical in 9:
			var frame: Dictionary=pack.npc_frame(role,logical,true)
			var expected: int=int(meta.frame_map[logical])
			var image: Image=frame.texture.get_image().get_region(Rect2i(frame.region))
			var ink := image.get_used_rect()
			check(frame.frame==expected and frame.region.end.x<=texture.get_width() and ink.size!=Vector2i.ZERO,"source pose complete for %s/%d" % [role,logical])
			var bottom := (float(frame.anchor.y)-float(ink.end.y))*float(frame.pixel_size)
			check(is_zero_approx(bottom) and frame.anchor.x==8,"measured feet stay on the ground for %s/%d" % [role,logical])
	check(pack.npc_frame("healer",0,false,true).frame==3 and pack.npc_frame("healer",8).frame==2,"nurse source mapping and bow use the real four-frame layout")
	check(pack.npc_frame("missing",0).is_empty(),"uninstalled roles return no false art")
	for sid in pack.entries:
		var entry: Dictionary=pack.entries[sid]
		var neutral: Dictionary=pack.world_frame(sid,"Idle",0,0)
		var image: Image=neutral.texture.get_image().get_region(Rect2i(neutral.region))
		check(is_equal_approx(image.get_used_rect().size.y*neutral.pixel_size,float(entry.display_height_m)),"neutral creature height matches intended scale: "+sid)
		for state in ["Idle","Walk"]:
			for facing in 8:
				for moment in [0.0,.15,.35,.6]:
					var frame: Dictionary=pack.world_frame(sid,state,facing,moment)
					check(frame.pixel_size==neutral.pixel_size and frame.region.end.x<=frame.texture.get_width() and frame.region.end.y<=frame.texture.get_height(),"fixed-scale complete animation: %s/%s/%d" % [sid,state,facing])
	var actor := Actor.new()
	var home := Map.point(Vector2i(13,7))
	actor.configure(pack,"rival","wren",home,true,0)
	root.add_child(actor)
	var map := Map.new()
	actor.step(.1,0,home+Vector3(2,0,0),true,map)
	check(actor.gait.face==Vector2i.RIGHT and actor.body.flip_h and not actor.gait.moving,"nearby NPC faces player right without walking in place")
	actor.step(.1,0,home+Vector3(0,0,-2),true,map)
	check(actor.gait.face==Vector2i.UP and actor.last_frame==1,"NPC has an actual back-facing idle pose")
	for i in 60:actor.step(1.0/60,3,home+Vector3(10,0,0),true,map)
	check(actor.position.distance_to(home)>.2 and actor.position.distance_to(home)<=.33,"ambient pacing stays close to the authored NPC anchor")
	var before := actor.position
	actor.step(.5,8,home+Vector3(10,0,0),false,map)
	check(actor.position==before and not actor.gait.moving,"paused actor cannot keep walking or sliding")
	for i in 60:actor.step(1.0/60,8,home+Vector3(10,0,0),true,map)
	check(actor.position.is_equal_approx(home),"NPC completes its return step at the original anchor")
	actor.queue_free();await process_frame
	var scene=load("res://tests/opening/play.tscn").instantiate()
	scene.no_save=true;scene.save_path="user://wb_actor_checks_%d.json" % OS.get_process_id()
	root.add_child(scene);await process_frame
	scene.start_journey("pokemon:194");scene.close_dialogue()
	check(scene.npc_actors.size()==13 and scene.npc_actors.maren.role=="caretaker" and scene.npc_actors.wren.role=="rival" and scene.npc_actors.isolde.role=="caretaker","opening replaces all thirteen outdoor/service/visitor actors with imported roles, including Isolde's chapter alias")
	check(scene.npc_art.pip.body.texture is AtlasTexture and scene.npc_art.pip.body.texture.region.size==Vector2(16,16),"Pip uses a complete atlas frame without procedural parts")
	var initial: Vector3=scene.creature.position
	scene.seconds=3;scene.player.position=Map.point(Vector2i(11,7))
	scene._step_wild(.1)
	check(scene.wild_gait.moving and scene.creature.position!=initial,"visible wild creature steps when playing its walk animation")
	scene.player.position=scene.creature.position+Vector3(.7,0,0)
	scene._step_wild(.1)
	check(not scene.wild_gait.moving and scene.wild_gait.direction8==2,"wild creature settles and faces a nearby player")
	var foot: Dictionary=scene.pack.world_frame(scene.selected,"Idle",scene.wild_gait.direction8,scene.seconds)
	check(is_equal_approx(scene.sprite.pixel_size,float(foot.pixel_size)) and is_equal_approx(scene.partner.pixel_size,float(scene.pack.world_pixel_sizes["pokemon:194"])),"wild and follower use the same verified scale policy")
	scene.change_room("center");scene.heal_party();scene.npc_actors.healer.step(0,0,scene.player.position,false,map,true)
	check(scene.npc_actors.healer.last_frame==3 and scene.supplies.team[0].hp==scene.supplies.team[0].max_hp,"healer bows without changing the existing healing behavior")
	check(scene.npc_actors.maren.who=="maren" and scene.Map.SOURCE.CAST.maren.name=="Keeper Maren","imported appearance does not replace Wildbond character identity")
	scene.set_night(true)
	check(scene.npc_actors.maren.body.modulate==scene.human.modulate,"NPC day/night tint agrees with the player trainer")
	var source_hash := FileAccess.get_sha256(scene.pack.source_root.path_join("npcs/caretaker.png"))
	check(source_hash!="" and not FileAccess.file_exists("res://tests/opening/caretaker.png"),"actual NPC source stays external")
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	check(not pack.open_pack("Z:/absent") and pack.npcs.is_empty() and pack.world_pixel_sizes.is_empty(),"failed reopen drops all imported presentation caches")
	print("Actor presentation checks: %d passed, %d failed" % [passed,failed]);quit(1 if failed else 0)
