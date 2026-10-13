## The turning year (WS1, docs/proposals/seasons-and-holidays.md). Shared rules for the Godot games: the world keeps
## its own calendar (time moves only while you play), or follows the real one, or holds one season. A season is thirty
## days; a day is five minutes of play, so a season is two and a half hours and a year passes over a full journey.
## Starfall copies this file as it is.
extends RefCounted

const SEASONS := ["spring", "summer", "autumn", "winter"]
const NAMES := { "spring": "Spring", "summer": "Summer", "autumn": "Autumn", "winter": "Winter" }
const DAYS := 30                            # days in a season
const DAY_SECONDS := 300.0                  # seconds of play in a day
## The four festivals, one a season: [season, first day, last day] on the world's calendar, and
## [month, first day, last day] on the real one (the Midwinter Hearth lands in late December).
const FESTIVALS := {
	"planting": { "name": "Planting Day", "season": "spring", "days": [10, 12], "real": [3, 20, 22] },
	"longlight": { "name": "the Long Light", "season": "summer", "days": [15, 17], "real": [6, 20, 22] },
	"lanterns": { "name": "the Harvest Lanterns", "season": "autumn", "days": [20, 22], "real": [10, 28, 31] },
	"midwinter": { "name": "the Midwinter Hearth", "season": "winter", "days": [24, 28], "real": [12, 20, 31] },
}
const MODES := ["world", "real", "spring", "summer", "autumn", "winter"]   # the last four hold that season

var played := 0.0                           # seconds of play so far (the world's calendar)
var mode := "world"
var south := false                          # the real calendar in the southern hemisphere (seasons swapped)
var today := {}                             # for checks: a fixed real date { month, day }; empty means the clock

func advance(dt: float) -> void:
	played += dt

## The real date (or the fixed one the checks set).
func _real() -> Dictionary:
	if not today.is_empty():
		return today
	var d := Time.get_date_dict_from_system()
	return { "month": int(d.month), "day": int(d.day) }

func season() -> String:
	if mode in SEASONS:
		return mode
	if mode == "real":
		var m := int(_real().month)
		var i := ((m % 12) / 3 + 3) % 4             # Dec-Feb winter (3), Mar-May spring (0), Jun-Aug summer (1), Sep-Nov autumn (2)
		if south:
			i = (i + 2) % 4
		return SEASONS[i]
	return SEASONS[int(played / (DAY_SECONDS * DAYS)) % 4]

## The day of the season, 1 to 30.
func day() -> int:
	if mode == "real":
		var r := _real()
		var into := ((int(r.month) - 3 + 12) % 3) * 30 + int(r.day) - 1     # days since the season's first month began
		return clampi(into / 3 + 1, 1, DAYS)
	if mode in SEASONS:
		return 15
	return int(fmod(played, DAY_SECONDS * DAYS) / DAY_SECONDS) + 1

## In full words, for the field book: "Late Spring, day 24".
func date_text() -> String:
	var d := day()
	var part := "Early" if d <= 10 else ("Mid" if d <= 20 else "Late")
	if mode in SEASONS:
		return "Always %s" % NAMES[season()].to_lower()
	return "%s %s, day %d" % [part, NAMES[season()].to_lower(), d]

func mode_text() -> String:
	match mode:
		"world": return "the world's own calendar"
		"real": return "the real calendar"
	return "one season held"

## The festival on today, if any ("" otherwise).
func festival() -> String:
	for id in FESTIVALS:
		var f: Dictionary = FESTIVALS[id]
		if mode == "real":
			var r := _real()
			var at: Array = f.real
			if int(r.month) == int(at[0]) and int(r.day) >= int(at[1]) and int(r.day) <= int(at[2]):
				return id
		elif mode == "world" and season() == f.season and day() >= int(f.days[0]) and day() <= int(f.days[1]):
			return id
	return ""

## Which year it is (festivals are done once a year): the world's own count, or the real year.
func year() -> int:
	if mode == "real":
		return int(today.get("year", Time.get_date_dict_from_system().year))
	return int(played / (DAY_SECONDS * DAYS * 4))

func next_mode() -> void:
	mode = MODES[(MODES.find(mode) + 1) % MODES.size()]

## CR5: time of day, derived from play time. A day is DAY_SECONDS long;
## dawn/day/dusk/night each get a quarter. Used for evolution conditions.
func time_of_day() -> String:
	var frac := fmod(played, DAY_SECONDS) / DAY_SECONDS
	if frac < 0.25:
		return "dawn"
	elif frac < 0.5:
		return "day"
	elif frac < 0.75:
		return "dusk"
	else:
		return "night"

## CR5: the day's weather, seeded by day+season so it's stable all day.
## Used for evolution conditions; surfaced in the field book.
func weather() -> String:
	var s := season()
	var d := day()
	var seed := hash("%s-%d" % [s, d])
	var roll: int = abs(seed) % 100
	match s:
		"spring":
			return "rain" if roll < 30 else "clear"
		"summer":
			return "wind" if roll < 20 else "clear"
		"autumn":
			if roll < 25: return "rain"
			elif roll < 40: return "wind"
			else: return "clear"
		"winter":
			return "snow" if roll < 35 else "clear"
	return "clear"

func to_dict() -> Dictionary:
	return { "played": played, "mode": mode, "south": south }

func from_dict(d: Dictionary) -> void:
	played = float(d.get("played", 0.0))
	mode = str(d.get("mode", "world")) if str(d.get("mode", "world")) in MODES else "world"
	south = bool(d.get("south", false))
