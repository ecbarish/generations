extends SceneTree
const Scene := preload("res://tests/thornwood_environment/scene.gd")
var passed := 0
var failed := 0

func _initialize() -> void:
	run.call_deferred()

func check(ok: bool, text: String) -> void:
	if ok: passed += 1
	else: failed += 1; print("FAIL: ",text)

func run() -> void:
	await preload("res://tests/thornwood_environment/checks.gd").run(self,check,"--private" in OS.get_cmdline_user_args())
	print("Thornwood environment checks: %d passed, %d failed" % [passed,failed])
	quit(1 if failed else 0)
