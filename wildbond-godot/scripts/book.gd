extends Control
## The field book you carry (docs/wildbond-plan.md phase 4, "menus you hold"): open it with Tab or J, or tap the satchel
## bag in the corner. Four pages: the Wilddex (every creature in the game: seen ones in colour, the rest dark shapes, a mark for the ones
## that chose you; pick one for its page), your Team (level, health, XP, moves; who rests at the ranch) and the Satchel
## (what you carry, your badges and keepsakes: the numbers live here, not on the screen, WD1).
## The last page is Settings (WB6.2): sound, text size, battle pace and the phone buttons.
## Arrow keys move, Q/E or 1 to 4 switch pages, Tab/J/Esc close. A gamepad, the mouse or a finger work too.

signal closed
signal want_howto                              # the Settings page's last row: show the How to play page
const Figures := preload("res://scripts/figures.gd")
const Sprites := preload("res://scripts/creature_sprites.gd")
const R := preload("res://scripts/rules.gd")
const INK := Color("3e2c20")
const FAINT := Color("8a6e50")
const EL_COL := { "Ember": Color("e0602a"), "Tide": Color("3a8fd8"), "Grove": Color("5d9a3e"), "Gale": Color("8ac8e0"),
	"Stone": Color("9a8a74"), "Shade": Color("6a5a8a"), "Radiant": Color("e8c84a") }
const COLS := 8
const ROWS := 7

var ids: Array = []                            # every species, in the game's order
var looks: Dictionary = {}                     # main.gd's few hand-made looks (starters); the rest use family plans
var seen: Dictionary = {}
var bonded: Dictionary = {}
var team: Array = []
var ranch: Array = []
var where := ""
var keepsakes: Array = []                      # festival keepsakes (names), shown on the Satchel page
var bag: Dictionary = {}                       # main.gd's satchel: coins, lures, berries
var badges: Array = []                         # { name, col } for each badge you hold, in the order you earned them
var cal: RefCounted = null                     # the calendar (calendar.gd): the date at the foot of the left page; C changes it                                # where to go next, in Maren's words (main.gd where_next)
var tab := 0                                   # 0 Wilddex, 1 Team, 2 Satchel, 3 Settings
const TABS := [["Wilddex", 30, 40], ["Team", 72, 30], ["Satchel", 104, 38], ["Settings", 144, 44]]   # name, x, width
const SETTINGS_TAB := 3
var settings: Settings = null                  # main.gd's settings (settings.gd): the last page changes them
var row := 0                                   # the setting picked on that page
var sel := 0
var t := 0.0
var font: Font

func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

func open() -> void:
	ids = R.DATA.SPECIES.keys()
	visible = true
	queue_redraw()

func close() -> void:
	visible = false
	closed.emit()

func _process(dt: float) -> void:
	if visible:
		t += dt
		queue_redraw()

func _page_start() -> int:
	return (sel / (COLS * ROWS)) * COLS * ROWS

func _cell(i: int) -> Rect2:
	var k := i - _page_start()
	return Rect2(34 + (k % COLS) * 19, 42 + (k / COLS) * 20, 18, 18)

func _input(e: InputEvent) -> void:
	if not visible:
		return
	if e is InputEventKey and e.pressed and not e.echo and e.keycode >= KEY_1 and e.keycode < KEY_1 + TABS.size():
		tab = e.keycode - KEY_1                    # 1 to 4 jump straight to a page
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "page_prev"):         # Q or the left shoulder before Back, which also has Q
		tab = (tab + TABS.size() - 1) % TABS.size()
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "page_next"):
		tab = (tab + 1) % TABS.size()
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "open_book") or Controls.pressed(e, "back"):
		close()
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "calendar"):
		if cal: cal.next_mode()
		get_viewport().set_input_as_handled()
	elif Controls.dir(e) != Vector2i.ZERO:
		var d := Controls.dir(e)
		if tab == SETTINGS_TAB:
			_settings_key(d)
		else:
			sel = clampi(sel + d.x + d.y * COLS, 0, ids.size() - 1)
		get_viewport().set_input_as_handled()
	elif Controls.pressed(e, "interact"):
		if tab == SETTINGS_TAB:
			_settings_key(Vector2i.RIGHT)
		get_viewport().set_input_as_handled()
	elif e is InputEventKey and e.pressed:
		get_viewport().set_input_as_handled()      # the open book keeps every other key from reaching the world
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var p := get_local_mouse_position()
		var hit := -1
		for i in TABS.size():
			if Rect2(TABS[i][1], 14, TABS[i][2], 14).has_point(p): hit = i
		if hit >= 0: tab = hit
		elif not Rect2(22, 10, 340, 198).has_point(p): close()
		elif tab == SETTINGS_TAB:
			for i in Settings.ROWS.size() + 1:
				if _row_rect(i).has_point(p):
					row = i
					_settings_key(Vector2i.LEFT if p.x < _row_rect(i).get_center().x else Vector2i.RIGHT)
		elif tab == 0:
			for i in range(_page_start(), mini(ids.size(), _page_start() + COLS * ROWS)):
				if _cell(i).has_point(p): sel = i
			if Rect2(150, 186, 30, 12).has_point(p): sel = mini(ids.size() - 1, _page_start() + COLS * ROWS)
			if Rect2(30, 186, 30, 12).has_point(p): sel = maxi(0, _page_start() - COLS * ROWS)
		get_viewport().set_input_as_handled()

func _look(id: String) -> Dictionary:
	return looks.get(id, Figures.look_for(R.DATA.SPECIES[id]))

func _shadow(look: Dictionary) -> Dictionary:
	var l := look.duplicate()
	for k in ["body", "belly", "dark", "accent", "snout"]:
		l[k] = Color("4a4250")
	return l

func _text(s: String, at: Vector2, size: int, col: Color, width := -1.0, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	draw_string(font, at, s, align if width > 0 else HORIZONTAL_ALIGNMENT_LEFT, width, size, col)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 384, 216), Color(0.05, 0.04, 0.06, 0.5))
	draw_rect(Rect2(22, 10, 340, 198), Color("4a2e1a"))
	draw_rect(Rect2(24, 12, 336, 194), Color("6e4a2c"))
	draw_rect(Rect2(28, 16, 163, 186), Color("f2e6c8"))
	draw_rect(Rect2(193, 16, 163, 186), Color("f4e9cd"))
	draw_rect(Rect2(188, 16, 8, 186), Color("dccca4"))
	# the two tabs, like ribbons
	for i in TABS.size():
		var r := Rect2(TABS[i][1], 17, TABS[i][2], 12)
		draw_rect(r, INK if tab == i else Color("e4d6b4"))
		_text(TABS[i][0], r.position + Vector2(0, 9), 7, Color("f4e9cd") if tab == i else INK, r.size.x, HORIZONTAL_ALIGNMENT_CENTER)
	_text(_date() + "   %d seen of %d, %d bonded" % [seen.size(), R.DATA.SPECIES.size(), bonded.size()], Vector2(193, 27), 6, FAINT, 160, HORIZONTAL_ALIGNMENT_CENTER)
	if tab == 0:
		_draw_dex()
	elif tab == 1:
		_draw_team()
	elif tab == 2:
		_draw_satchel()
	else:
		_draw_settings()
	var hint := "Tap a page's ribbon; tap outside to close" if Controls.touch else "Tab or J to close   Q / E: pages   C: calendar"
	_text(hint, Vector2(193, 200), 6, FAINT, 163, HORIZONTAL_ALIGNMENT_CENTER)

func _draw_dex() -> void:
	var start := _page_start()
	for i in range(start, mini(ids.size(), start + COLS * ROWS)):
		var id: String = ids[i]
		var r := _cell(i)
		if i == sel:
			draw_rect(r.grow(1), Color(0.85, 0.66, 0.36, 0.6))
		var known := seen.has(id)
		var look := _look(id) if known else _shadow(_look(id))
		var drew := false
		if known and Sprites.has(id):
			var sz := Sprites.frame_size(id, "idle")
			var fit := Sprites.fit_scale(sz, Vector2(16, 16), 1.0)
			drew = Sprites.try_draw(self, id, r.position + Vector2(9, 17), true, "idle", 0, fit)
		if not drew:
			Figures.creature(self, r.position + Vector2(0, 2), true, { "wag": 0 }, look)
		if bonded.has(id):
			draw_rect(Rect2(r.position + Vector2(13, 0), Vector2(5, 5)), Color("4aa84a"))         # chose you
	var pages := ceili(float(ids.size()) / (COLS * ROWS))
	_text("Page %d of %d" % [start / (COLS * ROWS) + 1, pages], Vector2(28, 196), 6, FAINT, 163, HORIZONTAL_ALIGNMENT_CENTER)
	if start > 0: _text("< back", Vector2(32, 196), 6, INK)
	if start + COLS * ROWS < ids.size(): _text("more >", Vector2(152, 196), 6, INK)
	# the page for the selected creature
	var id2: String = ids[sel]
	var s: Dictionary = R.DATA.SPECIES[id2]
	var known2 := seen.has(id2)
	_text("No. %03d" % (sel + 1), Vector2(200, 60), 7, FAINT)
	_text(s.name if known2 else "???", Vector2(193, 44), 11, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	var look2 := _look(id2) if known2 else _shadow(_look(id2))
	var drew2 := false
	if known2 and Sprites.has(id2):
		var sz2 := Sprites.frame_size(id2, "idle")
		var fit2 := Sprites.fit_scale(sz2, Vector2(120, 70), 4.0)
		drew2 = Sprites.try_draw(self, id2, Vector2(274, 58 + float(sz2.y) * fit2), true, "idle", int(t * 6.0), fit2)
	if not drew2:
		draw_set_transform(Vector2(238, 64), 0, Vector2(4, 4))
		Figures.creature(self, Vector2.ZERO, true, { "wag": [1, 0, -1, 0][int(t * 6.0) % 4] if known2 else 0, "blink": fmod(t, 3.0) < 0.12, "ears_up": true }, look2)
		draw_set_transform(Vector2.ZERO)
	if known2:
		draw_rect(Rect2(250, 122, 48, 10), EL_COL.get(s.el, FAINT))
		_text(s.el, Vector2(250, 130), 7, Color("fdf6e6"), 48, HORIZONTAL_ALIGNMENT_CENTER)
		draw_multiline_string(font, Vector2(202, 146), s.dex, HORIZONTAL_ALIGNMENT_LEFT, 146, 7, -1, INK)
		var homes: Array = []
		for b in R.DATA.BIOMES:
			for w in R.DATA.BIOMES[b].get("wild", []):
				if w[0] == id2:
					homes.append(R.DATA.BIOMES[b].name)
		_text(("Lives in: " + ", ".join(homes)) if not homes.is_empty() else "Lives somewhere rare.", Vector2(202, 182), 6, FAINT)
		if bonded.has(id2):
			_text("It chose to walk with you.", Vector2(202, 191), 6, Color("3a8a3a"))
		# what Maren thinks about how it changes (evolution.json hints), once you've seen it
		var hints: Array = R.DATA.get("EVOS", {}).get(id2, []).map(func(o): return str(o.get("hint", ""))).filter(func(h): return h != "")
		if not hints.is_empty():
			draw_multiline_string(font, Vector2(202, 166), "Maren: \"%s\"" % hints[0], HORIZONTAL_ALIGNMENT_LEFT, 146, 6, 2, Color("6a5a3a"))
	else:
		draw_multiline_string(font, Vector2(202, 140), "Not seen yet. Explore the tall grass, and look in every place you visit.", HORIZONTAL_ALIGNMENT_LEFT, 146, 7, -1, FAINT)

func _draw_team() -> void:
	var y := 36.0
	for c in team:
		var st := R.stats(c)
		if Sprites.has(str(c.sp)):
			var sz3 := Sprites.frame_size(str(c.sp), "idle")
			var fit3 := Sprites.fit_scale(sz3, Vector2(36, 30), 2.0)
			Sprites.try_draw(self, str(c.sp), Vector2(52, y + 32), true, "idle", int(t * 5.0), fit3, 0.0, str(c.get("gear", "")))
		else:
			draw_set_transform(Vector2(34, y), 0, Vector2(2, 2))
			Figures.creature(self, Vector2.ZERO, true, { "wag": [1, 0, -1, 0][int(t * 5.0) % 4], "ears_up": true }, _look(c.sp))
			draw_set_transform(Vector2.ZERO)
		_text("%s   Lv %d" % [c.name, c.lvl], Vector2(74, y + 8), 8, INK)
		var bar := Rect2(74, y + 12, 100, 4)
		draw_rect(bar.grow(1), INK)
		draw_rect(bar, Color("4a3a3a"))
		var f := clampf(float(c.hp) / st.hp, 0.0, 1.0)
		draw_rect(Rect2(bar.position, Vector2(bar.size.x * f, bar.size.y)), Color("5cc85a") if f > 0.5 else (Color("e8c03a") if f > 0.2 else Color("e0503a")))
		_text("%d / %d HP   XP %d / %d" % [c.hp, st.hp, c.xp, R.xp_need(c.lvl)], Vector2(74, y + 24), 6, FAINT)
		var mv: Array = R.moves_of(c).map(func(m): return R.DATA.MOVES[m].name)
		_text(", ".join(mv), Vector2(74, y + 32), 6, INK)
		y += 46.0
	var x := 202.0
	var y2 := 44.0
	_text("At Maren's ranch", Vector2(193, 40), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	if ranch.is_empty():
		draw_multiline_string(font, Vector2(202, 58), "Nobody yet. Your team holds three; creatures who choose you after that rest here.", HORIZONTAL_ALIGNMENT_LEFT, 146, 7, -1, FAINT)
	for c in ranch:
		_text("%s, level %d" % [c.name, c.lvl], Vector2(x, y2 + 12), 7, INK)
		y2 += 12.0
	if where != "":
		_text("Where next", Vector2(193, 158), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
		draw_multiline_string(font, Vector2(202, 170), "Maren: \"%s\"" % where, HORIZONTAL_ALIGNMENT_LEFT, 146, 6, 4, Color("6a5a3a"))

## What you carry, in words: coins, lures and berries on the left page; your badges, one per Warden, and festival
## keepsakes on the right.
func _draw_satchel() -> void:
	_text("In your satchel", Vector2(28, 44), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	var rows := [
		["coins", Color("e8c84a"), "%s coin%s" % [int(bag.get("coins", 0)), "" if int(bag.get("coins", 0)) == 1 else "s"], "Juniper sells lures and berries for these."],
		["lures", Color("d86a8a"), "%s lure%s" % [int(bag.get("lures", 0)), "" if int(bag.get("lures", 0)) == 1 else "s"], "Offer one when a wild creature is tired, and it may choose you."],
		["berries", Color("8a3ab0"), "%s berr%s" % [int(bag.get("berries", 0)), "y" if int(bag.get("berries", 0)) == 1 else "ies"], "A handful mends a tired team in battle."],
	]
	var y := 58.0
	for r in rows:
		draw_rect(Rect2(38, y - 1, 10, 10), INK)
		draw_rect(Rect2(39, y, 8, 8), r[1])
		_text(r[2], Vector2(54, y + 7), 8, INK)
		draw_multiline_string(font, Vector2(54, y + 16), r[3], HORIZONTAL_ALIGNMENT_LEFT, 128, 6, 2, FAINT)
		y += 38.0
	_text("Badges", Vector2(193, 44), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	for i in 8:
		var at := Vector2(206 + (i % 4) * 36, 52 + (i / 4) * 34)
		var won: bool = i < badges.size()
		draw_circle(at + Vector2(10, 10), 10, INK)
		draw_circle(at + Vector2(10, 10), 8.5, badges[i].col if won else Color("e4d6b4"))
		if won:
			draw_circle(at + Vector2(7, 7), 2.5, Color(1, 1, 1, 0.45))
			_text(str(badges[i].name).trim_suffix(" Badge"), at + Vector2(-6, 28), 6, INK, 32, HORIZONTAL_ALIGNMENT_CENTER)
	if badges.is_empty():
		draw_multiline_string(font, Vector2(202, 130), "None yet. Each Warden gives one to a tamer who earns it.", HORIZONTAL_ALIGNMENT_LEFT, 146, 6, 2, FAINT)
	if not keepsakes.is_empty():
		draw_multiline_string(font, Vector2(202, 148), "Keepsakes: " + ", ".join(keepsakes) + ".", HORIZONTAL_ALIGNMENT_LEFT, 146, 6, 4, Color("6a5a3a"))

## Settings (WB6.2): each row reads in words, with arrows either side; tap the left half to lower it, the right half
## to raise it, or use the arrow keys. The right page explains the row you're on. Changes take effect at once and are
## kept on this device (settings.gd).
func _row_rect(i: int) -> Rect2:
	return Rect2(32, 49 + i * 21, 155, 20)

## The rows are the settings plus one more at the foot, "Controls", which opens the How to play page.
func _settings_key(d: Vector2i) -> void:
	if settings == null:
		return
	if d.y != 0:
		row = wrapi(row + d.y, 0, Settings.ROWS.size() + 1)
	elif row == Settings.ROWS.size():
		want_howto.emit()
	elif d.x != 0:
		settings.step(Settings.ROWS[row][0], d.x)

func _draw_settings() -> void:
	_text("Settings", Vector2(28, 44), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	if settings == null:
		return
	for i in Settings.ROWS.size():
		var key: String = Settings.ROWS[i][0]
		var r := _row_rect(i)
		if i == row:
			draw_rect(r, Color(0.85, 0.66, 0.36, 0.35))
		_text(Settings.ROWS[i][1], r.position + Vector2(4, 8), 7, INK)
		var y := r.position.y + 11
		for side in [-1, 1]:                   # the arrows either side of the value
			var c := Vector2(r.position.x + (8 if side < 0 else r.size.x - 8), y + 4)
			draw_colored_polygon(PackedVector2Array([c + Vector2(3 * side, 0), c + Vector2(-2 * side, -3), c + Vector2(-2 * side, 3)]), INK if i == row else FAINT)
		if Settings.BUS.has(key):              # a volume: ten notches, filled up to the level
			var v := int(settings.values[key])
			for n in 10:
				draw_rect(Rect2(r.position.x + 20 + n * 11, y + 1, 9, 6), INK if n < v else Color("e4d6b4"))
			_text("Off" if v == 0 else "", Vector2(r.position.x + 20, y + 7), 6, Color("a04030"), 108, HORIZONTAL_ALIGNMENT_CENTER)
		else:
			_text(settings.shown(key), Vector2(r.position.x + 14, y + 7), 7, INK, r.size.x - 28, HORIZONTAL_ALIGNMENT_CENTER)
	var c := _row_rect(Settings.ROWS.size())             # the last row: the controls page
	if row == Settings.ROWS.size():
		draw_rect(c, Color(0.85, 0.66, 0.36, 0.35))
	_text("Controls", c.position + Vector2(4, 8), 7, INK)
	_text("Show the How to play page", c.position + Vector2(14, 18), 7, INK, c.size.x - 28, HORIZONTAL_ALIGNMENT_CENTER)
	var on_controls := row == Settings.ROWS.size()
	_text("Controls" if on_controls else Settings.ROWS[row][1], Vector2(193, 44), 8, INK, 163, HORIZONTAL_ALIGNMENT_CENTER)
	var help: String = "The keys, the phone buttons and the gamepad buttons, side by side." if on_controls else Settings.HELP[Settings.ROWS[row][0]]
	draw_multiline_string(font, Vector2(202, 60), help, HORIZONTAL_ALIGNMENT_LEFT, 146, 7, -1, Color("6a5a3a"))
	draw_multiline_string(font, Vector2(202, 150), "These stay with this computer or phone, whichever journey you play. Your journey saves itself as you go.", HORIZONTAL_ALIGNMENT_LEFT, 146, 6, -1, FAINT)

## The date, or the festival when there is one (the real calendar says so; C cycles the world's own, the real one and
## each season held).
func _date() -> String:
	if cal == null:
		return ""
	var fest: String = cal.festival()
	if fest != "":
		return cal.FESTIVALS[fest].name.capitalize() if not cal.FESTIVALS[fest].name.begins_with("the ") else "The " + cal.FESTIVALS[fest].name.substr(4)
	return cal.date_text() + (" (real)" if cal.mode == "real" else "")
