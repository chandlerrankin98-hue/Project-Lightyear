"use client";

import { useEffect, useState } from "react";
import carsIndex from "@/data/cars/index.json";
import { getCarData } from "@/lib/setup/carData";
import type { CarData, DisplaySetup, ParamDef, WheelTuple } from "@/lib/setup/types";
import { supabase } from "@/lib/supabase";

interface SetupRow {
  id: string;
  car_id: string;
  track: string;
  name: string;
  setup_values: DisplaySetup;
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

/** Every DisplaySetup field as a controlled-input string (so partial/empty entry is allowed). */
type SetupForm = {
  [K in keyof DisplaySetup]: DisplaySetup[K] extends WheelTuple ? [string, string, string, string] : string;
};

function emptyForm(): SetupForm {
  const t = (): [string, string, string, string] => ["", "", "", ""];
  return {
    tyrePressure: t(),
    camber: t(),
    toe: t(),
    casterLF: "",
    casterRF: "",
    steerRatio: "",
    tC1: "",
    tC2: "",
    abs: "",
    eCUMap: "",
    aRBFront: "",
    aRBRear: "",
    wheelRate: t(),
    bumpStopRate: t(),
    bumpStopWindow: t(),
    brakeTorque: "",
    brakeBias: "",
    bumpSlow: t(),
    bumpFast: t(),
    reboundSlow: t(),
    reboundFast: t(),
    rideHeightFront: "",
    rideHeightRear: "",
    splitter: "",
    rearWing: "",
    brakeDuctFront: "",
    brakeDuctRear: "",
    preload: "",
    fuelMix: "",
    fuel: "",
    tyreSet: "",
    frontBrakePadCompound: "",
    rearBrakePadCompound: "",
  };
}

function formFromDisplay(d: DisplaySetup): SetupForm {
  const out = {} as SetupForm;
  for (const key of Object.keys(d) as (keyof DisplaySetup)[]) {
    const v = d[key];
    (out as unknown as Record<string, unknown>)[key] = Array.isArray(v) ? v.map(String) : String(v);
  }
  return out;
}

/** Parses every field as a number; returns null if anything is empty or doesn't parse. */
function tryParseDisplay(form: SetupForm): DisplaySetup | null {
  const out = {} as DisplaySetup;
  for (const key of Object.keys(form) as (keyof SetupForm)[]) {
    const v = form[key];
    if (Array.isArray(v)) {
      const nums: number[] = [];
      for (const s of v) {
        if (s.trim() === "") return null;
        const n = Number(s);
        if (Number.isNaN(n)) return null;
        nums.push(n);
      }
      (out as unknown as Record<string, unknown>)[key] = nums;
    } else {
      if (v.trim() === "") return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      (out as unknown as Record<string, unknown>)[key] = n;
    }
  }
  return out;
}

function getField(form: SetupForm, key: keyof SetupForm, index?: number): string {
  const v = form[key];
  return Array.isArray(v) ? v[index ?? 0] : v;
}

function setField(form: SetupForm, key: keyof SetupForm, index: number | undefined, value: string): SetupForm {
  const current = form[key];
  if (Array.isArray(current)) {
    const next = [...current] as [string, string, string, string];
    next[index ?? 0] = value;
    return { ...form, [key]: next };
  }
  return { ...form, [key]: value };
}

function boundsCaption(def: ParamDef): string {
  if (def.encoding === "lut") return def.confirmed ? `${def.unit}` : `${def.unit}, unconfirmed`;
  const max = def.max === null || def.max === undefined ? "?" : def.max;
  const range = def.confirmed ? `${def.min}–${max}` : `${def.min}–${max}?, unconfirmed`;
  return `${def.unit}, ${range}`;
}

function ParamInput({
  label,
  def,
  value,
  onChange,
}: {
  label: string;
  def: ParamDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (def.encoding === "lut") {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">
          {label} <span className="text-zinc-400">({boundsCaption(def)})</span>
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" />
          {def.lut?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-600 dark:text-zinc-400">
        {label} <span className="text-zinc-400">({boundsCaption(def)})</span>
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        type="number"
        step={def.increment ?? 1}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}

function PlainInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        type="number"
        step={step}
        min={0}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}

const PAD_LABELS: Record<string, string> = {
  "1": "1 — sprint/qualifying",
  "2": "2 — endurance",
  "3": "3 — wet/cold",
  "4": "4 — practice only",
};

function PadSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" />
        {Object.entries(PAD_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium text-black dark:text-zinc-50">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}

export default function Home() {
  const [carId, setCarId] = useState(carsIndex[0].carId);
  const car: CarData = getCarData(carId);
  const p = car.parameters;

  const [form, setForm] = useState<SetupForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
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

  function refreshSavedSetups(forCarId: string) {
    supabase
      .from("setups")
      .select("*")
      .eq("car_id", forCarId)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSavedSetups((data as SetupRow[]) ?? []);
      });
  }

  function set(key: keyof SetupForm, index?: number) {
    return (v: string) => setForm((f) => setField(f, key, index, v));
  }

  function handleCarChange(newCarId: string) {
    setCarId(newCarId);
    setForm(emptyForm());
    setLoadedSetupId(null);
    setFormError(null);
    setTrack("");
    setSetupName("");
    setRecResult(null);
    setRecError(null);
  }

  async function handleGetRecommendations() {
    if (!symptom.trim()) {
      setRecError("Describe the handling symptom first.");
      return;
    }
    setRecLoading(true);
    setRecError(null);
    setRecResult(null);
    const currentSetup = tryParseDisplay(form) ?? undefined;
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
            trackTempC: trackTempC.trim() === "" ? undefined : Number(trackTempC),
            ambientTempC: ambientTempC.trim() === "" ? undefined : Number(ambientTempC),
            wet,
          },
          currentSetup,
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
    const parsed = tryParseDisplay(form);
    if (!parsed) {
      setFormError("Every field must be filled in with a valid number before saving.");
      return;
    }
    if (!track.trim() || !setupName.trim()) {
      setFormError("Track and setup name are required to save.");
      return;
    }
    setSaving(true);
    setFormError(null);
    if (loadedSetupId) {
      const { error } = await supabase
        .from("setups")
        .update({ track: track.trim(), name: setupName.trim(), setup_values: parsed })
        .eq("id", loadedSetupId);
      if (error) setFormError(error.message);
    } else {
      const { data, error } = await supabase
        .from("setups")
        .insert({ car_id: carId, track: track.trim(), name: setupName.trim(), setup_values: parsed })
        .select()
        .single();
      if (error) setFormError(error.message);
      else setLoadedSetupId((data as SetupRow).id);
    }
    setSaving(false);
    refreshSavedSetups(carId);
  }

  function handleLoadSetup(row: SetupRow) {
    setForm(formFromDisplay(row.setup_values));
    setLoadedSetupId(row.id);
    setTrack(row.track);
    setSetupName(row.name);
    setFormError(null);
  }

  async function handleDeleteSetup(id: string) {
    await supabase.from("setups").delete().eq("id", id);
    if (loadedSetupId === id) {
      setForm(emptyForm());
      setLoadedSetupId(null);
    }
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
      conditions: {
        trackTempC: trackTempC.trim() === "" ? undefined : Number(trackTempC),
        ambientTempC: ambientTempC.trim() === "" ? undefined : Number(ambientTempC),
        wet,
      },
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

        {/* Tyres */}
        <Section title="Tyres">
          <Row>
            <ParamInput label="Pressure FL" def={p.tyrePressure} value={getField(form, "tyrePressure", 0)} onChange={set("tyrePressure", 0)} />
            <ParamInput label="Pressure FR" def={p.tyrePressure} value={getField(form, "tyrePressure", 1)} onChange={set("tyrePressure", 1)} />
            <ParamInput label="Pressure RL" def={p.tyrePressure} value={getField(form, "tyrePressure", 2)} onChange={set("tyrePressure", 2)} />
            <ParamInput label="Pressure RR" def={p.tyrePressure} value={getField(form, "tyrePressure", 3)} onChange={set("tyrePressure", 3)} />
          </Row>
        </Section>

        {/* Alignment */}
        <Section title="Alignment">
          <Row>
            <ParamInput label="Camber FL" def={p.camberFront} value={getField(form, "camber", 0)} onChange={set("camber", 0)} />
            <ParamInput label="Camber FR" def={p.camberFront} value={getField(form, "camber", 1)} onChange={set("camber", 1)} />
            <ParamInput label="Camber RL" def={p.camberRear} value={getField(form, "camber", 2)} onChange={set("camber", 2)} />
            <ParamInput label="Camber RR" def={p.camberRear} value={getField(form, "camber", 3)} onChange={set("camber", 3)} />
          </Row>
          <Row>
            <ParamInput label="Toe FL" def={p.toeFront} value={getField(form, "toe", 0)} onChange={set("toe", 0)} />
            <ParamInput label="Toe FR" def={p.toeFront} value={getField(form, "toe", 1)} onChange={set("toe", 1)} />
            <ParamInput label="Toe RL" def={p.toeRear} value={getField(form, "toe", 2)} onChange={set("toe", 2)} />
            <ParamInput label="Toe RR" def={p.toeRear} value={getField(form, "toe", 3)} onChange={set("toe", 3)} />
          </Row>
          <Row>
            <ParamInput label="Caster LF" def={p.caster} value={form.casterLF} onChange={set("casterLF")} />
            <ParamInput label="Caster RF" def={p.caster} value={form.casterRF} onChange={set("casterRF")} />
            <ParamInput label="Steering ratio" def={p.steeringRatio} value={form.steerRatio} onChange={set("steerRatio")} />
          </Row>
        </Section>

        {/* Mechanical */}
        <Section title="Mechanical">
          <Row>
            <ParamInput label="ARB front" def={p.antiRollBarFront} value={form.aRBFront} onChange={set("aRBFront")} />
            <ParamInput label="ARB rear" def={p.antiRollBarRear} value={form.aRBRear} onChange={set("aRBRear")} />
          </Row>
          <Row>
            <ParamInput label="Wheel rate FL" def={p.wheelRateFront} value={getField(form, "wheelRate", 0)} onChange={set("wheelRate", 0)} />
            <ParamInput label="Wheel rate FR" def={p.wheelRateFront} value={getField(form, "wheelRate", 1)} onChange={set("wheelRate", 1)} />
            <ParamInput label="Wheel rate RL" def={p.wheelRateRear} value={getField(form, "wheelRate", 2)} onChange={set("wheelRate", 2)} />
            <ParamInput label="Wheel rate RR" def={p.wheelRateRear} value={getField(form, "wheelRate", 3)} onChange={set("wheelRate", 3)} />
          </Row>
          <Row>
            <ParamInput label="Bump stop rate FL" def={p.bumpstopRateFront} value={getField(form, "bumpStopRate", 0)} onChange={set("bumpStopRate", 0)} />
            <ParamInput label="Bump stop rate FR" def={p.bumpstopRateFront} value={getField(form, "bumpStopRate", 1)} onChange={set("bumpStopRate", 1)} />
            <ParamInput label="Bump stop rate RL" def={p.bumpstopRateRear} value={getField(form, "bumpStopRate", 2)} onChange={set("bumpStopRate", 2)} />
            <ParamInput label="Bump stop rate RR" def={p.bumpstopRateRear} value={getField(form, "bumpStopRate", 3)} onChange={set("bumpStopRate", 3)} />
          </Row>
          <Row>
            <ParamInput label="Bump stop range FL" def={p.bumpstopRangeFront} value={getField(form, "bumpStopWindow", 0)} onChange={set("bumpStopWindow", 0)} />
            <ParamInput label="Bump stop range FR" def={p.bumpstopRangeFront} value={getField(form, "bumpStopWindow", 1)} onChange={set("bumpStopWindow", 1)} />
            <ParamInput label="Bump stop range RL" def={p.bumpstopRangeRear} value={getField(form, "bumpStopWindow", 2)} onChange={set("bumpStopWindow", 2)} />
            <ParamInput label="Bump stop range RR" def={p.bumpstopRangeRear} value={getField(form, "bumpStopWindow", 3)} onChange={set("bumpStopWindow", 3)} />
          </Row>
          <Row>
            <ParamInput label="Brake bias" def={p.brakeBias} value={form.brakeBias} onChange={set("brakeBias")} />
            <ParamInput label="Brake power" def={p.brakePower} value={form.brakeTorque} onChange={set("brakeTorque")} />
          </Row>
        </Section>

        {/* Dampers */}
        <Section title="Dampers">
          <Row>
            <ParamInput label="Bump slow FL" def={p.damperBumpSlow} value={getField(form, "bumpSlow", 0)} onChange={set("bumpSlow", 0)} />
            <ParamInput label="Bump slow FR" def={p.damperBumpSlow} value={getField(form, "bumpSlow", 1)} onChange={set("bumpSlow", 1)} />
            <ParamInput label="Bump slow RL" def={p.damperBumpSlow} value={getField(form, "bumpSlow", 2)} onChange={set("bumpSlow", 2)} />
            <ParamInput label="Bump slow RR" def={p.damperBumpSlow} value={getField(form, "bumpSlow", 3)} onChange={set("bumpSlow", 3)} />
          </Row>
          <Row>
            <ParamInput label="Bump fast FL" def={p.damperBumpFast} value={getField(form, "bumpFast", 0)} onChange={set("bumpFast", 0)} />
            <ParamInput label="Bump fast FR" def={p.damperBumpFast} value={getField(form, "bumpFast", 1)} onChange={set("bumpFast", 1)} />
            <ParamInput label="Bump fast RL" def={p.damperBumpFast} value={getField(form, "bumpFast", 2)} onChange={set("bumpFast", 2)} />
            <ParamInput label="Bump fast RR" def={p.damperBumpFast} value={getField(form, "bumpFast", 3)} onChange={set("bumpFast", 3)} />
          </Row>
          <Row>
            <ParamInput label="Rebound slow FL" def={p.damperReboundSlow} value={getField(form, "reboundSlow", 0)} onChange={set("reboundSlow", 0)} />
            <ParamInput label="Rebound slow FR" def={p.damperReboundSlow} value={getField(form, "reboundSlow", 1)} onChange={set("reboundSlow", 1)} />
            <ParamInput label="Rebound slow RL" def={p.damperReboundSlow} value={getField(form, "reboundSlow", 2)} onChange={set("reboundSlow", 2)} />
            <ParamInput label="Rebound slow RR" def={p.damperReboundSlow} value={getField(form, "reboundSlow", 3)} onChange={set("reboundSlow", 3)} />
          </Row>
          <Row>
            <ParamInput label="Rebound fast FL" def={p.damperReboundFast} value={getField(form, "reboundFast", 0)} onChange={set("reboundFast", 0)} />
            <ParamInput label="Rebound fast FR" def={p.damperReboundFast} value={getField(form, "reboundFast", 1)} onChange={set("reboundFast", 1)} />
            <ParamInput label="Rebound fast RL" def={p.damperReboundFast} value={getField(form, "reboundFast", 2)} onChange={set("reboundFast", 2)} />
            <ParamInput label="Rebound fast RR" def={p.damperReboundFast} value={getField(form, "reboundFast", 3)} onChange={set("reboundFast", 3)} />
          </Row>
        </Section>

        {/* Aero */}
        <Section title="Aero">
          <Row>
            <ParamInput label="Ride height front" def={p.rideHeightFront} value={form.rideHeightFront} onChange={set("rideHeightFront")} />
            <ParamInput label="Ride height rear" def={p.rideHeightRear} value={form.rideHeightRear} onChange={set("rideHeightRear")} />
          </Row>
          <Row>
            <ParamInput label="Splitter" def={p.splitter} value={form.splitter} onChange={set("splitter")} />
            <ParamInput label="Rear wing" def={p.rearWing} value={form.rearWing} onChange={set("rearWing")} />
          </Row>
          <Row>
            <ParamInput label="Brake ducts front" def={p.brakeDucts} value={form.brakeDuctFront} onChange={set("brakeDuctFront")} />
            <ParamInput label="Brake ducts rear" def={p.brakeDucts} value={form.brakeDuctRear} onChange={set("brakeDuctRear")} />
          </Row>
        </Section>

        {/* Electronics */}
        <Section title="Electronics">
          <Row>
            <ParamInput label="TC1" def={p.tractionControl} value={form.tC1} onChange={set("tC1")} />
            <ParamInput label="TC2" def={p.tractionControl2} value={form.tC2} onChange={set("tC2")} />
            <ParamInput label="ABS" def={p.abs} value={form.abs} onChange={set("abs")} />
            <ParamInput label="ECU map" def={p.ecuMap} value={form.eCUMap} onChange={set("eCUMap")} />
            <PlainInput label="Fuel mix" value={form.fuelMix} onChange={set("fuelMix")} />
          </Row>
        </Section>

        {/* Drivetrain */}
        <Section title="Drivetrain">
          <Row>
            <ParamInput label="Diff preload" def={p.preloadDifferential} value={form.preload} onChange={set("preload")} />
          </Row>
        </Section>

        {/* Strategy */}
        <Section title="Strategy">
          <Row>
            <PlainInput label="Fuel (L)" value={form.fuel} onChange={set("fuel")} step={0.1} />
            <PlainInput label="Tyre set" value={form.tyreSet} onChange={set("tyreSet")} />
            <PadSelect label="Front brake pad" value={form.frontBrakePadCompound} onChange={set("frontBrakePadCompound")} />
            <PadSelect label="Rear brake pad" value={form.rearBrakePadCompound} onChange={set("rearBrakePadCompound")} />
          </Row>
        </Section>

        {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

        {/* Save */}
        <section className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {saving ? "Saving…" : loadedSetupId ? "Update saved setup" : "Save setup"}
          </button>
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
