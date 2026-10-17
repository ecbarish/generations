extends Node3D
## Measured layout blockout, isolated from adventure scenes/saves.
const Pack := preload("res://tests/private_sprites/pack.gd")
const Motion := preload("res://tests/private_sprites/actor_motion.gd")
const CELL := 1.25
var plan: Dictionary
var pack := Pack.new()
var gait := Motion.new()
var pack_path := ""
var cells: Dictionary = {}
var proposal_cells: Dictionary = {}
var anchors: Array[Dictionary] = []
var player: Node3D
var human: Sprite3D
var atlas := AtlasTexture.new()
var camera: Camera3D
var ui: CanvasLayer
var note: Label
var mode_label: Button
var proposed := true
var overhead := false
var lane_geometry: Node3D
var portal: MeshInstance3D

func point(cell: Vector2i) -> Vector3:
	return Vector3((cell.x-11)*CELL,0,cell.y*CELL)

func _ready() -> void:
	plan=JSON.parse_string(FileAccess.get_file_as_string("res://tests/layout_plan/layout.json"))
	pack.open_pack(pack_path if pack_path!="" else Pack.configured_root())
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode=Environment.BG_COLOR
	env.background_color=Color("b7c8c6")
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color=Color("d5ddcc")
	env.ambient_light_energy=.4
	env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure=.9
	world.environment=env
	add_child(world)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees=Vector3(-55,-35,0)
	sun.light_color=Color("fff0d2")
	sun.light_energy=1.0
	sun.shadow_enabled=true
	add_child(sun)
	lane_geometry=Node3D.new()
	add_child(lane_geometry)
	for map in plan.maps:
		_build_map(map,self,cells)
		for door in map.doors:
			var bits: PackedStringArray=str(door).split(",")
			var at := Vector2i(int(bits[0])+int(map.offset[0]),int(bits[1])+int(map.offset[1]))
			var title: String={"inn":"INN / HEALING","shop":"SHOP","ranch":"RANCH"}.get(map.doors[door],map.doors[door])
			_anchor(at,title,"Existing door: %s at local tile (%s). Interior is outside this blockout." % [map.doors[door],door])
		for person in map.npcs:
			var at := Vector2i(int(person.at[0])+int(map.offset[0]),int(person.at[1])+int(map.offset[1]))
			_anchor(at,str(person.who).capitalize(),"Existing NPC anchor; no dialogue or quest changes.",Color("5d7fa7"))
		for item in map.items:
			var at := Vector2i(int(item.at[0])+int(map.offset[0]),int(item.at[1])+int(map.offset[1]))
			_anchor(at,"ITEM","Existing item anchor: "+str(item.id),Color("c9a554"))
	for map in plan.proposals: _build_map(map,lane_geometry,proposal_cells)
	for pair in plan.connector:
		var at := Vector2i(pair[0],pair[1])
		cells[at]="."
		_cube(self,point(at)-Vector3(0,.04,0),Vector3(CELL,.08,CELL),Color("c6b891"))
	# This is a candidate west opening, never an adventure exit assignment.
	portal=_cube(self,point(Vector2i(0,7))+Vector3(0,.03,0),Vector3(CELL,.08,CELL),Color("d6a651"))
	_anchor(Vector2i(-14,7),"LARKBURROW / CLOSED","Later home shortcut to Threadmeet: Stone Break + Loom Badge. Not open in this study.",Color("d6a651"),lane_geometry)
	_anchor(Vector2i(25,-10),"DEWCUT / RESERVED","Planned branch replaces the direct grove entrance; Stone partner still required at the far shelf.")
	_anchor(Vector2i(10,-20),"THORNWOOD / CONTINUES","Regional map continues north to Thornwood, Rootwater and the Knothollow loop.")
	player=Node3D.new()
	player.position=point(Vector2i(11,7))
	add_child(player)
	human=Sprite3D.new()
	human.billboard=BaseMaterial3D.BILLBOARD_ENABLED
	human.texture_filter=BaseMaterial3D.TEXTURE_FILTER_NEAREST
	human.alpha_cut=SpriteBase3D.ALPHA_CUT_DISCARD
	player.add_child(human)
	if pack.trainer_texture(false)==null:
		human.hide()
		_cube(player,Vector3(0,.65,0),Vector3(.4,1.3,.35),Color("426e84"))
	_animate()
	camera=Camera3D.new()
	add_child(camera)
	camera.current=true
	_build_ui()
	_update_camera()

func _cube(parent: Node, at: Vector3, size3: Vector3, color: Color) -> MeshInstance3D:
	var mesh := MeshInstance3D.new()
	var shape := BoxMesh.new()
	shape.size=size3
	mesh.mesh=shape
	var material := StandardMaterial3D.new()
	material.albedo_color=color
	material.roughness=.95
	mesh.material_override=material
	mesh.position=at
	parent.add_child(mesh)
	return mesh

func _build_map(map: Dictionary, parent: Node3D, grid: Dictionary) -> void:
	var nodes: Array[Transform3D] = []
	var colors: Array[Color] = []
	for y in map.rows.size():
		for x in str(map.rows[y]).length():
			var glyph: String=map.rows[y][x]
			var at := Vector2i(x+int(map.offset[0]),y+int(map.offset[1]))
			grid[at]=glyph
			if map.id=="larkhaven" and at==Vector2i(0,7): continue
			var height: float={"T":1.4,"r":2.2,"#":1.8,"=":.7,"P":.65,"~":.04,"C":1.5}.get(glyph,.06)
			var color: Color={"T":Color("789084"),"r":Color("be8173"),"#":Color("c9c5b6"),"=":Color("a69c83"),"P":Color("bc9b57"),"~":Color("72a3b4"),"D":Color("e9b95e"),".":Color("d7ccb0"),"\"":Color("91aa72"),"C":Color("777380")}.get(glyph,Color("b0b99c"))
			nodes.append(Transform3D(Basis.from_scale(Vector3(CELL-.015,height,CELL-.015)),point(at)+Vector3(0,height*.5-.06,0)))
			colors.append(color)
	var multi := MultiMesh.new()
	multi.transform_format=MultiMesh.TRANSFORM_3D
	multi.use_colors=true
	multi.mesh=BoxMesh.new()
	multi.instance_count=nodes.size()
	for i in nodes.size():
		multi.set_instance_transform(i,nodes[i])
		multi.set_instance_color(i,colors[i])
	var instance := MultiMeshInstance3D.new()
	instance.multimesh=multi
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo=true
	m.vertex_color_is_srgb=true
	m.roughness=.95
	instance.material_override=m
	parent.add_child(instance)

func _anchor(at: Vector2i, title: String, description: String, color: Color = Color("e7d7aa"), parent: Node3D = null) -> void:
	if parent==null: parent=self
	_cube(parent,point(at)+Vector3(0,.12,0),Vector3(.38,.24,.38),color)
	anchors.append({"at":at,"title":title,"description":description,"planned":parent==lane_geometry})
	var label := Label3D.new()
	label.position=point(at)+Vector3(0,.8,0)
	label.text=title
	label.font_size=24
	label.pixel_size=.008
	label.modulate=Color("fff6d9")
	label.outline_modulate=Color("243b42")
	label.outline_size=5
	label.billboard=BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test=true
	parent.add_child(label)

func glyph_at(at: Vector2i) -> String:
	if proposed:
		if at==Vector2i(0,7): return "."
		if proposal_cells.has(at): return proposal_cells[at]
	return cells.get(at,"T")

func blocked(at: Vector3) -> bool:
	for dx in [-.16,.16]:
		for dz in [-.16,.16]:
			var tile := Vector2i(roundi((at.x+dx)/CELL)+11,roundi((at.z+dz)/CELL))
			if glyph_at(tile) in plan.solid or glyph_at(tile)=="C": return true
	return false

func move_player(direction: Vector2, dt: float, sprint: bool = false) -> void:
	var before := player.position
	var step := direction.limit_length()*dt*(4.8 if sprint else 3.0)
	var next := player.position+Vector3(step.x,0,0)
	if not blocked(next): player.position=next
	next=player.position+Vector3(0,0,step.y)
	if not blocked(next): player.position=next
	gait.advance(direction,player.position-before,sprint)
	_animate()

func _animate() -> void:
	var texture := pack.trainer_texture(gait.running)
	if texture==null: return
	atlas.atlas=texture
	atlas.region=Rect2(gait.trainer_frame()*16,0,16,32)
	human.texture=atlas
	human.flip_h=gait.face.x>0
	human.pixel_size=.05
	human.offset=Vector2(0,16)

func _build_ui() -> void:
	ui=CanvasLayer.new()
	add_child(ui)
	var panel := Panel.new()
	panel.position=Vector2(5,5)
	panel.size=Vector2(374,23)
	var style := StyleBoxFlat.new()
	style.bg_color=Color("f2ead7")
	style.border_color=Color("294449")
	style.set_border_width_all(2)
	panel.add_theme_stylebox_override("panel",style)
	ui.add_child(panel)
	var title := Label.new()
	title.text="LARKHAVEN / Measured Blockout"
	title.position=Vector2(7,4)
	title.add_theme_font_size_override("font_size",10)
	title.add_theme_color_override("font_color",Color("294449"))
	panel.add_child(title)
	mode_label=Button.new()
	mode_label.position=Vector2(252,7)
	mode_label.add_theme_font_size_override("font_size",8)
	mode_label.text="P: Planned west branch"
	mode_label.pressed.connect(toggle_plan)
	ui.add_child(mode_label)
	mode_label.size=Vector2(123,18)
	var footer := Panel.new()
	footer.position=Vector2(5,177)
	footer.size=Vector2(374,35)
	footer.add_theme_stylebox_override("panel",style)
	ui.add_child(footer)
	note=Label.new()
	note.position=Vector2(7,4)
	note.add_theme_font_size_override("font_size",8)
	note.add_theme_color_override("font_color",Color("294449"))
	note.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	footer.add_child(note)
	note.size=Vector2(358,29)
	note.text="WASD: Walk  Shift: Run  Tab: Overhead  P: Current/Planned  E: Inspect nearby anchor"

func toggle_plan() -> void:
	proposed=not proposed
	lane_geometry.visible=proposed
	portal.scale.y=1 if proposed else 20
	mode_label.text="P: Planned west branch" if proposed else "P: Current map only"
	if blocked(player.position): player.position=point(Vector2i(11,7))

func inspect() -> void:
	var nearest: Dictionary={}
	var distance := 2.6
	for anchor in anchors:
		if anchor.planned and not proposed: continue
		var d := player.position.distance_to(point(anchor.at))
		if d<distance:
			distance=d
			nearest=anchor
	if not nearest.is_empty(): note.text=nearest.title+": "+nearest.description

func _update_camera() -> void:
	if overhead:
		camera.projection=Camera3D.PROJECTION_ORTHOGONAL
		camera.size=68
		camera.position=Vector3(-6,60,-4)
		camera.rotation_degrees=Vector3(-90,0,0)
	else:
		camera.projection=Camera3D.PROJECTION_PERSPECTIVE
		camera.position=player.position+Vector3(0,10,12)
		camera.look_at(player.position+Vector3(0,0,-2))
		camera.fov=48

func _process(dt: float) -> void:
	if player==null: return
	var direction := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): direction.x-=1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): direction.x+=1
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): direction.y-=1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): direction.y+=1
	move_player(direction,dt,Input.is_physical_key_pressed(KEY_SHIFT))
	_update_camera()

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo: return
	match event.keycode:
		KEY_TAB: overhead=not overhead; _update_camera()
		KEY_P: toggle_plan()
		KEY_E: inspect()
		_: return
	get_viewport().set_input_as_handled()
