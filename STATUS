ACC Team Engineer — Project Status
Last updated: July 2026

Current Phase
Phase 1 — Foundation
What's Built & Working

Nothing yet — project scaffold not started

In Progress

Nothing yet

Up Next

Step 1: Project scaffold — Next.js + Tailwind + Supabase client, deploy to Vercel
Step 2: Car data files — scrape Race-Element for 5 cars, generate static JSON parameter tables
Step 3: JSON engine — readSetup / writeSetup with unit tests
Step 4: Supabase schema — saved setups, session notes, setup history
Step 5: Claude API wiring — symptom + setup → recommendations endpoint


Open Decisions

Supabase auth (multi-device sync): deferred, revisit in Phase 4
GT4 cars: deferred to after Phase 1, no architecture changes needed to add them

Known Issues / Blockers

None yet


Key Decisions Locked In

Stack: Next.js + Tailwind (frontend) + Next.js API routes (backend) + Supabase (Postgres) + Vercel (hosting)
Car data: Static JSON files, version-pinned to ACC v1.10.4, update manually if BoP changes
File I/O: Browser file picker (upload) + JSON download — no local filesystem access
AI layer: Claude API (claude-sonnet-4-6), wired in Phase 1 Step 5
Deployment: Hosted web app (Vercel) for mobile accessibility

Phase 1 Car List (GT3 only)

McLaren 720S GT3 Evo
Ferrari 296 GT3
BMW M4 GT3
Porsche 992 GT3 R
Mercedes-AMG GT3 Evo


Session Notes
July 2026 — Planning Session

Completed full planning session: deployment target, stack, data model, car list
Chose hosted web app over local backend for mobile accessibility
Chose static JSON car data files over dynamic pipeline (ACC is finished game)
Per-car parameter data model designed: linear params + LUT params, one JSON file per car
Phase 1 build sequence defined (5 steps above)
Repo: Project-Lightyear (GitHub)
Supabase account: created
