extends RefCounted
const Pack := preload("res://tests/private_sprites/pack.gd")

static func run(check: Callable) -> void:
	var pack := Pack.new()
	check.call(not pack.open_pack(""), "absent pack cleanly falls back")
	check.call(pack.entries.is_empty() and pack.textures.is_empty(), "failed open clears entries and textures")
	check.call(pack.battle_frame("pokemon:16", false).is_empty(), "missing imported battle view has no false art")
	check.call(pack.world_frame("pokemon:16", "Idle", 0, 0).is_empty(), "missing imported animation has no false frame")
	var folder := "user://private-sprite-checks"
	DirAccess.make_dir_recursive_absolute(folder)
	var path := ProjectSettings.globalize_path(folder)
	var image := Image.create(2, 16, false, Image.FORMAT_RGBA8)
	image.fill(Color.GREEN)
	image.save_png(folder.path_join("fixture.png"))
	var art := {"file": "fixture.png", "image": {"width": 2, "height": 16, "ink": [0, 0, 2, 16]}}
	var anchors := []
	for row in 8: anchors.append([[1, 1]])
	var anim := {"file": "fixture.png", "frame_size": [2, 2], "directions": 8,
		"durations": [0.1], "anchors": anchors}
	var manifest := {"schema": 1, "files": [{"file": "fixture.png", "sha256": FileAccess.get_sha256(folder.path_join("fixture.png"))}],
		"species": {"pokemon:16": {"name": "Fixture Bird", "battle": {"front": art, "back": art}, "animations": {"Idle": anim}}}}
	_write(folder, manifest)
	check.call(pack.open_pack(path), "valid external pack loads")
	check.call(pack.entries.size() == 1, "only private namespace was loaded")
	for row in 8:
		var frame: Dictionary = pack.world_frame("pokemon:16", "Idle", row, 0.0)
		check.call(frame.region == Rect2(0, row * 2, 2, 2), "direction chooses the matching atlas row")
		check.call(frame.anchor == Vector2(1, 1), "source foot anchor is retained")
	check.call(pack.world_frame("pokemon:16", "Walk", 0, 0).is_empty(), "unavailable animation has a safe fallback")
	check.call(not pack.open_pack(path.path_join("missing")), "missing replacement pack rejected")
	check.call(pack.entries.is_empty() and pack.textures.is_empty(), "replacement failure cannot retain stale imported art")
	var bad: Dictionary
	bad = manifest.duplicate(true)
	bad.files[0].file = "../fixture.png"
	_write(folder, bad)
	check.call(not pack.open_pack(path), "traversal path rejected")
	bad = manifest.duplicate(true)
	bad.files[0].sha256 = "wrong"
	_write(folder, bad)
	check.call(not pack.open_pack(path), "tampered private file rejected")
	bad = manifest.duplicate(true)
	bad.species["wildbond:bogsnap"] = bad.species["pokemon:16"]
	_write(folder, bad)
	check.call(not pack.open_pack(path), "pack cannot replace original Wildbond namespace")
	bad = manifest.duplicate(true)
	bad.species["pokemon:16"].animations.Idle.durations = [0]
	_write(folder, bad)
	check.call(not pack.open_pack(path), "zero-duration animation rejected")
	bad = manifest.duplicate(true)
	bad.species["pokemon:16"].animations.Idle.anchors[0][0] = [99, 99]
	_write(folder, bad)
	check.call(not pack.open_pack(path), "outside-frame anchor rejected")
	bad = manifest.duplicate(true)
	bad.species["pokemon:16"].battle.front.image.ink = [0, 0, 8, 99]
	_write(folder, bad)
	check.call(not pack.open_pack(path), "cropping outside source texture rejected")
	bad = manifest.duplicate(true)
	bad.species["pokemon:16"].animations.Idle.frame_size[0] = "invalid"
	_write(folder, bad)
	check.call(not pack.open_pack(path), "wrong-type frame dimensions rejected without crashing")
	bad = manifest.duplicate(true)
	bad.species["pokemon:16"].battle.front.image.ink[0] = "invalid"
	_write(folder, bad)
	check.call(not pack.open_pack(path), "wrong-type source bounds rejected without crashing")
	# Tiny fixture files are test-owned; do not touch external packs or journeys.
	DirAccess.remove_absolute(path.path_join("manifest.json"))
	DirAccess.remove_absolute(path.path_join("fixture.png"))
	DirAccess.remove_absolute(path)

static func _write(folder: String, value: Dictionary) -> void:
	var file := FileAccess.open(folder.path_join("manifest.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(value))
