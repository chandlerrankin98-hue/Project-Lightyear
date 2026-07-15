import { describe, expect, it } from "vitest";
import { decodeParam, encodeParam, decodeTuple, encodeTuple } from "../codec";
import type { ParamDef } from "../types";

describe("linear encoding", () => {
  const tyrePressure: ParamDef = {
    encoding: "linear",
    unit: "psi",
    min: 20.3,
    max: 35,
    increment: 0.1,
    confirmed: true,
    source: "test",
  };

  it("decodes a raw index to its real-unit value", () => {
    expect(decodeParam(65, tyrePressure)).toBeCloseTo(26.8, 6);
    expect(decodeParam(0, tyrePressure)).toBeCloseTo(20.3, 6);
  });

  it("avoids float noise (e.g. 20.99999999999996)", () => {
    const value = decodeParam(7, tyrePressure);
    expect(value).toBe(21.0);
  });

  it("encodes a real-unit value back to the nearest raw index", () => {
    expect(encodeParam(26.8, tyrePressure)).toBe(65);
    expect(encodeParam(20.3, tyrePressure)).toBe(0);
  });

  it("round-trips decode -> encode for every index in range", () => {
    for (let i = 0; i <= 147; i++) {
      const decoded = decodeParam(i, tyrePressure);
      expect(encodeParam(decoded, tyrePressure)).toBe(i);
    }
  });
});

describe("lut encoding", () => {
  const caster: ParamDef = {
    encoding: "lut",
    unit: "deg",
    lut: [6.5, 6.7, 6.9, 7.1, 7.3, 7.5, 7.7, 7.8, 8.0, 8.2, 8.4],
    confirmed: true,
    source: "test",
  };

  it("decodes a raw index to the lut value", () => {
    expect(decodeParam(10, caster)).toBe(8.4);
    expect(decodeParam(0, caster)).toBe(6.5);
  });

  it("throws for an out-of-range index", () => {
    expect(() => decodeParam(99, caster)).toThrow(/out of range/);
  });

  it("encodes back to the exact matching index", () => {
    expect(encodeParam(8.4, caster)).toBe(10);
    expect(encodeParam(6.5, caster)).toBe(0);
  });

  it("encodes to the nearest index when the value isn't an exact lut entry", () => {
    expect(encodeParam(8.35, caster)).toBe(10); // closer to 8.4 than 8.2
    expect(encodeParam(8.05, caster)).toBe(8); // closer to 8.0 than 8.2
  });
});

describe("rawIndex encoding", () => {
  const rearWing: ParamDef = {
    encoding: "rawIndex",
    unit: "clicks",
    min: 0,
    max: 12,
    increment: 1,
    confirmed: true,
    source: "test",
  };

  it("passes the raw index through unchanged with no offset", () => {
    expect(decodeParam(7, rearWing)).toBe(7);
    expect(encodeParam(7, rearWing)).toBe(7);
  });

  it("applies a displayOffset when present (e.g. McLaren/Mercedes +1 display convention)", () => {
    const withOffset: ParamDef = { ...rearWing, displayOffset: 1 };
    expect(decodeParam(0, withOffset)).toBe(1);
    expect(encodeParam(1, withOffset)).toBe(0);
  });
});

describe("tuple helpers", () => {
  const brakeDucts: ParamDef = { encoding: "linear", unit: "clicks", min: 0, max: 6, increment: 1, confirmed: true, source: "test" };

  it("decodes and encodes every element with the same param def", () => {
    const raw = [0, 3, 6, 2] as const;
    const decoded = decodeTuple(raw, brakeDucts);
    expect(decoded).toEqual([0, 3, 6, 2]);
    expect(encodeTuple(decoded, brakeDucts)).toEqual([0, 3, 6, 2]);
  });
});
