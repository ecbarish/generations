extends SceneTree
const Art := preload("res://tests/mosshog_family/art.gd")
var passed := 0
var failed := 0
func check(ok: bool,title: String) -> void:
    if ok:passed+=1
    else:failed+=1;printerr("FAIL: "+title)
func _initialize() -> void:run.call_deferred()
func snap(folder: String,title: String) -> void:
    for i in 8:await process_frame
    await RenderingServer.frame_post_draw
    root.get_texture().get_image().save_png(folder.path_join(title+".png"))
func run() -> void:
    var art := Art.new()
    check(art.open(),"source hashes and dimensions validate")
    check(art.entries.size()==4,"base, middle, final and separate Mega appearances")
    for name in art.entries:
        var entry: Dictionary=art.entries[name]
        check(entry.frames.size()==(2 if name=="mega_thornback" else 24),"complete measured pose set "+name)
        for i in entry.frames.size():
            var f := art.frame(name,i)
            check(Rect2(Vector2.ZERO,f.texture.get_size()).encloses(f.region),"whole silhouette inside source "+name+str(i))
            check(f.sample_step>0 and f.anchor.y>0 and f.anchor.x>0 and f.anchor.x<f.region.size.x,"valid root and fixed sampling "+name+str(i))
            var source: Image=f.texture.get_image()
            var clear := true
            var cut: Image=source.get_region(Rect2i(f.region))
            for x in cut.get_width():
                if cut.get_pixel(x,0).a>=.5 or cut.get_pixel(x,cut.get_height()-1).a>=.5:clear=false
            for y in cut.get_height():
                if cut.get_pixel(0,y).a>=.5 or cut.get_pixel(cut.get_width()-1,y).a>=.5:clear=false
            check(clear,"transparent complete frame boundary "+name+str(i))
        check(art.battle(name,false,0).index==art.battle(name,false,3.7).index and art.battle(name,true,0).index==art.battle(name,true,3.7).index,"unclean alternate poses never twitch "+name)
        if name=="mega_thornback":continue
        for direction in 8:
            var frames := {}
            for phase in 4:
                var f := art.walking(name,direction,phase)
                frames[f.index]=true
                check(f.flip==(direction>4),"eight directions mirror correctly")
                check(is_equal_approx(f.pixel_size,art.walking(name,direction,1).pixel_size),"no stride-dependent scale")
                if name!="mosshog":check(is_equal_approx(f.sample_step,art.walking(name,direction,1).sample_step),"one sampling grid per direction")
            check(frames.size()==4,"four measured source strides "+name+str(direction))
        check(art.phase(name,0,false)==1 and art.phase(name,100,false)==1,"stationary feet settle")
    check(art.phase("thicketboar",.15,true)==1 and art.phase("thornback",.19,true)==1,"species stride distances replace trainer cadence")
    var scene=load("res://tests/mosshog_family/play.tscn").instantiate()
    var args := OS.get_cmdline_user_args()
    if "--private" not in args:scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame
    check(scene.no_save and not scene.Profile.Safe.exists(scene.save_path),"preview never opens/writes player save")
    if "--private" in args:check(scene.pack.entries.size()==3 and scene.pack.issue=="","actual private pack loaded")
    var original: Array=scene.supplies.team.duplicate(true)
    var output := ""
    if "--capture" in args:
        output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
    for name in ["mosshog","thicketboar","thornback"]:
        scene.select_starter(name);await process_frame
        check(scene.partner.texture==art.textures[name],"walking preview selects correct family appearance")
        scene.player.position=scene.Map.point(Vector2i(11,-5));scene._reset_follow()
        var before: float=scene.partner_gait.distance
        var poses := {}
        var walk := InputEventKey.new();walk.keycode=KEY_W;walk.physical_keycode=KEY_W;walk.pressed=true;Input.parse_input_event(walk)
        var stop := Time.get_ticks_msec()+650
        while Time.get_ticks_msec()<stop:
            await process_frame
            poses[scene.starter_art.phase(name,scene.partner_gait.distance,scene.partner_gait.moving)]=true
        walk=walk.duplicate();walk.pressed=false;Input.parse_input_event(walk)
        check(scene.partner_gait.distance>before+.2 and poses.size()>=3,"held walking advances distance-driven creature stride")
        if output!="":await snap(output,name+"-world")
        scene.show_gallery();await process_frame
        check(scene.detail!=null,"front/back and private comparison gallery")
        if output!="":await snap(output,name+"-battle")
        scene.close_menu()
    scene.starter_name="mega_thornback";scene.show_gallery();await process_frame
    check(scene.detail!=null,"Mega has separate battle preview")
    if output!="":await snap(output,"mega-thornback-battle")
    scene.close_menu()
    check(scene.starter_name=="thornback","leaving Mega art returns to ordinary walking identity")
    if output!="":
        scene.show_overview();await snap(output,"mosshog-family")
        var original_size: Vector2i=root.size
        for screen in [Vector2i(375,812),Vector2i(1366,768),Vector2i(1920,1080),Vector2i(3440,1440)]:
            root.size=screen
            for i in 6:await process_frame
            check(Rect2(Vector2.ZERO,scene.get_viewport().get_visible_rect().size).encloses(scene.detail.get_global_rect()),"family panel fits "+str(screen))
            var buttons_clear := true
            for child in scene.detail.get_children():
                if child is Button and child.position.y<174:buttons_clear=false
            check(buttons_clear,"overview controls do not cover rear feet "+str(screen))
            await snap(output,"family-%dx%d" % [screen.x,screen.y])
        root.size=original_size
    check(scene.supplies.team==original and not scene.Profile.Safe.exists(scene.save_path),"art selection never changes party species/stats or writes save")
    scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
    print("Mosshog family checks: %d passed, %d failed." % [passed,failed])
    quit(1 if failed else 0)
