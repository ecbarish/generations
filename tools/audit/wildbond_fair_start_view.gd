extends SceneTree
## WBL-2 evidence: a wild battle against a much quicker foe, 3.5 s after it opens (fog and intro take 2.4 s).
## Before the fix the foe has often struck already; after it, the battle waits on your menu. Never saves.
##   SHOT_OUT=out xvfb-run -a -s '-screen 0 2000x1200x24' Godot --path wildbond-godot --audio-driver Dummy \
##     --rendering-method gl_compatibility --script ../tools/audit/wildbond_fair_start_view.gd -- --skip-opening --at=thornwood_route
var main: Node
func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	run.call_deferred()
func run() -> void:
	for i in 10:
		await process_frame
	main.lines.clear()
	var foe: Dictionary = main.R.make("cindercub", 30, { "rar": 1 }, main.rng)
	main.battle.open("wild", main.team, [foe], "")
	main.battle.foes[0].atb = main.R.ACT_AT - 0.01
	var t0 := Time.get_ticks_msec()
	while Time.get_ticks_msec() - t0 < 3500:
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_viewport().get_texture().get_image().save_png(OS.get_environment("SHOT_OUT") + "/fair-start.png")
	print("state ", main.battle.state, " hp ", main.battle.allies[0].c.hp, "/", main.R.stats(main.battle.allies[0].c).hp)
	quit()
