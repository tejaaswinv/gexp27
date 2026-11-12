import type { Pillar } from './types';

/** Planning reference transcribed from SUTD's published pillar and HDI curriculum pages.
 * Term data for core subjects is from the curriculum diagrams.
 * For electives without a published term, candidates are shown with a clear check-offering warning.
 * This is NOT a registration timetable or credit-transfer approval database.
 */
export type CatalogueCategory='core'|'elective'|'hass'|'hdi-studio'|'hdi-ai'|'capstone';
export type CurriculumCourse={
 code:string; title:string; pillar:Pillar|'ALL'; category:CatalogueCategory;
 terms:number[]; source:string; tracks?:string[]; cohort?:'2025-earlier'|'2026-onwards';
};
export type TrackChoice={name:string;note:string;tags:string[]};

export const curriculumLinks:Record<Pillar,string>={
 CSD:'https://www.sutd.edu.sg/istd/education/undergraduate/curriculum/',
 EPD:'https://www.sutd.edu.sg/epd/education/undergraduate/curriculum/',
 ESD:'https://www.sutd.edu.sg/esd/education/undergraduate/curriculum/beyond-ay-2019/',
 ASD:'https://www.sutd.edu.sg/asd/education/undergraduate/curriculum/',
 DAI:'https://www.sutd.edu.sg/dai/education/undergraduate/curriculum/'
};
export const hdiCurriculumUrl='https://www.sutd.edu.sg/education/undergraduate/human-centred-domain-intelligence-second-major/curriculum/#tabs';
export const courseLinks:Record<Pillar,string>={
 CSD:'https://www.sutd.edu.sg/istd/education/undergraduate/courses/',
 EPD:'https://www.sutd.edu.sg/epd/education/undergraduate/courses/',
 ESD:'https://www.sutd.edu.sg/esd/education/undergraduate/courses/',
 ASD:'https://www.sutd.edu.sg/asd/education/undergraduate/courses/',
 DAI:'https://www.sutd.edu.sg/dai/education/undergraduate/courses/'
};
export const trackSources:Record<Pillar,string>={
 CSD:'https://www.sutd.edu.sg/istd/education/undergraduate/specialisation-tracks/overview/',
 EPD:'https://www.sutd.edu.sg/epd/education/undergraduate/curriculum/',
 ESD:'https://www.sutd.edu.sg/esd/education/undergraduate/specialisation-tracks/overview/',
 ASD:'https://www.sutd.edu.sg/asd/education/undergraduate/curriculum/',
 DAI:'https://www.sutd.edu.sg/dai/education/undergraduate/specialisation-tracks/'
};
const track=(name:string,note:string,tags:string[]):TrackChoice=>({name,note,tags});
export const pillarTracks:Record<Pillar,TrackChoice[]>={
 CSD:[
  track('Artificial Intelligence','ML, deep learning, intelligent agents',['ai','machine learning','deep learning']),
  track('Custom Track','Build an adviser-approved bespoke concentration',['design','computing']),
  track('Data Analytics','Data engineering, modelling and insights',['analytics','data']),
  track('Financial Technology','Financial computing and fintech',['finance','fintech']),
  track('IoT and Intelligent Systems','Networks, distributed computing and connected devices',['iot','network','embedded']),
  track('Security','Cybersecurity, network and systems protection',['security','cyber']),
  track('Software Engineering','Reliable software and product engineering',['software','distributed']),
  track('Visual Analytics and Computing','Computer vision and interactive visualisation',['vision','graphics','hci'])
 ],
 EPD:[
  track('Beyond Industry 4.0','Intelligent manufacturing and smart industry',['manufacturing','automation']),
  track('Computer Engineering','Digital hardware, computing systems',['computer','embedded']),
  track('Electrical Engineering','Electronics, signals and circuits',['electrical','circuits']),
  track('Healthcare Engineering Design','Biomedical devices and human impact',['healthcare','medical']),
  track('Mechanical Engineering','Mechanics and physical product systems',['mechanical','fluid']),
  track('Robotics','Controls, perception and intelligent machines',['robotics','control']),
  track('Self-Directed Programme','An individually planned engineering focus',['design','engineering'])
 ],
 ESD:[
  track('Aviation Systems','Aviation operations, transportation and systems',['aviation','transport']),
  track('Business Analytics and Operations Research','Analytics, optimisation and decisions',['analytics','operations']),
  track('Financial Services','Risk, finance, markets and quantitative modelling',['finance','fintech']),
  track('Supply Chain & Logistics','Supply chain planning and optimisation',['supply','logistics'])
 ],
 ASD:[
  track('Design Computation','Architecture + computation (interest area, not a declared track)',['computation','fabrication']),
  track('Building Technology','Structures, sustainability and energy (interest area)',['building','sustainability']),
  track('History, Theory and Culture','Built environment history and theory (interest area)',['architecture','culture']),
  track('Urban and Sustainable Design','Urban analytics and resilient places (interest area)',['urban','sustainability']),
  track('Spatial AI & Creative Computation','Intelligent spatial design (interest area)',['ai','design'])
 ],
 DAI:[
  track('Healthcare Design','AY2025 and earlier: healthcare product/service innovation',['healthcare','design']),
  track('Enterprise Design','AY2025 and earlier: entrepreneurship and manufacturing',['business','enterprise'])
 ]
};
export const dai2026Tracks:TrackChoice[]=[
 track('Societal and Systems Intelligence','AY2026 onwards · economics, business and AI',['economics','business','finance']),
 track('Human-Centred Intelligence','AY2026 onwards · psychology, ethics and human–AI interaction',['hci','psychology','human'])
];
export function getTracks(pillar:Pillar,year:number){return pillar==='DAI'&&year>=2026?dai2026Tracks:pillarTracks[pillar]}
export function getTrackGuidance(pillar:Pillar,year:number){
 if(pillar==='CSD')return 'SUTD recommends focusing on one CSD track: 2 of 3 track cores and 4 qualifying track electives. You can explore more, but confirm the final combination with your pillar.';
 if(pillar==='DAI')return year>=2026?'The 2026+ DAI supercharged tracks have a different curriculum from AY2025. Please confirm your intake and track requirements.':'DAI’s Healthcare Design and Enterprise Design tracks apply up to AY2025 and require track electives plus a related internship.';
 if(pillar==='ASD')return 'These are ASD curriculum focus areas—not formally declared specialisation tracks. Your architecture studio sequence and option studios remain important.';
 if(pillar==='ESD')return 'ESD tracks are optional and generally involve three related electives across Terms 6–8.';
 return 'EPD offers named specialisations. Choose the subjects and prerequisites with your EPD mentor.';
}

const core=(pillar:Pillar,term:number,code:string,title:string,cohort?:'2025-earlier'|'2026-onwards'):CurriculumCourse=>({pillar,terms:[term],code,title,category:'core',source:curriculumLinks[pillar],cohort});
const elective=(pillar:Pillar,code:string,title:string,terms:number[]=[],tracks:string[]=[]):CurriculumCourse=>({pillar,terms,code,title,category:'elective',source:courseLinks[pillar],tracks});
const ai=(pillar:Pillar,code:string,title:string,terms:number[]=[],tracks:string[]=[]):CurriculumCourse=>({pillar,terms,code,title,category:'hdi-ai',source:hdiCurriculumUrl,tracks});
const studio=(code:string,title:string,terms:number[]=[]):CurriculumCourse=>({pillar:'ALL',terms,code,title,category:'hdi-studio',source:hdiCurriculumUrl});
const hass=(code:string,title:string):CurriculumCourse=>({pillar:'ALL',terms:[],code,title,category:'hass',source:hdiCurriculumUrl});

export const curriculumCourses:CurriculumCourse[]=[
 // CSD mandatory curriculum and elective offerings
 core('CSD',4,'50.001','Information Systems & Programming'),
 core('CSD',4,'50.002','Computation Structures'),
 core('CSD',4,'50.004','Algorithms'),
 core('CSD',5,'50.003','Elements of Software Construction'),
 core('CSD',5,'50.005','Computer System Engineering'),
 elective('CSD','50.006','User Interface Design and Implementation',[7],['Visual Analytics and Computing','Software Engineering']),
 elective('CSD','50.007','Machine Learning',[5,6,8],['Artificial Intelligence','Data Analytics']),
 elective('CSD','50.012','Networks',[6,8],['IoT and Intelligent Systems','Security']),
 elective('CSD','50.020','Network Security',[],['Security']),
 elective('CSD','50.021','Artificial Intelligence',[],['Artificial Intelligence','IoT and Intelligent Systems']),
 elective('CSD','50.035','Computer Vision',[],['Artificial Intelligence','Visual Analytics and Computing']),
 elective('CSD','50.037','Blockchain Technology',[],['Security','Financial Technology']),
 elective('CSD','50.038','Computational Data Science',[],['Data Analytics','Artificial Intelligence']),
 elective('CSD','50.039','Theory and Practice of Deep Learning',[],['Artificial Intelligence']),
 elective('CSD','50.040','Natural Language Processing',[],['Artificial Intelligence']),
 elective('CSD','50.041','Distributed Systems and Computing',[],['IoT and Intelligent Systems','Security']),
 elective('CSD','50.042','Foundations of Cybersecurity',[],['Security']),
 elective('CSD','50.044','System Security',[],['Security']),
 elective('CSD','50.045','Information Retrieval',[],['Data Analytics','Artificial Intelligence']),
 elective('CSD','50.046','Cloud Computing and IoT',[],['IoT and Intelligent Systems']),
 elective('CSD','50.047','Mobile Robotics',[],['IoT and Intelligent Systems','Artificial Intelligence']),
 elective('CSD','50.050','Advanced Algorithms',[],['Software Engineering','Artificial Intelligence']),
 elective('CSD','50.055','Special Topic: Machine Learning Operations',[],['Artificial Intelligence','Software Engineering']),
 elective('CSD','50.057','Modern Software Design Studio with Agentic AI',[],['Artificial Intelligence','Software Engineering']),
 // EPD mandatory curriculum
 core('EPD',4,'30.100','Computational and Data-Driven Engineering'),
 core('EPD',4,'30.002','Circuits & Electronics'),
 core('EPD',4,'30.001','Structures & Materials'),
 core('EPD',5,'30.101','Systems & Control'),
 core('EPD',5,'30.007','Engineering Design Innovation'),
 elective('EPD','30.102','Electromagnetics & Applications',[5],['Electrical Engineering','Computer Engineering']),
 elective('EPD','30.103','Fluid Mechanics',[5],['Mechanical Engineering']),
 elective('EPD','30.110','Digital Systems Laboratory',[],['Computer Engineering','Electrical Engineering']),
 elective('EPD','30.114','Advanced Feedback and Control',[],['Robotics']),
 elective('EPD','30.119','Intelligent Robotics',[],['Robotics']),
 elective('EPD','30.120','Design and Manufacturing',[],['Beyond Industry 4.0','Mechanical Engineering']),
 elective('EPD','30.202','Design of Intelligent Digital Integrated Circuits and Systems',[],['Computer Engineering','Electrical Engineering']),
 elective('EPD','30.203','Topics in Biomedical and Healthcare Engineering',[],['Healthcare Engineering Design']),
 elective('EPD','30.303','Industry 4.0 and 3D Printing',[],['Beyond Industry 4.0']),
 elective('EPD','01.106','Engineering Management',[8],['Beyond Industry 4.0','Self-Directed Programme']),
 // ESD mandatory curriculum
 core('ESD',4,'40.002','Optimisation'),
 core('ESD',4,'40.011','Data and Business Analytics'),
 core('ESD',4,'40.017','Probability and Statistics'),
 core('ESD',5,'40.012','Manufacturing and Service Operations'),
 core('ESD',5,'40.016','The Analytics Edge'),
 core('ESD',5,'40.018','Heuristics and Systems Theory'),
 elective('ESD','01.107','Urban Transportation',[7],['Aviation Systems','Supply Chain & Logistics']),
 elective('ESD','40.015','Simulation Modelling and Analysis',[6],['Aviation Systems','Business Analytics and Operations Research']),
 elective('ESD','40.230','Design for Sustainability',[],['Supply Chain & Logistics']),
 elective('ESD','40.250','Quality Analytics and Management',[],['Business Analytics and Operations Research','Supply Chain & Logistics']),
 elective('ESD','40.302','Advanced Topics in Optimisation',[],['Business Analytics and Operations Research','Supply Chain & Logistics']),
 elective('ESD','40.305','Advanced Topics in Stochastic Modelling',[],['Financial Services','Business Analytics and Operations Research']),
 elective('ESD','40.316','Game Theory',[],['Financial Services']),
 elective('ESD','40.319','Statistical and Machine Learning',[],['Business Analytics and Operations Research']),
 // ASD mandatory curriculum
 core('ASD',4,'20.101','Architecture Core Studio 1'),
 core('ASD',4,'20.202','Architectural Structure & Enclosure Design'),
 core('ASD',4,'20.212','Digital Design and Fabrication'),
 core('ASD',4,'20.222','Modernism: Technology and Society in Architecture'),
 core('ASD',5,'20.102','Architecture Core Studio 2'),
 core('ASD',5,'20.201','Architecture Science & Technology'),
 core('ASD',5,'20.213','Building and Urban Analytics'),
 core('ASD',5,'20.221','Traditions: World History Connections to Vernacular Architecture'),
 core('ASD',7,'20.111','Sustainable Design Option Studio 1'),
 core('ASD',8,'20.112','Sustainable Design Option Studio 2'),
 elective('ASD','20.311','Architectural Robotics',[],['Spatial AI & Creative Computation']),
 elective('ASD','20.318','Creative Machine Learning',[6],['Spatial AI & Creative Computation']),
 elective('ASD','20.319','Architectural Theory and Design Application in the 20th-21st Century',[6],['History, Theory and Culture']),
 elective('ASD','20.320','Project Management in the Built Environment',[],['Building Technology','Urban and Sustainable Design']),
 // DAI - AY2025 and earlier official curriculum
 core('DAI',4,'50.004','Algorithms','2025-earlier'),
 core('DAI',4,'60.002','AI Applications in Design','2025-earlier'),
 core('DAI',4,'60.003','Product Design Studio','2025-earlier'),
 core('DAI',5,'50.007','Machine Learning','2025-earlier'),
 core('DAI',5,'60.005','Human Computer Interaction and AI','2025-earlier'),
 core('DAI',5,'60.004','Service Design Studio','2025-earlier'),
 core('DAI',6,'60.001','Applied Deep Learning','2025-earlier'),
 core('DAI',6,'60.008','Systems Design Studio','2025-earlier'),
 core('DAI',7,'60.006','Spatial Design Studio','2025-earlier'),
 // DAI 2026 onward curriculum publishes different track-specific studio requirements.
 core('DAI',4,'60.002','AI Applications in Design','2026-onwards'),
 core('DAI',5,'60.005','Human Computer Interaction and AI','2026-onwards'),
 elective('DAI','60.001','Applied Deep Learning',[6],['Healthcare Design','Human-Centred Intelligence']),
 elective('DAI','60.003','Product Design Studio',[4],['Healthcare Design','Enterprise Design']),
 elective('DAI','60.004','Service Design Studio',[5],['Healthcare Design','Enterprise Design']),
 elective('DAI','60.006','Spatial Design Studio',[7],['Healthcare Design','Enterprise Design']),
 elective('DAI','60.008','Systems Design Studio',[6],['Enterprise Design']),
 elective('DAI','01.116','AI for Healthcare',[],['Healthcare Design']),
 elective('DAI','30.303','Industry 4.0 & 3D Printing',[],['Enterprise Design']),
 core('CSD',7,'01.400','Capstone 1'),
 core('CSD',8,'01.401','Capstone 2'),
 core('EPD',7,'01.400','Capstone 1'),
 core('EPD',8,'01.401','Capstone 2'),
 core('ESD',7,'01.400','Capstone 1'),
 core('ESD',8,'01.401','Capstone 2'),
 core('ASD',7,'01.400','Capstone 1'),
 core('ASD',8,'01.401','Capstone 2'),
 core('DAI',7,'01.400','Capstone 1'),
 core('DAI',8,'01.401','Capstone 2'),
 // HDI: official curriculum lists permitted studio + AI and HASS course catalogues,
 // but does NOT guarantee a particular term. For non-DAI majors, show as optional.
 studio('60.003','Product Design Studio'),
 studio('60.004','Service Design Studio'),
 studio('60.006','Spatial Design Studio'),
 studio('60.008','Systems Design Studio'),
 studio('50.057','Modern Software Design Studio with Agentic AI'),
 ai('CSD','50.007','Machine Learning',[],['Artificial Intelligence']),
 ai('CSD','50.021','Artificial Intelligence',[],['Artificial Intelligence']),
 ai('CSD','50.035','Computer Vision',[],['Artificial Intelligence']),
 ai('CSD','50.039','Theory and Practice of Deep Learning',[],['Artificial Intelligence']),
 ai('CSD','50.040','Natural Language Processing',[],['Artificial Intelligence']),
 ai('EPD','30.100','Computational and Data-Driven Engineering',[4]),
 ai('EPD','30.101','Systems & Control',[5]),
 ai('EPD','30.119','Intelligent Robotics',[],['Robotics']),
 ai('ESD','40.002','Optimisation',[4]),
 ai('ESD','40.016','The Analytics Edge',[5]),
 ai('ESD','40.319','Statistical and Machine Learning',[]),
 ai('ASD','20.311','Architectural Robotics',[]),
 ai('ASD','20.318','Creative Machine Learning',[6]),
 ai('DAI','60.001','Applied Deep Learning',[6]),
 ai('DAI','60.002','AI Applications in Design',[4]),
 ai('DAI','60.005','Human Computer Interaction and AI',[5]),
 {pillar:'ALL',category:'hass',code:'02.005',title:'Introduction to Human-Centred Design',terms:[4,6,8],source:hdiCurriculumUrl},
 hass('02.104TS','History of International Development in Asia: The Role of Engineers and Designers'),
 {pillar:'ALL',category:'hass',code:'02.110DH',title:'The Chinese Lyrical Tradition: Arts, Literature, and Landscape Design',terms:[5],source:hdiCurriculumUrl},
 hass('02.137DH','Introduction to Digital Humanities'),
 hass('02.140TS','Shaping Futures: Innovation, Work and Society'),
 hass('02.143DH','Artificial Intelligence and Ethics'),
 hass('02.147TS','Interventions in Design, Technology and Society'),
 hass('02.159HT','Equitable Tech: Reimagining Our Digital Infrastructures'),
 hass('02.165TS','Empathy: An interdisciplinary concept'),
 hass('02.170HT','History of Surveillance in Modern Asia'),
 hass('02.174TS','The Design of Digital Platforms'),
 hass('02.176','Collective Behaviour'),
 hass('02.180DH','Worldbuilding: Critical and Creative Practices'),
 hass('02.181HT','AI & Society'),
 hass('02.201TS','Digital Sociology'),
 hass('02.204','Technology and the Self'),
 hass('02.216TS','Human Behaviour, Technology and Design'),
 hass('02.218TS','Introduction to Psychology'),
 hass('02.228TS','Design in the Anthropocene')
];

export function getHdiGuidance(pillar:Pillar){
 if(pillar==='DAI')return 'DAI pathway: 2 courses in a chosen domain, 2 AI courses from DAI + 1 AI course in that domain, plus 1 domain HASS + 2 HASS Human-Centred Design courses.';
 if(pillar==='ASD')return 'ASD pathway: 2 DAI studios OR 1 studio + 1 DAI course; 2 AI courses from ASD + 1 AI course from any major; 3 HASS Human-Centred Design courses. ASD 20.112 may count as a cross-listed DAI studio subject to approval.';
 return 'Engineering pathway: 2 DAI studios OR 1 studio + 1 DAI course; 2 AI courses from your own pillar + 1 AI course from any pillar; and 3 HASS Human-Centred Design courses.';
}
export function getTermDescription(pillar:Pillar,term:number,year:number){
 if(pillar==='DAI'&&year>=2026&&(term===4||term===5))
  return 'AY2026 DAI uses track-specific studios and core subjects. Some studio and track-core codes are not published in the curriculum diagram—verify the official list before finalising.';
 if(pillar==='ASD'&&(term===7||term===8))
  return 'ASD has an option studio + capstone sequence. Studio approvals and elective choices are cohort-dependent.';
 if(term===7||term===8)return 'Capstone and electives: suggested course lists are planning references. Actual term offerings and prerequisites must be checked.';
 if(pillar==='EPD'&&term===5)return 'Choose one EPD core elective (30.102 or 30.103), subject to cohort rules.';
 return 'Core modules below are taken from SUTD’s term-by-term curriculum. Electives and HASS choices need timetable confirmation.';
}
export function coreCoursesFor(pillar:Pillar,term:number,year:number):CurriculumCourse[]{
 return curriculumCourses.filter(c=>c.pillar===pillar&&c.category==='core'&&c.terms.includes(term)&&(!c.cohort||(c.cohort==='2026-onwards'?year>=2026:year<2026)));
}
export function courseOptionsFor(pillar:Pillar,term:number,year:number,tracks:string[],hdi:boolean):CurriculumCourse[]{
 const main=curriculumCourses.filter(c=>{
  if(c.category==='hass')return hdi;
  if(c.category==='hdi-studio')return hdi&&(term>=7);
  if(c.category==='hdi-ai')return hdi&&(c.pillar===pillar||term>=7);
  if(c.pillar!==pillar)return false;
  if(c.cohort&&((year>=2026)!==(c.cohort==='2026-onwards')))return false;
  if(c.category==='core')return c.terms.includes(term);
  if(c.terms.length===0)return term>=5;
  return c.terms.includes(term);
 });
 const unique=new Map<string,CurriculumCourse>();
 for(const item of main){
  const current=unique.get(item.code);
  if(!current||item.category==='core'||(item.terms.includes(term)&&!current.terms.includes(term)))unique.set(item.code,item);
 }
 return [...unique.values()].sort((a,b)=>{
  const rank=(c:CurriculumCourse)=>c.category==='core'?0:c.tracks?.some(t=>tracks.includes(t))?1:c.terms.includes(term)?2:c.category==='hass'?3:c.category.startsWith('hdi')?4:5;
  return rank(a)-rank(b)||a.code.localeCompare(b.code);
 });
}
export function termCourseLabel(c:CurriculumCourse,term:number):string {
 if(c.category==='core')return 'Curriculum core';
 if(c.terms.includes(term))return 'Listed for this term';
 if(c.category==='hass')return 'HDI HASS — check timetable';
 if(c.category==='hdi-ai'||c.category==='hdi-studio')return 'HDI candidate — check requirements/term';
 return 'Elective — check term/prerequisites';
}
