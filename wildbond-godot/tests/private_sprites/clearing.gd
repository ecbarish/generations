extends Node3D
## Isolated native presentation study. This scene never reads/writes adventure saves.
const Pack := preload("res://tests/private_sprites/pack.gd")
const Battle := preload("res://tests/private_sprites/battle.gd")
const Figures := preload("res://scripts/figures.gd")
const Art := preload("res://tests/battle_slice/muse_art.gd")
const Motion := preload("res://tests/private_sprites/actor_motion.gd")
const Bag := preload("res://tests/private_sprites/bag.gd")
const Fixture := preload("res://tests/battle_slice/fixture.gd")
var supplies: RefCounted
var bag: Control
var gait := Motion.new()
var partner_gait := Motion.new()
var human: Sprite3D
var partner: Sprite3D
var human_atlas := AtlasTexture.new()
var partner_atlas := AtlasTexture.new()
var fallback_people: Dictionary = {}
var partner_frames: Array = []
var axial_frames: Array = []
var axial_texture: Texture2D
var diagonal_texture: Texture2D
var partner_idle := 0.0
var trail: Array[Vector3] = []
var following := false
var pack := Pack.new()
var pack_path := ""
var selected := "pokemon:16"
var player: Node3D
var companion: Node3D
var creature: Node3D
var sprite: Sprite3D
var camera: Camera3D
var sun: DirectionalLight3D
var environment: Environment
var ui: CanvasLayer
var status: Label
var battle: Control
var return_position := Vector3.ZERO
var visited_result := ""
var seconds := 0.0
var night := false
var rainy := false
var rain_nodes: Array[MeshInstance3D] = []
var obstacles: Array[Vector2] = []
var facing := 0
var last_region := Rect2()
var active := true

func _ready() -> void:
	supplies = Fixture.create()
	pack.open_pack(pack_path if pack_path != "" else Pack.configured_root())
	_build_world()
	_build_ui()
	_refresh_creature()
	set_night(false)

func _material(color: Color, roughness: float = 1.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	return m

func _world_material(area: Rect2i, repeat: Vector2) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = ImageTexture.create_from_image(pack.world.get_image().get_region(area))
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	m.texture_repeat = true
	m.uv1_scale = Vector3(repeat.x, repeat.y, 1)
	m.albedo_color = Color(0.6, 0.7, 0.65)
	m.roughness = 1
	return m

func _mesh(shape: Mesh, at: Vector3, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = shape
	node.material_override = material
	node.position = at
	add_child(node)
	return node

func _box(at: Vector3, size3: Vector3, color: Color) -> MeshInstance3D:
	var shape := BoxMesh.new()
	shape.size = size3
	return _mesh(shape, at, _material(color))

func _tree(at: Vector3, height: float, tint: Color) -> void:
	obstacles.append(Vector2(at.x, at.z))
	if pack.world != null:
		var tree := _sprite(_actor(at))
		tree.texture = pack.world_tree
		tree.pixel_size = height / 32.0
		tree.offset.y = 16
		return
	var trunk := CylinderMesh.new()
	trunk.top_radius = 0.18
	trunk.bottom_radius = 0.26
	trunk.height = height * 0.65
	_mesh(trunk, at + Vector3(0, height * 0.325, 0), _material(Color("73513d")))
	for i in 3:
		var crown := CylinderMesh.new()
		crown.top_radius = 0.08
		crown.bottom_radius = (height * 0.38) - i * 0.24
		crown.height = height * 0.55
		crown.radial_segments = 7
		_mesh(crown, at + Vector3(0, height * (0.5 + i * 0.17), 0), _material(tint.lightened(i * 0.035)))

func _shadow(owner_node: Node3D, radius: float) -> void:
	var shape := CylinderMesh.new()
	shape.top_radius = radius
	shape.bottom_radius = radius
	shape.height = 0.006
	var disk := MeshInstance3D.new()
	disk.mesh = shape
	disk.position.y = 0.015
	disk.scale.z = 0.65
	disk.material_override = _material(Color("344834"))
	owner_node.add_child(disk)

func _actor(at: Vector3) -> Node3D:
	var node := Node3D.new()
	node.position = at
	add_child(node)
	return node

func _sprite(owner_node: Node3D) -> Sprite3D:
	var s := Sprite3D.new()
	s.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	s.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	s.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
	s.shaded = false
	s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	owner_node.add_child(s)
	return s

func _tamer_texture() -> Texture2D:
	var key := str(gait.face) + ":" + str(gait.phase())
	if fallback_people.has(key): return fallback_people[key]
	var image := Image.create(18, 28, false, Image.FORMAT_RGBA8)
	var look := {"skin": Color("d7a878"), "hair": Color("593b2c"), "shirt": Color("638d80"),
		"legs": Color("34464c"), "shoes": Color("49382c"), "hat": Color("dfb76c"), "style": "cap"}
	var parts := Figures.person_parts(gait.face, gait.moving, gait.phase(), false, look)
	for part in parts:
		var rect := Rect2i(int(part[0]) + 3, int(part[1]) + 3, int(part[2]), int(part[3]))
		image.fill_rect(rect.grow(1).intersection(Rect2i(0, 0, 18, 28)), Figures.OUTLINE)
	for part in parts:
		image.fill_rect(Rect2i(int(part[0]) + 3, int(part[1]) + 3, int(part[2]), int(part[3])), part[4])
	var result := ImageTexture.create_from_image(image)
	fallback_people[key] = result
	return result

func _animate_tamer() -> void:
	var texture := pack.trainer_texture(gait.running)
	if texture != null:
		human_atlas.atlas = texture
		human_atlas.region = Rect2(gait.trainer_frame() * 16, 0, 16, 32)
		human.texture = human_atlas
		human.flip_h = gait.face.x > 0
		human.pixel_size = 0.063
		human.offset = Vector2(0, 16)
	else:
		human.texture = _tamer_texture()
		human.flip_h = false
		human.pixel_size = 0.065
		human.offset = Vector2(0, 10)

func _animate_partner() -> void:
	if partner_frames.is_empty(): return
	var direction: int = partner_gait.direction8
	var row := 0
	var frame: int = Motion.idle_frame(partner_idle)
	if direction in [0, 1, 2, 6, 7]:
		row = 2 if direction in [0, 1, 7] else 3
		frame = 1
	if partner_gait.moving:
		row = 1 if direction in [3, 4, 5] else (2 if direction in [0, 1, 7] else 3)
		frame = partner_gait.phase()
	var meta: Dictionary = partner_frames[row * 4 + frame]
	partner_atlas.atlas = diagonal_texture
	var axial := direction in [0, 4] and not axial_frames.is_empty()
	if axial:
		var phase: int = partner_gait.phase() if partner_gait.moving else 1
		meta = axial_frames[(0 if direction == 4 else 4) + phase]
		partner_atlas.atlas = axial_texture
	partner_atlas.region = Rect2(meta.region[0], meta.region[1], meta.region[2], meta.region[3])
	partner.texture = partner_atlas
	partner.pixel_size = 0.00335 if axial else 0.0052
	partner.flip_h = direction in [5, 6, 7]
	partner.scale.y = 1.0 if partner_gait.moving or (row == 0 and not axial) else 1.0 + sin(partner_idle * 2.6) * 0.012
	partner.offset = Vector2(meta.region[2] * 0.5 - meta.anchor[0], meta.anchor[1] - meta.region[3] * 0.5)

func _build_world() -> void:
	environment = Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var world_environment := WorldEnvironment.new()
	world_environment.environment = environment
	add_child(world_environment)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55, -28, 0)
	sun.shadow_enabled = true
	add_child(sun)
	_box(Vector3(0, -0.2, 0), Vector3(70, 0.4, 70), Color("5c8654"))
	if pack.world != null:
		var grass := _world_material(Rect2(16, 0, 16, 16), Vector2(70, 70))
		var ground := PlaneMesh.new()
		ground.size = Vector2(70, 70)
		_mesh(ground, Vector3(0, 0.003, 0), grass)
	_box(Vector3(0, 0.008, 3), Vector3(3.4, 0.025, 17), Color("b6a17c"))
	_box(Vector3(4, 0.009, 0), Vector3(10, 0.025, 2.7), Color("b6a17c"))
	_box(Vector3(-6, 0.015, 1), Vector3(5, 0.035, 5), Color("7199a1"))
	var rng := RandomNumberGenerator.new()
	rng.seed = 631
	for i in 20:
		var x := rng.randf_range(-12, 12)
		var z := rng.randf_range(-8, 8)
		if absf(x) < 3.5 or (x < -3.0 and x > -9 and absf(z - 1) < 3): continue
		_tree(Vector3(x, 0, z), rng.randf_range(2.8, 4.2), Color("2b6244"))
	for i in 24:
		var x := rng.randf_range(-11, 11)
		var z := rng.randf_range(-8, 8)
		if absf(x) < 2 or (x < -3 and x > -9 and absf(z - 1) < 3): continue
		var rock := SphereMesh.new()
		rock.radius = 0.18
		rock.height = 0.25
		rock.radial_segments = 6
		rock.rings = 3
		_mesh(rock, Vector3(x, 0.08, z), _material(Color("8f9685")))
	player = _actor(Vector3(0, 0, 5))
	_shadow(player, 0.27)
	human = _sprite(player)
	_animate_tamer()
	companion = _actor(Vector3(-1.2, 0, 5.6))
	trail.append(player.position)
	_shadow(companion, 0.55)
	partner = _sprite(companion)
	partner_frames = JSON.parse_string(FileAccess.get_file_as_string("res://tests/private_sprites/bogsnap/frames.json"))
	diagonal_texture = load("res://tests/private_sprites/bogsnap/walk-idle-v2.png")
	axial_frames = JSON.parse_string(FileAccess.get_file_as_string("res://tests/private_sprites/bogsnap/axial-frames.json"))
	axial_texture = load("res://tests/private_sprites/bogsnap/axial-walk-v1.png")
	_animate_partner()
	creature = _actor(Vector3(2, 0, 1.5))
	_shadow(creature, 0.3)
	sprite = _sprite(creature)
	camera = Camera3D.new()
	camera.fov = 42
	add_child(camera)
	camera.current = true
	_update_camera()
	for i in 48:
		var drop := _box(Vector3(rng.randf_range(-10, 10), rng.randf_range(1, 8), rng.randf_range(-8, 8)),
			Vector3(0.015, 0.45, 0.015), Color("b5d7dc"))
		drop.visible = false
		drop.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		rain_nodes.append(drop)

func _build_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	var panel := PanelContainer.new()
	panel.position = Vector2(6, 5)
	panel.size = Vector2(306, 17)
	var title := Label.new()
	title.text = "THORNWOOD  /  Private Clearing Study"
	title.add_theme_font_size_override("font_size", 9)
	panel.add_child(title)
	ui.add_child(panel)
	_button("Bag [B]", Vector2(316, 5), Vector2(64, 18), open_bag)
	status = Label.new()
	var footer := Panel.new()
	footer.position = Vector2(4, 148)
	footer.size = Vector2(376, 67)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.12, 0.10, 0.85)
	style.set_corner_radius_all(3)
	footer.add_theme_stylebox_override("panel", style)
	footer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(footer)
	status.position = Vector2(8, 163)
	status.size = Vector2(368, 24)
	status.add_theme_font_size_override("font_size", 9)
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.add_child(status)
	var help := Label.new()
	help.text = "WASD / Arrows: Walk   Shift: Run   E: Meet   1-3: Creature"
	help.position = Vector2(8, 150)
	help.add_theme_font_size_override("font_size", 8)
	ui.add_child(help)
	_button("Encounter [E]", Vector2(8, 185), Vector2(118, 25), enter_battle)
	_button("Night [N]", Vector2(134, 185), Vector2(76, 25), func(): set_night(not night))
	_button("Rain [R]", Vector2(218, 185), Vector2(76, 25), func(): set_rain(not rainy))
	_button("Next", Vector2(302, 185), Vector2(74, 25), cycle_creature)

func _button(text: String, at: Vector2, dims: Vector2, action: Callable) -> void:
	var b := Button.new()
	b.text = text
	b.position = at
	b.size = dims
	b.add_theme_font_size_override("font_size", 10)
	b.pressed.connect(action)
	ui.add_child(b)
	b.size = dims

func _refresh_creature() -> void:
	if pack.entries.has(selected):
		status.text = "%s is ahead. Walk closer and meet it. Bogsnap follows you." % pack.entries[selected].name
		_animate_creature()
	else:
		sprite.texture = load("res://tests/battle_slice/muse/cindercub-front.png")
		sprite.pixel_size = 0.012
		sprite.offset.y = 32
		status.text = pack.issue + "  Cindercub waits ahead."

func cycle_creature() -> void:
	var ids := ["pokemon:16", "pokemon:37", "pokemon:194"]
	selected = ids[(ids.find(selected) + 1) % ids.size()]
	_refresh_creature()

func set_night(value: bool) -> void:
	night = value
	sun.light_energy = 0.24 if night else 0.65
	sun.light_color = Color("b1c8ef") if night else Color("fff0ce")
	environment.background_color = Color("182e49") if night else Color("9cbcb1")
	environment.ambient_light_color = Color("7287ad") if night else Color("c3d2b6")
	environment.ambient_light_energy = 0.18 if night else 0.28

func set_rain(value: bool) -> void:
	rainy = value
	for drop in rain_nodes: drop.visible = value

func _blocked(at: Vector3) -> bool:
	if absf(at.x) > 11.5 or absf(at.z) > 8.5: return true
	if Rect2(-8.8, -1.8, 5.6, 5.6).has_point(Vector2(at.x, at.z)): return true
	for p in obstacles:
		if p.distance_to(Vector2(at.x, at.z)) < 0.65: return true
	return false

func move_player(direction: Vector2, dt: float, sprint: bool = false) -> void:
	var before := player.position
	var delta3 := Vector3(direction.x, 0, direction.y).limit_length() * dt * (4.8 if sprint else 3.0)
	var next := player.position + delta3
	if not _blocked(next): player.position = next
	gait.advance(direction, player.position - before, sprint)
	_animate_tamer()

func _update_camera() -> void:
	camera.position = player.position + Vector3(0, 9, 12)
	camera.look_at(player.position + Vector3(0, 0, -1.5))

func _animate_creature() -> void:
	var state := "Walk" if sin(seconds * 0.4) > 0.6 else "Idle"
	var toward := player.position - creature.position
	facing = posmod(roundi(atan2(toward.x, toward.z) / (PI / 4)), 8)
	var frame: Dictionary = pack.world_frame(selected, state, facing, seconds)
	if frame.is_empty(): return
	var atlas := AtlasTexture.new()
	atlas.atlas = frame.texture
	atlas.region = frame.region
	sprite.texture = atlas
	sprite.pixel_size = 0.028
	var anchor: Vector2 = frame.anchor
	sprite.offset = Vector2(frame.region.size.x * 0.5 - anchor.x, anchor.y - frame.region.size.y * 0.5)
	last_region = frame.region

func _process(dt: float) -> void:
	seconds += dt
	if not active or player == null or bag != null: return
	var move := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): move.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): move.x += 1
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): move.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): move.y += 1
	move_player(move, dt, Input.is_physical_key_pressed(KEY_SHIFT))
	var partner_before := companion.position
	if trail.is_empty() or trail.back().distance_to(player.position) > 0.18: trail.append(player.position)
	var closest := 0
	for i in trail.size():
		if companion.position.distance_squared_to(trail[i]) < companion.position.distance_squared_to(trail[closest]): closest = i
	for i in closest: trail.pop_front()
	while trail.size() > 1 and companion.position.distance_to(trail[0]) < 0.12: trail.pop_front()
	if trail.size() > 128: trail.pop_front()
	var separation := companion.position.distance_to(player.position)
	if separation > 1.35: following = true
	if separation < 0.8 or (not gait.moving and separation < 1.12): following = false
	if following and not trail.is_empty():
		var follow_speed := (4.8 if gait.running else 3.0) + clampf((separation - 1.3) * 2.0, -1.5, 2.0)
		var proposed := companion.position.move_toward(trail[0], dt * follow_speed)
		if not _blocked(proposed): companion.position = proposed
	var travelled := companion.position - partner_before
	partner_gait.advance(Vector2(travelled.x, travelled.z), travelled, gait.running)
	partner_idle += dt
	_animate_partner()
	_update_camera()
	if pack.entries.has(selected): _animate_creature()
	for i in rain_nodes.size():
		if rainy:
			rain_nodes[i].position.y -= dt * 9
			if rain_nodes[i].position.y < 0: rain_nodes[i].position.y += 8

func _unhandled_key_input(e: InputEvent) -> void:
	if not active or bag != null or not e is InputEventKey or not e.pressed or e.echo: return
	match e.keycode:
		KEY_B: open_bag()
		KEY_E: enter_battle()
		KEY_N: set_night(not night)
		KEY_R: set_rain(not rainy)
		KEY_1, KEY_2, KEY_3:
			selected = ["pokemon:16", "pokemon:37", "pokemon:194"][e.keycode - KEY_1]
			_refresh_creature()
		_: return
	get_viewport().set_input_as_handled()

func enter_battle() -> void:
	if not active or bag != null: return
	if player.position.distance_to(creature.position) > 2.4:
		status.text = "Walk closer to the creature first."
		return
	return_position = player.position
	active = false
	ui.hide()
	battle = Battle.new()
	battle.pack = pack
	battle.supplies = supplies
	battle.opponent_id = selected
	battle.return_to_world.connect(_return)
	var layer := CanvasLayer.new()
	layer.name = "BattleOverlay"
	add_child(layer)
	layer.add_child(battle)

func _return(result: String) -> void:
	visited_result = result
	supplies.team = battle.model.team.duplicate(true)
	supplies.berries = battle.model.berries
	supplies.lures = battle.model.lures
	if result == "lost":
		for c in supplies.team: c.hp = c.max_hp
	var layer := battle.get_parent()
	battle = null
	layer.queue_free()
	player.position = return_position
	active = true
	ui.show()
	status.text = {"won": "A good battle! Back on the Thornwood trail.", "lost": "Bogsnap needs a rest. This clearing is a practice visit.",
		"caught": "Caught! A good practice encounter. Back on the trail.", "escaped": "Back on the trail, right where you left it."}.get(result, "Back on the trail.")

func open_bag() -> void:
	if not active or bag != null: return
	gait.advance(Vector2.ZERO, Vector3.ZERO, false)
	_animate_tamer()
	bag = Bag.new()
	bag.model = supplies
	bag.pack = pack
	bag.closed.connect(close_bag)
	bag.used.connect(func(action: Dictionary):
		var c: Dictionary = supplies.team[action.target]
		var restored := mini(int(c.max_hp) - int(c.hp), maxi(1, roundi(c.max_hp * 0.5)))
		c.hp += restored
		supplies.berries -= 1
		status.text = "%s recovered %d HP." % [c.name, restored]
		close_bag())
	ui.add_child(bag)

func close_bag() -> void:
	if bag != null: bag.queue_free()
	bag = null
