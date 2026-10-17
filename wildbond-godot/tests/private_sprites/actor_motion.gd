extends RefCounted
## Distance-driven gait: walls/idle cannot keep cycling feet. No adventure state.
var face := Vector2i.DOWN
var distance := 0.0
var moving := false
var running := false
var direction8 := 0 # down, down-right, right, up-right, up, up-left, left, down-left

func advance(intent: Vector2, displacement: Vector3, sprint: bool) -> void:
	if not intent.is_zero_approx():
		var angle := atan2(intent.x, intent.y)
		if absf(angle_difference(direction8 * PI / 4, angle)) > PI / 8 + 0.08:
			direction8 = posmod(roundi(angle / (PI / 4)), 8)
		# Preserve the previous axis on exact diagonals to prevent alternating poses.
		if absf(intent.x) > absf(intent.y): face = Vector2i(int(signf(intent.x)), 0)
		elif absf(intent.y) > absf(intent.x): face = Vector2i(0, int(signf(intent.y)))
		elif face.x == 0: face = Vector2i(0, int(signf(intent.y)))
		else: face = Vector2i(int(signf(intent.x)), 0)
	moving = displacement.length_squared() > 0.000001
	running = sprint and moving
	if moving: distance += displacement.length()

func phase() -> int:
	return int(distance / (0.22 if running else 0.29)) % 4 if moving else 1

func trainer_frame() -> int:
	var row := 0 if face.y > 0 else (1 if face.y < 0 else 2)
	return [[3, 0, 4, 0], [5, 1, 6, 1], [7, 2, 8, 2]][row][phase()]

static func idle_frame(seconds: float) -> int:
	var t := fposmod(seconds, 3.8)
	if t >= 2.5 and t < 2.64: return 1 # A quick blink, rather than half a second with closed eyes.
	return 2 if t >= 0.8 and t < 1.8 else 0
