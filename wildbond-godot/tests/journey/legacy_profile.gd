extends RefCounted
## Frozen schema-one validator used only to recognize safe migration inputs.
const Catalogue := preload("res://tests/journey/legacy_catalogue.gd")
const FORMAT := "wildbond-pokemon-chapter"
static func fresh() -> Dictionary:
	return {"format":FORMAT,"version":1,"started":false,"team":[],"box":[],"next_id":1,"berries":2,"balls":5,"coins":300,"room":"town","position":[0,6],"first_catch":false,"healed_after_catch":false,"wins":0,"encounters":0}

static func integer(value: Variant, low: int, high: int) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and float(value)==floorf(float(value)) and value>=low and value<=high

static func valid(d: Dictionary) -> bool:
	if d.get("format")!=FORMAT or d.get("version")!=1: return false
	for key in ["started","first_catch","healed_after_catch"]:
		if not d.get(key) is bool: return false
	for key in ["berries","balls"]:
		if not integer(d.get(key),0,999): return false
	for key in ["coins","wins","encounters"]:
		if not integer(d.get(key),0,999999): return false
	if not integer(d.get("next_id"),1,1000000): return false
	if not d.get("team") is Array or d.team.size()>6 or (d.started and d.team.is_empty()) or (not d.started and not d.team.is_empty()): return false
	if not d.get("box") is Array or d.box.size()>60: return false
	if not d.started and (not d.box.is_empty() or d.first_catch or d.healed_after_catch): return false
	if d.get("room") not in ["town","trail"] or not d.get("position") is Array or d.position.size()!=2: return false
	for v in d.position:
		if not (v is float or v is int) or not is_finite(float(v)): return false
	var x: float=d.position[0]
	var z: float=d.position[1]
	if (d.room=="town" and (absf(x)>15.7 or absf(z)>13.5)) or (d.room=="trail" and (absf(x-120)>8 or absf(z)>9)): return false
	var seen := {}
	for record in d.team+d.box:
		if not record is Dictionary or record.get("species") not in Catalogue.IDS: return false
		if not integer(record.get("individual"),1,int(d.next_id)-1) or seen.has(int(record.individual)): return false
		seen[int(record.individual)]=true
		var c := Catalogue.creature(record.species)
		if not integer(record.get("hp"),0,int(c.max_hp)) or not record.get("pp") is Dictionary or record.pp.size()!=c.moves.size(): return false
		for move in c.moves:
			if not integer(record.pp.get(move),0,int(c.pp[move])): return false
	return true
