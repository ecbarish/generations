extends SceneTree
const Catalogue := preload("res://tests/journey/catalogue.gd")
const Profile := preload("res://tests/journey/profile.gd")
const Rounds := preload("res://tests/journey/rounds.gd")
var passed := 0
var failed := 0
func _initialize() -> void: run.call_deferred()
func check(ok: bool, title: String) -> void:
	if ok: passed+=1
	else: failed+=1; printerr("FAIL: "+title)
func model(ally: String="pokemon:194", enemy: String="pokemon:16", level: int=15) -> RefCounted:
	var m := Rounds.new()
	m.setup([Catalogue.creature(ally,level)],Catalogue.creature(enemy,level),Catalogue.DATA.moves,{},123)
	return m
func hit(m: RefCounted, id: String) -> Dictionary:
	m.state="resolving"
	m.queue=[{"side":"ally","action":{"kind":"move","id":id}}]
	m.rng.seed=123
	return m.advance()
func raw(path: String, data: Variant) -> void:
	var f := FileAccess.open(path,FileAccess.WRITE)
	f.store_string(JSON.stringify(data) if data is Dictionary else str(data))
func clean(path: String) -> void:
	Profile.Safe.remove(path)
	Profile.Safe.remove(path+".pre-v2")
func run() -> void:
	check(Catalogue.DATA.moves.tackle.pow==35 and Catalogue.DATA.moves.tackle.accuracy==.95,"historical Tackle uses Platinum power and accuracy")
	check(Catalogue.DATA.moves.flamethrower.pow==95,"historical Flamethrower retains Gen IV power")
	var p := Catalogue.creature("pokemon:16",50)
	check(p.max_hp==107 and p.power==57 and p.guard==52 and p.speed==68,"base stats produce known fixed-IV neutral Level 50 Pidgey")
	check(Catalogue.creature("pokemon:194").types==["water","ground"],"Wooper has both types")
	check(Catalogue.creature("pokemon:16").moves==["tackle","sand-attack"],"Level 5 Pidgey learns only supported moves available at that level")
	check("gust" in Catalogue.creature("pokemon:16",9).moves and "quick-attack" not in Catalogue.creature("pokemon:16",12).moves,"Platinum level-up boundaries respected")
	var m := model()
	check(m.effectiveness("electric",m.team[0])==0 and m.effectiveness("grass",m.team[0])==4,"dual types combine immunities and quadruple weaknesses")
	check(m.effectiveness("ground",m.foe)==0,"Flying immunity preserved")
	check(m.effectiveness("ghost",{"types":["steel"]})==.5 and m.effectiveness("dark",{"types":["steel"]})==.5,"pre-Fairy Steel chart retained")
	var event := hit(m,"mud-shot")
	check(event.damage==0 and not m.foe.stages.has("speed") and "no effect" in event.text,"immune hit neither damages nor lowers Speed")
	m=model("pokemon:16","pokemon:37",50)
	var a: Dictionary = m._math_record(m.team[0])
	a.type="normal"
	var damage: Dictionary = m.MuseMath.damage(a,m._math_record(m.foe),{"category":"physical","type":"normal","power":35},1,1)
	check(damage.damage==27 and damage.stab==1.5,"known physical/STAB damage vector")
	a.status="burn"
	check(m.MuseMath.damage(a,m._math_record(m.foe),{"category":"physical","type":"normal","power":35},1,1).damage==13,"burn halves physical damage")
	m=model("pokemon:37","pokemon:16")
	m.team[0].speed=1
	m.foe.moves=["tackle"]
	check(m.submit({"kind":"move","id":"quick-attack"})=="" and m.queue[0].side=="ally","Quick Attack priority beats higher Speed")
	m=model()
	m.team[0].pp["water-gun"]=1
	event=hit(m,"water-gun")
	check(m.team[0].pp["water-gun"]==0 and "water-gun" not in m.available(m.team[0]),"actual move consumes its last PP")
	for id in m.team[0].moves: m.team[0].pp[id]=0
	m.state="choose"
	check(m.validate({"kind":"move","id":"struggle"})=="","exhausted party member can Struggle")
	m.team[0].stages.accuracy=-6
	var hp: int=m.team[0].hp
	event=hit(m,"struggle")
	check(event.hit and m.team[0].hp<hp,"Struggle ignores accuracy reduction and has recoil")
	m=model("pokemon:37","pokemon:194")
	event=hit(m,"tail-whip")
	check(event.damage==0 and m.foe.stages.defense==-1,"Tail Whip changes defense without damage")
	for i in 8: hit(m,"tail-whip")
	check(m.foe.stages.defense==-6,"stat reductions cap at six stages")
	m=model("pokemon:194","pokemon:37")
	event=hit(m,"mud-shot")
	check(event.damage>0 and m.foe.stages.speed==-1 and m.speed(m.foe)<m.foe.speed,"Mud Shot reduces effective Speed")
	m=model("pokemon:16","pokemon:194")
	event=hit(m,"sand-attack")
	check(event.damage==0 and m.foe.stages.accuracy==-1,"Sand Attack reduces accuracy")
	m=model("pokemon:37","pokemon:194",50)
	var burned := false
	for seed_value in 100:
		m.foe.hp=9999; m.foe.status=""; m.state="resolving"
		m.queue=[{"side":"ally","action":{"kind":"move","id":"ember"}}]
		m.rng.seed=seed_value
		m.advance()
		if m.foe.status=="burn": burned=true; break
	check(burned,"Ember can apply its sourced secondary burn")
	m=model()
	m.team[0].status="burn"
	hp=m.team[0].hp
	m.queue=[]; m.state="resolving"
	event=m.advance()
	check(m.team[0].hp==hp-maxi(1,floori(m.team[0].max_hp/8.0)) and "burn" in event.text,"burn deals residual damage and reports it")
	m.team.append(Catalogue.creature("pokemon:37",15))
	m.team[0].stages.speed=-2
	m.state="choose"
	m.submit({"kind":"switch","target":1});m.advance()
	check(m.team[0].stages.is_empty(),"switch clears outgoing temporary stat stages")
	m.team[0].hp=0; m.team[1].status="burn"; m.state="switch"
	hp=m.team[1].hp
	m.active=0; m.state="switch"
	m.submit({"kind":"switch","target":1});m.advance();m.advance()
	check(m.team[1].hp==hp,"forced replacement does not add an extra burn tick")
	check(Catalogue.creature("pokemon:16").catch_rate==255 and Catalogue.creature("pokemon:37").catch_rate==190,"species capture rates differ")
	var easy: Dictionary = m.MuseMath.catch_values(20,20,1,"",1,255)
	var harder: Dictionary = m.MuseMath.catch_values(20,20,1,"",1,190)
	check(easy.a>harder.a and m.MuseMath.catch_values(20,1,1,"burn",1,190).a>harder.a,"catching uses species rate, health and burn bonus")
	p=Catalogue.creature("pokemon:16",8);p.individual=41;p.hp=0;p.pp.tackle=0
	var text := Catalogue.gain_xp(p,Catalogue.threshold(p.id,9)-p.xp)
	check(p.level==9 and p.individual==41 and p.hp==0 and p.pp.tackle==0 and "gust" in p.moves and "Learned Gust" in text,"leveling preserves identity, fainting and spent PP; learns Gust")
	p=Catalogue.creature("pokemon:194",5);p.hp=1
	var missing: int=p.max_hp-p.hp
	Catalogue.gain_xp(p,1000)
	check(p.level>5 and p.max_hp-p.hp==missing,"leveling preserves damage deficit while growing stats")
	Catalogue.gain_xp(p,999999999)
	check(p.level==100 and p.xp==Catalogue.threshold(p.id,100),"XP safely caps at Level 100")
	# Actual schema-one input, including zero HP/PP and stored individuals.
	var path := "user://wb_rules_%d.json" % OS.get_process_id()
	clean(path)
	var old := Profile.Legacy.fresh()
	old.started=true;old.next_id=4;old.coins=713;old.first_catch=true;old.room="trail";old.position=[122,-2]
	for i in 3:
		var c := Catalogue.Legacy.creature(Catalogue.IDS[i]);c.individual=i+1
		c.hp=0 if i==0 else floori(c.max_hp/2.0)
		c.pp[c.moves[0]]=0 if i==0 else floori(c.pp[c.moves[0]]/2.0)
		if i<2:old.team.append(Catalogue.Legacy.encode(c))
		else:old.box.append(Catalogue.Legacy.encode(c))
	check(Profile.Legacy.valid(old),"migration fixture is independently valid v1")
	raw(path,old)
	var profile := Profile.new()
	check(profile.open_profile(path) and Profile.valid(profile.state) and profile.state.version==3,"valid v1 migrates and immediately writes a valid v3 checkpoint")
	check(profile.state.team[0].individual==1 and profile.state.team[1].individual==2 and profile.state.box[0].individual==3 and profile.state.next_id==4,"migration keeps party/storage order and individual IDs")
	check(profile.state.coins==713 and profile.state.first_catch and float(profile.state.position[0])==122.0 and float(profile.state.position[1]) == -2.0,"migration retains wallet, milestones and route position")
	check(profile.state.team[0].level==12 and profile.state.team[0].hp==0 and profile.state.team[0].pp.values().all(func(v):return v==0),"legacy fainted/exhausted partner is never silently healed")
	var restored := Catalogue.decode(profile.state.team[1])
	check(absf(float(restored.hp)/restored.max_hp-.5)<.07 and restored.pp.ember<25,"migration preserves health and remaining-use fractions conservatively")
	var backup_hash := FileAccess.get_sha256(path+".pre-v2")
	check(JSON.stringify(JSON.parse_string(FileAccess.get_file_as_string(path+".pre-v2")))==JSON.stringify(JSON.parse_string(JSON.stringify(old))),"independent pre-upgrade backup retains all verified old data")
	profile=Profile.new()
	check(profile.open_profile(path) and profile.state.team[0].level==12 and FileAccess.get_sha256(path+".pre-v2")==backup_hash,"reopening v3 never repeats migration or rewrites original backup")
	profile.state.team[1].status="burn";profile.save()
	var reopened := Profile.new()
	check(reopened.open_profile(path) and reopened.state.team[1].status=="burn","burn persists through save/reload")
	for value in [-1,101,5.5]:
		var bad := profile.state.duplicate(true);bad.team[0].level=value
		check(not Profile.valid(bad),"invalid level rejected: %s" % value)
	var bad := profile.state.duplicate(true);bad.team[0].xp=0
	check(not Profile.valid(bad),"XP inconsistent with level rejected")
	var future := Profile.fresh();future.version=4
	raw(path+".tmp",future)
	var held := Profile.new()
	check(not held.open_profile(path) and held.hold and not held.save(),"future temporary checkpoint protects current primary from rollback")
	clean(path)
	raw(path,old);raw(path+".pre-v2","broken")
	held=Profile.new()
	var original_hash := FileAccess.get_sha256(path)
	check(not held.open_profile(path) and held.hold and FileAccess.get_sha256(path)==original_hash,"invalid migration backup holds writes and leaves original untouched")
	clean(path)
	raw(path,"broken");raw(path+".bak",old)
	held=Profile.new()
	check(held.open_profile(path) and held.state.version==3,"valid legacy backup recovers and migrates a truncated primary")
	clean(path)
	print("Pokemon rules checks: %d passed, %d failed" % [passed,failed])
	quit(1 if failed else 0)
