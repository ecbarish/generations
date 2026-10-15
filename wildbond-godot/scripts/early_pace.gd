extends RefCounted
## WB-LOOK / WBL-5. Only the opening Thornwood grass changes: later regions and
## established journeys retain their existing pacing. No new saved state.
const EARLY_MAPS := ["thornwood_route", "thornwood", "thornwood_grove"]
const REST_FRACTION := 0.3

static func is_early(game: Node) -> bool:
	return game.map_name in EARLY_MAPS and game.badges.is_empty()

static func next_steps(game: Node) -> int:
	var wander: bool = game.heritage() == "wander"
	if is_early(game):
		return game.rng.randi_range(3, 6) if wander else game.rng.randi_range(4, 8)
	return game.rng.randi_range(6, 12) if wander else game.rng.randi_range(8, 16)

## A quiet find can give a tired team a breather. Fainted partners still need
## Maren or the inn; the existing exhausted-team guard remains in main.gd.
## The caller retains the original flavour RNG draw before trying this helper.
## No extra RNG is consumed here; story beats still take precedence over finds.
static func rest(game: Node) -> bool:
	if not is_early(game):
		return false
	var recovered := false
	for creature in game.team:
		var maximum: int = game.R.stats(creature).hp
		if int(creature.hp) <= 0 or int(creature.hp) >= maximum:
			continue
		creature.hp = mini(maximum, int(creature.hp) + maxi(1, roundi(maximum * REST_FRACTION)))
		recovered = true
	if recovered:
		game.sfx.play("heal")
		game.say("", "Your partners catch their breath and recover some health.")
	return recovered
