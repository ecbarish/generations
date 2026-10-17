extends SceneTree
var passed := 0
var failed := 0
func _initialize() -> void: run.call_deferred()
func check(ok: bool, message: String) -> void:
	if ok: passed+=1
	else:
		failed+=1
		printerr("FAIL: "+message)
func run() -> void:
	await preload("res://tests/town/checks.gd").run(self,check,"--private" in OS.get_cmdline_user_args())
	print("Wildbond town checks: %d passed, %d failed" % [passed,failed])
	quit(1 if failed else 0)
