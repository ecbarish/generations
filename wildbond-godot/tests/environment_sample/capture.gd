extends SceneTree
var scene: Node3D
var output := ""
var passed := 0
var failed := 0
var report := {}
func _initialize() -> void:run.call_deferred()
func check(ok: bool, title: String) -> void:
    if ok:passed+=1
    else:failed+=1;print("FAIL: ",title)
func settle(count := 25) -> void:
    for i in count:await process_frame
func snap(title: String) -> void:
    await settle()
    await RenderingServer.frame_post_draw
    check(root.get_texture().get_image().save_png(output.path_join(title+".png"))==OK,"capture "+title)
func reachable(start: Vector2i, finish: Vector2i) -> bool:
    var queue: Array[Vector2i]=[start]
    var seen := {start:true}
    while not queue.is_empty():
        var at: Vector2i=queue.pop_front()
        if at==finish:return true
        for delta in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
            var next: Vector2i=at+delta
            if seen.has(next) or not scene.world_map.cells.has(next):continue
            if scene.world_map.blocked(scene.Map.point(next)):continue
            seen[next]=true;queue.append(next)
    return false
func press(code: int) -> void:
    for down in [true,false]:
        var event := InputEventKey.new();event.keycode=code;event.physical_keycode=code;event.pressed=down
        Input.parse_input_event(event)
        await process_frame
func run() -> void:
    var args := OS.get_cmdline_user_args()
    if args.is_empty():quit(2);return
    output=args[0];DirAccess.make_dir_recursive_absolute(output)
    scene=load("res://tests/environment_sample/play.tscn").instantiate()
    root.add_child(scene)
    await settle(40)
    check(scene.no_save,"audition refuses persistent writes")
    check(scene.pack.entries.is_empty() if "--fallback" in args else not scene.pack.entries.is_empty(),"requested art mode loaded")
    check(scene.save_path!=scene.Profile.PATH,"audition never selects actual profile")
    check(not FileAccess.file_exists(scene.save_path),"no audition save created at start")
    check(scene.profile.state.started and scene.supplies.team[0].id=="wildbond:mosshog","real original partner and chapter initialized")
    var measured: RefCounted = scene.Map.new()
    check(scene.world_map.cells==measured.cells,"entire collision grid unchanged")
    for target in [Vector2i(9,11),Vector2i(4,5),Vector2i(11,-4),Vector2i(5,-15),Vector2i(10,-20),Vector2i(3,-27)]:
        check(reachable(Vector2i(11,7),target),"reachable and returnable: "+str(target))
    check(scene.world_map.blocked(scene.Map.point(Vector2i(-15,7))),"later cave remains blocked")
    check(scene.world_map.blocked(scene.Map.point(Vector2i(31,-10))),"Dewcut far boundary stays blocked")
    check(scene.world_map.blocked(scene.Map.point(Vector2i(10,-40))),"Thorn Badge gate stays closed")
    var tree_count := 0
    var ids := {}
    for holder in scene.occluders:
        if holder.has_meta("sample_tree"):
            tree_count+=1
            ids[holder.get_meta("meshes")[0].mesh.get_instance_id()]=true
    if not scene.baseline:
        check(tree_count>100 and ids.size()==1,"coherent trees reuse one mesh")
        check(not scene.environment.ssao_enabled and not scene.environment.ssr_enabled and not scene.environment.glow_enabled,"costly screen effects disabled")
        check(not scene.dressing.is_empty(),"discovery dressing present")
        var free_bench := true
        for holder in scene.occluders:
            if holder.has_meta("sample_tree") and scene.Map.tile(holder.position)==Vector2i(4,-17):free_bench=false
        check(free_bench,"rest spot does not overlap a tree trunk")
    var views := [["ranch",Vector2i(11,11)],["trail",Vector2i(11,-4)],["discovery",Vector2i(6,-15)]]
    var metrics := []
    for view in views:
        scene.player.position=scene.Map.point(view[1]);scene._reset_follow();scene._update_camera()
        await snap(view[0])
        var elapsed: Array[float]=[]
        var cpu: Array[float]=[]
        for i in 90:
            var begin := Time.get_ticks_usec()
            await process_frame
            await RenderingServer.frame_post_draw
            elapsed.append((Time.get_ticks_usec()-begin)/1000.0)
            cpu.append(scene.process_cpu_ms)
        elapsed.sort();cpu.sort()
        metrics.append({"view":view[0],"wall_frame_median_ms":elapsed[45],"wall_frame_p95_ms":elapsed[85],"process_median_ms":cpu[45],"process_p95_ms":cpu[85],"draw_calls":root.get_render_info(Viewport.RENDER_INFO_TYPE_VISIBLE,Viewport.RENDER_INFO_DRAW_CALLS_IN_FRAME),"rendered_objects":root.get_render_info(Viewport.RENDER_INFO_TYPE_VISIBLE,Viewport.RENDER_INFO_OBJECTS_IN_FRAME),"primitives":root.get_render_info(Viewport.RENDER_INFO_TYPE_VISIBLE,Viewport.RENDER_INFO_PRIMITIVES_IN_FRAME)})
    # Real input traverses the same measured path with follower locomotion active.
    scene.player.position=scene.Map.point(Vector2i(11,-4));scene._reset_follow();scene._update_camera()
    var before: Vector3=scene.player.position
    var key := InputEventKey.new();key.keycode=KEY_W;key.physical_keycode=KEY_W;key.pressed=true
    Input.parse_input_event(key);await create_timer(.6).timeout
    key=key.duplicate();key.pressed=false;Input.parse_input_event(key)
    check(scene.player.position.z<before.z-.8,"held input walks the dressed route")
    check(scene.player.position.distance_to(scene.companion.position)<3.5,"partner follows through the dressed route")
    # Sample controls must use real input and remain safe around chapter modals.
    await press(KEY_F6)
    check(scene.Map.tile(scene.player.position)==scene.sample_views[1],"F6 jumps to the next review view")
    scene.open_map()
    var held: Vector3=scene.player.position
    await press(KEY_F6)
    check(scene.player.position==held,"F6 does not jump while a chapter menu is open")
    scene.close_menu()
    await press(KEY_F7);check(not scene.ui.visible,"F7 hides presentation UI")
    await press(KEY_F7);check(scene.ui.visible,"F7 restores usable UI")
    scene.player.position=scene.Map.point(Vector2i(5,-15));scene._reset_follow();scene._update_camera()
    var coins_before: int=scene.coins
    scene.interact();scene.close_dialogue()
    check(scene.coins==coins_before+60 and "tw1" in scene.chapter.items,"existing discovery pickup still works")
    scene.interact();scene.close_dialogue()
    check(scene.coins==coins_before+60,"discovery reward cannot repeat")
    scene.player.position=scene.Map.point(Vector2i(4,5));scene._reset_follow()
    scene.interact()
    check(scene.room=="center","healing-house door still works")
    scene.change_room("town")
    check(scene.room=="town" and not scene._blocked(scene.player.position),"healing-house return stays usable")
    scene.save_progress()
    check(not FileAccess.file_exists(scene.save_path),"progress attempt remains unsaved")
    scene.player.position=scene.Map.point(Vector2i(11,-4));scene._reset_follow();scene._update_camera()
    scene.set_night(true);await snap("night");scene.set_night(false)
    scene.set_rain(true);await snap("rain");scene.set_rain(false)
    report={"baseline":scene.baseline,"renderer":RenderingServer.get_current_rendering_method(),"engine":Engine.get_version_info().string,"window_pixels":[root.size.x,root.size.y],"tree_mesh_instances":tree_count,"metrics":metrics,"passed":passed,"failed":failed,"limits":"Local fixed-camera rendering sample with warmed caches. Wall times include frame pacing; no mobile/low-end/GPU memory or human navigation guarantee."}
    var file := FileAccess.open(output.path_join("metrics.json"),FileAccess.WRITE)
    file.store_string(JSON.stringify(report,"  "));file.close()
    print("Environment sample: %d passed, %d failed; %s" % [passed,failed,output])
    scene.queue_free();await settle(3)
    quit(1 if failed else 0)
