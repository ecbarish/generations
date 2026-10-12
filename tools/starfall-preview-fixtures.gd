extends SceneTree
## Run only in an isolated checkout of the previous shipped Starfall source.
var game: Node
func _initialize() -> void:
	game = load("res://scenes/main.tscn").instantiate()
	game.no_save = true
	root.add_child(game)
	write_fixture.call_deferred()
func write_fixture() -> void:
	game.set_process(false)
	game.lines.clear()
	game.day = 7
	game.coins = 321
	game.rank = 1
	game.meals = 12
	game.built = {"west": {"what": "healer", "left": 0.0}}
	game.me.tile = Vector2i(14, 10)
	game.me.pos = Vector2(game.me.tile) * game.TILE
	game.no_save = false
	game.save_path = OS.get_environment("FIXTURE_OUTPUT")
	game.save_game()
	if not FileAccess.file_exists(game.save_path):
		quit(1)
		return
	print("Legacy Starfall fixture written by the previous shipped source")
	game.queue_free()
	await process_frame
	quit()
