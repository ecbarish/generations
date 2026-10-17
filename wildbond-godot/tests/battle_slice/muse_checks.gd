extends RefCounted
const MathRules := preload("res://tests/battle_slice/muse_math.gd")
const Art := preload("res://tests/battle_slice/muse_art.gd")
const Sprites := preload("res://scripts/creature_sprites.gd")

static func run(check: Callable) -> void:
	var fixtures: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/battle_slice/muse/fixtures.json"))
	check.call(fixtures.rows.size() == 348, "Muse comparison fixtures loaded completely")
	for row in fixtures.rows:
		if row.kind == "damage":
			var result := MathRules.damage(row.attacker, row.defender, row.move, float(row.roll), float(row.multiplier))
			check.call(result.damage == row.expected, "Muse JS damage parity: %s/%s/%s" % [row.move.category, row.attacker.stages.attack, row.roll])
		else:
			var result := MathRules.catch_values(38, int(row.hp), float(row.orbBonus), str(row.status), float(row.timing))
			for key in row.expected:
				check.call(is_equal_approx(float(result[key]), float(row.expected[key])), "Muse JS catch parity: %s/%s/%s/%s/%s" % [row.hp, row.orb, row.status, row.timing, key])
	check.call(MathRules.stage_multiplier(-99) == 0.25 and MathRules.stage_multiplier(99) == 4, "stages clamp to -6 through +6")
	check.call(MathRules.effective_speed(31, "paralysis") == 15 and MathRules.effective_speed(31, "burn") == 31, "paralysis halves speed, burn does not")
	var impossible := MathRules.catch_values(38, 38, 1, "", 1, 0)
	check.call(impossible.a == 0 and impossible.b == 0 and impossible.perShake == 0, "zero-rate correction stays impossible")
	check.call(MathRules.catch_values(0, 0).is_empty(), "invalid maximum HP rejected")
	var guaranteed := MathRules.catch_values(38, 1, 2, "sleep", 2, 255)
	var rng := RandomNumberGenerator.new()
	rng.seed = 18
	var before: int = rng.state
	check.call(MathRules.shake_count(guaranteed, rng) == 4 and rng.state == before, "guaranteed catch needs no random rolls")
	check.call(MathRules.shake_count(impossible, rng) == 0, "zero-rate catch never succeeds")
	var sample: Dictionary = fixtures.rows[0]
	check.call(MathRules.damage(sample.attacker, sample.defender, sample.move, 0.5, 0).damage == 0, "explicit immunity is not coerced to neutral")
	for frame in 24:
		check.call(Art.player_frame(frame / 16.0, true) == "bogsnap-back.png", "entire former idle cycle uses the complete back, never clipped poses")
	check.call(Art.player_frame(2, false) == "bogsnap-back.png", "reduced motion uses supplied resting back")
	for i in range(1, 5):
		var tex: Texture2D = Art.texture("bogsnap-idle-%d.png" % i)
		check.call(tex != null, "supplied idle texture loads")
		var ink := Sprites.ink_box(tex)
		var rect := Art.destination(ink, Vector2(83, 132), 64)
		check.call(is_equal_approx(rect.end.y, 132) and is_equal_approx(rect.get_center().x, 83) and is_equal_approx(rect.size.y, 64), "different source sizes keep one foot anchor and height")
