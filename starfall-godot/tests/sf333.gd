extends SceneTree
## SF-PLAY: regression checks for the remaining #333 playtest failures.
## godot --headless --path starfall-godot --script res://tests/sf333.gd
## Optional real-display evidence: SF333_OUTPUT=/absolute/temp/path godot ... --script ...
## Every game starts with no_save. The save test uses only its own unique temporary path.
var game: Node2D
var passed := 0
var failed := 0
var errors: Array[String] = []
var completed: Array[String] = []
const SIZES := [Vector2i(320, 568), Vector2i(390, 844), Vector2i(844, 390), Vector2i(800, 600), Vector2i(1366, 768), Vector2i(1536, 864)]

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, label: String) -> void:
	if ok:
		passed += 1
	else:
		failed += 1
		errors.append(label)
		print("FAIL: ", label)

func fresh() -> void:
	if is_instance_valid(game):
		game.free()
	game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	root.add_child(game)
	game.set_process(false)
	game.music_on = false
	game.sfx.on = false
	game.lines.clear()
	game.rng.seed = 333

func _run() -> void:
	fresh()
	if OS.get_environment("SF333_OUTPUT") != "":
		await captures()
	else:
		pointer_and_pins()
		plan_layouts()
		await notices()
		meal_reports()
		brewing()
		goals_and_saves()
		check(completed.size() == 6, "all six test sections reached their final assertion")
	print("SF-PLAY #333 checks: %d passed, %d failed (Godot %s)" % [passed, failed, Engine.get_version_info().string])
	game.free()
	quit(0 if failed == 0 else 1)

## Send window-pixel events through Godot's actual stretch transform, not the UI handler.
func aim(at: Vector2, touch: bool) -> void:
	var e: InputEvent
	if touch:
		e = InputEventScreenTouch.new()
		e.index = 0
	else:
		e = InputEventMouseButton.new()
		e.button_index = MOUSE_BUTTON_LEFT
	e.position = root.get_final_transform() * at
	e.pressed = true
	Input.parse_input_event(e)
	Input.flush_buffered_events()
	e = e.duplicate()
	e.pressed = false
	Input.parse_input_event(e)
	Input.flush_buffered_events()

func pointer_and_pins() -> void:
	for size in SIZES:
		for fractional in [false, true]:
			root.size = size
			root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_FRACTIONAL if fractional else Window.CONTENT_SCALE_STRETCH_INTEGER
			for touch in [false, true]:
				for id in game.BUILDINGS:
					for edge in [0.1, 0.5, 0.9]:
						game.built = {}
						game.coins = 10000
						game.build_plot = "west"
						var plans: Array = game.plans()
						var r: Rect2 = game._plan_rect(plans.find(id), plans.size() + 1)
						game._update_ui()
						aim(r.position + Vector2(r.size.x * edge, r.size.y * 0.5), touch)
						check(game.built.get("west", {}).get("what", "") == id, "scaled %s %s %s %s card %s" % [size, fractional, touch, edge, id])
				game.built = {}
				game.build_plot = "west"
				aim(game._plan_rect(5, 6).get_center(), touch)
				check(game.build_plot == "", "scaled Not now dismisses %s %s %s" % [size, fractional, touch])
				game.board_open = true
				game.notices = ["slimes", "boar", "webs"]
				game.posted = []
				aim(game._note_rect(0).get_center(), touch)
				aim(game._note_rect(1).get_center(), touch)
				check(game.posted == ["slimes", "boar"], "second pin preserves the first %s %s %s" % [size, fractional, touch])
				game.board_open = false
				game.me.tile = Vector2i(15, 5)
				game.me.pos = Vector2(game.me.tile) * game.TILE
				game.me.path.clear()
				game.walk_to.clear()
				game.cam.position = game.me.pos + Vector2(8, 8)
				game.cam.reset_smoothing()
				game.cam.force_update_scroll()
				var target := Vector2i(16, 5)
				aim(game.get_canvas_transform() * (Vector2(target) * game.TILE + Vector2(8, 8)), touch)
				check(not game.walk_to.is_empty() and game.walk_to.back() == target, "scaled town target %s %s %s" % [size, fractional, touch])
	root.size = Vector2i(1536, 864)
	root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
	completed.append("pointer")
	fresh()

func plan_layouts() -> void:
	check(game.has_method("_plan_words"), "build cards measure all text blocks before drawing")
	if not game.has_method("_plan_words"):
		return
	var font := ThemeDB.fallback_font
	var ids: Array = game.BUILDINGS.keys()
	# All availability subsets, all plots, and both the affordable and unaffordable action.
	for mask in range(1 << ids.size()):
		if mask == 31:
			continue # Five buildings cannot occupy the four plots.
		game.built = {}
		var slot := 0
		for i in ids.size():
			if mask & (1 << i):
				game.built[game.PLOTS.keys()[slot]] = { "what": ids[i], "left": 0.0 }
				slot += 1
		var available: Array = game.plans()
		for plot in game.PLOTS:
			for i in available.size():
				var id: String = available[i]
				var r: Rect2 = game._plan_rect(i, available.size() + 1)
				for afford in [false, true]:
					var words: Array = game._plan_words(font, id, plot, r, afford)
					check(words.size() == 4 and words[0].text == game.BUILDINGS[id].name and words[2].text == game.BUILDINGS[id].text + game.plan_note(id, plot), "all card copy retained %s %s %s" % [mask, plot, id])
					for j in words.size():
						var w: Dictionary = words[j]
						var actual := font.get_multiline_string_size(w.text, HORIZONTAL_ALIGNMENT_LEFT, w.rect.size.x, w.size, -1, game.PLAN_WRAP)
						check(w.size >= 6 and actual.x <= w.rect.size.x and actual.y <= w.rect.size.y and r.encloses(w.rect), "whole text inside card %s %s %s %s %s" % [mask, plot, id, afford, j])
						if j > 0:
							check(words[j-1].rect.end.y + 2.0 <= w.rect.position.y, "card blocks separated %s %s %s %s %s" % [mask, plot, id, afford, j])
	# Real adjacency notes, which only occur after a neighboring building exists.
	for other in ["smithy", "yard"]:
		game.built = { "west": { "what": other, "left": 0.0 } }
		var id := "yard" if other == "smithy" else "smithy"
		var r: Rect2 = game._plan_rect(game.plans().find(id), game.plans().size()+1)
		var w: Array = game._plan_words(font,id,"north",r,false)
		check("double training" in w[2].text and w[2].rect.end.y + 2 <= w[3].rect.position.y, "adjacent training note fits for " + id)
	completed.append("layout")
	fresh()

func settle_ui() -> void:
	game._update_ui()
	await process_frame
	await process_frame
	game._update_ui()

func notices() -> void:
	var report := "Evening falls on day 4. Jobs done: 2. Meals served: 1. Helpings from the stew pot: 2. Tonics sold: 3. The guild earned 77 coins. The wall lamps all burned through the night. Bryn's wages paid. A good day; people are talking about Starfall."
	game.caption.text = report
	game.caption_t = 11.0
	for overlay in ["dialogue", "plans", "board", "shelf", "story"]:
		game.lines.clear()
		game.build_plot = "west" if overlay == "plans" else ""
		game.board_open = overlay == "board"
		game.shelf_open = overlay == "shelf"
		game.story_pick = { "h": game.heroes[0], "opts": game.stories.Aki[0].options } if overlay == "story" else {}
		if overlay == "dialogue":
			game.say("", "A dialogue that would overlap the evening notice.")
		await settle_ui()
		check(not game.caption.visible, "notice stays behind no " + overlay + " overlay")
		# A fraction of a second without reaching any new event must not consume hidden notice time.
		var left: float = game.caption_t
		game._process(0.01)
		check(game.caption_t == left, "hidden notice timer pauses for " + overlay)
	game.lines.clear()
	game.build_plot = ""
	game.board_open = false
	game.shelf_open = false
	game.story_pick = {}
	await settle_ui()
	check(game.caption.visible and game.caption.text == report and game.caption_t == 11.0, "full evening report returns after dismissal")
	check(Rect2(0,0,384,216).encloses(game.caption.get_rect()), "long report remains inside view")
	check(game.hint.text == "" or not game.caption.get_rect().intersects(game.hint.get_rect()), "long report does not overlap controls hint")
	game._process(0.2)
	check(is_equal_approx(game.caption_t,10.8), "visible notice timer resumes")
	completed.append("notices")
	fresh()

func waiting_guest() -> Variant:
	var h = game.heroes[0]
	h.tile = game.ORDER_AT
	h.pos = Vector2(h.tile) * game.TILE
	h.path.clear()
	h.a.state = "queue"
	h.a.waited = game.PATIENCE + 1.0
	game.queue.clear()
	game.queue.append(h)
	return h

func meal_reports() -> void:
	var h = waiting_guest()
	game._counter(0.1)
	check(game.today.meals == 0 and game.today.pot == 1 and game.today.earned == game.POT_MEAL, "self-served pot income retains its separate counter")
	check(game.meals == 0, "pot meals do not grant hand-cooking mastery")
	game._day(game.DAY_SECONDS)
	check("Helpings from the stew pot: 1." in game.caption.text and "earned 4 coins" in game.caption.text, "pot-only report explains the meal income")
	fresh()
	h = waiting_guest()
	game.serve(h,true)
	h = waiting_guest()
	game.serve(h,false)
	game._day(game.DAY_SECONDS)
	check("Meals served: 2." in game.caption.text and game.meals == 1, "hand and hired meals count, only hand service earns mastery")
	check(not "stew pot" in game.caption.text, "old daily fields without pot do not invent pot meals")
	completed.append("meals")
	fresh()

func brewing() -> void:
	game.built = { "west": { "what": "apothecary", "left": 0.0 } }
	game.herbs = 6
	game.stock = 0
	game.shelf_open = true
	game.shelf_pick(0)
	check(game.herbs == 4 and game.stock == 0 and game.batches == 1 and game.brewing == 3.0, "first batch spends two herbs and takes three seconds")
	game._brew(2.0)
	game._update_ui()
	check(game.stock == 0 and "(brewing)" in game.status.text, "pending tonics are identified during brewing")
	game.me.tile = game.PLOTS.west + Vector2i.DOWN * 2
	game.me.pos = Vector2(game.me.tile) * game.TILE
	check(game.use() and game.shelf_open, "player can return to the apothecary during a batch")
	for i in 5:
		game.shelf_pick(0)
	check(game.herbs == 4 and game.batches == 1 and game.brewing == 1.0 and "still brewing" in game.shelf_note, "repeated Brew cannot spend herbs or reset the batch")
	game._brew(1.1)
	check(game.stock == 3 and game.brewing == 0.0 and game.shelf_note == "", "the original batch finishes on schedule")
	game.shelf_pick(0)
	game._brew(3.1)
	check(game.stock == 6 and game.herbs == 2 and game.batches == 2, "a later batch still works")
	game.shelf_pick(0)
	check(game.herbs == 2 and game.brewing == 0.0, "a full shelf never spends herbs")
	brew_save_reload()
	completed.append("brewing")
	fresh()

## Exercise both same-instance and fresh-instance reloads; neither may finish a batch twice.
func brew_save_reload() -> void:
	for initial_stock in [0, 1, 3, 5]:
		for elapsed in [0.0, 1.0, 2.9]:
			for prior_batches in [0, 3]:
				fresh()
				game.built = { "west": { "what": "apothecary", "left": 0.0 } }
				game.herbs = 2
				game.stock = initial_stock
				game.batches = prior_batches
				game.shelf_pick(0)
				game._brew(elapsed)
				var expected := mini(game.TONIC_MAX, initial_stock + 3)
				var path := "user://sf333-brew-%d-%d.json" % [OS.get_process_id(), Time.get_ticks_usec()]
				game.save_path = path
				game.no_save = false
				for save in 3:
					game.save_game()
					var snapshot: Dictionary = game.SafeSave.read(path)
					check(snapshot.herbs == 0 and snapshot.stock == expected and snapshot.apprentice.batches == prior_batches + 1, "pending batch is saved exactly once")
					check(snapshot.apprentice.here == (prior_batches == 3), "fourth-batch arrival survives interruption")
					check(not snapshot.has("brewing") and snapshot.v == 1, "pending batch uses only existing save fields")
				check(game.stock == initial_stock and is_equal_approx(game.brewing,3.0-elapsed) and game.fen.where == "gone", "saving does not finish or mutate the live brew")
				check(game._load() and game.brewing == 0.0 and game.stock == expected, "same-instance load clears the old brewing timer")
				game._brew(5.0)
				check(game.stock == expected, "same-instance reload cannot finish the saved batch twice")
				# Two fresh reload/save cycles cannot duplicate a pending result.
				for reload in 2:
					fresh()
					game.save_path = path
					game.no_save = false
					check(game._load(), "load interrupted batch into a fresh instance")
					check(game.stock == expected and game.herbs == 0 and game.batches == prior_batches + 1 and game.brewing == 0.0, "fresh reload neither loses nor duplicates the batch")
					check((game.fen.where == "town") == (prior_batches == 3), "fresh reload retains the earned apprentice arrival")
					game._brew(5.0)
					game.save_game()
					check(game.stock == expected and game.SafeSave.read(path).stock == expected, "reload and another save do not mint extra tonics")
				game.SafeSave.remove(path)
				game.no_save = true

func plot_goal() -> String:
	for item in game.goals():
		if "empty plot" in item.text:
			return str(item.text)
	return ""

func goals_and_saves() -> void:
	game.total_jobs = 2
	for k in game.PLOTS:
		check(game.PLOTS[k].x > game.INN_DOOR.x and "east" in game.PLOT_DIRECTIONS[k], "player directions follow moved plot " + k)
	game.coins = 0
	check("Earn 110 more coins" in plot_goal() and not "See Hob's plans" in plot_goal(), "unaffordable plot asks for its actual shortfall")
	game.coins = 109
	check("Earn 1 more coin" in plot_goal(), "one-coin boundary uses the remaining amount")
	game.coins = 110
	check("empty plot east of the inn" in plot_goal() and "See Hob's plans" in plot_goal(), "exact cheapest cost makes the plot actionable")
	game.built = { "west": { "what": "apothecary", "left": 0.0 } }
	check("Earn 10 more coins" in plot_goal() and "farther east" in plot_goal(), "remaining plans determine the price and next plot")
	# A version-one fixture lacks all later optional systems. Its keys and values are retained.
	var legacy := { "v":1, "coins":77, "day":4, "day_t":12.0, "meals":3, "hired":false, "offered":false,
		"notices":["slimes","boar"], "posted":["slimes","boar"], "today":{"done":1,"failed":0,"meals":2,"earned":16},
		"me":[15,5], "built":{"west":{"what":"healer","left":0.0}}, "heroes":game.heroes.map(func(h): return h.a.duplicate(true)) }
	game.save_path = "user://sf333-%d-%d.json" % [OS.get_process_id(), Time.get_ticks_usec()]
	game.no_save = false
	check(game.SafeSave.write(game.save_path,legacy), "write isolated legacy fixture")
	check(game._load() and game.coins == 77 and game.day == 4 and game.meals == 3 and game.built.west.what == "healer", "legacy save keeps progress and original plot keys")
	check(game.posted == ["slimes","boar"] and game.today.meals == 2, "legacy pins and daily totals survive")
	game._day(game.DAY_SECONDS)
	check("Meals served: 2." in game.caption.text, "legacy daily report works without a pot field")
	game.save_game()
	var saved: Dictionary = game.SafeSave.read(game.save_path)
	check(saved.v == 1 and saved.built.has("west") and not saved.has("brewing") and not saved.has("plot_directions"), "no save version, plot-key or new-field change")
	game.SafeSave.remove(game.save_path)
	game.no_save = true
	completed.append("saves")
	fresh()

## Reuses the renderer already installed by the existing opening-view workflow if its owner enables it.
## Captures cannot silently fall back to headless/dummy pixels.
func captures() -> void:
	var out := OS.get_environment("SF333_OUTPUT")
	check(out.is_absolute_path() and DisplayServer.get_name() != "headless", "capture needs an absolute temporary folder and a real display")
	if failed > 0:
		return
	DirAccess.make_dir_recursive_absolute(out)
	var manifest := { "source": OS.get_environment("SOURCE_SHA"), "engine": Engine.get_version_info().string, "display": DisplayServer.get_name(), "captures": [] }
	root.mode = Window.MODE_WINDOWED
	root.borderless = true
	root.position = Vector2i.ZERO
	for size in [Vector2i(1366,768),Vector2i(844,390),Vector2i(390,844)]:
		root.size = size
		root.content_scale_stretch = Window.CONTENT_SCALE_STRETCH_FRACTIONAL if size.x < 1000 else Window.CONTENT_SCALE_STRETCH_INTEGER
		for state in ["plans", "plans-unaffordable", "dialogue-notice", "evening-notice", "brewing"]:
			fresh()
			game.caption.text = "Evening falls on day 4. Jobs done: 2. Meals served: 1. Helpings from the stew pot: 2. Tonics sold: 3. The guild earned 77 coins. The wall lamps all burned through the night. Bryn's wages paid. A good day; people are talking about Starfall."
			game.caption_t = 11.0
			if state.begins_with("plans"):
				game.build_plot = "west"
				game.coins = 10 if state.ends_with("unaffordable") else 1000
			elif state == "dialogue-notice":
				game.say("", "The notice will wait while we talk. There is room to read every word.")
			elif state == "brewing":
				game.built = {"west":{"what":"apothecary","left":0.0}}
				game.herbs = 6
				game.shelf_pick(0)
				game.shelf_open = true
				game.shelf_pick(0)
			game._update_ui()
			game.queue_redraw()
			await process_frame
			await process_frame
			await RenderingServer.frame_post_draw
			await create_timer(0.1).timeout
			game._update_ui()
			await RenderingServer.frame_post_draw
			var name := "%dx%d-%s.png" % [size.x,size.y,state]
			var result: Array = []
			var pos := DisplayServer.window_get_position()
			var rc := OS.execute("import",PackedStringArray(["-window","root","-crop","%dx%d%+d%+d" % [size.x,size.y,pos.x,pos.y],"+repage",out.path_join(name)]),result,true)
			check(rc == 0 and FileAccess.file_exists(out.path_join(name)), "actual capture " + name)
			if FileAccess.file_exists(out.path_join(name)):
				var img := Image.load_from_file(out.path_join(name))
				check(img != null and img.get_size() == size, "capture dimensions " + name)
			manifest.captures.append({"file":name,"size":[size.x,size.y],"state":state})
	manifest.errors = errors
	manifest.passed = failed == 0
	var f := FileAccess.open(out.path_join("manifest.json"),FileAccess.WRITE)
	f.store_string(JSON.stringify(manifest,"\t"))
	f.close()
