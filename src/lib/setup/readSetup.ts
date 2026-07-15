import { decodeParam, decodeTuple } from "./codec";
import type { CarData, DisplaySetup, RawSetup, WheelTuple } from "./types";
import { WHEEL } from "./types";

/**
 * Converts an ACC on-disk setup (raw click indices) into real engineering units.
 *
 * Only fields backed by a per-car parameter definition are converted. Fields the car data
 * doesn't model (tyre compound choice, fuel mix, strategy, pit strategy, trackBopType,
 * carName, engine-computed outputs) are intentionally left out of the result — see
 * writeSetup, which carries them forward from a base setup instead of guessing at them.
 */
export function readSetup(raw: RawSetup, car: CarData): DisplaySetup {
  const p = car.parameters;

  const camberFront = decodeParam(raw.basicSetup.alignment.camber[WHEEL.FL], p.camberFront);
  const camberFrontR = decodeParam(raw.basicSetup.alignment.camber[WHEEL.FR], p.camberFront);
  const camberRearL = decodeParam(raw.basicSetup.alignment.camber[WHEEL.RL], p.camberRear);
  const camberRearR = decodeParam(raw.basicSetup.alignment.camber[WHEEL.RR], p.camberRear);

  const toeFrontL = decodeParam(raw.basicSetup.alignment.toe[WHEEL.FL], p.toeFront);
  const toeFrontR = decodeParam(raw.basicSetup.alignment.toe[WHEEL.FR], p.toeFront);
  const toeRearL = decodeParam(raw.basicSetup.alignment.toe[WHEEL.RL], p.toeRear);
  const toeRearR = decodeParam(raw.basicSetup.alignment.toe[WHEEL.RR], p.toeRear);

  const wheelRateFront = decodeTuple(raw.advancedSetup.mechanicalBalance.wheelRate, p.wheelRateFront);
  const wheelRateRear = decodeTuple(raw.advancedSetup.mechanicalBalance.wheelRate, p.wheelRateRear);

  // Race-Element's per-car source only exposes one bump-stop-rate formula per wheel (no
  // separate up/down variant), so the same param def is applied to both raw arrays here.
  const bumpStopRateUpFront = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopRateUp, p.bumpstopRateFront);
  const bumpStopRateUpRear = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopRateUp, p.bumpstopRateRear);
  const bumpStopRateDnFront = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopRateDn, p.bumpstopRateFront);
  const bumpStopRateDnRear = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopRateDn, p.bumpstopRateRear);

  const bumpStopWindowFront = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopWindow, p.bumpstopRangeFront);
  const bumpStopWindowRear = decodeTuple(raw.advancedSetup.mechanicalBalance.bumpStopWindow, p.bumpstopRangeRear);

  return {
    tyrePressure: decodeTuple(raw.basicSetup.tyres.tyrePressure, p.tyrePressure) as WheelTuple,
    camber: [camberFront, camberFrontR, camberRearL, camberRearR],
    toe: [toeFrontL, toeFrontR, toeRearL, toeRearR],
    casterLF: decodeParam(raw.basicSetup.alignment.casterLF, p.caster),
    casterRF: decodeParam(raw.basicSetup.alignment.casterRF, p.caster),
    steerRatio: decodeParam(raw.basicSetup.alignment.steerRatio, p.steeringRatio),

    tC1: decodeParam(raw.basicSetup.electronics.tC1, p.tractionControl),
    tC2: decodeParam(raw.basicSetup.electronics.tC2, p.tractionControl2),
    abs: decodeParam(raw.basicSetup.electronics.abs, p.abs),
    eCUMap: decodeParam(raw.basicSetup.electronics.eCUMap, p.ecuMap),

    aRBFront: decodeParam(raw.advancedSetup.mechanicalBalance.aRBFront, p.antiRollBarFront),
    aRBRear: decodeParam(raw.advancedSetup.mechanicalBalance.aRBRear, p.antiRollBarRear),
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
    brakeTorque: decodeParam(raw.advancedSetup.mechanicalBalance.brakeTorque, p.brakePower),
    brakeBias: decodeParam(raw.advancedSetup.mechanicalBalance.brakeBias, p.brakeBias),

    bumpSlow: decodeTuple(raw.advancedSetup.dampers.bumpSlow, p.damperBumpSlow) as WheelTuple,
    bumpFast: decodeTuple(raw.advancedSetup.dampers.bumpFast, p.damperBumpFast) as WheelTuple,
    reboundSlow: decodeTuple(raw.advancedSetup.dampers.reboundSlow, p.damperReboundSlow) as WheelTuple,
    reboundFast: decodeTuple(raw.advancedSetup.dampers.reboundFast, p.damperReboundFast) as WheelTuple,

    rideHeightFront: decodeParam(raw.advancedSetup.aeroBalance.rideHeight[WHEEL.FL], p.rideHeightFront),
    rideHeightRear: decodeParam(raw.advancedSetup.aeroBalance.rideHeight[WHEEL.RL], p.rideHeightRear),
    splitter: decodeParam(raw.advancedSetup.aeroBalance.splitter, p.splitter),
    rearWing: decodeParam(raw.advancedSetup.aeroBalance.rearWing, p.rearWing),
    brakeDuctFront: decodeParam(raw.advancedSetup.aeroBalance.brakeDuct[0], p.brakeDucts),
    brakeDuctRear: decodeParam(raw.advancedSetup.aeroBalance.brakeDuct[1], p.brakeDucts),

    preload: decodeParam(raw.advancedSetup.drivetrain.preload, p.preloadDifferential),
  };
}
