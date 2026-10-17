extends RefCounted
## Adapted from Evan's user-provided Muse demo. See muse/source-manifest.json and original-functions.cjs.
## Random values and type multipliers are explicit inputs, so no DOM, clock, globals or placeholder chart is needed.

static func stage_multiplier(stage: int) -> float:
	stage = clampi(stage, -6, 6)
	return (2.0 + stage) / 2.0 if stage >= 0 else 2.0 / (2.0 + absi(stage))

static func effective_speed(speed: int, status: String) -> int:
	return floori(speed * (0.5 if status == "paralysis" else 1.0))

static func damage(attacker: Dictionary, defender: Dictionary, move: Dictionary, random_roll: float, type_multiplier: float) -> Dictionary:
	var physical: bool = move.category == "physical"
	var attack_base: float = attacker.attack if physical else attacker.spAttack
	var defense_base: float = defender.defense if physical else defender.spDefense
	var stage: int = int(attacker.get("stages", {}).get("attack", 0)) if physical else 0
	var attack_used := attack_base * stage_multiplier(stage)
	var level_term := floori(2.0 * attacker.level / 5.0 + 2.0)
	var scaled := floori(level_term * move.power * attack_used / maxf(1, defense_base))
	var base := floori(scaled / 50.0) + 2
	var stab := 1.5 if move.get("type") != null and move.type == attacker.type else 1.0
	var random := 0.85 + clampf(random_roll, 0, 1) * 0.15
	var burn := 0.5 if attacker.get("status", "") == "burn" and physical else 1.0
	# Unlike the demo's `|| 1` lookup, an explicit zero preserves immunity.
	var amount := 0 if type_multiplier == 0 else maxi(1, floori(base * stab * type_multiplier * random * burn))
	return {"damage": amount, "base": base, "stab": stab, "type": type_multiplier, "burn": burn}

static func catch_values(max_hp: int, hp: int, orb_bonus: float = 1.0, status: String = "", timing_bonus: float = 1.0, base_rate: int = 45) -> Dictionary:
	if max_hp <= 0 or orb_bonus <= 0 or timing_bonus <= 0 or base_rate < 0: return {}
	hp = clampi(hp, 0, max_hp)
	var base_a := floori(((3.0 * max_hp - 2.0 * hp) * base_rate * orb_bonus) / (3.0 * max_hp))
	var status_bonus := 2.0 if status in ["sleep", "frozen"] else (1.5 if status in ["paralysis", "burn", "poison"] else 1.0)
	var a := mini(255, floori(base_a * status_bonus * timing_bonus))
	var guaranteed := a >= 255
	# Zero catch value must stay impossible; the original demo clamps its denominator to one.
	var b := 65536 if guaranteed else (0 if a <= 0 else floori(1048560.0 / sqrt(sqrt(16711680.0 / a))))
	return {"baseA": base_a, "statusBonus": status_bonus, "timingBonus": timing_bonus, "a": a, "b": b, "guaranteed": guaranteed, "perShake": minf(1, b / 65536.0)}

static func shake_count(values: Dictionary, rng: RandomNumberGenerator) -> int:
	if values.is_empty(): return 0
	if values.guaranteed: return 4
	var shakes := 0
	for i in 4:
		if rng.randi_range(0, 65535) >= int(values.b): break
		shakes += 1
	return shakes
