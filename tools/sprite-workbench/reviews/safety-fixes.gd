extends "res://reviews/dot-safety.gd"
## Additional repair boundaries; the independent guest probe stays byte-for-byte intact.
func transaction_cases() -> void:
    for suffix in ["", ".tmp", ".bak"]:
        var dir := scratch.path_join("transaction-"+str(suffix.length()))
        assert(DirAccess.make_dir_recursive_absolute(dir)==OK)
        assert(DirAccess.copy_absolute(png,dir.path_join("source.png"))==OK)
        var target := dir.path_join("target.json")
        var source: String = target+suffix
        write_json(source,baseline)
        if suffix!="":write_json(target,{"previous":"draft"})
        var original_hash := FileAccess.get_sha256(source)
        var target_hash := FileAccess.get_sha256(target)
        var s := Session.new()
        check(s.load_manifest(source),"transaction "+suffix+": source accepted")
        s.paint(NAME,0,Vector2i.ZERO,2)
        var before := state_of(s)
        var destination := target
        if OS.get_name()=="Windows":destination=destination.to_upper()
        check(not s.save_draft(destination),"transaction "+suffix+": case-aware source collision refused")
        check(state_of(s)==before,"transaction "+suffix+": full edit/history/cache state retained")
        check(FileAccess.get_sha256(source)==original_hash,"transaction "+suffix+": source hash intact")
        check(FileAccess.get_sha256(target)==target_hash,"transaction "+suffix+": prior destination intact")
        check(not s.issue.is_empty(),"transaction "+suffix+": explanation provided")
        var current_parts := DirAccess.open(".").get_current_dir().replace("\\","/").split("/",false)
        var target_parts := target.split("/",false)
        var common := 0
        while common<mini(current_parts.size(),target_parts.size()) and current_parts[common].to_lower()==target_parts[common].to_lower():common+=1
        var relative := "../".repeat(current_parts.size()-common)+"/".join(target_parts.slice(common))
        check(not s.save_draft(relative),"transaction "+suffix+": relative alias refused")
        check(state_of(s)==before,"transaction "+suffix+": relative alias retains pending state")
        check(FileAccess.get_sha256(source)==original_hash,"transaction "+suffix+": relative alias preserves source")
    for hex in ["657b3100","657b3180"]:
        var data := baseline.duplicate(true)
        data[NAME].palette[3]=hex
        reject_manifest("nonopaque palette "+hex,data)
    for ink in [[],[0,0,2],[0,0,1,0],[0,0,1,-1],[0,0,1,"bad"],[0,0,1,4294967296]]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].erase("sample_step")
        data[NAME].frames[0].ink=ink
        reject_manifest("invalid inferred ink "+str(ink),data)
func boundary_cases() -> void:
    var dir := scratch.path_join("cell-boundaries")
    assert(DirAccess.make_dir_recursive_absolute(dir)==OK)
    for width in [508,509]:
        var image := Image.create(width,1,false,Image.FORMAT_RGBA8)
        image.fill(Color(Session.GREEN[3]))
        var file := dir.path_join("source.png")
        assert(image.save_png(file)==OK)
        var data := baseline.duplicate(true)
        data[NAME].sha256=FileAccess.get_sha256(file)
        data[NAME].size=[width,1]
        data[NAME].frames=[{"region":[0,0,width,1],"anchor":[0,1],"sample_step":1}]
        var source := dir.path_join("source.json")
        write_json(source,data)
        var s := Session.new()
        check(s.load_manifest(source),"cell "+str(width)+": import accepted")
        s.paint(NAME,0,Vector2i.ZERO,3)
        var folder := s.export_atlas(NAME,dir)
        if width==509:
            check(folder=="","oversize padding refused before writing export")
            check(s.dirty and not s.issue.is_empty(),"oversize export preserves pending edit and explanation")
        else:
            check(folder!="","512px padded cell exported")
            var reopened := Session.new()
            check(reopened.load_manifest(folder.path_join("frames.json")),"512px padded cell reopens")
            var a: Dictionary=s.native_frame(NAME,0)
            var b: Dictionary=reopened.native_frame(NAME,0)
            check(b.image.get_pixelv(b.anchor+Vector2i.UP)==a.image.get_pixelv(a.anchor+Vector2i.UP),"boundary root pixel retained")
func run() -> void:
    make_fixture()
    transaction_cases()
    boundary_cases()
    for path in source_hashes:check(FileAccess.get_sha256(path)==source_hashes[path],"immutable source unchanged")
    print("Workbench repair boundaries: %d passed, %d failed." % [passed,failed])
    quit(1 if failed else 0)


