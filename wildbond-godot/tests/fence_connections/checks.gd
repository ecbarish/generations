extends SceneTree
## Fence rail connections on the expanded paddock (soft-ground stack). Args: <output dir> [--fallback]
var scene: Node3D
var passed := 0
var failed := 0
func _initialize() -> void:run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok:passed+=1
	else:failed+=1;print("FAIL: ",title)
func settle(count := 25) -> void:
	for i in count:await process_frame
func rails(node: Node, found: Array) -> void:
	for child in node.get_children():
		if child is MeshInstance3D and child.mesh is BoxMesh and is_equal_approx(child.mesh.size.y,.09):
			var at: Vector3=child.global_position
			if absf(at.y-.28)<.01 or absf(at.y-.63)<.01:found.append([at,child.mesh.size])
		rails(child,found)
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():quit(2);return
	var output: String=args[0];DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/soft_ground/play.tscn").instantiate()
	root.add_child(scene)
	await settle(40)
	check(scene.no_save and scene.save_path!=scene.Profile.PATH and not FileAccess.file_exists(scene.save_path),"isolated unsaved audition, real profile never selected")
	var map=scene.world_map
	var fence := {}
	for cell in map.cells:
		if map.glyph(cell)=="=":fence[cell]=true
	var found := []
	rails(scene,found)
	var cell_half: float=scene.Map.CELL*.5
	# Every rail is a half-cell segment from a fence post toward an adjacent fence post.
	var by_cell := {}
	var seen := {}
	var ok_shape := true
	var ok_target := true
	for rail in found:
		var at: Vector3=rail[0];var size: Vector3=rail[1]
		var key := "%.3f,%.3f,%.3f" % [at.x,at.y,at.z]
		seen[key]=true
		var along_x := is_equal_approx(size.x,cell_half) and is_equal_approx(size.z,.09)
		var along_z := is_equal_approx(size.z,cell_half) and is_equal_approx(size.x,.09)
		if not (along_x or along_z):ok_shape=false;continue
		var step := Vector3(scene.Map.CELL*.25,0,0) if along_x else Vector3(0,0,scene.Map.CELL*.25)
		var a: Vector2i=scene.Map.tile(Vector3(at.x,0,at.z)-step)
		var b: Vector2i=scene.Map.tile(Vector3(at.x,0,at.z)+step)
		var owner: Vector2i=a if fence.has(a) and scene.Map.point(a).distance_to(Vector3(at.x,0,at.z)-step)<.01 else b
		var other: Vector2i=b if owner==a else a
		if not (fence.has(owner) and fence.has(other)):ok_target=false
		by_cell[owner]=by_cell.get(owner,0)+1
	check(ok_shape,"every rail is a half-cell segment on one axis")
	check(ok_target,"no rail connects to a non-fence tile or spans the entrance")
	var ok_count := true
	for cell in fence:
		var neighbours := 0
		for step in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
			if fence.has(cell+step):neighbours+=1
		if by_cell.get(cell,0)!=neighbours*2:ok_count=false;print("  cell ",cell," rails ",by_cell.get(cell,0)," expected ",neighbours*2)
	check(ok_count,"each fence post has two rails toward every fence neighbour (runs, corners, ends)")
	check(found.size()==seen.size(),"no two rails share a position")
	if not scene.compact:
		for corner in [Vector2i(17,16),Vector2i(26,16),Vector2i(17,22),Vector2i(26,22)]:
			check(fence.has(corner) and by_cell.get(corner,0)==4,"corner joins both axes at "+str(corner))
		check(not fence.has(Vector2i(21,22)),"entrance stays open")
		for end in [Vector2i(20,22),Vector2i(22,22)]:check(by_cell.get(end,0)==2,"entrance end post has one side only at "+str(end))
		check(not map.blocked(scene.Map.point(Vector2i(21,22))) and map.blocked(scene.Map.point(Vector2i(20,22))),"collision unchanged: gap walkable, fence solid")
		scene.player.position=scene.Map.point(scene.Spacious.ANCHORS.paddock)
		check(scene._nearest().get("kind")=="paddock","paddock interaction anchor unchanged")
	if DisplayServer.get_name()!="headless":
		for view in [["paddock-south",Vector2i(21,24)],["paddock-west",Vector2i(14,19)]]:
			scene.player.position=scene.Map.point(view[1]);scene._reset_follow();scene._update_camera()
			await settle();await RenderingServer.frame_post_draw
			check(root.get_texture().get_image().save_png(output.path_join(view[0]+".png"))==OK,"capture "+view[0])
	check(not FileAccess.file_exists(scene.save_path),"still no save written")
	print("Fence connections: %d passed, %d failed; rails=%d posts=%d renderer=%s; %s" % [passed,failed,found.size(),fence.size(),RenderingServer.get_current_rendering_method(),output])
	scene.queue_free();await settle(3)
	quit(1 if failed else 0)
