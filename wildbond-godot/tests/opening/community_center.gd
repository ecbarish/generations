extends RefCounted
## Local room coordinates. The exterior door and saved outdoor return do not move.
const ORIGIN := 60.0
const ENTRY := Vector3(60,0,5.3)
const BOARD := Vector3(53.2,0,-4.7)
const STORAGE := Vector3(66.7,0,-2.7)
const SOLIDS := [
	Rect2(-4.7,-5.6,9.4,2.5), # Reception and staff area.
	Rect2(-8.1,-4.1,2.6,2.2), # Rest bed.
	Rect2(-8.0,.1,2.8,1.0), # Lounge bench.
	Rect2(4.65,-.5,2.7,1.7), # Shared table.
	Rect2(3.8,.05,.8,.8),Rect2(7.45,.05,.8,.8), # Table stools.
	Rect2(5.0,3.0,2.8,1.0), # Conversation sofa.
	Rect2(5.8,-4.9,1.8,1.4) # Partner-storage terminal.
]
static func blocked(at: Vector3) -> bool:
	var local := Vector2(at.x-ORIGIN,at.z)
	if absf(local.x)>8.65 or local.y< -5.45 or local.y>6.05:return true
	for solid in SOLIDS:
		if solid.grow(.18).has_point(local):return true
	return false

static func build(scene: Node3D, origin: float) -> void:
	var cream := Color("e7dfc4")
	var red := Color("bd5b54")
	var wood := Color("92704f")
	var green := Color("819552")
	scene._solid(Vector3(origin,-.12,.25),Vector3(18,.22,12.5),cream)
	for x in range(-9,10):scene._solid(Vector3(origin+x,.005,.25),Vector3(.025,.01,12.5),Color("c8c9bb"))
	for z in range(-6,7):scene._solid(Vector3(origin,.006,z),Vector3(18,.01,.025),Color("c8c9bb"))
	scene._solid(Vector3(origin,1.4,-6),Vector3(18,2.8,.2),cream)
	scene._solid(Vector3(origin,.7,-5.86),Vector3(18,.35,.08),red)
	for side in [-1,1]:
		scene._solid(Vector3(origin+side*9,.35,.25),Vector3(.15,.7,12.5),Color("cec9b5"))
	scene._solid(Vector3(origin,.025,5.55),Vector3(2.4,.06,1.15),red)
	# An open central aisle runs from the entrance to the healing desk.
	scene._solid(Vector3(origin,.015,1),Vector3(3.0,.025,8.3),Color("c5c6b7"))
	scene._solid(Vector3(origin,.4,-3.7),Vector3(9,.8,1.0),red)
	scene._solid(Vector3(origin,.86,-3.7),Vector3(9.25,.12,1.15),cream)
	scene._text3("HEALING INN",Vector3(origin,2.1,-5.8),64,red)
	scene._solid(Vector3(origin,1.35,-5.2),Vector3(3.1,1.1,.65),scene.INK)
	for i in 6:
		var light := SphereMesh.new();light.radius=.17;light.height=.34
		scene.healing_lights.append(scene._mesh(light,Vector3(origin-1+float(i%3),1.15+float(i/3)*.45,-4.82),scene._material(Color("e78888"))))
	# Rest wing: a bed, waiting bench and local notices on the back wall.
	scene._solid(Vector3(origin-6.8,.29,-3.0),Vector3(2.6,.58,1.8),wood)
	scene._solid(Vector3(origin-6.8,.64,-3.0),Vector3(2.55,.18,1.75),Color("b4c9b6"))
	scene._solid(Vector3(origin-7.65,.78,-3.0),Vector3(.55,.16,1.55),cream)
	bench(scene,Vector3(origin-6.6,0,.6),green)
	scene._solid(Vector3(origin-6.8,1.5,-5.8),Vector3(3.0,1.6,.14),wood)
	for i in 5:scene._solid(Vector3(origin-7.7+float(i%3)*.8,1.2+float(i/3)*.6,-5.7),Vector3(.55,.45,.03),cream)
	scene._text3("LOCAL NOTICES",Vector3(origin-6.8,2.55,-5.65),52,cream)
	# A low shared table and seats leave the people and central aisle in view.
	scene._solid(Vector3(origin+6,.32,.35),Vector3(1.6,.64,1.0),wood)
	scene._solid(Vector3(origin+6,.69,.35),Vector3(2.7,.14,1.7),wood.lightened(.15))
	for side in [-1,1]:scene._solid(Vector3(origin+6+side*1.85,.25,.45),Vector3(.8,.5,.8),green)
	for x in [5.4,6.4]:
		scene._solid(Vector3(origin+x,.81,.2),Vector3(.23,.2,.23),cream)
	scene._solid(Vector3(origin+6,.79,.65),Vector3(.75,.025,.4),Color("b4c9b6"))
	bench(scene,Vector3(origin+6.4,0,3.5),green)
	# Existing storage is opened here; this adds no new storage rules or save data.
	scene._solid(Vector3(origin+6.7,.4,-4.2),Vector3(1.8,.8,1.4),wood)
	scene._solid(Vector3(origin+6.7,1.15,-4.4),Vector3(1.25,.75,.18),scene.INK)
	scene._solid(Vector3(origin+6.7,1.17,-4.28),Vector3(1.05,.55,.04),Color("7cb5bc"))
	scene._text3("PARTNER STORAGE",Vector3(origin+6.7,2.1,-5.7),48,cream)
	for x in [-8.1,8.1]:scene._prop("plant_bush",Vector3(origin+x,0,5.3),.65)

static func bench(scene: Node3D, at: Vector3, color: Color) -> void:
	scene._solid(at+Vector3(0,.24,0),Vector3(2.8,.48,1),color)
	scene._solid(at+Vector3(0,.72,-.4),Vector3(2.8,.65,.18),color)
