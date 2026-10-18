extends SceneTree
const Profile := preload("res://tests/journey/profile.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
const Rounds := preload("res://tests/journey/rounds.gd")
var passed := 0
var failed := 0
var output := ""
func _initialize() -> void:run.call_deferred()
func check(ok: bool, label: String) -> void:
	if ok:passed+=1
	else:failed+=1;printerr("FAIL: "+label)
func clean(path: String) -> void:
	Profile.Safe.remove(path);Profile.Safe.remove(path+".pre-v2");Profile.Safe.remove(path+".pre-v3")
func raw(path: String, data: Variant) -> void:
	var file := FileAccess.open(path,FileAccess.WRITE);file.store_string(JSON.stringify(data));file.close()
func snap(label: String) -> void:
	if output=="":return
	for i in 8:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(label+".png"))
func scene_for(path: String) -> Node:
	var scene=load("res://tests/opening/play.tscn").instantiate();scene.save_path=path
	if "--private" not in OS.get_cmdline_user_args():scene.pack_path="Z:/no-private-pack"
	return scene
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if "--capture" in args:output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
	check(Catalogue.IDS.size()==3 and Catalogue.ALL_IDS.size()==6 and Catalogue.STARTERS.size()==3,"original support does not replace Pokemon identities or encounter list")
	var source: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://data/wildbond.json"))
	for sid in Catalogue.STARTERS:
		var name: String=sid.trim_prefix("wildbond:");var base: Dictionary=source.SPECIES[name].base
		var s: Dictionary=Catalogue.DATA.species[sid]
		check(s.stats.hp==base.hp and s.stats.attack==base.pow and s.stats.speed==base.spd and s.stats["special-attack"]==base.wit,"original base stats retained "+sid)
		var c := Catalogue.creature(sid,5)
		check(c.moves.size()==2 and c.level==5 and c.hp==c.max_hp,"starter's own supported initial loadout "+sid)
		for move in c.moves:
			check(move.begins_with("wildbond:") and Catalogue.DATA.moves[move].pow>0,"original move identity and source damage retained")
		var xp: int=Catalogue.threshold(sid,11)-c.xp
		Catalogue.gain_xp(c,xp)
		check(c.level==11 and c.hp>0 and c.moves.size()<=4,"original levels through existing growth formula")
		var model := Rounds.new();model.setup([c],Catalogue.creature("pokemon:194",5),Catalogue.DATA.moves,{},42)
		check(model.effectiveness("grass",model.foe)==4.0,"original Grass adapter uses both Pokemon defending types")
	var old := Profile.fresh();old.erase("original_starter");old.version=2;old.started=true;old.next_id=3;old.coins=713;old.berries=7;old.balls=9;old.first_catch=true;old.healed_after_catch=true
	var a := Catalogue.creature("pokemon:16",12);a.individual=1;a.hp=1;a.status="burn";a.pp.tackle=0
	var b := Catalogue.creature("pokemon:37",9);b.individual=2
	old.team=[Catalogue.encode(a)];old.box=[Catalogue.encode(b)]
	old.opening={"version":1,"position":[0,8.75],"met_maren":true,"wren":true,"bram":false,"reported":true,"items":["lh1"]}
	check(Profile.V2.valid(old),"schema-two fixture independently valid")
	var hp: int=Catalogue.DATA.species["pokemon:16"].stats.hp
	Catalogue.DATA.species["pokemon:16"].stats.hp=hp+50
	check(Profile.V2.valid(old),"schema-two validation is frozen independently of future catalogue tuning")
	Catalogue.DATA.species["pokemon:16"].stats.hp=hp
	var path := "user://wb_live_starter_%d.json" % OS.get_process_id();clean(path);raw(path,old)
	var profile := Profile.new()
	check(profile.open_profile(path) and profile.state.version==3 and profile.state.original_starter==0,"schema-two party upgrades without receiving an unchosen original")
	var migrated := profile.state.duplicate(true);migrated.erase("original_starter");migrated.version=2
	check(JSON.stringify(JSON.parse_string(JSON.stringify(migrated)))==JSON.stringify(JSON.parse_string(JSON.stringify(old))),"all prior Pokemon, HP/PP/status/order, resources and chapter results preserved")
	check(Profile.V2.valid(JSON.parse_string(FileAccess.get_file_as_string(path+".pre-v3"))),"independent verified pre-v3 backup exists")
	var backup := FileAccess.get_sha256(path+".pre-v3")
	check(profile.grant_starter("wildbond:ripplet")=="party" and profile.state.team[0].species=="pokemon:16" and profile.state.original_starter==3,"existing team gains one distinct original without replacing its lead")
	check(profile.grant_starter("wildbond:mosshog")=="unavailable" and profile.state.next_id==4,"duplicate adoption cannot farm starters")
	check(profile.save() and not Profile.V2.valid(profile.state),"mixed original/Pokemon checkpoint uses version protected from older readers")
	var restored := Profile.new()
	check(restored.open_profile(path) and restored.state.team[1].species=="wildbond:ripplet" and restored.state.team[0].hp==1 and restored.state.team[0].pp.tackle==0 and restored.state.team[0].status=="burn","mixed party round trip retains original identity and injured Pokemon")
	check(FileAccess.get_sha256(path+".pre-v3")==backup,"reopen preserves independent migration backup")
	var primary := FileAccess.get_sha256(path);var future := Profile.fresh();future.version=4;raw(path+".tmp",future)
	var held := Profile.new()
	check(not held.open_profile(path) and held.hold and not held.save() and FileAccess.get_sha256(path)==primary,"future checkpoint holds all writes without rolling back")
	clean(path);raw(path,old);raw(path+".pre-v3","corrupt");primary=FileAccess.get_sha256(path)
	held=Profile.new();check(not held.open_profile(path) and held.hold and FileAccess.get_sha256(path)==primary,"bad migration backup preserves old primary")
	clean(path);raw(path,"truncated");raw(path+".bak",old)
	held=Profile.new();check(held.open_profile(path) and held.state.version==3 and held.state.coins==713,"recoverable v2 backup upgrades safely")
	clean(path)
	var full := Profile.new();full.start("pokemon:16")
	for i in 5:full.state.team.append(Catalogue.encode(full.assign(Catalogue.creature(Catalogue.IDS[i%3],5))))
	check(full.grant_starter("wildbond:cindercub")=="box" and full.state.box[0].species=="wildbond:cindercub" and not full.state.first_catch,"full party adopts into storage without counting a wild catch")
	check(Profile.valid(full.state),"stored original starter marker remains valid")
	var bad := full.state.duplicate(true);bad.original_starter=1
	check(not Profile.valid(bad),"starter grant marker cannot point to a Pokemon")
	full=Profile.new();full.start("pokemon:16")
	for i in 65:
		var record := Catalogue.encode(full.assign(Catalogue.creature(Catalogue.IDS[i%3],5)))
		if i<5:full.state.team.append(record)
		else:full.state.box.append(record)
	var complete := JSON.stringify(full.state)
	check(full.grant_starter("wildbond:mosshog")=="full" and JSON.stringify(full.state)==complete,"no free slot rejects adoption without consuming the one-time choice or ID")
	raw(path,old)
	var existing=scene_for(path);root.add_child(existing);await process_frame
	existing.toggle_menu();existing.show_storage();await process_frame
	var offer: Button
	for child in existing.detail.get_children():
		if child is Button and child.text=="Meet Starters":offer=child
	check(offer!=null,"existing players can find starter adoption from Storage")
	offer.pressed.emit();await process_frame
	check(existing.modal_buttons.size()==3 and existing.supplies.team[0].id=="pokemon:16","adoption picker does not replace the existing team")
	await snap("existing-party-starter-offer")
	existing.start_journey("wildbond:ripplet");await process_frame
	check(existing.supplies.team.size()==2 and existing.supplies.team[0].hp==1 and existing.supplies.team[0].status=="burn","existing injured Pokemon and selected original coexist without healing")
	existing.set_lead(1);await process_frame
	check(existing.supplies.team[0].id=="wildbond:ripplet" and existing.supplies.team[1].individual==1,"Walk Together uses existing lead action without losing previous partner")
	existing.store_partner(0);await process_frame
	check(existing.supplies.team[0].id=="pokemon:16" and existing.partner.material_override==null and not existing.partner.region_enabled,"returning to Pokemon clears original rendering state")
	check(Profile.valid(existing.profile.state) and existing.profile.state.original_starter==3,"one-time original remains valid in storage")
	existing.close_dialogue();existing.no_save=true;existing.Art.cache.clear();existing.queue_free();await process_frame;await process_frame;clean(path)
	for sid in Catalogue.STARTERS:
		var scene=scene_for(path);root.add_child(scene);await process_frame
		check(scene.menu!=null and scene.modal_buttons.size()==3,"new chapter offers approved trio")
		if sid==Catalogue.STARTERS[0]:await snap("starter-selection")
		for button in scene.modal_buttons:
			if button.get_meta("starter","")==sid:
				for down in [true,false]:
					var pointer := InputEventMouseButton.new();pointer.button_index=MOUSE_BUTTON_LEFT;pointer.pressed=down;pointer.position=root.get_final_transform()*button.get_global_rect().get_center();root.push_input(pointer)
				await process_frame;break
		check(scene.profile.state.started and scene.supplies.team[0].id==sid and scene.profile.state.original_starter==1,"pointer selection commits original starter "+sid)
		scene.close_dialogue()
		check(scene.partner.material_override==scene.original_material and scene.partner.region_enabled,"original walking art is attached to actual party lead")
		scene.player.position=scene.Map.point(Vector2i(11,-5));scene._reset_follow();scene._update_camera()
		await snap(sid.trim_prefix("wildbond:")+"-world")
		scene.toggle_menu();scene.show_party();scene.party_action(0);await process_frame
		check(scene.detail.get_meta("summary").name==Catalogue.NAMES[sid],"real original party summary")
		await snap(sid.trim_prefix("wildbond:")+"-summary");scene.close_menu()
		scene.begin_encounter("wren",Catalogue.STARTERS[(Catalogue.STARTERS.find(sid)+2)%3]);await process_frame;scene.battle.sounds.on=false
		check(scene.battle.model.team[0].id==sid and scene.battle.model.foe.id in Catalogue.STARTERS,"friendly battle uses actual original identities on both sides")
		await snap(sid.trim_prefix("wildbond:")+"-battle")
		check(scene.battle.original_portraits.has("ally") and scene.battle.original_portraits.has("foe"),"actual battle front/back portraits available")
		var c: Dictionary=scene.battle.model.team[0];var before_xp: int=c.xp
		scene.battle.model.foe.hp=1;c.speed=999;scene.battle.model.rng.seed=123
		scene.battle._act({"kind":"move","id":c.moves[0]})
		while not scene.battle.event.is_empty():scene.battle._continue()
		check(scene.battle.model.result=="won","original move wins a controlled trainer turn")
		scene.battle.return_to_world.emit("won")
		check(scene.supplies.team[0].xp>before_xp and scene.chapter.wren,"original partner receives existing XP and trainer progress")
		scene.story_queue=[];scene.close_dialogue()
		var saved := Profile.new();check(saved.open_profile(path) and saved.state.team[0].species==sid,"selected original survives saved battle outcome")
		scene.no_save=true;scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame;clean(path)
	print("Live original starter checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
