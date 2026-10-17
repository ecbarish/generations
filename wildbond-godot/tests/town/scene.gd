extends "res://tests/thornwood_environment/scene.gd"
## Save-free town presentation study. Original building geometry; inherited CC0 foliage.
const TOWN_ROOT := "res://tests/town/"
const PAPER := Color("f8f1db")
const INK := Color("263e50")
var building_bounds: Array[Rect2] = []
var places: Array[Dictionary] = []
var room := "town"
var outside_position := Vector3.ZERO
var coins := 300
var menu: Panel
var dialogue: Panel
var detail: Panel
var prompt: Button
var location: Label
var hint: Label
var menu_button: Button
var modal_buttons: Array[Button] = []
var healing_lights: Array[MeshInstance3D] = []
var fountain: MeshInstance3D
var town_ground: MeshInstance3D
var trail_ground: MeshInstance3D
var heal_time := 0.0
var weather_origin := 0.0

func _build_world() -> void:
	super._build_world()
	# Reuse actors, lighting, weather and model loader; replace the forest layout.
	for p in props: p.queue_free()
	props.clear()
	occluders.clear()
	obstacles.clear()
	for lamp in lamps: lamp.queue_free()
	lamps.clear()
	for s in splashes: s.queue_free()
	splashes.clear()
	for child in get_children():
		if child is MeshInstance3D and child not in rain_nodes and child not in motes: child.queue_free()
	ground_material = ShaderMaterial.new()
	ground_material.shader = load(TOWN_ROOT+"ground.gdshader")
	var land := PlaneMesh.new()
	land.size = Vector2(90,70)
	town_ground=_mesh(land,Vector3(0,-.01,0),ground_material)
	_building(Vector3(-7,0,-5),Vector2(7,5),Color("cc514f"),"PARTNER CENTER","center")
	_building(Vector3(7,0,-5),Vector2(6,5),Color("518cae"),"MART","mart")
	_building(Vector3(-11,0,7),Vector2(5,4),Color("769b73"),"HOME","house")
	_building(Vector3(11,0,7),Vector2(5,4),Color("b08a55"),"HOME","house")
	_plaza()
	for x in [-17.0,17.0]:
		for z in [-12.0,-6.0,0.0,6.0,12.0]: _tree(Vector3(x,0,z),4.0,Color.WHITE)
	for x in [-12.0,-6.0,0.0,6.0,12.0]: _tree(Vector3(x,0,-13),4.8,Color.WHITE)
	for x in [-4.5,4.5]:
		for z in [3.0,8.0,-9.0]: _lantern(Vector3(x,0,z))
	for side in [-1,1]:
		for i in 10:
			_prop("flower_purpleA" if i%2 else "flower_yellowC",Vector3(side*(3.6+float(i%2)*.35),0,4+i*.36),.30,i)
		for i in 8: _fence(Vector3(side*(6+i*1.3),0,12))
	_sign(Vector3(0,0,11),"THORNWOOD",Color("587962"))
	places.append({"kind":"trail","at":Vector3(0,0,12),"label":"Thornwood Trail"})
	_make_room(60,"center")
	_make_room(90,"mart")
	_make_trail()
	player.position=Vector3(0,0,6)
	companion.position=Vector3(-1,0,7)
	creature.position=Vector3(123,0,-3)
	trail.clear()
	trail.append(player.position)
	for i in motes.size(): motes[i].position=Vector3(sin(i*1.8)*15,.6+fposmod(i*.3,1.5),cos(i*.8)*12)
	_apply_light()
	_update_camera()

func _solid(at: Vector3, dims: Vector3, color: Color) -> MeshInstance3D:
	return _box(at,dims,color)

func _text3(value: String, at: Vector3, size_px: int = 44, color: Color = PAPER) -> Label3D:
	var label := Label3D.new()
	label.text=value
	label.position=at
	label.font_size=size_px
	label.pixel_size=.005
	label.modulate=color
	label.outline_size=4
	label.outline_modulate=INK
	add_child(label)
	return label

func _roof(at: Vector3, width: float, depth: float, color: Color) -> void:
	var rise := 1.35
	var half := depth*.5+.35
	for side in [-1,1]:
		var roof := _solid(at+Vector3(0,rise*.5,side*half*.5),Vector3(width+.7,.18,sqrt(half*half+rise*rise)),color)
		roof.rotation.x=side*atan2(rise,half)
		for x in range(-3,4):
			var seam := _solid(roof.position+Vector3(float(x)*width/7,.10,0),Vector3(.035,.035,sqrt(half*half+rise*rise)),color.lightened(.13))
			seam.rotation.x=roof.rotation.x
	_solid(at+Vector3(0,rise,0),Vector3(width+.85,.18,.24),color.darkened(.15))
	# Cream gable end triangles close both sides beneath the pitched roof.
	var tool := SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	for side in [-1,1]:
		var x: float = width*.5*side
		var points := [Vector3(x,0,-depth*.5),Vector3(x,rise,0),Vector3(x,0,depth*.5)]
		if side<0: points.reverse()
		for point in points: tool.add_vertex(point)
	tool.generate_normals()
	_mesh(tool.commit(),at,_material(Color("e0d5b6")))

func _building(at: Vector3, dims: Vector2, roof_color: Color, title: String, kind: String) -> void:
	var previous_children := get_children()
	var w := dims.x
	var d := dims.y
	var front := at.z+d*.5
	_solid(at+Vector3(0,.12,0),Vector3(w+.4,.24,d+.4),Color("a9a7a0"))
	_solid(at+Vector3(0,1.5,0),Vector3(w,2.8,d),Color("e7dfc4"))
	_solid(at+Vector3(0,.5,0),Vector3(w+.04,.50,d+.04),Color("c5b995"))
	_roof(at+Vector3(0,2.9,0),w,d,roof_color)
	_solid(Vector3(at.x,1.03,front+.04),Vector3(1.15,1.9,.12),INK)
	_solid(Vector3(at.x,1.1,front+.12),Vector3(.92,1.55,.08),Color("7cb5bc"))
	_solid(Vector3(at.x,1.1,front+.18),Vector3(.045,1.6,.04),PAPER)
	_solid(Vector3(at.x,.17,front+.55),Vector3(1.8,.20,1.05),Color("c5c6b7"))
	for x in [-1,1]:
		_solid(Vector3(at.x+x*w*.32,1.45,front+.07),Vector3(1.3,1.3,.14),INK)
		_solid(Vector3(at.x+x*w*.32,1.45,front+.16),Vector3(1.08,1.08,.06),Color("9fcbd0"))
		_solid(Vector3(at.x+x*w*.32,1.45,front+.20),Vector3(.06,1.10,.05),PAPER)
		_solid(Vector3(at.x+x*w*.32,1.45,front+.20),Vector3(1.10,.06,.05),PAPER)
		_solid(Vector3(at.x+x*w*.32,.76,front+.22),Vector3(1.4,.18,.35),roof_color)
	_solid(Vector3(at.x,2.40,front+.19),Vector3(w*.86,.52,.28),roof_color.darkened(.12))
	_text3(title,Vector3(at.x,2.43,front+.35),70 if kind=="center" else 80)
	if kind in ["center","mart"]:
		var awning := _solid(Vector3(at.x,2.06,front+.60),Vector3(1.8,.12,1.0),roof_color)
		awning.rotation.x=.12
		_badge(Vector3(at.x,3.62,front-.6),roof_color)
	building_bounds.append(Rect2(at.x-w*.5-.18,at.z-d*.5-.18,w+.36,d+.36))
	places.append({"kind":kind,"at":Vector3(at.x,0,front+1.0),"label":"Partner Center" if kind=="center" else ("Mart" if kind=="mart" else "Home")})
	for x in [-1,1]: _prop("plant_bush",Vector3(at.x+x*(w*.5-.35),0,front+.4),.65)
	var holder := _actor(at)
	for node in get_children():
		if node is Node3D and node not in previous_children and node!=holder: node.reparent(holder,true)
	holder.set_meta("meshes",_mesh_nodes(holder))
	occluders.append(holder)

func _badge(at: Vector3, color: Color) -> void:
	var disc := CylinderMesh.new()
	disc.top_radius=.4
	disc.bottom_radius=.4
	disc.height=.13
	var emblem := _mesh(disc,at,_material(PAPER))
	emblem.rotation.x=PI*.5
	_solid(at+Vector3(0,0,.09),Vector3(.72,.10,.08),color.darkened(.45))
	var dot := SphereMesh.new()
	dot.radius=.13
	dot.height=.26
	_mesh(dot,at+Vector3(0,0,.12),_material(color))

func _fence(at: Vector3) -> void:
	_solid(at+Vector3(0,.45,0),Vector3(.13,.9,.13),PAPER)
	for y in [.28,.63]: _solid(at+Vector3(.6,y,0),Vector3(1.25,.09,.09),Color("ded3b5"))

func _sign(at: Vector3, title: String, color: Color) -> void:
	_solid(at+Vector3(0,.5,0),Vector3(.14,1,.14),Color("785b40"))
	_solid(at+Vector3(0,1,0),Vector3(2,.65,.14),color)
	_text3(title,at+Vector3(0,1.03,.09),30)

func _plaza() -> void:
	var basin := CylinderMesh.new()
	basin.top_radius=1.4
	basin.bottom_radius=1.55
	basin.height=.4
	_mesh(basin,Vector3(0,.2,-3),_material(Color("c4c2b3")))
	var pool := CylinderMesh.new()
	pool.top_radius=1.25
	pool.bottom_radius=1.25
	pool.height=.05
	var pool_material := _material(Color("629caa"),.17)
	pool_material.metallic=.2
	fountain=_mesh(pool,Vector3(0,.42,-3),pool_material)
	var stem := CylinderMesh.new()
	stem.top_radius=.16
	stem.bottom_radius=.3
	stem.height=1.2
	_mesh(stem,Vector3(0,.9,-3),_material(Color("bcc1ad")))
	var bowl := SphereMesh.new()
	bowl.radius=.6
	bowl.height=.22
	_mesh(bowl,Vector3(0,1.55,-3),_material(Color("d4cdb5")))
	for side in [-1,1]:
		_solid(Vector3(side*3,.58,-3),Vector3(1.7,.15,.6),Color("9a7148"))
		_solid(Vector3(side*3,.94,-3.28),Vector3(1.7,.55,.12),Color("9a7148"))
		for x in [-.6,.6]: _solid(Vector3(side*3+x,.27,-3),Vector3(.12,.55,.4),INK)
		building_bounds.append(Rect2(side*3-.95,-3.65,1.9,1.1))
		_prop("flower_yellowC",Vector3(side*2.3,0,-5.0),.4)

func _make_room(origin: float, kind: String) -> void:
	var accent := Color("d56b68") if kind=="center" else Color("5a96b2")
	_solid(Vector3(origin,-.12,0),Vector3(10,.22,8),Color("e7e3ce"))
	for x in range(-5,6):
		_solid(Vector3(origin+x,.005,0),Vector3(.025,.01,8),Color("c8c9bb"))
	for z in range(-4,5): _solid(Vector3(origin,.006,z),Vector3(10,.01,.025),Color("c8c9bb"))
	_solid(Vector3(origin,1.4,-4),Vector3(10,2.8,.2),Color("e5e0d0"))
	_solid(Vector3(origin,.7,-3.86),Vector3(10,.35,.08),accent)
	for x in [-5,5]: _solid(Vector3(origin+x,.6,0),Vector3(.15,1.2,8),Color("cec9b5"))
	_solid(Vector3(origin,.6,-1.4),Vector3(8,1.2,.85),accent)
	_solid(Vector3(origin,1.26,-1.4),Vector3(8.2,.15,1),PAPER)
	_solid(Vector3(origin,.02,3.15),Vector3(1.8,.05,1),accent)
	_text3("PARTNER CENTER" if kind=="center" else "TOWN MART",Vector3(origin,2.1,-3.8),56,accent)
	if kind=="center":
		_solid(Vector3(origin,1.65,-2.6),Vector3(3.1,1.1,.8),INK)
		for i in 6:
			var ball := SphereMesh.new()
			ball.radius=.17
			ball.height=.34
			var light := _mesh(ball,Vector3(origin-1+float(i%3),1.48+float(i/3)*.45,-2.12),_material(Color("e78888")))
			healing_lights.append(light)
		for side in [-1,1]:
			_solid(Vector3(origin+side*3.7,.42,1.0),Vector3(1.4,.7,1.6),Color("c2b59e"))
			_solid(Vector3(origin+side*3.7,.81,1.0),Vector3(1.4,.14,1.6),Color("b4c9b6"))
	else:
		for side in [-1,1]:
			_solid(Vector3(origin+side*3.5,.85,1),Vector3(1.3,1.7,1.5),Color("b5aa88"))
			for y in [.4,1.0,1.6]:
				_solid(Vector3(origin+side*3.5,y,1.8),Vector3(1.5,.1,.1),PAPER)
				for x in [-.4,.1,.5]: _solid(Vector3(origin+side*3.5+x,y+.17,1.5),Vector3(.23,.3,.25),accent.lightened(x+.1))
	for x in [-4.2,4.2]: _prop("plant_bush",Vector3(origin+x,0,-3),.8)

func _make_trail() -> void:
	trail_ground=_solid(Vector3(120,-.14,0),Vector3(22,.25,22),Color("698655"))
	_solid(Vector3(120,.005,0),Vector3(2.8,.025,20),Color("bca57c"))
	for side in [-1,1]:
		for i in 7: _tree(Vector3(120+side*(5+sin(i)*1.2),0,-8+i*2.8),4.5,Color.WHITE)
	_sign(Vector3(118,0,7),"TOWN",Color("577d67"))
	_lantern(Vector3(122,0,6))

func _blocked(at: Vector3) -> bool:
	if room in ["center","mart"]:
		var origin := 60.0 if room=="center" else 90.0
		return absf(at.x-origin)>4.7 or at.z>3.8 or at.z<-.55 or (absf(at.x-origin)>2.8 and at.z>.05 and at.z<2.1)
	if room=="trail":
		if absf(at.x-120)>8 or absf(at.z)>9: return true
	elif absf(at.x)>15.7 or absf(at.z)>13.5: return true
	if room=="town":
		if Vector2(at.x,at.z+3).length()<1.7: return true
		for rect in building_bounds:
			if rect.grow(.22).has_point(Vector2(at.x,at.z)): return true
	for at2 in obstacles:
		if Vector2(at.x,at.z).distance_to(at2)<.65: return true
	return false

func _update_camera() -> void:
	if camera==null or player==null: return
	camera.position=player.position+Vector3(0,10.8,14.5)
	camera.look_at(player.position+Vector3(0,.1,-2.4))
	camera.fov=43

func _style(color: Color = PAPER, border: Color = INK) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color=color
	box.border_color=border
	box.set_border_width_all(2)
	box.set_corner_radius_all(4)
	box.set_content_margin_all(4)
	box.shadow_color=Color(0,0,0,.23)
	box.shadow_offset=Vector2(1,2)
	box.shadow_size=1
	return box

func _panel(at: Vector2, dims: Vector2) -> Panel:
	var p := Panel.new()
	p.position=at
	p.size=dims
	p.add_theme_stylebox_override("panel",_style())
	ui.add_child(p)
	return p

func _label(parent: Node, value: String, at: Vector2, dims: Vector2, size_px: int = 10) -> Label:
	var label := Label.new()
	label.text=value
	label.position=at
	label.size=dims
	label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size",size_px)
	label.add_theme_color_override("font_color",INK)
	parent.add_child(label)
	label.size=dims
	return label

func _choice(parent: Node, title: String, at: Vector2, dims: Vector2, action: Callable) -> Button:
	var b := Button.new()
	b.text=title
	b.position=at
	b.add_theme_font_size_override("font_size",10)
	for state in ["normal","hover","focus","pressed","disabled"]:
		var box := _style(PAPER if state in ["normal","disabled"] else Color("c1ddd2"))
		box.set_content_margin_all(2)
		b.add_theme_stylebox_override(state,box)
		b.add_theme_color_override("font_"+state+"_color",INK)
	b.add_theme_color_override("font_color",INK)
	b.pressed.connect(action)
	parent.add_child(b)
	b.size=dims
	return b

func _build_ui() -> void:
	ui=CanvasLayer.new()
	add_child(ui)
	var tab := _panel(Vector2(5,5),Vector2(159,19))
	location=_label(tab,"THORNWOOD / Town",Vector2(7,3),Vector2(150,15),9)
	menu_button=_choice(ui,"Menu [Esc]",Vector2(306,5),Vector2(73,20),toggle_menu)
	hint=_label(ui,"WASD Walk   Shift Run   B Bag",Vector2(8,200),Vector2(200,12),8)
	hint.add_theme_color_override("font_color",PAPER)
	hint.add_theme_color_override("font_shadow_color",INK)
	hint.add_theme_constant_override("shadow_offset_x",1)
	hint.add_theme_constant_override("shadow_offset_y",1)
	prompt=_choice(ui,"",Vector2(231,184),Vector2(148,27),interact)
	prompt.hide()
	status=Label.new() # Parent battle/bag writes status; town uses contextual dialogue.
	status.hide()
	ui.add_child(status)

func _nearest() -> Dictionary:
	if room in ["center","mart"]:
		if player.position.z>2.3: return {"kind":"exit","label":"Leave"}
		if absf(player.position.x-(60 if room=="center" else 90))<2.7 and player.position.z<1.6:
			return {"kind":"heal" if room=="center" else "shop","label":"Restore Party" if room=="center" else "Buy Supplies"}
		return {}
	if room=="trail":
		if player.position.z>5.5: return {"kind":"town","label":"Return to Town"}
		if player.position.distance_to(creature.position)<2.4: return {"kind":"battle","label":"Meet "+(str(pack.entries[selected].name) if pack.entries.has(selected) else "Cindercub")}
		return {}
	var nearest := {}
	var distance := 1.9
	for place in places:
		var d := player.position.distance_to(place.at)
		if d<distance:
			distance=d
			nearest=place
	return nearest

func interact() -> void:
	if not active or _modal(): return
	var near := _nearest()
	match near.get("kind",""):
		"center","mart": change_room(near.kind)
		"exit": change_room("town")
		"heal": say("PARTNER CENTER","Welcome! Shall we restore your partners?",[{"text":"Restore","call":heal_party},{"text":"Later","call":close_dialogue}])
		"shop": open_shop()
		"house": say("HOME","The door is closed. The Center and Mart are open.")
		"trail": change_room("trail")
		"town": change_room("town")
		"battle": enter_battle()

func change_room(destination: String) -> void:
	close_dialogue()
	close_menu()
	if room=="town" and destination!="town": outside_position=player.position
	room=destination
	match room:
		"center": player.position=Vector3(60,0,2.6)
		"mart": player.position=Vector3(90,0,2.6)
		"trail": player.position=Vector3(120,0,5)
		_: player.position=outside_position if outside_position!=Vector3.ZERO else Vector3(0,0,6)
	companion.position=player.position+Vector3(-.9,0,.55)
	trail.clear()
	trail.append(player.position)
	following=false
	gait.advance(Vector2.ZERO,Vector3.ZERO,false)
	_animate_tamer()
	location.text={"town":"THORNWOOD / Town","center":"PARTNER CENTER","mart":"MART","trail":"THORNWOOD / Trail"}[room]
	for drop in rain_nodes: drop.visible=rainy and room in ["town","trail"]
	var next_origin := 120.0 if room=="trail" else 0.0
	for drop in rain_nodes: drop.position.x+=next_origin-weather_origin
	weather_origin=next_origin
	_apply_light()
	_update_camera()

func _modal() -> bool:
	return menu!=null or dialogue!=null or bag!=null

func toggle_menu() -> void:
	if not active or bag!=null or dialogue!=null: return
	if menu!=null: close_menu(); return
	menu=_panel(Vector2(246,30),Vector2(133,167))
	_label(menu,"WILDBOND",Vector2(10,7),Vector2(115,18),12)
	modal_buttons.clear()
	var rows := ["Party","Bag","Town Map","Time & Weather","Close"]
	for i in rows.size():
		var callback: Callable
		match i:
			0: callback=show_party
			1: callback=func(): close_menu(); open_bag()
			2: callback=show_map
			3: callback=show_options
			_: callback=close_menu
		modal_buttons.append(_choice(menu,rows[i],Vector2(7,30+i*26),Vector2(119,24),callback))
	modal_buttons[0].grab_focus()
	prompt.hide()

func close_menu() -> void:
	if detail!=null: detail.queue_free(); detail=null
	if menu!=null: menu.queue_free(); menu=null
	modal_buttons.clear()
	menu_button.grab_focus()

func _detail(title: String) -> void:
	if detail!=null: detail.queue_free()
	detail=_panel(Vector2(5,30),Vector2(235,166))
	_label(detail,title,Vector2(10,7),Vector2(214,21),12)

func show_party() -> void:
	_detail("PARTY")
	for i in supplies.team.size():
		var c: Dictionary=supplies.team[i]
		_label(detail,"%s   Lv.%d" % [c.name,c.level],Vector2(12,34+i*52),Vector2(210,16))
		var bar := ColorRect.new()
		bar.position=Vector2(12,53+i*52)
		bar.size=Vector2(123,8)
		bar.color=INK
		bar.mouse_filter=Control.MOUSE_FILTER_IGNORE
		detail.add_child(bar)
		var fill := ColorRect.new()
		fill.position=Vector2(2,2)
		fill.size=Vector2(119*clampf(float(c.hp)/float(c.max_hp),0,1),4)
		fill.color=Color("64ab72") if float(c.hp)/float(c.max_hp)>.5 else Color("d5ae51")
		fill.mouse_filter=Control.MOUSE_FILTER_IGNORE
		bar.add_child(fill)
		_label(detail,"%d/%d HP" % [c.hp,c.max_hp],Vector2(145,48+i*52),Vector2(80,17),9)

func show_map() -> void:
	_detail("TOWN MAP")
	_label(detail,"CENTER          MART\n\n         Plaza\n\nHome                  Home\n\n     Thornwood Trail",Vector2(17,33),Vector2(206,126),11)

func show_options() -> void:
	_detail("TIME & WEATHER")
	_choice(detail,"Night / Day [N]",Vector2(12,34),Vector2(210,28),func(): set_night(not night))
	_choice(detail,"Rain / Clear [R]",Vector2(12,70),Vector2(210,28),func(): set_rain(not rainy))
	_choice(detail,"Sunset [T]",Vector2(12,106),Vector2(210,28),func(): sunset=not sunset; _apply_light())

func say(title: String, line: String, choices: Array = []) -> void:
	close_dialogue()
	dialogue=_panel(Vector2(5,147),Vector2(374,65))
	_label(dialogue,title,Vector2(9,4),Vector2(340,15),9)
	_label(dialogue,line,Vector2(10,20),Vector2(350,22),9)
	if choices.is_empty(): choices=[{"text":"Continue","call":close_dialogue}]
	for i in choices.size():
		var b := _choice(dialogue,choices[i].text,Vector2(220-i*105,43),Vector2(100,19),choices[i].call)
		if i==0: b.grab_focus()
	prompt.hide()

func close_dialogue() -> void:
	if dialogue!=null: dialogue.queue_free(); dialogue=null

func heal_party() -> void:
	for c in supplies.team:
		c.hp=c.max_hp
		c["status"]=""
		c["stages"]={}
		for id in c.moves: c.pp[id]=int(supplies.moves[id].get("pp",20))
	heal_time=2.4
	say("PARTNER CENTER","Your partners are fully restored. Take care out there!")

func open_shop() -> void:
	say("MART  /  %d coins" % coins,"What would you like?",[{"text":"Berry  40","call":func(): buy("berry")},{"text":"Ball  75","call":func(): buy("ball")},{"text":"Leave","call":close_dialogue}])

func buy(item: String) -> void:
	var price := 40 if item=="berry" else 75
	if coins<price:
		say("MART","You don't have enough coins for that.")
		return
	coins-=price
	if item=="berry": supplies.berries+=1
	else: supplies.lures+=1
	say("MART","One %s added to your Bag. %d coins left." % ["Ranch Berry" if item=="berry" else "Bond Ball",coins],[{"text":"Buy More","call":open_shop},{"text":"Done","call":close_dialogue}])

func open_bag() -> void:
	if menu!=null or dialogue!=null: return
	super.open_bag()

func set_rain(value: bool) -> void:
	super.set_rain(value)
	for drop in rain_nodes: drop.visible=value and room in ["town","trail"]

func _apply_light() -> void:
	super._apply_light()
	if environment==null: return
	var indoor := room in ["center","mart"]
	environment.background_mode=Environment.BG_COLOR if indoor else Environment.BG_SKY
	environment.background_color=Color("24343e")
	environment.fog_enabled=not indoor
	if town_ground!=null: town_ground.visible=not indoor
	if trail_ground!=null: trail_ground.visible=not indoor
	if indoor:
		sun.light_color=Color("fff1d6")
		sun.light_energy=1.1
		environment.ambient_light_energy=.5
		for actor in [human,partner,sprite]:
			if actor!=null: actor.modulate=Color.WHITE

func enter_battle() -> void:
	if room!="trail" or _modal(): return
	super.enter_battle()

func _return(result: String) -> void:
	super._return(result)

func _process(dt: float) -> void:
	var previous := active
	if _modal(): active=false
	super._process(dt)
	active=previous
	if player==null or prompt==null: return
	var near := _nearest()
	prompt.visible=active and not _modal() and not near.is_empty()
	if not near.is_empty(): prompt.text="E  "+str(near.label)
	heal_time=maxf(0,heal_time-dt)
	for light in healing_lights:
		var m := light.material_override as StandardMaterial3D
		m.emission_enabled=heal_time>0
		m.emission=Color("ffdd93")
		m.emission_energy_multiplier=1.5+sin(seconds*10)*.5

func _unhandled_key_input(e: InputEvent) -> void:
	if not e is InputEventKey or not e.pressed or e.echo: return
	if bag!=null or not active: return
	if e.keycode==KEY_ESCAPE:
		if dialogue!=null: close_dialogue()
		else: toggle_menu()
	elif e.keycode==KEY_E and not _modal(): interact()
	elif not _modal():
		match e.keycode:
			KEY_B: open_bag()
			KEY_N: set_night(not night)
			KEY_R: set_rain(not rainy)
			KEY_T: sunset=not sunset; _apply_light()
			_: return
	else: return
	get_viewport().set_input_as_handled()
