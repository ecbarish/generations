extends RefCounted
## Small, local Pokemon rules catalogue. No network or artwork dependency.
static var DATA: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://tests/journey/core-data.json"))
const Legacy := preload("res://tests/journey/legacy_catalogue.gd")
const IDS := ["pokemon:16","pokemon:37","pokemon:194"]
const NAMES := {"pokemon:16":"Pidgey","pokemon:37":"Vulpix","pokemon:194":"Wooper"}
const ALIASES := Legacy.ALIASES

static func threshold(sid: String, level: int) -> int:
	return int(DATA.growth[DATA.species[sid].growth][clampi(level,1,100)])

static func creature(sid: String, level: int = 5) -> Dictionary:
	if sid not in IDS: return {}
	level=clampi(level,1,100)
	var s: Dictionary=DATA.species[sid]
	var c := {"id":sid,"name":s.name,"individual":"","level":level,"xp":threshold(sid,level),"types":s.types.duplicate(),"element":" / ".join(s.types).capitalize(),"moves":[],"pp":{},"status":"","stages":{},"catch_rate":int(s.catch_rate),"base_experience":int(s.base_experience)}
	# Neutral nature, fixed IV 15, no EVs until individual training is introduced.
	for pair in [["hp","max_hp"],["attack","power"],["defense","guard"],["special-attack","wits"],["special-defense","spirit"],["speed","speed"]]:
		c[pair[1]]=floori((2*int(s.stats[pair[0]])+15)*level/100.0)+(level+10 if pair[0]=="hp" else 5)
	c.hp=c.max_hp
	for learned in s.learnset:
		if int(learned.level)<=level: c.moves.append(learned.move)
	# This supported subset contains at most four moves per species; no move-forget screen yet.
	for move in c.moves: c.pp[move]=int(DATA.moves[move].pp)
	return c

static func encode(c: Dictionary) -> Dictionary:
	return {"species":c.id,"individual":c.individual,"level":c.level,"xp":c.xp,"hp":c.hp,"pp":c.pp.duplicate(true),"status":c.status}

static func decode(value: Dictionary) -> Dictionary:
	var c := creature(str(value.species),int(value.level))
	c.individual=value.individual
	c.xp=int(value.xp)
	c.hp=int(value.hp)
	c.status=value.status
	for move in c.moves: c.pp[move]=int(value.pp[move])
	return c

static func gain_xp(c: Dictionary, amount: int) -> String:
	var xp := mini(threshold(c.id,100),int(c.xp)+maxi(0,amount))
	var level: int=c.level
	while level<100 and xp>=threshold(c.id,level+1): level+=1
	var text := "%s gained %d experience." % [c.name,xp-int(c.xp)]
	if level>int(c.level):
		var grown := creature(c.id,level)
		grown.individual=c.individual
		grown.status=c.status
		grown.hp=0 if c.hp==0 else int(c.hp)+int(grown.max_hp)-int(c.max_hp)
		for move in grown.moves:
			if c.pp.has(move): grown.pp[move]=c.pp[move]
			else: text+=" Learned %s!" % DATA.moves[move].name
		c.merge(grown,true)
		text+=" Reached Level %d!" % level
	c.xp=xp
	return text

static func migrate(value: Dictionary) -> Dictionary:
	var old := Legacy.decode(value)
	var c := creature(str(value.species),12) # The original pilot's implicit level.
	c.individual=value.individual
	c.hp=0 if old.hp==0 else maxi(1,ceili(float(old.hp)*c.max_hp/old.max_hp))
	# Preserve the lowest remaining-use fraction across the proxy loadout: no free refill.
	var remaining := 1.0
	for move in old.moves:
		remaining=minf(remaining,float(old.pp[move])/float(Legacy.creature(old.id).pp[move]))
	for move in c.moves: c.pp[move]=floori(c.pp[move]*remaining)
	return encode(c)
