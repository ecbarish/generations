extends RefCounted
const MuseMath := preload("res://tests/battle_slice/muse_math.gd")
## Experimental round rules. No nodes, file access, clock, save writes or rendering.
## Input consists of copied combatants and move definitions; output is one applied event per advance().
var team: Array = []
var foe: Dictionary = {}
var moves: Dictionary = {}
var elements: Dictionary = {}
var active := 0
var state := "choose"
var result := ""
var round_number := 1
var berries := 2
var lures := 3
var queue: Array = []
var rng := RandomNumberGenerator.new()

func setup(party: Array, opponent: Dictionary, definitions: Dictionary, chart: Dictionary, seed_value: int) -> void:
	team = party.duplicate(true)
	foe = opponent.duplicate(true)
	moves = definitions.duplicate(true)
	elements = chart.duplicate(true)
	active = 0
	state = "choose"
	result = ""
	round_number = 1
	berries = 2
	lures = 3
	queue.clear()
	rng.seed = seed_value
	for c in team + [foe]:
		c["pp"] = {}
		for id in c.moves:
			c.pp[id] = int(moves[id].get("pp", 20))

func available(c: Dictionary) -> Array:
	return c.moves.filter(func(id): return int(c.pp[id]) > 0)

func validate(action: Dictionary) -> String:
	if state not in ["choose", "switch"]: return "Wait for this turn to finish."
	var kind := str(action.get("kind", ""))
	if state == "switch" and kind != "switch": return "Choose a healthy partner."
	match kind:
		"move":
			var id := str(action.get("id", ""))
			if id == "struggle" and available(team[active]).is_empty(): return ""
			if id not in available(team[active]): return "That move is unavailable."
		"switch":
			var target = action.get("target", -1)
			if typeof(target) != TYPE_INT or target < 0 or target >= team.size(): return "Choose a partner."
			if target == active or team[target].hp <= 0: return "Choose another healthy partner."
		"berry":
			if berries <= 0: return "There are no berries left."
			var recipient = action.get("target", active)
			if typeof(recipient) != TYPE_INT or recipient < 0 or recipient >= team.size(): return "Choose a partner."
			if team[recipient].hp <= 0: return "A fainted partner needs a rest."
			if team[recipient].hp >= team[recipient].max_hp: return "Your partner is already healthy."
		"catch":
			if lures <= 0: return "There are no lures left."
		"run": pass
		_: return "Choose a command."
	return ""

func submit(action: Dictionary) -> String:
	var error := validate(action)
	if error != "": return error
	var forced := state == "switch"
	queue = [{"side": "ally", "action": action.duplicate(true)}]
	if not forced:
		var options := available(foe)
		var id: String = "struggle" if options.is_empty() else str(options[rng.randi_range(0, options.size() - 1)])
		queue.append({"side": "foe", "action": {"kind": "move", "id": id}})
		if action.kind == "move":
			var first: bool = team[active].speed > foe.speed
			if team[active].speed == foe.speed: first = rng.randf() < 0.5
			if not first: queue.reverse()
	state = "resolving"
	return ""

func effectiveness(element, target: Dictionary) -> float:
	if element == null or element == "": return 1.0
	if target.element in elements[element].beats: return 1.5
	if element in elements[target.element].beats: return 0.67
	return 1.0

func _end(outcome: String) -> void:
	result = outcome
	state = "ended"
	queue.clear()

func advance() -> Dictionary:
	if state != "resolving": return {}
	if queue.is_empty():
		state = "choose"
		round_number += 1
		return {}
	var next: Dictionary = queue.pop_front()
	var actor: Dictionary = team[active] if next.side == "ally" else foe
	var target: Dictionary = foe if next.side == "ally" else team[active]
	var action: Dictionary = next.action
	var event := {"side": next.side, "kind": action.kind, "text": "", "damage": 0, "hit": false}
	match str(action.kind):
		"switch":
			active = int(action.target)
			event.text = "Go, %s!" % team[active].name
		"berry":
			berries -= 1
			actor = team[action.get("target", active)]
			var healed := mini(int(actor.max_hp) - int(actor.hp), maxi(1, roundi(actor.max_hp * 0.5)))
			actor.hp += healed
			event.text = "%s recovered %d health." % [actor.name, healed]
		"catch":
			lures -= 1
			var values := MuseMath.catch_values(int(foe.max_hp), int(foe.hp), 1.0, str(foe.get("status", "")))
			event["shakes"] = MuseMath.shake_count(values, rng)
			if event.shakes == 4:
				event.text = "%s joined you!" % foe.name
				_end("caught")
			else: event.text = "%s slipped away from the lure." % foe.name
		"run":
			event.text = "You returned safely to the trail."
			_end("escaped")
		"move":
			var id := str(action.id)
			var mv: Dictionary = moves[id] if id != "struggle" else {"name": "Struggle", "pow": 35, "accuracy": 1.0, "el": null}
			if id != "struggle": actor.pp[id] -= 1
			event.text = "%s used %s." % [actor.name, mv.name]
			if rng.randf() >= float(mv.get("accuracy", 1.0)):
				event.text += " It missed!"
			else:
				event.hit = true
				var advantage := effectiveness(mv.get("el"), target)
				var hit := MuseMath.damage(_math_record(actor), _math_record(target), {"category": "special" if int(mv.get("spec", 0)) == 1 else "physical", "type": mv.get("el"), "power": mv.pow}, rng.randf(), advantage)
				event.damage = mini(int(target.hp), int(hit.damage))
				target.hp -= event.damage
				event.text += " %d damage." % event.damage
				if advantage > 1: event.text += " Super effective!"
				elif advantage < 1: event.text += " Not very effective."
				if id == "struggle":
					actor.hp = maxi(0, int(actor.hp) - maxi(1, int(actor.max_hp) / 4))
					event.text += " Recoil hurt %s." % actor.name
	# Fainting cancels pending actions. The next choice is forced replacement or the result.
	if foe.hp <= 0:
		event.text += " %s fainted." % foe.name
		_end("won")
	elif team.all(func(c): return c.hp <= 0):
		event.text += " Your team needs a rest."
		_end("lost")
	elif team[active].hp <= 0:
		event.text += " %s fainted. Choose a partner." % team[active].name
		state = "switch"
		queue.clear()
	return event

func _math_record(c: Dictionary) -> Dictionary:
	return {"level": c.level, "attack": c.power, "defense": c.guard, "spAttack": c.wits, "spDefense": c.spirit,
		"type": c.element, "stages": c.get("stages", {}), "status": c.get("status", "")}
