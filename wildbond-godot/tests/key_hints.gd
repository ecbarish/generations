extends RefCounted
## WB-KEYS: the keys show in the world the first times they matter, then step aside; a save remembers them, and an
## older save (which already knows its way) never shows them.
static func run(main: Node, check: Callable) -> void:
	var keep: Dictionary = main.key_learn.duplicate()
	var keep_stage: String = main.stage
	var keep_demo: bool = main.demo
	main.demo = false
	main.lines.clear()
	main.stage = "free"
	main.walk_to.clear()
	var keep_trans: float = main.trans_t
	main.trans_t = -1.0
	main.key_learn = { "walk": 0, "act": 0, "book": 0 }
	check.call(main.key_hint("walk") == "arrows", "keys in the game: before you've walked, the arrow keys show over your head")
	for i in main.KEY_TIMES.walk:
		main.key_learn.walk += 1
	check.call(main.key_hint("walk") == "", "keys in the game: after a few steps the arrows step aside")
	main.lines.append({ "who": "maren", "text": "Hello." })
	check.call(main.key_hint("walk") == "" and main.key_hint("act") == "", "keys in the game: nothing over your head while someone speaks")
	main.lines.clear()
	var keep_tile: Vector2i = main.me.tile
	for n in main.npcs:
		if n.where == main.map_name:
			main.me.tile = n.tile + Vector2i.DOWN
			break
	check.call(main.action_word() == "Talk" and main.key_hint("act") == "E", "keys in the game: beside someone, E shows with what it does")
	main.me.tile = keep_tile
	main.key_learn.act = main.KEY_TIMES.act
	check.call(main.key_hint("act") == "", "keys in the game: after using it three times, Talk's key steps aside")
	if main._satchel_shown():
		check.call(main.key_hint("book") == "J", "keys in the game: J shows beside the bag until you've opened the field book")
	main.key_learn.book = 1
	check.call(main.key_hint("book") == "", "keys in the game: once the book has been opened, the J goes")
	main.key_learn = { "walk": 0, "act": 0, "book": 0 }
	main.key_learn = keep
	main.trans_t = keep_trans
	main.stage = keep_stage
	main.demo = keep_demo
