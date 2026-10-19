extends "res://recipes/mosshog-cleanup.gd"
## Native edits through the workbench; approved concepts and raw PNGs are immutable.
const EYES := {
    "ripplet":Rect2i(-2,-36,5,4),"riverwisp":Rect2i(17,-49,5,5),"tidewyrm":Rect2i(22,-50,5,3),
    "cindercub":Rect2i(5,-33,4,5),"smoulderpup":Rect2i(22,-42,4,4),"blazefang":Rect2i(20,-42,4,4)
}
const ORDER := ["ripplet","riverwisp","tidewyrm","mega_tidewyrm","cindercub","smoulderpup","blazefang","mega_blazefang"]
func clean(session: RefCounted,name: String) -> void:
    var log := {"root_offsets":[],"stabilized_pixels":0,"neutral_battle_pixels":0,"foot_specks_removed":0}
    if session.entries[name].frames.size()==24:
        for first in range(4,24,4):
            for i in range(first,first+4):
                var f: Dictionary=session.native_frame(name,i)
                var used: Rect2i=f.image.get_used_rect()
                var mass := 0;var total := 0.0
                for y in range(used.position.y+roundi(used.size.y*.4),used.position.y+roundi(used.size.y*.8)):
                    for x in range(used.position.x,used.end.x):
                        if f.image.get_pixel(x,y).a>.5:mass+=1;total+=x
                var dx := roundi(total/maxi(1,mass)-f.anchor.x)
                var a: Array=session.entries[name].frames[i].anchor
                session.anchor(name,i,a[0]+dx,a[1])
                log.root_offsets.append({"frame":i,"x_native":dx})
        for first in range(4,24,4):
            var f: Dictionary=session.native_frame(name,first+1)
            var cut := -maxi(6,roundi(f.image.get_used_rect().size.y*.23))
            for i in range(first,first+4):
                if i!=first+1:log.stabilized_pixels+=clone_frame(session,name,first+1,i,cut)
                log.foot_specks_removed+=remove_foot_specks(session,name,i,cut)
        # Full-body generated alternates are not eyelid animation.
        log.neutral_battle_pixels=clone_frame(session,name,0,1)+clone_frame(session,name,2,3)
        var eye: Rect2i=EYES[name]
        var front: Dictionary=session.native_frame(name,0)
        for y in range(eye.position.y,eye.end.y):
            for x in range(eye.position.x,eye.end.x):
                var q := Vector2i(x,y)
                if value(front.image,q-front.lo).a>.5:
                    var color := 0 if y==eye.position.y+eye.size.y/2 else (4 if name in ["ripplet","riverwisp","tidewyrm"] else 2)
                    session.paint(name,1,q,color,false)
        log.blink_rect=[eye.position.x,eye.position.y,eye.size.x,eye.size.y]
    audit[name]=log
func run() -> void:
    var repo := Session.repo_root()
    var output := repo.path_join("docs/art/tide-ember-production")
    var asset_root := repo.path_join("wildbond-godot/tests/tide_ember_family")
    for p in [output.path_join("before"),output.path_join("after"),asset_root.path_join("baseline"),asset_root.path_join("assets")]:DirAccess.make_dir_recursive_absolute(p)
    var base := Session.new();var family := Session.new()
    if not base.load_manifest(Session.starter_manifest()) or not family.load_manifest(asset_root.path_join("source-frames.json")):printerr(base.issue+family.issue);quit(1);return
    root.size=Vector2i(800,1120)
    var scratch := ProjectSettings.globalize_path("user://tide-ember-build")
    var manifests := {}
    for name in ORDER:
        if not base.entries.has(name) and not family.entries.has(name):continue
        var source: RefCounted=base if name in ["ripplet","cindercub"] else family
        await snap(source,name,output.path_join("before"))
        var baseline_path := asset_root.path_join("baseline/"+name)
        var first: String=source.export_atlas(name,scratch)
        if first=="":printerr(source.issue);quit(1);return
        selected_copy(first,baseline_path)
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
                    if raw.get_pixelv(at+Vector2i(x,y))!=native.image.get_pixel(x,y):printerr("Draft/atlas mismatch");quit(1);return
        audit[name].editable_roundtrip="passed"
        await snap(working,name,output.path_join("after"))
        print(name," ",JSON.stringify(audit[name]))
    var combined := FileAccess.open(asset_root.path_join("frames.json"),FileAccess.WRITE);combined.store_string(JSON.stringify(manifests,"  ",false));combined.close()
    var file := FileAccess.open(output.path_join("edit-audit.json"),FileAccess.WRITE);file.store_string(JSON.stringify(audit,"  "));file.close()
    print("Editable Tide/Ember native atlases: "+asset_root);quit()
