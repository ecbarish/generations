extends Control
const Session := preload("res://session.gd")
const Canvas := preload("res://canvas.gd")
var session := Session.new()
var name_id := ""
var frame_index := 0
var playing := false
var elapsed := 0.0
var brush_color := 0
var updating := false
var source_texture: ImageTexture
var reference_texture: ImageTexture
var species: OptionButton
var frame_label: Label
var frame_slider: HSlider
var play_button: Button
var anchor_x: SpinBox
var anchor_y: SpinBox
var zoom: SpinBox
var speed: SpinBox
var onion: CheckBox
var grid: CheckBox
var source_view: CheckBox
var brush_mode: OptionButton
var viewer: Control
var status: Label
var metrics: Label
var palette_row: GridContainer
var dialog: FileDialog
var discard: ConfirmationDialog
var pending: Callable
var mode := "manifest"
var latest_export := ""
func label(parent: Node,text: String,small := false) -> Label:
    var item := Label.new();item.text=text;item.add_theme_font_size_override("font_size",14 if small else 17);parent.add_child(item);return item
func button(parent: Node,text: String,action: Callable) -> Button:
    var item := Button.new();item.text=text;item.custom_minimum_size.y=34;parent.add_child(item);item.pressed.connect(action);return item
func spin(parent: Node,title: String,minimum: float,maximum: float,value: float,step := 1.0) -> SpinBox:
    label(parent,title,true)
    var item := SpinBox.new();item.min_value=minimum;item.max_value=maximum;item.step=step;item.value=value;parent.add_child(item);return item
func ask_discard(action: Callable) -> void:
    if not session.dirty:action.call();return
    pending=action;discard.popup_centered()
func _ready() -> void:
    get_tree().auto_accept_quit=false
    var margin := MarginContainer.new();margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    for side in ["left","right","top","bottom"]:margin.add_theme_constant_override("margin_"+side,18)
    add_child(margin)
    var body := VBoxContainer.new();body.add_theme_constant_override("separation",12);margin.add_child(body)
    label(body,"Wildbond / Sprite Workbench").add_theme_font_size_override("font_size",27)
    label(body,"Inspect animation, align roots, clean native pixels. Original sheets remain unchanged.",true)
    var toolbar := HFlowContainer.new();body.add_child(toolbar)
    button(toolbar,"Mosshog family",func():ask_discard(func():load_source(Session.family_manifest())))
    button(toolbar,"Base trio",func():ask_discard(func():load_source(Session.starter_manifest())))
    button(toolbar,"Open measurements",func():ask_discard(func():choose("manifest")))
    button(toolbar,"Open draft",func():ask_discard(func():choose("draft")))
    button(toolbar,"Save draft",func():choose("save"))
    button(toolbar,"Reference PNG",func():choose("reference"))
    button(toolbar,"Export atlas",export_current)
    button(toolbar,"Show export",func():
        if latest_export!="":OS.shell_open(ProjectSettings.globalize_path(latest_export)))
    var work := HBoxContainer.new();work.size_flags_vertical=Control.SIZE_EXPAND_FILL;work.add_theme_constant_override("separation",18);body.add_child(work)
    var scroll := ScrollContainer.new();scroll.custom_minimum_size.x=265;scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;work.add_child(scroll)
    var controls := VBoxContainer.new();controls.size_flags_horizontal=Control.SIZE_EXPAND_FILL;controls.add_theme_constant_override("separation",8);scroll.add_child(controls)
    label(controls,"Creature")
    species=OptionButton.new();controls.add_child(species);species.item_selected.connect(func(i):select_species(str(species.get_item_metadata(i))))
    frame_label=label(controls,"Frame 0")
    frame_slider=HSlider.new();frame_slider.step=1;controls.add_child(frame_slider);frame_slider.value_changed.connect(func(v):
        if not updating:frame_index=int(v);playing=false;refresh())
    var playback := HBoxContainer.new();controls.add_child(playback)
    button(playback,"Previous",func():step_frame(-1));play_button=button(playback,"Play",func():playing=not playing;refresh(false));button(playback,"Next",func():step_frame(1))
    speed=spin(controls,"Playback · frames per second",1,16,5)
    zoom=spin(controls,"Zoom · whole pixels",1,12,6);zoom.value_changed.connect(func(_v):viewer.queue_redraw())
    onion=CheckBox.new();onion.text="Overlay neighbouring frames";onion.button_pressed=true;controls.add_child(onion);onion.toggled.connect(func(_v):viewer.queue_redraw())
    grid=CheckBox.new();grid.text="Pixel grid";controls.add_child(grid);grid.toggled.connect(func(_v):viewer.queue_redraw())
    source_view=CheckBox.new();source_view.text="Show original source";controls.add_child(source_view);source_view.toggled.connect(func(_v):viewer.queue_redraw())
    label(controls,"Body root and ground")
    anchor_x=spin(controls,"Root X · source pixels",0,4096,0,.25);anchor_y=spin(controls,"Ground Y · source pixels",0,4096,0,.25)
    anchor_x.value_changed.connect(edit_anchor);anchor_y.value_changed.connect(edit_anchor)
    button(controls,"Apply offset to this cycle",func():
        if name_id!="":session.apply_cycle_offset(name_id,frame_index);refresh())
    label(controls,"Pixel cleanup")
    brush_mode=OptionButton.new()
    for text in ["Inspect","Paint","Erase"]:brush_mode.add_item(text)
    controls.add_child(brush_mode);brush_mode.item_selected.connect(func(_i):playing=false;refresh(false))
    palette_row=GridContainer.new();palette_row.columns=8;controls.add_child(palette_row)
    var history := HBoxContainer.new();controls.add_child(history)
    button(history,"Undo",func():session.undo();refresh());button(history,"Redo",func():session.redo();refresh())
    button(controls,"Reset selected frame",reset_frame)
    metrics=label(controls,"",true);metrics.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
    viewer=Canvas.new();viewer.app=self;viewer.custom_minimum_size=Vector2(400,320);viewer.size_flags_horizontal=Control.SIZE_EXPAND_FILL;viewer.size_flags_vertical=Control.SIZE_EXPAND_FILL;work.add_child(viewer)
    status=label(body,"Ready.",true);status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;status.custom_minimum_size.y=38
    dialog=FileDialog.new();dialog.access=FileDialog.ACCESS_FILESYSTEM;dialog.use_native_dialog=false;dialog.filters=PackedStringArray(["*.json ; Measurements or workbench draft"]);add_child(dialog);dialog.file_selected.connect(chosen)
    discard=ConfirmationDialog.new();discard.title="Unsaved workbench edits";discard.dialog_text="Save a draft first to keep these edits, or discard them and continue.";discard.ok_button_text="Discard and continue";add_child(discard);discard.confirmed.connect(func():pending.call())
    load_source(Session.family_manifest())
func load_source(path: String) -> void:
    if not session.load_manifest(path):status.text=session.issue;return
    populate();status.text="Loaded measured source. Drafts and atlases stay separate from the originals."
func populate() -> void:
    species.clear()
    for name in session.entries:
        species.add_item(str(name).replace("_"," ").capitalize());species.set_item_metadata(species.item_count-1,name)
    select_species(str(session.entries.keys()[0]))
func select_species(name: String) -> void:
    name_id=name;frame_index=0;playing=false
    for i in species.item_count:
        if species.get_item_metadata(i)==name:species.select(i)
    source_texture=ImageTexture.create_from_image(session.images[name])
    for child in palette_row.get_children():palette_row.remove_child(child);child.queue_free()
    var colors := session.palette(name)
    var swatches := ButtonGroup.new()
    for i in colors.size():
        var swatch := Button.new();swatch.custom_minimum_size=Vector2(28,26);swatch.tooltip_text="Colour "+str(i+1)+" · #"+colors[i].to_html(false)
        var style := StyleBoxFlat.new();style.bg_color=colors[i]
        swatch.toggle_mode=true;swatch.button_group=swatches;swatch.button_pressed=i==brush_color
        swatch.add_theme_stylebox_override("normal",style)
        var active: StyleBoxFlat=style.duplicate();active.border_color=Color("#76ddff");active.set_border_width_all(2)
        swatch.add_theme_stylebox_override("pressed",active)
        var hover: StyleBoxFlat=style.duplicate();hover.border_color=Color.WHITE;hover.set_border_width_all(1)
        swatch.add_theme_stylebox_override("hover",hover)
        palette_row.add_child(swatch);swatch.pressed.connect(func():brush_color=i;brush_mode.select(1);playing=false;refresh())
    refresh()
func refresh(controls := true) -> void:
    if name_id=="":return
    if controls:
        updating=true
        var entry: Dictionary=session.entries[name_id];var f: Dictionary=entry.frames[frame_index]
        frame_slider.max_value=entry.frames.size()-1;frame_slider.value=frame_index
        anchor_x.max_value=f.region[2];anchor_y.max_value=f.region[3];anchor_x.value=f.anchor[0];anchor_y.value=f.anchor[1]
        frame_label.text="Frame %d / %d · %s" % [frame_index,entry.frames.size()-1,group_title()]
        var native := session.native_frame(name_id,frame_index)
        metrics.text="%d × %d native pixels\n16-colour palette · thresholded alpha\nBrush #%s\nDraft edits: %s" % [native.image.get_width(),native.image.get_height(),session.palette(name_id)[brush_color].to_html(false),"unsaved" if session.dirty else "saved / original"]
        updating=false
    play_button.text="Pause" if playing else "Play";viewer.queue_redraw()
func group_title() -> String:
    if session.entries[name_id].frames.size()!=24:return "Battle views"
    if frame_index<4:return "Battle front" if frame_index<2 else "Battle back"
    return ["Walk down","Walk down-right","Walk right","Walk up-right","Walk rear"][(frame_index-4)/4]
func edit_anchor(_v: float) -> void:
    if updating or name_id=="":return
    playing=false
    if not session.anchor(name_id,frame_index,anchor_x.value,anchor_y.value):status.text=session.issue
    refresh()
func step_frame(delta: int) -> void:
    if name_id=="":return
    playing=false;frame_index=posmod(frame_index+delta,session.entries[name_id].frames.size());refresh()
func reset_frame() -> void:
    if name_id=="":return
    session.checkpoint();session.entries[name_id].frames[frame_index]=session.original[name_id].frames[frame_index].duplicate(true)
    session.pixels.erase(name_id+":"+str(frame_index));session.cache.clear();session.dirty=true;refresh()
func _process(dt: float) -> void:
    if not playing or name_id=="":return
    elapsed+=dt
    if elapsed>=1.0/speed.value:
        elapsed=fmod(elapsed,1.0/speed.value)
        var cycle: Array=session.cycle(name_id,frame_index)
        frame_index=cycle[(cycle.find(frame_index)+1)%cycle.size()];refresh()
func choose(action: String) -> void:
    mode=action;playing=false
    dialog.file_mode=FileDialog.FILE_MODE_SAVE_FILE if mode=="save" else FileDialog.FILE_MODE_OPEN_FILE
    dialog.title={"manifest":"Open measured frame manifest","draft":"Open workbench draft","save":"Save workbench draft","reference":"Open optional reference PNG (read only)"}[mode]
    dialog.filters=PackedStringArray(["*.png ; Reference image"]) if mode=="reference" else PackedStringArray(["*.json ; Measurements or workbench draft"])
    if mode=="save":
        DirAccess.make_dir_recursive_absolute("user://drafts");dialog.current_dir=ProjectSettings.globalize_path("user://drafts");dialog.current_file=name_id+"-draft.json"
    else:dialog.current_dir=Session.family_manifest().get_base_dir()
    dialog.popup_centered(Vector2i(900,600))
func chosen(path: String) -> void:
    if mode=="reference":
        var image := Image.load_from_file(path)
        if image==null or image.get_width()>256 or image.get_height()>256:status.text="Choose a single reference sprite PNG up to 256 × 256.";return
        reference_texture=ImageTexture.create_from_image(image);status.text="Read-only reference loaded; it is not saved into drafts or exports.";viewer.queue_redraw()
    elif mode=="manifest":load_source(path)
    elif mode=="draft":
        if session.load_draft(path):populate();status.text="Draft restored against verified original sources."
        else:status.text=session.issue
    else:
        status.text="Draft saved: "+path if session.save_draft(path) else session.issue
        refresh()
func export_current() -> void:
    if name_id=="":return
    playing=false;latest_export=session.export_atlas(name_id,ProjectSettings.globalize_path("user://exports"))
    status.text="Exported atlas + measurements + draft: "+latest_export if latest_export!="" else session.issue;refresh()
func _notification(what: int) -> void:
    if what==NOTIFICATION_WM_CLOSE_REQUEST:ask_discard(func():get_tree().quit())

func _input(event: InputEvent) -> void:
    if not event is InputEventKey or not event.pressed or event.echo:return
    if dialog==null or dialog.visible or discard.visible:return
    var focus := get_viewport().gui_get_focus_owner()
    if focus is LineEdit or focus is TextEdit:return
    var handled := true
    if event.ctrl_pressed and event.keycode==KEY_Z:
        if event.shift_pressed:session.redo()
        else:session.undo()
        refresh()
    elif event.ctrl_pressed and event.keycode==KEY_S:choose("save")
    elif event.keycode==KEY_SPACE:playing=not playing;refresh(false)
    elif event.keycode==KEY_LEFT:step_frame(-1)
    elif event.keycode==KEY_RIGHT:step_frame(1)
    else:handled=false
    if handled:get_viewport().set_input_as_handled()
