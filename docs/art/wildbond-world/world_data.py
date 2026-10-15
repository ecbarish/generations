"""Wildbond world concept map: one data file for the schematic, the prompt sheet and the label overlay.

Every name and connection comes from docs/plans/wildbond-world-design.md (PR #455 at 66647dc9, its final approved head; the map itself is unchanged
since c47af4fa, bf4c7f1e adds a site for every Legend in section 2's Legend table, and 66647dc9 changes only heights and the cave brief),
section 2 ("The connected map", routes 1-20, towns, caves, water routes, loops, guardians) and section 1
(field lessons). Region membership follows docs/research/wildbond-world-references.md (#452, section 5
"Regions") after #455's renames. Legends come from the creature catalogue (tier = Legend).
Positions are schematic planning positions on a 1920x1080 canvas (map area x < 1460), north up.
Compass hints come from #455 "Where the valley is today" (How you leave) and section 2.
"""

# ---- the 8 Warden regions (#452 section 5, one badge each). fill = a shade from wildbond-art-direction.md section 3
REGIONS = [
    dict(id="thornwood", name="Thornwood", badge="Thorn Badge", warden="Isolde",
         fill="#3f8558", poly=[(30, 560), (430, 560), (430, 850), (30, 850)]),
    dict(id="saltmarsh", name="Saltmarsh Coast", badge="Tide Badge", warden="Nerys",
         fill="#e0c896", poly=[(30, 195), (390, 195), (390, 550), (30, 550)]),
    dict(id="emberfall", name="Emberfall Highlands", badge="Ember Badge", warden="Toren",
         fill="#ab463a", poly=[(400, 420), (690, 420), (690, 760), (400, 760)]),
    dict(id="cloudglass", name="Cloudglass Pass", badge="Beacon Badge", warden="Vessa",
         fill="#7290ad", poly=[(520, 195), (830, 195), (830, 410), (520, 410)]),
    dict(id="stillreed", name="Stillreed Basin", badge="Reed Badge", warden="Olan",
         fill="#4a84a2", poly=[(700, 420), (1015, 420), (1015, 760), (700, 760)]),
    dict(id="hollowecho", name="Hollowecho Hills", badge="Echo Badge", warden="Senna",
         fill="#56708f", poly=[(760, 770), (1140, 770), (1140, 1050), (760, 1050)]),
    dict(id="sunthread", name="Sunthread Commons", badge="Loom Badge", warden="Halen",
         fill="#7cb86c", poly=[(1025, 420), (1300, 420), (1300, 760), (1025, 760)]),
    dict(id="farwatch", name="Farwatch Reach", badge="Horizon Badge", warden="Rysa",
         fill="#cfc4ac", poly=[(1100, 195), (1450, 195), (1450, 410), (1100, 410)]),
]
# Two zones #452 also lists as rows but which hold no Warden (see the conflicts list).
ZONES = [
    dict(id="larkhaven", name="Larkhaven (home)", fill="#dcc092",
         poly=[(30, 860), (420, 860), (420, 1050), (30, 1050)]),
    dict(id="league", name="League and Spire", fill="#f4eddc",
         poly=[(1150, 20), (1450, 20), (1450, 185), (1150, 185)]),
]
SEA = dict(name="the sea", fill="#2f5f7e", poly=[(0, 0), (1140, 0), (1140, 185), (0, 185)])

# ---- places. kind: town | place | cave | site | side | waypoint
P = {}
def place(pid, name, kind, region, x, y, map_id=None, note=""):
    P[pid] = dict(id=pid, name=name, kind=kind, region=region, x=x, y=y, map=map_id, note=note)

# towns (10, #455 "Towns (10)")
place("larkhaven", "Larkhaven", "town", "larkhaven", 200, 960, "larkhaven", "Healer Old Ned")
place("thornwood", "Thornwood", "town", "thornwood", 170, 630, "thornwood", "Healer Hedda (proposed); the Gate Loft")
place("lanternquay", "Lantern Quay", "town", "saltmarsh", 110, 290, None, "New, at the end of Wrackline; healer Perrin (proposed)")
place("warmstep", "Warmstep", "town", "emberfall", 590, 520, "emberfall", "The existing highland screen; healer Hest (proposed)")
place("highlatch", "Highlatch", "town", "cloudglass", 640, 340, "cloudglass", "The existing pass; healer Yarrow (proposed)")
place("reedhold", "Reedhold", "town", "stillreed", 880, 560, "stillreed", "The hub; healer Juna (proposed); the only new full shop")
place("bellstep", "Bellstep", "town", "hollowecho", 900, 880, "hollowecho", "Healer Iren (proposed), in the bell house")
place("threadmeet", "Threadmeet", "town", "sunthread", 1160, 560, "sunthread", "Healer Solla (proposed), in the meeting hall")
place("highwatch", "The High Watch", "town", "farwatch", 1300, 310, "farwatch", "Healer Quen (proposed), the ledger house")
place("league", "Returning Light League", "town", "league", 1350, 75, "league", "Nelva, already the league keeper")

# other existing or named places
place("oldrootgrove", "Old Root Grove", "place", "thornwood", 340, 790, "thornwood_grove", "Pocket; any Stone partner may enter")
place("saltmarshcoast", "Saltmarsh Coast", "place", "saltmarsh", 220, 380, "saltmarsh", "Existing coast screen (not a town in #455)")
place("moonpool", "Moon Pool", "place", "saltmarsh", 70, 470, "saltmarsh_pool", "Pocket; any Tide partner may enter")
place("outershoal", "Outer Shoal", "place", "farwatch", 980, 95, None, "Low sand island, one shelter, no town")
place("spire", "The Lighthouse Spire", "place", "league", 1200, 80, "spire", "Orla's floors; west of the league")
place("greymill", "Greymill", "side", "sunthread", 1250, 700, None, "Side door off Threadmeet; Hush opens the door")

# caves (7, #455 "Caves and depths (7)")
place("answering", "The Answering Ways", "cave", "hollowecho", 1070, 960, None, "The first cave a player enters")
place("knothollow", "Knothollow", "cave", "thornwood", 350, 630, None, "Supply cave; comes out in Thornwood's country")
place("keelcave", "Keelcave", "cave", "saltmarsh", 470, 70, None, "Off Greywash Sound; a short dry cave")
place("kilnvent", "Kilnvent", "cave", "emberfall", 470, 650, None, "Mouth on Ashstair; far door onto Sootpath")
place("larkburrow", "Larkburrow", "cave", "larkhaven", 70, 940, None, "Mouth on Millgrass Lane; through to the back of Threadmeet late")
place("lowbell", "Lowbell", "cave", "stillreed", 930, 710, None, "Under The Quiet Channels; the bell")
place("trialstair", "Trialstair", "cave", "league", 1400, 140, None, "The last cave, using every field lesson")

# legendary sites (catalogue tier = Legend; placed only where #455 places them)
place("lampcrown", "Lampcrown", "site", "cloudglass", 760, 240, None, "Open summit under Lanterncrest's sky; the last stair needs Daymark")
place("meadowground", "Threadmeet nursery", "site", "sunthread", 1250, 470, None, "Outdoors, beside the nursery gate (Grove Wake)")
place("eldertrees", "Oldest trees", "site", "thornwood", 395, 760, None, "Old Root Grove, the side a Stone partner can already walk; not behind Grove Wake")
place("wracklinebeach", "Wrackline beach", "site", "saltmarsh", 255, 315, None, "Where the tide draws back; outdoors")
place("springterrace", "Spring terrace", "site", "emberfall", 600, 610, None, "Warmstep's spring terrace; outdoors")
place("jetty", "Reedhold jetty", "site", "stillreed", 960, 610, None, "The surface crossing")
place("firstbend", "First bend", "site", "hollowecho", 1120, 1005, None, "The first bend of the Answering Ways, where the call carries")
place("harborlight", "Harbor light", "site", "farwatch", 1180, 245, None, "On Seaward Ledge, the mooring the Farwatch scene already uses")
place("nestledge", "Nest ledge", "site", "hollowecho", 940, 815, None, "On The Late Path's night path, after Hush")

# route waypoints (branch points, not places)
place("w_trail", "", "waypoint", "thornwood", 185, 800)
place("w_road", "", "waypoint", "saltmarsh", 190, 500)
place("w_ash", "", "waypoint", "emberfall", 420, 470)
place("w_soot", "", "waypoint", "emberfall", 620, 430)
place("w_boards", "", "waypoint", "stillreed", 740, 640)
place("w_passfoot", "", "waypoint", "stillreed", 750, 470)
place("w_fen", "", "waypoint", "stillreed", 1010, 540)
place("w_lip", "", "waypoint", "saltmarsh", 50, 190)
place("w_ledge", "", "waypoint", "farwatch", 1130, 200)

# ---- routes 1-20 (#455 "Routes (20)"), as polylines through place ids
ROUTES = [
    (1, "thornwood_route", "Thornwood Trail", ["larkhaven", "w_trail", "thornwood"], "Exists"),
    (2, "millgrass", "Millgrass Lane", ["larkhaven", "larkburrow"], "Larkhaven west to the Larkburrow mouth"),
    (3, "dewcut", "Dewcut", ["w_trail", "oldrootgrove"], "A short meadow off the trail to the Old Root Grove shelf"),
    (4, "rootwater", "Rootwater Path", ["thornwood", "knothollow"], "Thornwood to Knothollow"),
    (5, "saltmarsh_route", "Saltmarsh Road", ["thornwood", "w_road", "saltmarshcoast"], "Exists; Moon Pool on its west side"),
    (6, "wrackline", "Wrackline", ["saltmarshcoast", "lanternquay"], "With the early pier"),
    (7, "ashstair", "Ashstair", ["saltmarshcoast", "w_ash", "warmstep"], "The Kilnvent mouth is on this climb; asks for the Tide Badge"),
    (8, "sootpath", "Sootpath", ["warmstep", "w_soot", "highlatch"], "The vent's far door can open here"),
    (9, "passfoot", "Pass Foot", ["highlatch", "w_passfoot", "reedhold"], "Both ways"),
    (10, "glassfall", "Glassfall", ["highlatch", "reedhold"], "Down only, after Glide"),
    (11, "crestpath", "Crest Path", ["highlatch", "lampcrown"], "Up to Lampcrown"),
    (12, "longboards", "The Long Boards", ["reedhold", "w_boards"], "Toward the west boardwalk and the Dry Boards"),
    (13, "orchardfen", "Orchard Fen", ["reedhold", "w_fen", "threadmeet"], "A rockfall branch returns to Sootpath after Stone Break"),
    (14, "latepath", "The Late Path", ["reedhold", "bellstep"], "A Hush night path with a carving"),
    (15, "flintcut", "Flintcut", ["bellstep", "answering"], "Bellstep to the Answering Ways"),
    (16, "ribbonroad", "Ribbon Road", ["bellstep", "threadmeet"], "The hills and the commons meet twice"),
    (17, "sheltermile", "Shelter Mile", ["threadmeet", "highwatch"], "Threadmeet to the High Watch"),
    (18, "chartroad", "Chart Road", ["highwatch"], "A loop of lookout ground off the High Watch, back to itself"),
    (19, "seaward", "Seaward Ledge", ["highwatch", "w_ledge"], "Down to the pier and The Open Grey"),
    (20, "trialroad", "Trial Road", ["highwatch", "trialstair", "league"], "Trialstair is inserted in phase 6"),
]
# connections that are not numbered routes
LINKS = [
    dict(kind="water", id="greywash", name="Greywash Sound", path=["lanternquay", "keelcave", "outershoal"], note="W1, Tide Ride; Keelcave opens off it; reaches The Open Grey"),
    dict(kind="water", id="greywash_lip", name="", path=["moonpool", "w_lip", "lanternquay"], note="Moon Pool's far lip joins Greywash Sound (Tide Ride)"),
    dict(kind="water", id="opengrey", name="The Open Grey", path=["w_ledge", "outershoal"], note="W3, Tide Ride; Seaward Ledge to Outer Shoal and the far end of Greywash"),
    dict(kind="water", id="quietchannels", name="The Quiet Channels", path=["reedhold", "lowbell"], note="W2, Tide Ride; Reedhold's jetty to Lowbell"),
    dict(kind="passage", id="dryboards", name="The Dry Boards", path=["w_boards", "w_passfoot"], note="A passage inside the Long Boards, not a route and not a cave"),
    dict(kind="pocket", id="moonpool_in", name="", path=["w_road", "moonpool"], note="West, any Tide partner (existing check)"),
    dict(kind="cave", id="kilnvent_mouth", name="", path=["w_ash", "kilnvent"], note="The Kilnvent mouth on Ashstair"),
    dict(kind="cave", id="kilnvent_far", name="", path=["kilnvent", "w_soot"], note="The far door onto Sootpath (Lantern)"),
    dict(kind="grove", id="grovewake", name="", path=["oldrootgrove", "knothollow"], note="Old Root Grove's back ring opens into Knothollow (Grove Wake)"),
    dict(kind="chord", id="rockfall", name="Orchard Fen rockfall", path=["w_fen", "w_soot"], note="Stone Break, once both ends are walked"),
    dict(kind="burrow", id="burrow", name="Larkburrow through-path", path=["larkburrow", "threadmeet"], note="Stone Break and the Loom Badge"),
    dict(kind="walk", id="spire", name="", path=["league", "spire"], note="West, after the Champion ending"),
    dict(kind="walk", id="greymill_door", name="", path=["threadmeet", "greymill"], note="A side door off Threadmeet"),
    dict(kind="walk", id="nursery", name="", path=["threadmeet", "meadowground"], note="The nursery gate (Grove Wake)"),
]
WATER_ROUTES = ["greywash", "quietchannels", "opengrey"]

# ---- gates (#455 section 1 table). type: stone | tide | lantern | glide | grove | hush | daymark | badge
GATES = [
    ("stone", "knothollow", "Knothollow's deep cracks"),
    ("stone", "rockfall", "The Orchard Fen rockfall to Sootpath"),
    ("stone", "burrow", "Larkburrow's through-path (also needs the Loom Badge)"),
    ("stone", "answering", "Side cracks in the Answering Ways"),
    ("tide", "greywash_lip", "Moon Pool's far lip"),
    ("tide", "greywash", "Greywash Sound"),
    ("tide", "quietchannels", "The Quiet Channels"),
    ("tide", "opengrey", "The Open Grey"),
    ("tide", "lowbell", "Lowbell's flooded floor"),
    ("lantern", "kilnvent", "Past the first room of Kilnvent"),
    ("lantern", "answering", "Past the first lit hall of the Answering Ways"),
    ("lantern", "trialstair", "The unlit flights of Trialstair"),
    ("glide", "glassfall", "Glassfall, one way down; fast travel to inns entered"),
    ("hush", "nestledge", "Veilmote's nest ledge, on the night path after Hush"),
    ("grove", "grovewake", "Old Root Grove's back ring"),
    ("grove", "nursery", "The nursery gate beside Meadowmantle's ground"),
    ("hush", "greymill", "Greymill's stuck door"),
    ("daymark", "lampcrown", "The last stair of Lampcrown"),
    ("daymark", "spire", "The outdoor stone on the Spire approach"),
    ("badge", "ashstair", "Ashstair asks for the Tide Badge"),
    ("badge", "trialroad", "The league door asks for all eight badges"),
]

# ---- loops (#455 "Loops and the one-way shortcut")
LOOPS = [
    dict(id="passring", name="Pass Ring", colour="#b48ad6",
         segments=["glassfall", "passfoot", "dryboards", "longboards"],
         note="Highlatch, Glassfall down to Reedhold, the Dry Boards, Pass Foot, back to Highlatch"),
    dict(id="coastring", name="Coast Ring", colour="#6fd3e0",
         segments=["greywash", "opengrey", "seaward", "sheltermile", "ribbonroad", "latepath"],
         note="Lantern Quay, Greywash, The Open Grey, Seaward Ledge, the High Watch, home through Threadmeet, Bellstep and Reedhold"),
    dict(id="homeburrow", name="Home Burrow", colour="#d9a35b",
         segments=["millgrass", "burrow"],
         note="Millgrass Lane, Larkburrow, the back of Threadmeet (Stone Break and the Loom Badge)"),
]
ONE_WAY = "glassfall"

# ---- Legends (catalogue tier = Legend, 9 species) and where #455 places them
LEGENDS = [  # (name, element, site place id, site text, first meeting) from #455 section 2 Legend table (unchanged from bf4c7f1e to 66647dc9)
    ("Elderhorn", "Grove", "eldertrees", "The oldest trees in Old Root Grove", "Thornwood, at 20 explores"),
    ("Breakwatermane", "Tide", "wracklinebeach", "The Wrackline beach, where the tide draws back", "Saltmarsh, at 14 explores"),
    ("Hearthcrown", "Ember", "springterrace", "The Warmstep spring terrace", "Emberfall, at 14 explores"),
    ("Lanterncrest", "Radiant", "lampcrown", "Lampcrown, a clear 4x4-tile pad", "Cloudglass, the surface meeting"),
    ("Stillwake", "Tide", "jetty", "The Reedhold jetty, the surface crossing", "Stillreed, at 14 explores"),
    ("Undertone", "Shade", "firstbend", "The first bend of the Answering Ways", "Beside the hamlet bell, at 14 explores"),
    ("Meadowmantle", "Grove", "meadowground", "The Threadmeet nursery, outdoors", "Sunthread, at 14 explores"),
    ("Watchlight", "Radiant", "harborlight", "The harbor light on Seaward Ledge", "Farwatch, at 14 explores"),
    ("Veilmote", "Shade", "nestledge", "A nest ledge on The Late Path, after Hush", "No meeting exists yet"),
]
PROPOSED = [("Greysail", "Gale", "greymill", "Would be a 190th species; not drawn or added unless Evan says yes. Until then the mill has no roamer")]

ALL_REGIONS = REGIONS + ZONES
def region(rid):
    return next(r for r in ALL_REGIONS if r["id"] == rid)
def centroid(poly):
    return (sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly))

# Where each region's name sits on the illustrated map (schematic coordinates), clear of the town labels.
REGION_LABEL = {
    "thornwood": (230, 700), "saltmarsh": (250, 460), "emberfall": (545, 720), "cloudglass": (600, 215),
    "stillreed": (790, 705), "hollowecho": (950, 1020), "sunthread": (1160, 440), "farwatch": (1230, 240),
    "larkhaven": (300, 1025), "league": (1270, 170),
}
