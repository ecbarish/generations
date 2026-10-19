extends Control
var app
var origin := Vector2.ZERO
var draw_zoom := 5.0
var frame: Dictionary = {}
var dragging := false
func _ready() -> void:
    texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
    mouse_default_cursor_shape=Control.CURSOR_CROSS
func pose(f: Dictionary,tint: Color,root: Vector2,zoom: float) -> void:
    draw_texture_rect(f.texture,Rect2(root-Vector2(f.anchor)*zoom,Vector2(f.image.get_size())*zoom),false,tint)
func _draw() -> void:
    for y in range(0,int(size.y),16):
        for x in range(0,int(size.x),16):
            draw_rect(Rect2(x,y,16,16),Color("#172334") if (x/16+y/16)%2==0 else Color("#1d2c3e"))
    if app==null or app.name_id=="":return
    var entry: Dictionary=app.session.entries[app.name_id]
    frame=app.session.native_frame(app.name_id,app.frame_index)
    var native_size := Vector2(frame.image.get_size())
    draw_zoom=maxf(1,minf(app.zoom.value,floorf(minf((size.x-50)/native_size.x,(size.y-130)/native_size.y))))
    var root := Vector2(size.x*.5,size.y*.62)
    origin=root-Vector2(frame.anchor)*draw_zoom
    if app.source_view.button_pressed:
        var f: Dictionary=entry.frames[app.frame_index]
        var r := Rect2(f.region[0],f.region[1],f.region[2],f.region[3])
        var scale_factor := minf((size.x-60)/r.size.x,(size.y-90)/r.size.y)
        draw_texture_rect_region(app.source_texture,Rect2((size-r.size*scale_factor)*.5,r.size*scale_factor),r)
    else:
        if app.onion.button_pressed:
            var cycle: Array=app.session.cycle(app.name_id,app.frame_index)
            var at: int=cycle.find(app.frame_index)
            if cycle.size()>1:
                pose(app.session.native_frame(app.name_id,cycle[posmod(at-1,cycle.size())]),Color(1,.25,.65,.28),root,draw_zoom)
                pose(app.session.native_frame(app.name_id,cycle[(at+1)%cycle.size()]),Color(.15,.9,1,.28),root,draw_zoom)
        pose(frame,Color.WHITE,root,draw_zoom)
        if app.grid.button_pressed and draw_zoom>=4:
            for x in range(int(native_size.x)+1):draw_line(origin+Vector2(x*draw_zoom,0),origin+Vector2(x*draw_zoom,native_size.y*draw_zoom),Color(1,1,1,.12))
            for y in range(int(native_size.y)+1):draw_line(origin+Vector2(0,y*draw_zoom),origin+Vector2(native_size.x*draw_zoom,y*draw_zoom),Color(1,1,1,.12))
        draw_line(Vector2(0,root.y),Vector2(size.x,root.y),Color("#d8b56d"),1)
        draw_line(root-Vector2(9,0),root+Vector2(9,0),Color("#74d5ff"),2)
        draw_line(root-Vector2(0,9),root+Vector2(0,9),Color("#74d5ff"),2)
    var font := ThemeDB.fallback_font
    draw_string(font,Vector2(16,26),"Original source" if app.source_view.button_pressed else "Native pixels · %d× · cyan root / gold ground" % int(draw_zoom),HORIZONTAL_ALIGNMENT_LEFT,-1,16,Color("#d7e5ef"))
    draw_string(font,Vector2(16,size.y-83),"Actual size · 1×",HORIZONTAL_ALIGNMENT_LEFT,-1,14,Color("#a5bfd4"))
    draw_texture(frame.texture,Vector2(16,size.y-70))
    if app.reference_texture!=null:
        var ref_x: float=32+native_size.x
        draw_string(font,Vector2(ref_x,size.y-83),"Reference · 1×",HORIZONTAL_ALIGNMENT_LEFT,-1,14,Color("#a5bfd4"))
        var image_height: float=app.reference_texture.get_height()
        draw_texture(app.reference_texture,Vector2(ref_x,size.y-12-image_height))
func dab(position: Vector2) -> void:
    if app.source_view.button_pressed or frame.is_empty() or app.brush_mode.selected==0:return
    var local := Vector2i(floori((position.x-origin.x)/draw_zoom),floori((position.y-origin.y)/draw_zoom))
    if not Rect2i(Vector2i.ZERO,frame.image.get_size()).has_point(local):return
    app.session.paint(app.name_id,app.frame_index,local+frame.lo,-1 if app.brush_mode.selected==2 else app.brush_color,false)
    app.refresh()
func _gui_input(event: InputEvent) -> void:
    if app==null:return
    if event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT:
        dragging=event.pressed and app.brush_mode.selected!=0 and not app.source_view.button_pressed
        if dragging:
            app.playing=false;app.session.checkpoint();dab(event.position)
    elif event is InputEventMouseMotion and dragging:dab(event.position)
