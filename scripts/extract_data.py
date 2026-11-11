import os,json,re,collections,sys
from artifact_tool import Blob, SpreadsheetFile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=str(root/'public/resources/gexp-2027-reference.xlsx')
out=str(root/'data/catalog.json')
w=SpreadsheetFile.import_xlsx(Blob.load(p))
s0=w.worksheets.get_item_at(0).get_range('A2:P6646').values
s1=w.worksheets.get_item_at(1).get_range('A4:V81').values
s2=w.worksheets.get_item_at(2).get_range('A2:E22').values
s3=w.worksheets.get_item_at(3).get_range('A3:N79').values

def val(x):
 if x is None or isinstance(x,str) and x.strip() in ('','19','-','N/A'): return None
 if isinstance(x,str):return x.strip()
 return x

unis=[]
for r in s1:
 if not isinstance(r[0],(int,float)) or not r[1]:continue
 u={'id':int(r[0]),'name':str(r[1]).strip(),'country':val(r[2]),'city':val(r[3]),'minimumGpa':float(r[4]) if isinstance(r[4],(int,float)) else None,'passportRestrictions':val(r[5]),'slots':{'fall':val(r[6]),'spring':val(r[7])},'dates':{'fall':val(r[8]),'spring':val(r[9])},'pillarRecommendations':{'ASD':{'fall':val(r[10]),'spring':val(r[11])},'DAI':{'fall':val(r[12]),'spring':val(r[13])},'EPD':{'fall':val(r[14]),'spring':val(r[15])},'ESD':{'fall':val(r[16]),'spring':val(r[17])},'CSD':{'fall':val(r[18]),'spring':val(r[19])},'HASS':{'fall':val(r[20]),'spring':val(r[21])}}}
 unis.append(u)

highlight_by_name={str(r[1]).strip().lower():{'tags':[t for t,x in zip(['healthcare','aviation','artificial intelligence','smart cities','sustainability','design and hass','innovation and entrepreneurship','robotics'],r[4:12]) if str(x).lower().strip()=='yes'],'highlights':val(r[12]),'funFacts':val(r[13])} for r in s3 if r[1]}
for u in unis:
 hl=highlight_by_name.get(u['name'].lower());
 if hl: u.update(hl)

courses=[]
for row in s0[1:]:
 if not row[0] or not row[4] or not row[5]:continue
 uni, campus, term,pillar,hostcode,hosttitle,hostcredits,subid,sutdcode,sutdtitle,sutdcredits,level,hass,remarks,*rest=row
 if not isinstance(hostcode,(str,int,float)):continue
 item={'university':str(uni).strip(),'exchangeTerm':val(term),'pillar':val(pillar),'hostCode':str(hostcode).strip(),'hostTitle':str(hosttitle).strip(),'hostCredits':val(hostcredits),'sutdCode':str(sutdcode).strip() if sutdcode is not None else None,'sutdTitle':val(sutdtitle),'sutdCredits':val(sutdcredits),'level':val(level),'hassDiscipline':val(hass),'remarks':val(remarks)}
 courses.append(item)

details={'dataset':'SUTD GEXP 2027 Reference Course List and Other Information','sourceUpdated':'2026-11-11','disclaimer':'Reference mappings indicate past in-principle approvals, NOT guaranteed current availability, eligibility, enrolment or pillar approval.','universities':unis,'courses':courses,'previousChoices':[list(map(val,r)) for r in s2 if r[0] is not None]}
with open(out,'w') as f:json.dump(details,f,ensure_ascii=False,separators=(',',':'))
print('DATA',out,os.path.getsize(out),'UNIS',len(unis),'COURSES',len(courses),flush=True)
print('uni sample',[(u['name'],u['minimumGpa'],u['pillarRecommendations']['CSD']['fall']) for u in unis[:10]],flush=True)
print('pillar counts',collections.Counter(str(c['pillar']) for c in courses).most_common(10),flush=True)
print('top course uni',collections.Counter(c['university'] for c in courses).most_common(10),flush=True)
print('Special choices', [(u['name'],u['minimumGpa'],u['slots']['fall'],u['pillarRecommendations']['CSD']['fall']) for u in unis if any(v in u['name'].lower() for v in ['uppsala','groningen','leuven','munich','kaist','waterloo','tampere','aalto','delft'])],flush=True)
