extends SceneTree
const Profile := preload("res://tests/journey/profile.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
var passed := 0
var failed := 0
var path := ""
func _initialize() -> void: run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok: passed+=1
	else: failed+=1; printerr("FAIL: "+title)
func write_raw(target: String, text: String) -> void:
	var file := FileAccess.open(target,FileAccess.WRITE)
	file.store_string(text)
func drain(battle: Control) -> void:
	while not battle.event.is_empty(): battle._continue()
func caught_fixture(scene: Node) -> void:
	scene.close_dialogue()
	scene.enter_battle()
	scene.battle.sounds.on=false
	scene.battle.model.foe.hp=1
	var values := preload("res://tests/battle_slice/muse_math.gd").catch_values(scene.battle.model.foe.max_hp,1,1.0,scene.battle.model.foe.status,1.0,scene.battle.model.foe.catch_rate)
	var rng := RandomNumberGenerator.new()
	for seed_value in 1000:
		rng.seed=seed_value
		rng.randi_range(0,scene.battle.model.available(scene.battle.model.foe).size()-1)
		if preload("res://tests/battle_slice/muse_math.gd").shake_count(values,rng)==4:
			scene.battle.model.rng.seed=seed_value
			break
	scene.battle._act({"kind":"catch"})
	drain(scene.battle)
	check(scene.battle.model.result=="caught","real catch action succeeds with deterministic test RNG")
	scene.battle.return_to_world.emit("caught")
func run() -> void:
	path="user://wb_journey_checks_%d.json" % OS.get_process_id()
	Profile.Safe.remove(path)
	Profile.Safe.remove(path+".scene")
	var store := Profile.new()
	check(store.open_profile(path) and Profile.valid(store.state),"fresh profile is valid and isolated")
	check(store.start("pokemon:37") and not store.start("pokemon:16"),"partner choice creates one individual and cannot duplicate start")
	check(store.state.team[0].individual==1 and store.state.next_id==2,"individual identity is stable")
	check(store.save(),"first profile save succeeds")
	var saved := Profile.new()
	check(saved.open_profile(path) and saved.state.team[0].species=="pokemon:37","partner choice survives reopening")
	saved.state.team[0].hp=1
	var move: String=Catalogue.creature("pokemon:37").moves[0]
	saved.state.team[0].pp[move]=0
	check(saved.save(),"HP and PP checkpoint saves")
	var reload := Profile.new()
	check(reload.open_profile(path) and reload.state.team[0].hp==1 and reload.state.team[0].pp[move]==0,"remaining health and PP survive reopening")
	for field in ["berries","balls","coins"]:
		var invalid := saved.state.duplicate(true)
		invalid[field]=-1
		check(not Profile.valid(invalid),"negative "+field+" rejected")
	var invalid := saved.state.duplicate(true)
	invalid.team[0].species="../../unknown"
	check(not Profile.valid(invalid),"unknown species rejected")
	invalid=saved.state.duplicate(true)
	invalid.team[0].pp[move]=999
	check(not Profile.valid(invalid),"excess PP rejected")
	invalid=saved.state.duplicate(true)
	invalid.team.append(invalid.team[0].duplicate(true))
	check(not Profile.valid(invalid),"duplicate individual IDs rejected")
	invalid=saved.state.duplicate(true)
	invalid.room="center"
	check(not Profile.valid(invalid),"interiors cannot become unresolved resume checkpoints")
	invalid=saved.state.duplicate(true)
	invalid.position=[120,5]
	check(not Profile.valid(invalid),"position must fit its saved map")
	write_raw(path,"{")
	var recovered := Profile.new()
	check(recovered.open_profile(path) and recovered.state.team[0].hp>1,"truncated primary recovers last valid backup")
	Profile.Safe.remove(path)
	write_raw(path,"not json")
	var broken := Profile.new()
	check(not broken.open_profile(path) and broken.hold,"unrecoverable save holds writes")
	var before := FileAccess.get_sha256(path)
	check(not broken.save() and FileAccess.get_sha256(path)==before,"broken save is never overwritten by a fresh default")
	var future := Profile.fresh()
	future.version=3
	write_raw(path,JSON.stringify(future))
	var newer := Profile.new()
	check(not newer.open_profile(path) and newer.hold and not newer.save(),"future schema stays protected")
	Profile.Safe.remove(path)
	var scene=load("res://tests/journey/scene.gd").new()
	scene.save_path=path+".scene"
	scene.pack_path=scene.Pack.configured_root() if "--private" in OS.get_cmdline_user_args() else "Z:/no-private-pack"
	root.add_child(scene)
	await process_frame
	check(scene.menu!=null and not scene.profile.state.started,"first visit opens partner choice")
	scene.start_journey("pokemon:194")
	scene.close_dialogue()
	check(scene.supplies.team.size()==1 and scene.supplies.team[0].id=="pokemon:194","chosen Pokemon becomes the actual party")
	var berry_count: int=scene.supplies.berries
	scene.change_room("mart")
	scene.buy("berry")
	check(scene.coins==260 and scene.supplies.berries==berry_count+1,"purchase updates persistent wallet and bag")
	scene.close_dialogue()
	scene.change_room("town")
	scene.player.position=Vector3(0,0,12)
	scene.interact()
	scene.player.position=Vector3(122,0,-2)
	scene.supplies.team[0].pp["water-gun"]=0
	scene.enter_battle()
	scene.battle.sounds.on=false
	check(scene.battle.model.team[0].pp["water-gun"]==0,"new battle cannot refill spent PP")
	scene.battle._show("moves")
	var water_index: int=scene.battle.model.team[0].moves.find("water-gun")
	scene.battle.buttons[water_index].mouse_entered.emit()
	check("Water Gun" in scene.battle.message,"move help stays attached to its own button when PP is exhausted")
	scene.battle._show("commands")
	check(scene.battle.model.team[0].id=="pokemon:194" and scene.battle.model.foe.id=="pokemon:16","battle uses Pokemon on both sides")
	scene.battle._act({"kind":"run"})
	drain(scene.battle)
	scene.battle.return_to_world.emit("escaped")
	await process_frame
	check(scene.active and scene.player.position==Vector3(122,0,-2),"battle return preserves exact route position")
	caught_fixture(scene)
	await process_frame
	check(scene.supplies.team.size()==2 and scene.supplies.team[1].id=="pokemon:37","caught Pokemon really joins party")
	check(scene.profile.state.first_catch and scene.coins==280,"catch milestone and reward persist")
	var count: int=scene.supplies.team.size()
	scene._return("caught")
	check(scene.supplies.team.size()==count and scene.coins==280,"duplicate return cannot duplicate catch or reward")
	scene.close_dialogue()
	check(scene.store_partner(1) and scene.profile.state.box.size()==1,"party member can enter storage")
	check(scene.withdraw(0) and scene.supplies.team.size()==2,"storage withdrawal preserves collection")
	check(scene.set_lead(1) and scene.supplies.team[0].id=="pokemon:37","chosen lead updates party ordering")
	scene.change_room("town")
	scene.change_room("center")
	scene.heal_party()
	check(scene.profile.state.healed_after_catch and scene.supplies.team[1].pp["water-gun"]>0,"center completes return goal and restores PP")
	scene.close_dialogue()
	check(scene.save_progress(),"chapter state checkpoints after services")
	var final := Profile.new()
	check(final.open_profile(scene.save_path) and final.state.team.size()==2 and final.state.healed_after_catch,"party and first-journey goal survive reopening")
	check(final.state.room=="town" and absf(final.state.position[0])<20,"saving inside service resumes at outdoor doorstep")
	scene.change_room("trail")
	scene.player.position=Vector3(122,0,-2)
	var xp_before: int=scene.supplies.team[0].xp
	scene.enter_battle()
	scene.battle.sounds.on=false
	scene.battle.model._end("won")
	scene.battle.return_to_world.emit("won")
	check(scene.supplies.team[0].xp>xp_before and scene.profile.state.wins==1,"victory commits XP to the active partner alongside the reward")
	var xp_after: int=scene.supplies.team[0].xp
	scene._return("won")
	check(scene.supplies.team[0].xp==xp_after,"duplicate return never repeats XP")
	scene.close_dialogue()
	scene.supplies.team[0].status="burn"
	scene.change_room("town");scene.change_room("center");scene.heal_party()
	check(scene.supplies.team[0].status=="","Center cures persistent burns")
	scene.close_dialogue()
	while scene.supplies.team.size()<6:
		scene.supplies.team.append(scene.profile.assign(Catalogue.creature("pokemon:16")))
	scene._snapshot()
	check(scene.profile.caught(Catalogue.creature("pokemon:194"))=="box","full party sends capture to storage")
	check(Profile.valid(scene.profile.state),"full party and storage remain valid")
	scene.no_save=true
	scene.close_dialogue()
	scene.open_bag()
	scene.bag.choosing=true
	scene.bag.build()
	await process_frame
	var rows := 0
	var rows_fit := true
	for c in scene.bag.controls:
		if c is Button and c.position.x==132 and c.position.y>=60 and c.position.y<190:
			rows+=1
			rows_fit=rows_fit and c.position.y+c.size.y<=150
	check(rows==6 and rows_fit,"all six berry recipients fit above the bag description")
	scene.close_bag()
	while scene.profile.state.box.size()<60: scene.profile.state.box.append(Catalogue.encode(scene.profile.assign(Catalogue.creature("pokemon:16"))))
	check(not scene.profile.room_for_capture(),"full party and box prohibit another capture")
	scene.change_room("trail")
	scene.player.position=Vector3(122,0,-2)
	scene.enter_battle()
	scene.battle.sounds.on=false
	scene.battle._show("party")
	check(scene.battle.buttons.size()==7 and scene.battle.buttons.all(func(b): return b.position.y+b.size.y<=216),"six battle party choices and Back stay within the viewport")
	var balls_before: int=scene.battle.model.lures
	scene.battle._act({"kind":"catch"})
	check(scene.battle.model.lures==balls_before and "full" in scene.battle.message,"full storage cannot consume a ball or lose a caught Pokemon")
	for c in scene.battle.model.team:
		c.hp=0
		c.status="burn"
		for id in c.moves: c.pp[id]=0
	scene.battle.model._end("lost")
	scene.battle.return_to_world.emit("lost")
	check(scene.room=="town" and scene.supplies.team.all(func(c): return c.hp==c.max_hp and c.pp[c.moves[0]]>0 and c.status==""),"defeat safely returns to town with restored HP and PP")
	if "--private" in OS.get_cmdline_user_args():
		check(scene.pack.trainer_texture(false)!=null and not scene.pack.world_frame(scene.supplies.team[0].id,"Idle",0,0).is_empty(),"private trainer and Pokemon follower frames exist")
	scene.Art.cache.clear()
	scene.queue_free()
	await process_frame
	await process_frame
	Profile.Safe.remove(path)
	Profile.Safe.remove(path+".scene")
	print("Journey checks: %d passed, %d failed" % [passed,failed])
	quit(1 if failed else 0)
