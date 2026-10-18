extends RefCounted
const Safe := preload("res://scripts/safe_save.gd")
const Catalogue := preload("res://tests/journey/catalogue.gd")
const Legacy := preload("res://tests/journey/legacy_profile.gd")
const PATH := "user://wildbond_pokemon_chapter_v1.json"
const FORMAT := "wildbond-pokemon-chapter"
var path := PATH
var hold := false
var issue := ""
var state: Dictionary

func _init() -> void: state=fresh()

static func fresh() -> Dictionary:
	return {"format":FORMAT,"version":2,"started":false,"team":[],"box":[],"next_id":1,"berries":2,"balls":5,"coins":300,"room":"town","position":[0,6],"first_catch":false,"healed_after_catch":false,"wins":0,"encounters":0}

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
		if not record is Dictionary or record.get("species") not in Catalogue.IDS: return false
		if not integer(record.get("individual"),1,int(d.next_id)-1) or seen.has(int(record.individual)): return false
		seen[int(record.individual)]=true
		if not integer(record.get("level"),1,100): return false
		var level := int(record.level)
		if not integer(record.get("xp"),Catalogue.threshold(record.species,level),Catalogue.threshold(record.species,100) if level==100 else Catalogue.threshold(record.species,level+1)-1): return false
		if record.get("status") not in ["","burn"]: return false
		var c := Catalogue.creature(record.species,level)
		if not integer(record.get("hp"),0,int(c.max_hp)) or not record.get("pp") is Dictionary or record.pp.size()!=c.moves.size(): return false
		for move in c.moves:
			if not integer(record.pp.get(move),0,int(c.pp[move])): return false
	return true

func open_profile(target: String = PATH) -> bool:
	path=target
	hold=false
	issue=""
	state=fresh()
	if not path.begins_with("user://") or ".." in path:
		hold=true; issue="Chapter save path is invalid."; return false
	# Never roll back and overwrite a newer primary/spare/backup with this older schema.
	for suffix in ["",".tmp",".bak"]:
		if not FileAccess.file_exists(path+suffix): continue
		var file := FileAccess.open(path+suffix,FileAccess.READ)
		if file==null or file.get_length()>524288:
			hold=true; issue="Chapter save cannot be read safely. It has been kept."; return false
		var json := JSON.new()
		if json.parse(file.get_as_text())==OK and json.data is Dictionary:
			if json.data.get("format")==FORMAT and integer(json.data.get("version"),3,999999):
				hold=true; issue="This chapter save needs a newer game. It has been kept."; return false
	var loaded := Safe.read(path,func(d: Dictionary): return valid(d) or Legacy.valid(d))
	if loaded.is_empty():
		if Safe.exists(path):
			hold=true; issue="Chapter save could not be recovered. This visit will not overwrite it."
		return not hold
	if loaded.version==1:
		# Preserve a verified source record independently of the rotating crash-recovery backup.
		var original := path+".pre-v2"
		if FileAccess.file_exists(original):
			var prior := JSON.new()
			var file := FileAccess.open(original,FileAccess.READ)
			if file==null or file.get_length()>524288 or prior.parse(file.get_as_text())!=OK or not prior.data is Dictionary or not Legacy.valid(prior.data):
				hold=true; issue="The migration backup needs attention. Your save has been kept."; return false
		else:
			if not Safe.write(original,loaded):
				hold=true; issue="Could not preserve the old chapter save. Your save has been kept."; return false
		state=loaded.duplicate(true)
		state.version=2
		state.team=loaded.team.map(Catalogue.migrate)
		state.box=loaded.box.map(Catalogue.migrate)
		if not valid(state) or not save():
			hold=true; issue="Could not finish the chapter upgrade. The original is kept."; return false
	else:
		state=loaded.duplicate(true)
	return true

func save() -> bool:
	if hold or not valid(state): return false
	if not Safe.write(path,state): issue="Could not save this chapter. Keep the game open and try Save again."; return false
	issue=""
	return true

func assign(c: Dictionary) -> Dictionary:
	var result := c.duplicate(true)
	result.individual=int(state.next_id)
	state.next_id+=1
	return result

func start(sid: String) -> bool:
	if state.started or sid not in Catalogue.IDS: return false
	state.team=[Catalogue.encode(assign(Catalogue.creature(sid)))]
	state.started=true
	return true

func room_for_capture() -> bool: return state.team.size()<6 or state.box.size()<60

func caught(c: Dictionary) -> String:
	if not room_for_capture(): return "full"
	var record := Catalogue.encode(assign(c))
	state.first_catch=true
	if state.team.size()<6:
		state.team.append(record)
		return "party"
	state.box.append(record)
	return "box"
