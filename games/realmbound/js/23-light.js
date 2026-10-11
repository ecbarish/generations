'use strict';
/* Light and shadow (S6), on the arcade's light engine (shared/light.js). The sun crosses the sky with the 24-minute
   day (20-ambience.js): every hero, companion, pet and enemy casts its real silhouette as a shadow that swings and
   lengthens as the hours pass, long and golden at dawn and dusk, faint and blue under the moon, and away from the
   campfire, torches and lamps at night. Shadows take colour from the sky and the ground (bounce light). Each zone has
   its own fog you move through (thick in the Fens and the Barrowfields, golden in the Hollow Crown, smoky on Ashen
   Ridge), light scatters in it, low sun throws light shafts, and the colour of the hour grades the whole scene.
   Graphics: High (soft silhouettes, bloom) or Low (simple shadows) from the header; Low is picked for slow devices. */
const LT = Light.create({ reduce: () => reduce, quality: () => gfxQuality() });
/* Walkable scenes need silhouettes even on Low: keep fog/bloom quality separate.
   The shared Medium caster skips blur and the Low ellipse fallback; reuse its mask canvas. */
const REALM_SILHOUETTE = Light.create({ reduce: () => reduce, quality: 'medium' });
const REALM_WALK_LIGHT = {
  cast(c,draw,box,base,st,o){REALM_SILHOUETTE.cast(c,draw,box,base,st,o);},
  contact(c,x,y,w,st,k){LT.contact(c,x,y,w*.34,st,(k===undefined?1:k)*.45);}
};
function gfxQuality() { if (S.gfx) return S.gfx; const slow = (navigator.hardwareConcurrency || 8) <= 4 || Math.min(screen.width, screen.height) < 500; return slow ? 'low' : 'high'; }
function cycleGfx() { S.gfx = gfxQuality() === 'high' ? 'low' : 'high'; renderGfxBtn(); save(); }
function renderGfxBtn() { const b = $('#gfxBtn'); if (b) b.textContent = 'Graphics: ' + (gfxQuality() === 'high' ? 'High' : 'Low'); }
/* each zone's air: how much fog (fogTop: how high it reaches), its colour, the light's tint, how strongly the hour
   grades the scene, light shafts, the colours light bounces off (sky and ground), and its own night colour (G2) */
const ZONE_LIGHT = {
  // green valley: warm, clean morning light, soft blue-green moonlight
  thornvale: { fog: .12, col: '#e8efe4', tint: '#ffe0a0', shafts: .9, bounceGround: '#7aa050', night: '#0a1626' },
  // dry steppe: clear air, strong warm grade and red-earth bounce, a violet desert night
  redsand: { fog: .08, col: '#f2d6ae', tint: '#ffa860', grade: 1.15, shafts: .7, bounceGround: '#d08850', night: '#1c1030' },
  // marsh: low-lying mist the sun pours through, murky teal nights
  fens: { fog: .55, col: '#c8d8c4', tint: '#a0b898', fogTop: .5, grade: .8, shafts: 1.2, night: '#06161a' },
  // volcanic ridge: smoke, lava bounce from below, ember-red dark
  ashen: { fog: .28, col: '#7a625e', tint: '#ff7040', grade: 1.1, shafts: .5, bounceGround: '#a04a30', night: '#1e0808' },
  // Winter-road air stays close to the snow. Cool reflected light leaves the hearths warm at night.
  frostmere: { fog: .24, col: '#e2edf5', tint: '#a9c6e5', fogTop: .58, townFogTop: .55, grade: .85, shafts: .55,
    bounceSky: '#92b8d9', bounceGround: '#ddeaf3', night: '#081638' },
  // grave country: ground mist among the barrows, cold light, nights near black
  barrowfield: { fog: .5, col: '#c4ced8', tint: '#90a8c4', fogTop: .6, grade: .9, shafts: .6, night: '#0a0e1c' },
  // the old forest crown: green-gold haze, shafts through the canopy, olive dark
  hollowcrown: { fog: .34, col: '#d4d49c', tint: '#d0c060', shafts: 1.1, bounceGround: '#5a5a28', night: '#10140a' },
  // its heart: golden light everywhere, deep amber nights
  crownheart: { fog: .32, col: '#e8d498', tint: '#f2c14e', grade: 1.1, shafts: 1.2, night: '#181206' }
};
const DUN_LIGHT = { sanctum: { fog: .3, col: '#7aa8c8' }, foundry: { fog: .25, col: '#8a6050', tint: '#ff7040' }, barrows: { fog: .45, col: '#9ab0c8' }, rootrot: { fog: .35, col: '#a0b070' }, heartwood: { fog: .3, col: '#c8b070' }, throne: { fog: .3, col: '#c8a060', tint: '#ffb050' } };
/* the sun's state right now: the same day as realmNight() (sunrise near the end of the night, sunset at dusk) */
function realmSun(now) {
  const h = H(), dun = h && h.dun, z = h && (dun ? dungeonDef() : ZONES[h.zone]);
  if (dun) return LT.time(.42, { sky: z.sky[1], ground: z.ground }); // underground: a low, warm, steady light
  const night = realmNight(now), k = (((now === undefined ? rbNow() : now) / 1000) % AMB_DAY) / AMB_DAY;
  const air = h ? ZONE_LIGHT[h.zone] || {} : {}, bounce = { sky: air.bounceSky || (z ? z.sky[1] : '#9cc4e8'), ground: air.bounceGround || (z ? z.ground : '#4a6a3a') };
  let st = LT.time(Light.cycle(k, .955, .645), bounce);
  if (night > .5 && st.day) st = LT.time(.6, bounce); // tests and previews may force the night
  return st;
}
function zoneAir() { const h = H(); if (h.dun) return DUN_LIGHT[h.dun.id] || { fog: .25, col: '#8a8a8a' }; return ZONE_LIGHT[h.zone] || { fog: .15, col: '#e0e6ea' }; }
/* the side-view scene: shadows for everyone standing in it (drawn before them, from 14-scene.js) */
function realmShadows(gy, p, t, st, lights) {
  const cast = (draw, x, w, hgt, k) => { LT.cast(cx, draw, [x - p, gy - hgt, w, hgt + p], gy, st, { k });
    if (!st.day) for (const l of lights || []) if (Math.abs(l.x - x) < l.r * .9) { LT.cast(cx, draw, [x - p, gy - hgt, w, hgt + p], gy, st, { from: [l.x, l.y], reach: l.r }); break; } };
  if (C.phase !== 'dead') cast(g => drawHero(PW * .28, gy - 13 * p, p, t, g), PW * .28, 12 * p, 14 * p, 1);
  const pet = petOf(); if (pet && pet.hp > 0 && C.phase !== 'dead') { const pp = Math.max(2, Math.round(p * .8)); cast(g => drawBeast(g, PW * .4, gy - 13 * pp, pp, pet.col, pet.family, true, 0), PW * .4 - 4 * pp, 16 * pp, 14 * pp, .8); }
  if (C.mob) { const m = C.mob, mx = PW * .64, sc = m.elite ? 1.45 : 1; cast(g => drawMob(m, mx, gy - 13 * p * sc, p, 0, g), mx - 6 * p * sc, 20 * p * sc, 15 * p * sc, 1); }
  C.party.forEach((q, i) => { const pp = Math.max(2, Math.round(p * .85)), x = PW * .28 - (i + 1) * PW * (C.party.length > 4 ? .027 : .065);
    cast(g => drawPerson(x, gy - 13 * pp, pp, { cls: q.n.cls, race: q.n.race, hair: q.n.hair, dead: q.dead }, 0, g), x, 11 * pp, 14 * pp, q.dead ? .4 : .8); });
}
/* in front of everything: fog with scattered light, the colour of the hour, light shafts */
function realmAtmosphere(t, gy, st, lights, weather) {
  const air = zoneAir(), fogD = air.fog + (weather && weather.fog ? weather.fog * .4 : 0) + (st.day ? 0 : .08) + (st.day && st.p < .2 ? .12 : 0); // morning mist
  LT.fog(cx, PW, PH, t, { ground: gy + PH * .05, top: PH * (air.fogTop === undefined ? .3 : air.fogTop), density: fogD, col: Light.css(Light.mix(air.col, air.night ? Light.mix(air.night, '#2a3450', .5) : '#1a2040', st.day ? 0 : .55)), lights });
  LT.grade(cx, PW, PH, st, { tint: air.tint, amount: air.grade });
  if (!(weather && weather.rain)) LT.shafts(cx, PW, PH, t, st, { strength: H().dun ? 0 : air.shafts === undefined ? .9 + air.fog : air.shafts });
}
document.addEventListener('click', e => { const el = e.target.closest('[data-act="gfx"]'); if (el) { cycleGfx(); } });
