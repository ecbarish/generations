extends SceneTree
const Summary := preload("res://tests/opening/summary.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
var passed := 0
var failed := 0
func _initialize() -> void:run.call_deferred()
func check(ok: bool, label: String) -> void:
	if ok:passed+=1
	else:failed+=1;printerr("FAIL: "+label)
func button(scene: Node, title: String) -> Button:
	for child in scene.detail.get_children():
		if child is Button and child.text==title:return child
	return null
func run() -> void:
	for sid in Catalogue.IDS:
		for level in [1,5,12,36,100]:
			var c := Catalogue.creature(sid,level);var before := c.duplicate(true)
			var v := Summary.describe(c)
			check(v.moves.size()==c.moves.size() and v.hp=="%d/%d HP" % [c.hp,c.max_hp],"actual loadout and HP "+sid+str(level))
			check(v.xp_fraction==float(level==100) and (v.xp=="Maximum level" if level==100 else "EXP to" in v.xp),"level threshold display "+sid+str(level))
			check(c==before,"summary never mutates a battle record")
	var wooper := Catalogue.creature("pokemon:194",16)
	wooper.hp=1;wooper.status="burn";wooper.pp["mud-shot"]=0
	wooper.xp=Catalogue.threshold(wooper.id,16)+10
	var v := Summary.describe(wooper)
	check(v.status=="Burned" and v.hp_fraction<.1 and v.xp_fraction>0,"injury, burn and partial experience")
	var mud: Dictionary=v.moves.filter(func(m):return m.id=="mud-shot")[0]
	check(mud.pp=="0/15" and mud.accuracy=="95%" and mud.power=="55" and mud.category=="Special" and "Speed" in mud.effect,"real move power, accuracy, exhausted PP and effect")
	wooper.hp=0;check(Summary.describe(wooper).status=="Fainted","fainting takes priority over burn")
	var pidgey := Catalogue.creature("pokemon:16",12)
	var sand: Dictionary=Summary.describe(pidgey).moves.filter(func(m):return m.id=="sand-attack")[0]
	check(sand.category=="Status" and sand.power=="—" and "accuracy" in sand.effect,"support move explanation")
	var scene=load("res://tests/opening/play.tscn").instantiate()
	scene.no_save=true;scene.save_path="user://wb_summary_%d.json" % OS.get_process_id()
	if "--private" not in OS.get_cmdline_user_args():scene.pack_path="Z:/no-private-pack"
	root.add_child(scene);await process_frame
	scene.start_journey("pokemon:194");scene.close_dialogue()
	scene.supplies.team=[Catalogue.creature("pokemon:194",16),Catalogue.creature("pokemon:16",12),Catalogue.creature("pokemon:37",12),Catalogue.creature("pokemon:194",5),Catalogue.creature("pokemon:16",5),Catalogue.creature("pokemon:37",5)]
	for i in scene.supplies.team.size():scene.supplies.team[i].individual=i+1
	scene.supplies.team[0].hp=1;scene.supplies.team[0].status="burn";scene.supplies.team[0].pp["mud-shot"]=0
	var before: Array=scene.supplies.team.duplicate(true)
	scene.toggle_menu();scene.show_party();await process_frame
	check(scene.detail.get_child_count()>=13,"six member party retained")
	# Activate the first party row through its real keyboard focus.
	var focused := root.gui_get_focus_owner()
	check(focused is Button and "Wooper" in focused.text,"party row receives keyboard focus")
	for down in [true,false]:
		var key := InputEventKey.new();key.keycode=KEY_ENTER;key.physical_keycode=KEY_ENTER;key.pressed=down;root.push_input(key)
		await process_frame
	check(scene.detail.has_meta("summary") and not scene.menu.visible,"keyboard opens full in-game summary")
	check(button(scene,"Lead").disabled and not button(scene,"Store").disabled,"lead and store availability")
	for child in scene.detail.get_children():
		if child is Control:
			check(Rect2(Vector2.ZERO,scene.detail.size).encloses(Rect2(child.position,child.size)),"summary control fits: "+child.name)
	var at: Vector3=scene.player.position
	for down in [true,false]:
		var walk := InputEventKey.new();walk.keycode=KEY_W;walk.physical_keycode=KEY_W;walk.pressed=down;Input.parse_input_event(walk)
		if down:await create_timer(.1).timeout
	check(scene.player.position==at,"summary pauses world walking")
	button(scene,"Next").pressed.emit();await process_frame
	check(scene.detail.get_meta("summary").name=="Pidgey","next partner shows real record")
	button(scene,"Previous").pressed.emit();await process_frame
	check(scene.detail.get_meta("summary").name=="Wooper","previous partner navigation")
	# Pointer-select Mud Shot and verify its details and focus after rebuilding.
	for child in scene.detail.get_children():
		if child is Button and "Mud Shot" in child.text:
			for down in [true,false]:
				var mouse := InputEventMouseButton.new();mouse.button_index=MOUSE_BUTTON_LEFT;mouse.pressed=down;mouse.position=root.get_final_transform()*child.get_global_rect().get_center();root.push_input(mouse)
			await process_frame
			break
	check("Mud Shot" in root.gui_get_focus_owner().text,"pointer selects a move and keeps focus")
	check(scene.supplies.team==before,"navigation and move selection preserve HP, XP, PP and order")
	var args := OS.get_cmdline_user_args()
	if "--capture" in args:
		var output: String=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
		for i in 10:await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png(output.path_join("party-summary.png"))
	button(scene,"Back").pressed.emit();await process_frame
	check(scene.menu.visible and not scene.detail.has_meta("summary"),"Back restores party and side menu")
	scene.party_action(5);button(scene,"Next").pressed.emit();await process_frame
	check(scene.detail.get_meta("summary").name=="Wooper","party navigation wraps at six")
	scene.close_menu();scene.party_action(1);button(scene,"Lead").pressed.emit();await process_frame
	check(scene.supplies.team[0].id=="pokemon:16" and scene.detail==null,"existing Lead action changes follower and closes summary")
	scene.close_dialogue();scene.toggle_menu();scene.party_action(0)
	var key := InputEventKey.new();key.keycode=KEY_ESCAPE;key.pressed=true;root.push_input(key);await process_frame
	check(scene.menu==null and scene.detail==null,"Escape closes summary")
	scene.party_action(0)
	button(scene,"Store").pressed.emit();await process_frame
	check(scene.supplies.team.size()==5 and scene.profile.state.box.size()==1 and scene.detail==null,"summary uses existing storage action")
	scene.close_dialogue()
	scene.supplies.team=[Catalogue.creature("pokemon:194",5)]
	scene.party_action(0)
	check(button(scene,"Store").disabled and button(scene,"Next").disabled and button(scene,"Previous").disabled,"last partner cannot be stored or paged")
	scene.supplies.team.append(Catalogue.creature("pokemon:16",5));scene.supplies.team[1].hp=0
	scene.supplies.team[0].individual=7;scene.supplies.team[1].individual=8;scene.profile.state.next_id=9
	scene.party_action(0);check(button(scene,"Store").disabled,"last healthy partner cannot be stored")
	scene.party_action(1);check(button(scene,"Lead").disabled,"fainted partner cannot lead")
	scene.close_menu();scene.no_save=false
	check(scene.save_progress(),"existing profile writer saves unchanged schema")
	var restored = scene.Profile.new();restored.open_profile(scene.save_path)
	check(not restored.hold and restored.state.team.size()==2 and restored.state.box.size()==1 and restored.state.team[1].hp==0,"summary actions round trip through existing profile")
	scene.Profile.Safe.remove(scene.save_path)
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	print("Party summary checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
