extends SceneTree
## Synthetic review journeys written by the pre-WD3 game, using its real save writer.
## Run this only in an isolated checkout of 26bd1a6, never against a player's files.
var main: Node

func _initialize() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	main.settings.keep = false
	main.show_howto = false
	root.add_child(main)
	write_fixtures.call_deferred()

func write_fixtures() -> void:
	DirAccess.make_dir_recursive_absolute("res://frames/preview-fixtures")
	main._skip_opening()
	main.set_process(false)
	main.register.visible = false
	main.card.visible = false
	main.howto.visible = false
	main.title.visible = false
	main.lines.clear()
	main.stage = "free"
	main.battle.visible = false
	main.no_save = false
	main.my_look.name = "Review Rowan"
	main.team = [main.R.make("cindercub", 30, { "rar": 1 }, main.rng)]
	for starter in main.starters:
		if starter.id == "cindercub": main.partner = starter
	main.seen["cindercub"] = true
	main.bonded["cindercub"] = true
	main.team[0].hp = main.R.stats(main.team[0]).hp
	main.team[0]["hold"] = 999
	main.bag.coins = 321
	main.bag.lures = 17
	main.story_done["bench"] = true
	for scenario in [["barn", "barn", 2, 9], ["thornwood", "thornwood", 13, 14], ["champion", "league", 1, 15]]:
		if scenario[0] == "champion":
			main.story_done["leagueChampion"] = true
			main.story_done["leagueEnding"] = true
			main.badges = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
			main.team[0].lvl = 80
			main.team[0].hp = main.R.stats(main.team[0]).hp
		main._set_map(scenario[1])
		main.me.where = scenario[1]
		main.me.tile = Vector2i(scenario[2], scenario[3])
		main.me.pos = Vector2(main.me.tile) * main.TILE
		main.me.path.clear()
		main.trans_t = -1.0
		main.save_path = "res://frames/preview-fixtures/%s.json" % scenario[0]
		main.save_game()
		if not FileAccess.file_exists(main.save_path):
			push_error("Legacy fixture was not written: " + main.save_path)
			quit(1)
			return
		print("Legacy fixture: " + main.save_path)
	main.queue_free()
	await process_frame
	quit()
