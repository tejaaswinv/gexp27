import { coursesFor,universities } from './catalog';
import type { Analysis,Course,Recommendation,StudentProfile,University } from './types';

const trackWords:Record<string,string[]> = {
 'Artificial Intelligence':['artificial intelligence','machine learning','deep learning','neural','data science','computer vision','language processing','data mining','ai','intelligent'],
 'Cybersecurity':['security','secure','cryptograph','privacy','network security','cyber','forensic','authentication','information assurance'],
 'Internet of Things':['embedded','iot','internet of things','wireless','network','sensor','microcontroller','real-time','robotics'],
 'Human-Computer Interaction':['human computer','human-computer','interface','user experience','interaction design','usability','interactive'],
 'Software Engineering':['software','programming','development','distributed','database','operating system','algorithm'],
 'Robotics':['robot','control','autonomous','perception','computer vision','mechatronics'],
 'Data Science':['data','statistics','machine learning','analytics','visualization'],
 'Design':['design','studio','human','interaction','product'],
 'Sustainability':['environment','renewable','climate','sustainable','energy'],
 'Finance':['finance','quantitative','economic','accounting','fintech'],
 'Electrical Engineering':['electrical','circuit','embedded','signal','power','electronic'],
};
const regionMap:Record<string,string[]>={
 'Europe':['Austria','Belgium','Czech Republic','Denmark','Finland','France','Germany','Greece','Iceland','Netherlands','Norway','Portugal','Spain','Sweden','Switzerland','United Kingdom'],
 'Asia':['China','Hong Kong','India','Japan','South Korea','Taiwan','Vietnam','Macau'],
 'North America':['Canada','United States'],
 'Oceania':['Australia','New Zealand']
};
function normal(s:unknown){return String(s||'').toLowerCase();}
function isTermAvailable(slot:unknown, date:unknown, note:unknown):boolean {
 const str=normal(slot); const noteStr=normal(note);
 if(slot===0 || str==='0') return false;
 if(/not available|not open|not offered|no slots/.test(str))return false;
 if(/not available|not open|not for .* students|not .* students|not applicable/.test(noteStr))return false;
 if(/not available/.test(normal(date)))return false;
 return true;
}
function termApplies(course:Course, term:string) {
 const v=normal(course.exchangeTerm);
 return !v || v==='both' || v==='all' || v===term || v.includes(term);
}
function relevantPillar(course:Course,pillar:string) {
 return normal(course.pillar)=== (pillar==='CSD'?'istd':pillar.toLowerCase());
}
function courseScore(course:Course,profile:StudentProfile):number{
 const title=normal(`${course.hostTitle} ${course.sutdTitle}`);
 let score=0;
 for(const track of profile.tracks){ for(const word of trackWords[track]||[normal(track)]) if(title.includes(word))score+=word.length>6?3.5:1.5; }
 if(profile.secondMajorHdi && /(human|interaction|design|user experience|interface)/.test(title))score+=1.5;
 const interestWords=normal(profile.interests).split(/[^a-z\d]+/).filter(s=>s.length>3).slice(0,24);
 score+=interestWords.filter(w=>title.includes(w)).length*3;
 if(course.level==='Bachelor')score+=0.3;
 return score;
}
function pickMappings(uni:University,profile:StudentProfile):{mappings:Course[],pillarCount:number,hassCount:number,referenceCount:number,topRelevance:number} {
 const list=coursesFor(uni.name).filter(c=>termApplies(c,profile.term));
 const dedupe=(xs:Course[], max:number)=>{
  const seenSutd=new Set<string>(),seenHost=new Set<string>();const out:Course[]=[];
  for(const c of xs.sort((a,b)=>courseScore(b,profile)-courseScore(a,profile))){
   const host=c.hostCode.toLowerCase(); const sutd=(c.sutdCode||'').toLowerCase();
   if(seenHost.has(host) || (sutd && seenSutd.has(sutd)))continue;
   if(!c.hostCode || !c.hostTitle || !c.sutdCode || !/^\d{2,3}\.[A-Za-z0-9]+$/.test(c.sutdCode))continue;
   seenHost.add(host); if(sutd)seenSutd.add(sutd);
   out.push({...c,source:'reference'}); if(out.length>=max)break;
  }
  return out;
 };
 const pillar=dedupe(list.filter(c=>relevantPillar(c,profile.pillar)),8);
 const hass=dedupe(list.filter(c=>normal(c.pillar)==='hass'),2);
 const all=[...pillar,...hass];
 return {mappings:all,pillarCount:pillar.length,hassCount:hass.length,referenceCount:list.length,topRelevance:all.reduce((a,c)=>a+Math.min(courseScore(c,profile),12),0)};
}
export function assembleCandidates(profile:StudentProfile):Recommendation[]{
 return universities.flatMap((uni):Recommendation[]=>{
  if(/for gii only/i.test(uni.name))return [];
  if(uni.minimumGpa!==null && profile.gpa+1e-9<uni.minimumGpa)return [];
  const term=profile.term;
  const note=uni.pillarRecommendations[profile.pillar]?.[term];
  if(!isTermAvailable(uni.slots[term],uni.dates[term],note))return [];
  const n=normal(note);const study=pickMappings(uni,profile);
  let score=45;
  if(n.startsWith('ok'))score+=17;
  else if(n.includes('limited'))score+=3;
  else if(n.includes('not recommended'))score-=18;
  else score-=2;
  const courseReady=study.pillarCount>=8 && study.hassCount>=2;
  score+=Math.min(study.pillarCount,8)*2 + Math.min(study.hassCount,2)*5;
  if(!courseReady)score-=18;
  score+=Math.min(study.topRelevance,55)*0.55;
  if(profile.region!=='Any' && regionMap[profile.region]?.includes(uni.country||''))score+=17;
  if(profile.region!=='Any' && !regionMap[profile.region]?.includes(uni.country||''))score-=10;
  const tags=uni.tags||[];
  if(profile.tracks.includes('Artificial Intelligence') && tags.some(x=>x.includes('artificial intelligence')))score+=5;
  if(profile.tracks.includes('Robotics') && tags.includes('robotics'))score+=5;
  if(profile.secondMajorHdi && tags.includes('design and hass'))score+=3;
  const warnings:string[]=[];
  if(uni.minimumGpa===null)warnings.push('No numeric minimum CGPA stated in the 2027 reference; confirm host rules.');
  if(n.includes('not recommended'))warnings.push('Pillar historically marked this host as not recommended.');
  if(n.includes('limited'))warnings.push('Pillar reference indicates limited course options.');
  if(uni.passportRestrictions && uni.passportRestrictions!=='-') warnings.push('Passport/nationality restriction: '+uni.passportRestrictions);
  if(study.pillarCount<8 || study.hassCount<2) warnings.push(`Only ${study.pillarCount}/8 pillar and ${study.hassCount}/2 HASS historical mappings found for ${term}. Research additional courses before submission.`);
  if(study.mappings.some(c=>/X{2,}/i.test(c.sutdCode||'')))warnings.push('Some SUTD equivalents use general elective placeholders (e.g. 50.XXX / 02.2XX); specific track or HDI credit is not confirmed.');
  if(profile.secondMajorHdi)warnings.push('HDI second-major fulfilment requires separate academic confirmation.');
  const strengths:string[]=[];
  if(n.startsWith('ok'))strengths.push('Pillar reference: OK');
  if(uni.minimumGpa!==null)strengths.push(`Minimum CGPA ${uni.minimumGpa.toFixed(2)}`);
  if(courseReady)strengths.push('8 pillar + 2 HASS references found');
  if(uni.tags?.length)strengths.push(uni.tags.slice(0,2).join(' · '));
  const reason=courseReady
    ? `A ${n.startsWith('ok')?'pillar-supported':'potential'} ${profile.term==='fall'?'Fall 2027':'Spring 2028'} option with ${study.pillarCount} pillar and ${study.hassCount} HASS historical course matches. Review current teaching and prerequisites.`
    : `Potential academic fit, but the supplied reference list does not yet support a complete 8+2 study plan for this term. Requires fresh course research.`;
  return [{university:uni,score:Math.round(score),reason,strengths,warnings,mappings:study.mappings,pillarCount:study.pillarCount,hassCount:study.hassCount,referenceCount:study.referenceCount,eligible:true,confidence:courseReady?'strong':study.mappings.length?'partial':'research-needed'}];
 }).sort((a,b)=>b.score-a.score);
}
function parseAiJson(text:string):unknown{
 const raw=text.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
 const i=raw.indexOf('{'), j=raw.lastIndexOf('}');
 if(i<0 || j<i)throw new Error('No JSON object in response');
 return JSON.parse(raw.slice(i,j+1));
}
export async function generateAnalysis(profile:StudentProfile):Promise<Analysis>{
 const candidates=assembleCandidates(profile);
 const base=candidates.slice(0,4).map(c=>({...c}));
 const notices=['The 2027 reference list records historical in-principle mappings, not current course offerings or approvals.','Check passport restrictions, prerequisites, schedules, actual host enrolment and track/HDI requirements with SUTD.','Generated forms are planning aids; official approval and submission happen in the SUTD Admission Portal.'];
 const apiKey=process.env.ZAO_API_KEY, model=process.env.ZAO_MODEL;
 if(!apiKey || !model){
  notices.unshift('ZaoAPI is not configured: showing a transparent rules-based shortlist.');
  return {recommendations:base,mode:'rules-based',notices,generatedAt:new Date().toISOString(),candidateCount:candidates.length};
 }
 try{
  const shortlist=candidates.slice(0,Math.max(12,Math.min(candidates.length,16)));
  const evidence=shortlist.map(c=>({
   id:c.university.id,name:c.university.name,country:c.university.country,city:c.university.city,
   minGpa:c.university.minimumGpa,score:c.score,pillar:c.university.pillarRecommendations[profile.pillar]?.[profile.term],
   pillarMapped:c.pillarCount,hassMapped:c.hassCount,
   relevantCourses:c.mappings.slice(0,6).map(m=>`${m.hostCode}: ${m.hostTitle} => ${m.sutdCode}: ${m.sutdTitle}`),
   warnings:c.warnings.slice(0,3),tags:c.university.tags||[]
  }));
  // Supports both native Anthropic Messages and OpenAI-compatible chat APIs.
  // Keep the API key in Vercel server environment variables; never expose it to the client.
  const protocol=process.env.ZAO_API_PROTOCOL==='anthropic'?'anthropic':'openai';
  const configuredURL=(process.env.ZAO_API_BASE_URL || 'https://api.zaowuyun.com/v1').trim();
  const baseURL=configuredURL.endsWith('/')?configuredURL.slice(0,-1):configuredURL;
  if(!baseURL.startsWith('https://'))throw new Error('AI provider URL must use HTTPS.');
  const systemPrompt='You are an evidence-constrained SUTD GEXP 2027 academic planning adviser. Recommend exactly four DIFFERENT university IDs solely from the provided shortlist and facts. Do not fabricate course codes, actual offerings, track compliance, admission likelihood, ranking numbers or approval. Keep every reason to <= 45 words, noting evidence gaps. Return ONLY JSON of form {"selections":[{"id":INTEGER,"reason":"..."},...]}. Do not treat referenced mappings as currently offered or approved.';
  const studentEvidence=JSON.stringify({student:{pillar:profile.pillar,gpa:profile.gpa,tracks:profile.tracks,hdi:profile.secondMajorHdi,interests:profile.interests,region:profile.region,term:profile.term},shortlist:evidence});
  const endpoint=protocol==='anthropic'?'messages':'chat/completions';
  const headers:Record<string,string>=protocol==='anthropic'
   ? {'x-api-key':apiKey,'anthropic-version':'2023-06-01','Content-Type':'application/json'}
   : {Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'};
  const payload=protocol==='anthropic'
   ? {model,max_tokens:1200,system:systemPrompt,messages:[{role:'user',content:studentEvidence}]}
   : {model,temperature:0.25,max_tokens:1200,messages:[{role:'system',content:systemPrompt},{role:'user',content:studentEvidence}]};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
  let response:Response;
  try{
   response=await fetch(`${baseURL}/${endpoint}`,{
    method:'POST',headers,signal:controller.signal,cache:'no-store',body:JSON.stringify(payload)
   });
  } finally {clearTimeout(timer);}
  if(!response.ok)throw new Error(`AI provider returned HTTP ${response.status}`);
  const data=await response.json();
  const rawText=protocol==='anthropic'
   ? (Array.isArray(data?.content)
      ? data.content.filter((block:{type?:string;text?:string})=>block?.type==='text'&&typeof block.text==='string').map((block:{text:string})=>block.text).join(' ')
      : '')
   : String(data?.choices?.[0]?.message?.content||'');
  const output=parseAiJson(rawText) as {selections?:{id?:number;reason?:string}[]};
  if(!Array.isArray(output?.selections) || output.selections.length<4)throw new Error('Invalid model selection format');
  const allowed=new Map(shortlist.map(s=>[s.university.id,s]));const selected:Recommendation[]=[];
  for(const choice of output.selections){
   const c=typeof choice.id==='number'?allowed.get(choice.id):undefined;
   if(!c || selected.some(x=>x.university.id===c.university.id))continue;
   const reason=typeof choice.reason==='string' && choice.reason.length>=12 && choice.reason.length<=360?choice.reason:c.reason;
   selected.push({...c,reason}); if(selected.length===4)break;
  }
  if(selected.length<4)throw new Error('Model did not select four unique valid universities');
  return {recommendations:selected,mode:'zaoapi',model,notices,generatedAt:new Date().toISOString(),candidateCount:candidates.length};
 } catch(err){
  notices.unshift(`AI request failed (${err instanceof Error?err.message:'unavailable'}); using the rules-based shortlist instead.`);
  return {recommendations:base,mode:'rules-based',notices,generatedAt:new Date().toISOString(),candidateCount:candidates.length};
 }
}
