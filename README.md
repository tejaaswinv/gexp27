# GEXP Atlas · SUTD 2027 exchange planner

A polished Next.js web app for SUTD students to discover four viable GEXP choices, inspect historical credit-transfer references, and download filled versions of the **actual SUTD 2023 research-only PDF templates** supplied with the 2027 resource pack.

**Status:** Source implementation complete. Reference extraction and recommendation logic tested. Full Next.js build **was not run in this sandbox** because npm registry DNS was unavailable; run `npm install && npm run build` on a networked machine before sharing or deploying. ZaoAPI is an optional server-side integration and is **not active without your own credentials**.

## Features

- Friendly, mobile-responsive onboarding: name, optional student ID, CGPA (/5), pillar, Fall 2027 or Spring 2028, tracks, interests, region, citizenship and HDI second major.
- Optional SUTD Terms 4/5/7/8 roadmap (auto-filled into PDF).
- 69 official-reference host-university records, their threshold CGPAs, constraints, term slots and pillar guidance.
- 6,644 **previously referenced** course-equivalency records; ranks courses for the student's tracks and interests.
- Reviews exactly 4 different host universities from eligible candidates; server validates current term and threshold CGPA before shortlisting.
- Optional ZaoAPI ranking (model only chooses among evidence-filtered candidates) with transparent rules-based fallback.
- Inspect and remove mapping rows; propose new courses explicitly marked as **not previously mapped**.
- One-click ZIP export: four completed 2-page SUTD study-plan PDFs, per-university CSV mapping tables, review checklist, and credit-transfer PDF for each manually proposed, non-reference course.
- Source explorer and reference templates; no account, server database connection or credentials required to browse.

## Data provenance and boundaries

User supplied `OneDrive_2026-11-11.zip`, titled `GEXP 2027 Resources`. Ingested:

| Database table | Count | Source |
| --- | ---: | --- |
| Universities | 69 | `Pillar Recommendation, PU Info` worksheet |
| Historical mappings | 6,644 | `Reference Course List` worksheet |
| Resources | 20 | 17 PDFs, 2 legacy XLS files, 1 XLSX |

The repository contains:

- `data/catalog.json`: application database snapshot, normalised and searchable.
- `data/resources.json`: extracted text and metadata from all 20 documents (legacy XLS files have metadata, not extracted rows).
- `db/gexp_2027.sqlite`: relational snapshot for future Supabase or PostgreSQL migration.
- `public/resources/gexp-2027-reference.xlsx`: original reference workbook (consider removing before **public** deployment if redistribution is restricted).
- `public/templates`: research-only PDFs from supplied ZIP, used directly for downloads.

**Important:** A course appearing in the workbook indicates only a **historical in-principle mapping**. It does not guarantee it is offered in 2027/2028, open to exchange students, compatible with prerequisites, approved for this particular student, or suitable for HDI/track credit. A university whose minimum CGPA is unstated is flagged for verification, not declared eligible. The site does not auto-approve credit equivalence, or claim a 70% content match.

The official study-plan form requires **at least eight pillar-related and two HASS-related courses per university**. For schools without enough verifiable rows, the site shows the gap and produces an incomplete planning form rather than inventing courses. Official applications and approval must be completed on [SUTD's Admission Portal](https://admission.sutd.edu.sg/).

## Run locally

Requirements: Node.js 20+ and npm.

```bash
unzip GEXP_Atlas_2027_Website.zip
cd gexp-atlas
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without ZaoAPI credentials, the shortlist remains functional using deterministic scoring; the UI clearly labels it **Rules-based analysis**.

## Connect ZaoAPI (造物云)

Use [Zaowuyun's API developer documentation](https://ai.zaowuyun.com/app/apidoc/zaowuyun-api-documentation.html): `https://api.zaowuyun.com/v1/chat/completions`, HTTP `Authorization: Bearer ...`, OpenAI-compatible chat request. Put only server-side secrets in `.env.local` or the deployment platform:

```env
ZAO_API_KEY=your_token_from_the_zaowuyun_console
ZAO_MODEL=the_exact_chat_model_id_available_to_your_account
ZAO_API_BASE_URL=https://api.zaowuyun.com/v1
```

**Do not put your token in `NEXT_PUBLIC_` variables or frontend JavaScript.** The model ID is deliberately configurable because the provider's available models can change. The server sends *academic inputs* (CGPA, pillar, track preferences, interests, target term, region), but excludes the student's **name, student ID and passport field**. The server limits the AI output to university IDs in its existing, GPA-filtered evidence pool. AI request errors fall back to rules-based recommendations with a visible notice.

The app does not persist student submissions in a server database; the student's profile is cached in their own browser's local storage. The downloaded forms are generated in memory on request. If deployed publicly with a paid API token, add robust provider-backed rate limits, authentication, CAPTCHA, spending limits and abuse monitoring before promoting the site.

## Deploy

1. Run `npm install && npm run build` on your own machine. Ensure all dependencies install and the UI behaves as expected.
2. Push this folder to a new private GitHub repository.
3. Import the repo into **Vercel** using Next.js default settings, then configure the three `ZAO_*` environment variables in the Vercel **server environment**.
4. Deploy to Preview and test a profile, review all four recommendations, export the ZIP and open one PDF before sharing with friends.
5. Check the SUTD resource-sharing terms before making the reference workbook publicly downloadable. Consider adding invite-based access before wide release.

No production deployment was performed in this handoff.

## Data refresh / rebuild

Keep the raw GEXP resources in `internal/GEXP 2027 Resources/` if you need to reindex them. Then run:

```bash
python scripts/ingest_resources.py 'internal/GEXP 2027 Resources'
python scripts/build_sqlite.py
```

To refresh the 2027 XLSX catalogue, run `python scripts/extract_data.py` (uses `artifact_tool`) against `public/resources/gexp-2027-reference.xlsx`, then `python scripts/build_sqlite.py`. Keep any newly approved mapping evidence separate from the historic reference database.

## Key project files

```
app/
  page.tsx                 # Complete UI: student intake, 4 picks, explorer, mapping editor
  globals.css              # Responsive visual system
  api/analyze/route.ts     # Validation + optional ZaoAPI
  api/export/route.ts      # Secure template export
  api/catalog/route.ts     # Read-only university catalog
lib/
  recommend.ts             # Eligibility/ranking/mapping selection logic
  export-pdf.ts            # Original template overlays and ZIP generator
  schema.ts                # Request validation
  catalog.ts               # Read-only indexed dataset
  types.ts
scripts/
  test_logic.cjs           # In-memory TS recommendation smoke test
  ingest_resources.py      # Private PDF/document text indexing
  build_sqlite.py          # Relational DB refresh
```

### Testing

```bash
npm run check
npm test
npm run build
```

Tested in this environment: 69 universities, 6,644 mappings, 20 source-file metadata entries, CGPA exclusions and 4-destination generation for three realistic anonymised profiles.
