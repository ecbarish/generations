extends RefCounted
## People and creatures built from parts (docs/wildbond-plan.md, "Art direction" and "3D and every world").
## Every figure is a list of parts [x, y, w, h, colour] around an origin, drawn with one dark outline around the
## whole shape. The same parts drive the world, the ranch register (character creator) and, later, a simple 3D rig,
## so any CanvasItem can draw them: Figures.person(self, ...) or Figures.creature(self, ...).

const OUTLINE := Color("1e1a22")

static func paint(ci: CanvasItem, o: Vector2, parts: Array) -> void:
	for p in parts:
		if p.size() > 5 and not p[5]:
			continue                                                            # thin parts (spider legs) go without an outline
		ci.draw_rect(Rect2(o + Vector2(p[0] - 1, p[1] - 1), Vector2(p[2] + 2, p[3] + 2)), OUTLINE)
	for p in parts:
		ci.draw_rect(Rect2(o + Vector2(p[0], p[1]), Vector2(p[2], p[3])), p[4])

## A person, about 12x21 pixels from the origin (the top of the head). face: which way they look; frame 0-3 while
## walking (1 and 3 lift a foot, 0 and 2 pass with a little bob). look keys: skin, hair, hat, shirt, legs, shoes,
## apron (optional), body ("broad" | "narrow"), style ("cap" | "short" | "long" | "ponytail" | "bun" | "spiky"),
## outfit ("trousers" | "skirt" | "overalls").
static func person(ci: CanvasItem, o: Vector2, face: Vector2i, walking: bool, frame: int, blink: bool, look: Dictionary) -> void:
	var origin := o
	var f := 0 if not walking else frame
	if walking and f % 2 == 0:
		origin.y -= 1
	paint(ci, origin, person_parts(face, walking, frame, blink, look))

static func person_parts(face: Vector2i, walking: bool, frame: int, blink: bool, look: Dictionary) -> Array:
	if not walking:
		frame = 0
	var side := face.x != 0
	var right := face == Vector2i.RIGHT
	var narrow: bool = look.get("body", "broad") == "narrow"
	var outfit: String = look.get("outfit", "trousers")
	var style: String = look.get("style", "short")
	var skin: Color = look.skin
	var hair: Color = look.hair
	var shirt: Color = look.shirt
	var legs: Color = look.legs
	var shoes: Color = look.get("shoes", Color("3a2a1a"))
	var hat: Color = look.get("hat", legs)
	var shade := shirt.darkened(0.25)
	var swing := 1 if frame == 1 else (-1 if frame == 3 else 0)
	var up_l := 1 if frame == 1 else 0
	var up_r := 1 if frame == 3 else 0
	var P: Array = []
	# legs (or a skirt), the stepping foot lifted
	if outfit == "skirt":
		P.append([3, 13, 6, 3, legs]); P.append([2, 16, 8, 2, legs])
		P.append([3 + up_l, 18, 2, 1, shoes]); P.append([7 - up_r, 18, 2, 1, shoes])
	elif side:
		var fwd := 1 if right else -1
		P.append([5 - swing * fwd, 13, 2, 5 - up_r, legs.darkened(0.2)])          # the far leg
		P.append([5 - swing * fwd + fwd, 18 - up_r, 2, 1, shoes.darkened(0.2)])
		P.append([5 + swing * fwd, 13, 2, 5 - up_l, legs])                         # the near leg
		P.append([5 + swing * fwd + fwd, 18 - up_l, 2, 1, shoes])
	else:
		P.append([3, 13, 3, 5 - up_l, legs]); P.append([6, 13, 3, 5 - up_r, legs.darkened(0.12)])
		P.append([3, 18 - up_l, 3, 1, shoes]); P.append([6, 18 - up_r, 3, 1, shoes])
	# body: broad shoulders, or narrow shoulders over wider hips
	var bx := 4 if narrow else 3
	var bw := 4 if narrow else 6
	P.append([bx, 7, bw, 6, shirt]); P.append([bx + bw - (1 if narrow else 2), 7, 1 if narrow else 2, 6, shade])
	if narrow and outfit != "skirt" and not side:
		P.append([3, 12, 6, 1, legs])
	if outfit == "overalls":
		if face == Vector2i.UP:
			P.append([bx + 1, 7, 1, 6, legs]); P.append([bx + bw - 2, 7, 1, 6, legs])
		elif side:
			P.append([4, 10, 4, 3, legs]); P.append([(5 if right else 6), 7, 1, 3, legs])
		else:
			P.append([bx + 1, 9, bw - 2, 4, legs]); P.append([bx + 1, 7, 1, 2, legs]); P.append([bx + bw - 2, 7, 1, 2, legs])
	if look.has("apron") and face != Vector2i.UP:
		P.append([4 if not side else (5 if right else 3), 8, 4, 6, look.apron])
	# arms swing against the legs
	if side:
		var ax := 5 - swing * (1 if right else -1)
		P.append([ax, 8, 2, 4, shade]); P.append([ax, 12, 2, 1, skin])
	else:
		var al := 2 if narrow else 1
		var ar := 8 if narrow else 9
		P.append([al, 7 + swing, 2, 4, shirt]); P.append([al, 11 + swing, 2, 1, skin])
		P.append([ar, 7 - swing, 2, 4, shade]); P.append([ar, 11 - swing, 2, 1, skin])
	# head and hair
	P.append([5, 6, 2, 1, skin]); P.append([3, 0, 6, 6, skin])
	var back_x := 3 if right else 7                                              # the back of the head, side-on
	match style:
		"cap":
			P.append([3, 0, 6, 2, hat])
			if face == Vector2i.DOWN: P.append([3, 2, 6, 1, hat]); P.append([3, 3, 1, 2, hair]); P.append([8, 3, 1, 2, hair])
			elif side: P.append([(8 if right else 1), 2, 3, 1, hat]); P.append([back_x, 2, 2, 3, hair])
		"short":
			P.append([3, 0, 6, 2, hair])
			if not side: P.append([3, 2, 1, 2, hair]); P.append([8, 2, 1, 2, hair])
			else: P.append([back_x, 1, 2, 3, hair])
		"long":
			P.append([3, 0, 6, 2, hair])
			if not side: P.append([2, 1, 2, 8, hair]); P.append([8, 1, 2, 8, hair])
			else: P.append([(2 if right else 7), 1, 3, 8, hair])
		"ponytail":
			P.append([3, 0, 6, 2, hair])
			if not side: P.append([3, 2, 1, 2, hair]); P.append([8, 2, 1, 2, hair])
			else: P.append([back_x, 1, 2, 3, hair]); P.append([(1 if right else 9), 2, 2, 5, hair])
		"spiky":
			P.append([3, 0, 6, 2, hair]); P.append([3, -1, 1, 1, hair]); P.append([5, -2, 1, 2, hair]); P.append([7, -1, 1, 1, hair])
			if not side: P.append([3, 2, 1, 2, hair]); P.append([8, 2, 1, 2, hair]); P.append([5, 2, 2, 1, hair])
			else: P.append([back_x, 1, 2, 3, hair]); P.append([(2 if right else 9), 0, 1, 2, hair])
		"bun":
			P.append([3, 0, 6, 2, hair]); P.append([5, -2, 2, 2, hair])
			if not side: P.append([3, 2, 1, 3, hair]); P.append([8, 2, 1, 3, hair])
			else: P.append([back_x, 1, 2, 4, hair]); P.append([(2 if right else 8), 0, 2, 3, hair])   # the bun at the back
	if face == Vector2i.UP:
		P.append([3, 2, 6, 4, hair] if style == "cap" else [3, 1, 6, 5, hair])
		if style == "long": P.append([2, 1, 8, 8, hair])
		if style == "ponytail": P.append([5, 5, 2, 5, hair])
	var eye := Color("222222") if not blink else skin.darkened(0.3)
	if face == Vector2i.DOWN:
		P.append([4, 3, 1, 1, eye]); P.append([7, 3, 1, 1, eye])
	elif side:
		P.append([7 if right else 4, 3, 1, 1, eye])
	return P

## A four-legged creature seen from the side, about 18x14 pixels (feet on y = 12 from the origin), facing right or
## mirrored left. Each body plan ("kind") is its own list of parts on the same frame, so new creatures are new plans.
## pose keys: frame (0-3 trot: 1 and 3 lift a diagonal pair), walking, blink, wag (-1 down, 0, 1 up), crouch (0-2,
## for a pounce), sit, sniff (head down), twitch (the nose, -1..1), ears_up, bird (a little bird rides a Mosshog).
## look keys: kind ("wolf" | "lizard" | "boar"), body, belly, dark, accent (fins, moss), snout.
static func creature(ci: CanvasItem, o: Vector2, right: bool, pose: Dictionary, look: Dictionary) -> void:
	paint(ci, o, parts_of(right, pose, look))

## The parts of a creature, before they are painted. Marks (a promised feature that a later form cashes in) are
## added only when the look names them, so an older body plan stays as it was.
static func parts_of(right: bool, pose: Dictionary, look: Dictionary) -> Array:
	var P: Array
	match look.get("kind", "wolf"):
		"lizard": P = _lizard(pose, look)
		"boar": P = _boar(pose, look)
		"cat": P = _cat(pose, look)
		"hyena": P = _hyena(pose, look)
		"croc": P = _croc(pose, look)
		"horse": P = _horse(pose, look)
		"bird": P = _bird(pose, look)
		"spider": P = _spider(pose, look)
		"sprite": P = _sprite(pose, look)
		"serpent": P = _serpent(pose, look)
		"turtle": P = _turtle(pose, look)
		"moth": P = _moth(pose, look)
		"treefolk": P = _treefolk(pose, look)
		_: P = _wolf(pose, look)
	if str(look.get("head", "")) != "":
		P.append_array(_marks(pose, look))
	if str(look.get("gear", "")) != "":
		P.append_array(_gear_parts(P, str(look.gear)))
	if not right:
		for p in P:
			p[0] = 17 - p[0] - p[2]
	return P

## How tall and wide a figure reads, including the one-pixel outline. World size is this times the species scale.
static func pixel_span(parts: Array) -> Vector2i:
	var min_x := 999
	var min_y := 999
	var max_x := -999
	var max_y := -999
	for p in parts:
		min_x = mini(min_x, int(p[0]))
		min_y = mini(min_y, int(p[1]))
		max_x = maxi(max_x, int(p[0]) + int(p[2]))
		max_y = maxi(max_y, int(p[1]) + int(p[3]))
	return Vector2i(max_x - min_x + 2, max_y - min_y + 2)

## Gear shows on whoever wears it (rules.gd GEAR): found on the body (the biggest part), so it fits every body plan.
## A harness is a strap round the middle with a buckle, a bell hangs at the chest, a ribbon flies at the back, and a
## band or charm is a collar of its colour just behind the head.
const GEAR_COL := { "harness": Color("8a5a32"), "bell": Color("e8c040"), "ribbon": Color("e04a8a"), "ember": Color("e0602a"),
	"tide": Color("6ab0e8"), "grove": Color("5d9a3e"), "stone": Color("9a9488") }
static func _gear_parts(P: Array, gear: String) -> Array:
	var body: Array = P[0]
	for p in P:
		if p[2] * p[3] > body[2] * body[3]:
			body = p
	var x: int = body[0]
	var y: int = body[1]
	var w: int = body[2]
	var h: int = body[3]
	var col: Color = GEAR_COL.get(gear, Color.WHITE)
	match gear:
		"harness":
			return [[x + w / 2 - 1, y, 2, h, col, false], [x + 1, y + h / 2, w - 2, 1, col, false], [x + w / 2 - 1, y + h / 2, 2, 1, Color("e8c040"), false]]
		"bell":
			return [[x + w - 2, y + h - 1, 3, 1, Color("6a4a2a"), false], [x + w - 1, y + h, 2, 2, col]]
		"ribbon":
			return [[x - 1, y - 1, 2, 2, col], [x - 3, y - 2, 2, 1, col, false]]
		_:
			return [[x + w - 2, y, 1, h, col, false], [x + w - 3, y, 1, h, col.darkened(0.25), false]]

static func _frame(pose: Dictionary) -> int:
	return pose.get("frame", 0) if pose.get("walking", false) else 0

static func _lift(frame: int, pair: int) -> int:
	# pair 0 (back-near and front-far) lifts on frame 1, pair 1 (back-far and front-near) on frame 3
	return 1 if (frame == 1 and pair == 0) or (frame == 3 and pair == 1) else 0

static func _eye(pose: Dictionary, c: Color) -> Color:
	return Color("222222") if not pose.get("blink", false) else c.darkened(0.3)

## Cindercub's plan: a wolf pup with a brush of a tail, pricked ears and a pale muzzle.
static func _wolf(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var cr: int = pose.get("crouch", 0)
	var sit: bool = pose.get("sit", false)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 4 + cr                                                            # the top of the back
	var P: Array = []
	var legh := 3 - cr
	# far legs
	if not sit:
		P.append([5 + _lift(f, 1), by + 5, 1, legh - _lift(f, 1), c.darkened(0.25)])
	P.append([12 + _lift(f, 0), by + 5, 1, legh - _lift(f, 0), c.darkened(0.25)])
	# the tail, wagging
	if sit:
		P.append([1, 10, 6, 2, c]); P.append([1, 10, 2, 2, belly])
	else:
		var ty := by - 2 - wag                                                    # a full brush of a tail
		P.append([2, by, 2, 2, c]); P.append([0, ty, 3, 4, c]); P.append([0, ty, 2, 1, belly]); P.append([0, ty + 1, 1, 1, belly])
	# the body
	if sit:
		P.append([3, by + 1, 8, 5, c]); P.append([4, by + 4, 4, 3, c]); P.append([6, 11, 2, 1, dark])   # haunch and paw
	else:
		P.append([3, by, 8, 5, c])
	P.append([5, by + 3 + (1 if sit else 0), 5, 2, belly]); P.append([4, by + (1 if sit else 0), 6, 1, c.lightened(0.15)])
	# near legs
	if not sit:
		P.append([4 + _lift(f, 0), by + 5, 1, legh - _lift(f, 0), c]); P.append([4 + _lift(f, 0), by + 4 + legh - _lift(f, 0), 1, 1, dark])
	P.append([11 + _lift(f, 1), by + 5, 1, legh - _lift(f, 1), c]); P.append([11 + _lift(f, 1), by + 4 + legh - _lift(f, 1), 1, 1, dark])
	# the head: ears, cheek, snout and an eye
	var hx := 10
	var hy := by - 4 + (2 if pose.get("sniff", false) else 0) + (1 if sit else 0)
	var tw: int = pose.get("twitch", 0)
	if pose.get("ears_up", false):
		P.append([hx, hy - 3, 2, 3, c]); P.append([hx + 3, hy - 3, 2, 3, c]); P.append([hx + 3, hy - 2, 1, 1, dark])
	else:
		P.append([hx - 1, hy - 1, 2, 2, c]); P.append([hx + 3, hy - 2, 2, 2, c])
	P.append([hx, hy, 5, 5, c]); P.append([hx + 1, hy + 3, 3, 2, belly])
	P.append([hx + 5 + tw, hy + 2, 2, 2, belly]); P.append([hx + 6 + tw, hy + 2, 1, 1, dark])
	P.append([hx + 3, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Ripplet's plan: a low river lizard with a long tapering tail, a fin down its back and a big, curious eye.
static func _lizard(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var fin: Color = look.get("accent", c.lightened(0.3))
	var cr: int = pose.get("crouch", 0)
	var lie: bool = pose.get("sit", false)                                       # a lizard rests flat on its belly
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 6 + cr + (1 if lie else 0)                                        # the top of the back (it sits low)
	var P: Array = []
	var legh := (12 - (by + 4)) if not lie else 0
	# far legs, splayed
	if legh > 0:
		P.append([6 + _lift(f, 1), by + 4, 1, legh - _lift(f, 1), c.darkened(0.25)])
		P.append([12 + _lift(f, 0), by + 4, 1, legh - _lift(f, 0), c.darkened(0.25)])
	# the tail: long and tapering, the tip flicking
	P.append([0, by + 2 - wag, 2, 1, c]); P.append([1, by + 2, 3, 2, c]); P.append([3, by + 1, 2, 3, c])
	# the body, with a fin of spines down the back
	P.append([4, by, 8, 4, c]); P.append([5, by + 3, 6, 1, belly])
	for i in 3:
		P.append([5 + i * 2, by - 1, 1, 1, fin])
	# near legs
	if legh > 0:
		P.append([5 + _lift(f, 0), by + 4, 2, legh - _lift(f, 0), c]); P.append([11 + _lift(f, 1), by + 4, 2, legh - _lift(f, 1), c])
	# the head: flat, a frill behind it, a wide mouth line and one big eye
	var hy := by - 1 + (1 if pose.get("sniff", false) else 0)
	P.append([11, hy - 1, 2, 2, fin]); P.append([12, hy, 5, 4, c]); P.append([13, hy + 3, 4, 1, belly])
	P.append([14, hy + 2, 3, 1, c.darkened(0.3)])
	P.append([14, hy, 2, 2, Color("f4f4f4")]); P.append([15, hy + (0 if pose.get("ears_up", false) else 1), 1, 1, _eye(pose, c)])
	return P

## Mosshog's plan: a stocky boar, moss and a few flowers growing on its back, a round snout and small tusks;
## sometimes a little bird rides on the moss ("Birds nest in it, and it lets them").
static func _boar(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var moss: Color = look.get("accent", Color("5d9a3e"))
	var snout: Color = look.get("snout", Color("b07a5a"))
	var cr: int = pose.get("crouch", 0)
	var sit: bool = pose.get("sit", false)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 5 + cr + (1 if sit else 0)
	var P: Array = []
	var legh := 12 - (by + 5)
	# far legs, short and sturdy
	if legh > 0:
		P.append([4 + _lift(f, 1), by + 5, 2, legh - _lift(f, 1), c.darkened(0.25)]); P.append([10 + _lift(f, 0), by + 5, 2, legh - _lift(f, 0), c.darkened(0.25)])
	# a curly little tail
	P.append([1, by + wag, 1, 2, c]); P.append([1, by - 1 + wag, 1, 1, dark])
	# the body and the garden on its back
	P.append([2, by - 1, 9, 6, c]); P.append([4, by + 3, 6, 2, belly])
	P.append([3, by - 2, 7, 2, moss]); P.append([4, by - 3, 4, 1, moss.lightened(0.15)])
	P.append([5, by - 3, 1, 1, Color("f0a0c0")]); P.append([8, by - 2, 1, 1, Color("f2e8a0")])
	if pose.get("bird", false):
		P.append([6, by - 6, 2, 2, Color("8a6a4a")]); P.append([8, by - 5, 1, 1, Color("f2b04a")]); P.append([7, by - 6, 1, 1, Color("222222")])
	# near legs
	if legh > 0:
		P.append([3 + _lift(f, 0), by + 5, 2, legh - _lift(f, 0), c]); P.append([9 + _lift(f, 1), by + 5, 2, legh - _lift(f, 1), c])
	# the head: ears, a round snout with a nostril, little tusks and an eye
	var hy := by + (2 if pose.get("sniff", false) else 0)
	var tw: int = pose.get("twitch", 0)
	P.append([10, hy - 2, 2, 2, c]); P.append([13, hy - 2 - (1 if pose.get("ears_up", false) else 0), 2, 2, c])
	P.append([10, hy, 5, 5, c])
	P.append([15, hy + 2 + tw, 2, 3, snout]); P.append([16, hy + 3 + tw, 1, 1, dark])
	P.append([15, hy + 5, 1, 1, Color("f4f0e0")])
	P.append([13, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Species that get one of the newer body shapes (WD2, game review GR-1): their family in the shared data stays as it
## is for the browser game, but here they take the shape their description asks for, so whole families stop sharing
## one outline. A "shape" field in the data, when ChatGPT adds one (WD2 data), wins over this table.
const SHAPE_FOR := {
	"tidewyrm": "serpent", "deeptide": "serpent", "rillwhisk": "serpent",           # a wyrm that rides the currents
	"bogbough": "turtle", "cairnclasp": "turtle", "siltjaw": "turtle",              # shells, mossy backs, grip
	"veilmote": "moth", "fogsail": "moth", "dawntassel": "moth",                    # drifting, pale-edged, dusk and dawn
	"orchardroot": "treefolk", "flintroot": "treefolk", "meadowmantle": "treefolk", # roots, soil and a sheltering crown
}

## A look for any species from the game data: its family's body plan in its own colour (main.gd overrides a few).
static func look_for(species: Dictionary) -> Dictionary:
	var c := Color(species.get("col", "#a08060"))
	var id := str(species.get("name", "")).to_lower()
	var out := { "kind": species.get("shape", SHAPE_FOR.get(id, species.get("fam", "wolf"))), "body": c, "belly": c.lightened(0.45), "dark": c.darkened(0.6),
		"accent": c.lightened(0.25) if species.get("el", "") != "Grove" else Color("5d9a3e"), "snout": c.lightened(0.3) }
	# Marks are opt-in. Existing species keep the body plan they already had.
	if species.get("marks", false):
		var lk: Dictionary = species.get("look", {})
		out["head"] = str(lk.get("head", ""))
		out["back"] = str(lk.get("back", ""))
		out["tail"] = str(lk.get("tail", ""))
		out["pattern"] = str(lk.get("pattern", ""))
	return out

## A few extra parts for a marked species: the promise in a young form, and the same promise opened in a later one.
## Colours stay inside the valley palette (lamplight, leaf, the flower pixels Mosshog already grows).
const LAMP := Color("f2d080")
const FLOWER := Color("f0a0c0")
const FLOWER_PALE := Color("f2e8a0")
const LEAF := Color("5d9a3e")
static func _marks(_pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var accent: Color = look.get("accent", c.lightened(0.3))
	var P: Array = []
	match str(look.get("pattern", "")):
		"rings":
			P.append([7, 8, 3, 1, belly])
		"mottled":
			P.append([6, 7, 1, 1, dark]); P.append([9, 9, 1, 1, belly])
		"bands":
			P.append([5, 7, 6, 1, belly]); P.append([6, 9, 5, 1, accent])
		"speckles":
			P.append([7, 6, 1, 1, accent]); P.append([10, 8, 1, 1, belly])
		"cracks":
			P.append([6, 5, 1, 3, LAMP]); P.append([7, 7, 3, 1, LAMP])
		"rays":
			P.append([8, 4, 1, 3, LAMP]); P.append([11, 5, 1, 2, FLOWER_PALE])
		"socks":
			P.append([4, 11, 1, 1, belly]); P.append([11, 11, 1, 1, belly])
		"spots":
			P.append([8, 5, 2, 2, Color("e0602a")])
		"chevrons":
			P.append([6, 6, 2, 1, dark]); P.append([9, 7, 2, 1, dark])
	match str(look.get("back", "")):
		"fin-ridge":
			P.append([7, 0, 1, 4, accent]); P.append([9, 1, 1, 3, accent])
		"wave-ridge":
			P.append([4, 3, 2, 3, accent]); P.append([7, 2, 2, 4, accent]); P.append([10, 3, 2, 3, belly])
		"narrow-wings":
			P.append([2, 5, 3, 1, accent.darkened(0.15)])
		"crust-plates":
			P.append([5, 3, 3, 2, dark]); P.append([9, 4, 3, 2, c.darkened(0.15)])
		"flower-canopy":
			P.append([3, 1, 3, 2, FLOWER]); P.append([7, 0, 3, 2, FLOWER_PALE]); P.append([11, 1, 3, 2, LEAF])
		"spark-orbit":
			P.append([9, 2, 1, 1, LAMP]); P.append([12, 4, 1, 1, FLOWER_PALE])
		"sun-sail":
			P.append([7, 1, 2, 4, LAMP]); P.append([9, 2, 1, 3, FLOWER_PALE])
		"mist-ruff":
			P.append([8, 4, 4, 2, belly])
		"wind-mane":
			P.append([0, 4, 4, 1, belly]); P.append([0, 5, 3, 1, accent])
		"ember-spots":
			P.append([7, 1, 2, 4, Color("e0602a")])
	match str(look.get("head", "")):
		"fin-crest":
			P.append([12, 2, 2, 2, accent])
		"low-brow":
			P.append([12, 4, 4, 1, dark])
		"tassel-antennae":
			P.append([14, 1, 1, 2, LEAF]); P.append([16, 2, 1, 2, accent])
		"feather-antennae":
			P.append([13, 2, 2, 1, dark]); P.append([15, 1, 1, 2, dark])
		"tassel-crown":
			P.append([8, 0, 1, 2, LAMP]); P.append([10, 0, 1, 2, FLOWER])
		"swept-ears":
			P.append([12, 1, 2, 2, c]); P.append([15, 2, 2, 1, dark])
		"sun-rays":
			P.append([13, 0, 1, 2, LAMP]); P.append([15, 1, 1, 2, FLOWER_PALE]); P.append([16, 2, 1, 1, LAMP])
		"tall-ears":
			P.append([11, 1, 1, 3, c]); P.append([14, 1, 1, 3, dark])
		"round-cheeks":
			P.append([14, 6, 2, 2, belly])
		"stone-crown":
			P.append([6, 2, 5, 2, dark]); P.append([7, 1, 3, 1, LAMP])
	match str(look.get("tail", "")):
		"fin":
			P.append([0, 7, 2, 2, accent])
		"tapered":
			P.append([0, 8, 2, 1, dark])
		"tassel":
			P.append([1, 9, 1, 2, LEAF])
		"stub":
			P.append([1, 9, 2, 1, dark])
		"plume":
			P.append([0, 5, 2, 3, accent]); P.append([0, 4, 1, 1, belly])
		"ribbon":
			P.append([0, 6, 1, 4, accent])
		"brush":
			P.append([0, 7, 3, 2, c])
	return P

## Pebblepaw's family: a slim cat with pointed ears, a long tail that curls up, stripes.
static func _cat(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var cr: int = pose.get("crouch", 0)
	var sit: bool = pose.get("sit", false)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 5 + cr
	var P: Array = []
	var legh := 12 - (by + 4)
	if not sit:
		P.append([5 + _lift(f, 1), by + 4, 1, legh - _lift(f, 1), c.darkened(0.25)])
	P.append([12 + _lift(f, 0), by + 4, 1, legh - _lift(f, 0), c.darkened(0.25)])
	# the tail: thin, rising and curling at the tip
	P.append([2, by, 2, 1, c]); P.append([1, by - 3 - wag, 1, 4 + wag, c]); P.append([1, by - 4 - wag, 2, 1, dark])
	if sit:
		P.append([3, by + 1, 7, 4, c]); P.append([4, 10, 4, 2, c])
	else:
		P.append([3, by, 9, 4, c])
	P.append([5, by + 3, 5, 1, belly]); P.append([4, by + 1, 2, 1, dark]); P.append([7, by + 1, 2, 1, dark])   # stripes
	if not sit:
		P.append([4 + _lift(f, 0), by + 4, 1, legh - _lift(f, 0), c])
	P.append([11 + _lift(f, 1), by + 4, 1, legh - _lift(f, 1), c])
	var hy := by - 4 + (2 if pose.get("sniff", false) else 0) + (1 if sit else 0)
	var up := 1 if pose.get("ears_up", false) else 0
	P.append([11, hy - 1 - up, 1, 2 + up, c]); P.append([14, hy - 1 - up, 1, 2 + up, c])
	P.append([11, hy, 5, 4, c]); P.append([12, hy + 2, 4, 2, belly]); P.append([16, hy + 2, 1, 1, dark])
	P.append([13, hy + 1, 1, 1, _eye(pose, c)]); P.append([15, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Gnawhound's family: a hyena, shoulders higher than the hips, a bristly mane, round ears and spots.
static func _hyena(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var cr: int = pose.get("crouch", 0)
	var sit: bool = pose.get("sit", false)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 4 + cr
	var P: Array = []
	if not sit:
		P.append([4 + _lift(f, 1), by + 6, 1, 12 - (by + 6) - _lift(f, 1), c.darkened(0.25)])
	P.append([12 + _lift(f, 0), by + 5, 1, 12 - (by + 5) - _lift(f, 0), c.darkened(0.25)])
	P.append([1, by + 2 - wag, 2, 2, dark])                                       # a short tufted tail
	P.append([3, by + 2 + (1 if sit else 0), 4, 4, c]); P.append([6, by, 6, 5, c])  # the sloping back
	P.append([7, by - 1, 5, 1, dark]); P.append([4, by + 3, 1, 1, dark]); P.append([7, by + 2, 1, 1, dark]); P.append([9, by + 3, 1, 1, dark])
	P.append([7, by + 4, 4, 1, belly])
	if not sit:
		P.append([3 + _lift(f, 0), by + 6, 1, 12 - (by + 6) - _lift(f, 0), c])
	P.append([11 + _lift(f, 1), by + 5, 1, 12 - (by + 5) - _lift(f, 1), c])
	var hy := by - 3 + (2 if pose.get("sniff", false) else 0)
	P.append([11, hy - 1, 2, 2, c]); P.append([11, hy - 1, 1, 1, dark])
	P.append([11, hy, 5, 4, c]); P.append([15, hy + 1, 2, 3, belly]); P.append([16, hy + 1, 1, 1, dark])
	P.append([14, hy + 3, 2, 1, Color("f4f0e0")])                                 # the grin
	P.append([13, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Bogsnap's family: a crocodile, long and low, a ridged back, a long jaw with a row of teeth.
static func _croc(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var cr: int = pose.get("crouch", 0)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var by := 7 + cr
	var P: Array = []
	var legh := 12 - (by + 3)
	P.append([5 + _lift(f, 1), by + 3, 1, legh - _lift(f, 1), c.darkened(0.25)]); P.append([10 + _lift(f, 0), by + 3, 1, legh - _lift(f, 0), c.darkened(0.25)])
	P.append([0, by + 1 - wag, 3, 2, c]); P.append([2, by, 3, 3, c])               # the heavy tail
	P.append([4, by - 1, 8, 4, c]); P.append([5, by + 2, 6, 1, belly])
	for i in 4:
		P.append([3 + i * 2, by - 2, 1, 1, c.darkened(0.3)])                       # ridges
	P.append([4 + _lift(f, 0), by + 3, 2, legh - _lift(f, 0), c]); P.append([9 + _lift(f, 1), by + 3, 2, legh - _lift(f, 1), c])
	var open := 1 if pose.get("ears_up", false) and wag == 1 else 0              # the jaw opens a little when it's excited
	P.append([11, by - 2, 3, 3, c]); P.append([14, by - 1, 3, 2, c]); P.append([14, by + 1 + open, 3, 1, c.darkened(0.1)])
	P.append([14, by + 1, 1, 1, Color("f4f0e0")]); P.append([16, by + 1, 1, 1, Color("f4f0e0")])
	P.append([12, by - 2, 1, 1, _eye(pose, c)])
	return P

## Galefoal's family: a horse, long legs, an arched neck, a flowing mane and tail.
static func _horse(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var dark: Color = look.dark
	var mane: Color = look.get("accent", c.lightened(0.3))
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var cr: int = pose.get("crouch", 0)
	var by := 3 + cr
	var P: Array = []
	var legh := 12 - (by + 4)
	P.append([4 + _lift(f, 1), by + 4, 1, legh - _lift(f, 1), c.darkened(0.25)]); P.append([11 + _lift(f, 0), by + 4, 1, legh - _lift(f, 0), c.darkened(0.25)])
	P.append([1, by + 1 - wag, 2, 5, mane])                                       # the tail
	P.append([3, by, 9, 4, c]); P.append([4, by + 3, 7, 1, c.lightened(0.15)])
	P.append([3 + _lift(f, 0), by + 4, 1, legh - _lift(f, 0), c]); P.append([10 + _lift(f, 1), by + 4, 1, legh - _lift(f, 1), c])
	P.append([3 + _lift(f, 0), 11 - _lift(f, 0), 1, 1, dark]); P.append([10 + _lift(f, 1), 11 - _lift(f, 1), 1, 1, dark])
	var hy := by - 4 + (3 if pose.get("sniff", false) else 0)
	P.append([11, hy + 1, 2, 4, c])                                               # the neck
	P.append([12, hy - 1, 3, 3, c]); P.append([14, hy, 3, 2, c]); P.append([16, hy + 1, 1, 1, dark])
	P.append([12, hy - 2, 1, 2, c]); P.append([10, hy - 1, 2, 5, mane])          # an ear and the mane
	P.append([13, hy, 1, 1, _eye(pose, c)])
	return P

## Glimmerwing's family: a bird, round body, a wing that flaps, tail feathers, a small beak.
static func _bird(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var dark: Color = look.dark
	var flap: int = pose.get("wag", 0)
	var f := _frame(pose)
	var by := 5 - (1 if flap == 1 else 0)
	var P: Array = []
	P.append([7 + (1 if f == 1 else 0), by + 5, 1, 12 - (by + 5), dark]); P.append([9 - (1 if f == 3 else 0), by + 5, 1, 12 - (by + 5), dark])
	P.append([2, by + 1, 3, 2, c.darkened(0.15)]); P.append([1, by, 2, 1, c.darkened(0.15)])   # tail feathers
	P.append([4, by, 7, 5, c]); P.append([6, by + 3, 4, 2, belly])
	match flap:
		1: P.append([5, by - 4, 4, 4, c.lightened(0.15)]); P.append([5, by - 4, 2, 1, c.lightened(0.35)])
		-1: P.append([5, by + 2, 5, 2, c.darkened(0.1)])
		_: P.append([5, by + 1, 5, 2, c.lightened(0.1)])
	var hy := by - 3 + (2 if pose.get("sniff", false) else 0)
	P.append([10, hy, 4, 4, c]); P.append([14, hy + 2, 2, 1, Color("f2b04a")])
	if pose.get("ears_up", false):
		P.append([11, hy - 2, 1, 2, c.lightened(0.2)])                              # a crest
	P.append([12, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Duskweaver's family: a spider, a round body behind a small head, eight legs that bend up at the knee and splay out
## (the front pairs reaching forward, the back pairs back), rippling as it walks; a cluster of red eyes.
static func _spider(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var dark: Color = look.dark
	var f := _frame(pose)
	var cr: int = pose.get("crouch", 0)
	var by := 6 + cr
	var P: Array = []
	for side in 2:                                                                # far legs first, then near ones over the body
		var col := dark if side == 0 else dark.lightened(0.2)
		for i in 4:
			var dir := -1 if i < 2 else 1
			var kx := 4 + i * 3 + (1 if side == 1 else 0)
			var st := 1 if (f + i + side) % 2 == 1 else 0
			if side == 1:                                                        # near legs: from under the body, down and out
				P.append([kx, by + 4, 1, 1, col, false]); P.append([kx + dir * (1 + st), by + 5, 1, 7 - by, col, false])
				continue
			var top := by - 2 - (1 if i in [1, 2] else 0)
			P.append([kx, top, 1, by + 1 - top, col, false])                      # up from the body to the knee
			P.append([kx + dir, top, 1, 1, col, false])                           # over the knee
			P.append([kx + dir * 2, top + 1, 1, 2, col, false])                   # down and out
			P.append([kx + dir * (3 + st), top + 3, 1, 12 - (top + 3), col, false])   # to the ground
		if side == 0:
			P.append([2, by, 7, 4, c]); P.append([3, by + 1, 3, 1, c.lightened(0.2)]); P.append([5, by + 2, 2, 1, look.get("accent", dark)])
			P.append([9, by + 1, 4, 3, c])
	var e := Color("e84a5a") if not pose.get("blink", false) else c.darkened(0.3)
	P.append([11, by + 2, 1, 1, e]); P.append([12, by + 1, 1, 1, e]); P.append([12, by + 3, 1, 1, e])
	return P

## Sunspark's family: a sprite, a little floating light with fluttering wings, bobbing, no feet on the ground.
static func _sprite(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var glow := c.lightened(0.5)
	var flap: int = pose.get("wag", 0)
	var by := 3 - flap
	var P: Array = []
	var lift := 1 if flap == 1 else 0
	P.append([4, by + 1 - lift, 3, 3 + lift, glow]); P.append([11, by + 1 - lift, 3, 3 + lift, glow])   # wings
	P.append([6, by, 6, 6, c]); P.append([7, by + 1, 4, 4, glow]); P.append([8, by + 2, 2, 2, Color("ffffff")])
	P.append([8, by + 7, 2, 1, c.lightened(0.2)]); P.append([9, by + 9, 1, 1, c.lightened(0.3)])   # a trail of light
	var e := Color("3a3020") if not pose.get("blink", false) else glow
	P.append([8, by + 2, 1, 1, e]); P.append([10, by + 2, 1, 1, e])
	return P

## Tidewyrm's shape: a serpent, a long body that ripples along the ground as it moves, its head held up on a neck,
## a fin down its back and a frill that lifts when it's alert.
static func _serpent(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var belly: Color = look.belly
	var fin: Color = look.get("accent", look.dark)
	var ripple := _frame(pose) % 2
	var P: Array = []
	var heights := [1, 2, 2, 3, 3, 3]
	for i in 6:                                                                   # tail tip to neck, rising and falling
		var h: int = heights[i]
		var top: int = 12 - h - (1 if (i + ripple) % 2 == 0 else 0)
		P.append([i * 2, top, 3, h, c])
		if i >= 2:
			P.append([i * 2 + 1, top - 1, 1, 1, fin])
	P.append([3, 11, 8, 1, belly])
	var hy := 2 + (2 if pose.get("sniff", false) else 0)
	P.append([11, hy + 3, 3, 10 - (hy + 3), c]); P.append([12, hy + 4, 1, 10 - (hy + 4), belly])   # the neck
	if pose.get("ears_up", false):
		P.append([9, hy - 1, 2, 3, fin])                                          # the frill
	P.append([11, hy, 6, 4, c]); P.append([12, hy + 3, 5, 1, belly])
	P.append([14, hy + 1, 1, 1, _eye(pose, c)]); P.append([16, hy + 1, 1, 1, look.dark])
	if pose.get("sniff", false):
		P.append([17, hy + 2, 1, 1, Color("e05a6a")])                             # tasting the air
	return P

## Bogbough's shape: a turtle, a high domed shell with plates in its accent colour, a head that peeks out (and
## tucks in to sniff), short stout legs.
static func _turtle(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var shell: Color = c.darkened(0.25)
	var plate: Color = look.get("accent", c.lightened(0.2))
	var f := _frame(pose)
	var P: Array = []
	P.append([4 + _lift(f, 1), 10, 2, 2 - _lift(f, 1), c.darkened(0.25)]); P.append([11 + _lift(f, 0), 10, 2, 2 - _lift(f, 0), c.darkened(0.25)])
	P.append([1, 9, 2, 1, c])                                                     # a stub of a tail
	P.append([3, 4, 11, 6, shell]); P.append([5, 3, 7, 1, shell])
	P.append([5, 5, 2, 2, plate]); P.append([8, 4, 2, 2, plate]); P.append([11, 5, 2, 2, plate]); P.append([7, 7, 2, 1, plate])
	P.append([3, 9, 11, 1, look.belly])                                           # the rim of the shell
	P.append([5 + _lift(f, 0), 10, 2, 2 - _lift(f, 0), c]); P.append([12 + _lift(f, 1), 10, 2, 2 - _lift(f, 1), c])
	var hy := 6 + (1 if pose.get("sniff", false) else 0)
	P.append([13, hy + 1, 2, 2, c]); P.append([14, hy, 3, 3, c]); P.append([15, hy + 2, 2, 1, look.belly])
	P.append([15, hy + 1, 1, 1, _eye(pose, c)])
	return P

## Veilmote's shape: a moth, broad patterned wings that beat slowly, a soft body, feathered antennae, floating a
## little above the ground with a drift of pale dust under it.
static func _moth(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var body: Color = c.darkened(0.4)
	var edge: Color = c.lightened(0.3)
	var spot: Color = look.get("accent", c.lightened(0.4))
	var flap: int = pose.get("wag", 0)
	var by := 2 + (1 if flap == -1 else 0)
	var P: Array = []
	P.append([4, by + 6, 4, 2, c.darkened(0.15)])                                 # the hind wing
	var rows: Array
	match flap:
		1: rows = [[7, -3, 3], [6, -2, 5], [5, -1, 6], [5, 0, 7], [6, 1, 6], [6, 2, 6], [7, 3, 5]]      # raised
		-1: rows = [[5, 7, 7], [5, 8, 6], [6, 9, 4]]                                                  # swept down
		_: rows = [[4, 1, 5], [3, 2, 7], [2, 3, 9], [3, 4, 8]]                                         # spread
	for r in rows:
		P.append([r[0], by + r[1], r[2], 1, c])
	var top: Array = rows[0]
	P.append([top[0], by + top[1], top[2], 1, edge])                               # a pale leading edge
	var mid: Array = rows[rows.size() / 2]
	P.append([mid[0] + 1, by + mid[1], 2, 1, spot])                                # the eye-spot
	P.append([6, by + 5, 7, 2, body]); P.append([7, by + 6, 1, 1, c]); P.append([9, by + 6, 1, 1, c])   # a banded body
	P.append([13, by + 4, 2, 2, body])
	P.append([15, by + 2, 1, 2, look.dark, false]); P.append([16, by + 1, 1, 1, look.dark, false])     # antennae
	P.append([14, by + 4, 1, 1, Color("e8e0c8") if not pose.get("blink", false) else body])
	P.append([9, by + 9, 1, 1, spot.lightened(0.3)]); P.append([7, by + 10, 1, 1, spot.lightened(0.4)])   # a drift of dust
	return P

## Orchardroot's shape: tree-folk, a short trunk on root feet with a leafy crown, branch arms that sway, a kind face
## in the bark.
static func _treefolk(pose: Dictionary, look: Dictionary) -> Array:
	var c: Color = look.body
	var bark: Color = c.darkened(0.45)
	var leaves: Color = look.get("accent", c)
	var f := _frame(pose)
	var wag: int = pose.get("wag", 0)
	var P: Array = []
	P.append([5 + _lift(f, 1), 10, 2, 2 - _lift(f, 1), bark.darkened(0.3)]); P.append([10 + _lift(f, 0), 10, 2, 2 - _lift(f, 0), bark.darkened(0.3)])
	P.append([5, 4, 7, 7, bark]); P.append([6, 9, 5, 1, bark.darkened(0.2)]); P.append([7, 5, 1, 3, bark.lightened(0.15)])
	P.append([3, 6 - maxi(0, wag), 2, 1, bark]); P.append([2, 5 - maxi(0, wag), 1, 2, leaves])     # branch arms
	P.append([12, 6 + mini(0, wag), 2, 1, bark]); P.append([14, 5 + mini(0, wag), 1, 2, leaves])
	var cy := 0 + (1 if pose.get("sniff", false) else 0)
	P.append([3, cy, 11, 4, leaves]); P.append([2, cy + 1, 13, 2, leaves]); P.append([5, cy, 3, 1, leaves.lightened(0.2)])
	P.append([10, cy + 1, 2, 1, leaves.lightened(0.15)])
	P.append([8, 6, 1, 1, _eye(pose, bark)]); P.append([10, 6, 1, 1, _eye(pose, bark)]); P.append([9, 8, 1, 1, bark.darkened(0.4)])
	return P
