/* Keymaster's rules: the deal analyzer, the sellers, the first year, and KM-STREET's run along Alder Street.
   Pure rules: no DOM, timers or storage. The analyzer is the game (docs/proposals/keymaster.md): the lines are the ones
   Evan picked on 2026-10-14 (cash flow, cap rate, cash-on-cash, the 1% rule and after-repair value). The street is
   docs/plans/keymaster-street.md, approved by Evan on 2026-10-19. */
(function(root){'use strict';

 // The bank, the costs and the market are the same for every home on the street.
 const TERMS={rate:0.07, years:30, closing:0.03, vacancy:0.05, repairs:0.05, marketCap:0.075, appreciation:0.03};

 // What you can do with 14 Alder's Unit B before letting it (KM0's names, kept for the checks).
 const REHABS={
  asis:{name:'Clean it and let it as it is', cost:2000, rent:900},
  refresh:{name:'Refresh: paint, floors, fixtures', cost:8000, rent:1050},
  full:{name:'Full renovation: kitchen and bath', cost:18000, rent:1200},
 };

 // Listings a run can draw. The first five are the original Alder Street, in the order a first visit
 // walks them. Numbers are round on purpose: the player should be able to check them on paper.
 // `baseRent` is rent already coming in; each plan's `rent` is what the worked part brings once let.
 // `lowest` is the price they will take: an offer at or above it is a yes. From `counterAt` of
 // asking up to that price they counter at `lowest`. Below `counterAt` they refuse. A higher offer
 // is never a worse answer than a lower one. Every take-price stays above 92.5% of asking, so a
 // desktop bid that only comes down that far still gets a counter. `mood` is the seller's manner.
 // Each `events` entry is a month of the first year: a repair (`cost`), or rent lost (`loseRent` in dollars, `lose` a share).
 const LISTINGS=[
  {id:'alder14', address:'14 Alder Street', kind:'Duplex, built 1962', picture:'duplex',
   ask:240000, lowest:232000, floor:0.90, counterAt:0.84, taxes:3600, insurance:1500, baseRent:1100,
   blurb:'Two units side by side. Unit A is let to a long-time tenant. Unit B has been empty since spring and needs work. '+
         'The owners have already moved away for a new job and would like a quick, simple sale.',
   units:['Unit A: $1,100 a month. Let: Mrs Okafor, 6 years, pays on the 1st','Unit B: empty, needs work'],
   planLabel:'Unit B before you let it', rentLabel:'Rent, both units', plans:REHABS, unitA:{rent:1100},
   events:[{m:5,cost:1400,note:'The furnace gives out: $1,400'},{m:9,loseRent:1100,note:'Unit A between tenants for a month'}],
   mood:'hurried',
   lesson:'Price is where you make money.'},
  {id:'alder3', address:'3 Alder Street', kind:'Single-family home, built 1998, renovated', picture:'pretty',
   ask:285000, lowest:276000, counterAt:0.91, taxes:4800, insurance:1800, baseRent:0,
   blurb:'New kitchen, fresh paint and a lawn someone loves. It shows beautifully. The owners are in no hurry to sell.',
   units:['Empty and ready: three bedrooms, two baths','Homes like it nearby let for about $1,900 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Let it as it is',cost:0,rent:1900},refresh:{name:'Small touches: blinds, a new lock, paint the deck',cost:6000,rent:1950},
          full:{name:'Finish the basement as a fourth bedroom',cost:25000,rent:2050}},
   events:[{m:3,cost:1100,note:'The water heater: $1,100'},{m:8,lose:1,note:'Between tenants for a month'}],
   mood:'proud',
   lesson:'A nice house is not always a good rental.'},
  {id:'alder22', address:'22 Alder Street', kind:'Triplex, built 1931', picture:'triplex',
   ask:255000, lowest:247000, counterAt:0.85, taxes:5400, insurance:2400, baseRent:0,
   blurb:'Three flats, let cheaply for years. Worn kitchens, old carpet and a roof that leaks over the top flat. '+
         'The owner is retiring and wants it gone before winter.',
   units:['Three flats, each let for $750 a month','Each could let for $950 refreshed, or $1,150 fully renovated'],
   planLabel:'The three flats before you let them', rentLabel:'Rent, all three flats',
   plans:{asis:{name:'Patch the roof and leave the flats',cost:3000,rent:2250},refresh:{name:'Refresh all three flats',cost:15000,rent:2850},
          full:{name:'Full renovation, all three flats',cost:42000,rent:3450}},
   events:[{m:4,cost:1800,note:'The roof leaks again: $1,800'},{m:10,lose:1/3,note:'One flat between tenants for a month'}],
   mood:'tired',
   lesson:'The plan for the work is the deal.'},
  {id:'alder9', address:'9 Alder Street', kind:'Single-family home on the corner, built 1955', picture:'corner',
   ask:190000, lowest:177000, counterAt:0.86, taxes:8400, insurance:1500, baseRent:0,
   blurb:'Strong rent for the price, and it passes every quick screen. The corner lot is assessed high, and the taxes '+
         'went up again this spring.',
   units:['Empty: three bedrooms, one bath','Homes like it nearby let for about $1,950 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1500,rent:1950},refresh:{name:'Refresh: paint, floors, fixtures',cost:6000,rent:2050},
          full:{name:'Full renovation: kitchen and bath',cost:16000,rent:2150}},
   events:[{m:6,cost:1200,note:'The sewer line backs up: $1,200'},{m:11,lose:1,note:'Between tenants for a month'}],
   mood:'firm',
   lesson:'The rent can clear 1% of the price, and the house can still be a costly buy. The 1% rule is only a quick screen.'},
  {id:'alder31', address:'31 Alder Street', kind:'Cottage, built 1940', picture:'cottage',
   ask:150000, lowest:146000, counterAt:0.85, taxes:2400, insurance:1100, baseRent:0,
   blurb:'Two bedrooms at the quiet end of the street. Small, plain and solid. The last tenant stayed nine years.',
   units:['Empty: two bedrooms, one bath','Homes like it nearby let for about $1,300 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:2000,rent:1300},refresh:{name:'Refresh: paint, floors, fixtures',cost:5000,rent:1400},
          full:{name:'Full renovation: kitchen and bath',cost:12000,rent:1500}},
   events:[{m:7,cost:600,note:'A storm takes part of the fence: $600'}],
   mood:'steady',
   lesson:'Cash is limited: a small, steady buy can finish the street.'},
  {id:'birch8', address:'8 Birch Street', kind:'Duplex, built 1954', picture:'duplex', mood:'hurried',
   ask:200000, lowest:190000, counterAt:0.84, taxes:3000, insurance:1300, baseRent:1000,
   blurb:'The owners are already packed. They took a job in another town and want a simple sale this month.',
   units:['Unit A: $1,000 a month. Let: Mr Pell, 4 years','Unit B: empty, needs paint'],
   planLabel:'Unit B before you let it', rentLabel:'Rent, both units',
   plans:{asis:{name:'Clean it and let it as it is',cost:1500,rent:800},refresh:{name:'Refresh: paint, floors, fixtures',cost:7000,rent:980},
          full:{name:'Full renovation: kitchen and bath',cost:16000,rent:1150}},
   events:[{m:6,cost:900,note:'A pipe leaks: $900'}],
   lesson:'A hurried seller still has a price.'},
  {id:'birch16', address:'16 Birch Street', kind:'Single-family home, built 2004, renovated', picture:'pretty', mood:'proud',
   ask:275000, lowest:262000, counterAt:0.91, taxes:5100, insurance:1900, baseRent:0,
   blurb:'The owners are proud of the new kitchen and are in no hurry. They would rather wait than take a low offer.',
   units:['Empty and ready: three bedrooms, two baths','Homes like it nearby let for about $1,750 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Let it as it is',cost:0,rent:1750},refresh:{name:'Small touches: blinds, a new lock, paint the deck',cost:5000,rent:1800},
          full:{name:'Finish the attic as a bedroom',cost:22000,rent:1900}},
   events:[{m:4,cost:800,note:'The dishwasher fails: $800'}],
   lesson:'A proud price is not a good rent.'},
  {id:'cedar4', address:'4 Cedar Lane', kind:'Triplex, built 1924', picture:'triplex', mood:'tired',
   ask:225000, lowest:214000, counterAt:0.84, taxes:4600, insurance:2100, baseRent:0,
   blurb:'The owner is tired of the late-night calls and wants the building gone before winter.',
   units:['Three flats, each let for $700 a month','Each could let for $900 refreshed, or $1,050 fully renovated'],
   planLabel:'The three flats before you let them', rentLabel:'Rent, all three flats',
   plans:{asis:{name:'Patch the roof and leave the flats',cost:2500,rent:2100},refresh:{name:'Refresh all three flats',cost:14000,rent:2700},
          full:{name:'Full renovation, all three flats',cost:36000,rent:3150}},
   events:[{m:3,cost:1500,note:'The roof leaks again: $1,500'}],
   lesson:'The work you choose is the deal.'},
  {id:'dock27', address:'27 Dock Street', kind:'Single-family home on the corner, built 1948', picture:'corner', mood:'firm',
   ask:165000, lowest:156000, counterAt:0.86, taxes:7600, insurance:1400, baseRent:0,
   blurb:'The seller is firm. The rent looks strong on a quick screen, and the tax bill does not.',
   units:['Empty: three bedrooms, one bath','Homes like it nearby let for about $1,700 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1200,rent:1700},refresh:{name:'Refresh: paint, floors, fixtures',cost:5500,rent:1780},
          full:{name:'Full renovation: kitchen and bath',cost:14000,rent:1860}},
   events:[{m:8,cost:700,note:'The gutter fails: $700'}],
   lesson:'A firm price and a high tax bill can fool a quick screen.'},
  {id:'elm2', address:'2 Elm Court', kind:'Cottage, built 1938', picture:'cottage', mood:'eager',
   ask:118000, lowest:112000, counterAt:0.84, taxes:1600, insurance:900, baseRent:0,
   blurb:'The last owner moved in with family and is eager to be done with the keys.',
   units:['Empty: two bedrooms, one bath','Homes like it nearby let for about $1,050 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1000,rent:1050},refresh:{name:'Refresh: paint, floors, fixtures',cost:4000,rent:1150},
          full:{name:'Full renovation: kitchen and bath',cost:10000,rent:1250}},
   events:[{m:2,cost:400,note:'A window sticks shut and the repair is $400'}],
   lesson:'A small eager sale can finish the block.'},
  {id:'birch12', address:'12 Birch Street', kind:'Duplex, built 1958', picture:'duplex', mood:'hurried',
   ask:250000, lowest:238000, counterAt:0.84, taxes:4200, insurance:1900, baseRent:1100,
   blurb:'The owners leave for a new job next month. They want a simple sale, and they will not give the duplex away.',
   units:['Unit A: $1,100 a month. Let: the Hale family, 3 years','Unit B: empty, needs paint and a lock'],
   planLabel:'Unit B before you let it', rentLabel:'Rent, both units',
   plans:{asis:{name:'Clean it and let it as it is',cost:2500,rent:950},refresh:{name:'Refresh: paint, floors, fixtures',cost:9000,rent:1200},
          full:{name:'Full renovation: kitchen and bath',cost:22000,rent:1350}},
   events:[{m:4,cost:1600,note:'The boiler fails: $1,600'}],
   lesson:'A hurried seller still has a price.'},
  {id:'birch21', address:'21 Birch Street', kind:'Triplex, built 1928', picture:'triplex', mood:'tired',
   ask:285000, lowest:271000, counterAt:0.85, taxes:6000, insurance:2600, baseRent:0,
   blurb:'The owner is tired of three flights of stairs and wants the building gone before winter. The flats have been let cheaply for years.',
   units:['Three flats, each let for $800 a month','Each could let for about $1,000 refreshed'],
   planLabel:'The three flats before you let them', rentLabel:'Rent, all three flats',
   plans:{asis:{name:'Patch the roof and leave the flats',cost:4000,rent:2400},refresh:{name:'Refresh all three flats',cost:16000,rent:2800},
          full:{name:'Full renovation, all three flats',cost:40000,rent:3600}},
   events:[{m:5,cost:2000,note:'The roof leaks again: $2,000'}],
   lesson:'The work you choose is the deal.'},
  {id:'birch40', address:'40 Birch Street', kind:'Cottage, built 1942', picture:'cottage', mood:'eager',
   ask:170000, lowest:158000, counterAt:0.84, taxes:3400, insurance:1300, baseRent:0,
   blurb:'The last owner has already moved in with family and is eager to hand over the keys. The cottage is small, and the price is not a gift.',
   units:['Empty: two bedrooms, one bath','Homes like it nearby let for about $1,600 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:2000,rent:1450},refresh:{name:'Refresh: paint, floors, fixtures',cost:5500,rent:1600},
          full:{name:'Full renovation: kitchen and bath',cost:14000,rent:1700}},
   events:[{m:7,cost:700,note:'A storm takes part of the fence: $700'}],
   lesson:'A small sale can still be a tight one.'},
  {id:'birch5', address:'5 Birch Street', kind:'Single-family home, built 2001, renovated', picture:'pretty', mood:'proud',
   ask:320000, lowest:306000, counterAt:0.91, taxes:6000, insurance:2100, baseRent:0,
   blurb:'The owners are proud of the new kitchen and are in no hurry. They would rather wait than take a low offer.',
   units:['Empty and ready: four bedrooms, two baths','Homes like it nearby let for about $1,900 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Let it as it is',cost:0,rent:1900},refresh:{name:'Small touches: blinds, a new lock, paint the deck',cost:6000,rent:1980},
          full:{name:'Finish the attic as a bedroom',cost:24000,rent:2100}},
   events:[{m:3,cost:900,note:'The dishwasher fails: $900'}],
   lesson:'A proud price is not a good rent.'},
  {id:'birch33', address:'33 Birch Street', kind:'Single-family home on the corner, built 1951', picture:'corner', mood:'firm',
   ask:176000, lowest:168000, counterAt:0.86, taxes:8600, insurance:1500, baseRent:0,
   blurb:'The seller is firm. The rent looks strong on a quick screen, and the corner lot is taxed hard.',
   units:['Empty: three bedrooms, one bath','Homes like it nearby let for about $1,800 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1500,rent:1800},refresh:{name:'Refresh: paint, floors, fixtures',cost:5500,rent:1880},
          full:{name:'Full renovation: kitchen and bath',cost:15000,rent:1960}},
   events:[{m:8,cost:800,note:'The gutter fails: $800'}],
   lesson:'A firm price and a high tax bill can fool a quick screen.'},
  {id:'maple7', address:'7 Maple Street', kind:'Duplex, built 1950', picture:'duplex', mood:'hurried',
   ask:210000, lowest:198000, counterAt:0.84, taxes:2800, insurance:1200, baseRent:900,
   blurb:'The owners took a job out of town and want the sale done this month. They will not give the duplex away.',
   units:['Unit A: $900 a month. Let: the Nguyen family, 5 years','Unit B: empty, needs paint'],
   planLabel:'Unit B before you let it', rentLabel:'Rent, both units',
   plans:{asis:{name:'Clean it and let it as it is',cost:1500,rent:750},refresh:{name:'Refresh: paint, floors, fixtures',cost:7000,rent:1000},
          full:{name:'Full renovation: kitchen and bath',cost:15000,rent:1150}},
   events:[{m:6,cost:800,note:'A pipe leaks: $800'}],
   lesson:'A hurried seller still has a price.'},
  {id:'maple19', address:'19 Maple Street', kind:'Single-family home, built 2008, renovated', picture:'pretty', mood:'proud',
   ask:360000, lowest:348000, counterAt:0.92, taxes:6400, insurance:2200, baseRent:0,
   blurb:'Fresh paint, a new kitchen and a lawn that looks like a magazine. The owners are proud of it and in no hurry.',
   units:['Empty and ready: four bedrooms, two baths','Homes like it nearby let for about $1,850 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Let it as it is',cost:0,rent:1850},refresh:{name:'Small touches: blinds, a new lock, paint the deck',cost:5000,rent:1900},
          full:{name:'Finish the basement as a bedroom',cost:28000,rent:2050}},
   events:[{m:4,cost:900,note:'The dishwasher fails: $900'}],
   lesson:'This is the door you pass. A handsome house can still be a bad rent.'},
  {id:'maple11', address:'11 Maple Street', kind:'Triplex, built 1926', picture:'triplex', mood:'tired',
   ask:230000, lowest:216000, counterAt:0.84, taxes:4200, insurance:2000, baseRent:0,
   blurb:'The owner is tired of the stairs and the calls. The flats have been let cheaply, and the roof needs a patch.',
   units:['Three flats, each let for $700 a month','Each could let for about $950 refreshed'],
   planLabel:'The three flats before you let them', rentLabel:'Rent, all three flats',
   plans:{asis:{name:'Patch the roof and leave the flats',cost:2500,rent:2100},refresh:{name:'Refresh all three flats',cost:14000,rent:2700},
          full:{name:'Full renovation, all three flats',cost:36000,rent:3150}},
   events:[{m:3,cost:1400,note:'The roof leaks again: $1,400'}],
   lesson:'The work you choose is the deal.'},
  {id:'maple28', address:'28 Maple Street', kind:'Single-family home on the corner, built 1946', picture:'corner', mood:'firm',
   ask:148000, lowest:140000, counterAt:0.86, taxes:7000, insurance:1300, baseRent:0,
   blurb:'The rent looks strong until you read the tax bill. The seller will not come down far.',
   units:['Empty: three bedrooms, one bath','Homes like it nearby let for about $1,550 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1200,rent:1550},refresh:{name:'Refresh: paint, floors, fixtures',cost:5000,rent:1620},
          full:{name:'Full renovation: kitchen and bath',cost:13000,rent:1700}},
   events:[{m:8,cost:600,note:'The gutter fails: $600'}],
   lesson:'A high tax bill can fool a quick screen.'},
  {id:'maple2', address:'2 Maple Street', kind:'Cottage, built 1936', picture:'cottage', mood:'eager',
   ask:112000, lowest:106000, counterAt:0.84, taxes:1500, insurance:800, baseRent:0,
   blurb:'The last owner has moved in with family and wants the keys gone. The cottage is small, and it can close the street.',
   units:['Empty: two bedrooms, one bath','Homes like it nearby let for about $1,050 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:1000,rent:1050},refresh:{name:'Refresh: paint, floors, fixtures',cost:4000,rent:1150},
          full:{name:'Full renovation: kitchen and bath',cost:9000,rent:1250}},
   events:[{m:2,cost:350,note:'A window sticks shut and the repair is $350'}],
   lesson:'A small buy can close the street.'},
 ].map(h=>Object.assign({},TERMS,h));
 const CLASSIC=['alder14','alder3','alder22','alder9','alder31'];
 const POOL=LISTINGS, byId=Object.fromEntries(POOL.map(h=>[h.id,h]));
 const STREET=CLASSIC.map(id=>byId[id]);
 const LISTING=STREET[0];
 const START_CASH=200000, GOAL=3;
 // Replays are whole blocks, not a reshuffle of Alder Street. A harder block comes after a win.
 // Each one still has three homes a careful buyer can afford from $200,000.
 const REPLAYS=[
  ['birch8','birch16','cedar4','dock27','elm2'],
  ['alder14','birch16','cedar4','dock27','elm2'],
  ['birch8','alder3','alder22','dock27','elm2'],
 ];
 // After a win the next block is Birch Street only: homes the first street did not show,
 // tighter cash, and the opener is not a yes at the asking price.
 const HARDER=[
  ['birch12','birch5','birch21','birch33','birch40'],
 ];
 // The third street. Two doors never pay, so a careful buyer passes them and still clears three.
 const MAPLE=['maple7','maple19','maple11','maple28','maple2'];
 const LADDER=[
  {place:'Alder Street', line:'Own 3 homes that each pay you.'},
  {place:'Birch Street', line:'Own 3 homes that each pay you.'},
  {place:'Maple Street', line:'Two doors do not pay.'},
 ];
 function dealFor(seed,tier){
  const level=tier|0;
  if(level>=2) return MAPLE.slice();
  const table=level>0?HARDER:REPLAYS;
  return table[Math.abs(seed|0)%table.length].slice();
 }
 // What the ladder names after this block. The last street's next goal is a standing one.
 function nextGoal(tier){
  const level=tier|0;
  if(level<=0) return {kind:'street', place:'Birch Street', line:'Own 3 homes that each pay you.'};
  if(level===1) return {kind:'street', place:'Maple Street', line:'Two doors do not pay.'};
  return {kind:'best', place:null, line:'Beat your best combined earnings.'};
 }
 function placeOf(ids){
  const names=[];
  for(const id of ids||[]){
   const home=byId[id]; if(!home) continue;
   const street=home.address.replace(/^\d+\s+/,'');
   if(!names.includes(street)) names.push(street);
  }
  if(!names.length) return 'Alder Street';
  if(names.length===1) return names[0];
  return names.slice(0,-1).join(', ')+' and '+names[names.length-1];
 }

 const round=(n,step=1)=>Math.round(n/step)*step;
 const plansOf=L=>L.plans||REHABS;
 const lowestOf=L=>L.lowest||round(L.ask*L.floor,1000);

 // The monthly payment on a fixed-rate loan.
 function payment(loan,rate,years){
  const r=rate/12,n=years*12;
  if(loan<=0)return 0;
  if(r===0)return loan/n;
  return loan*r/(1-Math.pow(1+r,-n));
 }

 // How much of the loan the first year of payments pays off (the rest is interest).
 function principalYearOne(loan,rate,years){
  const r=rate/12,pay=payment(loan,rate,years);let owed=loan;
  for(let m=0;m<12;m++)owed-=pay-owed*r;
  return loan-owed;
 }

 // The deal analyzer: every line of the worksheet from the three choices the player makes.
 function analyze(choice,L=LISTING){
  const price=choice.price, down=choice.down, plans=plansOf(L), rehab=plans[choice.rehab]||plans.asis;
  const rent=(L.baseRent!==undefined?L.baseRent:L.unitA.rent)+rehab.rent;   // a month, once everything is let
  const setAside=rent*(L.vacancy+L.repairs);
  const fixed=(L.taxes+L.insurance)/12;
  const noi=(rent-setAside-fixed)*12;                                  // net operating income, a year
  const loan=price*(1-down);
  const mortgage=payment(loan,L.rate,L.years);
  const cashFlow=rent-setAside-fixed-mortgage;                         // a month, after everything
  const cashIn=price*down+price*L.closing+rehab.cost;                  // what you put in on day one
  const arv=round(noi/L.marketCap,1000);                               // after-repair value: what it's worth let
  return {
   price, down, rehab:choice.rehab, rent, setAside, fixed, noi, loan, mortgage, cashFlow, cashIn, arv,
   capRate:noi/price,
   cashOnCash:cashFlow*12/cashIn,
   onePercent:rent/price,                                              // the quick screen: rent at least 1% of price
   equity:arv-price-rehab.cost,                                        // what you gain on day one by buying right
  };
 }

 // Yes at their take-price and above, a counter at that price down to the floor, and a refusal below it.
 // The counter price does not rise as the offer rises, so a higher bid is never a worse answer.
 function respond(price,L=LISTING){
  const take=lowestOf(L), floor=L.ask*L.counterAt;
  if(price>=take)return {answer:'yes',price};
  if(price>=floor)return {answer:'counter',price:take};
  return {answer:'no',price:null};
 }

 // Your first year, month by month: the same story every time, so the numbers are what you learn from.
 // Each home has its own repair and its own empty month; the set-aside money is there for exactly this.
 function firstYear(choice,L=LISTING){
  const a=analyze(choice,L), rehab=plansOf(L)[choice.rehab]||plansOf(L).asis;
  const months=[];let cash=0;
  for(let m=1;m<=12;m++){
   let rent=a.rent, cost=0;const notes=[];
   for(const e of L.events||[])if(e.m===m){
    if(e.cost)cost+=e.cost;
    if(e.loseRent)rent-=e.loseRent;
    if(e.lose)rent-=round(a.rent*e.lose);
    notes.push(e.note);
   }
   const net=rent-cost-a.fixed-a.mortgage;
   cash+=net;months.push({m,rent,cost,net,notes});
  }
  const principal=principalYearOne(a.loan,L.rate,L.years);
  const growth=a.arv*L.appreciation;
  const total=cash+principal+a.equity;                                // what the year made you: cash, loan paid down, and
                                                                       // what you gained (or lost) by the price you paid.
                                                                       // Market growth isn't promised, so it's shown apart.
  return {months,cash,principal,growth,equity:a.equity,total,onCash:total/a.cashIn,analysis:a,rehab};
 }

 // A verdict in plain words, from the year's return (cash flow, loan paid down, day-one equity) on the cash you put in.
 function verdict(onCash){
  if(onCash>=0.30)return {word:'A great buy',text:'You bought below what it is worth once let, and it paid you every month.'};
  if(onCash>=0.12)return {word:'A solid buy',text:'It paid its way and you paid a fair price. Most investors would take this year.'};
  if(onCash>=0)return {word:'A thin buy',text:'It paid, but not by much. A lower price or a better plan for the work would help.'};
  return {word:'A costly buy',text:'You paid more than it is worth once let, and the rent did not make up the difference.'};
 }

 // The year's verdict for the choice on the worksheet, before anyone has bought. `counts` is the street's
 // goal: a thin buy or better (the same test as paying()).
 function yearOutlook(choice,L=LISTING){
  const y=firstYear(choice,L), v=verdict(y.onCash);
  return {word:v.word, text:v.text, counts:y.onCash>=0, onCash:y.onCash, cashIn:y.analysis.cashIn, cashFlow:y.analysis.cashFlow};
 }

 // Which levers would bring this choice inside the cash on hand. minPrice is the lowest offer the screen
 // will allow right now: a counter locks it to the sellers' price, so a lower offer is not offered as a way out.
 // The price you would actually pay. A counter is not a finished buy until their price fits.
 function payPrice(price,L=LISTING){
  const r=respond(price,L);
  if(r.answer==='yes')return price;
  if(r.answer==='counter')return r.price;
  return null;
 }
 const cheapCache=new Map();
 // Cheapest seller-accepted buy on this home that still pays you. Null when none does.
 function cheapestPaying(L=LISTING){
  if(cheapCache.has(L.id))return cheapCache.get(L.id);
  let best=null; const plans=plansOf(L), seen=new Set();
  for(let price=L.ask-60000; price<=L.ask+20000; price+=2000){
   const pay=payPrice(price,L); if(pay==null)continue;
   for(const down of [0.2,0.25])for(const rehab of Object.keys(plans)){
    const key=pay+'|'+down+'|'+rehab; if(seen.has(key))continue; seen.add(key);
    const y=yearOutlook({price:pay,down,rehab},L);
    if(y.counts&&(!best||y.cashIn<best.cashIn))best={cashIn:y.cashIn,price:pay,down,rehab};
   }
  }
  cheapCache.set(L.id,best); return best;
 }
 // How many more paying homes the cash can still cover. Careful buys are the cheapest ones.
 function orderOf(run){
  const ids=run&&Array.isArray(run.order)?run.order:null;
  if(!ids||ids.length!==STREET.length||new Set(ids).size!==ids.length) return [];
  const list=ids.map(id=>byId[id]);
  return list.some(h=>!h)?[]:list;
 }
 function streetBudget(run){
  const need=Math.max(0,GOAL-paying(run)), costs=[], list=orderOf(run);
  for(let i=run.at;i<list.length;i++){const b=cheapestPaying(list[i]); if(b)costs.push(b.cashIn);}
  costs.sort((a,b)=>a-b);
  const careful=costs.slice(0,need).reduce((s,n)=>s+n,0);
  let left=run.cash, covers=0; for(const c of costs)if(left>=c){left-=c; covers++;}
  return {need, careful, covers, possible:need===0||(costs.length>=need&&careful<=run.cash)};
 }
 function projectBuy(run,choice){
  const L=current(run), y=yearOutlook(choice,L);
  return {cash:run.cash-y.cashIn, at:run.at+1, homes:run.homes.concat([{bought:true,onCash:y.counts?1:-1}]), order:run.order};
 }
 // This finished buy is what makes three paying homes impossible. A price the sellers reject spends nothing.
 function dooms(run,choice){
  const L=current(run); if(!L)return false;
  const pay=payPrice(choice.price,L); if(pay==null)return false;
  return streetBudget(run).possible&&!streetBudget(projectBuy(run,Object.assign({},choice,{price:pay}))).possible;
 }

 function affordHint(run,choice,L=current(run),minPrice=choice.price){
  const a=analyze(choice,L), plans=plansOf(L);
  const payNow=payPrice(choice.price,L);
  const fits=!!payNow&&analyze({price:payNow,down:choice.down,rehab:choice.rehab},L).cashIn<=run.cash&&a.cashIn<=run.cash;
  if(fits)return {fits:true, any:true, price:false, down:false, work:false, cashIn:a.cashIn};
  const seen=new Set(); let any=false, price=false, down=false, work=false;
  const curCost=(plans[choice.rehab]||plans.asis).cost;
  const floor=Math.min(minPrice,choice.price);
  for(let p=floor; p<=L.ask+20000; p+=2000){
   const pay=payPrice(p,L); if(pay==null||pay<floor)continue;
   for(const d of [0.2,0.25])for(const rehab of Object.keys(plans)){
    const key=pay+'|'+d+'|'+rehab; if(seen.has(key))continue; seen.add(key);
    if(analyze({price:pay,down:d,rehab},L).cashIn>run.cash)continue;
    any=true;
    if(pay<choice.price&&d===choice.down&&rehab===choice.rehab)price=true;
    if(d<choice.down)down=true;
    if(plans[rehab].cost<curCost&&pay===payNow&&d===choice.down)work=true;
   }
  }
  return {fits:false, any, price, down, work, cashIn:a.cashIn};
 }

 // What happened when you passed: the next buyer paid the sellers' lowest and did the full renovation.
 function passed(L=LISTING){
  const y=firstYear({price:lowestOf(L),down:0.25,rehab:'full'},L);
  return {price:y.analysis.price,onCash:y.onCash,cash:y.cash,total:y.total};
 }

 // ---- KM-STREET: one run along Alder Street. A run is plain data, so a later save (KM-SAVE) can keep it as it is.
 function newRun(seed,tier){
  const level=Number.isInteger(tier)&&tier>0?tier:0;
  return {cash:START_CASH, at:0, homes:[], offers:0, tier:level, order:seed!=null?dealFor(seed,level):STREET.map(h=>h.id), streets:[], best:0, sheet:null};
 }
 const current=run=>orderOf(run)[run.at]||null;
 const canAfford=(run,choice,L=current(run))=>!!L&&analyze(choice,L).cashIn<=run.cash;
 // Buy the home that is up: the cash goes, the home and its first year are kept, and the next listing comes up.
 function buyHome(run,choice){
  const L=current(run);if(!L)throw Error('no listing left');
  if(!canAfford(run,choice,L))throw Error('not enough cash');
  const year=firstYear(choice,L);
  run.cash-=year.analysis.cashIn;
  run.homes.push({id:L.id,bought:true,choice:{price:choice.price,down:choice.down,rehab:choice.rehab},
   onCash:year.onCash,cashFlow:year.analysis.cashFlow,yearCash:year.cash});
  run.at++;return year;
 }
 // Pass, or lose it to another buyer: it is gone for this run.
 function passHome(run){const L=current(run);if(!L)throw Error('no listing left');run.homes.push({id:L.id,bought:false});run.at++;return passed(L);}
 const paying=run=>run.homes.filter(h=>h.bought&&h.onCash>=0).length;   // the goal: a thin buy or better
 const finished=run=>run.at>=STREET.length;
 const won=run=>paying(run)>=GOAL;
 const monthEarn=run=>(run.homes||[]).filter(h=>h.bought).reduce((n,h)=>n+(h.cashFlow||0),0);
 function finishedStreets(run){
  const rows=(run.streets||[]).map(s=>({place:s.place, earn:s.earn}));
  if(finished(run)) rows.push({place:placeOf(run.order), earn:monthEarn(run)});
  return rows;
 }
 const combinedEarn=run=>finishedStreets(run).reduce((n,s)=>n+s.earn,0);

 // ---- KM-SAVE (approved by Evan, 2026-10-19): the run is kept between visits under its own key. The offer you
 // were editing is kept with it. Homes bought or passed, your cash, and the streets you finished stay as they were.
 const SAVE_KEY='keymaster-save-v1', SAVE_VERSION=1;
 const isNum=n=>typeof n==='number'&&isFinite(n);
 function valid(o){
  if(!o||o.v!==SAVE_VERSION||o.game!=='keymaster'||!isNum(o.cash)||o.cash<0||o.cash>START_CASH)return false;
  if(!Number.isInteger(o.at)||o.at<0||o.at>STREET.length||!Array.isArray(o.homes)||o.homes.length!==o.at)return false;
  if(!Array.isArray(o.order)||o.order.length!==STREET.length||new Set(o.order).size!==o.order.length) return false;
  if(o.order.some(id=>!byId[id])) return false;
  if(o.best!=null&&(!isNum(o.best)||o.best<0||o.best>1e9)) return false;
  if(o.leftAt!=null&&!isNum(o.leftAt)) return false;
  if(o.streets!=null){
   if(!Array.isArray(o.streets)||o.streets.length>12) return false;
   if(o.streets.some(s=>!s||typeof s.place!=='string'||!s.place||!isNum(s.earn))) return false;
  }
  if(o.sheet!=null){
   const s=o.sheet, home=byId[o.order[Math.min(o.at,o.order.length-1)]];
   if(o.at>=o.order.length||!s||!home||s.id!==home.id||!isNum(s.price)||(s.down!==0.2&&s.down!==0.25)||!home.plans[s.rehab]) return false;
   if(s.price<home.ask-60000-1||s.price>home.ask+20000+1) return false;
  }
  const ids=o.order;
  return o.homes.every((h,i)=>{
   const home=byId[ids[i]];
   return h&&home&&h.id===ids[i]&&typeof h.bought==='boolean'&&
    (!h.bought||(isNum(h.onCash)&&isNum(h.cashFlow)&&h.choice&&isNum(h.choice.price)&&isNum(h.choice.down)&&!!home.plans[h.choice.rehab]));
  });
 }
 const serialize=run=>({v:SAVE_VERSION,game:'keymaster',cash:run.cash,at:run.at,offers:run.offers||0,tier:run.tier||0,order:(run.order||[]).slice(),homes:run.homes.map(h=>JSON.parse(JSON.stringify(h))),streets:(run.streets||[]).map(s=>({place:s.place,earn:s.earn})),best:isNum(run.best)?run.best:0,sheet:run.sheet?{id:run.sheet.id,price:run.sheet.price,down:run.sheet.down,rehab:run.sheet.rehab}:null});
 const restore=o=>({cash:o.cash,at:o.at,homes:o.homes.map(h=>JSON.parse(JSON.stringify(h))),offers:isNum(o.offers)?o.offers:0,tier:Number.isInteger(o.tier)&&o.tier>0?o.tier:0,order:o.order.slice(),streets:Array.isArray(o.streets)?o.streets.map(s=>({place:s.place,earn:s.earn})):[],best:isNum(o.best)?o.best:0,sheet:o.sheet?{id:o.sheet.id,price:o.sheet.price,down:o.sheet.down,rehab:o.sheet.rehab}:null});
 // One line for the hub's card: how the street is going.
 const summary=run=>({summary:paying(run)+' of '+GOAL+' homes paying',detail:finished(run)?(won(run)?'Alder Street built':'Alder Street sold'):
  'Listing '+(run.at+1)+' of '+STREET.length+' · $'+Math.round(run.cash).toLocaleString('en-US')+' cash'});

 const api={TERMS,LISTING,REHABS,STREET,POOL,LADDER,MAPLE,START_CASH,GOAL,OFFER_STEP:10000,payment,principalYearOne,analyze,respond,firstYear,verdict,yearOutlook,affordHint,cheapestPaying,streetBudget,dooms,passed,
  newRun,dealFor,placeOf,nextGoal,current,orderOf,canAfford,buyHome,passHome,paying,finished,won,monthEarn,finishedStreets,combinedEarn,lowestOf,SAVE_KEY,SAVE_VERSION,valid,serialize,restore,summary};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.KeymasterModel=api;
})(typeof window!=='undefined'?window:globalThis);
