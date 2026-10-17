extends RefCounted
## External, optional art only. Never touches the adventure catalogue or saves.
var entries: Dictionary = {}
var textures: Dictionary = {}
var issue := ""
var source_root := ""
var trainer: Dictionary = {}
var items: Dictionary = {}

static func configured_root() -> String:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--pack="): return arg.trim_prefix("--pack=")
	var override := OS.get_environment("WILDBOND_PRIVATE_PACK")
	if override != "": return override
	var locator := "res://tests/private_sprites/local-pack.json"
	if FileAccess.file_exists(locator):
		var value = JSON.parse_string(FileAccess.get_file_as_string(locator))
		if value is Dictionary: return str(value.get("root", ""))
	return OS.get_environment("LOCALAPPDATA").path_join("Wildbond/private-sprites/v1")

func _reject(reason: String) -> bool:
	entries.clear()
	textures.clear()
	trainer.clear()
	items.clear()
	issue = reason
	return false

static func _number(value: Variant) -> bool:
	return (value is int or value is float) and is_finite(float(value))

func _path(rel: String) -> String:
	if rel == "" or rel.is_absolute_path() or "\\" in rel or ":" in rel: return ""
	var p := source_root.path_join(rel).simplify_path()
	if not p.begins_with(source_root.trim_suffix("/") + "/"): return ""
	return p

func open_pack(folder: String) -> bool:
	entries.clear()
	textures.clear()
	trainer.clear()
	items.clear()
	issue = ""
	source_root = folder.replace("\\", "/").trim_suffix("/").simplify_path()
	if source_root == "" or not source_root.is_absolute_path() or source_root.begins_with("res://"):
		return _reject("Private pack unavailable. Original creatures are ready.")
	var path := source_root.path_join("manifest.json")
	if not FileAccess.file_exists(path): return _reject("Private pack not installed. Original creatures are ready.")
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null or file.get_length() > 1024 * 1024: return _reject("Private manifest is unreadable.")
	var manifest = JSON.parse_string(file.get_as_text())
	if not manifest is Dictionary or manifest.get("schema") != 1: return _reject("Private manifest has an unsupported format.")
	if not manifest.get("files") is Array or not manifest.get("species") is Dictionary:
		return _reject("Private manifest is incomplete.")
	if manifest.files.size() > 128 or manifest.species.size() > 16: return _reject("Private pilot pack is too large.")
	var verified := {}
	for item in manifest.files:
		if not item is Dictionary: return _reject("Private file record is invalid.")
		var rel := str(item.get("file", ""))
		var asset_path := _path(rel)
		if asset_path == "" or verified.has(rel) or not FileAccess.file_exists(asset_path):
			return _reject("Private file is missing or outside the pack.")
		var asset := FileAccess.open(asset_path, FileAccess.READ)
		if asset == null or asset.get_length() > 8 * 1024 * 1024: return _reject("Private file is unreadable or too large.")
		if FileAccess.get_sha256(asset_path) != item.get("sha256", ""): return _reject("Private file changed. Run setup again.")
		verified[rel] = true
	var pending := {}
	for sid in manifest.species:
		if not str(sid).begins_with("pokemon:") or not str(sid).trim_prefix("pokemon:").is_valid_int():
			return _reject("Private species ID is invalid.")
		var e = manifest.species[sid]
		if not e is Dictionary or not e.get("battle") is Dictionary or not e.get("animations") is Dictionary:
			return _reject("Private species data is incomplete.")
		if str(e.get("name", "")).length() < 1 or str(e.name).length() > 32: return _reject("Private species name is invalid.")
		for facing in ["front", "back"]:
			var art = e.battle.get(facing, {})
			if not art is Dictionary or not verified.has(art.get("file", "")): return _reject("Private battle view is missing.")
			var tex := _load_texture(str(art.file))
			if tex == null: return _reject("Private sprite could not be decoded.")
			var meta = art.get("image", {})
			if not meta is Dictionary or tex.get_width() != meta.get("width") or tex.get_height() != meta.get("height"):
				return _reject("Private sprite dimensions changed.")
			var ink = meta.get("ink")
			if not ink is Array or ink.size() != 4: return _reject("Private sprite bounds are invalid.")
			for v in ink:
				if not _number(v): return _reject("Private sprite bounds must be numbers.")
			if ink[0] < 0 or ink[1] < 0 or ink[2] > tex.get_width() or ink[3] > tex.get_height() or ink[2] <= ink[0] or ink[3] <= ink[1]:
				return _reject("Private sprite bounds are outside its canvas.")
		for state in e.animations:
			var a = e.animations[state]
			if not a is Dictionary or not verified.has(a.get("file", "")): return _reject("Private animation is missing.")
			var tex := _load_texture(str(a.file))
			if not _valid_animation(a, tex): return _reject("Private animation grid or anchors are invalid.")
		pending[sid] = e.duplicate(true)
	if pending.is_empty(): return _reject("Private pack has no creatures.")
	var human = manifest.get("trainer", {})
	if not human is Dictionary: return _reject("Private trainer metadata is invalid.")
	for state in human:
		if state not in ["walking", "running"] or not verified.has(human[state]): return _reject("Private trainer file is invalid.")
		var tex := _load_texture(str(human[state]))
		if tex == null or tex.get_size() != Vector2(144, 32): return _reject("Private trainer grid is invalid.")
		# GBA source PNGs retain palette-index-zero as an opaque editor colour.
		# Decode that colour key in memory; keep the downloaded source byte-identical.
		var image := tex.get_image()
		image.convert(Image.FORMAT_RGBA8)
		var clear := image.get_pixel(0, 0)
		for y in image.get_height():
			for x in image.get_width():
				if image.get_pixel(x, y) == clear: image.set_pixel(x, y, Color.TRANSPARENT)
		textures[human[state]] = ImageTexture.create_from_image(image)
	trainer = human.duplicate()
	var item_art = manifest.get("items", {})
	if not item_art is Dictionary: return _reject("Private item metadata is invalid.")
	for id in item_art:
		if id not in ["oran-berry", "poke-ball"] or not verified.has(item_art[id]): return _reject("Private item file is invalid.")
		var tex := _load_texture(str(item_art[id]))
		if tex == null or tex.get_width() > 64 or tex.get_height() > 64: return _reject("Private item icon is invalid.")
	items = item_art.duplicate()
	entries = pending
	return true

func trainer_texture(running: bool) -> Texture2D:
	var key := "running" if running else "walking"
	return textures.get(trainer.get(key, ""))

func item_texture(id: String) -> Texture2D:
	return textures.get(items.get(id, ""))

func _load_texture(rel: String) -> Texture2D:
	if textures.has(rel): return textures[rel]
	var image := Image.new()
	if image.load(_path(rel)) != OK or image.get_width() > 4096 or image.get_height() > 4096: return null
	var tex := ImageTexture.create_from_image(image)
	textures[rel] = tex
	return tex

func _valid_animation(a: Dictionary, tex: Texture2D) -> bool:
	if tex == null: return false
	var dims = a.get("frame_size")
	var durations = a.get("durations")
	var anchors = a.get("anchors")
	if not dims is Array or dims.size() != 2 or not durations is Array or durations.is_empty() or not anchors is Array: return false
	if not _number(dims[0]) or not _number(dims[1]): return false
	if a.get("directions") != 8 or anchors.size() != 8 or dims[0] <= 0 or dims[1] <= 0: return false
	if tex.get_width() != dims[0] * durations.size() or tex.get_height() != dims[1] * 8: return false
	for t in durations:
		if not (t is float or t is int) or not is_finite(float(t)) or t <= 0 or t > 10: return false
	for row in anchors:
		if not row is Array or row.size() != durations.size(): return false
		for at in row:
			if not at is Array or at.size() != 2: return false
			if not _number(at[0]) or not _number(at[1]): return false
			if at[0] < 0 or at[1] < 0 or at[0] >= dims[0] or at[1] >= dims[1]: return false
	return true

func battle_frame(sid: String, back: bool) -> Dictionary:
	if not entries.has(sid): return {}
	var art: Dictionary = entries[sid].battle["back" if back else "front"]
	var b: Array = art.image.ink
	return {"texture": textures[art.file], "region": Rect2(b[0], b[1], b[2] - b[0], b[3] - b[1])}

func world_frame(sid: String, state: String, direction: int, seconds: float) -> Dictionary:
	if not entries.has(sid) or not entries[sid].animations.has(state): return {}
	var a: Dictionary = entries[sid].animations[state]
	var total := 0.0
	for t in a.durations: total += float(t)
	var time := fposmod(seconds, total)
	var frame := 0
	while frame < a.durations.size() - 1 and time >= float(a.durations[frame]):
		time -= float(a.durations[frame])
		frame += 1
	var row := clampi(direction, 0, 7)
	var dims := Vector2(float(a.frame_size[0]), float(a.frame_size[1]))
	var foot: Array = a.anchors[row][frame]
	return {"texture": textures[a.file], "region": Rect2(Vector2(frame, row) * dims, dims),
		"anchor": Vector2(float(foot[0]), float(foot[1])), "frame": frame, "direction": row}
