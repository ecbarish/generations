extends "res://tests/mosshog_family/art.gd"
const CLEAN_ROOT := "res://tests/mosshog_clean/"
var pixel_heights: Dictionary={}
func open() -> bool:
    entries.clear();textures.clear();palettes.clear();pixel_heights.clear()
    for name in ["mosshog","thicketboar","thornback","mega_thornback"]:
        var folder: String=CLEAN_ROOT+"assets/"+name+"/"
        var data: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(folder+"frames.json"))
        var entry: Dictionary=data[name]
        if FileAccess.get_sha256(folder+entry.file)!=entry.sha256:return false
        var texture: Texture2D=load(folder+entry.file)
        if texture==null:return false
        entries[name]=entry;textures[name]=texture
        palettes[name]=PackedColorArray(entry.palette.map(func(hex):return Color(hex)))
        var ref: Dictionary=entry.frames[0 if name=="mega_thornback" else 5]
        pixel_heights[name]=texture.get_image().get_region(Rect2i(ref.region[0],ref.region[1],ref.region[2],ref.region[3])).get_used_rect().size.y
    return true
func frame(name: String,index: int,flip := false) -> Dictionary:
    if not entries.has(name):return {}
    var entry: Dictionary=entries[name]
    index=clampi(index,0,entry.frames.size()-1)
    var f: Dictionary=entry.frames[index]
    return {"texture":textures[name],"region":Rect2(f.region[0],f.region[1],f.region[2],f.region[3]),"anchor":Vector2(f.anchor[0],f.anchor[1]),"pixel_size":float(entry.height_m)/pixel_heights[name],"flip":flip,"index":index,"sample_step":1.0}
func walking(name: String,direction: int,phase: int) -> Dictionary:
    return super.walking("thornback" if name=="mega_thornback" else name,direction,phase)
func battle(name: String,back: bool,seconds: float) -> Dictionary:
    if name=="mega_thornback":return frame(name,1 if back else 0,not back)
    var blink := name=="mosshog" and not back and fposmod(seconds,3.8)>3.64
    return frame(name,2 if back else (1 if blink else 0),not back)
func phase(name: String,distance: float,moving: bool) -> int:
    var stride := .18 if name in ["thornback","mega_thornback"] else .14
    return posmod(int(distance/stride),4) if moving else 1
