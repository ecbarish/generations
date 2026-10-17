extends SceneTree
var passed := 0
var failed := 0
var elapsed := 0.0

func _process(dt: float) -> bool:
	elapsed += dt
	if elapsed > 15:
		print("Wildbond round battle checks: TIMED OUT after a script error")
		quit(3)
	return false

func _initialize() -> void:
	run.call_deferred()

func check(ok: bool, label: String) -> void:
	if ok: passed += 1
	else:
		failed += 1
		print("FAIL: ", label)

func run() -> void:
	preload("res://tests/battle_slice/checks.gd").run(check)
	var view = load("res://tests/battle_slice/play.tscn").instantiate()
	root.add_child(view)
	await process_frame
	check(view.buttons.size() == 6, "playable scene exposes six real controls")
	for i in view.buttons.size():
		check(Rect2(0, 0, 384, 216).encloses(view.buttons[i].get_rect()), "command target stays inside viewport")
		for j in range(i + 1, view.buttons.size()):
			check(not view.buttons[i].get_rect().intersects(view.buttons[j].get_rect()), "command targets do not overlap")
	# Send real UI input to focus/activate Fight, rather than invoking the handler.
	var key := InputEventKey.new()
	key.keycode = KEY_ENTER
	key.pressed = true
	root.push_input(key)
	key = key.duplicate()
	key.pressed = false
	root.push_input(key)
	await process_frame
	check(view.page == "moves" and view.buttons.size() == 4, "keyboard opens actual move controls")
	check("<null>" not in view.message, "move description uses player language for an untyped move")
	view.queue_free()
	await process_frame
	print("Wildbond round battle checks: %d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 or passed < 300 else 0)
