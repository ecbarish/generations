extends "res://tests/journey/battle.gd"
var trainer_name := ""
var trainer_roster: Array=[]
var original_art := preload("res://tests/starter_sprites/art.gd").new()
var original_portraits := {}

func _ready() -> void:
	original_art.open();super._ready()

func _creature(c: Dictionary, foot: Vector2, back: bool, side: String) -> void:
	if c.id not in Catalogue.STARTERS:
		if original_portraits.has(side):original_portraits[side].hide()
		super._creature(c,foot,back,side);return
	if not original_portraits.has(side):
		var portrait := preload("res://tests/starter_sprites/presentation.gd").new()
		add_child(portrait);original_portraits[side]=portrait
	var portrait: TextureRect=original_portraits[side]
	portrait.visible=c.hp>0
	if not portrait.visible:return
	var recoil := 0.0
	if motion and event.get("hit",false) and event.get("side",side)!=side and message_time>0:recoil=roundf(sin(clock*35)*minf(2,message_time))
	portrait.animate=motion and model.state!="ended"
	portrait.configure(original_art,str(c.id).trim_prefix("wildbond:"),back,foot+Vector2(recoil,0))
	draw_set_transform(foot,0,Vector2(1,.22));draw_circle(Vector2.ZERO,24,Color(.1,.2,.15,.22));draw_set_transform(Vector2.ZERO)
func restart() -> void:
	super.restart()
	if trainer_name!="":
		model=preload("res://tests/opening/trainer_rounds.gd").new()
		if not trainer_roster.is_empty():
			var opponents := trainer_roster.map(func(row):return Catalogue.creature(row[0],row[1]))
			model.setup_roster(supplies.team,opponents,Catalogue.DATA.moves,randi())
		else:model.setup(supplies.team,Catalogue.creature(opponent_id,5),Catalogue.DATA.moves,{},randi())
		for i in model.team.size():
			for id in model.team[i].moves: model.team[i].pp[id]=int(supplies.team[i].pp[id])
			if model.team[model.active].hp<=0 and model.team[i].hp>0: model.active=i
		model.berries=supplies.berries;model.lures=supplies.lures
		shown=[float(model.team[model.active].hp),float(model.foe.hp)]
		message="%s sent out %s!" % [trainer_name,model.foe.name]
		_build_menu()
func _continue() -> void:
	super._continue()
	if event.get("sent_out",false):shown[1]=float(model.foe.hp)
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
		if not trainer_roster.is_empty():_text(Vector2(204,15),"Partner %d/%d" % [model.sent_out,trainer_roster.size()],8)
		_text(Vector2(282,15),"Round %d" % model.round_number,9)
