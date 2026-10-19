"""Measure alpha and source geometry only; PNG bytes remain unchanged."""
import importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
spec=importlib.util.spec_from_file_location("family_measure",REPO/"wildbond-godot/tests/tide_ember_family/measure_frames.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.ROOT=ROOT
entry=module.measure("mega_tidewyrm_simple","family-mega-v1.png",1.1,True)
step=max(max(frame["ink"][3]/64,frame["ink"][2]/80) for frame in entry["frames"])
for frame in entry["frames"]:frame["sample_step"]=round(step,5)
entry["palette"]=["102238","104574","176eab","2db6d4","77d3e6","b9ebf2","f4fbff","fff0b7","d5c494","a4935a","edb943","ab702d","172f53","3b8fbd","fffdf3","ddcb8b"]
data={"mega_tidewyrm_simple":entry}
wing=json.loads((REPO/"wildbond-godot/tests/tide_ember_family/assets/mega_tidewyrm/frames.json").read_text(encoding="utf-8"))["mega_tidewyrm"]
wing["file"]="source/wing-native.png"
data["mega_tidewyrm_clean"]=wing
(ROOT/"source-frames.json").write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8",newline="\n")
print("Measured two complete source silhouettes.")
