extends SceneTree
const Pack = preload("res://tests/private_sprites/pack.gd")
func _initialize():
	if OS.get_cmdline_user_args().is_empty():
		printerr("Pass the external library root, or a selected pack root followed by --selected")
		quit(1)
		return
	var root = OS.get_cmdline_user_args()[0]
	if "--selected" in OS.get_cmdline_user_args():
		var selected = Pack.new()
		if not selected.open_pack(root):
			printerr(selected.issue)
			quit(1)
			return
		print("SELECTED PACK: ",selected.entries.size()," species; ",selected.npcs.size()," NPC roles; native loader passed")
		quit(0)
		return
	var manifest_path = root.path_join("manifest.json")
	if FileAccess.file_exists(manifest_path):
		printerr("Refusing to overwrite an existing runtime manifest")
		quit(1)
		return
	var index = JSON.parse_string(FileAccess.get_file_as_string(root.path_join("library.json")))
	var verified = 0
	var failures = []
	var frame_checks = 0
	for sid in index.species:
		var entry = index.species[sid]
		if not entry.ready_for_pack: continue
		var e = entry.world.duplicate(true)
		e.name = entry.name
		e.source_id = entry.source_id
		e.battle = entry.battle[entry.preferred_style]
		e.display_height_m = 0.65
		var manifest = {"schema":1,"files":entry.files,"species":{sid:e}}
		var output = FileAccess.open(manifest_path,FileAccess.WRITE)
		output.store_string(JSON.stringify(manifest))
		output.close()
		var pack = Pack.new()
		if not pack.open_pack(root):
			failures.append({"id":sid,"issue":pack.issue})
			continue
		for state in ["Idle","Walk"]:
			for direction in 8:
				var frame = pack.world_frame(sid,state,direction,0.25)
				if frame.is_empty(): failures.append({"id":sid,"issue":"missing world frame"})
				frame_checks += 1
		for back in [false,true]:
			if pack.battle_frame(sid,back).is_empty(): failures.append({"id":sid,"issue":"missing battle frame"})
			frame_checks += 1
		verified += 1
	DirAccess.remove_absolute(manifest_path)
	var result = {"verified_species":verified,"frame_checks":frame_checks,"failures":failures}
	var result_file = FileAccess.open(root.path_join("native-verification.json"),FileAccess.WRITE)
	result_file.store_string(JSON.stringify(result,"  "))
	result_file.close()
	print("NATIVE LIBRARY: ",JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)
