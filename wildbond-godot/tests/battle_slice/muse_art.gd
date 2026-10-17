extends RefCounted
## Supplied images remain byte-identical. Placement uses a common height and foot anchor, without flipping.
const ROOT := "res://tests/battle_slice/muse/"
const ORDER := [0, 1, 2, 3, 2, 1]
static var cache: Dictionary = {}

static func texture(name: String) -> Texture2D:
	if not cache.has(name): cache[name] = load(ROOT + name)
	return cache[name]

static func player_frame(seconds: float, moving: bool) -> String:
	if not moving: return "bogsnap-back.png"
	var frame: int = ORDER[int(floor(maxf(0, seconds) * 4.0)) % ORDER.size()]
	return "bogsnap-idle-%d.png" % (frame + 1)

static func destination(ink: Rect2i, foot: Vector2, height: float) -> Rect2:
	var zoom := height / maxf(1, ink.size.y)
	var dimensions := Vector2(ink.size) * zoom
	return Rect2(foot - Vector2(dimensions.x * 0.5, dimensions.y), dimensions)
