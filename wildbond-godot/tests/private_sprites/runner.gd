extends SceneTree
const Pack := preload("res://tests/private_sprites/pack.gd")
const Clearing := preload("res://tests/private_sprites/clearing.gd")
var passed := 0
var failed := 0
var time := 0.0

func _initialize() -> void:
	run.call_deferred()

func _process(dt: float) -> bool:
	time += dt
	if time > 30: quit(3)
	return false

func check(ok: bool, label: String) -> void:
	if ok: passed += 1
	else:
		failed += 1
		print("FAIL: ", label)

func run() -> void:
	preload("res://tests/private_sprites/checks.gd").run(check)
	var scene := Clearing.new()
	scene.pack_path = Pack.configured_root() if "--private" in OS.get_cmdline_user_args() else "Z:/not-installed"
	root.add_child(scene)
	await process_frame
	check(scene.active and scene.battle == null, "clearing starts in exploration")
	check(scene.player.position == Vector3(0, 0, 5), "player starts on the trail")
	check(scene.pack.entries.size() == 3 if "--private" in OS.get_cmdline_user_args() else scene.pack.entries.is_empty(), "optional pack state matches launch")
	var before := scene.player.position
	scene.move_player(Vector2.RIGHT, 0.2)
	check(scene.player.position.x > before.x, "world movement advances player")
	scene.move_player(Vector2.LEFT, 0.2)
	check(scene.player.position.is_equal_approx(before), "movement returns to starting point")
	scene.move_player(Vector2(100, 100), 0.01)
	check(scene.player.position.distance_to(before) < 0.04, "diagonal/digital movement is normalized")
	scene.player.position = Vector3(0, 0, 5)
	scene.enter_battle()
	check(scene.battle == null and scene.active, "distant encounter cannot open battle")
	scene.player.position = Vector3(1, 0, 2)
	var original := scene.player.position
	for number in ["pokemon:16", "pokemon:37", "pokemon:194"]:
		scene.selected = number
		scene._refresh_creature()
		scene.enter_battle()
		await process_frame
		check(not scene.active and scene.battle != null, "near encounter opens turn-based battle")
		scene.battle.sounds.on = false
		check(scene.battle.model.foe.id == number if scene.pack.entries.has(number) else scene.battle.model.foe.id == "cindercub", "battle uses actual selected import or original fallback")
		scene.battle._act({"kind": "run"})
		while not scene.battle.event.is_empty(): scene.battle._continue()
		check(scene.battle.model.result == "escaped", "existing Run rules resolve")
		scene.battle.return_to_world.emit(scene.battle.model.result)
		await process_frame
		check(scene.active and scene.battle == null and scene.player.position == original, "battle return restores world position")
	for expected in ["won", "caught"]:
		scene.enter_battle()
		await process_frame
		scene.battle.sounds.on = false
		scene.battle.model.foe.hp = 1
		if expected == "caught":
			scene.battle.model.foe.status = "sleep"
			scene.battle.model.rng.seed = 3 # Includes the model's opponent-choice draw; reproducible successful catch.
		scene.battle._act({"kind": "catch"} if expected == "caught" else {"kind": "move", "id": "bubbleJet"})
		while not scene.battle.event.is_empty(): scene.battle._continue()
		check(scene.battle.model.result == expected, "weakened fixture reaches actual " + expected + " outcome")
		scene.battle.return_to_world.emit(scene.battle.model.result)
		await process_frame
		check(scene.player.position == original and scene.active, expected + " returns to the same world position")
	scene.set_night(true)
	scene.set_rain(true)
	check(scene.night and scene.rainy and scene.rain_nodes[0].visible, "night/rain controls affect world")
	if not scene.pack.entries.is_empty():
		for sid in scene.pack.entries:
			for state in ["Idle", "Walk"]:
				for row in 8:
					for t in [0.0, 0.11, 1.23]:
						var f: Dictionary = scene.pack.world_frame(sid, state, row, t)
						check(Rect2(Vector2.ZERO, f.texture.get_size()).encloses(f.region), "real frame stays inside atlas")
						check(f.direction == row and f.anchor.x >= 0 and f.anchor.y >= 0, "real directional anchor stays valid")
	scene.Art.cache.clear()
	scene.battle = null
	scene.queue_free()
	await process_frame
	await process_frame
	print("Private sprites/clearing checks: %d passed, %d failed" % [passed, failed])
	quit(1 if failed else 0)

