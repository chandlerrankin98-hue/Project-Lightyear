import { describe, expect, it } from "vitest";
import { readSetup } from "../readSetup";
import { writeSetup } from "../writeSetup";
import { getCarData } from "../carData";
import type { RawSetup } from "../types";

// A hand-built, self-generated sample setup (not a real player's or commercial setup file) for
// the Porsche 992 GT3 R — the one car with fully confirmed parameter ranges in our data, so every
// decoded value here can be checked by hand against the known min/increment/lut constants.
function samplePorscheRawSetup(): RawSetup {
  return {
    carName: "porsche_992_gt3_r",
    basicSetup: {
      tyres: {
        tyreCompound: 0,
        tyrePressure: [65, 65, 65, 65],
      },
      alignment: {
        camber: [15, 15, 13, 13],
        toe: [30, 30, 45, 45],
        casterLF: 10,
        casterRF: 12,
        steerRatio: 3,
      },
      electronics: {
        tC1: 6,
        tC2: 4,
        abs: 5,
        eCUMap: 2,
        fuelMix: 0,
        telemetryLaps: 2,
      },
      strategy: { fuel: 60, tyreSet: 1 },
    },
    advancedSetup: {
      mechanicalBalance: {
        aRBFront: 2,
        aRBRear: 4,
        wheelRate: [2, 4, 6, 8],
        bumpStopRateUp: [5, 7, 10, 12],
        bumpStopRateDn: [3, 6, 9, 11],
        bumpStopWindow: [10, 12, 20, 25],
        brakeTorque: 10,
        brakeBias: 50,
      },
      dampers: {
        bumpSlow: [5, 6, 7, 8],
        bumpFast: [3, 4, 5, 6],
        reboundSlow: [9, 10, 11, 12],
        reboundFast: [2, 3, 4, 5],
      },
      aeroBalance: {
        rideHeight: [10, 999, 15, 999], // indices 1 & 3 are unused by the game/Race-Element
        splitter: 0,
        rearWing: 7,
        brakeDuct: [3, 4],
      },
      drivetrain: {
        preload: 15,
      },
    },
    trackBopType: 0,
  };
}

describe("readSetup (Porsche 992 GT3 R)", () => {
  const car = getCarData("porsche_992_gt3_r");
  const raw = samplePorscheRawSetup();
  const display = readSetup(raw, car);

  it("decodes tyre pressure (linear, shared GT3 constant)", () => {
    expect(display.tyrePressure).toEqual([26.8, 26.8, 26.8, 26.8]);
  });

  it("decodes camber front/rear with their distinct formulas", () => {
    expect(display.camber[0]).toBeCloseTo(-2.5, 6); // front: -4 + 0.1*15
    expect(display.camber[2]).toBeCloseTo(-2.2, 6); // rear: -3.5 + 0.1*13
  });

  it("decodes toe front/rear", () => {
    expect(display.toe[0]).toBeCloseTo(-0.1, 6); // -0.4 + 0.01*30
    expect(display.toe[2]).toBeCloseTo(0.05, 6); // -0.4 + 0.01*45
  });

  it("decodes caster via the per-car LUT", () => {
    expect(display.casterLF).toBe(8.4); // casters[10]
    expect(display.casterRF).toBe(8.8); // casters[12]
  });

  it("decodes steering ratio", () => {
    expect(display.steerRatio).toBe(14); // 11 + 3
  });

  it("decodes electronics (TC1/TC2/ABS/ECU map)", () => {
    expect(display.tC1).toBe(6);
    expect(display.tC2).toBe(4);
    expect(display.abs).toBe(5);
    expect(display.eCUMap).toBe(3); // 1 + 2*1
  });

  it("decodes wheel rate via front/rear LUTs", () => {
    expect(display.wheelRate).toEqual([114000, 127000, 193000, 212000]);
  });

  it("decodes brake bias and brake torque(power)", () => {
    expect(display.brakeBias).toBeCloseTo(53, 6); // 43 + 0.2*50
    expect(display.brakeTorque).toBe(90); // 80 + 10
  });

  it("decodes preload differential", () => {
    expect(display.preload).toBe(170); // 20 + 15*10
  });

  it("decodes ride height from wheel indices 0 (front) and 2 (rear) only", () => {
    expect(display.rideHeightFront).toBe(63); // 53 + 10
    expect(display.rideHeightRear).toBe(70); // 55 + 15
  });

  it("decodes splitter as locked at 0 for this car", () => {
    expect(display.splitter).toBe(0);
  });

  it("decodes rear wing and brake ducts as raw click indices", () => {
    expect(display.rearWing).toBe(7);
    expect(display.brakeDuctFront).toBe(3);
    expect(display.brakeDuctRear).toBe(4);
  });

  it("decodes ARB and dampers as raw click indices", () => {
    expect(display.aRBFront).toBe(2);
    expect(display.aRBRear).toBe(4);
    expect(display.bumpSlow).toEqual([5, 6, 7, 8]);
    expect(display.reboundFast).toEqual([2, 3, 4, 5]);
  });
});

describe("writeSetup round-trip (Porsche 992 GT3 R)", () => {
  const car = getCarData("porsche_992_gt3_r");
  const raw = samplePorscheRawSetup();

  it("readSetup -> writeSetup reproduces the exact original raw setup", () => {
    const display = readSetup(raw, car);
    const roundTripped = writeSetup(display, car, raw);
    expect(roundTripped).toEqual(raw);
  });

  it("preserves fields writeSetup doesn't manage (carName, strategy, tyreCompound, unused ride-height slots)", () => {
    const display = readSetup(raw, car);
    const roundTripped = writeSetup(display, car, raw);
    expect(roundTripped.carName).toBe(raw.carName);
    expect(roundTripped.basicSetup.strategy).toEqual(raw.basicSetup.strategy);
    expect(roundTripped.basicSetup.tyres.tyreCompound).toBe(raw.basicSetup.tyres.tyreCompound);
    expect(roundTripped.advancedSetup.aeroBalance.rideHeight[1]).toBe(999);
    expect(roundTripped.advancedSetup.aeroBalance.rideHeight[3]).toBe(999);
  });

  it("readSetup(writeSetup(x)) is stable across a second round trip", () => {
    const display1 = readSetup(raw, car);
    const rawAgain = writeSetup(display1, car, raw);
    const display2 = readSetup(rawAgain, car);
    expect(display2).toEqual(display1);
  });
});
