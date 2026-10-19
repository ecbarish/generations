extends SceneTree
func _initialize() -> void:run.call_deferred()
func run() -> void:
    var scene=load("res://tests/mosshog_clean/play.tscn").instantiate()
    scene.pack_path="Z:/no-private-pack"
    root.add_child(scene);await process_frame
    scene.select_starter("mosshog");await process_frame
    scene.show_gallery()
    var t0 := Time.get_ticks_msec();var last := PackedByteArray();var n := 0
    while Time.get_ticks_msec()-t0<8200:
        await RenderingServer.frame_post_draw
        var img: Image=root.get_texture().get_image().get_region(Rect2i(100,330,660,290))
        var data := img.get_data()
        if data!=last:
            img.save_png("/workspace/motion_scratch/blink/%05d_s%.2f.png" % [Time.get_ticks_msec()-t0,scene.seconds]);last=data;n+=1
    print("distinct gallery frames ",n," seconds now ",scene.seconds)
    scene.queue_free();await process_frame;quit(0)
