extends "res://tests/journey/battle.gd"
var trainer_name := ""
func restart() -> void:
	super.restart()
	if trainer_name!="":
		model=preload("res://tests/opening/trainer_rounds.gd").new()
		model.setup(supplies.team,Catalogue.creature(opponent_id,5),Catalogue.DATA.moves,{},randi())
		for i in model.team.size():
			for id in model.team[i].moves: model.team[i].pp[id]=int(supplies.team[i].pp[id])
			if model.team[model.active].hp<=0 and model.team[i].hp>0: model.active=i
		model.berries=supplies.berries;model.lures=supplies.lures
		shown=[float(model.team[model.active].hp),float(model.foe.hp)]
		message="%s sent out %s!" % [trainer_name,model.foe.name]
		_build_menu()
func _build_menu() -> void:
	super._build_menu()
	if trainer_name!="" and model!=null and model.state=="choose" and page=="commands" and event.is_empty():
		buttons[3].disabled=true;buttons[4].disabled=true
func _act(action: Dictionary) -> void:
	if trainer_name!="" and action.kind in ["catch","run"]:
		message="This is a friendly trainer battle. Choose a move, partner or item."
		queue_redraw();return
	super._act(action)
func _draw() -> void:
	super._draw()
	if trainer_name!="":
		draw_style_box(_paper(),Rect2(7,3,370,17))
		_text(Vector2(13,15),"%s / Friendly Battle" % trainer_name,10)
		_text(Vector2(282,15),"Round %d" % model.round_number,9)
