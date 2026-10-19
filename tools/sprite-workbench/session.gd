extends RefCounted
## Source-preserving measurements and native edits; no player-save dependencies.
const GREEN := ["20231d","353d25","4d592b","657b31","839c3d","adc34f","d3dc73","70683d","a99359","d6c28c","f5e6b7","fff4d3","a66f63","d89b88","464039","e7d68b"]
const WATER := ["102238","104574","176eab","188fc4","2db6d4","77d3e6","b9ebf2","f4fbff","a4935a","ddcb8b","fff0b7","ab702d","edb943","fffdf3","70323f","da8075"]
const FIRE := ["201e27","352a30","503834","704636","9b5336","c26735","e98a39","ffb547","ffe17e","92715b","c79b70","e7c79a","ffebc6","fff7dc","843433","da7861"]
var entries: Dictionary = {}
var original: Dictionary = {}
var images: Dictionary = {}
var source_path := ""
var manifest_hash := ""
var pixels: Dictionary = {}
var issue := ""
var undo_stack: Array = []
var redo_stack: Array = []
var cache: Dictionary = {}
var dirty := false
static func repo_root() -> String:
    return ProjectSettings.globalize_path("res://").trim_suffix("/").get_base_dir().get_base_dir()
static func family_manifest() -> String:
    return repo_root().path_join("wildbond-godot/tests/mosshog_family/frames.json")
static func starter_manifest() -> String:
    return repo_root().path_join("wildbond-godot/tests/starter_sprites/frames.json")
static func number(v: Variant) -> bool:
    return (v is int or v is float) and is_finite(float(v))
static func safe_id(s: String) -> bool:
    var re := RegEx.new();re.compile("^[A-Za-z_][A-Za-z0-9_-]{0,63}$")
    return re.search(s)!=null
func fail(message: String) -> bool:
    issue=message;return false
func read_json(path: String) -> Variant:
    var f := FileAccess.open(path,FileAccess.READ)
    if f==null or f.get_length()>2*1024*1024:return null
    return JSON.parse_string(f.get_as_text())
func valid_geometry(f: Variant,size: Vector2i) -> bool:
    if not f is Dictionary or not f.get("region") is Array or f.region.size()!=4 or not f.get("anchor") is Array or f.anchor.size()!=2:return false
    # Bound raw JSON numbers before any narrowing to 32-bit vectors.
    for v in f.region:
        if not number(v) or float(v)!=floorf(float(v)) or v<0 or v>4096:return false
    if f.region[2]<=0 or f.region[3]<=0 or f.region[0]+f.region[2]>size.x or f.region[1]+f.region[3]>size.y:return false
    for v in f.anchor:
        if not number(v):return false
    return f.anchor[0]>=0 and f.anchor[1]>=0 and f.anchor[0]<=f.region[2] and f.anchor[1]<=f.region[3]
func valid_frame(f: Variant,size: Vector2i) -> bool:
    if not valid_geometry(f,size):return false
    var step: Variant=f.get("sample_step",1.0)
    return number(step) and step>=.25 and step<=128 and f.region[2]/step<=512 and f.region[3]/step<=512
func load_manifest(path: String) -> bool:
    var data: Variant=read_json(path)
    if not data is Dictionary or data.is_empty() or data.size()>64:return fail("Choose a measured frames.json containing 1–64 creatures.")
    var loaded := {}
    var total_pixels := 0
    var candidate: Dictionary=data.duplicate(true)
    for name in candidate:
        if not name is String or not safe_id(name):return fail("Invalid creature identifier.")
        var e: Variant=candidate[name]
        if not e is Dictionary or not e.get("file") is String or not e.get("sha256") is String or not e.get("frames") is Array or e.frames.is_empty() or e.frames.size()>256:return fail("Incomplete frame entry: "+name)
        var rel: String=e.file
        if rel.is_absolute_path() or ".." in rel.split("/") or "\\" in rel or rel.get_extension().to_lower()!="png":return fail("Source PNG paths must stay beside their measurement file.")
        var file := path.get_base_dir().path_join(rel)
        if FileAccess.get_sha256(file)!=e.sha256:return fail("Source hash changed: "+name+". Remeasure deliberately before importing.")
        var image := Image.load_from_file(file)
        if image==null or image.get_width()>4096 or image.get_height()>4096:return fail("Source image is missing or too large.")
        total_pixels+=image.get_width()*image.get_height()
        if total_pixels>32*1024*1024:return fail("Manifest exceeds the image memory budget.")
        image.convert(Image.FORMAT_RGBA8)
        if not e.get("size") is Array or e["size"].size()!=2 or e["size"][0]!=image.get_width() or e["size"][1]!=image.get_height():return fail("Source dimensions changed: "+name)
        for i in e.frames.size():
            var frame: Variant=e.frames[i]
            if not frame is Dictionary:return fail("Invalid frame: "+name)
            if not frame.has("sample_step"):
                var ref: Variant=e.frames[0 if i<4 else mini(5,e.frames.size()-1)]
                if not valid_geometry(ref,image.get_size()):return fail("Invalid legacy sampling reference: "+name)
                var ink: Variant=ref.get("ink",[0,0,ref.region[2],ref.region[3]])
                if not ink is Array or ink.size()!=4:return fail("Invalid legacy ink bounds: "+name)
                for v in ink:
                    if not number(v) or absf(float(v))>4096:return fail("Invalid legacy ink bounds: "+name)
                if ink[2]<=0 or ink[3]<=0:return fail("Invalid legacy ink size: "+name)
                var h: float=float(ink[3])
                frame.sample_step=maxf(h/(48.0 if i<2 else (60.0 if i<4 else 32.0)),float(ref.region[2])/80.0)
            if not valid_frame(frame,image.get_size()):return fail("Invalid bounds, anchor or sampling step: "+name+" frame "+str(i))
        if e.has("palette"):
            if not e.palette is Array or e.palette.size()!=16:return fail("Palette must contain sixteen colours.")
            for hex in e.palette:
                if not hex is String or not Color.html_is_valid(hex) or Color(hex).a!=1.0:return fail("Palette colours must be opaque; erase pixels for transparency.")
        loaded[name]=image
    entries=candidate;original=candidate.duplicate(true);images=loaded;source_path=path;manifest_hash=FileAccess.get_sha256(path)
    pixels.clear();cache.clear();undo_stack.clear();redo_stack.clear();dirty=false;issue=""
    return true
func palette(name: String) -> PackedColorArray:
    var colors: Array=entries[name].get("palette",WATER if name=="ripplet" else (FIRE if name=="cindercub" else GREEN))
    return PackedColorArray(colors.map(func(hex):return Color(hex)))
func checkpoint() -> void:
    undo_stack.append({"entries":entries.duplicate(true),"pixels":pixels.duplicate(true)})
    if undo_stack.size()>100:undo_stack.pop_front()
    redo_stack.clear()
func restore(state: Dictionary) -> void:
    entries=state.entries.duplicate(true);pixels=state.pixels.duplicate(true);cache.clear();dirty=true
func undo() -> bool:
    if undo_stack.is_empty():return false
    redo_stack.append({"entries":entries.duplicate(true),"pixels":pixels.duplicate(true)})
    restore(undo_stack.pop_back());return true
func redo() -> bool:
    if redo_stack.is_empty():return false
    undo_stack.append({"entries":entries.duplicate(true),"pixels":pixels.duplicate(true)})
    restore(redo_stack.pop_back());return true
func anchor(name: String,index: int,x: float,y: float) -> bool:
    if not entries.has(name) or index<0 or index>=entries[name].frames.size() or not is_finite(x) or not is_finite(y):return fail("Invalid anchor.")
    var f: Dictionary=entries[name].frames[index]
    if x<0 or y<0 or x>f.region[2] or y>f.region[3]:return fail("Anchor must remain inside the measured frame.")
    checkpoint();f.anchor=[x,y];cache.clear();dirty=true;return true
func cycle(name: String,index: int) -> Array:
    var n: int=entries[name].frames.size()
    if n!=24:return [index]
    var first: int=(index/2)*2 if index<4 else 4+((index-4)/4)*4
    return range(first,mini(first+(2 if index<4 else 4),n))
func apply_cycle_offset(name: String,index: int) -> void:
    var current: Dictionary=entries[name].frames[index]
    var baseline: Dictionary=original[name].frames[index]
    var delta := (Vector2(current.anchor[0],current.anchor[1])-Vector2(baseline.anchor[0],baseline.anchor[1]))/float(current.sample_step)
    checkpoint()
    for i in cycle(name,index):
        var f: Dictionary=entries[name].frames[i];var base: Dictionary=original[name].frames[i]
        f.anchor=[clampf(float(base.anchor[0])+delta.x*f.sample_step,0,f.region[2]),clampf(float(base.anchor[1])+delta.y*f.sample_step,0,f.region[3])]
    cache.clear();dirty=true
func paint(name: String,index: int,point: Vector2i,color: int,record := true) -> void:
    if color < -1 or color>15:return
    if record:checkpoint()
    var key := name+":"+str(index)
    if not pixels.has(key):pixels[key]={}
    pixels[key]["%d,%d" % [point.x,point.y]]=color
    cache.erase(key);dirty=true
func native_frame(name: String,index: int) -> Dictionary:
    var key := name+":"+str(index)
    if cache.has(key):return cache[key]
    var f: Dictionary=entries[name].frames[index]
    var a := Vector2(f.anchor[0],f.anchor[1]);var step: float=f.sample_step
    var lo := Vector2i(floori(-a.x/step),floori(-a.y/step))
    var hi := Vector2i(ceili((f.region[2]-a.x)/step),ceili((f.region[3]-a.y)/step))
    var image := Image.create(hi.x-lo.x,hi.y-lo.y,false,Image.FORMAT_RGBA8)
    var pal := palette(name);var source: Image=images[name]
    var overrides: Dictionary=pixels.get(key,{})
    for y in image.get_height():
        for x in image.get_width():
            var point := Vector2i(x,y)+lo
            var id := "%d,%d" % [point.x,point.y]
            if overrides.has(id):
                if overrides[id]>=0:image.set_pixel(x,y,pal[overrides[id]])
                continue
            var sample := a+(Vector2(point)+Vector2(.5,.5))*step
            if sample.x<0 or sample.y<0 or sample.x>=f.region[2] or sample.y>=f.region[3]:continue
            var c := source.get_pixel(f.region[0]+floori(sample.x),f.region[1]+floori(sample.y))
            if c.a<.5:continue
            var nearest := 100.0;var selected := pal[0]
            for color in pal:
                var delta := Vector3(c.r-color.r,c.g-color.g,c.b-color.b)
                if delta.length_squared()<nearest:nearest=delta.length_squared();selected=color
            image.set_pixel(x,y,selected)
    var result := {"image":image,"texture":ImageTexture.create_from_image(image),"anchor":-lo,"lo":lo}
    cache[key]=result;return result
static func path_identity(path: String) -> String:
    var absolute := ProjectSettings.globalize_path(path).simplify_path()
    if not absolute.is_absolute_path():absolute=DirAccess.open(".").get_current_dir().path_join(absolute).simplify_path()
    return absolute.to_lower() if OS.get_name()=="Windows" else absolute
func sources_unchanged() -> bool:
    if source_path=="":return fail("Load measurements first.")
    if FileAccess.get_sha256(source_path)!=manifest_hash:return fail("Source measurements changed; reload before saving or exporting.")
    for name in entries:
        var file: String=source_path.get_base_dir().path_join(entries[name].file)
        if FileAccess.get_sha256(file)!=entries[name].sha256:return fail("Original source changed; reload before saving or exporting.")
    return true
func safe_draft_destination(path: String) -> bool:
    var protected := [path_identity(source_path)]
    for name in entries:protected.append(path_identity(source_path.get_base_dir().path_join(entries[name].file)))
    # Every path written by this transaction must be separate from all inputs.
    for suffix in ["",".tmp",".bak"]:
        if path_identity(path+suffix) in protected:return fail("Save a separate draft; source measurements and PNGs are read-only.")
    return true
func save_draft(path: String) -> bool:
    if not sources_unchanged() or not safe_draft_destination(path):return false
    if path.get_extension().to_lower()!="json":return fail("Drafts must be JSON files.")
    if DirAccess.make_dir_recursive_absolute(path.get_base_dir())!=OK:return fail("Cannot create draft folder.")
    var file := FileAccess.open(path+".tmp",FileAccess.WRITE)
    if file==null:return fail("Cannot save draft.")
    var reference := source_path.trim_prefix(repo_root()+"/") if source_path.begins_with(repo_root()+"/") else source_path
    file.store_string(JSON.stringify({"schema":1,"source_manifest":reference,"manifest_sha256":manifest_hash,"entries":entries,"pixels":pixels},"  "));file.close()
    if FileAccess.file_exists(path) and DirAccess.copy_absolute(path,path+".bak")!=OK:return fail("Cannot preserve previous draft.")
    if DirAccess.rename_absolute(path+".tmp",path)!=OK:return fail("Cannot finish draft save.")
    dirty=false;issue="";return true
func load_draft(path: String) -> bool:
    var data: Variant=read_json(path)
    if not data is Dictionary or data.get("schema")!=1 or not data.get("source_manifest") is String or not data.get("entries") is Dictionary or not data.get("pixels") is Dictionary:return fail("Invalid or unsupported workbench draft.")
    var test = get_script().new()
    var source: String=data.source_manifest
    if not source.is_absolute_path():
        if ".." in source.split("/") or "\\" in source:return fail("Invalid relative source manifest path.")
        source=repo_root().path_join(source)
    if not test.load_manifest(source):return fail(test.issue)
    if data.get("manifest_sha256")!=test.manifest_hash:return fail("Draft measurements no longer match the original manifest.")
    var draft_names: Array=data.entries.keys();draft_names.sort()
    var source_names: Array=test.entries.keys();source_names.sort()
    if draft_names!=source_names:return fail("Draft creature list differs from source.")
    for name in data.entries:
        var e: Variant=data.entries[name];var base: Dictionary=test.entries[name]
        if not e is Dictionary or e.get("file")!=base.file or e.get("sha256")!=base.sha256 or not e.get("frames") is Array or e.frames.size()!=base.frames.size():return fail("Draft source identity mismatch.")
        # Drafts change only anchors and native pixel overrides.
        var baseline: Dictionary=base.duplicate(true)
        for i in e.frames.size():
            if not valid_frame(e.frames[i],test.images[name].get_size()):return fail("Invalid draft measurements.")
            baseline.frames[i].anchor=e.frames[i].anchor
        if baseline!=e:return fail("Draft attempts to change source layout or palette.")
    for key in data.pixels:
        var parts: PackedStringArray=str(key).split(":")
        if parts.size()!=2 or not test.entries.has(parts[0]) or not parts[1].is_valid_int():return fail("Invalid draft pixel frame.")
        var index := int(parts[1])
        if parts[1]!=str(index) or index<0 or index>=test.entries[parts[0]].frames.size() or not data.pixels[key] is Dictionary or data.pixels[key].size()>512*512:return fail("Invalid draft pixel edits.")
        for pixel in data.pixels[key]:
            var xy: PackedStringArray=str(pixel).split(",");var color: Variant=data.pixels[key][pixel]
            if xy.size()!=2 or not xy[0].is_valid_int() or not xy[1].is_valid_int() or xy[0]!=str(int(xy[0])) or xy[1]!=str(int(xy[1])) or absi(int(xy[0]))>512 or absi(int(xy[1]))>512 or not number(color) or color!=floorf(color) or color < -1 or color>15:return fail("Invalid draft pixel.")
    entries=test.entries.duplicate(true);original=test.original;images=test.images;source_path=test.source_path;manifest_hash=test.manifest_hash
    for name in entries:
        for i in entries[name].frames.size():entries[name].frames[i].anchor=data.entries[name].frames[i].anchor.duplicate()
    pixels.clear()
    for key in data.pixels:
        pixels[key]={}
        for point in data.pixels[key]:pixels[key][point]=int(data.pixels[key][point])
    cache.clear();undo_stack.clear();redo_stack.clear();dirty=false;issue="";return true
func export_atlas(name: String,parent: String) -> String:
    if not entries.has(name):issue="Load a creature first.";return ""
    if not sources_unchanged():return ""
    var native: Array=[];var before := Vector2i.ZERO;var after := Vector2i.ZERO
    for i in entries[name].frames.size():
        var f := native_frame(name,i);native.append(f)
        before=before.max(f.anchor);after=after.max(f.image.get_size()-f.anchor)
    var cell := before+after+Vector2i(4,4);var root := before+Vector2i(2,2)
    if cell.x>512 or cell.y>512:issue="Padded native cell exceeds 512 pixels; reduce the frame size or sampling resolution.";return ""
    var columns := mini(4,native.size());var rows := ceili(float(native.size())/columns)
    if cell.x*columns>4096 or cell.y*rows>4096:issue="Atlas exceeds 4096 pixels; split this manifest into smaller sets.";return ""
    var atlas := Image.create(cell.x*columns,cell.y*rows,false,Image.FORMAT_RGBA8)
    var frames: Array=[]
    for i in native.size():
        var f: Dictionary=native[i];var origin := Vector2i(i%columns,i/columns)*cell
        atlas.blit_rect(f.image,Rect2i(Vector2i.ZERO,f.image.get_size()),origin+root-f.anchor)
        frames.append({"region":[origin.x,origin.y,cell.x,cell.y],"anchor":[root.x,root.y],"ink":[2,2,cell.x-4,cell.y-4],"sample_step":1.0})
    var folder := parent.path_join(name+"-"+str(Time.get_unix_time_from_system()).replace(".","-")+"-"+str(Time.get_ticks_usec()))
    if DirAccess.dir_exists_absolute(folder) or DirAccess.make_dir_recursive_absolute(folder)!=OK:issue="Cannot create a new export folder.";return ""
    var png := folder.path_join("atlas.png")
    if atlas.save_png(png)!=OK:issue="Cannot write atlas.";return ""
    var entry: Dictionary=entries[name].duplicate(true)
    entry.file="atlas.png";entry.sha256=FileAccess.get_sha256(png);entry.size=[atlas.get_width(),atlas.get_height()];entry.frames=frames
    entry.palette=Array(palette(name)).map(func(c):return c.to_html(false))
    entry.source_sha256=entries[name].sha256
    var file := FileAccess.open(folder.path_join("frames.json"),FileAccess.WRITE)
    if file==null:issue="Cannot write atlas metadata.";return ""
    file.store_string(JSON.stringify({name:entry},"  "));file.close()
    if not save_draft(folder.path_join("edit-session.json")):return ""
    issue="";return folder
