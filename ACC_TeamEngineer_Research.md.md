# ACC Car Setup Building — Comprehensive Research Report (GT3 & GT4)

## TL;DR

- ACC setups are governed by a small set of high-leverage principles: keep hot tyre pressures in the 26.0–27.0 PSI window (29.5–31.0 wet), keep tyre core temps 70–100°C, run negative camber/aggressive alignment, and adjust in a fixed order (tyres → mechanical grip → aero/ride height → dampers → electronics/diff). The single most authoritative free knowledge base is Coach Dave Academy plus Kunos physics dev Aristotelis Vasilakos’s own material.
- ACC’s physics is a genuine simulation: a proprietary 5-point tyre contact model (dynamic slip, thermal, pressure-sensitive), running at a 400 Hz physics rate since v1.8, with per-part aero (splitter/wing/diffuser as independent elements) and heavy BoP-dependence, so setup values and car balance differ car-by-car.
- For app-building: setups are stored as `.json` files under `Documents/Assetto Corsa Competizione/Setups/<Car>/<Track>/`, with values stored as **zero-based integer indices/clicks**, not engineering units — conversion is `displayed = min + index × increment` (or a per-car look-up table for caster/wheel-rate), and the min/increment are car- and BoP-specific. RiddleTime/Race-Element on GitHub is the definitive open-source reference for these ranges.

## Key Findings

1. **Optimal tyre window is universal, mapping is not.** Since the v1.9 patch (2023) all classes run the 2023-spec DHF tyre with a 26.0–27.0 PSI hot optimum (“the same across all car classes,” per SimRacingSetup.com) and a 70–100°C working range (80–90°C ideal). But each car has its own setup ranges (BoP-dependent), so a given JSON integer means different real values on different cars.
1. **A clear, repeatable workflow exists.** Set pressures first, build mechanical grip (springs, ARBs, alignment), then set aero/ride-height/rake, refine with 4-way dampers, and finish with electronics, diff and brake bias. Change one thing at a time and test.
1. **A near-complete “if the car does X, change Y” matrix is documented**, mostly by Coach Dave Academy, covering entry/mid/exit understeer and oversteer via ARBs, springs, differential preload, ride height/rake, wing, dampers and alignment.
1. **Cars cluster by engine layout** (front/mid/rear-engine) with well-known handling personalities; the Ferrari 296 GT3, McLaren 720S GT3 Evo, Porsche 992 GT3 R, BMW M4 GT3 and Audi R8 LMS Evo II are the current reference cars.
1. **GT4 cars are simpler to set up** — many parameters are locked or coarsely stepped (3-position ARBs, no separate fast dampers, fixed/limited splitter, fewer TC/ABS steps), and they rely on mechanical grip and momentum rather than aero.
1. **A mature tools/data ecosystem already exists** — Coach Dave Delta, SimGrid, GO Setups/GO Fast app, SimRacingSetup, MoTeC i2 (official ACC workspace), Crew Chief, SimHub, trophi.ai, Track Titan, and open GitHub repos/parsers.

## Details

### 1. ACC Setup Parameters & What They Do

**Tyres**

- **Pressure (PSI):** Only contact patch to track; the single most important variable. Target 26.0–27.0 PSI hot (dry, all classes since v1.9),  29.5–31.0 PSI wet. Set cold/starting pressures lower (tyres start around 65°C at pit exit) knowing they rise several PSI as the tyre heats. Rule of thumb (trophi.ai): “for every one-centigrade increase in ambient temperature, adjust your tyre pressures downwards by 0.1 PSI… Do the opposite as the ambient temperatures decrease.” Within the optimal band, lower pressures (~26.0) give more sidewall flex/slip (better in slow corners, less precise); higher (~27.0) stiffen the sidewall (more stable at high speed). Keep front and rear pressures close to each other. GT3 cars have tyre warmers (start near temperature); GT4/TCX/GTC do not.
- **Tyre temperature/thermal model:** Optimal 80–90°C, working 70–100°C. Below 70°C  = graining (rubber tears then reseals); above 100°C = blistering (rubber breaks away). Monitor inside/middle/outside spread — keep <9°C front, ~5°C rear inside-to-outside. Adjust brake ducts to move tyre temps a few degrees.
- **Toe:** Angle viewed from above. Front toe-out → sharper turn-in, more agility, more oversteer/reactivity (but more scrub/wear/heat). Front toe-in → more entry stability but mid-corner understeer. Rear toe-in → overall stability, better traction on exit (rear toe-out is unstable, not recommended). Set toe last, after PSI/camber/caster.
- **Camber:** Angle viewed head-on. Run negative camber for larger loaded contact patch mid-corner; too much causes uneven heating (hot inside, cold outside).  Since v1.9 camber has more influence on heat distribution and rear lateral stability/traction — going max camber everywhere is no longer optimal; lower rear camber in traction-heavy zones.
- **Caster:** Steering-axis angle viewed from the side. Higher caster → more stability, heavier steering, more self-centering, and more dynamic camber when steered.   Good for turn-in and braking; too high causes mid-corner understeer. Set high until understeer felt in high-speed corners.

**Electronics**

- **TC1:** slip threshold before power cut. **TC2** (only some cars): how aggressively power is cut once TC1 engages. Keep TC1/TC2 within ±1 of each other; run as high as possible before it costs lap time (saves tyres, aids consistency).
- **ABS:** prevents lockups, improves braking stability (does not shorten stopping distance). Higher = brake deeper but longer zone; lower = shorter zone but less stable. Start high, reduce to comfort.
- **ECU/Engine map:** lower map number usually = more power/torque but higher fuel use; each car has dry maps, wet maps and a pace-car map. Use max-power map for qualifying/sprint; leaner maps for fuel-saving in endurance.

**Fuel & Strategy**

- **Fuel:** affects handling (heavier = more understeer, more rear squat, slower); calculate with SimGrid Fuel Estimator or `FR = ((TR×60)/TL)×FL + (2×FL)`.
- **Brake pads (GT3):** Pad 1 = sprint/qualifying (best bite, short life); Pad 2 = endurance (good, long life); Pad 3 = wet/cold/very long (moderate bite, best modulation cold, needs smaller ducts); Pad 4 = practice-only extreme-wear.  GT4: Pad 1 not for racing; Pad 2 is the all-round race pad.

**Mechanical (advancedSetup.mechanicalBalance)**

- **Anti-roll bars (ARB):** Redistribute load laterally without adding grip. Stiffer front → less entry oversteer / more understeer, more responsive/nervous; softer front → less entry understeer.  Stiffer rear → less exit understeer; softer rear → less exit oversteer, more stable. ARB changes don’t affect aero balance — good tuning tool once springs/dampers are set.
- **Wheel rate (springs):** Stiffness applied to each corner; heavier/front-engine cars need stiffer fronts. On aero-sensitive GT3s springs are tied to ride height (must avoid bottoming). Stiffer front → less front weight transfer → less entry oversteer; softer front → more transfer → less entry understeer. Rear springs affect mid-exit; too-stiff rear = nervous rear over kerbs/slow corners.
- **Bump stops (rate up/down, window/range):** Limit and shape end-of-travel suspension behavior; heavily used in ACC (esp. cars riding bump stops at speed) to build/remove rotation and control the aero platform.
- **Brake bias / brake torque:** Forward bias = more stable braking but more front lock/understeer; rearward = more rotation but instability/rear lock. Move rearward in the wet.

**Dampers (4-way: slow/fast bump & rebound)**

- Control the *speed* of load change, not steady load. Slow dampers = weight-transfer/pitch/roll response; fast dampers = kerbs/sharp bumps. Coach Dave “if X do Y”: Too much bump = harsh/resists roll; too little bump = dives/lots of transfer; too much rebound = tyres lose contact (inside wheels pulled up); too little rebound = car oscillates, poor exit traction. Increase rear rebound → holds rear, reduces braking understeer toward oversteer; soften front slow bump → more pitch/dive → fixes turn-in understeer; increase rear slow bump → more exit rotation.

**Aero (advancedSetup.aeroBalance)**

- **Front splitter:** more splitter = more front downforce → more oversteer / less understeer (many cars have fixed/limited splitter).
- **Rear wing:** more wing = more rear downforce → more understeer / less oversteer + more drag / lower top speed. Primary high-speed balance tool.
- **Ride height & rake:** Lower floor = more downforce (ground effect) up to a point;  raising rear (more positive rake) shifts center of pressure forward → more rotation/oversteer and a peakier/stronger diffuser, but too much rake slows underfloor air and reduces downforce. ACC also shows an aero-balance/variation indicator to hold balance when trading ride height vs wing.
- **Brake ducts:** more open = cooler brakes/tyres (also slight drag); each duct click ≈ 0.2 PSI tyre-pressure change (0.3 between certain steps).  Close in the wet/cold to retain heat. 

**Differential (advancedSetup.drivetrain.preload)**

- Higher preload → more stable on brake release but more power understeer and later unlock; lower preload → more rotation/oversteer on entry/brake-release but less exit understeer, worse traction/unresponsive on worn tyres. Coach Dave matrix: oversteer under braking/mid → raise preload; understeer under braking/mid → lower preload; oversteer on power/exit → lower preload; understeer on power/exit → raise preload.

**Steering ratio:** relationship of wheel angle to road-wheel angle (e.g. 15:1). Usually left default unless steering feel/response needs adjustment.

### 2. ACC Physics Engine & Tyre Model

- **Tyre model (5-point):** From version 1.0.7, ACC uses a proprietary, fully dynamic 5-point contact model that replaced AC’s single-contact-point model. Per Kunos’s official 5-Point Tyre Model blog: it implements “2 contact points at the edge of the front of the tyre footprint, 1 in the middle of the footprint and 2 more contact points at the edge of the rear.” It models dynamic slip ratio and slip angle, multi-level heating, tyre wear, variable rigidity/damping, dynamic rolling resistance, and full water-draining/aquaplaning simulation — built on original equations “derived from meticulous studying and hard work of Stefano Casillo [Kunos founder and lead programmer] that you won’t find in any scientific paper, as he had to build new equations by himself.” The TC ECU model estimates slip using yaw gyros, steering sensors and more.
- **v1.9 tyre changes (2023 DHF tyre):** rolling resistance reduced globally — per Coach Dave Academy’s V1.9 FAQ the new DHF tyre “has been tweaked to improve straight line speed for all cars across the board. Expect to see gains upwards of 10 km/h on longer straights.” Optimal window 70–100°C with more aggressive surface temps (heats/cools faster on straights vs sustained corners); core temp more stable — tune brake ducts to hold core temp. Camber now affects heat distribution and rear traction more; toe (especially negative) has a bigger behavioral and tyre-wear effect. Physics changes documented in a public PDF by Kunos physics head Aristotelis Vasilakos.
- **Physics rate:** the v1.8 update (PC Nov 2021; console 29 Sep 2022) raised the physics refresh rate to 400 Hz (up from 300 Hz), for more detailed force feedback and realism, per Kunos’s v1.8 Keynote (via Traxion).
- **Aero:** per-part model — splitter, wing and diffuser are independent aerodynamic elements (lowering the splitter gains front downforce without changing the others; lowering the rear raises diffuser downforce independently).  Ground-effect/diffuser gains downforce as ride height drops (to a critical point),  and rake/diffuser angle can stall if overdone. Cars ride bump stops at speed, making the actual aero platform speed-sensitive vs. the garage figure. A few cars (e.g. Ferrari 488 GT3) sometimes run negative rake due to BoP. 
- **Suspension/weight transfer:** springs/dampers/bump stops/ARBs control pitch (braking dive/accel squat), roll and heave; the stiffer end of the car takes more lateral load transfer, creating the understeer/oversteer bias. Dampers control the *rate* of transfer.
- **Track conditions:** dynamic weather  and a rubbering-in track (grip rises as rubber builds; a wet rubber line becomes slippery first); track temp strongly drives tyre temps/pressures; GT3 tyre warmers vs no warmers for other classes.

### 3. Setup-Building Methodology

Consensus workflow (Coach Dave, Driver61/trophi.ai, Aris, Jardier):

1. **Fix conditions** — set the track/ambient temps and fuel load you’ll actually race; don’t build a setup at 40°C for a 12°C race.
1. **Tyre pressures first** — get hot pressures into 26.0–27.0 PSI after a few laps; re-check as you change other things.
1. **Mechanical grip** — springs/wheel rates, ARBs, then alignment (camber/toe/caster) using tyre-temp telemetry to validate camber/toe.
1. **Ride height, rake & wing** — set the aero platform; balance rear ride height against wing to hold aero balance.
1. **Dampers** — refine kerb/bump behavior and transient balance (MoTeC damper histograms should be roughly symmetrical).
1. **Electronics, differential, brake bias** — to driver preference; TC/ABS as high as possible without losing time.
1. Decide qualifying (loose/fast) vs race (stable/tyre-and-fuel-friendly). “Meta” setups use extreme camber/toe, specific rake/wing, and minimal TC/ABS activation.

**Telemetry/MoTeC:** ACC exports native MoTeC i2 files. Install MoTeC i2 (Pro is free for ACC personal use), copy `Documents/Assetto Corsa Competizione/MoTeC/Workspaces/base_ACC` into `Documents/MoTeC/i2/Workspaces`, set telemetry laps in the Electronics tab, drive, then open the `.ld`/`.ldx` files. Workspace built by Kunos (Aris) around real driver-evaluation channels. Key worksheets: Compare (overlay laps: speed, throttle, brake, steering), damper histograms, tyre temps, suspension. The in-game HUD tyre widget shows temp/pressure with over/under-inflation bars.

### 4. Handling Problem Diagnosis & Fixes (condensed matrix)

- **Entry understeer:** soften front ARB; soften front slow bump (more dive/transfer); lower diff preload; raise rear ride height (rotation); reduce front toe-in; check caster not too high.
- **Entry/braking oversteer:** stiffen front ARB or soften rear ARB; stiffen front springs; raise diff preload; add wing/lower rear ride height; increase rear rebound (holds rear).
- **Mid-corner understeer:** rear ride height up / more rake; ARB balance toward front; camber; lower caster if excessive.
- **Exit understeer (on power):** raise diff preload; stiffen rear ARB or soften front ARB; front rebound tuning.
- **Exit oversteer (on power):** lower diff preload; soften rear ARB; soften rear springs; more rear camber; more wing; raise TC.
- **Instability under braking:** move brake bias forward; raise ABS; increase rear rebound; check rear toe-in; reduce rear-oversteer tendency via springs.
- **Poor traction on exit:** softer rear (springs/ARB), less rear rebound, TC up, diff preload tuning.
- **Tyre degradation/overheating:** correct pressures, reduce extreme camber/toe, adjust brake ducts, raise TC, smoother inputs.
- **Kerb riding:** softer springs/dampers (esp. fast bump), bump-stop tuning; GT4/front-engine cars handle kerbs better.
- **High vs low speed:** high-speed balance is aero-dominated (wing/ride height/rake); low-speed is mechanical (ARB/springs/diff/mechanical grip). Lower pressures help slow corners, higher help fast.
- **Wet:** raise pressures to 29.5–31 PSI; equalize front/rear ride height (kill rake); max wing + splitter for stability;  move brake bias rearward (e.g. 57%→54%); +1–2 ABS;  reduce negative camber (tyre stands up);  close brake ducts; use wet ECU maps and Pad 3 (or Pad 2 for mixed).  Use wets when track is “wet”/“flooded”; stay on slicks for green/damp/greasy. 

### 5. Car-Specific Considerations (GT3 & GT4)

**Engine-layout personalities (ACC/CDA):**

- *Front-engine* (BMW M4 GT3, Mercedes-AMG GT3 Evo, Aston Martin V8 Vantage GT3, Ford Mustang GT3): stable, forgiving, great kerb behavior, tend to entry understeer, heavier front needs stiffer front springs; strong at high-speed/low-speed tracks respectively (M4 excels high-speed; Merc best low-speed).
- *Mid-engine* (Ferrari 296 GT3, McLaren 720S GT3 Evo, Audi R8 LMS Evo II, Lamborghini Huracán GT3 Evo2, Honda NSX): more responsive/central balance, high mid-corner grip; Ferrari 296 = most accessible all-rounder and CDA’s pick as best for beginners; McLaren 720S = highest downforce/mid-corner grip; Audi/Lambo = high-speed specialists.
- *Rear-engine* (Porsche 992 GT3 R): exceptional slow-corner traction and unique mid-corner balance, but specialist — rewards smooth steering, trail braking, progressive throttle.

**BMW M4 GT3 specifics (CDA):** unique aero map — beyond a certain rake the aero balance shifts *rearward* (higher rake = safer, not more nervous);  loses little top speed per wing click; uses bump stops to build/remove rotation;  likes stiff ARBs; slight high-speed understeer, low-speed oversteer from torquey turbo; rear toe and diff are key low-speed stability tools. 

**GT3 roster:** 30+ cars, 15 manufacturers, across Blancpain/GT World Challenge 2018–2024, Intercontinental GT, British GT. Newest cars (296, 720S Evo, 992, Lambo Evo2, Mustang) are the meta because the current tyre/physics were developed around them.

**GT4 vs GT3:** ~7–10 s/lap slower;  less power (≈400 hp BoP), far less aero; momentum/mechanical-grip driving; nicer on kerbs.  Setup is restricted — e.g. Mercedes-AMG GT4 & BMW M4 GT4: front/rear ARBs only 3 settings (0–2, vs 10–12 on GT3), bump-stop range not adjustable, wheel rate fixed/limited rear, fast dampers not separately adjustable (slow only),  splitter fixed, fewer wing steps, TC/ABS fewer steps, damper range 0–24 vs 0–40 (GT4 “stiff” ≈ mid of GT3 range). Some (Maserati GT4,  McLaren 570S GT4) have no TC/ABS and/or no front ARB or no preload diff. Priority for GT4: maximize mechanical grip first, then small aero/electronics tweaks;  front-engine GT4s need softest front wheel rates to combat understeer (e.g. M4 GT4 minimum front wheel rate 166,000 N/m vs 105,000 N/m on the M4 GT3).

### 6. Track-Specific Adjustments

- **High-downforce/low-speed tracks** (Hungaroring, Zandvoort, Zolder, Brands Hatch, Laguna Seca, Oulton, Watkins Glen, Valencia): more wing, more mechanical rotation, lower pressures help; Mercedes-AMG GT3 Evo is the low-speed benchmark.
- **Low-downforce/high-speed tracks** (Monza, Spa, Silverstone, Paul Ricard, Bathurst): trim wing for top speed, accept lower downforce, moderate rake; Audi R8 Evo II is the high-speed benchmark. Even here you keep meaningful downforce for race consistency.
- **Bumpy tracks/kerbs** (Bathurst, Oulton, Zolder): softer springs/dampers, bump-stop tuning, more emphasis on dampers for transient control.
- **Heavy braking zones** (Monza, COTA): brake bias and cooling (ducts) matter; watch front-tyre overheating and lockups.
- **Street/tight circuits vs permanent:** narrower run-off punishes instability — favor stable setups.
- **Corner-type philosophy:** constant-radius corners are good for baseline spring/ARB work; decreasing-radius and traction-onto-straight corners favor softer rear/more traction and diff tuning.
- Named ACC tracks: Spa (Eau Rouge flat needs a confident stable platform; weather changes sector-by-sector; long Kemmel straight >260 km/h), Monza (top speed, heavy braking, curbs at chicanes), Nürburgring GP and Nordschleife (24km, 170+ corners, huge elevation), Bathurst (bumpy, fast, narrow, walls), Suzuka (high-speed esses, aero), Brands Hatch (low-speed, walls close).

### 7. Community Resources, Tools & Data Sources

- **Coach Dave Academy** — most comprehensive written guides + pro setups (Safe/Fast/Meta/Wet) via the **Delta** app ($11.99/month, or $109/year ≈ $9/month; one subscription covers iRacing, ACC, Le Mans Ultimate and AC Evo), which auto-installs setups, auto-adjusts tyre pressures to server temps, and includes AI “Auto Insights” coaching, telemetry, reference hotlap videos,  and Jardier’s setups. Console “Wizard” for Xbox/PS5. 
- **SimGrid (thesimgrid.com)** — racing platform + Fuel Estimator + Server Config Builder (exposes every server JSON parameter)  + toolbox; owned by Speed Capital (same group as CDA), designed by pro driver David Perel.
- **GO Setups / GO Fast app** — LFM-focused setups, MoTeC data; free Race Engineer, Tyre Pressure Tool (auto pressures, works with any setup), Fuel Calculator;  ACC Setup Viewer & Comparator (gosetups.gg). 
- **SimRacingSetup.com** — free + premium setups, cheapest ACC-only sub, best console support,  ACC Setup Viewer (JSON → readable values for console). 
- **Driver61 / trophi.ai** — “Setup Cheat-Sheet” (every setting),  tyre-pressure deep dives; trophi.ai gives real-time verbal AI coaching and analyzes large telemetry datasets.
- **Track Titan** — telemetry-based tutorials, beginner car guides, console F1 support.
- **Full Grip Motorsport (fullgripmotorsport.com)** — free academy with per-parameter tutorials and corner-by-corner track guides for the full ACC calendar.
- **MoTeC i2** — official telemetry standard (free Pro for ACC), Kunos-built base_ACC workspace.
- **Crew Chief** — free voice spotter/race engineer (gaps, flags, fuel, tyre temps), works with ACC. 
- **SimHub** — near-essential free/pay-what-you-want dashboards, bass-shaker/haptics/wind, tyre-temp displays (some console support). 
- **Aris.Drives (Aristotelis Vasilakos)** — ex-Kunos physics dev (netKar Pro, Ferrari Virtual Academy, AC, ACC);  YouTube deep-dives on tyre physics and setup theory — the closest thing to primary-source physics explanation.
- **Jardier** — popular ACC creator with step-by-step setup-building videos (also in Delta).
- **Written/wiki:** ACC Wiki (acc-wiki.info) beginner setup guide + full server-config docs; Trinacria Simracing (detailed translations of Aris material incl. aero, wet, 5-point tyre model); official Kunos forum (assettocorsa.net) and OverTake.gg (Aris blog reposts).
- **Setup repositories & parsers:** GitHub `Lon3035/ACC_Setups` and `JenSeReal/ACC-Setups` (raw JSON collections mirroring the Setups folder), `mikeev261/acc_setup_analyzer` (JSON→CSV), `jdelong58/ACC-Fuel-and-Tyre-Pressure-Calculator`, ACCSetupComparator (web). No official public ACC setup API, but the JSON format + dedicated-server SDK (Steam Tools) + shared-memory telemetry are the de-facto data interfaces.

### 8. Data Structure Considerations (critical for app-building)

- **Location/format:** `.json` files in `Documents/Assetto Corsa Competizione/Setups/<CarName>/<TrackName>/`.  PC-only for direct load; consoles must input values manually.  Server config files are UTF-16-LE; setup files are standard JSON.
- **Top-level schema (confirmed from real setup files):**
  - `carName` (string, e.g. `amr_v8_vantage_gt3`)
  - `basicSetup`:
    - `tyres`: `tyreCompound` (0 dry / 1 wet), `tyrePressure` [FL,FR,RL,RR]
    - `alignment`: `camber` [4], `toe` [4], `staticCamber` [4] (read-only computed degrees), `toeOutLinear` [4] (computed), `casterLF`, `casterRF`, `steerRatio` 
    - `electronics`: `tC1`, `tC2`, `abs`, `eCUMap`, `fuelMix`, `telemetryLaps` 
    - `strategy`: `fuel` (liters), `nPitStops`, `tyreSet`, `frontBrakePadCompound`, `rearBrakePadCompound`, `pitStrategy` [ … per-stop fuel/tyres/pads ], `fuelPerLap` 
  - `advancedSetup`:
    - `mechanicalBalance`: `aRBFront`, `aRBRear`, `wheelRate` [4], `bumpStopRateUp` [4], `bumpStopRateDn` [4], `bumpStopWindow` [4], `brakeTorque`, `brakeBias` 
    - `dampers`: `bumpSlow` [4], `bumpFast` [4], `reboundSlow` [4], `reboundFast` [4] 
    - `aeroBalance`: `rideHeight` [front,…,rear], `rodLength` [4] (computed), `splitter`, `rearWing`, `brakeDuct` [front,rear] 
    - `drivetrain`: `preload`
  - `trackBopType` (int) 
- **Value encoding (the crucial part):** all adjustable values are stored as **zero-based integer indices (“clicks”)**, not real units. Convert with `displayed = min + index × increment`, except caster and wheel rate which use **per-car look-up tables (non-linear)**. Min/increment are **car-specific and shift with BoP**, so the same integer differs across cars.
  - `tyrePressure`: PSI ≈ 17.0 + index × 0.1 (0.1 PSI/step) — offset community-derived; the 0.1 PSI/step increment is well established.
  - `camber` (GT3, verbatim from Race-Element Issue #21): front ° = −4.0 + index×0.1 (range −4.0 to −1.5); rear ° = −3.5 + index×0.1 (range −3.5 to −1.0); 0.1° step
  - `toe` (GT3, verbatim): ° = −0.4 + index×0.01 (range −0.4 to +0.4), 0.01° step
  - `caster`, `wheelRate`: per-car LUT (non-linear)
  - `brakeBias`: % = car-specific min + index×0.2 (0.2%/step)
  - `tC1/tC2/abs/eCUMap/fuelMix`, `aRBFront/Rear`, dampers, `rearWing`, `brakeDuct`, `splitter`, bump-stops: raw zero-based index (step 1); traction control confirmed `SetupIntRange(0, 11)` for GT3
  - `steerRatio`, `rideHeight` (mm), `preload` (Nm): min + index×step (car-specific)
  - `fuel`: liters 1:1; `tyreSet`/`padCompound`: displayed = index + 1
  - `staticCamber`, `toeOutLinear`, `rodLength` are engine-computed float outputs (not directly user-set).
- **Definitive open-source reference:** **RiddleTime/Race-Element** (github.com/RiddleTime/Race-Element; formerly ACC-Manager) implements per-car `ISetupChanger` classes with `SetupDoubleRange(min,max,increment)`, `SetupIntRange`, and caster/wheel-rate LUTs. Its Issue #21 documents the approach and confirms ranges verbatim (GT3 camber −4.0/−3.5 min at 0.1°, toe −0.4→0.4 at 0.01°, TC 0–11; the Porsche 911 II GT3 R was “the first car which has gained the ISetupChanger type”). An app should encode a per-car table of min/increment/LUTs and treat BoP versions as separate profiles.

## Recommendations

1. **Build the data layer first around Race-Element’s model.** Create a per-car, per-BoP-version table of {parameter → min, increment, max, or LUT}. Validate your decode/encode round-trip against known-good JSON setups (Lon3035/JenSeReal repos) and the Race-Element source. Benchmark: your app should reproduce a saved setup’s displayed values exactly and write JSON that ACC loads without error.
1. **Encode the CDA “if X do Y” matrix as the diagnostic engine’s core rules**, tagged by corner phase (entry/mid/exit), symptom (understeer/oversteer/instability/traction/temps/kerbs), and speed regime (low vs high). Weight aero fixes for high-speed, mechanical/diff for low-speed. Threshold to escalate from mechanical to aero changes: if the problem is speed-dependent (only high-speed), go to wing/ride-height/rake first.
1. **Integrate the tyre-pressure engine as a first-class feature** (target 26.0–27.0 hot / 29.5–31 wet; -0.1 PSI per +1°C ambient; ~0.2 PSI per brake-duct click; GT3 warmers vs none). This is the highest-value, most objective, easiest-to-automate coaching output — mirror GO Fast/Delta auto-pressure behavior.
1. **Consume MoTeC channels for closed-loop diagnosis.** Parse `.ld`/`.ldx` (or shared-memory live telemetry) for tyre temps (inside/mid/outside spread), damper histograms (symmetry), slip, and pressures to drive automated recommendations rather than relying on driver self-report.
1. **Stage the product:** (a) parameter explainer + pressure/fuel calculators (objective, low-risk); (b) symptom-driven setup adviser using the CDA matrix; (c) telemetry-driven auto-diagnosis; (d) full baseline-setup generator per car/track/conditions. Change the roadmap if a BoP update or new ACC physics patch (or migration to Assetto Corsa EVO) invalidates the per-car tables — treat game version as a first-class config dimension.
1. **Respect IP.** CDA/GO/SRS setups are paid products; use them as methodology inspiration, not scraped data. Safe data sources: open GitHub JSON repos, the public JSON schema, MoTeC channels, Aris’s public physics material, and your own generated setups.

## Caveats

- **Version sensitivity:** ACC physics/tyre behavior changed materially across v1.8 (400 Hz physics), v1.9 (2023 DHF tyre, unified 26–27 PSI; the pre-v1.9 tyre needed ~27.5 PSI for peak grip) and up to v1.10.4 (Dec 2025). Kunos has since moved to Assetto Corsa EVO; ACC is “finished.” Any setup rule tied to a tyre/BoP version must be dated. Console versions historically lag PC by several patches.
- **The JSON value-conversion constants are mostly community-derived.** The camber/toe ranges and index model are verbatim-confirmed from Race-Element; the tyre-pressure 17.0 offset and brake-bias 0.2%/step are strongly supported/derived but were not verbatim-confirmed from source in this research — validate against Race-Element’s `SetupJson.cs`/`ConversionFactory.cs` and real setup files before shipping. A “0.148 × value” brake-bias formula sometimes cited appears to be a per-car empirical fit, not universal.
- **Car balance is BoP-dependent and shifts over time**; “meta car” and “fastest car” claims are snapshots (mid-2026) and change with each BoP.
- **Setup is driver-dependent.** The fastest single-lap setup ≠ the best race setup; guides consistently stress consistency/tyre-and-fuel management over raw qualifying pace.
- **Some cited pages are commercial** (Coach Dave, GO Setups, SimRacingSetup, SOLOX, trophi.ai) with an incentive to sell setups/subscriptions; their technical explanations are broadly consistent with Kunos/Aris primary material, but treat superlatives (“fastest,” “best”) as marketing.
- A few low-quality/aggregator/SEO pages appeared in searches (e.g. auto-translated or spun content); the report relies on established experts (Coach Dave, Driver61/trophi.ai, Aris/Kunos, ACC Wiki, Race-Element) and primary JSON evidence.

-----

### Primary source URLs (for later reference)

- Coach Dave ultimate setup guide: <https://coachdaveacademy.com/tutorials/the-ultimate-acc-car-setup-guide/>
- CDA fix oversteer/understeer: <https://coachdaveacademy.com/tutorials/how-to-fix-oversteer-and-understeer-in-acc/>
- CDA fastest GT3 cars: <https://coachdaveacademy.com/tutorials/what-is-the-fastest-gt3-car-in-acc/>
- CDA BMW M4 GT3 / GT4 / Merc GT4 / Maserati GT4 / McLaren 570S GT4 under-the-hood guides (coachdaveacademy.com/tutorials/…)
- CDA V1.9 FAQ: <https://coachdaveacademy.com/announcements/1-9-acc-faq-coach-dave/>
- CDA MoTeC guide: <https://coachdaveacademy.com/tutorials/how-to-use-motec-data-in-assetto-corsa-competizione/>
- CDA best sim racing apps / best ACC subscriptions 2026
- SimRacingSetup ultimate guide: <https://simracingsetup.com/assetto-corsa/acc-beginners-setup-guide/> ; tyre pressures: /acc-tyre-pressure-guide/ ; setup viewer: /acc-setup-viewer/
- Driver61: <https://driver61.com/sim-racing/assetto-corsa-competizione-setup-guide/>
- trophi.ai cheat-sheet: <https://www.trophi.ai/post/assetto-corsa-competizione-ultimate-setup-guide> ; tyre pressures: /post/why-tyre-pressures-are-crucial-in-acc
- Traxion beginner setup: <https://traxion.gg/assetto-corsa-competizione-basic-setup-guide/> ; wet: /how-to-use-assetto-corsa-competiziones-wet-weather-to-your-advantage/
- Trinacria Simracing 5-point tyre / aero / wet / beginner guides (trinacriasimracing.wordpress.com)
- Kunos 5-Point Tyre Model & MoTeC blogs via OverTake.gg (overtake.gg/threads/…)
- Aris.Drives YouTube: <https://www.youtube.com/c/ArisDrives>
- ACC Wiki: <https://www.acc-wiki.info/wiki/Setup_Guide_for_Beginners> ; server config: /wiki/Server_Configuration
- Full Grip Motorsport academy: <https://www.fullgripmotorsport.com/academy/>
- GitHub: Lon3035/ACC_Setups, JenSeReal/ACC-Setups, mikeev261/acc_setup_analyzer, jdelong58/ACC-Fuel-and-Tyre-Pressure-Calculator, RiddleTime/Race-Element (Issue #21)
- Example setup JSON: <https://pastebin.com/LJ0Za7n3>
- GO Setups: <https://gosetups.gg/> ; SimGrid toolbox: <https://www.thesimgrid.com/toolbox> ; MoTeC i2: <https://www.motec.com.au/i2/i2downloads/>