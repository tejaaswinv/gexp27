# GEXP Atlas · SUTD 2027 exchange planner

A polished Next.js web app for SUTD students to discover four viable GEXP choices, inspect historical credit-transfer references, and download filled versions of the **actual SUTD 2023 research-only PDF templates** supplied with the 2027 resource pack.

**Status:** Deployed successfully to Vercel at **https://gexp27.vercel.app** (production Next.js build verified on 12 November 2026). The custom domain **gexp.tejaaswinv.site** is assigned in Vercel but its Namecheap-hosted DNS must point `gexp` (CNAME) to `6c4f24dd7c71996c.vercel-dns-017.com` before it is reachable. DeepSeek is configured server-side; verify the model with the live provider smoke test before declaring AI service healthy.

## Eight-term study planner (`/study-planner`)

The original **GEXP Atlas** workflow now includes its own eight-term degree planner, implemented independently from the publicly described SUTD Study Planner. This is **not** a copy of the other project's source code, backend, database or UI. Inspired capabilities:

- Eight-term board covering Freshmore, SUTD pillar studies, one configurable exchange term and final-year studies.
- HTML drag-and-drop between term columns on desktop; equivalent add/move menus for mobile and keyboard/touch navigation.
- Curated course shelf with search, pillar-specific electives, HASS/HDI choices, term references and custom courses.
- One-click import of term core subjects plus optional host courses mapped from GEXP's four-university recommendations.
- Prerequisite checks for a **verified subset** of SUTD courses with official course-page source links; unresolved/equivalent background is a warning, not a block.
- Immediate warning for known term-offering mismatches, duplicates and overloaded terms. Exchange terms are exempt from *local SUTD term-offering* checks (not from host enrolment or transfer approval).
- Removal of a course automatically clears courses with verified **mandatory** dependencies. Where alternative credentials or co-requisites may qualify, a warning is used instead of destructive deletion.
- CSD AI, Security and IoT core tracking based on SUTD's published 2-of-3 rules. Other tracks show approximate related-course progress rather than an unverified award claim.
- HDI second-major indicator, user-selected minor and manually selected minor-course targets; counts are expressly **not** official graduation eligibility.
- Autosave to browser local storage, CSV and JSON export, JSON import, and reset.
- Terms 4/5/7/8 sync into GEXP's existing form to populate the official-format downloadable study-plan PDFs (which have a maximum of five rows per home term).

The source of the comparison product's published feature description is [Yong Jun Lim's project announcement](https://www.linkedin.com/posts/yongjunlim_sutd-finally-has-a-study-planner-heres-activity-7453343505311170561-498o). Its live website could not be read directly from this workspace. Exact hidden behaviours, UI details and full underlying curriculum database have **not** been cloned.

The following verified subset powers specific prerequisite warnings:
50.002 (10.025 / 10.014), 50.005 (50.002), 50.007 (50.001 + 50.004 or equivalent background), 50.042 (50.005 co-requisite or equivalent), 50.020 (50.042), 50.044 (50.042), 50.055 (machine learning plus deep learning with alternatives), 01.116 (machine learning). Do not treat unflagged courses as confirmed to have no prerequisites.

Sources: [SUTD CSD Security](https://www.sutd.edu.sg/istd/education/undergraduate/specialisation-tracks/security/), [Artificial Intelligence](https://www.sutd.edu.sg/istd/education/undergraduate/specialisation-tracks/artificial-intelligence/), [IoT and Intelligent Systems](https://www.sutd.edu.sg/istd/education/undergraduate/specialisation-tracks/iot-and-intelligent-systems/), [SUTD minors](https://www.sutd.edu.sg/education/undergraduate/minors/), and the individual prerequisite course pages linked directly in `lib/degree-planner.ts`.

## Features

- Friendly, mobile-responsive onboarding: name, optional student ID, CGPA (/5), pillar, Fall 2027 or Spring 2028, tracks, interests, region, citizenship and HDI second major.
- SUTD curriculum-aware Terms 4/5/7/8 roadmap: AY2023–AY2026 intake selector, one-click required-core suggestions, selectable term-specific course catalogue, editable code/title rows, and manual additions. Selections are included in generated PDF study plans.
- Official CSD, EPD, ESD and cohort-specific DAI track choices; ASD interest areas are expressly **not** official declared tracks. Selected track descriptions display on mobile.
- HDI (Human-centred Domain Intelligence) second-major pathway guidance, including studio/AI/HASS requirements for CSD/EPD/ESD/ASD and domain-course/HASS requirements for DAI.

- 69 official-reference host-university records, their threshold CGPAs, constraints, term slots and pillar guidance.
- 6,644 **previously referenced** course-equivalency records; ranks courses for the student's tracks and interests.
- Reviews exactly 4 different host universities from eligible candidates; server validates current term and threshold CGPA before shortlisting.
- Optional DeepSeek V4 ranking over GPA-filtered candidates, with transparent rules-based fallback.
- Inspect and remove mapping rows; propose new courses explicitly marked as **not previously mapped**.
- One-click ZIP export: four completed 2-page SUTD study-plan PDFs, per-university CSV mapping tables, review checklist, and credit-transfer PDF for each manually proposed, non-reference course.
- Source explorer and reference templates; no account, server database connection or credentials required to browse.

## Official SUTD curriculum sources (reviewed November 2026)

The SUTD course picker is implemented in `lib/sutd-curriculum.ts`, separate from the GEXP host/mapping database. It is a **curated planning reference**, not a live enrolment/Timetable API. Source pages:

| Primary pillar | Source |
| --- | --- |
| CSD (ISTD) | https://www.sutd.edu.sg/istd/education/undergraduate/curriculum/ |
| EPD | https://www.sutd.edu.sg/epd/education/undergraduate/curriculum/ |
| ESD | https://www.sutd.edu.sg/esd/education/undergraduate/curriculum/beyond-ay-2019/ |
| ASD | https://www.sutd.edu.sg/asd/education/undergraduate/curriculum/ |
| DAI | https://www.sutd.edu.sg/dai/education/undergraduate/curriculum/ |
| HDI second major | https://www.sutd.edu.sg/education/undergraduate/human-centred-domain-intelligence-second-major/curriculum/ |

Official track pages: CSD https://www.sutd.edu.sg/istd/education/undergraduate/specialisation-tracks/overview/ ; EPD https://www.sutd.edu.sg/epd/education/undergraduate/curriculum/ ; ESD https://www.sutd.edu.sg/esd/education/undergraduate/specialisation-tracks/overview/ ; DAI 2025 https://www.sutd.edu.sg/dai/education/undergraduate/specialisation-tracks/ ; DAI 2026+ https://www.sutd.edu.sg/dai/education/undergraduate/supercharged-tracks/ .

**Important limitations:** Only published core-course term assignments and specific course catalogue terms are represented as term-verified references. Other technical electives, HASS subjects and HDI courses may be shown as planning candidates with a *check actual term* label. Course schedules, prerequisites, registration capacity, cross-pillar eligibility, graduation requirements and second-major acceptance must be checked directly with SUTD. DAI changed its specialisation structure from AY2026; the cohort selector is essential. Students can add or edit any course manually if the SUTD list changes.

When preparing exchange equivalencies, the recommender excludes SUTD courses already assigned to non-exchange Terms 4, 5, 7 or 8, avoiding double planning. The original resource workbook still governs historical course mapping; no mapping is marked as definitively approved.

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

Open `http://localhost:3000`. Without AI credentials, the shortlist remains functional using deterministic scoring; the UI clearly labels it **Rules-based analysis**.

## Connect the Sub2API DeepSeek V4 provider (Responses API)

The GEXP website uses the same DeepSeek group and Miaoqu base URL as Codex CLI, but sends its own server-side request through the **Responses API**, not the Anthropic Messages endpoint. The Codex alias `deepseek-v4-pro` returned `404 model_not_found` through this Sub2API integration; use the model ID shown in the Miaoqu group's catalog, `deepseek-v4-pro-ga-260813`, for the website.

Vercel **gexp27 → Settings → Environment Variables → production**:

```env
ZAO_API_KEY=(existing server-side key; do not copy or expose)
ZAO_MODEL=deepseek-v4-pro-ga-260813
ZAO_FALLBACK_MODEL=deepseek-v4-1-flash-260910
ZAO_API_PROTOCOL=responses
ZAO_API_BASE_URL=https://api.miaoquai.com/v1
```

The existing production secret is reused. Optionally set `SUB2API_API_KEY`, `SUB2API_MODEL`, `SUB2API_WIRE_API`, and `SUB2API_BASE_URL` instead (these take precedence). The Codex config uses `env_key = "SUB2API_API_KEY"`; this is the **CLI** environment-variable name, not a required website key name. Keep credentials server-side only. Never set `NEXT_PUBLIC_` secrets.

The web backend sends `POST https://api.miaoquai.com/v1/responses` with `model: deepseek-v4-pro-ga-260813`, `instructions`, `input`, and JSON-output mode. It supports legacy `openai` and `anthropic` protocols if explicitly configured. Responses are stateless, and the application does not store AI response data or user names at the provider.

The backend first tries Pro with a 12-second cap, then the listed V4.1 Flash fallback (28 seconds) if Pro stalls or fails. The response reports which model actually answered. The UI displays **DeepSeek AI reviewed** only when an upstream model actually selects four distinct, allowed universities. A labelled **Rules-based analysis** is shown on 503, timeout, malformed output, or unavailable credentials. Academic data only (CGPA, pillar, track preferences, interests, target term, region) is sent to the provider; names, student IDs, and passports are excluded. The evidence-filtered candidate list and historical mapping provenance always remain server-validated.

Run `npm run test:provider` for mocked Responses API/adapter tests, and run the GitHub Actions `GEXP provider smoke test` after production deployment to verify a live AI response. A successful Next.js build **does not** prove model availability.

## Deploy

1. Run `npm install && npm run build` on your own machine. Ensure all dependencies install and the UI behaves as expected.
2. Push changes to the existing `tejaaswinv/gexp27` GitHub repository.
3. The repository is connected to the **gexp27** Vercel project. Verify production `ZAO_*` variables (or `SUB2API_*` overrides) and redeploy to enable DeepSeek model calls.
4. Deploy to Preview and test a profile, review all four recommendations, export the ZIP and open one PDF before sharing with friends.
5. Check the SUTD resource-sharing terms before making the reference workbook publicly downloadable. Consider adding invite-based access before wide release.

Production deployment: `https://gexp27.vercel.app`. Git pushes to `main` deploy automatically through the linked Vercel project. The custom subdomain requires the DNS record described above.

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
