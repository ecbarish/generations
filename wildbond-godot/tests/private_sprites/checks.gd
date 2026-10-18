extends RefCounted
const Pack := preload("res://tests/private_sprites/pack.gd")

static func run(check: Callable) -> void:
	var motion := preload("res://tests/private_sprites/actor_motion.gd").new()
	for i in 8:
		var intent := Vector2(sin(i * PI / 4), cos(i * PI / 4))
		motion.advance(intent, Vector3(intent.x, 0, intent.y) * 0.05, false)
		check.call(motion.direction8 == i, "companion retains all eight movement directions")
	motion.advance(Vector2.UP, Vector3(0, 0, -0.5), false)
	check.call(motion.face == Vector2i.UP and motion.moving, "movement faces toward actual travel")
	motion.advance(Vector2.ZERO, Vector3.ZERO, false)
	check.call(not motion.moving and motion.face == Vector2i.UP and motion.trainer_frame() == 1, "release keeps facing in an idle pose")
	motion.advance(Vector2.LEFT, Vector3.ZERO, true)
	check.call(motion.face == Vector2i.LEFT and not motion.moving and not motion.running, "wall can turn actor but cannot cycle walking feet")
	motion.advance(Vector2(0.01, 0), Vector3(0.02, 0, 0), false)
	check.call(motion.face == Vector2i.RIGHT, "small companion displacements retain a real direction")
	var slow := preload("res://tests/private_sprites/actor_motion.gd").new()
	var fast := preload("res://tests/private_sprites/actor_motion.gd").new()
	for i in 30: slow.advance(Vector2.DOWN, Vector3(0, 0, 3.0 / 30), false)
	for i in 120: fast.advance(Vector2.DOWN, Vector3(0, 0, 3.0 / 120), false)
	check.call(slow.phase() == fast.phase(), "same travelled distance gives the same gait at different frame rates")
	var interrupted := preload("res://tests/private_sprites/actor_motion.gd").new()
	for i in 12:
		interrupted.advance(Vector2.DOWN, Vector3(0, 0, 0.05), false)
		interrupted.advance(Vector2.ZERO, Vector3.ZERO, false)
	interrupted.advance(Vector2.DOWN, Vector3(0, 0, 0.01), false)
	check.call(interrupted.phase() == 2, "brief follower stops cannot repeatedly restart the first walking pose")
	var rounds := preload("res://tests/battle_slice/fixture.gd").create()
	var stock: int = rounds.berries
	check.call(rounds.validate({"kind": "berry", "target": 1}) != "" and rounds.berries == stock, "full-health target rejects item without consumption")
	for bad in [-1, 99, "one", true]:
		check.call(rounds.validate({"kind": "berry", "target": bad}) != "", "invalid medicine target rejected")
	rounds.team[1].hp = 0
	check.call(rounds.validate({"kind": "berry", "target": 1}) != "", "berry cannot revive a fainted partner")
	rounds.team[1].hp = 1
	var active_hp: int = rounds.team[0].hp
	check.call(rounds.submit({"kind": "berry", "target": 1}) == "", "berry may target another party member")
	rounds.advance()
	check.call(rounds.team[1].hp > 1 and rounds.team[0].hp == active_hp and rounds.berries == stock - 1, "healing applies to selected partner and consumes one item before foe turn")
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
	var bad_world := manifest.duplicate(true)
	bad_world.world = {"atlas": "fixture.png", "tree": "fixture.png", "metatiles": 512, "tile_size": 16}
	_write(folder, bad_world)
	check.call(not pack.open_pack(path) and pack.world == null, "invalid world atlas rejects and clears terrain")
	_write(folder, manifest)
	pack.open_pack(path)
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
	var npc_image := Image.create(144,16,false,Image.FORMAT_RGBA8)
	npc_image.fill(Color.MAGENTA)
	var npc_anchors := [];var npc_ink := []
	for frame in 9:
		npc_image.fill_rect(Rect2i(frame*16+4,2,8,10),Color("579760"))
		npc_anchors.append([8,12]);npc_ink.append([4,2,12,12])
	npc_image.save_png(folder.path_join("npc.png"))
	var npc_manifest := manifest.duplicate(true)
	npc_manifest.files.append({"file":"npc.png","sha256":FileAccess.get_sha256(folder.path_join("npc.png"))})
	npc_manifest.npcs={"child":{"file":"npc.png","frame_size":[16,16],"source_frames":9,"frame_map":[0,1,2,3,4,5,6,7,8],"anchors":npc_anchors,"ink":npc_ink,"walks":true,"bow_frame":null,"pixel_size":0.063}}
	_write(folder,npc_manifest)
	check.call(pack.open_pack(path) and pack.npcs.size()==1,"optional NPC metadata loads from an ordinary JSON manifest")
	var npc_frame := pack.npc_frame("child",8,true)
	check.call(npc_frame.region==Rect2(128,0,16,16) and npc_frame.anchor==Vector2(8,12) and npc_frame.flip,"NPC source frame, facing and measured ground anchor retained")
	check.call(npc_frame.texture.get_image().get_pixel(0,0).a==0,"NPC editor colour key is transparent in memory")
	for field in ["source_frames","frame_map","anchors","ink","pixel_size","frame_size","file","walks"]:
		bad=npc_manifest.duplicate(true)
		match field:
			"source_frames": bad.npcs.child.source_frames=4.5
			"frame_map": bad.npcs.child.frame_map[0]=99
			"anchors": bad.npcs.child.anchors[0]=[8,99]
			"ink": bad.npcs.child.ink[0]=[0,0,16,16]
			"pixel_size": bad.npcs.child.pixel_size="large"
			"frame_size": bad.npcs.child.frame_size=[16,"tall"]
			"file": bad.npcs.child.file="../outside.png"
			"walks": bad.npcs.child.walks="yes"
		_write(folder,bad)
		check.call(not pack.open_pack(path) and pack.npcs.is_empty() and pack.world_pixel_sizes.is_empty(),"malformed NPC "+field+" rejects atomically")
	bad=npc_manifest.duplicate(true);bad.npcs.child.bow_frame=88
	_write(folder,bad)
	check.call(not pack.open_pack(path),"outside-sheet NPC bow pose rejected")
	bad=manifest.duplicate(true);bad.species["pokemon:16"].display_height_m="giant"
	_write(folder,bad)
	check.call(not pack.open_pack(path),"invalid creature presentation scale rejected")
	_write(folder,manifest)
	check.call(pack.open_pack(path) and pack.npcs.is_empty(),"older creature packs without NPC metadata remain valid")
	DirAccess.remove_absolute(path.path_join("npc.png"))
	# Tiny fixture files are test-owned; do not touch external packs or journeys.
	DirAccess.remove_absolute(path.path_join("manifest.json"))
	DirAccess.remove_absolute(path.path_join("fixture.png"))
	DirAccess.remove_absolute(path)

static func _write(folder: String, value: Dictionary) -> void:
	var file := FileAccess.open(folder.path_join("manifest.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(value))
