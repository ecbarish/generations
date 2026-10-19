extends "res://recipes/mosshog-cleanup.gd"
const NAMES := ["mega_tidewyrm_simple","mega_tidewyrm_clean"]
func run() -> void:
    var repo := Session.repo_root()
    var asset_root := repo.path_join("wildbond-godot/tests/mega_tide_readability")
    var output := repo.path_join("docs/art/mega-tide-readability")
    for path in [output.path_join("before"),output.path_join("after"),asset_root.path_join("baseline"),asset_root.path_join("assets")]:DirAccess.make_dir_recursive_absolute(path)
    var source := Session.new()
    if not source.load_manifest(asset_root.path_join("source-frames.json")):printerr(source.issue);quit(1);return
    root.size=Vector2i(800,1120)
    var scratch := ProjectSettings.globalize_path("user://mega-tide-readability-build")
    var combined := {};var log := {}
    for name in NAMES:
        await snap(source,name,output.path_join("before"))
        var first := source.export_atlas(name,scratch)
        if first=="":printerr(source.issue);quit(1);return
        var baseline_path: String=asset_root.path_join("baseline/"+name)
        selected_copy(first,baseline_path)
        var working := Session.new()
        if not working.load_manifest(baseline_path.path_join("frames.json")):printerr(working.issue);quit(1);return
        var changed := 0;var removed := 0;var outline := 0
        var palette: PackedColorArray=working.palette(name)
        var indices := {}
        for i in palette.size():indices[palette[i].to_rgba32()]=i
        for index in 2:
            var f: Dictionary=working.native_frame(name,index)
            var image: Image=f.image
            for y in range(1,image.get_height()-1):
                for x in range(1,image.get_width()-1):
                    var color := image.get_pixel(x,y)
                    var current: int=indices.get(color.to_rgba32(),-1)
                    if color.a<.5 or current in [0,10,11,12]:continue
                    var votes := {};var interior := true
                    for direction in [Vector2i.UP,Vector2i.DOWN,Vector2i.LEFT,Vector2i.RIGHT]:
                        var c := image.get_pixelv(Vector2i(x,y)+direction)
                        if c.a<.5:interior=false
                        var id: int=indices.get(c.to_rgba32(),-1)
                        if id>=0:votes[id]=votes.get(id,0)+1
                    if interior:
                        for id in votes:
                            if votes[id]>=3 and current!=id:
                                working.paint(name,index,Vector2i(x,y)+f.lo,id,false);changed+=1
            # Discard only detached <=4px sampling debris, never connected anatomy.
            removed+=remove_foot_specks(working,name,index,-999)
            f=working.native_frame(name,index);image=f.image
            # A real one-pixel navy border replaces subpixel source outlines lost in sampling.
            for y in range(1,image.get_height()-1):
                for x in range(1,image.get_width()-1):
                    if image.get_pixel(x,y).a>.5:continue
                    var adjacent := false
                    for dy in [-1,0,1]:
                        for dx in [-1,0,1]:
                            if image.get_pixel(x+dx,y+dy).a>.5:adjacent=true
                    if adjacent:
                        working.paint(name,index,Vector2i(x,y)+f.lo,0,false);outline+=1
        var folder := working.export_atlas(name,scratch)
        if folder=="":printerr(working.issue);quit(1);return
        selected_copy(folder,asset_root.path_join("assets/"+name))
        var data: Dictionary=working.read_json(folder.path_join("frames.json"))
        combined[name]=data[name].duplicate(true);combined[name].file="assets/"+name+"/atlas.png"
        var reopened := Session.new()
        if not reopened.load_draft(asset_root.path_join("assets/"+name+"/edit-session.json")):printerr(reopened.issue);quit(1);return
        var atlas := Image.load_from_file(asset_root.path_join("assets/"+name+"/atlas.png"))
        for i in 2:
            var f: Dictionary=reopened.native_frame(name,i)
            var entry: Dictionary=data[name].frames[i]
            var at: Vector2i=Vector2i(entry.region[0],entry.region[1])+Vector2i(entry.anchor[0],entry.anchor[1])-f.anchor
            for y in f.image.get_height():
                for x in f.image.get_width():
                    if atlas.get_pixelv(at+Vector2i(x,y))!=f.image.get_pixel(x,y):printerr("Editable draft pixel mismatch");quit(1);return
        await snap(working,name,output.path_join("after"))
        log[name]={"interior_edits":changed,"detached_pixels_removed":removed,"outline_pixels_added":outline,"draft_roundtrip":"exact RGBA and roots"}
        print(name,": ",JSON.stringify(log[name]))
    var file := FileAccess.open(asset_root.path_join("frames.json"),FileAccess.WRITE);file.store_string(JSON.stringify(combined,"  ",false));file.close()
    file=FileAccess.open(output.path_join("edit-audit.json"),FileAccess.WRITE);file.store_string(JSON.stringify(log,"  "));file.close()
    quit()
