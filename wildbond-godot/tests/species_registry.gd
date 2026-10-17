extends RefCounted
const Registry := preload("res://tests/support/species_registry.gd")

static func run(main: Node, check: Callable) -> void:
	var before: Dictionary = main.DATA.duplicate(true)
	var registry := Registry.new()
	var errors := registry.load_legacy(main.DATA)
	check.call(errors.is_empty(), "WB-REGISTRY: all runtime definitions validate: %s" % str(errors))
	check.call(registry.size() == 189, "WB-REGISTRY: all 189 merged species are retained")
	check.call(main.DATA == before and registry.legacy_snapshot() == before, "WB-REGISTRY: normalization never edits game data")
	if not errors.is_empty(): return
	for id in main.DATA.SPECIES:
		var original: Dictionary = main.DATA.SPECIES[id]
		var normalized := registry.species(id)
		check.call(registry.resolve(id) == "wildbond:" + id and registry.species("wildbond:" + id) == normalized, "WB-REGISTRY: old and qualified identity agree for %s" % id)
		check.call(normalized.name == original.name and normalized.description == original.get("dex", ""), "WB-REGISTRY: %s keeps its name and writing" % id)
		check.call(normalized.base_stats == {"hp": int(original.base.hp), "attack": int(original.base.pow), "defense": int(original.base.grd), "speed": int(original.base.spd), "special_attack": int(original.base.wit), "special_defense": int(original.base.spi)}, "WB-REGISTRY: %s keeps all six stats as whole numbers after JSON loading" % id)
		check.call(normalized.profiles["wildbond-legacy"].types == [original.el], "WB-REGISTRY: %s keeps its original element" % id)
		check.call(normalized.learnset.size() == original.learn.size(), "WB-REGISTRY: %s loses no lessons" % id)
		for index in original.learn.size():
			var lesson: Dictionary = normalized.learnset[index]
			check.call(lesson.level == original.learn[index][0] and registry.move(lesson.move_id).name == main.DATA.MOVES[original.learn[index][1]].name, "WB-REGISTRY: %s lesson %d keeps its level and move identity" % [id, index])
	for id in main.DATA.MOVES:
		check.call(registry.move("wildbond:" + id).accuracy == 1.0, "WB-REGISTRY: %s keeps legacy always-hit behavior" % id)
	var bogsnap := registry.species("bogsnap")
	check.call(bogsnap.evolutions[0].to == "wildbond:stillmaw" and bogsnap.evolutions[0].conditions == {"level": 18, "bond_stage": 1}, "WB-REGISTRY: Bogsnap retains its existing level-and-bond evolution: %s" % str(bogsnap.evolutions[0]))
	for id in main.DATA.SPECIES:
		var existing: Array = main.R.evo_options({"sp": id})
		var normalized: Array = registry.species(id).evolutions
		check.call(normalized.size() == existing.size(), "WB-REGISTRY: %s keeps every evolution branch" % id)
		for index in existing.size():
			var condition: Dictionary = normalized[index].conditions
			var source: Dictionary = existing[index]
			check.call(normalized[index].to == "wildbond:" + source.to and condition.get("level") == source.get("at"), "WB-REGISTRY: %s keeps its target and level" % id)
			for key in ["place", "time", "weather", "ate", "raised", "raised_at"]:
				check.call(condition.has(key) == source.has(key) and condition.get(key) == source.get(key), "WB-REGISTRY: %s retains %s requirements" % [id, key])
			check.call(condition.get("bond_stage") == source.get("bond"), "WB-REGISTRY: %s retains its trust requirement" % id)
			if source.has("with"):
				check.call(condition.with_species == "wildbond:" + source["with"], "WB-REGISTRY: %s retains its companion requirement" % id)
	# Query results and input dictionaries must never grant mutable access to the accepted registry.
	bogsnap.base_stats.hp = 9999
	var snapshot := registry.legacy_snapshot()
	snapshot.SPECIES.bogsnap.base.hp = 9999
	var changed_move := registry.move("wildbond:bite")
	changed_move.accuracy = 0.0
	check.call(registry.species("bogsnap").base_stats.hp == 58 and registry.move("wildbond:bite").accuracy == 1.0 and main.DATA == before, "WB-REGISTRY: queries return detached copies")
	check.call(registry.species("missing").is_empty() and registry.resolve("missing") == "" and registry.move("missing").is_empty(), "WB-REGISTRY: unknown IDs fail safely")
	# A real v1 migration remains usable through bare aliases; no save mutation or new save fields.
	var raw: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/fixtures/evo1-retired-forms.json"))
	var untouched: Dictionary = raw.duplicate(true)
	var migrated: Dictionary = main.migrate_save(raw)
	check.call(not migrated.is_empty() and raw == untouched, "WB-REGISTRY: old-save migration remains non-destructive")
	for creature in migrated.get("team", []) + migrated.get("ranch", []):
		check.call(not registry.species(str(creature.sp)).is_empty(), "WB-REGISTRY: migrated creature %s resolves without changing its save ID" % creature.sp)
	# Two species may share a display name but must never share identity. These are synthetic data, not copied Pokémon.
	var pack := fixture_pack()
	var input_bytes := var_to_bytes(pack)
	var added := registry.add_pack(pack)
	check.call(added.is_empty() and registry.size() == 191, "WB-REGISTRY: two additional species and forward evolution references commit together: %s" % str(added))
	check.call(var_to_bytes(pack) == input_bytes, "WB-REGISTRY: successful validation does not normalize caller-owned data in place")
	check.call(registry.resolve("fixture-first") == "prototype:first" and registry.species("prototype:first").name == "Bogsnap" and registry.species("bogsnap").id == "wildbond:bogsnap", "WB-REGISTRY: same display name never overwrites an original")
	check.call(registry.species("prototype:first").profiles["prototype-round"].types == ["plant", "toxin"], "WB-REGISTRY: imported data can describe dual types without changing legacy types")
	check.call(registry.move("prototype:tap").accuracy == 1.0 and registry.move("prototype:mist").accuracy == 0.75, "WB-REGISTRY: missing accuracy defaults and explicit accuracy survives")
	pack.species[0].name = "Changed by caller"
	pack.profiles["prototype-round"].append("unexpected")
	check.call(registry.species("prototype:first").name == "Bogsnap", "WB-REGISTRY: accepted pack owns its data")
	var accepted: Array = registry.ids()
	var accepted_first := registry.species("prototype:first")
	var failures: Array = []
	var bad := fixture_pack(); bad.species[0].legacy_ids = ["bogsnap"]; failures.append(["alias collision", bad])
	bad = fixture_pack(); bad.species[0].id = "wildbond:bogsnap"; failures.append(["species collision", bad])
	bad = fixture_pack(); bad.moves["wildbond:bite"] = {"name": "Replacement"}; failures.append(["move collision", bad])
	bad = fixture_pack(); bad.profiles["wildbond-legacy"] = ["different"]; failures.append(["profile collision", bad])
	bad = fixture_pack(); bad.species[1].legacy_ids = ["fixture-first"]; failures.append(["duplicate pack alias", bad])
	bad = fixture_pack(); bad.species.append(bad.species[0].duplicate(true)); failures.append(["duplicate pack ID", bad])
	bad = fixture_pack(); bad.species[0].base_stats.hp = NAN; failures.append(["NaN stat", bad])
	bad = fixture_pack(); bad.species[0].base_stats.speed = INF; failures.append(["infinite stat", bad])
	bad = fixture_pack(); bad.species[0].base_stats.attack = -1; failures.append(["negative stat", bad])
	bad = fixture_pack(); bad.species[0].base_stats.hp = 1.5; failures.append(["fractional stat", bad])
	bad = fixture_pack(); bad.species[0].base_stats.erase("defense"); failures.append(["missing stat", bad])
	bad = fixture_pack(); bad.species[0].learnset[0].move_id = "prototype:absent"; failures.append(["missing move", bad])
	bad = fixture_pack(); bad.species[0].learnset[0].level = 0; failures.append(["invalid lesson level", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].to = "prototype:absent"; failures.append(["missing evolution", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].conditions = {}; failures.append(["missing evolution level", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].conditions.bond_stage = 5; failures.append(["invalid trust stage", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].conditions.with_species = "prototype:absent"; failures.append(["missing companion", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].conditions.unimplemented = true; failures.append(["unknown evolution condition", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].conditions.raised = "absent"; failures.append(["unknown raising track", bad])
	bad = fixture_pack(); bad.species[1].evolutions = [{"to": "prototype:first", "conditions": {"level": 30}}]; failures.append(["evolution cycle", bad])
	bad = fixture_pack(); bad.species[0].evolutions[0].to = "prototype:first"; failures.append(["self evolution", bad])
	bad = fixture_pack(); bad.moves["prototype:mist"].accuracy = 1.1; failures.append(["invalid accuracy", bad])
	bad = fixture_pack(); bad.species[0].profiles["prototype-round"].types = ["unknown"]; failures.append(["unknown type", bad])
	bad = fixture_pack(); bad.species[0].profiles["prototype-round"].types = ["plant", "plant"]; failures.append(["duplicate type", bad])
	bad = fixture_pack(); bad.species[0].profiles["prototype-round"].ability_ids = ["prototype:absent"]; failures.append(["unknown ability", bad])
	bad = fixture_pack(); bad.species[0].legacy_ids = "wrong"; failures.append(["malformed aliases", bad])
	bad = fixture_pack(); bad.species[0].profiles = []; failures.append(["malformed profiles", bad])
	bad = fixture_pack(); bad.species[0].learnset = [null]; failures.append(["malformed lesson", bad])
	bad = fixture_pack(); bad.species[0].evolutions = [null]; failures.append(["malformed evolution", bad])
	bad = fixture_pack(); bad.species[0].id = "unqualified"; failures.append(["unqualified ID", bad])
	bad = fixture_pack(); bad.species[0].name = " "; failures.append(["empty name", bad])
	bad = fixture_pack(); bad.species[0].base_stats = null; failures.append(["malformed stats", bad])
	bad = fixture_pack(); bad.species[0].profiles = {"absent": {"types": ["plant"]}}; failures.append(["unknown profile", bad])
	bad = fixture_pack(); bad.moves["prototype:tap"] = null; failures.append(["malformed move", bad])
	bad = fixture_pack(); bad.profiles["prototype-round"] = "wrong"; failures.append(["malformed type list", bad])
	bad = fixture_pack(); bad.species[0].profiles["prototype-round"].ability_ids = null; failures.append(["malformed ability list", bad])
	bad = fixture_pack(); bad.schema_version = 2; failures.append(["future schema", bad])
	bad = fixture_pack(); bad.species = []; failures.append(["empty pack", bad])
	# Validate malformed packs in fresh registries: existing successful-pack IDs must not mask deeper errors.
	for case in failures:
		var isolated := Registry.new()
		isolated.load_legacy(main.DATA)
		var failure_input := var_to_bytes(case[1])
		var result := isolated.add_pack(case[1])
		check.call(not result.is_empty() and isolated.size() == 189 and isolated.resolve("fixture-first") == "" and isolated.move("prototype:tap").is_empty(), "WB-REGISTRY: %s is rejected atomically: %s" % [case[0], str(result)])
		check.call(isolated.legacy_snapshot() == before, "WB-REGISTRY: %s leaves the old catalogue untouched" % case[0])
		check.call(var_to_bytes(case[1]) == failure_input, "WB-REGISTRY: %s leaves caller-owned pack data untouched" % case[0])
	check.call(not registry.add_pack(fixture_pack()).is_empty() and registry.ids() == accepted and registry.species("prototype:first") == accepted_first, "WB-REGISTRY: a rejected second import preserves accepted imported content too")
	var invalid_legacy := before.duplicate(true)
	invalid_legacy.SPECIES.bogsnap.learn = [[1, "absent"]]
	check.call(not registry.load_legacy(invalid_legacy).is_empty() and registry.ids() == accepted, "WB-REGISTRY: failed legacy reload preserves the complete registry")
	check.call(not registry.load_legacy({"SPECIES": {}, "MOVES": {}, "ELEMENTS": {}}).is_empty() and registry.ids() == accepted, "WB-REGISTRY: empty legacy reload cannot erase accepted content")
	check.call(main.DATA == before, "WB-REGISTRY: all operations leave runtime and save-source data unchanged")

static func fixture_pack() -> Dictionary:
	var first := {"id": "prototype:first", "name": "Bogsnap", "legacy_ids": ["fixture-first"],
		"base_stats": {"hp": 43, "attack": 57, "defense": 38, "speed": 46, "special_attack": 61, "special_defense": 52},
		"profiles": {"prototype-round": {"types": ["plant", "toxin"], "ability_ids": ["prototype:calm"]}},
		"learnset": [{"level": 1, "move_id": "prototype:tap"}, {"level": 6, "move_id": "prototype:mist"}],
		"evolutions": [{"to": "prototype:second", "conditions": {"level": 16}}]}
	var second: Dictionary = first.duplicate(true)
	second.id = "prototype:second"
	second.legacy_ids = []
	second.evolutions = []
	return {"schema_version": 1, "profiles": {"prototype-round": ["plant", "toxin"]},
		"moves": {"prototype:tap": {"name": "Tap"}, "prototype:mist": {"name": "Mist", "accuracy": 0.75}},
		"abilities": {"prototype:calm": {"name": "Calm"}}, "species": [first, second]}
