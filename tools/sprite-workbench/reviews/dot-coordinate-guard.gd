extends "res://reviews/dot-safety.gd"
## WB-GUEST-COORD-GUARD: standalone boundary regression; inherited probe is unchanged.
## Run: godot --headless --path tools/sprite-workbench --script res://reviews/dot-coordinate-guard.gd
## Only disposable synthetic fixtures beneath the inherited unique scratch directory.

func pending_session():
    var s := Session.new()
    assert(s.load_manifest(manifest))
    assert(s.anchor(NAME, 0, 4.0, 6.0))
    s.paint(NAME, 0, Vector2i(-1, -1), 4)
    s.paint(NAME, 1, Vector2i(0, 0), 5)
    assert(s.undo())
    s.native_frame(NAME, 0)
    s.native_frame(NAME, 1)
    return s

func complete_state(s) -> Dictionary:
    # issue is intentionally excluded: refusal must replace it with an explanation.
    # All other session fields are captured by state_of; also pin cache resources.
    var state := state_of(s)
    var resources := {}
    for key in s.cache:
        var frame: Dictionary = s.cache[key]
        resources[key] = {
            "image_id": frame.image.get_instance_id(),
            "texture_bytes": frame.texture.get_image().get_data().hex_encode()
        }
    state["cache_resources"] = resources
    return state

func refused_on(s, coord: String, color: int, label: String) -> void:
    var data := good_draft.duplicate(true)
    # Valid edits before and after the malformed key must not be partially adopted.
    data.entries[NAME].frames[0].anchor = [2, 3]
    data.pixels = {NAME + ":0": {"1,1": 2, coord: color}, NAME + ":1": {"-1,-1": 7}}
    var path := scratch.path_join("rejected-coordinate.json")
    write_json(path, data)
    s.issue = "Previous diagnostic"
    var before := complete_state(s)
    var accepted: bool = s.load_draft(path)
    check(not accepted, label + ": rejected")
    check(complete_state(s) == before, label + ": entire pending state retained")
    check(s.issue == "Invalid draft pixel.", label + ": coordinate error explains refusal")

func rejection_cases() -> void:
    var values := [
        "-9223372036854775808", "-9223372036854775807",
        "9223372036854775807", "9223372036854775806",
        "-9223372036854775809", "9223372036854775808",
        "-18446744073709551616", "18446744073709551616",
        "-4294967296", "4294967296", "-2147483648", "2147483648",
        "-513", "513"
    ]
    # Reuse each session across repeated failures, with valid data in both frames.
    for dirty_state in [true, false]:
        var s = pending_session()
        if not dirty_state:
            assert(s.save_draft(scratch.path_join("pending-clean.json")))
        check(s.dirty == dirty_state and not s.undo_stack.is_empty() and not s.redo_stack.is_empty() and s.cache.size() == 2,
            "rejection precondition: populated " + ("dirty" if dirty_state else "clean") + " session")
        for value in values:
            for coord in [value + ",0", "0," + value, value + "," + value]:
                refused_on(s, coord, 3, coord + (" dirty" if dirty_state else " clean"))
        for coord in ["-9223372036854775808,0", "0,-9223372036854775808"]:
            refused_on(s, coord, -1, coord + ": erase")
        for coord in ["-0,0", "0,-0", "+0,0", "0,+0", "00,0", "0,00", "-01,0", "0,-01", " 1,0", "0,1 ", "0.0,0", "0,0.0", "x,0", "0", "0,0,0"]:
            refused_on(s, coord, 3, "noncanonical " + coord)

func accepted_cases() -> void:
    var edits := {}
    # Existing inclusive limits remain valid, including all corners and negatives.
    for x in [-512, -511, -1, 0, 1, 511, 512]:
        for y in [-512, -511, -1, 0, 1, 511, 512]:
            edits["%d,%d" % [x, y]] = 3
    edits["-2,-2"] = -1
    var data := good_draft.duplicate(true)
    data.pixels = {NAME + ":0": edits, NAME + ":1": {"-1,-1": 6}}
    var path := scratch.path_join("accepted-coordinates.json")
    write_json(path, data)
    var s = pending_session()
    check(s.load_draft(path), "canonical signed boundary grid accepted")
    if s.pixels != data.pixels:
        check(false, "all canonical coordinate keys retained exactly")
        return
    check(true, "all canonical coordinate keys retained exactly")
    check(not s.dirty and s.issue.is_empty() and s.undo_stack.is_empty() and s.redo_stack.is_empty() and s.cache.is_empty(),
        "successful load keeps existing clean-session semantics")
    var frame: Dictionary = s.native_frame(NAME, 0)
    for point in [Vector2i(-1, -1), Vector2i(-1, 0), Vector2i(0, -1), Vector2i.ZERO, Vector2i.ONE]:
        check(frame.image.get_pixelv(point - frame.lo) == s.palette(NAME)[3], "visible signed coordinate rendered: " + str(point))
    check(frame.image.get_pixelv(Vector2i(-2, -2) - frame.lo).a == 0, "canonical negative erase rendered")
    var other: Dictionary = s.native_frame(NAME, 1)
    check(other.image.get_pixelv(Vector2i(-1, -1) - other.lo) == s.palette(NAME)[6], "second frame negative coordinate rendered")
    var saved := scratch.path_join("canonical-roundtrip.json")
    check(s.save_draft(saved), "canonical signed coordinates save")
    var reopened := Session.new()
    check(reopened.load_draft(saved), "canonical signed coordinates reopen")
    check(reopened.pixels == s.pixels, "all signed boundary and erase keys survive round trip")
    var after: Dictionary = reopened.native_frame(NAME, 0)
    check(after.image.get_data() == frame.image.get_data() and after.anchor == frame.anchor and after.lo == frame.lo,
        "visible negative paint and erase survive round trip exactly")

func run() -> void:
    print("WB-GUEST-COORD-GUARD; Godot " + Engine.get_version_info().string)
    make_fixture()
    rejection_cases()
    accepted_cases()
    for path in source_hashes:
        check(FileAccess.get_sha256(path) == source_hashes[path], "immutable synthetic source unchanged: " + str(path).get_file())
    print("dot coordinate guard: %d passed, %d failed." % [passed, failed])
    print("Disposable process-specific evidence: " + scratch)
    quit(1 if failed else 0)
