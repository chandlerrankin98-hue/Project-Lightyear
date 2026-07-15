ACC Team Engineer — Project Status
Last updated: July 2026

Current Phase
Phase 1 — Foundation
What's Built & Working

Step 1: Project scaffold — Next.js 16 (App Router, TypeScript) + Tailwind, Supabase client wired (src/lib/supabase.ts), deployed to Vercel, confirmed clean load with no console errors. Live at https://project-lightyear-kohl.vercel.app
Step 2: Car data files — per-car parameter tables (src/data/cars/*.json) for all 5 Phase 1 GT3 cars, extracted from RiddleTime/Race-Element's setup-conversion source. Each parameter is tagged confirmed:true/false depending on whether that car's Race-Element source declared an explicit max/range vs. only a raw click-index passthrough — see Known Issues below.
Step 3 (SUPERSEDED by Step 7 — see below): originally a JSON read/write engine for raw ACC setup files. Removed in Step 7 once we learned the user races on PS5, which has no file access at all — there is no file to read or write. The Step 2 parameter tables it was built on remain the foundation of the app.
Step 4: Supabase schema — applied via migration to the live project (uyoczepwruhuvnblbmkd): tables `setups` (car_id, track, name, raw_setup jsonb, notes), `setup_history` (auto-populated by a trigger that snapshots the old raw_setup whenever a setup's raw_setup changes), and `session_notes` (car_id, track, optional setup_id FK, session_type, conditions jsonb, notes). RLS is enabled on all three with an open anon-access policy (see Open Decisions — auth deferred to Phase 4). Verified end-to-end: insert/update/delete via the app's actual anon-key client, trigger fires correctly, cascade delete on setup_history, ON DELETE SET NULL on session_notes.setup_id. Fixed one advisor-flagged issue (mutable search_path on the trigger function); the 3 remaining advisor warnings are the intentional open RLS policies.
Step 5: Claude API wiring — POST /api/recommendations Next.js route handler. Takes {carId, symptom, cornerPhase?, speedRegime?, conditions?, currentSetup?}, builds a text context block from the car's Step-2 parameter table (values + confirmed/unconfirmed flags, plus current setup values if given), sends it with a condensed race-engineering system prompt to Claude via structured outputs (Zod schema + client.messages.parse), and returns a typed {diagnosis, recommendations[], cautions[]} JSON response. Model: claude-sonnet-5 (STATUS.md originally named claude-sonnet-4-6, a now-previous-generation model; updated after checking current model availability). Verified end-to-end with real API calls for both no-current-setup and with-current-setup cases — output correctly respects each car's confirmed ranges/increments (e.g. suggesting 190 Nm preload from a 170 Nm current value, matching the car's 10 Nm increment) and flags unconfirmed parameters as cautions rather than inventing ranges.
Step 6 (revised by Step 7 — see below): originally built the setups UI around JSON file upload/download, per Step 3's engine. The upload/download mechanism was removed in Step 7; the save/load/delete-setup and recommendations/session-note UI patterns it established carried forward.
Step 7: Manual entry form (PS5 correction) — removed all JSON file I/O (no upload, no download, no readSetup/writeSetup/codec) since PS5 has no file access; src/lib/setup/ now only has types.ts (DisplaySetup extended with fuel/tyreSet/brake pad compounds/fuelMix) and carData.ts. src/app/page.tsx is now a full manual entry form covering every category (Tyres, Alignment, Mechanical, Dampers, Aero, Electronics, Drivetrain, Strategy) with per-wheel/per-position granularity matching the car parameter tables — each input shows its real unit and confirmed/unconfirmed range from Step 2's car data, with `<select>` dropdowns for LUT-encoded parameters (caster, wheel rate) since those only take discrete in-game values. Simplified bumpStopRateUp/Dn (an unverified Step 3 assumption) into a single bumpStopRate field, since the driver only ever sees one bump-stop-rate value in-game. Supabase's `setups`/`setup_history` columns renamed raw_setup -> setup_values to match. Verified end-to-end in a real browser: filled all ~64 fields via real keyboard/select input, saved, reloaded the page, loaded the setup back with an exact round-trip, ran a real recommendation referencing the entered values, and deleted the setup — all confirmed via direct SQL checks, no console errors, test data cleaned up afterward.

In Progress

Nothing yet

Up Next

Step 8 (not yet planned): candidates are auth (per-user data, closing the open RLS gap) or GT4 car support


Open Decisions

Supabase auth (multi-device sync): deferred, revisit in Phase 4. Until then, setups/setup_history/session_notes have an intentionally open RLS policy for the anon role (anyone with the public anon key could read/write) — acceptable for a single-user personal tool right now, but must be replaced with per-user policies before this app has more than one user.
GT4 cars: deferred to after Phase 1, no architecture changes needed to add them

Known Issues / Blockers

Car data gaps: Race-Element only fully declares explicit min/max ranges (via its newer ISetupChanger API) for Porsche 992 GT3 R among our 5 cars. For Ferrari 296 GT3, BMW M4 GT3, McLaren 720S GT3 Evo, and Mercedes-AMG GT3 Evo, the following are unconfirmed (formula known, max clicks not published in source): toe front/rear max, brake bias max, brake power max, preload differential max, steering ratio max, bumpstop rate max, ride height max, anti-roll bar max, bumpstop range max, all 4 damper maxes, rear wing max, splitter max, ECU map max, and TC/TC2/ABS ranges entirely. These are flagged with "confirmed": false in each car's JSON, and the manual entry form shows "(unconfirmed)" next to those fields instead of a fabricated bound. Validate against real ACC setup JSON files (e.g. Lon3035/ACC_Setups or JenSeReal/ACC-Setups on GitHub) or in-game if precise bounds matter later.


Key Decisions Locked In

Stack: Next.js + Tailwind (frontend) + Next.js API routes (backend) + Supabase (Postgres) + Vercel (hosting)
Car data: Static JSON files, version-pinned to ACC v1.10.4, update manually if BoP changes
File I/O: None — corrected in Step 7 after learning the user races on PS5 (no file access of any kind). All setup values are entered manually via a form, validated/bounded against the Step 2 car parameter tables, and stored directly in Supabase as real-unit JSON.
AI layer: Claude API (claude-sonnet-5 — updated from the originally-planned claude-sonnet-4-6, which is now a previous-generation model), wired in Phase 1 Step 5
Deployment: Hosted web app (Vercel) for mobile accessibility

Phase 1 Car List (GT3 only)

McLaren 720S GT3 Evo
Ferrari 296 GT3
BMW M4 GT3
Porsche 992 GT3 R
Mercedes-AMG GT3 Evo


Session Notes
July 2026 — Step 7 Build Session

Critical correction from user: races on PS5, not PC — no file system access exists, so Step 3's JSON engine and Step 6's upload/download UI were built on a wrong assumption and needed to be replaced with a manual entry form
User asked for an audit-first, approve-before-building workflow — used plan mode: read every affected file, wrote a plan (delete codec/readSetup/writeSetup + tests, extend DisplaySetup, rebuild page.tsx as a manual form, rename the Supabase column, add passWithNoTests), got explicit approval before editing anything
Deleted src/lib/setup/codec.ts, readSetup.ts, writeSetup.ts, and their Vitest tests, and the RawSetup type; kept types.ts/carData.ts since Step 2's parameter tables are exactly what the manual form needs for units/bounds
Simplified DisplaySetup's bumpStopRateUp/bumpStopRateDn (a Step 3 unverified assumption) into a single bumpStopRate — the driver only sees one bump-stop value in-game, so the Up/Dn split from the raw file format was never meaningful for manual entry
Extended DisplaySetup with fuel, tyreSet, front/rearBrakePadCompound, fuelMix — fields the old engine passed through untouched but the "cover all categories including strategy" requirement needed as real fields
Applied a migration renaming setups.raw_setup/setup_history.raw_setup to setup_values (recreating the trigger, since its WHEN clause references the column name) — tables were empty, zero data-loss rename
Rebuilt src/app/page.tsx as a ~64-field categorized form (Tyres/Alignment/Mechanical/Dampers/Aero/Electronics/Drivetrain/Strategy), each field driven by its car-data ParamDef for unit/range display and widget type (number input for linear/rawIndex, select for LUT-encoded caster/wheel-rate)
Hit and resolved a browser-automation quirk (unrelated to the app): synthetic JS-dispatched input/change events silently failed to persist against this React 19 app, while real keyboard input (and the form_input tool) worked reliably — switched test-filling strategy accordingly rather than chasing the synthetic-event path further
Verified end-to-end in a real browser: filled all ~64 fields via real typing/keyboard input plus form_input for selects, saved (full-form validation correctly required every field), reloaded, loaded the saved setup back with an exact round-trip, ran a real recommendation that correctly cited the entered current values, and deleted the setup — all cross-checked via direct SQL, no console errors, test data cleaned up afterward
Build, lint, and test (now passWithNoTests, since the deleted engine's tests are gone and there's no complex pure logic left to unit test) all pass

July 2026 — Step 6 Build Session

Rewrote src/app/page.tsx as the actual app (client component): car selector, setup upload/download, current-setup summary readout (tyre pressure, camber F/R, ride height F/R, ARB F/R, brake bias, diff preload, rear wing, splitter, TC/ABS), symptom form, recommendations display, save/load/delete for saved setups, session notes
Fixed one real eslint-plugin-react-hooks finding (react-hooks/set-state-in-effect): restructured the saved-setups data-fetching effect to chain .then() directly on the Supabase query promise with an ignore-flag cleanup, instead of calling an external useCallback that set state — standard React data-fetching-effect pattern
Also fixed layout.tsx's leftover "Create Next App" metadata title/description from Step 1 scaffolding
Verified end-to-end in a real browser (Chrome extension) against the live Supabase project and a real Claude API call: uploaded a hand-built Porsche 992 GT3 R setup JSON (same fixture used in Step 3's Vitest tests) and confirmed the UI decoded it to the exact expected values; saved it, saw it in the saved-setups list, got a real recommendation for "snappy oversteer on throttle exiting slow hairpins" that correctly referenced the loaded setup's actual preload (170 Nm) and ARB (4 clicks) values; saved a session note and confirmed via SQL it linked to the correct setup_id
Cleaned up all test data (setup + session note) from Supabase after verification so the tables are empty for real use
Build, lint, and all 27 Vitest tests pass

July 2026 — Step 5 Build Session

Confirmed with user: use claude-sonnet-5 (not the originally-documented claude-sonnet-4-6, now previous-gen) — good cost/quality fit for structured recommendation output on a personal app
Added ANTHROPIC_API_KEY to .env.local and Vercel production env (server-side only, no NEXT_PUBLIC_ prefix — confirmed with user before uploading since it's a real secret, unlike the Supabase anon key)
Built src/lib/claude/: client.ts (server-only Anthropic client), systemPrompt.ts (condensed race-engineering domain knowledge — tyre pressure window, tuning order, ARB/diff/damper/aero balance effects), buildCarContext.ts (renders a car's parameter table + optional current setup values as text for the prompt), recommendationSchema.ts (Zod schema for structured output)
Built src/app/api/recommendations/route.ts using client.messages.parse() + zodOutputFormat for guaranteed-valid structured output; validates carId/symptom, handles refusal stop_reason and Anthropic API errors
Verified end-to-end with real API calls (dev server + curl): correct behavior with and without currentSetup, correct validation errors for bad carId/missing symptom, and qualitatively sound engineering advice that respects each car's confirmed/unconfirmed parameter flags from Step 2

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
