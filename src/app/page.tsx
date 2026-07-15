"use client";

import { useEffect, useState, useCallback } from "react";
import carsIndex from "@/data/cars/index.json";
import { getCarData } from "@/lib/setup/carData";
import { readSetup } from "@/lib/setup/readSetup";
import type { RawSetup, DisplaySetup } from "@/lib/setup/types";
import { supabase } from "@/lib/supabase";

interface SetupRow {
  id: string;
  car_id: string;
  track: string;
  name: string;
  raw_setup: RawSetup;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RecommendationItem {
  parameter: string;
  direction: "increase" | "decrease" | "set" | "no_change";
  clicks: number | null;
  suggestedValue: number | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

interface RecommendationResult {
  diagnosis: string;
  recommendations: RecommendationItem[];
  cautions: string[];
}

type CornerPhase = "entry" | "mid" | "exit" | "braking" | "general";
type SpeedRegime = "low" | "high" | "general";
type SessionType = "practice" | "qualifying" | "race";

function parseNum(s: string): number | undefined {
  return s.trim() === "" ? undefined : Number(s);
}

export default function Home() {
  const [carId, setCarId] = useState(carsIndex[0].carId);
  const car = getCarData(carId);

  const [rawSetup, setRawSetup] = useState<RawSetup | null>(null);
  const [displaySetup, setDisplaySetup] = useState<DisplaySetup | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [loadedSetupId, setLoadedSetupId] = useState<string | null>(null);

  const [track, setTrack] = useState("");
  const [setupName, setSetupName] = useState("");
  const [saving, setSaving] = useState(false);

  const [savedSetups, setSavedSetups] = useState<SetupRow[]>([]);

  const [symptom, setSymptom] = useState("");
  const [cornerPhase, setCornerPhase] = useState<CornerPhase>("general");
  const [speedRegime, setSpeedRegime] = useState<SpeedRegime>("general");
  const [trackTempC, setTrackTempC] = useState("");
  const [ambientTempC, setAmbientTempC] = useState("");
  const [wet, setWet] = useState(false);

  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recResult, setRecResult] = useState<RecommendationResult | null>(null);

  const [sessionType, setSessionType] = useState<SessionType>("practice");
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const refreshSavedSetups = useCallback(async (forCarId: string) => {
    const { data, error } = await supabase
      .from("setups")
      .select("*")
      .eq("car_id", forCarId)
      .order("updated_at", { ascending: false });
    if (!error) setSavedSetups((data as SetupRow[]) ?? []);
  }, []);

  useEffect(() => {
    let ignore = false;
    supabase
      .from("setups")
      .select("*")
      .eq("car_id", carId)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!ignore && !error) setSavedSetups((data as SetupRow[]) ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [carId]);

  function resetLoadedSetup() {
    setRawSetup(null);
    setDisplaySetup(null);
    setLoadedSetupId(null);
    setSetupError(null);
  }

  function handleCarChange(newCarId: string) {
    setCarId(newCarId);
    resetLoadedSetup();
    setTrack("");
    setSetupName("");
    setRecResult(null);
    setRecError(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as RawSetup;
      const display = readSetup(parsed, car);
      setRawSetup(parsed);
      setDisplaySetup(display);
      setLoadedSetupId(null);
      setSetupError(null);
    } catch (err) {
      setSetupError(err instanceof Error ? `Couldn't read this file as a ${car.displayName} setup: ${err.message}` : "Couldn't read this file.");
    }
  }

  function handleDownload() {
    if (!rawSetup) return;
    const blob = new Blob([JSON.stringify(rawSetup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${carId}-setup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGetRecommendations() {
    if (!symptom.trim()) {
      setRecError("Describe the handling symptom first.");
      return;
    }
    setRecLoading(true);
    setRecError(null);
    setRecResult(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          symptom,
          cornerPhase,
          speedRegime,
          conditions: {
            trackTempC: parseNum(trackTempC),
            ambientTempC: parseNum(ambientTempC),
            wet,
          },
          currentSetup: displaySetup ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecError(data.error ?? "Request failed.");
      } else {
        setRecResult(data as RecommendationResult);
      }
    } catch (err) {
      setRecError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRecLoading(false);
    }
  }

  async function handleSaveSetup() {
    if (!rawSetup) {
      setSetupError("Upload a setup file before saving.");
      return;
    }
    if (!track.trim() || !setupName.trim()) {
      setSetupError("Track and setup name are required to save.");
      return;
    }
    setSaving(true);
    setSetupError(null);
    if (loadedSetupId) {
      const { error } = await supabase
        .from("setups")
        .update({ track: track.trim(), name: setupName.trim(), raw_setup: rawSetup })
        .eq("id", loadedSetupId);
      if (error) setSetupError(error.message);
    } else {
      const { data, error } = await supabase
        .from("setups")
        .insert({ car_id: carId, track: track.trim(), name: setupName.trim(), raw_setup: rawSetup })
        .select()
        .single();
      if (error) setSetupError(error.message);
      else setLoadedSetupId((data as SetupRow).id);
    }
    setSaving(false);
    refreshSavedSetups(carId);
  }

  function handleLoadSetup(row: SetupRow) {
    try {
      const display = readSetup(row.raw_setup, car);
      setRawSetup(row.raw_setup);
      setDisplaySetup(display);
      setLoadedSetupId(row.id);
      setTrack(row.track);
      setSetupName(row.name);
      setSetupError(null);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Couldn't load this saved setup.");
    }
  }

  async function handleDeleteSetup(id: string) {
    await supabase.from("setups").delete().eq("id", id);
    if (loadedSetupId === id) resetLoadedSetup();
    refreshSavedSetups(carId);
  }

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    if (!track.trim()) {
      setNoteStatus("error");
      return;
    }
    setNoteStatus("saving");
    const { error } = await supabase.from("session_notes").insert({
      car_id: carId,
      track: track.trim(),
      setup_id: loadedSetupId,
      session_type: sessionType,
      conditions: { trackTempC: parseNum(trackTempC), ambientTempC: parseNum(ambientTempC), wet },
      notes: noteText.trim(),
    });
    if (error) {
      setNoteStatus("error");
    } else {
      setNoteStatus("saved");
      setNoteText("");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">ACC Team Engineer</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Setup engineering assistant for Assetto Corsa Competizione.</p>
        </header>

        {/* Car + track */}
        <section className="flex flex-wrap gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Car</span>
            <select
              value={carId}
              onChange={(e) => handleCarChange(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {carsIndex.map((c) => (
                <option key={c.carId} value={c.carId}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Track</span>
            <input
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="e.g. Spa"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </section>

        {/* Setup upload / summary */}
        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium text-black dark:text-zinc-50">Setup</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
              Upload setup JSON
              <input type="file" accept="application/json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleDownload}
              disabled={!rawSetup}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Download JSON
            </button>
            {rawSetup && (
              <span className="text-sm text-zinc-500">{loadedSetupId ? "Loaded from saved setup" : "Unsaved upload"}</span>
            )}
          </div>
          {setupError && <p className="text-sm text-red-600 dark:text-red-400">{setupError}</p>}
          {displaySetup && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <SetupStat label="Tyre pressure" value={displaySetup.tyrePressure.map((v) => v.toFixed(1)).join(" / ")} unit="psi" />
              <SetupStat label="Camber F/R" value={`${displaySetup.camber[0].toFixed(1)} / ${displaySetup.camber[2].toFixed(1)}`} unit="deg" />
              <SetupStat label="Ride height F/R" value={`${displaySetup.rideHeightFront} / ${displaySetup.rideHeightRear}`} unit="mm" />
              <SetupStat label="ARB F/R" value={`${displaySetup.aRBFront} / ${displaySetup.aRBRear}`} unit="clicks" />
              <SetupStat label="Brake bias" value={displaySetup.brakeBias.toFixed(1)} unit="%" />
              <SetupStat label="Diff preload" value={String(displaySetup.preload)} unit="Nm" />
              <SetupStat label="Rear wing" value={String(displaySetup.rearWing)} unit="clicks" />
              <SetupStat label="Splitter" value={String(displaySetup.splitter)} unit="clicks" />
              <SetupStat label="TC / ABS" value={`${displaySetup.tC1} / ${displaySetup.abs}`} unit="clicks" />
            </dl>
          )}
          <div className="flex flex-wrap items-end gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Setup name</span>
              <input
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="e.g. Race - dry"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <button
              onClick={handleSaveSetup}
              disabled={saving || !rawSetup}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {saving ? "Saving…" : loadedSetupId ? "Update saved setup" : "Save setup"}
            </button>
          </div>
        </section>

        {/* Saved setups */}
        {savedSetups.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-medium text-black dark:text-zinc-50">Saved setups — {car.displayName}</h2>
            <ul className="flex flex-col gap-2">
              {savedSetups.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span>
                    <span className="font-medium">{row.name}</span>{" "}
                    <span className="text-zinc-500">
                      · {row.track} · {new Date(row.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <button onClick={() => handleLoadSetup(row)} className="text-zinc-700 underline dark:text-zinc-300">
                      Load
                    </button>
                    <button onClick={() => handleDeleteSetup(row.id)} className="text-red-600 underline dark:text-red-400">
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Symptom form */}
        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium text-black dark:text-zinc-50">Handling symptom</h2>
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="e.g. Car understeers on corner entry under braking in slow chicanes."
            rows={3}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Corner phase</span>
              <select
                value={cornerPhase}
                onChange={(e) => setCornerPhase(e.target.value as CornerPhase)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="general">General</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid-corner</option>
                <option value="exit">Exit</option>
                <option value="braking">Braking</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Speed regime</span>
              <select
                value={speedRegime}
                onChange={(e) => setSpeedRegime(e.target.value as SpeedRegime)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="general">General</option>
                <option value="low">Low-speed</option>
                <option value="high">High-speed</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Track temp °C</span>
              <input
                value={trackTempC}
                onChange={(e) => setTrackTempC(e.target.value)}
                inputMode="decimal"
                className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Ambient °C</span>
              <input
                value={ambientTempC}
                onChange={(e) => setAmbientTempC(e.target.value)}
                inputMode="decimal"
                className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={wet} onChange={(e) => setWet(e.target.checked)} />
              Wet
            </label>
          </div>
          <button
            onClick={handleGetRecommendations}
            disabled={recLoading}
            className="self-start rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {recLoading ? "Thinking…" : "Get recommendations"}
          </button>
          {recError && <p className="text-sm text-red-600 dark:text-red-400">{recError}</p>}
        </section>

        {/* Recommendations */}
        {recResult && (
          <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium text-black dark:text-zinc-50">Diagnosis</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{recResult.diagnosis}</p>

            <h3 className="mt-2 font-medium text-black dark:text-zinc-50">Recommendations</h3>
            <ul className="flex flex-col gap-3">
              {recResult.recommendations.map((r, i) => (
                <li key={i} className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.parameter}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{r.confidence} confidence</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {r.direction}
                    {r.clicks !== null ? ` by ${r.clicks} click${r.clicks === 1 ? "" : "s"}` : ""}
                    {r.suggestedValue !== null ? ` → ${r.suggestedValue}` : ""}
                  </p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300">{r.reasoning}</p>
                </li>
              ))}
            </ul>

            {recResult.cautions.length > 0 && (
              <>
                <h3 className="mt-2 font-medium text-black dark:text-zinc-50">Cautions</h3>
                <ul className="list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
                  {recResult.cautions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <h3 className="font-medium text-black dark:text-zinc-50">Session note</h3>
              <div className="flex gap-3">
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as SessionType)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="practice">Practice</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="race">Race</option>
                </select>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What did you try, what worked, what to remember next time..."
                rows={2}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                onClick={handleSaveNote}
                disabled={noteStatus === "saving"}
                className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {noteStatus === "saving" ? "Saving…" : "Save note"}
              </button>
              {noteStatus === "saved" && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
              {noteStatus === "error" && <p className="text-sm text-red-600 dark:text-red-400">Track name is required to save a note.</p>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SetupStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-black dark:text-zinc-50">
        {value} <span className="font-normal text-zinc-500">{unit}</span>
      </dd>
    </div>
  );
}
