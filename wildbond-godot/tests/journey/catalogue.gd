extends RefCounted
## Installed pilot roster. Combat records deliberately reuse study proxies, not canonical Pokemon stats.
const Fixture := preload("res://tests/battle_slice/fixture.gd")
const IDS := ["pokemon:16","pokemon:37","pokemon:194"]
const NAMES := {"pokemon:16":"Pidgey","pokemon:37":"Vulpix","pokemon:194":"Wooper"}
const ALIASES := {"pokemon:16":"glimmerwing","pokemon:37":"cindercub","pokemon:194":"bogsnap"}

static func creature(sid: String) -> Dictionary:
	if sid not in IDS: return {}
	var fixture := Fixture.create()
	var record: Dictionary=fixture.team[1].duplicate(true) if sid=="pokemon:16" else (fixture.foe.duplicate(true) if sid=="pokemon:37" else fixture.team[0].duplicate(true))
	record.id=sid
	record.name=NAMES[sid]
	record.moves=["peck","gust"] if sid=="pokemon:16" else (["bite","emberSnap"] if sid=="pokemon:37" else ["bite","bubbleJet"])
	record.pp={}
	for move in record.moves: record.pp[move]=int(fixture.moves[move].pp)
	record["individual"]=""
	return record

static func encode(c: Dictionary) -> Dictionary:
	return {"species":c.id,"individual":c.individual,"hp":c.hp,"pp":c.pp.duplicate(true)}

static func decode(value: Dictionary) -> Dictionary:
	var c := creature(str(value.species))
	c.individual=value.individual
	c.hp=int(value.hp)
	for move in c.moves: c.pp[move]=int(value.pp[move])
	return c
