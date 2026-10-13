'use strict';
/* =================== talents =================== */
/* Three trees per class (T1-A, T1-C; docs/realmbound-40-60.md). Each holds 25 ranks plus a capstone that needs 25 points in
   that tree, so with 51 points at level 60 only one capstone is possible. `req` counts points spent in the same tree.
   The tree with the most points sets your role in groups (`role`: tank, heal or dps). Talent ids are unique across a
   class's trees: saves store ranks by id (h.talents), so older heroes keep everything they learned. */
const TALENTS={
  warrior:[
    {tree:'Arms',role:'dps',list:[
      {id:'cruelty',name:'Cruelty',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'impstrike',name:'Improved Brutal Strike',max:3,per:1,key:'strikeCost',desc:'Brutal Strike costs 1 less rage per rank.'},
      {id:'wmastery',name:'Weapon Mastery',max:5,per:2,key:'dmg',desc:'+2% damage per rank.'},
      {id:'tactical',name:'Tactical Mastery',max:2,per:1,key:'window',desc:'Counterstrike openings last 1 second longer per rank.'},
      {id:'toughness',name:'Toughness',max:5,per:2,key:'armor',desc:'+2% armor per rank.'},
      {id:'mortal',name:'Mortal Wound',max:1,per:1,key:'cap',req:8,desc:'Learn Mortal Wound: a crushing strike on a 6 second cooldown. Needs 8 points in Arms.'},
      {id:'deepwounds',name:'Deep Wounds',max:4,per:10,key:'critDmg',req:15,desc:'Critical strikes deal 10% more damage per rank. Needs 15 points in Arms.'},
      {id:'bladestorm',name:'Bladestorm',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Bladestorm: three spinning weapon strikes at once. 30 second cooldown. Needs 25 points in Arms.'}]},
    {tree:'Protection',role:'tank',list:[
      {id:'defiance',name:'Defiance',max:5,per:15,key:'threat',desc:'Enemies are 15% more likely to attack you instead of your party, per rank.'},
      {id:'shieldspec',name:'Shield Specialization',max:5,per:3,key:'block',desc:'+3% chance per rank to block with a shield: blocked hits deal half damage.'},
      {id:'anticipation',name:'Anticipation',max:5,per:1,key:'dodge',desc:'+1% dodge per rank.'},
      {id:'toughened',name:'Toughened',max:5,per:3,key:'hpPct',desc:'+3% maximum health per rank.'},
      {id:'shieldslam',name:'Shield Slam',max:1,per:1,key:'cap',req:10,desc:'Learn Shield Slam: a shield strike that grabs the enemy\'s attention. Needs a shield and 10 points in Protection.'},
      {id:'impbulwark',name:'Iron Hide',max:4,per:4,key:'armor',req:15,desc:'+4% armor per rank. Needs 15 points in Protection.'},
      {id:'shieldwall',name:'Shield Wall',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Shield Wall: take 60% less damage for 10 seconds. 45 second cooldown. Needs 25 points in Protection.'}]},
    {tree:'Fury',role:'dps',list:[
      {id:'unbridled',name:'Unbridled Wrath',max:5,per:8,key:'rageGen',desc:'Your weapon swings build 8% more rage per rank.'},
      {id:'enrage',name:'Enrage',max:5,per:3,key:'enrageDmg',desc:'After you land a critical strike, you deal 3% more damage per rank for 8 seconds.'},
      {id:'wflurry',name:'Flurry',max:5,per:3,key:'swingSpeed',desc:'Your weapon swings 3% faster per rank.'},
      {id:'bloodfrenzy',name:'Blood Frenzy',max:5,per:8,key:'counterDmg',desc:'Counterstrike deals 8% more damage per rank.'},
      {id:'bloodthirst',name:'Bloodthirst',max:1,per:1,key:'cap',req:10,desc:'Learn Bloodthirst: a savage strike that heals you for a fifth of the damage. 6 second cooldown. Needs 10 points in Fury.'},
      {id:'rampage',name:'Rampage',max:4,per:2.5,key:'execRange',req:15,desc:'Finishing Blow can be used 2.5% earlier per rank (below 30% at 4 ranks). Needs 15 points in Fury.'},
      {id:'deathwish',name:'Death Wish',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Death Wish: deal 40% more damage and take 10% more for 12 seconds. 45 second cooldown. Needs 25 points in Fury.'}]}],
  rogue:[
    {tree:'Assassination',role:'dps',list:[
      {id:'malice',name:'Malice',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'lethality',name:'Lethality',max:5,per:6,key:'critDmg',desc:'Critical strikes deal 6% more damage per rank.'},
      {id:'vigor',name:'Vigor',max:3,per:6,key:'energyRegen',desc:'Energy regenerates 6% faster per rank.'},
      {id:'opportunity',name:'Opportunity',max:5,per:6,key:'opener',desc:'Backstab deals 6% more damage per rank.'},
      {id:'reflexes',name:'Lightning Reflexes',max:5,per:1,key:'dodge',desc:'+1% dodge per rank. Every dodge opens Riposte.'},
      {id:'vendetta',name:'Vendetta',max:1,per:1,key:'cap',req:8,desc:'Learn Vendetta: for 6 seconds every attack is a critical strike. Needs 8 points in Assassination.'},
      {id:'precision',name:'Precision',max:1,per:2,key:'crit',req:15,desc:'+2% critical strike chance. Needs 15 points in Assassination.'},
      {id:'coldblood',name:'Cold Blood',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Cold Blood: your next attack is a critical strike that deals double crit damage. 30 second cooldown. Needs 25 points.'}]},
    {tree:'Combat',role:'dps',list:[
      {id:'precstrikes',name:'Precise Strikes',max:5,per:2,key:'dmg',desc:'+2% damage per rank.'},
      {id:'dwmastery',name:'Dual Wield Mastery',max:5,per:4,key:'swingSpeed',desc:'Your weapon swings 4% faster per rank.'},
      {id:'cendurance',name:'Endurance',max:5,per:2,key:'hpPct',desc:'+2% maximum health per rank.'},
      {id:'impquicken',name:'Improved Quicken',max:4,per:2,key:'quickenDur',desc:'Quicken lasts 2 seconds longer per combo point, per rank.'},
      {id:'flurry',name:'Blade Flurry',max:1,per:1,key:'cap',req:10,desc:'Learn Blade Flurry: your weapon swings hit 50% harder for 12 seconds. Needs 10 points in Combat.'},
      {id:'cexpertise',name:'Combat Expertise',max:5,per:6,key:'energyRegen',req:15,desc:'Energy regenerates 6% faster per rank. Needs 15 points in Combat.'},
      {id:'adrenaline',name:'Adrenaline Rush',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Adrenaline Rush: energy regenerates three times as fast for 12 seconds. 60 second cooldown. Needs 25 points.'}]},
    {tree:'Subtlety',role:'dps',list:[
      {id:'deception',name:'Master of Deception',max:5,per:.5,key:'openWin',desc:'The opening for Backstab lasts 0.5 seconds longer per rank.'},
      {id:'serrated',name:'Serrated Blades',max:5,per:5,key:'gutDmg',desc:'Gutting Strike deals 5% more damage per rank.'},
      {id:'elusive',name:'Elusiveness',max:5,per:1,key:'dodge',desc:'+1% dodge per rank. Every dodge opens Riposte.'},
      {id:'heightened',name:'Heightened Senses',max:5,per:2,key:'hpPct',desc:'+2% maximum health per rank.'},
      {id:'premed',name:'Premeditation',max:1,per:1,key:'cap',req:10,desc:'Learn Premeditation: gain 2 combo points at once. 20 second cooldown. Needs 10 points in Subtlety.'},
      {id:'deadliness',name:'Deadliness',max:4,per:2,key:'dmg',req:15,desc:'+2% damage per rank. Needs 15 points in Subtlety.'},
      {id:'shadowdance',name:'Shadow Dance',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Shadow Dance: for 8 seconds Backstab can be used again and again. 60 second cooldown. Needs 25 points in Subtlety.'}]}],
  mage:[
    {tree:'Fire',role:'dps',list:[
      {id:'burning',name:'Burning Soul',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'ignite',name:'Ignite',max:5,per:8,key:'bleed',desc:'Critical strikes burn the target for 8% of the damage per rank.'},
      {id:'impbolt',name:'Improved Firebolt',max:5,per:.1,key:'castSpeed',desc:'Firebolt casts 0.1 seconds faster per rank.'},
      {id:'mind',name:'Arcane Mind',max:5,per:3,key:'intPct',desc:'+3% Intellect per rank.'},
      {id:'clarity',name:'Clarity',max:3,per:3,key:'procChance',desc:'+3% chance per rank for spells to trigger Arcane Surge.'},
      {id:'cinder',name:'Cinderstorm',max:1,per:1,key:'cap',req:8,desc:'Learn Cinderstorm: a huge fire spell on a 20 second cooldown. Needs 8 points in Fire.'},
      {id:'pyromaniac',name:'Pyromaniac',max:1,per:3,key:'crit',req:15,desc:'+3% critical strike chance. Needs 15 points in Fire.'},
      {id:'combustion',name:'Combustion',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Combustion: +50% critical strike chance for 10 seconds. 60 second cooldown. Needs 25 points in Fire.'}]},
    {tree:'Frost',role:'dps',list:[
      {id:'iceshards',name:'Ice Shards',max:5,per:6,key:'frostDmg',desc:'Frost Lance deals 6% more damage per rank.'},
      {id:'permafrost',name:'Permafrost',max:5,per:1,key:'chillDur',desc:'Frost Lance slows the target 1 second longer per rank.'},
      {id:'frostward',name:'Frost Warding',max:5,per:10,key:'absorb',desc:'Mana Ward absorbs 10% more per rank.'},
      {id:'winterschill',name:'Winter\'s Chill',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'deepfreeze',name:'Deep Freeze',max:1,per:1,key:'cap',req:10,desc:'Learn Deep Freeze: frost damage that freezes the target for 4 seconds. 25 second cooldown. Needs 10 points in Frost.'},
      {id:'icefloes',name:'Ice Floes',max:4,per:.1,key:'frostCast',req:15,desc:'Frost Lance casts 0.1 seconds faster per rank. Needs 15 points in Frost.'},
      {id:'frozenorb',name:'Frozen Orb',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Frozen Orb: heavy frost damage and a long slow. 20 second cooldown. Needs 25 points in Frost.'}]},
    {tree:'Arcane',role:'dps',list:[
      {id:'arcfocus',name:'Arcane Focus',max:5,per:2,key:'dmg',desc:'+2% damage per rank.'},
      {id:'arcconc',name:'Arcane Concentration',max:5,per:3,key:'procChance',desc:'+3% chance per rank for spells to light up Arcane Surge.'},
      {id:'arcempower',name:'Arcane Empowerment',max:5,per:10,key:'surgeDmg',desc:'Arcane Surge deals 10% more damage per rank.'},
      {id:'arcmed',name:'Arcane Meditation',max:5,per:6,key:'regenPct',desc:'+6% mana regeneration in combat per rank.'},
      {id:'missiles',name:'Arcane Missiles',max:1,per:1,key:'cap',req:10,desc:'Learn Arcane Missiles: three instant arcane bolts. 8 second cooldown. Needs 10 points in Arcane.'},
      {id:'arcinst',name:'Arcane Instability',max:4,per:1,key:'crit',req:15,desc:'+1% critical strike chance per rank. Needs 15 points in Arcane.'},
      {id:'arcpower',name:'Arcane Power',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Arcane Power: +35% damage for 15 seconds. 60 second cooldown. Needs 25 points in Arcane.'}]}],
  priest:[
    {tree:'Shadow & Light',role:'dps',list:[
      {id:'tap',name:'Spirit Tap',max:5,per:10,key:'regenPct',desc:'+10% mana regeneration in combat per rank.'},
      {id:'improt',name:'Improved Shadow Rot',max:5,per:6,key:'dot',desc:'Shadow Rot deals 6% more damage per rank.'},
      {id:'sfocus',name:'Shadow Focus',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'hfocus',name:'Healing Focus',max:5,per:6,key:'heal',desc:'Your heals and wards are 6% stronger per rank.'},
      {id:'inner',name:'Inner Light',max:3,per:4,key:'procChance',desc:'+4% chance per rank for Divine Spark.'},
      {id:'voidlash',name:'Void Lash',max:1,per:1,key:'cap',req:8,desc:'Learn Void Lash: shadow damage that heals you for half. 10 second cooldown. Needs 8 points.'},
      {id:'meditation',name:'Meditation',max:1,per:15,key:'regenPct',req:15,desc:'+15% mana regeneration in combat. Needs 15 points in Shadow & Light.'},
      {id:'shadowform',name:'Shadowform',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Shadowform: for 15 seconds deal 30% more damage and take 15% less. 45 second cooldown. Needs 25 points.'}]},
    {tree:'Holy',role:'heal',list:[
      {id:'holyspec',name:'Holy Specialization',max:5,per:6,key:'heal',desc:'Your heals and wards are 6% stronger per rank.'},
      {id:'agility',name:'Mental Agility',max:5,per:4,key:'healCost',desc:'Mend, wards and Holy spells cost 4% less mana per rank.'},
      {id:'grace',name:'Divine Grace',max:5,per:6,key:'regenPct',desc:'+6% mana regeneration in combat per rank.'},
      {id:'impward',name:'Improved Ward',max:4,per:8,key:'absorb',desc:'Ward of Light absorbs 8% more per rank.'},
      {id:'renew',name:'Renew',max:1,per:1,key:'cap',req:10,desc:'Learn Renew: whoever is hurt worst heals over 9 seconds. Needs 10 points in Holy.'},
      {id:'recovery',name:'Blessed Recovery',max:5,per:2,key:'hpPct',req:15,desc:'+2% maximum health per rank. Needs 15 points in Holy.'},
      {id:'circle',name:'Circle of Light',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Circle of Light: heal you, your pet and your whole party for 35% of their health. 20 second cooldown. Needs 25 points.'}]},
    {tree:'Discipline',role:'heal',list:[
      {id:'twindisc',name:'Twin Disciplines',max:5,per:5,key:'smiteDmg',desc:'Holy Smite and Divine Spark deal 5% more damage per rank.'},
      {id:'atonement',name:'Atonement',max:5,per:6,key:'atone',desc:'Holy Smite and Divine Spark heal whoever is hurt worst for 6% of their damage per rank.'},
      {id:'mentalstr',name:'Mental Strength',max:5,per:3,key:'intPct',desc:'+3% Intellect per rank.'},
      {id:'divfury',name:'Divine Fury',max:5,per:.1,key:'smiteCast',desc:'Holy Smite casts 0.1 seconds faster per rank.'},
      {id:'penance',name:'Penance',max:1,per:1,key:'cap',req:10,desc:'Learn Penance: holy damage to the enemy that heals whoever is hurt worst for as much. 10 second cooldown. Needs 10 points in Discipline.'},
      {id:'dgrace',name:'Grace',max:4,per:4,key:'heal',req:15,desc:'Your heals and wards are 4% stronger per rank. Needs 15 points in Discipline.'},
      {id:'painsup',name:'Pain Suppression',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Pain Suppression: you, your pet and your party take 40% less damage for 8 seconds. 60 second cooldown. Needs 25 points.'}]}],
  hunter:[
    {tree:'Beast Mastery',role:'dps',list:[
      {id:'endurance',name:'Endurance Training',max:5,per:5,key:'petHp',desc:'Your pet has 5% more health per rank.'},
      {id:'ferocity',name:'Ferocity',max:5,per:2,key:'petCrit',desc:'+2% pet critical strike chance per rank.'},
      {id:'lethal',name:'Lethal Shots',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'bestial',name:'Bestial Bond',max:3,per:20,key:'bondRate',desc:'Your bond with your pet grows 20% faster per rank.'},
      {id:'unleashed',name:'Unleashed Fury',max:5,per:4,key:'petDmg',desc:'Your pet deals 4% more damage per rank.'},
      {id:'packfury',name:'Pack Fury',max:1,per:1,key:'cap',req:8,desc:'Learn Pack Fury: your pet deals 50% more damage and attacks faster for 10 seconds. Needs 8 points.'},
      {id:'intimidation',name:'Intimidation',max:1,per:40,key:'petThreat',req:15,desc:'Your pet draws enemy attacks 40% more often. Needs 15 points in Beast Mastery.'},
      {id:'wrath',name:'Bestial Wrath',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Bestial Wrath: your pet deals double damage for 10 seconds. 60 second cooldown. Needs 25 points.'}]},
    {tree:'Marksmanship',role:'dps',list:[
      {id:'mortalshots',name:'Mortal Shots',max:5,per:6,key:'critDmg',desc:'Critical strikes deal 6% more damage per rank.'},
      {id:'impsteady',name:'Improved Steady Shot',max:5,per:.1,key:'shotCast',desc:'Steady Shot casts 0.1 seconds faster per rank.'},
      {id:'efficiency',name:'Efficiency',max:5,per:4,key:'shotCost',desc:'Your shots cost 4% less mana per rank.'},
      {id:'hawkeye',name:'Hawk Eye',max:5,per:3,key:'shotDmg',desc:'Your shots deal 3% more damage per rank.'},
      {id:'aimed',name:'Aimed Shot',max:1,per:1,key:'cap',req:10,desc:'Learn Aimed Shot: a slow, heavy shot. 10 second cooldown. Needs 10 points in Marksmanship.'},
      {id:'rws',name:'Ranged Weapon Specialization',max:4,per:2,key:'dmg',req:15,desc:'+2% damage per rank. Needs 15 points in Marksmanship.'},
      {id:'trueshot',name:'Trueshot',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Trueshot: +25% damage and +15% critical strike chance for 12 seconds. 60 second cooldown. Needs 25 points.'}]},
    {tree:'Survival',role:'dps',list:[
      {id:'savage',name:'Savage Strikes',max:5,per:1,key:'crit',desc:'+1% critical strike chance per rank.'},
      {id:'survinst',name:'Survival Instincts',max:5,per:2,key:'hpPct',desc:'+2% maximum health per rank.'},
      {id:'deflection',name:'Deflection',max:5,per:1,key:'dodge',desc:'+1% dodge per rank.'},
      {id:'impsting',name:'Improved Venom Sting',max:5,per:8,key:'stingDmg',desc:'Venom Sting deals 8% more damage per rank.'},
      {id:'lockload',name:'Lock and Load',max:1,per:1,key:'lockload',req:10,desc:'Each tick of Venom Sting has a 20% chance to make your next Steady Shot instant. Needs 10 points in Survival.'},
      {id:'killer',name:'Killer Instinct',max:4,per:2,key:'dmg',req:15,desc:'+2% damage per rank. Needs 15 points in Survival.'},
      {id:'explosive',name:'Explosive Shot',max:1,per:1,key:'cap',req:25,desc:'Capstone. Learn Explosive Shot: an instant shot that bursts and keeps burning for 6 seconds. 20 second cooldown. Needs 25 points.'}]}]
};
/* all of a class's talents, each knowing which tree (ti) it's in */
const TALENT_LIST={};for(const c in TALENTS)TALENT_LIST[c]=TALENTS[c].flatMap((tr,ti)=>tr.list.map(t=>Object.assign(t,{ti})));

/* ---- abilities ---- */
const lv=()=>H().lvl;
const ABIL={
  warrior:[
    {id:'strike',name:'Brutal Strike',lvl:1,cost:()=>12-T('strikeCost'),desc:'A heavy weapon strike.',ai:()=>C.res>=30||!knows('rend'),fn:()=>hitMob(wroll()+11+lv()*1.6,{phys:1,label:'Brutal Strike'})},
    {id:'cry',name:'Battle Cry',lvl:2,cost:()=>10,desc:'+attack power for 60 seconds.',cond:()=>!C.buffs.cry,ai:()=>true,fn:()=>{C.buffs.cry={t:60,ap:15+lv()*2};line('You let out a Battle Cry.','l-sys');}},
    {id:'rend',name:'Rend',lvl:4,cost:()=>10,desc:'Wounds the target, bleeding over 9 seconds.',cond:()=>!C.mob.dots.rend,ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{addDot('rend',15+lv()*3,9,'Rend');line(`${C.mob.name} is bleeding.`,'l-hit');}},
    {id:'counter',name:'Counter­strike',lvl:6,react:'counter',cost:()=>5,desc:'Only after the target dodges or leaves an opening. Can\'t be dodged, extra crit chance.',ai:()=>true,fn:()=>{C.win.counter=0;hitMob((wroll()+20+lv()*2.2)*(1+T('counterDmg')/100),{phys:1,sure:1,critBonus:50,label:'Counterstrike'});}},
    {id:'finish',name:'Finishing Blow',lvl:12,cost:()=>15,desc:'Only below 20% target health (more with Rampage). Spends extra rage for more damage.',cond:()=>C.mob.hp<C.mob.max*(.2+T('execRange')/100),ai:()=>true,fn:()=>{const extra=Math.min(30,C.res);C.res-=extra;hitMob(60+lv()*6+extra*3,{phys:1,label:'Finishing Blow'});}},
    {id:'mortal',name:'Mortal Wound',talent:'mortal',cd:6,cost:()=>15,desc:'A crushing strike. 6 second cooldown.',ai:()=>true,fn:()=>hitMob(wroll()*1.2+40+lv()*3,{phys:1,label:'Mortal Wound'})},
    {id:'shieldslam',name:'Shield Slam',talent:'shieldslam',cd:6,cost:()=>15,desc:'A shield strike that grabs the enemy\'s attention. Needs a shield. 6 second cooldown.',cond:()=>hasShield(),ai:()=>true,
      fn:()=>{hitMob(wroll()*.8+25+lv()*2.4,{phys:1,label:'Shield Slam'});C.buffs.taunt={t:4};}},
    {id:'bladestorm',name:'Bladestorm',talent:'bladestorm',cd:30,cost:()=>25,desc:'Three spinning weapon strikes at once. 30 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.3,
      fn:()=>{for(let i=0;i<3&&C.mob;i++)hitMob(wroll()*1.1+10+lv()*1.5,{phys:1,sure:1,label:'Bladestorm'});}},
    {id:'shieldwall',name:'Shield Wall',talent:'shieldwall',cd:45,cost:()=>10,desc:'Take 60% less damage for 10 seconds. 45 second cooldown.',ai:()=>C.hp<ST.hpMax*.5||!!(C.mob&&C.mob.boss),
      fn:()=>{C.buffs.shieldwall={t:10};line('You raise Shield Wall.','l-sys');}},
    {id:'bloodthirst',name:'Bloodthirst',talent:'bloodthirst',cd:6,cost:()=>20,desc:'A savage strike that heals you for a fifth of the damage. 6 second cooldown.',ai:()=>true,
      fn:()=>{const a=hitMob(wroll()+25+lv()*2.6,{phys:1,label:'Bloodthirst'});if(a)healHero(a*.2,'Bloodthirst');}},
    {id:'deathwish',name:'Death Wish',talent:'deathwish',cd:45,cost:()=>10,desc:'Deal 40% more damage and take 10% more for 12 seconds. 45 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,
      fn:()=>{C.buffs.deathwish={t:12};line('You feel a Death Wish.','l-sys');}},
  ],
  rogue:[
    {id:'slash',name:'Quick Slash',lvl:1,cost:()=>40,desc:'Strike for weapon damage. +1 combo point.',ai:()=>C.cp<5,fn:()=>{if(hitMob(wroll()+8+lv()*1.2,{phys:1,label:'Quick Slash'})>0)C.cp=Math.min(5,C.cp+1);}},
    {id:'gut',name:'Gutting Strike',lvl:1,cost:()=>35,desc:'Finisher. Damage grows with every combo point.',cond:()=>C.cp>0,ai:()=>C.cp>=4||C.mob.hp<C.mob.max*.15,fn:()=>{const cp=C.cp;C.cp=0;hitMob((cp*(10+lv()*2.2)+ST.ap*.03*cp)*(1+T('gutDmg')/100),{phys:1,sure:1,label:`Gutting Strike (${cp})`});}},
    {id:'backstab',name:'Backstab',lvl:4,react:'opening',cost:()=>60,desc:'Only in the opening seconds of a fight. Big damage, +2 combo points.',ai:()=>true,fn:()=>{if(!C.buffs.dance)C.win.opening=0;if(hitMob((wroll()*1.5+15+lv()*2)*(1+T('opener')/100),{phys:1,sure:1,label:'Backstab'})>0)C.cp=Math.min(5,C.cp+2);}},
    {id:'riposte',name:'Riposte',lvl:6,react:'riposte',cost:()=>10,desc:'Only right after you dodge or parry. +1 combo point.',ai:()=>true,fn:()=>{C.win.riposte=0;if(hitMob(wroll()*1.5,{phys:1,sure:1,label:'Riposte'})>0)C.cp=Math.min(5,C.cp+1);}},
    {id:'quicken',name:'Quicken',lvl:10,cost:()=>25,desc:'Finisher. Attack 30% faster for 6 seconds per combo point.',cond:()=>C.cp>0&&!C.buffs.quicken,ai:()=>C.cp>=2&&C.mob.hp>C.mob.max*.5,fn:()=>{C.buffs.quicken={t:(6+T('quickenDur'))*C.cp};C.cp=0;line('You feel quicker.','l-sys');}},
    {id:'vendetta',name:'Vendetta',talent:'vendetta',cd:45,cost:()=>0,desc:'For 6 seconds every attack is a critical strike.',ai:()=>C.mob.hp>C.mob.max*.5,fn:()=>{C.buffs.vendetta={t:6};line('Vendetta!','l-sys');}},
    {id:'flurry',name:'Blade Flurry',talent:'flurry',cd:30,cost:()=>25,desc:'Your weapon swings hit 50% harder for 12 seconds. 30 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.flurry={t:12};line('Blade Flurry!','l-sys');}},
    {id:'coldblood',name:'Cold Blood',talent:'coldblood',cd:30,cost:()=>0,desc:'Your next attack is a critical strike that deals double crit damage. 30 second cooldown.',cond:()=>!C.buffs.coldblood,ai:()=>C.cp>=4,
      fn:()=>{C.buffs.coldblood={t:10};line('Your blood runs cold.','l-sys');}},
    {id:'adrenaline',name:'Adrenaline Rush',talent:'adrenaline',cd:60,cost:()=>0,desc:'Energy regenerates three times as fast for 12 seconds. 60 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.adrenaline={t:12};line('Adrenaline Rush!','l-sys');}},
    {id:'premed',name:'Premeditation',talent:'premed',cd:20,cost:()=>0,desc:'Gain 2 combo points at once. 20 second cooldown.',cond:()=>C.cp<4,ai:()=>true,fn:()=>{C.cp=Math.min(5,C.cp+2);line('You plan your next move.','l-sys');}},
    {id:'shadowdance',name:'Shadow Dance',talent:'shadowdance',cd:60,cost:()=>0,desc:'For 8 seconds Backstab can be used again and again. 60 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,
      fn:()=>{C.buffs.dance={t:8};openWin('opening',8);line('You melt into a Shadow Dance.','l-sys');}},
  ],
  mage:[
    {id:'firebolt',name:'Firebolt',lvl:1,cast:()=>2.5-T('castSpeed'),cost:()=>25+lv()*3,desc:'A bolt of fire. 2.5 second cast.',ai:()=>true,fn:()=>{hitMob(14+lv()*4.5+ST.sp*.8,{label:'Firebolt'});surgeChance();}},
    {id:'burst',name:'Flame Burst',lvl:6,cd:8,cost:()=>20+lv()*2.5,desc:'Instant fire damage. 8 second cooldown.',ai:()=>true,fn:()=>{hitMob(12+lv()*3.2+ST.sp*.45,{label:'Flame Burst'});surgeChance();}},
    {id:'frost',name:'Frost Lance',lvl:4,cast:()=>2-T('frostCast'),cost:()=>20+lv()*2.5,desc:'Frost damage that slows the target\'s attacks for 6 seconds.',cond:()=>!(C.mob.chill>0),ai:()=>true,
      fn:()=>{hitMob((10+lv()*3.6+ST.sp*.65)*(1+T('frostDmg')/100),{label:'Frost Lance'});if(C.mob)C.mob.chill=6+T('chillDur');surgeChance();}},
    {id:'surge',name:'Arcane Surge',lvl:1,react:'surge',cost:()=>0,desc:'Only when Arcane Surge lights up after a spell. Instant and free.',ai:()=>true,fn:()=>{C.win.surge=0;hitMob((20+lv()*5+ST.sp)*(1+T('surgeDmg')/100),{label:'Arcane Surge'});}},
    {id:'ward',name:'Mana Ward',lvl:8,cd:20,cost:()=>30+lv()*3,desc:'Absorbs damage for 30 seconds.',cond:()=>C.absorb<=0,ai:()=>true,fn:()=>{C.absorb=(40+lv()*10+ST.sp)*(1+T('absorb')/100);C.buffs.absorb={t:30};line('A Mana Ward surrounds you.','l-sys');}},
    {id:'cinder',name:'Cinderstorm',talent:'cinder',cd:20,cast:()=>3,cost:()=>60+lv()*5,desc:'Huge fire damage. 20 second cooldown.',ai:()=>true,fn:()=>hitMob(60+lv()*9+ST.sp*1.5,{label:'Cinderstorm'})},
    {id:'deepfreeze',name:'Deep Freeze',talent:'deepfreeze',cd:25,cost:()=>30+lv()*3,desc:'Frost damage that freezes the target for 4 seconds. 25 second cooldown.',ai:()=>true,
      fn:()=>{hitMob((20+lv()*4+ST.sp*.8)*(1+T('frostDmg')/100),{label:'Deep Freeze'});if(C.mob){C.mob.frozen=4;line(`${C.mob.name} is frozen solid.`,'l-sys');}}},
    {id:'combustion',name:'Combustion',talent:'combustion',cd:60,cost:()=>20+lv()*2,desc:'+50% critical strike chance for 10 seconds. 60 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.combustion={t:10};line('Combustion!','l-sys');}},
    {id:'frozenorb',name:'Frozen Orb',talent:'frozenorb',cd:20,cast:()=>1.5,cost:()=>50+lv()*4,desc:'Heavy frost damage and a long slow. 20 second cooldown.',ai:()=>true,
      fn:()=>{hitMob((50+lv()*8+ST.sp*1.3)*(1+T('frostDmg')/100),{label:'Frozen Orb'});if(C.mob)C.mob.chill=10+T('chillDur');}},
    {id:'missiles',name:'Arcane Missiles',talent:'missiles',cd:8,cost:()=>20+lv()*2.5,desc:'Three instant arcane bolts. 8 second cooldown.',ai:()=>true,
      fn:()=>{for(let i=0;i<3&&C.mob;i++)hitMob(8+lv()*2+ST.sp*.35,{label:'Arcane Missile'});surgeChance();}},
    {id:'arcpower',name:'Arcane Power',talent:'arcpower',cd:60,cost:()=>20+lv()*2,desc:'+35% damage for 15 seconds. 60 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.arcpower={t:15};line('Arcane Power!','l-sys');}},
  ],
  priest:[
    {id:'smite',name:'Holy Smite',lvl:1,cast:()=>2-T('smiteCast'),cost:()=>22+lv()*3,desc:'Holy damage. 2 second cast.',ai:()=>true,fn:()=>{atone(hitMob((12+lv()*3.9+ST.sp*.7)*(1+T('smiteDmg')/100),{label:'Holy Smite'}));sparkChance();}},
    {id:'mend',name:'Mend',lvl:1,cast:()=>2,cost:()=>(25+lv()*3.5)*healCostMult(),desc:'Heals you, or whoever in your party is hurt worst. 2 second cast.',cond:()=>C.hp<ST.hpMax||partyAlive().some(p=>p.hp<compStats(p.n).hpMax),ai:()=>C.hp<ST.hpMax*.45||partyAlive().some(p=>p.hp<compStats(p.n).hpMax*.45),fn:()=>{const amt=30+lv()*9+ST.sp*.8;if(partyAlive().length)healLowest(amt*(1+T('heal')/100),'Mend');else healHero(amt,'Mend');sparkChance();}},
    {id:'ward',name:'Ward of Light',lvl:2,cd:12,cost:()=>(25+lv()*3)*healCostMult(),desc:'Absorbs damage for 30 seconds. 12 second cooldown.',cond:()=>C.absorb<=0,ai:()=>true,fn:()=>{C.absorb=(30+lv()*8+ST.sp*.5)*(1+T('heal')/100)*(1+T('absorb')/100);C.buffs.absorb={t:30};line('A Ward of Light surrounds you.','l-sys');}},
    {id:'rot',name:'Shadow Rot',lvl:4,cost:()=>20+lv()*2.5,desc:'Shadow damage over 15 seconds.',cond:()=>!C.mob.dots.rot,ai:()=>C.mob.hp>C.mob.max*.35,fn:()=>{addDot('rot',(18+lv()*4.5+ST.sp*.5)*(1+T('dot')/100),15,'Shadow Rot');line(`${C.mob.name} is afflicted by Shadow Rot.`,'l-hit');}},
    {id:'spark',name:'Divine Spark',lvl:1,react:'spark',cost:()=>0,desc:'Only when Divine Spark lights up. An instant, free, empowered Smite.',ai:()=>true,fn:()=>{C.win.spark=0;atone(hitMob((12+lv()*3.9+ST.sp*.7)*1.5*(1+T('smiteDmg')/100),{label:'Divine Spark'}));}},
    {id:'voidlash',name:'Void Lash',talent:'voidlash',cd:10,cost:()=>40+lv()*4,desc:'Shadow damage that heals you for half. 10 second cooldown.',ai:()=>true,fn:()=>{const a=hitMob(30+lv()*6+ST.sp,{label:'Void Lash'});if(a)healHero(a/2,'Void Lash');}},
    {id:'renew',name:'Renew',talent:'renew',cd:6,cost:()=>(20+lv()*2.5)*healCostMult(),desc:'Whoever is hurt worst heals over 9 seconds. 6 second cooldown.',
      cond:()=>C.hp<ST.hpMax||partyAlive().some(p=>p.hp<compStats(p.n).hpMax),ai:()=>C.hp<ST.hpMax*.75||partyAlive().some(p=>p.hp<compStats(p.n).hpMax*.75),
      fn:()=>{C.buffs.renew={t:9,tick:3,amt:(12+lv()*3.5+ST.sp*.3)*(1+T('heal')/100)};line('Renew settles over your party.','l-heal');}},
    {id:'shadowform',name:'Shadowform',talent:'shadowform',cd:45,cost:()=>30+lv()*3,desc:'For 15 seconds deal 30% more damage and take 15% less. 45 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.shadowform={t:15};line('You slip into Shadowform.','l-sys');}},
    {id:'circle',name:'Circle of Light',talent:'circle',cd:20,cast:()=>1.5,cost:()=>(60+lv()*5)*healCostMult(),desc:'Heal you, your pet and your whole party for 35% of their health. 20 second cooldown.',
      ai:()=>C.hp<ST.hpMax*.6||partyAlive().filter(p=>p.hp<compStats(p.n).hpMax*.6).length>=2,
      fn:()=>{const k=.35*(1+T('heal')/100);C.hp=Math.min(ST.hpMax,C.hp+ST.hpMax*k);C.chill=0;for(const p of C.party)p.chill=0;for(const p of partyAlive())p.hp=Math.min(compStats(p.n).hpMax,p.hp+compStats(p.n).hpMax*k);
        const pet=petOf();if(pet&&pet.hp>0)pet.hp=Math.min(petStats(pet).hpMax,pet.hp+petStats(pet).hpMax*k);fx('+heal','#7cf08a','hero');line('A Circle of Light washes over everyone.','l-heal');}},
    {id:'penance',name:'Penance',talent:'penance',cd:10,cost:()=>(30+lv()*3)*healCostMult(),desc:'Holy damage that heals whoever is hurt worst for as much. 10 second cooldown.',ai:()=>true,
      fn:()=>{const a=hitMob(25+lv()*5+ST.sp*.9,{label:'Penance'});if(a)healLowest(a*(1+T('heal')/100),'Penance');}},
    {id:'painsup',name:'Pain Suppression',talent:'painsup',cd:60,cost:()=>(25+lv()*2)*healCostMult(),desc:'You, your pet and your party take 40% less damage for 8 seconds. 60 second cooldown.',
      ai:()=>C.hp<ST.hpMax*.5||partyAlive().some(p=>p.hp<compStats(p.n).hpMax*.4)||!!(C.mob&&C.mob.boss&&C.mob.hp<C.mob.max*.5),fn:()=>{C.buffs.painsup={t:8};line('Pain Suppression shields everyone.','l-heal');}},
  ],
  hunter:[
    {id:'shot',name:'Steady Shot',lvl:1,cast:()=>C.buffs.lnl?0:1.5-T('shotCast'),cost:()=>(10+lv()*1.5)*shotCostMult(),desc:'A careful, heavy shot. 1.5 second cast.',ai:()=>true,fn:()=>{C.buffs.lnl=null;hitMob((wroll()+10+lv()*1.6)*shotMult(),{phys:1,label:'Steady Shot'});}},
    {id:'mark',name:'Mark Prey',lvl:2,cost:()=>8+lv(),desc:'The target takes 10% more damage from you and your pet for 60 seconds.',cond:()=>!(C.mob.marked>0),ai:()=>C.mob.hp>C.mob.max*.5,fn:()=>{C.mob.marked=60;line(`You mark ${C.mob.name}.`,'l-sys');}},
    {id:'pierce',name:'Piercing Shot',lvl:4,cd:6,cost:()=>(15+lv()*2)*shotCostMult(),desc:'Instant. Ignores armor. 6 second cooldown.',ai:()=>true,fn:()=>hitMob((wroll()*.6+18+lv()*2.5)*shotMult(),{label:'Piercing Shot'})},
    {id:'sting',name:'Venom Sting',lvl:6,cost:()=>14+lv()*1.8,desc:'Poisons the target over 12 seconds.',cond:()=>!C.mob.dots.sting,ai:()=>C.mob.hp>C.mob.max*.35,fn:()=>{addDot('sting',(14+lv()*3.5+ST.ap*.1)*(1+T('stingDmg')/100),12,'Venom Sting');line(`${C.mob.name} is poisoned.`,'l-hit');}},
    {id:'coord',name:'Coordinated Strike',lvl:1,react:'exposed',cost:()=>10,desc:'Needs a pet at Loyal bond or better. Lights up when your pet uses its special ability or lands a critical hit: you and your pet strike together.',ai:()=>true,
      fn:()=>{C.win.exposed=0;hitMob(wroll()*1.2+20+lv()*2,{phys:1,sure:1,label:'Coordinated Strike'});if(C.mob)petHit(1.5,'Coordinated Strike');}},
    {id:'mendpet',name:'Mend Pet',lvl:4,cast:()=>2,cost:()=>15+lv()*2,desc:'Heals your pet. 2 second cast.',cond:()=>{const p=petOf();return p&&p.hp>0&&p.hp<petStats(p).hpMax;},ai:()=>{const p=petOf();return p&&p.hp<petStats(p).hpMax*.45;},
      fn:()=>{const p=petOf();if(!p||p.hp<=0)return;const a=Math.round(40+lv()*10);p.hp=Math.min(petStats(p).hpMax,p.hp+a);line(`Mend Pet heals ${p.name} for ${a}.`,'l-heal');fx('+'+a,'#7cf08a','pet');}},
    {id:'packfury',name:'Pack Fury',talent:'packfury',cd:40,cost:()=>20+lv()*2,desc:'Your pet deals 50% more damage and attacks faster for 10 seconds. 40 second cooldown.',cond:()=>{const p=petOf();return p&&p.hp>0;},ai:()=>C.mob.hp>C.mob.max*.4,fn:()=>{C.buffs.packfury={t:10};line('Your pet is filled with fury!','l-sys');}},
    {id:'aimed',name:'Aimed Shot',talent:'aimed',cd:10,cast:()=>2.5,cost:()=>(25+lv()*3)*shotCostMult(),desc:'A slow, heavy shot. 2.5 second cast, 10 second cooldown.',ai:()=>true,
      fn:()=>hitMob((wroll()*1.8+30+lv()*4)*shotMult(),{phys:1,label:'Aimed Shot'})},
    {id:'wrath',name:'Bestial Wrath',talent:'wrath',cd:60,cost:()=>20+lv()*2,desc:'Your pet deals double damage for 10 seconds. 60 second cooldown.',cond:()=>{const p=petOf();return p&&p.hp>0;},ai:()=>C.mob.hp>C.mob.max*.4,
      fn:()=>{C.buffs.wrath={t:10};line('Bestial Wrath! Your pet goes wild.','l-sys');}},
    {id:'trueshot',name:'Trueshot',talent:'trueshot',cd:60,cost:()=>20+lv()*2,desc:'+25% damage and +15% critical strike chance for 12 seconds. 60 second cooldown.',ai:()=>C.mob.hp>C.mob.max*.4,
      fn:()=>{C.buffs.trueshot={t:12};line('Trueshot!','l-sys');}},
    {id:'explosive',name:'Explosive Shot',talent:'explosive',cd:20,cost:()=>(25+lv()*3)*shotCostMult(),desc:'An instant shot that bursts and keeps burning for 6 seconds. 20 second cooldown.',ai:()=>true,
      fn:()=>{if(hitMob((wroll()+25+lv()*3.5)*shotMult(),{label:'Explosive Shot'})&&C.mob)addDot('explosive',(20+lv()*4)*shotMult(),6,'Explosive Shot');}},
  ],
};
function hasShield(){const o=H().gear.offhand;return !!(o&&o.otype==='shield'&&o.dur>0);}
function healCostMult(){return 1-T('healCost')/100;}
/* Atonement (Discipline): Smite damage also heals whoever is hurt worst */
function atone(a){if(a&&T('atone')&&C.mob!==undefined)healLowest(a*T('atone')/100*(1+T('heal')/100),'Atonement');return a;}
function shotCostMult(){return 1-T('shotCost')/100;}
function shotMult(){return 1+T('shotDmg')/100;}
/* Auto mode's priority order, where it differs from the bar order */
const ABIL_AI={hunter:['mendpet','mark','coord','wrath','trueshot','explosive','packfury','aimed','sting','pierce','shot']};
function aiList(){const o=ABIL_AI[H().cls];return o?o.map(id=>bar().find(a=>a.id===id)).filter(Boolean):bar();}
function surgeChance(){if(R()*100<10+T('procChance'))openWin('surge',6);}
function sparkChance(){if(R()*100<15+T('procChance'))openWin('spark',6);}
function knows(id){const h=H(),a=ABIL[h.cls].find(x=>x.id===id);if(!a)return false;return a.talent?(h.talents[a.talent]||0)>0:h.lvl>=a.lvl;}
/* the action bar: every class ability, plus the talent abilities you've learned (so it stays within keys 1-9) */
function bar(){const h=H();return ABIL[h.cls].filter(a=>!a.talent||(h.talents[a.talent]||0)>0);}
function canUse(a,quiet){
  const fail=m=>{if(!quiet)err(m);return false;};
  if(!knows(a.id))return fail("You haven't learned that yet.");
  if(C.phase!=='fight'||!C.mob)return fail('You have no target.');
  if(C.taming)return fail('You are busy taming.');
  if(C.cast)return fail('You are busy casting.');
  if(C.gcd>0||(a.cd&&C.cds[a.id]>0))return fail('Ability is not ready yet.');
  if(a.react&&!(C.win[a.react]>0))return fail('That needs an opening.');
  if(a.cond&&!a.cond())return fail(a.id==='finish'?'Target needs to be below 20% health.':'You can\'t use that right now.');
  const cost=a.cost();if(C.res<cost){const message=`Not enough ${CLASSES[H().cls].res}.`;if(!quiet)toast(message);return fail(message);}
  return true;
}
function useAb(a,manual){
  C.res-=a.cost();if(a.cd)C.cds[a.id]=a.cd;
  const ct=a.cast?a.cast():0;C.gcd=Math.max(1.5,ct);
  if(CLASSES[H().cls].res==='mana')C.lastCast=C.fightT;
  H().stats.uses++;if(manual){H().stats.manual++;}
  if(ct>0){C.cast={a,t:ct,max:ct};}else{C.anim.hero=.2;a.fn();}
}
function press(i){
  const a=bar()[i];if(!a||!C)return;C.lastInput=C.run;
  if(canUse(a,false))useAb(a,true);
}

