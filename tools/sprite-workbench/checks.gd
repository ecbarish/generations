extends SceneTree
const Session := preload("res://session.gd")
var passed := 0
var failed := 0
var out := ""
func _initialize() -> void:run.call_deferred()
func check(ok: bool,title: String) -> void:
    if ok:passed+=1
    else:failed+=1;printerr("FAIL: "+title)
func write_json(path: String,data: Variant) -> void:
    var f := FileAccess.open(path,FileAccess.WRITE);f.store_string(JSON.stringify(data));f.close()
func click(at: Vector2) -> void:
    var press := InputEventMouseButton.new();press.position=at;press.global_position=at;press.button_index=MOUSE_BUTTON_LEFT;press.pressed=true
    Input.parse_input_event(press);await process_frame;await process_frame
    var release: InputEventMouseButton=press.duplicate();release.pressed=false
    Input.parse_input_event(release);await process_frame;await process_frame
func find_button(node: Node,text: String) -> Button:
    if node is Button and node.text==text:return node
    for child in node.get_children():
        var found := find_button(child,text)
        if found!=null:return found
    return null
func snap(name: String) -> void:
    if out=="":return
    for i in 5:await process_frame
    await RenderingServer.frame_post_draw
    root.get_texture().get_image().save_png(out.path_join(name+".png"))
func run() -> void:
    var args := OS.get_cmdline_user_args()
    if "--capture" in args:
        out=args[args.find("--capture")+1];DirAccess.make_dir_recursive_absolute(out)
    var scratch := ProjectSettings.globalize_path("user://checks-"+str(OS.get_process_id()))
    DirAccess.make_dir_recursive_absolute(scratch)
    var session := Session.new()
    check(session.load_manifest(Session.family_manifest()),"actual measured family manifest loads")
    if session.entries.is_empty():
        printerr(Session.family_manifest()+" :: "+session.issue);quit(1);return
    var manifest_hash := FileAccess.get_sha256(Session.family_manifest())
    var sources := {}
    for name in session.entries:
        sources[name]=session.entries[name].sha256
        check(session.palette(name).size()==16,"bounded palette "+name)
        for i in session.entries[name].frames.size():
            var native := session.native_frame(name,i)
            var colors := {};var binary := true
            for y in native.image.get_height():
                for x in native.image.get_width():
                    var c: Color=native.image.get_pixel(x,y)
                    if c.a!=0 and c.a!=1:binary=false
                    if c.a>0:colors[c.to_rgba32()]=true
            check(colors.size()<=16 and binary,"actual pose has <=16 colors and binary alpha "+name+str(i))
    var name := "thicketboar";var index := 4
    var before: Array=session.entries[name].frames[index].anchor.duplicate()
    check(not session.anchor(name,index,-1,0),"out-of-frame anchor rejected")
    check(session.anchor(name,index,before[0]+2,before[1]-1),"root/ground edit accepted")
    session.apply_cycle_offset(name,index)
    check(is_equal_approx(float(session.entries[name].frames[5].anchor[0])-float(session.original[name].frames[5].anchor[0]),2),"cycle shares relative root offset")
    check(session.undo() and session.undo() and session.entries[name].frames[index].anchor==before,"undo restores original anchors")
    check(session.redo(),"redo restores anchor edit")
    var native := session.native_frame(name,index)
    var point: Vector2i=native.lo+Vector2i(2,2)
    session.paint(name,index,point,3)
    native=session.native_frame(name,index)
    check(native.image.get_pixelv(point-native.lo).is_equal_approx(session.palette(name)[3]),"palette brush changes an actual native pixel")
    session.paint(name,index,point,-1)
    check(session.native_frame(name,index).image.get_pixelv(point-native.lo).a==0,"eraser produces transparent pixel")
    check(session.undo() and session.native_frame(name,index).image.get_pixelv(point-native.lo).a==1,"undo restores painted pixel")
    var draft := scratch.path_join("draft.json")
    check(session.save_draft(draft),"draft writes separate state")
    check(not str(session.read_json(draft).source_manifest).is_absolute_path(),"repository drafts retain a portable manifest reference")
    var restored := Session.new()
    check(restored.load_draft(draft),"draft reload verifies source and restores edits")
    check(restored.entries==session.entries and restored.pixels==session.pixels,"draft round-trip preserves anchors and native edits")
    check(not session.save_draft(Session.family_manifest()),"draft cannot overwrite source measurements")
    check(session.save_draft(draft) and FileAccess.file_exists(draft+".bak"),"previous valid draft backed up")
    var bad: Dictionary=session.read_json(draft)
    bad.schema=99;write_json(scratch.path_join("future.json"),bad)
    var state: Dictionary=restored.entries.duplicate(true)
    check(not restored.load_draft(scratch.path_join("future.json")) and restored.entries==state,"future draft rejected without changing current session")
    bad=session.read_json(draft);bad.entries[name].frames[0].region=[0,0,99999,1]
    write_json(scratch.path_join("bad.json"),bad)
    check(not restored.load_draft(scratch.path_join("bad.json")) and restored.entries==state,"malformed geometry rejected without state loss")
    var exported := session.export_atlas(name,scratch)
    check(exported!="" and FileAccess.file_exists(exported.path_join("atlas.png")),"native atlas and metadata exported")
    var roundtrip := Session.new()
    check(roundtrip.load_manifest(exported.path_join("frames.json")),"exported measurements reimport")
    var atlas := Image.load_from_file(exported.path_join("atlas.png"))
    for i in session.entries[name].frames.size():
        var source := session.native_frame(name,i)
        var target: Dictionary=roundtrip.entries[name].frames[i]
        var at: Vector2i=Vector2i(target.region[0],target.region[1])+Vector2i(target.anchor[0],target.anchor[1])-source.anchor
        var equal := true
        for y in source.image.get_height():
            for x in source.image.get_width():
                if atlas.get_pixelv(at+Vector2i(x,y))!=source.image.get_pixel(x,y):equal=false
        check(equal,"atlas preserves exact native pixels and root for frame "+str(i))
    var again := session.export_atlas(name,scratch)
    check(again!=exported and again!="","repeated export creates a separate version")
    var resumed := Session.new()
    check(resumed.load_draft(exported.path_join("edit-session.json")) and resumed.pixels==session.pixels,"export includes recoverable editable draft")
    var trio := Session.new()
    check(trio.load_manifest(Session.starter_manifest()) and trio.entries.size()==3,"existing base trio measurements supported")
    var bad_manifest: Dictionary=session.read_json(Session.family_manifest())
    bad_manifest.thicketboar.sha256="000"
    # Keep the same directory resolution while ensuring hashes reject before reading images.
    write_json(scratch.path_join("stale.json"),bad_manifest)
    check(not restored.load_manifest(scratch.path_join("stale.json")) and restored.entries==state,"stale source refuses import without resetting current work")
    var temp_png := scratch.path_join("source.png")
    DirAccess.copy_absolute(Session.family_manifest().get_base_dir().path_join(session.entries[name].file),temp_png)
    var fixture: Dictionary={name:session.original[name].duplicate(true)}
    fixture[name].file="source.png"
    var fixture_path := scratch.path_join("fixture.json");write_json(fixture_path,fixture)
    var changed_source := Session.new()
    check(changed_source.load_manifest(fixture_path),"isolated source-change fixture loads")
    var corrupt := FileAccess.open(temp_png,FileAccess.WRITE);corrupt.store_string("changed after loading");corrupt.close()
    check(changed_source.export_atlas(name,scratch)=="","source changes after opening block export")
    fixture[name].height_m=123;write_json(fixture_path,fixture)
    check(not changed_source.save_draft(scratch.path_join("changed-draft.json")),"changed measurement manifest blocks draft save")
    check(FileAccess.get_sha256(Session.family_manifest())==manifest_hash,"source manifest bytes preserved")
    for id in session.entries:check(FileAccess.get_sha256(Session.family_manifest().get_base_dir().path_join(session.entries[id].file))==sources[id],"original source PNG untouched "+id)
    var app=load("res://workbench.tscn").instantiate()
    root.add_child(app)
    for i in 6:await process_frame
    check(app.session.entries.size()==3 and app.viewer!=null,"real editor scene opens with pilot")
    app.mode="reference";app.chosen(exported.path_join("atlas.png"))
    check(app.reference_texture==null,"oversized reference atlas rejected")
    var ref_png := scratch.path_join("reference.png")
    session.native_frame(name,4).image.save_png(ref_png)
    app.chosen(ref_png)
    check(app.reference_texture!=null,"optional native-size reference PNG loads read-only")
    app.reference_texture=null
    app.select_species("thicketboar");app.frame_index=4;app.refresh()
    var next := find_button(app,"Next")
    await click(next.get_global_rect().get_center())
    check(app.frame_index==5,"pointer Next changes selected frame")
    var arrow := InputEventKey.new();arrow.keycode=KEY_RIGHT;arrow.physical_keycode=KEY_RIGHT;arrow.pressed=true
    Input.parse_input_event(arrow);await process_frame
    arrow=arrow.duplicate();arrow.pressed=false;Input.parse_input_event(arrow);await process_frame
    check(app.frame_index==6,"frame shortcut works while toolbar button has focus")
    var play := find_button(app,"Play")
    await click(play.get_global_rect().get_center())
    check(app.playing,"pointer Play starts playback")
    app._process(.3)
    check(app.frame_index in [4,5,6,7],"playback stays inside selected direction cycle")
    app.playing=false;app.frame_index=4;app.refresh()
    for i in 3:await process_frame
    app.brush_mode.select(1);app.brush_color=4
    var canvas_point: Vector2=app.viewer.origin+Vector2(3.5,3.5)*app.viewer.draw_zoom+app.viewer.global_position
    await click(canvas_point)
    check(app.session.pixels.has("thicketboar:4"),"actual canvas pointer paints native pixel")
    var undo := find_button(app,"Undo")
    var scroll: ScrollContainer=undo.get_parent().get_parent().get_parent()
    scroll.ensure_control_visible(undo)
    for i in 4:await process_frame
    await click(undo.get_global_rect().get_center())
    check(not app.session.pixels.has("thicketboar:4"),"pointer Undo reverses entire brush stroke")
    app.anchor_x.value+=1
    check(app.session.dirty,"anchor control edits draft")
    var state_before: Dictionary=app.session.entries.duplicate(true)
    app.ask_discard(func():app.load_source(Session.starter_manifest()))
    check(app.discard.visible,"switching sheets with unsaved edits asks before discarding")
    app.discard.hide();check(app.session.entries==state_before,"cancel preserves edits")
    await snap("workbench")
    app.source_view.button_pressed=true;await snap("source-view")
    app.source_view.button_pressed=false;app.onion.button_pressed=true;app.grid.button_pressed=true
    await snap("onion-grid")
    for size in [Vector2i(900,680),Vector2i(1366,768),Vector2i(1920,1080),Vector2i(3440,1440)]:
        root.size=size
        for i in 5:await process_frame
        check(app.viewer.size.x>=400 and app.viewer.size.y>=320,"usable canvas at "+str(size))
        await snap("layout-%dx%d" % [size.x,size.y])
    app.queue_free();await process_frame
    print("Sprite workbench checks: %d passed, %d failed." % [passed,failed])
    print("Isolated test output: "+scratch)
    quit(1 if failed else 0)
