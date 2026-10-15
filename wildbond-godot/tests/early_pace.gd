extends SceneTree
## WB-LOOK / WBL-5 standalone regression. Exercises the real scene's arrival,
## exploration, story, first-catch, and save hooks; run_tests.gd stays unchanged.
## Run from the repository root (Godot 4.7.2 in CI; local evidence may use 4.6.3):
##   home="$(mktemp -d /tmp/wildbond-early-pace-XXXXXX)"
##   HOME="$home" WB_EARLY_PACE_TEST_HOME="$home" XDG_DATA_HOME="$home/data" \
##   XDG_CACHE_HOME="$home/cache" XDG_CONFIG_HOME="$home/config" \
##     godot --headless --path wildbond-godot --script res://tests/early_pace.gd
## Refuses reused/nonisolated homes before instantiating the game. Never points
## a game at user://journey.json. Only the final save round-trip enables writes,
## to a new fixture file inside that verified temporary home.

const Pace := preload("res://scripts/early_pace.gd")
const EARLY_MAPS := ["thornwood_route", "thornwood", "thornwood_grove"]
const FAMILIES := ["farm", "coast", "highland", "wander", "missing"]
const REST_NOTE := "Your partners catch their breath and recover some health."
const QUIET_FLAVOUR := ["You follow a stream deeper into Thornwood.", "Birdsong all around. Your team looks happy.", "You rest in a sunny clearing for a moment.", "Pawprints in the mud lead off between the trees.", "A breeze rustles the old oaks."]
const EXHAUSTED := "Your team is exhausted. Rest with Maren in Larkhaven first."
const LEGACY := "res://tests/fixtures/wb-c2-pre-change.json"
const SCRATCH := "user://early-pace-test"
const SAVE_KEYS := ["v", "saved", "look", "team", "ranch", "bag", "badges", "seen", "bonded", "items", "beaten", "restore", "explored", "story", "retry", "egg", "gear", "taught", "letter", "calendar", "festival", "league", "spire", "rematches", "bondDay", "keysLearned", "map", "x", "y", "partner"]

var main: Node
var passed := 0
var failed := 0
var elapsed := 0.0
var seeds := {}
var test_home := ""

func check(ok: bool, what: String) -> void:
	if ok:
		passed += 1
	else:
		failed += 1
		print("FAIL: WB-LOOK: ", what)

func _initialize() -> void:
	if not _safe_home():
		printerr("WB-LOOK early pace: REFUSED. Use an empty temporary HOME named wildbond-early-pace-*, wb-early-pace-test-home, or test-home, with matching XDG data/cache/config directories (see script header).")
		quit(2)
		return
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.save_path = SCRATCH + "/disabled.json"
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	_run.call_deferred()

func _process(dt: float) -> bool:
	elapsed += dt
	if elapsed > 120.0:
		printerr("WB-LOOK early pace: TIMED OUT; see script errors above.")
		quit(3)
	return false

func _safe_home() -> bool:
	test_home = OS.get_environment("HOME").simplify_path()
	var explicit_home := OS.get_environment("WB_EARLY_PACE_TEST_HOME")
	if explicit_home != "" and explicit_home.simplify_path() != test_home:
		return false
	var basename := test_home.get_file()
	if not test_home.is_absolute_path() or not (basename.begins_with("wildbond-early-pace-") or basename in ["wb-early-pace-test-home", "test-home"]):
		return false
	var parent_dir := DirAccess.open(test_home.get_base_dir())
	if parent_dir == null or parent_dir.is_link(basename):
		return false
	for kind in ["DATA", "CACHE", "CONFIG"]:
		if OS.get_environment("XDG_" + kind + "_HOME").simplify_path() != test_home + "/" + kind.to_lower():
			return false
	var user_dir := ProjectSettings.globalize_path("user://").simplify_path().trim_suffix("/")
	if not user_dir.begins_with(test_home + "/data/"):
		return false
	# Godot creates its current log and fontconfig cache before _initialize.
	# Those engine-created files are the only permitted pre-existing files. A settings file, register, fixture, backup, or old log
	# means this is not an empty test home and must never be read or overwritten.
	var font_cache_name := RegEx.new()
	font_cache_name.compile("^[0-9a-f]{32}-(le|be)[0-9]+\\.cache-[0-9]+$")
	var pending := [test_home]
	while not pending.is_empty():
		var dir_path: String = pending.pop_back()
		var dir := DirAccess.open(dir_path)
		if dir == null:
			return false
		dir.include_hidden = true
		for file in dir.get_files():
			if dir.is_link(file):
				return false
			var engine_log := dir_path.path_join(file) == user_dir + "/logs/godot.log"
			var font_cache := dir_path == test_home + "/cache/fontconfig" and (font_cache_name.search(file) != null or file == "CACHEDIR.TAG")
			if not engine_log and not font_cache:
				return false
		for child in dir.get_directories():
			var path := dir_path.path_join(child)
			if dir.is_link(child):
				return false
			if dir_path == test_home and child not in ["data", "cache", "config"]:
				return false
			pending.append(path)
	if DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(SCRATCH)):
		return false
	return DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(SCRATCH)) == OK

func _run() -> void:
	main.set_process(false)
	# Keep real sound requests observable while avoiding audio playback in headless CI.
	main.sfx.on = false
	main.music_on = false
	main.register.keep = false
	main.battle.set_process(false)
	check(main.grass_n == 10, "a fresh scene still starts with ten grass arrivals")
	check(main.DATA.STARTERS == ["cindercub", "ripplet", "mosshog"], "all three actual starters are covered")
	check(main.HERITAGES.keys().size() == 4, "all four actual heritages plus a missing legacy heritage are covered")
	_find_seeds()
	_test_initial_and_non_grass()
	_test_intervals()
	_test_rest()
	_test_quiet_rng_continuity()
	_test_odds_and_loot()
	_test_story()
	_test_first_catch()
	_test_existing_healers()
	_test_legacy_save()
	check(not FileAccess.file_exists("user://journey.json") and not FileAccess.file_exists("user://journey.json.bak") and not FileAccess.file_exists("user://journey.json.tmp"), "the default journey path was never created")
	check(not FileAccess.file_exists("user://settings.cfg") and not FileAccess.file_exists(main.Register.SAVE), "settings and registration were never written")
	main.no_save = true
	main.free()
	main = null
	await process_frame
	print("WB-LOOK early pace: %d passed, %d failed. Engine: %s" % [passed, failed, Engine.get_version_info().string])
	quit(0 if failed == 0 else 1)

func _reset(where := "thornwood_route", family := "farm", starter := "cindercub", has_badge := false) -> void:
	main.lines.clear()
	main.then_do = Callable()
	main.battle.visible = false
	main.battle.state = ""
	main.battle.caught.clear()
	main.battle_story = ""
	main.stage = "free"
	main.trans_t = -1.0
	main.demo = false
	main.my_look = main.LOOKS.tamer.duplicate(true)
	main.my_look.name = "Pace Test"
	if family != "missing":
		main.my_look.heritage = family
	main.rng.seed = 466
	main.team = [main.R.make(starter, 5, { "rar": 1 }, main.rng)]
	main.rival_c = main.R.make(main.DATA.COUNTER[starter], 4, { "rar": 1 }, main.rng)
	main.ranch = [main.R.make("ripplet", 6, { "rar": 1 }, main.rng)]
	main.ranch[0].name = "Unchanged ranch friend"
	main.ranch[0].hp = 1
	main.bag.clear()
	main.bag.merge({ "coins": 0, "lures": 0, "berries": 0 })
	main.badges = ["thorn"] if has_badge else []
	main.story_done.clear()
	for beat in main.DATA.STORY:
		main.story_done[beat.id] = true
	main.story_done.marenRanchTip = true
	main.story_retry.clear()
	main.explored_in.clear()
	main.egg.clear()
	main.letter_steps = 1000000
	main.fest_task = ""
	main.got_items.clear()
	for data in main.DATA.MAPS.values():
		for item in data.get("items", []):
			main.got_items[item.id] = true
	main._set_map(where)
	main.me.where = where
	main.me.tile = _tile(false)
	main.me.pos = Vector2(main.me.tile) * main.TILE
	main.me.path.clear()
	main.walk_to.clear()
	main.meet_after = null
	main.walk_tap = Vector2i.ZERO
	main.title.visible = false
	main.register.visible = false
	main.card.visible = false
	main.howto.visible = false
	main.turn_card.visible = false
	main.book.visible = false
	main.shop.visible = false
	main.menu.visible = false
	main.lessons.visible = false
	main.wren.where = "gone"
	main.spotter = null

func _tile(grass: bool) -> Vector2i:
	var rows: Array = main.cur_map()
	for y in range(1, rows.size() - 1):
		for x in range(1, rows[y].length() - 1):
			var at := Vector2i(x, y)
			var ch: String = main.tile_at(at)
			if (ch == "\"") == grass and not main.solid(ch) and ch not in ["N", "S", "E", "W", "D", "d"]:
				return at
	return Vector2i(-1, -1)

func _find_seeds() -> void:
	var probe := RandomNumberGenerator.new()
	var closest := { "wild_edge": -1.0, "loot_start": 2.0, "loot_end": -1.0, "quiet_start": 2.0 }
	for number in 50000:
		probe.seed = number
		var roll := probe.randf()
		if roll < 0.62:
			seeds.wild = number
			if roll > closest.wild_edge:
				closest.wild_edge = roll
				seeds.wild_edge = number
		elif roll < 0.76:
			if roll < closest.loot_start:
				closest.loot_start = roll
				seeds.loot_start = number
			if roll > closest.loot_end:
				closest.loot_end = roll
				seeds.loot_end = number
			if probe.randf() < 0.5:
				var amount := probe.randi_range(8, 20)
				if amount == 8: seeds.coins_min = number
				if amount == 20: seeds.coins_max = number
			else:
				seeds.lure = number
		else:
			seeds.quiet = number
			if roll < closest.quiet_start:
				closest.quiet_start = roll
				seeds.quiet_start = number
	check(0.62 - closest.wild_edge < 0.0002 and closest.loot_start - 0.62 < 0.0002 and 0.76 - closest.loot_end < 0.0002 and closest.quiet_start - 0.76 < 0.0002, "deterministic probes bracket both 62%/76% branch boundaries")
	check(seeds.has("coins_min") and seeds.has("coins_max") and seeds.has("lure"), "coin endpoints and lure branch have deterministic probes")

func _arrival_seed(low: int, high: int, wanted := -1) -> int:
	var probe := RandomNumberGenerator.new()
	for number in 2000:
		probe.seed = number
		var steps := probe.randi_range(low, high)
		if (wanted < 0 or steps == wanted) and probe.randf() >= 0.76:
			return number
	check(false, "found a quiet arrival seed for %d-%d, wanted %d" % [low, high, wanted])
	return 0

func _test_initial_and_non_grass() -> void:
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			_reset("thornwood_route", family, starter)
			main.grass_n = 10
			main._on_chosen(starter)
			check(main.grass_n == 10 and main.team[0].sp == starter, "%s/%s: choosing a partner preserves initial ten" % [starter, family])
			main.stage = "free"
			main.lines.clear()
			main.then_do = Callable()
			var low := 3 if family == "wander" else 4
			var high := 6 if family == "wander" else 8
			main.rng.seed = _arrival_seed(low, high)
			var grass := _tile(true)
			check(grass.x >= 0, "the real Thornwood Trail has a grass test tile")
			for step in 9:
				main._arrived(grass)
				check(main.grass_n == 9 - step and main.explored_in.is_empty() and not main.battle.visible and main.lines.is_empty(), "%s/%s: first encounter waits through grass arrival %d" % [starter, family, step + 1])
			main._arrived(grass)
			check(int(main.explored_in.get("thornwood", 0)) == 1 and main.grass_n >= low and main.grass_n <= high, "%s/%s: tenth grass arrival explores exactly once and uses early reset" % [starter, family])
	for where in EARLY_MAPS + ["saltmarsh_route", "larkhaven", "barn", "inn"]:
		_reset(where)
		main.grass_n = 1
		var before: Array = main.team.duplicate(true)
		for step in 30:
			main._arrived(_tile(false))
		check(main.grass_n == 1 and main.explored_in.is_empty() and main.team == before and main.lines.is_empty() and not main.battle.visible, "%s: thirty nongrass arrivals never explore or heal" % where)
	_reset()
	main.grass_n = 1
	main.team[0].hp = 1
	main.me.tile = _tile(true)
	main.me.pos = Vector2(main.me.tile) * main.TILE
	# No input or arrival is dispatched: the uncovered game runs normally while
	# the player stands in real grass, well away from the route trainer.
	main.title.visible = false
	main.lines.clear()
	var before_time: float = main.t
	for frame in 1200:
		main._process(0.05)
	check(main.grass_n == 1 and main.explored_in.is_empty() and main.team[0].hp == 1 and not main.battle.visible, "sixty seconds standing in grass never triggers a timer encounter or rest")
	check(is_equal_approx(main.t - before_time, 60.0), "the idle test actually advances sixty seconds of the real game loop")
	_reset()
	main.stage = "bonded"
	main.grass_n = 1
	main._arrived(_tile(true))
	check(main.grass_n == 1 and main.explored_in.is_empty(), "grass during the opening is not free exploration")

func _test_intervals() -> void:
	var maps: Array = main.DATA.MAPS.keys().filter(func(id): return main.DATA.MAPS[id].has("biome"))
	for where in maps:
		for family in FAMILIES:
			for has_badge in [false, true]:
				_reset(where, family, "cindercub", has_badge)
				var early: bool = where in EARLY_MAPS and not has_badge
				var low := (3 if early else 6) if family == "wander" else (4 if early else 8)
				var high := (6 if early else 12) if family == "wander" else (8 if early else 16)
				var label := "%s/%s/badge=%s" % [where, family, has_badge]
				check(Pace.is_early(main) == early, label + ": early eligibility")
				var seen_steps := {}
				var mirror := RandomNumberGenerator.new()
				for number in 64:
					main.rng.seed = number
					mirror.seed = number
					var actual: int = Pace.next_steps(main)
					seen_steps[actual] = true
					check(actual == mirror.randi_range(low, high) and main.rng.state == mirror.state, label + ": interval and RNG consumption match the specified inclusive range")
				check(seen_steps.has(low) and seen_steps.has(high), label + ": both interval endpoints are reachable")
				for endpoint in [low, high]:
					main.lines.clear()
					main.grass_n = 1
					main.rng.seed = _arrival_seed(low, high, endpoint)
					main._arrived(_tile(true))
					check(main.grass_n == endpoint, label + ": real _arrived uses inclusive endpoint %d" % endpoint)
				check(int(main.explored_in.get(main.DATA.MAPS[where].biome, 0)) == 2, label + ": two countdown expiries produce two exploration events")
	# Any badge ends the opening rule, even a non-Thorn badge in an unusual save.
	_reset()
	main.badges = ["tide"]
	check(not Pace.is_early(main), "a non-Thorn badge also ends early pacing")

func _test_rest() -> void:
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			for where in EARLY_MAPS:
				for shape in ["healthy", "partial", "near_full", "fainted", "all_zero", "mixed", "empty"]:
					_reset(where, family, starter)
					var maximum: int = main.R.stats(main.team[0]).hp
					if shape == "partial": main.team[0].hp = maxi(1, maximum / 2)
					if shape == "near_full": main.team[0].hp = maximum - 1
					if shape == "fainted": main.team[0].hp = 0
					if shape in ["mixed", "all_zero"]:
						main.team.append(main.R.make("ripplet", 6, { "rar": 1 }, main.rng))
						main.team.append(main.R.make("mosshog", 7, { "rar": 1 }, main.rng))
						main.team[0].hp = 0
						main.team[1].hp = 1 if shape == "mixed" else 0
						main.team[2].hp = int(main.R.stats(main.team[2]).hp) - 1 if shape == "mixed" else 0
					if shape == "empty": main.team.clear()
					# Include optional save fields to catch accidental creature replacement.
					for creature in main.team:
						creature.name = "Keep my nickname"
						creature.xp = 12
						creature.bond = 17.5
						creature.raised = { "care": 1.25, "battle": 0.5 }
						creature.hold = 5
						creature.hold_bond = 1
					if shape == "healthy":
						main.team[0].hp = int(main.R.stats(main.team[0]).hp)
					if shape == "near_full":
						main.team[0].hp = int(main.R.stats(main.team[0]).hp) - 1
					var before: Array = main.team.duplicate(true)
					var expected: Array = before.duplicate(true)
					var living := false
					var recovered := false
					for creature in expected:
						var cap: int = main.R.stats(creature).hp
						living = living or int(creature.hp) > 0
						if int(creature.hp) > 0 and int(creature.hp) < cap:
							creature.hp = mini(cap, int(creature.hp) + maxi(1, roundi(cap * 0.3)))
							recovered = true
					var ranch_before: Array = main.ranch.duplicate(true)
					var bag_before: Dictionary = main.bag.duplicate(true)
					var progress_before: Dictionary = main.story_done.duplicate(true)
					main.rng.seed = int(seeds.quiet)
					var rng_before: int = main.rng.state
					var sounds_before: int = main.sfx.count
					main._explore()
					var label := "%s/%s/%s/%s" % [starter, family, where, shape]
					check(main.team == expected, label + ": only living injured HP changes by rounded 30%, capped at maximum")
					check(main.ranch == ranch_before and main.bag == bag_before and main.story_done == progress_before, label + ": no ranch, bag, currency requirement, or progress mutation")
					check(not main.battle.visible and not main.then_do.is_valid(), label + ": quiet/exhausted branch opens no battle or story")
					check(main.lines.size() == 1 and (main.lines[0].text == REST_NOTE) == recovered, label + ": recovery text appears only when HP is actually restored")
					check(main.sfx.count == sounds_before + (1 if recovered else 0) and (not recovered or main.sfx.last == "heal"), label + ": healing sound occurs once only when recovery happens")
					if living:
						check(int(main.explored_in.get("thornwood", 0)) == 1, label + ": one quiet encounter advances exploration once")
						var mirror := RandomNumberGenerator.new()
						mirror.seed = int(seeds.quiet)
						mirror.randf()
						mirror.randi()
						_check_rng_continuity(mirror, label + ": quiet recovery preserves the original flavour draw")
					else:
						check(main.lines[0].text == EXHAUSTED and main.explored_in.is_empty() and main.rng.state == rng_before, label + ": exhausted guard wins without encounter roll or exploration progress")
	for where in main.DATA.MAPS:
		if not main.DATA.MAPS[where].has("biome"): continue
		for has_badge in [false, true]:
			if where in EARLY_MAPS and not has_badge: continue
			_reset(where, "farm", "cindercub", has_badge)
			main.team[0].hp = 1
			var before: Array = main.team.duplicate(true)
			main.rng.seed = int(seeds.quiet)
			main._explore()
			check(main.team == before and main.lines.size() == 1 and main.lines[0].text != REST_NOTE, "%s/badge=%s: later quiet finds preserve HP and original narration" % [where, has_badge])
			var mirror := RandomNumberGenerator.new()
			mirror.seed = int(seeds.quiet)
			mirror.randf()
			var flavour_index := mirror.randi() % 5
			check(main.lines[0].text == QUIET_FLAVOUR[flavour_index], "%s/badge=%s: excluded quiet find keeps its exact original flavour selection" % [where, has_badge])
			_check_rng_continuity(mirror, "%s/badge=%s: excluded quiet find" % [where, has_badge])

## Compare both the saved generator state and the rolls that follow without
## advancing either tested stream: restore both states after the actual rolls.
## Identical quiet-find seeds must not drift
## when healing starts, caps at maximum, or stops because everyone is healthy.
func _check_rng_continuity(expected: RandomNumberGenerator, label: String) -> void:
	check(main.rng.state == expected.state, label + ": RNG state matches one encounter randf plus one flavour randi")
	var actual_state: int = main.rng.state
	var expected_state: int = expected.state
	var next_roll_matches: bool = main.rng.randf() == expected.randf()
	var next_integer_matches: bool = main.rng.randi() == expected.randi()
	check(next_roll_matches and next_integer_matches, label + ": next encounter roll and following integer stay aligned")
	main.rng.state = actual_state
	expected.state = expected_state

func _quiet_chain_seed(length: int) -> int:
	var probe := RandomNumberGenerator.new()
	for number in 200000:
		probe.seed = number
		var matches := true
		for step in length:
			if probe.randf() < 0.76:
				matches = false
				break
			probe.randi()
		if matches: return number
	check(false, "a deterministic six-quiet-find sequence exists for this engine")
	return 0

func _test_quiet_rng_continuity() -> void:
	# Six uninterrupted quiet finds allow every injured living starter to reach
	# full HP, followed by at least two healthy finds. Never reseed mid-sequence.
	var chain_length := 6
	var chain_seed := _quiet_chain_seed(chain_length)
	var scopes := [["thornwood_route", false], ["thornwood", false], ["thornwood_grove", false], ["thornwood_route", true], ["saltmarsh_route", false]]
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			for scope in scopes:
				for shape in ["injured", "full", "mixed", "capped"]:
					_reset(scope[0], family, starter, scope[1])
					if shape == "injured": main.team[0].hp = 1
					if shape == "capped": main.team[0].hp = int(main.R.stats(main.team[0]).hp) - 1
					if shape == "mixed":
						main.team[0].hp = 0
						main.team.append(main.R.make("ripplet", 6, { "rar": 1 }, main.rng))
						main.team.append(main.R.make("mosshog", 7, { "rar": 1 }, main.rng))
						main.team[1].hp = 1
						main.team[2].hp = int(main.R.stats(main.team[2]).hp) - 1
					var expected_team: Array = main.team.duplicate(true)
					var ranch_before: Array = main.ranch.duplicate(true)
					var bag_before: Dictionary = main.bag.duplicate(true)
					var eligible: bool = scope[0] in EARLY_MAPS and not scope[1]
					var healing_events := 0
					var ordinary_events := 0
					var mirror := RandomNumberGenerator.new()
					mirror.seed = chain_seed
					main.rng.seed = chain_seed
					var label := "%s/%s/%s/badge=%s/%s" % [starter, family, scope[0], scope[1], shape]
					for step in chain_length:
						check(mirror.randf() >= 0.76, label + ": continuous reference event %d is quiet" % (step + 1))
						var flavour_index := mirror.randi() % 5
						var healed := false
						if eligible:
							for creature in expected_team:
								var cap: int = main.R.stats(creature).hp
								if int(creature.hp) > 0 and int(creature.hp) < cap:
									creature.hp = mini(cap, int(creature.hp) + maxi(1, roundi(cap * 0.3)))
									healed = true
						var sounds_before: int = main.sfx.count
						main.lines.clear()
						main._explore()
						check(main.team == expected_team and main.ranch == ranch_before and main.bag == bag_before, label + ": quiet event %d changes only eligible injured HP" % (step + 1))
						check(main.lines.size() == 1 and main.lines[0].text == (REST_NOTE if healed else QUIET_FLAVOUR[flavour_index]), label + ": recovery/full/excluded narration uses the same original flavour draw")
						check(main.sfx.count == sounds_before + (1 if healed else 0), label + ": healing sound stops exactly when HP reaches full")
						_check_rng_continuity(mirror, label + ": continuous quiet event %d" % (step + 1))
						check(not main.battle.visible and not main.then_do.is_valid() and int(main.explored_in.get(main.DATA.MAPS[scope[0]].biome, 0)) == step + 1, label + ": the continuous quiet sequence advances once per event")
						if healed: healing_events += 1
						else: ordinary_events += 1
					if eligible and shape != "full":
						check(healing_events > 0 and healing_events <= 4 and ordinary_events >= 2 and main.team.all(func(c): return c.hp == 0 or int(c.hp) == int(main.R.stats(c).hp)), label + ": sequence reaches full recovery and remains RNG-aligned through two or more healthy finds")
					else:
						check(healing_events == 0 and ordinary_events == chain_length, label + ": full or excluded team preserves the entire legacy quiet sequence")

func _test_odds_and_loot() -> void:
	for scope in [["thornwood_route", false], ["thornwood", true], ["saltmarsh_route", false]]:
		for key in ["wild_edge", "loot_start", "loot_end", "quiet_start", "coins_min", "coins_max", "lure"]:
			_reset(scope[0], "farm", "cindercub", scope[1])
			main.team[0].hp = 1
			var before: Array = main.team.duplicate(true)
			var expected_bag: Dictionary = main.bag.duplicate(true)
			var mirror := RandomNumberGenerator.new()
			mirror.seed = int(seeds[key])
			var roll := mirror.randf()
			var kind := "wild" if roll < 0.62 else ("loot" if roll < 0.76 else "quiet")
			if kind == "loot":
				if mirror.randf() < 0.5:
					expected_bag.coins += roundi(mirror.randi_range(8, 20) * float(main.DATA.JOURNEY.classic.coins))
				else:
					expected_bag.lures += 1
			main.rng.seed = int(seeds[key])
			main._explore()
			var label := "%s/badge=%s/%s" % [scope[0], scope[1], key]
			check(main.battle.visible == (kind == "wild") and not main.then_do.is_valid(), label + ": real exploration keeps 62% wild / 14% loot / 24% quiet boundaries")
			check(main.bag == expected_bag, label + ": coin/lure choice and quantity are unchanged")
			check(int(main.explored_in.get(main.DATA.MAPS[scope[0]].biome, 0)) == 1, label + ": every nonexhausted event advances once")
			if kind != "quiet":
				check(main.team == before, label + ": wild battles and loot never apply the quiet heal")
			if kind == "loot":
				check(main.rng.state == mirror.state, label + ": loot RNG sequence is unchanged")

func _story_case(count: int, completed: Array, retry: Dictionary, expected_id: String, label: String) -> void:
	main.lines.clear()
	main.then_do = Callable()
	main.battle.visible = false
	main.battle.caught.clear()
	main.story_done.clear()
	for id in completed: main.story_done[id] = true
	main.story_retry = retry.duplicate(true)
	main.explored_in = { "thornwood": count }
	main.team[0].hp = 1
	var before: Array = main.team.duplicate(true)
	main.rng.seed = int(seeds.quiet)
	var before_rng: int = main.rng.state
	main._explore()
	check(main.explored_in.thornwood == count + 1, label + ": one exploration increment")
	if expected_id == "":
		check(not main.then_do.is_valid() and main.lines.size() == 1 and main.lines[0].text == REST_NOTE and main.team[0].hp > 1, label + ": a not-yet-due or completed beat allows the quiet recovery")
	else:
		var beat: Dictionary = main.DATA.STORY.filter(func(b): return b.id == expected_id)[0]
		check(main.then_do.is_valid() and main.lines.size() == beat.lines.size() and main.lines[0].text == beat.lines[0][1], label + ": the expected story dialogue takes precedence")
		check(main.team == before and main.rng.state == before_rng and not main.lines.any(func(line): return line.text == REST_NOTE), label + ": story consumes no encounter roll and never heals")
		# Finish the real dialogue, which invokes the actual story battle callback.
		while not main.lines.is_empty(): main.advance()
		check(main.battle.visible and main.battle_story == "story:" + expected_id and main.battle.kind == ("trainer" if beat.has("team") else "wild"), label + ": real dialogue callback opens its story battle")

func _test_story() -> void:
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			_reset("thornwood_route", family, starter)
			var label: String = starter + "/" + family
			_story_case(10, [], {}, "", label + ": 10 to 11")
			_story_case(11, [], {}, "rival2", label + ": 11 to 12")
			main._after_story("rival2", "ran")
			check(main.story_retry.get("rival2") == 16 and not main.story_done.has("rival2"), label + ": unsuccessful Wren encounter retries after four explorations")
			_story_case(14, [], { "rival2": 16 }, "", label + ": retry still waiting at 15")
			_story_case(15, [], { "rival2": 16 }, "rival2", label + ": retry becomes due at 16")
			_story_case(11, ["rival2"], {}, "", label + ": completed Wren does not repeat")
			_story_case(18, ["rival2"], {}, "", label + ": guardian still waiting at 19")
			_story_case(19, ["rival2"], {}, "elder", label + ": 19 to 20")
			main._after_story("elder", "won")
			check(main.story_retry.get("elder") == 26 and not main.story_done.has("elder"), label + ": an unbeaten bond retries the guardian after six explorations")
			_story_case(24, ["rival2"], { "elder": 26 }, "", label + ": guardian retry waiting at 25")
			_story_case(25, ["rival2"], { "elder": 26 }, "elder", label + ": guardian retry due at 26")
			_story_case(19, [], {}, "rival2", label + ": overdue Wren retains precedence over guardian")
			_story_case(25, ["rival2", "elder"], {}, "", label + ": completed beats and Warden gate do not interrupt")
	for where in EARLY_MAPS:
		_reset(where)
		_story_case(11, [], {}, "rival2", where + ": all Thornwood maps share the existing story counter")
		main.team[0].hp = 0
		main.lines.clear()
		main.then_do = Callable()
		main.battle.visible = false
		main.explored_in = { "thornwood": 19 }
		main.story_done = { "rival2": true }
		main._explore()
		check(main.lines.size() == 1 and main.lines[0].text == EXHAUSTED and main.explored_in.thornwood == 19 and not main.then_do.is_valid(), where + ": exhausted guard precedes even a due guardian")

func _test_first_catch() -> void:
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			_reset("thornwood_route", family, starter)
			main.ranch.clear()
			main.story_done.erase("marenRanchTip")
			main.team[0].hp = 1
			main.rng.seed = int(seeds.wild)
			main._explore()
			check(main.battle.visible and main.battle.kind == "wild" and main.battle.sure_catch and main.bag.lures == 5 and main.team[0].hp == 1, "%s/%s: first wild meeting still supplies five lures and sure catch, without healing" % [starter, family])
			main.battle.visible = false
			main.bag.lures = 0
			main.story_done.marenRanchTip = true
			main.rng.seed = int(seeds.wild)
			main._explore()
			check(main.battle.visible and not main.battle.sure_catch and main.bag.lures == 0, "%s/%s: completed first catch does not repeat guidance or replenish lures" % [starter, family])

func _test_existing_healers() -> void:
	for starter in main.DATA.STARTERS:
		for family in FAMILIES:
			for healer in ["maren", "inn"]:
				_reset("larkhaven", family, starter)
				main.team.append(main.R.make("ripplet", 6, { "rar": 1 }, main.rng))
				main.team.append(main.R.make("mosshog", 7, { "rar": 1 }, main.rng))
				main.team[0].hp = 0
				main.team[1].hp = 1
				main.team[2].hp = int(main.R.stats(main.team[2]).hp) - 1
				var expected: Array = main.team.duplicate(true)
				for creature in expected: creature.hp = int(main.R.stats(creature).hp)
				var bag_before: Dictionary = main.bag.duplicate(true)
				var ranch_before: Array = main.ranch.duplicate(true)
				if healer == "maren": main._maren_heals()
				else: main._door("inn")
				check(main.team == expected and main.bag == bag_before and main.ranch == ranch_before, "%s/%s/%s: original free full healing still revives fainted partners and preserves other state" % [starter, family, healer])

func _test_legacy_save() -> void:
	_reset()
	var fixture_text := FileAccess.get_file_as_string(LEGACY)
	var legacy: Dictionary = JSON.parse_string(fixture_text)
	main.save_path = SCRATCH + "/legacy.json"
	check(main.no_save and not main.SafeSave.exists(main.save_path), "legacy fixture starts at a new scratch path with normal saving disabled")
	check(main.SafeSave.write(main.save_path, legacy) and main._load_game(), "the real save writer and loader accept the frozen pre-change v1 fixture")
	main._switch()
	main.trans_t = -1.0
	check(main.stage == "free" and main.map_name == legacy.map and main.me.tile == Vector2i(int(legacy.x), int(legacy.y)), "legacy location survives the real load transition")
	check(main.my_look.name == legacy.look.name and main.heritage() == legacy.look.heritage and main.partner.id == legacy.partner, "legacy name, heritage, and partner survive")
	check(_json(main.team) == legacy.team and _json(main.ranch) == legacy.ranch, "legacy creature HP, species, nickname, level, XP, moves, traits, potential and trust survive exactly")
	check(_json(main.bag) == legacy.bag and _json(main.badges) == legacy.badges and _json(main.story_done) == legacy.story and _json(main.story_retry) == legacy.retry and _json(main.explored_in) == legacy.explored, "legacy inventory, badges, story and exploration progress survive exactly")
	check(not Pace.is_early(main), "a loaded post-badge Thornwood save retains later pacing")
	var loaded_rng := RandomNumberGenerator.new()
	main.rng.seed = 466
	loaded_rng.seed = 466
	check(Pace.next_steps(main) == loaded_rng.randi_range(8, 16), "loaded earned-badge coast heritage retains the original 8-16 reset")
	main.lines.clear()
	check(not main.save_game() and FileAccess.get_file_as_string(main.save_path) == JSON.stringify(legacy), "no_save prevents an incidental write over the loaded fixture")
	# Write the loaded state to a different, previously nonexistent scratch file.
	# This is the only time the normal writer is enabled, under the verified HOME.
	main.save_path = SCRATCH + "/roundtrip.json"
	check(not main.SafeSave.exists(main.save_path), "roundtrip destination is fresh")
	main.no_save = false
	var saved: bool = main.save_game()
	main.no_save = true
	check(saved, "loaded legacy state can be saved through the current real writer")
	var roundtrip: Dictionary = main.SafeSave.read(main.save_path)
	var keys: Array = roundtrip.keys()
	var expected_keys: Array = SAVE_KEYS.duplicate()
	keys.sort()
	expected_keys.sort()
	check(keys == expected_keys and int(roundtrip.get("v", -1)) == 2, "save schema remains the existing v2 keys; no early-pace flag, timer, or counter is persisted")
	var expected_taught: Array = legacy.taught.duplicate()
	for badge in legacy.badges:
		if main.TEACHERS.has(badge) and main.TEACHERS[badge].order not in expected_taught:
			expected_taught.append(main.TEACHERS[badge].order)
	check(roundtrip.taught == expected_taught, "legacy taught moves retain the loader's existing earned-badge default")
	for field in ["team", "ranch", "bag", "badges", "story", "retry", "explored", "items", "seen", "bonded", "egg", "gear", "letter", "festival", "spire", "rematches", "bondDay", "keysLearned", "map", "x", "y", "partner", "look", "restore", "beaten", "calendar", "league"]:
		check(roundtrip.get(field) == legacy.get(field), "legacy roundtrip preserves " + field)
	check(main._load_game(), "the emitted v2 save reloads through the real loader")
	check(_json(main.team) == legacy.team and _json(main.ranch) == legacy.ranch, "roundtrip reload preserves exact creature state")
	# A legacy save missing a heritage defaults to farm without a new saved flag.
	var missing: Dictionary = legacy.duplicate(true)
	missing.look.erase("heritage")
	missing.badges = []
	missing.taught = []
	missing.map = "thornwood_route"
	main.save_path = SCRATCH + "/missing-heritage.json"
	check(main.no_save and not main.SafeSave.exists(main.save_path) and main.SafeSave.write(main.save_path, missing) and main._load_game(), "a missing-heritage pre-badge legacy save loads from a new scratch path")
	main._switch()
	main.trans_t = -1.0
	check(main.heritage() == "farm" and Pace.is_early(main) and _json(main.team) == missing.team, "legacy missing heritage defaults to farm and gains early eligibility without HP changes on load")
	main.lines.clear()
	main.letter_steps = 1000000
	var loaded_before: Array = main.team.duplicate(true)
	var loaded_expected: Array = loaded_before.duplicate(true)
	for creature in loaded_expected:
		var cap: int = main.R.stats(creature).hp
		if int(creature.hp) > 0 and int(creature.hp) < cap:
			creature.hp = mini(cap, int(creature.hp) + maxi(1, roundi(cap * 0.3)))
	main.rng.seed = _arrival_seed(4, 8, 4)
	main.grass_n = 1
	main._arrived(_tile(true))
	check(main.grass_n == 4 and main.team == loaded_expected and main.lines.size() == 1 and main.lines[0].text == REST_NOTE, "real arrival on a loaded zero-badge legacy save uses farm pacing and quiet recovery")
	check(FileAccess.get_file_as_string(main.save_path) == JSON.stringify(missing), "playing the loaded zero-badge fixture does not alter its source save")
	check(FileAccess.get_file_as_string(LEGACY) == fixture_text, "the committed legacy fixture remains byte-for-byte unchanged")
	for name in ["legacy.json", "roundtrip.json", "missing-heritage.json"]:
		main.SafeSave.remove(SCRATCH + "/" + name)
		check(not main.SafeSave.exists(SCRATCH + "/" + name), "generated " + name + " and any backup/spare are cleaned up")
	main.save_path = SCRATCH + "/disabled.json"

func _json(value: Variant) -> Variant:
	return JSON.parse_string(JSON.stringify(value))
