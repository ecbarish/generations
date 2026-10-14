/* KM0: Keymaster's deal analyzer and its one listing. Pure rules: no DOM, timers or storage.
   The analyzer is the game (docs/proposals/keymaster.md): the lines are the ones Evan picked on 2026-10-14
   (cash flow, cap rate, cash-on-cash, the 1% rule and after-repair value). */
(function(root){'use strict';

 // The one listing. Numbers are round on purpose: the player should be able to check them on paper.
 const LISTING={
  id:'alder14',
  address:'14 Alder Street, Millbrook',
  kind:'Duplex, built 1962',
  ask:240000,
  blurb:'Two units side by side. Unit A is let to a long-time tenant. Unit B has been empty since spring and needs work. '+
        'The owners have already moved away for a new job and would like a quick, simple sale.',
  unitA:{rent:1100,note:'Let: Mrs Okafor, 6 years, pays on the 1st'},
  taxes:3600, insurance:1500,                // a year
  rate:0.07, years:30, closing:0.03,         // the bank's terms; closing costs are a share of the price
  vacancy:0.05, repairs:0.05,                // set aside each month, as shares of the rent
  marketCap:0.075,                           // what nearby rentals sell for: value = yearly net income / this
  floor:0.90,                                // the motivated sellers' lowest: 90% of asking (the blurb hints at it)
  counterAt:0.84,                            // offers from here up to the floor get a counter at the floor
  appreciation:0.03,
 };

 // What you can do with Unit B before letting it.
 const REHABS={
  asis:{name:'Clean it and let it as it is', cost:2000, rent:900},
  refresh:{name:'Refresh: paint, floors, fixtures', cost:8000, rent:1050},
  full:{name:'Full renovation: kitchen and bath', cost:18000, rent:1200},
 };

 const round=(n,step=1)=>Math.round(n/step)*step;

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
  const price=choice.price, down=choice.down, rehab=REHABS[choice.rehab]||REHABS.asis;
  const rent=L.unitA.rent+rehab.rent;                                  // a month, both units let
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

 // The sellers' answer to an offer: yes, a counter at their floor, or no.
 function respond(price,L=LISTING){
  const f=price/L.ask;
  if(f>=L.floor)return {answer:'yes',price};
  if(f>=L.counterAt)return {answer:'counter',price:round(L.ask*L.floor,1000)};
  return {answer:'no',price:null};
 }

 // Your first year, month by month: the same story every time, so the numbers are what you learn from.
 // A furnace in month 5 and Unit A empty for a month in month 9; the set-aside money is there for exactly this.
 function firstYear(choice,L=LISTING){
  const a=analyze(choice,L), rehab=REHABS[choice.rehab]||REHABS.asis;
  const months=[];let cash=0;
  for(let m=1;m<=12;m++){
   let rent=a.rent, cost=0;const notes=[];
   if(m===5){cost+=1400;notes.push('The furnace gives out: $1,400');}
   if(m===9){rent-=L.unitA.rent;notes.push('Unit A between tenants for a month');}
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
  if(onCash>=0)return {word:'A thin buy',text:'It paid, but not by much. A lower price or a better plan for Unit B would help.'};
  return {word:'A costly buy',text:'You paid more than it is worth once let, and the rent did not make up the difference.'};
 }

 // What happened when you passed: the next buyer offered the floor and did the full renovation.
 function passed(L=LISTING){
  const y=firstYear({price:round(L.ask*L.floor,1000),down:0.25,rehab:'full'},L);
  return {price:y.analysis.price,onCash:y.onCash,cash:y.cash};
 }

 const api={LISTING,REHABS,payment,principalYearOne,analyze,respond,firstYear,verdict,passed};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.KeymasterModel=api;
})(typeof window!=='undefined'?window:globalThis);
