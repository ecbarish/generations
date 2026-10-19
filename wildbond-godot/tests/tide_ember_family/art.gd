extends "res://tests/mosshog_family/art.gd"
## Display-only identity map, deliberately separate from live species/profile records.
const NEW_ROOT := "res://tests/tide_ember_family/"
var raw_mode := false
var pixel_heights: Dictionary={}
func open() -> bool:
    entries.clear();textures.clear();palettes.clear();pixel_heights.clear()
    var data: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(NEW_ROOT+("source-frames.json" if raw_mode else "frames.json")))
    if raw_mode:
        var bases: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/starter_sprites/frames.json"))
        for name in ["ripplet","cindercub"]:
            data[name]=bases[name].duplicate(true)
            data[name].file="../starter_sprites/"+data[name].file
            data[name].palette=PALETTES[name]
            data[name].stride_m=.14
            for i in data[name].frames.size():
                var f: Dictionary=data[name].frames[i];var ref: Dictionary=data[name].frames[0 if i<4 else 5]
                f.sample_step=maxf(float(ref.ink[3])/(48.0 if i<2 else (60.0 if i<4 else 32.0)),float(ref.ink[2])/80.0)
    for name in data:
        var e: Dictionary=data[name]
        if FileAccess.get_sha256(NEW_ROOT+e.file)!=e.sha256:return false
        var texture: Texture2D=load(NEW_ROOT+e.file)
        if texture==null:return false
        entries[name]=e;textures[name]=texture
        palettes[name]=PackedColorArray(e.palette.map(func(hex):return Color(hex)))
        var ref: Dictionary=e.frames[0 if name.begins_with("mega_") else 5]
        pixel_heights[name]=texture.get_image().get_region(Rect2i(ref.region[0],ref.region[1],ref.region[2],ref.region[3])).get_used_rect().size.y
    return data.size()==8
func frame(name: String,index: int,flip := false) -> Dictionary:
    if not entries.has(name):return {}
    var e: Dictionary=entries[name];index=clampi(index,0,e.frames.size()-1)
    var f: Dictionary=e.frames[index]
    return {"texture":textures[name],"region":Rect2(f.region[0],f.region[1],f.region[2],f.region[3]),"anchor":Vector2(f.anchor[0],f.anchor[1]),"pixel_size":float(e.height_m)/pixel_heights[name],"flip":flip,"index":index,"sample_step":float(f.sample_step)}
func walking(name: String,direction: int,phase: int) -> Dictionary:
    if name.begins_with("mega_"):name=name.trim_prefix("mega_")
    var row: int=[0,1,2,3,4,3,2,1][posmod(direction,8)]
    return frame(name,4+row*4+clampi(phase,0,3),direction>4)
func battle(name: String,back: bool,seconds: float) -> Dictionary:
    if name.begins_with("mega_"):return frame(name,1 if back else 0,not back)
    var blink := not raw_mode and not back and fposmod(seconds,3.8)>3.64
    return frame(name,2 if back else (1 if blink else 0),not back)
func phase(name: String,distance: float,moving: bool) -> int:
    if name.begins_with("mega_"):name=name.trim_prefix("mega_")
    return posmod(int(distance/float(entries[name].get("stride_m",.14))),4) if moving else 1
