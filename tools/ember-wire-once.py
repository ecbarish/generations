
from pathlib import Path

def once(path, old, new):
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(path + " count " + str(count))
    file.write_text(text.replace(old, new, 1))

css = Path("games/briskets-crossing/style.css").read_text().replace("--amber:#ffce72", "--amber:#ffb15a", 1)
Path("games/ember-bricks/style.css").write_text(css)

once(
    "launcher/games.js",
    "   controls:'Arrows or W/A/S/D hop · Space hops toward the lanterns · P pauses. Touch buttons, taps and USB gamepads work too. Two players take turns on one device.'},\n  {id:'little-ranch'",
    "   controls:'Arrows or W/A/S/D hop · Space hops toward the lanterns · P pauses. Touch buttons, taps and USB gamepads work too. Two players take turns on one device.'},\n"
    "  {id:'ember-bricks',title:'Ember Bricks',tcls:'t-mmo',status:['Test version','s-proto'],href:'games/ember-bricks/index.html',\n"
    "   blurb:'Keep a coal in the air with a baker\\'s peel until every brick in the commons kiln is glowing.',\n"
    "   tags:['Arcade cabinet','High scores','Two-player turns'],cover:'ember',kind:'different',\n"
    "   goal:'Light every brick. A coal that falls past the peel costs a life, and the darker hearth bricks take two hits.',\n"
    "   controls:'Arrows or A/D move the peel · Space sends the coal · P pauses. Touch buttons, taps and USB gamepads work too. Two players take turns on one device.'},\n"
    "  {id:'little-ranch'",
)
once(
    "index.html",
    "const items=[...document.querySelectorAll('canvas[data-cover]')]",
    "covers.ember=function(c,w,h,t){c.fillStyle='#2a140e';c.fillRect(0,0,w,h);c.fillStyle='#4a2a1c';c.fillRect(w*.08,h*.14,w*.84,h*.46);for(let row=0;row<4;row++)for(let col=0;col<8;col++){c.fillStyle=row===1&&col>2&&col<6?'#5a241c':'#c45a3a';c.fillRect(w*(.12+col*.1),h*(.18+row*.09),w*.08,h*.06);}const x=w*(.5+Math.sin(t)*.2);c.fillStyle='#c4a574';c.fillRect(x-w*.12,h*.78,w*.24,h*.04);c.fillStyle='#8a5a32';c.fillRect(x-3,h*.82,6,h*.06);c.fillStyle='#ff7a22';c.beginPath();c.arc(x,h*(.64-Math.abs(Math.sin(t*3))*.12),6,0,7);c.fill();c.fillStyle='#ffe08a';c.fillRect(x-1,h*(.64-Math.abs(Math.sin(t*3))*.12)-1,2,2);};\n"
    "const items=[...document.querySelectorAll('canvas[data-cover]')]",
)
once(
    "tests/tell-us.html",
    "['../games/briskets-crossing/index.html',\"Brisket's Crossing\"]",
    "['../games/briskets-crossing/index.html',\"Brisket's Crossing\"],['../games/ember-bricks/index.html','Ember Bricks']",
)
once("tools/run-all-checks.cjs", "'briskets-crossing','little-ranch'", "'briskets-crossing','ember-bricks','little-ranch'")
for name in ["bug.yml", "feedback.yml", "suggestion.yml"]:
    once(".github/ISSUE_TEMPLATE/" + name, '"Brisket\'s Crossing", Primordial', '"Brisket\'s Crossing", Ember Bricks, Primordial')
once(
    "README.md",
    "- Brisket's Crossing v0.1.0 (2026-10-10, AC3):",
    "- Ember Bricks v0.1.0 (2026-10-11, AC3): keep a coal off a baker's peel until the commons kiln is lit. [Play](games/ember-bricks/) · claimed on `guest/ember-bricks`, not merged. Hub stays v1.5.1. Brisket's Crossing is a separate cabinet.\n- Brisket's Crossing v0.1.0 (2026-10-10, AC3):",
)
once("docs/DEVELOPMENT-PATH.md", "Ember Bricks is still free.", "Ember Bricks is claimed (Grok for Adam / abarish-dev, 2026-10-11, `guest/ember-bricks`).")
once(
    "docs/DEVELOPMENT-PATH.md",
    "- **2026-10-11, AC3 merge:**",
    "- **2026-10-11, AC3 Ember Bricks:** the Breakout shape is its own cabinet and its own pull request. Leave the shared AC3 checkbox open until that cabinet is merged too.\n\n- **2026-10-11, AC3 merge:**",
)
once(
    "docs/COMMS.md",
    "## Messages\n\n",
    "## Messages\n\n### 2026-10-11 14:45, Grok (Adam / abarish-dev) to all\nEmber Bricks (AC3, the Breakout shape) is claimed on `guest/ember-bricks`. One cabinet, one pull request. A coal stays off a baker's peel until the commons kiln is lit. Brisket's Crossing stays merged. The hub stays v1.5.1. Draft #180 is not this work.\n\n",
)
once(
    "START-HERE.md",
    "## Session log (newest first; one or two lines each)\n\n",
    "## Session log (newest first; one or two lines each)\n\n- 2026-10-11 — Grok (Adam / abarish-dev, guest): claimed AC3 Ember Bricks on `guest/ember-bricks`. The Breakout-shaped cabinet only. Brisket's Crossing stays merged. No hub bump.\n\n",
)
dev = Path("docs/DEVELOPMENT-PATH.md").read_text()
if "- [x] AC3" in dev or "- [ ] AC3" not in dev:
    raise SystemExit("checkbox")
print("wire ok")
