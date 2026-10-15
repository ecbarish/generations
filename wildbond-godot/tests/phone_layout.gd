extends RefCounted
const PhoneShell := preload("res://scripts/phone_shell.gd")
const HowTo := preload("res://scripts/howto.gd")
## Upright Game Boy layout (docs/art/wildbond-upright-layout.md). Headless: the frame is not mounted.
## These checks are the layout, the colours, the tap rules and the words. A real phone is still pending.

static func run(main: Node, check: Callable) -> void:
	var was_paused: bool = main.get_tree().paused
	main.turn_card.check(Vector2(390, 844))
	check.call(not main.turn_card.visible and not main.get_tree().paused, "upright: the rotate gate never appears and the game is not paused")
	main.turn_card.check(Vector2(360, 780))
	check.call(not main.turn_card.visible, "a narrower upright phone still has no rotate gate")
	main.turn_card.check(Vector2(844, 390))
	check.call(not main.turn_card.visible and main.get_tree().paused == was_paused, "sideways: there is still no rotate gate")

	var notch := Vector4(0, 47, 0, 34)
	var small := Vector4(0, 24, 0, 16)
	var wide := PhoneShell.layout_for(Vector2(390, 844), notch, 3.0)
	var slim := PhoneShell.layout_for(Vector2(360, 780), small, 3.0)
	var view_w: Rect2 = wide["view"]
	var view_s: Rect2 = slim["view"]
	check.call(view_w.position == Vector2(3, 51) and view_w.size == Vector2(384, 216) and int(wide["k"]) == 1 and int(wide["game_w"]) == 384, "390: the view is exactly 384 by 216 at k=1, under the notch")
	check.call(view_s.position == Vector2(4, 28) and view_s.size == Vector2(352, 216) and int(slim["game_w"]) == 352, "360: the view is exactly 352 by 216, one tile narrower")
	var back_w: Vector2 = wide["backing"]
	var back_s: Vector2 = slim["backing"]
	check.call(back_w == Vector2(1152, 648) and back_s == Vector2(1056, 648), "at DPR 3 each game pixel is a 3 by 3 device block")
	var strip_w: Rect2 = wide["strip"]
	var deck_w: Rect2 = wide["deck"]
	var strip_s: Rect2 = slim["strip"]
	check.call(strip_w.position.y == 271 and strip_w.size.y == 112 and strip_w.end.y == 383, "390: the strip is 112 tall, from y 271 to 383")
	check.call(strip_s.position.y == 248 and strip_s.size.y == 104 and strip_s.end.y == 352, "360: the strip is 104 tall, from y 248 to 352")
	check.call(not view_w.intersects(strip_w) and not strip_w.intersects(deck_w) and not view_w.intersects(deck_w), "390: view, strip and deck share no pixels")
	var deck_s: Rect2 = slim["deck"]
	check.call(not view_s.intersects(strip_s) and not strip_s.intersects(deck_s) and not view_s.intersects(deck_s), "360: view, strip and deck share no pixels")

	check.call(_targets_ok(wide) and _targets_ok(slim), "every tap target is at least 44 by 44, and separate controls are at least 8 apart")
	check.call(_clear_of_insets(wide, 47, 844 - 34) and _clear_of_insets(slim, 24, 780 - 16), "nothing tappable sits in the top or bottom inset")

	check.call(PhoneShell.contrast(PhoneShell.INK, PhoneShell.PAPER) >= 4.5 and PhoneShell.contrast(PhoneShell.INK, PhoneShell.DECK) >= 4.5, "ink on the paper and the deck is at least 4.5 to 1")
	check.call(PhoneShell.contrast(PhoneShell.CREAM, PhoneShell.SLATE) >= 4.5 and PhoneShell.contrast(PhoneShell.CREAM, PhoneShell.A_DIM) >= 4.5, "cream on the slate and the dark red is at least 4.5 to 1")
	check.call(PhoneShell.contrast(Color("8a6444"), PhoneShell.SHADOW) < 4.5 and PhoneShell.contrast(PhoneShell.DIM_TEXT, PhoneShell.SHADOW) >= 4.5, "the dim bark fails, so disabled words use the darker #6a4a32")
	check.call(PhoneShell.INK.to_html(false) == "1e1a22", "outlines are ink #1e1a22")
	check.call(HowTo.INK.to_html(false) == "1e1a22" and HowTo.PAPER.to_html(false) == "f4eddc" and HowTo.BARK.to_html(false) == "4a3426", "How to play uses ink, paper and bark")
	check.call(HowTo.SUB_BASELINE - HowTo.TITLE_BASELINE >= 24.0, "How to play sits on its own line, above Phone or tablet")
	check.call(PhoneShell.contrast(HowTo.BARK, HowTo.PAPER) >= 4.5, "Tap anywhere, in bark on paper, is at least 4.5 to 1")
	var port := PhoneShell.portrait_rect(Rect2(12, 51, 366, 332), Vector2i(18, 12))
	check.call(port.size == Vector2(36, 24) and port.position.y == 51.0 + 4.0 + 16.0 and absf(port.get_center().x - (12.0 + 183.0)) < 0.01, "the starter portrait is the sheet at 2x, 16px below the card's ink")

	check.call(PhoneShell.release_is_step(40, false) and not PhoneShell.release_is_step(40, true) and not PhoneShell.release_is_step(2000, false), "a tap under 100ms is one tile; a hold, or a tap that already stepped, is not")
	var dpad: Rect2 = wide["dpad"]
	var centre: Vector2 = dpad.get_center()
	check.call(PhoneShell.dpad_dir(dpad, centre) == Vector2i.ZERO, "the middle of the d-pad does nothing")
	check.call(PhoneShell.dpad_dir(dpad, Vector2(dpad.end.x - 8, centre.y)) == Vector2i.RIGHT, "the right wedge of the d-pad points right")
	check.call(PhoneShell.dpad_dir(dpad, Vector2(centre.x, dpad.position.y + 8)) == Vector2i.UP, "the upper wedge points up")

	var pages := PhoneShell.paginate("one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen", main.caption.get_theme_font("font"), 16, 120.0, 2)
	check.call(pages.size() > 1, "long text paginates instead of shrinking")
	var page_ok := true
	for page in pages:
		if page.split("\n").size() > 2 or page == "":
			page_ok = false
	check.call(page_ok, "each page stays inside its line count")

	var chips: Dictionary = PhoneShell.place_chips(PackedStringArray(["Ripplet", "Smoulderpup", "Thicketboar", "Cindercub"]), main.caption.get_theme_font("font"), strip_w.position.x, strip_w.position.y + 6.0, strip_w.end.x, 14, 28.0)
	var chip_rects: Array = chips["rects"]
	var chips_ok: bool = chip_rects.size() >= 4
	for r in chips["rects"]:
		var chip: Rect2 = r
		if chip.size.y < 28.0 or chip.end.x > 390.0 - 8.0 or chip.position.x < 8.0:
			chips_ok = false
	check.call(chips_ok and int(chips["font"]) >= 14, "four turn-order chips stay on the 390 screen, at least 14px, right edge inside the margin")
	var many: Dictionary = PhoneShell.place_chips(PackedStringArray(["Thicketboar", "Smoulderpup", "Cindercub", "Mosshog", "Fernruff", "Poolkit", "Hearthlaugh", "Slatehoof"]), main.caption.get_theme_font("font"), 8.0, 4.0, 376.0, 14, 28.0)
	var plus := false
	var many_ok := true
	for lab in many["labels"]:
		if str(lab).begins_with("+"):
			plus = true
	for r in many["rects"]:
		var chip2: Rect2 = r
		if chip2.end.x > 376.0 or chip2.end.y > 4.0 + 28.0 + 6.0 + 28.0 + 1.0:
			many_ok = false
	check.call(plus and many_ok, "chips past two lines become a +N chip and stay inside the screen")

	var keep_lines: Array = main.lines.duplicate()
	var keep_page := int(main.talk_page)
	var keep_key := str(main.talk_key)
	var keep_stage := str(main.stage)
	main.lines = [{"who": "", "text": "The same page stays open when the phone turns."}]
	main.talk_key = "The same page stays open when the phone turns."
	main.talk_page = 1
	var side := PhoneShell.layout_for(Vector2(844, 390), Vector4.ZERO, 1.0)
	check.call(main.lines.size() == 1 and int(main.talk_page) == 1 and str(main.talk_key) == "The same page stays open when the phone turns." and int(side["game_w"]) == 384, "rotating does not clear the open page or the line")
	var sv: Rect2 = side["view"]
	var ss: Rect2 = side["strip"]
	var sd: Rect2 = side["dpad"]
	var sa: Rect2 = PhoneShell.circle_box(side["a"], float(side["a_r"]))
	var sb: Rect2 = PhoneShell.circle_box(side["b"], float(side["b_r"]))
	var sm: Rect2 = side["menu"]
	var sleft: Rect2 = side["deck_left"]
	var sright: Rect2 = side["deck_right"]
	check.call(bool(side["side"]) and sv.size == Vector2(384, 216) and ss.position.y >= sv.end.y and not sv.intersects(ss), "844x390: the view stays 384 by 216 and the hint band sits under it")
	check.call(not sv.intersects(sleft) and not sv.intersects(sright) and sleft.size.x >= 44.0 and sright.size.x >= 44.0, "844x390: deck colour has a panel on each side of the view")
	check.call(sd.size.x >= 44.0 and sd.size.y >= 44.0 and not sv.intersects(sd) and float(side["a_r"]) >= 22.0 and float(side["b_r"]) >= 22.0, "844x390: the d-pad, A and B are at least 44 across and clear of the view")
	check.call(sm.size.y >= 44.0 and not sv.intersects(sm) and not ss.intersects(sm) and PhoneShell.box_gap(sa, sb) >= 8.0, "844x390: Menu is drawn clear of the view, and A and B stay apart")
	check.call(PhoneShell.wants(Vector2(844, 390)) and PhoneShell.wants(Vector2(390, 844)) and not PhoneShell.wants(Vector2(1920, 1080)), "a sideways phone gets the frame; a desktop does not")
	check.call(PhoneShell.strip_lines(112.0) == 4 and PhoneShell.strip_lines(104.0) == 3 and PhoneShell.strip_lines(72.0) == 2, "a hint band only keeps the lines that fit")
	main.lines = keep_lines
	main.talk_page = keep_page
	main.talk_key = keep_key
	main.stage = keep_stage

	main.card.open("ripplet", main.card_info("ripplet"))
	check.call(main.card.sel == 0 and main.card._label(0).begins_with("Choose"), "the starter card highlights Choose")
	var choose: Rect2 = wide["choose"]
	var wait: Rect2 = wide["not_yet"]
	var choose_s: Rect2 = slim["choose"]
	check.call(choose.size.x >= 140.0 and choose.size.y >= 48.0 and wait.size.x >= 140.0 and PhoneShell.box_gap(choose, wait) >= 8.0, "390: Choose and Not yet are wide enough and apart")
	check.call(choose_s.size.x >= 132.0 and choose_s.size.y >= 48.0, "360: the starter choices are at least 132 by 48")
	if main.card.chosen.is_connected(main._on_chosen):
		main.card.chosen.disconnect(main._on_chosen)
	var press := InputEventAction.new()
	press.action = "interact"
	press.pressed = true
	main.card._input(press)
	check.call(not main.card.visible, "A picks the highlighted choice immediately")
	main.card.chosen.connect(main._on_chosen)
	main.card.visible = false

	HowTo.note("")
	main.touch.touched = false
	main.touch.refresh()
	check.call(main.howto.in_use() == "keys", "a computer with no phone window still leads with the keyboard")
	HowTo.note("touch")
	check.call(main.howto.in_use() == "touch" and PhoneShell.TOUCH_HINT.to_lower().contains("tap") and not PhoneShell.TOUCH_HINT.contains("Keyboard") and not HowTo.TOUCH_COPY.contains("Keyboard"), "on touch, How to play names the d-pad, A and Menu, and never says Keyboard")
	check.call(main.keys_for("walk") == "the d-pad" and main.keys_for("talk").contains("A") and main.keys_for("book") == "Menu", "the hints name the drawn controls")
	HowTo.note("keys")
	check.call(main.howto.in_use() == "keys" and main.howto.leads_with("keys") == "Keyboard", "after a key, the keyboard wording returns")
	HowTo.note("")
	main.touch.touched = false
	main.touch.refresh()

	var keep_text: String = str(main.caption.text)
	main.stage = "free"
	main.lines.clear()
	main.trans_t = -1.0
	for panel in [main.battle, main.book, main.card, main.shop, main.register, main.title, main.howto, main.lessons, main.menu]:
		panel.visible = false
	main.caption.text = "Follow Maren to her barn, the big wooden one at the top right, and walk in through its door. The north road leads to Thornwood after that."
	main.touch.touched = true
	main._thumbs_tick()
	var pad_top: float = main.touch.pad_at().y - main.TouchPad.PAD_R
	var pad_edge: float = main.touch.pad_at().x + main.TouchPad.PAD_R
	var cap_bottom: float = 216.0 + float(main.caption.offset_bottom)
	check.call(main.touch.visible and cap_bottom <= pad_top - 4.0 and float(main.caption.offset_left) >= pad_edge, "sideways: the hint sits above the walking pad and starts past it")
	main.touch.touched = false
	main.caption.text = keep_text
	main.stage = keep_stage
	main._thumbs_tick()
	var acts: Array = main.menu.ACTIONS
	check.call(acts.size() == 4 and str(acts[0]) == "party" and str(acts[1]) == "book" and str(acts[2]) == "save" and str(acts[3]) == "close", "Menu is the party, field book, save and close page")
	_deck_menu(main, check)
	_deck_once(main, check)
	HowTo.note("")
	main.touch.touched = false
	main.touch.refresh()
	_sprites_inside(main, check)

## The deck's Menu button, in Larkhaven while Maren is still leading, and again in Thornwood.
static func _deck_menu(main: Node, check: Callable) -> void:
	var shell = PhoneShell.new()
	shell._main = main
	_quiet(main)
	main.stage = "to_barn"
	main._set_map("larkhaven")
	main._update_ui()
	check.call(main.map_name == "larkhaven" and main.stage == "to_barn" and main._menu_allowed(), "Larkhaven still allows the menu while you follow Maren")
	shell._do_menu()
	_menu_rows(main, check, "Larkhaven, while following Maren")
	main.menu.close()
	_quiet(main)
	main.stage = "free"
	main._set_map("thornwood")
	main._update_ui()
	check.call(main.map_name == "thornwood" and main._menu_allowed(), "Thornwood allows the menu")
	shell._do_menu()
	_menu_rows(main, check, "Thornwood")
	main.menu.close()
	shell.free()

static func _menu_rows(main: Node, check: Callable, where: String) -> void:
	var rows: Array = main.menu.ROWS
	check.call(main.menu.visible and rows.size() == 4 and str(rows[0]) == "Party" and str(rows[1]) == "Field book" and str(rows[2]) == "Save" and str(rows[3]) == "Close", "the deck Menu opens Party, Field book, Save and Close in %s" % where)

## A deck press and the lift that follows it must count once: Choose, Sign, the bag, Fight, and a line of talk.
static func _deck_once(main: Node, check: Callable) -> void:
	_quiet(main)
	main.stage = "barn_choose"
	main.card.open("ripplet", main.card_info("ripplet"))
	var picks := [0]
	if main.card.chosen.is_connected(main._on_chosen):
		main.card.chosen.disconnect(main._on_chosen)
	var count_pick: Callable = func(_id): picks[0] += 1
	main.card.chosen.connect(count_pick)
	var choose_at: Vector2 = main.card._btn(0).get_center()
	main.card.sel = 0
	main.card._pick(0)
	_release(main, choose_at)
	check.call(picks[0] == 1 and not main.card.visible, "Choose: the deck press picks once, and the lift does not pick again")
	main.card.chosen.disconnect(count_pick)
	main.card.chosen.connect(main._on_chosen)

	_quiet(main)
	main.stage = "free"
	main._set_map("thornwood")
	main.register.keep = false
	main.register.open()
	_click(main, Vector2(277, 181))
	check.call(not main.register.visible and main.stage == "signed" and main.lines.size() == 4, "Sign the register: press and lift sign once")

	_quiet(main)
	main.stage = "free"
	main._set_map("larkhaven")
	main._update_ui()
	var bag_at: Vector2 = main.satchel.position + main.satchel.size * 0.5
	_click(main, bag_at)
	check.call(main.menu.visible, "the bag: press and lift open the menu once")
	_click(main, bag_at)
	check.call(not main.menu.visible, "the bag: the next press and lift close the menu once, and do not open it again")

	_quiet(main)
	var lead: Dictionary = main.R.make("ripplet", 8, { "rar": 1 }, main.rng)
	var foe: Dictionary = main.R.make("mosshog", 8, { "rar": 1 }, main.rng)
	main.battle.open("wild", [lead], [foe], "")
	main.battle._go_to("choose")
	main.battle.wait_u = main.battle.allies[0]
	var fight: Vector2 = main.battle._menu_rect(0).get_center()
	main.battle.deck_press(0)
	_release(main, fight)
	check.call(main.battle.state == "moves", "Fight: the deck press opens the moves, and the lift does not choose a move")
	main.battle.visible = false
	main.battle.state = "off"

	_quiet(main)
	main.stage = "free"
	main.say("", "One.")
	main.say("", "Two.")
	main.say("", "Three.")
	main._update_ui()
	var bubble: Control = main.get_node("UI/Bubble")
	var spot: Vector2 = Rect2(bubble.position, bubble.size).get_center()
	_click(main, spot)
	check.call(main.lines.size() == 2 and str(main.lines[0].text) == "Two.", "dialogue: press and lift advance one line")
	_release(main, spot)
	check.call(main.lines.size() == 2 and str(main.lines[0].text) == "Two.", "dialogue: a later lift does not advance again")
	main.lines.clear()

## After the intro, both battle fronts sit inside the phone view. Upright and sideways, wide and narrow.
static func _sprites_inside(main: Node, check: Callable) -> void:
	var saved_scale: float = main.battle.layout_scale
	var saved_ui: bool = main.battle.external_ui
	var saved_view: Rect2 = main.battle.phone_view
	var cases: Array = [
		["390x844 upright", Vector2(390, 844), 384.0, true],
		["360x780 upright", Vector2(360, 780), 352.0, true],
		["844x390 sideways", Vector2(844, 390), 384.0, false],
		["780x360 sideways", Vector2(780, 360), 384.0, false],
	]
	for row in cases:
		_quiet(main)
		var win: Vector2 = row[1]
		var view_w: float = row[2]
		main.battle.layout_scale = minf(win.x / 384.0, win.y / 216.0)
		main.battle.external_ui = row[3]
		main.battle.phone_view = Rect2(0, 0, view_w, 216)
		var lead: Dictionary = main.R.make("ripplet", 8, { "rar": 1 }, main.rng)
		var foe: Dictionary = main.R.make("cindercub", 8, { "rar": 1 }, main.rng)
		main.battle.open("wild", [lead], [foe], "")
		var guard := 0
		while (main.battle.state == "fog_in" or main.battle.state == "intro") and guard < 80:
			main.battle._process(0.05)
			guard += 1
		var view := Rect2(0, 0, view_w, 216)
		var ally: Rect2 = main.battle.sprite_rect(main.battle.allies[0])
		var opp: Rect2 = main.battle.sprite_rect(main.battle.foes[0])
		var past: bool = main.battle.state != "fog_in" and main.battle.state != "intro"
		check.call(past and _rect_inside(view, ally) and _rect_inside(view, opp) and ally.size == Vector2(64, 64) and opp.size == Vector2(64, 64), "after the intro, both battle sprites sit inside the %s view (ally %s, foe %s, %s)" % [row[0], ally, opp, main.battle.state])
	_quiet(main)
	main.battle.layout_scale = saved_scale
	main.battle.external_ui = saved_ui
	main.battle.phone_view = saved_view

static func _rect_inside(view: Rect2, rect: Rect2) -> bool:
	return rect.position.x >= view.position.x - 0.01 and rect.position.y >= view.position.y - 0.01 and rect.end.x <= view.end.x + 0.01 and rect.end.y <= view.end.y + 0.01

static func _quiet(main: Node) -> void:
	main.lines.clear()
	main.then_do = Callable()
	main.trans_t = -1.0
	main.walk_to.clear()
	main.me.path.clear()
	main.walk_tap = Vector2i.ZERO
	main.get_tree().paused = false
	for panel in [main.battle, main.book, main.card, main.shop, main.register, main.title, main.howto, main.lessons, main.turn_card]:
		panel.visible = false
	if main.menu.visible:
		main.menu.close()
	main.battle.state = "off"

static func _click(main: Node, at: Vector2) -> void:
	_press(main, at)
	_release(main, at)

static func _press(main: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = main.get_viewport().get_final_transform() * at
	main.get_viewport().push_input(event)

static func _release(main: Node, at: Vector2) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = false
	event.position = main.get_viewport().get_final_transform() * at
	main.get_viewport().push_input(event)

static func _targets_ok(L: Dictionary) -> bool:
	var dpad: Rect2 = L["dpad"]
	# Each direction is a quadrant of the pad (66 or 62), which is at least 44. The four wedges meet on the diagonal.
	if dpad.size.x < 88.0 or dpad.size.y / 2.0 < 44.0:
		return false
	var deck: Array = [dpad, PhoneShell.circle_box(L["a"], float(L["a_r"])), PhoneShell.circle_box(L["b"], float(L["b_r"])), L["menu"]]
	if not _spaced(deck):
		return false
	var walk: Array = deck.duplicate()
	walk.append(L["strip"])
	if not _spaced(walk):
		return false
	var battle: Array = deck.duplicate()
	for r in L["buttons"]:
		var b: Rect2 = r
		if b.size.x < 44.0 or b.size.y < 44.0:
			return false
		battle.append(b)
	if not _spaced(battle):
		return false
	var card: Array = deck.duplicate()
	card.append(L["choose"])
	card.append(L["not_yet"])
	return _spaced(card)

static func _spaced(boxes: Array) -> bool:
	for i in boxes.size():
		var a: Rect2 = boxes[i]
		if a.size.x < 44.0 or a.size.y < 44.0:
			return false
		for j in range(i + 1, boxes.size()):
			var b: Rect2 = boxes[j]
			if a.intersects(b) or PhoneShell.box_gap(a, b) < 8.0:
				return false
	return true

static func _clear_of_insets(L: Dictionary, top: float, bottom: float) -> bool:
	var boxes: Array = [L["view"], L["strip"], L["dpad"], PhoneShell.circle_box(L["a"], float(L["a_r"])), PhoneShell.circle_box(L["b"], float(L["b_r"])), L["menu"], L["choose"], L["not_yet"]]
	for r in L["buttons"]:
		boxes.append(r)
	for box in boxes:
		var b: Rect2 = box
		if b.position.y < top - 0.01 or b.end.y > bottom + 0.01:
			return false
	return true
