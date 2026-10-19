extends SceneTree
# Scratch capture driver for the WB-GUEST-MOTION review. Not committed to game sources; writes PNGs outside the repo.
var out := "/workspace/motion_scratch/raw"
var log := []
const DIRS := {"up":[KEY_W],"up-right":[KEY_W,KEY_D],"right":[KEY_D],"down-right":[KEY_S,KEY_D],"down":[KEY_S],"down-left":[KEY_S,KEY_A],"left":[KEY_A],"up-left":[KEY_W,KEY_A]}
func _initialize() -> void:run.call_deferred()
func key(k: int,down: bool) -> void:
    var e := InputEventKey.new();e.keycode=k;e.physical_keycode=k;e.pressed=down;Input.parse_input_event(e)
func snap(scene,title: String) -> void:
    await RenderingServer.frame_post_draw
    var img: Image=root.get_texture().get_image()
    var cam: Camera3D=root.get_camera_3d()
    var p := Vector2(-1,-1)
    if cam!=null and scene.partner!=null:p=cam.unproject_position(scene.partner.global_position)
    img.save_png(out.path_join(title+".png"))
    log.append({"title":title,"size":[img.get_width(),img.get_height()],"partner_px":[p.x,p.y],"vp":[root.get_visible_rect().size.x,root.get_visible_rect().size.y],
        "dir8":scene.partner_gait.direction8,"moving":scene.partner_gait.moving,"phase":scene.starter_art.phase(scene.starter_name,scene.partner_gait.distance,scene.partner_gait.moving),"clean":scene.clean_mode,"t":Time.get_ticks_msec()})
func wait_ms(ms: int) -> void:
    var until := Time.get_ticks_msec()+ms
    while Time.get_ticks_msec()<until:await process_frame
func run() -> void:
    print("Godot ",Engine.get_version_info().string)
    var scene=load("res://tests/mosshog_clean/play.tscn").instantiate()
    scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame;await wait_ms(300)
    for name in ["mosshog","thicketboar","thornback"]:
        scene.select_starter(name);await process_frame
        for mode in ["clean","original"]:
            if (mode=="clean")!=scene.clean_mode:scene.toggle_comparison();await process_frame
            for d in DIRS:
                var tile: Vector2i={"right":Vector2i(12,-9),"up-right":Vector2i(12,-8),"down-right":Vector2i(12,-10)}.get(d,Vector2i(11,-5))  # open grass east of the trail
                scene.player.position=scene.Map.point(tile);scene._reset_follow();await wait_ms(120)
                scene.player.visible=not d.begins_with("down")  # capture only: the trainer stands between camera and follower when walking toward the camera
                for k in DIRS[d]:key(k,true)
                await wait_ms(380)
                for i in 5:
                    await snap(scene,"%s-%s-walk-%s-%d" % [name,mode,d,i]);await wait_ms(45)
                for k in DIRS[d]:key(k,false)
                await wait_ms(260);scene.player.visible=true
                if d=="right":await snap(scene,"%s-%s-stop-%s" % [name,mode,d])
            # run, one direction
            scene.player.position=scene.Map.point(Vector2i(12,-9));scene._reset_follow();await wait_ms(120)
            key(KEY_SHIFT,true);key(KEY_D,true);await wait_ms(300)
            for i in 5:
                await snap(scene,"%s-%s-run-right-%d" % [name,mode,i]);await wait_ms(35)
            key(KEY_D,false);key(KEY_SHIFT,false);await wait_ms(200)
            # battle views, including a blink window for Mosshog
            scene.show_gallery();await wait_ms(150);await snap(scene,"%s-%s-battle" % [name,mode])
            scene.seconds=3.70;await process_frame;await snap(scene,"%s-%s-battle-blinktime" % [name,mode])
            scene.close_menu();await process_frame
    if not scene.clean_mode:scene.toggle_comparison();await process_frame
    scene.starter_name="mega_thornback";scene.show_gallery();await wait_ms(150);await snap(scene,"mega-clean-battle")
    scene.close_menu();await process_frame;print("after mega close: ",scene.starter_name)
    scene.toggle_comparison();await process_frame
    scene.starter_name="mega_thornback";scene.show_gallery();await wait_ms(150);await snap(scene,"mega-original-battle")
    scene.close_menu();await process_frame
    var f := FileAccess.open(out.path_join("log.json"),FileAccess.WRITE);f.store_string(JSON.stringify(log,"  "));f.close()
    print("captured ",log.size())
    scene.queue_free();await process_frame;quit(0)
