extends SceneTree
const Art := preload("res://tests/mega_tide_readability/art.gd")
var passed := 0
var failed := 0
func _initialize() -> void:run.call_deferred()
func check(ok: bool,text: String) -> void:
    if ok:passed+=1
    else:failed+=1;printerr("FAIL: "+text)
func snap(folder: String,name: String) -> void:
    for i in 6:await process_frame
    await RenderingServer.frame_post_draw
    root.get_texture().get_image().save_png(folder.path_join(name+".png"))
func sample(image: Image,f: Dictionary,q: Vector2i) -> Color:
    var at := Vector2i(f.region[0],f.region[1])+Vector2i(f.anchor[0],f.anchor[1])+q
    if not Rect2i(f.region[0],f.region[1],f.region[2],f.region[3]).has_point(at):return Color.TRANSPARENT
    return image.get_pixelv(at)
func run() -> void:
    var args := OS.get_cmdline_user_args();var output := ""
    if "--capture" in args:output=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(output)
    var art := Art.new()
    check(art.open() and art.entries.size()==10,"original eight appearances plus two separate cleanup candidates")
    var entry: Dictionary=art.entries[Art.SIMPLE]
    check(entry.frames.size()==2 and entry.palette.size()==16,"two complete poses with sixteen-colour palette")
    var root_path := ProjectSettings.globalize_path(Art.SIMPLE_ROOT)
    var source: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(root_path+"source-frames.json"))[Art.SIMPLE]
    check(FileAccess.get_sha256(root_path+source.file)==source.sha256,"raw PNG exact hash retained")
    var raw := Image.load_from_file(root_path+source.file)
    for frame in source.frames:
        var r := Rect2i(frame.region[0],frame.region[1],frame.region[2],frame.region[3])
        check(Rect2i(Vector2i.ZERO,raw.get_size()).encloses(r),"whole source pose within sheet")
        var border := true
        for x in range(r.position.x,r.end.x):
            if raw.get_pixel(x,r.position.y).a>.5 or raw.get_pixel(x,r.end.y-1).a>.5:border=false
        for y in range(r.position.y,r.end.y):
            if raw.get_pixel(r.position.x,y).a>.5 or raw.get_pixel(r.end.x-1,y).a>.5:border=false
        check(border,"source pose separated by transparent margin")
    for name in [Art.SIMPLE,"mega_tidewyrm_clean"]:
        var native_entry: Dictionary=art.entries[name]
        var atlas := Image.load_from_file(root_path+"assets/"+name+"/atlas.png")
        var baseline := Image.load_from_file(root_path+"baseline/"+name+"/atlas.png")
        var before: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(root_path+"baseline/"+name+"/frames.json"))[name]
        var colors := {};var binary := true;var clear := true;var bounded := true;var changed := 0;var added := 0
        for index in 2:
            var f: Dictionary=native_entry.frames[index]
            check(f.anchor==native_entry.frames[0].anchor,"shared native root")
            var rect := Rect2i(f.region[0],f.region[1],f.region[2],f.region[3])
            check(Rect2i(Vector2i.ZERO,atlas.get_size()).encloses(rect),"native pose in atlas")
            for y in range(rect.position.y,rect.end.y):
                for x in range(rect.position.x,rect.end.x):
                    var c := atlas.get_pixel(x,y)
                    var q := Vector2i(x,y)-rect.position-Vector2i(f.anchor[0],f.anchor[1])
                    var old := sample(baseline,before.frames[index],q)
                    if c.a>0 and old.a==0:
                        added+=1
                        var neighbor := false
                        for dy in [-1,0,1]:
                            for dx in [-1,0,1]:
                                if sample(baseline,before.frames[index],q+Vector2i(dx,dy)).a>.5:neighbor=true
                        if not neighbor or c.to_rgba32()!=Color(native_entry.palette[0]).to_rgba32():bounded=false
                    if c.a==0 and old.a>0:bounded=false
                    if c.a!=0 and c.a!=1:binary=false
                    if c.a>0:
                        colors[c.to_rgba32()]=true
                        if x in [rect.position.x,rect.end.x-1] or y in [rect.position.y,rect.end.y-1]:clear=false
                        if c!=old:changed+=1
        check(colors.size()<=16 and binary and clear,"native palette, binary alpha, unclipped padding")
        check(bounded and changed>0 and added>0,"cleanup preserves body and confines navy outline to one native pixel")
    check(art.walking(Art.SIMPLE,4,2).texture==art.walking("tidewyrm",4,2).texture,"temporary form still walks as ordinary Tidewyrm")
    check(FileAccess.get_sha256(root_path+"source/wing-native.png")==FileAccess.get_sha256("res://tests/tide_ember_family/assets/mega_tidewyrm/atlas.png"),"original winged atlas copy is exact and original remains intact")
    var cleaned_wing: Dictionary=art.entries["mega_tidewyrm_clean"]
    check(cleaned_wing.frames.size()==2 and cleaned_wing.palette==art.entries["mega_tidewyrm"].palette,"cleaned wing keeps the original palette and pose count")
    check(art.walking("mega_tidewyrm_clean",0,0).texture==art.walking("tidewyrm",0,0).texture,"cleaned wing remains appearance-only")
    var raw_art := Art.new();raw_art.raw_mode=true
    check(raw_art.open() and raw_art.battle(Art.SIMPLE,true,0).index==1,"raw candidate front/rear also available")
    var scene=load("res://tests/mega_tide_readability/play.tscn").instantiate()
    if "--private" not in args:scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame
    check(scene.no_save and not scene.Profile.Safe.exists(scene.save_path),"unsaved comparison cannot open/write live profile")
    if "--private" in args:check(scene.pack.entries.size()==3 and scene.pack.issue=="","actual optional private pack loaded")
    var party: Array=scene.supplies.team.duplicate(true)
    check(scene.comparison_images.size()==8,"normal, original winged, cleaned winged and family-board front/rear together")
    for image in scene.comparison_images:
        check(image.material==null and image.texture is AtlasTexture,"direct nearest native portrait")
        check(scene.detail.get_rect().size.x>=image.position.x+image.size.x and image.position.x>=0,"comparison portrait fits panel width")
    if output!="":await snap(output,"native-comparison")
    var at: Vector3=scene.player.position
    scene.toggle_comparison();await process_frame
    check(not scene.clean_mode and scene.comparison_images.size()==8 and scene.player.position==at,"source comparison keeps world location")
    if output!="":await snap(output,"source-comparison")
    scene.toggle_comparison();await process_frame
    check(scene.clean_mode,"returns to native view")
    scene.close_menu();check(scene.starter_name=="tidewyrm","walking remains normal final")
    if output!="":await snap(output,"ordinary-walking")
    scene.show_gallery();await process_frame
    check(scene.supplies.team==party and not scene.Profile.Safe.exists(scene.save_path),"comparison never changes saved species or party")
    scene.queue_free();await process_frame;await process_frame
    print("Mega Tide readability checks: %d passed, %d failed." % [passed,failed]);quit(1 if failed else 0)
