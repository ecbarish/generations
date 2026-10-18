extends "res://tests/journey/rounds.gd"
var reserves: Array=[]
var defeated_xp := 0
var sent_out := 1
func setup_roster(party: Array, opponents: Array, definitions: Dictionary, seed_value: int) -> void:
	setup(party,opponents[0],definitions,{},seed_value)
	reserves=opponents.slice(1).duplicate(true);defeated_xp=0;sent_out=1
func finish(event: Dictionary) -> void:
	if foe.hp<=0 and team.all(func(c):return c.hp<=0):
		event.text+=" Your team needs a rest.";_end("lost");return
	if foe.hp<=0 and not reserves.is_empty():
		defeated_xp+=maxi(1,floori(foe.base_experience*foe.level/7.0))
		event.text+=" %s fainted." % foe.name
		foe=reserves.pop_front();foe.stages={};sent_out+=1
		queue.clear();state="choose";residual_due=false;round_number+=1
		if team[active].hp<=0:state="switch"
		event.text+=" Isolde sent out %s!" % foe.name;event["sent_out"]=true
		return
	super.finish(event)
func validate(action: Dictionary) -> String:
	if action.get("kind") in ["catch","run"]: return "This is a friendly trainer battle. Choose a move, partner or item."
	return super.validate(action)
