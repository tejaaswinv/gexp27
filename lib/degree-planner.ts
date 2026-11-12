import {curriculumCourses,coreCoursesFor,courseOptionsFor,type CurriculumCourse} from './sutd-curriculum';
import type {Pillar,StudentProfile} from './types';
export type DegreeTerm='1'|'2'|'3'|'4'|'5'|'6'|'7'|'8';
export const DEGREE_TERMS:DegreeTerm[]=['1','2','3','4','5','6','7','8'];
export type PlannedModule={code:string;title:string;origin:'sutd'|'exchange'|'custom';category?:string;equivalent?:string;sourceUrl?:string};
export type MinorPlan={name:string;goal:number;codes:string[]};
export type DegreePlan={
 version:2;pillar:Pillar;cohort:number;exchangeTerm:DegreeTerm;exchangeHost:string;
 assumeFreshmore:boolean;overloadAt:number;
 terms:Record<DegreeTerm,PlannedModule[]>;minor:MinorPlan;
};
export const MINOR_SOURCE='https://www.sutd.edu.sg/education/undergraduate/minors/';
export const MINOR_CHOICES=['None','Analytics and AI','Artificial Intelligence (AY2023)','Computer Science','Design and Artificial Intelligence','Design, Technology and Society','Digital Humanities','Healthcare Informatics','Human-Centred Design','Psychology & Business Management','Sustainability by Design'];
const key=(s:string)=>s.trim().toUpperCase();
export function emptyTerms():Record<DegreeTerm,PlannedModule[]>{return {'1':[],'2':[],'3':[],'4':[],'5':[],'6':[],'7':[],'8':[]};}
export function createDegreePlan(profile:StudentProfile):DegreePlan{
 const terms=emptyTerms();
 (['4','5','7','8'] as DegreeTerm[]).forEach(t=>{
  terms[t]=(profile.homePlan[t as '4'|'5'|'7'|'8']||[]).filter(c=>c.code.trim()||c.title.trim())
   .map(c=>({code:c.code.trim(),title:c.title.trim(),origin:'sutd' as const}));
 });
 return {version:2,pillar:profile.pillar,cohort:profile.matriculationYear??2025,
  exchangeTerm:'6',exchangeHost:'',assumeFreshmore:true,overloadAt:5,terms,
  minor:{name:'None',goal:4,codes:[]}};
}
export function normalisePlan(input:unknown,profile:StudentProfile):DegreePlan{
 const fallback=createDegreePlan(profile);
 if(!input||typeof input!=='object')return fallback;
 const x=input as Partial<DegreePlan>;
 if(x.version!==2||x.pillar!==profile.pillar||x.cohort!==(profile.matriculationYear??2025))return fallback;
 const terms=emptyTerms();
 DEGREE_TERMS.forEach(t=>{
  const rows=Array.isArray(x.terms?.[t])?x.terms[t]:[];
  terms[t]=rows.slice(0,12).filter(c=>c&&typeof c.code==='string'&&typeof c.title==='string')
   .map(c=>({code:c.code.slice(0,40),title:c.title.slice(0,180),
    origin:(c.origin==='sutd'||c.origin==='exchange')?c.origin:'custom',
    category:c.category,equivalent:c.equivalent,sourceUrl:c.sourceUrl}));
 });
 return {...fallback,...x,version:2,pillar:profile.pillar,cohort:profile.matriculationYear??2025,
  terms,exchangeTerm:DEGREE_TERMS.includes(x.exchangeTerm as DegreeTerm)?x.exchangeTerm as DegreeTerm:'6',
  overloadAt:Number.isFinite(x.overloadAt)?Math.max(4,Math.min(7,Number(x.overloadAt))):5,
  minor:{name:typeof x.minor?.name==='string'?x.minor.name:'None',
   goal:Math.max(1,Math.min(12,Number(x.minor?.goal)||4)),
   codes:Array.isArray(x.minor?.codes)?x.minor.codes.filter(v=>typeof v==='string').slice(0,30):[]}};
}
export function allModules(plan:DegreePlan):Array<PlannedModule&{term:DegreeTerm}>{
 return DEGREE_TERMS.flatMap(term=>plan.terms[term].map(x=>({...x,term})));
}
export function catalogForPlan(profile:StudentProfile):CurriculumCourse[]{
 const map=new Map<string,CurriculumCourse>();
 for(const term of [4,5,6,7,8]){
  for(const c of courseOptionsFor(profile.pillar,term,profile.matriculationYear??2025,
    profile.tracks,profile.secondMajorHdi,profile.hdiDomain||'')){
   const old=map.get(key(c.code));
   if(!old||c.category==='core'||(old.terms.length===0&&c.terms.length>0))map.set(key(c.code),c);
  }
 }
 if(profile.pillar==='CSD'){
  const code=(profile.matriculationYear??2025)>=2025?'10.025':'10.014';
  map.set(code,{code,title:'Computational Thinking for Design',pillar:'ALL',category:'core',
   terms:[1,2,3],source:'https://www.sutd.edu.sg/course/50-002-computation-structures/'});
 }
 return [...map.values()].sort((a,b)=>a.code.localeCompare(b.code));
}
export type PrereqRule={code:string;allOf?:string[];oneOf?:string[][];coReq?:string[];source:string;note?:string};
export const VERIFIED_PREREQS:PrereqRule[]=[
 {code:'50.002',allOf:['10.025'],source:'https://www.sutd.edu.sg/course/50-002-computation-structures/',note:'AY2020–2024 use 10.014; Freshmore equivalence may satisfy this.'},
 {code:'50.005',allOf:['50.002'],source:'https://www.sutd.edu.sg/course/50-005-computer-system-engineering/'},
 {code:'50.007',oneOf:[['50.001','50.004']],source:'https://www.sutd.edu.sg/course/50-007-machine-learning',note:'Equivalent programming, statistics and optimisation background may also qualify.'},
 {code:'50.042',coReq:['50.005'],source:'https://www.sutd.edu.sg/course/50-042-foundations-of-cybersecurity/',note:'Equivalent programming/systems background may qualify.'},
 {code:'50.020',allOf:['50.042'],source:'https://www.sutd.edu.sg/course/50-020-network-security'},
 {code:'50.044',allOf:['50.042'],source:'https://www.sutd.edu.sg/course/50-044-system-security/'},
 {code:'50.055',allOf:['50.007'],oneOf:[['50.039'],['60.001']],source:'https://www.sutd.edu.sg/course/50-055-special-topic-machine-learning-operations',note:'Deep learning may be co-requisite; equivalent training may qualify.'},
 {code:'01.116',oneOf:[['50.007'],['40.319']],source:'https://www.sutd.edu.sg/course/01-116-ai-for-healthcare/'}
];
export type PlanIssue={code:string;term:DegreeTerm;type:'prereq'|'offering'|'overload'|'duplicate'|'unverified';severity:'error'|'warning'|'info';detail:string;source?:string};
export function checkPlan(plan:DegreePlan,profile:StudentProfile):PlanIssue[]{
 const result:PlanIssue[]=[];
 const placed=allModules(plan),positions=new Map<string,number[]>();
 for(const m of placed){const k=key(m.equivalent||m.code);positions.set(k,[...(positions.get(k)||[]),Number(m.term)]);}
 const isBefore=(code:string,t:number)=>{
  if(plan.assumeFreshmore&&['10.014','10.025'].includes(key(code)))return true;
  return (positions.get(key(code))||[]).some(v=>v<t);
 };
 const sameOrBefore=(code:string,t:number)=>isBefore(code,t)||(positions.get(key(code))||[]).includes(t);
 const catalogue=new Map(catalogForPlan(profile).map(c=>[key(c.code),c]));
 for(const term of DEGREE_TERMS){
  const entries=plan.terms[term], t=Number(term);
  if(entries.length>plan.overloadAt)result.push({code:'LOAD',term,type:'overload',severity:'warning',
   detail:'Term '+term+' contains '+entries.length+' modules, above your '+plan.overloadAt+'-course planning threshold (not an official limit).'});
  for(const course of entries){
   const c=key(course.equivalent||course.code);if(!c)continue;
   if((positions.get(c)||[]).length>1)result.push({term,code:c,type:'duplicate',severity:'error',
    detail:c+' appears in multiple terms.'});
   if(course.origin==='exchange')continue;
   const rule=VERIFIED_PREREQS.find(r=>r.code===c);
   if(rule){
    const missing=(rule.allOf||[]).filter(k=>!isBefore(c==='50.002'&&plan.cohort<2025?'10.014':k,t));
    const pathways=rule.oneOf||[],valid=!pathways.length||pathways.some(group=>group.every(k=>isBefore(k,t)));
    const co=(rule.coReq||[]).filter(k=>!sameOrBefore(k,t));
    if(missing.length||!valid||co.length){
     const parts=[
      missing.length?'Prior: '+missing.join(', '):'',
      !valid?'One pathway: '+pathways.map(g=>g.join(' + ')).join(' or '):'',
      co.length?'Co-requisite: '+co.join(', '):''
     ].filter(Boolean);
     result.push({code:c,term,type:'prereq',severity:'warning',
      detail:'Verify '+c+': '+parts.join(' · ')+'. '+(rule.note||''),
      source:rule.source});
    }
   }
   const source=catalogue.get(c);
   if(source&&source.terms.length&&!source.terms.includes(t)&&term!==plan.exchangeTerm){
    result.push({code:c,term,type:'offering',severity:'warning',
     detail:c+' is listed for term(s) '+source.terms.join(', ')+' rather than Term '+term+'. Confirm current offerings.',
     source:source.source});
   }
   if(term===plan.exchangeTerm)result.push({code:c,term,type:'unverified',severity:'info',
    detail:'Exchange-term SUTD course '+c+' needs an approved host equivalent.'});
  }
 }
 return result;
}
export function removeWithDependents(plan:DegreePlan,code:string,term:DegreeTerm):{plan:DegreePlan;removed:string[]}{
 const next=JSON.parse(JSON.stringify(plan)) as DegreePlan;
 const removed=new Set<string>([key(code)]);next.terms[term]=next.terms[term].filter(m=>key(m.code)!==key(code));
 let changes=true;
 while(changes){
  changes=false;
  for(const t of DEGREE_TERMS){
   for(const m of [...next.terms[t]]){
    const r=VERIFIED_PREREQS.find(x=>x.code===key(m.code));
    if(!r||(r.allOf||[]).every(req=>!removed.has(key(req))))continue;
    // Only definite mandatory dependencies cascade; equivalent/optional pathways remain flagged.
    next.terms[t]=next.terms[t].filter(x=>key(x.code)!==key(m.code));
    removed.add(key(m.code));changes=true;
   }
  }
 }
 return {plan:next,removed:[...removed]};
}
export function moveOrAdd(plan:DegreePlan,course:PlannedModule,to:DegreeTerm):DegreePlan{
 const next=JSON.parse(JSON.stringify(plan)) as DegreePlan;
 const code=key(course.code);if(!code)return plan;
 for(const t of DEGREE_TERMS)next.terms[t]=next.terms[t].filter(c=>key(c.code)!==code);
 next.terms[to].push({...course,code:course.code.trim()});
 return next;
}
export type ProgressMetric={label:string;done:number;goal:number;note:string;verified:boolean};
export function progressMetrics(plan:DegreePlan,profile:StudentProfile):ProgressMetric[]{
 const mods=allModules(plan),codes=new Set(mods.map(m=>key(m.equivalent||m.code))),has=(s:string)=>codes.has(key(s));
 const rows:ProgressMetric[]=[];
 const cores=[4,5,7,8].flatMap(t=>coreCoursesFor(profile.pillar,t,profile.matriculationYear??2025));
 const required=[...new Map(cores.map(c=>[c.code,c])).values()];
 if(required.length)rows.push({label:'Pillar cores and capstone',done:required.filter(c=>has(c.code)).length,goal:required.length,
  note:'Curriculum planning reference, not a complete graduation audit.',verified:false});
 const trackCores:Record<string,string[][]>={
  'Artificial Intelligence':[['50.007','40.319'],['50.039'],['50.021']],
  'Security':[['50.042'],['50.020'],['50.044']],
  'IoT and Intelligent Systems':[['50.046','50.012'],['50.041'],['50.021']]
 };
 const csdElectives=new Set(curriculumCourses.filter(c=>c.pillar==='CSD'&&c.category==='elective').map(c=>c.code));
 const externalElectives=new Set(['01.116','01.117','30.119','40.316','60.004','30.002','30.115','30.202']);
 for(const track of profile.tracks){
  if(profile.pillar==='CSD'&&trackCores[track]){
   const groups=trackCores[track],coreCount=groups.filter(group=>group.some(has)).length;
   rows.push({label:track+' · track cores',done:Math.min(coreCount,2),goal:2,
    note:'Published CSD track rule: two track cores; IoT 50.046/50.012 is one group.',verified:true});
   const trackCoreCodes=new Set(groups.flat()),nonTrackCore=new Set(['50.001','50.002','50.003','50.004','50.005']);
   const electiveCodes=new Set(mods.map(m=>key(m.equivalent||m.code)).filter(c=>!trackCoreCodes.has(c)&&!nonTrackCore.has(c)&&(csdElectives.has(c)||externalElectives.has(c))));
   rows.push({label:track+' · electives',done:Math.min(electiveCodes.size,4),goal:4,
    note:'Indicative CSD elective tally: verify approved offerings and cross-pillar restrictions.',verified:false});
  }else{
   const count=new Set(mods.filter(m=>curriculumCourses.some(c=>c.code===key(m.equivalent||m.code)&&c.pillar===profile.pillar&&c.tracks?.includes(track))).map(m=>m.code)).size;
   rows.push({label:track+' · related courses',done:count,goal:3,
    note:'Interest alignment only. Official specialisation completion is not verified.',verified:false});
  }
 }
 if(profile.secondMajorHdi){
  const sets=(category:string)=>new Set(curriculumCourses.filter(c=>c.category===category).map(c=>c.code));
  const n=(category:string)=>mods.filter(m=>sets(category).has(key(m.equivalent||m.code))).length;
  if(profile.pillar==='DAI')rows.push({label:'HDI · domain courses',done:n('hdi-domain'),goal:2,
   note:'DAI domain subjects; domain and overlap require faculty approval.',verified:false});
  else rows.push({label:'HDI · design studios',done:n('hdi-studio'),goal:2,
   note:'Studio + DAI course alternative may count; verify with HDI coordinator.',verified:false});
  rows.push({label:'HDI · AI courses',done:n('hdi-ai'),goal:3,note:'Required distribution varies by pillar.',verified:false});
  rows.push({label:'HDI · HASS',done:n('hass'),goal:3,note:'HDI-approved HASS distribution requires checking.',verified:false});
 }
 if(plan.minor.name!=='None')rows.push({label:'Minor · '+plan.minor.name,
  done:plan.minor.codes.filter(has).length,goal:plan.minor.goal,
  note:'User-entered minor target and courses; not an official eligibility audit.',verified:false});
 return rows;
}
