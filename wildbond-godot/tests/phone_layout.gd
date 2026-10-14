extends RefCounted
## Phone layout: the upright page, the hint above the pad, battle commands, Next chips,
## the starter choice, and How to play on a touch device. It does not touch menu or tap wiring.

static func run(main: Node, check: Callable) -> void:
	var lines: PackedStringArray = main.turn_card.message()
	check.call(lines.size() == 3 and lines[0] == "Turn your phone sideways" and lines[1].contains("waiting") and lines[2].contains("wider"), "upright: the turn page says how to go on, in words")
	var was_paused: bool = main.get_tree().paused
	main.turn_card.check(Vector2(390, 844))
	check.call(main.turn_card.visible and main.get_tree().paused, "upright: the game still waits until the screen is wide")
	main.turn_card.check(Vector2(844, 390))
	check.call(not main.turn_card.visible and not main.get_tree().paused, "sideways: the turn page leaves and the journey carries on")
	main.turn_card.check(Vector2(360, 780))
	check.call(main.turn_card.visible, "a narrower upright phone still gets the turn page")
	main.turn_card.check(Vector2(780, 360))
	check.call(not main.turn_card.visible and main.get_tree().paused == was_paused, "turned sideways again, play resumes")

	var keep_text: String = str(main.caption.text)
	var keep_stage: String = str(main.stage)
	main.stage = "free"
	main.lines.clear()
	main.trans_t = -1.0
	for panel in [main.battle, main.book, main.card, main.shop, main.register, main.title, main.howto, main.lessons, main.menu]:
		panel.visible = false
	main.caption.text = "Follow Maren to her barn, the big wooden one at the top right, and walk in through its door. The north road leads to Thornwood after that."
	main.touch.touched = true
	main._thumbs_tick()
	var pad_top: float = main.TouchPad.PAD.y - main.TouchPad.PAD_R
	var pad_edge: float = main.TouchPad.PAD.x + main.TouchPad.PAD_R
	var cap_bottom: float = 216.0 + float(main.caption.offset_bottom)
	check.call(main.touch.visible and cap_bottom <= pad_top - 4.0 and float(main.caption.offset_left) >= pad_edge, "sideways: the hint sits above the walking pad and starts past it")
	var font: Font = main.caption.get_theme_font("font")
	var fsize: int = int(main.caption.get_theme_font_size("font_size"))
	var need: float = font.get_multiline_string_size(str(main.caption.text), HORIZONTAL_ALIGNMENT_CENTER, float(main.caption.size.x), fsize).y
	check.call(float(main.caption.size.y) + 1.0 >= need and cap_bottom <= 210.0, "sideways: the hint box holds the whole line and stays on screen")
	main.touch.touched = false
	main.caption.text = keep_text
	main.stage = keep_stage
	main._thumbs_tick()

	var scale_844: float = 390.0 / 216.0
	var scale_780: float = 360.0 / 216.0
	check.call(main.battle._row_h_for(scale_844) * scale_844 >= 44.0, "a battle command is at least 44 pixels tall on an 844 by 390 phone")
	check.call(main.battle._row_h_for(scale_780) * scale_780 >= 44.0, "a battle command is at least 44 pixels tall on a 780 by 360 phone")
	check.call(main.battle._row_h() == 16.0, "on a large window the battle commands stay 16 canvas pixels")
	var desk: Rect2 = main.battle._menu_rect(0)
	check.call(desk.position == Vector2(244, 170) and desk.size == Vector2(41, 16), "desktop battle commands keep their places")
	main.battle.layout_scale = scale_780
	var box: Rect2 = main.battle._command_box()
	var ally: Rect2 = main.battle._ally_panel()
	var clear := true
	for i in 6:
		var r: Rect2 = main.battle._menu_rect(i)
		if r.size.y * scale_780 < 44.0 or r.position.x < 0.0 or r.end.x > 384.0 or r.position.y < 0.0 or r.end.y > 216.0 or not box.encloses(r):
			clear = false
	check.call(clear and ally.end.y <= box.position.y, "on a 780 by 360 phone the battle commands fit, clear of the health panel")
	var chips: Dictionary = main.battle._chip_boxes(PackedStringArray(["Ripplet", "Smoulderpup", "Thicketboar", "Cindercub"]))
	var chips_fit := true
	for r in chips["rects"]:
		var chip: Rect2 = r
		if chip.position.x < 166.0 or chip.end.x > 376.0 or chip.end.y > 40.0:
			chips_fit = false
	check.call(chips_fit and chips["rects"].size() == 4, "the Next chips stay on screen instead of running off the right edge")
	main.battle.layout_scale = 0.0

	var card_h: float = main.card._choice_h_for(scale_844)
	check.call(card_h * scale_844 >= 44.0, "a starter choice is at least 44 pixels tall on an 844 by 390 phone")
	main.card.open("ripplet", main.card_info("ripplet"))
	check.call(main.card.sel == 0 and main.card._label(0).begins_with("Choose"), "the starter card highlights Choose, not Not yet")
	var choose: Rect2 = main.card._btn(0)
	var wait: Rect2 = main.card._btn(1)
	check.call(not choose.intersects(wait) and choose.end.y <= 216.0 and wait.end.y <= 216.0 and choose.size.y >= 16.0, "the two starter choices have their own room on the page")
	main.card.visible = false

	check.call(not main.howto.touch_device_size(Vector2(1536, 864)) and main.howto.touch_device_size(Vector2(844, 390)) and main.howto.touch_device_size(Vector2(390, 844)) and main.howto.touch_device_size(Vector2(780, 360)), "a phone-shaped window counts as a touch device, a desktop window does not")
	check.call(main.howto.leads_with("touch") == "Phone or tablet" and main.howto.leads_with("keys") == "Keyboard", "How to play leads with the phone controls on a touch device")
	check.call(main.howto.in_use() == "keys", "a computer with no phone window still leads with the keyboard")
