/* Keymaster: a run along Alder Street (KM-STREET). Five homes come up for sale, one at a time. For each, the worksheet
   updates as you change your offer, your down payment and the plan for the work; then you make an offer (the sellers
   say yes, counter or no) or pass, and see that home's first year. The goal: own three homes that each pay you. */
(function(){'use strict';
 const M=window.KeymasterModel, $=s=>document.querySelector(s);
 const money=n=>(n<0?'−$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
 const pct=(n,d=1)=>(n*100).toFixed(d)+'%';
 const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 let R=M.newRun(), L=M.current(R);
 const S={price:0,down:0.25,rehab:'refresh',phase:'run',noes:0,counter:null};
 const MIN=()=>L.ask-60000, MAX=()=>L.ask+20000;

 // A simple picture for each kind of home, drawn from the same shapes so the street looks like one street.
 function house(kind){
  const ground='<rect x="0" y="112" width="220" height="18" fill="#7a9a5c"/>', sign='<rect x="168" y="99" width="34" height="13" fill="#f4eddc" stroke="#6a4a32"/><text x="185" y="108" font-size="7" text-anchor="middle" fill="#6a4a32" font-family="system-ui">FOR SALE</text>';
  const win=(x,y,lit=true)=>'<rect x="'+x+'" y="'+y+'" width="20" height="16" fill="'+(lit?'#f2d080':'#6a6a72')+'"/>', door=(x,c='#6a4a32')=>'<rect x="'+x+'" y="90" width="16" height="24" fill="'+c+'"/>';
  const shapes={
   duplex:['A two-storey duplex with two front doors; the right half looks tired','<polygon points="18,58 110,14 202,58" fill="#5a4a5e"/><rect x="150" y="22" width="14" height="24" fill="#7b6a63"/><rect x="26" y="56" width="84" height="58" fill="#e6dcc6"/><rect x="110" y="56" width="84" height="58" fill="#cfc4ac"/>'+win(38,66)+win(72,66)+win(122,66,false)+win(156,66,false)+'<line x1="122" y1="66" x2="142" y2="82" stroke="#4a4a52" stroke-width="2"/>'+door(58)+door(142,'#8a6444')+'<rect x="110" y="56" width="2" height="58" fill="#8a7a6a"/>'],
   pretty:['A freshly painted house with a neat lawn, a new porch and flower beds','<polygon points="34,62 110,22 186,62" fill="#3e5a6e"/><rect x="42" y="60" width="136" height="54" fill="#f6f1e6"/>'+win(56,70)+win(144,70)+door(102,'#2f4f6a')+'<rect x="40" y="104" width="140" height="4" fill="#d8cbb2"/><circle cx="22" cy="110" r="7" fill="#d77a8a"/><circle cx="36" cy="111" r="6" fill="#e8b84a"/>'],
   triplex:['A tall, worn three-storey building with three stacked flats and a patched roof','<polygon points="50,30 110,8 170,30" fill="#5a4a4e"/><rect x="62" y="12" width="26" height="8" fill="#9a8a7a"/><rect x="56" y="30" width="108" height="84" fill="#c9bca2"/>'+win(68,38,false)+win(132,38)+win(68,62)+win(132,62,false)+win(68,86)+door(102,'#7a5a3a')+'<line x1="132" y1="38" x2="152" y2="54" stroke="#4a4a52" stroke-width="2"/>'],
   corner:['A plain house on a corner lot beside a street sign','<polygon points="40,60 110,24 180,60" fill="#6a5a4a"/><rect x="48" y="58" width="124" height="56" fill="#e2d6bc"/>'+win(62,70)+win(140,70)+door(100)+'<rect x="16" y="64" width="4" height="50" fill="#5a5a5a"/><rect x="6" y="58" width="26" height="9" fill="#3a7a4a"/>'],
   cottage:['A small, plain one-storey cottage with a low fence','<polygon points="60,74 110,44 160,74" fill="#7a4a3a"/><rect x="66" y="72" width="88" height="42" fill="#efe4cc"/>'+win(78,82)+door(118)+'<rect x="20" y="104" width="40" height="3" fill="#a08060"/><rect x="160" y="104" width="40" height="3" fill="#a08060"/>'],
  };
  const [label,body]=shapes[kind]||shapes.duplex;
  return '<svg viewBox="0 0 220 130" role="img" aria-label="'+label+'">'+ground+body+sign+'</svg>';
 }

 function fill(){
  $('#addr').textContent=L.address+', Millbrook';$('#kind').textContent=L.kind;$('#ask').textContent=money(L.ask);
  $('#blurb').textContent=L.blurb;$('#units').innerHTML=L.units.map(u=>'<li>'+u+'</li>').join('');
  $('#house').innerHTML=house(L.picture);$('#rehabLabel').textContent=L.planLabel;$('#rentLabel').textContent=L.rentLabel;
  $('.rehab').innerHTML=Object.entries(L.plans).map(([k,r])=>'<button type="button" role="radio" data-rehab="'+k+'">'+r.name+
   '<small>'+money(r.cost)+' · then '+money((L.baseRent||0)+r.rent)+' a month in rent</small></button>').join('');
 }

 function street(){
  const done=M.paying(R);
  $('#goal').textContent=M.finished(R)?(M.won(R)?'You built a street that pays.':'The street is sold.'):
   'Own '+M.GOAL+' homes on Alder Street that each pay you: '+done+' of '+M.GOAL+' so far.';
  $('#cash').textContent=money(R.cash);
  $('#doors').innerHTML=M.STREET.map((h,i)=>{
   const got=R.homes[i];const cls=got?(got.bought?'owned'+(got.onCash<0?' costly':''):'gone'):(i===R.at?'now':'');
   const what=got?(got.bought?'Yours':'Sold'):(i===R.at?'For sale now':'Coming up');
   return '<li class="'+cls+'"'+(i===R.at&&!M.finished(R)?' aria-current="step"':'')+'><b>'+h.address.split(' ')[0]+'</b>'+what+'</li>';}).join('');
 }

 function render(){
  street();if(!L)return;
  const a=M.analyze(S,L), live=S.phase==='run', afford=M.canAfford(R,S,L);
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
  mark('arv',a.equity>=0,money(a.arv),'What it is worth let, from its net income. Paying '+money(S.price)+' plus '+money(L.plans[S.rehab].cost)+
   ' of work leaves you '+(a.equity>=0?money(a.equity)+' of equity on day one.':money(-a.equity)+' under water on day one.'));
  document.querySelectorAll('.sheet button').forEach(b=>b.disabled=!live);
  $('[data-offer="-2000"]').disabled=!live||S.price<=MIN();$('[data-offer="2000"]').disabled=!live||S.price>=MAX();
  $('#afford').hidden=!live||afford;
  $('#afford').textContent='This needs '+money(a.cashIn)+' of your cash, and you have '+money(R.cash)+'. A smaller down payment, less work or a lower price would fit.';
  if(live&&!afford)$('#offerBtn').disabled=true;
 }

 function show(html){const box=$('#answer');box.innerHTML=html;box.hidden=false;box.scrollIntoView&&box.scrollIntoView({block:'nearest'});}
 const nextButton=()=>'<div class="actions"><button type="button" class="primary" data-act="next">'+(M.finished(R)?'See your street':'Next listing: '+M.STREET[R.at].address)+'</button></div>';

 function offer(){
  if(S.phase!=='run'||!M.canAfford(R,S,L))return;
  const r=M.respond(S.price,L);
  if(r.answer==='yes'){buy(S.price,'The sellers say yes to '+money(S.price)+'.');return;}
  if(r.answer==='counter'){
   S.phase='counter';S.counter=r.price;render();
   const fits=M.canAfford(R,{...S,price:r.price},L);
   show('<h2>They come back at '+money(r.price)+'</h2><p>"We would like this done, but not at '+money(S.price)+'. We can do '+money(r.price)+'."</p>'+
    (fits?'':'<p class="afford">At '+money(r.price)+' this needs more cash than you have.</p>')+
    '<div class="actions"><button type="button" class="primary" data-act="take"'+(fits?'':' disabled')+'>Take '+money(r.price)+'</button><button type="button" data-act="walk">Walk away</button></div>');
   return;
  }
  S.noes++;
  if(S.noes>=2){lose('They stop answering your offers, and sell to another buyer.');return;}
  show('<h2>They say no</h2><p>"That is well below what we are asking." They are willing to sell, but not at '+money(S.price)+'. You can make one more offer.</p>'+
   '<div class="actions"><button type="button" class="primary" data-act="change">Change your offer</button></div>');
 }

 function buy(price,line){
  S.price=price;S.phase='done';
  const y=M.buyHome(R,S),v=M.verdict(y.onCash);render();
  const months=y.months.map(m=>'<li class="'+(m.notes.length?'event':'')+'" title="'+m.notes.join('; ')+'"><b>'+MONTHS[m.m-1]+
   '</b>'+money(m.net)+(m.notes.length?'<b>'+m.notes[0]+'</b>':'')+'</li>').join('');
  show('<h2>'+line+' You own '+L.address+'.</h2><p>The work: '+y.rehab.name.toLowerCase()+'. Here is its first year, after the mortgage, taxes and insurance:</p>'+
   '<ul class="months" aria-label="Its first year, month by month">'+months+'</ul>'+
   '<p><small>A quiet month pays more than the worksheet\'s '+money(y.analysis.cashFlow)+': the '+money(y.analysis.setAside)+' set aside stays yours until something breaks or a unit sits empty.</small></p>'+
   '<table class="year"><tr><th>Cash in hand over the year</th><td>'+money(y.cash)+'</td></tr>'+
   '<tr><th>Loan paid down</th><td>'+money(y.principal)+'</td></tr>'+
   '<tr><th>Equity on day one (worth let, less price and work)</th><td>'+money(y.equity)+'</td></tr>'+
   '<tr><th><b>Its year</b></th><td><b>'+money(y.total)+'</b>, '+pct(y.onCash)+' on the '+money(y.analysis.cashIn)+' you put in</td></tr></table>'+
   '<p class="verdict">'+v.word+'</p><p>'+v.text+(y.onCash>=0?' It counts toward your street.':' It does not count toward your street.')+'</p>'+
   '<p><small>If prices keep rising '+pct(L.appreciation,0)+' a year, add about '+money(y.growth)+'. Nobody promises that, so it is not counted above.</small></p>'+
   nextButton());
 }

 // Pass, walk away, or lose it to another buyer: the home is gone for this run.
 function lose(line){
  S.phase='done';const p=M.passHome(R);render();
  show('<h2>'+line+'</h2><p>Another investor bought it for '+money(p.price)+', did the full work, and '+
   (p.onCash>=0?'made '+pct(p.onCash):'lost '+pct(-p.onCash))+' on their cash in the first year. '+L.lesson+'</p>'+nextButton());
 }

 function startListing(){
  L=M.current(R);Object.assign(S,{price:L.ask,down:0.25,rehab:'refresh',phase:'run',noes:0,counter:null});
  fill();render();$('#answer').hidden=true;$('.listing').hidden=false;$('.sheet').hidden=false;
 }

 function next(){
  if(M.finished(R)){showStreet();return;}
  startListing();scrollTo&&scrollTo(0,0);$('#offerBtn').focus({preventScroll:true});
 }

 function showStreet(){
  $('.listing').hidden=true;$('.sheet').hidden=true;street();
  const flow=R.homes.filter(h=>h.bought).reduce((n,h)=>n+h.cashFlow,0);
  const rows=M.STREET.map((h,i)=>{const got=R.homes[i];
   if(!got.bought){const p=M.passed(h);return '<li><b>'+h.address+'</b><span>Sold to someone else</span><small>They '+(p.onCash>=0?'made ':'lost ')+pct(Math.abs(p.onCash))+' in the first year. '+h.lesson+'</small></li>';}
   const v=M.verdict(got.onCash);
   return '<li class="'+(got.onCash>=0?'pays':'lost')+'"><b>'+h.address+'</b><span>'+v.word+'</span><small>Bought for '+money(got.choice.price)+
    ', '+money(got.cashFlow)+' a month on the worksheet. '+h.lesson+'</small></li>';}).join('');
  show('<h2>'+(M.won(R)?'You built a street that pays':'Your street')+'</h2>'+
   '<p>'+(M.won(R)?M.paying(R)+' homes on Alder Street pay you. ':'Only '+M.paying(R)+' of the '+M.GOAL+' homes you needed pay you. ')+
   'Together they bring in '+money(flow)+' a month on the worksheet, and you still have '+money(R.cash)+' of your savings.</p>'+
   '<ul class="yours" aria-label="The five homes on Alder Street">'+rows+'</ul>'+
   '<div class="actions"><button type="button" class="primary" data-act="again">Walk Alder Street again</button></div>');
 }

 function again(){R=M.newRun();startListing();scrollTo&&scrollTo(0,0);$('#offerBtn').focus({preventScroll:true});}

 // On a phone the offer controls are a screen above the answer: take the player back to them.
 function backToOffer(){$('#sheetTitle').scrollIntoView&&$('#sheetTitle').scrollIntoView({block:'start'});$('[data-offer="2000"]').focus({preventScroll:true});}

 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.offer){S.price=Math.max(MIN(),Math.min(MAX(),S.price+ +b.dataset.offer));render();}
  else if(b.dataset.down){S.down=+b.dataset.down;render();}
  else if(b.dataset.rehab){S.rehab=b.dataset.rehab;render();}
  else if(b.id==='offerBtn')offer();
  else if(b.id==='passBtn')lose('You pass on '+L.address+'.');
  else if(b.dataset.act==='take')buy(S.counter,'You take their '+money(S.counter)+'.');
  else if(b.dataset.act==='walk')lose('You walk away.');
  else if(b.dataset.act==='next')next();
  else if(b.dataset.act==='again')again();
  else if(b.dataset.act==='change')backToOffer();
 });

 startListing();
 window.__keymaster={M,S,run:()=>R,listing:()=>L,render,offer,next,again};   // the checks page drives the real buttons
})();
