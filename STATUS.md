ACC Team Engineer — Project Status
Last updated: July 2026

Current Phase
Phase 1 — Foundation
What's Built & Working

Step 1: Project scaffold — Next.js 16 (App Router, TypeScript) + Tailwind, Supabase client wired (src/lib/supabase.ts), deployed to Vercel, confirmed clean load with no console errors. Live at https://project-lightyear-kohl.vercel.app
Step 2: Car data files — per-car parameter tables (src/data/cars/*.json) for all 5 Phase 1 GT3 cars, extracted from RiddleTime/Race-Element's setup-conversion source. Each parameter is tagged confirmed:true/false depending on whether that car's Race-Element source declared an explicit max/range vs. only a raw click-index passthrough — see Known Issues below.
Step 3: JSON engine — src/lib/setup/ implements readSetup (raw ACC setup JSON -> real-unit DisplaySetup) and writeSetup (DisplaySetup + base setup -> raw ACC setup JSON) via a generic codec (linear/lut/rawIndex encodings) driven entirely by the Step 2 parameter tables. Vitest added; 27 tests passing including a full round-trip fidelity check (readSetup -> writeSetup reproduces the exact original raw JSON) against a hand-built Porsche 992 GT3 R sample setup.
Step 4: Supabase schema — applied via migration to the live project (uyoczepwruhuvnblbmkd): tables `setups` (car_id, track, name, raw_setup jsonb, notes), `setup_history` (auto-populated by a trigger that snapshots the old raw_setup whenever a setup's raw_setup changes), and `session_notes` (car_id, track, optional setup_id FK, session_type, conditions jsonb, notes). RLS is enabled on all three with an open anon-access policy (see Open Decisions — auth deferred to Phase 4). Verified end-to-end: insert/update/delete via the app's actual anon-key client, trigger fires correctly, cascade delete on setup_history, ON DELETE SET NULL on session_notes.setup_id. Fixed one advisor-flagged issue (mutable search_path on the trigger function); the 3 remaining advisor warnings are the intentional open RLS policies.

In Progress

Nothing yet

Up Next

Step 5: Claude API wiring — symptom + setup → recommendations endpoint
Step 5: Claude API wiring — symptom + setup → recommendations endpoint


Open Decisions

Supabase auth (multi-device sync): deferred, revisit in Phase 4. Until then, setups/setup_history/session_notes have an intentionally open RLS policy for the anon role (anyone with the public anon key could read/write) — acceptable for a single-user personal tool right now, but must be replaced with per-user policies before this app has more than one user.
GT4 cars: deferred to after Phase 1, no architecture changes needed to add them

Known Issues / Blockers

Car data gaps: Race-Element only fully declares explicit min/max ranges (via its newer ISetupChanger API) for Porsche 992 GT3 R among our 5 cars. For Ferrari 296 GT3, BMW M4 GT3, McLaren 720S GT3 Evo, and Mercedes-AMG GT3 Evo, the following are unconfirmed (formula known, max clicks not published in source): toe front/rear max, brake bias max, brake power max, preload differential max, steering ratio max, bumpstop rate max, ride height max, anti-roll bar max, bumpstop range max, all 4 damper maxes, rear wing max, splitter max, ECU map max, and TC/TC2/ABS ranges entirely. These are flagged with "confirmed": false in each car's JSON. Before Step 5 (recommendations) relies on click-count bounds for these fields, validate against real ACC setup JSON files (e.g. Lon3035/ACC_Setups or JenSeReal/ACC-Setups on GitHub) or in-game.
bumpStopRateUp/bumpStopRateDn assumption: the real ACC setup schema has two separate bump-stop-rate arrays (Up and Dn), but Race-Element's source only exposes one conversion formula per wheel. The JSON engine applies the same per-car formula to both arrays — reasonable but not verified against a real setup file; revisit if a real setup shows Up and Dn diverging.


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
July 2026 — Step 4 Build Session

Applied Supabase migration create_setups_session_notes_history: setups, setup_history (trigger-populated), session_notes tables with indexes and foreign keys (setup_history cascades on delete, session_notes.setup_id sets null on delete)
Chose open anon-role RLS policy for now (single-user personal tool, auth deferred to Phase 4) after confirming with the user rather than assuming
Ran get_advisors; fixed the one real issue (log_setup_history had a mutable search_path) via a follow-up migration; remaining 3 warnings are the intentional open RLS policies
Smoke-tested via raw SQL (trigger fires, history snapshot correct, updated_at bumped, cascade/set-null on delete) and via the app's actual anon-key Supabase client (insert/read/delete all succeed)

July 2026 — Step 3 Build Session

Added Vitest (vitest.config.ts, npm test/test:watch/test:coverage scripts)
Built src/lib/setup/: types.ts (ParamDef/CarData/RawSetup/DisplaySetup), codec.ts (generic decodeParam/encodeParam for linear/lut/rawIndex encodings, decodeTuple/encodeTuple for 4-wheel arrays), readSetup.ts, writeSetup.ts, carData.ts (loads the 5 car JSONs by carId)
writeSetup takes a base raw setup as a template so fields we don't model (carName, tyre compound choice, strategy, pit strategy, unused rideHeight wheel slots) are carried forward untouched rather than guessed at
27 Vitest tests passing: codec unit tests (including a float-rounding edge case and full-range round-trip sweep) plus a readSetup/writeSetup round-trip test against a hand-built Porsche 992 GT3 R sample setup (the one car with fully confirmed ranges) — writeSetup(readSetup(raw)) reproduces the exact original JSON
Documented an unverified assumption: applied the single Race-Element bumpstop-rate formula to both bumpStopRateUp and bumpStopRateDn (the real schema has both; Race-Element only models one)
Build, lint, and tests all pass

July 2026 — Step 2 Build Session

Cloned RiddleTime/Race-Element (GPLv3) to extract factual setup-encoding constants (not source code) for the 5 Phase 1 GT3 cars
Confirmed tyre pressure (20.3-35 PSI, 0.1 step), camber front/rear, and brake ducts (0-6) are identical shared GT3-class constants across all 5 cars
Found car-specific differences: McLaren 720S Evo and BMW M4 GT3 have asymmetric front/rear toe offsets (not the -0.4/-0.4 default); Ferrari 296 GT3 has a front/rear-split bumpstop rate formula unique among the 5
Porsche 992 GT3 R is the only car with Race-Element's newer ISetupChanger API implemented, giving fully confirmed ranges (ARB, dampers, wing, splitter, electronics, bumpstop range/rate, ride height) — used as the reference/complete example
Wrote src/data/cars/{car}.json (5 files) + index.json manifest; every field tagged confirmed true/false with a source note so Step 3 knows what's real vs. needs validation
Verified all JSON parses and production build stays clean

July 2026 — Step 1 Build Session

Scaffolded Next.js 16 + Tailwind app (create-next-app, TypeScript, App Router, src dir)
Installed @supabase/supabase-js, added src/lib/supabase.ts client, verified connectivity against live Supabase project
Set up gh CLI auth and pushed scaffold to GitHub main
Set up Vercel CLI auth, linked project (lightyear1/project-lightyear), deployed to production
Added Supabase env vars to Vercel production environment
Confirmed production URL loads clean in browser with no console errors

July 2026 — Planning Session

Completed full planning session: deployment target, stack, data model, car list
Chose hosted web app over local backend for mobile accessibility
Chose static JSON car data files over dynamic pipeline (ACC is finished game)
Per-car parameter data model designed: linear params + LUT params, one JSON file per car
Phase 1 build sequence defined (5 steps above)
Repo: Project-Lightyear (GitHub)
Supabase account: created
