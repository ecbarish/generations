extends SceneTree
const Map := preload("res://tests/opening/map.gd")
const Profile := preload("res://tests/journey/profile.gd")
const Before := preload("res://tests/opening/profile_before_town.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
var passed := 0
var failed := 0
var path := ""
var output := ""
func _initialize() -> void:run.call_deferred()
func check(ok: bool, label: String) -> void:
	if ok:passed+=1
	else:failed+=1;printerr("FAIL: "+label)
func clear_files(target: String) -> void:
	for suffix in ["",".pre-opening-v2",".pre-v2",".pre-v3"]:Profile.Safe.remove(target+suffix)
func route(map: RefCounted, start: Vector2i, end: Vector2i) -> Array:
	var queue := [start];var parent := {start:start};var index := 0
	while index<queue.size():
		var at: Vector2i=queue[index];index+=1
		if at==end:break
		for direction in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
			var next: Vector2i=at+direction
			if not parent.has(next) and not map.blocked(Map.point(next)):parent[next]=at;queue.append(next)
	if not parent.has(end):return []
	var found := [end]
	while found.back()!=start:found.append(parent[found.back()])
	found.reverse();return found
func walk(scene: Node, target: Vector2i) -> bool:
	var steps := route(scene.world_map,Map.tile(scene.player.position),target)
	for tile in steps:
		var point := Map.point(tile)
		for i in 100:
			var delta: Vector3=point-scene.player.position
			if delta.length()<.045:break
			scene.move_player(Vector2(delta.x,delta.z).normalized(),minf(.025,delta.length()/4.8),true)
	return not steps.is_empty() and scene.player.position.distance_to(Map.point(target))<.07
func raw(target: String, value: Dictionary) -> void:
	var file := FileAccess.open(target,FileAccess.WRITE);file.store_string(JSON.stringify(value));file.close()
func drain(view: Node) -> void:
	var guard := 0
	while not view.event.is_empty() and guard<20:view._continue();guard+=1
func take_shot(scene: Node, name: String) -> void:
	if output=="" or DisplayServer.get_name()=="headless":return
	for i in 4:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(name+".png"))
func release(scene: Node) -> void:
	scene.no_save=true;scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if "--capture" in args:
		output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
	path="user://wb_thornwood_%d.json" % OS.get_process_id();clear_files(path)
	var store := Profile.new();store.open_profile(path);store.start("wildbond:cindercub")
	store.state.team[0]=Catalogue.encode(Catalogue.creature("wildbond:cindercub",12));store.state.team[0].individual=1
	store.state.coins=733
	var old := store.state.duplicate(true)
	old.opening={"version":1,"position":[0,8.75],"met_maren":false,"wren":false,"bram":false,"reported":false,"items":[]}
	raw(path,old)
	var scene=load("res://tests/opening/play.tscn").instantiate();scene.save_path=path
	scene.pack_path=scene.Pack.configured_root() if "--private" in args else "Z:/no-private-pack"
	root.add_child(scene);await process_frame
	scene.close_dialogue();scene.close_menu()
	check(scene.chapter.version==2 and not scene.chapter.thorn_badge and not scene.chapter.thornwood_healed,"old checkpoint receives only safe town defaults")
	check(scene.coins==733 and scene.supplies.team[0].individual==1 and scene.supplies.team[0].level==12,"old wallet and creature identity/level survive upgrade")
	check(walk(scene,Map.Thornwood.HEALER),"actual walking reaches new town's Gate Loft from Larkhaven")
	check(scene.world_map.area(scene.player.position)=="Thornwood","new town has its own area identity")
	check(walk(scene,Map.Thornwood.ISOLDE),"actual walking reaches Isolde beside the hawthorn gate")
	check(scene.world_map.blocked(Map.point(Map.Thornwood.GATE)),"hawthorn gate physically blocks travel before badge")
	check(scene.world_map.blocked(Map.point(Vector2i(10,-44))),"unfinished Saltmarsh remains a physical boundary")
	scene.begin_encounter("isolde","pokemon:16")
	check(scene.battle==null,"first safe-return outing is required before the Warden challenge")
	scene.talk_isolde();check(scene.dialogue!=null,"Isolde explains missing preparation in-world");scene.close_dialogue()
	# Existing opening checks exercise the actual catch/heal/Maren loop. Set its
	# completed fixture here so this suite can focus on town/challenge behavior.
	scene.profile.state.first_catch=true;scene.profile.state.healed_after_catch=true
	scene.chapter.met_maren=true;scene.chapter.reported=true
	check(walk(scene,Map.Thornwood.HEALER),"Gate Loft is reachable from the Warden")
	scene.interact();await process_frame
	check(scene.room=="center" and scene.location.text=="THORNWOOD / GATE LOFT","town door opens the local healing service")
	scene.supplies.team[0].hp=1;scene.supplies.team[0].status="burn"
	for move in scene.supplies.team[0].moves:scene.supplies.team[0].pp[move]=0
	scene.heal_party();scene.close_dialogue()
	check(scene.chapter.thornwood_healed and scene.supplies.team[0].hp==scene.supplies.team[0].max_hp and scene.supplies.team[0].status=="","local healing restores health/status and records the visit")
	check(scene.supplies.team[0].pp.values().all(func(v):return v>0),"local rest restores move uses")
	await take_shot(scene,"gate-loft")
	scene.change_room("town")
	check(Map.tile(scene.player.position)==Map.Thornwood.HEALER,"leaving the local service returns beside its own door")
	check(Profile.Safe.exists(path+".pre-opening-v2"),"first new checkpoint preserves an independent old save")
	check(Profile.Safe.read(path+".pre-opening-v2")==JSON.parse_string(JSON.stringify(old)),"upgrade backup preserves every serialized field of the earlier record")
	var rested := Profile.new();rested.open_profile(path)
	check(rested.state.opening.position==[Map.point(Map.Thornwood.HEALER).x,Map.point(Map.Thornwood.HEALER).z] and rested.state.opening.thornwood_healed,"interior rest saves the actual Thornwood return point and healing flag")
	check(Profile.valid(JSON.parse_string(JSON.stringify(rested.state))),"nested checkpoint versions validate after JSON numeric decoding")
	var older := Before.new();var current_hash := FileAccess.get_sha256(path)
	check(not older.open_profile(path) and older.hold and not older.save() and FileAccess.get_sha256(path)==current_hash,"actual frozen pre-town reader holds nested v2 before backup recovery")
	check(walk(scene,Vector2i(10,-31)),"town plaza approach remains walkable")
	scene._reset_follow();scene._update_camera();await take_shot(scene,"thornwood")
	scene.open_map();await take_shot(scene,"local-map");scene.close_menu()
	check(walk(scene,Map.Thornwood.ISOLDE),"Warden remains reachable after healing")
	scene._reset_follow();scene._update_camera();await take_shot(scene,"hawthorn-gate")
	scene.talk_isolde()
	check(scene.dialogue!=null and scene.story_done.is_valid(),"Warden interaction opens the original introduction before the challenge")
	while scene.story_done.is_valid():scene._next_story()
	for button in scene.dialogue.get_children():
		if button is Button and button.text=="Challenge":button.pressed.emit();break
	await process_frame
	check(scene.battle!=null,"actual Challenge button enters the Warden battle")
	var view=scene.battle;view.sounds.on=false
	check(view.trainer_roster.size()==3 and view.model.foe.id=="pokemon:16" and view.model.foe.level==6,"chapter Warden uses an explicit three-part supported roster")
	check(view.model.validate({"kind":"catch"})!="" and view.model.validate({"kind":"run"})!="","Warden partners cannot be caught or escaped from")
	check(view.buttons[3].disabled and view.buttons[4].disabled,"restricted trainer commands are also disabled in the UI")
	check(not scene.chapter.thorn_badge,"starting a challenge never awards the badge")
	scene._return("won");check(scene.battle==view and not scene.chapter.thorn_badge,"forged early Return cannot award a badge")
	await take_shot(scene,"isolde-battle")
	var turns := 0
	while view.model.state!="ended" and turns<100:
		if view.model.state=="switch":
			for i in view.model.team.size():
				if view.model.team[i].hp>0:view._act({"kind":"switch","target":i});break
		else:
			var moves: Array=view.model.available(view.model.team[view.model.active]);var best := "struggle";var best_score := -1.0
			for id in moves:
				var move: Dictionary=view.model.moves[id]
				var score: float=move.pow*view.model.effectiveness(move.el,view.model.foe)
				if score>best_score:best_score=score;best=id
			view._act({"kind":"move","id":best})
		drain(view);turns+=1
	check(view.model.result=="won" and view.model.sent_out==3,"actual moves defeat all three opponents in order")
	check(view.model.defeated_xp>0,"earlier opponents retain pending XP until the full challenge is won")
	check(not scene.chapter.thorn_badge,"won battle still waits for Return before committing rewards")
	view.return_to_world.emit("won");await take_shot(scene,"thorn-badge");scene.close_dialogue();await process_frame
	check(scene.chapter.thorn_badge and not scene.world_map.blocked(Map.point(Map.Thornwood.GATE)),"Return awards the badge and opens the real gate")
	var coins: int=scene.coins;var xp: int=scene.supplies.team[0].xp
	scene.begin_encounter("isolde","pokemon:16")
	check(scene.battle==null and scene.coins==coins and scene.supplies.team[0].xp==xp,"completed Warden cannot be farmed for coins or XP")
	check(walk(scene,Vector2i(10,-42)),"badge permits actual walking through the hawthorn gate")
	check(scene.world_map.area(scene.player.position)=="Saltmarsh Approach" and scene.world_map.blocked(Map.point(Vector2i(10,-44))),"opened gate leads only to the bounded new approach")
	check(scene.save_progress(),"northern destination coordinates form a valid saved checkpoint")
	await release(scene)
	var reopened=load("res://tests/opening/play.tscn").instantiate();reopened.save_path=path;reopened.pack_path="Z:/no-private-pack"
	root.add_child(reopened);await process_frame
	check(reopened.chapter.thorn_badge and reopened.chapter.thornwood_healed and Map.tile(reopened.player.position)==Vector2i(10,-42),"reopen retains badge, local healing and exact northern position")
	check(not reopened.world_map.blocked(Map.point(Map.Thornwood.GATE)),"reopened badge reapplies gate collision state")
	check(walk(reopened,Vector2i(9,11)),"actual walking returns to Maren from the new destination")
	reopened.show_journey();check(reopened.detail!=null,"Journey exposes saved badge progress in the game menu");reopened.close_menu()
	# Defeat/retry is tested in an independent unsaved checkpoint, never the badge save.
	reopened.chapter.thorn_badge=false;reopened.no_save=true
	reopened.player.position=Map.point(Map.Thornwood.ISOLDE);reopened.begin_encounter("isolde","pokemon:16");await process_frame
	reopened.battle.sounds.on=false
	for c in reopened.battle.model.team:c.hp=0
	reopened.battle.model._end("lost");reopened.battle.return_to_world.emit("lost");reopened.close_dialogue()
	check(not reopened.chapter.thorn_badge and Map.tile(reopened.player.position)==Map.Thornwood.HEALER,"defeat grants no badge and returns to the local healer")
	check(reopened.supplies.team[0].hp==reopened.supplies.team[0].max_hp,"defeat uses the established safe team recovery")
	reopened.begin_encounter("isolde","pokemon:16");check(reopened.battle!=null,"defeated Warden can be retried")
	await release(reopened)
	# Corrupt independent upgrade backup must never be overwritten to finish an upgrade.
	var bad_path := path.trim_suffix(".json")+"_bad.json";clear_files(bad_path);raw(bad_path,old)
	var corrupt := FileAccess.open(bad_path+".pre-opening-v2",FileAccess.WRITE);corrupt.store_string("broken");corrupt.close()
	var bad := Profile.new();bad.open_profile(bad_path);bad.state.opening=load("res://tests/opening/scene.gd").fresh_chapter()
	var hash := FileAccess.get_sha256(bad_path)
	check(not bad.save() and bad.hold and FileAccess.get_sha256(bad_path)==hash,"bad migration backup holds writes without replacing the earlier primary")
	for suffix in ["",".tmp",".bak"]:
		clear_files(bad_path);raw(bad_path,old)
		var future := old.duplicate(true);future.opening.version=3;raw(bad_path+suffix,future)
		var held := Profile.new()
		check(not held.open_profile(bad_path) and held.hold and not held.save(),"future nested checkpoint holds before recovery: "+suffix)
	clear_files(bad_path);clear_files(path)
	var rounds := preload("res://tests/opening/trainer_rounds.gd").new()
	rounds.setup_roster([Catalogue.creature("pokemon:37",8)],[Catalogue.creature("pokemon:16",6),Catalogue.creature("pokemon:194",7)],Catalogue.DATA.moves,7)
	var hp: int=rounds.team[0].hp;var move: String=rounds.team[0].moves[0];rounds.team[0].pp[move]-=1
	var pp: int=rounds.team[0].pp[move]
	rounds.queue=[{"side":"foe","action":{"kind":"move","id":"tackle"}}];rounds.foe.hp=0
	var event := {"text":""};rounds.finish(event)
	check(rounds.queue.is_empty() and rounds.foe.id=="pokemon:194" and rounds.state=="choose","replacement cancels the fainted opponent's pending action")
	check(rounds.team[0].hp==hp and rounds.team[0].pp[move]==pp,"replacement neither heals allies nor refills move uses")
	rounds.setup_roster([Catalogue.creature("pokemon:37",8)],[Catalogue.creature("pokemon:16",6),Catalogue.creature("pokemon:194",7)],Catalogue.DATA.moves,7)
	rounds.team[0].hp=0;rounds.foe.hp=0;rounds.finish({"text":""})
	check(rounds.result=="lost" and rounds.sent_out==1,"double faint with no healthy ally loses before enemy replacement")
	rounds.setup_roster([Catalogue.creature("pokemon:37",8)],[Catalogue.creature("pokemon:16",6)],Catalogue.DATA.moves,7)
	rounds.team[0].hp=0;rounds.foe.hp=0;rounds.finish({"text":""})
	check(rounds.result=="lost","final double faint cannot award a trainer win or badge")
	print("Thornwood destination checks: %d passed, %d failed" % [passed,failed]);quit(1 if failed else 0)
