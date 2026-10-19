extends "res://tests/mosshog_family/preview.gd"
const CleanArt := preload("res://tests/mosshog_clean/art.gd")
const RawFamilyArt := preload("res://tests/mosshog_family/art.gd")
const NativeWorld := preload("res://tests/mosshog_clean/world.gdshader")
const NativePortrait := preload("res://tests/mosshog_clean/portrait.gdshader")
var clean_mode := true
var comparison_badge: Label
func _ready() -> void:
    starter_art=CleanArt.new()
    super._ready()
func _build_ui() -> void:
    super._build_ui()
    comparison_badge=_label(_panel(Vector2(8,169),Vector2(226,18)),"CLEAN ATLAS / C: Original",Vector2(6,0),Vector2(214,17),10)
func toggle_comparison() -> void:
    var had_gallery := detail!=null
    var previous := starter_name
    close_menu()
    clean_mode=not clean_mode
    starter_art=CleanArt.new() if clean_mode else RawFamilyArt.new()
    starter_art.open();starter_name=previous;_animate_partner()
    comparison_badge.text="CLEAN ATLAS / C: Original" if clean_mode else "ORIGINAL / C: Clean Atlas"
    if had_gallery:show_gallery()
func _animate_partner() -> void:
    if not clean_mode:
        pixel_material.shader=preload("res://tests/mosshog_family/world_pixels.gdshader")
        super._animate_partner();return
    if partner==null or not starter_art.textures.has(starter_name):return
    var f: Dictionary=starter_art.walking(starter_name,partner_gait.direction8,starter_art.phase(starter_name,partner_gait.distance,partner_gait.moving))
    partner_atlas.atlas=f.texture;partner_atlas.region=f.region
    partner.texture=f.texture;partner.region_enabled=true;partner.region_rect=f.region
    pixel_material.shader=NativeWorld;pixel_material.set_shader_parameter("sheet",f.texture)
    partner.material_override=pixel_material;partner.pixel_size=f.pixel_size;partner.flip_h=f.flip;partner.scale=Vector3.ONE
    partner.offset=Vector2(f.region.size.x*.5-f.anchor.x,f.anchor.y-f.region.size.y*.5)
    partner.alpha_cut=SpriteBase3D.ALPHA_CUT_DISCARD;partner.alpha_scissor_threshold=.5
    partner.texture_filter=BaseMaterial3D.TEXTURE_FILTER_NEAREST
func _portrait(image: TextureRect,f: Dictionary,slot: int,source_name := "",area := Rect2()) -> void:
    if not clean_mode:
        image.material.shader=preload("res://tests/mosshog_family/battle_pixels.gdshader")
        super._portrait(image,f,slot,source_name,area);return
    var name := starter_name if source_name=="" else source_name
    if area.size==Vector2.ZERO:area=Rect2(10+slot*91,45,83,82)
    var ref: Dictionary=starter_art.battle(name,slot==1,0)
    var zoom: float=maxf(1,floorf(minf(area.size.x/ref.region.size.x,area.size.y/ref.region.size.y)))
    image.material.shader=NativePortrait
    image.material.set_shader_parameter("source_rect",Vector4(f.region.position.x/f.texture.get_width(),f.region.position.y/f.texture.get_height(),f.region.size.x/f.texture.get_width(),f.region.size.y/f.texture.get_height()))
    image.size=f.region.size*zoom
    var foot: float=f.region.size.x-f.anchor.x if f.flip else f.anchor.x
    image.position=area.position+Vector2(area.size.x*.5-foot*zoom,area.size.y-f.anchor.y*zoom)
    image.flip_h=f.flip
func show_gallery() -> void:
    super.show_gallery()
    for child in detail.get_children():
        if child is Label and child.text.begins_with(display_name(starter_name)+" /"):
            child.text=display_name(starter_name)+(" / CLEAN [C: Original]" if clean_mode else " / ORIGINAL [C: Clean]")

func _unhandled_key_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo and event.keycode==KEY_C:
        toggle_comparison();get_viewport().set_input_as_handled();return
    super._unhandled_key_input(event)
