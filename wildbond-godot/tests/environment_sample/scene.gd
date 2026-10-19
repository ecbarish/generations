extends "res://tests/opening/scene.gd"
## Actual chapter geometry dressed as a reversible, unsaved environment audition.
const SAMPLE_ROOT := "res://tests/environment_sample/"
var baseline := false
var tree_mesh: ArrayMesh
var tree_material: ShaderMaterial
var roof_materials: Dictionary = {}
var current_building := ""
var dressing: Array[Node3D] = []
var sample_views := [Vector2i(11,11),Vector2i(11,-4),Vector2i(6,-15)]
var view_index := 0
var process_cpu_ms := 0.0

func _ready() -> void:
    baseline = "--baseline" in OS.get_cmdline_user_args()
    no_save = true
    if "--fallback" in OS.get_cmdline_user_args():pack_path="Z:/no-private-pack"
    save_path = "user://wb_environment_sample_%d_%d.json" % [OS.get_process_id(),Time.get_ticks_usec()]
    super._ready()
    # Always a fresh, unsaved original partner; never hydrate a real profile.
    start_journey("wildbond:mosshog")
    story_queue.clear()
    close_dialogue()
    player.position = Map.point(sample_views[0])
    _reset_follow()
    _update_camera()

func _build_ui() -> void:
    super._build_ui()
    if baseline:return
    var tab: Panel=location.get_parent()
    tab.position=Vector2(5,5);tab.size=Vector2(116,15)
    location.position=Vector2(5,2);location.size=Vector2(108,11)
    location.add_theme_font_size_override("font_size",7)
    menu_button.position=Vector2(326,5);menu_button.size=Vector2(53,15)
    menu_button.add_theme_font_size_override("font_size",7)
    for child in ui.get_children():
        if child is Button and child.text=="Map [Tab]":
            child.position=Vector2(270,5);child.size=Vector2(53,15)
            child.add_theme_font_size_override("font_size",7)
    hint.add_theme_font_size_override("font_size",7)
    hint.position.y=204

func _surface(color: Color, roof := false) -> ShaderMaterial:
    var material := ShaderMaterial.new()
    material.shader = preload("res://tests/environment_sample/surface.gdshader")
    material.set_shader_parameter("tint",color)
    material.set_shader_parameter("shingles",roof)
    return material

func _tree_geometry() -> ArrayMesh:
    var tool := SurfaceTool.new()
    tool.begin(Mesh.PRIMITIVE_TRIANGLES)
    var trunk := CylinderMesh.new()
    trunk.top_radius=.055;trunk.bottom_radius=.085;trunk.height=.64;trunk.radial_segments=7
    _append_shape(tool,trunk,Transform3D(Basis.IDENTITY,Vector3(0,.32,0)),Color("66503a"))
    for limb in [-1,1]:
        var branch := CylinderMesh.new()
        branch.top_radius=.023;branch.bottom_radius=.044;branch.height=.35;branch.radial_segments=5
        var basis := Basis(Vector3.FORWARD,limb*.6)
        _append_shape(tool,branch,Transform3D(basis,Vector3(limb*.085,.53,0)),Color("71553d"))
    var positions := [Vector3(-.17,.70,.01),Vector3(.17,.75,.025),Vector3(0,.84,-.10),Vector3(0,.69,.16),Vector3(-.05,.93,.01)]
    for i in positions.size():
        var crown := SphereMesh.new()
        crown.radius=.235;crown.height=.46;crown.radial_segments=9;crown.rings=4
        var scale3 := Vector3(1.20,.86,1.04) if i!=4 else Vector3(.93,.7,.95)
        var green := Color("456c40").lightened(i*.035)
        _append_shape(tool,crown,Transform3D(Basis.from_scale(scale3),positions[i]),green)
    tool.generate_normals()
    return tool.commit()

func _append_shape(tool: SurfaceTool, shape: Mesh, transform3: Transform3D, color: Color) -> void:
    var arrays := shape.surface_get_arrays(0)
    var vertices: PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
    var indices: PackedInt32Array=arrays[Mesh.ARRAY_INDEX]
    var normals: PackedVector3Array=arrays[Mesh.ARRAY_NORMAL]
    for index in indices:
        tool.set_color(color)
        tool.set_normal((transform3.basis.inverse().transposed()*normals[index]).normalized())
        tool.add_vertex(transform3*vertices[index])

func _tree(at: Vector3, height: float, tint: Color) -> void:
    if baseline:
        super._tree(at,height,tint)
        return
    # Keep the authored rest spot visible on its already-solid forest edge.
    if Map.tile(at)==Vector2i(4,-17):return
    # Every tree shares one mesh/material; no random mixing of asset families.
    if tree_mesh==null:
        tree_mesh=_tree_geometry()
        tree_material=_surface(Color.WHITE)
        tree_material.set_shader_parameter("foliage",true)
    var holder := _actor(at)
    holder.set_meta("asset","wildbond_broadleaf")
    holder.set_meta("sample_tree",true)
    var mesh := MeshInstance3D.new()
    mesh.mesh=tree_mesh;mesh.material_override=tree_material
    var h := height*1.1
    var cell := Map.tile(at)
    # Smaller edge trees frame the ranch instead of filling the foreground.
    if cell.y>=13 and cell.x>=3 and cell.x<=23:h*=.62
    mesh.scale=Vector3(h,h,h)
    mesh.rotation.y=fposmod(at.x*.38+at.z*.19,TAU)
    mesh.visibility_range_end=48.0
    mesh.visibility_range_end_margin=4.0
    holder.add_child(mesh)
    holder.set_meta("meshes",[mesh])
    props.append(holder);occluders.append(holder)
    obstacles.append(Vector2(at.x,at.z))

func _roof(at: Vector3, width: float, depth: float, color: Color) -> void:
    if baseline:
        super._roof(at,width,depth,color)
        return
    var rise := 1.35
    var half := depth*.5+.35
    var key := color.to_html()
    if not roof_materials.has(key):roof_materials[key]=_surface(color,true)
    for side in [-1,1]:
        var shape := BoxMesh.new()
        shape.size=Vector3(width+.7,.16,sqrt(half*half+rise*rise))
        var panel := _mesh(shape,at+Vector3(0,rise*.5,side*half*.5),roof_materials[key])
        panel.rotation.x=side*atan2(rise,half)
    _solid(at+Vector3(0,rise,0),Vector3(width+.85,.16,.22),color.darkened(.15))
    var tool := SurfaceTool.new();tool.begin(Mesh.PRIMITIVE_TRIANGLES)
    for side in [-1,1]:
        var points := [Vector3(width*.5*side,0,-depth*.5),Vector3(width*.5*side,rise,0),Vector3(width*.5*side,0,depth*.5)]
        if side<0:points.reverse()
        for point in points:tool.add_vertex(point)
    tool.generate_normals()
    _mesh(tool.commit(),at,_surface(Color("a55c4d") if current_building=="ranch" else Color("d4c5a4")))

func _solid(at: Vector3, dims: Vector3, color: Color) -> MeshInstance3D:
    if baseline or current_building=="":return super._solid(at,dims,color)
    var mapped: Color={"e7dfc4":Color("a55c4d") if current_building=="ranch" else Color("d4c5a4"),"c5b995":Color("887b68"),"7cb5bc":Color("584d3b"),"9fcbd0":Color("d8b66f"),"f8f1db":Color("dfcfac")}.get(color.to_html(false),color)
    var shape := BoxMesh.new();shape.size=dims
    return _mesh(shape,at,_surface(mapped))

func _building(at: Vector3, dims: Vector2, roof_color: Color, title: String, kind: String) -> void:
    current_building=kind
    var roof := roof_color if baseline else (Color("884d43") if kind=="ranch" else Color("47566a"))
    super._building(at,dims,roof,title,kind)
    if not baseline:
        var holder: Node3D=occluders.back()
        var previous := get_children()
        var front := at.z+dims.y*.5+.23
        var timber := Color("66513d")
        for side in [-1,1]:
            _solid(Vector3(at.x+side*(dims.x*.5-.12),1.55,front),Vector3(.16,2.7,.13),timber)
            _solid(Vector3(at.x+side*dims.x*.32,2.18,front),Vector3(1.45,.12,.16),timber)
        _solid(Vector3(at.x,.65,front),Vector3(dims.x,.13,.14),timber)
        _solid(Vector3(at.x,2.85,front),Vector3(dims.x+.1,.16,.16),timber)
        for offset in [-2,-1,0,1,2]:
            var beam := _solid(Vector3(at.x+offset*dims.x/5,3.12,at.z),Vector3(.10,.42,.12),timber)
            beam.rotation.z=.35 if offset%2 else -.35
        # Stone chimney and a warm porch give repeated building forms a human scale.
        _solid(at+Vector3(dims.x*.28,3.6,-.65),Vector3(.52,1.55,.58),Color("8d897b"))
        _solid(at+Vector3(dims.x*.28,4.4,-.65),Vector3(.64,.13,.68),Color("67685f"))
        for child in get_children():
            if child is Node3D and child not in previous:
                child.reparent(holder,true)
                if child is MeshInstance3D:
                    var meshes: Array=holder.get_meta("meshes");meshes.append(child)
    current_building=""

func _build_world() -> void:
    super._build_world()
    if baseline:return
    # These additions occupy already-solid margins. The measured collision map is unchanged.
    var before := get_children()
    for child in outdoors.get_children():
        if child is MultiMeshInstance3D:
            var ground := ShaderMaterial.new()
            ground.shader=preload("res://tests/environment_sample/ground.gdshader")
            child.material_override=ground
        elif child is MeshInstance3D and child.mesh is PlaneMesh and child.mesh.size.x>100:
            child.material_override=_surface(Color("3e5836"))
    for cell in [Vector2i(2,12),Vector2i(3,12),Vector2i(19,11),Vector2i(20,11),Vector2i(7,-5),Vector2i(14,-5),Vector2i(6,-17),Vector2i(4,-17)]:
        var at := Map.point(cell)
        if world_map.glyph(cell)=="T":
            _prop("rock_smallA",at,.32,cell.x)
            _prop("plant_bush",at+Vector3(.18,0,-.2),.37)
    # Existing tw1 clearing/pickup becomes a small, discoverable rest spot.
    var bench_at := Map.point(Vector2i(4,-17))
    var bench := _solid(bench_at+Vector3(0,.35,0),Vector3(.95,.12,.40),Color("786148"))
    bench.set_meta("sample_bench",true)
    _solid(bench_at+Vector3(0,.65,-.14),Vector3(.95,.22,.10),Color("786148"))
    for x in [-.32,.32]:_solid(bench_at+Vector3(x,.17,0),Vector3(.12,.34,.27),Color("645443"))
    _prop("mushroom_redGroup",Map.point(Vector2i(3,-16)),.22)
    _prop("stump_round",Map.point(Vector2i(2,-17)),.48)
    for cell in [Vector2i(3,8),Vector2i(2,8),Vector2i(20,5),Vector2i(21,5),Vector2i(6,-16),Vector2i(7,-16)]:
        if world_map.glyph(cell) not in [".","D","G"]:
            _prop("flower_purpleA" if cell.x%2 else "flower_yellowC",Map.point(cell)+Vector3(.18,0,.08),.24)
    for child in get_children():
        if child is Node3D and child not in before:
            child.reparent(outdoors,true);dressing.append(child)
    _apply_light()

func _apply_light() -> void:
    super._apply_light()
    if baseline or environment==null:return
    environment.ssao_enabled=false
    environment.ssr_enabled=false
    environment.glow_enabled=false
    environment.tonemap_exposure=.92
    if not night:
        sun.light_color=(Color("ffc493") if sunset else Color("ffe4b9")) if not rainy else Color("dce5e3")
        sun.light_energy=1.2 if not rainy else .8
        sun.rotation_degrees=Vector3(-28 if sunset else -48,-36,0)
        environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
        environment.ambient_light_color=Color("9fb5be")
        environment.ambient_light_energy=.48
    sun.directional_shadow_max_distance=38
    sun.shadow_blur=1.0

func _unhandled_key_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode==KEY_F7:
        ui.visible=not ui.visible
        get_viewport().set_input_as_handled()
        return
    if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode==KEY_F6 and not _modal():
        view_index=(view_index+1)%sample_views.size()
        player.position=Map.point(sample_views[view_index]);_reset_follow();_update_camera()
        get_viewport().set_input_as_handled()
        return
    super._unhandled_key_input(event)

func _process(dt: float) -> void:
    var begin := Time.get_ticks_usec()
    super._process(dt)
    process_cpu_ms=(Time.get_ticks_usec()-begin)/1000.0
