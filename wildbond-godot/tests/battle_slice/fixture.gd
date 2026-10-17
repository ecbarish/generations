extends RefCounted
## Local prototype adapter: uses actual catalogue stats without changing live DATA or saved individuals.
const R := preload("res://scripts/rules.gd")
const Rounds := preload("res://tests/battle_slice/rounds.gd")

static func create(seed_value: int = 42) -> RefCounted:
	var previous: Dictionary = R.DATA
	var data: Dictionary = (load("res://data/wildbond.json") as JSON).data.duplicate(true)
	var evolution: Dictionary = (load("res://data/evolution.json") as JSON).data
	data.SPECIES.merge(evolution.species, true)
	R.DATA = data
	var rng := RandomNumberGenerator.new()
	rng.seed = 19
	var party := []
	for id in ["bogsnap", "glimmerwing", "cindercub"]:
		var c := R.make(id, 12, {"temp": "steady", "traits": [], "pot": {"hp": 10, "pow": 10, "grd": 10, "spd": 10, "wit": 10, "spi": 10}}, rng)
		var st := R.stats(c)
		party.append({"id": id, "name": c.name, "level": c.lvl, "element": data.SPECIES[id].el,
			"hp": st.hp, "max_hp": st.hp, "power": st.pow, "guard": st.grd, "speed": st.spd, "wits": st.wit, "spirit": st.spi,
			"moves": ["bite", "bubbleJet", "deepDrag"] if id == "bogsnap" else (["peck", "gust"] if id == "glimmerwing" else ["bite", "emberSnap"])})
	R.DATA = previous
	var definitions := {}
	for c in party:
		for id in c.moves:
			definitions[id] = data.MOVES[id].duplicate(true)
			definitions[id]["accuracy"] = 0.8 if id == "deepDrag" else 1.0
			definitions[id]["pp"] = 10 if id == "deepDrag" else 20
			# A deliberate study-only risk/reward variant; legacy definitions remain untouched.
			if id == "deepDrag": definitions[id]["pow"] = 85
	var model := Rounds.new()
	model.setup(party.slice(0, 2), party[2], definitions, data.ELEMENTS, seed_value)
	return model
