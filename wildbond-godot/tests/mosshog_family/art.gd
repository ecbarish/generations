extends "res://tests/starter_sprites/art.gd"
## Appearance-only audition. No evolved species records or save identities.
const FAMILY_ROOT := "res://tests/mosshog_family/"
func open() -> bool:
    if not super.open():return false
    for name in ["ripplet","cindercub"]:
        entries.erase(name);textures.erase(name);palettes.erase(name)
    var family: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(FAMILY_ROOT+"frames.json"))
    for name in family:
        var entry: Dictionary=family[name]
        if FileAccess.get_sha256(FAMILY_ROOT+entry.file)!=entry.sha256:return false
        var texture: Texture2D=load(FAMILY_ROOT+entry.file)
        if texture==null or texture.get_size()!=Vector2(entry.size[0],entry.size[1]):return false
        entries[name]=entry;textures[name]=texture;palettes[name]=palettes["mosshog"]
    return family.size()==3
func frame(name: String,index: int,flip := false) -> Dictionary:
    if name=="mosshog":
        var f := super.frame(name,index,flip)
        var ref: Dictionary=entries[name].frames[0 if index<4 else 5]
        f.sample_step=maxf(float(ref.ink[3])/(48.0 if index<2 else (60.0 if index<4 else 32.0)),float(ref.ink[2])/80.0)
        return f
    if not entries.has(name):return {}
    var entry: Dictionary=entries[name]
    index=clampi(index,0,entry.frames.size()-1)
    var f: Dictionary=entry.frames[index]
    return {"texture":textures[name],"region":Rect2(f.region[0],f.region[1],f.region[2],f.region[3]),"anchor":Vector2(f.anchor[0],f.anchor[1]),"pixel_size":float(entry.height_m)/float(entry.frames[5 if not entry.mega else 0].ink[3]),"flip":flip,"index":index,"sample_step":float(f.sample_step)}
func walking(name: String,direction: int,phase: int) -> Dictionary:
    if name=="mega_thornback":return walking("thornback",direction,phase)
    return super.walking(name,direction,phase)
func battle(name: String,back: bool,_seconds: float) -> Dictionary:
    # Alternate whole-body generation poses await cleanup; never twitch on blink.
    return frame(name,(1 if back else 0) if name=="mega_thornback" else (2 if back else 0),not back)
func phase(name: String,distance: float,moving: bool) -> int:
    if name=="mega_thornback":name="thornback"
    return posmod(int(distance/float(entries[name].get("stride_m",.14))),4) if moving else 1
