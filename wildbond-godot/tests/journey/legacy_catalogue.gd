extends RefCounted
## Frozen schema-one proxy records from #553 (6aa6a714). Never rebalance these.
static var RECORDS: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/journey/legacy-data.json"))
const IDS := ["pokemon:16","pokemon:37","pokemon:194"]
const NAMES := {"pokemon:16":"Pidgey","pokemon:37":"Vulpix","pokemon:194":"Wooper"}
const ALIASES := {"pokemon:16":"glimmerwing","pokemon:37":"cindercub","pokemon:194":"bogsnap"}

static func creature(sid: String) -> Dictionary:
	return RECORDS.get(sid,{}).duplicate(true)

static func encode(c: Dictionary) -> Dictionary:
	return {"species":c.id,"individual":c.individual,"hp":c.hp,"pp":c.pp.duplicate(true)}

static func decode(value: Dictionary) -> Dictionary:
	var c := creature(str(value.species))
	c.individual=value.individual
	c.hp=int(value.hp)
	for move in c.moves: c.pp[move]=int(value.pp[move])
	return c
