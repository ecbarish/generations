extends SceneTree
const Map := preload("res://tests/opening/map.gd")
const Profile := preload("res://tests/journey/profile.gd")
var passed := 0
var failed := 0
var path := ""
func _initialize() -> void: run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok: passed+=1
	else: failed+=1;printerr("FAIL: "+title)
func route(map: RefCounted, a: Vector2i, b: Vector2i) -> Array:
	var queue := [a];var parent := {a:a};var index := 0
	while index<queue.size():
		var here: Vector2i=queue[index];index+=1
		if here==b: break
		for direction in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
			var next: Vector2i=here+direction
			if not parent.has(next) and not map.blocked(Map.point(next)): parent[next]=here;queue.append(next)
	if not parent.has(b): return []
	var found := [b]
	while found.back()!=a: found.append(parent[found.back()])
	found.reverse();return found
func walk(scene: Node, target: Vector2i) -> bool:
	var steps := route(scene.world_map,Map.tile(scene.player.position),target)
	if steps.is_empty():return false
	for cell in steps:
		var point := Map.point(cell)
		for i in 100:
			var delta: Vector3=point-scene.player.position
			if delta.length()<.045:break
			scene.move_player(Vector2(delta.x,delta.z).normalized(),minf(.025,delta.length()/4.8),true)
	return scene.player.position.distance_to(Map.point(target))<.07
func drain(scene: Node) -> void:
	while not scene.battle.event.is_empty():scene.battle._continue()
func story(scene: Node) -> void:
	while not scene.story_queue.is_empty():scene._next_story()
	scene._next_story();scene.close_dialogue()
func run() -> void:
	path="user://wb_opening_checks_%d.json" % OS.get_process_id()
	Profile.Safe.remove(path)
	var store := Profile.new();store.open_profile(path);store.start("pokemon:194");store.state.coins=411;store.state.room="trail";store.state.position=[122,-2];store.save()
	var scene=load("res://tests/opening/play.tscn").instantiate()
	scene.save_path=path;scene.pack_path=scene.Pack.configured_root() if "--private" in OS.get_cmdline_user_args() else "Z:/no-private-pack"
	root.add_child(scene);await process_frame
	check(scene.supplies.team[0].id=="pokemon:194" and scene.coins==411,"earlier chapter party and wallet survive the new geography")
	check(Map.tile(scene.player.position)==Vector2i(11,7) and scene.room=="town","old prototype coordinates receive a safe measured-town landing")
	check(scene.world_map.glyph(Vector2i(0,7))=="." and scene.world_map.blocked(Map.point(Vector2i(-15,7))),"west branch is open and the Larkburrow mouth stays closed")
	for place in scene.places:
		var target: Vector2i=Map.tile(place.at)
		var reachable := not route(scene.world_map,Vector2i(11,7),target).is_empty()
		if scene.world_map.blocked(place.at):
			for offset in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
				if not route(scene.world_map,Vector2i(11,7),target+offset).is_empty(): reachable=true
		check(reachable,"walkable approach reaches "+place.label)
	check(scene.world_map.blocked(Map.point(Vector2i(0,-8))) and scene.world_map.blocked(Map.point(Vector2i(4,3))),"pond and building cells block walking")
	check(scene.world_map.blocked(Map.point(Vector2i(31,-10))),"Dewcut approach ends at a real boundary")
	check(walk(scene,Vector2i(-13,7)) and scene.world_map.area(scene.player.position)=="Millgrass Lane","actual collision-aware walking reaches Millgrass")
	check(walk(scene,Vector2i(11,-7)) and scene.world_map.area(scene.player.position)=="Thornwood Trail","actual walking crosses town/forest connector with no teleport")
	check(walk(scene,Vector2i(29,-10)) and scene.world_map.area(scene.player.position)=="Dewcut Approach","actual walking reaches east approach and can return")
	check(walk(scene,Vector2i(9,11)),"actual walking returns to Maren")
	scene.interact()
	check(scene.chapter.met_maren and scene.dialogue!=null,"Maren introduction uses the original character anchor")
	story(scene)
	check("Catch" in scene.hint.text,"first outing guidance follows meeting Maren")
	check(walk(scene,Map.tile(scene.creature.position)),"wild encounter is accessible from town")
	scene.interact();scene.battle.sounds.on=false
	scene.battle.model.foe.hp=1
	var m: RefCounted=scene.battle.model
	var values: Dictionary=m.MuseMath.catch_values(m.foe.max_hp,1,1.0,m.foe.status,1.0,m.foe.catch_rate)
	var rng := RandomNumberGenerator.new()
	for seed_value in 1000:
		rng.seed=seed_value;rng.randi_range(0,m.available(m.foe).size()-1)
		if m.MuseMath.shake_count(values,rng)==4:m.rng.seed=seed_value;break
	scene.battle._act({"kind":"catch"});drain(scene)
	check(scene.battle.model.result=="caught","actual chapter encounter can be caught")
	var before: Vector3=scene.return_position
	scene.battle.return_to_world.emit("caught");scene.close_dialogue();await process_frame
	check(scene.supplies.team.size()==2 and scene.player.position==before,"caught partner joins and exact trail position returns")
	check(walk(scene,Vector2i(4,5)),"safe route leads home to the healing inn")
	scene.interact();check(scene.room=="center","measured inn door opens the existing healing room")
	scene.player.position.z=.5;scene.interact();scene.heal_party();scene.close_dialogue()
	check(scene.profile.state.healed_after_catch,"healing fulfills the saved return requirement")
	scene.player.position.z=3;scene.interact()
	check(scene.room=="town" and Map.tile(scene.player.position)==Vector2i(4,5),"leaving inn restores its exact measured doorstep")
	walk(scene,Vector2i(9,11));scene.interact();scene.close_dialogue()
	check(scene.chapter.reported,"reporting to Maren completes the outing")
	var balls: int=scene.supplies.lures;var berries: int=scene.supplies.berries
	scene.interact();scene.close_dialogue()
	check(scene.supplies.lures==balls and scene.supplies.berries==berries,"Maren's supply reward cannot repeat")
	walk(scene,Vector2i(13,7));scene.interact();story(scene)
	scene.begin_encounter("wren","pokemon:16");scene.battle.sounds.on=false
	check(scene.battle.trainer_name=="Wren" and scene.battle.buttons[3].disabled and scene.battle.buttons[4].disabled,"Wren is a trainer with catch/run disabled")
	balls=scene.battle.model.lures
	scene.battle._act({"kind":"catch"});scene.battle._act({"kind":"run"})
	check(scene.battle.model.state=="choose" and scene.battle.model.lures==balls,"trainer restrictions also protect model and item counts")
	scene.battle.model.foe.hp=1;scene.battle.model.team[0].speed=999;scene.battle.model.rng.seed=123
	scene.battle._act({"kind":"move","id":"water-gun"});drain(scene)
	check(scene.battle.model.result=="won","actual turn-based attack wins the controlled trainer regression")
	scene.battle.return_to_world.emit("won");story(scene)
	check(scene.chapter.wren,"Wren's result is saved")
	var coins: int=scene.coins
	scene.begin_encounter("wren","pokemon:16")
	check(scene.battle==null and scene.coins==coins,"completed trainer cannot be farmed through repeated start")
	walk(scene,Vector2i(11,-13));scene.begin_encounter("bram","pokemon:37");scene.battle.sounds.on=false
	for c in scene.battle.model.team:c.hp=0;c.status="burn"
	scene.battle.model._end("lost");scene.battle.return_to_world.emit("lost");scene.close_dialogue()
	check(not scene.chapter.bram and Map.tile(scene.player.position)==Vector2i(4,5) and scene.supplies.team[0].hp==scene.supplies.team[0].max_hp,"trainer defeat allows retry and returns safely beside the measured inn")
	walk(scene,Vector2i(22,12));coins=scene.coins;scene.interact();scene.close_dialogue();scene.interact();scene.close_dialogue()
	check(scene.coins==coins+30 and "lh1" in scene.chapter.items,"original item reward is one-time")
	scene.open_map();await process_frame
	check(scene.menu!=null and scene.detail!=null,"in-game map uses a paused overlay")
	var position: Vector3=scene.player.position
	var key := InputEventKey.new();key.physical_keycode=KEY_D;key.keycode=KEY_D;key.pressed=true;Input.parse_input_event(key)
	await process_frame;await process_frame
	key.pressed=false;Input.parse_input_event(key)
	await process_frame
	check(scene.player.position==position,"map pauses walking")
	scene.close_menu()
	walk(scene,Vector2i(-10,7));check(scene.save_progress() and Profile.valid(scene.profile.state),"measured position and goals form a valid persisted checkpoint")
	position=scene.player.position
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	var reopened=load("res://tests/opening/play.tscn").instantiate();reopened.save_path=path;reopened.pack_path="Z:/no-private-pack";root.add_child(reopened);await process_frame
	check(reopened.player.position.is_equal_approx(position) and reopened.chapter.reported and reopened.chapter.wren and reopened.supplies.team.size()==2,"fresh scene resumes branch position, goals, trainer result and collection")
	reopened.change_room("center");reopened.player.position.z=.5;reopened.save_progress()
	var saved := Profile.new();check(saved.open_profile(path) and is_equal_approx(float(saved.state.opening.position[0]),position.x),"interior save checkpoints outdoors instead of in an invalid room")
	var invalid := saved.state.duplicate(true);invalid.opening.position=[INF,0]
	check(not Profile.valid(invalid),"nonfinite opening coordinates rejected")
	invalid=saved.state.duplicate(true);invalid.opening.items=["lh1","lh1"]
	check(not Profile.valid(invalid),"duplicate item claims rejected")
	invalid=saved.state.duplicate(true);invalid.opening.reported=true;invalid.first_catch=false
	check(not Profile.valid(invalid),"inconsistent quest completion rejected")
	var future := saved.state.duplicate(true);future.opening.version=3
	var f := FileAccess.open(path+".tmp",FileAccess.WRITE);f.store_string(JSON.stringify(future));f.close()
	var held := Profile.new();check(not held.open_profile(path) and held.hold and not held.save(),"future nested checkpoint protects the earlier valid primary")
	reopened.no_save=true;reopened.Art.cache.clear();reopened.queue_free();await process_frame;await process_frame
	Profile.Safe.remove(path)
	Profile.Safe.remove(path+".pre-opening-v2")
	print("Opening chapter checks: %d passed, %d failed" % [passed,failed]);quit(1 if failed else 0)
