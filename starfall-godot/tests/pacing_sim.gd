extends SceneTree
## SF2.17 pacing measurement (not part of the test suite). A scripted "normal player" over several 150-second days:
## the world runs at its normal speed; each thing the player does costs the real time it takes (walking at their speed
## along the route, plus the action itself). Run: Godot --headless --path starfall-godot -s tests/pacing_sim.gd
## Policies: "board" (pins jobs, answers stories, builds; no hand jobs), "hand" (does every hand job, hires as soon as
## asked), "hand_nohire" (does every hand job, never hires).
const DT := 0.05
const IDLE_AT := Vector2i(12, 14)           # a quiet corner, out of everyone's way and out of the lanterns' reach
const LAMP_LOOP := [Vector2i(5, 9), Vector2i(28, 5), Vector2i(37, 9), Vector2i(20, 12)]   # SF2.18: lit by walking within reach
const DAYS := 10
const SKILL := 0.7             # how often a normal player stops a timing game in the gold
const BUILD_ORDER := [["smithy", "west"], ["tavern", "east"], ["apothecary", "north"], ["yard", "south"]]
var main
var rng := RandomNumberGenerator.new()
var busy := {}
var log := {}
var events := []

func _initialize() -> void:
	_go.call_deferred()

func _go() -> void:
	var out := {}
	var pol: Array = ["board", "hand", "hand_nohire"]
	var seeds: Array = [11, 22, 33]
	var ua := OS.get_cmdline_user_args()
	if ua.size() >= 2:
		pol = [ua[0]]
		seeds = [int(ua[1])]
	for policy in pol:
		var runs := []
		for seed in seeds:
			runs.append(run(policy, seed))
		out[policy] = runs
	print("PACING_JSON " + JSON.stringify(out))
	quit()

func tick(seconds: float) -> void:
	var n := maxi(1, int(round(seconds / DT)))
	for i in n:
		main._process(DT)

func walk(to: Vector2i) -> float:
	var r: Array = main.route(main.me.tile, to, main.me)
	var tiles: int = r.size() if not r.is_empty() else absi(to.x - main.me.tile.x) + absi(to.y - main.me.tile.y)
	return float(tiles) / main.me.speed

## Spend this long on an activity: walk, then act; the world keeps running.
func spend(kind: String, to: Vector2i, act_s: float) -> void:
	var s := walk(to) + act_s
	tick(s)
	main.me.tile = to
	main.me.pos = Vector2(to) * main.TILE
	main.me.path.clear()
	busy[kind] = float(busy.get(kind, 0.0)) + s

func talk_through() -> void:
	var guard := 0
	while not main.lines.is_empty() and guard < 40:
		main.advance()
		guard += 1

func note(what: String) -> void:
	if not log.has(what):
		log[what] = snappedf((main.day - 1) * main.DAY_SECONDS + main.day_t, 0.1)

func run(policy: String, seed: int) -> Dictionary:
	main = load("res://scenes/main.tscn").instantiate()
	main.no_save = true
	root.add_child(main)
	main.no_save = true
	main.rng.seed = seed
	rng.seed = seed
	main.lines.clear()
	main.then_do = Callable()
	busy = {}
	log = {}
	var hand := policy != "board"
	var hires := policy == "hand"
	var days := []
	var start_coins: int = main.coins
	var unfed := 0
	var d_prev: int = main.day
	var day_counts := { "meals_hand": 0, "pours": 0, "pieces": 0, "batches": 0, "spars": 0, "rounds": 0 }
	var prev := { "meals": main.meals, "pours": main.pours, "pieces": main.pieces, "batches": main.batches, "spars": main.spars, "rounds": main.rounds }
	var day_start_busy := 0.0
	var day_start_t := 0.0
	var total_t := 0.0
	while main.day <= DAYS:
		var acted := act(policy, hand, hires)
		if not acted:
			tick(0.5)
			busy["idle"] = float(busy.get("idle", 0.0)) + 0.5
		main.lines.clear()
		main.me.tile = IDLE_AT                  # step aside after each thing (standing on the board's spot would block it)
		main.me.pos = Vector2(IDLE_AT) * main.TILE
		if main.day != d_prev:
			printerr("day ", d_prev, " ", policy, " ", seed, " t=", Time.get_ticks_msec())
			var b := 0.0
			for k in busy:
				if k != "idle":
					b += float(busy[k])
			days.append({ "day": d_prev, "coins": main.coins, "jobs": main.total_jobs, "rank": main.RANKS[main.rank].name,
				"meals_hand": main.meals - int(prev.meals), "pours": main.pours - int(prev.pours), "pieces": main.pieces - int(prev.pieces),
				"batches": main.batches - int(prev.batches), "spars": main.spars - int(prev.spars), "rounds": main.rounds - int(prev.rounds),
				"busy_s": snappedf(b - day_start_busy, 0.1), "heroes": main.heroes.size(), "pot": int(main.today.get("pot", 0)), "unfed": int(main.today.get("unfed", 0)),
				"morale": snappedf(main.heroes.reduce(func(acc, h): return acc + int(h.a.morale), 0) / float(main.heroes.size()), 0.1),
				"good": main.good_days, "bad": main.bad_days })
			prev = { "meals": main.meals, "pours": main.pours, "pieces": main.pieces, "batches": main.batches, "spars": main.spars, "rounds": main.rounds }
			day_start_busy = b
			d_prev = main.day
		for k in ["hired:hired", "smith_hired:smith", "fen_hired:fen", "tamsin_hired:tamsin", "odo_hired:odo", "ilse_hired:ilse"]:
			var p: PackedStringArray = k.split(":")
			if main.get(p[0]):
				note("hire_" + p[1])
		note("rank_" + main.RANKS[main.rank].name)
		for b in main.built:
			if float(main.built[b].left) <= 0.0:
				note("built_" + str(main.built[b].what))
	var res := { "policy": policy, "seed": seed, "days": days, "busy": busy.duplicate(), "when": log.duplicate(), "end_coins": main.coins, "jobs": main.total_jobs }
	main.queue_free()
	return res

## One decision: the first useful thing to do, in a normal player's order.
func act(policy: String, hand: bool, hires: bool) -> bool:
	var m = main
	# answer anyone who asks for a word (stories), and take a hire that's offered
	for h in m.heroes:
		if h.where == "town" and m.story_ready(h) and h.a.get("asked", false):
			spend("stories", h.tile + Vector2i.DOWN, 6.0)
			m._story_talk(h)
			talk_through()
			m.story_choose(0)
			talk_through()
			m.story_pick = {}
			return true
	if hires:
		if not m.hired and m.meals >= m.HIRE_AFTER:
			spend("hiring", m.bryn.tile + Vector2i.DOWN, 4.0); m.talk_bryn(); talk_through(); return true
		if not m.smith_hired and m.garrick.where == "town" and m.pieces >= m.SMITH_AFTER:
			spend("hiring", m.garrick.tile + Vector2i.DOWN, 4.0); m.talk_garrick(); talk_through(); return true
		if not m.fen_hired and m.fen.where == "town":
			spend("hiring", m.fen.tile + Vector2i.DOWN, 4.0); m.talk_fen(); talk_through(); return true
		if not m.tamsin_hired and m.tamsin.where == "town":
			spend("hiring", m.tamsin.tile + Vector2i.DOWN, 4.0); m.talk_tamsin(); talk_through(); return true
		if not m.odo_hired and m.odo.where == "town":
			spend("hiring", m.ODO_AT + Vector2i.RIGHT, 4.0); m.talk_odo(); talk_through(); return true
		if not m.ilse_hired and m.ilse.where == "town":
			spend("hiring", m.ilse.tile + Vector2i.DOWN, 4.0); m.talk_ilse(); talk_through(); return true
	if hand:
		# the counter: someone waiting and nobody to serve them
		if not m.hired and not m.queue.is_empty():
			var h = m.queue[0]
			if h.tile == m.ORDER_AT and h.path.is_empty():
				spend("counter", m.SERVE_AT, 1.5)
				if not m.queue.is_empty() and m.queue[0] == h:
					m.queue.pop_front()
					m.serve(h, true)
				return true
		# the forge
		if m.finished("smithy") != "" and not m.smith_hired and m._customer_ready():
			spend("forge", m.forge_at(), 2.5)
			if m._customer_ready():
				var hits := 0
				for i in 3:
					if rng.randf() < SKILL:
						hits += 1
				m.finish_piece(m.smith_customer, hits, true)
			return true
		# the tap
		if m.finished("tavern") != "" and not m.tamsin_hired and m._tavern_customer() != null:
			spend("tap", m._tap_at(), 2.0)
			var c = m._tavern_customer()
			if c != null:
				m.drink(c, 2 if rng.randf() < SKILL else 1, true)
			return true
		# the pot
		if m.finished("apothecary") != "" and not m.fen_hired and m.herbs >= 2 and m.stock < m.TONIC_MAX and m.brewing <= 0.0:
			m.shelf_open = true
			spend("pot", m._pot_at(), 1.5)
			m.shelf_pick(0)
			m.shelf_open = false
			tick(3.0)
			busy["pot"] = float(busy.get("pot", 0.0)) + 3.0
			return true
		# the lantern round at dusk
		if m.evening() and not m.odo_hired and m.lamps.has(false):
			for i in m.LANTERNS.size():
				if not m.lamps[i]:
					if m.get_script().get_script_constant_map().has("REACH"):
						spend("lanterns", LAMP_LOOP[i], 0.0)
						m._light_near()
					else:
						spend("lanterns", m.LAMP_STANDS[i], 0.8)
						m.light_lamp(i)
			return true
		# a bout at the yard
		if m.finished("yard") != "" and not m.ilse_hired and m.spar_partner() != null:
			var h2 = m.spar_partner()
			spend("yard", m._step_of(m.finished("yard")), 5.0)    # (partner walks over, then the swing)
			m.spar = { "fill": 0.0, "on": true, "h": h2, "dir": 1.0, "ready": true, "wait": 0.0 }
			m.finish_spar((m.SPAR_BAND.x + m.SPAR_BAND.y) / 2.0 if rng.randf() < SKILL else 0.1)
			return true
	# the board: keep two jobs pinned
	if m.posted.size() < m.MAX_POSTED and m.notices.size() > m.posted.size():
		spend("board", m.READ_AT, 3.0)
		for id in m.notices:
			if m.posted.size() < m.MAX_POSTED and not id in m.posted:
				m.posted.append(id)
		return true
	# build the next thing when it's affordable and its plot is open
	for bo in BUILD_ORDER:
		if not m.built.has(bo[1]) and int(m.PLOT_RANK[bo[1]]) <= m.rank and m.coins >= int(m.BUILDINGS[bo[0]].cost):
			spend("building", m.PLOTS[bo[1]] + Vector2i(0, 2), 3.0)
			m.build_plot = bo[1]
			m.build(bo[0])
			return true
	return false
