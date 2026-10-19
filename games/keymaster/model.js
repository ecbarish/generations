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

 // The five homes, in the order they come up for sale. Numbers are round on purpose: the player should be able to
 // check them on paper. `baseRent` is rent already coming in; each plan's `rent` is what the worked part brings once let.
 // `lowest` is the sellers' lowest price; offers from `counterAt` of asking up to it get a counter at `lowest`.
 // Each `events` entry is a month of the first year: a repair (`cost`), or rent lost (`loseRent` in dollars, `lose` a share).
 const STREET=[
  {id:'alder14', address:'14 Alder Street', kind:'Duplex, built 1962', picture:'duplex',
   ask:240000, lowest:216000, floor:0.90, counterAt:0.84, taxes:3600, insurance:1500, baseRent:1100,
   blurb:'Two units side by side. Unit A is let to a long-time tenant. Unit B has been empty since spring and needs work. '+
         'The owners have already moved away for a new job and would like a quick, simple sale.',
   units:['Unit A: $1,100 a month. Let: Mrs Okafor, 6 years, pays on the 1st','Unit B: empty, needs work'],
   planLabel:'Unit B before you let it', rentLabel:'Rent, both units', plans:REHABS, unitA:{rent:1100},
   events:[{m:5,cost:1400,note:'The furnace gives out: $1,400'},{m:9,loseRent:1100,note:'Unit A between tenants for a month'}],
   lesson:'Price is where you make money.'},
  {id:'alder3', address:'3 Alder Street', kind:'Single-family home, built 1998, renovated', picture:'pretty',
   ask:285000, lowest:276000, counterAt:0.91, taxes:4800, insurance:1800, baseRent:0,
   blurb:'New kitchen, fresh paint and a lawn someone loves. It shows beautifully. The owners are in no hurry to sell.',
   units:['Empty and ready: three bedrooms, two baths','Homes like it nearby let for about $1,900 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Let it as it is',cost:0,rent:1900},refresh:{name:'Small touches: blinds, a new lock, paint the deck',cost:6000,rent:1950},
          full:{name:'Finish the basement as a fourth bedroom',cost:25000,rent:2050}},
   events:[{m:3,cost:1100,note:'The water heater: $1,100'},{m:8,lose:1,note:'Between tenants for a month'}],
   lesson:'A nice house is not always a good rental.'},
  {id:'alder22', address:'22 Alder Street', kind:'Triplex, built 1931', picture:'triplex',
   ask:255000, lowest:235000, counterAt:0.85, taxes:5400, insurance:2400, baseRent:0,
   blurb:'Three flats, let cheaply for years. Worn kitchens, old carpet and a roof that leaks over the top flat. '+
         'The owner is retiring and wants it gone before winter.',
   units:['Three flats, each let for $750 a month','Each could let for $950 refreshed, or $1,150 fully renovated'],
   planLabel:'The three flats before you let them', rentLabel:'Rent, all three flats',
   plans:{asis:{name:'Patch the roof and leave the flats',cost:3000,rent:2250},refresh:{name:'Refresh all three flats',cost:15000,rent:2850},
          full:{name:'Full renovation, all three flats',cost:42000,rent:3450}},
   events:[{m:4,cost:1800,note:'The roof leaks again: $1,800'},{m:10,lose:1/3,note:'One flat between tenants for a month'}],
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
   lesson:'The 1% rule is only a quick screen.'},
  {id:'alder31', address:'31 Alder Street', kind:'Cottage, built 1940', picture:'cottage',
   ask:150000, lowest:138000, counterAt:0.85, taxes:2400, insurance:1100, baseRent:0,
   blurb:'Two bedrooms at the quiet end of the street. Small, plain and solid. The last tenant stayed nine years.',
   units:['Empty: two bedrooms, one bath','Homes like it nearby let for about $1,300 a month'],
   planLabel:'Before you let it', rentLabel:'Rent, once let',
   plans:{asis:{name:'Clean it and let it as it is',cost:2000,rent:1300},refresh:{name:'Refresh: paint, floors, fixtures',cost:5000,rent:1400},
          full:{name:'Full renovation: kitchen and bath',cost:12000,rent:1500}},
   events:[{m:7,cost:600,note:'A storm takes part of the fence: $600'}],
   lesson:'Cash is limited: a small, steady buy can finish the street.'},
 ].map(h=>Object.assign({},TERMS,h));
 const LISTING=STREET[0];
 const START_CASH=200000, GOAL=3;

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

 // The sellers' answer to an offer: yes, a counter at their lowest, or no.
 function respond(price,L=LISTING){
  const lowest=lowestOf(L);
  if(price>=lowest)return {answer:'yes',price};
  if(price>=L.ask*L.counterAt)return {answer:'counter',price:lowest};
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

 // What happened when you passed: the next buyer paid the sellers' lowest and did the full renovation.
 function passed(L=LISTING){
  const y=firstYear({price:lowestOf(L),down:0.25,rehab:'full'},L);
  return {price:y.analysis.price,onCash:y.onCash,cash:y.cash};
 }

 // ---- KM-STREET: one run along Alder Street. A run is plain data, so a later save (KM-SAVE) can keep it as it is.
 function newRun(){return {cash:START_CASH, at:0, homes:[]};}
 const current=run=>STREET[run.at]||null;
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

 const api={TERMS,LISTING,REHABS,STREET,START_CASH,GOAL,payment,principalYearOne,analyze,respond,firstYear,verdict,passed,
  newRun,current,canAfford,buyHome,passHome,paying,finished,won,lowestOf};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.KeymasterModel=api;
})(typeof window!=='undefined'?window:globalThis);
