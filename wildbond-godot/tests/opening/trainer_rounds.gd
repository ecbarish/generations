extends "res://tests/journey/rounds.gd"
func validate(action: Dictionary) -> String:
	if action.get("kind") in ["catch","run"]: return "This is a friendly trainer battle. Choose a move, partner or item."
	return super.validate(action)
