extends SceneTree
# SF2.13 capture: stand beside two adventurers, one with a few marks of trust and one trusted.
var main: Node2D
func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	root.add_child(main)
	_go.call_deferred()
func _go() -> void:
	for i in 10:
		await process_frame
	main.lines.clear()
	var a = main.heroes[0]
	var b = main.heroes[1]
	for h in [a, b]:
		h.path.clear()
		h.a.state = "town"
		h.a.timer = 999.0
	a.tile = Vector2i(15, 11); a.pos = Vector2(a.tile) * 16
	b.tile = Vector2i(17, 11); b.pos = Vector2(b.tile) * 16
	if "trust" in a.a or main.has_method("gain_trust"):
		a.a.trust = 3
		b.a.trust = 6
	main.me.tile = Vector2i(16, 12); main.me.pos = Vector2(main.me.tile) * 16
	main.cam.position_smoothing_enabled = false
	main.feels.clear(); main.barks.clear()
	for i in 6:
		for h in [a, b]:
			h.path.clear()
			h.pos = Vector2(h.tile) * 16
		await process_frame
	var args := OS.get_cmdline_user_args()
	root.get_texture().get_image().save_png(args[0] + "/" + args[1] + "-trust.png")
	if main.has_method("trusted"):
		main.talk_hero(b)
		for i in 6:
			await process_frame
		root.get_texture().get_image().save_png(args[0] + "/" + args[1] + "-trust-talk.png")
	quit()
