# Generates index.html, lab.html and game/*.html (HUB-REDESIGN). Run from the repo root: python3 tools/build-hub-pages.py
import html,os
from PIL import Image
B='https://ecbarish.github.io/generations/'
FONT='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet">'
def head(base,title,desc,path,img,alt):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{B}{path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Generations">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{B}{path}"><meta property="og:image" content="{B}{img}"><meta property="og:image:width" content="{Image.open(img).size[0]}"><meta property="og:image:height" content="{Image.open(img).size[1]}"><meta property="og:image:alt" content="{alt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{B}{img}">
<link rel="manifest" href="{base}manifest.webmanifest">
<meta name="theme-color" content="#100e17">
<link rel="icon" href="{base}icons/arcade.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="{base}icons/arcade-192.png">
{FONT}
<link rel="stylesheet" href="{base}shared/accessibility.css">
<link rel="stylesheet" href="{base}shared/hub.css">
</head>
'''
def bar(base,cur):
    a=lambda h,t,k,cls='': f'<a class="{cls}" href="{base}{h}"{" aria-current=\"page\"" if k==cur else ""}>{t}</a>'
    return f'''<a class="skip" href="#main">Skip to the games</a>
<header class="bar"><div class="wrap"><a class="logo" href="{base}index.html" aria-label="Generations home">GENER<span>ATIONS</span></a>
<nav class="nav" aria-label="Site">{a("index.html#games","Games","games","nav-games")}{a("lab.html","Lab","lab")}{a("playtest.html","What to try","try")}</nav></div></header>
'''
def foot(base,offline):
    return f'''<footer class="foot"><div class="wrap">
<div><p class="motto">Play for the fun. Automate the grind.</p>
<p>Generations is a stable of free adventure and progression games, headlined by Wildbond. Progress is stored in this browser on this device, with automatic backups. Automation is earned in play, never sold.</p>
<details class="app-help"><summary>Play offline or add to your home screen</summary><p>Open this page online and wait for “Ready for offline play.” You can then open the arcade and its browser games without internet. The new versions of Wildbond and Starfall need internet on their first visit. Use Install arcade when it appears, or your browser’s Install / Add to Home Screen menu. Your saves stay in this browser on this device.</p></details></div>
<div><div class="tools"><button class="install-btn" id="installArcade" hidden>Install arcade</button><div class="feedback-container"><button class="fb-btn" aria-haspopup="true" aria-expanded="false">Feedback</button></div><span class="set-host"></span></div>
<p class="tools" style="margin-top:.8rem"><a href="{base}lab.html">The Lab</a><a href="{base}playtest.html">What to try</a><a href="{base}credits.html">Credits</a><a href="{base}promo.html">Realmbound trailer</a><span class="version-label">v1.8.0</span></p>
<span class="offline-status" id="offlineStatus" role="status" aria-live="polite"></span></div>
</div></footer>
'''
def scripts(base,offline,name,extra=''):
    o=f'<script src="{base}shared/offline.js" defer></script>\n' if offline else ''
    return f'''{o}<script src="{base}shared/settings.js"></script>
<script src="{base}shared/engine.js"></script>
<script src="{base}shared/feedback.js"></script>
<script src="{base}launcher/games.js"></script>
<script src="{base}launcher/sports-progress.js"></script>
<script src="{base}shared/hub.js"></script>
<script>setupFeedback({name!r}, Hub.VERSION, () => '');Settings.create({{mount:'.set-host'}});{extra}</script>
</body>
</html>
'''
W=['images/play/wb-larkhaven.png','images/play/wb-battle.png','images/play/wb-coast.png']
# ---------- index ----------
idx=head('', 'Generations: free adventure &amp; idle browser games','Free browser games where you play for the fun and automate the grind. Start with Wildbond: bond with creatures and bring colour back to a faded valley. No downloads, nothing for sale.','', 'images/play/wb-larkhaven.png','Wildbond: the village of Larkhaven')
idx+='<body data-base="">\n'+bar('','home')+f'''<main id="main">
<section class="hero" aria-labelledby="hero-title"><div class="hero-bg" aria-hidden="true" style="background-image:url('images/play/wb-larkhaven.png')"></div>
<img class="hero-side l" src="images/play/wildbond-godot-festival-lanterns.png" alt="" aria-hidden="true" loading="lazy"><img class="hero-side r" src="images/play/wb-emberfall.png" alt="" aria-hidden="true" loading="lazy">
<div class="wrap">
<div class="hero-copy"><span class="eyebrow">Early preview · Free</span>
<h1 id="hero-title">Wildbond</h1>
<p class="hero-lede">Walk into faded Larkhaven, choose a partner creature and bring colour back to the valley, one bond at a time.</p>
<div class="hero-actions"><a class="btn btn-primary" id="heroPlay" href="play/wildbond/">▶ Play Wildbond</a><a class="btn btn-ghost" href="game/wildbond.html">About the game</a></div>
<p class="hero-note">Runs in your browser · saves on this device · best on a computer, works on phones held sideways.</p></div>
<div class="hero-media"><div class="shot">{''.join(f'<img src="{s}" alt="{a}" width="1536" height="864"{" fetchpriority=\"high\"" if i==0 else " loading=\"lazy\""}>' for i,(s,a) in enumerate(zip(W,['Wildbond: Larkhaven village','Wildbond: a creature battle','Wildbond: Saltmarsh Coast'])))}</div></div>
</div></section>
<section class="section" id="games" aria-labelledby="games-title"><span id="shelf"></span><span id="launcher"></span><span id="start-here"></span><div class="wrap">
<div class="section-head"><h2 id="games-title">Play now</h2><p>The games being worked on right now. No sign-up, nothing for sale.</p></div>
<div class="grid three" id="current"></div>
<noscript><ul><li><a href="play/wildbond/">Wildbond</a></li><li><a href="play/starfall/">Starfall Guild</a></li><li><a href="games/realmbound/index.html">Realmbound</a></li><li><a href="lab.html">The Lab: test versions and prototypes</a></li></ul></noscript>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="lab-band">
<div><h2>The Lab</h2><p>Test versions and prototypes: arcade cabinets, a baseball club, a football night, a story life sim and Little Ranch for ages 2 to 4. They change a lot between visits.</p></div>
<div class="lab-thumbs" aria-hidden="true"><img src="images/lab/little-ranch.jpg" alt="" loading="lazy" width="960" height="540"><img src="images/lab/diamond-manager.jpg" alt="" loading="lazy" width="960" height="540"><img src="images/lab/storm-front.jpg" alt="" loading="lazy" width="960" height="540"></div>
<a class="btn" href="lab.html">Visit the Lab →</a></div></div></section>
</main>
'''+foot('',True)+scripts('',True,'The arcade homepage',"Hub.render(document.getElementById('current'),Hub.current(),{short:true,page:true,eager:true});Hub.redirectOldHash();addEventListener('hashchange',()=>Hub.redirectOldHash());Hub.cta(document.getElementById('heroPlay'),'wildbond-preview','Wildbond');")
open('index.html','w').write(idx)
# ---------- lab ----------
lab=head('','The Lab: test versions and prototypes · Generations','Early test versions and prototypes from Generations: arcade cabinets, a baseball club, a football night, a story life sim and a toy for little ones.','lab.html','images/lab/little-ranch.jpg','Little Ranch, a toy for ages 2 to 4')
lab+='<body data-base="">\n'+bar('','lab')+'''<main id="main"><section class="section"><div class="wrap">
<div class="section-head"><div><h1 class="logo" style="font-size:clamp(1.8rem,1.2rem + 2vw,3.2rem);margin:0 0 .4rem">The Lab</h1><p style="color:var(--muted);margin:0;max-width:62ch">Test versions and prototypes. They may change a lot between visits, and some are rough. Each keeps its own save on this device.</p></div><a class="btn btn-ghost btn-sm" href="index.html#games">← Current games</a></div>
<div class="grid" id="lab"></div>
<noscript><p>Turn on JavaScript to see the Lab, or open a game: <a href="games/little-ranch/index.html">Little Ranch</a>, <a href="games/diamond-manager/index.html">Diamond Manager</a>, <a href="games/lantern-bowl/index.html">Lantern Bowl</a>, <a href="games/otherworld/index.html">Otherworld</a>, <a href="games/storm-front/index.html">Storm Front</a>.</p></noscript>
</div></section></main>
'''+foot('',True)+scripts('',True,'The Lab',"Hub.render(document.getElementById('lab'),Hub.lab(),{how:true,kindAnchors:true});Hub.jump();")
open('lab.html','w').write(lab)
# ---------- game pages ----------
G=[dict(slug='wildbond',id='wildbond-preview',title='Wildbond',eyebrow='The headline game · Early preview',play='play/wildbond/',
  lede='Walk into faded Larkhaven, choose a partner and bring colour back with your first bond. Explore all eight regions and take on the league: four courts and the Champion.',
  desc='Bond with creatures, explore eight regions and bring colour back to a faded valley. Free in your browser.',
  shots=[('images/play/wb-larkhaven.png','Larkhaven village'),('images/play/wb-battle.png','A creature battle'),('images/play/wb-coast.png','Saltmarsh Coast'),('images/play/wb-barn.png','The barn and nursery'),('images/play/wb-faded.png','A faded region before you restore it'),('images/play/wildbond-godot-festival-lanterns.png','The lantern festival')],
  controls=['<kbd>Arrows</kbd> or <kbd>WASD</kbd> to walk','<kbd>Enter</kbd> or <kbd>E</kbd> to talk','<kbd>J</kbd> for the field book','<kbd>M</kbd> for music','On a phone: hold it sideways and use the touch controls'],
  new=['Oct 14: new ground details around the Larkhaven and Thornwood ponds','Oct 14: play on a phone held sideways, by touch','Oct 14: phone help on the register, and more room on the partner card','Oct 14: a new catalogue batch, with evolved forms'],
  note='Best on a computer. The first load needs internet and may take a moment.'),
 dict(slug='starfall',id='starfall-preview',title='Starfall Guild',eyebrow='Early preview',play='play/starfall/',
  lede='Build a frontier guild town. Post jobs for adventurers, serve meals at the inn, work the forge and grow the town with a healer, training yard and apothecary.',
  desc='Build a frontier guild town: post jobs, cook at the inn, work the forge, then hire help. Free in your browser.',
  shots=[('images/play/sf-town.png','The village of Starfall'),('images/play/sf-tavern.png','The inn'),('images/play/sf-goodrun.png','A good run')],
  controls=['<kbd>Arrows</kbd>, <kbd>WASD</kbd> or a click to walk','<kbd>Enter</kbd> or <kbd>E</kbd> to use a place','<kbd>M</kbd> for music'],
  new=['Oct 14: a clearer map of the guild’s loops, and your call in the fight','Oct 13: taps land correctly on the scaled screen'],
  note='Best on a computer. The first load needs internet and may take a moment.'),
 dict(slug='realmbound',id='realmbound',title='Realmbound',eyebrow='Beta',play='games/realmbound/index.html',
  lede='A classic-MMO adventure: pick a faction and a class, quest from level 1 to 60 through eight zones, clear four dungeons, found a guild and raid The Hollow Throne. Play it yourself or let Auto take over.',
  desc='A classic-MMO adventure from level 1 to 60: quest, dungeon, raid, or let Auto play. Free in your browser.',
  shots=[('images/play/rb-fight.jpg','A fight on the road out of Thornvale'),('images/play/rb-create.jpg','Create your hero')],
  controls=['<kbd>Arrows</kbd> or <kbd>WASD</kbd> (or tap) to walk','<kbd>Enter</kbd> to talk','In fights: <kbd>C</kbd> combo, <kbd>D</kbd> dodge, <kbd>L</kbd> loot all','<b>Auto</b> plays fights for you when you want a break'],
  new=['Oct 13: level cap and auto-play rules tightened','Oct 13: friendlier guidance for newcomers','Version 1.9.2'],
  note='Works on computers, tablets and phones. Saves stay in this browser.',guide='guides/realmbound.html')]
os.makedirs('game',exist_ok=True)
for g in G:
    b='../'
    h=head(b,f"{g['title']} · Generations",g['desc'],f"game/{g['slug']}.html",g['shots'][0][0],g['title']+': '+g['shots'][0][1])
    shots=''.join(f'<img src="{b}{s}" alt="{a}" width="1536" height="864"{" loading=\"lazy\"" if i else ""}>' for i,(s,a) in enumerate(g['shots'][:3]))
    side=''.join(f'<img class="hero-side {c}" src="{b}{s}" alt="" aria-hidden="true" loading="lazy">' for c,(s,a) in zip('lr',(g['shots'][1:]+g['shots'])[-2:]))
    gal=''.join(f'<figure style="margin:0"><img src="{b}{s}" alt="{a}" loading="lazy" width="1536" height="864"></figure>' for s,a in g['shots'])
    guide=f'<li><a href="{b}{g["guide"]}">Guide · the Sundered Reach →</a></li>' if g.get('guide') else ''
    h+=f'<body data-base="{b}">\n'+bar(b,'game')+f'''<main id="main">
<section class="hero" aria-labelledby="hero-title"><div class="hero-bg" aria-hidden="true" style="background-image:url('{b}{g['shots'][0][0]}')"></div>{side}<div class="wrap">
<div class="hero-copy"><p class="crumbs"><a href="{b}index.html">Generations</a> › Games</p><span class="eyebrow">{g['eyebrow']}</span><h1 id="hero-title" style="--chars:{max(8,max(len(w) for w in g['title'].split()))}">{g['title']}</h1>
<p class="hero-lede">{g['lede']}</p><div class="hero-actions"><a class="btn btn-primary" id="heroPlay" href="{b}{g['play']}">▶ Play {g['title']}</a></div><p class="hero-note">{g['note']}</p></div>
<div class="hero-media"><div class="shot">{shots}</div></div></div></section>
<section class="section"><div class="wrap cols">
<div class="panel"><h2>Controls</h2><ul>{''.join(f'<li>{c}</li>' for c in g['controls'])}{guide}</ul></div>
<div class="panel"><h2>What’s new</h2><ul>{''.join(f'<li>{n}</li>' for n in g['new'])}</ul></div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><h2>Screenshots</h2></div><div class="gallery">{gal}</div></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><h2>More games</h2><a class="btn btn-ghost btn-sm" href="{b}lab.html">The Lab →</a></div><div class="grid three" id="others"></div></div></section>
</main>
'''+foot(b,False)+scripts(b,False,g['title']+' page',f"Hub.render(document.getElementById('others'),Hub.current().filter(x=>x.id!=={g['id']!r}),{{short:true,page:true}});Hub.cta(document.getElementById('heroPlay'),{g['id']!r},{g['title']!r});")
    open(f"game/{g['slug']}.html",'w').write(h)
print('ok')
