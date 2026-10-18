extends RefCounted
## Appearance-only source frames; never species definitions or saved party records.
const ROOT := "res://tests/starter_sprites/"
var entries: Dictionary = {}
var textures: Dictionary = {}
var palettes: Dictionary = {}
const PALETTES := {
	"ripplet":["102238","104574","176eab","188fc4","2db6d4","77d3e6","b9ebf2","f4fbff","a4935a","ddcb8b","fff0b7","ab702d","edb943","fffdf3","70323f","da8075"],
	"mosshog":["20231d","353d25","4d592b","657b31","839c3d","adc34f","d3dc73","70683d","a99359","d6c28c","f5e6b7","fff4d3","a66f63","d89b88","464039","e7d68b"],
	"cindercub":["201e27","352a30","503834","704636","9b5336","c26735","e98a39","ffb547","ffe17e","92715b","c79b70","e7c79a","ffebc6","fff7dc","843433","da7861"]
}

func open() -> bool:
	entries=JSON.parse_string(FileAccess.get_file_as_string(ROOT+"frames.json"))
	textures.clear()
	palettes.clear()
	for name in entries:
		var entry: Dictionary=entries[name]
		if FileAccess.get_sha256(ROOT+entry.file)!=entry.sha256:return false
		var texture: Texture2D=load(ROOT+entry.file)
		if texture==null or texture.get_size()!=Vector2(entry.size[0],entry.size[1]):return false
		textures[name]=texture
		palettes[name]=PackedColorArray(PALETTES[name].map(func(hex):return Color(hex)))
	return not entries.is_empty()

func frame(name: String, index: int, flip := false) -> Dictionary:
	if not textures.has(name):return {}
	var entry: Dictionary=entries[name]
	var f: Dictionary=entry.frames[clampi(index,0,23)]
	var r: Array=f.region
	return {"texture":textures[name],"region":Rect2(r[0],r[1],r[2],r[3]),"anchor":Vector2(f.anchor[0],f.anchor[1]),"pixel_size":float(entry.height_m)/float(entry.frames[5].ink[3]),"flip":flip,"index":clampi(index,0,23)}

func walking(name: String, direction: int, phase: int) -> Dictionary:
	direction=posmod(direction,8)
	var row: int=[0,1,2,3,4,3,2,1][direction]
	return frame(name,4+row*4+clampi(phase,0,3),direction>4)

func battle(name: String, back: bool, seconds: float) -> Dictionary:
	return frame(name,(2 if back else 0)+(1 if fposmod(seconds,3.8)>3.64 else 0),not back)
