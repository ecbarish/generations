extends "res://tests/tide_ember_family/art.gd"
const SIMPLE := "mega_tidewyrm_simple"
const SIMPLE_ROOT := "res://tests/mega_tide_readability/"
func open() -> bool:
    if not super.open():return false
    var file := SIMPLE_ROOT+("source-frames.json" if raw_mode else "frames.json")
    var data: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(file))
    for name in data:
        var entry: Dictionary=data[name]
        if FileAccess.get_sha256(SIMPLE_ROOT+entry.file)!=entry.sha256:return false
        var texture: Texture2D=load(SIMPLE_ROOT+entry.file)
        if texture==null:return false
        entries[name]=entry;textures[name]=texture
        palettes[name]=PackedColorArray(entry.palette.map(func(hex):return Color(hex)))
        var ref: Dictionary=entry.frames[0]
        pixel_heights[name]=texture.get_image().get_region(Rect2i(ref.region[0],ref.region[1],ref.region[2],ref.region[3])).get_used_rect().size.y
    return true
func walking(name: String,direction: int,phase: int) -> Dictionary:
    return super.walking("tidewyrm" if name in [SIMPLE,"mega_tidewyrm_clean"] else name,direction,phase)
func phase(name: String,distance: float,moving: bool) -> int:
    return super.phase("tidewyrm" if name in [SIMPLE,"mega_tidewyrm_clean"] else name,distance,moving)
