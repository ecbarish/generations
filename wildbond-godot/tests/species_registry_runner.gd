extends SceneTree
## Focused registry checks; normal run_tests.gd also runs the same cases.
var main: Node
var passed := 0
var failed := 0

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	run.call_deferred()

func check(ok: bool, label: String) -> void:
	if ok: passed += 1
	else:
		failed += 1
		print("FAIL: ", label)

func run() -> void:
	main.register.keep = false
	preload("res://tests/species_registry.gd").run(main, check)
	print("Wildbond registry checks: %d passed, %d failed" % [passed, failed])
	main.queue_free()
	await process_frame
	quit(1 if failed > 0 or passed < 1000 else 0)
