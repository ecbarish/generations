extends RefCounted
## WB4.3 part 2: ChatGPT's T58 placed. The three pieces of evidence appear after the wild bond, one after another,
## beside their keepers and off the path; the reveal waits by Hollowecho's warm stones until all three are seen and
## the league is won; then depth returns and each Warden has a line for afterwards.
static func run(main: Node, check: Callable) -> void:
	var keep_story: Dictionary = main.story_done.duplicate()
	var keep_map: String = main.map_name
	var keep_tile: Vector2i = main.me.tile
	var keep_face: Vector2i = main.me.face
	var keep_stage: String = main.stage
	main.stage = "free"
	main.lines.clear()
	for k in main.story_done.keys():
		if str(k).begins_with("saw:") or k in ["wildBond", "rememberedWhole", "depthReturns"] or str(k).begins_with("wardenAfter:"):
			main.story_done.erase(k)
	check.call(main.REVEAL.get("observations", []).size() == 3 and main.REVEAL.reveal.lines.size() > 10, "the reveal: T58's writing is in the game")
	for e in main.EVIDENCE:
		check.call(not main._observation(e.id).is_empty(), "the reveal: %s has its writing" % e.id)
		var rows: Array = main.DATA.MAPS[e.where].rows
		check.call(str(rows[e.at.y])[e.at.x] in [",", "\"", "_"], "the reveal: %s lies off the path, on open ground (%s)" % [e.id, str(rows[e.at.y])[e.at.x]])
	main._set_map("hollowecho")
	var first: Dictionary = main.EVIDENCE[0]
	check.call(main._evidence_at(first.at).is_empty() and main.walkable(first.at), "the reveal: nothing to find before the wild bond has happened")
	main.story_done["wildBond"] = true
	check.call(not main._evidence_at(first.at).is_empty() and not main.walkable(first.at), "the reveal: after the wild bond, Orri's second rubbing lies beside Orri")
	main._set_map("farwatch")
	check.call(main._evidence_at(main.EVIDENCE[1].at).is_empty(), "the reveal: Ceryn's survey waits until the rubbing has been seen")
	main._set_map("hollowecho")
	main.me.tile = first.at + Vector2i.DOWN
	main.me.face = Vector2i.UP
	check.call(main.action_word() == "Look", "the reveal: facing the rubbing, the button says Look")
	check.call(main._talk_here() and main.story_done.has("saw:restraintRubbing"), "the reveal: you can look at it")
	check.call(main.lines.any(func(l): return "Give no bond" in str(l.text)) and main.lines.any(func(l): return l.who == "orri"), "the reveal: you read the commands, and Orri explains")
	main.lines.clear()
	main._talk_here()
	check.call(main.lines.any(func(l): return "Give no bond" in str(l.text)), "the reveal: it can be read again")
	main.lines.clear()
	main._set_map("farwatch")
	check.call(not main._evidence_at(main.EVIDENCE[1].at).is_empty(), "the reveal: then Ceryn's survey sheet")
	main.story_done["saw:missingShoreSurvey"] = true
	main._set_map("stillreed")
	check.call(not main._evidence_at(main.EVIDENCE[2].at).is_empty(), "the reveal: then Sivet's paired ferry leaf")
	main.story_done["saw:pairedFerryLeaf"] = true
	check.call(not main._reveal_ready(), "the reveal: waits for the league to be won")
	main.story_done["leagueEnding"] = true
	check.call(main._reveal_ready(), "the reveal: ready once all three are seen and the league is won")
	main.guests.clear()
	main._set_map("hollowecho")
	main._stage_reveal()
	var toren = null
	for g in main.guests:
		if g.id == "toren": toren = g
	check.call(toren != null and main.guests.size() == 2, "the reveal: Toren and Isolde wait by the warm stones")
	for g in main.guests:
		check.call(main.walkable(g.tile + Vector2i.DOWN) or main.walkable(g.tile + Vector2i.UP) or main.walkable(g.tile + Vector2i.LEFT) or main.walkable(g.tile + Vector2i.RIGHT), "the reveal: you can reach %s" % g.id)
	main.me.tile = toren.tile + Vector2i.DOWN
	main.me.face = Vector2i.UP
	check.call(main.action_word() == "Talk", "the reveal: beside Toren the button says Talk")
	check.call(main._talk_here() and main.story_done.has("rememberedWhole") and main.story_done.has("depthReturns"), "the reveal: talking to Toren begins it")
	check.call(main.lines.any(func(l): return "Two figures, one shadow" in str(l.text)) and main.lines.any(func(l): return "remembers room for you both" in str(l.text)), "the reveal: the truth, then depth returns")
	main.lines.clear()
	main._talk_here()
	check.call(main.lines.size() == 1 and main.lines[0].who == "toren", "the reveal: afterwards Toren has a quiet line, not the scene again")
	main.lines.clear()
	main.guests.clear()
	var warden = null
	for n in main.npcs:
		if n.id == "isolde": warden = n
	if warden != null:
		main.npc_info["isolde"].beaten = true
		main._set_map(warden.where)
		main.me.tile = warden.tile + Vector2i.DOWN
		main.me.face = Vector2i.UP
		main._talk_here()
		check.call(main.lines.any(func(l): return "room beneath the branches" in str(l.text)), "the reveal: Isolde says what has come back, once")
		main.lines.clear()
		main.npc_info["isolde"].beaten = false
	main.story_done = keep_story
	main._set_map(keep_map)
	main.me.tile = keep_tile
	main.me.face = keep_face
	main.stage = keep_stage
	main.guests.clear()
	main.lines.clear()
