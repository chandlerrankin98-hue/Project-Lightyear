import { encodeParam, encodeTuple } from "./codec";
import type { CarData, DisplaySetup, RawSetup } from "./types";
import { WHEEL } from "./types";

/**
 * Converts real-unit display values back into an ACC-loadable setup JSON.
 *
 * `base` supplies every field writeSetup doesn't manage (carName, tyre compound choice, fuel
 * mix, strategy, pit strategy, trackBopType, and rideHeight's unused wheel indices 1 & 3) so the
 * result is always a complete, valid setup — typically `base` is the setup that was fed into
 * readSetup in the first place.
 */
export function writeSetup(display: DisplaySetup, car: CarData, base: RawSetup): RawSetup {
  const p = car.parameters;

  const wheelRateFront = encodeTuple(display.wheelRate, p.wheelRateFront);
  const wheelRateRear = encodeTuple(display.wheelRate, p.wheelRateRear);
  const bumpStopRateUpFront = encodeTuple(display.bumpStopRateUp, p.bumpstopRateFront);
  const bumpStopRateUpRear = encodeTuple(display.bumpStopRateUp, p.bumpstopRateRear);
  const bumpStopRateDnFront = encodeTuple(display.bumpStopRateDn, p.bumpstopRateFront);
  const bumpStopRateDnRear = encodeTuple(display.bumpStopRateDn, p.bumpstopRateRear);
  const bumpStopWindowFront = encodeTuple(display.bumpStopWindow, p.bumpstopRangeFront);
  const bumpStopWindowRear = encodeTuple(display.bumpStopWindow, p.bumpstopRangeRear);

  const rideHeight: RawSetup["advancedSetup"]["aeroBalance"]["rideHeight"] = [
    ...base.advancedSetup.aeroBalance.rideHeight,
  ] as RawSetup["advancedSetup"]["aeroBalance"]["rideHeight"];
  rideHeight[WHEEL.FL] = encodeParam(display.rideHeightFront, p.rideHeightFront);
  rideHeight[WHEEL.RL] = encodeParam(display.rideHeightRear, p.rideHeightRear);

  return {
    ...base,
    basicSetup: {
      ...base.basicSetup,
      tyres: {
        ...base.basicSetup.tyres,
        tyrePressure: encodeTuple(display.tyrePressure, p.tyrePressure) as RawSetup["basicSetup"]["tyres"]["tyrePressure"],
      },
      alignment: {
        ...base.basicSetup.alignment,
        camber: [
          encodeParam(display.camber[WHEEL.FL], p.camberFront),
          encodeParam(display.camber[WHEEL.FR], p.camberFront),
          encodeParam(display.camber[WHEEL.RL], p.camberRear),
          encodeParam(display.camber[WHEEL.RR], p.camberRear),
        ],
        toe: [
          encodeParam(display.toe[WHEEL.FL], p.toeFront),
          encodeParam(display.toe[WHEEL.FR], p.toeFront),
          encodeParam(display.toe[WHEEL.RL], p.toeRear),
          encodeParam(display.toe[WHEEL.RR], p.toeRear),
        ],
        casterLF: encodeParam(display.casterLF, p.caster),
        casterRF: encodeParam(display.casterRF, p.caster),
        steerRatio: encodeParam(display.steerRatio, p.steeringRatio),
      },
      electronics: {
        ...base.basicSetup.electronics,
        tC1: encodeParam(display.tC1, p.tractionControl),
        tC2: encodeParam(display.tC2, p.tractionControl2),
        abs: encodeParam(display.abs, p.abs),
        eCUMap: encodeParam(display.eCUMap, p.ecuMap),
      },
    },
    advancedSetup: {
      ...base.advancedSetup,
      mechanicalBalance: {
        ...base.advancedSetup.mechanicalBalance,
        aRBFront: encodeParam(display.aRBFront, p.antiRollBarFront),
        aRBRear: encodeParam(display.aRBRear, p.antiRollBarRear),
        wheelRate: [wheelRateFront[WHEEL.FL], wheelRateFront[WHEEL.FR], wheelRateRear[WHEEL.RL], wheelRateRear[WHEEL.RR]],
        bumpStopRateUp: [
          bumpStopRateUpFront[WHEEL.FL],
          bumpStopRateUpFront[WHEEL.FR],
          bumpStopRateUpRear[WHEEL.RL],
          bumpStopRateUpRear[WHEEL.RR],
        ],
        bumpStopRateDn: [
          bumpStopRateDnFront[WHEEL.FL],
          bumpStopRateDnFront[WHEEL.FR],
          bumpStopRateDnRear[WHEEL.RL],
          bumpStopRateDnRear[WHEEL.RR],
        ],
        bumpStopWindow: [
          bumpStopWindowFront[WHEEL.FL],
          bumpStopWindowFront[WHEEL.FR],
          bumpStopWindowRear[WHEEL.RL],
          bumpStopWindowRear[WHEEL.RR],
        ],
        brakeTorque: encodeParam(display.brakeTorque, p.brakePower),
        brakeBias: encodeParam(display.brakeBias, p.brakeBias),
      },
      dampers: {
        bumpSlow: encodeTuple(display.bumpSlow, p.damperBumpSlow) as RawSetup["advancedSetup"]["dampers"]["bumpSlow"],
        bumpFast: encodeTuple(display.bumpFast, p.damperBumpFast) as RawSetup["advancedSetup"]["dampers"]["bumpFast"],
        reboundSlow: encodeTuple(display.reboundSlow, p.damperReboundSlow) as RawSetup["advancedSetup"]["dampers"]["reboundSlow"],
        reboundFast: encodeTuple(display.reboundFast, p.damperReboundFast) as RawSetup["advancedSetup"]["dampers"]["reboundFast"],
      },
      aeroBalance: {
        ...base.advancedSetup.aeroBalance,
        rideHeight,
        splitter: encodeParam(display.splitter, p.splitter),
        rearWing: encodeParam(display.rearWing, p.rearWing),
        brakeDuct: [encodeParam(display.brakeDuctFront, p.brakeDucts), encodeParam(display.brakeDuctRear, p.brakeDucts)],
      },
      drivetrain: {
        ...base.advancedSetup.drivetrain,
        preload: encodeParam(display.preload, p.preloadDifferential),
      },
    },
  };
}
