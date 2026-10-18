extends SceneTree
const Art := preload("res://tests/starter_sprites/art.gd")
var passed := 0
var failed := 0
func _initialize() -> void:run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok:passed+=1
	else:failed+=1;printerr("FAIL: "+title)
func snap(folder: String, title: String) -> void:
	for i in 8:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(folder.path_join(title+".png"))
func run() -> void:
	var art := Art.new()
	check(art.open(),"original source hashes and dimensions match")
	for name in art.entries:
		var meta: Dictionary=art.entries[name]
		check(meta.frames.size()==24,"24 complete battle/walk poses for "+name)
		check(art.palettes[name].size()==16,"bounded classic palette for "+name)
		for i in 24:
			var f := art.frame(name,i)
			var source: Image=f.texture.get_image()
			check(Rect2(Vector2.ZERO,source.get_size()).encloses(f.region),"frame in source bounds "+name+str(i))
			var cut := source.get_region(Rect2i(f.region))
			var clear := true
			for x in cut.get_width():
				if cut.get_pixel(x,0).a>=.5 or cut.get_pixel(x,cut.get_height()-1).a>=.5:clear=false
			for y in cut.get_height():
				if cut.get_pixel(0,y).a>=.5 or cut.get_pixel(cut.get_width()-1,y).a>=.5:clear=false
			check(clear,"complete silhouette with clear rendered edges "+name+str(i))
			check(f.anchor.x>0 and f.anchor.x<f.region.size.x and f.anchor.y==f.region.size.y-4,"measured ground anchor "+name+str(i))
		for direction in 8:
			var regions := {}
			for phase in 4:
				var f := art.walking(name,direction,phase)
				check(f.flip==(direction>4) and is_equal_approx(f.pixel_size,art.walking(name,0,1).pixel_size),"stable scale and eight-direction mirroring")
				regions[f.index]=true
			check(regions.size()==4,"four distinct stride poses for "+name+str(direction))
		check(art.walking(name,0,1).region!=art.walking(name,4,1).region,"true front and rear differ")
		check(art.battle(name,false,0).index==0 and art.battle(name,true,0).index==2 and art.battle(name,false,3.7).index==1,"front/back and brief blink selection")
	var scene=load("res://tests/starter_sprites/play.tscn").instantiate()
	if "--private" not in OS.get_cmdline_user_args():scene.pack_path="Z:/no-private-pack"
	root.add_child(scene);await process_frame
	check(scene.no_save and not scene.Profile.Safe.exists(scene.save_path),"art audition never writes a player profile")
	var original: Array=scene.supplies.team.duplicate(true)
	var args := OS.get_cmdline_user_args()
	var output := ""
	if "--capture" in args:
		output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
	for name in art.entries:
		scene.select_starter(name);await process_frame
		check(scene.partner.texture!=null and scene.partner.alpha_cut==SpriteBase3D.ALPHA_CUT_DISCARD,"original sprite attached with transparent rendering")
		var poses := {}
		for intent in [Vector2.DOWN,Vector2(1,1),Vector2.RIGHT,Vector2(1,-1),Vector2.UP,Vector2(-1,-1),Vector2.LEFT,Vector2(-1,1)]:
			for i in 20:
				scene.partner_gait.advance(intent,Vector3(intent.x,0,intent.y)*.04,false);scene._animate_partner()
				poses[scene.partner_atlas.region]=true
		check(poses.size()>=16,"distance-driven actor visits distinct view/stride poses")
		scene.player.position=scene.Map.point(Vector2i(11,-5));scene._reset_follow()
		var before: float=scene.partner_gait.distance
		var stride := {}
		var walk := InputEventKey.new();walk.keycode=KEY_W;walk.physical_keycode=KEY_W;walk.pressed=true;Input.parse_input_event(walk)
		var stop := Time.get_ticks_msec()+650
		while Time.get_ticks_msec()<stop:
			await process_frame;stride[scene.partner_gait.phase()]=true
		walk=walk.duplicate();walk.pressed=false;Input.parse_input_event(walk)
		check(scene.partner_gait.distance>before+.2 and stride.size()>=3,"actual held input advances the follower through at least three stride poses")
		var at: Vector3=scene.player.position
		scene.move_player(Vector2.UP,.1,true)
		check(scene.player.position.distance_to(at)>.2,"audition retains real collision-aware walking")
		scene.partner_gait.advance(Vector2.DOWN,Vector3.ZERO,false);scene._animate_partner()
		check(scene.partner_gait.phase()==1,"stopping settles the gait rather than walking in place")
		if output!="":await snap(output,name+"-world")
		scene.show_gallery();await process_frame
		check(scene.detail!=null,"battle views available without entering combat")
		if output!="":await snap(output,name+"-battle")
		scene.close_menu()
	check(scene.supplies.team==original and not scene.Profile.Safe.exists(scene.save_path),"art selection preserves species, stats and save isolation")
	if output!="":
		scene.show_overview();await snap(output,"starter-trio")
	scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
	print("Starter sprite checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
