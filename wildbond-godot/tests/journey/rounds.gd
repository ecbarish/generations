extends "res://tests/battle_slice/rounds.gd"
## Bounded Gen IV style core; view, input validation and catch math reused from the pilot.
const Catalogue := preload("res://tests/journey/catalogue.gd")

var residual_due := true

func setup(party: Array, opponent: Dictionary, definitions: Dictionary, chart: Dictionary, seed_value: int) -> void:
	super.setup(party,opponent,definitions,chart,seed_value)
	for c in team+[foe]: c.stages={}
	residual_due=true

func speed(c: Dictionary) -> int:
	return maxi(1,floori(c.speed*MuseMath.stage_multiplier(int(c.stages.get("speed",0)))))

func effectiveness(element, target: Dictionary) -> float:
	if element==null or element=="": return 1.0
	var value := 1.0
	for defending in target.types: value*=float(Catalogue.DATA.types[element].get(defending,1.0))
	return value

func submit(action: Dictionary) -> String:
	var error := validate(action)
	if error != "": return error
	var forced := state == "switch"
	residual_due=not forced
	queue = [{"side": "ally", "action": action.duplicate(true)}]
	if not forced:
		var options := available(foe)
		var id: String = "struggle" if options.is_empty() else str(options[rng.randi_range(0, options.size() - 1)])
		queue.append({"side": "foe", "action": {"kind": "move", "id": id}})
		if action.kind == "move":
			var ally_priority := int(moves.get(str(action.id),{}).get("priority",0))
			var foe_priority := int(moves.get(id,{}).get("priority",0))
			var ally_speed := speed(team[active])
			var foe_speed := speed(foe)
			var first: bool = ally_priority>foe_priority if ally_priority!=foe_priority else ally_speed>foe_speed
			if ally_priority==foe_priority and ally_speed==foe_speed: first = rng.randf() < 0.5
			if not first: queue.reverse()
	state = "resolving"
	return ""

func advance() -> Dictionary:
	if state != "resolving": return {}
	if queue.is_empty():
		var burn_event := {"side":"ally","kind":"status","text":"","damage":0,"hit":false}
		for c in [team[active],foe]:
			if residual_due and c.hp>0 and c.status=="burn":
				var loss := mini(int(c.hp),maxi(1,floori(c.max_hp/8.0)))
				c.hp-=loss
				burn_event.text+="%s lost %d health to its burn. " % [c.name,loss]
		state="choose"
		round_number+=1
		finish(burn_event)
		return burn_event if burn_event.text!="" else {}
	var next: Dictionary = queue.pop_front()
	var actor: Dictionary = team[active] if next.side == "ally" else foe
	var target: Dictionary = foe if next.side == "ally" else team[active]
	var action: Dictionary = next.action
	var event := {"side": next.side, "kind": action.kind, "text": "", "damage": 0, "hit": false}
	match str(action.kind):
		"switch":
			actor.stages={}
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
			var values := MuseMath.catch_values(int(foe.max_hp), int(foe.hp), 1.0, str(foe.get("status", "")),1.0,int(foe.catch_rate))
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
			var mv: Dictionary = moves[id] if id != "struggle" else {"name": "Struggle", "pow": 50, "accuracy": 1.0, "el": null}
			if id != "struggle": actor.pp[id] -= 1
			event.text = "%s used %s." % [actor.name, mv.name]
			var accuracy_stage := clampi(int(actor.stages.get("accuracy",0)),-6,6)
			var accuracy := float(mv.get("accuracy",1.0))*(float(3+accuracy_stage)/3 if accuracy_stage>=0 else 3.0/(3-accuracy_stage))
			if id!="struggle" and rng.randf() >= accuracy:
				event.text += " It missed!"
			else:
				event.hit = true
				var advantage := 1.0 if id=="struggle" else effectiveness(mv.get("el"), target)
				if int(mv.pow)==0:
					var stat := "accuracy" if id=="sand-attack" else "defense"
					var old := int(target.stages.get(stat,0))
					target.stages[stat]=maxi(-6,old-1)
					event.text+=" %s's %s fell." % [target.name,stat] if old>-6 else " It cannot fall any further."
				else:
					var attacker := _math_record(actor)
					attacker.type=mv.get("el") if mv.get("el") in actor.types else ""
					var defender := _math_record(target)
					defender.defense*=MuseMath.stage_multiplier(int(target.stages.get("defense",0)))
					var hit := MuseMath.damage(attacker,defender,{"category":"special" if int(mv.get("spec",0))==1 else "physical","type":mv.get("el"),"power":mv.pow},rng.randf(),advantage)
					event.damage=mini(int(target.hp),int(hit.damage))
					target.hp-=event.damage
					event.text+=" It had no effect." if advantage==0 else " %d damage." % event.damage
					if advantage>1: event.text+=" Super effective!"
					elif advantage>0 and advantage<1: event.text+=" Not very effective."
					if target.hp>0 and advantage>0:
						if id=="mud-shot":
							target.stages.speed=maxi(-6,int(target.stages.get("speed",0))-1)
							event.text+=" %s's Speed fell." % target.name
						elif id in ["ember","flamethrower"] and target.status=="" and "fire" not in target.types and rng.randi_range(1,100)<=int(mv.effect_chance):
							target.status="burn"
							event.text+=" %s was burned!" % target.name
				if id == "struggle":
					actor.hp = maxi(0, int(actor.hp) - maxi(1, int(actor.max_hp) / 4))
					event.text += " Recoil hurt %s." % actor.name
	finish(event)
	return event

func finish(event: Dictionary) -> void:
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
