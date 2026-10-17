extends "res://tests/private_sprites/clearing.gd"
## Native scenery slice; inherits the save-free exploration/bag/battle boundary.
const ROOT := "res://tests/thornwood_environment/"
const TREES := ["tree_oak", "tree_detailed", "tree_pineTallA_detailed", "tree_pineRoundA"]
var ground_material := ShaderMaterial.new()
var water_material := ShaderMaterial.new()
var water: MeshInstance3D
var props: Array[Node3D] = []
var occluders: Array[Node3D] = []
var lamps: Array[OmniLight3D] = []
var motes: Array[MeshInstance3D] = []
var splashes: Array[MeshInstance3D] = []
var model_cache: Dictionary = {}
var sunset := false

func _bounds(node: Node3D, transform3: Transform3D = Transform3D.IDENTITY) -> AABB:
	var t := transform3 * node.transform
	var box := AABB()
	if node is MeshInstance3D and node.mesh != null: box = t * node.mesh.get_aabb()
	for child in node.get_children():
		if child is Node3D:
			var b := _bounds(child, t)
			if b.size != Vector3.ZERO: box = b if box.size == Vector3.ZERO else box.merge(b)
	return box

func _mesh_nodes(node: Node) -> Array[MeshInstance3D]:
	var result: Array[MeshInstance3D] = []
	if node is MeshInstance3D: result.append(node)
	for child in node.get_children(): result.append_array(_mesh_nodes(child))
	return result

func _prop(model: String, at: Vector3, height: float, turn: float = 0.0) -> Node3D:
	if not model_cache.has(model): model_cache[model] = load(ROOT + "assets/kenney/" + model + ".glb")
	var holder := _actor(at)
	var instance: Node3D = model_cache[model].instantiate()
	holder.add_child(instance)
	var bounds := _bounds(instance)
	instance.position.y -= bounds.position.y
	holder.scale = Vector3.ONE * height / maxf(bounds.size.y, 0.01)
	holder.rotation.y = turn
	holder.set_meta("asset", model)
	var meshes := _mesh_nodes(instance)
	for mesh in meshes:
		for surface in mesh.mesh.get_surface_count():
			var original := mesh.get_active_material(surface)
			if original is StandardMaterial3D:
				var material: StandardMaterial3D = original.duplicate()
				material.metallic = 0 # The source exporter marks even wood/foliage metallic.
				material.roughness = 0.9
				var title := str(original.resource_name).to_lower()
				if "leaf" in title: material.albedo_color = Color("4a802e")
				elif "bark" in title or "wood" in title: material.albedo_color = Color("74513a")
				if model.begins_with("grass") or model.begins_with("plant"): material.albedo_color = Color("59834a")
				if model.begins_with("rock"):
					material.albedo_color = Color("697956") if "green" in title or "moss" in title else Color("8f8a71")
				mesh.set_surface_override_material(surface, material)
	holder.set_meta("meshes", meshes)
	props.append(holder)
	return holder

func _tree(at: Vector3, height: float, _tint: Color) -> void:
	obstacles.append(Vector2(at.x, at.z))
	var index := posmod(roundi(at.x * 3 + at.z * 7), TREES.size())
	var tree := _prop(TREES[index], at, height * 1.3, at.x * 0.38)
	occluders.append(tree)

func _build_world() -> void:
	super._build_world()
	# Keep the actors, camera, rain and encounter positions, replace study geometry.
	for child in get_children():
		if child is MeshInstance3D and child not in rain_nodes: child.queue_free()
	ground_material.shader = load(ROOT + "ground.gdshader")
	var ground := PlaneMesh.new()
	ground.size = Vector2(80, 80)
	ground.subdivide_width = 120
	ground.subdivide_depth = 120
	_mesh(ground, Vector3(0, -0.006, 0), ground_material)
	water_material.shader = load(ROOT + "water.gdshader")
	var pond := PlaneMesh.new()
	pond.size = Vector2(5.6, 6.0)
	pond.subdivide_width = 24
	pond.subdivide_depth = 24
	water = _mesh(pond, Vector3(-6, -0.09, 1), water_material)
	var rng := RandomNumberGenerator.new()
	rng.seed = 9017
	# A deeper canopy frames the open trail rather than carpeting the playable route.
	for i in 25:
		var x := rng.randf_range(-20, 20)
		var z := rng.randf_range(-24, -9)
		if absf(x) < 3.2: continue
		_tree(Vector3(x, 0, z), rng.randf_range(3.4, 5.7), Color.WHITE)
	for i in 90:
		var at := Vector3(rng.randf_range(-12, 12), 0, rng.randf_range(-9, 8))
		if absf(at.x) < 2.0 or (absf(at.z) < 1.7 and at.x > 0) or _blocked(at): continue
		var model: String = ["grass", "grass_leafs", "plant_bush", "flower_yellowC", "flower_purpleA"][i % 5]
		_prop(model, at, rng.randf_range(.20, .55), rng.randf() * TAU)
	for i in 15:
		var angle := float(i) / 15 * TAU
		var at := Vector3(-6 + cos(angle)*3.05, -.03, 1+sin(angle)*3.28)
		_prop("rock_smallA" if i % 3 else "rock_largeA", at, rng.randf_range(.22,.55), angle)
	_prop("log", Vector3(6.7,0,3.2), .55, .4)
	_prop("stump_round", Vector3(7.7,0,2.4), .6)
	_prop("mushroom_redGroup", Vector3(7.5,0,1.8), .28)
	_prop("rock_tallA", Vector3(-10.8,0,-3), 1.7, .3)
	_lantern(Vector3(2.35,0,4.1))
	_lantern(Vector3(6.2,0,-1.7))
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("618da1")
	sky_material.sky_horizon_color = Color("d3d9bc")
	sky_material.ground_bottom_color = Color("284237")
	sky_material.ground_horizon_color = Color("bac6a6")
	sky.sky_material = sky_material
	environment.sky = sky
	environment.background_mode = Environment.BG_SKY
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	environment.ambient_light_sky_contribution = .55
	environment.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.tonemap_exposure = .8
	environment.tonemap_white = 3.0
	environment.fog_enabled = true
	environment.fog_density = .0045
	environment.fog_light_energy = .55
	environment.fog_light_color = Color("93b5a4")
	environment.fog_sky_affect = .35
	var high := RenderingServer.get_current_rendering_method() == "forward_plus"
	environment.ssao_enabled = high
	environment.ssr_enabled = high
	environment.glow_enabled = high
	environment.glow_intensity = .25
	sun.directional_shadow_max_distance = 48
	sun.shadow_blur = 1.5
	for i in 28:
		var sphere := SphereMesh.new()
		sphere.radius = .018
		sphere.height = .036
		var m := _material(Color("d0d680"))
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.emission_enabled = true
		m.emission = Color("c0cb71")
		m.emission_energy_multiplier = 1.4
		var mote := _mesh(sphere, Vector3(rng.randf_range(-9,9),rng.randf_range(.3,2),rng.randf_range(-7,7)),m)
		mote.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		motes.append(mote)
	for i in 12:
		var ring := TorusMesh.new()
		ring.inner_radius = .09
		ring.outer_radius = .11
		ring.rings = 12
		ring.ring_segments = 6
		var ripple := _mesh(ring, Vector3(-6+rng.randf_range(-1.8,1.8),-.055,1+rng.randf_range(-2,2)), _material(Color("82c3b8")))
		ripple.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		splashes.append(ripple)
	_apply_light()

func _lantern(at: Vector3) -> void:
	_box(at+Vector3(0,.85,0),Vector3(.10,1.7,.10),Color("584330"))
	var glass := _material(Color("ffcd76"))
	glass.emission_enabled = true
	glass.emission = Color("ffb956")
	glass.emission_energy_multiplier = 2.0
	var shape := BoxMesh.new()
	shape.size = Vector3(.26,.32,.26)
	_mesh(shape,at+Vector3(0,1.65,0),glass)
	var light := OmniLight3D.new()
	light.position = at+Vector3(0,1.65,0)
	light.omni_range = 4.0
	light.light_color = Color("ffb365")
	add_child(light)
	lamps.append(light)
	obstacles.append(Vector2(at.x,at.z))

func _apply_light() -> void:
	if sun == null: return
	sun.rotation_degrees = Vector3(-23 if sunset else -43,-36,0)
	sun.light_color = Color("91abd6") if night else (Color("ffc17c") if sunset else Color("ffe6b5"))
	sun.light_energy = .24 if night else (.85 if rainy else 1.6)
	environment.ambient_light_color = Color("7593b3") if night else Color("b0c8bb")
	environment.ambient_light_energy = .30 if night else .36
	environment.fog_light_color = Color("273b57") if night else (Color("9cabb1") if rainy else Color("9fb9a4"))
	environment.fog_density = .012 if rainy else .0045
	for lamp in lamps: lamp.light_energy = 1.6 if night else .08
	for mote in motes: mote.visible = night and not rainy
	for splash in splashes: splash.visible = rainy
	ground_material.set_shader_parameter("wetness",1.0 if rainy else 0.0)
	water_material.set_shader_parameter("storm",1.0 if rainy else 0.0)
	if human != null:
		var tint := Color("9baec8") if night else Color("fff0d5")
		for s in [human,partner,sprite]: s.modulate = tint

func set_night(value: bool) -> void:
	night = value
	_apply_light()

func set_rain(value: bool) -> void:
	super.set_rain(value)
	_apply_light()

func _update_camera() -> void:
	camera.position = player.position + Vector3(0,7.5,11.4)
	camera.look_at(player.position + Vector3(0,.3,-2.4))
	camera.fov = 42

func _blocked(at: Vector3) -> bool:
	if absf(at.x) > 11.5 or absf(at.z) > 8.5: return true
	if Vector2((at.x+6.0)/3.2,(at.z-1.0)/3.4).length() < 1.0: return true
	for p in obstacles:
		if p.distance_to(Vector2(at.x,at.z)) < .65: return true
	return false

func _build_ui() -> void:
	super._build_ui()
	for child in ui.get_children():
		if child is PanelContainer:
			(child.get_child(0) as Label).text = "THORNWOOD / Brookside Trail"
		elif child is Panel:
			child.position.y = 174
			child.size.y = 40
		elif child is Label and child != status:
			child.position.y = 25
			child.text = "WASD: Walk   Shift: Run   B: Bag   E: Meet   T: Sunset"
		elif child is Button:
			for state in ["normal","hover","pressed","focus"]:
				var box := StyleBoxFlat.new()
				box.bg_color = Color(.05,.11,.085,.85)
				box.set_content_margin_all(2)
				box.set_corner_radius_all(3)
				if state == "focus":
					box.border_color = Color("dfc487")
					box.set_border_width_all(1)
				child.add_theme_stylebox_override(state,box)
			if child.position.y > 100: child.position.y = 194
			child.size.y = 18
	status.position.y = 178
	status.add_theme_font_size_override("font_size",8)

func _refresh_creature() -> void:
	super._refresh_creature()
	if pack.entries.is_empty(): status.text = "A quiet trail. Walk near Cindercub to meet it."

func _process(dt: float) -> void:
	super._process(dt)
	if player == null: return
	for i in motes.size():
		motes[i].position.y += sin(seconds*.8+i)*dt*.08
		motes[i].position.x += cos(seconds*.45+i)*dt*.035
	for i in splashes.size():
		var phase := fposmod(seconds*1.6+i*.173,1.0)
		splashes[i].scale = Vector3.ONE*(.3+phase*2.0)
	for tree in occluders:
		var a := Vector2(player.position.x,player.position.z)
		var b := Vector2(camera.position.x,camera.position.z)
		var p := Vector2(tree.position.x,tree.position.z)
		var fade := .72 if p.distance_to(Geometry2D.get_closest_point_to_segment(p,a,b)) < 1.2 and p.distance_to(a) > .7 else 0.0
		for mesh in tree.get_meta("meshes"):
			mesh.transparency = lerpf(mesh.transparency,fade,1.0-exp(-dt*8))

func _unhandled_key_input(e: InputEvent) -> void:
	if active and bag == null and e is InputEventKey and e.pressed and not e.echo and e.keycode == KEY_T:
		sunset = not sunset
		_apply_light()
		get_viewport().set_input_as_handled()
		return
	super._unhandled_key_input(e)
