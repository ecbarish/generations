extends SceneTree
const Session := preload("res://session.gd")
class Sheet extends Control:
    var art
    var creature := ""
    func _draw() -> void:
        draw_rect(Rect2(0,0,800,1120),Color("#e9e4d6"))
        var groups := [[0,1],[2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23]]
        if art.entries[creature].frames.size()==2:groups=[[0,1]]
        for row in groups.size():
            for column in groups[row].size():
                var i: int=groups[row][column]
                var f: Dictionary=art.native_frame(creature,i)
                var ground := Vector2(column*200+100,row*160+145)
                draw_line(Vector2(column*200,row*160+145),Vector2(column*200+200,row*160+145),Color("#ac9d82"))
                draw_texture_rect(f.texture,Rect2(ground-Vector2(f.anchor)*2,Vector2(f.image.get_size())*2),false)
                draw_string(ThemeDB.fallback_font,Vector2(column*200+8,row*160+17),creature+" "+str(i),HORIZONTAL_ALIGNMENT_LEFT,-1,13,Color("#332c25"))

var audit: Dictionary={}
func _initialize() -> void:run.call_deferred()
func idx(color: Color,pal: PackedColorArray) -> int:
    return -1 if color.a<.5 else pal.find(color)
func value(image: Image,point: Vector2i) -> Color:
    return image.get_pixelv(point) if Rect2i(Vector2i.ZERO,image.get_size()).has_point(point) else Color.TRANSPARENT
func install(session: RefCounted,name: String,index: int,target: Image) -> int:
    var before: Dictionary=session.native_frame(name,index)
    var pal: PackedColorArray=session.palette(name)
    var changed := 0
    for y in target.get_height():
        for x in target.get_width():
            var c := target.get_pixel(x,y)
            if c!=before.image.get_pixel(x,y):
                session.paint(name,index,Vector2i(x,y)+before.lo,idx(c,pal),false);changed+=1
    return changed
func clone_frame(session: RefCounted,name: String,from: int,to: int,cut := 999) -> int:
    var source: Dictionary=session.native_frame(name,from)
    var target: Dictionary=session.native_frame(name,to)
    var image: Image=target.image.duplicate()
    for y in image.get_height():
        for x in image.get_width():
            var q: Vector2i=Vector2i(x,y)+target.lo
            if q.y<=cut:image.set_pixel(x,y,value(source.image,q-source.lo))
    return install(session,name,to,image)
func selected_copy(folder: String,destination: String) -> void:
    DirAccess.make_dir_recursive_absolute(destination)
    for file in ["atlas.png","frames.json","edit-session.json"]:
        if DirAccess.copy_absolute(folder.path_join(file),destination.path_join(file))!=OK:push_error("Cannot persist selected export");quit(1)
func remove_foot_specks(session: RefCounted,name: String,index: int,cut: int) -> int:
    var f: Dictionary=session.native_frame(name,index)
    var image: Image=f.image.duplicate()
    var visited := {};var removed := 0
    for y in image.get_height():
        for x in image.get_width():
            var start := Vector2i(x,y)
            if visited.has(start) or image.get_pixelv(start).a<.5:continue
            var component: Array=[start];visited[start]=true;var cursor := 0;var below := true
            while cursor<component.size():
                var point: Vector2i=component[cursor];cursor+=1
                if point.y+f.lo.y<=cut:below=false
                for dy in [-1,0,1]:
                    for dx in [-1,0,1]:
                        var next := point+Vector2i(dx,dy)
                        if Rect2i(Vector2i.ZERO,image.get_size()).has_point(next) and not visited.has(next) and image.get_pixelv(next).a>.5:
                            visited[next]=true;component.append(next)
            if below and component.size()<=4:
                for point in component:image.set_pixelv(point,Color.TRANSPARENT);removed+=1
    install(session,name,index,image);return removed
func tusks(session: RefCounted) -> void:
    # Two upturned ivory accents beside Mosshog's front-facing snout, in native root coordinates.
    for i in range(4,8):
        for point in [Vector2i(-4,-12),Vector2i(8,-12)]:session.paint("mosshog",i,point,0,false)
        for point in [Vector2i(-3,-12),Vector2i(-3,-11),Vector2i(-2,-10),Vector2i(7,-12),Vector2i(7,-11),Vector2i(6,-10)]:session.paint("mosshog",i,point,11,false)
func blink(session: RefCounted) -> void:
    # Mosshog's measured eye occupies qx 5..10, qy -27..-24. The body/tail stay exact.
    for x in range(5,8):session.paint("mosshog",1,Vector2i(x,-26),5,false)
    for x in range(5,11):session.paint("mosshog",1,Vector2i(x,-25),0,false)
    for x in range(5,8):session.paint("mosshog",1,Vector2i(x,-24),10,false)
func clean(session: RefCounted,name: String) -> void:
    var log := {"root_offsets":[],"foliage_pixels":0,"stabilized_pixels":0,"neutral_battle_pixels":0,"foot_specks_removed":0}
    var pal: PackedColorArray=session.palette(name)
    if session.entries[name].frames.size()==24:
        for first in range(4,24,4):
            # Root alignment precedes all root-relative pixel overrides.
            for i in range(first,first+4):
                var f: Dictionary=session.native_frame(name,i)
                var used: Rect2i=f.image.get_used_rect()
                var mass := 0;var total := 0.0
                for y in range(used.position.y+roundi(used.size.y*.4),used.position.y+roundi(used.size.y*.8)):
                    for x in range(used.position.x,used.end.x):
                        if f.image.get_pixel(x,y).a>.5:mass+=1;total+=x
                var dx := roundi(total/maxi(1,mass)-f.anchor.x)
                var anchor: Array=session.entries[name].frames[i].anchor
                session.anchor(name,i,anchor[0]+dx,anchor[1])
                log.root_offsets.append({"frame":i,"x_native":dx})
    # Discrete olive shading: retain three green tones, outline, flowers and branch colours.
    for i in session.entries[name].frames.size():
        var f: Dictionary=session.native_frame(name,i)
        var image: Image=f.image.duplicate()
        var used: Rect2i=image.get_used_rect()
        var lower: int=used.end.y-maxi(5,roundi(used.size.y*.20)) if i>=4 else used.end.y
        for y in range(used.position.y,lower):
            for x in range(used.position.x,used.end.x):
                var c := idx(image.get_pixel(x,y),pal)
                if c>=1 and c<=6:image.set_pixel(x,y,pal[[0,1,1,3,3,5,5][c]])
        # Consolidate isolated interior green tones; retain alpha/outline/flowers/face.
        var pass_image: Image=image.duplicate()
        for y in range(used.position.y+1,lower-1):
            for x in range(used.position.x+1,used.end.x-1):
                var c := idx(image.get_pixel(x,y),pal)
                if c not in [1,3,5]:continue
                var votes := {};var opaque := true
                for d in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
                    var at: Vector2i=Vector2i(x,y)+d
                    var n := idx(image.get_pixelv(at),pal)
                    if n<0:opaque=false
                    if n in [1,3,5]:votes[n]=votes.get(n,0)+1
                if opaque:
                    for n in votes:
                        if votes[n]>=3:pass_image.set_pixel(x,y,pal[n])
        log.foliage_pixels+=install(session,name,i,pass_image)
    if session.entries[name].frames.size()==24:
        for first in range(4,24,4):
            var reference := first+1 # idle/passing pose is also the body's stable reference.
            var f: Dictionary=session.native_frame(name,reference)
            var used: Rect2i=f.image.get_used_rect()
            var cut := -maxi(6,roundi(used.size.y*.23))
            for i in range(first,first+4):
                if i!=reference:log.stabilized_pixels+=clone_frame(session,name,reference,i,cut)
                log.foot_specks_removed+=remove_foot_specks(session,name,i,cut)
        # The original alternate rear/front body changes are not a blink/breath.
        log.neutral_battle_pixels=clone_frame(session,name,0,1)+clone_frame(session,name,2,3)
        if name=="mosshog":tusks(session);blink(session)
        log.blink_status="Eyelid-only Mosshog front; other fronts/rears remain neutral."
    audit[name]=log
func snap(source: RefCounted,name: String,folder: String) -> void:
    var view := Sheet.new();view.art=source;view.creature=name;root.add_child(view)
    for i in 5:await process_frame
    await RenderingServer.frame_post_draw
    root.get_texture().get_image().save_png(folder.path_join(name+".png"))
    view.queue_free();await process_frame
func run() -> void:
    var repo := Session.repo_root()
    var output := repo.path_join("docs/art/mosshog-cleanup")
    var asset_root := repo.path_join("wildbond-godot/tests/mosshog_clean")
    for p in [output.path_join("before"),output.path_join("after"),asset_root.path_join("baseline"),asset_root.path_join("assets")]:DirAccess.make_dir_recursive_absolute(p)
    var base := Session.new()
    var family := Session.new()
    if not base.load_manifest(Session.starter_manifest()) or not family.load_manifest(Session.family_manifest()):printerr(base.issue+family.issue);quit(1);return
    root.size=Vector2i(800,1120)
    var scratch := ProjectSettings.globalize_path("user://mosshog-cleanup-build")
    var manifests := {}
    for name in ["mosshog","thicketboar","thornback","mega_thornback"]:
        var source: RefCounted=base if name=="mosshog" else family
        await snap(source,name,output.path_join("before"))
        var baseline_path := asset_root.path_join("baseline/"+name)
        selected_copy(source.export_atlas(name,scratch),baseline_path)
        var working := Session.new()
        if not working.load_manifest(baseline_path.path_join("frames.json")):printerr(working.issue);quit(1);return
        clean(working,name)
        var selected := working.export_atlas(name,scratch)
        if selected=="":printerr(working.issue);quit(1);return
        selected_copy(selected,asset_root.path_join("assets/"+name))
        var selected_data: Dictionary=working.read_json(selected.path_join("frames.json"))
        manifests[name]=selected_data[name].duplicate(true);manifests[name].file="assets/"+name+"/atlas.png"
        var reopened := Session.new()
        if not reopened.load_draft(asset_root.path_join("assets/"+name+"/edit-session.json")):printerr(reopened.issue);quit(1);return
        var raw := Image.load_from_file(asset_root.path_join("assets/"+name+"/atlas.png"))
        for i in reopened.entries[name].frames.size():
            var native: Dictionary=reopened.native_frame(name,i)
            var target: Dictionary=selected_data[name].frames[i]
            var at: Vector2i=Vector2i(target.region[0],target.region[1])+Vector2i(target.anchor[0],target.anchor[1])-native.anchor
            for y in native.image.get_height():
                for x in native.image.get_width():
                    if raw.get_pixelv(at+Vector2i(x,y))!=native.image.get_pixel(x,y):printerr("Draft/native export mismatch");quit(1);return
        audit[name].editable_roundtrip="passed"
        await snap(working,name,output.path_join("after"))
        print(name," ",JSON.stringify(audit[name]))
    var combined := FileAccess.open(asset_root.path_join("frames.json"),FileAccess.WRITE);combined.store_string(JSON.stringify(manifests,"  ",false));combined.close()
    var file := FileAccess.open(output.path_join("edit-audit.json"),FileAccess.WRITE);file.store_string(JSON.stringify(audit,"  "));file.close()
    print("Cleaned atlases and editable workbench sessions: "+asset_root);quit()
