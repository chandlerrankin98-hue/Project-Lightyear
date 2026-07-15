---
name: verify
description: How to build, launch, and drive Project-Lightyear (ACC Team Engineer) for runtime verification.
---

# Verifying Project-Lightyear

Single-package Next.js app. The surface is the browser — there is no CLI/API-only
path worth testing in isolation; drive the real UI.

## Launch

```bash
npm run dev
```

Serves on `http://localhost:3000`. Needs `.env.local` (Supabase URL/anon key,
`ANTHROPIC_API_KEY`) — **git worktrees don't inherit untracked files**, so if
you're in a fresh worktree, copy it from the main checkout first:

```bash
cp /Users/chandlerrankin/Desktop/Project-Lightyear/.env.local .env.local
```

Confirm it's up: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000`
should return `200`.

## Drive it

Use the Chrome browser tools (`mcp__claude-in-chrome__*`). The app requires a
real signed-in Supabase session — if a browser tab already has one from a
prior session, reuse it via `tabs_context_mcp` rather than fighting the
sign-in gate; don't type real credentials.

Core flows worth exercising after a change to car data or the setup form:

1. **Car selector** — the `<select>` labeled "Car" (`carsIndex` driven). Switch
   between cars and check the Alignment/Mechanical/Dampers/Aero/Electronics
   sections re-render with that car's units/ranges (no stale values from the
   previous car — this is the sharpest regression to watch for).
2. **Manual entry form** — every field must be filled with a valid number
   before "Save setup" will succeed (`tryParseDisplay` in `page.tsx` — the
   error is a static string "Every field must be filled in with a valid
   number before saving.", easy to miss one field in a ~64-field form).
3. **Save → reload → Load → Delete round trip** — save a setup, reload the
   page (or switch away and back), click Load, verify every field matches
   what was entered, then Delete and confirm the saved-setups list is empty
   again.
4. **Get recommendations** — fill the "Handling symptom" box, click "Get
   recommendations", wait ~3-5s for the real Claude API call, and read the
   Diagnosis/Recommendations/Cautions blocks via `get_page_text` (cheaper
   than scrolling + screenshotting through it).

Use `read_console_messages` (pattern `.`, `onlyErrors: false`) after each
flow — the app throws real console errors on Supabase/API failures, not just
silent UI breakage.

## Gotchas learned

- `ParamDef.encoding` can be `"linear" | "lut" | "rawIndex" | "fixed"`. The
  `"fixed"` encoding renders a **disabled, pre-filled** input — it must never
  block save validation and must never leak a value across a car switch
  (e.g. switching from a car with a fixed caster to one with a real caster
  LUT must show an empty select, not the old fixed value). This is the one
  most worth re-checking after any change to `ParamInput`/`initialFormFor`
  in `page.tsx`.
- `get_page_text` is far cheaper than screenshotting every section when you
  just need to confirm captions/values (e.g. `"(clicks, fixed)"` vs
  `"(clicks, 0–6)"` vs `"(clicks, 0–??, unconfirmed)"`) across many cars.
- Kill the dev server when done: `lsof -ti:3000 | xargs kill`.
