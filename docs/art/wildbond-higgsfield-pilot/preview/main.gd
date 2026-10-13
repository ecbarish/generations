extends Node2D
# Isolated texture review. Loads preserved PNGs outside the game; no game saves or code.
var sheets: Dictionary = {}
var audit: Array = []
var elapsed := 0.0
var cutoff := true
var evolution_view := false
var portraits: Dictionary = {}
var tide_view := false
var tide_texture: ImageTexture
var tide_region: Rect2
func _ready() -> void:
 var base := ProjectSettings.globalize_path("res://../")
 audit = JSON.parse_string(FileAccess.get_file_as_string(base + "audit.json"))
 for entry in audit:
  var im := Image.load_from_file(base + "originals/" + str(entry.file))
  assert(im != null and im.get_size() == Vector2i(2048, 2048))
  sheets[entry.file] = ImageTexture.create_from_image(im)
 var shader := Shader.new()
 shader.code = "shader_type canvas_item; uniform bool cut = true; void fragment(){if(cut){COLOR.a=step(0.5,COLOR.a);}}"
 var mat := ShaderMaterial.new()
 mat.shader = shader
 material = mat
 var count := 0
 for entry in audit:
  for cell in entry.cells:
   var r: Array = cell.region
   assert(r[2] > 0 and r[3] > 0 and r[0] + r[2] <= 2048 and r[1] + r[3] <= 2048)
   count += 1
 assert(count == 21)
 for name in ["blazefang", "thornback"]:
  var portrait := Image.load_from_file(base + "portraits/" + name + ".png")
  assert(portrait != null and portrait.get_size() == Vector2i(2048, 2048))
  portraits[name] = ImageTexture.create_from_image(portrait)
 evolution_view = "--evolutions" in OS.get_cmdline_user_args()
 tide_view = "--tidewyrm" in OS.get_cmdline_user_args()
 var tide := Image.load_from_file(base + "tidewyrm/current-sail-reference.png")
 assert(tide != null)
 tide_texture = ImageTexture.create_from_image(tide)
 var review: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(base + "tidewyrm/review.json"))
 var bounds: Array = review.items[-1].bounds
 tide_region = Rect2(bounds[0], bounds[1], bounds[2], bounds[3])
 print("PILOT PASS: 4 original PNGs imported; 21 bounded object regions; no game files or saves touched")
 queue_redraw()
func region(file: String, index: int) -> Rect2:
 for entry in audit:
  if entry.file == file:
   var r: Array = entry.cells[index].region
   return Rect2(r[0], r[1], r[2], r[3])
 return Rect2()
func sprite(file: String, index: int, foot: Vector2, size: float) -> void:
 var r := region(file,index)
 var h := size * r.size.y / r.size.x
 draw_texture_rect_region(sheets[file],Rect2(foot-Vector2(size/2,h),Vector2(size,h)),r)
func text(at: Vector2, s: String, size: int = 13) -> void:
 draw_string(ThemeDB.fallback_font,at,s,HORIZONTAL_ALIGNMENT_LEFT,-1,size,Color("1e1a22"))
func _draw() -> void:
 # Pure colour plates and a measured 16 px tile scene; not a rebuild of Larkhaven.
 draw_rect(Rect2(0,0,768,432),Color("f4eddc"))
 text(Vector2(16,23),"WILDBOND / HIGGSFIELD ASSET PILOT",18)
 text(Vector2(16,44),"Space: alpha cutoff. E: evolution portraits. Poses are NOT a walk animation.")
 if tide_view:
  text(Vector2(24,78),"RIPPLET TO TIDEWYRM / CURRENT SAIL",20)
  draw_rect(Rect2(16,92,736,300),Color("6aa862"))
  sprite("ripplet.png",0,Vector2(115,300),112)
  var height := 380.0 * tide_region.size.y / tide_region.size.x
  draw_texture_rect_region(tide_texture,Rect2(310,300-height,380,height),tide_region)
  text(Vector2(36,326),"Young form")
  text(Vector2(326,326),"Working evolution direction")
  sprite("ripplet.png",0,Vector2(150,380),26)
  draw_texture_rect_region(tide_texture,Rect2(230,380-48*tide_region.size.y/tide_region.size.x,48,48*tide_region.size.y/tide_region.size.x),tide_region)
  text(Vector2(310,379),"Small silhouettes: 26 / 48 px wide")
  text(Vector2(16,417),"Proposed art only. Rear sail direction and marking layout need reconciliation.")
  return
 if evolution_view:
  for i in range(2):
   var x := 16 + i * 376
   draw_rect(Rect2(x,60,360,336),Color("6aa862"))
   var name := "blazefang" if i == 0 else "thornback"
   text(Vector2(x+10,82),name.capitalize(),18)
   draw_texture_rect(portraits[name],Rect2(x+25,86,310,310),false)
   sprite("cindercub.png" if i == 0 else "mosshog.png",0,Vector2(x+40,390),40)
  text(Vector2(16,421),"Family references, not final sprites. Glow halos and palette still need cleanup.")
  return
 var names := ["cindercub.png","ripplet.png","mosshog.png"]
 for i in range(3):
  var x := 26 + i * 244
  draw_rect(Rect2(x,60,228,158),Color("8cc0d4") if i%2 else Color("6aa862"))
  text(Vector2(x+8,77),str(names[i]).trim_suffix(".png").capitalize())
  sprite(names[i],int(elapsed/2)%3,Vector2(x+114,198),112)
 draw_rect(Rect2(16,244,736,172),Color("6aa862"))
 for x in range(16,752,16):
  for y in range(244,416,16):
   draw_rect(Rect2(x,y,16,16),Color("5c9a5a"),false,1)
 draw_rect(Rect2(16,344,736,32),Color("ccad7c"))
 text(Vector2(26,264),"AT GAME SCALE: 16 px tiles / a person approximately 24 px tall")
 # Neutral scale gauge, intentionally not an imported or copied character.
 draw_rect(Rect2(88,316,8,7),Color("e6dcc6"))
 draw_rect(Rect2(86,323,12,10),Color("435a78"))
 draw_rect(Rect2(88,333,4,7),Color("4a3426"))
 draw_rect(Rect2(94,333,4,7),Color("4a3426"))
 sprite("cindercub.png",0,Vector2(130,340),24)
 sprite("ripplet.png",0,Vector2(172,340),26)
 sprite("mosshog.png",0,Vector2(216,340),30)
 sprite("larkhaven-props.png",1,Vector2(300,340),32)
 sprite("larkhaven-props.png",0,Vector2(350,340),24)
 sprite("larkhaven-props.png",6,Vector2(398,340),16)
 sprite("larkhaven-props.png",3,Vector2(470,340),32)
 sprite("larkhaven-props.png",3,Vector2(502,340),32)
 sprite("larkhaven-props.png",5,Vector2(552,340),32)
 text(Vector2(26,399),"Turns change every 2 seconds. Texture import works; walk frames and palette still need production work.")
func _process(delta: float) -> void:
 elapsed += delta
 queue_redraw()
func _unhandled_input(event: InputEvent) -> void:
 if event is InputEventKey and event.pressed and event.keycode == KEY_E:
  evolution_view = not evolution_view
 if event is InputEventKey and event.pressed and event.keycode == KEY_SPACE:
  cutoff = not cutoff
  (material as ShaderMaterial).set_shader_parameter("cut",cutoff)
