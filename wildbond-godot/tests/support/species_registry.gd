extends RefCounted
## WB-REGISTRY: integration candidate, deliberately outside public exports until runtime promotion.
## Definition storage only: never reads/writes saves, loads files or changes Rules.DATA.
## All writes stage a complete copy and commit only after references/aliases/cycles validate.

const STAT_KEYS := {"hp": "hp", "pow": "attack", "grd": "defense", "spd": "speed", "wit": "special_attack", "spi": "special_defense"}
const CONDITION_KEYS := {"at": "level", "bond": "bond_stage", "with": "with_species"}
var _state: Dictionary = {"species": {}, "aliases": {}, "moves": {}, "profiles": {}, "abilities": {}, "legacy": {}}

func size() -> int:
	return _state.species.size()

func ids() -> Array:
	var out: Array = _state.species.keys()
	out.sort()
	return out

func resolve(id: String) -> String:
	return str(_state.aliases.get(id, ""))

func species(id: String) -> Dictionary:
	return _state.species.get(resolve(id), {}).duplicate(true)

func move(id: String) -> Dictionary:
	return _state.moves.get(id, {}).duplicate(true)

func legacy_snapshot() -> Dictionary:
	return _state.legacy.duplicate(true)

## Accept already merged DATA (after main.gd overlays evolution and prepares lessons).
## Snapshot and normalized views both own deep copies, so no caller can mutate the game via this registry.
func load_legacy(data: Dictionary) -> Array[String]:
	for key in ["SPECIES", "MOVES", "ELEMENTS"]:
		if not data.get(key) is Dictionary:
			return ["Legacy %s must be a dictionary." % key]
	if data.SPECIES.is_empty():
		return ["Legacy species cannot be empty."]
	if data.has("EVOS") and not data.EVOS is Dictionary:
		return ["Legacy EVOS must be a dictionary."]
	var staged := {"species": {}, "aliases": {}, "moves": {}, "profiles": {"wildbond-legacy": data.ELEMENTS.keys()}, "abilities": {}, "legacy": data.duplicate(true)}
	for id in data.MOVES:
		if not id is String or not data.MOVES[id] is Dictionary:
			return ["Invalid legacy move."]
		var m: Dictionary = data.MOVES[id].duplicate(true)
		m["id"] = "wildbond:" + id
		m["accuracy"] = m.get("accuracy", 1.0)
		staged.moves[m.id] = m
	for id in data.SPECIES:
		if not id is String or not data.SPECIES[id] is Dictionary:
			return ["Invalid legacy species."]
		var s: Dictionary = data.SPECIES[id]
		if not s.get("base") is Dictionary or not s.get("learn") is Array:
			return ["%s needs legacy stats and lessons." % id]
		var stats := {}
		for key in STAT_KEYS:
			stats[STAT_KEYS[key]] = s.base.get(key)
		var lessons: Array = []
		for entry in s.learn:
			if not entry is Array or entry.size() != 2 or not entry[1] is String:
				return ["%s has a malformed lesson." % id]
			lessons.append({"level": entry[0], "move_id": "wildbond:" + entry[1]})
		var ways = data.get("EVOS", {}).get(id, [s.evo] if s.get("evo") else [])
		if not ways is Array:
			return ["%s needs an evolution list." % id]
		var evolutions: Array = []
		for way in ways:
			if not way is Dictionary or not way.get("to") is String:
				return ["%s has a malformed evolution." % id]
			var conditions := {}
			for key in way:
				if key in ["to", "hint"]: continue
				var field: String = str(CONDITION_KEYS.get(key, key))
				conditions[field] = "wildbond:" + str(way[key]) if key == "with" else way[key]
			evolutions.append({"to": "wildbond:" + way.to, "conditions": conditions, "hint": way.get("hint", "")})
		var canonical: String = "wildbond:" + id
		staged.species[canonical] = {"id": canonical, "legacy_ids": [id], "name": s.get("name", ""),
			"origin": {"kind": "wildbond", "source_id": id}, "family": s.get("fam", ""),
			"description": s.get("dex", ""), "base_stats": stats,
			"profiles": {"wildbond-legacy": {"types": [s.get("el")], "ability_ids": []}},
			"learnset": lessons, "evolutions": evolutions, "appearance_id": canonical + "/default"}
	return _commit(staged)

## Data-only packs. Profile type lists describe definitions, not implemented combat mechanics.
## A pack cannot replace a registered species, move, profile or ability. No script/image loading happens here.
func add_pack(pack: Dictionary) -> Array[String]:
	if not _whole(pack.get("schema_version"), 1, 1) or not pack.get("species") is Array:
		return ["Pack schema_version must be 1 and species must be an array."]
	if pack.species.is_empty() or pack.species.size() > 512:
		return ["A pack needs between 1 and 512 species."]
	for field in ["moves", "profiles", "abilities"]:
		if pack.has(field) and not pack[field] is Dictionary:
			return ["Pack %s must be a dictionary." % field]
	var incoming: Dictionary = pack.duplicate(true)
	var staged: Dictionary = _state.duplicate(true)
	for field in ["moves", "profiles", "abilities"]:
		for id in incoming.get(field, {}):
			if staged[field].has(id):
				return ["Pack cannot replace %s %s." % [field, str(id)]]
			staged[field][id] = incoming[field][id]
	for entry in incoming.species:
		if not entry is Dictionary or not entry.get("id") is String:
			return ["Every species needs a string id."]
		if staged.species.has(entry.id):
			return ["Pack cannot replace species %s." % entry.id]
		staged.species[entry.id] = entry
	return _commit(staged)

func _commit(staged: Dictionary) -> Array[String]:
	var errors := _validate(staged)
	if errors.is_empty():
		_state = staged.duplicate(true)
	return errors

static func _whole(value: Variant, lo: int, hi: int) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and float(value) == floorf(float(value)) and value >= lo and value <= hi

static func _qualified(value: Variant) -> bool:
	return value is String and RegEx.create_from_string("^[a-z][a-z0-9_-]*:[A-Za-z0-9_-]+$").search(value) != null

static func _text(value: Variant) -> bool:
	return value is String and not value.strip_edges().is_empty()

static func _validate(staged: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	staged.aliases = {}
	for profile in staged.profiles:
		var types = staged.profiles[profile]
		if not _text(profile) or not types is Array or types.is_empty():
			errors.append("A profile needs a name and nonempty type list.")
			continue
		var unique := {}
		for type in types:
			if not _text(type) or unique.has(type): errors.append("Invalid or duplicate type in %s." % str(profile))
			unique[type] = true
	for id in staged.abilities:
		if not _qualified(id) or not staged.abilities[id] is Dictionary or not _text(staged.abilities[id].get("name")):
			errors.append("Invalid ability definition %s." % str(id))
	for id in staged.moves:
		var m = staged.moves[id]
		if not _qualified(id) or not m is Dictionary or not _text(m.get("name")):
			errors.append("Invalid move definition %s." % str(id))
			continue
		var accuracy = m.get("accuracy", 1.0)
		if not (accuracy is int or accuracy is float) or not is_finite(float(accuracy)) or accuracy < 0.0 or accuracy > 1.0:
			errors.append("%s accuracy must be between 0 and 1." % id)
		else:
			m["accuracy"] = float(accuracy)
	for id in staged.species:
		var s = staged.species[id]
		if not _qualified(id) or not s is Dictionary or s.get("id") != id or not _text(s.get("name")):
			errors.append("Invalid species identity %s." % str(id))
			continue
		var aliases = s.get("legacy_ids", [])
		if not aliases is Array:
			errors.append("%s aliases must be an array." % id)
		else:
			var local := {}
			for alias in [id] + aliases:
				if not _text(alias) or local.has(alias) or (staged.aliases.has(alias) and staged.aliases[alias] != id):
					errors.append("Duplicate or invalid alias %s." % str(alias))
				else:
					staged.aliases[alias] = id
					local[alias] = true
		var stats = s.get("base_stats")
		if not stats is Dictionary:
			errors.append("%s needs base_stats." % id)
		else:
			for key in STAT_KEYS.values():
				if not _whole(stats.get(key), 1, 10000): errors.append("%s invalid stat %s." % [id, key])
				else: stats[key] = int(stats[key])
		var profiles = s.get("profiles")
		if not profiles is Dictionary or profiles.is_empty():
			errors.append("%s needs at least one profile." % id)
		else:
			for profile in profiles:
				var p = profiles[profile]
				if not staged.profiles.get(profile) is Array or not p is Dictionary or not p.get("types") is Array:
					errors.append("%s has an unknown or malformed profile." % id)
					continue
				var types: Array = p.types
				if types.size() < 1 or types.size() > 2 or (types.size() == 2 and types[0] == types[1]): errors.append("%s needs one or two different types." % id)
				for type in types:
					if type not in staged.profiles[profile]: errors.append("%s unknown type %s." % [id, str(type)])
				var abilities = p.get("ability_ids", [])
				if not abilities is Array:
					errors.append("%s abilities must be an array." % id)
				else:
					for ability in abilities:
						if not staged.abilities.has(ability): errors.append("%s unknown ability %s." % [id, str(ability)])
		var lessons = s.get("learnset")
		if not lessons is Array or lessons.is_empty():
			errors.append("%s needs a nonempty learnset." % id)
		else:
			for lesson in lessons:
				if not lesson is Dictionary or not _whole(lesson.get("level"), 1, 100) or not staged.moves.has(lesson.get("move_id")):
					errors.append("%s has an invalid lesson or missing move." % id)
				else: lesson.level = int(lesson.level)
		var evolutions = s.get("evolutions", [])
		if not evolutions is Array:
			errors.append("%s evolutions must be an array." % id)
		else:
			for evolution in evolutions:
				if not evolution is Dictionary or not staged.species.has(evolution.get("to")) or not evolution.get("conditions") is Dictionary:
					errors.append("%s has an invalid evolution target or conditions." % id)
					continue
				var conditions: Dictionary = evolution.conditions
				if not _whole(conditions.get("level"), 1, 100): errors.append("%s evolution needs a level." % id)
				else: conditions.level = int(conditions.level)
				for field in ["bond_stage", "raised_at"]:
					if conditions.has(field):
						if not _whole(conditions[field], 0, 4): errors.append("%s invalid %s." % [id, field])
						else: conditions[field] = int(conditions[field])
				for field in conditions:
					if field not in ["level", "bond_stage", "raised_at", "with_species", "raised", "place", "time", "weather", "ate"]:
						errors.append("%s unknown evolution condition %s." % [id, str(field)])
				if conditions.has("raised") and conditions.raised not in ["battle", "care"]: errors.append("%s invalid raising track." % id)
				if conditions.has("with_species") and not staged.species.has(conditions.with_species): errors.append("%s evolution needs a missing companion." % id)
	# Only inspect the graph once its shape/references are known safe. Kahn's algorithm avoids recursion limits.
	if errors.is_empty():
		var incoming := {}
		for id in staged.species: incoming[id] = 0
		for id in staged.species:
			for evolution in staged.species[id].get("evolutions", []): incoming[evolution.to] += 1
		var ready: Array = incoming.keys().filter(func(id): return incoming[id] == 0)
		var visited := 0
		while not ready.is_empty():
			var id: String = ready.pop_back()
			visited += 1
			for evolution in staged.species[id].get("evolutions", []):
				incoming[evolution.to] -= 1
				if incoming[evolution.to] == 0: ready.append(evolution.to)
		if visited != staged.species.size(): errors.append("Evolution graph contains a cycle.")
	return errors
