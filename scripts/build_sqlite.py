"""Generate a read-only relational snapshot of the supplied SUTD GEXP 2027 workbook."""
import sqlite3,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'data/catalog.json').read_text())
r=json.loads((root/'data/resources.json').read_text())
path=root/'db/gexp_2027.sqlite'
if path.exists():path.unlink()
conn=sqlite3.connect(path)
conn.executescript('''
PRAGMA journal_mode=DELETE;
CREATE TABLE universities(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, country TEXT, city TEXT, minimum_gpa REAL, passport_restrictions TEXT, fall_slots TEXT, spring_slots TEXT, fall_dates TEXT, spring_dates TEXT, pillar_recommendations_json TEXT, tags_json TEXT, highlights TEXT);
CREATE TABLE mappings(id INTEGER PRIMARY KEY AUTOINCREMENT, university_name TEXT NOT NULL, exchange_term TEXT, pillar TEXT, host_code TEXT, host_title TEXT, host_credits TEXT, sutd_code TEXT, sutd_title TEXT, sutd_credits TEXT, level TEXT, hass_discipline TEXT, remarks TEXT);
CREATE TABLE resources(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, path TEXT, category TEXT, extension TEXT, pages INTEGER, extracted_text TEXT);
CREATE INDEX idx_mappings_uni_term_pillar ON mappings(university_name,exchange_term,pillar);
CREATE INDEX idx_universities_country_gpa ON universities(country,minimum_gpa);
''')
conn.executemany('INSERT INTO universities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[(u['id'],u['name'],u['country'],u['city'],u['minimumGpa'],u['passportRestrictions'],str(u['slots']['fall']) if u['slots']['fall'] is not None else None,str(u['slots']['spring']) if u['slots']['spring'] is not None else None,u['dates']['fall'],u['dates']['spring'],json.dumps(u['pillarRecommendations']),json.dumps(u.get('tags',[])),u.get('highlights')) for u in d['universities']])
conn.executemany('INSERT INTO mappings(university_name,exchange_term,pillar,host_code,host_title,host_credits,sutd_code,sutd_title,sutd_credits,level,hass_discipline,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[(c['university'],c['exchangeTerm'],c['pillar'],c['hostCode'],c['hostTitle'],str(c['hostCredits']) if c['hostCredits'] is not None else None,c['sutdCode'],c['sutdTitle'],str(c['sutdCredits']) if c['sutdCredits'] is not None else None,c['level'],c['hassDiscipline'],c['remarks']) for c in d['courses']])
conn.executemany('INSERT INTO resources(name,path,category,extension,pages,extracted_text) VALUES (?,?,?,?,?,?)',[(x['name'],x['path'],x['category'],x['extension'],x.get('pages'),x['text']) for x in r['files']])
conn.commit();print('DB',path,'size',path.stat().st_size,'universities',conn.execute('select count(*) from universities').fetchone()[0],'mappings',conn.execute('select count(*) from mappings').fetchone()[0],'resources',conn.execute('select count(*) from resources').fetchone()[0]);conn.close()
