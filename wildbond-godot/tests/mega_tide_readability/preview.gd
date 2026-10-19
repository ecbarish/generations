extends "res://tests/tide_ember_family/preview.gd"
const ComparisonArt := preload("res://tests/mega_tide_readability/art.gd")
var comparison_images: Array[TextureRect]=[]
func _ready() -> void:
    starter_art=ComparisonArt.new()
    super._ready()
    select_starter("tidewyrm")
    show_gallery()
func show_gallery() -> void:
    if detail!=null:detail.queue_free()
    comparison_images.clear()
    detail=_panel(Vector2(5,5),Vector2(374,206))
    _label(detail,"MEGA TIDEWYRM / "+("NATIVE PIXELS" if clean_mode else "SOURCE COMPARISON"),Vector2(8,3),Vector2(358,17),11)
    var names := ["tidewyrm","mega_tidewyrm","mega_tidewyrm_clean",ComparisonArt.SIMPLE]
    for column in 4:
        var name: String=names[column]
        _label(detail,["Normal","Winged original","Winged cleanup","Family-board Mega"][column],Vector2(3+column*92,23),Vector2(92,16),8)
        for back in [false,true]:
            var f: Dictionary=starter_art.battle(name,back,0)
            var image := TextureRect.new();image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE
            image.texture=f.texture;image.stretch_mode=TextureRect.STRETCH_SCALE;image.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST;image.mouse_filter=Control.MOUSE_FILTER_IGNORE
            image.material=ShaderMaterial.new();detail.add_child(image)
            _portrait(image,f,1 if back else 0,name,Rect2(3+column*92,42+(68 if back else 0),90,64))
            comparison_images.append(image)
    _choice(detail,"Walk",Vector2(8,185),Vector2(72,18),close_menu)
    _choice(detail,"C: Source / Native",Vector2(164,185),Vector2(200,18),toggle_comparison)
func display_name(name: String) -> String:
    return "Family-board Mega" if name==ComparisonArt.SIMPLE else super.display_name(name)
