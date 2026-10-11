extends Node2D
## Starfall: the guild's frontier town (first slice of docs/plans/starfall-village.md). You are the guildmaster.
## Walk the town (arrows or WASD, or click and tap to walk; Enter, Space or E to talk and use things). Pin bounties to
## the guild board; your adventurers choose for themselves, head out through the east gate, and come home with loot
## and bruises. Serve them a hot meal at the inn's counter yourself, until Bryn offers to take the counter over.
## Hurt adventurers rest at the inn until they're well. Nobody dies here; a bad job means a long rest.

const Figures := preload("res://scripts/figures.gd")
const SafeSave := preload("res://scripts/safe_save.gd")
const TILE := 16
const F_GROUND := preload("res://assets/env/frontier/ground.png")       # ART-SF-1 .. 5, see assets/env/frontier/*.md
const F_PALISADE := preload("res://assets/env/frontier/palisade.png")
const F_TOWER := [preload("res://assets/env/frontier/watchtower-unlit.png"), preload("res://assets/env/frontier/watchtower-lit.png")]
const F_PINES := preload("res://assets/env/frontier/pines.png")
const F_HALL := [preload("res://assets/env/frontier/guild_hall.png"), preload("res://assets/env/frontier/guild_hall-lit.png")]
const F_INN := [preload("res://assets/env/frontier/inn.png"), preload("res://assets/env/frontier/inn-lit.png")]
const F_WELL := preload("res://assets/env/frontier/well.png")
const F_BOARD := preload("res://assets/env/frontier/board.png")
const F_GATE := preload("res://assets/env/frontier/gate-west.png")     # ART-SF-7: the gate seen side-on, for the west wall
## (ART-SF-7: the smithy and tavern drawn two tiles wide to fit a plot; the 4-wide smithy.png and tavern.png stay unused)
const F_BUILT := { "smithy": preload("res://assets/env/frontier/smithy-2.png"), "tavern": preload("res://assets/env/frontier/tavern-2.png"),
	"apothecary": preload("res://assets/env/frontier/apothecary.png"), "healer": preload("res://assets/env/frontier/healer.png"),
	"yard": preload("res://assets/env/frontier/yard.png") }
## How many tiles wide each finished building stands (its art's footprint); all are two tiles deep on their plot except
## the training yard, whose fenced picture is three deep: its top row is the row above the plot, and it blocks that too.
const BUILT_H := { "yard": 3 }
const BUILT_W := { "smithy": 2, "tavern": 2, "apothecary": 2, "healer": 3, "yard": 4 }
## palisade.png pieces by which neighbours they join (north 1, east 2, south 4, west 8): rects from stockade.json
const PALISADE := { 10: Rect2(0, 0, 16, 32), 5: Rect2(16, 0, 16, 32), 3: Rect2(32, 0, 16, 32), 6: Rect2(48, 0, 16, 32),
	12: Rect2(0, 32, 16, 32), 9: Rect2(16, 32, 16, 32), 2: Rect2(32, 32, 16, 32), 8: Rect2(48, 32, 16, 32),
	1: Rect2(0, 64, 16, 32), 4: Rect2(16, 64, 16, 32), 0: Rect2(32, 64, 16, 32) }
const HALL_GLASS := [Vector2(15, 56), Vector2(29, 56), Vector2(61, 56), Vector2(75, 56)]   # glass_rects in hall-inn.json
const INN_GLASS := [Vector2(11, 36), Vector2(29, 36), Vector2(47, 36), Vector2(11, 60), Vector2(45, 60)]
const PINE_48 := Rect2(64, 0, 32, 48)
const PINE_32 := Rect2(32, 16, 24, 32)
const STUMP := Rect2(16, 64, 16, 16)
const FERN := Rect2(32, 64, 16, 16)

# the town (SF2.6, a frontier stockade, drawn with the ART-SF pieces in assets/env/frontier): T the pine forest outside,
# P the palisade, S stakes where the wall will go next, G the gate's posts and E the way through them (west wall), . the mud road, q the packed-earth
# square, , moss, k ferns, u stumps, r roof and # wall (a building's footprint), D door, c the inn's counter, B the guild
# board, W the well, w the watchtower. The map is wider and taller than the screen; the camera follows you (it scrolls).
const MAP := [
	"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
	"TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSTT",
	"TP,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TP,,,,k,,rrrrrr,u,,,,,,,,,,,,u,,,,,,k,,,,STT",
	"TP,,,,,,,rrrrrr,,,rrrr,,,,,,,,,,,,,,,,u,,STT",
	"TP,,,,,,,###D##,,,rrrr,,,,,,,,,,,,,,,,,,,STT",
	"TP,ww,,qqqqqqqqqq,##D#,,,,,,,,,,,,,,,,,,,STT",
	"TP,ww,,BBqqqqqqqq,,,.,,,,,,,,,,,,,,,,k,,,STT",
	"TG,,,,,qqqqqqqqqq,,c.,,,,,,,,,,,,,,,,,,,,STT",
	"TE.......................................STT",
	"TG,,,,,qqqqqqqqqq,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TP,,,,,qqqqqqqqqq,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TP,,,,,qqqqWWqqqq,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TP,k,u,qqqqqqqqqq,,,,,k,,,,,,,k,,,,,,,,u,STT",
	"TP,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TP,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,STT",
	"TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPSTT",
	"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
]
const SOLID := "TPSGrc#BDWwu"
const INN_DOOR := Vector2i(20, 6)
const HALL_DOOR := Vector2i(12, 5)
const COUNTER := Vector2i(19, 8)
const SERVE_AT := Vector2i(18, 8)          # behind the counter
const ORDER_AT := Vector2i(20, 8)          # where a hungry adventurer waits
const BOARD := Vector2i(7, 7)
const READ_AT := Vector2i(7, 8)           # in front of the board
const GATE := Vector2i(1, 9)
const GATE_IN := Vector2i(2, 9)           # just inside the gate, where people come and go
const INN_STEP := Vector2i(20, 7)          # the inn's doorstep
const BRYN_HOME := Vector2i(22, 7)
const TOWN_AREA := Rect2i(13, 11, 8, 2)    # where adventurers potter about between jobs
const DAY_SECONDS := 150.0
const MEAL := 8
const WAGE := 10
const HIRE_AFTER := 10                     # meals you serve yourself before Bryn offers to take over
const PATIENCE := 22.0                     # how long a hungry adventurer waits at the counter
const MAX_POSTED := 2
## Cleared plots (p on the map, 2x2) where the town can grow; each keeps its anchor (top left) tile.
## (SF2.6: the plots keep their names, so old saves keep their buildings; they now line the road east of the inn.)
const PLOTS := { "west": Vector2i(24, 6), "east": Vector2i(32, 6), "north": Vector2i(24, 12), "south": Vector2i(32, 12) }
const PLOT_RANK := { "west": 0, "east": 0, "north": 1, "south": 2 }   # Hob stakes out more ground as the town grows
## What can stand on a plot. Each does one clear thing for your adventurers.
const BUILDINGS := {
	"healer": { "name": "The Healer's Hut", "cost": 120, "time": 20.0,
		"text": "Hurt adventurers go straight to Ama for treatment, and mend twice as fast as in bed at the inn." },
	"yard": { "name": "A Training Yard", "cost": 150, "time": 25.0,
		"text": "Posts and straw dummies. Adventurers with nothing to do practise here and slowly grow stronger." },
	"smithy": { "name": "The Smithy", "cost": 140, "time": 22.0,
		"text": "A forge and an anvil. Adventurers bring their savings for better gear, and you work the hammer." },
	"tavern": { "name": "The Tavern", "cost": 130, "time": 20.0,
		"text": "A taproom for the evenings. Adventurers spend a little of their savings on a drink and go to bed in better spirits. You pour." },
	"apothecary": { "name": "The Apothecary", "cost": 110, "time": 18.0,
		"text": "Herbs from the jobs become tonics. A tonic before a hard job means coming home less hurt. You set the price." },
}
## The town's rank grows with what you've built and the jobs your guild has done. Each new rank brings someone new.
const RANKS := [
	{ "name": "Hamlet", "built": 0, "jobs": 0 },
	{ "name": "Village", "built": 1, "jobs": 6 },
	{ "name": "Town", "built": 2, "jobs": 16 },
	{ "name": "Market Town", "built": 4, "jobs": 30 },
]
const NEWCOMERS := [["Kaito", "archer", 1], ["Hana", "knight", 2], ["Sora", "monk", 3]]
## Rarer adventurers who only come once Starfall has a good name (three good days in a row), one each time.
const VISITORS := [["Mirelle", "mage", 4, "bold", "I heard Starfall pays fairly and feeds its people. A wandering mage could do worse."],
	["Tobin", "thief", 4, "mapper", "Three good days running, they say in the next valley. I came to see for myself. I know every back road."]]
## What makes a day good or hard (shown in the evening report).
const GOOD_DAY := { "done": 2 }
## The smithy: what each better set of gear costs an adventurer (from their own savings), and the forge's hot spot.
const GEAR_COST := [40, 80, 130]
const GEAR_WORD := ["plain kit", "good gear", "fine gear", "masterwork gear"]
const HOT := Vector2(0.4, 0.6)             # strike while the marker is in the glow
const SMITH_AFTER := 5                     # pieces you forge yourself before Garrick asks for the work
const SMITH_WAGE := 12
## The apothecary: tonics brewed from the herbs adventurers bring home, sold from the shelf at the price you set.
const PRICES := [6, 12, 20]
const PRICE_WORD := ["Cheap", "Fair", "Dear"]
const TONIC_MAX := 6
const HERB_JOBS := ["slimes", "boar", "webs", "wolves"]

## Classes from the browser Starfall Guild (games/starfall-guild/js/00-data.js).
const CLASSES := {
	"swordsman": { "name": "Swordsman", "atk": 10, "hp": 60, "col": "3a6fd8" },
	"knight": { "name": "Knight", "atk": 6, "hp": 115, "col": "6b7a90" },
	"mage": { "name": "Mage", "atk": 17, "hp": 34, "col": "8b5cf6" },
	"archer": { "name": "Archer", "atk": 12, "hp": 44, "col": "3fa66b" },
	"cleric": { "name": "Cleric", "atk": 4, "hp": 52, "col": "d9a21b" },
	"thief": { "name": "Thief", "atk": 8, "hp": 46, "col": "c2412f" },
	"monk": { "name": "Monk", "atk": 11, "hp": 72, "col": "e07a2e" },
}
const HAIR := ["ff8fb1", "5b8def", "d8dde6", "e0483e", "2b2b3a", "f7d046", "59c38a", "9b6bd6", "f08a3c", "7a4a2a"]
## Jobs townsfolk bring to the guild. danger 1-4; time is how long the trip takes (seconds of game time).
const JOBS := [
	{ "id": "slimes", "name": "Slimes in the Creek", "danger": 1, "reward": 30, "time": 18.0,
		"text": "The miller's ducks won't go near the creek. Something wobbly lives there now." },
	{ "id": "boar", "name": "A Bad-Tempered Boar", "danger": 1, "reward": 26, "time": 16.0,
		"text": "It has eaten half the turnips and chased the farmer up a tree." },
	{ "id": "wolves", "name": "Wolves on the North Road", "danger": 2, "reward": 55, "time": 26.0,
		"text": "Carters say a pack follows the wagons at dusk, closer every night." },
	{ "id": "webs", "name": "Webs Over the Forest Path", "danger": 2, "reward": 60, "time": 26.0,
		"text": "The woodcutters' path is strung with webs as thick as rope." },
	{ "id": "bandits", "name": "A Bandits' Hideout", "danger": 3, "reward": 95, "time": 34.0,
		"text": "Someone has been raiding the farms. The tracks lead into the old quarry." },
	{ "id": "barrow", "name": "Lights in the Old Barrow", "danger": 4, "reward": 140, "time": 42.0,
		"text": "Lantern light where no one should be, and a cold wind from the hill." },
]
const DANGER_WORD := ["", "Easy", "Risky", "Dangerous", "Deadly"]

class Mover:
	var id := ""
	var where := "town"                    # town, inside (resting at the inn), away (out on a job)
	var tile := Vector2i.ZERO
	var pos := Vector2.ZERO
	var path: Array[Vector2i] = []
	var speed := 3.5
	var face := Vector2i.DOWN
	var step_t := 0.0
	var look: Dictionary = {}
	var a: Dictionary = {}                  # adventurers: name, cls, lvl, xp, hp, max, morale, state, job, timer
	func _init(i: String, t: Vector2i) -> void:
		id = i
		tile = t
		pos = Vector2(t) * 16.0

var me := Mover.new("me", Vector2i(14, 10))
var bryn := Mover.new("bryn", BRYN_HOME)
var heroes: Array[Mover] = []
var coins := 100
var day := 1
var day_t := 0.0
var meals := 0                              # served by hand, all time
var hired := false
var bryn_offered := false
var notices: Array = []                     # today's job notices on the board (ids)
var posted: Array = []                      # notices you've pinned up for the adventurers (ids)
var today := { "done": 0, "failed": 0, "meals": 0, "earned": 0 }
var queue: Array[Mover] = []                # hungry adventurers waiting at the counter, first in front
var serve_t := 0.0                          # Bryn's serving time for the customer in front
var lines: Array = []                       # conversation: [{who, text}]
var barks: Array = []                       # short things people say as they pass: [{m, text, t}]
var feels: Array = []                       # a feeling shown in a bubble over someone's head for a moment: [{m, id, t}]
var then_do := Callable()
var walk_to: Array[Vector2i] = []
var use_after := ""                         # walking somewhere you tapped, to use it on arrival: board, counter
var rng := RandomNumberGenerator.new()
var t := 0.0
var no_save := false
var save_path := "user://starfall.json"
var save_t := 0.0
var board_open := false
var board_sel := 0
var built := {}                             # plot -> { what, left: seconds of building left (0 when finished) }
var build_plot := ""                        # the plot whose building plan is open ("" when closed)
var total_jobs := 0                         # jobs the guild has finished, all time
var rank := 0
var ama := Mover.new("ama", Vector2i(-5, -5))   # the healer, once her hut stands
var garrick := Mover.new("garrick", Vector2i(-5, -5))   # a smith who wants the forge, once you've proved it's worth having
var smith_hired := false
var pieces := 0                             # gear you've forged by hand, all time
var smith_customer: Mover = null            # the adventurer waiting at the smithy
var forge := {}                             # while you're at the anvil: { n: strikes, hits, x: 0..1, dir }
var smith_t := 0.0                          # Garrick's work on the piece in front of him
var herbs := 0                              # brought home from the jobs, for the apothecary
var stock := 0                              # tonics on the shelf
var price_i := 1                            # Cheap, Fair or Dear
var shelf_open := false
var brewing := 0.0                          # seconds of stirring left at the pot
var tamsin := Mover.new("tamsin", Vector2i(-5, -5))   # a barkeep who wants the tavern, once you've shown it's worth running
var tamsin_hired := false
var fen := Mover.new("fen", Vector2i(-5, -5))   # the apothecary's apprentice (SF2.5), once you've brewed enough yourself
var fen_hired := false
var batches := 0                            # batches you've brewed by hand, all time
var fen_t := 0.0                            # Fen's stirring on the batch in the pot
var pours := 0                              # drinks you've poured by hand, all time
var pour := {}                              # while you're at the tap: { fill: 0..1, on: pouring }
var tavern_shut := false                    # left unserved two evenings running, the tavern closes until you open it
var tavern_quiet := 0                       # evenings in a row nobody was served
var good_days := 0                          # good days in a row (SF2.2): bunting, a busier board, word travels
var bad_days := 0                           # hard days in a row: a quieter board
var visitors: Array = []                    # the travelling adventurers who have come because of the town's name

var cam: Camera2D
var ui: CanvasLayer
var status: Label
var caption: Label
var caption_t := 0.0
var bubble: PanelContainer
var bubble_text: Label
var board_view: Control

const LOOKS := {
	"me": { "skin": "e8b48a", "hair": "3a2a22", "shirt": "2f5e78", "legs": "3a3040", "style": "short" },
	"bryn": { "skin": "f1c9a0", "hair": "b8642e", "shirt": "e8e0d0", "apron": "7a5236", "legs": "5a4636", "style": "ponytail", "body": "narrow" },
	"fen": { "skin": "e8c0a0", "hair": "59c38a", "shirt": "5a7a4a", "apron": "c8b890", "legs": "4a3a2a", "style": "short", "body": "narrow" },
	"tamsin": { "skin": "c8946a", "hair": "2b2b3a", "shirt": "8a3a3a", "apron": "e8e0d0", "legs": "3a3040", "style": "short" },
}

func _ready() -> void:
	_load_stories()
	rng.randomize()
	ama.where = "gone"
	ama.look = { "skin": "c88a64", "hair": "f2f0ec", "shirt": "5d9a3e", "apron": "f4f0e8", "legs": "3e5a34", "style": "bun", "body": "narrow" }
	garrick.where = "gone"
	tamsin.where = "gone"
	fen.where = "gone"
	garrick.look = { "skin": "b87a54", "hair": "3a2a22", "shirt": "8a3a2a", "apron": "4a3a30", "legs": "3a3040", "style": "short" }
	if "--no-save" in OS.get_cmdline_user_args():
		no_save = true                           # recordings and tries never touch the real town (-- --no-save)
	cam = Camera2D.new()
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = MAP[0].length() * TILE
	cam.limit_bottom = MAP.size() * TILE
	cam.position_smoothing_enabled = true
	add_child(cam)
	sfx = Sfx.new()
	add_child(sfx)
	_make_ui()
	if not _load():
		_new_town()
	if "--built" in OS.get_cmdline_user_args():       # to see the town grown: -- --no-save --built
		built = { "west": { "what": "healer", "left": 0.0 }, "east": { "what": "yard", "left": 8.0 } }
		_place_ama()
		lines.clear()
	if "--tavern" in OS.get_cmdline_user_args():      # the tavern standing by the inn, in the evening (-- --no-save --built --tavern)
		built["north"] = { "what": "tavern", "left": 0.0 }
		rank = maxi(rank, 1)
		day_t = DAY_SECONDS * 0.7
	if "--goodrun" in OS.get_cmdline_user_args():     # a town on a good run: bunting over the street (-- --no-save --built --goodrun)
		good_days = 2
	if "--story" in OS.get_cmdline_user_args():       # Ren wants a word, and you're mid-conversation: -- --no-save --story
		for h in heroes:
			if h.a.name == "Ren":
				h.a.jobs_done = 2
				h.a.morale = 6
			if h.a.name == "Yuna":
				h.a.jobs_done = 2
				h.a.morale = 6
		lines.clear()
		var ren: Mover = heroes[1]
		(func():
			me.tile = ren.tile + Vector2i.DOWN
			me.pos = Vector2(me.tile) * TILE
			story_pick = { "h": ren, "opts": stories.Ren[0].options }).call_deferred()
	if "--market" in OS.get_cmdline_user_args():      # the grown town, smithy and apothecary: -- --no-save --market
		rank = 2
		built = { "west": { "what": "healer", "left": 0.0 }, "east": { "what": "yard", "left": 0.0 },
			"north": { "what": "smithy", "left": 0.0 }, "south": { "what": "apothecary", "left": 0.0 } }
		herbs = 4
		stock = 3
		_place_ama()
		me.tile = forge_at() + Vector2i(1, 1)
		me.pos = Vector2(me.tile) * TILE
		lines.clear()
	cam.position = me.pos + Vector2(8, 8)
	cam.reset_smoothing()

func _new_town() -> void:
	heroes.clear()
	var starts := [["Aki", "swordsman", 2], ["Ren", "mage", 1], ["Yuna", "cleric", 1]]
	for i in starts.size():
		var s: Array = starts[i]
		var m := Mover.new("hero%d" % i, TOWN_AREA.position + Vector2i(i * 3 + 1, i % 2))
		var c: Dictionary = CLASSES[s[1]]
		var mx := int(c.hp * (1.0 + 0.2 * (s[2] - 1)))
		m.a = { "name": s[0], "cls": s[1], "lvl": s[2], "xp": 0, "hp": mx, "max": mx, "morale": 6, "state": "town", "job": "", "timer": 2.0 + i * 3.0, "hair": HAIR[(i * 4 + 1) % HAIR.size()], "purse": 20, "gear": 0, "fine": false, "tonic": false, "beat": 0, "jobs_done": 0, "traits": [], "asked": false }
		_dress(m)
		heroes.append(m)
	_new_notices()
	say("", "Starfall: the Guild Hall, the Lantern Inn and a gate to the wilds. The town is small. It's yours to grow.")
	say("bryn", "Morning, guildmaster! The board's full of requests from the farms. Pin one up and your adventurers will pick it.")
	say("bryn", "And when they come back hungry, the counter outside the inn is yours. Nobody else in this town can cook.")

func _dress(m: Mover) -> void:
	var c: Dictionary = CLASSES[m.a.cls]
	var styles := ["short", "long", "ponytail", "spiky", "bun"]
	m.look = { "skin": ["f1c9a0", "e8b48a", "c88a64", "8a5a3e"][m.a.name.length() % 4], "hair": m.a.hair, "shirt": c.col,
		"legs": Color(c.col).darkened(0.45).to_html(false), "style": styles[m.a.name.length() % styles.size()] }

func _new_notices() -> void:
	var ids: Array = JOBS.map(func(j): return j.id)
	ids.shuffle()
	notices = ids.slice(0, clampi(3 + (1 if good_days >= 2 else 0) - (1 if bad_days >= 2 else 0), 2, 4))
	posted = posted.filter(func(p): return p in notices)

# ---------------------------------------------------------------- the map
func tile_at(p: Vector2i) -> String:
	if p.y < 0 or p.y >= MAP.size() or p.x < 0 or p.x >= MAP[0].length():
		return "T"
	return MAP[p.y][p.x]

## Whether a tile blocks the way: trees, walls, the counter and the board, and any building on a plot.
func solid(p: Vector2i) -> bool:
	if tile_at(p) in SOLID:
		return true
	if (plot_at(p) != "" and built.has(plot_at(p))) or _prop_at(p) != "":
		return true
	for k in built:                              # a finished building stands on its art's full footprint (SF2.6)
		if _plot_done(k) and PLOTS.has(k) and built_rect(k).has_point(p):
			return true
	return false

## The ground a finished building stands on: its art's footprint, bottom-left on the plot's bottom-left.
func built_rect(k: String) -> Rect2i:
	var w := int(BUILT_W.get(built[k].what, 2))
	var h := int(BUILT_H.get(built[k].what, 2))
	return Rect2i(PLOTS[k] + Vector2i(0, 2 - h), Vector2i(w, h))

## The plot a tile belongs to ("" if none).
func plot_at(p: Vector2i) -> String:
	for k in PLOTS:
		if int(PLOT_RANK[k]) <= rank and Rect2i(PLOTS[k], Vector2i(2, 2)).has_point(p):
			return k
	return ""

func walkable(p: Vector2i, who: Mover = null) -> bool:
	if solid(p):
		return false
	for m in people():
		if m != who and m.where == "town" and (m.tile == p or (not m.path.is_empty() and m.path[0] == p)):
			return false
	return true

func people() -> Array[Mover]:
	var out: Array[Mover] = [me, bryn, ama, garrick, tamsin, fen]
	out.append_array(heroes)
	return out

## Shortest walk on the grid; people in the way are walked around unless they're the goal.
func route(from: Vector2i, to: Vector2i, who: Mover = null) -> Array[Vector2i]:
	var prev := { from: from }
	var q: Array[Vector2i] = [from]
	while not q.is_empty():
		var c: Vector2i = q.pop_front()
		if c == to:
			break
		for d in [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
			var n: Vector2i = c + d
			if prev.has(n) or solid(n):
				continue
			if n != to and _standing(n, who):
				continue
			prev[n] = c
			q.append(n)
	var out: Array[Vector2i] = []
	if not prev.has(to):
		return out
	var c2: Vector2i = to
	while c2 != from:
		out.push_front(c2)
		c2 = prev[c2]
	return out

func _standing(p: Vector2i, who: Mover) -> bool:
	for m in people():
		if m != who and m.where == "town" and m.tile == p and m.path.is_empty():
			return true                              # (you included: people walk around the guildmaster)
	return false

func send(m: Mover, to: Vector2i) -> bool:
	m.path = route(m.tile, to, m)
	return not m.path.is_empty() or m.tile == to

# ---------------------------------------------------------------- the loop
func _process(dt: float) -> void:
	t += dt
	_music_tick(dt)
	_day(dt)
	_player(dt)
	for h in heroes:
		_hero(h, dt)
	_bryn(dt)
	_garrick(dt)
	_counter(dt)
	_forge_tick(dt)
	_pour_tick(dt)
	_fen_tick(dt)
	_brew(dt)
	_construction(dt)
	for m in people():
		_walk(m, dt)
	for b in barks:
		b.t -= dt
	barks = barks.filter(func(b): return b.t > 0.0)
	for f in feels:
		f.t -= dt
	feels = feels.filter(func(f): return f.t > 0.0)
	caption_t = maxf(0.0, caption_t - dt)
	_autosave(dt)
	_update_ui()
	cam.position = me.pos + Vector2(8, 8)
	queue_redraw()

func _walk(m: Mover, dt: float) -> void:
	if m.path.is_empty() or m.where != "town":
		return
	var nxt: Vector2i = m.path[0]
	if m != me and _blocked_by_other(nxt, m):
		m.path.clear()                           # someone's in the way: stop, and find another way in a moment
		return
	var goal := Vector2(nxt) * TILE
	m.face = nxt - m.tile
	m.pos = m.pos.move_toward(goal, dt * m.speed * TILE)
	m.step_t += dt
	if m.pos.distance_to(goal) < 0.01:
		m.tile = nxt
		m.path.pop_front()
		if m == me:
			_arrived()

func _blocked_by_other(p: Vector2i, who: Mover) -> bool:
	for m in people():
		if m != who and m.where == "town" and m.tile == p and m.path.is_empty():
			return true
	return false

# ---------------------------------------------------------------- you
func _player(_dt: float) -> void:
	if board_open or shelf_open or not forge.is_empty() or brewing > 0.0 or build_plot != "" or not lines.is_empty() or not me.path.is_empty() or me.pos.distance_to(Vector2(me.tile) * TILE) > 0.5:
		return
	var d := Vector2i.ZERO
	if Input.is_action_pressed("ui_up") or Input.is_physical_key_pressed(KEY_W): d = Vector2i.UP
	elif Input.is_action_pressed("ui_down") or Input.is_physical_key_pressed(KEY_S): d = Vector2i.DOWN
	elif Input.is_action_pressed("ui_left") or Input.is_physical_key_pressed(KEY_A): d = Vector2i.LEFT
	elif Input.is_action_pressed("ui_right") or Input.is_physical_key_pressed(KEY_D): d = Vector2i.RIGHT
	if d != Vector2i.ZERO:
		walk_to.clear()
		use_after = ""
		step(d)
	elif not walk_to.is_empty():
		var nxt: Vector2i = walk_to.pop_front()
		if walkable(nxt, me):
			step(nxt - me.tile)
		else:
			walk_to.clear()

func step(d: Vector2i) -> void:
	me.face = d
	var to := me.tile + d
	if to == GATE or tile_at(to) == "E":
		say("", "The wilds start past the gate. Your adventurers go out there; a guildmaster's place is in town.")
		return
	if to == INN_DOOR:
		say("", "The Lantern Inn. Your adventurers sleep upstairs when they're hurt or tired. The counter outside is yours to run.")
		return
	if to == HALL_DOOR:
		say("", "The Guild Hall. The carpenters are still fixing the roof; the board outside is where the work is.")
		return
	if walkable(to, me):
		me.path = [to]

func _arrived() -> void:
	if walk_to.is_empty() and use_after != "":
		var what := use_after
		use_after = ""
		if what == "board":
			me.face = BOARD - me.tile
			open_board()
		elif what == "counter":
			me.face = Vector2i.RIGHT
			use()

## Enter, Space or E: talk to whoever is beside you, read the board, or serve at the counter.
func use() -> bool:
	if fen.where == "town" and not fen_hired and (me.tile - fen.tile).length() <= 1.01:
		talk_fen()
		return true
	if tamsin.where == "town" and not tamsin_hired and (me.tile - tamsin.tile).length() <= 1.01:
		talk_tamsin()
		return true
	if garrick.where == "town" and (me.tile - garrick.tile).length() <= 1.01 and not (me.tile == forge_at() and (smith_hired or _customer_ready())):
		talk_garrick()
		return true
	if finished("smithy") != "" and me.tile == forge_at():
		_use_smithy()
		return true
	if me.tile == SERVE_AT and not queue.is_empty() and queue[0].tile == ORDER_AT and not hired:
		serve(queue[0], true)
		return true
	if (me.tile - BOARD).length() <= 1.01:
		open_board()
		return true
	for k in PLOTS:
		var near := false
		for d in [Vector2i.ZERO, Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
			if plot_at(me.tile + d) == k:
				near = true
		if near:
			if not built.has(k):
				build_plot = k                       # the plan for this plot: what could stand here
				board_sel = 0
				sfx.play("open")
				walk_to.clear()
			elif float(built[k].left) > 0.0:
				say("", "Hob's crew are hard at work. It'll be standing soon.")
			elif built[k].what == "smithy":
				_use_smithy()
			elif built[k].what == "tavern":
				_use_tavern()
			elif built[k].what == "apothecary":
				shelf_open = true
				board_sel = 0
				sfx.play("open")
				walk_to.clear()
			elif built[k].what == "healer":
				say("ama", ["Bring me the hurt ones. Bandages, broth and quiet: that's most of medicine.", "Aki tried to leave before I'd finished with him. He won't again.",
					"Rest is a skill, guildmaster. Your adventurers are terrible at it."][rng.randi() % 3])
			else:
				say("", "The training yard. Straw dummies, worn posts, and the smell of hard work.")
			return true
	if (me.tile - bryn.tile).length() <= 1.01:
		talk_bryn()
		return true
	for h in heroes:
		if h.where == "town" and (me.tile - h.tile).length() <= 1.01:
			talk_hero(h)
			return true
	if (me.tile - COUNTER).length() <= 1.01:
		if hired:
			say("bryn", "I've got the counter, guildmaster. Go and see to the board.")
		elif me.tile != SERVE_AT:
			say("", "The inn's counter. Step round behind it to serve whoever's waiting.")
		else:
			say("", "Nobody's waiting. The stew keeps warm.")
		return true
	return false

func _unhandled_input(e: InputEvent) -> void:
	if not story_pick.is_empty():
		_story_input(e)
		get_viewport().set_input_as_handled()
		return
	if e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_M:
		music_on = not music_on                  # M: music on or off
		get_viewport().set_input_as_handled()
		return
	if e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_N:
		sfx.on = not sfx.on                      # N: sound effects on or off
		get_viewport().set_input_as_handled()
		return
	if not pour.is_empty():
		if e.is_action_pressed("ui_accept") or (e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_E) or (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT):
			pour_press()
		get_viewport().set_input_as_handled()
		return
	if not forge.is_empty():
		if e.is_action_pressed("ui_accept") or (e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_E) or (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT):
			strike()
		get_viewport().set_input_as_handled()
		return
	if shelf_open:
		_shelf_input(e)
		get_viewport().set_input_as_handled()
		return
	if build_plot != "":
		_build_input(e)
		get_viewport().set_input_as_handled()
		return
	if board_open:
		_board_input(e)
		get_viewport().set_input_as_handled()
		return
	var pressed: bool = e.is_action_pressed("ui_accept") or (e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_E)
	if pressed:
		if not lines.is_empty():
			advance()
		else:
			use()
		get_viewport().set_input_as_handled()
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		if not lines.is_empty():
			advance()
		else:
			tap(get_global_mouse_position())
		get_viewport().set_input_as_handled()

## Click or tap: walk there. Tap the board or the counter to walk up and use it; tap a person to go and talk.
func tap(at: Vector2) -> void:
	var goal := Vector2i((at / TILE).floor())
	use_after = ""
	if goal == BOARD:
		use_after = "board"
		goal = READ_AT
	elif goal == COUNTER:
		use_after = "counter"
		goal = SERVE_AT
	if goal == me.tile:
		_arrived()
		return
	walk_to = route(me.tile, goal, me)
	if walk_to.is_empty():
		use_after = ""

# ---------------------------------------------------------------- the adventurers
## Each adventurer decides for themselves: rest when hurt, eat when they come home, and take a posted job if it suits
## their level and their nerve. A bold adventurer may take a job a step too hard for them.
func _hero(h: Mover, dt: float) -> void:
	var a: Dictionary = h.a
	a.timer = float(a.timer) - dt
	match a.state:
		"town":
			if a.timer > 0.0 or not h.path.is_empty():
				return
			a.timer = rng.randf_range(2.5, 5.0)
			if story_ready(h) and not a.get("asked", false):
				a.asked = true
				bark(h, "Guildmaster, have you got a minute?")
			var job := _pick_job(h)
			if job != "":
				a.job = job
				posted.erase(job)
				a.state = "to_board"
				send(h, READ_AT)
			elif wants_drink(h) and rng.randf() < 0.5:
				a.state = "to_tavern"                    # evening: a drink at the tavern before bed
				a.waited = 0.0
				send(h, _step_of(finished("tavern")))
			elif wants_gear(h) and smith_customer == null and rng.randf() < 0.6:
				smith_customer = h                       # savings enough for better gear: off to the smithy
				a.state = "to_smith"
				a.waited = 0.0
				bark(h, "I've saved enough for %s. Off to the smithy!" % GEAR_WORD[int(a.gear) + 1])
				send(h, _step_of(finished("smithy")))
			elif finished("yard") != "" and float(a.hp) >= float(a.max) * 0.7 and rng.randf() < 0.45:
				a.state = "training"                     # nothing to do: practise at the yard
				a.timer = rng.randf_range(10.0, 16.0)
				a.drill = 0.0
				send(h, _step_of(finished("yard")) + Vector2i(rng.randi() % 2, 0))
			elif rng.randf() < 0.6:
				var to := TOWN_AREA.position + Vector2i(rng.randi() % TOWN_AREA.size.x, rng.randi() % TOWN_AREA.size.y)
				if walkable(to, h):
					send(h, to)
		"training":
			if not h.path.is_empty():
				return
			h.face = Vector2i.UP
			a.drill = float(a.get("drill", 0.0)) + dt
			if float(a.drill) >= 2.5:
				a.drill = 0.0
				gain_xp(h, 2 if near("smithy", "yard") else 1)    # placement: the smith fixes kit between drills
				if rng.randf() < 0.3:
					bark(h, ["Hyah!", "Again!", "One more set.", "Take that, straw!"][rng.randi() % 4])
			if a.timer <= 0.0 or _pick_job(h) != "":
				a.state = "town"
				a.timer = 0.5
		"to_board":
			if h.path.is_empty() and h.tile != READ_AT and a.timer <= 0.0:
				a.timer = 1.0
				send(h, READ_AT)                     # try again if someone was in the way
			elif h.tile == READ_AT and h.path.is_empty():
				var j := job_of(a.job)
				bark(h, "%s? I'll take it." % j.name)
				if wants_tonic(h):
					a.state = "to_apoth"                 # a tonic first, for a hard job
					send(h, _step_of(finished("apothecary")))
				else:
					a.state = "leaving"
					send(h, GATE_IN)
		"to_apoth":
			var shop := _step_of(finished("apothecary"))
			if h.path.is_empty():
				if h.tile == shop or (h.tile - shop).length() <= 1.01:
					buy_tonic(h)
					a.state = "leaving"
					send(h, GATE_IN)
				elif a.timer <= 0.0:
					a.timer = 1.0
					send(h, shop)
		"to_smith":
			var at := _step_of(finished("smithy"))
			if h.path.is_empty():
				if h.tile == at:
					h.face = Vector2i.UP
					a.waited = float(a.get("waited", 0.0)) + dt
					if float(a.waited) > PATIENCE * 1.5 and forge.is_empty():
						bark(h, "Nobody at the forge. Another day, then.")
						smith_customer = null
						a.state = "town"
						a.timer = 3.0
				elif a.timer <= 0.0:
					a.timer = 1.0
					if not send(h, at):
						smith_customer = null
						a.state = "town"
		"leaving":
			if h.path.is_empty():
				if h.tile == GATE_IN:
					h.where = "away"
					a.state = "away"
					a.timer = float(job_of(a.job).time)
				elif a.timer <= 0.0:
					a.timer = 1.0
					send(h, GATE_IN)
		"away":
			if a.timer <= 0.0:
				_come_home(h)
		"to_tavern":
			var tap := _step_of(finished("tavern"))
			if h.path.is_empty():
				if h.tile == tap or (h.tile - tap).length() <= 1.01:
					a.waited = float(a.get("waited", 0.0)) + dt
					if tamsin_hired and tamsin.where == "town" and a.waited > 2.5:
						drink(h, 1)
					elif a.waited > PATIENCE and pour.is_empty():
						bark(h, "Nobody at the tap tonight. Never mind.")
						today["unserved"] = int(today.get("unserved", 0)) + 1
						a.state = "town"
						a.timer = 3.0
						a.drank = day
				elif a.timer <= 0.0:
					a.timer = 1.0
					if not send(h, tap):
						a.state = "town"
		"quitting":
			if h.path.is_empty():
				if h.tile == GATE_IN:
					h.where = "gone"
					a.state = "gone"
				elif a.timer <= 0.0:
					a.timer = 1.0
					send(h, GATE_IN)
		"to_counter":
			if h.path.is_empty() and a.timer <= 0.0:
				a.timer = 0.6
				var spot := _queue_spot(h)
				if h.tile != spot:
					send(h, spot)
		"resting":
			var at_healer: bool = h.where == "healer"
			if a.timer <= 0.0:
				a.timer = 1.5                        # a little better every moment in bed; twice as fast in Ama's care
				a.hp = mini(int(a.max), int(a.hp) + int(ceil(float(a.max) * (0.1 if at_healer else 0.05) * (2.0 if "healer" in a.get("traits", []) else 1.0))))
			if int(a.hp) >= int(a.max):
				var out: Vector2i = _step_of(finished("healer")) if at_healer else INN_STEP
				h.where = "town"
				h.tile = out
				h.pos = Vector2(out) * TILE
				a.state = "town"
				a.timer = 1.0
				if at_healer:
					bark(h, ["Ama says I'm a terrible patient.", "All mended. Thank you, Ama!", "Not even a scar. Well. A small one."][rng.randi() % 3])
				else:
					bark(h, ["Good as new.", "That bed is a miracle.", "Right. What's on the board?"][rng.randi() % 3])
				send(h, TOWN_AREA.position + Vector2i(2 + rng.randi() % 6, 1))
		"to_rest":
			var bed: Vector2i = _bed_of(h)
			if h.path.is_empty():
				if h.tile == bed:
					h.where = "healer" if bed != INN_STEP else "inside"
					a.state = "resting"
					a.timer = 1.5
				elif a.timer <= 0.0:
					a.timer = 1.0
					send(h, bed)

func _pick_job(h: Mover) -> String:
	var a: Dictionary = h.a
	if float(a.hp) < float(a.max) * 0.7 or int(a.morale) < 3:
		return ""
	var nerve := int(a.lvl) + (1 if int(a.morale) >= 8 else 0) + (1 if "bold" in a.get("traits", []) else 0)
	var best := ""
	var best_reward := -1
	for id in posted:
		var j := job_of(id)
		if int(j.danger) <= nerve and int(j.reward) > best_reward:
			best = id
			best_reward = int(j.reward)
	return best

func job_of(id: String) -> Dictionary:
	for j in JOBS:
		if j.id == id:
			return j
	return JOBS[0]

## A job's outcome: a fair chance from level and spirits against danger. Hurt either way; worse if it went badly.
## Nobody dies: a disastrous job leaves an adventurer at the edge, carried home for a long rest.
func _come_home(h: Mover) -> void:
	var a: Dictionary = h.a
	var j := job_of(a.job)
	var danger := int(j.danger)
	var gear := int(a.get("gear", 0))
	var tonic: bool = a.get("tonic", false)
	var chance := clampf(0.55 + (int(a.lvl) - danger) * 0.18 + (int(a.morale) - 5) * 0.03 + gear * 0.06
		+ (0.03 if a.get("fine", false) else 0.0) + (0.05 if tonic else 0.0) + (0.05 if "steady" in a.get("traits", []) else 0.0), 0.08, 0.95)
	var won := rng.randf() < chance
	var hurt := int(float(a.max) * danger * rng.randf_range(0.08, 0.2) * (1.0 if won else 1.8) * (1.0 - 0.1 * gear) * (0.5 if tonic else 1.0))
	a.hp = maxi(1, int(a.hp) - hurt)
	a.tonic = false
	var reward := int(round(int(j.reward) * (1.1 if "mapper" in a.get("traits", []) else 1.0)))   # Ren's map knows the shortcuts
	if won:
		a.purse = int(a.get("purse", 0)) + reward - int(round(reward * 0.3))   # their share is theirs to spend
		a.jobs_done = int(a.get("jobs_done", 0)) + 1
		if j.id in HERB_JOBS:
			herbs += 1 + rng.randi() % 2                 # they pick what grows out there on the way home
	h.where = "town"
	h.tile = GATE_IN
	h.pos = Vector2(h.tile) * TILE
	h.path.clear()
	if won:
		var cut := int(round(reward * 0.3))             # the guild's share of the reward
		coins += cut
		today.done += 1
		today.earned += cut
		a.morale = mini(10, int(a.morale) + 1)
		total_jobs += 1
		if not gain_xp(h, danger * 10):
			bark(h, ["Done! The farmers can sleep tonight.", "Job's finished. I need food.", "Back in one piece. Mostly."][rng.randi() % 3])
		_check_rank()
	else:
		today.failed += 1
		a.morale = maxi(0, int(a.morale) - 2)
		bark(h, "It went badly. I couldn't finish it." if int(a.hp) > 1 else "...")
	if int(a.hp) <= 1:
		# news, not an interruption: a line at the foot of the screen
		caption.text = "%s is carried in through the gate by a passing carter, bruised all over. Nothing a long rest can't mend." % a.name
		caption_t = 7.0
	a.job = ""
	a.state = "to_counter"
	a.timer = 0.0
	a.waited = 0.0
	queue.append(h)

func _queue_spot(h: Mover) -> Vector2i:
	var i := queue.find(h)
	if i <= 0:
		return ORDER_AT
	return ORDER_AT + Vector2i(i, 1)                # the line forms along the path

func badly_hurt(h: Mover) -> bool:
	return float(h.a.hp) < float(h.a.max) * 0.3

# ---------------------------------------------------------------- the counter: you serve, or Bryn does
func _counter(dt: float) -> void:
	if queue.is_empty():
		return
	var h: Mover = queue[0]
	if h.tile != ORDER_AT or not h.path.is_empty():
		return
	h.face = Vector2i.LEFT
	h.a.waited = float(h.a.get("waited", 0.0)) + dt
	if hired and bryn.tile == SERVE_AT and bryn.path.is_empty():
		serve_t += dt
		if serve_t >= 2.5:
			serve_t = 0.0
			serve(h, false)
		return
	if float(h.a.waited) > PATIENCE:
		h.a.morale = maxi(0, int(h.a.morale) - 1)
		bark(h, "Nobody's cooking? Fine. Dry bread it is.")
		today["unfed"] = int(today.get("unfed", 0)) + 1
		_to_bed(h)

func serve(h: Mover, by_hand: bool) -> void:
	coins += MEAL
	today.meals += 1
	today.earned += MEAL
	if by_hand:
		meals += 1
	h.a.morale = mini(10, int(h.a.morale) + 1)
	if by_hand:
		sfx.play("coin")
		feel(h, "pleased", 4.0)
		bark(h, ["That smells wonderful.", "Thank you, guildmaster!", "Just what I needed."][rng.randi() % 3])
	else:
		bark(bryn, ["Here you go. Mind, it's hot.", "One stew!", "Eat up."][rng.randi() % 3])
	_to_bed(h)
	if by_hand and meals >= HIRE_AFTER and not hired and not bryn_offered:
		bryn_offered = true
		bark(bryn, "Guildmaster! Have you got a minute?")

func _to_bed(h: Mover) -> void:
	queue.erase(h)
	h.a.state = "to_rest"
	h.a.timer = 0.0
	send(h, _bed_of(h))

## Where a fed adventurer goes to recover: Ama's hut if it stands and they're properly hurt, otherwise the inn.
func _bed_of(h: Mover) -> Vector2i:
	if finished("healer") != "" and float(h.a.hp) < float(h.a.max) * 0.7:
		return _step_of(finished("healer"))
	return INN_STEP

## Experience from jobs and practice; returns true (and says so) if it brought a new level.
func gain_xp(h: Mover, n: int) -> bool:
	var a: Dictionary = h.a
	a.xp = int(a.xp) + n
	if int(a.xp) < int(a.lvl) * 20:
		return false
	a.xp = int(a.xp) - int(a.lvl) * 20
	a.lvl = int(a.lvl) + 1
	a.max = int(float(CLASSES[a.cls].hp) * (1.0 + 0.2 * (int(a.lvl) - 1)))
	bark(h, "I think I've got stronger. Level %d!" % a.lvl)
	return true

# ---------------------------------------------------------------- building on the plots
## The plot where a finished building of this kind stands ("" if none yet).
func finished(what: String) -> String:
	for k in built:
		if built[k].what == what and float(built[k].left) <= 0.0:
			return k
	return ""

## The step in front of a plot's building, where people go in and out.
func _step_of(plot: String) -> Vector2i:
	if plot == "":
		return INN_STEP
	return PLOTS[plot] + Vector2i(0, 2)

## What could still be built (each building once in town), in a steady order.
func plans() -> Array:
	var out: Array = []
	for id in BUILDINGS:
		var taken := false
		for k in built:
			if built[k].what == id:
				taken = true
		if not taken:
			out.append(id)
	return out

var build_note := ""

## Build the chosen plan on the open plot: pay, and Hob's crew put it up over the next while.
func build(id: String) -> bool:
	var b: Dictionary = BUILDINGS[id]
	if coins < int(b.cost):
		build_note = "You need %d more coins for that." % (int(b.cost) - coins)
		return false
	coins -= int(b.cost)
	built[build_plot] = { "what": id, "left": float(b.time) }
	sfx.play("build")
	caption.text = "Hob and his crew arrive with timber and rope. %s will be standing soon." % b.name
	caption_t = 6.0
	build_plot = ""
	build_note = ""
	return true

func _construction(dt: float) -> void:
	for k in built:
		if float(built[k].left) <= 0.0:
			continue
		built[k].left = float(built[k].left) - dt
		if float(built[k].left) <= 0.0:
			var b: Dictionary = BUILDINGS[built[k].what]
			caption.text = "%s is finished. The town is a little bigger." % b.name
			caption_t = 6.0
			if built[k].what == "healer":
				_place_ama()
			_check_rank()

func _place_ama() -> void:
	var k := finished("healer")
	if k == "":
		return
	ama.where = "town"
	ama.tile = _step_of(k) + Vector2i.RIGHT
	ama.pos = Vector2(ama.tile) * TILE
	ama.face = Vector2i.DOWN

func _build_input(e: InputEvent) -> void:
	var n := plans().size() + 1                 # the plans, then "Not now"
	if e is InputEventKey and e.pressed and not e.echo:
		match e.keycode:
			KEY_UP, KEY_W, KEY_LEFT, KEY_A: board_sel = (board_sel + n - 1) % n
			KEY_DOWN, KEY_S, KEY_RIGHT, KEY_D, KEY_TAB: board_sel = (board_sel + 1) % n
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE, KEY_E: plan_pick(board_sel)
			KEY_ESCAPE, KEY_BACKSPACE: build_plot = ""
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p: Vector2 = board_view.get_local_mouse_position()
		for i in n:
			if _plan_rect(i, n).has_point(p):
				plan_pick(i)

func _plan_rect(i: int, n: int) -> Rect2:
	if i == n - 1:
		return Rect2(158, 186, 68, 16)               # "Not now"
	var k := maxi(1, n - 1)                        # up to four plans side by side
	var w := minf(96.0, (312.0 - (k - 1) * 6.0) / k)
	var x0 := 192.0 - (k * w + (k - 1) * 6.0) / 2.0
	return Rect2(x0 + i * (w + 6.0), 46, w, 124)

func plan_pick(i: int) -> void:
	var ps := plans()
	if i >= ps.size():
		build_plot = ""
		build_note = ""
		return
	board_sel = i
	build(ps[i])

# ---------------------------------------------------------------- the smithy: you work the hammer, until Garrick does
## Where you stand to work the anvil: beside the smithy's door, where the customer waits.
func forge_at() -> Vector2i:
	return _step_of(finished("smithy")) + Vector2i.RIGHT

func wants_gear(h: Mover) -> bool:
	var a: Dictionary = h.a
	return finished("smithy") != "" and int(a.get("gear", 0)) < GEAR_COST.size() and int(a.get("purse", 0)) >= GEAR_COST[int(a.get("gear", 0))] \
		and float(a.hp) >= float(a.max) * 0.7

func _customer_ready() -> bool:
	return smith_customer != null and smith_customer.a.state == "to_smith" and smith_customer.tile == _step_of(finished("smithy")) and smith_customer.path.is_empty()

func _use_smithy() -> void:
	if smith_hired:
		say("garrick", ["The forge is in good hands, guildmaster. Mine.", "Every blade that leaves here, I'd carry myself.",
			"Kaito wants a bow that sings. I told him bows don't sing. Then I made one that does."][rng.randi() % 3])
		return
	if me.tile != forge_at():
		say("", "The smithy. Stand at the anvil, beside the door, to work the forge.")
		return
	if not _customer_ready():
		say("", "The forge is banked low. When an adventurer comes in with their savings, you'll make their gear here.")
		return
	var a: Dictionary = smith_customer.a
	me.face = Vector2i.UP
	forge = { "n": 0, "hits": 0, "x": 0.0, "dir": 1.0 }
	caption.text = "%s wants %s. Strike while the metal glows: press E when the spark is in the bright part. Three strikes." % [a.name, GEAR_WORD[int(a.gear) + 1]]
	caption_t = 6.0

## One strike of the hammer: a good one lands while the marker is in the glow.
func strike() -> void:
	if forge.is_empty():
		return
	var good: bool = float(forge.x) >= HOT.x and float(forge.x) <= HOT.y
	forge.n = int(forge.n) + 1
	if good:
		forge.hits = int(forge.hits) + 1
	bark(me, "Clang!" if good else "Tink...")
	sfx.play("clang" if good else "tink")
	if int(forge.n) >= 3:
		var hits := int(forge.hits)
		forge = {}
		finish_piece(smith_customer, hits, true)

func _forge_tick(dt: float) -> void:
	if not forge.is_empty():
		forge.x = float(forge.x) + float(forge.dir) * dt * 1.4
		if float(forge.x) >= 1.0 or float(forge.x) <= 0.0:
			forge.dir = -float(forge.dir)
			forge.x = clampf(float(forge.x), 0.0, 1.0)
		if smith_customer == null:
			forge = {}
	if smith_hired and _customer_ready() and garrick.tile == forge_at() and garrick.path.is_empty():
		smith_t += dt
		if smith_t >= 3.0:
			smith_t = 0.0
			finish_piece(smith_customer, 1 + (1 if rng.randf() < 0.8 else 0) + (1 if rng.randf() < 0.25 else 0), false)

## The finished piece: the adventurer pays from their savings, and three good strikes make it fine work.
func finish_piece(h: Mover, hits: int, by_hand: bool) -> void:
	if h == null:
		return
	var a: Dictionary = h.a
	var price: int = GEAR_COST[int(a.gear)]
	a.purse = int(a.purse) - price
	coins += price
	today.earned += price
	today.gear = int(today.get("gear", 0)) + 1
	a.gear = int(a.gear) + 1
	a.fine = hits >= 3
	if by_hand:
		pieces += 1
		sfx.play("success" if hits >= 3 else "coin")
	if hits >= 3:
		feel(h, "heart", 6.0)
	bark(h, ["It'll do. A bit lumpy, but it'll do.", "Good, solid work. Thank you!", "Look at that edge! The finest work I've seen."][clampi(hits - 1, 0, 2)])
	smith_customer = null
	a.state = "town"
	a.timer = 2.0
	if by_hand and pieces >= SMITH_AFTER and garrick.where == "gone":
		garrick.where = "town"                         # word gets round: a smith walks in through the gate
		garrick.tile = GATE_IN
		garrick.pos = Vector2(garrick.tile) * TILE
		bark(garrick, "Is this where the guildmaster works the forge? I'd like a word.")
		send(garrick, forge_at() + Vector2i.RIGHT)

func talk_garrick() -> void:
	garrick.face = me.tile - garrick.tile
	if smith_hired:
		_use_smithy()
		return
	say("garrick", "Garrick. I've worked forges from here to the coast. I've heard how you've been hammering away at yours.")
	say("garrick", "Honest work, but you've a guild to run. Twelve coins a day and the forge is mine: every adventurer who saves up gets their gear, whether you're there or not.")
	then_do = func():
		smith_hired = true
		send(garrick, forge_at())
		say("", "Garrick rolls up his sleeves and takes the anvil. He'll forge for whoever comes in, for twelve coins at the end of each day.")

func _garrick(_dt: float) -> void:
	if garrick.where != "town" or not garrick.path.is_empty():
		return
	var home := forge_at() if smith_hired else forge_at() + Vector2i.RIGHT
	if garrick.tile != home and int(t * 10) % 10 == 0:
		send(garrick, home)
	elif garrick.tile == home:
		garrick.face = Vector2i.UP if smith_hired else Vector2i.DOWN

# ---------------------------------------------------------------- the apothecary: brew tonics, set the price
func wants_tonic(h: Mover) -> bool:
	var a: Dictionary = h.a
	if finished("apothecary") == "" or stock <= 0 or a.get("tonic", false) or int(job_of(a.job).danger) < 2:
		return false
	var fair := 20 if int(job_of(a.job).danger) >= 3 else 12      # what a tonic is worth to them, for this job
	if PRICES[price_i] > fair or PRICES[price_i] > int(a.get("purse", 0)):
		bark(h, "%d coins for a tonic? I'll chance it without." % PRICES[price_i])
		return false
	return true

func buy_tonic(h: Mover) -> void:
	if stock <= 0:
		bark(h, "The shelf's empty. Never mind.")
		return
	stock -= 1
	h.a.purse = int(h.a.purse) - PRICES[price_i]
	h.a.tonic = true
	coins += PRICES[price_i]
	today.earned += PRICES[price_i]
	today.tonics = int(today.get("tonics", 0)) + 1
	bark(h, "One tonic, coins in the jar. Thank you!")
	sfx.play("coin", -6.0)

func _shelf_input(e: InputEvent) -> void:
	var n := 3                                  # brew, the price, done
	if e is InputEventKey and e.pressed and not e.echo:
		match e.keycode:
			KEY_UP, KEY_W, KEY_LEFT, KEY_A: board_sel = (board_sel + n - 1) % n
			KEY_DOWN, KEY_S, KEY_RIGHT, KEY_D, KEY_TAB: board_sel = (board_sel + 1) % n
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE, KEY_E: shelf_pick(board_sel)
			KEY_ESCAPE, KEY_BACKSPACE: shelf_open = false
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p: Vector2 = board_view.get_local_mouse_position()
		for i in n:
			if _shelf_rect(i).has_point(p):
				shelf_pick(i)

var shelf_note := ""

func shelf_pick(i: int) -> void:
	board_sel = i
	match i:
		0:
			if herbs < 2:
				shelf_note = "You need two herbs for a batch. Adventurers bring them home from the creek, the farms and the woods."
			elif stock >= TONIC_MAX:
				shelf_note = "The shelf is full."
			else:
				herbs -= 2
				brewing = 3.0
				batches += 1
				shelf_open = false
				shelf_note = ""
				caption.text = "You tip the herbs into the pot and stir. The steam smells of mint and wet stones."
				sfx.play("brew")
				caption_t = 3.0
		1:
			price_i = (price_i + 1) % PRICES.size()
		_:
			shelf_open = false
			shelf_note = ""

func _brew(dt: float) -> void:
	if brewing <= 0.0:
		return
	brewing -= dt
	if brewing <= 0.0:
		brewing = 0.0
		stock = mini(TONIC_MAX, stock + 3)
		caption.text = "Three tonics, corked and on the shelf. Adventurers help themselves and leave the coins in the jar."
		caption_t = 5.0
		if batches >= BREW_AFTER and fen.where == "gone":
			fen.where = "town"                       # word gets round: someone who wants to learn walks in
			fen.tile = GATE_IN
			fen.pos = Vector2(fen.tile) * TILE
			bark(fen, "Is this where the tonics come from? I've walked two days to ask something.")
			send(fen, _pot_at() + Vector2i.RIGHT)

func _shelf_rect(i: int) -> Rect2:
	return [Rect2(52, 120, 132, 34), Rect2(200, 120, 132, 34), Rect2(158, 186, 68, 16)][i]

## The town's rank: each new rank brings a newcomer through the gate, looking for the guild.
func _check_rank() -> void:
	if rank + 1 >= RANKS.size():
		return
	var built_n := 0
	for k in built:
		if float(built[k].left) <= 0.0:
			built_n += 1
	var nxt: Dictionary = RANKS[rank + 1]
	if built_n < int(nxt.built) or total_jobs < int(nxt.jobs):
		return
	rank += 1
	sfx.play("levelup")
	caption.text = "Word travels: Starfall is a %s now. Someone new is walking in through the gate." % RANKS[rank].name.to_lower()
	for k in PLOTS:
		if int(PLOT_RANK[k]) == rank:
			caption.text += " Hob has staked out a new plot (%s)." % k
	caption_t = 8.0
	if rank - 1 < NEWCOMERS.size():
		var s: Array = NEWCOMERS[rank - 1]
		var m := Mover.new("hero%d" % heroes.size(), GATE_IN)
		var c: Dictionary = CLASSES[s[1]]
		var mx := int(c.hp * (1.0 + 0.2 * (s[2] - 1)))
		m.a = { "name": s[0], "cls": s[1], "lvl": s[2], "xp": 0, "hp": mx, "max": mx, "morale": 7, "state": "town", "job": "", "timer": 3.0, "hair": HAIR[(heroes.size() * 4 + 1) % HAIR.size()], "purse": 30, "gear": 0, "fine": false, "tonic": false, "beat": 0, "jobs_done": 0, "traits": [], "asked": false }
		_dress(m)
		heroes.append(m)
		bark(m, "Is this the guild? I heard there's honest work here.")
		send(m, TOWN_AREA.position + Vector2i(5, 1))

# ---------------------------------------------------------------- Bryn: the inn's cook, and later your barkeep
func _bryn(_dt: float) -> void:
	var home := SERVE_AT if hired else BRYN_HOME
	if bryn.path.is_empty() and bryn.tile != home:
		send(bryn, home)
	if bryn.path.is_empty() and bryn.tile == home:
		bryn.face = Vector2i.RIGHT if hired else Vector2i.DOWN

func talk_bryn() -> void:
	bryn.face = me.tile - bryn.tile
	if hired:
		say("bryn", ["The stew's holding up. So am I, mostly.", "Aki eats like three people. I'm not complaining; you're paying.",
			"If the wages stop, so does the stew. Just so we understand each other."][rng.randi() % 3])
		return
	if meals >= HIRE_AFTER:
		say("bryn", "I've been watching you run that counter. You're good at it, but you've a whole guild to look after.")
		say("bryn", "Let me take it. Ten coins a day and I'll feed everyone who comes through that gate, rain or shine.")
		then_do = func():
			hired = true
			say("", "Bryn ties on an apron and takes the counter. From now on she serves the meals, for ten coins at the end of each day.")
		return
	say("bryn", ["Hungry adventurers come straight to the counter. Don't keep them waiting; they get grumpy.",
		"Stand behind the counter when someone's waiting, and serve them. Eight coins a bowl.",
		"Hurt ones go up to bed after they've eaten. A night or two and they're right as rain."][rng.randi() % 3])

func talk_hero(h: Mover) -> void:
	var a: Dictionary = h.a
	h.face = me.tile - h.tile
	if story_ready(h):
		_story_talk(h)
		return
	var cls: String = CLASSES[a.cls].name
	var mood := "keen for work" if int(a.morale) >= 7 else ("steady" if int(a.morale) >= 4 else "low on heart")
	var body := "fit and well" if float(a.hp) >= float(a.max) * 0.95 else ("a bit bruised" if not badly_hurt(h) else "badly hurt")
	say(a.name, "%s, level %d. Feeling %s, and %s." % [cls, a.lvl, body, mood])
	if posted.is_empty():
		say(a.name, "Nothing on the board that I've seen. Pin something up and I'll have a look.")
	elif _pick_job(h) == "" and float(a.hp) >= float(a.max) * 0.7 and int(a.morale) >= 3:
		say(a.name, "What's on the board is a bit much for me right now. Something easier, maybe?")

# ---------------------------------------------------------------- the end of a day: wages and a short report
func _day(dt: float) -> void:
	day_t += dt
	if day_t < DAY_SECONDS:
		return
	day_t = 0.0
	var report := "Evening falls on day %d. Jobs done: %d" % [day, today.done]
	if int(today.failed) > 0:
		report += ", gone badly: %d" % today.failed
	report += ". Meals served: %d." % today.meals
	if int(today.get("gear", 0)) > 0:
		report += " Gear made: %d." % int(today.gear)
	if int(today.get("tonics", 0)) > 0:
		report += " Tonics sold: %d." % int(today.tonics)
	report += " The guild earned %d coins." % today.earned
	report += _tavern_evening()
	if fen_hired:
		if coins >= FEN_WAGE:
			coins -= FEN_WAGE
			report += " Fen paid."
		else:
			fen_hired = false
			report += " You couldn't pay Fen; the pot waits for you again."
	if smith_hired:
		if coins >= SMITH_WAGE:
			coins -= SMITH_WAGE
			report += " Garrick paid."
		else:
			smith_hired = false
			report += " You couldn't pay Garrick; he'll wait by the forge until you can."
	if hired:
		if coins >= WAGE:
			coins -= WAGE
			report += " Bryn's wages paid."
		else:
			hired = false
			bryn_offered = false
			meals = HIRE_AFTER - 3
			report += " You couldn't pay Bryn, so she's gone back to her own kitchen."
	report += _judge_day()
	caption.text = report
	caption_t = 11.0
	day += 1
	today = { "done": 0, "failed": 0, "meals": 0, "earned": 0 }
	_new_notices()

# ---------------------------------------------------------------- failing and excelling, visible (SF2.2)
## How the day went, judged at nightfall, with what it means in the street. A good day: at least two jobs done, none
## gone badly, nobody left hungry at the counter. A hard day: more jobs gone badly than done, or two left hungry.
## Someone at rock bottom packs up and leaves (and may come back once things are better); a good run brings bunting,
## more work on the board and, in time, rarer adventurers who have heard Starfall's name. Returns the report's words.
func _judge_day() -> String:
	var out := ""
	var done := int(today.done)
	var failed := int(today.failed)
	var unfed := int(today.get("unfed", 0))
	if done >= int(GOOD_DAY.done) and failed == 0 and unfed == 0:
		good_days += 1
		bad_days = 0
		out += " A good day; people are talking about Starfall." if good_days < 2 else " Another good day. The town has hung out bunting."
		sfx.play("success")
	elif failed > done or unfed >= 2:
		bad_days += 1
		good_days = 0
		out += " A hard day." if bad_days < 2 else " Another hard day. Fewer people bring work to the board."
		sfx.play("sad", -4.0)
	else:
		good_days = maxi(0, good_days - 1)
		bad_days = maxi(0, bad_days - 1)
	for h in heroes:
		if h.where == "town" and h.a.state == "town" and int(h.a.morale) <= 1:
			h.a.state = "quitting"
			h.a.timer = 0.0
			bark(h, "I'm sorry, guildmaster. My heart's not in it any more.")
			feel(h, "heartbreak", 7.0)
			send(h, GATE_IN)
			out += " %s has packed up and gone; if Starfall does better, they may come back." % h.a.name
			break
	if good_days >= 2:
		for h in heroes:
			if h.where == "gone":
				_return(h, "I heard things are going well here. Have you room for me again?")
				out += " %s has come back." % h.a.name
				break
	if good_days >= 3 and visitors.size() < VISITORS.size():
		var v: Array = VISITORS[visitors.size()]
		visitors.append(v[0])
		var c: Dictionary = CLASSES[v[1]]
		var mx := int(c.hp * (1.0 + 0.2 * (int(v[2]) - 1)))
		var m := Mover.new("hero%d" % heroes.size(), GATE_IN)
		m.a = { "name": v[0], "cls": v[1], "lvl": v[2], "xp": 0, "hp": mx, "max": mx, "morale": 8, "state": "town", "job": "", "timer": 3.0, "hair": HAIR[(heroes.size() * 4 + 3) % HAIR.size()], "purse": 50, "gear": 1, "fine": false, "tonic": false, "beat": 0, "jobs_done": 0, "traits": [v[3]], "asked": false }
		_dress(m)
		heroes.append(m)
		bark(m, v[4])
		send(m, TOWN_AREA.position + Vector2i(4, 2))
		out += " A traveller, %s, has come because of the town's good name." % v[0]
	return out

## Someone who left walks back in through the gate, ready to try again.
func _return(h: Mover, line: String) -> void:
	h.where = "town"
	h.tile = GATE_IN
	h.pos = Vector2(h.tile) * TILE
	h.path.clear()
	h.a.state = "town"
	h.a.morale = 6
	h.a.timer = 2.0
	bark(h, line)
	send(h, TOWN_AREA.position + Vector2i(3, 1))

## Bunting strung across the street while the town is having a good run: little flags that flutter.
func _bunting_draw() -> void:
	var a := Vector2(INN_DOOR.x + 2, INN_DOOR.y - 1) * TILE + Vector2(8, 4)
	var b := Vector2(HALL_DOOR.x - 2, HALL_DOOR.y - 1) * TILE + Vector2(8, 4)
	var cols := [Color("e0483e"), Color("f2d24a"), Color("5b8def"), Color("59c38a")]
	var prev := a
	for k in 25:
		var f := (k + 1) / 25.0
		var p := a.lerp(b, f) + Vector2(0, sin(f * PI) * 10.0)
		draw_line(prev, p, Color("4e3220"), 1.0)
		prev = p
		if k % 2 == 0 and k < 24:
			var flap := sin(t * 3.0 + k) * 1.0
			draw_colored_polygon(PackedVector2Array([p, p + Vector2(5, 0), p + Vector2(2.5 + flap, 6)]), cols[(k / 2) % cols.size()])
# ---------------------------------------------------------------- the apothecary's apprentice (SF2.5): master it, then hire
const BREW_AFTER := 4                       # batches you brew yourself before Fen asks to learn
const FEN_WAGE := 6

func _pot_at() -> Vector2i:
	return _step_of(finished("apothecary")) + Vector2i.RIGHT

func talk_fen() -> void:
	fen.face = me.tile - fen.tile
	say("fen", "I'm Fen. Back home they say Starfall's tonics come out right every time, and I want to learn how. I'd work for very little.")
	say("fen", "Six coins a day. I'll keep the pot going whenever there are herbs, and I'll never stir a batch faster than it wants.")
	then_do = func():
		fen_hired = true
		send(fen, _pot_at())
		say("", "Fen takes the long spoon. From now on the pot is kept going whenever herbs come home, for six coins at the end of each day.")

## Fen at the pot: a batch whenever there are two herbs and room on the shelf (a little slower than you; never wasted).
func _fen_tick(dt: float) -> void:
	if fen.where != "town" or not fen.path.is_empty():
		return
	var home := _pot_at() if fen_hired else _pot_at() + Vector2i.RIGHT
	if fen.tile != home:
		if int(t * 10) % 10 == 0:
			send(fen, home)
		return
	fen.face = Vector2i.UP if fen_hired else Vector2i.DOWN
	if not fen_hired or brewing > 0.0 or herbs < 2 or stock >= TONIC_MAX:
		fen_t = 0.0
		return
	fen_t += dt
	if fen_t >= 4.0:
		fen_t = 0.0
		herbs -= 2
		stock = mini(TONIC_MAX, stock + 3)
		bark(fen, ["Three more, corked.", "Mint first, then the stones. Right.", "Slow and steady. There."][rng.randi() % 3])
# ---------------------------------------------------------------- the tavern (SF2.3): pour by hand, then hire Tamsin
const DRINK := 5                            # what a drink costs an adventurer, from their own savings
const POUR_AFTER := 6                       # drinks you pour yourself before Tamsin asks for the tap
const TAMSIN_WAGE := 8
const FULL := Vector2(0.78, 0.95)           # stop pouring with the mug in this band: a good pour

func evening() -> bool:
	return day_t >= DAY_SECONDS * 0.55

func _tap_at() -> Vector2i:
	return _step_of(finished("tavern")) + Vector2i.RIGHT

## Placement that matters a little: two places count as neighbours when their plots are close.
func near(a_what: String, b_what: String) -> bool:
	var pa := finished(a_what)
	var pb := INN_DOOR if b_what == "inn" else Vector2i(-99, -99)
	if b_what != "inn":
		var k := finished(b_what)
		if k == "" or pa == "":
			return false
		pb = PLOTS[k]
	if pa == "":
		return false
	return (Vector2(PLOTS[pa]) - Vector2(pb)).length() <= 9.0

## What Hob says about placing a building on a plot, beside its usual description.
func plan_note(id: String, plot: String) -> String:
	var spot: Vector2 = Vector2(PLOTS[plot])
	match id:
		"tavern":
			return " Here, near the inn: a livelier room, drinks lift spirits more." if (spot - Vector2(INN_DOOR)).length() <= 9.0 else " Here, away from the inn: a quieter room."
		"smithy", "yard":
			var other := "yard" if id == "smithy" else "smithy"
			var k := finished(other)
			if k != "" and (spot - Vector2(PLOTS[k])).length() <= 9.0:
				return " Next to the %s: training counts double." % ("training yard" if other == "yard" else "smithy")
	return ""

func wants_drink(h: Mover) -> bool:
	var a: Dictionary = h.a
	return finished("tavern") != "" and not tavern_shut and evening() and int(a.get("drank", 0)) != day and int(a.get("purse", 0)) >= DRINK

func _tavern_customer() -> Mover:
	for h in heroes:
		if h.a.state == "to_tavern" and h.path.is_empty() and (h.tile - _step_of(finished("tavern"))).length() <= 1.01:
			return h
	return null

func _use_tavern() -> void:
	if tavern_shut:
		tavern_shut = false
		tavern_quiet = 0
		say("", "You take the bar off the shutters and light the lamps. The Tavern is open again.")
		return
	if tamsin_hired:
		say("tamsin", ["Busy night. I like busy.", "Aki tips in stories. I'd rather coins, but the stories are good.",
			"Pour, wipe, listen. That's the whole job, and most people only do the first one."][rng.randi() % 3])
		return
	if _tavern_customer() == null:
		say("", "The tap's quiet. In the evening, adventurers with a few coins put by come in for a drink; you pour." if not evening() else "Nobody at the tap just now. They'll come in as the evening goes on.")
		return
	pour = { "fill": 0.0, "on": false }
	caption.text = "Press E to start pouring, and E again to stop when the mug is nearly full (the gold band). Don't let it spill."
	caption_t = 6.0

## E at the tap: start the pour, then stop it.
func pour_press() -> void:
	if pour.is_empty():
		return
	if not pour.on:
		pour.on = true
		sfx.play("pour")
		return
	_finish_pour(float(pour.fill))

func _pour_tick(dt: float) -> void:
	if not pour.is_empty() and pour.on:
		pour.fill = float(pour.fill) + dt * 0.55
		if float(pour.fill) >= 1.05:
			_finish_pour(1.05)
	if pour.is_empty() and tamsin.where == "town" and tamsin.path.is_empty():
		var home := _tap_at() if tamsin_hired else _tap_at() + Vector2i.RIGHT
		if tamsin.tile != home and int(t * 10) % 10 == 0:
			send(tamsin, home)

func _finish_pour(fill: float) -> void:
	var h := _tavern_customer()
	pour = {}
	if h == null:
		return
	var good: bool = fill >= FULL.x and fill <= FULL.y
	if fill > 1.0:
		bark(me, "Oops, all over the bar.")
		sfx.play("warn")
	elif good:
		sfx.play("success")
	drink(h, 2 if good else 1, true)

## A drink served: the adventurer pays from their savings and goes home in better spirits (more beside the inn).
func drink(h: Mover, quality: int, by_hand := false) -> void:
	var a: Dictionary = h.a
	a.purse = int(a.purse) - DRINK
	coins += DRINK
	today.earned += DRINK
	today["drinks"] = int(today.get("drinks", 0)) + 1
	var lift := 1 + (1 if quality >= 2 else 0) + (1 if near("tavern", "inn") else 0)
	a.morale = mini(10, int(a.morale) + lift)
	if quality >= 2 and by_hand:
		coins += 2                                  # a tip for a good pour
		sfx.play("coin", -3.0)
		feel(h, "heart", 6.0)
		today.earned += 2
	a.drank = day
	a.state = "town"
	a.timer = 2.0
	bark(h, ["Just right. Thank you.", "That's a proper pour!", "Ahh. Now I can sleep."][clampi(quality, 0, 2)] if quality >= 2 else ["Bit of foam. Still good.", "Cheers, guildmaster."][rng.randi() % 2])
	if by_hand:
		pours += 1
		if pours >= POUR_AFTER and tamsin.where == "gone" or (pours >= POUR_AFTER and tamsin.tile == Vector2i(-5, -5)):
			tamsin.where = "town"                    # word gets round: a barkeep walks in through the gate
			tamsin.tile = GATE_IN
			tamsin.pos = Vector2(tamsin.tile) * TILE
			bark(tamsin, "Who's been pouring at that tap? You've a light hand. Can I have a word?")
			send(tamsin, _tap_at() + Vector2i.RIGHT)

func talk_tamsin() -> void:
	tamsin.face = me.tile - tamsin.tile
	say("tamsin", "Tamsin. I've kept bars in three towns, and I've been watching you pour. You'd make a fair barkeep, if you weren't also running a guild.")
	say("tamsin", "Eight coins a day and the tap is mine. Every evening, everyone who comes in gets served, and I'll keep the place open.")
	then_do = func():
		tamsin_hired = true
		send(tamsin, _tap_at())
		say("", "Tamsin ties on an apron and takes the tap. She'll pour every evening, for eight coins at the end of each day.")

## At nightfall: the tavern's evening in the report, Tamsin's wages, and a tavern left unserved two evenings shuts.
func _tavern_evening() -> String:
	if finished("tavern") == "":
		return ""
	var out := ""
	var drinks := int(today.get("drinks", 0))
	if drinks > 0:
		out += " Drinks poured: %d." % drinks
		tavern_quiet = 0
	elif int(today.get("unserved", 0)) > 0 and not tavern_shut:
		tavern_quiet += 1
		if tavern_quiet >= 2:
			tavern_shut = true
			out += " Nobody has been served at the tavern two evenings running; it has closed its shutters. Open it again yourself."
	if tamsin_hired:
		if coins >= TAMSIN_WAGE:
			coins -= TAMSIN_WAGE
			out += " Tamsin paid."
		else:
			tamsin_hired = false
			out += " You couldn't pay Tamsin; she'll wait by the tavern until you can."
	return out

func _draw_pour(font: Font, to_screen: Transform2D) -> void:
	var p: Vector2 = to_screen * (Vector2(_tap_at()) * TILE + Vector2(8, -30))
	var r := Rect2(Vector2(clampf(p.x - 12, 4, 350), maxf(16.0, p.y)), Vector2(24, 30))
	board_view.draw_rect(r.grow(2), Figures.OUTLINE)
	board_view.draw_rect(r, Color("3a2a22"))
	var band := Rect2(r.position + Vector2(0, r.size.y * (1.0 - FULL.y)), Vector2(r.size.x, r.size.y * (FULL.y - FULL.x)))
	board_view.draw_rect(band, Color(0.95, 0.8, 0.3, 0.45))
	var f := clampf(float(pour.fill), 0.0, 1.0)
	board_view.draw_rect(Rect2(r.position + Vector2(2, r.size.y * (1.0 - f)), Vector2(r.size.x - 4, r.size.y * f)), Color("e8a030"))
	board_view.draw_rect(Rect2(r.position + Vector2(2, r.size.y * (1.0 - f)), Vector2(r.size.x - 4, 2)), Color("fff4e0"))
	board_view.draw_string(font, r.position + Vector2(-30, -5), "Stop in the gold" if pour.on else "E to pour", HORIZONTAL_ALIGNMENT_CENTER, 84, 7, Color.WHITE)
# ---------------------------------------------------------------- conversations and passing remarks
func say(who: String, text: String) -> void:
	lines.append({ "who": who, "text": text })

func advance() -> void:
	if lines.is_empty():
		return
	lines.pop_front()
	sfx.play("talk", -8.0)
	if lines.is_empty() and then_do.is_valid():
		var f := then_do
		then_do = Callable()
		f.call()

var _emotes := {}
func _emote(id: String) -> Texture2D:
	if not _emotes.has(id):
		_emotes[id] = load("res://assets/emote/%s.png" % id)
	return _emotes[id]

## A feeling in a bubble over someone's head for a moment (assets/emote: heart, pleased, heartbreak...).
func feel(m: Mover, id: String, seconds := 2.5) -> void:
	feels = feels.filter(func(f): return f.m != m)
	feels.append({ "m": m, "id": id, "t": seconds })

## What shows over someone's head, if anything: a moment's feeling first; then "!" when they want a word; "..." when
## they've waited a while at the counter; and now and then, how an idle adventurer's spirits are (very low or very
## high). Nothing while they're speaking, so the bubble and their words never overlap.
func feeling(m: Mover, i := 0) -> String:
	if barks.any(func(b): return b.m == m):
		return ""
	for f in feels:
		if f.m == m:
			return f.id
	if m.a.is_empty():
		return ""
	if story_ready(m):
		return "notice"
	if m.a.state == "to_counter" and float(m.a.get("waited", 0.0)) > PATIENCE * 0.5:
		return "waiting"
	if m.a.state == "town" and m.path.is_empty() and fmod(t + i * 2.3, 7.0) < 2.0:
		if int(m.a.morale) <= 2:
			return "sad"
		if int(m.a.morale) >= 9:
			return "happy"
	return ""

func bark(m: Mover, text: String) -> void:
	barks = barks.filter(func(b): return b.m != m)
	barks.append({ "m": m, "text": text, "t": 3.0 })

func speaker(who: String) -> Mover:
	if who == "bryn":
		return bryn
	if who == "garrick":
		return garrick if garrick.where == "town" else null
	if who == "ama":
		return ama if ama.where == "town" else null
	for h in heroes:
		if h.a.name == who and h.where == "town":
			return h
	return null

# ---------------------------------------------------------------- the guild board
func open_board() -> void:
	board_open = true
	sfx.play("open")
	board_sel = 0
	walk_to.clear()

func _board_input(e: InputEvent) -> void:
	var n := notices.size() + 1                 # the notices, then "Done"
	if e is InputEventKey and e.pressed and not e.echo:
		match e.keycode:
			KEY_UP, KEY_W, KEY_LEFT, KEY_A: board_sel = (board_sel + n - 1) % n
			KEY_DOWN, KEY_S, KEY_RIGHT, KEY_D, KEY_TAB: board_sel = (board_sel + 1) % n
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE, KEY_E: board_pick(board_sel)
			KEY_ESCAPE, KEY_BACKSPACE: board_open = false
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p: Vector2 = board_view.get_local_mouse_position()
		for i in n:
			if _note_rect(i).has_point(p):
				board_pick(i)

## Pin a notice up (adventurers will see it) or take it down again; the last choice closes the board.
func board_pick(i: int) -> void:
	if i >= notices.size():
		board_open = false
		sfx.play("close", -4.0)
		return
	var id: String = notices[i]
	if id in posted:
		posted.erase(id)
		sfx.play("close", -4.0)
	elif posted.size() < MAX_POSTED:
		posted.append(id)
		sfx.play("pick")
	board_sel = i

func _note_rect(i: int) -> Rect2:
	if i >= notices.size():
		return Rect2(158, 186, 68, 16)
	var n := maxi(1, notices.size())
	var w := (308.0 - 6.0 * (n - 1)) / n
	return Rect2(38 + i * (w + 6.0), 46, w, 120)

# ---------------------------------------------------------------- drawing the town
func _is_path(x: int, y: int) -> bool:
	return tile_at(Vector2i(x, y)) in ".E" and x > 0

func _draw() -> void:
	for y in MAP.size():
		for x in MAP[0].length():
			_ground(x, y, MAP[y][x])
	for y in MAP.size():                         # the stockade: palisade pieces joined to their neighbours, stakes beyond
		for x in MAP[0].length():
			var ch: String = MAP[y][x]
			if ch == "P":
				var m := (1 if tile_at(Vector2i(x, y - 1)) in "PG" else 0) | (2 if tile_at(Vector2i(x + 1, y)) == "P" else 0) \
					| (4 if tile_at(Vector2i(x, y + 1)) in "PG" else 0) | (8 if tile_at(Vector2i(x - 1, y)) == "P" else 0)
				draw_texture_rect_region(F_PALISADE, Rect2(Vector2(x, y - 1) * TILE, Vector2(16, 32)), PALISADE.get(m, PALISADE[10]))
			elif ch == "G" and tile_at(Vector2i(x, y + 1)) == "E":
				draw_texture(F_GATE, Vector2(x, y - 2) * TILE)    # posts, beam and the open leaves (footprint: this tile to y + 2)
			elif ch == "S":
				draw_texture_rect_region(F_PALISADE, Rect2(Vector2(x, y - 1) * TILE, Vector2(16, 32)), PALISADE[0])
			elif ch == "u":
				draw_texture_rect_region(F_PINES, Rect2(Vector2(x, y) * TILE, Vector2(16, 16)), STUMP)
			elif ch == "k":
				draw_texture_rect_region(F_PINES, Rect2(Vector2(x, y) * TILE, Vector2(16, 16)), FERN)
	var lit := 1 if evening() else 0
	_glow.clear()
	var tower_at := Vector2(3, 8 - 5) * TILE
	draw_texture(F_TOWER[lit], tower_at)                                        # the watchtower by the gate (footprint 2x2 at 3,6)
	var hall_at := Vector2(HALL_DOOR.x - 3, HALL_DOOR.y - 4) * TILE
	draw_texture(F_HALL[lit], hall_at)                                          # the Guild Hall faces the square
	var resting := heroes.any(func(h): return h.where == "inside")
	var inn_lit := 1 if lit == 1 or resting else 0
	var inn_at := Vector2(INN_DOOR.x - 2, INN_DOOR.y - 4) * TILE
	draw_texture(F_INN[inn_lit], inn_at)
	if lit == 1:                                 # lamps and windows stay bright under the evening tint (drawn again over it)
		_glow.append([F_TOWER[1], Rect2(13, 16, 5, 7), tower_at])
		for g in HALL_GLASS:
			_glow.append([F_HALL[1], Rect2(g, Vector2(6, 6)), hall_at])
	if inn_lit == 1:
		for g in INN_GLASS:
			_glow.append([F_INN[1], Rect2(g, Vector2(6, 6)), inn_at])
	draw_texture(F_WELL, Vector2(11, 12 - 1) * TILE)
	for k in PLOTS:
		_draw_plot(k)
	_counter_draw()
	_board_draw()
	for y in MAP.size():                         # the pines outside the wall, darker and denser than Wildbond's trees
		for x in MAP[0].length():
			if MAP[y][x] == "T" and (x + y) % 2 == 0:
				var big := (x * 7 + y * 3) % 3 != 0 and y < MAP.size() - 1   # (smaller pines below the south wall)
				var r: Rect2 = PINE_48 if big else PINE_32
				draw_texture_rect_region(F_PINES, Rect2(Vector2(x, y + 1) * TILE - Vector2(r.size.x / 2.0 - 8.0, r.size.y), r.size), r)
	var list := people().filter(func(m): return m.where == "town")
	list.sort_custom(func(a, b): return a.pos.y < b.pos.y)
	for i in list.size():
		var m: Mover = list[i]
		draw_rect(Rect2(m.pos + Vector2(3, 14), Vector2(10, 2)), Color(0, 0, 0, 0.25))
		var look := _look(m)
		var walking := not m.path.is_empty()
		Figures.person(self, m.pos + Vector2(2, -5), m.face, walking, int(m.step_t * 8.0) % 4, fmod(t + i * 1.7, 3.3) < 0.12, look)
		var feel := feeling(m, i)                                      # a bubble over their head: how they feel
		if feel != "":
			draw_texture(_emote(feel), m.pos + Vector2(1, -19 + sin(t * 4.0) * 1.0))
		if not m.a.is_empty() and badly_hurt(m):
			draw_rect(Rect2(m.pos + Vector2(4, -3), Vector2(8, 2)), Color("f4f0e8"))      # a bandage round the head
	_evening_tint()
	_lit_windows()
	if good_days >= 2:
		_bunting_draw()
func _look(m: Mover) -> Dictionary:
	var src: Dictionary = LOOKS.get(m.id, m.look)
	var out := {}
	for k in src:
		out[k] = Color(src[k]) if k in ["skin", "hair", "hat", "shirt", "legs", "shoes", "apron"] else src[k]
	return out

func _ground(x: int, y: int, ch: String) -> void:
	# ART-SF-1 ground.png: 0-3 moss, 4 + road mask (n1 e2 s4 w8) mud road, 20-23 packed earth
	var n := (x * 7 + y * 13) % 9
	var idx := n % 4
	if _is_path(x, y):
		idx = 4 + (1 if _is_path(x, y - 1) else 0) + (2 if _is_path(x + 1, y) else 0) + (4 if _is_path(x, y + 1) else 0) + (8 if _is_path(x - 1, y) else 0)
	elif ch in "qWBc":
		idx = 20 + n % 4
	elif ch == "p" or (plot_at(Vector2i(x, y)) != "" and not _plot_done(plot_at(Vector2i(x, y)))):
		idx = 20 + n % 4                         # cleared, trodden ground while a plot waits or goes up
	draw_texture_rect_region(F_GROUND, Rect2(Vector2(x, y) * TILE, Vector2(16, 16)), Rect2((idx % 8) * 16, (idx / 8) * 16, 16, 16))

## A plot: staked out and roped while it waits; scaffolding while Hob's crew work; then the building itself.
func _draw_plot(k: String) -> void:
	if int(PLOT_RANK[k]) > rank:
		return                                   # not staked out yet: just grass
	var o := Vector2(PLOTS[k]) * TILE
	var wood := Color("6b4a2a")
	if not _plot_done(k):
		pass                                     # (the ground under it is drawn as cleared, trodden earth)
	else:
		_doorstep(k)
	if not built.has(k):
		for c in [Vector2(1, 2), Vector2(29, 2), Vector2(1, 28), Vector2(29, 28)]:
			draw_rect(Rect2(o + c, Vector2(2, 5)), wood)
		draw_line(o + Vector2(2, 4), o + Vector2(30, 4), Color("d8c8a4"), 1.0)
		draw_line(o + Vector2(2, 30), o + Vector2(30, 30), Color("d8c8a4"), 1.0)
		draw_rect(Rect2(o + Vector2(10, 12), Vector2(12, 8)), Figures.OUTLINE)    # a little sign: room to grow
		draw_rect(Rect2(o + Vector2(11, 13), Vector2(10, 6)), Color("d8a868"))
		draw_rect(Rect2(o + Vector2(15, 20), Vector2(2, 6)), wood)
		return
	var b: Dictionary = built[k]
	var total := float(BUILDINGS[b.what].time)
	if float(b.left) > 0.0:
		var p := clampf(1.0 - float(b.left) / total, 0.0, 1.0)
		var h := int(26.0 * p)
		draw_rect(Rect2(o + Vector2(3, 30 - h), Vector2(26, h)), Color("c8a070"))         # walls going up
		for x in [2, 15, 28]:
			draw_rect(Rect2(o + Vector2(x, 2), Vector2(2, 28)), wood)                      # scaffold poles
		for y in [10, 20]:
			draw_rect(Rect2(o + Vector2(1, y), Vector2(30, 2)), Color("a0703a"))            # planks
		if int(t * 4.0) % 2 == 0:
			draw_rect(Rect2(o + Vector2(20, 6 + int(t * 8.0) % 3), Vector2(3, 2)), Color("8a8a84"))   # a hammer at work
		return
	_draw_built(k, b.what, o)

## A finished building: its ART-SF-5 picture standing on the plot (bottom edge on the plot's bottom edge, left edges
## together), with the little bits that show what's going on inside drawn over it.
func _draw_built(_k: String, what: String, o: Vector2) -> void:
	var tex: Texture2D = F_BUILT[what]
	var at := o + Vector2(0, 32 - tex.get_height())
	draw_texture(tex, at)
	match what:
		"smithy":                                # the forge breathing through the open front, smoke from the chimney
			var a := Vector2(_step_of(_k) + Vector2i.RIGHT) * TILE                    # and the anvil by the door, where you work
			draw_rect(Rect2(a + Vector2(9, 6), Vector2(7, 3)), Figures.OUTLINE)
			draw_rect(Rect2(a + Vector2(11, 9), Vector2(3, 4)), Figures.OUTLINE)
			draw_rect(Rect2(a + Vector2(10, 7), Vector2(5, 1)), Color("9198a0"))
			draw_rect(Rect2(a + Vector2(9, 13), Vector2(7, 2)), Color("3e3833"))
			var glow := 0.75 + 0.25 * sin(t * 5.0)
			draw_rect(Rect2(at + Vector2(8, 41), Vector2(7, 5)), Color(1.0, 0.45 * glow + 0.2, 0.1, 0.8))
			_glow.append([Rect2(at + Vector2(8, 41), Vector2(7, 5)), Color(1.0, 0.45 * glow + 0.2, 0.1, 0.8)])
			for i in 3:
				var ph := fmod(t * (0.6 if forge.is_empty() and smith_t == 0.0 else 1.2) + i * 0.33, 1.0)
				draw_circle(at + Vector2(24 + sin(t + i) * 2.0, -ph * 14.0), 2.0 + ph * 3.0, Color(0.72, 0.71, 0.67, 0.5 * (1.0 - ph)))
		"tavern":
			if tavern_shut:                      # boarded up until you open it again
				var d := at + Vector2(10, 30)
				draw_line(d, d + Vector2(12, 20), Color("4a3122"), 2.0)
				draw_line(d + Vector2(12, 0), d + Vector2(0, 20), Color("4a3122"), 2.0)
		"apothecary":
			for i in mini(stock, TONIC_MAX):         # tonics on the shelf, in the bottle window
				draw_rect(Rect2(at + Vector2(24 + (i % 3) * 2, 35 + (i / 3) * 4), Vector2(1, 3)), Color("8a5aa8") if i % 2 == 0 else Color("f2d080"))
			if brewing > 0.0:
				var ph := fmod(t, 1.0)
				draw_circle(at + Vector2(16, 20 - ph * 10.0), 2.0 + ph * 2.0, Color(0.85, 0.8, 0.9, 0.5 * (1.0 - ph)))
		"healer":
			if heroes.any(func(h): return h.where == "healer"):
				draw_rect(Rect2(at + Vector2(36, 26), Vector2(5, 4)), Color("f2d080"))   # a lamp lit for someone resting

func _counter_draw() -> void:
	# a plank counter under a striped awning, a pot of stew steaming on it
	var o := Vector2(COUNTER) * TILE
	draw_rect(Rect2(o + Vector2(-1, -9), Vector2(18, 4)), Figures.OUTLINE)
	for k in 4:
		draw_rect(Rect2(o + Vector2(k * 4, -8), Vector2(4, 2)), Color("c84a3a") if k % 2 == 0 else Color("f2e6c8"))
	draw_rect(Rect2(o + Vector2(0, -6), Vector2(1, 10)), Color("6b4a2a"))
	draw_rect(Rect2(o + Vector2(15, -6), Vector2(1, 10)), Color("6b4a2a"))
	draw_rect(Rect2(o + Vector2(-1, 3), Vector2(18, 10)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 4), Vector2(16, 8)), Color("a0703a"))
	draw_rect(Rect2(o + Vector2(0, 4), Vector2(16, 2)), Color("c8925a"))
	draw_rect(Rect2(o + Vector2(5, 0), Vector2(6, 4)), Color("3a3a40"))                # the pot
	draw_rect(Rect2(o + Vector2(6, 0), Vector2(4, 1)), Color("d8a050"))
	for k in 2:
		var ph := fmod(t * 0.5 + k * 0.5, 1.0)
		draw_circle(o + Vector2(8 + sin(t * 2.0 + k) * 2.0, -ph * 10.0), 1.5 + ph * 2.0, Color(1, 1, 1, 0.35 * (1.0 - ph)))

func _board_draw() -> void:
	# the job board (ART-SF-5), with a paper pinned up for each notice you've posted
	var o := Vector2(BOARD.x, BOARD.y - 1) * TILE
	draw_texture(F_BOARD, o)
	for i in posted.size():
		var p := o + Vector2(6 + i * 9, 12)
		draw_rect(Rect2(p, Vector2(6, 8)), Color("f2e6c8"))
		draw_rect(Rect2(p + Vector2(2, 0), Vector2(2, 1)), Color("8c2f2f"))
		draw_rect(Rect2(p + Vector2(1, 3), Vector2(4, 1)), Color("735c42"))

func _inn_sign() -> void:
	pass                                         # the inn's own picture has its hanging sign (SF2.6)

func _gate_draw() -> void:
	pass                                         # the gate is the gap in the west wall, capped by the palisade's ends

## Evening (SF2.6 follow-up): a gentle cool tint over the town as the day ends, per docs/art/starfall.md's "cool
## daylight; warm lamplight ... brighter at night". It only changes the picture, never the day: it fades in over the
## second half of the day and out again early next morning. Lamps, lit windows and the forge are drawn again on top.
const DUSK_COLOUR := Color(0.07, 0.1, 0.2)
const DUSK_MAX := 0.36
var _glow: Array = []                            # [texture, source rect, where] or [Rect2, Color]: light drawn over the tint

func dusk() -> float:
	var f := day_t / DAY_SECONDS
	if f < 0.06 and day > 1:
		return 1.0 - f / 0.06                    # night lifting in the first moments of a new day
	return clampf((f - 0.5) / 0.3, 0.0, 1.0)

func _evening_tint() -> void:
	var a := DUSK_MAX * dusk()
	if a <= 0.0:
		return
	draw_rect(Rect2(Vector2(-64, -64), Vector2(MAP[0].length(), MAP.size()) * TILE + Vector2(128, 128)), Color(DUSK_COLOUR, a))
	for g in _glow:
		if g[0] is Texture2D:
			draw_texture_rect_region(g[0], Rect2(g[2] + g[1].position, g[1].size), g[1])
		else:
			draw_rect(g[0], g[1])

func _lit_windows() -> void:
	# a sleepy "z" at an upstairs window of the inn for each adventurer resting there
	var resting := heroes.filter(func(h): return h.where == "inside").size()
	for i in mini(resting, 3):
		var o := Vector2(INN_DOOR.x - 2, INN_DOOR.y - 4) * TILE + Vector2(17 + i * 18, 35)
		draw_string(ThemeDB.fallback_font, o + Vector2(0, -1 - fmod(t, 1.5) * 3.0), "z", HORIZONTAL_ALIGNMENT_LEFT, -1, 6, Color(1, 1, 1, 0.8))

# ---------------------------------------------------------------- the screen's words: the status line, bubbles, the board
func _make_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	status = Label.new()
	status.position = Vector2(6, 3)
	status.add_theme_font_size_override("font_size", 8)
	status.add_theme_color_override("font_color", Color.WHITE)
	status.add_theme_color_override("font_outline_color", Color("1a1e24"))
	status.add_theme_constant_override("outline_size", 3)
	ui.add_child(status)
	caption = Label.new()
	caption.position = Vector2(8, 192)
	caption.size = Vector2(368, 20)
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.autowrap_mode = TextServer.AUTOWRAP_WORD
	caption.add_theme_font_size_override("font_size", 7)
	caption.add_theme_color_override("font_color", Color.WHITE)
	caption.add_theme_color_override("font_outline_color", Color("1a1e24"))
	caption.add_theme_constant_override("outline_size", 3)
	ui.add_child(caption)
	bubble = PanelContainer.new()
	var box := StyleBoxFlat.new()
	box.bg_color = Color(0.99, 0.97, 0.92, 0.97)
	box.set_border_width_all(1)
	box.border_color = Color(0.23, 0.17, 0.12)
	box.set_corner_radius_all(4)
	box.content_margin_left = 6
	box.content_margin_right = 6
	box.content_margin_top = 4
	box.content_margin_bottom = 4
	bubble.add_theme_stylebox_override("panel", box)
	bubble.custom_minimum_size = Vector2(240, 0)
	bubble_text = Label.new()
	bubble_text.custom_minimum_size = Vector2(228, 0)
	bubble_text.autowrap_mode = TextServer.AUTOWRAP_WORD
	bubble_text.add_theme_font_size_override("font_size", 8)
	bubble_text.add_theme_color_override("font_color", Color(0.17, 0.13, 0.1))
	bubble.add_child(bubble_text)
	bubble.visible = false
	ui.add_child(bubble)
	board_view = Control.new()
	board_view.set_anchors_preset(Control.PRESET_FULL_RECT)
	board_view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	board_view.draw.connect(_draw_board_view)
	ui.add_child(board_view)

func _update_ui() -> void:
	status.text = "Day %d   %s of Starfall   Coins %d" % [day, RANKS[rank].name, coins]
	if finished("apothecary") != "" or herbs > 0:
		status.text += "   Herbs %d" % herbs
	if finished("apothecary") != "":
		status.text += "   Tonics %d" % stock
	if caption_t <= 0.0:
		caption.text = ""
	var to_screen := get_viewport().get_canvas_transform()
	bubble.visible = not lines.is_empty() and not board_open and not shelf_open and build_plot == ""
	if bubble.visible:
		var line: Dictionary = lines[0]
		var who: Mover = speaker(line.who)
		var name := str(line.who).capitalize()
		bubble_text.text = (name + ": " if name != "" else "") + str(line.text) + "   »"
		bubble.size = Vector2(240, 0)
		bubble.reset_size()
		if who:
			var p := to_screen * (who.pos + Vector2(8, -8))
			bubble.position = Vector2(clampf(p.x - 120.0, 4.0, 140.0), maxf(14.0, p.y - bubble.size.y - 4.0))
		else:
			bubble.position = Vector2(72, 216 - bubble.size.y - 8)
	board_view.queue_redraw()

func _draw_board_view() -> void:
	var to_screen := get_viewport().get_canvas_transform()
	var font := ThemeDB.fallback_font
	# passing remarks float over people's heads
	for b in barks:
		if b.m.where != "town":
			continue
		var p: Vector2 = to_screen * (b.m.pos + Vector2(8, -10))
		var w := font.get_string_size(b.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 7).x + 8
		var r := Rect2(Vector2(clampf(p.x - w / 2, 2, 382 - w), p.y - 12), Vector2(w, 11))
		board_view.draw_rect(r, Color(0.99, 0.97, 0.92, 0.92))
		board_view.draw_rect(r, Color(0.23, 0.17, 0.12), false, 1.0)
		board_view.draw_string(font, r.position + Vector2(4, 8), b.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color(0.17, 0.13, 0.1))
	if not story_pick.is_empty():
		_draw_story(font)
		return
	if not forge.is_empty():
		_draw_forge(font, to_screen)
	if not pour.is_empty():
		_draw_pour(font, to_screen)
	if shelf_open:
		_draw_shelf(font)
		return
	if build_plot != "":
		_draw_plans(font)
		return
	if not board_open:
		return
	# the board, close up: today's notices, pinned or not
	board_view.draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.55))
	board_view.draw_rect(Rect2(28, 14, 328, 196), Color("3e2a1a"))
	board_view.draw_rect(Rect2(32, 18, 320, 188), Color("7a5236"))
	board_view.draw_string(font, Vector2(32, 34), "The Guild Board", HORIZONTAL_ALIGNMENT_CENTER, 320, 11, Color("f4e9cd"))
	for i in notices.size():
		var j := job_of(notices[i])
		var r := _note_rect(i)
		var up: bool = j.id in posted
		board_view.draw_rect(r.grow(1), Color("f2d24a") if board_sel == i else Color(0, 0, 0, 0.3))
		board_view.draw_rect(r, Color("f4e9cd") if up else Color("d8c8a4"))
		if up:
			board_view.draw_rect(Rect2(r.position + Vector2(r.size.x / 2 - 2, -2), Vector2(4, 4)), Color("c84a3a"))   # the pin
		board_view.draw_multiline_string(font, r.position + Vector2(5, 13), j.name, HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 10, 8, -1, Color("3e2c20"))
		board_view.draw_string(font, r.position + Vector2(5, 40), "%s, %d coins" % [DANGER_WORD[int(j.danger)], int(j.reward)], HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color("8a3a2a"))
		board_view.draw_multiline_string(font, r.position + Vector2(5, 52), j.text, HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 10, 7, -1, Color("5a4636"))
		board_view.draw_string(font, r.position + Vector2(5, r.size.y - 5), "Pinned up" if up else "Pin it up", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color("3e2c20") if up else Color("8a6e50"))
	var done := _note_rect(notices.size())
	board_view.draw_rect(done, Color("3e2c20") if board_sel == notices.size() else Color("5a3e26"))
	board_view.draw_string(font, done.position + Vector2(0, 11), "Done", HORIZONTAL_ALIGNMENT_CENTER, done.size.x, 8, Color("f4e9cd"))
	board_view.draw_string(font, Vector2(32, 182), "Up to %d pinned. The guild keeps three coins in ten of each reward." % MAX_POSTED, HORIZONTAL_ALIGNMENT_CENTER, 320, 7, Color("e8d8b8"))

## Hob's plans for a plot, close up: what could stand here, what it costs, what it does for your adventurers.
func _draw_plans(font: Font) -> void:
	var ps := plans()
	var n := ps.size() + 1
	board_view.draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.55))
	board_view.draw_rect(Rect2(28, 14, 328, 196), Color("2f3a46"))
	board_view.draw_rect(Rect2(32, 18, 320, 188), Color("d8e0e8"))
	board_view.draw_string(font, Vector2(32, 34), "Hob's plans for the %s plot" % build_plot, HORIZONTAL_ALIGNMENT_CENTER, 320, 11, Color("2f3a46"))
	if ps.is_empty():
		board_view.draw_string(font, Vector2(32, 100), "Everything Hob knows how to build already stands in Starfall.", HORIZONTAL_ALIGNMENT_CENTER, 320, 8, Color("2f3a46"))
	for i in ps.size():
		var b: Dictionary = BUILDINGS[ps[i]]
		var r := _plan_rect(i, n)
		var afford := coins >= int(b.cost)
		board_view.draw_rect(r.grow(1), Color("f2d24a") if board_sel == i else Color(0, 0, 0, 0.3))
		board_view.draw_rect(r, Color("f4f6f8"))
		board_view.draw_multiline_string(font, r.position + Vector2(5, 13), b.name, HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 10, 8, -1, Color("2f3a46"))
		board_view.draw_string(font, r.position + Vector2(5, 40), "%d coins" % int(b.cost), HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color("3a6a3a") if afford else Color("a03a2a"))
		board_view.draw_multiline_string(font, r.position + Vector2(5, 52), b.text + plan_note(ps[i], build_plot), HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 10, 7 if r.size.x > 90.0 else 6, -1, Color("4a5560"))
		board_view.draw_string(font, r.position + Vector2(5, r.size.y - 5), "Build it" if afford else "Not enough coins", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color("2f3a46") if afford else Color("8a8a8a"))
	var done := _plan_rect(n - 1, n)
	board_view.draw_rect(done, Color("2f3a46") if board_sel == n - 1 else Color("4a5866"))
	board_view.draw_string(font, done.position + Vector2(0, 11), "Not now", HORIZONTAL_ALIGNMENT_CENTER, done.size.x, 8, Color("f4f6f8"))
	if build_note != "":
		board_view.draw_string(font, Vector2(32, 180), build_note, HORIZONTAL_ALIGNMENT_CENTER, 320, 7, Color("a03a2a"))

# ---------------------------------------------------------------- saving the town (user://starfall.json)
func _autosave(dt: float) -> void:
	save_t += dt
	if save_t >= 5.0 and lines.is_empty() and not board_open and build_plot == "":
		save_t = 0.0
		save_game()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()

func save_game() -> void:
	if no_save:
		return
	var d := { "v": 1, "coins": coins, "day": day, "day_t": day_t, "meals": meals, "hired": hired, "offered": bryn_offered,
		"notices": notices, "posted": posted, "today": today, "me": [me.tile.x, me.tile.y],
		"built": built, "jobs": total_jobs, "rank": rank, "herbs": herbs, "stock": stock, "price": price_i,
		"pieces": pieces, "smith": smith_hired, "apprentice": { "batches": batches, "hired": fen_hired, "here": fen.where == "town" }, "tavern": { "pours": pours, "hired": tamsin_hired, "here": tamsin.where == "town", "shut": tavern_shut, "quiet": tavern_quiet }, "garrick": garrick.where == "town", "good": good_days, "bad": bad_days, "visitors": visitors,
		"heroes": heroes.map(func(h): return h.a) }
	SafeSave.write(save_path, d)                 # a spare file first, the last good save kept as a backup

func _load() -> bool:
	if no_save:
		return false
	var d := SafeSave.read(save_path, func(d: Dictionary) -> bool: return d.has("coins") and d.has("day"))
	if d.is_empty():
		return false
	coins = int(d.coins)
	day = int(d.day)
	day_t = float(d.day_t)
	meals = int(d.meals)
	hired = bool(d.hired)
	bryn_offered = bool(d.offered)
	notices = d.notices
	posted = d.posted
	today = d.today
	built = d.get("built", {})
	total_jobs = int(d.get("jobs", 0))
	rank = int(d.get("rank", 0))
	herbs = int(d.get("herbs", 0))
	stock = int(d.get("stock", 0))
	price_i = int(d.get("price", 1))
	pieces = int(d.get("pieces", 0))
	var ap: Dictionary = d.get("apprentice", {})
	batches = int(ap.get("batches", 0))
	fen_hired = bool(ap.get("hired", false))
	if ap.get("here", false) and finished("apothecary") != "":
		fen.where = "town"
		fen.tile = _pot_at() + (Vector2i.ZERO if fen_hired else Vector2i.RIGHT)
		fen.pos = Vector2(fen.tile) * TILE
	var tv: Dictionary = d.get("tavern", {})
	pours = int(tv.get("pours", 0))
	tamsin_hired = bool(tv.get("hired", false))
	tavern_shut = bool(tv.get("shut", false))
	tavern_quiet = int(tv.get("quiet", 0))
	if tv.get("here", false) and finished("tavern") != "":
		tamsin.where = "town"
		tamsin.tile = _tap_at() + (Vector2i.ZERO if tamsin_hired else Vector2i.RIGHT)
		tamsin.pos = Vector2(tamsin.tile) * TILE
	good_days = int(d.get("good", 0))
	bad_days = int(d.get("bad", 0))
	visitors = Array(d.get("visitors", []))
	smith_hired = bool(d.get("smith", false))
	smith_customer = null
	if d.get("garrick", false) and finished("smithy") != "":
		garrick.where = "town"
		garrick.tile = forge_at() if smith_hired else forge_at() + Vector2i.RIGHT
		garrick.pos = Vector2(garrick.tile) * TILE
	_place_ama()
	me.tile = Vector2i(int(d.me[0]), int(d.me[1]))
	me.tile = open_near(me.tile)                 # a save from the old map may stand where a wall or building is now
	me.pos = Vector2(me.tile) * TILE
	heroes.clear()
	for i in d.heroes.size():
		var a: Dictionary = d.heroes[i]
		for k in ["lvl", "xp", "hp", "max", "morale"]:
			a[k] = int(a[k])
		a.purse = int(a.get("purse", 20))              # (saves from before the smithy start with a little put by)
		a.gear = int(a.get("gear", 0))
		a.fine = bool(a.get("fine", false))
		a.tonic = bool(a.get("tonic", false))
		a.beat = int(a.get("beat", 0))
		a.jobs_done = int(a.get("jobs_done", 0))
		a.traits = Array(a.get("traits", []))
		a.asked = false
		var m := Mover.new("hero%d" % i, TOWN_AREA.position + Vector2i(i * 3 + 1, i % 2))
		m.a = a
		# whoever was out or queuing comes home to rest; everyone else is in town
		if a.state in ["gone", "quitting"]:
			a.state = "gone"                           # still away; they may come back on a good run
			m.where = "gone"
		elif a.state in ["away", "leaving", "to_board", "to_apoth", "to_counter", "to_rest", "resting"]:
			a.state = "resting"
			a.job = ""
			m.where = "inside"
		else:
			a.state = "town"
		a.timer = 1.0
		_dress(m)
		heroes.append(m)
	if hired:
		bryn.tile = SERVE_AT
		bryn.pos = Vector2(SERVE_AT) * TILE
	say("", "Welcome back to Starfall, guildmaster. Day %d." % day)
	return true

## The nearest open tile to p (searching outward), for a saved spot that the new town (SF2.6) has built over.
func open_near(p: Vector2i) -> Vector2i:
	if walkable(p, me) and tile_at(p) != "E":
		return p
	var seen := { p: true }
	var todo: Array[Vector2i] = [p]
	while not todo.is_empty():
		var c: Vector2i = todo.pop_front()
		for d in [Vector2i.DOWN, Vector2i.RIGHT, Vector2i.UP, Vector2i.LEFT]:
			var n: Vector2i = c + d
			if seen.has(n) or n.x < 0 or n.y < 0 or n.x >= MAP[0].length() or n.y >= MAP.size():
				continue
			seen[n] = true
			if walkable(n, me) and tile_at(n) != "E" and not route(n, INN_STEP, me).is_empty():
				return n
			todo.append(n)
	return INN_STEP + Vector2i.DOWN

func _plot_of(o: Vector2) -> String:
	for k in PLOTS:
		if Vector2(PLOTS[k]) * TILE == o:
			return k
	return ""

## The forge, close to the anvil: a bar over it with a glowing middle and a spark sliding back and forth. Strike (E,
## Space or a tap) while the spark is in the glow. It's drawn in the world, above the anvil, not as a separate screen.
func _draw_forge(font: Font, to_screen: Transform2D) -> void:
	var p: Vector2 = to_screen * (Vector2(forge_at()) * TILE + Vector2(8, -22))
	var r := Rect2(Vector2(clampf(p.x - 50, 4, 280), maxf(16.0, p.y)), Vector2(100, 10))
	board_view.draw_rect(r.grow(2), Figures.OUTLINE)
	board_view.draw_rect(r, Color("5a3a2a"))
	var hot := Rect2(r.position + Vector2(r.size.x * HOT.x, 0), Vector2(r.size.x * (HOT.y - HOT.x), r.size.y))
	board_view.draw_rect(hot, Color(1.0, 0.55 + 0.2 * sin(t * 8.0), 0.15))
	var x := r.position.x + r.size.x * float(forge.x)
	board_view.draw_rect(Rect2(x - 1, r.position.y - 3, 3, r.size.y + 6), Color("fff4c0"))
	for i in 3:                                                                       # the three strikes
		var done := i < int(forge.n)
		board_view.draw_circle(r.position + Vector2(38 + i * 12, r.size.y + 8), 3.0, Color("f2d24a") if done else Color(0.2, 0.2, 0.2, 0.7))
	board_view.draw_string(font, r.position + Vector2(0, -5), "Strike in the glow", HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 7, Color.WHITE)

## The apothecary's shelf, close up: the pot, the herbs and the tonics, the price on its little slate.
func _draw_shelf(font: Font) -> void:
	board_view.draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.55))
	board_view.draw_rect(Rect2(28, 14, 328, 196), Color("3a2a46"))
	board_view.draw_rect(Rect2(32, 18, 320, 188), Color("e8dcc8"))
	board_view.draw_string(font, Vector2(32, 34), "The Apothecary's Shelf", HORIZONTAL_ALIGNMENT_CENTER, 320, 11, Color("3a2a46"))
	# the shelf itself: a bottle for each tonic, a bundle for each herb
	board_view.draw_rect(Rect2(60, 70, 264, 3), Color("8a6a44"))
	for i in TONIC_MAX:
		var o := Vector2(70 + i * 14, 54)
		if i < stock:
			board_view.draw_rect(Rect2(o + Vector2(2, 0), Vector2(4, 4)), Color("6a5a4a"))
			board_view.draw_rect(Rect2(o + Vector2(0, 4), Vector2(8, 12)), [Color("6ad08a"), Color("e8a84a"), Color("8ab8f0")][i % 3])
		else:
			board_view.draw_rect(Rect2(o + Vector2(0, 4), Vector2(8, 12)), Color(0, 0, 0, 0.08))
	for i in mini(herbs, 8):
		var o := Vector2(200 + i * 14, 52)
		board_view.draw_rect(Rect2(o + Vector2(3, 0), Vector2(2, 6)), Color("6a4a2a"))
		board_view.draw_rect(Rect2(o + Vector2(0, 6), Vector2(8, 12)), [Color("6aa84a"), Color("a8c868"), Color("4a8a5a")][i % 3])
	board_view.draw_string(font, Vector2(60, 88), "Tonics: %d of %d" % [stock, TONIC_MAX], HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color("3a2a46"))
	board_view.draw_string(font, Vector2(200, 88), "Herbs: %d" % herbs, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color("3a2a46"))
	board_view.draw_multiline_string(font, Vector2(60, 102), "Adventurers buy a tonic before a risky job and come home less hurt. Too dear, and they go without.", HORIZONTAL_ALIGNMENT_LEFT, 264, 7, -1, Color("5a4a5a"))
	var labels := ["Brew three tonics (2 herbs)", "Price: %s, %d coins" % [PRICE_WORD[price_i], PRICES[price_i]], "Done"]
	for i in 3:
		var r := _shelf_rect(i)
		board_view.draw_rect(r.grow(1), Color("f2d24a") if board_sel == i else Color(0, 0, 0, 0.3))
		board_view.draw_rect(r, Color("3a2a46") if i == 2 else Color("f6f0e6"))
		board_view.draw_string(font, r.position + Vector2(0, r.size.y / 2 + 3), labels[i], HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 8, Color("f6f0e6") if i == 2 else Color("3a2a46"))
	board_view.draw_string(font, Vector2(52, 168), "Change the price: Cheap (6), Fair (12) or Dear (20).", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color("5a4a5a"))
	if shelf_note != "":
		board_view.draw_string(font, Vector2(32, 180), shelf_note, HORIZONTAL_ALIGNMENT_CENTER, 320, 7, Color("a03a2a"))

# ---------------------------------------------------------------- finished buildings settle into the town
## A finished building stands on grass again, with flat stones at its door and one thing of its own beside it (a barrel
## by the smithy, a planter by the apothecary, an herb bed by the healer, a weapon rack by the yard). That thing is
## real: it stands on its tile and nobody walks through it.
func _plot_done(k: String) -> bool:
	return k != "" and built.has(k) and float(built[k].left) <= 0.0

## The tile beside a finished building where its own thing stands ("" if none there).
func _prop_at(p: Vector2i) -> String:
	for k in PLOTS:
		if _plot_done(k) and p == PLOTS[k] + Vector2i(2, 1):
			return built[k].what
	return ""

func _doorstep(k: String) -> void:
	var s := Vector2(_step_of(k)) * TILE
	for st in ([] if built[k].what == "yard" else [Vector2(2, 1), Vector2(8, 3)]):   # (two flat stones at the door; an open yard has none)
		draw_rect(Rect2(s + st - Vector2(1, 1), Vector2(7, 5)), Color(0, 0, 0, 0.35))
		draw_rect(Rect2(s + st, Vector2(5, 3)), Color("b8b0a0"))
		draw_rect(Rect2(s + st, Vector2(5, 1)), Color("d8d0c0"))
	if int(BUILT_W.get(built[k].what, 2)) > 2:
		return                                   # the building's picture stands over that tile (SF2.6)
	var o := Vector2(PLOTS[k] + Vector2i(2, 1)) * TILE
	draw_rect(Rect2(o + Vector2(2, 13), Vector2(12, 3)), Color(0, 0, 0, 0.22))           # its shadow on the grass
	match built[k].what:
		"smithy":
			draw_rect(Rect2(o + Vector2(1, 3), Vector2(8, 12)), Figures.OUTLINE)          # a water barrel for quenching
			draw_rect(Rect2(o + Vector2(2, 4), Vector2(6, 10)), Color("7a5236"))
			draw_rect(Rect2(o + Vector2(2, 7), Vector2(6, 1)), Color("4a4e58")); draw_rect(Rect2(o + Vector2(2, 11), Vector2(6, 1)), Color("4a4e58"))
			draw_rect(Rect2(o + Vector2(3, 4), Vector2(4, 2)), Color("4a7ab0"))
			draw_circle(o + Vector2(12, 9), 4.5, Figures.OUTLINE)                          # and a grindstone
			draw_circle(o + Vector2(12, 9), 3.5, Color("a8a49a"))
			draw_rect(Rect2(o + Vector2(11, 12), Vector2(2, 3)), Color("6b4a2a"))
		"apothecary":
			draw_rect(Rect2(o + Vector2(1, 8), Vector2(14, 7)), Figures.OUTLINE)          # a planter of herbs
			draw_rect(Rect2(o + Vector2(2, 9), Vector2(12, 5)), Color("8a6a44"))
			for i in 4:
				draw_rect(Rect2(o + Vector2(3 + i * 3, 4 + (i % 2) * 2), Vector2(2, 5 - (i % 2) * 2)), [Color("6aa84a"), Color("a868c8"), Color("4a8a5a"), Color("e8c040")][i])
		"healer":
			draw_rect(Rect2(o + Vector2(1, 6), Vector2(14, 9)), Color("6a4a2a"))           # an herb bed in rows
			for r in 3:
				for c in 4:
					draw_rect(Rect2(o + Vector2(2 + c * 3, 7 + r * 3), Vector2(2, 2)), [Color("7cc05a"), Color("5d9a3e"), Color("a8d070")][(r + c) % 3])
		"yard":
			draw_rect(Rect2(o + Vector2(2, 4), Vector2(2, 11)), Color("6b4a2a"))           # a rack of practice weapons
			draw_rect(Rect2(o + Vector2(12, 4), Vector2(2, 11)), Color("6b4a2a"))
			draw_rect(Rect2(o + Vector2(1, 5), Vector2(14, 2)), Color("8a6a44"))
			for i in 3:
				draw_rect(Rect2(o + Vector2(5 + i * 2, 2), Vector2(1, 11)), [Color("c8c8c0"), Color("a07040"), Color("c8c8c0")][i])

# ---------------------------------------------------------------- music (Ninja Adventure pack, CC0; assets/music)
## A bright tune through the working day, a gentler one as evening comes (the last fifth of the day). M: off and on.
const MUSIC_VOL := -14.0
var music: AudioStreamPlayer
var sfx: Sfx                                     # short sound effects (scripts/sfx.gd)
var music_now := ""
var music_on := true

func _music_key() -> String:
	return "evening" if day_t > DAY_SECONDS * 0.8 else "town"

func _music_tick(dt: float) -> void:
	if music == null:
		music = AudioStreamPlayer.new()
		music.volume_db = -60.0
		add_child(music)
	var want := _music_key() if music_on else ""
	if want != music_now:
		music.volume_db = move_toward(music.volume_db, -60.0, dt * 60.0)
		if music.volume_db <= -59.0 or not music.playing:
			music_now = want
			var path := "res://assets/music/%s.ogg" % want
			if want != "" and ResourceLoader.exists(path):
				var s: AudioStream = load(path)
				if s is AudioStreamOggVorbis:
					(s as AudioStreamOggVorbis).loop = true
				music.stream = s
				music.play()
			else:
				music.stop()
	elif music.playing:
		music.volume_db = move_toward(music.volume_db, MUSIC_VOL, dt * 30.0)

# ---------------------------------------------------------------- members' stories (SF2.1; data/stories.json)
## Each adventurer has a short arc. When a beat is ready (enough jobs done, spirits up, any building it needs stands),
## they ask for a word and a "!" shows over them. Talk to them, hear them out, and choose; what you choose stays with
## them (spirits, sometimes coins, sometimes a trait for good). ChatGPT can write more arcs into the data file.
var stories: Dictionary = {}
var story_pick: Dictionary = {}                # the open choice: { h, opts }
var story_note := ""

func _load_stories() -> void:
	var d = JSON.parse_string(FileAccess.get_file_as_string("res://data/stories.json")) if FileAccess.file_exists("res://data/stories.json") else null
	stories = d if d is Dictionary else {}

func story_ready(h: Mover) -> bool:
	var a: Dictionary = h.a
	var arc: Array = stories.get(a.name, [])
	var b := int(a.get("beat", 0))
	if b >= arc.size() or int(a.morale) < 4 or a.state != "town":
		return false
	var beat: Dictionary = arc[b]
	if int(a.get("jobs_done", 0)) < int(beat.get("after_jobs", 0)):
		return false
	return not beat.has("needs") or finished(str(beat.needs)) != ""

func _story_talk(h: Mover) -> void:
	var beat: Dictionary = stories[h.a.name][int(h.a.beat)]
	for l in beat.lines:
		say(str(l[0]), str(l[1]))
	then_do = func():
		story_pick = { "h": h, "opts": beat.options }
		story_note = ""
		board_sel = 0

func story_choose(i: int) -> void:
	if story_pick.is_empty() or i >= story_pick.opts.size():
		return
	var h: Mover = story_pick.h
	var o: Dictionary = story_pick.opts[i]
	if int(o.get("coins", 0)) < 0 and coins < -int(o.coins):
		story_note = "The guild doesn't have %d coins right now." % -int(o.coins)
		return
	story_pick = {}
	var a: Dictionary = h.a
	coins += int(o.get("coins", 0))
	a.morale = clampi(int(a.morale) + int(o.get("morale", 0)), 0, 10)
	if o.has("trait") and not str(o.trait) in a.traits:
		a.traits.append(str(o.trait))
	for l in o.get("lines", []):
		say(str(l[0]), str(l[1]))
	a.beat = int(a.beat) + 1
	a.asked = false
	sfx.play("pick")

func _story_input(e: InputEvent) -> void:
	var n: int = story_pick.opts.size()
	if e is InputEventKey and e.pressed and not e.echo:
		match e.keycode:
			KEY_UP, KEY_W, KEY_LEFT, KEY_A: board_sel = (board_sel + n - 1) % n
			KEY_DOWN, KEY_S, KEY_RIGHT, KEY_D, KEY_TAB: board_sel = (board_sel + 1) % n
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE, KEY_E: story_choose(board_sel)
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p: Vector2 = board_view.get_local_mouse_position()
		for i in n:
			if _story_rect(i).has_point(p):
				story_choose(i)

func _story_rect(i: int) -> Rect2:
	return Rect2(40, 150 + i * 24, 304, 20)

## The choice, drawn low over the town (you still see the person you're talking to).
func _draw_story(font: Font) -> void:
	var h: Mover = story_pick.h
	board_view.draw_rect(Rect2(32, 132, 320, 80), Color(0.12, 0.09, 0.07, 0.94))
	board_view.draw_rect(Rect2(32, 132, 320, 80), Color("d8b878"), false, 1.0)
	board_view.draw_string(font, Vector2(40, 145), "What do you say to %s?" % h.a.name, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color("f4e9cd"))
	for i in story_pick.opts.size():
		var r := _story_rect(i)
		board_view.draw_rect(r, Color("f4e9cd") if board_sel == i else Color("5a4636"))
		board_view.draw_string(font, r.position + Vector2(6, 13), str(story_pick.opts[i].text), HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 12, 7, Color("3e2c20") if board_sel == i else Color("f4e9cd"))
	if story_note != "":
		board_view.draw_string(font, Vector2(40, 209), story_note, HORIZONTAL_ALIGNMENT_LEFT, -1, 6, Color("f2a080"))
