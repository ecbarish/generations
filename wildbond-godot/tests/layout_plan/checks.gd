extends SceneTree
var passed := 0
var failed := 0
func _initialize() -> void: run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok: passed+=1
	else: failed+=1; printerr("FAIL: "+title)
func run() -> void:
	var scene=load("res://tests/layout_plan/scene.gd").new()
	if "--private" not in OS.get_cmdline_user_args(): scene.pack_path="Z:/no-private-pack"
	root.add_child(scene)
	await process_frame
	check(not scene.blocked(scene.point(Vector2i(11,7))),"town start is walkable")
	check(scene.blocked(scene.point(Vector2i(4,2))),"inn footprint blocks movement")
	check(not scene.blocked(scene.point(Vector2i(4,4))),"inn door remains reachable")
	check(scene.blocked(scene.point(Vector2i(0,-9))),"existing pond remains solid water")
	check(not scene.blocked(scene.point(Vector2i(-7,7))),"planned west lane can be walked")
	check(scene.blocked(scene.point(Vector2i(-15,7))),"Larkburrow mouth stays closed")
	var before: Vector3=scene.player.position
	scene.move_player(Vector2.UP,.15)
	check(scene.player.position.z<before.z,"trainer moves in measured layout")
	scene.player.position=scene.point(Vector2i(-7,7))
	scene.toggle_plan()
	check(not scene.proposed and not scene.lane_geometry.visible,"current-mode toggle hides candidate lane")
	check(scene.blocked(scene.point(Vector2i(0,7))),"current mode restores west tree boundary")
	check(scene.player.position==scene.point(Vector2i(11,7)),"switching off lane returns its visitor to a valid source start")
	scene.toggle_plan()
	check(scene.proposed and scene.lane_geometry.visible,"planned mode restores west lane")
	scene.player.position=scene.point(Vector2i(4,5))
	scene.inspect()
	check("HEALING" in scene.note.text,"door inspection describes existing role")
	scene.overhead=true
	scene._update_camera()
	check(scene.camera.projection==Camera3D.PROJECTION_ORTHOGONAL,"overhead mode shows measured layout")
	if "--private" in OS.get_cmdline_user_args(): check(scene.pack.trainer_texture(false)!=null and scene.pack.trainer_texture(true)!=null,"private walking/running trainer retained")
	scene.queue_free()
	await process_frame
	await process_frame
	print("Layout native checks: %d passed, %d failed" % [passed,failed])
	quit(1 if failed else 0)
