import type { CarData, DisplaySetup, ParamDef } from "@/lib/setup/types";

function describeRange(def: ParamDef): string {
  if (def.encoding === "lut") {
    return `lut(${def.lut?.length ?? 0} steps, ${def.lut?.[0]}..${def.lut?.[def.lut.length - 1]})`;
  }
  const max = def.max === null || def.max === undefined ? "unknown" : def.max;
  return `min=${def.min}, max=${max}, increment=${def.increment}`;
}

/** Best-effort current value for a car-parameter key, pulled from a DisplaySetup. Not every
 * DisplaySetup field maps 1:1 to a car.parameters key (some are per-position, some per-wheel) —
 * this picks one representative value per key for context, not a full round-trip mapping. */
function currentValue(key: string, display: DisplaySetup): number | number[] | undefined {
  switch (key) {
    case "tyrePressure":
      return display.tyrePressure;
    case "camberFront":
      return [display.camber[0], display.camber[1]];
    case "camberRear":
      return [display.camber[2], display.camber[3]];
    case "toeFront":
      return [display.toe[0], display.toe[1]];
    case "toeRear":
      return [display.toe[2], display.toe[3]];
    case "caster":
      return [display.casterLF, display.casterRF];
    case "brakeBias":
      return display.brakeBias;
    case "brakePower":
      return display.brakeTorque;
    case "preloadDifferential":
      return display.preload;
    case "steeringRatio":
      return display.steerRatio;
    case "wheelRateFront":
      return [display.wheelRate[0], display.wheelRate[1]];
    case "wheelRateRear":
      return [display.wheelRate[2], display.wheelRate[3]];
    case "bumpstopRateFront":
      return [display.bumpStopRate[0], display.bumpStopRate[1]];
    case "bumpstopRateRear":
      return [display.bumpStopRate[2], display.bumpStopRate[3]];
    case "rideHeightFront":
      return display.rideHeightFront;
    case "rideHeightRear":
      return display.rideHeightRear;
    case "antiRollBarFront":
      return display.aRBFront;
    case "antiRollBarRear":
      return display.aRBRear;
    case "bumpstopRangeFront":
      return [display.bumpStopWindow[0], display.bumpStopWindow[1]];
    case "bumpstopRangeRear":
      return [display.bumpStopWindow[2], display.bumpStopWindow[3]];
    case "damperBumpSlow":
      return display.bumpSlow;
    case "damperBumpFast":
      return display.bumpFast;
    case "damperReboundSlow":
      return display.reboundSlow;
    case "damperReboundFast":
      return display.reboundFast;
    case "rearWing":
      return display.rearWing;
    case "splitter":
      return display.splitter;
    case "brakeDucts":
      return [display.brakeDuctFront, display.brakeDuctRear];
    case "tractionControl":
      return display.tC1;
    case "tractionControl2":
      return display.tC2;
    case "abs":
      return display.abs;
    case "ecuMap":
      return display.eCUMap;
    default:
      return undefined;
  }
}

/** Renders the car's parameter table (and, if given, the driver's current setup values) as a
 * compact text block for the Claude prompt. */
export function buildCarContext(car: CarData, display?: DisplaySetup): string {
  const lines = [`Car: ${car.displayName} (${car.class}, ${car.tyreCompound} tyres)`, "Parameters:"];

  for (const [key, def] of Object.entries(car.parameters)) {
    const range = describeRange(def);
    const confirmed = def.confirmed ? "confirmed" : "UNCONFIRMED";
    let line = `- ${key}: unit=${def.unit}, ${range}, ${confirmed}`;
    if (display) {
      const value = currentValue(key, display);
      if (value !== undefined) {
        line += `, current=${Array.isArray(value) ? `[${value.join(", ")}]` : value}`;
      }
    }
    lines.push(line);
  }

  if (display) {
    lines.push(
      `Strategy: fuel=${display.fuel}L, tyreSet=${display.tyreSet}, brakePads F/R=${display.frontBrakePadCompound}/${display.rearBrakePadCompound}, fuelMix=${display.fuelMix}`
    );
  }

  return lines.join("\n");
}
