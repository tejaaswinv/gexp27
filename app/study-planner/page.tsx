'use client';
import {useEffect,useMemo,useState,type DragEvent,type ChangeEvent} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,BookOpen,Check,CheckCircle2,ChevronDown,Download,ExternalLink,GraduationCap,GripVertical,Info,Layers3,MapPin,Plus,RotateCcw,Search,ShieldCheck,Sparkles,Trash2,TriangleAlert,Upload, X} from 'lucide-react';
import type {StudentProfile} from '@/lib/types';
import {curriculumLinks,curriculumCourses,coreCoursesFor,hdiCurriculumUrl,termCourseLabel,type CurriculumCourse} from '@/lib/sutd-curriculum';
import {DEGREE_TERMS,MINOR_CHOICES,MINOR_SOURCE,allModules,catalogForPlan,checkPlan,createDegreePlan,moveOrAdd,normalisePlan,progressMetrics,removeWithDependents,type DegreePlan,type DegreeTerm,type PlannedModule} from '@/lib/degree-planner';

const PROFILE_KEY='gexp-atlas-profile-v1';
const PLAN_KEY='gexp-degree-plan-v2';
const defaultProfile:StudentProfile={
 name:'',studentId:'',gpa:3.5,pillar:'CSD',tracks:[],secondMajorHdi:false,matriculationYear:2025,hdiDomain:'',
 interests:'',region:'Any',term:'fall',passport:'',
 homePlan:{'4':[],'5':[],'7':[],'8':[]}
};
function saveText(filename:string,text:string,type='text/plain'){
 const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();
 window.setTimeout(()=>URL.revokeObjectURL(url),200);
}
function csvValue(input:unknown){
 const str=String(input??'');return '"'+str.replace(/"/g,'""')+'"';
}
function courseModule(course:CurriculumCourse):PlannedModule{
 return {code:course.code,title:course.title,origin:'sutd',category:course.category,sourceUrl:course.source};
}
function listLabel(item:CurriculumCourse){return item.category==='core'?'Pillar core':item.category==='hass'?'HASS':item.category.startsWith('hdi')?'HDI':item.category==='elective'?'Elective':'Course'}
export default function StudyPlanner(){
 const [profile,setProfile]=useState<StudentProfile>(defaultProfile);
 const [plan,setPlan]=useState<DegreePlan>(()=>createDegreePlan(defaultProfile));
 const [hydrated,setHydrated]=useState(false);
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState('All');
 const [targetTerm,setTargetTerm]=useState<DegreeTerm>('4');
 const [draggingOver,setDraggingOver]=useState<DegreeTerm|null>(null);
 const [showSidebar,setShowSidebar]=useState(false);
 const [customCode,setCustomCode]=useState('');
 const [customTitle,setCustomTitle]=useState('');
 const [notification,setNotification]=useState('');
 const [confirmReset,setConfirmReset]=useState(false);
 const [onlyIssues,setOnlyIssues]=useState(false);
 const [mappedRecommendations,setMappedRecommendations]=useState<Array<{university:string;mappings:Array<{hostCode:string;hostTitle:string;sutdCode?:string;sutdTitle?:string}>}>>([]);
 const [selectedHost,setSelectedHost]=useState('');
 useEffect(()=>{
  let current=defaultProfile;
  try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(p&&typeof p==='object')
   current={...defaultProfile,...p,homePlan:{...defaultProfile.homePlan,...p.homePlan}};}catch{}
  setProfile(current);
  try{setPlan(normalisePlan(JSON.parse(localStorage.getItem(PLAN_KEY)||'null'),current));}
  catch{setPlan(createDegreePlan(current));}
  try{
   const suggestions=JSON.parse(localStorage.getItem('gexp-atlas-recs-v1')||'[]');
   if(Array.isArray(suggestions))setMappedRecommendations(suggestions.slice(0,4));
  }catch{}
  setHydrated(true);
 },[]);
 useEffect(()=>{
  if(!hydrated)return;
  try{
   localStorage.setItem(PLAN_KEY,JSON.stringify(plan));
   const latest=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')||profile;
   const homePlan={...latest.homePlan};
   (['4','5','7','8'] as const).forEach(term=>{
    homePlan[term]=plan.terms[term].filter(c=>c.code||c.title).slice(0,5).map(c=>({
     code:c.origin==='exchange'&&c.equivalent?c.equivalent:c.code,
     title:c.title
    }));
   });
   localStorage.setItem(PROFILE_KEY,JSON.stringify({...latest,homePlan}));
  }catch{}
 },[plan,hydrated]);
 const catalogue=useMemo(()=>catalogForPlan(profile),[profile]);
 const issues=useMemo(()=>checkPlan(plan,profile),[plan,profile]);
 const metrics=useMemo(()=>progressMetrics(plan,profile),[plan,profile]);
 const total=useMemo(()=>allModules(plan).length,[plan]);
 const usedCodes=useMemo(()=>new Set(allModules(plan).map(c=>c.code.toUpperCase())),[plan]);
 const library=useMemo(()=>{
  const terms=Number(targetTerm);
  const words=query.trim().toLowerCase();
  const entries=catalogue.filter(course=>{
   if(filter!=='All'&&listLabel(course)!==filter)return false;
   if(words&&!((course.code+' '+course.title+' '+(course.tracks||[]).join(' ')).toLowerCase().includes(words)))return false;
   return true;
  });
  return entries.sort((a,b)=>{
   const value=(c:CurriculumCourse)=>c.terms.includes(terms)?0:c.terms.length===0?1:2;
   return value(a)-value(b)||a.code.localeCompare(b.code);
  });
 },[catalogue,query,filter,targetTerm]);
 const update=(next:DegreePlan)=>{setPlan(next);setNotification('Saved in your browser');};
 const addTo=(module:PlannedModule,term:DegreeTerm,from?:DegreeTerm)=>{
  if(!module.code.trim()||!module.title.trim()){setNotification('Enter a course code and title.');return;}
  const old=allModules(plan).find(c=>c.code.toUpperCase()===module.code.toUpperCase());
  if(old&&old.term===term){setNotification('Course already planned in Term '+term);return;}
  if(plan.terms[term].length>=10&&!old){setNotification('Limit of 10 courses per term in this planner.');return;}
  update(moveOrAdd(plan,module,term));
  setNotification(module.code+' '+(from?'moved':'added')+' to Term '+term);
 };
 const addCoreTerm=(term:DegreeTerm)=>{
  const candidates=coreCoursesFor(profile.pillar,Number(term),profile.matriculationYear??2025);
  let updated=plan;
  for(const course of candidates)updated=moveOrAdd(updated,courseModule(course),term);
  update(updated);setNotification(candidates.length+' core/capstone subjects applied to Term '+term);
 };
 const removeOne=(m:PlannedModule,term:DegreeTerm)=>{
  const result=removeWithDependents(plan,m.code,term);
  if(result.removed.length>1&&!window.confirm(
   'Removing '+m.code+' also clears confirmed dependent modules: '+result.removed.slice(1).join(', ')+'. Continue?'))return;
  update(result.plan);setNotification('Removed '+result.removed.join(', '));
 };
 const dragStart=(event:DragEvent<HTMLElement>,m:PlannedModule,from?:DegreeTerm)=>{
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-gexp-degree',JSON.stringify({module:m,from}));
 };
 const drop=(event:DragEvent<HTMLElement>,term:DegreeTerm)=>{
  event.preventDefault();setDraggingOver(null);
  try{
   const json=event.dataTransfer.getData('application/x-gexp-degree');
   if(!json)return;const item=JSON.parse(json) as {module:PlannedModule;from?:DegreeTerm};
   if(!item.module?.code||!item.module.title)return;
   addTo(item.module,term,item.from);
  }catch{setNotification('Could not read that dragged module.');}
 };
 const addCustom=()=>{
  if(!customCode.trim()||!customTitle.trim()){setNotification('A code and title are required for custom courses.');return;}
  addTo({code:customCode.trim(),title:customTitle.trim(),origin:targetTerm===plan.exchangeTerm?'exchange':'custom'},targetTerm);
  setCustomCode('');setCustomTitle('');
 };
 const importHost=(host:string)=>{
  const item=mappedRecommendations.find(m=>m.university===host);
  if(!item)return;
  let next={...plan,exchangeHost:host};
  for(const c of item.mappings.slice(0,10)){
   if(!c.hostCode||!c.hostTitle)continue;
   next=moveOrAdd(next,{code:c.hostCode,title:c.hostTitle,origin:'exchange',
    equivalent:c.sutdCode,category:'exchange'},plan.exchangeTerm);
  }
  update(next);setSelectedHost(host);setNotification('Imported proposed host courses. Credit approval is still required.');
 };
 const exportCsv=()=>{
  const rows=[['Term','Mode','Code','Title','SUTD equivalent','Type']];
  for(const term of DEGREE_TERMS)for(const m of plan.terms[term])rows.push([
   term,term===plan.exchangeTerm?'Exchange':'SUTD',m.code,m.title,m.equivalent||'',m.origin]);
  saveText('GEXP_degree_plan_'+(profile.pillar||'SUTD')+'.csv',
   rows.map(row=>row.map(csvValue).join(',')).join('\n'),'text/csv;charset=utf-8');
 };
 const importJson=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.currentTarget.files?.[0];if(!file)return;
  if(file.size>200000){setNotification('Plan file must be under 200 KB.');return;}
  try{
   const decoded=JSON.parse(await file.text());
   const incoming=normalisePlan(decoded,profile);
   if(incoming===null)return;
   if(decoded?.version!==2||decoded?.pillar!==profile.pillar||decoded?.cohort!==(profile.matriculationYear??2025))
    throw new Error('Plan does not match your current pillar and intake.');
   if(!window.confirm('Replace your saved degree plan with this file?'))return;
   update(incoming);setNotification('Imported your saved degree plan');
  }catch(e){setNotification(e instanceof Error?e.message:'Invalid plan JSON')}
  event.currentTarget.value='';
 };
 if(!hydrated)return <main className="degree-page"><section className="degree-intro"><div><span className="degree-eyebrow">STUDY PLAN STUDIO</span><h1>Eight terms, one clear plan.</h1><p>Loading your saved course roadmap and curriculum details…</p></div></section></main>;
 return <main className="degree-page">
  <header className="degree-nav">
   <Link href="/" className="degree-logo"><span className="degree-brand-icon"><GraduationCap size={21}/></span>
    <span>gexp <em>atlas</em><small>STUDY PLAN STUDIO</small></span></Link>
   <nav aria-label="Study planner navigation">
    <Link href="/"><ArrowLeft size={16}/> Exchange recommendations</Link>
    <a href={curriculumLinks[profile.pillar]} target="_blank" rel="noopener noreferrer">SUTD curriculum <ExternalLink size={14}/></a>
   </nav>
  </header>
  <section className="degree-intro">
   <div><span className="degree-eyebrow"><Sparkles size={15}/> THE EIGHT-TERM PLANNER</span>
    <h1>Plan every term.<br/><em>Keep your exchange on track.</em></h1>
    <p>Drag courses between terms, check known prerequisites, track your pathway and keep your GEXP study plan in sync.</p>
    <div className="degree-chips"><span><GraduationCap size={15}/>{profile.pillar} · AY{profile.matriculationYear??2025}</span>
     <span><ShieldCheck size={15}/> Saved locally</span><span><BookOpen size={15}/>{profile.tracks.slice(0,2).join(' + ')||'Explore your tracks'}</span></div>
   </div>
   <div className="degree-hero-graphic" aria-hidden="true"><div className="degree-orbit orbit-a"/><div className="degree-orbit orbit-b"/>
    <span>01</span><span>04</span><span>06</span><span>08</span><div><CompassSymbol/></div></div>
  </section>
  <div className="degree-layout">
   <section className="degree-main" aria-label="Eight-term course planner">
    <div className="degree-panel-title"><div><span className="degree-eyebrow">01 / YOUR JOURNEY</span>
     <h2>Eight terms, one clear plan.</h2><p>Drag on desktop or use the move menus on mobile. Your changes save automatically.</p></div>
     <div className="degree-actions"><button onClick={exportCsv}><Download size={16}/> Export CSV</button>
      <button onClick={()=>saveText('GEXP_degree_plan.json',JSON.stringify(plan,null,2),'application/json')}><Download size={16}/> Save plan</button>
      <label className="degree-import"><Upload size={16}/> Import<input type="file" accept=".json,application/json" onChange={importJson}/></label>
     </div>
    </div>
    <div className="degree-controls">
     <label>Exchange term<select value={plan.exchangeTerm} onChange={e=>update({...plan,exchangeTerm:e.target.value as DegreeTerm})}>{(['5','6','7','8'] as DegreeTerm[]).map(t=><option key={t} value={t}>Term {t}</option>)}</select></label>
     <label>Load warning at<select value={plan.overloadAt} onChange={e=>update({...plan,overloadAt:Number(e.target.value)})}>{[4,5,6,7].map(n=><option value={n} key={n}>{n} modules</option>)}</select></label>
     <label className="degree-check"><input type="checkbox" checked={plan.assumeFreshmore} onChange={e=>update({...plan,assumeFreshmore:e.target.checked})}/> Assume Freshmore completed</label>
     <button className="degree-mobile-library" onClick={()=>setShowSidebar(v=>!v)}><Search size={15}/> {showSidebar?'Hide':'Show'} course library</button>
    </div>
    <div className="degree-grid">
     {DEGREE_TERMS.map(term=>{
      const items=plan.terms[term],messages=issues.filter(issue=>issue.term===term),
       exchange=plan.exchangeTerm===term,foundation=Number(term)<=3;
      return <article className={'degree-term '+(exchange?'is-exchange ':'')+(draggingOver===term?'drag-hover':'')}
       key={term} onDragOver={e=>{e.preventDefault();setDraggingOver(term)}} onDragLeave={()=>setDraggingOver(v=>v===term?null:v)} onDrop={e=>drop(e,term)}>
       <div className="degree-term-top"><div><span>TERM {term}</span><h3>{exchange?'Exchange semester':foundation?'Freshmore':Number(term)>=7?'Final-year studies':'Pillar studies'}</h3></div>
        <span className={'degree-term-count '+(items.length>plan.overloadAt?'warn':'')}>{items.length} modules</span></div>
       {exchange&&<div className="degree-exchange-label"><MapPin size={14}/> Abroad: {plan.exchangeHost||'Choose your host university'}</div>}
       {foundation&&items.length===0&&<p className="degree-empty foundation">Freshmore coursework can be marked as completed above, or entered manually.</p>}
       {!foundation&&items.length===0&&<p className="degree-empty">Drop a course here, or select one from the library.</p>}
       {items.map((item,index)=><div className="degree-module" draggable key={item.code+'-'+index} onDragStart={e=>dragStart(e,item,term)}>
        <div className="degree-module-top"><GripVertical size={14} className="degree-grip"/><b>{item.code}</b>
         <button aria-label={'Remove '+item.code} title="Remove (clears mandatory dependents)" onClick={()=>removeOne(item,term)}><X size={15}/></button></div>
        <p>{item.title}</p>
        {item.equivalent&&<small>Proposed SUTD: {item.equivalent}</small>}
        {messages.filter(x=>x.code===item.code||x.code===item.equivalent).slice(0,2).map((x,i)=><span className={'degree-issue-chip '+x.severity} key={i} title={x.detail}>{x.type==='prereq'?'Prerequisite':x.type==='offering'?'Term availability':x.type==='duplicate'?'Duplicate':'Exchange mapping'} <TriangleAlert size={12}/></span>)}
        <label className="degree-move"><span>Move to</span><select value={term} onChange={e=>addTo(item,e.target.value as DegreeTerm,term)} aria-label={'Move '+item.code+' to another term'}>
         {DEGREE_TERMS.map(t=><option key={t} value={t}>T{t}</option>)}</select></label>
       </div>)}
       <div className="degree-term-actions">
        {coreCoursesFor(profile.pillar,Number(term),profile.matriculationYear??2025).length>0&&
         <button onClick={()=>addCoreTerm(term)}><Plus size={14}/> Add pillar cores</button>}
        <button onClick={()=>{setTargetTerm(term);setShowSidebar(true);document.getElementById('degree-library')?.scrollIntoView({behavior:'smooth',block:'nearest'})}}>
         <Search size={14}/> Browse modules</button>
       </div>
       {messages.length>0&&<div className="degree-term-warnings">
        <strong><TriangleAlert size={14}/> {messages.length} planning note{messages.length===1?'':'s'}</strong>
        {messages.slice(0,3).map((m,i)=><p key={i}>{m.detail} {m.source&&<a href={m.source} target="_blank" rel="noopener noreferrer">Source</a>}</p>)}
        {messages.length>3&&<small>{messages.length-3} more notes shown in the review panel.</small>}
       </div>}
      </article>;
     })}
    </div>
    <div className="degree-footer-hint"><ShieldCheck size={17}/> Exchange terms accept courses outside the local SUTD offering calendar. Host syllabi, prerequisites and transfer approval still require verification.</div>
    <section className="degree-review">
     <div className="degree-panel-title"><div><span className="degree-eyebrow">02 / CHECK YOUR PLAN</span><h2>Plan health & requirements</h2></div>
      <button className={onlyIssues?'selected':''} onClick={()=>setOnlyIssues(v=>!v)}><TriangleAlert size={16}/> {onlyIssues?'Show progress':'Only warnings'}</button></div>
     {!onlyIssues&&<div className="degree-metrics">{metrics.map((m,i)=><div className="degree-progress" key={i}>
      <div><strong>{m.label}</strong><span>{m.done} / {m.goal}</span></div>
      <div className="degree-bar"><i style={{width:Math.min(100,Math.round(m.done/m.goal*100))+'%'}}/></div>
      <p>{m.note}</p></div>)}</div>}
     <div className="degree-issues">
      <div className="degree-issue-total"><span><TriangleAlert size={17}/> {issues.length} planning notes</span>
       <small>Checks use known prerequisite rules and reference offerings only.</small></div>
      {issues.length===0?<p className="degree-clear"><CheckCircle2 size={18}/> No issues detected in the covered checks. This is not an official graduation audit.</p>:
       issues.map((v,i)=><div className="degree-issue-row" key={i}><span className={'degree-severity '+v.severity}>{v.severity}</span>
        <p><strong>Term {v.term} · {v.code}</strong> — {v.detail} {v.source&&<a href={v.source} target="_blank" rel="noopener noreferrer">Check source <ExternalLink size={12}/></a>}</p></div>)}
     </div>
     <div className="degree-minor"><div><h3>Minor progress</h3><p>Self-track a minor alongside your HDI second major. Official minor completion rules depend on programme and intake.</p>
      <a href={MINOR_SOURCE} target="_blank" rel="noopener noreferrer">SUTD minors <ExternalLink size={13}/></a></div>
      <label>Select minor<select value={plan.minor.name} onChange={e=>update({...plan,minor:{...plan.minor,name:e.target.value,codes:[]}})}>
       {MINOR_CHOICES.map(c=><option key={c}>{c}</option>)}</select></label>
      {plan.minor.name!=='None'&&<><label>Module target (self-entered)<input type="number" min={1} max={12} value={plan.minor.goal}
       onChange={e=>update({...plan,minor:{...plan.minor,goal:Math.max(1,Math.min(12,Number(e.target.value)||1))}})}/></label>
       <div className="degree-minor-codes">{allModules(plan).map((m,i)=><label key={i}>
        <input type="checkbox" checked={plan.minor.codes.includes(m.code)}
        onChange={e=>update({...plan,minor:{...plan.minor,codes:e.target.checked?[...plan.minor.codes,m.code]:plan.minor.codes.filter(x=>x!==m.code)}})}/>{m.code} · {m.title}</label>)}</div></>}
     </div>
     <div className="degree-reset">
      <p>Your planner automatically syncs Terms 4, 5, 7 and 8 with the GEXP form (first five modules per term).</p>
      <Link href="/"><ArrowRight size={17}/> Return to exchange application</Link>
      <button onClick={()=>{if(window.confirm('Clear this eight-term plan? This also clears the courses in your GEXP form.'))update(createDegreePlan({...profile,homePlan:{'4':[],'5':[],'7':[],'8':[]}}));}}>
       <RotateCcw size={15}/> Reset course selections</button>
     </div>
    </section>
   </section>
   <aside className={'degree-sidebar '+(showSidebar?'mobile-open':'')} id="degree-library">
    <div className="degree-sidebar-head"><div><span className="degree-eyebrow">YOUR COURSE SHELF</span><h2>Module library</h2></div>
     <button className="degree-sidebar-close" aria-label="Close course library" onClick={()=>setShowSidebar(false)}><X size={19}/></button></div>
    <p>Curated SUTD course data for {profile.pillar}. Drag a module or tap add. Term availability is indicative.</p>
    <label className="degree-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search code, title, interest…" /></label>
    <div className="degree-library-filters"><select value={filter} onChange={e=>setFilter(e.target.value)}>
     {['All','Pillar core','Elective','HASS','HDI','Course'].map(x=><option key={x}>{x}</option>)}</select>
     <label>To<select value={targetTerm} onChange={e=>setTargetTerm(e.target.value as DegreeTerm)}>
      {DEGREE_TERMS.map(t=><option value={t} key={t}>Term {t}</option>)}</select></label></div>
    <div className="degree-library-list">{library.length===0?<p>No matching subjects. Try another search or use a custom course below.</p>:
      library.slice(0,100).map(c=><div className="degree-library-item" key={c.code} draggable onDragStart={e=>dragStart(e,courseModule(c))}>
       <div><span className="degree-library-code">{c.code}</span><span className="degree-library-type">{listLabel(c)}</span></div>
       <h3>{c.title}</h3><p>{c.terms.length?'Reference term(s): '+c.terms.join(', '):'Term not confirmed · check timetable'}</p>
       {usedCodes.has(c.code.toUpperCase())?<span className="degree-planned"><Check size={13}/> Planned</span>:
        <button onClick={()=>addTo(courseModule(c),targetTerm)}><Plus size={14}/> Add to Term {targetTerm}</button>}
      </div>)}</div>
    <div className="degree-custom"><h3>Custom or host module</h3><p>For subjects not in the SUTD catalogue. Exchange subjects can include an approved host course later.</p>
     <input placeholder="Course code (e.g. CS4021)" maxLength={40} value={customCode} onChange={e=>setCustomCode(e.target.value)}/>
     <input placeholder="Course title" maxLength={160} value={customTitle} onChange={e=>setCustomTitle(e.target.value)}/>
     <button onClick={addCustom}><Plus size={15}/> Add custom to Term {targetTerm}</button>
    </div>
    <div className="degree-host-import"><h3>Exchange mapping import</h3>
     {mappedRecommendations.length?<><p>Import proposed host subjects from your GEXP Atlas recommendations into Term {plan.exchangeTerm}.</p>
      <select value={selectedHost} onChange={e=>setSelectedHost(e.target.value)}><option value="">Choose a recommended host</option>
       {mappedRecommendations.map(c=><option key={c.university} value={c.university}>{c.university}</option>)}</select>
      <button disabled={!selectedHost} onClick={()=>importHost(selectedHost)}><Layers3 size={15}/> Import proposed mappings</button></>:
      <p>Generate four university recommendations on the GEXP page first to enable mapping imports.</p>}
     <label>Exchange destination<input placeholder="University or host country" value={plan.exchangeHost}
      onChange={e=>update({...plan,exchangeHost:e.target.value})}/></label>
    </div>
    <p className="degree-source-note"><Info size={14}/> Prerequisite checks cover selected published SUTD course requirements only. Always verify changes in the official catalogue.</p>
   </aside>
  </div>
  {notification&&<div className="degree-toast" role="status">{notification}<button onClick={()=>setNotification('')} aria-label="Dismiss"><X size={14}/></button></div>}
 </main>;
}
function CompassSymbol(){return <GraduationCap size={53} strokeWidth={1.3}/>;}
