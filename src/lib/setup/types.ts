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

/** [FrontLeft, FrontRight, RearLeft, RearRight] — matches ACC's on-disk wheel order. */
export type WheelTuple = [number, number, number, number];

/**
 * ACC's on-disk setup JSON schema, per Documents/Assetto Corsa Competizione/Setups/<Car>/<Track>/*.json.
 * Fields not covered by our per-car parameter tables (strategy, pit strategy, fuel mix, tyre
 * compound choice, engine-computed outputs) are typed loosely and passed through untouched by
 * readSetup/writeSetup rather than interpreted.
 */
export interface RawSetup {
  carName: string;
  basicSetup: {
    tyres: {
      tyreCompound: number;
      tyrePressure: WheelTuple;
    };
    alignment: {
      camber: WheelTuple;
      toe: WheelTuple;
      casterLF: number;
      casterRF: number;
      steerRatio: number;
    };
    electronics: {
      tC1: number;
      tC2: number;
      abs: number;
      eCUMap: number;
      fuelMix: number;
      telemetryLaps: number;
    };
    strategy: Record<string, unknown>;
  };
  advancedSetup: {
    mechanicalBalance: {
      aRBFront: number;
      aRBRear: number;
      wheelRate: WheelTuple;
      bumpStopRateUp: WheelTuple;
      bumpStopRateDn: WheelTuple;
      bumpStopWindow: WheelTuple;
      brakeTorque: number;
      brakeBias: number;
    };
    dampers: {
      bumpSlow: WheelTuple;
      bumpFast: WheelTuple;
      reboundSlow: WheelTuple;
      reboundFast: WheelTuple;
    };
    aeroBalance: {
      rideHeight: WheelTuple;
      splitter: number;
      rearWing: number;
      brakeDuct: [number, number];
    };
    drivetrain: {
      preload: number;
    };
  };
  trackBopType: number;
}

/** Real-unit view of a setup, produced by readSetup / consumed by writeSetup. */
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
  bumpStopRateUp: WheelTuple;
  bumpStopRateDn: WheelTuple;
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
}

export const WHEEL = { FL: 0, FR: 1, RL: 2, RR: 3 } as const;
