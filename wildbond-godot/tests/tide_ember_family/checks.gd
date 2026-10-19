extends SceneTree
const Art := preload("res://tests/tide_ember_family/art.gd")
var passed := 0
var failed := 0
var image_cache: Dictionary={}
func _initialize() -> void:run.call_deferred()
func check(ok: bool,title: String) -> void:
    if ok:passed+=1
    else:failed+=1;printerr("FAIL: "+title)
func snap(folder: String,title: String) -> void:
    for i in 6:await process_frame
    await RenderingServer.frame_post_draw
    root.get_texture().get_image().save_png(folder.path_join(title+".png"))
func pixel(art: RefCounted,name: String,index: int,q: Vector2i) -> Color:
    var f: Dictionary=art.frame(name,index)
    return image_cache[name].get_pixelv(Vector2i(f.region.position)+Vector2i(f.anchor)+q)
func visible_equal(a: Color,b: Color) -> bool:
    return a.a==b.a and (a.a==0 or a==b)
func run() -> void:
    var art := Art.new()
    check(art.open() and art.entries.size()==8,"all eight appearances load with exact native hashes")
    var audit: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://../docs/art/tide-ember-production/edit-audit.json"))
    var args := OS.get_cmdline_user_args();var output := ""
    if "--capture" in args:output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
    var source_data: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/tide_ember_family/source-frames.json"))
    var source_slots := 0
    for name in source_data:
        var e: Dictionary=source_data[name];source_slots+=e.frames.size()
        check(FileAccess.get_sha256("res://tests/tide_ember_family/"+e.file)==e.sha256,"raw source immutable "+name)
        var image := Image.load_from_file(ProjectSettings.globalize_path("res://tests/tide_ember_family/"+e.file))
        for f in e.frames:
            var r := Rect2i(f.region[0],f.region[1],f.region[2],f.region[3])
            check(Rect2i(Vector2i.ZERO,image.get_size()).encloses(r),"whole raw source pose in bounds")
            var clear := true
            for x in range(r.position.x,r.end.x):
                if image.get_pixel(x,r.position.y).a>=.5 or image.get_pixel(x,r.end.y-1).a>=.5:clear=false
            for y in range(r.position.y,r.end.y):
                if image.get_pixel(r.position.x,y).a>=.5 or image.get_pixel(r.end.x-1,y).a>=.5:clear=false
            check(clear,"complete source alpha silhouette has clear edge")
    check(source_slots==100,"100 new measured source pose slots")
    for name in art.entries:
        var entry: Dictionary=art.entries[name]
        var mega: bool=name.begins_with("mega_")
        check(entry.frames.size()==(2 if mega else 24),"retained native pose slots "+name)
        var roots := {};var colors := {};var binary := true;var clear := true
        var source: Image=art.textures[name].get_image();image_cache[name]=source
        for f in entry.frames:
            roots[str(f.anchor)]=true
            var r := Rect2i(f.region[0],f.region[1],f.region[2],f.region[3])
            check(Rect2i(Vector2i.ZERO,source.get_size()).encloses(r),"native cell inside atlas")
            for y in range(r.position.y,r.end.y):
                for x in range(r.position.x,r.end.x):
                    var c := source.get_pixel(x,y)
                    if c.a!=0 and c.a!=1:binary=false
                    if c.a>0:
                        colors[c.to_rgba32()]=true
                        if x in [r.position.x,r.end.x-1] or y in [r.position.y,r.end.y-1]:clear=false
        check(roots.size()==1 and colors.size()<=16 and binary and clear,"shared roots, sixteen colours, binary alpha, clear padding "+name)
        if mega:
            check(art.walking(name,0,0).texture==art.walking(name.trim_prefix("mega_"),0,0).texture,"Mega has no permanent walking identity")
            continue
        for start in range(4,24,4):
            var f: Dictionary=art.frame(name,start+1)
            var used: Rect2i=source.get_region(Rect2i(f.region)).get_used_rect()
            var cut := -maxi(6,roundi(used.size.y*.23))
            var stable := true;var legs := {}
            for i in range(start,start+4):
                var signature := ""
                for qy in range(-int(f.anchor.y),int(f.region.size.y-f.anchor.y)):
                    for qx in range(-int(f.anchor.x),int(f.region.size.x-f.anchor.x)):
                        var q := Vector2i(qx,qy)
                        var c := pixel(art,name,i,q);var ref := pixel(art,name,start+1,q)
                        if qy<=cut and not visible_equal(c,ref):stable=false
                        elif qy>cut:signature+=str(c.to_rgba32() if c.a>0 else 0)+","
                legs[signature.sha256_text()]=true
            check(stable,"body/face/frill stable "+name+str(start))
            check(legs.size()>=2,"feet still articulate "+name+str(start))
        for d in 8:check(art.walking(name,d,0).flip==(d>4),"eight-way mirror "+name)
        var f: Dictionary=art.frame(name,0)
        var rect: Array=audit[name].blink_rect
        var eye := Rect2i(rect[0],rect[1],rect[2],rect[3])
        var changed := 0;var localized := true;var rear_stable := true
        for y in int(f.region.size.y):
            for x in int(f.region.size.x):
                var q := Vector2i(x,y)-Vector2i(f.anchor)
                var a := pixel(art,name,0,q);var b := pixel(art,name,1,q)
                if not visible_equal(a,b):
                    changed+=1
                    if not eye.has_point(q) or a.a!=b.a:localized=false
                if not visible_equal(pixel(art,name,2,q),pixel(art,name,3,q)):rear_stable=false
        check(changed>0 and changed<=eye.get_area() and localized,"eyelid-only blink "+name)
        check(rear_stable,"neutral rear body and tail "+name)
        check(art.battle(name,false,3.7).index==1 and art.battle(name,false,0).index==0,"brief blink timing "+name)
    var scene=load("res://tests/tide_ember_family/play.tscn").instantiate()
    if "--private" not in args:scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame
    check(scene.no_save and not scene.Profile.Safe.exists(scene.save_path),"never opens or writes live player save")
    if "--private" in args:check(scene.pack.entries.size()==3 and scene.pack.issue=="","actual installed private references loaded")
    var party: Array=scene.supplies.team.duplicate(true)
    for family in 2:
        if scene.ember!=(family==1):scene.toggle_family()
        scene.stage_buttons[1].pressed.emit();await process_frame
        check(scene.starter_name==scene.family_names()[1],"stage button selects current family")
        check(scene.stage_buttons[1].text.ends_with("Smoulderpup" if family==1 else "Riverwisp"),"family buttons reflect selection")
        for name in scene.family_names().slice(0,3):
            scene.select_starter(name);await process_frame
            check(scene.partner.material_override.shader==scene.NativeWorld,"direct native world pixels "+name)
            var at: Vector3=scene.player.position
            scene.toggle_comparison();await process_frame
            check(not scene.clean_mode and scene.player.position==at,"raw comparison retains world position "+name)
            scene.toggle_comparison();await process_frame
            scene.player.position=scene.Map.point(Vector2i(11,-5));scene._reset_follow()
            var distance: float=scene.partner_gait.distance;var phases := {}
            var event := InputEventKey.new();event.keycode=KEY_W;event.physical_keycode=KEY_W;event.pressed=true;Input.parse_input_event(event)
            var until := Time.get_ticks_msec()+650
            while Time.get_ticks_msec()<until:
                await process_frame;phases[scene.starter_art.phase(name,scene.partner_gait.distance,scene.partner_gait.moving)]=true
            event=event.duplicate();event.pressed=false;Input.parse_input_event(event)
            check(scene.partner_gait.distance>distance+.2 and phases.size()>=3,"held-key walking advances feet "+name)
            if output!="":await snap(output,name+"-world")
            scene.show_gallery();await process_frame
            if output!="":await snap(output,name+"-battle")
            scene.close_menu()
        scene.starter_name=scene.family_names()[3];scene.show_gallery();await process_frame
        if output!="":await snap(output,scene.starter_name+"-battle")
        scene.close_menu();check(scene.starter_name==scene.family_names()[2],"leaving Mega restores ordinary final")
        scene.show_overview()
        if output!="":await snap(output,"ember-family" if family==1 else "tide-family")
        scene.close_menu()
    if output!="":
        for dims in [Vector2i(375,812),Vector2i(1366,768),Vector2i(1920,1080),Vector2i(3440,1440)]:
            DisplayServer.window_set_size(dims)
            scene.show_overview();await snap(output,"layout-"+str(dims.x)+"x"+str(dims.y))
            check(scene.detail!=null,"family overview at requested window size "+str(dims))
            scene.close_menu()
    check(scene.supplies.team==party and not scene.Profile.Safe.exists(scene.save_path),"appearance preview preserves party and profile isolation")
    scene.queue_free();await process_frame;await process_frame
    print("Tide/Ember sprite checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
