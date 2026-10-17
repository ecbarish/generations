extends RefCounted
## Supplied images remain byte-identical. Placement uses a common height and foot anchor, without flipping.
const ROOT := "res://tests/battle_slice/muse/"
static var cache: Dictionary = {}

static func texture(name: String) -> Texture2D:
	if not cache.has(name): cache[name] = load(ROOT + name)
	return cache[name]

static func player_frame(_seconds: float, _moving: bool) -> String:
	# The supplied extracted idle poses contain clipped snouts and inconsistent silhouettes.
	# Keep those bytes as references, but render the complete back until a coherent cycle is accepted.
	return "bogsnap-back.png"

static func destination(ink: Rect2i, foot: Vector2, height: float) -> Rect2:
	var zoom := height / maxf(1, ink.size.y)
	var dimensions := Vector2(ink.size) * zoom
	return Rect2(foot - Vector2(dimensions.x * 0.5, dimensions.y), dimensions)
