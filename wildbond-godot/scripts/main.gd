extends Node2D
## Wildbond in Godot: the trial slice (2026-10-07; see README.md and docs/wildbond-plan.md).
## Faded Larkhaven, walkable on the real map. Maren walks up and speaks in bubbles over her head; you sign her ranch
## register (the character creator, register.gd) and the ink paints you into the faded world in colour; you follow
## her into her barn, meet three young creatures in their stalls (their pages: card.gd) and choose your partner by
## walking up to one. Colour bursts out of the barn around it, and it follows you from then on.
## People and creatures are built from parts (figures.gd); the ground, trees and buildings are Ninja Adventure tiles
## (CC0); creatures, moves and story data come from the browser game (data/wildbond.json, tools/godot-export.ps1).
## Everything draws on a 384x216 pixel canvas scaled by whole numbers, so it stays crisp on any screen.

const Figures := preload("res://scripts/figures.gd")
const Register := preload("res://scripts/register.gd")
const Card := preload("res://scripts/card.gd")
const Battle := preload("res://scripts/battle.gd")
const Title := preload("res://scripts/title.gd")
const TouchPad := preload("res://scripts/touch_pad.gd")
const HowTo := preload("res://scripts/howto.gd")
const Shop := preload("res://scripts/shop.gd")
const Book := preload("res://scripts/book.gd")
const Calendar := preload("res://scripts/calendar.gd")
## Larkhaven's doors in the Godot version: the inn (rest) and the shop counter. (The browser puts the shop where Maren's
## barn stands here; the tall barn only fits top right.)
const DOORS := { Vector2i(4, 4): "inn", Vector2i(7, 10): "shop", Vector2i(13, 4): "pip_home", Vector2i(2, 10): "gran_home" }
const R := preload("res://scripts/rules.gd")
const SafeSave := preload("res://scripts/safe_save.gd")
const TILE := 16
const BARN_SOLID := "XWh|tbw"                # inside the barn: the dark, walls, hay, stall boards, the trough, sacks, the workbench
const BARN := [                              # inside Maren's barn: three stalls, hay, feed sacks, a trough, the door at the bottom
	"XXXXXXXXXXXXXXXXXXXXXXXX",
	"XWWWWWWWWWWWWWWWWWWWWWWX",
	"XWWWWWWWWWWWWWWWWWWWWWWX",
	"Xhh,,,|,,,|,,,|,,,|,,hhX",
	"X,,,,,|,,,|,,,|,,,|,,,,X",
	"X,,,,,,,,,,,,,,,,,,,,,,X",
	"X,,,,,,,,,,,,,,,,,,,,,,X",
	"Xb,,,,,,,,,,,,,,,,,,,,tX",
	"Xb,,,,,,,,,,,,,,,,,,,,tX",
	"Xw,,,,,,,,,,,,,,,,,,,,,X",
	"Xhh,,,,,,,,,,,,,,,,,,hhX",
	"X,,,,,,,,,,,,,,,,,,,,,,X",
	"XWWWWWWWWWWdWWWWWWWWWWWX",
	"XXXXXXXXXXXXXXXXXXXXXXXX",
]
const BARN_DOOR := Vector2i(18, 4)           # Maren's barn in town (the big wooden one, top right)
const BARN_EXIT := Vector2i(11, 12)          # its door, from the inside
const PADDOCK := Rect2i(14, 9, 5, 2)         # the open ground inside the ranch fence
## People's looks (figures.gd explains the keys). The tamer's is replaced by what you sign in the register.
const LOOKS := {
	"tamer": { "skin": Color("f1c9a0"), "hair": Color("6b4423"), "hat": Color("2a3f6b"), "shirt": Color("d8453a"), "legs": Color("3a4a6a"), "style": "cap" },
	"maren": { "skin": Color("e8c4a0"), "hair": Color("c9c3b8"), "shirt": Color("7a5236"), "apron": Color("4f8a5a"), "legs": Color("7a5236"), "style": "bun", "outfit": "skirt" },
	"wren": { "skin": Color("f0c7a4"), "hair": Color("3a2230"), "shirt": Color("d85a8a"), "legs": Color("3a3a4a"), "style": "spiky" },
}
## Creatures' looks: a body plan and colours (figures.gd). The starters' other facts come from data/wildbond.json.
const CREATURE_LOOKS := {
	"cindercub": { "kind": "wolf", "body": Color("d8642e"), "belly": Color("f4e4c8"), "dark": Color("5a2a14") },
	"ripplet": { "kind": "lizard", "body": Color("3a8fd8"), "belly": Color("cfe8f4"), "dark": Color("1a3a6a"), "accent": Color("8ad0f0") },
	"mosshog": { "kind": "boar", "body": Color("8a6a48"), "belly": Color("c8a882"), "dark": Color("3a2a1a"), "accent": Color("5d9a3e"), "snout": Color("c0907a") },
	"pup": { "kind": "wolf", "body": Color("b08a5a"), "belly": Color("efe0c4"), "dark": Color("4a3020") },
}
## What Maren says about each of the three (shown on its page).
const MAREN_ON := {
	"cindercub": "That one's a spark. Fast and bold, and it'll bite off more than it can chew. Sleeps curled round the warm stones.",
	"ripplet": "Ripplet's the thinker. It watches before it moves, and blows bubbles when it's pleased with itself.",
	"mosshog": "Slow to start and impossible to stop. The finches won't nest anywhere but its back.",
}

# the people and creatures: where they are, a smooth draw position, a walking queue, and what they're up to
class Mover:
	var id := ""
	var where := "larkhaven"                 # which map they're on: a map from the game data, or "barn"
	var tile := Vector2i.ZERO
	var pos := Vector2.ZERO
	var path: Array[Vector2i] = []
	var speed := 4.0
	var right := true
	var step_t := 0.0
	var face := Vector2i.DOWN                # which way they look: front, back or side
	var look: Dictionary = {}                # creatures only: body plan and colours
	var home := Rect2i()                     # creatures only: where they potter about (empty: they follow you)
	var act := "idle"                        # creatures: idle, sniff, sit, pounce, curious
	var act_t := 0.0
	var act_len := 1.0
	var hop := 0.0                           # height off the ground (a pounce, a hop for joy)
	var target := Vector2i.ZERO
	func _init(i: String, w: String, t: Vector2i) -> void:
		id = i
		where = w
		tile = t
		pos = Vector2(t) * 16.0
	func is_creature() -> bool:
		return not look.is_empty()

var DATA: Dictionary = {}                    # the browser game's content: SPECIES, MOVES, COUNTER, ...
var me := Mover.new("me", "larkhaven", Vector2i(11, 7))
var maren := Mover.new("maren", "larkhaven", Vector2i(7, 11))
var pup := Mover.new("pup", "larkhaven", Vector2i(16, 9))
var wren := Mover.new("wren", "gone", Vector2i(10, 0))   # your rival, who arrives late
var team: Array = []                         # your creatures as the rules see them (rules.gd): level, XP, stats, bond
var rival_c: Dictionary = {}
var bag := { "lures": 5, "coins": 120, "berries": 0 }   # your satchel (the browser game starts you with 5 lures and 120 coins)
var ranch: Array = []                        # creatures resting at Maren's ranch (your team holds three)
var seen := {}                               # the Wilddex: species seen and bonded
var bonded := {}
var got_items := {}                          # items already picked up, by id
var grass_n := 10                            # tall-grass steps until the next find (8-16, like the browser)
var battle_story := ""                       # "rival1" for Wren's battle; empty for wild ones
var satchel: Control                         # the satchel you carry, top right: tap it (or Tab/J) for the field book
var place_t := 0.0                           # seconds since you arrived somewhere (the place name holds, then fades)
var title: Control
var touch: Control                               # the phone pad (touch_pad.gd)
var howto: Control                               # the How to play page (howto.gd)
var turn_card: Control                             # covers the game while a phone is held upright
var show_howto := true                           # it opens before a new journey (the checks turn it off)
var howto_then_title := false                    # opened from the title page: go back to it after
var settings := Settings.new()                   # sound, text size, battle pace, phone buttons (settings.gd, WB6.2)
var shop: Control
var book: Control
var no_save := false                         # tests and recordings never touch your saved journey
var save_path := "user://journey.json"
var then_do := Callable()                    # runs when the current conversation ends
var npcs: Array[Mover] = []                  # people out in the world (from the game data): trainers, Wardens
var npc_info := {}                           # id -> { data from the map, beaten, warden }
var badges: Array = []
var spire_floor := 0
var spire_best := 0
var spire_active := false
var rematch_wins := {}                       # Warden id -> post-Champion rematch wins
var spotter: Mover = null                    # a trainer who has seen you and is walking over
var spot_t := 0.0
const BUILT := ["larkhaven", "thornwood_route", "thornwood", "thornwood_grove", "saltmarsh", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch", "league", "spire"]    # the maps the Godot version has so far
var starters: Array[Mover] = []
var partner: Mover = null
var map_name := "larkhaven"
var my_look: Dictionary = LOOKS.tamer
var painted := false                         # signed the register: you keep your colour in the faded world
var paint_t := -1.0
var spilled := false                         # the colour has spilled out of the barn into town
var restore: Array = []                      # [{where, at: Vector2 world px, r: float, goal: float}]
var lines: Array = []                        # dialogue queue: [{who: "maren" | "" (narration), text}]
var stage := "intro"
var t := 0.0
var fade_in := 0.0
var trans_t := -1.0                          # walking through a door: fade out, switch, fade in
var trans_to := ""
var demo := false
var demo_t := 0.0
var demo_leg := 0
var fly := Vector2.ZERO                      # a butterfly (a moth in the barn) for young creatures to chase
var fly_scare := 0.0
var bubbles: Array = []                      # Ripplet's bubbles: [{p: Vector2, t: float}]
var bubble_cd := 0.0
var walk_to: Array[Vector2i] = []           # click or tap to walk: the steps still to take
var meet_after: Mover = null                 # walking up to a creature you tapped, to meet it on arrival
var meet_tries := 0
var rng := RandomNumberGenerator.new()
var register: Control
var card: Control
var battle: Control

@onready var cam: Camera2D = $Camera
@onready var fade_rect: ColorRect = $FadeLayer/Fade
@onready var bubble: PanelContainer = $UI/Bubble
@onready var bubble_text: Label = $UI/Bubble/Text
@onready var caption: Label = $UI/Caption
@onready var place: Label = $UI/Place
@onready var colour_layer: Node2D = $Painted/Figures
var canopy: Node2D
var cal := Calendar.new()                     # the turning year (WS1): seasons and festivals
var fest_task := ""                           # the festival activity you've agreed to do today (WS5)
var fest_step := 0                            # how far along it is (the race: 1 once you've reached the far end)
var fest_done := {}                           # "<festival>:<year>" -> true: each festival's activity once a year
var keepsakes := {}                           # festival keepsakes you've been given: id -> name
var flowers: Array = []                       # flowers planted at the ranch on Planting Day ([x, y]); they stay
var guests: Array = []                        # people come to the league gate for the homecoming (WB4.3)
var league_room := 0                          # the league (WB4.1): the next court in this attempt (0-3, then 4 the Champion)

func _ready() -> void:
	Controls.setup()                                # named controls for keys, gamepads and the phone pad (WB6.1)
	demo = "--demo" in OS.get_cmdline_user_args()
	settings.keep = settings.keep and not demo and not "--skip-opening" in OS.get_cmdline_user_args()   # the checks set keep off
	if settings.keep:
		settings.load_file()
	settings.apply()
	rng.seed = 7 if demo else Time.get_ticks_usec()
	var j: JSON = load("res://data/wildbond.json")
	DATA = j.data
	var ej: JSON = load("res://data/evolution.json")       # new forms and the ways creatures change (Godot only, for now)
	for k in ej.data.species:
		DATA.SPECIES[k] = ej.data.species[k]
	DATA["EVOS"] = ej.data.evos
	R.DATA = DATA
	_build_homes()
	R.prepare_move_choices()
	pup.look = CREATURE_LOOKS.pup
	pup.home = PADDOCK
	_make_npcs()
	_make_keepers()
	var x := 8
	for id in DATA.STARTERS:
		var m := Mover.new(id, "barn", Vector2i(x, 4))
		m.look = CREATURE_LOOKS[id]
		m.home = Rect2i(x - 1, 3, 3, 2)
		m.right = x < 12
		starters.append(m)
		x += 4
	_set_map("larkhaven")
	cam.position = me.pos + Vector2(8, 8)
	colour_layer.draw.connect(_draw_painted)
	canopy = Node2D.new()                         # tree tops in front of you, above the colour layer (depth, WB2.2)
	var cm := ShaderMaterial.new()
	cm.shader = preload("res://shaders/canopy.gdshader")
	canopy.material = cm
	$Painted.add_child(canopy)
	canopy.draw.connect(_draw_canopy)
	register = Register.new()
	register.keep = not demo
	$UI.add_child(register)
	register.signed.connect(_on_signed)
	card = Card.new()
	$UI.add_child(card)
	card.chosen.connect(_on_chosen)
	card.picked.connect(_on_card_pick)
	lessons = preload("res://scripts/move_lessons.gd").new()
	$UI.add_child(lessons)
	lessons.closed.connect(func():
		save_game()
		_open_bench())
	sfx = Sfx.new()
	add_child(sfx)
	battle = Battle.new()
	battle.sfx = sfx
	battle.looks = CREATURE_LOOKS
	battle.floor_tex = FLOOR
	battle.nature_tex = NATURE
	battle.demo = demo
	$UI.add_child(battle)
	battle.finished.connect(_on_battle)
	battle.bag = bag
	satchel = Control.new()                        # no numbers on the screen (WD1): just the bag, with your badges pinned to its strap
	satchel.position = Vector2(356, 4)
	satchel.size = Vector2(24, 22)
	satchel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	satchel.draw.connect(_draw_satchel)
	$UI.add_child(satchel)
	shop = Shop.new()
	shop.bag = bag
	shop.sfx = sfx
	$UI.add_child(shop)
	book = Book.new()
	book.looks = CREATURE_LOOKS
	book.settings = settings
	$UI.add_child(book)
	var thumbs := CanvasLayer.new()                # the phone pad sits above everything, and hears touches first
	thumbs.layer = 5
	add_child(thumbs)
	touch = TouchPad.new()
	thumbs.add_child(touch)
	var tip := CanvasLayer.new()                   # and "turn your phone sideways" above even that
	tip.layer = 6
	add_child(tip)
	turn_card = preload("res://scripts/turn_card.gd").new()
	tip.add_child(turn_card)
	title = Title.new()
	$UI.add_child(title)
	title.chosen.connect(_on_title)
	howto = HowTo.new()
	$UI.add_child(howto)
	howto.closed.connect(_on_howto_closed)
	book.want_howto.connect(func(): howto.open("go on"))
	if "--skip-opening" in OS.get_cmdline_user_args():
		no_save = true
		_skip_opening()
		return
	if demo:
		no_save = true
	if not no_save and SafeSave.exists(save_path):
		var s := _save_summary()
		if s != "":
			title.open(s)                            # a journey is saved: continue it, or start a new one
			return
	_begin_intro()

func _begin_intro() -> void:
	if show_howto and not demo:
		howto.open()                              # the controls first, so nobody starts a journey not knowing them
	say("", "The supply cart stops at the edge of the trees. Larkhaven: a handful of roofs and a ranch fence that runs right up to the forest.")
	say("", "Everything here looks faded, like an old picture left in the sun. You too.")

func _on_howto_closed() -> void:
	if howto_then_title:
		howto_then_title = false
		title.visible = true

func _on_title(choice: String) -> void:
	if choice == "howto":
		howto_then_title = true
		howto.open("go on")
		return
	if choice == "continue" and _load_game():
		return
	_begin_intro()

func _set_map(n: String) -> void:
	map_name = n
	var m := cur_map()
	cam.limit_right = m[0].length() * TILE
	cam.limit_bottom = m.size() * TILE
	place.text = "Maren's barn" if n == "barn" else (str(INTERIORS[n].name) if INTERIORS.has(n) else str(DATA.MAPS[n].name))
	place.modulate.a = 1.0
	place_t = 0.0
	if battle:
		battle.area = "" if n == "barn" or INTERIORS.has(n) else str(DATA.MAPS[n].get("biome", ""))   # battles take place in the area you're in
	if MOUNTAINS.has(n):
		CLIFF = MOUNTAINS[n].rock
		TURF = MOUNTAINS[n].turf

# ---------------------------------------------------------------- dialogue
func say(who: String, text: String) -> void:
	lines.append({ "who": who, "text": text })

func advance() -> void:
	if lines.is_empty():
		return
	lines.pop_front()
	sfx.play("talk", -8.0)
	if lines.is_empty():
		if then_do.is_valid():
			var f := then_do
			then_do = Callable()
			f.call()                                     # what happens when this conversation ends (a battle, a badge...)
		else:
			_after_talk()

func _after_talk() -> void:
	match stage:
		"intro":
			stage = "maren_walks"
			maren.path = route(maren.tile, me.tile + Vector2i.RIGHT)   # beside you, not below (our people are taller than a tile)
		"maren_talks":
			stage = "register"
			register.open()
		"signed":
			stage = "to_barn"
			maren.path = route(maren.tile, BARN_DOOR + Vector2i(1, 1))   # beside the barn door, not in front of it
			caption.text = "Follow Maren to her barn, the big wooden one at the top right, and walk in through its door."
		"barn_meet":
			stage = "barn_choose"
			caption.text = "Walk up to one of the three and %s to meet it properly." % how("Enter", "Meet")
		"bonded":
			stage = "walk_out"
			caption.text = "Walk out into Larkhaven; %s follows you." % _partner_name()
		"spill":
			# Wren arrives late, running down the north road
			stage = "wren_runs"
			wren.where = "larkhaven"
			wren.tile = Vector2i(10, 0)
			wren.pos = Vector2(wren.tile) * TILE
			wren.speed = 6.0
			wren.path = route(wren.tile, _beside_me())
		"rival1":
			stage = "battle"
			battle_story = "rival1"
			battle.open("trainer", team, [rival_c], DATA.RIVAL.name if DATA.get("RIVAL") is Dictionary else "Wren")
		"after_rival":
			stage = "free"
			wren.speed = 4.0
			seen[partner.id] = true
			bonded[partner.id] = true
			seen[rival_c.sp] = true
			wren.path = route(wren.tile, Vector2i(10, 0))        # off to Thornwood, already running
			caption.text = "%s walks with you now. The north road leads to Thornwood." % _partner_name()

func _on_signed(look: Dictionary) -> void:
	# the ink dries and colour runs into you: you are the one bright thing in the faded valley
	my_look = look
	painted = true
	paint_t = 0.0
	stage = "signed"
	say("", "As the ink dries, colour runs into you: your hands, your clothes, your hair. You're the only bright thing on the road.")
	say("maren", "%s. Good name. And look at you, bright as a new penny!" % look.name)
	say("maren", "Don't mind the rest of it. The whole valley faded long ago. Like an old photo, isn't it?")
	var fam: Dictionary = HERITAGES.get(heritage(), HERITAGES.farm)
	say("maren", "%s, it says here. %s" % [fam.name, fam.maren])
	say("", fam.tale)
	say("maren", "Every family in this valley tells it a little differently. I once heard four tellings at one harvest supper. They can't all be right. Maybe they can't all be wrong, either.")
	say("maren", "Folk say it comes back, a little, every time someone earns a creature's trust. Come to the barn. Someone's been waiting for you.")

# ---------------------------------------------------------------- heritage: where your family comes from (register.gd)
## Each family tells the fading its own way: a partial truth, one thread of the story (docs/lore/wildbond-threads.md,
## thread 5). People of your own heritage recognise you, and the places your family knows feel like home.
const HERITAGES := {
	"farm": { "name": "Larkhaven farmfolk", "maren": "A farm family! Then you know how to look after things that can't tell you what's wrong.",
		"tale": "Your grandmother always said the land grew tired. People took and took from it, and one hard winter it simply let its colour go. \"Look after the land,\" she'd say, \"and one day it'll remember.\"" },
	"coast": { "name": "Saltmarsh coastfolk", "maren": "Coast people. You'll have grown up with one creature at your side, then. Your lot never do anything by halves.",
		"tale": "On the coast they say the tide went out further than it ever had, and something walked up out of the sea. When the water came back in, it took the colour with it." },
	"highland": { "name": "Emberfall highlanders", "maren": "From the high villages! You'll be tougher than you look. Highland folk always are.",
		"tale": "Up in the high villages they say something kept watch inside the mountain, and on the night the colour went, it failed. Or slept. Nobody up there agrees which, and they've been arguing for a hundred years." },
	"wander": { "name": "Farwatch wanderers", "maren": "A wanderer, signing a ranch register. Well, there's a first time for everything.",
		"tale": "Your mother used to say, by the fire, that two things were once joined that never should have been, and they burned so bright that the world went grey around them." },
}
## People who recognise your family, the first time you talk to them (said before their usual lines).
const HERITAGE_TALK := {
	"pip": { "farm": "You're from the farms! Your family's apples are the best in the valley. Everyone says so. I say so.",
		"wander": "You're a wanderer? Have you been everywhere? Have you seen the sea? Is it big? How big?" },
	"tobin": { "coast": "You've got the coast in you. I can tell by how you stand on sand. Your folk know about the tide, don't they? The one that went out too far." },
}
## Places your family knows, the first time you arrive.
const HERITAGE_ARRIVE := {
	"saltmarsh": { "coast": "The smell of salt and wet reeds. You're home, or near enough. Your people would say the tide is watching." },
	"emberfall": { "highland": "Warm stone under your boots and thin, bright air. Your family's mountains. Somewhere up there, they say, something still keeps watch." },
	"cloudglass": { "wander": "A rope strung into the cloud, a path you've never walked. Your mother would have loved this. Wanderers never feel lost on a new road." },
}

func heritage() -> String:
	return str(my_look.get("heritage", "farm"))

func _partner_name() -> String:
	return DATA.SPECIES[partner.id].name if partner else "your partner"

# ---------------------------------------------------------------- the map
func cur_map() -> Array:
	if INTERIORS.has(map_name):
		return INTERIORS[map_name].rows
	return BARN if map_name == "barn" else DATA.MAPS[map_name].rows

## Whether a tile blocks the way: the game data says so for outdoor maps (TILES), the barn has its own few.
func solid(ch: String) -> bool:
	if map_name == "barn":
		return ch in BARN_SOLID
	if INTERIORS.has(map_name):
		return ch in ROOM_SOLID
	return int(DATA.TILES.get(ch, {}).get("solid", 0)) == 1

func tile_at(p: Vector2i) -> String:
	var m := cur_map()
	if p.y < 0 or p.y >= m.size() or p.x < 0 or p.x >= m[0].length():
		return "X" if map_name == "barn" or INTERIORS.has(map_name) else "T"
	return m[p.y][p.x]

func indoors() -> bool:
	return map_name == "barn" or INTERIORS.has(map_name)

# ---------------------------------------------------------------- Larkhaven's inn and shop, walked into (WB2.4)
## Rooms you walk into from their doors in town, like Maren's barn. X dark, W wall, , floor, c counter, t table,
## s shelf, h hearth, k crates, b bed, d the door out. Each keeper stands behind the counter: walk up and press E.
## The two homes (WB2.4) have no counter: the person who lives there is by the hearth; something to find lies on the floor.
const ROOM_SOLID := "XWcthskb"
const INTERIORS := {
	"inn": { "name": "The Larkhaven Inn", "door": Vector2i(4, 4), "exit": Vector2i(11, 11), "keeper": "ned", "keeper_at": Vector2i(10, 4),
		"rows": [
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXWWWWWWWWWWWWWWXXXXX",
			"XXXXXWWWWWWWWWWWWWWXXXXX",
			"XXXXXh,,,,,,,,,,,,sXXXXX",
			"XXXXX,,,,,,,,,,,,,sXXXXX",
			"XXXXX,,,ccccc,,,,,,XXXXX",
			"XXXXX,,,,,,,,,,,,,,XXXXX",
			"XXXXX,,t,,,,,,,t,,,XXXXX",
			"XXXXX,,,,,,,,,,,,,,XXXXX",
			"XXXXX,,t,,,,,,,t,,,XXXXX",
			"XXXXX,,,,,,,,,,,,,,XXXXX",
			"XXXXXWWWWWWdWWWWWWWXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
		] },
	"shop": { "name": "Juniper's Shop", "door": Vector2i(7, 10), "exit": Vector2i(11, 11), "keeper": "juniper", "keeper_at": Vector2i(11, 4),
		"rows": [
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXWWWWWWWWWWWWXXXXXX",
			"XXXXXXWWWWWWWWWWWWXXXXXX",
			"XXXXXXs,,,,,,,,,,sXXXXXX",
			"XXXXXXs,,,,,,,,,,sXXXXXX",
			"XXXXXX,,,cccccc,,,XXXXXX",
			"XXXXXX,,,,,,,,,,,,XXXXXX",
			"XXXXXXk,,,,,,,,,,kXXXXXX",
			"XXXXXXk,,,,,,,,,,,XXXXXX",
			"XXXXXX,,,,,,,,,,,,XXXXXX",
			"XXXXXX,,,,,,,,,,,,XXXXXX",
			"XXXXXXWWWWWdWWWWWWXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
		] },
	# Pip's family home, top of the lane by the signpost: his mum Mira at home, and something Pip left by the window for you
	"pip_home": { "name": "Pip's home", "door": Vector2i(13, 4), "exit": Vector2i(11, 11), "keeper": "pip_mum", "keeper_at": Vector2i(12, 4),
		"find": { "id": "home_pip", "at": Vector2i(15, 8), "give": { "lures": 2 }, "who": "pip_mum",
			"line": "Pip left those by the window for you. He says Champions share. Don't tell him I told you he was saving them." },
		"rows": [
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXWWWWWWWWWWXXXXXXX",
			"XXXXXXXWWWWWWWWWWXXXXXXX",
			"XXXXXXXh,,,,,,,,bXXXXXXX",
			"XXXXXXX,,,,,,,,,bXXXXXXX",
			"XXXXXXX,,,t,,,,,,XXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXXs,,,,,,,,,XXXXXXX",
			"XXXXXXXs,,,,,,,,,XXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXXWWWWdWWWWWXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
		] },
	# Nora's cottage (Pip's gran), beside Juniper's: she keeps the harvest hum, and a jar of berries she picked too many of
	"gran_home": { "name": "Nora's cottage", "door": Vector2i(2, 10), "exit": Vector2i(11, 11), "keeper": "pip_gran", "keeper_at": Vector2i(9, 4),
		"find": { "id": "home_gran", "at": Vector2i(14, 9), "give": { "berries": 3 }, "who": "pip_gran",
			"line": "Take those berries for your partner, dear. I picked far too many again." },
		"rows": [
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXWWWWWWWWWWXXXXXXX",
			"XXXXXXXWWWWWWWWWWXXXXXXX",
			"XXXXXXXh,,,,,,,,sXXXXXXX",
			"XXXXXXX,,,,,,,,,sXXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXX,,,,,t,,,,XXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXXb,,,,,,,,,XXXXXXX",
			"XXXXXXXb,,,,,,,,,XXXXXXX",
			"XXXXXXX,,,,,,,,,,XXXXXXX",
			"XXXXXXXWWWWdWWWWWXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
			"XXXXXXXXXXXXXXXXXXXXXXXX",
		] },
}

## The two homes stand on the Larkhaven map from the browser game's data, so they are added here (doors and front walls)
## rather than in data/wildbond.json, and a fresh export keeps them. Roofs come from buildings(), as for every cottage.
func _build_homes() -> void:
	var rows: Array = DATA.MAPS.larkhaven.rows
	for room in INTERIORS:
		if not room.ends_with("_home"):
			continue
		var d: Vector2i = INTERIORS[room].door
		var row: String = rows[d.y]
		rows[d.y] = row.substr(0, d.x - 1) + "#D##" + row.substr(d.x + 3)

## An old save made before the homes may stand where a new cottage is now: step out in front of its door instead.
func _off_new_homes(map: String, p: Vector2i) -> Vector2i:
	if map != "larkhaven":
		return p
	for room in INTERIORS:
		var d: Vector2i = INTERIORS[room].door
		if room.ends_with("_home") and p.x >= d.x - 1 and p.x <= d.x + 2 and p.y >= d.y - 2 and p.y <= d.y:
			return d + Vector2i.DOWN
	return p
var keepers: Array = []                      # Old Ned and Juniper, behind their counters
func _make_keepers() -> void:
	for room in INTERIORS:
		var k := Mover.new(INTERIORS[room].keeper, room, INTERIORS[room].keeper_at)
		k.face = Vector2i.DOWN
		keepers.append(k)
const KEEPER_LOOKS := {
	"ned": { "name": "Old Ned", "skin": Color("e8b48a"), "hair": Color("d8d4cc"), "shirt": Color("7a5236"), "apron": Color("efe6d4"),
		"legs": Color("4a3e34"), "shoes": Color("3a2a1e"), "style": "short", "body": "broad" },
	"juniper": { "name": "Juniper", "skin": Color("c88a64"), "hair": Color("3a2a22"), "shirt": Color("4a7a5a"), "apron": Color("d8c8a4"),
		"legs": Color("3a3040"), "shoes": Color("2a2228"), "style": "bun", "body": "narrow" },
	"pip_mum": { "name": "Mira", "skin": Color("e0a878"), "hair": Color("8a5a2a"), "shirt": Color("a85a4a"), "apron": Color("e8dcc4"),
		"legs": Color("4a4048"), "shoes": Color("3a2a22"), "style": "ponytail", "body": "narrow" },
	"pip_gran": { "name": "Nora", "skin": Color("e0a878"), "hair": Color("e4e0d8"), "shirt": Color("6a7a9a"), "apron": Color("e8dcc4"),
		"legs": Color("4a4048"), "shoes": Color("3a2a22"), "style": "bun", "body": "narrow" },
}

## Walking up to a keeper's counter and pressing E: Old Ned rests your team, Juniper sets out her goods.
func _near_keeper() -> String:
	if not INTERIORS.has(map_name):
		return ""
	var at: Vector2i = INTERIORS[map_name].keeper_at
	var front: Vector2i = at + Vector2i(0, 2)        # across the counter
	return INTERIORS[map_name].keeper if (me.tile - front).length() <= 1.01 or (me.tile - at).length() <= 1.01 else ""

func _keeper_talk(who: String) -> void:
	walk_to.clear()
	me.face = Vector2i.UP
	if who == "ned":
		for c in team:
			c.hp = R.stats(c).hp
		say("ned", ["Sit yourself down. Blankets by the fire, stew in the pot. Your creatures can have the warm corner.",
			"Back again? Good. A tamer who rests is a tamer who comes home.",
			"Maren says you're doing her proud. Don't tell her I told you."][int(t) % 3])
		say("", "You rest a while at the Larkhaven Inn. Your team is fully healed.")
	elif who == "pip_mum":
		if not story_done.has("met:pip_mum"):           # the first visit: she says who she is (story_done is already saved)
			story_done["met:pip_mum"] = true
			say("pip_mum", "Oh, hello! I'm Mira, Pip's mum. Come in, come in. Mind the boots.")
		if badges.has("thorn"):
			say("pip_mum", "Pip keeps telling me everything's brighter. Nonsense, of course.")
			say("", "She smooths her good scarf as she says it.")
		else:
			say("pip_mum", ["Pip's out by the paddock again, I expect. He says he'll be Champion before Wren. I say he'll be in for supper.",
				"Mind the step, love. Pip leaves his boots wherever his feet stop."][int(t) % 2])
	elif who == "pip_gran":
		if not story_done.has("met:pip_gran"):
			story_done["met:pip_gran"] = true
			say("pip_gran", "I'm Nora, dear. Pip's gran. Everyone calls me Gran, Pip included, so you might as well.")
		say("pip_gran", "Sit a moment. Do you know the harvest hum? Pip thinks I made up the last bit. I didn't. My mother hummed it just the same.")
		say("", "She hums it for you, slowly, while the kettle warms.")
	else:
		say("juniper", "Welcome in! Lures for bonding, berries for a tired team. Have a look.")
		then_do = func():
			shop.open([
				{ "name": "5 lures", "give": { "lures": 5 }, "cost": 50 },
				{ "name": "5 berries", "give": { "berries": 5 }, "cost": 5 * int(DATA.FOODS.berries.cost) },
			])

func actors() -> Array:
	var out: Array = []
	for m in [me, maren, pup, wren] + starters + npcs + ranch_movers + keepers + guests:
		if m.where == map_name:
			out.append(m)
	return out

func walkable(p: Vector2i) -> bool:
	var ch := tile_at(p)
	if solid(ch) or _under_roof(p):
		return false
	if ch == "D" and not (p == BARN_DOOR and stage not in ["intro", "maren_walks", "maren_talks", "register", "signed"]):
		return false                           # other people's houses stay shut in the trial
	for m in actors():
		if p == m.tile or (not m.path.is_empty() and p == m.path[0]):
			return false
	return true

func route(from: Vector2i, to: Vector2i) -> Array[Vector2i]:
	# shortest walk on the grid (people only step on open tiles)
	var prev := { from: from }
	var queue: Array[Vector2i] = [from]
	while not queue.is_empty():
		var c: Vector2i = queue.pop_front()
		if c == to:
			break
		for d in [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
			var n: Vector2i = c + d
			if prev.has(n) or solid(tile_at(n)) or (tile_at(n) == "D" and n != to) or (n != to and _someone_standing(n)):
				continue
			prev[n] = c
			queue.append(n)
	var out: Array[Vector2i] = []
	if not prev.has(to):
		return out
	var c2: Vector2i = to
	while c2 != from:
		out.push_front(c2)
		c2 = prev[c2]
	return out

# ---------------------------------------------------------------- doors: into the barn and out again
func _check_doors() -> void:
	if trans_t >= 0.0 or not me.path.is_empty():
		return
	if map_name == "larkhaven" and me.tile == BARN_DOOR:
		_go("barn")
	elif map_name == "barn" and me.tile == BARN_EXIT:
		_go("larkhaven")
	elif INTERIORS.has(map_name) and me.tile == INTERIORS[map_name].exit:
		_go("larkhaven", INTERIORS[map_name].door + Vector2i.DOWN, Vector2i.DOWN)
	elif not indoors():
		# the edge of a map: the road onward, if it's open
		var ch := tile_at(me.tile)
		if int(DATA.TILES.get(ch, {}).get("exit", 0)) != 1:
			return
		var ex: Dictionary = DATA.MAPS[map_name].exits.get(ch, {})
		var block := ""
		if ex.is_empty():
			block = "The road ends here for now."
		elif ex.has("requiresElement") and not _team_has_element(str(ex.requiresElement)):
			block = str(ex.get("locked", "One of your partners may be able to find a way through."))
		elif ex.to == "spire" and not story_done.has("leagueEnding"):
			block = str(ex.get("locked", "The Spire opens after the Champion ending."))
		elif ex.has("locked") and (not _gate_open(map_name) or (ex.to == "league" and badges.size() < 8)):
			block = ex.locked
		elif ex.to not in BUILT:
			block = "The road goes on to %s. That part of the valley is still being built in the Godot version." % DATA.MAPS[ex.to].name
		elif stage != "free":
			block = "Maren calls after you: \"Not yet, love! Finish up here first.\""
		if block != "":
			say("", block)
			var back: Vector2i = me.tile - me.face
			if not solid(tile_at(back)):
				me.path = [back]                       # step back from the edge
			return
		if map_name == "spire" and ex.to == "league":
			spire_active = false
			spire_floor = 0
		_go(ex.to, Vector2i(int(ex.x), int(ex.y)), DIRS.get(ex.get("dir", "down"), Vector2i.DOWN))

func _team_has_element(element: String) -> bool:
	for creature in team:
		if DATA.SPECIES.get(str(creature.get("sp", "")), {}).get("el", "") == element:
			return true
	return false

const DIRS := { "up": Vector2i.UP, "down": Vector2i.DOWN, "left": Vector2i.LEFT, "right": Vector2i.RIGHT }
var trans_at := Vector2i(-1, -1)
var trans_face := Vector2i.DOWN

func _go(to: String, at := Vector2i(-1, -1), face := Vector2i.DOWN) -> void:
	trans_t = 0.0
	trans_to = to
	trans_at = at
	trans_face = face

func _switch() -> void:
	if trans_to != "league":
		guests.clear()                               # the homecoming guests go home
	_set_map(trans_to)
	if trans_to == "barn":
		me.tile = BARN_EXIT + Vector2i.UP
		me.face = Vector2i.UP
		if stage == "to_barn":
			maren.where = "barn"
			maren.tile = Vector2i(15, 8)
			maren.pos = Vector2(maren.tile) * TILE
			maren.path.clear()
			maren.face = Vector2i.LEFT
	elif INTERIORS.has(trans_to):
		me.tile = INTERIORS[trans_to].exit + Vector2i.UP
		me.face = Vector2i.UP
	elif trans_at.x >= 0:
		me.tile = trans_at                          # arriving along a road
		me.face = trans_face
	else:
		me.tile = BARN_DOOR + Vector2i.DOWN
		me.face = Vector2i.DOWN
	me.where = trans_to
	if stage == "free":
		caption.text = ""                            # through a door or out on the road: the after-Wren note has done its job
	me.pos = Vector2(me.tile) * TILE
	me.path.clear()
	if partner:
		partner.where = trans_to
		partner.tile = BARN_EXIT if trans_to == "barn" else (INTERIORS[trans_to].exit if INTERIORS.has(trans_to) else (BARN_DOOR if trans_at.x < 0 else me.tile - trans_face))
		if map_name == "larkhaven" and DOORS.has(partner.tile):
			partner.tile = me.tile + (Vector2i.RIGHT if walkable(me.tile + Vector2i.RIGHT) else Vector2i.LEFT)   # out of a doorway beside you
		if trans_at.x >= 0 and solid(tile_at(partner.tile)):
			partner.tile = me.tile
		partner.pos = Vector2(partner.tile) * TILE
		partner.path.clear()
		_stop(partner)
	cam.position = me.pos + Vector2(8, 8)
	cam.reset_smoothing()
	if trans_to == "barn" and stage == "to_barn":
		stage = "barn_meet"
		caption.text = ""
		say("maren", "Here they are. Three young ones, born this spring, and every one of them hoping for a tamer.")
		say("maren", "Go and say hello. Take your time, love; this is the big one. They'll be choosing you as much as you choose them.")
	elif trans_to == "larkhaven" and partner and not spilled:
		spilled = true
		maren.where = "larkhaven"                         # Maren follows you out
		maren.tile = BARN_DOOR + Vector2i(1, 1)
		maren.pos = Vector2(maren.tile) * TILE
		maren.path.clear()
		stage = "spill"
		caption.text = ""
		restore.append({ "where": "larkhaven", "at": Vector2(BARN_DOOR) * TILE + Vector2(8, 8), "r": 0.0, "goal": 110.0 })
		say("", "Outside, the colour has spilled out through the barn door: across the path, up the walls, into the grass.")
		say("", "%s sniffs the bright grass, sneezes, and looks up at you as if to say: where next?" % _partner_name())
	var arrive: String = HERITAGE_ARRIVE.get(trans_to, {}).get(heritage(), "")
	if arrive != "" and stage == "free" and not story_done.has("arr:" + trans_to):
		story_done["arr:" + trans_to] = true         # the first time you reach a place your family knows
		say("", arrive)

# ---------------------------------------------------------------- the loop
func _process(dt: float) -> void:
	t += dt
	place_t += dt
	cal.advance(dt)
	_music_tick(dt)
	_ambience_tick(dt)
	_thumbs_tick()
	fade_in = min(1.0, fade_in + dt * 0.7)
	var door_dark := 0.0
	if trans_t >= 0.0:
		var before := trans_t
		trans_t += dt
		if before < 0.3 and trans_t >= 0.3:
			_switch()
		door_dark = 1.0 - absf(trans_t - 0.3) / 0.3
		if trans_t >= 0.6:
			trans_t = -1.0
	fade_rect.color.a = maxf(1.0 - fade_in, clampf(door_dark, 0.0, 1.0))
	if paint_t >= 0.0:
		paint_t += dt
	if demo:
		_demo(dt)
	_butterfly(dt)
	_spotter_tick(dt)
	_autosave(dt)
	battle.heritage = heritage()
	battle.taught = taught
	_check_evolution()
	_bubbles(dt)
	for m in actors():
		if m.is_creature():
			_think(m, dt)
	for m in actors():
		_walk(m, dt)
	if stage == "free" and wren.where == map_name and wren.path.is_empty() and wren.tile == Vector2i(10, 0):
		wren.where = "gone"                          # off up the road to Thornwood
	if stage == "wren_runs" and wren.path.is_empty() and wren.pos.distance_to(Vector2(wren.tile) * TILE) < 0.5:
		stage = "rival1"
		wren.face = me.tile - wren.tile
		me.face = wren.tile - me.tile
		if wren.where == "larkhaven" and wren.tile.x == 10 and wren.tile.y == 0:
			wren.tile = _beside_me()
			wren.pos = Vector2(wren.tile) * TILE
		for l in DATA.SCENES.rival1:
			say(l[0], _fill(l[1]))
	if stage == "maren_walks" and maren.path.is_empty() and maren.pos.distance_to(Vector2(maren.tile) * TILE) < 0.5:
		stage = "maren_talks"
		me.face = maren.tile - me.tile                  # you turn to each other
		maren.face = me.tile - maren.tile
		maren.right = maren.face.x > 0
		say("maren", "There you are! You must be the new tamer. I'm Maren. I keep the ranch.")
		say("maren", "Before anything else: the ranch register. Every tamer in the valley signs it. Write yourself in, love.")
	var free_to_walk: bool = stage in ["to_barn", "barn_choose", "walk_out", "free"] and not lessons.visible and not card.visible and not battle.visible and not shop.visible and not book.visible and trans_t < 0.0
	if lines.is_empty() and free_to_walk and me.path.is_empty() and me.pos.distance_to(Vector2(me.tile) * TILE) < 0.5:
		var d := Controls.held_dir()                 # keys, a gamepad, or the phone pad (WB6.1)
		if d != Vector2i.ZERO:
			walk_to.clear()                          # the keys always win over a tapped walk
			meet_after = null
			_step(d)
		elif not walk_to.is_empty():
			var nxt: Vector2i = walk_to.pop_front()
			if (nxt - me.tile).length() == 1 and (walkable(nxt) or _gentle_at(nxt) != null or DOORS.has(nxt)):
				_step(nxt - me.tile)
			else:
				walk_to.clear()                      # something stepped in the way: stop here
		elif meet_after:
			if (me.tile - meet_after.tile).length() <= 1.01 and (stage == "barn_choose" or meet_after in ranch_movers):
				if stage == "barn_choose":
					_meet(meet_after)
				else:
					_visit(meet_after)
				meet_after = null
			elif meet_tries < 4:
				meet_tries += 1                          # it wandered off a step: follow it
				walk_to = route(me.tile, _stand_by(meet_after.tile))
				if walk_to.is_empty():
					meet_after = null
			else:
				meet_after = null
	_check_doors()
	for r in restore:
		r.r = move_toward(r.r, r.goal, dt * 70.0)
	cam.position = cam.position.lerp(me.pos + Vector2(8, 8), min(1.0, dt * 8.0))
	_update_ui()
	queue_redraw()
	colour_layer.queue_redraw()
	canopy.queue_redraw()

func _step(d: Vector2i) -> void:
	me.face = d
	me.right = d.x > 0 if d.x != 0 else me.right
	if map_name == "larkhaven" and stage == "free" and DOORS.has(me.tile + d):
		_go(DOORS[me.tile + d])                  # walking up to a door goes in: the inn and the shop are rooms
		return
	var was := me.tile
	var aside := _gentle_at(me.tile + d)
	if aside:
		aside.tile = was                         # your partner (or the pup, or a ranch creature) steps aside, swapping places
		aside.pos = Vector2(was) * TILE
		aside.path.clear()
	if walkable(me.tile + d):
		me.path = [me.tile + d]
		if partner and partner.where == map_name and partner.tile != was and (aside == null or aside == partner):
			_stop(partner)
			partner.path = [was]

func _walk(m: Mover, dt: float) -> void:
	if m.path.is_empty():
		return
	var nxt: Vector2i = m.path[0]
	var goal := Vector2(nxt) * TILE
	m.face = nxt - m.tile
	if goal.x != m.pos.x:
		m.right = goal.x > m.pos.x
	m.pos = m.pos.move_toward(goal, dt * m.speed * TILE)
	m.step_t += dt
	if m.pos.distance_to(goal) < 0.01:
		m.tile = nxt
		m.path.pop_front()
		if m == me:
			_arrived(nxt)
			_check_spotted()

func _unhandled_input(e: InputEvent) -> void:
	if Controls.pressed(e, "toggle_music"):
		music_on = not music_on                  # M: music on or off
		get_viewport().set_input_as_handled()
		return
	if Controls.pressed(e, "toggle_sound"):
		sfx.on = not sfx.on                      # N: sound effects on or off
		get_viewport().set_input_as_handled()
		return
	var want_book: bool = Controls.pressed(e, "open_book") or (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT and satchel.visible and satchel.get_global_rect().has_point(satchel.get_global_mouse_position()))
	if lessons.visible: return
	if want_book and stage == "free" and lines.is_empty() and not battle.visible and not shop.visible and not book.visible:
		_open_book()
		get_viewport().set_input_as_handled()
		return
	var pressed: bool = (Controls.pressed(e, "interact") or (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT))
	if not pressed:
		return
	if not lines.is_empty():
		advance()
	elif stage == "free" and not (e is InputEventMouseButton) and not battle.visible and _talk_here():
		pass
	elif stage == "free" and not (e is InputEventMouseButton) and not lessons.visible and not card.visible and _festival_here():
		pass
	elif stage == "free" and not (e is InputEventMouseButton) and not lessons.visible and not card.visible and _near_trough():
		_feed()
	elif stage == "free" and not (e is InputEventMouseButton) and not lessons.visible and not card.visible and _near_stall():
		_breed_here()
	elif stage == "free" and not (e is InputEventMouseButton) and not lessons.visible and not card.visible and _near_bench():
		_open_bench()
	elif stage == "free" and not (e is InputEventMouseButton) and not lessons.visible and not card.visible and not shop.visible and _near_keeper() != "":
		_keeper_talk(_near_keeper())
	elif stage == "free" and maren.where == map_name and (me.tile - maren.tile).length() <= 1.01 and not (e is InputEventMouseButton and Vector2i((get_global_mouse_position() / TILE).floor()) != maren.tile):
		_maren_heals()
	elif e is InputEventMouseButton:
		_tap(get_global_mouse_position())
	elif stage == "barn_choose" and not lessons.visible and not card.visible:
		var s := _starter_beside_me()
		if s:
			_meet(s)

## Click or tap: walk there (around anything in the way). Tap a creature in the barn to walk up and meet it.
func _tap(at: Vector2) -> void:
	if not (stage in ["to_barn", "barn_choose", "walk_out", "free"] and not lessons.visible and not card.visible and not battle.visible and not shop.visible and not book.visible and trans_t < 0.0):
		return
	var goal := Vector2i((at / TILE).floor())
	meet_after = null
	if stage == "barn_choose":
		for s in starters:
			if s.where == map_name and s.tile == goal:
				if (me.tile - goal).length() <= 1.01:
					_meet(s)
					return
				meet_after = s
				meet_tries = 0
				goal = s.tile + Vector2i.DOWN          # stand in front of its stall
	if stage == "free":
		for m in ranch_movers:
			if m.where == map_name and (m.tile == goal or (not m.path.is_empty() and m.path[0] == goal)):   # (it may be mid-step)
				if (me.tile - goal).length() <= 1.01:
					_visit(m)
					return
				meet_after = m
				meet_tries = 0
				goal = _stand_by(m.tile)               # walk up beside it
	if goal == me.tile:
		return
	var r := route(me.tile, goal)
	if r.is_empty() or not (walkable(goal) or (partner and goal == partner.tile) or goal == BARN_DOOR or goal == BARN_EXIT):
		meet_after = null
		return
	walk_to = r

func _starter_beside_me() -> Mover:
	for s in starters:
		if s.where == map_name and (me.tile - s.tile).length() <= 1.01:
			return s
	return null

# ---------------------------------------------------------------- meeting and choosing your partner
func _meet(s: Mover) -> void:
	me.face = s.tile - me.tile
	s.right = me.pos.x > s.pos.x
	card.open(s.id, card_info(s.id))

## A starter's page, from the browser game's data: the same names, stats, moves and matchups in both versions.
func card_info(id: String) -> Dictionary:
	var s: Dictionary = DATA.SPECIES[id]
	var moves: Array = []
	for l in s.learn:
		if l[0] <= 5:
			moves.append(DATA.MOVES[l[1]].name)
	var weak: String = DATA.COUNTER[id]
	var strong := ""
	for k in DATA.COUNTER:
		if DATA.COUNTER[k] == id:
			strong = k
	return {
		"name": s.name, "el": s.el, "dex": s.dex, "base": s.base, "moves": moves, "look": CREATURE_LOOKS[id],
		"strong": "%s (%s)" % [DATA.SPECIES[strong].el, DATA.SPECIES[strong].name],
		"weak": "%s (%s)" % [DATA.SPECIES[weak].el, DATA.SPECIES[weak].name],
		"role": role_of(s.base), "maren": MAREN_ON.get(id, ""),
	}

## The same role words as the browser game (games/wildbond/js/05-ui.js roleOf).
func role_of(b: Dictionary) -> String:
	var tough: float = (b.hp + b.grd + b.spi) / 3.0
	var hit: float = maxf(b.pow, b.wit)
	var phys: bool = b.pow >= b.wit
	var r: Array
	if tough > hit + 8: r = ["Tank", "tough and hard to wear down"]
	elif b.spd >= hit and b.spd > tough: r = ["Skirmisher", "quick, gets more turns"]
	elif hit > tough + 8: r = ["Bruiser", "hits hard up close"] if phys else ["Caster", "strong elemental moves"]
	else: r = ["All-rounder", "balanced"]
	return "%s: %s. Attacks mostly with %s." % [r[0], r[1], "physical moves (Power)" if phys else "special, elemental moves (Wits)"]

func _on_chosen(id: String) -> void:
	# the bond: you kneel, it chooses you back, and colour bursts out of it across the barn
	for s in starters:
		if s.id == id:
			partner = s
	partner.home = Rect2i()
	team = [R.make(id, 5, { "rar": 1 }, rng)]           # level 5, like the browser game's first partner
	rival_c = R.make(DATA.COUNTER[id], 4, { "rar": 1 }, rng)   # Wren takes the one that beats yours
	stage = "bonded"
	caption.text = ""
	_stop(partner)
	restore.append({ "where": "barn", "at": partner.pos + Vector2(8, 8), "r": 0.0, "goal": 170.0 })
	var n: String = DATA.SPECIES[id].name
	say("", "You kneel in the straw. %s looks at you for a long moment, then steps forward and presses its head into your hand." % n)
	say("", "Colour floods out from it: gold straw, red beams, a blue sky in the high window.")
	say("maren", "...There. It chose you right back. And the world remembered a little.")
	say("maren", "Nobody owns a creature, love; they choose. The other two will find their tamers. Wren's due by later, and that one never could wait.")
	say("maren", "Off you go, then. Show %s the valley." % n)

# ---------------------------------------------------------------- young creatures: each with a mind of its own
## They potter about their home ground (the paddock, a stall): wander, sniff, sit, and stalk the butterfly. When you
## come near they stop and watch you, ears up and tails going. Your partner follows you and does the same things
## whenever you stand still. Ripplet blows bubbles instead of sniffing; Mosshog sometimes has a finch on its back.
func _stop(m: Mover) -> void:
	m.act = "idle"
	m.act_t = 0.0
	m.act_len = 1.0
	m.hop = 0.0
	m.speed = 4.0

func _think(m: Mover, dt: float) -> void:
	m.act_t += dt
	if m == partner and stage == "bonded":
		m.hop = -abs(sin(t * 6.0)) * 3.0           # it hops for joy
		return
	if m.act != "pounce":
		m.hop = 0.0
	# straight behind you it would peek over your head like a hat: when you stop, it comes round to stand beside you
	if m == partner and m.path.is_empty() and me.path.is_empty() and walk_to.is_empty() and m.tile == me.tile + Vector2i.UP and m.act_t > 0.5:
		for side in [Vector2i.RIGHT if m.right else Vector2i.LEFT, Vector2i.LEFT if m.right else Vector2i.RIGHT]:
			if walkable(m.tile + side) and walkable(me.tile + side):
				m.path = [m.tile + side, me.tile + side]
				m.right = side.x < 0                     # it turns to face you
				return
	if m.act == "pounce":
		# crouch and wiggle, then leap one tile at the butterfly (or on the spot)
		if m.act_t >= 0.8 and m.path.is_empty() and m.target != m.tile and walkable(m.target):
			m.speed = 3.0
			m.path = [m.target]
			m.target = m.tile
			fly_scare = 2.0
		var k := clampf((m.act_t - 0.8) / 0.4, 0.0, 1.0)
		m.hop = -sin(k * PI) * 6.0
		if m.act_t > 1.5:
			_stop(m)
		return
	if not m.path.is_empty():
		return
	var near := (Vector2(me.tile) - Vector2(m.tile)).length() <= (2.0 if map_name == "barn" else 3.0)
	if m != partner and near and stage not in ["intro", "maren_walks"]:
		m.act = "curious"                          # it has seen you: it stops and watches
		m.right = me.pos.x > m.pos.x
		return
	if m.act == "curious":
		_stop(m)
	if m.act_t < m.act_len:
		return
	var r := rng.randf()
	m.act_t = 0.0
	var fly_tile := Vector2i((fly / TILE).floor())
	if r < 0.3 and m.home.has_area():
		var dirs := [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
		var to: Vector2i = m.tile + dirs[rng.randi() % 4]
		m.act = "idle"
		m.act_len = rng.randf_range(0.6, 1.6)
		if m.home.has_point(to) and walkable(to):
			m.path = [to]
	elif r < 0.5:
		m.act = "sniff"
		m.act_len = rng.randf_range(1.5, 3.0)
	elif r < 0.65:
		m.act = "sit"
		m.act_len = rng.randf_range(2.5, 4.5)
	elif r < 0.9 and m.look.kind == "wolf" and (Vector2(fly_tile) - Vector2(m.tile)).length() <= 3.0:
		m.act = "pounce"
		m.act_len = 1.5
		m.right = fly.x > m.pos.x + 8
		m.target = m.tile + Vector2i(signi(fly_tile.x - m.tile.x), 0)
		if not m.home.has_area() or not m.home.has_point(m.target):
			m.target = m.tile                      # it pounces on the spot
	else:
		m.act = "idle"
		m.act_len = rng.randf_range(1.0, 2.5)

func _butterfly(dt: float) -> void:
	# a butterfly over the paddock (a moth by the barn window), fluttering up and away whenever someone leaps at it
	fly_scare = max(0.0, fly_scare - dt)
	var home := Vector2(PADDOCK.position) * TILE + Vector2(PADDOCK.size) * TILE * 0.5
	if map_name == "barn":
		home = Vector2(8.5, 3.2) * TILE
	if partner and partner.where == map_name and map_name == "larkhaven":
		home = me.pos + Vector2(8, -10)
	var goal := home + Vector2(sin(t * 0.7) * 30.0, cos(t * 1.1) * 8.0 - 4.0 - fly_scare * 10.0)
	if map_name == "barn":
		goal = home + Vector2(sin(t * 1.3) * 14.0, cos(t * 1.7) * 6.0 - fly_scare * 8.0)
	fly = goal if fly == Vector2.ZERO else fly.lerp(goal, min(1.0, dt * 1.5))
	if INTERIORS.has(map_name):
		fly = Vector2(-100, -100)                    # no butterflies indoors

func _bubbles(dt: float) -> void:
	bubble_cd -= dt
	for m in actors():
		if m.is_creature() and m.look.kind == "lizard" and (m.act == "sniff" or (m == partner and stage == "bonded")) and bubble_cd <= 0.0:
			bubbles.append({ "p": m.pos + Vector2(15.0 if m.right else 0.0, 7.0 + m.hop), "t": 0.0, "where": map_name })
			bubble_cd = 0.35
	for b in bubbles:
		b.t += dt
		b.p += Vector2(sin(b.t * 6.0) * 0.3, -dt * 9.0)
	bubbles = bubbles.filter(func(b): return b.t < 1.6)

# ---------------------------------------------------------------- the demo (for screenshots: run with -- --demo)
func _demo(dt: float) -> void:
	demo_t += dt
	if demo_t < 1.2:
		return
	demo_t = 0.0
	if stage == "register":
		register.demo_step()
	elif card.visible:
		if card.sel != 0:
			card.sel = 0                           # look at the page for a moment, move to "Choose", then choose
		else:
			card._close(true)
	elif not lines.is_empty():
		advance()
	elif stage == "to_barn" and me.path.is_empty() and trans_t < 0.0:
		me.path = route(me.tile, BARN_DOOR)
	elif stage == "barn_choose" and me.path.is_empty():
		var goal := Vector2i(12, 5)                # in front of Ripplet's stall
		if me.tile == goal:
			me.face = Vector2i.UP
			_meet(_starter_beside_me())
		else:
			me.path = route(me.tile, goal)
	elif stage == "walk_out" and map_name == "barn" and me.path.is_empty():
		me.path = route(me.tile, BARN_EXIT)
	elif stage == "free" and me.path.is_empty() and walk_to.is_empty() and trans_t < 0.0:
		# out to Thornwood, then up and down the tall grass until something turns up
		if map_name == "larkhaven":
			walk_to = route(me.tile, Vector2i(10, 0))
		elif map_name == "thornwood":
			var grass := [Vector2i(9, 7), Vector2i(9, 11), Vector2i(4, 11), Vector2i(4, 3)]
			walk_to = route(me.tile, grass[demo_leg % grass.size()])
			demo_leg += 1

# ---------------------------------------------------------------- drawing
func _draw() -> void:
	if map_name == "barn":
		_draw_barn()
	elif INTERIORS.has(map_name):
		_draw_room()
	else:
		_draw_outdoor()
	# items lying on the ground: a little cloth pouch, tied at the top
	if not indoors():
		for it in DATA.MAPS[map_name].get("items", []):
			if not got_items.has(it.id):
				var io := Vector2(float(it.at[0]), float(it.at[1])) * TILE + Vector2(4, 5 + sin(t * 2.0 + float(it.at[0])) * 0.5)
				draw_rect(Rect2(io + Vector2(0, 2), Vector2(8, 8)), Figures.OUTLINE)
				draw_rect(Rect2(io + Vector2(1, 3), Vector2(6, 6)), Color("c8925a"))
				draw_rect(Rect2(io + Vector2(2, 0), Vector2(4, 3)), Figures.OUTLINE)
				draw_rect(Rect2(io + Vector2(3, 1), Vector2(2, 2)), Color("e0b070"))
				draw_rect(Rect2(io + Vector2(2, 3), Vector2(4, 1)), Color("8a5a2a"))
	# people and creatures, back to front; you (once signed) and your partner are drawn in colour on their own layer
	var list := actors()
	list.sort_custom(func(a, b): return a.pos.y < b.pos.y)
	for i in list.size():
		var m: Mover = list[i]
		draw_rect(Rect2(m.pos + Vector2(3, 14), Vector2(10, 2)), Color(0, 0, 0, 0.25))   # a soft shadow
		if not _is_painted(m):
			_draw_actor(self, m, i)
	if map_name == "emberfall":
		_draw_steam()
		_draw_embers()
	if map_name == "cloudglass":
		_draw_clouds()
	if map_name == "stillreed":
		_draw_dragonflies()
	if map_name == "farwatch":
		_draw_shore_lights()
	_season_air()
	if map_name == "hollowecho":
		_draw_bells()
		_draw_mist()
	if spotter and spot_t < 0.9:
		# the "!" over a trainer who has just seen you
		draw_texture(NOTICE, spotter.pos + Vector2(1, -20 - minf(spot_t * 20.0, 4.0)))   # the pack's bubble, as in Starfall
	if map_name == "barn":
		_draw_barn_light()
	# the butterfly (or moth) and Ripplet's bubbles
	var flap := int(t * 12.0) % 2 == 0
	var wing := Vector2(3, 3) if flap else Vector2(1, 3)
	var wcol := Color("f2d24a") if map_name == "larkhaven" else Color("e8dcc0")
	draw_rect(Rect2(fly + Vector2(-wing.x - 1, -1), wing + Vector2(2, 2)), Figures.OUTLINE)
	draw_rect(Rect2(fly + Vector2(0, -1), wing + Vector2(2, 2)), Figures.OUTLINE)
	draw_rect(Rect2(fly + Vector2(-wing.x, 0), wing), wcol)
	draw_rect(Rect2(fly + Vector2(1, 0), wing), wcol)
	draw_rect(Rect2(fly + Vector2(0, -1), Vector2(1, 4)), Color("3a2a1a"))
	for b in bubbles:
		if b.where == map_name:
			var a: float = 1.0 - b.t / 1.6
			draw_arc(b.p, 1.5 + b.t, 0, TAU, 10, Color(0.85, 0.95, 1.0, a), 1.0)

func _draw_outdoor() -> void:
	var rows: Array = cur_map()
	# 1. the ground (Ninja Adventure tiles, CC0): grass everywhere, dirt on paths, flowers here and there
	for y in rows.size():
		for x in rows[0].length():
			_draw_ground(x, y, rows[y][x])
	_season_ground(rows)
	# 2. fences and the signpost (drawn in code; they already looked right)
	for y in rows.size():
		for x in rows[0].length():
			if rows[y][x] in "=Pjq":
				_draw_tile(x, y, rows[y][x])
	_draw_flowers()
	if map_name == "stillreed":
		_draw_basin()
	if map_name == "hollowecho":
		_draw_hills()
	if map_name == "sunthread":
		_draw_commons()
	if map_name == "farwatch":
		_draw_harbor()
	# 3. houses, the barn and trees: standing objects with a footprint (so a 3D renderer can stand them up later)
	_draw_structures()

func _is_painted(m: Mover) -> bool:
	return (m == me and painted) or (m == partner)

func _draw_painted() -> void:
	# the colour layer sits above the faded world, so whatever is drawn here keeps its colour everywhere
	var list := actors().filter(func(m): return _is_painted(m))
	list.sort_custom(func(a, b): return a.pos.y < b.pos.y)
	for m in list:
		_draw_actor(colour_layer, m, 0)
	# true depth: anyone standing in front of you (lower on the screen, overlapping) is drawn again on top, faded just
	# as the world is faded where they stand, so the colour layer never puts you in front of them
	for o in actors():
		if _is_painted(o):
			continue
		for m in list:
			if o.pos.y > m.pos.y + 0.5 and absf(o.pos.x - m.pos.x) < 15.0 and o.pos.y - m.pos.y < 26.0:
				_draw_actor(colour_layer, o, 0, 1.0 - _restored_at(o.pos + Vector2(8, 8)))
				break

## The big trees: which picture (two kinds) and where it stands, staggered half a tile off the grid so the edge reads as
## woods. Edge rows sit low so they never hide the town.
func _tree_cell(x: int, y: int) -> Vector2i:
	return Vector2i(0 if (x * 3 + y) % 4 < 2 else 2, 0)

func _tree_at(x: int, y: int) -> Vector2:
	var above := Vector2i(x, y - 1)
	if tile_at(above) == "T":
		return Vector2(x - 0.5, y - 1.5) * TILE
	# a tree at the edge of open ground stands at its true height (its crown over the tile above, and over you when
	# you walk behind it: _draw_canopy), but never over a sign or something lying on the ground
	var open: bool = tile_at(above) in [",", "\"", "."] and not DATA.MAPS.get(map_name, {}).get("items", []).any(func(it): return Vector2i(int(it.at[0]), int(it.at[1])) == above)
	return Vector2(x - 0.5, y - (1.0 if open else 0.25)) * TILE

## Depth (WB2.2): when you or your partner walk behind a tree, its top passes in front of you, a little see-through
## so you never lose yourself. Faded by the same rule as the world (shaders/canopy.gdshader).
func _draw_canopy() -> void:
	if indoors():
		return
	var rows: Array = cur_map()
	for m in actors():
		if not _is_painted(m):
			continue
		var body: Rect2 = Rect2(m.pos + Vector2(2, -6), Vector2(12, 22))
		var feet: float = m.pos.y + 16.0
		var x0: int = maxi(0, int(m.pos.x / TILE) - 2)
		var y0: int = maxi(0, int(m.pos.y / TILE) - 1)
		for y in range(y0, mini(rows.size(), y0 + 4)):
			for x in range(x0, mini(rows[0].length(), x0 + 5)):
				if rows[y][x] != "T" or (x + y) % 2 != 0:
					continue
				var r := Rect2(_tree_at(x, y), Vector2(32, 32))
				if r.end.y - 3.0 > feet and r.intersects(body):
					var tint := _leaf_tint()
					canopy.draw_texture_rect_region(NATURE, r, Rect2(Vector2(_tree_cell(x, y)) * 16.0, Vector2(32, 32)), Color(tint.r, tint.g, tint.b, 0.72))
## How much colour has come back at a point in the world (0 faded, 1 restored), as the fade shader computes it.
func _restored_at(p: Vector2) -> float:
	if INTERIORS.has(map_name) and spilled:
		return 1.0
	var best := 0.0
	for r in restore:
		if r.where == map_name and float(r.r) > 0.0:
			best = maxf(best, 1.0 - smoothstep(float(r.r) * 0.8, float(r.r), p.distance_to(r.at)))
	return best

## A look with every colour washed out the way the fade shader does it (amount 0 = untouched, 1 = fully faded).
func _faded_look(look: Dictionary, amount: float) -> Dictionary:
	if amount <= 0.0:
		return look
	var out := {}
	var fade: float = 0.78 * amount
	for k in look:
		var v = look[k]
		if v is Color:
			var g: float = v.r * 0.299 + v.g * 0.587 + v.b * 0.114
			out[k] = Color(lerpf(v.r, g * 1.03, fade), lerpf(v.g, g, fade), lerpf(v.b, g * 0.92, fade), v.a)
		else:
			out[k] = v
	return out
	if paint_t >= 0.0 and paint_t < 1.4:
		# the ink sparkles outward as you're painted in
		var cols := [my_look.shirt, my_look.hair, my_look.legs, Color("f2d24a")]
		for k in 12:
			var a := k * TAU / 12.0 + paint_t
			var d := 4.0 + paint_t * 18.0
			var c: Color = cols[k % 4]
			c.a = 1.0 - paint_t / 1.4
			colour_layer.draw_rect(Rect2(me.pos + Vector2(8, 6) + Vector2(cos(a), sin(a)) * d, Vector2(1, 1)), c)

func _draw_actor(ci: CanvasItem, m: Mover, i: int, fade_amt := 0.0) -> void:
	var walking := not m.path.is_empty()
	if m.is_creature():
		var happy: bool = m.act == "curious" or (m == partner and stage == "bonded")
		var pose := {
			"walking": walking, "frame": int(m.step_t * 10.0) % 4, "blink": fmod(t + m.pos.x * 0.01, 2.9) < 0.12,
			"wag": [1, 0, -1, 0][int(t * (14.0 if happy else 6.0)) % 4],
			"sniff": m.act == "sniff" and m.look.kind != "lizard", "twitch": (int(t * 12.0) % 2) if m.act == "sniff" else 0,
			"sit": m.act == "sit", "ears_up": m.act in ["curious", "pounce"] or happy,
			"crouch": (2 if m.act_t < 0.8 else 0) if m.act == "pounce" else 0,
			"bird": m.look.kind == "boar" and not walking and fmod(t + 3.0, 16.0) < 10.0,
		}
		var wiggle := (1.0 if int(t * 16.0) % 2 == 0 else -1.0) if m.act == "pounce" and m.act_t > 0.4 and m.act_t < 0.8 else 0.0
		Figures.creature(ci, m.pos + Vector2(-1 + wiggle, 4 + m.hop), m.right, pose, _faded_look(m.look, fade_amt))
		return
	var face := m.face
	if not walking and face == Vector2i.DOWN and fmod(t + i, 6.0) > 5.2:
		face = Vector2i.LEFT if int(t + i) % 2 == 0 else Vector2i.RIGHT   # a glance around while standing
	var look: Dictionary = my_look if m == me else (LOOKS[m.id] if LOOKS.has(m.id) else (KEEPER_LOOKS[m.id] if KEEPER_LOOKS.has(m.id) else _cast_look(m.id)))
	Figures.person(ci, m.pos + Vector2(2, -5), face, walking, int(m.step_t * 8.0) % 4, fmod(t + i * 1.7, 3.3) < 0.12, _faded_look(look, fade_amt))

# ---------------------------------------------------------------- inside the barn (drawn in code: warm wood and straw)
const WOOD := Color("7a5236")
const WOOD_DARK := Color("4e3220")
const WOOD_LIGHT := Color("a07048")
const STRAW := Color("e0c068")

func _draw_barn() -> void:
	var w := BARN[0].length()
	draw_rect(Rect2(0, 0, w * TILE, BARN.size() * TILE), Color("16100c"))
	for y in BARN.size():
		for x in w:
			var ch: String = BARN[y][x]
			var o: Vector2 = Vector2(x, y) * TILE
			var n := (x * 7 + y * 13) % 11
			if ch in ",h|tbdw":
				_boards(o, x, y)
				if y <= 4 and ch == "," and ((x > 6 and x < 18) or BREED_STALL.has_point(Vector2i(x, y))):      # straw bedding in the stalls
					draw_rect(Rect2(o + Vector2(0, 1 if y == 3 else 0), Vector2(16, 15 if y == 3 else 12)), STRAW.darkened(0.35))
					for k in 9:
						draw_rect(Rect2(o + Vector2((n * 3 + k * 5) % 13, (k * 7 + n) % 14), Vector2(3, 1)), STRAW.darkened(0.12 * (k % 2)))
				elif n == 3:
					draw_rect(Rect2(o + Vector2(4, 9), Vector2(3, 1)), STRAW)          # a stray wisp
			if ch == "W":
				draw_rect(Rect2(o, Vector2(16, 16)), WOOD)
				for k in 4:
					draw_rect(Rect2(o + Vector2(k * 4, 0), Vector2(1, 16)), WOOD_DARK)   # boards
				if y == 2:
					draw_rect(Rect2(o + Vector2(0, 13), Vector2(16, 3)), WOOD_DARK)   # the skirting beam
				if y == 1:
					draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 3)), WOOD_LIGHT)    # the cross beam
				if y == BARN.size() - 2:
					draw_rect(Rect2(o, Vector2(16, 3)), WOOD_LIGHT)                  # the front wall's top edge
			match ch:
				"h": _bale(o)
				"|": _stall_board(o, x, y)
				"t": _trough(o)
				"b": _sacks(o)
				"w": _bench(o)
				"d":
					draw_rect(Rect2(o + Vector2(1, 0), Vector2(14, 16)), Color("2a1c12"))
					draw_rect(Rect2(o + Vector2(1, 9), Vector2(14, 7)), Color("6a9a48").darkened(0.2))   # grass outside
	# the side walls: posts that hold the roof up
	for x in [0, w - 1]:
		draw_rect(Rect2(Vector2(x * TILE + (10 if x == 0 else 0), TILE), Vector2(6, (BARN.size() - 2) * TILE)), WOOD_DARK)
		draw_rect(Rect2(Vector2(x * TILE + (12 if x == 0 else 1), TILE), Vector2(2, (BARN.size() - 2) * TILE)), WOOD)
	# the windows high on the back wall, a ladder to the loft, tools on their pegs
	for wx in BARN_WINDOWS:
		var o := Vector2(wx, 1) * TILE + Vector2(2, 6)
		draw_rect(Rect2(o - Vector2(1, 1), Vector2(14, 12)), WOOD_DARK)
		draw_rect(Rect2(o, Vector2(12, 10)), Color("a8d0ea"))
		draw_rect(Rect2(o + Vector2(0, 7), Vector2(12, 3)), Color("8ab86a"))      # the hills outside
		draw_rect(Rect2(o + Vector2(5, 0), Vector2(1, 10)), WOOD_DARK)
	var lad := Vector2(4, 1) * TILE + Vector2(3, 0)
	draw_rect(Rect2(lad, Vector2(2, 32)), WOOD_LIGHT)
	draw_rect(Rect2(lad + Vector2(8, 0), Vector2(2, 32)), WOOD_LIGHT)
	for k in 6:
		draw_rect(Rect2(lad + Vector2(0, 3 + k * 5), Vector2(10, 1)), WOOD_LIGHT.darkened(0.15))
	var pegs := Vector2(20, 1) * TILE + Vector2(2, 8)
	draw_rect(Rect2(pegs, Vector2(1, 20)), Color("8a8a8a"))                      # a pitchfork
	draw_rect(Rect2(pegs + Vector2(-2, 0), Vector2(5, 1)), Color("8a8a8a"))
	draw_rect(Rect2(pegs + Vector2(-2, -4), Vector2(1, 4)), Color("8a8a8a")); draw_rect(Rect2(pegs + Vector2(2, -4), Vector2(1, 4)), Color("8a8a8a"))
	draw_rect(Rect2(pegs + Vector2(7, 2), Vector2(8, 7)), Color("6a4a2a"))      # a coil of rope
	draw_rect(Rect2(pegs + Vector2(9, 4), Vector2(4, 3)), WOOD_DARK)
	# the name boards over the stalls, chalked with each name
	for i in starters.size():
		var s: Mover = starters[i]
		var o := Vector2(7 + i * 4, 2) * TILE + Vector2(9, 4)          # over its stall, even after it leaves with you
		draw_rect(Rect2(o - Vector2(1, 1), Vector2(32, 10)), Figures.OUTLINE)
		draw_rect(Rect2(o, Vector2(30, 8)), Color("2e3a32"))
		var nm: String = DATA.SPECIES[s.id].name
		draw_string(ThemeDB.fallback_font, o + Vector2(0, 7), nm, HORIZONTAL_ALIGNMENT_CENTER, 30, 6, Color("e8e4d8"))
	# the breeding stall's board, and an egg in its straw when there is one
	var bo := Vector2(BREED_STALL.position) * TILE + Vector2(9, -12)
	draw_rect(Rect2(bo - Vector2(1, 1), Vector2(32, 10)), Figures.OUTLINE)
	draw_rect(Rect2(bo, Vector2(30, 8)), Color("2e3a32"))
	draw_string(ThemeDB.fallback_font, bo + Vector2(0, 7), "Nursery", HORIZONTAL_ALIGNMENT_CENTER, 30, 6, Color("e8e4d8"))
	if not egg.is_empty():
		var eo := Vector2(BREED_STALL.position + Vector2i(1, 1)) * TILE + Vector2(4, 3)
		draw_rect(Rect2(eo + Vector2(-2, 9), Vector2(12, 3)), STRAW.darkened(0.2))   # its nest
		draw_rect(Rect2(eo + Vector2(1, -1), Vector2(6, 12)), Figures.OUTLINE)
		draw_rect(Rect2(eo + Vector2(0, 1), Vector2(8, 9)), Figures.OUTLINE)
		draw_rect(Rect2(eo + Vector2(2, 0), Vector2(4, 10)), Color("f4ecd8"))
		draw_rect(Rect2(eo + Vector2(1, 2), Vector2(6, 7)), Color("f4ecd8"))
		draw_rect(Rect2(eo + Vector2(2, 3), Vector2(1, 1)), Color("c89a6a")); draw_rect(Rect2(eo + Vector2(5, 6), Vector2(1, 1)), Color("c89a6a"))
		draw_rect(Rect2(eo + Vector2(3, 7), Vector2(1, 1)), Color("c89a6a"))
	# a lantern on the post by the door
	var lo := Vector2(13, 11) * TILE + Vector2(4, 2)
	draw_rect(Rect2(lo - Vector2(1, 1), Vector2(6, 8)), Figures.OUTLINE)
	draw_rect(Rect2(lo, Vector2(4, 6)), Color("f2c050"))
	draw_rect(Rect2(lo + Vector2(1, -4), Vector2(2, 3)), Color("3a3a3a"))

const BARN_WINDOWS := [6, 16]

func _draw_barn_light() -> void:
	# light falling from the high windows, and the lantern's glow (drawn over everything, soft)
	for wx in BARN_WINDOWS:
		var a := Vector2(wx, 1) * TILE + Vector2(2, 16)
		var poly := PackedVector2Array([a, a + Vector2(12, 0), a + Vector2(30, 70), a + Vector2(8, 70)])
		draw_colored_polygon(poly, Color(1.0, 0.95, 0.75, 0.10))
		for k in 3:                                                                # dust in the light
			var dp := a + Vector2(10 + k * 6 + sin(t * 0.7 + k) * 4.0, fmod(t * 4.0 + k * 23.0, 64.0))
			draw_rect(Rect2(dp, Vector2(1, 1)), Color(1, 1, 0.9, 0.35))
	var lo := Vector2(13, 11) * TILE + Vector2(6, 5)
	for k in 3:
		draw_circle(lo, 10.0 + k * 9.0 + sin(t * 3.0) * 1.5, Color(1.0, 0.8, 0.4, 0.05))

## Floorboards: three boards to a tile, with seams, a lighter top edge, joints staggered from row to row, and nails.
func _boards(o: Vector2, x: int, y: int) -> void:
	var base := Color("8a6440")
	draw_rect(Rect2(o, Vector2(16, 16)), base)
	for k in 3:
		var by := k * 5 + 1
		var shade := base.darkened(0.04 * ((k + y) % 3))
		draw_rect(Rect2(o + Vector2(0, by), Vector2(16, 4)), shade)
		draw_rect(Rect2(o + Vector2(0, by), Vector2(16, 1)), shade.lightened(0.1))
		draw_rect(Rect2(o + Vector2(0, by + 4), Vector2(16, 1)), base.darkened(0.35))
		var jx := (k * 29 + y * 53 + 7) % 48                    # where this board ends and the next begins
		if jx >= (x % 3) * 16 and jx < (x % 3) * 16 + 16:
			draw_rect(Rect2(o + Vector2(jx % 16, by), Vector2(1, 4)), base.darkened(0.35))
			draw_rect(Rect2(o + Vector2(jx % 16 + 2, by + 2), Vector2(1, 1)), Color("4a3a2a"))

func _sacks(o: Vector2) -> void:
	for k in 2:
		var s := o + Vector2(1 + k * 7, 3 - k * 2)
		draw_rect(Rect2(s, Vector2(8, 12)), Figures.OUTLINE)
		draw_rect(Rect2(s + Vector2(1, 1), Vector2(6, 10)), Color("d8c8a0"))
		draw_rect(Rect2(s + Vector2(2, 1), Vector2(4, 1)), Color("a89870"))
		draw_rect(Rect2(s + Vector2(2, 5), Vector2(4, 2)), Color("7a8a4a"))      # a stencilled leaf

func _bale(o: Vector2) -> void:
	draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 13)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(1, 3), Vector2(14, 11)), STRAW)
	draw_rect(Rect2(o + Vector2(1, 3), Vector2(14, 2)), STRAW.lightened(0.2))
	draw_rect(Rect2(o + Vector2(4, 3), Vector2(1, 11)), Color("a07838"))
	draw_rect(Rect2(o + Vector2(11, 3), Vector2(1, 11)), Color("a07838"))

func _stall_board(o: Vector2, x: int, y: int) -> void:
	var top: bool = BARN[y - 1][x] != "|"
	draw_rect(Rect2(o + Vector2(5, -6 if top else 0), Vector2(6, 22 if top else 16)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(6, -5 if top else 0), Vector2(4, 21 if top else 16)), WOOD_LIGHT)
	draw_rect(Rect2(o + Vector2(6, 4), Vector2(4, 1)), WOOD_DARK)
	draw_rect(Rect2(o + Vector2(6, 11), Vector2(4, 1)), WOOD_DARK)


## Maren's workbench (the left wall of the barn): leather, cord, shells and glass, and the tools to make gear with.
func _bench(o: Vector2) -> void:
	draw_rect(Rect2(o + Vector2(10, 2), Vector2(6, 14)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(11, 3), Vector2(5, 12)), WOOD_LIGHT)                   # the bench top, seen from above
	draw_rect(Rect2(o + Vector2(11, 3), Vector2(5, 1)), WOOD_LIGHT.lightened(0.2))
	draw_rect(Rect2(o + Vector2(12, 5), Vector2(3, 2)), Color("8a5a32"))              # a strip of leather
	draw_rect(Rect2(o + Vector2(12, 9), Vector2(2, 2)), Color("e8c040"))              # a little bell
	draw_rect(Rect2(o + Vector2(14, 12), Vector2(1, 2)), Color("6ab0e8"))             # a shell
	draw_rect(Rect2(o + Vector2(2, 4), Vector2(6, 1)), Color("8a8a8a"))               # an awl and a knife on pegs
	draw_rect(Rect2(o + Vector2(2, 8), Vector2(5, 1)), Color("8a8a8a"))
func _trough(o: Vector2) -> void:
	draw_rect(Rect2(o + Vector2(0, 4), Vector2(16, 11)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(1, 5), Vector2(14, 9)), WOOD)
	draw_rect(Rect2(o + Vector2(2, 6), Vector2(12, 3)), Color("5a9ad0"))
	draw_rect(Rect2(o + Vector2(3, 6), Vector2(4, 1)), Color("a8d8f0"))

func _draw_tile(x: int, y: int, ch: String) -> void:
	var o := Vector2(x, y) * TILE
	match ch:
		"=":
			# fences join their neighbours: rails run across, down, or both at a corner, with a post in the middle
			var rail := Color("a0703a")
			var l := tile_at(Vector2i(x - 1, y)) == "=" or tile_at(Vector2i(x - 1, y)) == "."
			var r := tile_at(Vector2i(x + 1, y)) == "=" or tile_at(Vector2i(x + 1, y)) == "."
			var u := tile_at(Vector2i(x, y - 1)) == "="
			var d := tile_at(Vector2i(x, y + 1)) == "="
			if l or r or not (u or d):
				var x0 := 0 if l else 7
				var x1 := 16 if r else 9
				draw_rect(Rect2(o + Vector2(x0, 6), Vector2(x1 - x0, 2)), rail)
				draw_rect(Rect2(o + Vector2(x0, 10), Vector2(x1 - x0, 2)), rail)
			if u or d:
				var y0 := 0 if u else 6
				var y1 := 16 if d else 12
				draw_rect(Rect2(o + Vector2(6, y0), Vector2(1, y1 - y0)), rail)
				draw_rect(Rect2(o + Vector2(9, y0), Vector2(1, y1 - y0)), rail)
			draw_rect(Rect2(o + Vector2(6, 4), Vector2(4, 10)), Color("7a5028"))   # the post
			draw_rect(Rect2(o + Vector2(6, 4), Vector2(4, 1)), Color("b8885a"))
		"j":
			# Stillreed's ferry skiff, moored at the landing while its rope is mended: a shallow green hull, plank seats
			var hull := Color("344c3f")
			draw_rect(Rect2(o + Vector2(4, 2), Vector2(8, 2)), hull)
			draw_rect(Rect2(o + Vector2(2, 4), Vector2(12, 8)), hull)
			draw_rect(Rect2(o + Vector2(4, 12), Vector2(8, 2)), hull)
			draw_rect(Rect2(o + Vector2(4, 4), Vector2(8, 8)), Color("ae8553"))
			draw_rect(Rect2(o + Vector2(4, 4), Vector2(8, 1)), Color("d8b982"))
			draw_rect(Rect2(o + Vector2(4, 6), Vector2(8, 1)), Color("e0c28e"))         # the seats
			draw_rect(Rect2(o + Vector2(4, 10), Vector2(8, 1)), Color("e0c28e"))
			draw_rect(Rect2(o + Vector2(2, 4), Vector2(1, 8)), Color("57745b"))
			draw_rect(Rect2(o + Vector2(12, 2), Vector2(1, 10)), Color("cfa96d"))       # the oar
			draw_rect(Rect2(o + Vector2(11, 1), Vector2(3, 2)), Color("e0c28e"))
			draw_rect(Rect2(o + Vector2(7, 13), Vector2(1, 3)), Color("ded2a7"))        # the rope to the landing
			draw_rect(Rect2(o + Vector2(1, 14), Vector2(14, 1)), Color(1, 1, 1, 0.25))  # a ripple at the waterline
		"P", "q":
			# the ground underneath comes from the tileset (_draw_ground); the sign gets an outline so it reads on any ground
			draw_rect(Rect2(o + Vector2(6, 7), Vector2(4, 9)), Figures.OUTLINE)
			draw_rect(Rect2(o + Vector2(7, 7), Vector2(2, 8)), Color("6b4a2a"))
			draw_rect(Rect2(o + Vector2(1, 1), Vector2(14, 9)), Figures.OUTLINE)
			draw_rect(Rect2(o + Vector2(2, 2), Vector2(12, 7)), Color("d8a868"))
			draw_rect(Rect2(o + Vector2(2, 5), Vector2(12, 1)), Color("a0703a"))
			draw_rect(Rect2(o + Vector2(4, 3), Vector2(6, 1)), Color("6b4a2a"))
			draw_rect(Rect2(o + Vector2(4, 7), Vector2(8, 1)), Color("6b4a2a"))

# ---------------------------------------------------------------- the speech bubble, captions and the faded world
func _update_ui() -> void:
	var to_screen := get_viewport().get_canvas_transform()
	var line: Dictionary = lines[0] if not lines.is_empty() else {}
	bubble.visible = not line.is_empty() and trans_t < 0.0
	if bubble.visible:
		bubble_text.text = line.text + "   »"
		var who: Mover = null
		for m in [maren, wren] + npcs + keepers + guests:
			if line.who == m.id and m.where == map_name:
				who = m
		var w := 300.0 if settings.large_text() else 240.0
		bubble_text.custom_minimum_size.x = w - 12.0
		bubble.custom_minimum_size.x = w
		bubble.size = Vector2(w, 0)
		bubble.reset_size()
		if who:
			var p := to_screen * (Vector2(who.pos.x, min(who.pos.y, me.pos.y)) + Vector2(8, -6))   # above the speaker, never over you
			bubble.position = Vector2(clamp(p.x - w / 2, 4, 384 - w - 4), max(4, p.y - bubble.size.y - 6))
		else:
			bubble.position = Vector2((384 - w) / 2, 216 - bubble.size.y - 8)   # narration sits low, like a book's caption
	satchel.visible = _satchel_shown()
	satchel.queue_redraw()
	# the place's name, large on arrival: it holds for a few seconds, then fades (hidden while you talk or fight)
	place.modulate.a = 0.0 if battle.visible or book.visible else clampf(3.5 - place_t, 0.0, 1.0)
	# the faded world: pass each restored circle on this map to the shader, in real screen pixels
	var final := get_viewport().get_final_transform()
	var pts := PackedVector4Array()
	var here := restore.filter(func(r): return r.where == map_name)
	if INTERIORS.has(map_name) and spilled:
		here = [{ "where": map_name, "at": me.pos, "r": 5000.0 }]     # a room in town is as bright as the town outside
	here.sort_custom(func(a, b): return a.at.distance_to(me.pos) < b.at.distance_to(me.pos))   # the shader shows the 8 nearest
	for r in here.slice(0, 8):
		var sp: Vector2 = final * (to_screen * r.at)
		pts.append(Vector4(sp.x, sp.y, r.r * final.get_scale().x, 0))
	var count := pts.size()
	while pts.size() < 8:
		pts.append(Vector4.ZERO)
	var mat: ShaderMaterial = $FadeWorld/Shade.material
	mat.set_shader_parameter("points", pts)
	mat.set_shader_parameter("count", count)
	var cmat: ShaderMaterial = canopy.material
	cmat.set_shader_parameter("points", pts)
	cmat.set_shader_parameter("count", count)

# ---------------------------------------------------------------- the environment: Wildbond's own tiles
# Evan chose "Our own tiles" (2026-10-09) so Wildbond has a look of its own, apart from Starfall's pack, and an art
# direction that can grow (docs/art/wildbond-art-direction.md). tools/paint_tiles.gd paints assets/env/wild/: ground,
# trees, bushes, flowers, the cottage, Maren's barn and water, each picked by its cell in a 16x16 grid.
const FLOOR := preload("res://assets/env/wild/floor.png")
const NATURE := preload("res://assets/env/wild/nature.png")
const HOUSE := preload("res://assets/env/wild/house.png")
const NOTICE := preload("res://assets/emote/notice.png")   # the "!" over a trainer who has seen you (Ninja Adventure, CC0)
const WATER := preload("res://assets/env/wild/water.png")
const BARN_SPRITE := Rect2(400, 224, 64, 80)  # Maren's barn in house.png: measured pixel by pixel (4x5 tiles, door in the 2nd column)
func _tex(tex: Texture2D, cell: Vector2i, size: Vector2i, at: Vector2, mod := Color.WHITE) -> void:
	draw_texture_rect_region(tex, Rect2(at, Vector2(size) * 16.0), Rect2(Vector2(cell) * 16.0, Vector2(size) * 16.0), mod)
func _is_path(x: int, y: int) -> bool:
	return tile_at(Vector2i(x, y)) in ".NSEW"
func _draw_ground(x: int, y: int, ch: String) -> void:
	var o := Vector2(x, y) * TILE
	var n := (x * 7 + y * 13) % 9
	_tex(FLOOR, Vector2i(11 + (n if n < 5 else 0), 12), Vector2i.ONE, o)          # grass, with a few tufts
	if MOUNTAINS.has(map_name):
		draw_rect(Rect2(o, Vector2(16, 16)), TURF)                                # mountain turf in the area's own colour
		if ch == "R":
			if _mountain().has(Vector2i(x, y)):
				_draw_cliff(x, y, o, n)
				return
			_draw_rock(o, n)                                                     # a boulder out in the meadow
			return
		if ch == "o":
			_draw_spring(x, y, o)
	if ch == "_" or (ch == "R" and "_" in [tile_at(Vector2i(x - 1, y)), tile_at(Vector2i(x + 1, y)), tile_at(Vector2i(x, y - 1))]):
		_draw_sand(x, y, o, n)                                                     # the beach
	if ch == "R":
		_draw_rock(o, n)
	if map_name == "farwatch" and ch == "." and x >= 24:
		_draw_pier(x, y, o)
	elif _is_path(x, y):
		# dirt with soft grass edges where the path ends (the tileset's 3x3 edge set)
		var up := _is_path(x, y - 1); var down := _is_path(x, y + 1); var left := _is_path(x - 1, y); var right := _is_path(x + 1, y)
		var cell := Vector2i(12, 8)
		if (up or down) and (left or right):
			cell = Vector2i(11 if not left else (13 if not right else 12), 7 if not up else (9 if not down else 8))
		_tex(FLOOR, cell, Vector2i.ONE, o)
	elif ch == "f":
		_tex(NATURE, [Vector2i(0, 11), Vector2i(3, 11), Vector2i(6, 11)][n % 3], Vector2i.ONE, o)
	elif ch == "\"":
		# tall grass: two clumps of blades per tile that sway, where wild creatures hide
		var sway := int(sin(t * 1.6 + x * 0.7 + y * 0.4) * 1.5)
		_tex(NATURE, Vector2i(4 + n % 2, 10), Vector2i.ONE, o + Vector2(-3 + sway, -3))
		_tex(NATURE, Vector2i(5 - n % 2, 10), Vector2i.ONE, o + Vector2(4 + sway, 2))
	elif ch == "~":
		_draw_water(x, y, o, n)
	elif ch == "j" or ch == "q":
		_draw_water(x, y, o, n)                                                    # the skiff and its sign stand in the river
	elif ch == "b":
		# a wooden footbridge over the river: water underneath, boards across, a rail on each side
		_tex(WATER, Vector2i(11, 0), Vector2i.ONE, o)
		draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 12)), Color("6b4a2a"))
		for k in 4:
			draw_rect(Rect2(o + Vector2(k * 4, 3), Vector2(3, 10)), Color("a07048").darkened(0.08 * ((x + k) % 2)))
		draw_rect(Rect2(o + Vector2(0, 1), Vector2(16, 2)), Color("4e3220"))          # the rails
		draw_rect(Rect2(o + Vector2(0, 13), Vector2(16, 2)), Color("4e3220"))
		if tile_at(Vector2i(x - 1, y)) != "b":
			draw_rect(Rect2(o + Vector2(0, 0), Vector2(2, 16)), Color("4e3220"))     # posts where it meets the bank
		if tile_at(Vector2i(x + 1, y)) != "b":
			draw_rect(Rect2(o + Vector2(14, 0), Vector2(2, 16)), Color("4e3220"))
func _draw_structures() -> void:
	var rows: Array = cur_map()
	var doors: Array[Vector2i] = []
	for y in rows.size():
		for x in rows[0].length():
			if rows[y][x] == "D": doors.append(Vector2i(x, y))
	for y in rows.size():
		for x in rows[0].length():
			var ch: String = rows[y][x]
			if ch == "T":
				_tex(NATURE, Vector2i(1, 10), Vector2i.ONE, Vector2(x, y) * TILE, _leaf_tint())   # a hedge bush under the treeline
			elif ch in "r#" and not map_name in ["hollowecho", "sunthread", "farwatch", "league"] and not doors.any(func(d): return x - d.x >= -1 and x - d.x <= 2 and y >= d.y - 2 and y <= d.y):
				_tex(NATURE, Vector2i(0, 10), Vector2i.ONE, Vector2(x, y) * TILE, _leaf_tint())   # garden bushes beside each cottage
	for d in doors:
		if not (map_name == "larkhaven" and d == BARN_DOOR):
			_tex(HOUSE, Vector2i(0, 0), Vector2i(4, 3), Vector2(d.x - 1, d.y - 2) * TILE)  # the whole cottage (4 tiles wide), its door on our door
			_snow_on(Vector2(d.x - 1, d.y - 2) * TILE + Vector2(2, 1), 60)
	for y in rows.size():                                                               # big trees, back to front
		for x in rows[0].length():
			if rows[y][x] == "T" and (x + y) % 2 == 0:       # staggered, half a tile off the grid, so the edge reads as woods
				_tex(NATURE, _tree_cell(x, y), Vector2i(2, 2), _tree_at(x, y), _leaf_tint())   # edge rows sit low so they never hide the town
				_season_crown(_tree_at(x, y), x + y * 7)
	if map_name == "hollowecho":
		_draw_bell_house(Vector2i(2, 1))
	if map_name == "sunthread":
		_draw_meeting_hall(Vector2i(20, 1), 8)
	if map_name == "league":
		for k in 5:
			_draw_court(Vector2i(5 + k * 7, 3), k)
	if map_name == "farwatch":
		_draw_lookout(Vector2i(7, 1))
		_draw_boathouse(Vector2i(4, 10))
	# Maren's barn stands taller than the cottages and in front of the trees behind it
	if map_name == "larkhaven":
		draw_texture_rect_region(HOUSE, Rect2(Vector2(BARN_DOOR.x - 1, BARN_DOOR.y - 4) * TILE, BARN_SPRITE.size), BARN_SPRITE)
		_snow_on(Vector2(BARN_DOOR.x - 1, BARN_DOOR.y - 4) * TILE + Vector2(4, 1), BARN_SPRITE.size.x - 8)
		_draw_festival(doors)

## Where each building stands on this map, in tiles: the whole picture, roof and wall (the cottages, Maren's barn and the
## hand-drawn halls above). The bottom row is the wall with its door; every row above it is roof.
func buildings() -> Array[Rect2i]:
	var out: Array[Rect2i] = []
	if indoors():
		return out
	var rows: Array = cur_map()
	for y in rows.size():
		for x in rows[0].length():
			if rows[y][x] == "D" and not (map_name == "larkhaven" and Vector2i(x, y) == BARN_DOOR):
				out.append(Rect2i(x - 1, y - 2, 4, 3))
	match map_name:
		"larkhaven": out.append(Rect2i(BARN_DOOR.x - 1, BARN_DOOR.y - 4, 4, 5))
		"hollowecho": out.append(Rect2i(2, 1, 5, 3))
		"sunthread": out.append(Rect2i(20, 1, 8, 3))
		"farwatch":
			out.append(Rect2i(7, 1, 4, 3))
			out.append(Rect2i(4, 10, 5, 2))
		"league":
			for k in 5:
				out.append(Rect2i(5 + k * 7, 3, 5, 2))
	return out

## True on a roof: nobody walks there, so nobody is ever drawn on top of a building as if its roof were glass.
func _under_roof(p: Vector2i) -> bool:
	if _roof_map != map_name:
		_roof_map = map_name
		_roofs.clear()
		for b in buildings():
			for y in range(b.position.y, b.end.y - 1):
				for x in range(b.position.x, b.end.x):
					_roofs[Vector2i(x, y)] = true
	return _roofs.has(p)
var _roofs := {}
var _roof_map := ""

# ---------------------------------------------------------------- Wren and the first battle
func _beside_me() -> Vector2i:
	for d in [Vector2i.LEFT, Vector2i.UP, Vector2i.RIGHT, Vector2i.DOWN]:
		var p: Vector2i = me.tile + d
		if walkable(p) and tile_at(p) != "D" and not route(wren.tile, p).is_empty():
			return p
	return me.tile + Vector2i.LEFT

## Story lines from the browser game, with {name}, {starter} and {rival} filled in.
func _fill(s: String) -> String:
	return s.replace("{name}", my_look.get("name", "Tamer")).replace("{starter}", _partner_name()).replace("{rival}", rival_c.get("name", "its partner"))

func _on_battle(result: String) -> void:
	if battle_story.begins_with("story:"):
		var sid := battle_story.substr(6)
		battle_story = ""
		_after_story(sid, result)
		return
	if battle_story.begins_with("league:"):
		var lid := battle_story.substr(7)
		battle_story = ""
		_after_league(lid, result)
		return
	if battle_story.begins_with("spire:"):
		var floor := int(battle_story.substr(6))
		battle_story = ""
		_after_spire(floor, result)
		return
	if battle_story.begins_with("rematch:"):
		var rematch_who := battle_story.substr(8)
		battle_story = ""
		_after_warden_rematch(rematch_who, result)
		return
	if battle_story.begins_with("trainer:"):
		var who := battle_story.substr(8)
		battle_story = ""
		_after_trainer(who, result)
		return
	if battle_story != "rival1":
		_after_wild(result)
		return
	battle_story = ""
	stage = "after_rival"
	for c in team:
		c.hp = R.stats(c).hp                       # Maren patches everyone up after the first battle
	if result == "won":
		for l in DATA.SCENES.rival1Win:
			say(l[0], _fill(l[1]))
	else:
		say("wren", _fill("Ha! Told you it was strategy. Don't worry, {starter} just needs a few more days with you."))
		say("maren", _fill("There, all patched up. Losing your first battle is a fine tradition, {name}. Wren lost theirs to a goose."))
		say("wren", "That goose was a professional.")

## Water (the pack's water tiles, CC0): open water with now and then a lily pad or a glint, and a sandy shore with a dark
## edge drawn wherever the water meets land.
## Stillreed's own look (WB3.1): the current running south down the river, cattails where the banks meet the water,
## windfall under the orchard trees and a coil of ferry rope at the landing. All on the ground; nothing blocks the way.
func _draw_basin() -> void:
	var rows: Array = cur_map()
	for y in rows.size():
		for x in rows[0].length():
			var ch: String = rows[y][x]
			var o: Vector2 = Vector2(x, y) * TILE
			if ch == "~":
				for k in 2:
					var ph := fmod(t * 0.8 + k * 0.5 + x * 0.31 + y * 0.07, 1.0)
					draw_rect(Rect2(o + Vector2(4 + k * 6 + (y + k) % 3, ph * 16.0), Vector2(1, 4)), Color(1, 1, 1, 0.28 * (1.0 - ph)))
			elif ch == "\"" and (tile_at(Vector2i(x - 1, y)) == "~" or tile_at(Vector2i(x + 1, y)) == "~"):
				var side := 12.0 if tile_at(Vector2i(x + 1, y)) == "~" else 1.0
				var sway := sin(t * 1.3 + y) * 0.8
				for k in 2:
					var p := o + Vector2(side + k * 2 + sway, 1 + k * 7)
					draw_rect(Rect2(p + Vector2(1, 3), Vector2(1, 6)), Color("4a6a32"))
					draw_rect(Rect2(p, Vector2(3, 4)), Figures.OUTLINE)
					draw_rect(Rect2(p + Vector2(1, 0), Vector2(1, 3)), Color("7a4a26"))   # a cattail head
			elif ch == "T" and y in [2, 3] and x > 16 and rows[y + 1][x] in ",.":
				var u := o + Vector2(0, 16)
				for k in 3:
					var fx := Vector2(2 + (x * 7 + k * 5) % 12, 1 + (k * 3) % 5)
					draw_rect(Rect2(u + fx - Vector2.ONE, Vector2(4, 4)), Figures.OUTLINE)
					draw_rect(Rect2(u + fx, Vector2(2, 2)), Color("d8603a") if k != 1 else Color("e8b040"))
	# the coil of ferry rope beside the landing post
	var c := Vector2(10, 7) * TILE + Vector2(8, 9)
	draw_circle(c, 5.0, Figures.OUTLINE)
	draw_circle(c, 4.0, Color("cfb07a"))
	draw_circle(c, 2.0, Color("8a6a3a"))
	draw_rect(Rect2(c + Vector2(3, -1), Vector2(5, 1)), Color("cfb07a"))

func _draw_dragonflies() -> void:
	for k in 2:
		var home := Vector2(13 * TILE + 8, (3 + k * 7) * TILE)
		var p := home + Vector2(sin(t * 0.9 + k * 2.0) * 18.0, cos(t * 1.4 + k) * 10.0 + sin(t * 3.1 + k) * 3.0)
		var flick := int(t * 20.0 + k) % 2 == 0
		draw_rect(Rect2(p + Vector2(-1, 0), Vector2(6, 1)), Color("3a8ab0"))                       # the body
		draw_rect(Rect2(p + Vector2(-3, -2 if flick else -1), Vector2(3, 1)), Color(0.9, 0.95, 1.0, 0.7))
		draw_rect(Rect2(p + Vector2(-3, 2 if flick else 1), Vector2(3, 1)), Color(0.9, 0.95, 1.0, 0.7))
		draw_rect(Rect2(p + Vector2(5, 0), Vector2(1, 1)), Color("1a3a4a"))
## Hollowecho's ground (WB3.2): worn flagstones in the hamlet, and cave mouths where the floor runs in under the rock,
## dark inside so you can see they go somewhere (no interior yet).
func _draw_stone_floor(x: int, y: int, o: Vector2, n: int) -> void:
	var warm := map_name in ["sunthread", "league"]                                       # sandy flagstones in the sunny commons
	draw_rect(Rect2(o, Vector2(16, 16)), Color("c4b48c") if warm else Color("8c8c80"))
	for k in 2:
		draw_rect(Rect2(o + Vector2(0, k * 8 + 7), Vector2(16, 1)), Color("9a8a64") if warm else Color("6e6e62"))
		draw_rect(Rect2(o + Vector2((k * 8 + x * 5 + y * 3) % 14 + 1, k * 8), Vector2(1, 7)), Color("9a8a64") if warm else Color("6e6e62"))
	if n == 3:
		draw_rect(Rect2(o + Vector2(4, 3), Vector2(2, 1)), Color("a4a496"))
	if tile_at(Vector2i(x, y - 1)) == "R" and tile_at(Vector2i(x, y + 1)) != "#":
		# under the rock: the mouth of a cave, darkening toward the back
		var deep := 1 if tile_at(Vector2i(x, y + 1)) == "_" else 0
		draw_rect(Rect2(o, Vector2(16, 16)), Color(0.08, 0.08, 0.10, 0.55 + 0.2 * deep))
		draw_rect(Rect2(o + Vector2(0, 12), Vector2(16, 4)), Color(0.08, 0.08, 0.10, 0.25))

## The three places of the hills, each recognisable at a glance (from the area brief): the hamlet's tool roll, the
## surveyor's measuring cord and chalk marks, and the flat resting stones outside the Warden's cave. Nothing blocks the way.
func _draw_hills() -> void:
	# the bell mender's tool roll, open on the step
	var tr := Vector2(2, 5) * TILE
	draw_rect(Rect2(tr + Vector2(1, 6), Vector2(14, 6)), Figures.OUTLINE)
	draw_rect(Rect2(tr + Vector2(2, 7), Vector2(12, 4)), Color("8a5a32"))
	for k in 4:
		draw_rect(Rect2(tr + Vector2(3 + k * 3, 6), Vector2(1, 3)), Color("b8b8b0"))
	# the survey cord, pegged across the grass with a knot every few paces, and chalk arrows on the rock
	var a := Vector2(13, 7) * TILE + Vector2(2, 12)
	var b := Vector2(17, 7) * TILE + Vector2(14, 12)
	for p in [a, b]:
		draw_rect(Rect2(p - Vector2(1, 4), Vector2(2, 5)), Color("6b4a2a"))
	draw_line(a, b, Color("e8dcb0"), 1.0)
	for k in 5:
		draw_rect(Rect2(a.lerp(b, (k + 1) / 6.0) - Vector2(1, 1), Vector2(2, 2)), Color("c84a3a"))
	for c in [Vector2i(12, 8), Vector2i(18, 8)]:
		var o := Vector2(c) * TILE
		draw_line(o + Vector2(4, 8), o + Vector2(11, 8), Color(0.95, 0.95, 0.9, 0.8), 1.0)
		draw_line(o + Vector2(8, 5), o + Vector2(11, 8), Color(0.95, 0.95, 0.9, 0.8), 1.0)
		draw_line(o + Vector2(8, 11), o + Vector2(11, 8), Color(0.95, 0.95, 0.9, 0.8), 1.0)
	# flat resting stones in Senna's clearing
	for c in [Vector2i(21, 6), Vector2i(23, 6)]:
		var o := Vector2(c) * TILE
		draw_rect(Rect2(o + Vector2(1, 6), Vector2(14, 8)), Figures.OUTLINE)
		draw_rect(Rect2(o + Vector2(2, 7), Vector2(12, 6)), Color("9a9a8c"))
		draw_rect(Rect2(o + Vector2(2, 7), Vector2(12, 2)), Color("b4b4a6"))

## The bell keeper's house in the hamlet (5 tiles wide: two rows of slate roof over a stone wall, an open doorway in the
## middle where the map leaves a gap). Drawn here because the cottage sprite is for houses with a door tile.
func _draw_bell_house(at: Vector2i) -> void:
	var o := Vector2(at) * TILE
	var w := 5 * TILE
	draw_rect(Rect2(o + Vector2(-1, 31), Vector2(w + 2, 18)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 32), Vector2(w, 16)), Color("a8a494"))                     # the stone wall
	for k in 2:
		for j in 6:
			draw_rect(Rect2(o + Vector2(j * 14 + (k * 7) % 14, 32 + k * 8), Vector2(1, 8)), Color("807c6e"))
		draw_rect(Rect2(o + Vector2(0, 39 + k * 8), Vector2(w, 1)), Color("807c6e"))
	draw_rect(Rect2(o + Vector2(2 * TILE + 2, 34), Vector2(12, 14)), Color("1e1c22"))       # the open doorway
	draw_rect(Rect2(o + Vector2(2 * TILE + 1, 33), Vector2(14, 2)), Color("5a3a1e"))
	draw_rect(Rect2(o + Vector2(TILE / 2 - 4, 37), Vector2(8, 6)), Color("4a6a8a"))         # two small windows
	draw_rect(Rect2(o + Vector2(w - TILE / 2 - 4, 37), Vector2(8, 6)), Color("4a6a8a"))
	draw_rect(Rect2(o + Vector2(-4, -3), Vector2(w + 8, 36)), Figures.OUTLINE)                # the slate roof, overhanging
	draw_rect(Rect2(o + Vector2(-3, -2), Vector2(w + 6, 34)), Color("56645c"))
	for k in 5:
		draw_rect(Rect2(o + Vector2(-3, 4 + k * 6), Vector2(w + 6, 1)), Color("44504a"))
	draw_rect(Rect2(o + Vector2(-3, -2), Vector2(w + 6, 2)), Color("74847a"))
	_snow_on(o + Vector2(-3, -2), w + 6)
	draw_rect(Rect2(o + Vector2(w / 2 - 3, -9), Vector2(6, 8)), Figures.OUTLINE)            # a little bell cote on the ridge
	draw_rect(Rect2(o + Vector2(w / 2 - 2, -8), Vector2(4, 6)), Color("d8a840"))
## Sunthread's meeting hall (WB3.3): a broad timber hall above the forecourt, a green turf roof with cloth pennants
## that the wind worries at, and wide double doors (the map gives the hall a solid front, so the doors are shut).
func _draw_meeting_hall(at: Vector2i, w_tiles: int) -> void:
	var o := Vector2(at) * TILE
	var w := w_tiles * TILE
	draw_rect(Rect2(o + Vector2(-1, 31), Vector2(w + 2, 18)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 32), Vector2(w, 16)), Color("b08050"))                     # timber walls
	for k in w_tiles * 2:
		draw_rect(Rect2(o + Vector2(k * 8 + 7, 32), Vector2(1, 16)), Color("8a5e38"))
	var d := o + Vector2(w / 2 - 12, 34)
	draw_rect(Rect2(d, Vector2(24, 14)), Color("5a3a1e"))                                     # the double doors
	draw_rect(Rect2(d + Vector2(11, 0), Vector2(2, 14)), Color("3a2412"))
	draw_rect(Rect2(d + Vector2(8, 7), Vector2(2, 2)), Color("e8c040"))
	draw_rect(Rect2(d + Vector2(14, 7), Vector2(2, 2)), Color("e8c040"))
	for k in [1, w_tiles - 2]:
		draw_rect(Rect2(o + Vector2(k * TILE + 3, 37), Vector2(10, 6)), Color("f2d080"))  # lit windows
	draw_rect(Rect2(o + Vector2(-5, -3), Vector2(w + 10, 36)), Figures.OUTLINE)               # the turf roof
	draw_rect(Rect2(o + Vector2(-4, -2), Vector2(w + 8, 34)), Color("6f8a3e"))
	for k in 5:
		draw_rect(Rect2(o + Vector2(-4, 4 + k * 6), Vector2(w + 8, 1)), Color("5a7230"))
	draw_rect(Rect2(o + Vector2(-4, -2), Vector2(w + 8, 2)), Color("90ac5f"))
	_snow_on(o + Vector2(-4, -2), w + 8)
	var cols := [Color("e0483e"), Color("f2d24a"), Color("5b8def"), Color("59c38a")]
	for k in 4:                                                                                  # pennants on the ridge
		var p := o + Vector2(12 + k * (w - 24) / 3.0, -2)
		draw_rect(Rect2(p - Vector2(0, 10), Vector2(1, 10)), Color("4e3220"))
		var flap := sin(t * 3.0 + k * 1.3) * 2.0
		draw_colored_polygon(PackedVector2Array([p - Vector2(-1, 10), p - Vector2(-9 - flap, 7), p - Vector2(-1, 4)]), cols[k])

## The commons' useful corners (from the area brief): Mirel's mending frame, Nesla's cloth bench with the four braided
## shelter ties, and the low nursery beds marked with green ribbons. All on the ground; nothing blocks the way.
func _draw_commons() -> void:
	# the mending frame: two posts and a stretched shelter cloth with a patch half sewn
	var m := Vector2(7, 5) * TILE
	for x in [1, 14]:
		draw_rect(Rect2(m + Vector2(x, 0), Vector2(2, 15)), Color("6b4a2a"))
	draw_rect(Rect2(m + Vector2(3, 2), Vector2(11, 8)), Color("e8dcc0"))
	draw_rect(Rect2(m + Vector2(6, 4), Vector2(4, 4)), Color("c8925a"))
	draw_line(m + Vector2(6, 4), m + Vector2(10, 8), Color("8a3a2a"), 1.0)
	# Nesla's bench, with four differently braided ties laid out side by side
	var b := Vector2(23, 4) * TILE
	draw_rect(Rect2(b + Vector2(0, 8), Vector2(16, 6)), Figures.OUTLINE)
	draw_rect(Rect2(b + Vector2(1, 9), Vector2(14, 4)), Color("a07048"))
	var braid := [Color("c84a3a"), Color("4a7ab8"), Color("d8a840"), Color("6aa04a")]
	for k in 4:
		draw_rect(Rect2(b + Vector2(2 + k * 3, 4), Vector2(2, 6)), braid[k])
		draw_rect(Rect2(b + Vector2(2 + k * 3, 4 + (k % 2) * 2), Vector2(2, 1)), Color(1, 1, 1, 0.5))
	# the nursery beds: dark turned soil, seedlings, a green ribbon on each marker stick
	for k in 3:
		var n := Vector2(9 + k, 11) * TILE
		draw_rect(Rect2(n + Vector2(1, 5), Vector2(14, 9)), Color("6a4a2e"))
		for s in 3:
			draw_rect(Rect2(n + Vector2(3 + s * 4, 7 + (s + k) % 2 * 3), Vector2(2, 2)), Color("7ab040"))
		draw_rect(Rect2(n + Vector2(13, 1), Vector2(1, 8)), Color("6b4a2a"))
		draw_rect(Rect2(n + Vector2(14, 1 + sin(t * 2.0 + k) * 1.0), Vector2(3, 2)), Color("59c38a"))
## Farwatch's pier (WB3.4): the map marks it as path running out over the water; boards on posts, water beneath.
func _draw_pier(x: int, y: int, o: Vector2) -> void:
	_tex(WATER, Vector2i(11, 0), Vector2i.ONE, o)
	draw_rect(Rect2(o + Vector2(0, 1), Vector2(16, 14)), Color("6b4a2a"))
	for k in 4:
		draw_rect(Rect2(o + Vector2(1, 1 + k * 4), Vector2(14, 3)), Color("a88458").darkened(0.06 * ((y + k) % 2)))
	if tile_at(Vector2i(x, y + 1)) == "~":
		draw_rect(Rect2(o + Vector2(2, 14), Vector2(2, 2)), Color("4e3220"))       # the posts going down into the water
		draw_rect(Rect2(o + Vector2(12, 14), Vector2(2, 2)), Color("4e3220"))

## The lookout on the bluff: a stone tower-house with a slate roof and a lamp room on top, where the recorders sit.
func _draw_lookout(at: Vector2i) -> void:
	var o := Vector2(at) * TILE
	var w := 4 * TILE
	draw_rect(Rect2(o + Vector2(-1, 31), Vector2(w + 2, 18)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 32), Vector2(w, 16)), Color("9a9a90"))
	for k in 2:
		draw_rect(Rect2(o + Vector2(0, 39 + k * 8), Vector2(w, 1)), Color("76766c"))
		for j in 5:
			draw_rect(Rect2(o + Vector2(j * 14 + (k * 7) % 14, 32 + k * 8), Vector2(1, 8)), Color("76766c"))
	draw_rect(Rect2(o + Vector2(w / 2 - 6, 35), Vector2(12, 13)), Color("3a2a1e"))            # the doorway
	draw_rect(Rect2(o + Vector2(-4, -1), Vector2(w + 8, 34)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(-3, 0), Vector2(w + 6, 32)), Color("4e5a66"))                 # slate
	for k in 5:
		draw_rect(Rect2(o + Vector2(-3, 5 + k * 6), Vector2(w + 6, 1)), Color("3e4852"))
	_snow_on(o + Vector2(-3, 0), w + 6)
	var lamp := o + Vector2(w / 2 - 6, -12)
	draw_rect(Rect2(lamp - Vector2(1, 1), Vector2(14, 14)), Figures.OUTLINE)                 # the lamp room
	draw_rect(Rect2(lamp, Vector2(12, 12)), Color("9a9a90"))
	draw_rect(Rect2(lamp + Vector2(2, 3), Vector2(8, 6)), Color("f4d070").lerp(Color("fff4c0"), 0.5 + 0.5 * sin(t * 2.0)))

## The harbor house down by the water: a low boathouse with a turf roof and nets drying on its wall.
func _draw_boathouse(at: Vector2i) -> void:
	var o := Vector2(at) * TILE
	var w := 5 * TILE
	draw_rect(Rect2(o + Vector2(-1, 15), Vector2(w + 2, 18)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 16), Vector2(w, 16)), Color("8a6a4a"))
	for k in 10:
		draw_rect(Rect2(o + Vector2(k * 8 + 7, 16), Vector2(1, 16)), Color("6a4a2e"))
	draw_rect(Rect2(o + Vector2(TILE + 2, 19), Vector2(20, 13)), Color("2e2218"))             # the wide boat door
	for k in 3:                                                                                # nets drying
		draw_line(o + Vector2(52 + k * 4, 18), o + Vector2(50 + k * 4, 30), Color("c8c0a0"), 1.0)
	draw_line(o + Vector2(50, 22), o + Vector2(62, 22), Color("c8c0a0"), 1.0)
	draw_line(o + Vector2(50, 26), o + Vector2(62, 26), Color("c8c0a0"), 1.0)
	draw_rect(Rect2(o + Vector2(-4, -3), Vector2(w + 8, 20)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(-3, -2), Vector2(w + 6, 18)), Color("6a8060"))
	for k in 2:
		draw_rect(Rect2(o + Vector2(-3, 4 + k * 6), Vector2(w + 6, 1)), Color("566a4c"))

## The harbor's useful things (from the area brief): Rysa's open ledger on its stand, a dry bench by the keeper,
## and mooring posts with cloth tied round them at the head of the pier.
func _draw_harbor() -> void:
	var l := Vector2(21, 2) * TILE
	draw_rect(Rect2(l + Vector2(7, 8), Vector2(2, 8)), Color("4e3220"))
	draw_rect(Rect2(l + Vector2(1, 3), Vector2(14, 7)), Figures.OUTLINE)
	draw_rect(Rect2(l + Vector2(2, 4), Vector2(5, 5)), Color("f4ecd8"))
	draw_rect(Rect2(l + Vector2(9, 4), Vector2(5, 5)), Color("f4ecd8"))
	draw_rect(Rect2(l + Vector2(3, 5), Vector2(3, 1)), Color("7a6a5a"))
	draw_rect(Rect2(l + Vector2(10, 5), Vector2(3, 1)), Color("7a6a5a"))
	draw_line(l + Vector2(10, 7), l + Vector2(13, 7), Color("c84a3a"), 1.0)                  # a crossed-out estimate
	var b := Vector2(18, 7) * TILE
	draw_rect(Rect2(b + Vector2(1, 8), Vector2(14, 5)), Figures.OUTLINE)
	draw_rect(Rect2(b + Vector2(2, 9), Vector2(12, 3)), Color("b08a5a"))
	draw_rect(Rect2(b + Vector2(3, 12), Vector2(2, 3)), Color("6b4a2a"))
	draw_rect(Rect2(b + Vector2(11, 12), Vector2(2, 3)), Color("6b4a2a"))
	for p in [Vector2i(23, 9), Vector2i(23, 10)]:
		var o := Vector2(p) * TILE
		draw_rect(Rect2(o + Vector2(11, 2), Vector2(4, 13)), Figures.OUTLINE)
		draw_rect(Rect2(o + Vector2(12, 3), Vector2(2, 11)), Color("6b4a2a"))
		draw_rect(Rect2(o + Vector2(11, 7), Vector2(4, 2)), Color("c84a3a") if p.y == 9 else Color("4a7ab8"))

## Low shore lanterns along the pier and the harbor's edge, glowing warm and breathing a little, so a returning team
## can see the way in (staged; no signal to answer).
func _draw_shore_lights() -> void:
	for p in [Vector2i(24, 9), Vector2i(27, 9), Vector2i(24, 10), Vector2i(27, 10), Vector2i(22, 11), Vector2i(22, 7)]:
		var c := Vector2(p) * TILE + Vector2(8, 4)
		var glow := 0.18 + 0.06 * sin(t * 1.5 + p.x)
		draw_circle(c, 11.0, Color(1.0, 0.82, 0.45, glow))
		draw_rect(Rect2(c - Vector2(3, 3), Vector2(6, 7)), Figures.OUTLINE)
		draw_rect(Rect2(c - Vector2(2, 2), Vector2(4, 5)), Color("f4c860"))
# ---------------------------------------------------------------- the four seasons, seen (WS2)
## Leaves through the year: fresh in spring, as drawn in summer, turned in autumn, bare and grey-blue in winter.
func _leaf_tint() -> Color:
	match cal.season():
		"spring": return Color(1.0, 1.0, 0.94)
		"autumn": return Color(1.0, 0.66, 0.40)
		"winter": return Color(0.80, 0.86, 0.92)
	return Color.WHITE

## Blossom on the crowns in spring, a cap of snow in winter.
func _season_crown(at: Vector2, seed: int) -> void:
	var sn := cal.season()
	if sn == "spring":
		for k in 7:
			var p := at + Vector2(5 + (seed * 7 + k * 11) % 22, 3 + (seed * 3 + k * 5) % 14)
			draw_rect(Rect2(p, Vector2(2, 2)), Color("f8c8d8") if k % 3 else Color("fff4f8"))
	elif sn == "winter":
		draw_rect(Rect2(at + Vector2(6, 1), Vector2(20, 4)), Color("f4f8fc"))
		draw_rect(Rect2(at + Vector2(4, 4), Vector2(24, 3)), Color("e8eef6"))

## Snow along a roof's top edge in winter, with a few icicles.
func _snow_on(at: Vector2, w: float) -> void:
	if cal.season() != "winter":
		return
	draw_rect(Rect2(at, Vector2(w, 4)), Color("f4f8fc"))
	for k in int(w / 6.0):
		draw_rect(Rect2(at + Vector2(k * 6 + 2, 4), Vector2(3, 1 + (k * 7) % 3)), Color("e8eef6"))

## The ground through the year: snow over the grass and ice on still water in winter, fallen leaves on the paths in
## autumn, a fresh green and scattered petals in spring. The faded world washes it out like everything else, so the
## seasons show only faintly until the colour comes back.
func _season_ground(rows: Array) -> void:
	var sn := cal.season()
	if sn == "summer":
		return
	var sea: bool = map_name in ["saltmarsh", "farwatch", "league"]
	for y in rows.size():
		for x in rows[0].length():
			var ch: String = rows[y][x]
			var o: Vector2 = Vector2(x, y) * TILE
			var h: int = (x * 7 + y * 13) % 9
			if sn == "winter":
				if ch in ",\"fT":
					draw_rect(Rect2(o, Vector2(16, 16)), Color(0.95, 0.97, 1.0, 0.62))
					if h == 2:
						draw_rect(Rect2(o + Vector2(5, 6), Vector2(1, 1)), Color.WHITE)
				elif ch == "~" and not sea:
					draw_rect(Rect2(o, Vector2(16, 16)), Color(0.86, 0.93, 1.0, 0.62))         # the pond freezes over
					if h < 3:
						draw_line(o + Vector2(3, 4 + h), o + Vector2(12, 9 - h), Color(1, 1, 1, 0.7), 1.0)
				elif ch in "._R" or _is_path(x, y):
					draw_rect(Rect2(o, Vector2(16, 16)), Color(0.93, 0.95, 0.98, 0.36))
			elif sn == "autumn":
				if ch in ",\"f":
					draw_rect(Rect2(o, Vector2(16, 16)), Color(0.85, 0.55, 0.2, 0.15))
				if (ch in ",." or _is_path(x, y)) and h < 4:
					for k in 2:
						var p: Vector2 = o + Vector2(2 + (h * 5 + k * 7) % 12, 3 + (h * 3 + k * 6) % 10)
						draw_rect(Rect2(p, Vector2(2, 1)), [Color("d8602a"), Color("e8a030"), Color("b8402a")][(h + k) % 3])
			elif sn == "spring":
				if ch in ",\"f":
					draw_rect(Rect2(o, Vector2(16, 16)), Color(0.75, 1.0, 0.55, 0.07))
					if h == 4:
						draw_rect(Rect2(o + Vector2(9, 10), Vector2(1, 1)), Color("f8c8d8"))
						draw_rect(Rect2(o + Vector2(4, 3), Vector2(1, 1)), Color("fff4a0"))

## What drifts through the air: petals in spring, leaves in autumn, snow in winter (nothing in summer).
func _season_air() -> void:
	var sn := cal.season()
	if sn == "summer" or indoors():
		return
	var view: Rect2 = get_canvas_transform().affine_inverse() * get_viewport_rect()
	var n := 36 if sn == "winter" else 14
	for k in n:
		var fall := 9.0 if sn == "winter" else 6.0
		var x: float = view.position.x + fmod(k * 97.3 + t * (4.0 + k % 5) + sin(t * 0.8 + k) * 6.0, view.size.x)
		var y: float = view.position.y + fmod(k * 53.7 + t * fall * (1.0 + (k % 3) * 0.3), view.size.y)
		match sn:
			"winter": draw_rect(Rect2(Vector2(x, y), Vector2(1, 1) if k % 3 else Vector2(2, 2)), Color(1, 1, 1, 0.85))
			"autumn": draw_rect(Rect2(Vector2(x, y), Vector2(2, 1) if int(t * 3.0 + k) % 2 else Vector2(1, 2)), [Color("d8602a"), Color("e8a030")][k % 2])
			"spring": draw_rect(Rect2(Vector2(x, y), Vector2(2, 1)), Color("f8c8d8"))
# ---------------------------------------------------------------- seasons and festivals in what people say and do (WS3, WS5)
## This place's wild table for the season (ChatGPT's WS3 data: small shifts, a few visitors who favour one season and
## are rare in the others), or the usual table where there's none.
func _wild_table() -> Array:
	var seasonal: Dictionary = DATA.MAPS[map_name].get("seasonal", {})
	if seasonal.has(cal.season()):
		return seasonal[cal.season()].wild
	if DATA.MAPS[map_name].has("wild"):
		return DATA.MAPS[map_name].wild
	return DATA.BIOMES[DATA.MAPS[map_name].biome].wild

func _maren_data() -> Dictionary:
	for n in DATA.MAPS.larkhaven.npcs:
		if n.who == "maren":
			return n
	return {}

## One more thing said after the usual: the festival's line on a festival day in Larkhaven, otherwise a remark about
## the season.
func _season_word(data: Dictionary) -> void:
	var fest := cal.festival()
	if fest != "" and map_name in ["larkhaven", "barn"] and data.get("byFestival", {}).has(fest):
		for l in data.byFestival[fest]:
			say(l[0], _fill(l[1]))
	elif data.get("bySeason", {}).has(cal.season()):
		for l in data.bySeason[cal.season()]:
			say(l[0], _fill(l[1]))

func _festival() -> Dictionary:
	var fest := cal.festival()
	return DATA.MAPS.larkhaven.get("festivals", {}).get(fest, {}) if fest != "" else {}

func _fest_key() -> String:
	return "%s:%d" % [cal.festival(), cal.year()]

## Maren asks you to join in, once a festival (its "invite" lines), and says what to do in plain words.
func _festival_invite() -> void:
	var f := _festival()
	if f.is_empty() or fest_done.has(_fest_key()) or fest_task == cal.festival():
		return
	fest_task = cal.festival()
	fest_step = 0
	for l in f.activity.invite:
		say(l[0], _fill(l[1]))
	say("", { "planting": "Plant a flower in the ranch paddock: stand on open ground inside the fence and " + how("E", "Plant") + ".",
		"longlight": "Run one lap with your partner: out along the road to the north edge of town, then back to Pip.",
		"lanterns": "Fill the trough in the barn for every partner (two berries).",
		"midwinter": "Make something small at Maren's workbench in the barn, then give it to someone in town." }[fest_task])

## The festival's small activity, done where it happens. Returns true if E did something here.
func _festival_here() -> bool:
	if fest_task == "" or fest_task != cal.festival():
		return false
	match fest_task:
		"planting":
			if map_name == "larkhaven" and PADDOCK.has_point(me.tile) and not flowers.has([me.tile.x, me.tile.y]):
				flowers.append([me.tile.x, me.tile.y])
				say("", "You and %s dig a little hollow together and plant a flower. It'll still be here when the ribbons come down." % _partner_name())
				_festival_complete()
				return true
		"longlight":
			if fest_step == 1:
				for n in npcs:
					if n.id == "pip" and n.where == map_name and (me.tile - n.tile).length() <= 1.01:
						_festival_complete()
						return true
		"lanterns":
			if _near_trough() and int(bag.berries) >= 2:
				_feed()
				_festival_complete()
				return true
		"midwinter":
			if _near_bench() and fest_step == 0:
				fest_step = 1
				say("", "You sit at Maren's bench and make something small: a soft cloth for cold paws, with a stitched star in the corner. Now, who is it for?")
				return true
	return false

## Midwinter: give what you made to whoever you're talking to in town.
func _festival_gift(who: String) -> void:
	if fest_task == "midwinter" and fest_step == 1 and cal.festival() == "midwinter" and map_name == "larkhaven":
		say("", "You give %s the little cloth you made. They turn it over in their hands and smile." % _npc_name(who))
		_festival_complete()

func _npc_name(id: String) -> String:
	return str(DATA.get("CAST", {}).get(id, {}).get("name", id.capitalize()))

## Every 0.25 s or so while the race is on: reaching the north edge of town marks the turn.
func _festival_tick() -> void:
	if fest_task == "longlight" and fest_step == 0 and map_name == "larkhaven" and me.tile.y <= 1:
		fest_step = 1
		say("", "The far end! %s is already turning for home. Back to Pip." % _partner_name())

func _festival_complete() -> void:
	var f := _festival()
	if f.is_empty():
		return
	fest_done[_fest_key()] = true
	for l in f.activity.complete:
		say(l[0], _fill(l[1]))
	keepsakes[f.keepsake.id] = f.keepsake.name
	say("", "Keepsake: %s. %s" % [f.keepsake.name, f.keepsake.description])
	for c in team:
		R.add_bond(c, 2.0)
	fest_task = ""
	fest_step = 0

## Flowers planted on Planting Day, in the paddock for good.
func _draw_flowers() -> void:
	if map_name != "larkhaven":
		return
	for p in flowers:
		var o := Vector2(int(p[0]), int(p[1])) * TILE
		draw_rect(Rect2(o + Vector2(7, 8), Vector2(2, 6)), Color("4a8a3a"))
		draw_rect(Rect2(o + Vector2(5, 5), Vector2(6, 4)), Figures.OUTLINE)
		draw_rect(Rect2(o + Vector2(6, 5), Vector2(4, 3)), Color("f07a9a"))
		draw_rect(Rect2(o + Vector2(7, 6), Vector2(2, 1)), Color("f2d24a"))
# ---------------------------------------------------------------- the Returning Light League (WB4.1)
const COURT_COLS := [Color("6d8268"), Color("698796"), Color("b18d66"), Color("b3a56d"), Color("8b7095")]

## The league's next battle: Wren at the gate, then the four courts in order, then Champion Avenne on the terrace.
func _league_next() -> Dictionary:
	for b in DATA.STORY:
		if str(b.get("biome", "")) != "league":
			continue
		if not story_done.has("leagueWren"):
			if str(b.league) == "wren":
				return b
		elif not (b.league is String) and int(b.league) == league_room:
			return b
	return {}

## Talking to someone at the league: Nelva explains and heals; the next challenger battles you; the others say
## where to go. A battle here is the browser game's story fight, with its lines and team from the game data.
func _league_talk(n: Mover, data: Dictionary) -> void:
	var role = data.league
	var nm := _npc_name(n.id)
	if story_done.has("leagueChampion"):
		if str(role) == "keeper":
			say("nelva", "The courts are resting, Champion. Come back whenever you want a battle; they will be glad to see you.")
		else:
			say(n.id, _fill("You carried the whole journey up those steps, {name}. Come and battle again some day."))
		return
	if str(role) == "keeper":
		for c in team:
			c.hp = R.stats(c).hp
		say("nelva", "Welcome to the Returning Light League. Wren waits at the gate; then the four courts, in order, and the Champion's terrace.")
		say("nelva", "I'll see to your team between rooms. If a court beats you, rest, and the courts begin again from the first.")
		return
	var b := _league_next()
	if b.is_empty():
		return
	if str(b.league) != str(role) and not (role is float and not (b.league is String) and int(role) == int(b.league)):
		say(n.id, "Wren is waiting for you at the gate first." if not story_done.has("leagueWren") else "%s first. The courts go in order: %s." % [_npc_name(_court_who(b)), b.title])
		return
	for l in b.get("lines", []):
		var w: String = l[0]
		say("" if w.begins_with("@") else w, _fill(l[1]))
	then_do = func():
		battle_story = "league:" + b.id
		battle.max_level = level_cap()
		var foes: Array = []
		for t2 in b.team:
			var sp: String = rival_c.get("sp", "cindercub") if t2[0] == "$rival" else t2[0]
			foes.append(R.make(sp, int(t2[1]), { "rar": 1 }, rng))
			seen[sp] = true
		battle.open("trainer", team, foes, str(b.get("trainer", DATA.CAST.wren.name)))

func _court_who(b: Dictionary) -> String:
	for n in DATA.MAPS.league.npcs:
		if str(n.league) == str(b.league) or (not (n.league is String) and not (b.league is String) and int(n.league) == int(b.league)):
			return n.who
	return "nelva"

## After a league battle. Win: the next room, with the team healed between rooms; the Champion brings the ending.
## Lose: rest, and this attempt begins again at the first court (Wren stays beaten).
func _after_league(id: String, result: String) -> void:
	var b: Dictionary = {}
	for s2 in DATA.STORY:
		if s2.id == id:
			b = s2
	for c in team:
		c.hp = R.stats(c).hp
	if result != "won":
		league_room = 0
		me.tile = Vector2i(3, 15)
		me.pos = Vector2(me.tile) * TILE
		me.path.clear()
		say("nelva", "Rest now. Everyone is healed. The courts begin again from the first whenever you are ready.")
		return
	story_done[id] = true
	for l in b.get("win", []):
		var w: String = l[0]
		say("" if w.begins_with("@") else w, _fill(l[1]))
	if id == "leagueChampion":
		_homecoming()
		for l in DATA.SCENES.get("leagueEnding", []):
			say(l[0], _fill(l[1]))
		for l in DATA.SCENES.get("leagueAfter", []):          # ChatGPT's T54: the group quiets for water and rest
			say(l[0], _fill(l[1]))
		story_done["leagueEnding"] = true
		return
	if not (b.league is String):
		league_room = int(b.league) + 1
	var nxt := _league_next()
	if not nxt.is_empty():
		say("nelva", "A quiet rest between courts. Your team is healed. Next: %s." % nxt.title)

## The homecoming (WB4.3, staged from ChatGPT's T54 brief): Maren and Isolde come to the league gate and Avenne walks
## down from the terrace; Wren is already there. Each has their own tile, off the path at x=3, with room for partners.
## They go home again when you leave the league.
func _homecoming() -> void:
	guests.clear()
	for g in [["maren", Vector2i(2, 14), Vector2i.RIGHT], ["isolde", Vector2i(4, 13), Vector2i.LEFT]]:
		var mv := Mover.new(g[0], "league", g[1])
		mv.face = g[2]
		mv.right = mv.face.x >= 0
		guests.append(mv)
	for n in npcs:
		if n.id == "avenne":
			n.tile = Vector2i(5, 14)
			n.pos = Vector2(n.tile) * TILE
			n.path.clear()
			n.face = Vector2i.LEFT
	me.tile = Vector2i(3, 14)
	me.pos = Vector2(me.tile) * TILE
	me.path.clear()
	me.face = Vector2i.UP
## A court on the terrace: a white stone hall with a slate roof and its own coloured banner (the Champion's is violet).
func _draw_court(at: Vector2i, k: int) -> void:
	var o := Vector2(at) * TILE
	var w := 5 * TILE
	draw_rect(Rect2(o + Vector2(-1, 15), Vector2(w + 2, 18)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(0, 16), Vector2(w, 16)), Color("e8e2d4"))
	for j in 4:
		draw_rect(Rect2(o + Vector2(8 + j * 20, 16), Vector2(4, 16)), Color("d0c8b4"))            # columns
	draw_rect(Rect2(o + Vector2(w / 2 - 7, 20), Vector2(14, 12)), Color("3a3040"))               # the open archway
	draw_rect(Rect2(o + Vector2(-4, -3), Vector2(w + 8, 20)), Figures.OUTLINE)
	draw_rect(Rect2(o + Vector2(-3, -2), Vector2(w + 6, 18)), Color("5a6470"))
	for j in 2:
		draw_rect(Rect2(o + Vector2(-3, 4 + j * 6), Vector2(w + 6, 1)), Color("48505a"))
	_snow_on(o + Vector2(-3, -2), w + 6)
	var col: Color = COURT_COLS[k]
	var bx := o + Vector2(w / 2 - 4, -16)
	draw_rect(Rect2(bx + Vector2(3, 0), Vector2(1, 16)), Color("4e3220"))
	var flap := sin(t * 2.5 + k) * 1.5
	draw_colored_polygon(PackedVector2Array([bx + Vector2(4, 1), bx + Vector2(14 + flap, 4), bx + Vector2(4, 8)]), col)
	if k < league_room or (k == 4 and story_done.has("leagueChampion")):
		draw_rect(Rect2(o + Vector2(w / 2 - 2, 8), Vector2(4, 4)), Color("f2d24a"))               # a gold mark once you've won here
# ---------------------------------------------------------------- festivals in Larkhaven (WS5, decorations first)
const SQUARE := Vector2i(13, 4)              # the green between the main street and Maren's barn
const LIGHTS := [Color("e0483e"), Color("f2d24a"), Color("5b8def"), Color("59c38a")]

## The village dressed for whichever festival is on (calendar.gd festival()): what each one puts up, so that walking
## into town on the day feels different. Lines and the festival's small activity come with WS5's writing (WS6).
func _draw_festival(doors: Array) -> void:
	var fest := cal.festival()
	if fest == "" or map_name != "larkhaven":
		return
	var eaves: Array = []                     # [left, y, width] along the front of each house
	for d in doors:
		if d == BARN_DOOR:
			eaves.append([Vector2(BARN_DOOR.x - 1, BARN_DOOR.y - 4) * TILE + Vector2(6, BARN_SPRITE.size.y - 22), BARN_SPRITE.size.x - 12])
		else:
			eaves.append([Vector2(d.x - 1, d.y - 2) * TILE + Vector2(3, 30), 58])
	var sq := Vector2(SQUARE) * TILE
	match fest:
		"planting":
			# ribbons tied along the paddock fence, a box of flowers under each window, a seed-swap table on the green
			for y in cur_map().size():
				for x in cur_map()[0].length():
					if tile_at(Vector2i(x, y)) == "=" and (x + y) % 2 == 0:
						var o := Vector2(x, y) * TILE + Vector2(7, 6)
						draw_line(o, o + Vector2(2 + sin(t * 3.0 + x) * 1.5, 7), LIGHTS[(x + y) % 4], 1.0)
			for e in eaves:
				for k in 3:
					var p: Vector2 = e[0] + Vector2(6 + k * (float(e[1]) - 14) / 2.0, 14)
					draw_rect(Rect2(p, Vector2(8, 3)), Color("8a5a32"))
					draw_rect(Rect2(p + Vector2(1, -2), Vector2(2, 2)), Color("f07a9a"))
					draw_rect(Rect2(p + Vector2(5, -2), Vector2(2, 2)), Color("f2d24a"))
			_table(sq + Vector2(0, 8), 32, [Color("c8a060"), Color("7ab040"), Color("d8b070")])
		"longlight":
			# lanterns strung across the main street, glowing as the light goes
			var a := Vector2(3, 6) * TILE + Vector2(0, -4)
			var b := Vector2(21, 6) * TILE + Vector2(0, -4)
			var prev := a
			for k in 37:
				var f := (k + 1) / 37.0
				var p := a.lerp(b, f) + Vector2(0, sin(f * PI * 3.0) * 4.0 + 4.0)
				draw_line(prev, p, Color("4e3220"), 1.0)
				prev = p
				if k % 3 == 1:
					draw_circle(p + Vector2(0, 3), 6.0, Color(1.0, 0.8, 0.45, 0.18 + 0.05 * sin(t * 2.0 + k)))
					draw_rect(Rect2(p + Vector2(-2, 1), Vector2(4, 5)), Color("f4c860"))
		"lanterns":
			# carved lanterns by every door and a long supper table on the green
			for d in doors:
				for side in [-1, 1]:
					var p := Vector2(d) * TILE + Vector2(8 + side * 12, 12)
					draw_circle(p, 8.0, Color(1.0, 0.6, 0.2, 0.16 + 0.05 * sin(t * 2.5 + side)))
					draw_rect(Rect2(p - Vector2(4, 3), Vector2(8, 7)), Figures.OUTLINE)
					draw_rect(Rect2(p - Vector2(3, 2), Vector2(6, 5)), Color("e07a2a"))
					draw_rect(Rect2(p - Vector2(2, 0), Vector2(1, 1)), Color("fff0a0"))
					draw_rect(Rect2(p + Vector2(1, 0), Vector2(1, 1)), Color("fff0a0"))
			_table(sq + Vector2(-8, 8), 48, [Color("e8a030"), Color("c84a3a"), Color("f0d8a0"), Color("a0702a")])
		"midwinter":
			# garlands with coloured lights along every house, and the big tree on the green with gifts beneath it
			for e in eaves:
				var left: Vector2 = e[0]
				var w: float = e[1]
				for k in int(w / 3.0):
					var p := left + Vector2(k * 3, sin(k * 0.6) * 1.5)
					draw_rect(Rect2(p, Vector2(3, 3)), Color("2e6a3a") if k % 2 else Color("3a7a46"))
					if k % 3 == 0:
						var on := int(t * 2.0 + k) % 4 != 0
						draw_rect(Rect2(p + Vector2(1, 3), Vector2(2, 2)), LIGHTS[(k / 3) % 4] if on else LIGHTS[(k / 3) % 4].darkened(0.5))
			var base := sq + Vector2(8, 16)
			draw_rect(Rect2(base + Vector2(-3, -6), Vector2(6, 7)), Color("6b4a2a"))           # the trunk
			for r in 4:                                                                          # four tiers of evergreen
				var wid := 30.0 - r * 7.0
				var top := -12.0 - r * 9.0
				draw_colored_polygon(PackedVector2Array([base + Vector2(-wid / 2.0 - 1, top + 12), base + Vector2(wid / 2.0 + 1, top + 12), base + Vector2(0, top - 3)]), Figures.OUTLINE)
				draw_colored_polygon(PackedVector2Array([base + Vector2(-wid / 2.0, top + 11), base + Vector2(wid / 2.0, top + 11), base + Vector2(0, top - 2)]), Color("2e6a3a"))
				for k in 4:
					var lp := base + Vector2(-wid / 2.0 + 3 + k * (wid - 6) / 3.0, top + 8)
					draw_rect(Rect2(lp, Vector2(2, 2)), LIGHTS[(k + r) % 4] if int(t * 1.5 + k + r) % 3 else Color("fff8d0"))
			var star := base + Vector2(0, -50)
			draw_colored_polygon(PackedVector2Array([star + Vector2(0, -4), star + Vector2(1.2, -1.2), star + Vector2(4, 0), star + Vector2(1.2, 1.2), star + Vector2(0, 4), star + Vector2(-1.2, 1.2), star + Vector2(-4, 0), star + Vector2(-1.2, -1.2)]), Color("f8e070"))
			draw_circle(star, 9.0, Color(1.0, 0.95, 0.6, 0.15 + 0.06 * sin(t * 2.0)))
			for k in 3:                                                                          # gifts underneath
				var g := base + Vector2(-16 + k * 12, -4)
				draw_rect(Rect2(g, Vector2(8, 6)), Figures.OUTLINE)
				draw_rect(Rect2(g + Vector2(1, 1), Vector2(6, 4)), [Color("c83a3a"), Color("4a7ab8"), Color("e8c040")][k])
				draw_rect(Rect2(g + Vector2(3, 1), Vector2(2, 4)), Color("f4ecd8"))

## A trestle table on the green with dishes or seed baskets on it.
func _table(at: Vector2, w: float, things: Array) -> void:
	draw_rect(Rect2(at + Vector2(-1, -1), Vector2(w + 2, 8)), Figures.OUTLINE)
	draw_rect(Rect2(at, Vector2(w, 6)), Color("a07048"))
	draw_rect(Rect2(at + Vector2(2, 6), Vector2(2, 5)), Color("6b4a2a"))
	draw_rect(Rect2(at + Vector2(w - 4, 6), Vector2(2, 5)), Color("6b4a2a"))
	for k in int(w / 8.0):
		draw_rect(Rect2(at + Vector2(2 + k * 8, -2), Vector2(5, 3)), things[k % things.size()])
## The hamlet's bells, hanging under the eaves and swaying a little; one answers the other.
func _draw_bells() -> void:
	for k in 2:
		var hook := Vector2(3 + k * 2, 3) * TILE + Vector2(8, 1)
		var sw := sin(t * 1.7 + k * 1.9) * 2.0
		draw_line(hook, hook + Vector2(sw, 5), Color("4e3220"), 1.0)
		var bp := hook + Vector2(sw - 3, 5)
		draw_rect(Rect2(bp - Vector2(1, 1), Vector2(8, 8)), Figures.OUTLINE)
		draw_rect(Rect2(bp + Vector2(1, 0), Vector2(4, 2)), Color("d8a840"))
		draw_rect(Rect2(bp + Vector2(0, 2), Vector2(6, 4)), Color("d8a840"))
		draw_rect(Rect2(bp + Vector2(1, 2), Vector2(1, 3)), Color("f4d880"))
		draw_rect(Rect2(bp + Vector2(2, 6), Vector2(2, 1)), Color("6b4a2a"))

## Low lavender-grey mist that lies in the hollows and drifts slowly; it stays below faces and paths stay readable.
func _draw_mist() -> void:
	for k in 5:
		var y := (8.5 + k * 1.1) * TILE
		var x := fmod(t * (4.0 + k) + k * 97.0, 30.0 * TILE + 160.0) - 160.0
		draw_rect(Rect2(Vector2(x, y), Vector2(150, 6)), Color(0.78, 0.74, 0.86, 0.10))
		draw_rect(Rect2(Vector2(x + 20, y + 3), Vector2(100, 4)), Color(0.78, 0.74, 0.86, 0.08))
func _draw_water(x: int, y: int, o: Vector2, n: int) -> void:
	_tex(WATER, Vector2i(11, 0), Vector2i.ONE, o)
	var sea: bool = map_name in ["saltmarsh", "farwatch", "league"]
	if sea:
		# the open sea: lines of swell that roll slowly toward the beach
		var ph := fmod(t * 0.6 + x * 0.37 + y * 0.9, 3.0)
		draw_rect(Rect2(o + Vector2(2 + (x * 5) % 7, 3 + ph * 3.0), Vector2(6, 1)), Color(1, 1, 1, 0.35))
		draw_rect(Rect2(o + Vector2(9 - (y * 3) % 5, 10 + ph), Vector2(4, 1)), Color(1, 1, 1, 0.2))
	elif n == 4:
		_tex(WATER, Vector2i(11, 3), Vector2i.ONE, o)                              # a lily pad on the pond
	elif n == 7 and int(t * 1.5 + x) % 3 == 0:
		_tex(WATER, Vector2i(11, 2), Vector2i.ONE, o)                              # a glint of light
	var shore := Color("e0c896")                    # the art direction's sand and deep water (docs/art)
	var edge := Color("2f5f7e")
	if tile_at(Vector2i(x, y - 1)) not in ["~", "j", "q", "b"]:
		draw_rect(Rect2(o, Vector2(16, 3)), shore); draw_rect(Rect2(o + Vector2(0, 3), Vector2(16, 1)), edge)
	if tile_at(Vector2i(x, y + 1)) not in ["~", "j", "q", "b"]:
		draw_rect(Rect2(o + Vector2(0, 13), Vector2(16, 3)), shore); draw_rect(Rect2(o + Vector2(0, 12), Vector2(16, 1)), edge)
	if tile_at(Vector2i(x - 1, y)) not in ["~", "j", "q", "b"]:
		draw_rect(Rect2(o, Vector2(3, 16)), shore); draw_rect(Rect2(o + Vector2(3, 0), Vector2(1, 16)), edge)
	if tile_at(Vector2i(x + 1, y)) not in ["~", "j", "q", "b"]:
		draw_rect(Rect2(o + Vector2(13, 0), Vector2(3, 16)), shore); draw_rect(Rect2(o + Vector2(12, 0), Vector2(1, 16)), edge)

# ---------------------------------------------------------------- out in the wild: items, tall grass, finds, catching
## After each step: pick up anything lying there, and in tall grass, every 8-16 steps you find something (explore()
## in the browser game): a wild creature (62%), a small find (14%), or a moment in the woods.
func _arrived(p: Vector2i) -> void:
	_festival_tick()
	if INTERIORS.has(map_name) and stage == "free" and INTERIORS[map_name].has("find"):
		var f: Dictionary = INTERIORS[map_name].find
		if p == f.at and not got_items.has(f.id):      # something to find at home: kept in the same list as items outdoors
			got_items[f.id] = true
			var found: Array = []
			for k in f.give:
				bag[k] = int(bag.get(k, 0)) + int(f.give[k])
				found.append("%d %s" % [int(f.give[k]), k])
			say("", "You found %s!" % R.words(found))
			say(f.who, f.line)
	if indoors() or stage != "free":
		return
	if map_name != "larkhaven":
		_egg_step()                                  # the egg warms while you're out on your journey
		_letter_step()                               # and now and then a letter comes from Maren
	for it in DATA.MAPS[map_name].get("items", []):
		if not got_items.has(it.id) and Vector2i(int(it.at[0]), int(it.at[1])) == p:
			got_items[it.id] = true
			var found: Array = []
			for k in it.give:
				bag[k] = int(bag.get(k, 0)) + int(it.give[k])
				found.append("%d %s" % [int(it.give[k]), k])
			say("", "You found %s!" % R.words(found))
	if tile_at(p) == "\"" and DATA.MAPS[map_name].has("biome"):
		grass_n -= 1
		if grass_n <= 0:
			grass_n = rng.randi_range(6, 12) if heritage() == "wander" else rng.randi_range(8, 16)   # wanderers find more in the grass
			walk_to.clear()
			_explore()

func _explore() -> void:
	if team.filter(func(c): return c.hp > 0).is_empty():
		say("", "Your team is exhausted. Rest with Maren in Larkhaven first.")
		return
	var biome_id: String = DATA.MAPS[map_name].biome
	explored_in[biome_id] = int(explored_in.get(biome_id, 0)) + 1
	var b := _beat_here(biome_id)
	if not b.is_empty():
		_story_beat(b)
		return
	var r := rng.randf()
	if r < 0.62:
		_wild_battle()
	elif r < 0.76:
		if rng.randf() < 0.5:
			var c := roundi(rng.randi_range(8, 20) * float(DATA.JOURNEY.classic.coins))
			bag.coins += c
			sfx.play("coin")
			say("", "You find %d coins under a fallen log." % c)
		else:
			bag.lures += 1
			sfx.play("pick")
			say("", "You find a lure caught in some brambles.")
	else:
		say("", ["You follow a stream deeper into Thornwood.", "Birdsong all around. Your team looks happy.", "You rest in a sunny clearing for a moment.",
			"Pawprints in the mud lead off between the trees.", "A breeze rustles the old oaks."][rng.randi() % 5])

## A wild creature from this place's table (wildPick and wildLvl): weighted by how common each is, its level near your
## team's, within the area's range.
func _wild_battle() -> void:
	var biome: Dictionary = DATA.BIOMES[DATA.MAPS[map_name].biome]
	var table: Array = _wild_table()
	var total := 0.0
	for w in table:
		total += float(w[1])
	var roll := rng.randf() * total
	var id: String = table[0][0]
	for w in table:
		roll -= float(w[1])
		if roll <= 0.0:
			id = w[0]
			break
	var avg := 0.0
	for c in team:
		avg += c.lvl
	avg = roundf(avg / maxf(1.0, team.size()))
	var lvl := clampi(rng.randi_range(int(avg) - 2, int(avg) + 1), int(biome.lv[0]), int(biome.lv[1]))
	var foe := R.make(id, lvl, { "rar": R.roll_rarity(float(DATA.JOURNEY.classic.rare), rng) }, rng)
	seen[id] = true
	battle_story = ""
	battle.max_level = level_cap()
	battle.open("wild", team, [foe], "")

func _after_wild(result: String) -> void:
	for c in battle.caught:
		restore.append({ "where": map_name, "at": me.pos + Vector2(8, 8), "r": 0.0, "goal": 64.0 })   # trust brings the colour back
		bonded[c.sp] = true
		seen[c.sp] = true
		if team.size() < 3:
			team.append(c)
			say("", "%s joins your team." % c.name)
		else:
			ranch.append(c)
			_place_ranch()
			say("", "%s heads to Maren's ranch. You'll find it in the paddock by her barn, or resting inside." % c.name)
	if result == "lost":
		var lost := roundi(bag.coins * 0.1)
		bag.coins -= lost
		_go("larkhaven", Vector2i(18, 6), Vector2i.UP)
		for c in team:
			c.hp = R.stats(c).hp
		say("", "Your team is exhausted. You hurry back to Larkhaven%s." % (" (-%d coins)" % lost if lost > 0 else ""))
		say("maren", "Oh, look at you all. Sit down, sit down. There. Everyone's rested.")

func _maren_heals() -> void:
	for c in team:
		c.hp = R.stats(c).hp
	me.face = maren.tile - me.tile
	say("maren", ["Let me look at you all... There. Good as new. Off you go.", "Rested and fed. Mind the bramble patches out there.",
		"Everyone's fine, love. %s wants to show you something in the tall grass, I think." % _partner_name()][rng.randi() % 3])
	_season_word(_maren_data())
	_festival_invite()

func _satchel_shown() -> bool:
	return stage == "free" and not lessons.visible and not battle.visible and not book.visible and not shop.visible

## Each badge's colour, pinned to the satchel strap and shown in the field book (the element of its Warden's town).
const BADGE_COL := { "thorn": Color("5d9a3e"), "tide": Color("3a8fd8"), "ember": Color("e0602a"), "beacon": Color("e8c84a"),
	"reed": Color("7ab89a"), "echo": Color("6a5a8a"), "loom": Color("9a8a74"), "horizon": Color("8ac8e0") }

## The satchel, drawn small in the corner: a leather bag with its flap, and a pin on the strap for each badge you hold.
func _draw_satchel() -> void:
	var c := satchel
	var ink := Color(0.1, 0.12, 0.14)
	for r in [Rect2(4, 0, 16, 3), Rect2(4, 0, 3, 7), Rect2(17, 0, 3, 7)]:   # the strap, an arch over the bag
		c.draw_rect(r, ink)
	for r in [Rect2(5, 1, 14, 1), Rect2(5, 1, 1, 6), Rect2(18, 1, 1, 6)]:
		c.draw_rect(r, Color("6b4a2a"))
	c.draw_rect(Rect2(0, 6, 24, 16), ink)                                  # the bag
	c.draw_rect(Rect2(1, 7, 22, 14), Color("a0703a"))
	c.draw_rect(Rect2(1, 7, 22, 6), Color("8a5a2a"))                       # the flap
	c.draw_rect(Rect2(10, 11, 4, 4), Color("e8c84a"))                      # the clasp
	c.draw_rect(Rect2(11, 12, 2, 2), Color("a0803a"))
	for i in badges.size():                                                 # badges along the bottom, two rows of four
		var at := Vector2(2 + (i % 4) * 5, 15 + (i / 4) * 3)
		c.draw_rect(Rect2(at, Vector2(4, 3)), ink)
		c.draw_rect(Rect2(at + Vector2(1, 0), Vector2(2, 2)), BADGE_COL.get(badges[i], Color.WHITE))

## For testing and recordings (run with -- --skip-opening): start in Thornwood with Ripplet, as if the opening were done.
func _skip_opening() -> void:
	my_look = LOOKS.tamer.duplicate()
	my_look.name = "Rowan"
	painted = true
	spilled = true
	for s in starters:
		if s.id == "ripplet":
			partner = s
	partner.home = Rect2i()
	team = [R.make("ripplet", 5, { "rar": 1 }, rng)]
	rival_c = R.make("mosshog", 4, { "rar": 1 }, rng)
	seen = { "ripplet": true, "mosshog": true }
	bonded = { "ripplet": true }
	wren.where = "gone"
	maren.where = "larkhaven"
	maren.tile = BARN_DOOR + Vector2i(1, 1)
	maren.pos = Vector2(maren.tile) * TILE
	stage = "free"
	fade_in = 1.0
	var start := "thornwood"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--at="):
			start = a.substr(5)                          # e.g. -- --skip-opening --at=saltmarsh
	if "--book" in OS.get_cmdline_user_args():        # the field book open on Poolkit, to see a page (-- --skip-opening --book)
		seen["poolkit"] = true
		(func():
			_open_book()
			book.sel = book.ids.find("poolkit")).call_deferred()
	if "--ranch" in OS.get_cmdline_user_args():       # a few creatures at the ranch, to see it (-- --skip-opening --at=larkhaven --ranch)
		for sp in ["fernruff", "poolkit", "hearthlaugh", "slatehoof", "kilnchirp", "dewspinner"]:
			ranch.append(R.make(sp, 12, { "rar": 1 }, rng))
		_place_ranch()
	var st: Array = DATA.MAPS[start].get("start", [16, 12, "up"] if start == "larkhaven" else [13, 14, "up"])
	if start != "thornwood":
		var order := ["thornwood", "saltmarsh", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch", "league"]
		var at := maxi(1, order.find(start))
		badges = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"].slice(0, at)
		team[0].lvl = [5, 14, 24, 34, 46, 56, 62, 66, 72][at]
		team[0].hp = R.stats(team[0]).hp
	for a in OS.get_cmdline_user_args():           # a festival day for a picture: -- --skip-opening --at=larkhaven --festival=midwinter
		if a.begins_with("--festival=") and Calendar.FESTIVALS.has(a.substr(11)):
			var fz: Dictionary = Calendar.FESTIVALS[a.substr(11)]
			cal.played = Calendar.DAY_SECONDS * (Calendar.DAYS * Calendar.SEASONS.find(fz.season) + int(fz.days[0]) - 1) + 1.0
	for a in OS.get_cmdline_user_args():           # a season held for a picture: -- --skip-opening --at=larkhaven --season=winter
		if a.begins_with("--season="):
			cal.mode = a.substr(9)
	if "--homecoming" in OS.get_cmdline_user_args():   # the league gate after the Champion (-- --skip-opening --at=league --homecoming)
		(func():
			story_done["leagueChampion"] = true
			story_done["leagueEnding"] = true
			_homecoming()).call_deferred()
	if "--photo" in OS.get_cmdline_user_args():      # pictures of the world: nobody asks to evolve mid-shot
		for c in team: c["hold"] = 999
	for a in OS.get_cmdline_user_args():           # a picture inside a room: -- --skip-opening --at=larkhaven --room=inn
		if a.begins_with("--room="):
			(func(): _go(a.substr(7))).call_deferred()
	for a in OS.get_cmdline_user_args():           # stand on a tile for a picture: -- --skip-opening --at=stillreed --stand=18,1
		if a.begins_with("--stand="):
			var xy := a.substr(8).split(",")
			get_tree().create_timer(0.4).timeout.connect(func():
				me.tile = Vector2i(int(xy[0]), int(xy[1]))
				me.pos = Vector2(me.tile) * TILE
				me.path.clear()
				me.face = Vector2i.DOWN)
	if "--depth" in OS.get_cmdline_user_args():       # a picture of depth: Maren stands just in front of you (-- --skip-opening --at=larkhaven --depth)
		(func():
			maren.where = map_name
			maren.tile = me.tile + Vector2i.DOWN
			maren.pos = Vector2(maren.tile) * TILE
			maren.path.clear()).call_deferred()
	if "--colour" in OS.get_cmdline_user_args():     # the area with its colour fully back (for pictures of the restored valley)
		for m in ["larkhaven", "thornwood", "saltmarsh", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch", "league", "barn"]:
			restore.append({ "where": m, "at": Vector2(192, 108), "r": 5000.0, "goal": 5000.0 })
	if "--bench" in OS.get_cmdline_user_args():      # at Maren's workbench, the partner trying on a harness (-- --skip-opening --bench)
		for c in team: c["hold"] = 999
		team[0]["gear"] = "harness"
		story_done["bench"] = true
		_lead_look()
		_go("barn", Vector2i(2, 9), Vector2i.LEFT)
		trans_t = 0.29
		(func():
			bench_i = 0
			_open_bench()).call_deferred()
		return
	if "--nursery" in OS.get_cmdline_user_args() and ranch.size() >= 2:   # two in the nursery and an egg in the straw (with --ranch)
		for c in team: c["hold"] = 999                    # (a picture of the nursery, not of a change)
		ranch[0]["stall"] = true
		ranch[1]["stall"] = true
		egg = { "child": R.make("fernruff", 3, { "rar": 1 }, rng), "steps": EGG_STEPS, "from": [ranch[0].name, ranch[1].name] }
		_place_ranch()
		_go("barn", Vector2i(5, 6), Vector2i.UP)
		trans_t = 0.29
		return
	_go(start, Vector2i(int(st[0]), int(st[1])), DIRS.get(st[2], Vector2i.UP))
	trans_t = 0.29

# ---------------------------------------------------------------- people of the valley: route trainers and Wardens
## Everyone standing in the built maps, from the game data (MAPS[..].npcs and the Warden's spot), dressed from CAST.
func _make_npcs() -> void:
	for map_id in BUILT:
		var m: Dictionary = DATA.MAPS[map_id]
		for n in m.get("npcs", []):
			if n.who == "maren":
				continue                             # Maren is in the story already
			var mv := Mover.new(n.who, map_id, Vector2i(int(n.at[0]), int(n.at[1])))
			mv.face = DIRS.get(n.get("dir", "down"), Vector2i.DOWN)
			mv.right = mv.face.x >= 0
			npcs.append(mv)
			npc_info[n.who] = { "data": n, "beaten": false, "warden": false }
		if m.has("warden"):
			# the Warden's scene is the story beat with a gate in this map's area (Thornwood's has no area named)
			var beat: Dictionary = {}
			for b in DATA.STORY:
				if b.has("gate") and str(b.get("biome", "thornwood")) == str(m.get("biome", "")):
					beat = b
			var who := ""
			for l in beat.get("lines", []):
				if who == "" and str(l[0]) != "" and not str(l[0]).begins_with("@"):
					who = l[0]
			if who == "":
				continue
			var mv := Mover.new(who, map_id, Vector2i(int(m.warden[0]), int(m.warden[1])))
			mv.face = Vector2i.DOWN
			npcs.append(mv)
			npc_info[who] = { "data": beat, "beaten": false, "warden": true }

## A person's look from CAST in the game data (skin, hair style and colour, shirt), as parts for figures.gd.
func _cast_look(who: String) -> Dictionary:
	var c: Dictionary = DATA.CAST.get(who, {})
	var style: String = c.get("hair", "short")
	if style not in ["cap", "short", "long", "ponytail", "bun", "spiky"]:
		style = "short"
	var shirt := Color(c.get("shirt", "#7a6a5a"))
	return { "skin": Color(c.get("skin", "#e8c4a0")), "hair": Color(c.get("hairCol", "#4a3a2a")), "shirt": shirt,
		"legs": shirt.darkened(0.45), "style": style, "body": "narrow" if style in ["long", "bun", "ponytail"] else "broad" }

## Whether a map's gate is open: its Warden has been beaten (or it has none).
func _gate_open(map_id: String) -> bool:
	for n in npcs:
		if n.where == map_id and npc_info[n.id].warden:
			return npc_info[n.id].beaten
	return true

## After each of your steps: has a trainer who hasn't battled you yet seen you? (They look straight ahead, `sight` tiles.)
func _check_spotted() -> void:
	if spotter or stage != "free" or battle.visible:
		return
	for n in npcs:
		var info: Dictionary = npc_info[n.id]
		if n.where != map_name or info.warden or info.beaten or not info.data.has("trainer"):
			continue
		var sight := int(info.data.trainer.get("sight", 3))
		for k in range(1, sight + 1):
			var p: Vector2i = n.tile + n.face * k
			if solid(tile_at(p)):
				break
			if p == me.tile:
				spotter = n
				walk_to.clear()
				sfx.play("warn")
				me.face = -n.face
				# they walk over and stop in front of you; coming up or down the screen they keep a tile's gap, since
				# people are taller than a tile and would otherwise stand on each other
				var gap := 2 if n.face.y != 0 else 1
				n.path = route(n.tile, me.tile - n.face * gap) if k > gap else []
				n.speed = 5.0
				spot_t = 0.0
				return

func _spotter_tick(dt: float) -> void:
	if not spotter:
		return
	spot_t += dt
	if spot_t < 0.7 or not spotter.path.is_empty():
		return                                       # the "!" over their head, then they walk over
	var n := spotter
	spotter = null
	n.speed = 4.0
	n.face = me.tile - n.tile
	_challenge(n)

## A trainer or a Warden challenges you: their lines, then the battle.
func _challenge(n: Mover) -> void:
	var info: Dictionary = npc_info[n.id]
	var d: Dictionary = info.data
	for l in (d.get("lines", []) as Array):
		say(l[0], _fill(l[1]))
	var team_data: Array = d.trainer.team if d.has("trainer") and d.trainer is Dictionary else d.get("team", [])
	then_do = func():
		var foes: Array = []
		for t2 in team_data:
			foes.append(R.make(t2[0], int(t2[1]), { "rar": 1 }, rng))
			seen[t2[0]] = true
		battle_story = "trainer:" + n.id
		battle.max_level = level_cap()
		battle.open("trainer", team, foes, DATA.CAST.get(n.id, {}).get("name", n.id.capitalize()))

func _after_trainer(who: String, result: String) -> void:
	var info: Dictionary = npc_info[who]
	var d: Dictionary = info.data
	if result == "won":
		info.beaten = true
		var lv_sum := 0
		for f in battle.foes:
			lv_sum += int(f.c.lvl)
		var coins := roundi(lv_sum * 12 * float(DATA.JOURNEY.classic.coins))
		bag.coins += coins
		var win: Array = d.trainer.win if d.has("trainer") and d.trainer is Dictionary else d.get("win", [])
		for l in win:
			say(l[0], _fill(l[1]))
		say("", "You win %d coins." % coins)
		if info.warden:
			var badge: String = d.get("gate", "thorn")
			badges.append(badge)
			sfx.play("secret")
			restore.append({ "where": map_name, "at": me.pos + Vector2(8, 8), "r": 0.0, "goal": 200.0 })
			say("", "You earned the %s! The way onward opens, and colour runs out across %s." % [DATA.BADGES[badge].name, DATA.MAPS[map_name].name])
			if TEACHERS.has(badge) and not TEACHERS[badge].order in taught:
				var tch: Dictionary = TEACHERS[badge]
				for l in tch.lines:
					say(who, l)
				taught.append(tch.order)
				say("", "You learned an order: %s. You'll find it under Orders in battle." % tch.name)
	else:
		_after_wild("lost")

# ---------------------------------------------------------------- post-Champion Spire and Warden rematches (WB5.1)
func _postgame_open() -> bool:
	return story_done.has("leagueEnding")

func _grown_for_level(id: String, level: int) -> String:
	var out := id
	var guard := 0
	while DATA.SPECIES.get(out, {}).has("evo") and level >= int(DATA.SPECIES[out].evo.at) and guard < 4:
		out = str(DATA.SPECIES[out].evo.to)
		guard += 1
	return out

func _spire_floor_data(floor: int) -> Dictionary:
	var areas := ["thornwood", "saltmarsh", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch"]
	var area: String = areas[(floor - 1) % areas.size()]
	var level := mini(100, 74 + maxi(1, floor))
	var pool: Array = DATA.BIOMES[DATA.MAPS[area].biome].wild.map(func(w): return str(w[0])).filter(func(id): return not bool(DATA.SPECIES[id].get("unique", false)))
	var foes: Array = []
	for i in 3:
		foes.append(_grown_for_level(pool[(floor + i * 2) % pool.size()], level))
	return { "area": area, "level": level, "team": foes }

func _spire_talk(_n: Mover) -> void:
	if not _postgame_open():
		say("orla", "The light is for Champions. Finish your league journey first; then come back with the team that carried you.")
		return
	if not spire_active:
		spire_floor = 0
		spire_active = true
		for c in team: c.hp = R.stats(c).hp
		say("orla", "A climb begins rested. Every fifth floor has water and a quiet bench. Leave whenever your partners need the road again.")
	else:
		say("orla", "Floor %d is behind you. Your best is %d. Ready for the next question?" % [spire_floor, spire_best])
	then_do = _spire_fight

func _spire_fight() -> void:
	if not spire_active or not _postgame_open() or map_name != "spire":
		return
	if team.filter(func(c): return c.hp > 0).is_empty():
		spire_active = false
		spire_floor = 0
		say("orla", "That is enough for this climb. Your partners come first.")
		return
	var floor := spire_floor + 1
	var data := _spire_floor_data(floor)
	var foes: Array = []
	for id in data.team:
		foes.append(R.make(id, int(data.level), { "rar": mini(3, 1 + int(floor / 10)) }, rng))
		seen[id] = true
	battle_story = "spire:" + str(floor)
	battle.max_level = 100
	battle.open("trainer", team, foes, "Spire floor %d" % floor)

func _after_spire(floor: int, result: String) -> void:
	if not spire_active or floor != spire_floor + 1:
		return
	if result != "won":
		spire_active = false
		spire_floor = 0
		for c in team: c.hp = R.stats(c).hp
		say("orla", "That is enough for this climb. Your best floor is safe; your team gets the bench and the water.")
		return
	spire_floor = floor
	spire_best = maxi(spire_best, floor)
	var coins := 180 + floor * 20
	bag.coins += coins
	bag.lures += 2
	say("", "Spire floor %d cleared: %d coins and 2 lures." % [floor, coins])
	if floor % 5 == 0:
		for c in team: c.hp = R.stats(c).hp
		say("orla", "Five floors together. Water, a quiet bench, and a full rest before you choose whether to climb again.")
	else:
		say("orla", "Talk to me when your partners are ready for the next floor.")

func _start_warden_rematch(n: Mover) -> void:
	if team.filter(func(c): return c.hp > 0).is_empty():
		say(n.id, "Your partners need rest before we ask anything more of them.")
		return
	var d: Dictionary = npc_info[n.id].data
	var tier := int(rematch_wins.get(n.id, 0)) + 1
	var team_data: Array = d.get("team", [])
	var foes: Array = []
	for t2 in team_data:
		var level := mini(100, int(t2[1]) + 8 + (tier - 1) * 3)
		var id := _grown_for_level(str(t2[0]), level)
		foes.append(R.make(id, level, { "rar": mini(3, tier) }, rng))
		seen[id] = true
	say(n.id, "Champion. Our last battle taught us something. Let us see what changed since then.")
	then_do = func():
		battle_story = "rematch:" + n.id
		battle.max_level = 100
		battle.open("trainer", team, foes, "%s · rematch %d" % [DATA.CAST.get(n.id, {}).get("name", n.id.capitalize()), tier])

func _after_warden_rematch(who: String, result: String) -> void:
	if result != "won":
		say(who, "Good. A rematch should give both teams something to carry home. Rest, then come find us again.")
		return
	var tier := int(rematch_wins.get(who, 0)) + 1
	rematch_wins[who] = tier
	var coins := 240 + tier * 60
	bag.coins += coins
	say(who, "Stronger than last time, and still listening. Come back when you want the next version of this battle.")
	say("", "Warden rematch tier %d cleared: %d coins." % [tier, coins])

## Where to go next, in Maren's words, by the badges you hold (the field book shows it; her letters mention it).
const WHERE_NEXT := [
	"Warden Isolde keeps the Thorn Badge, up the north road in Thornwood. Show her what you and {starter} can do.",
	"Thornwood's south road runs down to Saltmarsh Coast. Warden Nerys tests tamers on the tide flats there.",
	"From the coast, the high road climbs to the Emberfall Highlands. Warden Toren is patient, so be patient back.",
	"North of Emberfall is Cloudglass Pass. Warden Vessa waits up in the cloud with the Beacon Badge.",
	"Past the pass, the valley opens out toward Stillreed. That road isn't safe to travel yet; rest your team and wait.",
]
func where_next() -> String:
	return _fill(WHERE_NEXT[mini(badges.size(), WHERE_NEXT.size() - 1)])

## Maren's letters: every so often on your journey a runner brings one. Ranch news, a little about your creatures, and a
## nudge toward where to go next. Being away lets the ranch creatures miss you a little (a touch more trust).
const LETTER_STEPS := 220
var letter_steps := LETTER_STEPS
var letters := 0

func _letter_step() -> void:
	letter_steps -= 1
	if letter_steps > 0 or not lines.is_empty():
		return
	letter_steps = LETTER_STEPS
	letters += 1
	var news: String
	if ranch.is_empty():
		news = "The paddock's quiet without anyone of yours in it. The pup keeps looking down the road for you."
	else:
		var c: Dictionary = ranch[letters % ranch.size()]
		for r in ranch:
			R.add_bond(r, 1.0)
		news = ["%s has taken to sleeping by the barn door, waiting for you." % c.name,
			"%s ate twice its share at the trough this morning and looked very pleased about it." % c.name,
			"%s and the pup chased each other round the paddock till they both fell over." % c.name][letters % 3]
		if ranch.size() > 1:
			news += " The others are well, and they miss you."
	if not egg.is_empty():
		news += " The egg is warm. Not long now."
	say("", "A runner from Larkhaven catches you up with a letter from Maren.")
	say("maren", "\"Dear %s, all's well at the ranch. %s\"" % [my_look.get("name", "love"), news])
	say("maren", "\"%s Mind how you go. Maren.\"" % where_next())

## Orders people teach you (battle.gd ORDERS), after you've earned their badge. More teachers come with more areas.
const TEACHERS := {
	"thorn": { "order": "shelter", "name": "Shelter", "lines": ["Brace together before a heavy hit. Shelter buys your partner a moment."] },
	"tide": { "order": "rain", "name": "Rain Call", "lines": ["Soak a foe, then let an Ember partner turn the water to steam."] },
	"beacon": { "order": "tailwind", "name": "Tailwind", "lines": ["A quick partner can make room for the next. Tailwind lifts the whole team."] },
	"reed": { "order": "snare", "name": "Hold the Line", "lines": ["Roots slow a foe. Give your partner time to choose the next step."] },
	"echo": { "order": "expose", "name": "Spot the Gap", "lines": ["Watch for a gap. Expose a foe, then let your partner take the opening."] },
	"loom": { "order": "mend", "name": "Shared Care", "lines": ["Let each partner catch its breath. Shared Care helps everyone recover."] },
	"horizon": { "order": "renew", "name": "Fresh Start", "lines": ["When every plan is tangled, clear the harmful effects and start together."] },
	"ember": { "order": "steady", "name": "Steady", "lines": [
		"Before you go. Your creatures fight hard, but they panic when the poison takes or their legs go slow. I've watched it.",
		"Speak low. Slow. Let them hear you're not afraid, and they won't be either. Up here we call it Steady. Use it." ] },
}
var lessons: Control
var taught: Array = []                       # orders you've been taught (saved)

## Talking to someone beside you: a trainer you've beaten, a Warden, or a sign in front of you.
func _talk_here() -> bool:
	for n in npcs:
		if n.where == map_name and (me.tile - n.tile).length() <= 1.01:
			var info: Dictionary = npc_info[n.id]
			n.face = me.tile - n.tile
			if info.data.has("league"):
				_league_talk(n, info.data)
				return true
			var known := _heritage_line(n.id, info.data)
			if known != "" and not story_done.has("her:" + n.id):
				story_done["her:" + n.id] = true       # they recognise your family, once (T45 lines, from the game data)
				say(n.id, _fill(known))
			if info.data.get("tower", "") == "keeper":
				_spire_talk(n)
			elif info.warden and info.beaten and story_done.has("leagueEnding") and not story_done.has("championGreeting:" + n.id) and info.data.get("byStory", {}).has("leagueEnding"):
				story_done["championGreeting:" + n.id] = true
				for l in info.data.byStory.leagueEnding:      # first return: the Champion welcome remains a conversation
					say(l[0], _fill(l[1]))
			elif info.warden and info.beaten and story_done.has("leagueEnding"):
				_start_warden_rematch(n)
			elif info.warden and info.beaten:
				say(n.id, _fill(DATA.MAPS[map_name].get("wardenDone", "The gate is yours, {name}.")))
			elif not info.warden and not info.data.has("trainer"):
				var talk: Array = info.data.get("lines", [])
				for b in badges:                       # what folk say changes with your badges (byBadge)
					if info.data.get("byBadge", {}).has(b):
						talk = info.data.byBadge[b]
				for l in talk:
					say(l[0], _fill(l[1]))
				_season_word(info.data)
				_festival_gift(n.id)
			elif info.beaten:
				for l in (info.data.trainer.get("after", []) as Array):
					say(l[0], _fill(l[1]))
				_season_word(info.data)
			else:
				_challenge(n)
			return true
	for m in ranch_movers:
		if m.where == map_name and (me.tile - m.tile).length() <= 1.01:
			_visit(m)
			return true
	var ahead: Vector2i = me.tile + me.face
	if tile_at(ahead) in ["P", "q"]:
		var key := "%d,%d" % [ahead.x, ahead.y]
		say("", str(DATA.MAPS[map_name].get("signs", {}).get(key, "The sign is too weathered to read.")))
		return true
	return false

## Whether someone is standing still on a tile (people in the world and Maren), so walks go around them.
func _someone_standing(p: Vector2i) -> bool:
	for m in npcs + [maren]:
		if m.where == map_name and m.tile == p and m.path.is_empty():
			return true
	return false

## A creature that steps aside when you walk into it (your partner, Maren's pup, creatures at the ranch), standing on p.
func _gentle_at(p: Vector2i) -> Mover:
	for m in [partner, pup] + ranch_movers:
		if m and m.where == map_name and m.tile == p and m.path.is_empty():
			return m
	return null

# ---------------------------------------------------------------- saving your journey (user://journey.json)
## Saved automatically every few seconds while you're free to walk (not mid-battle or mid-conversation) and when the
## window closes. The opening isn't saved part-way: a journey is saved from the moment you're free in Larkhaven.
var save_t := 0.0

func _autosave(dt: float) -> void:
	save_t += dt
	if save_t >= 5.0:
		save_t = 0.0
		save_game()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()

func save_game() -> void:
	if no_save or stage != "free" or battle.visible or lessons.visible or not lines.is_empty() or trans_t >= 0.0:
		return
	var look := {}
	for k in my_look:
		look[k] = (my_look[k] as Color).to_html() if my_look[k] is Color else my_look[k]
	var beaten: Array = []
	for k in npc_info:
		if npc_info[k].beaten:
			beaten.append(k)
	var d := { "v": 1, "saved": Time.get_datetime_string_from_system(), "look": look, "team": team, "ranch": ranch, "bag": bag,
		"badges": badges, "seen": seen, "bonded": bonded, "items": got_items, "beaten": beaten,
		"restore": restore.map(func(r): return { "where": r.where, "x": r.at.x, "y": r.at.y, "goal": r.goal }),
		"explored": explored_in, "story": story_done, "retry": story_retry, "egg": egg, "gear": gear_owned, "taught": taught, "letter": [letter_steps, letters], "calendar": cal.to_dict(), "festival": { "done": fest_done, "keep": keepsakes, "flowers": flowers }, "league": league_room,
		"spire": { "floor": spire_floor, "best": spire_best, "active": spire_active }, "rematches": rematch_wins,
		"map": map_name, "x": me.tile.x, "y": me.tile.y, "partner": partner.id if partner else "" }
	SafeSave.write(save_path, d)                 # a spare file first, the last good save kept as a backup

func _read_save() -> Dictionary:
	return SafeSave.read(save_path, func(d: Dictionary) -> bool:
		return int(d.get("v", 0)) == 1 and d.get("team") is Array and not d.team.is_empty())

func _save_summary() -> String:
	var d := _read_save()
	if d.is_empty():
		return ""
	var where: String = "Maren's barn" if d.map == "barn" else (str(INTERIORS[d.map].name) if INTERIORS.has(d.map) else str(DATA.MAPS.get(d.map, {}).get("name", d.map)))
	var nb: int = d.badges.size()
	return "%s and %s, in %s. %d badge%s, %d in the Wilddex." % [d.look.get("name", "You"), DATA.SPECIES[d.team[0].sp].name if d.team[0].name == null else d.team[0].name,
		where, nb, "" if nb == 1 else "s", d.seen.size()]

## A creature read back from the save: JSON stores every number as a decimal, so whole numbers are made whole again.
func _fix_creature(c: Dictionary) -> Dictionary:
	for k in ["lvl", "xp", "rar", "hp"]:
		c[k] = int(c[k])
	for s in c.pot:
		c.pot[s] = int(c.pot[s])
	c.bond = float(c.bond)
	return c

func _load_game() -> bool:
	var d := _read_save()
	if d.is_empty():
		return false
	my_look = {}
	for k in d.look:
		my_look[k] = Color(d.look[k]) if k in ["skin", "hair", "hat", "shirt", "legs", "shoes", "apron"] else d.look[k]
	team = d.team.map(_fix_creature)
	ranch = d.ranch.map(_fix_creature)
	_place_ranch()
	for k in d.bag:
		bag[k] = int(d.bag[k])                       # the same satchel the battle screen holds
	badges = d.badges
	seen = d.seen
	bonded = d.bonded
	got_items = d.items
	explored_in = d.get("explored", {})
	story_done = d.get("story", {})
	story_retry = d.get("retry", {})
	taught = Array(d.get("taught", []))
	for earned in badges:
		if TEACHERS.has(earned) and not TEACHERS[earned].order in taught:
			taught.append(TEACHERS[earned].order)
	cal.from_dict(d.get("calendar", {}))
	league_room = int(d.get("league", 0))
	var sz: Dictionary = d.get("spire", {})
	spire_floor = int(sz.get("floor", 0))
	spire_best = int(sz.get("best", 0))
	spire_active = bool(sz.get("active", false)) and story_done.has("leagueEnding")
	rematch_wins = d.get("rematches", {})
	var fz: Dictionary = d.get("festival", {})
	fest_done = fz.get("done", {})
	keepsakes = fz.get("keep", {})
	flowers = Array(fz.get("flowers", []))
	var lt: Array = d.get("letter", [LETTER_STEPS, 0])
	letter_steps = int(lt[0])
	letters = int(lt[1])
	gear_owned = {}
	for k in d.get("gear", {}):
		gear_owned[k] = int(d.gear[k])
	egg = d.get("egg", {})
	if not egg.is_empty():
		egg.steps = int(egg.steps)
		egg.child = _fix_creature(egg.child)
	for k in d.beaten:
		if npc_info.has(k):
			npc_info[k].beaten = true
	restore = d.restore.map(func(r): return { "where": r.where, "at": Vector2(float(r.x), float(r.y)), "r": float(r.goal), "goal": float(r.goal) })
	for s in starters:
		if s.id == d.partner:
			partner = s
			partner.home = Rect2i()
	_lead_look()
	painted = true
	spilled = true
	stage = "free"
	wren.where = "gone"
	maren.where = "larkhaven"
	maren.tile = BARN_DOOR + Vector2i(1, 1)
	maren.pos = Vector2(maren.tile) * TILE
	fade_in = 1.0
	_go(d.map, _off_new_homes(str(d.map), Vector2i(int(d.x), int(d.y))), Vector2i.DOWN)
	trans_t = 0.29
	say("", "Welcome back, %s." % my_look.get("name", "tamer"))
	return true

# ---------------------------------------------------------------- Larkhaven's inn and shop
func _door(kind: String) -> void:
	walk_to.clear()
	if kind == "inn":
		for c in team:
			c.hp = R.stats(c).hp
		say("", "The innkeeper brings out warm blankets. Your team is fully healed.")
	elif kind == "shop":
		shop.open([
			{ "name": "5 lures", "give": { "lures": 5 }, "cost": 50 },
			{ "name": "5 berries", "give": { "berries": 5 }, "cost": 5 * int(DATA.FOODS.berries.cost) },
		])

## The field book (book.gd): the Wilddex and your team, from what you've seen and who chose you.
func _open_book() -> void:
	walk_to.clear()
	sfx.play("open")
	book.seen = seen
	book.bonded = bonded
	book.team = team
	book.ranch = ranch
	book.where = where_next()
	book.cal = cal
	book.keepsakes = keepsakes.values()
	book.bag = bag
	book.badges = badges.map(func(b): return { "name": str(DATA.BADGES[b].name), "col": BADGE_COL.get(b, Color.WHITE) })
	book.open()

# ---------------------------------------------------------------- story moments while you explore (the browser's STORY)
## Each area has moments that come as you explore it (STORY in the game data, `at` = explorations there): Wren catching
## you up for a rematch, an old guardian stepping out of the trees or the surf. Wardens are met in person instead.
var explored_in := {}                        # area -> times explored
var story_done := {}                         # story id -> true
var story_retry := {}                        # story id -> explorations to wait before it can come again

func level_cap() -> int:
	var t: Array = DATA.CAP_TABLE
	return int(t[mini(badges.size(), t.size() - 1)])

func _beat_here(biome_id: String) -> Dictionary:
	for b in DATA.STORY:
		if b.has("gate") or story_done.has(b.id) or str(b.get("biome", "thornwood")) != biome_id:
			continue
		if int(explored_in.get(biome_id, 0)) < int(b.get("at", 0)):
			continue
		if int(explored_in.get(biome_id, 0)) < int(story_retry.get(b.id, 0)):
			continue
		if b.has("league"):
			continue
		return b
	return {}

func _story_beat(b: Dictionary) -> void:
	walk_to.clear()
	var rival := b.has("team")
	if rival:
		# Wren turns up beside you for the rematch
		wren.where = map_name
		wren.tile = _beside_me()
		wren.pos = Vector2(wren.tile) * TILE
		wren.path.clear()
		wren.face = me.tile - wren.tile
	for l in b.get("lines", []):
		var who: String = l[0]
		say("" if who.begins_with("@") else who, _fill(l[1]))
	then_do = func():
		battle_story = "story:" + b.id
		battle.max_level = level_cap()
		if rival:
			var foes: Array = []
			for t2 in b.team:
				var sp: String = rival_c.get("sp", "cindercub") if t2[0] == "$rival" else t2[0]
				foes.append(R.make(sp, int(t2[1]), { "rar": 1 }, rng))
				seen[sp] = true
			battle.open("trainer", team, foes, DATA.CAST.wren.name)
		else:
			var w: Array = b.wild
			var foe := R.make(w[0], int(w[1]), { "rar": int(w[2]) }, rng)
			seen[w[0]] = true
			battle.open("wild", team, [foe], "")

func _after_story(id: String, result: String) -> void:
	var b: Dictionary = {}
	for s in DATA.STORY:
		if s.id == id:
			b = s
	var caught_it: bool = not battle.caught.is_empty()
	if b.has("wild"):
		_after_wild(result)                          # a befriended guardian joins you like any other creature
	if result == "won" and b.has("team") or caught_it:
		story_done[id] = true
		for l in b.get("win", []):
			var who: String = l[0]
			say("" if who.begins_with("@") else who, _fill(l[1]))
	elif result == "won" and b.has("wild"):
		# a guardian knocked out (not befriended) slips away and can be met again later
		story_retry[id] = int(explored_in.get(str(b.get("biome", "thornwood")), 0)) + 6
		say("", "%s staggers up and slips away. It might let you approach another time." % DATA.SPECIES[b.wild[0]].name)
	else:
		story_retry[id] = int(explored_in.get(str(b.get("biome", "thornwood")), 0)) + 4
		if result == "lost" and b.has("team"):
			_after_wild("lost")
	if b.has("team"):
		wren.where = "gone"

## Sand (the floor tileset) and rocks (drawn in code: a boulder with a lit top and a dark base).
func _draw_sand(x: int, y: int, o: Vector2, n: int) -> void:
	if map_name in ["hollowecho", "sunthread", "league"]:
		_draw_stone_floor(x, y, o, n)
		return
	_tex(FLOOR, Vector2i(1, 1), Vector2i.ONE, o)
	if n == 2:
		draw_rect(Rect2(o + Vector2(5, 9), Vector2(2, 1)), Color("c8a070"))          # a shell
		draw_rect(Rect2(o + Vector2(6, 8), Vector2(1, 1)), Color("f0e0c8"))
	elif n == 6:
		draw_rect(Rect2(o + Vector2(10, 4), Vector2(3, 1)), Color("d8b888"))         # ripples left by the wind

## Emberfall's mountain: rock that fills the edge of the map, with layered strata, a sunlit rim where the rock meets
## open ground above it, and a dark cliff face where it drops to the ground below.
## The mountain areas: their rock and the tint on their turf (warm in Emberfall, cold grey-blue up in Cloudglass).
const MOUNTAINS := {
	"emberfall": { "rock": Color("8a7464"), "turf": Color(0.65, 0.54, 0.41, 0.32) },
	"cloudglass": { "rock": Color("8d97a3"), "turf": Color(0.62, 0.68, 0.72, 0.34) },
	"hollowecho": { "rock": Color("7d8576"), "turf": Color(0.40, 0.49, 0.38, 0.30) },
	"farwatch": { "rock": Color("7a8a8c"), "turf": Color(0.45, 0.55, 0.54, 0.28) },
	"league": { "rock": Color("a8a49a"), "turf": Color(0.55, 0.60, 0.58, 0.22) },
	"spire": { "rock": Color("8a9698"), "turf": Color(0.48, 0.58, 0.58, 0.24) },
}
var CLIFF := Color("8a7464")
var TURF := Color(0.65, 0.54, 0.41, 0.32)
var _mountains := {}                         # map -> the rock tiles joined to the map's edge (the rest are boulders)
func _mountain() -> Dictionary:
	if _mountains.has(map_name):
		return _mountains[map_name]
	var rows: Array = cur_map()
	var h := rows.size()
	var w: int = int(rows[0].length())
	var found := {}
	var queue: Array[Vector2i] = []
	for y in h:
		for x in w:
			if (x == 0 or y == 0 or x == w - 1 or y == h - 1) and rows[y][x] == "R":
				found[Vector2i(x, y)] = true
				queue.append(Vector2i(x, y))
	while not queue.is_empty():
		var c: Vector2i = queue.pop_back()
		for d in [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]:
			var p: Vector2i = c + d
			if p.x >= 0 and p.y >= 0 and p.x < w and p.y < h and not found.has(p) and rows[p.y][p.x] == "R":
				found[p] = true
				queue.append(p)
	_mountains[map_name] = found
	return found

func _draw_cliff(x: int, y: int, o: Vector2, n: int) -> void:
	var open_above := tile_at(Vector2i(x, y - 1)) != "R" and y > 0
	var open_below := tile_at(Vector2i(x, y + 1)) != "R" and y < cur_map().size() - 1
	var open_left := tile_at(Vector2i(x - 1, y)) != "R" and x > 0
	var open_right: bool = tile_at(Vector2i(x + 1, y)) != "R" and x < int(cur_map()[0].length()) - 1
	draw_rect(Rect2(o, Vector2(16, 16)), CLIFF)
	for i in 3:                                                                   # strata: uneven bands of darker stone
		var sy := 3 + i * 5 + (n + i) % 2
		draw_rect(Rect2(o + Vector2((n * 3 + i * 5) % 6, sy), Vector2(9 + (n + i) % 5, 1)), CLIFF.darkened(0.18))
	if n % 3 == 0:
		draw_rect(Rect2(o + Vector2(4 + n % 5, 6), Vector2(2, 2)), CLIFF.lightened(0.2))   # a pale pebble of quartz
	if open_below:
		draw_rect(Rect2(o + Vector2(0, 9), Vector2(16, 7)), CLIFF.darkened(0.32))         # the cliff face, in shade
		for k in 4:
			draw_rect(Rect2(o + Vector2(1 + k * 4 + n % 2, 10), Vector2(1, 5 - (k + n) % 3)), CLIFF.darkened(0.5))
		draw_rect(Rect2(o + Vector2(0, 15), Vector2(16, 1)), Figures.OUTLINE)
	if open_above:
		draw_rect(Rect2(o, Vector2(16, 2)), CLIFF.lightened(0.28))                   # the sunlit rim
		draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 1)), CLIFF.lightened(0.12))
	if (x * 5 + y * 3) % 4 == 0:
		draw_rect(Rect2(o + Vector2(10, 3 + n % 4), Vector2(1, 4)), CLIFF.darkened(0.4))   # a crack in the rock
		draw_rect(Rect2(o + Vector2(11, 6 + n % 4), Vector2(1, 2)), CLIFF.darkened(0.4))
	if open_left:
		draw_rect(Rect2(o, Vector2(1, 16)), Figures.OUTLINE)
		draw_rect(Rect2(o + Vector2(1, 0), Vector2(1, 16)), CLIFF.lightened(0.15))   # light from the left
	if open_right:
		draw_rect(Rect2(o + Vector2(15, 0), Vector2(1, 16)), Figures.OUTLINE)
		draw_rect(Rect2(o + Vector2(14, 0), Vector2(1, 16)), CLIFF.darkened(0.2))
	# rounded outer corners, so the mountain's edge reads as rock rather than blocks
	for k in 3:
		var wk := 3 - k                                                            # 3, 2, 1 pixels: a little staircase
		if open_above and open_left: _turf(o, Rect2(0, k, wk, 1), n)
		if open_above and open_right: _turf(o, Rect2(16 - wk, k, wk, 1), n)
		if open_below and open_left: _turf(o, Rect2(0, 15 - k, wk, 1), n)
		if open_below and open_right: _turf(o, Rect2(16 - wk, 15 - k, wk, 1), n)

## A few pixels of the highland turf (the grass tile and its warm tint), to round off a rock's corner.
func _turf(o: Vector2, r: Rect2, n: int) -> void:
	var cell := Vector2(11 + (n if n < 5 else 0), 12) * 16.0
	draw_texture_rect_region(FLOOR, Rect2(o + r.position, r.size), Rect2(cell + r.position, r.size))
	draw_rect(Rect2(o + r.position, r.size), TURF)

## A hot spring: a pool of warm mineral water (amber, like the browser's) in a rim of dark stone, with bubbles that rise
## and pop. The steam is drawn over everything (_draw_steam).
func _draw_spring(x: int, y: int, o: Vector2) -> void:
	var rim := Color("5a4a3e")
	draw_rect(Rect2(o, Vector2(16, 16)), Color("e09858"))
	draw_rect(Rect2(o + Vector2(3, 3), Vector2(10, 10)), Color("f0b878"))           # paler where the water is deep and hot
	for side in [[Vector2i.UP, Rect2(0, 0, 16, 2)], [Vector2i.DOWN, Rect2(0, 14, 16, 2)], [Vector2i.LEFT, Rect2(0, 0, 2, 16)], [Vector2i.RIGHT, Rect2(14, 0, 2, 16)]]:
		if tile_at(Vector2i(x, y) + side[0]) != "o":
			var r: Rect2 = side[1]
			draw_rect(Rect2(o + r.position, r.size), rim)
	for k in 2:                                                                     # bubbles
		var ph := fmod(t * 0.8 + x * 0.31 + y * 0.53 + k * 0.5, 1.0)
		var bp := o + Vector2(4 + (x * 5 + k * 7) % 8, 11 - ph * 7)
		draw_rect(Rect2(bp, Vector2(1, 1) if ph < 0.85 else Vector2(2, 1)), Color(1, 0.97, 0.9, 0.8 - ph * 0.5))

func _draw_steam() -> void:
	# soft puffs that rise off each spring, drift with a little wind, grow and fade
	var rows: Array = cur_map()
	for y in rows.size():
		for x in rows[0].length():
			if rows[y][x] != "o":
				continue
			for k in 3:
				var ph := fmod(t * 0.22 + x * 0.37 + y * 0.61 + k / 3.0, 1.0)
				var p := Vector2(x * TILE + 8 + sin(t * 0.9 + k * 2.0 + x) * 3.0 + ph * 6.0, y * TILE + 8 - ph * 34.0)
				draw_circle(p, 2.0 + ph * 5.0, Color(1, 1, 1, 0.3 * (1.0 - ph) * minf(1.0, ph * 5.0)))

## Cloudglass: banks of cloud drift across the pass, each a cluster of soft puffs. Now and then the cloud comes
## down thicker ("If the cloud comes down, stop and shout"), then lifts again.
func _draw_clouds() -> void:
	var w := float(cur_map()[0].length() * TILE)
	var thick := 0.5 + 0.5 * sin(t * 0.07)                     # the cloud comes down, and lifts, over a minute or so
	for i in 7:
		var y := 20.0 + fmod(i * 61.0, 180.0)
		var x := fmod(i * 137.0 + t * (4.0 + i % 3), w + 120.0) - 60.0
		for k in 5:
			var off := Vector2(k * 11.0 - 22.0, sin(i + k) * 4.0)
			draw_circle(Vector2(x, y) + off, 9.0 + (k % 3) * 4.0, Color(0.94, 0.96, 0.98, (0.12 + 0.16 * thick) * (1.0 - abs(k - 2) * 0.15)))

func _draw_embers() -> void:
	# a few sparks from the vents drift up across the highlands, flickering as they cool
	var w: int = int(cur_map()[0].length()) * TILE
	var h := cur_map().size() * TILE
	for i in 26:
		var rise := fmod(t * (7.0 + i % 5) + i * 53.1, float(h + 40))
		var p := Vector2(fmod(i * 97.3 + sin(t * 0.6 + i) * 10.0 + rise * 0.15, float(w)), h + 20 - rise)
		var glow := 0.5 + 0.5 * sin(t * 6.0 + i * 1.7)
		draw_rect(Rect2(p, Vector2(1, 1)), Color(1.0, 0.62 + 0.2 * glow, 0.3, 0.45 + 0.4 * glow))

func _draw_rock(o: Vector2, n: int) -> void:
	# a rounded boulder built from rows, each a little different, so no two rocks look stamped
	var c := Color("8a8a84") if n % 2 == 0 else Color("9a8e7a")
	var rows := [[5, 6], [3, 10], [2, 12], [1, 14], [1, 14], [1, 14], [1, 14], [2, 13], [2, 12], [3, 11]]
	var top := 4 + n % 2
	for i in rows.size():
		var r: Array = rows[i]
		var w: int = r[1] - (1 if (i + n) % 4 == 0 else 0)
		draw_rect(Rect2(o + Vector2(r[0] - 1, top + i - 1), Vector2(w + 2, 3)), Figures.OUTLINE)
	for i in rows.size():
		var r: Array = rows[i]
		var w: int = r[1] - (1 if (i + n) % 4 == 0 else 0)
		var shade := c.lightened(0.18) if i < 3 else (c.darkened(0.22) if i > 6 else c)
		draw_rect(Rect2(o + Vector2(r[0], top + i), Vector2(w, 1)), shade)
	draw_rect(Rect2(o + Vector2(6, top + 2), Vector2(3, 1)), c.lightened(0.35))     # where the light catches it
	draw_rect(Rect2(o + Vector2(9, top + 6), Vector2(1, 2)), c.darkened(0.35))      # a crack

# ---------------------------------------------------------------- Maren's ranch: your other creatures, at home
## Creatures you aren't carrying live at the ranch, where you can see them: the first four out in the paddock, the rest
## on the barn floor. Walk up to one (or tap it) to see its page and take it along, or swap it for one of your team.
## The creature leading your team is the one that follows you around.
const BARN_FLOOR := Rect2i(2, 5, 20, 4)       # the open straw in the barn, below the stalls
var ranch_movers: Array[Mover] = []          # one per creature in `ranch`, in the same order
var card_mode := "starter"                   # what the open creature page is for: starter, ranch, swap
var visiting := -1                           # which ranch creature's page is open

func _place_ranch() -> void:
	ranch_movers.clear()
	var free_i := 0                                          # creatures not in the breeding stall, in order
	var stall_i := 0
	for i in ranch.size():
		var m: Mover
		if ranch[i].get("stall", false):
			m = Mover.new("ranch", "barn", BREED_STALL.position + Vector2i(stall_i * 2, 0))
			m.home = BREED_STALL
			stall_i += 1
		else:
			var out := free_i < 4
			var home: Rect2i = PADDOCK if out else BARN_FLOOR
			var k := free_i if out else free_i - 4
			var n := k * (2 if out else 3) + 1               # spread out, a gap between each
			m = Mover.new("ranch", "larkhaven" if out else "barn", home.position + Vector2i(n % home.size.x, (n / home.size.x) % home.size.y))
			m.home = home
			free_i += 1
		m.look = geared_look(ranch[i])
		m.right = i % 2 == 0
		ranch_movers.append(m)

# ---------------------------------------------------------------- the barn's trough and breeding stall
## The trough (right wall of Maren's barn): berries in it, and your ranch creatures come to eat and trust you more.
## The breeding stall (the empty stall on the left): send two ranch creatures in from their page; when both are there,
## ask at the stall. An egg sits in the straw and hatches after you've walked a while on your journey.
const BARN_TROUGH := [Vector2i(22, 7), Vector2i(22, 8)]
const BREED_STALL := Rect2i(3, 3, 3, 2)
const EGG_STEPS := 200
var egg: Dictionary = {}                     # { child, steps, from }

func in_stall() -> Array:
	return ranch.filter(func(c): return c.get("stall", false))

func _near_trough() -> bool:
	return map_name == "barn" and BARN_TROUGH.any(func(t): return (me.tile - t).length() <= 1.01)

func _near_stall() -> bool:
	return map_name == "barn" and me.tile.y == BREED_STALL.end.y and me.tile.x >= BREED_STALL.position.x and me.tile.x < BREED_STALL.end.x

func _feed() -> void:
	if int(bag.berries) < 2:
		say("", "The trough is empty. Two berries make a feed; the shop in Larkhaven sells them.")
		return
	bag.berries = int(bag.berries) - 2
	for c in ranch:
		R.add_bond(c, 3.0)
	for m in ranch_movers:
		if m.where == "barn" and m.home == BARN_FLOOR:
			m.path = route(m.tile, Vector2i(21, 6 + ranch_movers.find(m) % 4))   # they come to eat
	say("", "You tip berries into the trough. Your ranch creatures crowd round, tails going, and trust you a little more.")

func _breed_here() -> void:
	if not egg.is_empty():
		say("", "The egg lies warm in the straw. It'll hatch once you've been out walking a while (about %d more steps)." % int(egg.steps))
		return
	var pair := in_stall()
	if pair.size() < 2:
		say("", "The breeding stall. Bring two of your ranch creatures here: open a creature's page in the paddock or the barn, and choose To the stall.")
		return
	var info := R.breed_info(pair[0], pair[1])
	if not info.ok:
		say("maren", str(info.why))
		return
	breed_opts = info.opts
	var shown: String = pair[0].sp if info.get("hybrid", false) else str(info.opts[0])   # a hybrid stays a surprise
	var future: Dictionary = pair[0].duplicate()
	future.sp = shown
	future.name = DATA.SPECIES[shown].name
	var page := ranch_info(future)
	page.note = "%s and %s. %s An egg costs %d coins for Maren's care." % [pair[0].name, pair[1].name, info.text, R.BREED_COST]
	card_mode = "breed"
	card.open(shown, page, ["Have an egg (%d coins)" % R.BREED_COST, "Not now"])

var breed_opts: Array = []

func _lay_egg() -> void:
	var pair := in_stall()
	if pair.size() < 2 or not egg.is_empty():
		return
	if int(bag.coins) < R.BREED_COST:
		say("maren", "An egg needs looking after, love: %d coins for the straw and the warm lamp. Come back when you have them." % R.BREED_COST)
		return
	bag.coins = int(bag.coins) - R.BREED_COST
	var id: String = breed_opts[rng.randi() % breed_opts.size()]
	egg = { "child": R.breed(pair[0], pair[1], id, rng), "steps": EGG_STEPS, "from": [pair[0].name, pair[1].name] }
	for c in pair:
		c.erase("stall")                              # the parents go back to the ranch
	_place_ranch()
	say("", "%s and %s settle in the straw together. By morning there's an egg, warm and speckled." % [pair[0].name, pair[1].name])
	say("maren", "Well, look at that! Off you go on your journey, love. It'll hatch while you're out walking. I'll send word.")

## Each step on your journey warms the egg; when it hatches, word comes from the ranch.
func _egg_step() -> void:
	if egg.is_empty():
		return
	egg.steps = int(egg.steps) - 1
	if int(egg.steps) > 0:
		return
	var c: Dictionary = egg.child
	egg = {}
	ranch.append(c)
	seen[c.sp] = true
	bonded[c.sp] = true
	_place_ranch()
	say("", "A runner from Larkhaven catches you up: Maren says the egg has hatched! A little %s is waiting for you at the ranch." % DATA.SPECIES[c.sp].name)

# ---------------------------------------------------------------- Maren's workbench: gear for your creatures
## Stand at the workbench (left wall of the barn) and press E. The creature walking with you tries each piece on; Maren
## makes what you don't have yet, for coins. Pieces you take off go back in your satchel for another creature.
const BENCH := Vector2i(1, 9)
var gear_owned: Dictionary = {}              # gear id -> how many you have, not being worn
var bench_i := 0

func _near_bench() -> bool:
	return map_name == "barn" and (me.tile - BENCH).length() <= 1.01

func _open_bench() -> void:
	if team.is_empty():
		return
	if not story_done.has("bench"):
		story_done["bench"] = true
		say("maren", "My old workbench! I make harnesses and charms for the ranch creatures. Shells from the coast, glass from Emberfall, a bell or two.")
		say("maren", "Bring whoever walks with you, and they can try things on. Each piece does one thing well. I'll make what you need for a few coins.")
		say("maren", "Or choose Practice to remember a different move. Bring up to four, keep an attack, and let the others rest here. You never forget them.")
		then_do = _open_bench
		return
	var ids := R.GEAR.keys()
	var id: String = ids[bench_i % ids.size()]
	var g: Dictionary = R.GEAR[id]
	var c: Dictionary = team[0]
	var page := ranch_info(c)
	page.look = page.look.duplicate()
	page.look.gear = id                           # it tries the piece on, on the page
	var wearing: String = ("%s is wearing it." % c.name) if str(c.get("gear", "")) == id else (("%s wears the %s." % [c.name, R.gear_of(c).name]) if R.gear_of(c).size() > 0 else "%s wears no gear yet." % c.name)
	var spare := int(gear_owned.get(id, 0))
	page.note = "%s. %s %s %s" % [g.name, g.text, wearing, "You have %d spare." % spare if spare > 0 else ""]
	var act := "Take it off" if str(c.get("gear", "")) == id else ("Put it on" if int(gear_owned.get(id, 0)) > 0 else "Have it made (%d coins)" % int(g.cost))
	card_mode = "bench"
	card.open(c.sp, page, ["Practice", act, "Next", "Done"])

func _bench_pick(i: int) -> void:
	var ids := R.GEAR.keys()
	var id: String = ids[bench_i % ids.size()]
	var c: Dictionary = team[0]
	match i:
		0:
			lessons.open(team)
			return
		2: bench_i = (bench_i + 1) % ids.size()
		1:
			if str(c.get("gear", "")) == id:
				c.erase("gear")
				gear_owned[id] = int(gear_owned.get(id, 0)) + 1
			elif int(gear_owned.get(id, 0)) > 0:
				wear(c, id)
			elif int(bag.coins) >= int(R.GEAR[id].cost):
				bag.coins = int(bag.coins) - int(R.GEAR[id].cost)
				gear_owned[id] = int(gear_owned.get(id, 0)) + 1
				wear(c, id)
				say("maren", "There! %s, made to measure. Doesn't %s look smart?" % [R.GEAR[id].name, c.name])
			else:
				say("maren", "That one needs %d coins for the materials, love. Come back when you have them." % int(R.GEAR[id].cost))
		_:
			return
	_lead_look()
	if lines.is_empty():
		_open_bench()
	else:
		then_do = _open_bench

## Put a piece on a creature: the one it wore goes back in your satchel.
func wear(c: Dictionary, id: String) -> void:
	var old := str(c.get("gear", ""))
	if old != "":
		gear_owned[old] = int(gear_owned.get(old, 0)) + 1
	gear_owned[id] = int(gear_owned.get(id, 0)) - 1
	c["gear"] = id

## A creature's look with its gear on (the gear is drawn on whoever wears it).
func geared_look(c: Dictionary) -> Dictionary:
	var lk: Dictionary = CREATURE_LOOKS.get(c.sp, Figures.look_for(R.sp(c)))
	if str(c.get("gear", "")) == "":
		return lk
	lk = lk.duplicate()
	lk.gear = c.gear
	return lk

## The creature at the front of your team walks with you.
func _lead_look() -> void:
	if partner and not team.is_empty():
		partner.look = geared_look(team[0])

## A free spot beside a tile to stand on (to talk to a creature there).
func _stand_by(p: Vector2i) -> Vector2i:
	for d in [Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP]:
		if walkable(p + d) and not route(me.tile, p + d).is_empty():
			return p + d
	return p + Vector2i.DOWN

func _visit(m: Mover) -> void:
	var i := ranch_movers.find(m)
	if i < 0 or card.visible:
		return
	walk_to.clear()
	me.face = m.tile - me.tile
	_stop(m)
	m.right = me.pos.x > m.pos.x
	visiting = i
	card_mode = "ranch"
	var stall_btn := "Out of the stall" if ranch[i].get("stall", false) else "To the stall"
	card.open(ranch[i].sp, ranch_info(ranch[i]), ["Take along" if team.size() < 3 else "Swap in", stall_btn, "Let it rest"])

## A creature's page at the ranch: the same page as in Maren's barn, with its own level, trust and moves.
func ranch_info(c: Dictionary) -> Dictionary:
	var s: Dictionary = R.sp(c)
	var weak: Array = []
	for e in DATA.ELEMENTS:
		if s.el in DATA.ELEMENTS[e].beats:
			weak.append(e)
	var moves: Array = R.moves_of(c).map(func(mv): return DATA.MOVES[mv].name)
	return {
		"name": c.name, "el": s.el, "dex": s.dex, "base": s.base, "moves": moves,
		"look": geared_look(c), "role": role_of(s.base),
		"strong": R.words(DATA.ELEMENTS[s.el].beats), "weak": R.words(weak) if not weak.is_empty() else "nothing in particular",
		"moves_line": "Knows %s." % R.words(moves),
		"note": "Level %d. Trust: %s. Resting at Maren's ranch." % [c.lvl, R.BOND[R.bond_lvl(c)][0]],
	}

func _on_card_pick(i: int) -> void:
	if card_mode == "bench":
		_bench_pick(i)
		return
	if card_mode == "breed":
		if i == 0:
			_lay_egg()
		return
	if card_mode == "ranch" and i == 1 and visiting >= 0:
		var c: Dictionary = ranch[visiting]
		visiting = -1
		if c.get("stall", false):
			c.erase("stall")
			say("", "%s trots out of the breeding stall." % c.name)
		elif in_stall().size() >= 2:
			say("", "The breeding stall already has two creatures in it.")
		else:
			c["stall"] = true
			say("", "%s goes to the breeding stall in Maren's barn." % c.name)
		_place_ranch()
		return
	if card_mode == "evolve" and not evolving.is_empty():
		var c: Dictionary = evolving
		evolving = {}
		if i == 0:
			var old := R.evolve(c, evolve_to)
			seen[c.sp] = true
			bonded[c.sp] = true
			restore.append({ "where": map_name, "at": me.pos + Vector2(8, 8), "r": 0.0, "goal": 90.0 })   # the change brings colour with it
			say("", "Light pours off %s. When it fades, %s stands in its place, and looks up at you." % [old, DATA.SPECIES[c.sp].name])
			_lead_look()
		else:
			c["hold"] = c.lvl                        # not yet: it won't ask again until it grows a level
			say("", "%s shakes itself and settles down. It seems content as it is, for now." % c.name)
		return
	if card_mode == "ranch" and i == 0 and visiting >= 0:
		if team.size() < 3:
			_take_along(visiting, -1)
		else:
			# a full team: who goes to rest instead?
			card_mode = "swap"
			var info := ranch_info(ranch[visiting])
			info.note = "Your team is full. Who rests at the ranch instead?"
			var names: Array = team.map(func(c): return c.name)
			card.open(ranch[visiting].sp, info, names + ["Never mind"])
		return
	if card_mode == "swap" and visiting >= 0 and i < team.size():
		_take_along(visiting, i)
		return
	visiting = -1

## Evolution (docs/proposals/creature-catalogue-and-evolution.md section 2): when a creature in your team is ready to
## change (its level, and sometimes the place, its trust in you or a companion), you're asked: let it change, or not
## yet. Never forced. "Not yet" waits until it grows another level.
var evolving: Dictionary = {}
var evolve_to := ""

func _check_evolution() -> void:
	if stage != "free" or not lines.is_empty() or lessons.visible or battle.visible or card.visible or shop.visible or book.visible or trans_t >= 0.0:
		return
	var ctx := { "place": str(DATA.MAPS.get(map_name, {}).get("biome", map_name)), "team": team.map(func(x): return x.sp) }
	for c in team:
		if float(c.get("hold", 0)) >= c.lvl:
			continue
		var to := R.evo_target(c, ctx)
		if to != "":
			_ask_evolve(c, to)
			return

func _ask_evolve(c: Dictionary, to: String) -> void:
	evolving = c
	evolve_to = to
	walk_to.clear()
	var future: Dictionary = c.duplicate()
	future.sp = to
	future.name = DATA.SPECIES[to].name
	var info := ranch_info(future)
	var hint := ""
	for o in R.evo_options(c):
		if str(o.to) == to:
			hint = str(o.get("hint", ""))
	info.note = "%s is ready to change into %s." % [c.name, DATA.SPECIES[to].name] + (" Maren: \"%s\"" % hint if hint != "" else "")
	card_mode = "evolve"
	card.open(to, info, ["Let it change", "Not yet"])

## Take a ranch creature along: into a free place in your team, or in place of team member `ti`, who goes to rest.
func _take_along(ri: int, ti: int) -> void:
	var c: Dictionary = ranch[ri]
	ranch.remove_at(ri)
	if ti >= 0:
		var out: Dictionary = team[ti]
		team[ti] = c
		ranch.append(out)
		say("", "%s trots over to join you, and %s settles in at the ranch for a rest." % [c.name, out.name])
	else:
		team.append(c)
		say("", "%s trots over to join your team." % c.name)
	visiting = -1
	_lead_look()
	_place_ranch()

# ---------------------------------------------------------------- the phone pad and the settings (WB6.1-6.2)
## Tells the phone pad when walking is possible and what its button would do, and applies the settings that change
## how things look (text size) or run (battle pace).
func _thumbs_tick() -> void:
	touch.mode = settings.buttons()
	var menus := lessons.visible or battle.visible or book.visible or shop.visible or card.visible or register.visible or title.visible or howto.visible
	touch.pad_on = not menus and lines.is_empty() and trans_t < 0.0 and stage in ["to_barn", "barn_choose", "walk_out", "free"]
	touch.word = action_word()
	touch.btn_on = not menus and trans_t < 0.0 and touch.word != ""
	touch.refresh()
	battle.pace = settings.pace()
	var size := 10 if settings.large_text() else 8
	if bubble_text.label_settings.font_size != size:  # only on a change, so the labels aren't laid out every frame
		bubble_text.label_settings.font_size = size
		caption.add_theme_font_size_override("font_size", size - 1)

## What pressing Talk would do here, in a word for the phone button ("" when there's nothing to do). While someone
## speaks the button steps aside (the bubble sits low): a tap anywhere moves the talk on.
func action_word() -> String:
	if not lines.is_empty():
		return ""
	if stage == "barn_choose" and _starter_beside_me():
		return "Meet"
	if stage != "free":
		return ""
	var near := func(m) -> bool: return m.where == map_name and (me.tile - m.tile).length() <= 1.01
	if npcs.any(near) or _near_keeper() != "" or (maren.where == map_name and near.call(maren)):
		return "Talk"
	if ranch_movers.any(near):
		return "Greet"
	if fest_task == "planting" and fest_task == cal.festival() and map_name == "larkhaven" and PADDOCK.has_point(me.tile):
		return "Plant"
	if _near_trough():
		return "Feed"
	if _near_stall():
		return "Look"
	if _near_bench():
		return "Use"
	if tile_at(me.tile + me.face) in ["P", "q"]:
		return "Read"
	return ""

## How to press: "tap Meet" on a phone, a key on a computer (for the few hints that name a control).
func how(key: String, word: String) -> String:
	return "tap %s" % word if Controls.touch else "press %s" % key

# ---------------------------------------------------------------- music (Ninja Adventure pack, CC0; assets/music)
## A tune for each place, and one for battles. Larkhaven's is a lost, quiet tune while the valley is faded, and a warm
## village tune once the colour has spilled into town: the music comes back with the colour. M turns it off and on.
const MUSIC_VOL := -14.0
var music: AudioStreamPlayer
var sfx: Sfx                                     # short sound effects (scripts/sfx.gd)
var music_now := ""
var music_on := true

func _music_key() -> String:
	if battle and battle.visible:
		return "wild" if battle.kind == "wild" else "trainer"
	if indoors():
		return "barn"
	if map_name == "larkhaven":
		return "larkhaven" if spilled else "faded"
	return map_name

## Places that share a tune play the same file, so the game carries each track once (a smaller web download).
const SAME_TUNE := { "thornwood_route": "thornwood", "thornwood_grove": "thornwood", "sunthread": "saltmarsh", "farwatch": "barn", "spire": "barn" }   # one Thornwood theme across its connected maps; Sunny and Peaceful elsewhere

func music_path(key: String) -> String:
	return "res://assets/music/%s.ogg" % SAME_TUNE.get(key, key)

func _music_tick(dt: float) -> void:
	if music == null:
		music = AudioStreamPlayer.new()
		music.volume_db = -60.0
		music.bus = "Music"                       # the Music slider on the Settings page (WB6.2)
		add_child(music)
	var want := _music_key() if music_on else ""
	if want != music_now:
		music.volume_db = move_toward(music.volume_db, -60.0, dt * 90.0)   # fade the old tune out...
		if music.volume_db <= -59.0 or not music.playing:
			music_now = want
			var path := music_path(want)
			if want != "" and ResourceLoader.exists(path):
				var s: AudioStream = load(path)
				if s is AudioStreamOggVorbis:
					(s as AudioStreamOggVorbis).loop = true
				music.stream = s
				music.play()
			else:
				music.stop()
	elif music.playing:
		music.volume_db = move_toward(music.volume_db, MUSIC_VOL, dt * 30.0)   # ...and the new one in

# ---------------------------------------------------------------- ambience (Ninja Adventure, CC0; assets/ambience)
## A quiet sound of the place under the music: waves on the coast, wind in the highlands and up in the pass. It follows
## the music switch (M), and goes quiet in battle.
const AMBIENCE_VOL := -20.0
var ambience: AudioStreamPlayer
var ambience_now := ""

func _ambience_tick(dt: float) -> void:
	if ambience == null:
		ambience = AudioStreamPlayer.new()
		ambience.volume_db = -60.0
		ambience.bus = "Ambience"
		add_child(ambience)
	var want := map_name if music_on and not (battle and battle.visible) and ResourceLoader.exists("res://assets/ambience/%s.ogg" % map_name) else ""
	if want != ambience_now:
		ambience.volume_db = move_toward(ambience.volume_db, -60.0, dt * 80.0)
		if ambience.volume_db <= -59.0 or not ambience.playing:
			ambience_now = want
			if want != "":
				var s: AudioStream = load("res://assets/ambience/%s.ogg" % want)
				if s is AudioStreamOggVorbis:
					(s as AudioStreamOggVorbis).loop = true
				ambience.stream = s
				ambience.play()
			else:
				ambience.stop()
	elif ambience.playing:
		ambience.volume_db = move_toward(ambience.volume_db, AMBIENCE_VOL, dt * 20.0)

## A room in town (INTERIORS), drawn like Maren's barn: board floors, plank walls, the counter with its keeper behind
## it, and the furniture of the place (the inn's hearth and tables, the shop's shelves and crates).
func _draw_room() -> void:
	var rows: Array = INTERIORS[map_name].rows
	var w: int = rows[0].length()
	draw_rect(Rect2(0, 0, w * TILE, rows.size() * TILE), Color("16100c"))
	for y in rows.size():
		for x in w:
			var ch: String = rows[y][x]
			var o: Vector2 = Vector2(x, y) * TILE
			if ch == "X":
				continue
			if ch != "W":
				_boards(o, x, y)
			match ch:
				"W":
					draw_rect(Rect2(o, Vector2(16, 16)), WOOD)
					for k in 4:
						draw_rect(Rect2(o + Vector2(k * 4, 0), Vector2(1, 16)), WOOD_DARK)
					if y == 2:
						draw_rect(Rect2(o + Vector2(0, 13), Vector2(16, 3)), WOOD_DARK)          # the skirting beam
					if y == 1:
						draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 3)), WOOD_LIGHT)          # the cross beam
					if y == rows.size() - 3:
						draw_rect(Rect2(o, Vector2(16, 3)), WOOD_LIGHT)                         # the front wall's top edge
				"c":
					draw_rect(Rect2(o + Vector2(0, 2), Vector2(16, 12)), Figures.OUTLINE)          # the counter
					draw_rect(Rect2(o + Vector2(0, 3), Vector2(16, 10)), WOOD_LIGHT)
					draw_rect(Rect2(o + Vector2(0, 3), Vector2(16, 2)), WOOD_LIGHT.lightened(0.2))
					draw_rect(Rect2(o + Vector2(0, 11), Vector2(16, 2)), WOOD_DARK)
				"t":
					draw_rect(Rect2(o + Vector2(1, 3), Vector2(14, 10)), Figures.OUTLINE)          # a table with a candle
					draw_rect(Rect2(o + Vector2(2, 4), Vector2(12, 8)), WOOD)
					draw_rect(Rect2(o + Vector2(7, 5), Vector2(2, 3)), Color("efe6d4"))
					draw_rect(Rect2(o + Vector2(7, 3 + int(t * 6.0) % 2), Vector2(2, 2)), Color("f2c050"))
				"s":
					draw_rect(Rect2(o + Vector2(1, 0), Vector2(14, 16)), Figures.OUTLINE)          # shelves of jars and bottles
					draw_rect(Rect2(o + Vector2(2, 1), Vector2(12, 14)), WOOD_DARK)
					for r in 3:
						draw_rect(Rect2(o + Vector2(2, 5 + r * 5), Vector2(12, 1)), WOOD_LIGHT)
						for k in 3:
							draw_rect(Rect2(o + Vector2(3 + k * 4, 2 + r * 5), Vector2(2, 3)), [Color("6ad08a"), Color("e8a84a"), Color("8ab8f0"), Color("e04a8a")][(x + y + r + k) % 4])
				"k":
					draw_rect(Rect2(o + Vector2(1, 2), Vector2(14, 13)), Figures.OUTLINE)          # crates
					draw_rect(Rect2(o + Vector2(2, 3), Vector2(12, 11)), Color("a07040"))
					draw_line(o + Vector2(2, 3), o + Vector2(14, 14), Color("6b4a2a"), 1.0)
					draw_line(o + Vector2(14, 3), o + Vector2(2, 14), Color("6b4a2a"), 1.0)
				"h":
					draw_rect(Rect2(o + Vector2(0, -6), Vector2(16, 22)), Color("6a6a66"))         # the hearth, its fire alive
					draw_rect(Rect2(o + Vector2(2, 4), Vector2(12, 10)), Color("2a1e18"))
					var f := 0.75 + 0.25 * sin(t * 7.0)
					draw_rect(Rect2(o + Vector2(4, 8), Vector2(8, 6)), Color(1.0, 0.45 * f + 0.2, 0.1))
					draw_rect(Rect2(o + Vector2(6, 6 + int(t * 5.0) % 2), Vector2(4, 4)), Color("f2d24a"))
				"d":
					draw_rect(Rect2(o + Vector2(1, 0), Vector2(14, 16)), Color("2a1c12"))
					draw_rect(Rect2(o + Vector2(1, 9), Vector2(14, 7)), Color("6a9a48").darkened(0.2))   # town outside
				"b":
					var head: bool = y == 0 or rows[y - 1][x] != "b"                                   # a bed: pillow at the head, quilt below
					draw_rect(Rect2(o + Vector2(1, 0 if not head else 1), Vector2(14, 16 if not head else 15)), Figures.OUTLINE)
					draw_rect(Rect2(o + Vector2(2, 0 if not head else 2), Vector2(12, 15 if not head else 13)), WOOD)
					if head:
						draw_rect(Rect2(o + Vector2(3, 3), Vector2(10, 5)), Color("efe6d4"))
						draw_rect(Rect2(o + Vector2(3, 10), Vector2(10, 6)), Color("7a8ac0"))
					else:
						draw_rect(Rect2(o + Vector2(3, 0), Vector2(10, 13)), Color("7a8ac0"))
						for k in 3:
							draw_rect(Rect2(o + Vector2(3, 2 + k * 4), Vector2(10, 1)), Color("7a8ac0").darkened(0.2))
	var home_find: Dictionary = INTERIORS[map_name].get("find", {})
	if not home_find.is_empty() and not got_items.has(home_find.id):          # something to find: a little cloth pouch, as outdoors
		var io := Vector2(home_find.at) * TILE + Vector2(4, 5 + sin(t * 2.0) * 0.5)
		draw_rect(Rect2(io + Vector2(0, 2), Vector2(8, 8)), Figures.OUTLINE)
		draw_rect(Rect2(io + Vector2(1, 3), Vector2(6, 6)), Color("c8925a"))
		draw_rect(Rect2(io + Vector2(2, 0), Vector2(4, 3)), Figures.OUTLINE)
		draw_rect(Rect2(io + Vector2(3, 1), Vector2(2, 2)), Color("e0b070"))
		draw_rect(Rect2(io + Vector2(2, 3), Vector2(4, 1)), Color("8a5a2a"))
	if not map_name in ["inn", "shop"]:
		return                                                       # homes have no sign over the door
	# the room's name on a board over the counter
	var at: Vector2i = INTERIORS[map_name].keeper_at
	var bo := Vector2(at.x - 1, 1) * TILE + Vector2(0, 6)
	draw_rect(Rect2(bo - Vector2(1, 1), Vector2(50, 10)), Figures.OUTLINE)
	draw_rect(Rect2(bo, Vector2(48, 8)), Color("2e3a32"))
	draw_string(ThemeDB.fallback_font, bo + Vector2(0, 7), "Inn" if map_name == "inn" else "Goods", HORIZONTAL_ALIGNMENT_CENTER, 48, 6, Color("e8e4d8"))

## What someone says the first time they see which family you're from: the game data's line for each person (byHeritage,
## written by ChatGPT for T45), or the hand-written ones here for anyone the data doesn't cover.
func _heritage_line(id: String, data: Dictionary) -> String:
	var by: Dictionary = data.get("byHeritage", {})
	if by.has(heritage()) and not (by[heritage()] as Array).is_empty():
		return str(by[heritage()][0][1])
	return str(HERITAGE_TALK.get(id, {}).get(heritage(), ""))
