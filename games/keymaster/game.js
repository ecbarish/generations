/* KM0: one listing, one analyzer, one buy. The worksheet updates as you change your offer, your down payment and the
   plan for Unit B; then you make an offer (the sellers say yes, counter or no) or pass, and see your first year. */
(function(){'use strict';
 const M=window.KeymasterModel, L=M.LISTING, $=s=>document.querySelector(s);
 const money=n=>(n<0?'−$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
 const pct=(n,d=1)=>(n*100).toFixed(d)+'%';
 const START={price:L.ask,down:0.25,rehab:'refresh'};
 const MIN=L.ask-60000, MAX=L.ask+20000;
 const S={...START,phase:'run',noes:0,counter:null};

 function fill(){
  $('#addr').textContent=L.address;$('#kind').textContent=L.kind;$('#ask').textContent=money(L.ask);
  $('#blurb').textContent=L.blurb;$('#unitA').textContent='Unit A: '+money(L.unitA.rent)+' a month. '+L.unitA.note;
  $('.rehab').innerHTML=Object.entries(M.REHABS).map(([k,r])=>'<button type="button" role="radio" data-rehab="'+k+'">'+r.name+
   '<small>'+money(r.cost)+' · then '+money(r.rent)+' a month</small></button>').join('');
 }

 function render(){
  const a=M.analyze(S), live=S.phase==='run';
  $('#offer').textContent=money(S.price);
  document.querySelectorAll('[data-down]').forEach(b=>b.setAttribute('aria-checked',String(+b.dataset.down===S.down)));
  document.querySelectorAll('[data-rehab]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.rehab===S.rehab)));
  $('#rent').textContent=money(a.rent);$('#aside').textContent='−'+money(a.setAside);$('#fixed').textContent='−'+money(a.fixed);
  $('#loanLabel').textContent='Mortgage ('+pct(1-S.down,0)+' borrowed at '+pct(L.rate,0)+', '+L.years+' years)';
  $('#mortgage').textContent='−'+money(a.mortgage);
  $('#flow').textContent=money(a.cashFlow);$('#flow').closest('tr').className='total '+(a.cashFlow>=200?'good':a.cashFlow<0?'bad':'');
  const mark=(m,ok,v,note)=>{const li=document.querySelector('[data-m="'+m+'"]');li.className=ok?'good':'bad';li.querySelector('.v').textContent=v;if(note!==undefined)li.querySelector('small').textContent=note;};
  mark('cap',a.capRate>=L.marketCap,pct(a.capRate));
  mark('coc',a.cashOnCash>=0.08,pct(a.cashOnCash),'Your yearly cash flow, '+money(a.cashFlow*12)+', on the '+money(a.cashIn)+' you put in (down payment, closing costs, the work).');
  mark('one',a.onePercent>=0.01,pct(a.onePercent,2));
  mark('arv',a.equity>=0,money(a.arv),'What it is worth let, from its net income. Paying '+money(S.price)+' plus '+money(M.REHABS[S.rehab].cost)+
   ' of work leaves you '+(a.equity>=0?money(a.equity)+' of equity on day one.':money(-a.equity)+' under water on day one.'));
  document.querySelectorAll('.sheet button').forEach(b=>b.disabled=!live);
  $('[data-offer="-2000"]').disabled=!live||S.price<=MIN;$('[data-offer="2000"]').disabled=!live||S.price>=MAX;
 }

 function show(html){const box=$('#answer');box.innerHTML=html;box.hidden=false;box.scrollIntoView&&box.scrollIntoView({block:'nearest'});}

 function offer(){
  if(S.phase!=='run')return;
  const r=M.respond(S.price);
  if(r.answer==='yes'){buy(S.price,'The sellers say yes to '+money(S.price)+'.');return;}
  if(r.answer==='counter'){
   S.phase='counter';S.counter=r.price;render();
   show('<h2>They come back at '+money(r.price)+'</h2><p>"We would like this done quickly, but not at '+money(S.price)+'. We can do '+money(r.price)+'."</p>'+
    '<div class="actions"><button type="button" class="primary" data-act="take">Take '+money(r.price)+'</button><button type="button" data-act="walk">Walk away</button></div>');
   return;
  }
  S.noes++;
  if(S.noes>=2){S.phase='done';render();showPassed('They stop answering your offers, and sell to another buyer.');return;}
  show('<h2>They say no</h2><p>"That is well below what we are asking." They are keen to sell, but not at '+money(S.price)+'. You can make one more offer.</p>');
 }

 function buy(price,line){
  S.price=price;S.phase='done';render();
  const y=M.firstYear(S), v=M.verdict(y.onCash);
  const months=y.months.map(m=>'<li class="'+(m.notes.length?'event':'')+'" title="'+m.notes.join('; ')+'"><b>'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m.m-1]+
   '</b>'+money(m.net)+(m.notes.length?'<b>'+m.notes[0]+'</b>':'')+'</li>').join('');
  show('<h2>'+line+' You own 14 Alder Street.</h2><p>Unit B: '+y.rehab.name.toLowerCase()+'. Here is your first year, after the mortgage, taxes and insurance:</p>'+
   '<ul class="months" aria-label="Your first year, month by month">'+months+'</ul>'+
   '<p><small>A quiet month pays more than the worksheet\'s '+money(y.analysis.cashFlow)+': the '+money(y.analysis.setAside)+' set aside stays yours until something breaks or a unit sits empty, and this year both happened.</small></p>'+
   '<table class="year"><tr><th>Cash in hand over the year</th><td>'+money(y.cash)+'</td></tr>'+
   '<tr><th>Loan paid down</th><td>'+money(y.principal)+'</td></tr>'+
   '<tr><th>Equity on day one (worth let, less price and work)</th><td>'+money(y.equity)+'</td></tr>'+
   '<tr><th><b>Your year</b></th><td><b>'+money(y.total)+'</b>, '+pct(y.onCash)+' on the '+money(y.analysis.cashIn)+' you put in</td></tr></table>'+
   '<p class="verdict">'+v.word+'</p><p>'+v.text+'</p>'+
   '<p><small>If prices keep rising '+pct(L.appreciation,0)+' a year, add about '+money(y.growth)+'. Nobody promises that, so it is not counted above.</small></p>'+
   '<div class="actions"><button type="button" class="primary" data-act="again">Try the deal again</button></div>');
 }

 function showPassed(line){
  const p=M.passed();
  show('<h2>'+line+'</h2><p>Another investor bought it for '+money(p.price)+', did the full renovation, and made '+pct(p.onCash)+
   ' on their cash in the first year. Was passing right? Run the numbers again and see.</p>'+
   '<div class="actions"><button type="button" class="primary" data-act="again">Try the deal again</button></div>');
 }

 function again(){Object.assign(S,START,{phase:'run',noes:0,counter:null});$('#answer').hidden=true;render();$('#offerBtn').focus();}

 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.offer){S.price=Math.max(MIN,Math.min(MAX,S.price+ +b.dataset.offer));render();}
  else if(b.dataset.down){S.down=+b.dataset.down;render();}
  else if(b.dataset.rehab){S.rehab=b.dataset.rehab;render();}
  else if(b.id==='offerBtn')offer();
  else if(b.id==='passBtn'){S.phase='done';render();showPassed('You pass on 14 Alder Street.');}
  else if(b.dataset.act==='take')buy(S.counter,'You take their '+money(S.counter)+'.');
  else if(b.dataset.act==='walk'){S.phase='done';render();showPassed('You walk away.');}
  else if(b.dataset.act==='again')again();
 });

 fill();render();
 window.__keymaster={M,S,render,offer,again};   // the checks page drives the real buttons; this lets it read the state
})();
