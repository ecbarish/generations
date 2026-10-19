extends SceneTree
const Art := preload("res://tests/mosshog_clean/art.gd")
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
func run() -> void:
    var art := Art.new();check(art.open(),"native source hashes load")
    var args := OS.get_cmdline_user_args();var output := ""
    if "--capture" in args:
        output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
    for name in art.entries:
        var entry: Dictionary=art.entries[name]
        check(entry.frames.size()==(2 if name=="mega_thornback" else 24),"retained source pose slots "+name)
        var roots := {};var colors := {};var binary := true;var clear := true
        var source: Image=art.textures[name].get_image();image_cache[name]=source
        for frame in entry.frames:
            roots[str(frame.anchor)]=true
            var r := Rect2i(frame.region[0],frame.region[1],frame.region[2],frame.region[3])
            check(Rect2i(Vector2i.ZERO,source.get_size()).encloses(r),"native region inside atlas")
            for y in range(r.position.y,r.end.y):
                for x in range(r.position.x,r.end.x):
                    var c := source.get_pixel(x,y)
                    if c.a!=0 and c.a!=1:binary=false
                    if c.a>0:
                        colors[c.to_rgba32()]=true
                        if x in [r.position.x,r.end.x-1] or y in [r.position.y,r.end.y-1]:clear=false
        check(roots.size()==1,"all cells share one body/ground anchor "+name)
        check(colors.size()<=16 and binary and clear,"bounded native palette, binary alpha and unclipped border "+name)
        if name=="mega_thornback":continue
        for start in range(4,24,4):
            var f: Dictionary=art.frame(name,start+1)
            var used: Rect2i=source.get_region(Rect2i(f.region)).get_used_rect()
            var cut := -maxi(6,roundi(used.size.y*.23))
            var stable := true;var legs := {}
            for i in range(start,start+4):
                var current: Dictionary=art.frame(name,i)
                var signature := ""
                for qy in range(-int(f.anchor.y),int(f.region.size.y-f.anchor.y)):
                    for qx in range(-int(f.anchor.x),int(f.region.size.x-f.anchor.x)):
                        var q := Vector2i(qx,qy)
                        var c := pixel(art,name,i,q)
                        var reference := pixel(art,name,start+1,q)
                        if qy<=cut and (c.a!=reference.a or (c.a>0 and c!=reference)):stable=false
                        elif qy>cut:signature+=str(c.to_rgba32() if c.a>0 else 0)+","
                legs[signature.sha256_text()]=true
            check(stable,"head/garden stable across walk "+name+str(start))
            check(legs.size()>=2,"footfall band still animates "+name+str(start))
            for d in 8:
                check(art.walking(name,d,0).flip==(d>4),"eight-direction mirroring")
        var rear_stable := true
        var f: Dictionary=art.frame(name,2)
        for y in int(f.region.size.y):
            for x in int(f.region.size.x):
                var a := pixel(art,name,2,Vector2i(x,y)-Vector2i(f.anchor));var b := pixel(art,name,3,Vector2i(x,y)-Vector2i(f.anchor))
                if a.a!=b.a or (a.a>0 and a!=b):rear_stable=false
        check(rear_stable,"rear alternate cannot jump "+name)
    var blink_changes := 0;var blink_local := true
    var f: Dictionary=art.frame("mosshog",0)
    for y in int(f.region.size.y):
        for x in int(f.region.size.x):
            var q := Vector2i(x,y)-Vector2i(f.anchor)
            var a := pixel(art,"mosshog",0,q);var b := pixel(art,"mosshog",1,q)
            if a!=b:
                blink_changes+=1
                if not Rect2i(5,-26,6,3).has_point(q) or a.a!=b.a:blink_local=false
    check(blink_changes>0 and blink_changes<=12 and blink_local,"Mosshog blink alters only measured eyelid patch")
    check(art.battle("mosshog",false,3.7).index==1 and art.battle("mosshog",false,0).index==0,"brief eyelid blink selected")
    for i in range(4,8):
        check(pixel(art,"mosshog",i,Vector2i(-3,-12))==art.palettes.mosshog[11] and pixel(art,"mosshog",i,Vector2i(7,-12))==art.palettes.mosshog[11],"both tusks retained in front walk")
    var scene=load("res://tests/mosshog_clean/play.tscn").instantiate()
    if "--private" not in args:scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame
    check(scene.no_save and not scene.Profile.Safe.exists(scene.save_path),"comparison preview cannot write a player profile")
    if "--private" in args:check(scene.pack.entries.size()==3 and scene.pack.issue=="","actual private reference pack loaded")
    var original: Array=scene.supplies.team.duplicate(true)
    for name in ["mosshog","thicketboar","thornback"]:
        scene.select_starter(name);await process_frame
        check(scene.partner.material_override.shader==scene.NativeWorld,"direct native atlas rendering")
        var at: Vector3=scene.player.position
        scene.toggle_comparison();await process_frame
        check(not scene.clean_mode and scene.player.position==at,"comparison retains player/camera location")
        if output!="":await snap(output,name+"-original")
        scene.toggle_comparison();await process_frame
        check(scene.clean_mode,"returns to cleaned atlas")
        scene.player.position=scene.Map.point(Vector2i(11,-5));scene._reset_follow()
        var distance: float=scene.partner_gait.distance
        var seen := {}
        var event := InputEventKey.new();event.keycode=KEY_W;event.physical_keycode=KEY_W;event.pressed=true;Input.parse_input_event(event)
        var until := Time.get_ticks_msec()+650
        while Time.get_ticks_msec()<until:
            await process_frame;seen[scene.starter_art.phase(name,scene.partner_gait.distance,scene.partner_gait.moving)]=true
        event=event.duplicate();event.pressed=false;Input.parse_input_event(event)
        check(scene.partner_gait.distance>distance+.2 and seen.size()>=3,"real held-key walking cycles native feet "+name)
        if output!="":await snap(output,name+"-clean-world")
        scene.show_gallery();await process_frame
        if output!="":await snap(output,name+"-clean-battle")
        scene.close_menu()
    scene.starter_name="mega_thornback";scene.show_gallery();await process_frame
    if output!="":await snap(output,"mega-thornback-clean")
    scene.close_menu();check(scene.starter_name=="thornback","Mega remains battle-only")
    if output!="":
        scene.show_overview();await snap(output,"clean-family")
    check(scene.supplies.team==original and not scene.Profile.Safe.exists(scene.save_path),"art comparison preserves party records and save isolation")
    scene.Art.cache.clear();scene.queue_free();await process_frame;await process_frame
    print("Native Mosshog cleanup checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
