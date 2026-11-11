"""Run from project root to index supplied GEXP reference PDFs in a private JSON store."""
from pathlib import Path
import fitz,json,re
import sys
project=Path(__file__).resolve().parents[1]
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else project/'internal/GEXP 2027 Resources'
out=project/'data/resources.json'
items=[]
for path in sorted(root.rglob('*')):
    if not path.is_file():continue
    rel=path.relative_to(root).as_posix()
    safe=lambda v: v.encode('utf-8',errors='replace').decode('utf-8')
    entry={'name':safe(path.name),'path':safe(rel),'category':safe(rel.split('/')[0]),'extension':path.suffix.lower()}
    if path.suffix.lower()=='.pdf':
        try:
            doc=fitz.open(path)
            entry['pages']=len(doc)
            entry['text']='\n'.join((f'[PAGE {i+1}]\n'+p.get_text('text')) for i,p in enumerate(doc))[:110000]
            entry['text']=re.sub(r'[\ud800-\udfff]', '?', entry['text'])
        except Exception as e:entry['text']='';entry['note']=str(e)[:150]
    else:entry['text']='';entry['note']='Source table is retained in the supplied resource pack; only the main 2027 XLSX workbook has been parsed into the reference catalog.'
    items.append(entry)
out.write_text(json.dumps({'dataset':'GEXP 2027 Resources','indexed':len(items),'files':items},ensure_ascii=True),encoding='utf-8')
print('Indexed',len(items),'resources and',sum(len(x['text']) for x in items),'characters of source text; bytes',out.stat().st_size)
