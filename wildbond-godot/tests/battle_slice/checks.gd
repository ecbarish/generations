extends RefCounted
const Fixture := preload("res://tests/battle_slice/fixture.gd")
const R := preload("res://scripts/rules.gd")

static func drain(model: RefCounted) -> Array:
	var events := []
	for i in 5:
		var event: Dictionary = model.advance()
		if event.is_empty(): break
		events.append(event)
	return events

static func run(check: Callable) -> void:
	preload("res://tests/battle_slice/muse_checks.gd").run(check)
	var old_data := var_to_bytes(R.DATA)
	var m := Fixture.create()
	check.call(var_to_bytes(R.DATA) == old_data, "battle study does not change the running catalogue")
	check.call(m.team[0].id == "bogsnap" and m.team[1].id == "glimmerwing", "study uses actual Bogsnap/Glimmerwing records")
	check.call(m.foe.name == "Cindercub", "study uses actual Cindercub record")
	# Invalid commands neither consume supplies, alter state, nor advance the random stream.
	for action in [{}, {"kind": "move", "id": "fake"}, {"kind": "switch", "target": -1}, {"kind": "switch", "target": 0}, {"kind": "switch", "target": 1.5}, {"kind": "berry"}]:
		var before := var_to_bytes([m.team, m.foe, m.queue, m.state, m.rng.state, m.berries, m.lures])
		check.call(m.submit(action) != "", "invalid action rejected: %s" % action)
		check.call(var_to_bytes([m.team, m.foe, m.queue, m.state, m.rng.state, m.berries, m.lures]) == before, "invalid action is transactional")
	# Slower Bogsnap waits for Cindercub; no damage happens before its event is presented.
	var hp: int = m.team[0].hp
	check.call(m.submit({"kind": "move", "id": "bubbleJet"}) == "", "legal move queues a round")
	check.call(m.team[0].hp == hp, "queue does not silently apply damage")
	check.call(m.submit({"kind": "run"}) != "", "second command cannot replace queued round")
	var first: Dictionary = m.advance()
	check.call(first.side == "foe" and m.team[0].hp < hp, "faster foe acts first and damage matches its event")
	var second: Dictionary = m.advance()
	check.call(second.side == "ally" and second.hit and second.damage > 0, "ally then lands its move")
	check.call("Super effective" in second.text and m.team[0].pp.bubbleJet == 19, "type feedback and PP are applied")
	m.advance()
	check.call(m.state == "choose" and m.round_number == 2, "one action each returns to commands")
	# Switching consumes the turn; the foe's target is the newly active creature.
	m = Fixture.create()
	var old_hp: int = m.team[0].hp
	var new_hp: int = m.team[1].hp
	m.submit({"kind": "switch", "target": 1})
	var switched: Dictionary = m.advance()
	check.call(switched.kind == "switch" and m.active == 1, "switch takes priority")
	m.advance()
	check.call(m.team[0].hp == old_hp and m.team[1].hp < new_hp, "foe attacks the switched-in partner")
	# First-action KO cancels the slower creature's move, without spending its PP.
	m = Fixture.create()
	m.team[0].hp = 1
	m.submit({"kind": "move", "id": "bite"})
	m.advance()
	check.call(m.state == "switch" and m.queue.is_empty() and m.team[0].pp.bite == 20, "faint cancels pending attack")
	check.call(m.submit({"kind": "catch"}) != "", "fainted active requires a replacement")
	new_hp = m.team[1].hp
	m.submit({"kind": "switch", "target": 1})
	drain(m)
	check.call(m.state == "choose" and m.team[1].hp == new_hp, "forced switch gives no extra foe attack")
	m = Fixture.create()
	m.team[0].hp = 1
	m.submit({"kind": "berry"})
	first = m.advance()
	check.call(m.berries == 1 and m.team[0].hp > 1 and first.kind == "berry", "berry heals before enemy response")
	m.berries = 0
	drain(m)
	check.call(m.submit({"kind": "berry"}) != "", "empty supplies rejected")
	# Accuracy boundaries and PP exhaustion cannot soft-lock a round.
	m = Fixture.create()
	m.moves.bite.accuracy = 0.0
	m.team[0].speed = 999
	m.submit({"kind": "move", "id": "bite"})
	hp = m.foe.hp
	first = m.advance()
	check.call(not first.hit and m.foe.hp == hp and m.team[0].pp.bite == 19, "miss spends one PP and deals no damage")
	m = Fixture.create()
	for id in m.team[0].pp: m.team[0].pp[id] = 0
	check.call(m.submit({"kind": "move", "id": "bite"}) != "", "exhausted move rejected")
	check.call(m.submit({"kind": "move", "id": "struggle"}) == "", "fallback permits progress with empty PP")
	drain(m)
	m = Fixture.create()
	m.submit({"kind": "run"})
	drain(m)
	check.call(m.result == "escaped" and m.queue.is_empty(), "escape ends without enemy attack")
	check.call(m.submit({"kind": "move", "id": "bite"}) != "", "finished battles cannot accept commands")
	m = Fixture.create()
	m.team[0].hp = 1
	m.team[1].hp = 0
	m.submit({"kind": "move", "id": "bite"})
	drain(m)
	check.call(m.result == "lost" and m.queue.is_empty(), "last partner fainting ends in loss")
	m = Fixture.create()
	m.team[0].speed = 999
	m.foe.hp = 1
	m.submit({"kind": "move", "id": "bite"})
	drain(m)
	check.call(m.result == "won" and m.team[0].hp == m.team[0].max_hp, "KO ends battle before slower foe can retaliate")
	# Fixed seeds reproduce both events and state. Successful and failed catches end/continue correctly.
	var caught := 0
	var missed := 0
	for seed_value in 100:
		m = Fixture.create(seed_value)
		var twin := Fixture.create(seed_value)
		m.foe.hp = 1
		twin.foe.hp = 1
		m.submit({"kind": "catch"})
		twin.submit({"kind": "catch"})
		check.call(var_to_bytes(drain(m)) == var_to_bytes(drain(twin)), "seeded catch/events reproducible")
		check.call(m.lures == 2, "catch consumes exactly one lure")
		if m.result == "caught":
			caught += 1
			check.call(m.team[0].hp == m.team[0].max_hp, "successful catch cancels enemy response")
		else:
			missed += 1
			check.call(m.team[0].hp < m.team[0].max_hp, "failed catch grants enemy response")
	check.call(caught > 0 and missed > 0, "seed sweep exercises both catch outcomes")
	# Complete a variety of battles under normal damage and round rules.
	var wins := 0
	for seed_value in 30:
		m = Fixture.create(seed_value)
		for turn in 60:
			if m.state == "ended": break
			if m.state == "switch": m.submit({"kind": "switch", "target": 1})
			else:
				var options: Array = m.available(m.team[m.active])
				var id: String = "bubbleJet" if "bubbleJet" in options else (str(options[0]) if not options.is_empty() else "struggle")
				m.submit({"kind": "move", "id": id})
			drain(m)
		check.call(m.state == "ended" and m.result in ["won", "lost"], "normal battle reaches a real result")
		if m.result == "won": wins += 1
	check.call(wins > 0, "study can be won through actual moves")
