extends SceneTree
## A real window already maps a click into the 384×216 view before _input.
## At 1536×864 the centre of the window is view pixel (192, 108). Run this under xvfb, not --headless:
##   xvfb-run -a -s "-screen 0 1800x1000x24" godot --path wildbond-godot --audio-driver Dummy \
##     --rendering-method gl_compatibility --script res://tests/view_click.gd

var armed := false
var got := false
var raw := Vector2(-1, -1)
var hit := Vector2(-1, -1)

func _initialize() -> void:
	_go.call_deferred()

func _go() -> void:
	root.size = Vector2i(1536, 864)
	DisplayServer.window_set_size(Vector2i(1536, 864))
	var layer := CanvasLayer.new()
	root.add_child(layer)
	var pad := ClickPad.new()
	pad.host = self
	pad.position = Vector2.ZERO
	pad.size = Vector2(384, 216)
	pad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(pad)
	for _i in 3:
		await process_frame
	armed = true
	var event := InputEventMouseButton.new()
	event.window_id = root.get_window_id()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	event.position = Vector2(768, 432)
	event.global_position = Vector2(768, 432)
	Input.parse_input_event(event)
	Input.flush_buffered_events()
	await process_frame
	var ok: bool = got and hit.distance_to(Vector2(192, 108)) < 1.0
	print("view click: window %s raw %s at %s -> %s" % [DisplayServer.window_get_size(), raw, hit, "pass" if ok else "FAIL"])
	quit(0 if ok else 1)

class ClickPad extends Control:
	var host
	func _input(e: InputEvent) -> void:
		if host == null or not host.armed:
			return
		if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
			host.raw = e.position
			host.hit = Controls.at(self, e)
			host.got = true
