import { readFile } from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { Course,StudentProfile,University } from './types';
import { coursesFor,universities } from './catalog';

const ink=rgb(0.12,0.22,0.24);
const absoluteY=(pageHeight:number,top:number,size:number)=>pageHeight-top-size*0.86;
function latin(v:unknown){return String(v??'').replace(/[^\x20-\x7e]/g,' ').replace(/\s+/g,' ').trim();}
function writeFit(page:any,font:PDFFont,str:unknown,x:number,top:number,width:number,maxSize=8,minSize=5){
 const txt=latin(str);if(!txt)return;
 let size=maxSize; while(size>minSize && font.widthOfTextAtSize(txt,size)>width)size-=0.25;
 let out=txt; while(out && font.widthOfTextAtSize(out,size)>width)out=out.slice(0,-1);
 if(out.length<txt.length)out=out.slice(0,Math.max(out.length-3,0))+'...';
 page.drawText(out,{x,y:absoluteY(page.getHeight(),top,size),font,size,color:ink});
}
function referenceStatus(c:Course,university:string):boolean{
 if(c.source==='manual')return false;
 return coursesFor(university).some(x=>x.hostCode.toLowerCase()===c.hostCode.toLowerCase() && x.sutdCode===c.sutdCode);
}
export async function filledStudyPlan(profile:StudentProfile,uni:University,mappings:Course[]):Promise<Uint8Array>{
 const buf=await readFile(path.join(process.cwd(),'public/templates/study-plan.pdf'));
 const doc=await PDFDocument.load(buf);const font=await doc.embedFont(StandardFonts.Helvetica);
 const p=doc.getPages()[0],p2=doc.getPages()[1];
 writeFit(p,font,profile.name,135,100,255,9);
 writeFit(p,font,profile.studentId||'Not provided',505,100,285,9);
 writeFit(p,font,profile.pillar,135,123,255,9);
 writeFit(p,font,profile.secondMajorHdi?'HDI (second major requested)':'None',505,123,280,9);
 writeFit(p,font,uni.name,135,147,255,8.3);
 writeFit(p,font,profile.tracks.join(' / ')||'Not specified',505,147,280,8);
 writeFit(p,font,uni.country||'',135,170,255,9);
 // 'Fall / Spring' is part of the printed template, so place the selection to the right.
 writeFit(p,font,profile.term==='fall'?'FALL 2027':'SPRING 2028',675,170,140,9);
 for(const [term,codeX,titleX,top] of [
  ['4',61,135,232],['5',440,506,232],['7',61,135,390],['8',440,506,390]
 ] as [keyof StudentProfile['homePlan'],number,number,number][]){
  profile.homePlan[term].slice(0,5).forEach((c,i)=>{
   writeFit(p,font,c.code,codeX,top+i*22.6,65,8);
   writeFit(p,font,c.title,titleX,top+i*22.6,term==='4'||term==='7'?240:280,8);
  });
 }
 mappings.slice(0,10).forEach((c,i)=>{
  const top=145+i*22.45;
  writeFit(p2,font,c.hostCode,59,top,56,7.5);
  writeFit(p2,font,c.hostTitle,126,top,220,8.2,5.2);
  writeFit(p2,font,c.sutdCode,357,top,61,7.5);
  writeFit(p2,font,c.sutdTitle||'',428,top,230,8,5.2);
  writeFit(p2,font,referenceStatus(c,uni.name)?'Yes':'No',728,top,45,8.5);
 });
 return doc.save();
}
export async function filledCreditTransfer(profile:StudentProfile,uni:University,c:Course):Promise<Uint8Array>{
 const buf=await readFile(path.join(process.cwd(),'public/templates/credit-transfer.pdf'));
 const doc=await PDFDocument.load(buf);const font=await doc.embedFont(StandardFonts.Helvetica);
 const page=doc.getPages()[0];
 writeFit(page,font,profile.name,110,133,170,7.8);
 writeFit(page,font,profile.studentId||'Not provided',380,133,170,7.8);
 writeFit(page,font,profile.pillar,110,157,170,8);
 writeFit(page,font,profile.secondMajorHdi?'HDI (requested)':'None',380,157,171,8);
 writeFit(page,font,uni.name,110,180,170,8);
 writeFit(page,font,profile.tracks.join(' / '),380,180,180,7.5);
 writeFit(page,font,uni.country,110,201,170,8);
 writeFit(page,font,profile.term==='fall'?'FALL 2027':'SPRING 2028',478,201,90,8);
 writeFit(page,font,c.hostCode,28,263,76,8);
 writeFit(page,font,c.hostTitle,110,263,134,7.5);
 writeFit(page,font,c.hostCredits,250,263,32,8);
 writeFit(page,font,c.sutdCode,291,263,72,8);
 writeFit(page,font,c.sutdTitle,375,263,155,7.5);
 writeFit(page,font,c.sutdCredits,537,263,32,8);
 // Do not invent the detailed syllabus, assessments, workload or a 70% equivalence decision.
 return doc.save();
}
function csvEscape(s:unknown):string{return '"'+String(s??'').replace(/"/g,'""')+'"';}
const filename=(s:string)=>s.replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,58);
export async function buildExportPack(profile:StudentProfile,selected:{universityId:number;mappings:Course[]}[]):Promise<Uint8Array>{
 const zip=new JSZip();const docs:string[]=[];
 docs.push('GEXP ATLAS | PERSONAL STUDY-PLAN PACK',`Student: ${profile.name}`,`ID: ${profile.studentId||'(not supplied)'}`,`CGPA: ${profile.gpa.toFixed(2)} / 5.00`,`Pillar: ${profile.pillar}`,`Tracks: ${profile.tracks.join(', ')||'None specified'}`,`HDI second major: ${profile.secondMajorHdi?'Yes':'No'}`,`Term: ${profile.term==='fall'?'Fall 2027':'Spring 2028'}`,'');
 docs.push('IMPORTANT: These are planning copies of the SUTD research-only PDF templates. They are NOT approved study plans. Submit officially through the SUTD Admission Portal after course availability/prerequisites, credit-transfer equivalence, track and HDI requirements, and host criteria are verified. Historical reference entries DO NOT guarantee current offerings or enrolment.');
 docs.push('Official study-plan template calls for at least 8 pillar-related and 2 HASS-related courses for EACH university; do not assume a filled 10-row template is approved.\n');
 for(const [i,row] of selected.entries()){
  const uni=universities.find(u=>u.id===row.universityId);if(!uni)continue;
  const prefix=`${String(i+1).padStart(2,'0')}_${filename(uni.name)}`;
  const pillar=row.mappings.filter(c=>c.pillar=== (profile.pillar==='CSD'?'ISTD':profile.pillar)).length;
  const hass=row.mappings.filter(c=>c.pillar==='HASS').length;
  docs.push(`\n${i+1}. ${uni.name} (${uni.country||'N/A'})`);
  docs.push(`CGPA threshold: ${uni.minimumGpa??'Not specified in reference'}; Slots: ${uni.slots[profile.term]??'Not stated'}; Pillar reference: ${uni.pillarRecommendations[profile.pillar]?.[profile.term]||'Not stated'}`);
  docs.push(`Current study-plan mappings: ${pillar}/8 pillar, ${hass}/2 HASS. ${pillar>=8&&hass>=2?'Template minimum count reached; academic review still required.':'INCOMPLETE: research more suitable courses.'}`);
  docs.push(`Host teaching period (indicative): ${uni.dates[profile.term]||'Not provided'}`);
  if(row.mappings.some(c=>/X{2,}/i.test(c.sutdCode||'')))docs.push('Some equivalents use elective placeholders (e.g. 50.XXX, 02.2XX). Confirm the EXACT SUTD course/credit type and degree track fulfilment with coordinators.');
  if(uni.passportRestrictions)docs.push(`Nationality/Passport note: ${uni.passportRestrictions}`);
  const studyPdf=await filledStudyPlan(profile,uni,row.mappings);
  zip.file(`${prefix}_Study_Plan.pdf`,studyPdf);
  const csv=[['Pillar/HASS','Host course code','Host course title','Host credits','SUTD subject code','SUTD subject title','SUTD credits','Historical reference?','Notes'].map(csvEscape).join(',')];
  let creditCount=0;
  for(const [j,c] of row.mappings.entries()){
   const referenced=referenceStatus(c,uni.name);
   csv.push([c.pillar,c.hostCode,c.hostTitle,c.hostCredits,c.sutdCode,c.sutdTitle,c.sutdCredits,referenced?'Yes':'No',referenced?'Historical reference - reverify':'New suggestion - needs syllabus and approval'].map(csvEscape).join(','));
   if(!referenced){
    const credit=await filledCreditTransfer(profile,uni,c);
    zip.file(`${prefix}_NEW_Credit_Transfer_${String(++creditCount).padStart(2,'0')}_${filename(c.hostCode)}.pdf`,credit);
    docs.push(`NEW MAPPING FORM: ${c.hostCode} -> ${c.sutdCode||'TBC'}. Attach official syllabus, assessment breakdown, workload hours, source website and request review. This generated form leaves those unverified fields blank.`);
   }
  }
  zip.file(`${prefix}_Mappings.csv`,csv.join('\n'));
 }
 docs.push('\nDATA SOURCE: SUTD GEXP 2027 Reference Course List and Other Information, as supplied in the uploaded resource ZIP.');
 docs.push('Source note: 2023 PDF templates in supplied 2027 resources; official portal and guidance may change.');
 zip.file('START_HERE_Review_Checklist.txt',docs.join('\n'));
 return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
}
