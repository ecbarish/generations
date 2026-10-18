extends RefCounted
## Frozen schema-two acceptance boundary from #559; never admits original-species records.
static var DATA: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/journey/schema-two-data.json"))
const FORMAT := "wildbond-pokemon-chapter"
const IDS := ["pokemon:16","pokemon:37","pokemon:194"]

static func threshold(sid: String, level: int) -> int:
	return int(DATA.growth[DATA.species[sid].growth][clampi(level,1,100)])

static func creature(sid: String, level: int) -> Dictionary:
	var s: Dictionary=DATA.species[sid]
	var c := {"max_hp":floori((2*int(s.stats.hp)+15)*level/100.0)+level+10,"moves":[],"pp":{}}
	for learned in s.learnset:
		if int(learned.level)<=level:c.moves.append(learned.move);c.pp[learned.move]=int(DATA.moves[learned.move].pp)
	return c
static func integer(value: Variant, low: int, high: int) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and float(value)==floorf(float(value)) and value>=low and value<=high

static func valid(d: Dictionary) -> bool:
	if d.get("format")!=FORMAT or d.get("version")!=2: return false
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
		if not record is Dictionary or record.get("species") not in IDS: return false
		if not integer(record.get("individual"),1,int(d.next_id)-1) or seen.has(int(record.individual)): return false
		seen[int(record.individual)]=true
		if not integer(record.get("level"),1,100): return false
		var level := int(record.level)
		if not integer(record.get("xp"),threshold(record.species,level),threshold(record.species,100) if level==100 else threshold(record.species,level+1)-1): return false
		if record.get("status") not in ["","burn"]: return false
		var c := creature(record.species,level)
		if not integer(record.get("hp"),0,int(c.max_hp)) or not record.get("pp") is Dictionary or record.pp.size()!=c.moves.size(): return false
		for move in c.moves:
			if not integer(record.pp.get(move),0,int(c.pp[move])): return false
	if d.has("opening"):
		var opening = d.opening
		if not opening is Dictionary or opening.get("version")!=1: return false
		for key in ["met_maren","wren","bram","reported"]:
			if not opening.get(key) is bool: return false
		if opening.reported and (not opening.met_maren or not d.first_catch or not d.healed_after_catch): return false
		if not opening.get("position") is Array or opening.position.size()!=2: return false
		for value in opening.position:
			if not (value is int or value is float) or not is_finite(float(value)): return false
		if opening.position[0]<-34 or opening.position[0]>26 or opening.position[1]<-26 or opening.position[1]>17: return false
		if not opening.get("items") is Array or opening.items.size()>2: return false
		var unique := {}
		for id in opening.items:
			if id not in ["lh1","tw1"] or unique.has(id): return false
			unique[id]=true
	return true
