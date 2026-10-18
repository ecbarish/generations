extends "res://tests/opening/capture.gd"
func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():quit(2);return
	output=args[0];DirAccess.make_dir_recursive_absolute(output)
	scene=load("res://tests/opening/play.tscn").instantiate()
	scene.save_path="user://wb_actor_capture_%d.json" % OS.get_process_id();scene.no_save=true
	if "--fallback" in args:scene.pack_path="Z:/no-private-pack"
	root.add_child(scene);await process_frame
	scene.start_journey("pokemon:194");scene.close_dialogue()
	for row in [["town-actors",11,8],["maren",10,11],["wren",12,7],["pip",20,7],["bram",10,-13]]:
		at(Vector2i(row[1],row[2]));await snap(row[0])
	at(Vector2i(4,5));scene.change_room("center");scene.player.position=Vector3(61.5,0,.4);scene._update_camera()
	await snap("healer")
	scene.heal_party();scene.close_dialogue();scene.heal_time=5
	await snap("healer-bow")
	scene.change_room("town");at(Vector2i(18,5));scene.change_room("mart");scene.player.position.z=.4;scene._update_camera()
	await snap("shopkeeper")
	scene.change_room("town")
	for sid in scene.Catalogue.IDS:
		scene.selected=sid;scene._refresh_creature()
		scene.supplies.team=[scene.profile.assign(scene.Catalogue.creature(sid))]
		at(Vector2i(15,-8));scene._animate_partner()
		await snap("creature-"+str(scene.Catalogue.NAMES[sid]).to_lower())
	scene.Art.cache.clear();scene.queue_free()
	for i in 3:await process_frame
	print("Actor native captures: six NPC roles, nurse bow, three creatures completed.")
	quit()
