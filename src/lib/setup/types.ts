export type ParamEncoding = "linear" | "lut" | "rawIndex";

export interface ParamDef {
  encoding: ParamEncoding;
  unit: string;
  min?: number;
  max?: number | null;
  increment?: number;
  lut?: number[];
  confirmed: boolean;
  source: string;
  perWheel?: boolean;
  perPosition?: boolean;
  displayOffset?: number;
  note?: string;
}

export interface CarParameters {
  tyrePressure: ParamDef;
  camberFront: ParamDef;
  camberRear: ParamDef;
  toeFront: ParamDef;
  toeRear: ParamDef;
  caster: ParamDef;
  brakeBias: ParamDef;
  brakePower: ParamDef;
  preloadDifferential: ParamDef;
  steeringRatio: ParamDef;
  wheelRateFront: ParamDef;
  wheelRateRear: ParamDef;
  bumpstopRateFront: ParamDef;
  bumpstopRateRear: ParamDef;
  rideHeightFront: ParamDef;
  rideHeightRear: ParamDef;
  antiRollBarFront: ParamDef;
  antiRollBarRear: ParamDef;
  bumpstopRangeFront: ParamDef;
  bumpstopRangeRear: ParamDef;
  damperBumpSlow: ParamDef;
  damperBumpFast: ParamDef;
  damperReboundSlow: ParamDef;
  damperReboundFast: ParamDef;
  rearWing: ParamDef;
  splitter: ParamDef;
  brakeDucts: ParamDef;
  tractionControl: ParamDef;
  tractionControl2: ParamDef;
  abs: ParamDef;
  ecuMap: ParamDef;
}

export interface CarData {
  carId: string;
  displayName: string;
  class: string;
  tyreCompound: string;
  sourceNote: string;
  parameters: CarParameters;
}

/** [FrontLeft, FrontRight, RearLeft, RearRight] — wheel order used throughout the setup model. */
export type WheelTuple = [number, number, number, number];

/**
 * A complete setup in real engineering units — the canonical shape produced and consumed by the
 * manual entry form. There is no raw ACC setup file in this app (PS5 has no file access), so this
 * is the source of truth rather than a "view" derived from decoding something else.
 */
export interface DisplaySetup {
  tyrePressure: WheelTuple;
  camber: WheelTuple;
  toe: WheelTuple;
  casterLF: number;
  casterRF: number;
  steerRatio: number;
  tC1: number;
  tC2: number;
  abs: number;
  eCUMap: number;
  aRBFront: number;
  aRBRear: number;
  wheelRate: WheelTuple;
  bumpStopRate: WheelTuple;
  bumpStopWindow: WheelTuple;
  brakeTorque: number;
  brakeBias: number;
  bumpSlow: WheelTuple;
  bumpFast: WheelTuple;
  reboundSlow: WheelTuple;
  reboundFast: WheelTuple;
  rideHeightFront: number;
  rideHeightRear: number;
  splitter: number;
  rearWing: number;
  brakeDuctFront: number;
  brakeDuctRear: number;
  preload: number;

  /** No confirmed per-car range in the Step 2 car data — plain integer, ACC typically 1-6. */
  fuelMix: number;

  fuel: number;
  tyreSet: number;
  /** ACC GT3 pad compounds: 1 sprint/qualifying, 2 endurance, 3 wet/cold, 4 practice-only. */
  frontBrakePadCompound: number;
  rearBrakePadCompound: number;
}

export const WHEEL = { FL: 0, FR: 1, RL: 2, RR: 3 } as const;
