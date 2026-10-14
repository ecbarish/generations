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
