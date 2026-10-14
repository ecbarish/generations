extends Control
## Larkhaven's shop counter: walk up to the shop door and the shopkeeper sets out what she has. Prices are the browser
## game's (5 lures for 50 coins; berries at the food table's price). Arrow keys and Enter, or the mouse; Esc to leave.

signal closed
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")

var bag: Dictionary = {}                       # the satchel (main.gd owns it)
var goods: Array = []                          # [{ name, give: {key: amount}, cost, note }]
var sel := 0
var note := ""
var font: Font

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

func open(items: Array) -> void:
	goods = items
	sel = 0
	note = "\"Welcome in! Lures for catching, berries for a tired team.\""
	visible = true
	queue_redraw()

var sfx: Sfx = null                            # sound effects (main.gd hands over its own)

func _buy(i: int) -> void:
	if i >= goods.size():
		visible = false
		closed.emit()
		return
	var g: Dictionary = goods[i]
	if int(bag.get("coins", 0)) < int(g.cost):
		if sfx: sfx.play("warn", -6.0)
		note = "\"That's %d coins, love, and you've %d. Come back after a few battles.\"" % [g.cost, bag.get("coins", 0)]
	else:
		bag.coins -= int(g.cost)
		if sfx: sfx.play("coin")
		for k in g.give:
			bag[k] = int(bag.get(k, 0)) + int(g.give[k])
		note = "\"There you go: %s. Anything else?\"" % g.name.to_lower()
	queue_redraw()

func _row(i: int) -> Rect2:
	return Rect2(84, 74 + i * 22, 216, 18)

func _input(e: InputEvent) -> void:
	if not visible:
		return
	var d := Controls.dir(e)                    # named actions (controls.gd): keys, a gamepad
	if d != Vector2i.ZERO or Controls.pressed(e, "interact") or Controls.pressed(e, "back") or (e is InputEventKey and e.pressed):
		if d.y != 0: sel = clampi(sel + d.y, 0, goods.size())
		elif Controls.pressed(e, "interact"): _buy(sel)
		elif Controls.pressed(e, "back"):
			visible = false
			closed.emit()
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif Controls.pointing(e):
		var p := Controls.at(self, e)
		for i in goods.size() + 1:
			if _row(i).has_point(p):
				sel = i
				_buy(i)
		get_viewport().set_input_as_handled()
	elif Controls.swallow_pointer(e):
		get_viewport().set_input_as_handled()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.45))
	draw_rect(Rect2(64, 24, 256, 168), Color("4a2e1a"))
	draw_rect(Rect2(68, 28, 248, 160), Color("f4e9cd"))
	draw_string(font, Vector2(68, 46), "Larkhaven Supplies", HORIZONTAL_ALIGNMENT_CENTER, 248, 11, INK)
	draw_string(font, Vector2(84, 62), "Your coins: %d    Lures: %d    Berries: %d" % [bag.get("coins", 0), bag.get("lures", 0), bag.get("berries", 0)], HORIZONTAL_ALIGNMENT_LEFT, 216, 7, FAINT)
	for i in goods.size() + 1:
		var r := _row(i)
		var on := i == sel
		draw_rect(r, INK if on else Color("e8dcc4"))
		var col := Color("f4e9cd") if on else INK
		if i < goods.size():
			var g: Dictionary = goods[i]
			draw_string(font, r.position + Vector2(6, 12), g.name, HORIZONTAL_ALIGNMENT_LEFT, 150, 8, col)
			draw_string(font, r.position + Vector2(r.size.x - 66, 12), "%d coins" % g.cost, HORIZONTAL_ALIGNMENT_RIGHT, 60, 8, col)
		else:
			draw_string(font, r.position + Vector2(0, 12), "Leave the counter", HORIZONTAL_ALIGNMENT_CENTER, r.size.x, 8, col)
	draw_multiline_string(font, Vector2(84, 162), note, HORIZONTAL_ALIGNMENT_LEFT, 216, 7, -1, FAINT)
