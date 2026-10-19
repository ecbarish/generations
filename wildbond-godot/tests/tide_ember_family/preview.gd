extends "res://tests/opening/scene.gd"
## Explicitly unsaved art audition. The original party/rules/catalogue are untouched.
const StarterArt := preload("res://tests/tide_ember_family/art.gd")
var starter_art := StarterArt.new()
var starter_name := "ripplet"
var pixel_material := ShaderMaterial.new()
const NativeWorld := preload("res://tests/mosshog_clean/world.gdshader")
const NativePortrait := preload("res://tests/mosshog_clean/portrait.gdshader")
var clean_mode := true
var ember := false
var stage_buttons: Array[Button]=[]
var comparison_badge: Label
func family_names() -> Array:
    return ["cindercub","smoulderpup","blazefang","mega_blazefang"] if ember else ["ripplet","riverwisp","tidewyrm","mega_tidewyrm"]
func toggle_family() -> void:
    ember=not ember
    for i in 3:stage_buttons[i].text=str(i+1)+" "+display_name(family_names()[i])
    select_starter(family_names()[0])
func toggle_comparison() -> void:
    var had_gallery := detail!=null
    var previous := starter_name
    close_menu()
    clean_mode=not clean_mode
    starter_art.raw_mode=not clean_mode
    starter_art.open();starter_name=previous;_animate_partner()
    comparison_badge.text="CLEAN / C: Original" if clean_mode else "ORIGINAL / C: Clean"
    if had_gallery:show_gallery()


func _ready() -> void:
    no_save=true;save_path="user://wb_tide_ember_art_%d.json" % OS.get_process_id()
    starter_art.open()
    pixel_material.shader=preload("res://tests/mosshog_family/world_pixels.gdshader")
    super._ready()
    if not profile.state.started:start_journey("pokemon:194")
    close_dialogue();_goal_hint();_animate_partner()
    player.position=Map.point(Vector2i(11,-5));_reset_follow();_update_camera()
    creature.position=player.position+Vector3(1.3,0,.4);wild_home=creature.position
    select_starter("ripplet")

func _goal_hint() -> void:
    if hint!=null:hint.text="ART PREVIEW / Unsaved / Walk to inspect / Space: battle views"

func _build_ui() -> void:
    super._build_ui()
    _label(_panel(Vector2(8,169),Vector2(172,18)),"UNSAVED FAMILY PREVIEW",Vector2(6,0),Vector2(160,17),10)
    var names := family_names().slice(0,3)
    for i in names.size():
        var name: String=names[i]
        stage_buttons.append(_choice(ui,str(i+1)+" "+display_name(name),Vector2(4+i*100,190),Vector2(98,20),func():select_starter(family_names()[i])))
    _choice(ui,"Views",Vector2(306,190),Vector2(74,20),show_gallery)
    _choice(ui,"T: Tide / Ember",Vector2(8,148),Vector2(112,18),toggle_family)
    comparison_badge=_label(_panel(Vector2(8,169),Vector2(226,18)),"CLEAN / C: Original",Vector2(6,0),Vector2(214,17),10)

func select_starter(name: String) -> void:
    if not starter_art.entries.has(name):return
    starter_name=name;close_menu();_animate_partner()
    selected="pokemon:16"
    _refresh_creature()

func _animate_partner() -> void:
    if partner==null or not starter_art.textures.has(starter_name):return
    var f := starter_art.walking(starter_name,partner_gait.direction8,starter_art.phase(starter_name,partner_gait.distance,partner_gait.moving))
    partner_atlas.atlas=f.texture;partner_atlas.region=f.region
    partner.texture=f.texture;partner.region_enabled=true;partner.region_rect=f.region
    pixel_material.shader=NativeWorld if clean_mode else preload("res://tests/mosshog_family/world_pixels.gdshader")
    pixel_material.set_shader_parameter("sheet",f.texture)
    pixel_material.set_shader_parameter("palette",starter_art.palettes[starter_name])
    pixel_material.set_shader_parameter("source_rect",Vector4(f.region.position.x/f.texture.get_width(),f.region.position.y/f.texture.get_height(),f.region.size.x/f.texture.get_width(),f.region.size.y/f.texture.get_height()))
    pixel_material.set_shader_parameter("sample_step",f.sample_step)
    pixel_material.set_shader_parameter("source_size",f.region.size)
    pixel_material.set_shader_parameter("root_px",f.anchor)
    partner.material_override=pixel_material
    partner.pixel_size=f.pixel_size;partner.flip_h=f.flip;partner.scale=Vector3.ONE
    partner.offset=Vector2(f.region.size.x*.5-f.anchor.x,f.anchor.y-f.region.size.y*.5)
    # Source alpha is retained; discard near-transparent generation matte at render time.
    partner.alpha_cut=SpriteBase3D.ALPHA_CUT_DISCARD;partner.alpha_scissor_threshold=.5
    partner.texture_filter=BaseMaterial3D.TEXTURE_FILTER_NEAREST

func interact() -> void:show_gallery()
func open_bag() -> void:show_gallery()
func enter_battle() -> void:show_gallery()
func begin_encounter(_who: String, _sid: String) -> void:show_gallery()
func toggle_menu() -> void:
    if detail!=null:close_menu()
    else:show_gallery()

func show_gallery() -> void:
    if detail!=null:detail.queue_free()
    detail=_panel(Vector2(5,26),Vector2(374,158))
    detail.set_meta("starter_gallery",true)
    _label(detail,display_name(starter_name)+(" / Mega appearance" if starter_name.begins_with("mega_") else (" / Clean [C: Original]" if clean_mode else " / Source [C: Clean]")),Vector2(10,5),Vector2(352,18),12)
    var comparison: String=Catalogue.NAMES[selected]
    var frames := [starter_art.battle(starter_name,false,0),starter_art.battle(starter_name,true,0),pack.battle_frame(selected,false),pack.battle_frame(selected,true)]
    for i in frames.size():
        var f: Dictionary=frames[i]
        _label(detail,["Front","Back",comparison+" front",comparison+" back"][i],Vector2(8+i*91,27),Vector2(90,15),9)
        if f.is_empty():continue
        var atlas := AtlasTexture.new();atlas.atlas=f.texture;atlas.region=f.region
        var image := TextureRect.new();image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.texture=atlas;image.position=Vector2(10+i*91,45)
        image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;image.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST;image.mouse_filter=Control.MOUSE_FILTER_IGNORE
        detail.add_child(image)
        image.size=f.region.size
        image.stretch_mode=TextureRect.STRETCH_SCALE
        image.position=Vector2(10+i*91+(83-f.region.size.x)*.5,45+82-f.region.size.y)
        if i<2:
            var material := ShaderMaterial.new();material.shader=preload("res://tests/mosshog_family/battle_pixels.gdshader")
            material.set_shader_parameter("palette",starter_art.palettes[starter_name])
            image.texture=f.texture;image.material=material;image.stretch_mode=TextureRect.STRETCH_SCALE
            image.set_meta("pose_slot",i);_portrait(image,f,i)
    _choice(detail,"Back to walking",Vector2(112,133),Vector2(150,20),close_menu).grab_focus()
    _choice(detail,"Family + Mega",Vector2(8,133),Vector2(102,20),show_overview)

func display_name(name: String) -> String:
    return name.replace("_"," ").capitalize()

func _portrait(image: TextureRect, f: Dictionary, slot: int, source_name := "", area := Rect2()) -> void:
    var name := starter_name if source_name=="" else source_name
    if area.size==Vector2.ZERO:area=Rect2(10+slot*91,45,83,82)
    if clean_mode:
        var zoom: float=maxf(1,floorf(minf(area.size.x/f.region.size.x,area.size.y/f.region.size.y)))
        image.material=null
        var native_atlas: AtlasTexture=image.texture if image.texture is AtlasTexture else AtlasTexture.new()
        native_atlas.atlas=f.texture;native_atlas.region=f.region
        image.texture=native_atlas
        image.size=f.region.size*zoom
        var foot: float=f.region.size.x-f.anchor.x if f.flip else f.anchor.x
        image.position=area.position+Vector2(area.size.x*.5-foot*zoom,area.size.y-f.anchor.y*zoom)
        image.flip_h=f.flip
        return
    image.material.shader=preload("res://tests/mosshog_family/battle_pixels.gdshader")
    var reference := starter_art.battle(name,slot==1,0)
    var step: float=reference.sample_step
    # One source art pixel spans an integer UI pixel; never fit to a fractional scale.
    var native_size: Vector2=reference.region.size/step
    var integer_zoom: float=maxf(1.0,floorf(minf(area.size.x/native_size.x,area.size.y/native_size.y)))
    var size_scale: float=integer_zoom/step
    var material: ShaderMaterial=image.material
    material.set_shader_parameter("palette",starter_art.palettes[name])
    material.set_shader_parameter("source_rect",Vector4(f.region.position.x/f.texture.get_width(),f.region.position.y/f.texture.get_height(),f.region.size.x/f.texture.get_width(),f.region.size.y/f.texture.get_height()))
    material.set_shader_parameter("source_size",f.region.size)
    material.set_shader_parameter("root_px",f.anchor)
    material.set_shader_parameter("sample_step",step)
    image.size=f.region.size*size_scale
    var foot: float=f.region.size.x-f.anchor.x if f.flip else f.anchor.x
    image.position=area.position+Vector2(area.size.x*.5-foot*size_scale,area.size.y-f.anchor.y*size_scale)
    image.flip_h=f.flip

func show_overview() -> void:
    if detail!=null:detail.queue_free()
    detail=_panel(Vector2(5,5),Vector2(374,206))
    _label(detail,("EMBER" if ember else "TIDE")+" FAMILY / ART ONLY / No evolution or Mega combat",Vector2(6,3),Vector2(365,17),10)
    for i in 4:
        var name: String=family_names()[i]
        _label(detail,display_name(name),Vector2(5+i*92,23),Vector2(92,15),9)
        for back in [false,true]:
            var f := starter_art.battle(name,back,0)
            var image := TextureRect.new();image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.texture=f.texture;image.stretch_mode=TextureRect.STRETCH_SCALE;image.mouse_filter=Control.MOUSE_FILTER_IGNORE
            var material := ShaderMaterial.new();material.shader=preload("res://tests/mosshog_family/battle_pixels.gdshader");image.material=material;detail.add_child(image)
            _portrait(image,f,1 if back else 0,name,Rect2(5+i*92,40+(66 if back else 0),86,64))
    _choice(detail,"Walk",Vector2(8,184),Vector2(68,18),close_menu)
    _choice(detail,"Mega battle views",Vector2(184,184),Vector2(176,18),func():starter_name=family_names()[3];show_gallery())

func _process(dt: float) -> void:
    super._process(dt)
    if prompt!=null:prompt.hide()
    if hint!=null:hint.hide()
    if detail!=null and detail.has_meta("starter_gallery"):
        for child in detail.get_children():
            if child.has_meta("pose_slot"):
                var slot: int=child.get_meta("pose_slot")
                _portrait(child,starter_art.battle(starter_name,slot==1,seconds),slot)

func _unhandled_key_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode==KEY_T:toggle_family();get_viewport().set_input_as_handled();return
        if event.keycode==KEY_C:toggle_comparison();get_viewport().set_input_as_handled();return
        if event.keycode in [KEY_1,KEY_2,KEY_3]:
            select_starter(family_names()[event.keycode-KEY_1]);get_viewport().set_input_as_handled();return
        if event.keycode==KEY_SPACE:
            toggle_menu();get_viewport().set_input_as_handled();return
    super._unhandled_key_input(event)

func close_menu() -> void:
    if starter_name.begins_with("mega_"):starter_name=starter_name.trim_prefix("mega_")
    super.close_menu()
