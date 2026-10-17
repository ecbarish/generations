extends RefCounted
## Supplied images remain byte-identical. Placement uses a common height and foot anchor, without flipping.
const ROOT := "res://tests/battle_slice/muse/"
const APPROVED_ROOT := "res://tests/battle_slice/approved_bogsnap/"
const APPROVED_BACK := "battle-back-v1.png"
## Body bounds plus eight transparent pixels; excludes invisible exterior alpha specks, without changing the file.
const APPROVED_INK := Rect2i(114, 46, 1330, 956)
static var cache: Dictionary = {}

static func texture(name: String) -> Texture2D:
	if not cache.has(name): cache[name] = load((APPROVED_ROOT if name == APPROVED_BACK else ROOT) + name)
	return cache[name]

static func player_frame(_seconds: float, _moving: bool) -> String:
	# Evan's approved sheet is authoritative. The Muse ZIP's different back and clipped idle poses are references.
	return APPROVED_BACK

static func destination(ink: Rect2i, foot: Vector2, height: float) -> Rect2:
	var zoom := height / maxf(1, ink.size.y)
	var dimensions := Vector2(ink.size) * zoom
	return Rect2(foot - Vector2(dimensions.x * 0.5, dimensions.y), dimensions)
