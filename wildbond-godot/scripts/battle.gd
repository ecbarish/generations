extends Control
## A battle on the field (docs/wildbond-plan.md phase 3). The classic layout over the whole screen: the foe on its
## grass platform at the top right, your partner at the bottom left, health beside each, a strip showing who acts
## next, the message box below, and a command box: Fight (then a move, each with its description), Guard, Rally, Run.
## The rules are the browser game's (rules.gd): speed-based turns that pause on your creature's turn, the same damage,
## elements, cooldowns and orders. A grey fog rolls in and out (no flashing), and the results page waits for you.

signal finished(result: String)
const Figures := preload("res://scripts/figures.gd")
const Sprites := preload("res://scripts/creature_sprites.gd")
const Effects := preload("res://scripts/battle_effects.gd")
const R := preload("res://scripts/rules.gd")
const PhoneShell := preload("res://scripts/phone_shell.gd")
const INK := Color("2a2230")
const PAPER := Color("f8f2e4")
const EL_COL := { "Ember": Color("e0602a"), "Tide": Color("3a8fd8"), "Grove": Color("5d9a3e") }
## CR1: size classes to battle scale (spec 4.4, docs/wildbond-creatures.md).
## Whole-number zoom only. A creature's size is the height drawn into its pixels (metres × 12.35).
const SIZE_SCALE := { "tiny": 1, "small": 1, "medium": 1, "large": 1, "huge": 1 }
## Painted sprites stay this many pixels clear of the health panels. The zoom itself stays a whole number.
const PANEL_CLEARANCE := 4.0
## Each element's hit has its own animated effect (Ninja Adventure FX, CC0; assets/fx): [file, frame width, frames, tint].
const EL_FX := { "Ember": ["ember", 25, 8, Color.WHITE], "Tide": ["tide", 40, 11, Color.WHITE], "Grove": ["grove", 30, 8, Color.WHITE],
	"Stone": ["stone", 30, 14, Color.WHITE], "Gale": ["gale", 20, 8, Color.WHITE], "Shade": ["shade", 40, 9, Color("b080e8")],
	"Radiant": ["radiant", 32, 10, Color("ffe08a")] }
const FX_FRAME := 0.055
var fx_tex: Dictionary = {}
var fx: Array = []                             # element effects playing: { u, el, age }
var sfx: Sfx = null                            # sound effects (main.gd hands over its own; scripts/sfx.gd)
const SPEED := 2.5                            # battle time runs faster than real time between turns (outcomes are unchanged)
var pace := 1.0                                # the Settings page's battle pace: 1, 1.5 or 2 (only the waiting changes)
const MENU := ["Fight", "Guard", "Orders", "Bond", "Bag", "Run"]
## Tamer orders (docs/proposals/creature-catalogue-and-evolution.md §4): Rally for everyone, one from your family
## (the register's heritage), and orders people teach you along the way (Toren's Steady). Each costs orders, which
## come back as the battle goes on.
const ORDERS := {
	"shelter": { "name": "Shelter", "cost": 1, "text": "Your whole team braces for three seconds." },
	"rain": { "name": "Rain Call", "cost": 1, "text": "Soak a foe for an Ember partner to follow up." },
	"tailwind": { "name": "Tailwind", "cost": 2, "text": "Your team acts faster for five seconds." },
	"snare": { "name": "Hold the Line", "cost": 1, "text": "Roots slow a foe for five seconds." },
	"expose": { "name": "Spot the Gap", "cost": 1, "text": "Expose a foe: the next hit lands harder." },
	"mend": { "name": "Shared Care", "cost": 2, "text": "Each partner recovers a quarter of its health." },
	"renew": { "name": "Fresh Start", "cost": 1, "text": "Clear harmful effects from your whole team." },
	"rally": { "name": "Rally", "cost": 2, "text": "Call out to your whole team: everyone recovers a little and trusts you more." },
	"patch": { "name": "Patch Up", "cost": 1, "text": "Farmfolk know how to look after things that can't say what's wrong: your most hurt creature recovers, and poison eases." },
	"tide": { "name": "Read the Tide", "cost": 1, "text": "Coastfolk see a wave coming. Your team braces by itself for the foe's next big attack." },
	"firm": { "name": "Stand Firm", "cost": 2, "text": "Highland grit: your team braces and hits harder for a few moments." },
	"opening": { "name": "Find an Opening", "cost": 2, "text": "A wanderer's eye for a gap: another of your creatures acts at once." },
	"steady": { "name": "Steady", "cost": 1, "text": "Toren's way: a calm voice. Poison and slowness leave your team." },
}
const FAMILY_ORDER := { "farm": "patch", "coast": "tide", "highland": "firm", "wander": "opening" }

var looks: Dictionary = {}                    # species id -> body plan (main.gd CREATURE_LOOKS)
var floor_tex: Texture2D
var nature_tex: Texture2D
var kind := "trainer"
var trainer := ""
var tactic := ""
const WARDEN_PLANS := {"Warden Isolde": "shelter", "Warden Nerys": "setup", "Warden Toren": "patient", "Warden Vessa": "rush", "Warden Olan": "shelter", "Warden Senna": "setup", "Warden Halen": "patient", "Warden Rysa": "adaptive"}
var allies: Array = []
var foes: Array = []
var state := "off"                            # fog_in, intro, run, choose, moves, beat, results, fog_out
var wait_u: Dictionary = {}                   # the ally whose turn it is
var beat_t := 0.0
var state_t := 0.0
var t := 0.0
var log_lines: Array = []
var orders := 1.0                             # command points: Guard costs 1, Rally 2; one more every 5 seconds of battle
var order_t := 0.0
var tele: Dictionary = {}                     # a big foe attack being gathered (Guard in time!)
var menu_i := 0
var move_i := 0
var floats: Array = []                        # damage numbers: { u, txt, col, age }
var sparks: Array = []                        # element bursts: { u, col, age }
var result := ""
var results: Array = []                       # lines on the results page
var rng := RandomNumberGenerator.new()
var font: Font
var demo := false
var heritage := "farm"                        # your family's heritage (main.gd): a small gift in bonding (register.gd FAMILY_TEXT)
var taught: Array = []                        # orders people have taught you (main.gd), beyond Rally and your family's
var order_i := 0
var tide_ready := false                       # Read the Tide: the next gathered attack is braced for
var area := ""                                 # the area the battle happens in (main.gd sets it): its sky and skyline
var max_level := 15                           # the level cap (main.gd sets it from your badges, CAP_TABLE)
var bag: Dictionary = { "lures": 0, "berries": 0 }  # the satchel (main.gd owns it): lures for Bond, berries for Bag
var caught: Array = []                        # creatures that chose you in this battle
var cap: Dictionary = {}                      # the calm meter while you Bond: { u, pos, dir, zone }
## The wild bond (WB4.2; docs/proposals/creature-catalogue-and-evolution.md §5): never taught, never in a menu until it
## happens. Your last creature standing, badly hurt, trusting you completely (Bonded), in a battle that matters (a
## tamer, or a wild foe well above it), once a day: it looks back at you, and "Stand with it" takes Run's place.
## You become one for a short while; it can turn a lost battle, but afterwards you are both spent.
const JOIN_TIME := 14.0                        # battle seconds the joining lasts
var bond_ok := true                            # main.gd: false before the fourth badge, once it has happened today, or in the demo
var big_fight := false                         # main.gd: a Warden, the league, the Spire or a rematch
var tamer_look: Dictionary = {}                # main.gd: how you look, for the joined form
var looked_back := false                       # the creature has looked back at you this battle
var bond_used := false                         # the joining happened in this battle (main.gd reads it)
var joined: Dictionary = {}                    # the unit you are joined with, while it lasts
var joined_t := 0.0
var flood_t := -1.0                            # colour flooding the field as you join (seconds since)

func _ready() -> void:
	Controls.fill(self)
	mouse_filter = MOUSE_FILTER_STOP
	font = ThemeDB.fallback_font
	visible = false

func unit(c: Dictionary, side: String) -> Dictionary:
	var st := R.stats(c)
	if c.get("hp") == null or c.hp > st.hp:
		c.hp = st.hp
	return { "c": c, "side": side, "st": st, "atb": rng.randf() * 1.2 + (1.0 if str(c.get("gear", "")) == "ribbon" else 0.0), "cds": {}, "buff": {}, "dots": [], "status": {}, "wake_grace": 0.0, "lunge": 0.0, "hit": 0.0, "shown": float(c.hp) }

func open(battle_kind: String, team: Array, foe_team: Array, who: String) -> void:
	kind = battle_kind
	trainer = who
	tactic = str(WARDEN_PLANS.get(who, ""))
	tide_ready = false
	order_i = 0
	allies = team.filter(func(c): return c.hp > 0).map(func(c): return unit(c, "a"))
	foes = foe_team.map(func(c): return unit(c, "f"))
	if not allies.is_empty():
		allies[0].atb = R.ACT_AT                      # WBL-2: you move first, so a battle opens on your menu, never on a free hit
	log_lines.clear()
	floats.clear()
	sparks.clear()
	tele = {}
	orders = 1.0
	order_t = 0.0
	result = ""
	results.clear()
	caught.clear()
	cap = {}
	fx.clear()
	looked_back = false
	bond_used = false
	joined = {}
	joined_t = 0.0
	flood_t = -1.0
	var names := ", ".join(foes.map(func(u): return "%s (Lv %d)" % [u.c.name, u.c.lvl]))
	say("A wild %s appeared!" % names if kind == "wild" else "%s sends out %s!" % [trainer, names])
	_go_to("fog_in")
	visible = true
	_sfx("whoosh")

func _sfx(sound: String, louder_db := 0.0) -> void:
	if sfx:
		sfx.play(sound, louder_db)

func say(s: String) -> void:
	log_lines.append(s)
	if log_lines.size() > 30:
		log_lines.pop_front()

func _go_to(s: String) -> void:
	state = s
	state_t = 0.0

func living(side: String) -> Array:
	return (allies if side == "a" else foes).filter(func(u): return u.c.hp > 0)

# ---------------------------------------------------------------- the battle running
func _process(dt: float) -> void:
	if not visible:
		return
	t += dt
	state_t += dt
	for u in allies + foes:
		u.shown = move_toward(u.shown, float(u.c.hp), dt * maxf(8.0, u.st.hp * 0.8))   # health bars drain smoothly
		u.lunge = maxf(0.0, u.lunge - dt)
		u.hit = maxf(0.0, u.hit - dt)
	if flood_t >= 0.0:
		flood_t += dt
	for f in floats: f.age += dt
	floats = floats.filter(func(f): return f.age < 1.0)
	for s in sparks: s.age += dt
	for e in fx: e.age += dt
	fx = fx.filter(func(e): return e.age < FX_FRAME * EL_FX[e.el][2])
	sparks = sparks.filter(func(s): return s.age < 0.6)
	match state:
		"fog_in":
			if state_t > 1.0: _go_to("intro")
		"intro":
			if state_t > 1.4: _go_to("run")
		"run":
			_tick(dt * SPEED * pace)
		"capture":
			cap.pos += cap.dir * dt * 0.9
			if cap.pos > 1.0: cap.pos = 1.0; cap.dir = -1.0
			if cap.pos < 0.0: cap.pos = 0.0; cap.dir = 1.0
		"beat":
			if state_t * pace > beat_t:
				_after_beat()
		"fog_out":
			if state_t > 1.0:
				visible = false
				state = "off"
				for u in allies + foes:
					u.shown = float(u.c.hp)                    # the bars match the real HP when the dust settles
				finished.emit(result)
	if demo:
		_demo()
	queue_redraw()

func _tick(h: float) -> void:
	if _check_end():
		return                                       # already decided (every foe down): end it rather than open a menu
	if not joined.is_empty():
		joined_t -= h
		if joined_t <= 0.0 or joined.c.hp <= 0:
			_unjoin()
			return
	order_t += h
	if order_t >= 5.0:
		order_t = 0.0
		orders = minf(3.0, orders + 1.0)
	if not tele.is_empty():
		tele.t -= h
		if tele.t <= 0.0:
			var u: Dictionary = tele.u
			var m: String = tele.m
			tele = {}
			if u.c.hp > 0 and not Effects.active(u, "sleep") and not living("a").is_empty():
				_resolve(u, m, 1.0)
				_beat(1.1)
				return
	for u in allies + foes:
		if u.c.hp <= 0:
			continue
		var burn := Effects.tick(u, h)
		if burn > 0:
			_hurt(u, burn, false, null)
		for k in u.cds.keys():
			u.cds[k] = maxf(0.0, u.cds[k] - h)
		for k in ["dmg", "haste", "guard", "slow"]:
			if u.buff.get(k, 0.0) > 0:
				u.buff[k] -= h
				if u.buff[k] <= 0 and k == "guard":
					u.buff.guardCmd = 0
		for d in u.dots:
			d.tick -= h
			if d.tick <= 0:
				d.tick = 1.0
				d.left -= 1
				_hurt(u, d.per, false, null)
		u.dots = u.dots.filter(func(d): return d.left > 0)
		if u.c.hp <= 0 or Effects.active(u, "sleep") or (not tele.is_empty() and tele.u == u):
			continue
		u.atb += h * R.atb_rate(u)
		if u.atb >= R.ACT_AT:
			if u.side == "a":
				u.atb = R.ACT_AT
				if not has_ready_move(u):
					# every move still resting (a late team with long cooldowns, T56): it waits, ready, while time runs on,
					# and you choose as soon as one move is ready, instead of a menu where nothing can be picked
					if not u.get("breath", false):
						u.breath = true
						say("%s catches its breath." % u.c.name)
					continue
				u.breath = false
				if can_join(u) and not looked_back:
					looked_back = true                 # the moment holds: it looks back at you, then your choice
					say("%s looks back at you." % u.c.name)
					_beat(1.6)
					return
				wait_u = u
				menu_i = 0
				_go_to("choose")
				return
			u.atb = 0.0
			_act(u, "", 1.0)
			if state != "run":
				return
		if _check_end():
			return

func _check_end() -> bool:
	if living("f").is_empty():
		_end("won")
		return true
	if living("a").is_empty():
		_end("lost")
		return true
	return false

func _beat(seconds: float) -> void:
	beat_t = seconds
	_go_to("beat")

func _after_beat() -> void:
	if not _check_end():
		_go_to("run")

# ---------------------------------------------------------------- acting (03-battle.js act / resolve)
func _act(u: Dictionary, forced: String, mult: float) -> void:
	var m: String = forced if forced != "" else R.choose_move(u, living(u.side), rng, living("f" if u.side == "a" else "a"), tactic if u.side == "f" else "")
	if m == "" or not R.DATA.MOVES.has(m):
		return
	var mv: Dictionary = R.DATA.MOVES[m]
	if living("f" if u.side == "a" else "a").is_empty():
		return
	u.cds[m] = float(mv.cd)
	# a big foe attack is telegraphed, so you can Guard in time
	if u.side == "f" and forced == "" and (mv.kind == "aoe" or int(mv.get("pow", 0)) >= 80) and tele.is_empty():   # support moves have no power (like the browser, they never count)
		tele = { "u": u, "m": m, "t": 1.6 }
		say("%s is gathering power for %s!" % [u.c.name, mv.name])
		if tide_ready:
			tide_ready = false                       # Read the Tide: you saw it coming
			for a in living("a"):
				a.buff.guard = 3.0
				a.buff.guardCmd = 1
			say("You read it like a wave. Your team is already braced.")
		_beat(1.0)
		return
	_resolve(u, m, mult)
	_beat(1.1)

func _target(u: Dictionary, m: String = "") -> Dictionary:
	var them := living("f" if u.side == "a" else "a")
	if u.side == "f" and tactic != "" and m != "":
		them.sort_custom(func(a, b): return R.move_value(u, m, living(u.side), [a], tactic) > R.move_value(u, m, living(u.side), [b], tactic))
		return them[0]
	return them[0] if rng.randf() < 0.65 else them[rng.randi() % them.size()]

func _resolve(u: Dictionary, m: String, mult: float) -> void:
	var mv: Dictionary = R.DATA.MOVES[m]
	var them := living("f" if u.side == "a" else "a")
	var us := living(u.side)
	u.lunge = 0.35
	match mv.kind:
		"hit":
			var tg := _target(u, m)
			var r := R.damage(u, tg, mv, mult, rng.randf(), rng.randf())
			_hurt(tg, r.d, r.crit, mv.get("el"))
			Effects.after_hit(tg, mv)
			if mv.has("status") and Effects.active(tg, str(mv.status)):
				say("%s is %s." % [nm(tg), Effects.LABEL[str(mv.status)].to_lower()])
			say("%s used %s%s on %s for %d%s" % [nm(u), mv.name, ", a critical hit" if r.crit else "", nm(tg), r.d,
				". It hits hard!" if r.adv > 1 else (". Not very effective." if r.adv < 1 else ".")])
		"aoe":
			for tg in them:
				var r := R.damage(u, tg, mv, mult * 0.75, rng.randf(), rng.randf())
				_hurt(tg, r.d, r.crit, mv.get("el"))
				Effects.after_hit(tg, mv)
			say("%s used %s on everyone!" % [u.c.name, mv.name])
		"dot":
			var tg := _target(u, m)
			tg.dots.append({ "per": maxi(1, roundi(R.damage(u, tg, mv, mult, rng.randf(), 1.0).d / 2.0)), "left": 4, "tick": 1.0 })
			say("%s used %s. %s is poisoned." % [u.c.name, mv.name, tg.c.name])
		"buff":
			for a in us: a.buff.dmg = 6.0
			say("%s used %s! Its team hits harder." % [u.c.name, mv.name])
		"haste":
			for a in us: a.buff.haste = float(mv.get("duration", 6.0))
			say("%s used %s! Its team speeds up." % [u.c.name, mv.name])
		"guard":
			for a in us:
				a.buff.guard = float(mv.get("duration", 4.0))
				if mv.get("cleanse", false): Effects.cleanse(a)
			say("%s used %s! Its team braces." % [u.c.name, mv.name])
		"slow":
			var tg := _target(u, m)
			tg.buff.slow = float(mv.get("duration", 5.0))
			say("%s used %s. %s slows down." % [u.c.name, mv.name, tg.c.name])
		"heal":
			var care: Array = us.filter(func(a): return not Effects.label(a).is_empty() or not a.dots.is_empty()) if mv.get("cleanse", false) else []
			if care.is_empty(): care = us
			var low: Dictionary = care[0]
			for a in care:
				if float(a.c.hp) / a.st.hp < float(low.c.hp) / low.st.hp:
					low = a
			var hp := roundi(low.st.hp * float(mv.get("heal", 0.25)))
			if mv.get("cleanse", false): Effects.cleanse(low)
			low.c.hp = mini(low.st.hp, low.c.hp + hp)
			floats.append({ "u": low, "txt": "+%d" % hp, "col": Color("7cf08a"), "age": 0.0 })
			sparks.append({ "u": low, "col": Color("7cf08a"), "age": 0.0 })
			say("%s used %s. %s recovers %d." % [u.c.name, mv.name, low.c.name, hp])
			_sfx("heal")

func _hurt(u: Dictionary, d: int, crit: bool, el) -> void:
	Effects.wake(u)
	u.c.hp = maxi(0, u.c.hp - d)
	u.hit = 0.45
	floats.append({ "u": u, "txt": "-%d" % d, "col": Color("ffd23a") if crit else Color("ffffff"), "age": 0.0 })
	_sfx(EL_FX[el][0] if el != null and EL_FX.has(el) else "hit", -3.0)
	if el != null:
		sparks.append({ "u": u, "col": EL_COL.get(el, Color.WHITE), "age": 0.0 })
		if EL_FX.has(el):
			fx.append({ "u": u, "el": el, "age": 0.0 })
	if u.c.hp <= 0:
		say("%s fainted!" % nm(u))

# ---------------------------------------------------------------- your choices
func _choose(i: int) -> void:
	_sfx("pick", -6.0)
	match menu_word(i):
		"Stand with it":
			_join(wait_u)
		"Fight":
			move_i = 0
			_go_to("moves")
		"Guard":
			if orders < 1:
				say("Not enough orders yet. They come back as the battle goes on.")
				return
			orders -= 1
			for a in living("a"):
				a.buff.guard = 3.0
				a.buff.guardCmd = 1
			say("Guard! Your team braces for the hit.")
		"Orders":
			order_i = 0
			_go_to("orders")
		"Bond":
			if kind != "wild":
				say("You can't bond with another tamer's creature.")
			elif int(bag.get("lures", 0)) <= 0:
				say("You're out of lures. You can find them in the grass, or buy them in Larkhaven.")
			else:
				# a lure plus a timing meter: weaker, calmer creatures are easier (startCapture)
				var tg: Dictionary = living("f")[0]
				for u in living("f"):
					if float(u.c.hp) / u.st.hp < float(tg.c.hp) / tg.st.hp:
						tg = u
				bag.lures -= 1
				cap = { "u": tg, "pos": 0.0, "dir": 1.0, "zone": 0.62 + rng.randf() * 0.2 }
				say("You throw a lure at %s. Calm it: press when the marker is in the green." % tg.c.name)
				_sfx("whoosh")
				_go_to("capture")
		"Bag":
			if int(bag.get("berries", 0)) <= 0:
				say("Your bag has nothing to use in battle yet. Berries heal; you find them in the grass.")
			else:
				var low: Dictionary = living("a")[0]
				for a in living("a"):
					if float(a.c.hp) / a.st.hp < float(low.c.hp) / low.st.hp:
						low = a
				bag.berries -= 1
				var hp := roundi(low.st.hp * 0.3)
				low.c.hp = mini(low.st.hp, low.c.hp + hp)
				floats.append({ "u": low, "txt": "+%d" % hp, "col": Color("7cf08a"), "age": 0.0 })
				sparks.append({ "u": low, "col": Color("7cf08a"), "age": 0.0 })
				say("%s eats a berry and recovers %d." % [low.c.name, hp])
				_sfx("heal")
				var u := wait_u
				wait_u = {}
				u.atb = 0.0                                # eating takes its turn
				_beat(1.0)
		"Run":
			if kind == "wild":
				say("You slip away.")
				_end("fled")
			else:
				say("%s blocks the way: \"No running from a tamer battle!\"" % trainer)

## A menu slot's word: Run's slot becomes "Stand with it" while the wild bond is within reach.
func menu_word(i: int) -> String:
	if MENU[i] == "Run" and not wait_u.is_empty() and can_join(wait_u):
		return "Stand with it"
	return MENU[i]

## Whether the wild bond can happen for this creature now (the conditions are never shown as a list).
func can_join(u: Dictionary) -> bool:
	if not bond_ok or bond_used or u.is_empty() or u.side != "a" or u.c.hp <= 0:
		return false
	var standing := living("a")
	if standing.size() != 1 or standing[0] != u or R.bond_lvl(u.c) < R.BOND.size() - 1:
		return false
	if float(u.c.hp) / u.st.hp > 0.3:
		return false
	# a harder foe, never an easy one (Evan, 2026-10-11): a Warden, the league, the Spire or a rematch whose creatures
	# are at least your partner's level, or any foe clearly stronger (three levels or more above it)
	var top := 0
	for f in foes:
		if f.c.hp > 0:
			top = maxi(top, f.c.lvl)
	return (big_fight and top >= u.c.lvl) or top >= u.c.lvl + 3

func _join(u: Dictionary) -> void:
	bond_used = true
	joined = u
	u.joined = true
	joined_t = JOIN_TIME
	flood_t = 0.0
	u.c.hp = maxi(u.c.hp, roundi(u.st.hp * 0.6))
	u.dots.clear()
	u.status.clear()
	floats.append({ "u": u, "txt": "+%d" % (u.c.hp), "col": Color("ffe08a"), "age": 0.0 })
	wait_u = {}
	u.atb = R.ACT_AT * 0.8
	say("You stand with %s. Colour floods the field, and the two of you become one." % u.c.name)
	_sfx("levelup")
	_beat(2.2)

func _unjoin() -> void:
	var u: Dictionary = joined
	joined = {}
	u.erase("joined")
	orders = 0.0                                   # both of you are spent: your orders too
	if u.c.hp > 0:
		u.c.hp = maxi(1, mini(u.c.hp, roundi(u.st.hp * 0.15)))
		say("The joining fades. You and %s are both spent." % u.c.name)
	_beat(1.4)

## The orders you know: Rally, your family's order, then what people have taught you.
func known_orders() -> Array:
	var out: Array = ["rally"]
	if FAMILY_ORDER.has(heritage):
		out.append(FAMILY_ORDER[heritage])
	for o in taught:
		if ORDERS.has(o) and not o in out:
			out.append(o)
	return out

## Give an order. It costs orders (they come back as the battle goes on) and doesn't use your creature's turn.
func use_order(id: String) -> bool:
	var o: Dictionary = ORDERS[id]
	if orders < int(o.cost):
		say("%s needs %d order%s. They come back as the battle goes on." % [o.name, int(o.cost), "" if int(o.cost) == 1 else "s"])
		return false
	var team := living("a")
	match id:
		"shelter":
			for a in team: a.buff.guard = maxf(a.buff.get("guard", 0.0), 3.0)
		"tailwind":
			for a in team: a.buff.haste = maxf(a.buff.get("haste", 0.0), 5.0)
		"rain", "snare", "expose":
			var enemies := living("f")
			if enemies.is_empty(): return false
			Effects.apply(enemies[0], {"rain": "soaked", "snare": "rooted", "expose": "marked"}[id], 5.0)
		"mend":
			for a in team: a.c.hp = mini(a.st.hp, a.c.hp + roundi(a.st.hp * 0.25))
		"renew":
			for a in team: Effects.cleanse(a)
		"rally":
			for a in team:
				var hp := roundi(a.st.hp * 0.2)
				a.c.hp = mini(a.st.hp, a.c.hp + hp)
				R.add_bond(a.c, 1.0, "battle")
				floats.append({ "u": a, "txt": "+%d" % hp, "col": Color("7cf08a"), "age": 0.0 })
			say("You rally your team. Everyone recovers.")
		"patch":
			var low: Dictionary = team[0]
			for a in team:
				if float(a.c.hp) / a.st.hp < float(low.c.hp) / low.st.hp:
					low = a
			var hp := roundi(low.st.hp * 0.25)
			low.c.hp = mini(low.st.hp, low.c.hp + hp)
			Effects.cleanse(low)
			floats.append({ "u": low, "txt": "+%d" % hp, "col": Color("7cf08a"), "age": 0.0 })
			say("You kneel by %s and see to it, the way your family always did. It recovers %d." % [low.c.name, hp])
		"tide":
			tide_ready = true
			say("You watch the foe the way you'd watch the sea. When its big attack comes, your team will be ready.")
		"firm":
			for a in team:
				a.buff.guard = 3.0
				a.buff.guardCmd = 1
				a.buff.dmg = 4.0
			say("Stand firm! Your team plants its feet, braced and ready to hit back.")
		"opening":
			var other: Array = team.filter(func(a): return a != wait_u)
			if other.is_empty():
				say("There's no one else to step in.")
				return false
			other[0].atb = R.ACT_AT
			say("You spot a gap. %s darts in to act at once." % other[0].c.name)
		"steady":
			for a in team:
				Effects.cleanse(a)
				R.add_bond(a.c, 0.5, "battle")
			say("You speak low and slow, the way Toren showed you. Your team steadies.")
	if id in ["shelter", "tailwind", "rain", "snare", "expose", "mend", "renew"]: say("You call %s. %s" % [o.name, o.text])
	orders -= float(o.cost)
	return true

## Whether this creature has a move it can use right now (no move still resting).
func has_ready_move(u: Dictionary) -> bool:
	return R.moves_of(u.c).any(func(m): return u.cds.get(m, 0.0) <= 0)

func _use_move(m: String) -> void:
	if wait_u.cds.get(m, 0.0) > 0:
		say("%s needs a moment before it can use %s again." % [wait_u.c.name, R.DATA.MOVES[m].name])
		return
	var u := wait_u
	wait_u = {}
	u.atb = 0.0
	_act(u, m, 1.0)
	R.add_bond(u.c, 0.3, "battle")

# ---------------------------------------------------------------- the end: XP, level ups, the bond (endBattle)
func _end(r: String) -> void:
	if result != "":
		return
	result = r
	results.clear()
	if r in ["won", "caught"]:
		for c in caught:
			results.append("%s chose to come with you!" % c.name)
		if r == "won":
			results.append("You won!" if kind == "wild" else "You beat %s!" % trainer)
		var lv_sum := 0
		for u in foes: lv_sum += u.c.lvl
		for c in caught: lv_sum += c.lvl
		lv_sum = maxi(lv_sum, 3)
		var journey: Dictionary = R.DATA.JOURNEY.get("classic", { "xp": 1.0 })
		var count := maxi(1, foes.size() + caught.size())
		var avg := float(lv_sum) / count
		for u in allies:
			var xp := roundi(R.win_xp(count, avg, u.c.lvl, kind != "wild", float(journey.get("xp", 0.13))) * (0.3 if u.c.hp <= 0 else 1.0))
			results.append("%s gained %d XP." % [u.c.name, xp])
			results.append_array(R.grow(u.c, xp, max_level))
			var gain := 0.5 if kind == "wild" else 2.0
			if heritage == "coast" and u == allies[0]:
				gain *= 1.5                             # coastfolk: one partner for life
			if heritage == "highland" and kind != "wild":
				gain *= 1.5                             # highlanders: trust grows in hard battles
			if str(u.c.get("gear", "")) == "bell":
				gain *= 1.5                             # the calm bell
			if u.c.hp > 0 and R.add_bond(u.c, gain, "battle"):
				results.append("%s trusts you more: %s." % [u.c.name, R.BOND[R.bond_lvl(u.c)][0]])
	elif r == "lost":
		results.append("Your team is exhausted.")
	if r in ["won", "caught"]:
		_sfx("levelup" if results.any(func(l): return " grew to level " in l) else "success")
	elif r == "lost":
		_sfx("faint", -4.0)
	_go_to("results")

# ---------------------------------------------------------------- input: keys, mouse or touch
func _input(e: InputEvent) -> void:
	if not visible:
		return
	var click: bool = Controls.pointing(e)
	var ok := Controls.pressed(e, "interact")      # named actions (controls.gd): keys, a gamepad, or the phone's button
	var back := Controls.pressed(e, "back")
	var key := Controls.dir(e)
	if Controls.swallow_pointer(e) and not click:
		get_viewport().set_input_as_handled()      # the duplicate touch under a real click must not reach the world
		return
	if not (click or ok or back or key != Vector2i.ZERO):
		return
	get_viewport().set_input_as_handled()
	var p := Controls.at(self, e)
	match state:
		"choose":
			if click:
				for i in MENU.size():
					if _menu_rect(i).has_point(p): _choose(i)
			elif ok: _choose(menu_i)
			else: menu_i = _grid_move(menu_i, key, MENU.size(), 3)
		"capture":
			if ok or click: _calm()
		"moves":
			var mv := R.moves_of(wait_u.c)
			if click:
				var hit := false
				for i in mv.size():
					if _move_rect(i).has_point(p):
						hit = true
						if i == move_i: _use_move(mv[i])
						else: move_i = i
				if not hit: _go_to("choose")
			elif ok: _use_move(mv[move_i])
			elif back: _go_to("choose")
			else: move_i = _grid_move(move_i, key, mv.size(), 2)
		"orders":
			var ol := known_orders()
			if click:
				var nav_y := _order_nav_y()
				if p.y >= nav_y and p.y < nav_y + 16.0 and ol.size() > 4:
					if p.x < 92: order_i = maxi(0, (order_i / 4 - 1) * 4)
					elif p.x < 180: order_i = mini(ol.size() - 1, (order_i / 4 + 1) * 4)
					return
				var hit := false
				for i in ol.size():
					if i / 4 == order_i / 4 and _move_rect(i % 4).has_point(p):
						hit = true
						if i == order_i:
							if use_order(ol[i]): _go_to("choose")
						else: order_i = i
				if not hit: _go_to("choose")
			elif ok:
				if use_order(ol[order_i]): _go_to("choose")
			elif back: _go_to("choose")
			else: order_i = _grid_move(order_i, key, ol.size(), 2)
		"beat":
			if ok or click: state_t = beat_t                 # skip ahead
		"results":
			if (ok or click) and state_t > 0.5: _go_to("fog_out")

func _grid_move(i: int, d: Vector2i, n: int, cols: int) -> int:
	match d:
		Vector2i.LEFT: i = i - 1 if i % cols > 0 else i
		Vector2i.RIGHT: i = i + 1 if i % cols < cols - 1 and i + 1 < n else i
		Vector2i.UP: i = i - cols if i >= cols else i
		Vector2i.DOWN: i = i + cols if i + cols < n else i
	return i

var layout_scale := 0.0                      # tests set a phone scale; 0 uses the real window
var external_ui := false                      # upright phone: the deck draws the commands, the scene stays in the view

## Device pixels per canvas pixel. A headless window reports no size; treat that as the desktop's whole-pixel scale.
func _view_scale() -> float:
	if layout_scale > 0.0:
		return layout_scale
	var win := Vector2(DisplayServer.window_get_size())
	if win.x < 8.0 or win.y < 8.0:
		return 4.0
	return maxf(0.25, minf(win.x / 384.0, win.y / 216.0))

## A command is at least 44 device pixels tall, and never shorter than the desktop's 16 canvas pixels.
func _row_h() -> float:
	return _row_h_for(_view_scale())

func _row_h_for(scale: float) -> float:
	return maxf(16.0, ceil(44.0 / maxf(scale, 0.01)))

func _command_box() -> Rect2:
	var h := _row_h()
	var box_h := 2.0 * h + 14.0
	return Rect2(8, 216.0 - 6.0 - box_h, 368, box_h)

func _menu_rect(i: int) -> Rect2:
	var h := _row_h()
	var box := _command_box()
	return Rect2(244 + (i % 3) * 44, box.position.y + 6.0 + (i / 3) * (h + 3.0), 41, h)

func _move_rect(i: int) -> Rect2:
	var h := _row_h()
	var box := _command_box()
	return Rect2(14 + (i % 2) * 96, box.position.y + 6.0 + (i / 2) * (h + 3.0), 92, h)

func _order_nav_y() -> float:
	return _command_box().position.y - 19.0

func _detail_rect() -> Rect2:
	var box := _command_box()
	return Rect2(208, box.position.y + 2.0, 164, box.size.y - 4.0)

func _ally_panel() -> Rect2:
	var panel := Rect2(222, 116, 154, 36)
	var limit := _command_box().position.y - 4.0
	if panel.end.y > limit:
		panel.position.y = limit - panel.size.y
	return panel

func _ally_line_rect(i: int, n: int) -> Rect2:
	var lift := maxf(0.0, 160.0 - (_command_box().position.y - 4.0))
	return Rect2(236, 162.0 - (n - i) * 22.0 - lift, 140, 20)

## Where the "Next:" names sit. They shrink, then wrap, and stay inside the top of the screen.
func _chip_boxes(labels: PackedStringArray) -> Dictionary:
	if _view_scale() < 2.0:
		return PhoneShell.place_chips(labels, font, 8.0, 4.0, 376.0, 14, 28.0)
	var size := 7
	var limit := 376.0
	var x0 := 192.0
	while size > 5:
		var x := x0
		var rows := 1
		var fits := true
		for lab in labels:
			var w := font.get_string_size(lab, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x + 8.0
			if w > limit - x0:
				fits = false
				break
			if x + w > limit:
				rows += 1
				x = x0
			if rows > 2:
				fits = false
				break
			x += w + 3.0
		if fits:
			break
		size -= 1
	var rects: Array = []
	var x := x0
	var y := 7.0
	for lab in labels:
		var w := minf(font.get_string_size(lab, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x + 8.0, limit - x0)
		if x > x0 and x + w > limit:
			x = x0
			y += size + 5.0
		rects.append(Rect2(x, y, w, size + 3.0))
		x += w + 3.0
	return {"font": size, "rects": rects}

## How good a move looks against the foe in front: power, type advantage and same-element bonus (the demo and the
## automated checks pick moves this way, as a sensible player would).
func best_value(m: String) -> float:
	var mv: Dictionary = R.DATA.MOVES[m]
	var foe: Dictionary = living("f")[0] if not living("f").is_empty() else {}
	if foe.is_empty() or not mv.kind in ["hit", "aoe"]:
		return 0.0
	var el = mv.get("el")
	return R.move_value(wait_u, m, living("a"), living("f"))

func _demo() -> void:
	# the recorded demo: pick the strongest ready move, read the results, carry on
	if state == "choose" and state_t > 0.8:
		var foe_hurt: bool = not living("f").is_empty() and float(living("f")[0].c.hp) < living("f")[0].st.hp * 0.6
		_choose(3 if kind == "wild" and foe_hurt and int(bag.get("lures", 0)) > 0 else 0)
	elif state == "capture" and absf(float(cap.pos) - float(cap.zone)) < 0.06:
		_calm()
	elif state == "moves" and state_t > 0.8:
		var mv := R.moves_of(wait_u.c).filter(func(m): return wait_u.cds.get(m, 0.0) <= 0)
		mv.sort_custom(func(a, b): return best_value(a) > best_value(b))
		_use_move(mv[0])
	elif state == "results" and state_t > 3.0:
		_go_to("fog_out")

# ---------------------------------------------------------------- drawing
func _text(s: String, at: Vector2, size: int, col: Color, width := -1.0, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	draw_string(font, at, s, align if width > 0 else HORIZONTAL_ALIGNMENT_LEFT, width, size, col)

func _box(r: Rect2) -> void:
	draw_rect(r.grow(1), INK)
	draw_rect(r, PAPER)
	draw_rect(Rect2(r.position + Vector2(2, 2), r.size - Vector2(4, 4)), Color("e8dcc4"), false, 1.0)

func _hp_panels() -> Array:
	var panels: Array = []
	for i in foes.size():
		panels.append(Rect2(10, 8 + i * 30, 150, 26))
	if allies.size() == 1:
		panels.append(_ally_panel())
	elif allies.size() > 1:
		for i in allies.size():
			panels.append(_ally_line_rect(i, allies.size()))
	return panels

## Feet on the bottom edge of the sprite. If that rect would sit under a health panel, slide the
## feet aside. The caller keeps the same whole-number scale.
func _painted_foot(spot: Vector2, species_id: String, pose: String, scale: float) -> Vector2:
	var sz := Sprites.frame_size(species_id, pose)
	if sz == Vector2i.ZERO:
		return spot
	return Sprites.foot_clear_of(spot, sz, scale, _hp_panels(), PANEL_CLEARANCE)

func _spot(u: Dictionary) -> Vector2:
	# where a creature stands: yours close at the bottom left, the foe further off at the top right
	if u.side == "a":
		var k := allies.find(u)
		return [Vector2(112, 162), Vector2(50, 146), Vector2(168, 142)][k] if allies.size() > 1 else Vector2(100, 158)
	var i := foes.find(u)
	if foes.size() == 1:
		return Vector2(286, 92)
	return [Vector2(300, 96), Vector2(246, 86), Vector2(348, 84)][i]

## A mountain skyline from the area's colours in the game data: two ranges of ridges; steam from a spring in Emberfall,
## sharper peaks and banks of cloud up in Cloudglass.
const MOUNTAIN_AREAS := { "emberfall": Color(0.65, 0.54, 0.41, 0.35), "cloudglass": Color(0.62, 0.68, 0.72, 0.38) }
func _draw_highlands() -> void:
	var b: Dictionary = R.DATA.get("BIOMES", {}).get(area, {})
	var sky: Array = b.get("sky", ["#a6a6bf", "#efd0aa"])
	var top := Color(sky[0])
	var low := Color(sky[1])
	for i in 7:
		draw_rect(Rect2(0, i * 10, 384, 10), top.lerp(low, i / 6.0))
	var hill := Color(b.get("hill", "#81756d"))
	for layer in 2:
		var col := hill.lightened(0.18) if layer == 0 else hill
		var base := 52.0 if layer == 0 else 66.0
		for x in range(0, 384, 2):
			var h := 14.0 + sin(x * 0.021 + layer * 2.0) * 9.0 + sin(x * 0.067 + layer) * 4.0 + absf(sin(x * 0.013 + layer * 4.0)) * 10.0
			if area == "cloudglass":
				h += absf(fmod(x * 0.05 + layer * 3.0, 2.0) - 1.0) * 14.0           # the pass: sharper, higher peaks
			draw_rect(Rect2(x, base - h, 2, h + 2), col)
		if layer == 0 and area == "cloudglass":
			for k in 4:                                                           # snow on the far peaks, and a drifting bank of cloud
				draw_circle(Vector2(fmod(k * 110.0 + t * 6.0, 440.0) - 30.0, 30.0 + k % 2 * 10.0), 16.0, Color(0.95, 0.97, 0.99, 0.45))
		if layer == 0 and area == "emberfall":
			for k in 3:                                                           # steam behind the near ridge
				var ph := fmod(t * 0.2 + k / 3.0, 1.0)
				draw_circle(Vector2(232 + sin(t + k) * 4.0 + ph * 10.0, 50 - ph * 30.0), 3.0 + ph * 7.0, Color(1, 1, 1, 0.35 * (1.0 - ph)))

func _draw() -> void:
	if state == "off":
		return
	# the field: sky, a line of trees, grass (Ninja Adventure tiles), and the two platforms
	if MOUNTAIN_AREAS.has(area):
		_draw_highlands()
	else:
		draw_rect(Rect2(0, 0, 384, 70), Color("a8d0ea"))
		draw_rect(Rect2(0, 44, 384, 26), Color("c8e0ea"))
		for x in range(-8, 392, 30):
			draw_texture_rect_region(nature_tex, Rect2(x, 38 + (x / 30) % 2 * 4, 32, 32), Rect2(0 if (x / 30) % 3 else 32, 0, 32, 32))
	for y in range(64, 216, 16):
		for x in range(0, 384, 16):
			draw_texture_rect_region(floor_tex, Rect2(x, y, 16, 16), Rect2(16 * (11 + (x * 7 + y * 3) % 5), 192, 16, 16))
	if MOUNTAIN_AREAS.has(area):
		draw_rect(Rect2(0, 64, 384, 152), MOUNTAIN_AREAS[area])                    # the area's mountain turf
	for side in ["f", "a"]:
		var c := Vector2(286, 94) if side == "f" else Vector2(100, 160)
		var rx := 50.0 if side == "f" else 62.0
		_ellipse(c, rx, rx * 0.22, Color(0.25, 0.4, 0.2, 0.55))
		_ellipse(c + Vector2(0, -1), rx - 4, rx * 0.22 - 3, Color(0.45, 0.65, 0.32, 0.6))
	# the wild bond: colour floods out from your partner across the whole field, and stays warm while you're joined
	if flood_t >= 0.0 and (not joined.is_empty() or flood_t < 3.0):
		var from := _spot(joined) if not joined.is_empty() else Vector2(100, 150)
		var grow := clampf(flood_t / 1.2, 0.0, 1.0)
		var warm := (0.34 * (1.0 - grow) + 0.12) if not joined.is_empty() else 0.12 * (1.0 - (flood_t - 2.2) / 0.8)
		for k in 4:
			_ellipse(from, 30.0 + grow * 420.0 * (k + 1) / 4.0, (30.0 + grow * 420.0 * (k + 1) / 4.0) * 0.55, Color(1.0, 0.82, 0.45, maxf(0.0, warm) * 0.5))
	# the creatures
	var order: Array = foes + allies
	order.sort_custom(func(a, b): return _spot(a).y < _spot(b).y)       # back to front
	for u in order:
		if u.c.hp <= 0 and u.hit <= 0.0:
			continue
		var at := _spot(u)
		var dir := 1.0 if u.side == "a" else -1.0
		at.x += sin(clampf(u.lunge / 0.35, 0.0, 1.0) * PI) * 10.0 * dir
		if u.hit > 0.0:
			at.x += (2.0 if int(u.hit * 30.0) % 2 == 0 else -2.0)
			if int(u.hit * 20.0) % 2 == 0:
				continue                                          # a blink when hit (soft: no full-screen flash)
		var look: Dictionary = looks.get(u.c.sp, Figures.look_for(R.sp(u.c)))
		if u.c.get("gear", "") != "":
			look = look.duplicate()
			look.gear = u.c.gear
		var pose := { "wag": [1, 0, -1, 0][int(t * 6.0) % 4], "blink": fmod(t + at.x, 3.1) < 0.12, "ears_up": true,
			"crouch": 1 if u == wait_u else 0, "walking": u.lunge > 0.0, "frame": int(t * 12.0) % 4 }
		if u.get("joined", false):
			_draw_joined(u, at, pose, look)
			continue
		# Battle zooms in (your side closer than the foe) at a whole scale. The sprite's own pixels
		# already carry its size, so a tall one is moved clear of the health panels rather than shrunk.
		var zoom := 4.0 if u.side == "a" else 3.0
		var gear := str(u.c.get("gear", ""))
		var pose_name := "walk" if u.lunge > 0.0 else "idle"
		var foot := _painted_foot(at + Vector2(0, 6), str(u.c.sp), pose_name, zoom)
		if not Sprites.try_draw(self, str(u.c.sp), foot, u.side == "a", pose_name, int(t * 8.0), zoom, 0.0, gear):
			draw_set_transform(at - Vector2(9, 12) * zoom, 0, Vector2(zoom, zoom))
			Figures.paint(self, Vector2.ZERO, Figures.sized_parts(R.sp(u.c), u.side == "a", pose, look))
			draw_set_transform(Vector2.ZERO)
	for u in allies + foes:
		var status_line := Effects.label(u)
		if u.c.hp > 0 and status_line != "":
			var at := _spot(u) + Vector2(-38, -58)
			draw_rect(Rect2(at + Vector2(-2, -7), Vector2(80, 10)), PAPER)
			_text(status_line, at, 6, INK, 76, HORIZONTAL_ALIGNMENT_CENTER)
	for e in fx:
		var spec: Array = EL_FX[e.el]
		if not fx_tex.has(spec[0]):
			fx_tex[spec[0]] = load("res://assets/fx/%s.png" % spec[0])
		var tex: Texture2D = fx_tex[spec[0]]
		var fw: int = spec[1]
		var frame: int = mini(int(e.age / FX_FRAME), int(spec[2]) - 1)
		var size := Vector2(fw, tex.get_height())
		draw_texture_rect_region(tex, Rect2(_spot(e.u) + Vector2(0, -14) - size * 0.75, size * 1.5), Rect2(Vector2(frame * fw, 0), size), spec[3])
	for s in sparks:
		var c: Vector2 = _spot(s.u) + Vector2(0, -16)
		for k in 8:
			var a := k * TAU / 8.0
			var col: Color = s.col
			col.a = 1.0 - s.age / 0.6
			draw_rect(Rect2(c + Vector2(cos(a), sin(a)) * (4.0 + s.age * 40.0), Vector2(2, 2)), col)
	for f in floats:
		var c: Vector2 = _spot(f.u) + Vector2(0, -40 - f.age * 18.0)
		var col: Color = f.col
		col.a = 1.0 - maxf(0.0, f.age - 0.6) / 0.4
		_text(f.txt, c + Vector2(1, 1), 10, Color(0, 0, 0, col.a), 40, HORIZONTAL_ALIGNMENT_CENTER)
		_text(f.txt, c, 10, col, 40, HORIZONTAL_ALIGNMENT_CENTER)
	# health: the foe's box at the top left, yours beside your partner
	for i in foes.size():
		_info(foes[i], Rect2(10, 8 + i * 30, 150, 26), false)
	if allies.size() == 1:
		_info(allies[0], _ally_panel(), true)
	else:
		for i in allies.size():                                  # a compact line each, so the foe stays in view
			_info_line(allies[i], _ally_line_rect(i, allies.size()))
	if external_ui and state in ["choose", "moves", "orders"]:
		return
	_queue()
	if not tele.is_empty():
		_text("%s is gathering power! Guard!" % tele.u.c.name, Vector2(10, 70), 8, Color("c83a2a"))
	# the message box, and the commands on your turn
	var box := _command_box()
	_box(box)
	match state:
		"choose":
			_text("What will %s do?" % wait_u.c.name, Vector2(16, box.position.y + 16), 9, INK)
			_text("Orders ready: %d of 3  (Guard uses 1)" % int(orders), Vector2(16, box.position.y + 34), 7, Color("6a5a4a"))
			for i in MENU.size():
				var r := _menu_rect(i)
				var on := i == menu_i
				draw_rect(r, INK if on else Color("e8dcc4"))
				var word := menu_word(i)
				var dim: bool = command_dim(i)
				if word == "Stand with it" and not on:
					draw_rect(r, Color("f2d080"))         # lamplight: the one new thing on the page
				var baseline := (11.0 if word.length() > 7 else 12.0) if r.size.y <= 16.0 else r.size.y * 0.5 + 3.0
				_text(word, r.position + Vector2(0, baseline), 6 if word.length() > 7 else 8, (PAPER if on else INK) if not dim else Color("9a8a7a"), r.size.x, HORIZONTAL_ALIGNMENT_CENTER)
		"moves":
			var mv := R.moves_of(wait_u.c)
			for i in mv.size():
				var r := _move_rect(i)
				var on := i == move_i
				var m: Dictionary = R.DATA.MOVES[mv[i]]
				var resting: bool = wait_u.cds.get(mv[i], 0.0) > 0
				draw_rect(r, INK if on else Color("e8dcc4"))
				if m.get("el") != null:
					draw_rect(Rect2(r.position + Vector2(3, 5), Vector2(5, 6)), EL_COL.get(m.el, INK))
				var move_base := 12.0 if r.size.y <= 16.0 else r.size.y * 0.5 + 3.0
				_text(m.name, r.position + Vector2(11, move_base), 8, (PAPER if on else INK) if not resting else Color("9a8a7a"))
			var sel: Dictionary = R.DATA.MOVES[mv[move_i]]
			var desc := R.move_info(mv[move_i])
			var info_r := _detail_rect()
			draw_multiline_string(font, info_r.position + Vector2(4, 10), "%s: %s.%s" % [sel.name, desc,
				" Resting." if wait_u.cds.get(mv[move_i], 0.0) > 0 else ""], HORIZONTAL_ALIGNMENT_LEFT, info_r.size.x - 8, 7, -1, INK)
		"orders":
			var ol := known_orders()
			if ol.size() > 4:
				var nav_y := _order_nav_y()
				for button in [[12, "Previous"], [100, "Next"]]:
					draw_rect(Rect2(button[0], nav_y, 80, 16), INK)
					_text(button[1], Vector2(button[0] + 5, nav_y + 11), 7, PAPER)
			for i in range((order_i / 4) * 4, mini(ol.size(), (order_i / 4) * 4 + 4)):
				var r := _move_rect(i % 4)
				var on := i == order_i
				var o: Dictionary = ORDERS[ol[i]]
				var short: bool = orders < int(o.cost)
				draw_rect(r, INK if on else Color("e8dcc4"))
				var order_base := 12.0 if r.size.y <= 16.0 else r.size.y * 0.5 + 3.0
				_text("%s (%d)" % [o.name, int(o.cost)], r.position + Vector2(5, order_base), 8, (PAPER if on else INK) if not short else Color("9a8a7a"))
			var so: Dictionary = ORDERS[ol[order_i]]
			var oinfo := _detail_rect()
			draw_multiline_string(font, oinfo.position + Vector2(4, 10), "Page %d/%d. %s Orders ready: %d." % [order_i / 4 + 1, ceili(ol.size() / 4.0), so.text, int(orders)],
				HORIZONTAL_ALIGNMENT_LEFT, oinfo.size.x - 8, 7, -1, INK)
		"capture":
			_text("Calm %s: press when the marker is in the green." % cap.u.c.name, Vector2(16, 180), 8, INK)
			var bar := Rect2(16, 188, 352, 10)
			draw_rect(bar.grow(1), INK)
			draw_rect(bar, Color("d8ccb4"))
			draw_rect(Rect2(bar.position.x + bar.size.x * (cap.zone - 0.1), bar.position.y, bar.size.x * 0.2, bar.size.y), Color("9ad08a"))
			draw_rect(Rect2(bar.position.x + bar.size.x * (cap.zone - 0.04), bar.position.y, bar.size.x * 0.08, bar.size.y), Color("4aa84a"))
			draw_rect(Rect2(bar.position.x + bar.size.x * cap.pos - 1, bar.position.y - 3, 3, bar.size.y + 6), INK)
			_text("Lures left: %d" % int(bag.get("lures", 0)), Vector2(300, 180), 7, Color("6a5a4a"))
		"results":
			_box(Rect2(60, 30, 264, 124))
			_text("Battle results", Vector2(60, 48), 10, INK, 264, HORIZONTAL_ALIGNMENT_CENTER)
			var y := 64.0
			for line in results:
				draw_multiline_string(font, Vector2(76, y), line, HORIZONTAL_ALIGNMENT_LEFT, 232, 8, -1, INK)
				y += 13.0
			_text("Continue »", Vector2(60, 146), 8, Color("6a5a4a"), 264, HORIZONTAL_ALIGNMENT_CENTER)
			if not log_lines.is_empty():
				_text(log_lines[-1], Vector2(16, 182), 8, INK)
		_:
			var last := log_lines.slice(-2)
			for i in last.size():
				draw_multiline_string(font, Vector2(16, 180 + i * 14), last[i], HORIZONTAL_ALIGNMENT_LEFT, 352, 8, -1, INK if i == last.size() - 1 else Color("7a6a5a"))
	# the grey fog that rolls in at the start and out at the end (soft; never a flash)
	var fog := 0.0
	if state == "fog_in": fog = 1.0 - state_t
	elif state == "fog_out": fog = state_t
	if fog > 0.0:
		for k in 14:
			var cx := fmod(k * 61.0 + t * 30.0, 440.0) - 28.0
			var cy := fmod(k * 37.0, 230.0)
			draw_circle(Vector2(cx, cy), 60.0 + 30.0 * fog, Color(0.72, 0.74, 0.76, clampf(fog, 0.0, 1.0) * 0.5))
		draw_rect(Rect2(0, 0, 384, 216), Color(0.7, 0.72, 0.74, clampf(fog, 0.0, 1.0)))

## The joined form (the wild bond): you and your partner as one, you standing within its shape like living armour,
## a lamplight edge around you both and motes of colour rising. Larger than either of you alone.
func _draw_joined(u: Dictionary, at: Vector2, pose: Dictionary, look: Dictionary) -> void:
	var glow := 0.5 + 0.5 * sin(t * 4.0)
	for k in 3:                                  # a lamplight halo, brightest at the heart
		_ellipse(at + Vector2(0, -30), 58.0 - k * 14.0 + glow * 3.0, 50.0 - k * 12.0 + glow * 3.0, Color(1.0, 0.86, 0.52, 0.16 + k * 0.08))
	var sc := 5.0
	var foot := _painted_foot(at + Vector2(0, 8), str(u.c.sp), "idle", sc)
	if not Sprites.try_draw(self, str(u.c.sp), foot, true, "idle", 0, sc, 0.0, str(u.c.get("gear", ""))):
		draw_set_transform(at - Vector2(9, 12) * sc, 0, Vector2(sc, sc))
		Figures.paint(self, Vector2.ZERO, Figures.sized_parts(R.sp(u.c), true, pose, look))
		draw_set_transform(Vector2.ZERO)
	if not tamer_look.is_empty():
		draw_set_transform(at + Vector2(-26, -70), 0, Vector2(2.4, 2.4))   # you, within its shape, facing the foe with it
		Figures.person(self, Vector2.ZERO, Vector2i.RIGHT, false, 0, false, tamer_look)
		draw_set_transform(Vector2.ZERO)
	for k in 9:
		var ph := fmod(t * 0.7 + k * 0.37, 1.0)
		var mx := at.x - 44.0 + fmod(k * 23.0, 88.0)
		draw_rect(Rect2(mx, at.y - 10.0 - ph * 80.0, 2, 2), Color(1.0, 0.9, 0.55, 1.0 - ph))

func _ellipse(c: Vector2, rx: float, ry: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for k in 24:
		var a := k * TAU / 24.0
		pts.append(c + Vector2(cos(a) * rx, sin(a) * ry))
	draw_colored_polygon(pts, col)

func _info(u: Dictionary, r: Rect2, mine: bool) -> void:
	_box(r)
	var s: Dictionary = R.sp(u.c)
	_text(u.c.name, r.position + Vector2(5, 10), 8, INK)
	_text("Lv %d" % u.c.lvl, r.position + Vector2(r.size.x - 34, 10), 8, INK, 30, HORIZONTAL_ALIGNMENT_RIGHT)
	draw_rect(Rect2(r.position + Vector2(5, 14), Vector2(4, 4)), EL_COL.get(s.el, INK))
	var bar := Rect2(r.position + Vector2(24, 14), Vector2(r.size.x - 30, 5))
	draw_rect(bar.grow(1), INK)
	draw_rect(bar, Color("4a3a3a"))
	var f := clampf(u.shown / u.st.hp, 0.0, 1.0)
	var col := Color("5cc85a") if f > 0.5 else (Color("e8c03a") if f > 0.2 else Color("e0503a"))
	draw_rect(Rect2(bar.position, Vector2(bar.size.x * f, bar.size.y)), col)
	_text("HP", r.position + Vector2(12, 19), 5, INK)
	if mine:
		_text("%d / %d" % [roundi(u.shown), u.st.hp], r.position + Vector2(24, 29), 7, INK)
		var xr := Rect2(r.position + Vector2(80, 25), Vector2(r.size.x - 86, 3))
		draw_rect(xr, Color("d8ccb4"))
		draw_rect(Rect2(xr.position, Vector2(xr.size.x * clampf(float(u.c.xp) / R.xp_need(u.c.lvl), 0.0, 1.0), xr.size.y)), Color("4a8ad8"))

## The next few turns, without touching the real turn meters.
func upcoming() -> Array:
	var sim: Array = []
	for u in allies + foes:
		if u.c.hp > 0:
			sim.append({ "u": u, "atb": u.atb, "rate": maxf(0.01, R.atb_rate(u)) })
	var order: Array = []
	if sim.is_empty():
		return order
	for n in 4:
		var best: Dictionary = sim[0]
		var best_t := INF
		for s in sim:
			var tt: float = (R.ACT_AT - s.atb) / s.rate
			if tt < best_t:
				best_t = tt
				best = s
		for s in sim:
			s.atb += best_t * s.rate
		best.atb = 0.0
		order.append(best.u)
	return order

func next_names() -> PackedStringArray:
	var labels := PackedStringArray()
	for u in upcoming():
		labels.append(str(u.c.name))
	return labels

func next_sides() -> PackedStringArray:
	var sides := PackedStringArray()
	for u in upcoming():
		sides.append(str(u.side))
	return sides

## A command that can be tapped but will not do the thing yet (no orders, no lure, a tamer blocking the way).
func command_dim(i: int) -> bool:
	var word := menu_word(i)
	return (word == "Guard" and orders < 1.0) or (word == "Orders" and orders < 1.0) or (word in ["Run", "Bond"] and kind != "wild") or (word == "Bond" and int(bag.get("lures", 0)) <= 0) or (word == "Bag" and int(bag.get("berries", 0)) <= 0)

## The upright deck's button. `i` is the command, the move, or the order.
func deck_press(i: int) -> void:
	match state:
		"choose":
			if i >= 0 and i < MENU.size():
				menu_i = i
				_choose(i)
		"moves":
			var mv: Array = R.moves_of(wait_u.c)
			if i >= 0 and i < mv.size():
				if i == move_i:
					_use_move(mv[i])
				else:
					move_i = i
		"orders":
			var ol: Array = known_orders()
			if i >= 0 and i < ol.size():
				if i == order_i:
					if use_order(ol[i]):
						_go_to("choose")
				else:
					order_i = i
		"capture":
			_calm()
		"beat":
			state_t = beat_t
		"results":
			if state_t > 0.5:
				_go_to("fog_out")

func _queue() -> void:
	var order := upcoming()
	if order.is_empty():
		return
	var labels := PackedStringArray()
	for u in order:
		labels.append(str(u.c.name))
	var chips: Dictionary = _chip_boxes(labels)
	var chip_size: int = int(chips["font"])
	var rects: Array = chips["rects"]
	var shown: PackedStringArray = chips["labels"] if chips.has("labels") else labels
	if _view_scale() >= 2.0:
		_text("Next:", Vector2(166, 7.0 + chip_size + 1.0), chip_size, INK)
	for i in rects.size():
		var r: Rect2 = rects[i]
		var lab := shown[i] if i < shown.size() else ""
		var ally := i < order.size() and str(order[i].side) == "a" and not lab.begins_with("+")
		var fill := Color("e6dcc6") if lab.begins_with("+") else (Color("435a78") if ally else Color("8e342c"))
		var word := Color("1e1a22") if lab.begins_with("+") else Color("f4eddc")
		draw_rect(r.grow(1), Color("1e1a22"))
		draw_rect(r, fill)
		var baseline := r.position.y + (r.size.y + float(chip_size)) * 0.5
		_text(lab, Vector2(r.position.x + 8.0, baseline), chip_size, word, r.size.x - 16.0)

# ---------------------------------------------------------------- bonding with a wild creature (calmNow)
func _calm() -> void:
	var off := absf(float(cap.pos) - float(cap.zone))
	var q := "perfect" if off < 0.04 else ("good" if off < 0.1 else "miss")
	var u: Dictionary = cap.u
	var c: Dictionary = u.c
	var hp_pct: float = float(c.hp) / u.st.hp
	var base: float = 0.12 if R.sp(c).get("unique", false) else [0.55, 0.42, 0.3, 0.2, 0.1, 0.05][int(c.rar)]
	var ch: float = base * (1.5 - hp_pct) * (1.6 if q == "perfect" else (1.3 if q == "good" else 1.0))
	if heritage == "farm" and str(R.sp(c).el) in ["Grove", "Gale"]:
		ch *= 1.2                                   # farmfolk: field and forest creatures trust you a little sooner
	for a in allies:
		if "gentle" in a.c.traits:
			ch *= 1.15
			break
	cap = {}
	if rng.randf() < minf(0.95, ch):
		sparks.append({ "u": u, "col": Color("7cf08a"), "age": 0.0 })
		foes.erase(u)
		caught.append(c)
		_sfx("bond")
		say("%s%s trusts you. It chose to come with you!" % ["Perfect calm! " if q == "perfect" else ("Nicely done. " if q == "good" else ""), c.name])
		if living("f").is_empty():
			_end("caught")
			return
	else:
		say("%s%s broke free!" % ["It shies away. " if q == "miss" else "", c.name])
		_sfx("warn")
	_go_to("choose" if not wait_u.is_empty() else "run")

## One of your creatures on a single compact line (when your team has more than one): name, level, health.
func _info_line(u: Dictionary, r: Rect2) -> void:
	_box(r)
	_text(u.c.name, r.position + Vector2(5, 9), 7, INK)
	_text("Lv %d" % u.c.lvl, r.position + Vector2(r.size.x - 30, 9), 7, INK, 26, HORIZONTAL_ALIGNMENT_RIGHT)
	var bar := Rect2(r.position + Vector2(5, 12), Vector2(r.size.x - 50, 4))
	draw_rect(bar.grow(1), INK)
	draw_rect(bar, Color("4a3a3a"))
	var f := clampf(u.shown / u.st.hp, 0.0, 1.0)
	draw_rect(Rect2(bar.position, Vector2(bar.size.x * f, bar.size.y)), Color("5cc85a") if f > 0.5 else (Color("e8c03a") if f > 0.2 else Color("e0503a")))
	_text("%d/%d" % [roundi(u.shown), u.st.hp], r.position + Vector2(r.size.x - 42, 17), 6, INK, 38, HORIZONTAL_ALIGNMENT_RIGHT)

## A name for the message box: a wild creature that shares a name with one of yours is "Wild ..." so you can tell them apart.
func nm(u: Dictionary) -> String:
	if u.side == "f" and kind == "wild":
		for a in allies:
			if a.c.name == u.c.name:
				return "Wild " + u.c.name
	return u.c.name
