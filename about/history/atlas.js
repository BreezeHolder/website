(()=>{
 'use strict';
 const plan=window.LANE_PLAN;
 const yearsAll=Array.from({length:9},(_,i)=>2018+i);
 const phases=plan.phases.map((p,i)=>({...p,yearsList:[[2018,2019,2020],[2021,2022,2023],[2024,2025],[2026]][i]}));
 const dir=['原子尺度的模拟','研发平台','科研智能体','AI 科学家研发'];
 const arrow='';
 const art=[
  {i:1,date:'2020.11',title:'SC20 获奖项目画面',id:'DP-007'},
  {i:12,date:'2023.05',title:'CALYPSO 云端界面',id:'DP-029'},
  {i:3,date:'2023.07',title:'预训练模型获奖证书',id:'DP-035'},
  {i:5,date:'2025.07',title:'SciMaster 界面与演示',id:'DP-085'},
  {i:6,date:'2025.11',title:'宜宾电解液系统发布现场',id:'DP-091'},
  {i:7,date:'2026.03',title:'HyperFIB 联合发布现场',id:'DP-103'},
  {i:9,date:'2026.06—07',title:'BioMaster 界面与演示',id:'DP-112'},
  {i:10,date:'2026.09',title:'ProteinTalks 研究配图',id:'DP-151'},
 ];
 const printAll=new URLSearchParams(location.search).get('layout')==='print';
 const view={phase:'all',year:null,expanded:new Set()};
 const total=plan.lanes.reduce((n,l)=>n+l.events.length,0);
 const firstApps=plan.lanes[2].events[0].year;
 function ps(){return phases.find(p=>p.id===view.phase)}
 function phaseFor(year){return phases.find(p=>p.yearsList.includes(year))}
 function scopedYears(){return view.year?[view.year]:ps()?.yearsList||yearsAll}
 function labelDate(e){return e.date+(['DP-001','DP-002'].includes(e.id)?'＊':'')}
 function node(e,n){
  const other=n>0?'<button type="button" class="extra" data-year="'+e.year+'" aria-label="查看 '+e.year+' 年三条时间线，这一类别同年另有 '+n+' 项">同年另 '+n+' 项</button>':'';
  return '<div class="node-slot"><button class="node" type="button" data-event="'+e.id+'" aria-label="'+e.date+' '+e.title+'，查看详情"><span class="date">'+labelDate(e)+'</span><i class="junction" aria-hidden="true"></i><b>'+e.title+'</b><span class="summary">'+e.short+'</span></button>'+other+'</div>';
 }
 function renderControls(){
  const controls=[{id:'all',label:'全程总览'},...phases.map(p=>({id:p.id,label:p.years}))];
  document.getElementById('ranges').innerHTML=controls.map(p=>'<button class="range" type="button" aria-pressed="'+(view.phase===p.id&&!view.year)+'" data-phase="'+p.id+'">'+p.label+'</button>').join('');
  const narration=ps(),s=document.getElementById('scope');
  if(view.year){s.innerHTML='<strong>'+view.year+' 年</strong><span>'+narration.title+' · '+narration.why+'</span><button type="button" class="plain" data-phase="all">回到全程</button>'}
  else if(narration){s.innerHTML='<strong>'+narration.title+'</strong><span>'+narration.why+'</span><button type="button" class="plain" data-phase="all">回到全程</button>'}
  else{s.innerHTML='<strong>分类大事记</strong><span>精选 '+total+' 项。选择时期或年份，可展开同期节点。</span>'}
 }
 function renderChart(){
  const yrs=scopedYears(),overview=view.phase==='all'&&!view.year;
  const el=document.getElementById('chart');
  el.style.setProperty('--n',yrs.length);el.classList.toggle('focused',!overview);
  const groups=phases.map((p,i)=>{
   const size=yrs.filter(y=>p.yearsList.includes(y)).length;
   return size?'<button class="era" data-phase="'+p.id+'" type="button" style="grid-column:span '+size+'" aria-label="'+p.years+' '+p.title+'，展开该时期">'+(overview?dir[i]:p.title)+'</button>':'';
  }).join('');
  const top='<div class="era-groups"><span class="era-blank">战略时期</span><div class="eras">'+groups+'</div></div><div class="year-row"><span class="year-title">事件类型</span><div class="years">'+yrs.map(y=>'<button class="year" data-year="'+y+'" type="button" aria-pressed="'+(view.year===y)+'" aria-label="查看 '+y+' 年">'+y+'</button>').join('')+'</div></div>';
  const lanes=plan.lanes.map(l=>{
   const note=l.id==='application'&&yrs[0]<firstApps&&yrs.filter(y=>y<firstApps).length>=2
    ?'<span class="before-apps" style="width:calc('+100*yrs.filter(y=>y<firstApps).length/yrs.length+'% - 15px)">2022 年，泓博医药在年报中披露 Hermite 的应用。</span>':'';
   const contents=yrs.map(y=>{
    const events=l.events.filter(e=>e.year===y);
    let inner='';
    if(overview&&!printAll&&events.length){const lead=events.find(e=>e.lead)||events[0];inner=node(lead,events.length-1)}
    else inner=events.map(e=>node(e,0)).join('');
    return '<div class="year-cell">'+inner+'</div>';
   }).join('');
   return '<section class="lane-row '+l.id+'" aria-label="'+l.title+'"><div class="side"><h2>'+l.title+'</h2><small>'+l.subtitle+'</small></div><div class="year-cells">'+contents+note+'</div></section>';
  }).join('');
  el.innerHTML=top+lanes;
  if(printAll){
    const fractions=yrs.map(y=>Math.max(1,...plan.lanes.map(l=>l.events.filter(e=>e.year===y).length))+'fr').join(' ');
    el.querySelectorAll('.eras,.years,.year-cells').forEach(group=>group.style.gridTemplateColumns=fractions);
  }
 }
 function renderMobile(){
  const yrs=scopedYears(),base=ps()?.yearsList||yearsAll;
  const overview=view.phase==='all'&&!view.year;
  const leads={research:['DP-001','DP-007','DP-151'],platform:['DP-134','DP-085','DP-122'],application:['DP-015','DP-091','DP-131']};
  const head='<div class="mheader"><span>'+(view.year?view.year+' 年':(ps()?.years||'2018—2026'))+'</span><label class="my-select">定位年份<select id="mobile-year"><option value="">全部年份</option>'+base.map(y=>'<option value="'+y+'" '+(y===view.year?'selected':'')+'>'+y+'</option>').join('')+'</select></label></div>';
  const lanes=plan.lanes.map(l=>{
   const included=l.events.filter(e=>yrs.includes(e.year));
   const limited=overview&&!view.expanded.has(l.id);
   const listed=limited?included.filter(e=>leads[l.id].includes(e.id)):included;
   const items=listed.map(e=>'<button class="mobile-event" type="button" data-event="'+e.id+'"><time>'+labelDate(e)+'</time><b>'+e.title+'</b><small>'+e.short+'</small></button>').join('')||'<p>本时段未选入此类节点。</p>';
   const toggle=overview?'<button type="button" class="m-more" data-toggle="'+l.id+'" aria-expanded="'+!limited+'">'+(limited?'展开这条线的 '+included.length+' 项事件':'收起这条线')+'</button>':'';
   return '<section class="mlane '+l.id+'"><h2><i aria-hidden="true"></i>'+l.title+'</h2><div>'+items+toggle+'</div></section>';
  }).join('');
  document.getElementById('mobile-chart').innerHTML=head+lanes;
 }
 function renderGallery(){
  const ys=scopedYears();let selected=art.filter(a=>ys.includes(Number(a.date.slice(0,4))));
  if(view.phase==='all'&&!view.year)selected=art.filter(a=>[1,12,6,10].includes(a.i));
  const gallery=document.querySelector('.gallery');gallery.hidden=!selected.length;
  document.getElementById('plates').innerHTML=selected.map(a=>'<button type="button" class="gallery-item" data-event="'+a.id+'"><img loading="lazy" src="assets/a'+String(a.i).padStart(2,'0')+'.webp" alt=""><span class="gtext"><time>'+a.date+'</time><b>'+a.title+'</b></span>'+arrow+'</button>').join('');
 }
 function render(){renderControls();renderChart();renderMobile();renderGallery()}
 function choosePhase(id){if(id!=='all'&&!phases.some(p=>p.id===id))return;view.phase=id;view.year=null;view.expanded.clear();render()}
 function chooseYear(y){if(!yearsAll.includes(y))return;view.year=y;view.phase=phaseFor(y).id;render()}
 document.addEventListener('click',ev=>{
  const b=ev.target.closest('main button');if(!b)return;
  if(b.dataset.event)window.openHistoryEvent(b.dataset.event);
  else if(b.id==='archive-all')window.openHistoryArchive('all');
  else if(b.dataset.phase){choosePhase(b.dataset.phase);document.querySelector('.range[data-phase="'+view.phase+'"]')?.focus({preventScroll:true})}
  else if(b.dataset.year){chooseYear(Number(b.dataset.year));document.querySelector('.year[data-year="'+view.year+'"]')?.focus({preventScroll:true})}
  else if(b.dataset.toggle){const id=b.dataset.toggle;if(view.expanded.has(id))view.expanded.delete(id);else view.expanded.add(id);renderMobile();document.querySelector('[data-toggle="'+id+'"]')?.focus({preventScroll:true})}
 });
 document.addEventListener('change',ev=>{if(ev.target.id==='mobile-year'){const val=ev.target.value;if(val)chooseYear(Number(val));else choosePhase(view.phase);document.querySelector('#mobile-year')?.focus({preventScroll:true})}});
 function address(){
  const hash=location.hash.slice(1);
  const requestedPhase=new URLSearchParams(location.search).get('phase');
  if(!hash && phases.some(p=>p.id===requestedPhase)){choosePhase(requestedPhase);return}
  if(/^p[1-4]$/.test(hash)){choosePhase(hash);return}
  const id=hash.startsWith('event-')?hash.slice(6):'';
  if(/^DP-\d{3}$/.test(id)){
   const e=plan.lanes.flatMap(l=>l.events).find(e=>e.id===id);
   if(e)chooseYear(e.year);window.openHistoryEvent(id);
  }
 }
 render();address();window.addEventListener('hashchange',address);
})();
