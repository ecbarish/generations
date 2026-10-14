extends Control
## Maren's workbench: remembered moves on the left, the four brought into battle on the right.
signal closed
const R := preload("res://scripts/rules.gd")
const INK := Color("302b36")
const PAPER := Color("f7eedb")
var team: Array = []
var creature := 0
var row := 0
var slot := -1
var selected := ""
var message := ""
var font: Font

func _ready() -> void:
	Controls.fill(self)
	font = ThemeDB.fallback_font
	mouse_filter = MOUSE_FILTER_STOP
	visible = false

func open(list: Array) -> void:
	team = list
	creature = 0
	row = 0
	slot = -1
	selected = ""
	message = "Choose a move. Left/right changes partners."
	visible = not team.is_empty()
	queue_redraw()

func close() -> void:
	visible = false
	closed.emit()

func change_creature(direction: int) -> void:
	creature = (creature + direction + team.size()) % team.size()
	row = 0
	slot = -1
	selected = ""
	message = "Choose a move. Left/right changes partners."
	queue_redraw()

func pick_move(i: int) -> void:
	var c: Dictionary = team[creature]
	var known := R.learned_moves(c)
	row = clampi(i, 0, known.size() - 1)
	selected = str(known[row])
	var kept := R.moves_of(c)
	if selected in kept:
		message = "Already brought along. Pick another move."
		return
	if kept.size() < 4:
		kept.append(selected)
		if R.keep_moves(c, kept): message = "Ready: " + R.DATA.MOVES[selected].name
	else:
		slot = 0
		message = "Which move should rest? It stays remembered."
	queue_redraw()

func replace_slot(i: int) -> bool:
	var c: Dictionary = team[creature]
	var kept := R.moves_of(c)
	if selected == "" or i < 0 or i >= kept.size():
		return false
	kept[i] = selected
	var ok := R.keep_moves(c, kept)
	message = "Ready: " + R.DATA.MOVES[selected].name if ok else "Keep at least one attacking move."
	if ok:
		slot = -1
		selected = ""
	queue_redraw()
	return ok

func _input(e: InputEvent) -> void:
	if not visible: return
	var d := Controls.dir(e)
	if Controls.pressed(e, "back"):
		if slot >= 0:
			slot = -1
			selected = ""
		else: close()
	elif d != Vector2i.ZERO:
		if d.x != 0: change_creature(d.x)
		elif slot >= 0: slot = clampi(slot + d.y, 0, R.moves_of(team[creature]).size() - 1)
		else: row = clampi(row + d.y, 0, R.learned_moves(team[creature]).size() - 1)
	elif Controls.pressed(e, "interact"):
		if slot >= 0: replace_slot(slot)
		else: pick_move(row)
	elif Controls.pressed(e, "page_prev"): change_creature(-1)
	elif Controls.pressed(e, "page_next"): change_creature(1)
	elif Controls.pointing(e):
		var p := Controls.at(self, e)
		if p.y >= 184:
			if p.x < 100: change_creature(-1)
			elif p.x > 284: close()
			else: change_creature(1)
		elif slot >= 0:
			for i in R.moves_of(team[creature]).size():
				if Rect2(204, 49 + i * 21, 166, 19).has_point(p): replace_slot(i)
		else:
			for i in R.learned_moves(team[creature]).size():
				if Rect2(14, 49 + i * 15, 177, 14).has_point(p): pick_move(i)
	get_viewport().set_input_as_handled()
	queue_redraw()

func text(line: String, at: Vector2, size: int, color: Color = INK) -> void:
	draw_string(font, at, line, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

func _draw() -> void:
	if team.is_empty(): return
	var c: Dictionary = team[creature]
	draw_rect(Rect2(0, 0, 384, 216), Color("1b2730"))
	draw_rect(Rect2(8, 8, 368, 200), PAPER)
	text("Maren's workbench · practice", Vector2(16, 24), 11)
	text(c.name + " · level " + str(c.lvl), Vector2(16, 39), 8)
	text("Remembered", Vector2(16, 48), 6)
	text("Bring into battle", Vector2(206, 46), 7)
	var known := R.learned_moves(c)
	var kept := R.moves_of(c)
	for i in known.size():
		var rect := Rect2(14, 49 + i * 15, 177, 14)
		var on := i == row and slot < 0
		draw_rect(rect, INK if on else Color("e4dbc8"))
		text(("• " if known[i] in kept else "  ") + str(R.DATA.MOVES[known[i]].name), rect.position + Vector2(3, 10), 7, PAPER if on else INK)
	for i in kept.size():
		var rect := Rect2(204, 49 + i * 21, 166, 19)
		var on := slot == i
		draw_rect(rect, INK if on else Color("d8e2d5"))
		text(str(i + 1) + ". " + str(R.DATA.MOVES[kept[i]].name), rect.position + Vector2(4, 12), 8, PAPER if on else INK)
	draw_multiline_string(font, Vector2(207, 144), R.move_info(str(known[row])), HORIZONTAL_ALIGNMENT_LEFT, 160, 7, -1, INK)
	text(message, Vector2(16, 179), 7)
	for button in [[14, "Previous partner"], [133, "Next partner"], [292, "Done"]]:
		draw_rect(Rect2(button[0], 184, 104 if button[0] < 292 else 77, 18), INK)
		text(button[1], Vector2(button[0] + 5, 196), 7, PAPER)
