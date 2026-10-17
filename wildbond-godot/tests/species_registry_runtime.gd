extends RefCounted
## End-to-end data-boundary checks: real startup, real rules, actual save writer/loader.
static func run(host: Node, check: Callable) -> void:
	# Other regression groups create scenes too: isolate this real startup and restore their static Rules context.
	var previous_data: Dictionary = host.R.DATA
	var previous_registry: RefCounted = host.R.REGISTRY
	var main: Node = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	host.get_tree().root.add_child(main)
	main.register.keep = false
	main.set_process(false)
	var R = main.R
	check.call(R.REGISTRY != null and R.REGISTRY.size() == 189, "WB-REGISTRY runtime: startup registers the complete merged catalogue")
	check.call(R.REGISTRY.legacy_snapshot() == main.DATA, "WB-REGISTRY runtime: startup snapshot includes evolution overlays and prepared lessons")
	var original_data: Dictionary = main.DATA.duplicate(true)
	for id in main.DATA.SPECIES:
		check.call(R.REGISTRY.resolve(id) == "wildbond:" + id and R.species_key("wildbond:" + id) == id, "WB-REGISTRY runtime: %s resolves through the active registry" % id)
		for level in [5, 18, 36, 60]:
			var old_rng := RandomNumberGenerator.new()
			var qualified_rng := RandomNumberGenerator.new()
			old_rng.seed = 77001 + level
			qualified_rng.seed = old_rng.seed
			var old: Dictionary = R.make(id, level, {}, old_rng)
			var qualified: Dictionary = R.make("wildbond:" + id, level, {}, qualified_rng)
			check.call(qualified == old and qualified.sp == id and old_rng.state == qualified_rng.state, "WB-REGISTRY runtime: %s at %d preserves rolls, potential, traits, moves and serialized identity" % [id, level])
			var reference: Dictionary = qualified.duplicate(true)
			reference.sp = "wildbond:" + id
			check.call(R.sp(reference) == R.sp(old) and R.stats(reference) == R.stats(old), "WB-REGISTRY runtime: qualified %s lookup preserves all derived stats at %d" % [id, level])
	check.call(main.DATA == original_data, "WB-REGISTRY runtime: qualified construction never edits source data")
	# Content overrides must remain live: do not make existing combat read a stale snapshot.
	var saved_hp = main.DATA.SPECIES.bogsnap.base.hp
	main.DATA.SPECIES.bogsnap.base.hp = int(saved_hp) + 7
	check.call(R.sp({"sp": "bogsnap"}).base.hp == int(saved_hp) + 7 and R.sp({"sp": "wildbond:bogsnap"}).base.hp == int(saved_hp) + 7, "WB-REGISTRY runtime: both lookups honor current live content overrides")
	main.DATA.SPECIES.bogsnap.base.hp = saved_hp
	check.call(R.REGISTRY.species("bogsnap").base_stats.hp == int(saved_hp), "WB-REGISTRY runtime: live overrides never mutate the validated snapshot")
	# A failed startup-style rebuild cannot leave a previously accepted catalogue active.
	var saved_data: Dictionary = R.DATA
	R.DATA = {"SPECIES": {}, "MOVES": {}, "ELEMENTS": {}}
	var errors: Array = R.prepare_species_registry()
	check.call(not errors.is_empty() and R.REGISTRY.size() == 0, "WB-REGISTRY runtime: failed rebuild does not reuse another scene's registry")
	R.DATA = saved_data
	check.call(R.prepare_species_registry().is_empty() and R.REGISTRY.size() == 189, "WB-REGISTRY runtime: correct data rebuilds after rejection")
	# Replay a frozen v1 journey through its real loader and writer, using only a temporary save path.
	var returning: Node = load("res://scenes/main.tscn").instantiate()
	returning.no_save = true
	returning.settings.keep = false
	returning.show_howto = false
	main.get_tree().root.add_child(returning)
	returning.register.keep = false
	var raw: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/fixtures/evo1-retired-forms.json"))
	var expected: Dictionary = returning.migrate_save(raw)
	var path := "user://wb-registry-runtime-check.json"
	returning.save_path = path
	var Safe = returning.SafeSave
	Safe.remove(path)
	Safe.write(path, raw)
	check.call(returning._load_game(), "WB-REGISTRY runtime: frozen v1 journey loads with the active registry")
	returning.lines.clear()
	returning.trans_t = -1.0
	returning.no_save = false
	check.call(returning.save_game(), "WB-REGISTRY runtime: loaded journey saves through the unchanged writer")
	var saved: Dictionary = Safe.read(path)
	check.call(saved.get("v") == 2 and saved.team == expected.team and saved.ranch == expected.ranch and saved.egg == expected.egg, "WB-REGISTRY runtime: migration/save preserves team, ranch, egg, names, genes, raising and holds")
	check.call(saved.seen == expected.seen and saved.bonded == expected.bonded and saved.badges == expected.badges and saved.story == expected.story, "WB-REGISTRY runtime: existing collection and journey flags survive")
	check.call(saved.team.all(func(c): return not str(c.sp).contains(":")), "WB-REGISTRY runtime: writer keeps legacy species IDs, with no schema bump")
	returning.no_save = true
	Safe.remove(path)
	returning.free()
	main.free()
	R.DATA = previous_data
	R.REGISTRY = previous_registry
