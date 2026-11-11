// Smoke tests against the exact TypeScript recommendation source (transpiled in memory).
const fs=require('fs'), path=require('path'),vm=require('vm'),ts=(()=>{try{return require('typescript')}catch{return require('/usr/local/slides_js/node_modules/typescript')}})();
const root=path.resolve(__dirname,'..');const cache={};
function load(f){
 if(f.endsWith('.json'))return {default:JSON.parse(fs.readFileSync(f,'utf8'))};
 f=f.replace(/\.ts$/, '')+'.ts';if(cache[f])return cache[f].exports;
 const m={exports:{}};cache[f]=m;
 const input=fs.readFileSync(f,'utf8');const js=ts.transpileModule(input,{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const req=(p)=>p.startsWith('@/')?load(path.join(root,p.slice(2))):p.startsWith('.')?load(path.resolve(path.dirname(f),p)):require(p);
 const fn=vm.runInThisContext(`(function(require,module,exports,process,fetch,AbortController,setTimeout,clearTimeout){${js}\n})`,{filename:f});fn(req,m,m.exports,process,globalThis.fetch,AbortController,setTimeout,clearTimeout);return m.exports;
}
const {assembleCandidates,generateAnalysis}=load(path.join(root,'lib/recommend'));
(async()=>{
 const make=(gpa,term,tracks,region='Any')=>({name:'Test Student',studentId:'1010000',gpa,pillar:'CSD',tracks,secondMajorHdi:true,interests:'AI agents, systems security, human computer interaction',region,term,passport:'Indian',homePlan:{'4':[],'5':[],'7':[],'8':[]}});
 for(const p of [make(3.56,'fall',['Artificial Intelligence','Cybersecurity'],'Europe'),make(3.12,'fall',['Artificial Intelligence'],'Any'),make(3.3,'spring',['Cybersecurity'],'Europe')]){
  const candidates=assembleCandidates(p),analysis=await generateAnalysis(p);
  console.log('\nPROFILE',p.gpa,p.term,p.region,'candidateCount',candidates.length,'results',analysis.recommendations.length,analysis.mode);
  console.log('TOP4',analysis.recommendations.map(r=>[r.university.name, r.score, r.pillarCount, r.hassCount]));
  if(analysis.recommendations.length!==4)throw new Error('Expected exactly four');
  for(const r of analysis.recommendations){if(r.university.minimumGpa!=null&&r.university.minimumGpa>p.gpa)throw new Error('Ineligible CGPA');for(const c of r.mappings)if(c.university.toLowerCase()!==r.university.name.toLowerCase())throw new Error('Mapping university mismatch')}
 }
 console.log('\nALL LOGIC SMOKE TESTS PASSED')
})().catch(e=>{console.error(e);process.exitCode=1});
