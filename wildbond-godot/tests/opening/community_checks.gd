extends "res://tests/opening/centers_checks.gd"
const Community := preload("res://tests/opening/community_center.gd")

func walk(scene: Node, target: Vector3) -> bool:
	var start := Vector2i(roundi((scene.player.position.x-60)*2),roundi(scene.player.position.z*2))
	var end := Vector2i(roundi((target.x-60)*2),roundi(target.z*2))
	var queue := [start];var parents := {start:start};var index := 0
	while index<queue.size():
		var cell: Vector2i=queue[index];index+=1
		if cell==end:break
		for delta in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
			var next: Vector2i=cell+delta
			if not parents.has(next) and not scene._blocked(Vector3(60+next.x*.5,0,next.y*.5)):
				parents[next]=cell;queue.append(next)
	if not parents.has(end):return false
	var route := [end]
	while route.back()!=start:route.append(parents[route.back()])
	route.reverse()
	for cell in route:
		var at := Vector3(60+cell.x*.5,0,cell.y*.5)
		for i in 80:
			var delta: Vector3=at-scene.player.position
			if delta.length()<.035:break
			scene.move_player(Vector2(delta.x,delta.z).normalized(),minf(.025,delta.length()/4.8),true)
	return scene.player.position.distance_to(Vector3(60+end.x*.5,0,end.y*.5))<.05

func run() -> void:
	var args := OS.get_cmdline_user_args()
	if "--capture" in args:
		output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
	var path := "user://wb_community_%d.json" % OS.get_process_id()
	for suffix in ["",".pre-opening-v2",".pre-v2",".pre-v3"]:Profile.Safe.remove(path+suffix)
	var scene=load("res://tests/opening/play.tscn").instantiate();scene.save_path=path
	scene.pack_path=scene.Pack.configured_root() if "--private" in args else "Z:/no-private-pack"
	root.add_child(scene);await process_frame
	scene.start_journey("wildbond:ripplet");scene.close_dialogue();scene.close_menu()
	var individual: int=scene.supplies.team[0].individual
	var coins: int=scene.coins
	check(scene.npc_art.size()==13,"community room and town retain all thirteen people")
	for door in [Vector2i(4,5),Vector2i(3,-27)]:
		scene.player.position=scene.Map.point(door);scene._reset_follow();scene._update_camera();scene.interact()
		check(scene.room=="center" and scene.player.position==Community.ENTRY,"both centers enter through the larger room's doorway")
		check(scene._nearest().get("kind")=="exit","only the central entrance pad offers the exit")
		check(walk(scene,Vector3(60,0,-2.5)),"actual movement follows the central hall to reception")
		check(scene._nearest().get("kind")=="heal","healing desk stays discoverable at the end of the main aisle")
		scene.supplies.team[0].hp=1;scene.supplies.team[0].status="burn"
		for move in scene.supplies.team[0].moves:scene.supplies.team[0].pp[move]=0
		scene.interact();check(scene._modal(),"healing desk opens its real restore conversation")
		scene.heal_party();scene.close_dialogue()
		check(scene.supplies.team[0].hp==scene.supplies.team[0].max_hp and scene.supplies.team[0].status=="" and scene.supplies.team[0].pp.values().all(func(v):return v>0),"expanded room preserves full HP/status/PP healing")
		check(walk(scene,Community.BOARD),"noticeboard can be reached around the lounge and rest bed")
		check(scene._nearest().get("kind")=="community_board","local noticeboard has its own interaction")
		scene.interact();check(scene._modal(),"noticeboard opens local information inside the game");await snap("local-notices");scene.close_dialogue()
		check(walk(scene,Community.STORAGE),"partner terminal is reachable without crossing the staff desk")
		check(scene._nearest().get("kind")=="community_storage","terminal offers existing partner storage")
		scene.interact();check(scene.menu!=null and scene.detail!=null,"terminal opens the real storage menu");await snap("partner-storage");scene.close_menu()
		for who in ["resting_traveler","young_tamer","route_planner","community_helper"]:
			check(walk(scene,scene.npc_art[who].position+Vector3(0,0,.5)),"actual room walking reaches visitor: "+who)
			check(scene._nearest().get("who")==who,"visitor beside its activity can be spoken to: "+who)
			scene.interact();check(scene._modal(),"community conversation opens: "+who);scene.close_dialogue()
		check(walk(scene,Vector3(52.5,0,2)),"lounge side has usable walking space beyond the old room footprint")
		check(scene._nearest().get("kind")!="exit","standing in a side lounge never accidentally exits the center")
		check(walk(scene,Vector3(65,0,2.5)),"gathering table has an accessible approach")
		for actor in scene.npc_art.values():
			if actor.position.x<51 or actor.position.x>69:continue
			var point: Vector2=scene.camera.unproject_position(actor.position+Vector3(0,.8,0))
			var frame_size: Vector2=scene.camera.get_viewport().get_visible_rect().size
			check(point.x>8 and point.x<frame_size.x-8 and point.y>frame_size.y*.13 and point.y<frame_size.y*.9,"fixed room camera frames every person's head away from the HUD")
		check(walk(scene,Vector3(60,0,2.3)),"player can return from the side spaces to the main hall")
		await snap("community-room" if door.x==4 else "gate-loft-community")
		check(scene.save_progress(),"expanded interior saves through the existing outdoor checkpoint")
		var loaded := Profile.new();check(loaded.open_profile(path) and loaded.state.opening.position==[scene.Map.point(door).x,scene.Map.point(door).z],"room save records its own unchanged outdoor doorstep")
		check(loaded.state.team[0].individual==individual and loaded.state.coins==coins,"visiting community services preserves creature identity and wallet")
		check(walk(scene,Community.ENTRY),"actual movement returns to the main exit")
		scene.interact();check(scene.room=="town" and scene.Map.tile(scene.player.position)==door,"actual exit returns to the correct town door")
	check(Community.blocked(Vector3(60,0,-3.7)) and Community.blocked(Vector3(66,0,.4)),"desk and shared table have real collision")
	check(Community.blocked(Vector3(70,0,0)) and Community.blocked(Vector3(60,0,7)),"larger room retains physical exterior boundaries")
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	var reopened=load("res://tests/opening/play.tscn").instantiate();reopened.save_path=path;reopened.pack_path="Z:/no-private-pack";root.add_child(reopened);await process_frame
	check(reopened.Map.tile(reopened.player.position)==Vector2i(3,-27) and reopened.supplies.team[0].individual==individual,"fresh reload keeps the local return and original party")
	reopened.no_save=true;reopened.Art.cache.clear();reopened.queue_free();await process_frame;await process_frame
	for suffix in ["",".pre-opening-v2",".pre-v2",".pre-v3"]:Profile.Safe.remove(path+suffix)
	print("Community center checks: %d passed, %d failed" % [passed,failed]);quit(1 if failed else 0)
