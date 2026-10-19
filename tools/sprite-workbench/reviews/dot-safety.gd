extends SceneTree
## WB-GUEST-WORKBENCH-SAFETY: additive adversarial evidence, not a backend fix.
## Run: godot --headless --path tools/sprite-workbench --script res://reviews/dot-safety.gd
## Every input is generated beneath a unique process-specific tool-data directory.
const Session := preload("res://session.gd")
const NAME := "test_creature"
var passed := 0
var failed := 0
var scratch := ""
var manifest := ""
var png := ""
var baseline: Dictionary = {}
var good_draft: Dictionary = {}
var source_hashes: Dictionary = {}

func _initialize() -> void:
    run.call_deferred()

func check(ok: bool, title: String) -> void:
    if ok:
        passed += 1
    else:
        failed += 1
        printerr("FAIL: " + title)

func write_json(path: String, data: Variant) -> void:
    var file := FileAccess.open(path, FileAccess.WRITE)
    assert(file != null, "Fixture creation failed")
    file.store_string(JSON.stringify(data))
    file.close()

func make_fixture() -> void:
    scratch = ProjectSettings.globalize_path("user://dot-safety-%d-%d" % [OS.get_process_id(), Time.get_ticks_usec()])
    assert(DirAccess.make_dir_recursive_absolute(scratch) == OK)
    png = scratch.path_join("source.png")
    manifest = scratch.path_join("source.json")
    var img := Image.create(16, 8, false, Image.FORMAT_RGBA8)
    for y in 8:
        for x in 16:
            img.set_pixel(x, y, Color(Session.GREEN[(x + y) % 16]) if (x + 2 * y) % 5 != 0 else Color.TRANSPARENT)
    assert(img.save_png(png) == OK)
    baseline = {NAME: {
        "file": "source.png", "sha256": FileAccess.get_sha256(png), "size": [16, 8],
        "palette": Session.GREEN.duplicate(), "height_m": 1.2,
        "provenance": {"kind": "synthetic-test", "revision": 7},
        "frames": [
            {"region": [0, 0, 8, 8], "anchor": [4.5, 6.25], "ink": [1, 1, 6, 6], "sample_step": 1.0},
            {"region": [8, 0, 8, 8], "anchor": [3, 7], "ink": [1, 1, 6, 6], "sample_step": 0.5}
        ]
    }}
    write_json(manifest, baseline)
    source_hashes = {manifest: FileAccess.get_sha256(manifest), png: FileAccess.get_sha256(png)}
    var seed := Session.new()
    assert(seed.load_manifest(manifest))
    seed.paint(NAME, 0, Vector2i(0, 0), 3)
    var draft := scratch.path_join("good.json")
    assert(seed.save_draft(draft))
    good_draft = seed.read_json(draft)

func working_session():
    var s := Session.new()
    assert(s.load_manifest(manifest))
    s.paint(NAME, 0, Vector2i(0, 0), 4)
    s.paint(NAME, 1, Vector2i(0, 0), 5)
    assert(s.undo()) # Both undo and redo are populated before failed-load probes.
    s.native_frame(NAME, 0) # Populate cache, too.
    return s

func state_of(s) -> Dictionary:
    var image_state := {}
    for key in s.images:
        image_state[key] = {"id": s.images[key].get_instance_id(), "bytes": s.images[key].get_data().hex_encode()}
    var cache_state := {}
    for key in s.cache:
        var frame: Dictionary = s.cache[key]
        cache_state[key] = {"bytes": frame.image.get_data().hex_encode(), "anchor": frame.anchor, "lo": frame.lo, "texture_id": frame.texture.get_instance_id()}
    return {
        "entries": s.entries.duplicate(true), "original": s.original.duplicate(true),
        "pixels": s.pixels.duplicate(true), "source": s.source_path, "hash": s.manifest_hash,
        "undo": s.undo_stack.duplicate(true), "redo": s.redo_stack.duplicate(true),
        "dirty": s.dirty, "images": image_state, "cache": cache_state
    }

func reject_draft(label: String, data: Dictionary) -> void:
    var path := scratch.path_join("bad-draft.json")
    write_json(path, data)
    var s = working_session()
    var before := state_of(s)
    var accepted: bool = s.load_draft(path)
    check(not accepted, label + ": rejected")
    check(state_of(s) == before, label + ": full state retained")
    check(not s.issue.is_empty(), label + ": actionable error")

func reject_manifest(label: String, data: Dictionary) -> void:
    var path := scratch.path_join("bad-manifest.json")
    write_json(path, data)
    var s = working_session()
    var before := state_of(s)
    var accepted: bool = s.load_manifest(path)
    check(not accepted, label + ": rejected")
    check(state_of(s) == before, label + ": full state retained")
    check(not s.issue.is_empty(), label + ": actionable error")

func override_cases() -> void:
    # Existing checks exercise valid edits and one future/geometry draft only.
    for key in ["missing:0", NAME + ":-1", NAME + ":2", NAME + ":0.5", NAME + ":0:1"]:
        var data := good_draft.duplicate(true)
        data.pixels = {key: {"0,0": 3}}
        reject_draft("frame key " + key, data)
    for coord in ["x,0", "0", "0,0,0", "0.5,0", "513,0", "0,-513"]:
        var data := good_draft.duplicate(true)
        data.pixels = {NAME + ":0": {coord: 3}}
        reject_draft("coordinate " + coord, data)
    for color in [-2, 16, 1.5, "3", null, true]:
        var data := good_draft.duplicate(true)
        data.pixels = {NAME + ":0": {"0,0": color}}
        reject_draft("color " + str(color) + " type " + str(typeof(color)), data)
    for edits in [[], 4, null]:
        var data := good_draft.duplicate(true)
        data.pixels = {NAME + ":0": edits}
        reject_draft("non-dictionary edit map " + str(edits), data)
    # Numerically valid but noncanonical keys would silently disappear at rendering.
    for key in [NAME + ":00", NAME + ":+0", NAME + ":-0"]:
        var data := good_draft.duplicate(true)
        data.pixels = {key: {"0,0": 3}}
        var path := scratch.path_join("alias-draft.json")
        write_json(path, data)
        var s := Session.new()
        var accepted := s.load_draft(path)
        var applied: bool = accepted and s.pixels.has(NAME + ":0") and s.native_frame(NAME, 0).image.get_pixelv(s.native_frame(NAME, 0).anchor) == s.palette(NAME)[3]
        check(not accepted or applied, "frame alias " + key + ": reject or normalize without dropping edit")
    for coord in ["00,0", "+0,0", "-0,0", "0,00"]:
        var data := good_draft.duplicate(true)
        data.pixels = {NAME + ":0": {coord: 3}}
        var path := scratch.path_join("alias-draft.json")
        write_json(path, data)
        var s := Session.new()
        var accepted := s.load_draft(path)
        var applied: bool = accepted and s.native_frame(NAME, 0).image.get_pixelv(s.native_frame(NAME, 0).anchor) == s.palette(NAME)[3]
        check(not accepted or applied, "coordinate alias " + coord + ": reject or normalize without dropping edit")

func geometry_cases() -> void:
    for region in [[0, 0, 0, 8], [-1, 0, 8, 8], [9, 0, 8, 8], [0, 0, 8.5, 8], [0, 0, 8], [0, 0, "8", 8]]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].region = region
        reject_manifest("region " + str(region), data)
    for anchor in [[-0.1, 1], [8.1, 1], [1, 8.1], [1], ["1", 1]]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].anchor = anchor
        reject_manifest("anchor " + str(anchor), data)
    for step in [0, -1, 0.24, 129, "1"]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].sample_step = step
        reject_manifest("sample step " + str(step), data)
    # Conversion to Rect2i must not wrap a huge JSON integer into valid bounds.
    for region in [[4294967296, 0, 8, 8], [0, 0, 4294967304, 8]]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].region = region
        reject_manifest("32-bit wrap region " + str(region), data)
    # No sample_step is the supported legacy format; malformed dependencies must reject cleanly.
    for field in ["region", "ink"]:
        var data := baseline.duplicate(true)
        data[NAME].frames[0].erase("sample_step")
        data[NAME].frames[0][field] = []
        reject_manifest("legacy default with empty " + field, data)

func identity_and_hash_cases() -> void:
    for field in ["palette", "height_m", "provenance"]:
        var data := good_draft.duplicate(true)
        if field == "palette": data.entries[NAME].palette[0] = "ffffff"
        elif field == "height_m": data.entries[NAME].height_m = 2.4
        else: data.entries[NAME].provenance.revision = 8
        reject_draft("immutable draft metadata " + field, data)
    var hash_draft := good_draft.duplicate(true)
    hash_draft.manifest_sha256 = "0".repeat(64)
    reject_draft("stale manifest digest", hash_draft)
    var hash_manifest := baseline.duplicate(true)
    hash_manifest[NAME].sha256 = "0".repeat(64)
    reject_manifest("stale PNG digest", hash_manifest)
    for rel in ["../source.png", "sub/../../source.png", "sub\\source.png", png]:
        var data := baseline.duplicate(true)
        data[NAME].file = rel
        reject_manifest("source path " + rel.get_file(), data)
    for rel in ["../source.json", "docs\\source.json"]:
        var data := good_draft.duplicate(true)
        data.source_manifest = rel
        reject_draft("draft manifest path " + rel, data)
    # Change only a new disposable copy. The immutable baseline stays byte-identical.
    var dir := scratch.path_join("changed-png")
    assert(DirAccess.make_dir_recursive_absolute(dir) == OK)
    assert(DirAccess.copy_absolute(png, dir.path_join("source.png")) == OK)
    var local_manifest := dir.path_join("source.json")
    write_json(local_manifest, baseline)
    var s := Session.new()
    assert(s.load_manifest(local_manifest))
    s.paint(NAME, 0, Vector2i(0, 0), 2)
    var changed := Image.load_from_file(dir.path_join("source.png"))
    changed.set_pixel(0, 0, Color.WHITE)
    assert(changed.save_png(dir.path_join("source.png")) == OK)
    var state := state_of(s)
    var draft := dir.path_join("stale-save.json")
    var saved := s.save_draft(draft)
    check(not saved, "PNG changed after open: draft save refuses stale source")
    check(state_of(s) == state, "PNG changed after open: edits stay dirty and state retained")
    check(not FileAccess.file_exists(draft), "PNG changed after open: no unusable draft written")
    check(s.export_atlas(NAME, dir) == "", "PNG changed after open: export refuses stale source")
    if saved:
        var reopened := Session.new()
        print("OBSERVED stale-PNG draft saved=true dirty=%s reload=%s issue=%s" % [str(s.dirty), str(reopened.load_draft(draft)), reopened.issue])

func roundtrip_cases() -> void:
    var s := Session.new()
    assert(s.load_manifest(manifest))
    assert(s.anchor(NAME, 0, 3.25, 5.75))
    s.paint(NAME, 0, Vector2i(0, 0), 3)
    s.paint(NAME, 1, Vector2i(0, 0), -1)
    var exported := s.export_atlas(NAME, scratch)
    check(not exported.is_empty(), "synthetic edited atlas exports")
    if exported.is_empty(): return
    var restored := Session.new()
    check(restored.load_manifest(exported.path_join("frames.json")), "export reimports")
    if restored.entries.is_empty(): return
    var meta: Dictionary = restored.entries[NAME]
    check(meta.sha256 == FileAccess.get_sha256(exported.path_join("atlas.png")), "export PNG hash exact")
    check(meta.source_sha256 == baseline[NAME].sha256, "original source hash retained")
    check(meta.palette == s.entries[NAME].palette and meta.provenance == s.entries[NAME].provenance and meta.height_m == s.entries[NAME].height_m, "creature metadata preserved")
    check(meta.frames.size() == 2, "frame count/order retained")
    for i in 2:
        var a: Dictionary = s.native_frame(NAME, i)
        var b: Dictionary = restored.native_frame(NAME, i)
        var offset: Vector2i = b.anchor - a.anchor
        check(Rect2i(Vector2i.ZERO, b.image.get_size()).encloses(Rect2i(offset, a.image.get_size())), "reimport contains entire native frame " + str(i))
        var equal := true
        for y in b.image.get_height():
            for x in b.image.get_width():
                var p := Vector2i(x, y) - offset
                var expected: Color = a.image.get_pixelv(p) if Rect2i(Vector2i.ZERO, a.image.get_size()).has_point(p) else Color(0, 0, 0, 0)
                if b.image.get_pixel(x, y) != expected: equal = false
        check(equal, "reimport native pixels/root/padding exact frame " + str(i))
        check(meta.frames[i].sample_step == 1 and meta.frames[i].anchor == meta.frames[0].anchor, "shared root and unit sampling frame " + str(i))
    var resumed := Session.new()
    check(resumed.load_draft(exported.path_join("edit-session.json")), "editable session reopens against originals")
    check(resumed.entries == s.entries and resumed.pixels == s.pixels, "editable metadata/overrides identical")
    var second := resumed.export_atlas(NAME, scratch)
    check(second != "" and second != exported, "repeat export uses unique folder")
    if second != "":
        check(FileAccess.get_sha256(second.path_join("atlas.png")) == FileAccess.get_sha256(exported.path_join("atlas.png")), "repeat PNG bytes identical")
        check(resumed.read_json(second.path_join("frames.json")) == s.read_json(exported.path_join("frames.json")), "repeat export metadata identical")

func export_boundary_cases() -> void:
    var dir := scratch.path_join("export-boundaries")
    assert(DirAccess.make_dir_recursive_absolute(dir) == OK)
    var wide := Image.create(509, 1, false, Image.FORMAT_RGBA8)
    wide.fill(Color(Session.GREEN[3]))
    var wide_png := dir.path_join("wide.png")
    assert(wide.save_png(wide_png) == OK)
    var data := baseline.duplicate(true)
    data[NAME].file = "wide.png"
    data[NAME].sha256 = FileAccess.get_sha256(wide_png)
    data[NAME].size = [509, 1]
    data[NAME].frames = [{"region": [0, 0, 509, 1], "anchor": [254, 1], "sample_step": 1}]
    var path := dir.path_join("wide.json")
    write_json(path, data)
    var s := Session.new()
    check(s.load_manifest(path), "509-pixel source is a supported input")
    var exported := s.export_atlas(NAME, dir)
    var reimport := Session.new()
    var opened := not exported.is_empty() and reimport.load_manifest(exported.path_join("frames.json"))
    check(exported.is_empty() or opened, "wide export: either refuse or produce reloadable measurements")
    if not exported.is_empty(): print("OBSERVED wide export size=", s.read_json(exported.path_join("frames.json"))[NAME].size, " reload=", opened, " issue=", reimport.issue)
    # A legal HTML colour may have alpha. An accepted input must still preserve its output.
    assert(DirAccess.copy_absolute(png, dir.path_join("source.png")) == OK)
    data = baseline.duplicate(true)
    data[NAME].palette[3] = "657b3180"
    path = dir.path_join("alpha.json")
    write_json(path, data)
    s = Session.new()
    var accepted := s.load_manifest(path)
    if not accepted:
        check(true, "alpha palette rejected at import")
        return
    s.paint(NAME, 0, Vector2i.ZERO, 3)
    var before: Dictionary = s.native_frame(NAME, 0)
    var color: Color = before.image.get_pixelv(before.anchor)
    check(color.a == 0 or color.a == 1, "accepted palette produces documented binary alpha")
    exported = s.export_atlas(NAME, dir)
    check(not exported.is_empty(), "alpha input export returns a folder")
    if exported.is_empty(): return
    reimport = Session.new()
    check(reimport.load_manifest(exported.path_join("frames.json")), "alpha export loads")
    if reimport.entries.is_empty(): return
    var after: Dictionary = reimport.native_frame(NAME, 0)
    check(after.image.get_pixelv(after.anchor) == color, "alpha export/reimport retains root pixel RGBA")
    print("OBSERVED alpha root before=", color, " after=", after.image.get_pixelv(after.anchor))

func source_sidecar_case() -> void:
    # Disposable mutable copies only. The immutable fixture and repository inputs are untouched.
    var dir := scratch.path_join("sidecar-collision")
    assert(DirAccess.make_dir_recursive_absolute(dir) == OK)
    assert(DirAccess.copy_absolute(png, dir.path_join("source.png")) == OK)
    var source := dir.path_join("target.json.tmp")
    write_json(source, baseline)
    var digest := FileAccess.get_sha256(source)
    var s := Session.new()
    check(s.load_manifest(source), "manifest with draft-sidecar filename loads")
    s.paint(NAME, 0, Vector2i.ZERO, 2)
    var state := state_of(s)
    var saved := s.save_draft(dir.path_join("target.json"))
    var preserved := FileAccess.file_exists(source) and FileAccess.get_sha256(source) == digest
    check(not saved or preserved, "draft save refuses source collision or uses safe staging")
    check(preserved, "active source manifest survives sidecar collision")
    check(saved or state_of(s) == state, "failed sidecar save keeps pending edit state")
    var reopened := Session.new()
    check(not saved or reopened.load_draft(dir.path_join("target.json")), "successful sidecar save remains reopenable")
    print("OBSERVED source-sidecar save=", saved, " source still exists=", FileAccess.file_exists(source), " dirty=", s.dirty)

func run() -> void:
    print("WB-GUEST-WORKBENCH-SAFETY; Godot " + Engine.get_version_info().string)
    make_fixture()
    override_cases()
    geometry_cases()
    identity_and_hash_cases()
    roundtrip_cases()
    export_boundary_cases()
    source_sidecar_case()
    for path in source_hashes:
        check(FileAccess.get_sha256(path) == source_hashes[path], "immutable synthetic input unchanged: " + str(path).get_file())
    print("dot safety checks: %d passed, %d failed." % [passed, failed])
    print("Disposable process-specific evidence: " + scratch)
    quit(1 if failed else 0)
