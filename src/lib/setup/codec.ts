import type { ParamDef } from "./types";

/** Rounds to a sane number of decimals to avoid float noise like 20.999999999999996. */
function cleanFloat(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Converts a raw ACC click index to its real-unit display value for the given parameter. */
export function decodeParam(rawValue: number, param: ParamDef): number {
  switch (param.encoding) {
    case "lut": {
      if (!param.lut) throw new Error("lut encoding requires a lut array");
      const value = param.lut[rawValue];
      if (value === undefined) {
        throw new Error(`raw index ${rawValue} is out of range for lut of length ${param.lut.length}`);
      }
      return value;
    }
    case "linear": {
      if (param.min === undefined || param.increment === undefined) {
        throw new Error("linear encoding requires min and increment");
      }
      return cleanFloat(param.min + rawValue * param.increment);
    }
    case "rawIndex":
      return rawValue + (param.displayOffset ?? 0);
    default:
      throw new Error(`unknown encoding: ${param.encoding satisfies never}`);
  }
}

/** Converts a real-unit display value back to the nearest valid raw ACC click index. */
export function encodeParam(displayValue: number, param: ParamDef): number {
  switch (param.encoding) {
    case "lut": {
      if (!param.lut) throw new Error("lut encoding requires a lut array");
      let closestIndex = 0;
      let closestDistance = Infinity;
      for (let i = 0; i < param.lut.length; i++) {
        const distance = Math.abs(param.lut[i] - displayValue);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      return closestIndex;
    }
    case "linear": {
      if (param.min === undefined || param.increment === undefined) {
        throw new Error("linear encoding requires min and increment");
      }
      return Math.round((displayValue - param.min) / param.increment);
    }
    case "rawIndex":
      return Math.round(displayValue - (param.displayOffset ?? 0));
    default:
      throw new Error(`unknown encoding: ${param.encoding satisfies never}`);
  }
}

/** Decodes each element of a 4-wheel (or N-wheel) raw tuple against the same param definition. */
export function decodeTuple<T extends readonly number[]>(rawTuple: T, param: ParamDef): number[] {
  return rawTuple.map((raw) => decodeParam(raw, param));
}

export function encodeTuple<T extends readonly number[]>(displayTuple: T, param: ParamDef): number[] {
  return displayTuple.map((value) => encodeParam(value, param));
}
