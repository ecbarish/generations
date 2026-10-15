extends RefCounted
## WBL-7: walking north never leaves the world. On every built map with a road north, Rowan holds Up (the real
## move_up action, as a player does) from a few steps below it. Each walk must end on the next map, or on the same map
## with a line saying why the road is shut, and the title page must never show. Puts everything back after.
static func run(main: Node, check: Callable) -> void:
	var keep := { "map": main.map_name, "tile": main.me.tile, "pos": main.me.pos, "face": main.me.face, "where": main.me.where,
		"stage": main.stage, "trans": main.trans_t }
	var keep_partner = null
	if main.partner:
		keep_partner = { "where": main.partner.where, "tile": main.partner.tile, "pos": main.partner.pos }
	var roads := 0
	for m in main.BUILT:
		var exit: Dictionary = main.DATA.MAPS[m].exits.get("N", {})
		if exit.is_empty():
			continue
		main._set_map(m)
		var rows: Array = main.cur_map()
		var gx: int = rows[0].find("N")
		if gx < 0:
			continue
		roads += 1
		var start := Vector2i(gx, 3)
		main.stage = "free"
		main.lines.clear()
		main.walk_to.clear()
		main.trans_t = -1.0
		main.me.where = m
		main.me.tile = start
		main.me.pos = Vector2(start) * main.TILE
		main.me.path.clear()
		if main.partner:
			main.partner.where = m
			main.partner.tile = start + Vector2i.DOWN
			main.partner.pos = Vector2(main.partner.tile) * main.TILE
			main.partner.path.clear()
		var title_seen := false
		Input.action_press("move_up")
		for i in 120:
			main._process(0.05)
			title_seen = title_seen or main.title.visible
			if main.battle.visible:                      # tall grass on the way: leave the battle and walk on
				main.battle.visible = false
				main.battle.state = ""
			if main.map_name != m or not main.lines.is_empty():
				break
		Input.action_release("move_up")
		for i in 30:
			main._process(0.05)
			title_seen = title_seen or main.title.visible
		var went: bool = main.map_name == str(exit.to)
		var told: bool = main.map_name == m and not main.lines.is_empty()
		check.call(not title_seen and (went or told),
			"walking north out of %s stays in the world: it reaches %s or says why not (now on %s, title %s)" % [m, exit.to, main.map_name, title_seen])
	check.call(roads >= 5, "the north-road walk covered every built road north (%d)" % roads)
	main.lines.clear()
	main._set_map(keep.map)
	main.me.tile = keep.tile
	main.me.pos = keep.pos
	main.me.face = keep.face
	main.me.where = keep.where
	main.me.path.clear()
	main.stage = keep.stage
	main.trans_t = keep.trans
	if keep_partner:
		main.partner.where = keep_partner.where
		main.partner.tile = keep_partner.tile
		main.partner.pos = keep_partner.pos
		main.partner.path.clear()
